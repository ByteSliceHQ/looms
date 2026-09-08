import { __toESM } from "./rolldown-runtime-DaEwE2D6.mjs";
import { AppendAck, DEFAULT_USER_AGENT, RangeNotSatisfiableError, ReadBatch, RetryAppendSession, RetryReadSession, S2Error, S2_ENCRYPTION_KEY_HEADER, bigintToSafeNumber, convertProtoRecord, encodeProtoAppendInput, err, errClose, makeAppendPreconditionError, makeServerError, ok, okClose, require_src, s2Error, value } from "./ssr.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/s2s-DjCcBHec.js
var import_src = /* @__PURE__ */ __toESM(require_src(), 1);
/**
* S2S Protocol Message Framing
*
* Message format:
* - 3 bytes: Length prefix (total message length including flag byte, big-endian)
* - 1 byte: Flag byte [T][CC][RRRRR]
*   - T (bit 7): Terminal flag (1 = stream ends after this message)
*   - CC (bits 6-5): Compression (00=none, 01=zstd, 10=gzip)
*   - RRRRR (bits 4-0): Reserved
* - Variable: Body (protobuf message or JSON error for terminal frames)
*/
/**
* Frame a message for s2s protocol
*/
function frameMessage(opts) {
	const compression = opts.compression ?? "none";
	let flag = 0;
	if (opts.terminal) flag |= 128;
	if (compression === "zstd") flag |= 32;
	else if (compression === "gzip") flag |= 64;
	let body = opts.body;
	if (opts.terminal && opts.statusCode !== void 0) {
		const statusBytes = /* @__PURE__ */ new Uint8Array(2);
		statusBytes[0] = opts.statusCode >> 8 & 255;
		statusBytes[1] = opts.statusCode & 255;
		body = new Uint8Array(statusBytes.length + opts.body.length);
		body.set(statusBytes, 0);
		body.set(opts.body, statusBytes.length);
	}
	const length = 1 + body.length;
	if (length > 16777215) throw new Error(`Message too large: ${length} bytes (max 16MB)`);
	const frame = new Uint8Array(3 + length);
	frame[0] = length >> 16 & 255;
	frame[1] = length >> 8 & 255;
	frame[2] = length & 255;
	frame[3] = flag;
	frame.set(body, 4);
	return frame;
}
/**
* Parser for reading s2s frames from a stream
*/
var S2SFrameParser = class {
	buffer = /* @__PURE__ */ new Uint8Array(0);
	/**
	* Add data to the parser buffer
	*/
	push(data) {
		const newBuffer = new Uint8Array(this.buffer.length + data.length);
		newBuffer.set(this.buffer, 0);
		newBuffer.set(data, this.buffer.length);
		this.buffer = newBuffer;
	}
	/**
	* Try to parse the next frame from the buffer
	* Returns null if not enough data available
	*/
	parseFrame() {
		if (this.buffer.length < 4) return null;
		const length = this.buffer[0] << 16 | this.buffer[1] << 8 | this.buffer[2];
		if (length < 1) throw new Error(`Invalid S2S frame: length prefix is 0, but the flag byte is mandatory (minimum length is 1)`);
		if (this.buffer.length < 3 + length) return null;
		const flag = this.buffer[3];
		const terminal = (flag & 128) !== 0;
		let compression = "none";
		if ((flag & 32) !== 0) compression = "zstd";
		else if ((flag & 64) !== 0) compression = "gzip";
		let body = this.buffer.slice(4, 4 + length - 1);
		let statusCode;
		if (terminal && body.length >= 2) {
			statusCode = body[0] << 8 | body[1];
			body = body.slice(2);
		}
		this.buffer = this.buffer.slice(3 + length);
		return {
			terminal,
			compression,
			body,
			statusCode
		};
	}
	/**
	* Check if parser has any buffered data
	*/
	hasData() {
		return this.buffer.length > 0;
	}
};
/**
* S2S HTTP/2 transport for Node.js
* Uses the s2s binary protocol over HTTP/2 for efficient streaming
*
* This file should only be imported in Node.js environments
*/
var debug = (0, import_src.default)("s2:s2s");
var http2ModulePromise;
async function loadHttp2() {
	if (!http2ModulePromise) http2ModulePromise = import(
		/* webpackIgnore: true */
		/* @vite-ignore */
		"node:http2"
);
	return http2ModulePromise;
}
var S2STransport = class {
	transportConfig;
	connection;
	connectionPromise;
	closingPromise;
	constructor(config) {
		this.transportConfig = config;
	}
	async makeAppendSession(stream, sessionOptions, requestOptions) {
		return RetryAppendSession.create((myOptions) => {
			return S2SAppendSession.create(this.transportConfig.baseUrl, this.transportConfig.accessToken, stream, () => this.getConnection(), this.transportConfig.basinName, this.transportConfig.encryptionKey, myOptions, requestOptions);
		}, sessionOptions, this.transportConfig.retry, stream);
	}
	async makeReadSession(stream, args, options) {
		return RetryReadSession.create((myArgs) => {
			return S2SReadSession.create(this.transportConfig.baseUrl, this.transportConfig.accessToken, stream, myArgs, options, () => this.getConnection(), this.transportConfig.basinName, this.transportConfig.encryptionKey);
		}, args, this.transportConfig.retry);
	}
	/**
	* Get or create HTTP/2 connection (one per transport)
	*/
	async getConnection() {
		if (this.connection && !this.connection.closed && !this.connection.destroyed) return this.connection;
		if (this.connectionPromise) return this.connectionPromise;
		this.connectionPromise = this.createConnection();
		try {
			this.connection = await this.connectionPromise;
			return this.connection;
		} finally {
			this.connectionPromise = void 0;
		}
	}
	async createConnection() {
		const http2 = await loadHttp2();
		const url = new URL(this.transportConfig.baseUrl);
		const client = http2.connect(url.origin, {
			...url.protocol === "https:" ? {} : {},
			settings: { initialWindowSize: 10485760 }
		});
		const connectPromise = new Promise((resolve, reject) => {
			client.once("connect", () => {
				if (client.destroyed) return;
				try {
					client.setLocalWindowSize(10485760);
				} catch {}
				resolve(client);
			});
			client.once("error", (err) => {
				reject(err);
			});
			client.once("close", () => {
				if (this.connection === client) this.connection = void 0;
			});
		});
		const connectionTimeout = this.transportConfig.connectionTimeoutMillis ?? 3e3;
		let timeoutId;
		const timeoutPromise = new Promise((_, reject) => {
			timeoutId = setTimeout(() => {
				if (!client.closed && !client.destroyed) client.destroy();
				reject(new S2Error({
					message: `Connection timeout after ${connectionTimeout}ms`,
					status: 408,
					code: "CONNECTION_TIMEOUT",
					origin: "sdk"
				}));
			}, connectionTimeout);
		});
		try {
			return await Promise.race([connectPromise, timeoutPromise]);
		} finally {
			if (timeoutId) clearTimeout(timeoutId);
		}
	}
	async close() {
		if (this.closingPromise) return this.closingPromise;
		this.closingPromise = (async () => {
			const connection = this.connection ?? await this.connectionPromise?.catch(() => void 0);
			if (connection && !connection.closed && !connection.destroyed) await new Promise((resolve) => {
				connection.close(() => resolve());
			});
			this.connection = void 0;
		})();
		try {
			await this.closingPromise;
		} finally {
			this.closingPromise = void 0;
		}
	}
};
var S2SReadSession = class S2SReadSession extends ReadableStream {
	streamName;
	args;
	authToken;
	url;
	options;
	getConnection;
	basinName;
	encryptionKey;
	http2Stream;
	_lastReadPosition;
	_nextReadPosition;
	_lastObservedTail;
	parser = new S2SFrameParser();
	static async create(baseUrl, bearerToken, streamName, args, options, getConnection, basinName, encryptionKey) {
		const url = new URL(baseUrl);
		return new S2SReadSession(streamName, args, bearerToken, url, options, getConnection, basinName, encryptionKey);
	}
	constructor(streamName, args, authToken, url, options, getConnection, basinName, encryptionKey) {
		const parser = new S2SFrameParser();
		const textDecoder = new TextDecoder();
		let http2Stream;
		const TAIL_TIMEOUT_MS = 2e4;
		let timeoutTimer;
		super({
			start: async (controller) => {
				let controllerClosed = false;
				let responseCode;
				let abortHandler;
				let goawayHandler;
				let sessionConnection;
				const cleanupListeners = () => {
					if (abortHandler && options?.signal) options.signal.removeEventListener("abort", abortHandler);
					abortHandler = void 0;
					if (goawayHandler && sessionConnection) sessionConnection.removeListener("goaway", goawayHandler);
					goawayHandler = void 0;
					sessionConnection = void 0;
				};
				const safeClose = () => {
					if (!controllerClosed) {
						controllerClosed = true;
						cleanupListeners();
						if (timeoutTimer) {
							clearTimeout(timeoutTimer);
							timeoutTimer = void 0;
						}
						try {
							controller.close();
						} catch {}
					}
				};
				const safeError = (err) => {
					if (!controllerClosed) {
						controllerClosed = true;
						cleanupListeners();
						if (timeoutTimer) {
							clearTimeout(timeoutTimer);
							timeoutTimer = void 0;
						}
						controller.enqueue({
							ok: false,
							error: s2Error(err)
						});
						controller.close();
					}
				};
				const resetTimeoutTimer = () => {
					if (timeoutTimer) clearTimeout(timeoutTimer);
					timeoutTimer = setTimeout(() => {
						const timeoutError = new S2Error({
							message: `No tail received for ${TAIL_TIMEOUT_MS / 1e3}s`,
							status: 408,
							code: "TIMEOUT"
						});
						debug("tail timeout detected");
						safeError(timeoutError);
					}, TAIL_TIMEOUT_MS);
				};
				try {
					resetTimeoutTimer();
					const connection = await getConnection();
					const queryParams = new URLSearchParams();
					const { as, ...readParams } = args ?? {};
					if (readParams.seq_num !== void 0) queryParams.set("seq_num", readParams.seq_num.toString());
					if (readParams.timestamp !== void 0) queryParams.set("timestamp", readParams.timestamp.toString());
					if (readParams.tail_offset !== void 0) queryParams.set("tail_offset", readParams.tail_offset.toString());
					if (readParams.count !== void 0) queryParams.set("count", readParams.count.toString());
					if (readParams.bytes !== void 0) queryParams.set("bytes", readParams.bytes.toString());
					if (readParams.wait !== void 0) queryParams.set("wait", readParams.wait.toString());
					if (typeof readParams.until === "number") queryParams.set("until", readParams.until.toString());
					const queryString = queryParams.toString();
					const path = `${url.pathname}/streams/${encodeURIComponent(streamName)}/records${queryString ? `?${queryString}` : ""}`;
					const stream = connection.request({
						":method": "GET",
						":path": path,
						":scheme": url.protocol.slice(0, -1),
						":authority": url.host,
						"user-agent": DEFAULT_USER_AGENT,
						authorization: `Bearer ${value(authToken)}`,
						accept: "application/protobuf",
						"content-type": "s2s/proto",
						...basinName ? { "s2-basin": basinName } : {},
						...encryptionKey ? { [S2_ENCRYPTION_KEY_HEADER]: value(encryptionKey) } : {}
					});
					http2Stream = stream;
					abortHandler = () => {
						if (!stream.closed) stream.close();
					};
					options?.signal?.addEventListener("abort", abortHandler);
					stream.on("response", (headers) => {
						responseCode = headers[":status"] ?? 500;
					});
					sessionConnection = connection;
					goawayHandler = (errorCode, lastStreamID, opaqueData) => {
						debug("received GOAWAY from server");
					};
					connection.on("goaway", goawayHandler);
					stream.on("error", (err) => {
						safeError(err);
					});
					stream.on("data", (chunk) => {
						try {
							const status = responseCode ?? 500;
							if (status >= 400) {
								const errorText = textDecoder.decode(chunk);
								debug("error response: status=%d body=%s", status, errorText);
								if (status === 416) {
									try {
										const errorJson = JSON.parse(errorText);
										safeError(new RangeNotSatisfiableError({
											status,
											code: errorJson.code,
											tail: errorJson.tail
										}));
									} catch {
										safeError(new RangeNotSatisfiableError({ status }));
									}
									return;
								}
								try {
									const errorJson = JSON.parse(errorText);
									safeError(new S2Error({
										message: errorJson.message ?? "Unknown error",
										code: errorJson.code,
										status,
										origin: "server"
									}));
								} catch {
									safeError(new S2Error({
										message: errorText || "Unknown error",
										status,
										origin: "server"
									}));
								}
								return;
							}
							parser.push(chunk);
							let frame = parser.parseFrame();
							while (frame) {
								if (frame.terminal) {
									if (frame.statusCode && frame.statusCode >= 400) {
										const errorText = textDecoder.decode(frame.body);
										try {
											const errorJson = JSON.parse(errorText);
											const status = frame.statusCode ?? 500;
											if (status === 416) safeError(new RangeNotSatisfiableError({
												status,
												code: errorJson.code,
												tail: errorJson.tail
											}));
											else safeError(makeServerError({
												status,
												statusText: void 0
											}, errorJson));
										} catch {
											safeError(makeServerError({
												status: frame.statusCode ?? 500,
												statusText: void 0
											}, errorText));
										}
									} else safeClose();
									stream.close();
								} else try {
									const protoBatch = ReadBatch.fromBinary(frame.body);
									resetTimeoutTimer();
									if (protoBatch.tail) {
										const tail = convertStreamPosition(protoBatch.tail);
										this._lastReadPosition = tail;
										this._lastObservedTail = tail;
										debug("received tail");
									}
									for (const record of protoBatch.records) {
										const converted = this.convertRecord(record, as ?? "string", textDecoder);
										controller.enqueue({
											ok: true,
											value: converted
										});
										if (record.seqNum !== void 0) this._nextReadPosition = {
											seq_num: bigintToSafeNumber(record.seqNum, "SequencedRecord.seqNum") + 1,
											timestamp: bigintToSafeNumber(record.timestamp ?? 0n, "SequencedRecord.timestamp")
										};
									}
								} catch (err) {
									safeError(new S2Error({
										message: `Failed to parse ReadBatch: ${err}`,
										status: 500,
										origin: "sdk"
									}));
								}
								frame = parser.parseFrame();
							}
						} catch (error) {
							safeError(error instanceof S2Error ? error : new S2Error({
								message: `Failed to process read data: ${error}`,
								status: 500,
								origin: "sdk"
							}));
						}
					});
					stream.on("end", () => {
						if (stream.rstCode != 0) {
							debug("stream reset code=%d", stream.rstCode);
							safeError(new S2Error({
								message: `Stream ended with error: ${stream.rstCode}`,
								status: 500,
								code: "stream reset",
								origin: "sdk"
							}));
						}
					});
					stream.on("close", () => {
						if (parser.hasData()) safeError(new S2Error({
							message: "Stream closed with unparsed data remaining",
							status: 500,
							code: "STREAM_CLOSED_PREMATURELY",
							origin: "sdk"
						}));
						else safeClose();
					});
				} catch (err) {
					safeError(err);
				}
			},
			cancel: async () => {
				if (http2Stream && !http2Stream.closed) http2Stream.close();
			}
		});
		this.streamName = streamName;
		this.args = args;
		this.authToken = authToken;
		this.url = url;
		this.options = options;
		this.getConnection = getConnection;
		this.basinName = basinName;
		this.encryptionKey = encryptionKey;
		this.parser = parser;
		this.http2Stream = http2Stream;
	}
	/**
	* Convert a protobuf SequencedRecord to the requested format
	*/
	convertRecord(record, format, textDecoder) {
		return convertProtoRecord(record, format, textDecoder);
	}
	async [Symbol.asyncDispose]() {
		await this.cancel("disposed");
	}
	[Symbol.asyncIterator]() {
		const fn = ReadableStream.prototype[Symbol.asyncIterator];
		if (typeof fn === "function") try {
			return fn.call(this);
		} catch {}
		const reader = this.getReader();
		return {
			next: async () => {
				const r = await reader.read();
				if (r.done) {
					reader.releaseLock();
					return {
						done: true,
						value: void 0
					};
				}
				return {
					done: false,
					value: r.value
				};
			},
			throw: async (e) => {
				try {
					await reader.cancel(e);
				} catch (err) {
					if (err?.code !== "ERR_INVALID_STATE") throw err;
				}
				reader.releaseLock();
				return {
					done: true,
					value: void 0
				};
			},
			return: async () => {
				try {
					await reader.cancel("done");
				} catch (err) {
					if (err?.code !== "ERR_INVALID_STATE") throw err;
				}
				reader.releaseLock();
				return {
					done: true,
					value: void 0
				};
			},
			[Symbol.asyncIterator]() {
				return this;
			}
		};
	}
	nextReadPosition() {
		return this._nextReadPosition;
	}
	lastObservedTail() {
		return this._lastObservedTail;
	}
};
/**
* AcksStream for S2S append session
*/
/**
* S2S-based transport session for appending records via HTTP/2.
* Pipelined: multiple requests can be in-flight simultaneously.
* No backpressure, no retry logic, no streams - just submit/close with value-encoded errors.
*/
var S2SAppendSession = class S2SAppendSession {
	baseUrl;
	authToken;
	streamName;
	getConnection;
	basinName;
	encryptionKey;
	options;
	http2Stream;
	parser = new S2SFrameParser();
	closed = false;
	pendingAcks = [];
	initPromise;
	_effectSignalled = false;
	static async create(baseUrl, bearerToken, streamName, getConnection, basinName, encryptionKey, sessionOptions, requestOptions) {
		return new S2SAppendSession(baseUrl, bearerToken, streamName, getConnection, basinName, encryptionKey, sessionOptions, requestOptions);
	}
	constructor(baseUrl, authToken, streamName, getConnection, basinName, encryptionKey, sessionOptions, options) {
		this.baseUrl = baseUrl;
		this.authToken = authToken;
		this.streamName = streamName;
		this.getConnection = getConnection;
		this.basinName = basinName;
		this.encryptionKey = encryptionKey;
		this.options = options;
	}
	async initializeStream() {
		const url = new URL(this.baseUrl);
		const connection = await this.getConnection();
		const path = `${url.pathname}/streams/${encodeURIComponent(this.streamName)}/records`;
		const stream = connection.request({
			":method": "POST",
			":path": path,
			":scheme": url.protocol.slice(0, -1),
			":authority": url.host,
			"user-agent": DEFAULT_USER_AGENT,
			authorization: `Bearer ${value(this.authToken)}`,
			"content-type": "s2s/proto",
			accept: "application/protobuf",
			...this.basinName ? { "s2-basin": this.basinName } : {},
			...this.encryptionKey ? { [S2_ENCRYPTION_KEY_HEADER]: value(this.encryptionKey) } : {}
		});
		this.http2Stream = stream;
		this.options?.signal?.addEventListener("abort", () => {
			if (!stream.closed) stream.close();
		});
		const textDecoder = new TextDecoder();
		let responseCode;
		const safeError = (error) => {
			for (const pending of this.pendingAcks) pending.resolve(err(s2Error(error)));
			this.pendingAcks = [];
		};
		stream.on("response", (headers) => {
			responseCode = headers[":status"] ?? 500;
		});
		stream.on("data", (chunk) => {
			try {
				if ((responseCode ?? 200) >= 400) {
					const errorText = textDecoder.decode(chunk);
					try {
						const errorJson = JSON.parse(errorText);
						safeError(new S2Error({
							message: errorJson.message ?? "Unknown error",
							code: errorJson.code,
							status: responseCode,
							origin: "server"
						}));
					} catch {
						safeError(new S2Error({
							message: errorText || "Unknown error",
							status: responseCode,
							origin: "server"
						}));
					}
					return;
				}
				this.parser.push(chunk);
				let frame = this.parser.parseFrame();
				while (frame) {
					if (frame.terminal) {
						if (frame.statusCode && frame.statusCode >= 400) {
							const errorText = textDecoder.decode(frame.body);
							const status = frame.statusCode ?? 500;
							try {
								const errorJson = JSON.parse(errorText);
								const err = status === 412 ? makeAppendPreconditionError(status, errorJson) : makeServerError({
									status,
									statusText: void 0
								}, errorJson);
								queueMicrotask(() => safeError(err));
							} catch {
								const err = makeServerError({
									status,
									statusText: void 0
								}, errorText);
								queueMicrotask(() => safeError(err));
							}
						}
						stream.close();
					} else try {
						const ack = convertAppendAck(AppendAck.fromBinary(frame.body));
						const pending = this.pendingAcks.shift();
						if (pending) pending.resolve(ok(ack));
						if (this.pendingAcks.length === 0) this._effectSignalled = false;
					} catch (parseErr) {
						queueMicrotask(() => safeError(new S2Error({
							message: `Failed to parse AppendAck: ${parseErr}`,
							status: 500
						})));
					}
					frame = this.parser.parseFrame();
				}
			} catch (error) {
				queueMicrotask(() => safeError(error));
			}
		});
		stream.on("error", (streamErr) => {
			queueMicrotask(() => safeError(streamErr));
		});
		stream.on("close", () => {
			if (this.pendingAcks.length > 0) queueMicrotask(() => safeError(new S2Error({
				message: "Stream closed with pending acks",
				status: 502,
				code: "BAD_GATEWAY"
			})));
		});
	}
	/**
	* Send a batch and wait for ack. Returns AppendResult (never throws).
	* Pipelined: multiple sends can be in-flight; acks resolve FIFO.
	*/
	sendBatch(input) {
		if (!this.http2Stream || this.http2Stream.closed) return Promise.resolve(err(new S2Error({
			message: "HTTP/2 stream is not open",
			status: 502
		})));
		const frame = frameMessage({
			terminal: false,
			body: encodeProtoAppendInput(input)
		});
		return new Promise((resolve) => {
			this.pendingAcks.push({
				resolve,
				batchSize: input.meteredBytes
			});
			this._effectSignalled = true;
			this.http2Stream.write(frame, (writeErr) => {
				if (writeErr) {
					const idx = this.pendingAcks.findIndex((p) => p.resolve === resolve);
					if (idx !== -1) this.pendingAcks.splice(idx, 1);
					resolve(err(s2Error(writeErr)));
				}
			});
		});
	}
	/**
	* Returns true if data may have been written to the HTTP/2 stream
	* since the last time pendingAcks was empty (dormant).
	*/
	effectSignalled() {
		return this._effectSignalled;
	}
	/**
	* Close the append session.
	* Waits for all pending appends to complete before resolving.
	* Never throws - returns CloseResult.
	*/
	async close() {
		try {
			this.closed = true;
			while (this.pendingAcks.length > 0) await new Promise((resolve) => setTimeout(resolve, 10));
			if (this.http2Stream && !this.http2Stream.closed) this.http2Stream.end();
			return okClose();
		} catch (error) {
			return errClose(s2Error(error));
		}
	}
	/**
	* Submit an append request to the session.
	* Returns AppendResult (never throws).
	* Pipelined: multiple submits can be in-flight; acks resolve FIFO.
	*/
	async submit(input) {
		if (this.closed) return err(new S2Error({
			message: "AppendSession is closed",
			status: 400
		}));
		if (!this.initPromise) this.initPromise = this.initializeStream();
		try {
			await this.initPromise;
		} catch (initErr) {
			return err(s2Error(initErr));
		}
		const recordsArray = Array.from(input.records);
		if (recordsArray.length > 1e3) return err(new S2Error({
			message: `Batch of ${recordsArray.length} exceeds maximum batch size of 1000 records`,
			status: 400,
			code: "INVALID_ARGUMENT"
		}));
		if (input.meteredBytes > 1048576) return err(new S2Error({
			message: `Batch size ${input.meteredBytes} bytes exceeds maximum of 1 MiB (1048576 bytes)`,
			status: 400,
			code: "INVALID_ARGUMENT"
		}));
		return this.sendBatch(input);
	}
};
/**
* Convert protobuf StreamPosition to API StreamPosition (internal use)
*/
function convertStreamPosition(proto) {
	return {
		seq_num: bigintToSafeNumber(proto.seqNum, "StreamPosition.seqNum"),
		timestamp: bigintToSafeNumber(proto.timestamp, "StreamPosition.timestamp")
	};
}
/**
* Convert API StreamPosition to SDK StreamPosition (public interface)
*/
function toSDKStreamPosition(pos) {
	return {
		seqNum: pos.seq_num,
		timestamp: new Date(pos.timestamp)
	};
}
function convertAppendAck(proto) {
	if (!proto.start || !proto.end || !proto.tail) throw new Error("Invariant violation: AppendAck is missing required fields");
	return {
		start: toSDKStreamPosition(convertStreamPosition(proto.start)),
		end: toSDKStreamPosition(convertStreamPosition(proto.end)),
		tail: toSDKStreamPosition(convertStreamPosition(proto.tail))
	};
}
//#endregion
export { S2STransport };
