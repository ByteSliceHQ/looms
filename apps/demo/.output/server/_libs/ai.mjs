import { AISDKError, APICallError, DEFAULT_MAX_DOWNLOAD_SIZE, DelayedPromise, DownloadError, GatewayAuthenticationError, GatewayError, InvalidPromptError, TypeValidationError, UnsupportedFunctionalityError, _enum, _instanceof, _null, array, asArray, asSchema, boolean, cancelResponseBody, convertBase64ToUint8Array, convertUint8ArrayToBase64, createIdGenerator, custom, detectMediaType, discriminatedUnion, executeTool, fetchWithValidatedRedirects, filterNullable, gateway, getErrorMessage, getRuntimeEnvironmentUserAgent, getToolCaller, isAbortError, isBuffer, isExecutableTool, isFullMediaType, isProviderReference, isProviderStreamError, isUrlSupported, lazy, lazySchema, literal, looseObject, never, number, object, readResponseWithSizeLimit, record, resolve, retryWithExponentialBackoff, safeParseJSON, safeValidateTypes, string, union, unknown, validateTypes, withUserAgentSuffix, zodSchema } from "./@ai-sdk/gateway+[...].mjs";
//#region ../../node_modules/.bun/ai@7.0.93+ab3ed8e9421bfd7b/node_modules/ai/dist/index.js
var __defProp = Object.defineProperty;
var __export = (target, all) => {
	for (var name25 in all) __defProp(target, name25, {
		get: all[name25],
		enumerable: true
	});
};
var name = "AI_InvalidArgumentError";
var marker = `vercel.ai.error.${name}`;
var symbol = Symbol.for(marker);
var _a;
var _b;
var InvalidArgumentError = class extends (_b = AISDKError, _a = symbol, _b) {
	constructor({ parameter, value, message }) {
		super({
			name,
			message: `Invalid argument for parameter ${parameter}: ${message}`
		});
		this[_a] = true;
		this.parameter = parameter;
		this.value = value;
	}
	static isInstance(error) {
		return AISDKError.hasMarker(error, marker);
	}
};
var name3 = "AI_InvalidToolApprovalError";
var marker3 = `vercel.ai.error.${name3}`;
var symbol3 = Symbol.for(marker3);
var _a3;
var _b3;
var InvalidToolApprovalError = class extends (_b3 = AISDKError, _a3 = symbol3, _b3) {
	constructor({ approvalId }) {
		super({
			name: name3,
			message: `Tool approval response references unknown approvalId: "${approvalId}". No matching tool-approval-request found in message history.`
		});
		this[_a3] = true;
		this.approvalId = approvalId;
	}
	static isInstance(error) {
		return AISDKError.hasMarker(error, marker3);
	}
};
var name4 = "AI_InvalidToolApprovalSignatureError";
var marker4 = `vercel.ai.error.${name4}`;
var symbol4 = Symbol.for(marker4);
var _a4;
var _b4;
var InvalidToolApprovalSignatureError = class extends (_b4 = AISDKError, _a4 = symbol4, _b4) {
	constructor({ approvalId, toolCallId, reason }) {
		super({
			name: name4,
			message: `Tool approval signature verification failed for approval "${approvalId}" (tool call "${toolCallId}"): ${reason}`
		});
		this[_a4] = true;
		this.approvalId = approvalId;
		this.toolCallId = toolCallId;
	}
	static isInstance(error) {
		return AISDKError.hasMarker(error, marker4);
	}
};
var name5 = "AI_InvalidToolInputError";
var marker5 = `vercel.ai.error.${name5}`;
var symbol5 = Symbol.for(marker5);
var _a5;
var _b5;
var InvalidToolInputError = class extends (_b5 = AISDKError, _a5 = symbol5, _b5) {
	constructor({ toolInput, toolName, cause, message = `Invalid input for tool ${toolName}: ${getErrorMessage(cause)}` }) {
		super({
			name: name5,
			message,
			cause
		});
		this[_a5] = true;
		this.toolInput = toolInput;
		this.toolName = toolName;
	}
	static isInstance(error) {
		return AISDKError.hasMarker(error, marker5);
	}
};
var name6 = "AI_ToolCallNotFoundForApprovalError";
var marker6 = `vercel.ai.error.${name6}`;
var symbol6 = Symbol.for(marker6);
var _a6;
var _b6;
var ToolCallNotFoundForApprovalError = class extends (_b6 = AISDKError, _a6 = symbol6, _b6) {
	constructor({ toolCallId, approvalId }) {
		super({
			name: name6,
			message: `Tool call "${toolCallId}" not found for approval request "${approvalId}".`
		});
		this[_a6] = true;
		this.toolCallId = toolCallId;
		this.approvalId = approvalId;
	}
	static isInstance(error) {
		return AISDKError.hasMarker(error, marker6);
	}
};
var name7 = "AI_MissingToolResultsError";
var marker7 = `vercel.ai.error.${name7}`;
var symbol7 = Symbol.for(marker7);
var _a7;
var _b7;
var MissingToolResultsError = class extends (_b7 = AISDKError, _a7 = symbol7, _b7) {
	constructor({ toolCallIds }) {
		super({
			name: name7,
			message: `Tool result${toolCallIds.length > 1 ? "s are" : " is"} missing for tool call${toolCallIds.length > 1 ? "s" : ""} ${toolCallIds.join(", ")}.`
		});
		this[_a7] = true;
		this.toolCallIds = toolCallIds;
	}
	static isInstance(error) {
		return AISDKError.hasMarker(error, marker7);
	}
};
var name9 = "AI_NoObjectGeneratedError";
var marker9 = `vercel.ai.error.${name9}`;
var symbol9 = Symbol.for(marker9);
var _a9;
var _b9;
var NoObjectGeneratedError = class extends (_b9 = AISDKError, _a9 = symbol9, _b9) {
	constructor({ message = "No object generated.", cause, text: text2, response, usage, finishReason }) {
		super({
			name: name9,
			message,
			cause
		});
		this[_a9] = true;
		this.text = text2;
		this.response = response;
		this.usage = usage;
		this.finishReason = finishReason;
	}
	static isInstance(error) {
		return AISDKError.hasMarker(error, marker9);
	}
};
var name10 = "AI_NoOutputGeneratedError";
var marker10 = `vercel.ai.error.${name10}`;
var symbol10 = Symbol.for(marker10);
var _a10;
var _b10;
var NoOutputGeneratedError = class extends (_b10 = AISDKError, _a10 = symbol10, _b10) {
	constructor({ message = "No output generated.", cause } = {}) {
		super({
			name: name10,
			message,
			cause
		});
		this[_a10] = true;
	}
	static isInstance(error) {
		return AISDKError.hasMarker(error, marker10);
	}
};
var name15 = "AI_NoSuchToolError";
var marker15 = `vercel.ai.error.${name15}`;
var symbol15 = Symbol.for(marker15);
var _a15;
var _b15;
var NoSuchToolError = class extends (_b15 = AISDKError, _a15 = symbol15, _b15) {
	constructor({ toolName, availableTools = void 0, message = `Model tried to call unavailable tool '${toolName}'. ${availableTools === void 0 ? "No tools are available." : `Available tools: ${availableTools.join(", ")}.`}` }) {
		super({
			name: name15,
			message
		});
		this[_a15] = true;
		this.toolName = toolName;
		this.availableTools = availableTools;
	}
	static isInstance(error) {
		return AISDKError.hasMarker(error, marker15);
	}
};
var name16 = "AI_StreamProviderError";
var marker16 = `vercel.ai.error.${name16}`;
var symbol16 = Symbol.for(marker16);
var _a16;
var _b16;
var StreamProviderError = class extends (_b16 = AISDKError, _a16 = symbol16, _b16) {
	constructor({ message, type, code, statusCode, isRetryable = isRetryableStatusCode(statusCode), data, cause }) {
		super({
			name: name16,
			message,
			cause
		});
		this[_a16] = true;
		this.type = type;
		this.code = code;
		this.statusCode = statusCode;
		this.isRetryable = isRetryable;
		this.data = data;
	}
	static isInstance(error) {
		return AISDKError.hasMarker(error, marker16);
	}
};
function isRetryableStatusCode(statusCode) {
	return statusCode != null && (statusCode === 408 || statusCode === 409 || statusCode === 429 || statusCode >= 500);
}
var name17 = "AI_ToolCallRepairError";
var marker17 = `vercel.ai.error.${name17}`;
var symbol17 = Symbol.for(marker17);
var _a17;
var _b17;
var ToolCallRepairError = class extends (_b17 = AISDKError, _a17 = symbol17, _b17) {
	constructor({ cause, originalError, message = `Error repairing tool call: ${getErrorMessage(cause)}` }) {
		super({
			name: name17,
			message,
			cause
		});
		this[_a17] = true;
		this.originalError = originalError;
	}
	static isInstance(error) {
		return AISDKError.hasMarker(error, marker17);
	}
};
var name18 = "AI_ToolChoiceViolationError";
var marker18 = `vercel.ai.error.${name18}`;
var symbol18 = Symbol.for(marker18);
var _a18;
var _b18;
var ToolChoiceViolationError = class extends (_b18 = AISDKError, _a18 = symbol18, _b18) {
	constructor({ toolChoice, finishReason, provider, modelId, content, message = toolChoice.type === "required" ? "Model response did not contain a tool call even though tool choice was required." : `Model response did not contain a call to the required tool '${toolChoice.toolName}'.` }) {
		super({
			name: name18,
			message
		});
		this[_a18] = true;
		this.toolChoice = toolChoice;
		this.finishReason = finishReason;
		this.provider = provider;
		this.modelId = modelId;
		this.content = content;
	}
	static isInstance(error) {
		return AISDKError.hasMarker(error, marker18);
	}
};
var UnsupportedModelVersionError = class extends AISDKError {
	constructor(options) {
		super({
			name: "AI_UnsupportedModelVersionError",
			message: `Unsupported model version ${options.version} for provider "${options.provider}" and model "${options.modelId}". AI SDK 5 only supports models that implement specification version "v2".`
		});
		this.version = options.version;
		this.provider = options.provider;
		this.modelId = options.modelId;
	}
};
var name19 = "AI_UIMessageStreamError";
var marker19 = `vercel.ai.error.${name19}`;
var symbol19 = Symbol.for(marker19);
var _a19;
var _b19;
var UIMessageStreamError = class extends (_b19 = AISDKError, _a19 = symbol19, _b19) {
	constructor({ chunkType, chunkId, message }) {
		super({
			name: name19,
			message
		});
		this[_a19] = true;
		this.chunkType = chunkType;
		this.chunkId = chunkId;
	}
	static isInstance(error) {
		return AISDKError.hasMarker(error, marker19);
	}
};
var name20 = "AI_InvalidDataContentError";
var marker20 = `vercel.ai.error.${name20}`;
var symbol20 = Symbol.for(marker20);
var _a20;
var _b20;
var InvalidDataContentError = class extends (_b20 = AISDKError, _a20 = symbol20, _b20) {
	constructor({ content, cause, message = `Invalid data content. Expected a base64 string, Uint8Array, ArrayBuffer, or Buffer, but got ${typeof content}.` }) {
		super({
			name: name20,
			message,
			cause
		});
		this[_a20] = true;
		this.content = content;
	}
	static isInstance(error) {
		return AISDKError.hasMarker(error, marker20);
	}
};
var name21 = "AI_InvalidMessageRoleError";
var marker21 = `vercel.ai.error.${name21}`;
var symbol21 = Symbol.for(marker21);
var _a21;
var _b21;
var InvalidMessageRoleError = class extends (_b21 = AISDKError, _a21 = symbol21, _b21) {
	constructor({ role, message = `Invalid message role: '${role}'. Must be one of: "system", "user", "assistant", "tool".` }) {
		super({
			name: name21,
			message
		});
		this[_a21] = true;
		this.role = role;
	}
	static isInstance(error) {
		return AISDKError.hasMarker(error, marker21);
	}
};
var name23 = "AI_RetryError";
var marker23 = `vercel.ai.error.${name23}`;
var symbol23 = Symbol.for(marker23);
var _a23;
var _b23;
var RetryError = class extends (_b23 = AISDKError, _a23 = symbol23, _b23) {
	constructor({ message, reason, errors }) {
		super({
			name: name23,
			message
		});
		this[_a23] = true;
		this.reason = reason;
		this.errors = errors;
		this.lastError = errors[errors.length - 1];
	}
	static isInstance(error) {
		return AISDKError.hasMarker(error, marker23);
	}
};
function formatWarning({ warning, provider, model }) {
	const prefix = `AI SDK Warning${provider != null && model != null ? ` (${provider} / ${model})` : ""}:`;
	switch (warning.type) {
		case "unsupported": {
			let message = `${prefix} The feature "${warning.feature}" is not supported.`;
			if (warning.details) message += ` ${warning.details}`;
			return message;
		}
		case "compatibility": {
			let message = `${prefix} The feature "${warning.feature}" is used in a compatibility mode.`;
			if (warning.details) message += ` ${warning.details}`;
			return message;
		}
		case "deprecated": return `${prefix} Deprecated: "${warning.setting}". ${warning.message}`;
		case "other": return `${prefix} ${warning.message}`;
		default: return `${prefix} ${JSON.stringify(warning, null, 2)}`;
	}
}
var FIRST_WARNING_INFO_MESSAGE = "AI SDK Warning System: To turn off warning logging, set the AI_SDK_LOG_WARNINGS global to false.";
var hasLoggedBefore = false;
function emitWarning({ message, type }) {
	if (typeof process !== "undefined" && typeof process.emitWarning === "function") process.emitWarning(message, { type });
	else console.warn(message);
}
var logWarnings = (options) => {
	if (options.warnings.length === 0) return;
	const logger = globalThis.AI_SDK_LOG_WARNINGS;
	if (logger === false) return;
	if (typeof logger === "function") {
		logger(options);
		return;
	}
	if (!hasLoggedBefore) {
		hasLoggedBefore = true;
		emitWarning({
			message: FIRST_WARNING_INFO_MESSAGE,
			type: "Warning"
		});
	}
	for (const warning of options.warnings) emitWarning({
		message: formatWarning({
			warning,
			provider: options.provider,
			model: options.model
		}),
		type: warning.type === "deprecated" ? "DeprecationWarning" : "Warning"
	});
};
function logV2CompatibilityWarning({ provider, modelId }) {
	logWarnings({
		warnings: [{
			type: "compatibility",
			feature: "specificationVersion",
			details: `Using v2 specification compatibility mode. Some features may not be available.`
		}],
		provider,
		model: modelId
	});
}
function asEmbeddingModelV3(model) {
	if (model.specificationVersion === "v3") return model;
	logV2CompatibilityWarning({
		provider: model.provider,
		modelId: model.modelId
	});
	return new Proxy(model, { get(target, prop) {
		if (prop === "specificationVersion") return "v3";
		return target[prop];
	} });
}
function asEmbeddingModelV4(model) {
	if (model.specificationVersion === "v4") return model;
	const v3Model = model.specificationVersion === "v2" ? asEmbeddingModelV3(model) : model;
	return new Proxy(v3Model, { get(target, prop) {
		if (prop === "specificationVersion") return "v4";
		return target[prop];
	} });
}
function asImageModelV3(model) {
	if (model.specificationVersion === "v3") return model;
	logV2CompatibilityWarning({
		provider: model.provider,
		modelId: model.modelId
	});
	return new Proxy(model, { get(target, prop) {
		if (prop === "specificationVersion") return "v3";
		return target[prop];
	} });
}
function asImageModelV4(model) {
	if (model.specificationVersion === "v4") return model;
	const v3Model = model.specificationVersion === "v2" ? asImageModelV3(model) : model;
	return new Proxy(v3Model, { get(target, prop) {
		if (prop === "specificationVersion") return "v4";
		return target[prop];
	} });
}
function asLanguageModelV3(model) {
	if (model.specificationVersion === "v3") return model;
	logV2CompatibilityWarning({
		provider: model.provider,
		modelId: model.modelId
	});
	return new Proxy(model, { get(target, prop) {
		switch (prop) {
			case "specificationVersion": return "v3";
			case "doGenerate": return async (...args) => {
				const result = await target.doGenerate(...args);
				return {
					...result,
					finishReason: convertV2FinishReasonToV3(result.finishReason),
					usage: convertV2UsageToV3(result.usage)
				};
			};
			case "doStream": return async (...args) => {
				const result = await target.doStream(...args);
				return {
					...result,
					stream: convertV2StreamToV3(result.stream)
				};
			};
			default: return target[prop];
		}
	} });
}
function convertV2StreamToV3(stream) {
	return stream.pipeThrough(new TransformStream({ transform(chunk, controller) {
		switch (chunk.type) {
			case "finish":
				controller.enqueue({
					...chunk,
					finishReason: convertV2FinishReasonToV3(chunk.finishReason),
					usage: convertV2UsageToV3(chunk.usage)
				});
				break;
			default: controller.enqueue(chunk);
		}
	} }));
}
function convertV2FinishReasonToV3(finishReason) {
	return {
		unified: finishReason === "unknown" ? "other" : finishReason,
		raw: void 0
	};
}
function convertV2UsageToV3(usage) {
	return {
		inputTokens: {
			total: usage.inputTokens,
			noCache: void 0,
			cacheRead: usage.cachedInputTokens,
			cacheWrite: void 0
		},
		outputTokens: {
			total: usage.outputTokens,
			text: void 0,
			reasoning: usage.reasoningTokens
		}
	};
}
function asLanguageModelV4(model) {
	if (model.specificationVersion === "v4") return model;
	const v3Model = model.specificationVersion === "v2" ? asLanguageModelV3(model) : model;
	return new Proxy(v3Model, { get(target, prop) {
		if (prop === "specificationVersion") return "v4";
		return target[prop];
	} });
}
function asRerankingModelV4(model) {
	if (model.specificationVersion === "v4") return model;
	return new Proxy(model, { get(target, prop) {
		if (prop === "specificationVersion") return "v4";
		return target[prop];
	} });
}
function asSpeechModelV3(model) {
	if (model.specificationVersion === "v3") return model;
	logV2CompatibilityWarning({
		provider: model.provider,
		modelId: model.modelId
	});
	return new Proxy(model, { get(target, prop) {
		if (prop === "specificationVersion") return "v3";
		return target[prop];
	} });
}
function asSpeechModelV4(model) {
	if (model.specificationVersion === "v4") return model;
	const v3Model = model.specificationVersion === "v2" ? asSpeechModelV3(model) : model;
	return new Proxy(v3Model, { get(target, prop) {
		if (prop === "specificationVersion") return "v4";
		return target[prop];
	} });
}
function asTranscriptionModelV3(model) {
	if (model.specificationVersion === "v3") return model;
	logV2CompatibilityWarning({
		provider: model.provider,
		modelId: model.modelId
	});
	return new Proxy(model, { get(target, prop) {
		if (prop === "specificationVersion") return "v3";
		return target[prop];
	} });
}
function asTranscriptionModelV4(model) {
	if (model.specificationVersion === "v4") return model;
	const v3Model = model.specificationVersion === "v2" ? asTranscriptionModelV3(model) : model;
	return new Proxy(v3Model, { get(target, prop) {
		if (prop === "specificationVersion") return "v4";
		return target[prop];
	} });
}
function asProviderV3(provider) {
	if ("specificationVersion" in provider && provider.specificationVersion === "v3") return provider;
	const v2Provider = provider;
	return {
		specificationVersion: "v3",
		languageModel: (modelId) => asLanguageModelV3(v2Provider.languageModel(modelId)),
		embeddingModel: (modelId) => asEmbeddingModelV3(v2Provider.textEmbeddingModel(modelId)),
		imageModel: (modelId) => asImageModelV3(v2Provider.imageModel(modelId)),
		transcriptionModel: v2Provider.transcriptionModel ? (modelId) => asTranscriptionModelV3(v2Provider.transcriptionModel(modelId)) : void 0,
		speechModel: v2Provider.speechModel ? (modelId) => asSpeechModelV3(v2Provider.speechModel(modelId)) : void 0,
		rerankingModel: void 0
	};
}
function asProviderV4(provider) {
	if ("specificationVersion" in provider && provider.specificationVersion === "v4") return provider;
	const v3Provider = !("specificationVersion" in provider) || provider.specificationVersion !== "v3" ? asProviderV3(provider) : provider;
	return {
		specificationVersion: "v4",
		languageModel: (modelId) => asLanguageModelV4(v3Provider.languageModel(modelId)),
		embeddingModel: (modelId) => asEmbeddingModelV4(v3Provider.embeddingModel(modelId)),
		imageModel: (modelId) => asImageModelV4(v3Provider.imageModel(modelId)),
		transcriptionModel: v3Provider.transcriptionModel ? (modelId) => asTranscriptionModelV4(v3Provider.transcriptionModel(modelId)) : void 0,
		speechModel: v3Provider.speechModel ? (modelId) => asSpeechModelV4(v3Provider.speechModel(modelId)) : void 0,
		rerankingModel: v3Provider.rerankingModel ? (modelId) => asRerankingModelV4(v3Provider.rerankingModel(modelId)) : void 0
	};
}
function resolveLanguageModel(model) {
	if (typeof model === "string") return getGlobalProvider().languageModel(model);
	if (![
		"v4",
		"v3",
		"v2"
	].includes(model.specificationVersion)) {
		const unsupportedModel = model;
		throw new UnsupportedModelVersionError({
			version: unsupportedModel.specificationVersion,
			provider: unsupportedModel.provider,
			modelId: unsupportedModel.modelId
		});
	}
	return asLanguageModelV4(model);
}
function getGlobalProvider() {
	var _a25;
	return asProviderV4((_a25 = globalThis.AI_SDK_DEFAULT_PROVIDER) != null ? _a25 : gateway);
}
function cloneModelMessages(messages) {
	return messages.map((message) => cloneValue(message));
}
function cloneValue(value) {
	if (value instanceof URL) return new URL(value.href);
	if (Array.isArray(value)) return value.map((item) => cloneValue(item));
	if (value instanceof Uint8Array) return new Uint8Array(value);
	if (value instanceof ArrayBuffer) return value.slice(0);
	if (value instanceof Date) return new Date(value);
	if (value != null && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, value2]) => [key, cloneValue(value2)]));
	return value;
}
var VERSION = "7.0.93";
var download = async ({ url, maxBytes, abortSignal }) => {
	var _a25;
	const urlText = url.toString();
	try {
		const headers = withUserAgentSuffix({}, `ai-sdk/${VERSION}`, getRuntimeEnvironmentUserAgent());
		const response = await fetchWithValidatedRedirects({
			url: urlText,
			headers,
			abortSignal
		});
		if (!response.ok) {
			await cancelResponseBody(response);
			throw new DownloadError({
				url: urlText,
				statusCode: response.status,
				statusText: response.statusText
			});
		}
		return {
			data: await readResponseWithSizeLimit({
				response,
				url: urlText,
				maxBytes: maxBytes != null ? maxBytes : DEFAULT_MAX_DOWNLOAD_SIZE
			}),
			mediaType: (_a25 = response.headers.get("content-type")) != null ? _a25 : void 0
		};
	} catch (error) {
		if (DownloadError.isInstance(error)) throw error;
		throw new DownloadError({
			url: urlText,
			cause: error
		});
	}
};
var createDefaultDownloadFunction = (download2 = download) => (requestedDownloads) => Promise.all(requestedDownloads.map(async (requestedDownload) => requestedDownload.isUrlSupportedByModel ? null : await download2(requestedDownload)));
function mergeObjects(base, overrides) {
	if (base === void 0 && overrides === void 0) return;
	if (base === void 0) return overrides;
	if (overrides === void 0) return base;
	const result = { ...base };
	for (const key in overrides) {
		if (key === "__proto__" || key === "constructor" || key === "prototype") continue;
		if (Object.prototype.hasOwnProperty.call(overrides, key)) {
			const overridesValue = overrides[key];
			if (overridesValue === void 0) continue;
			const baseValue = key in base ? base[key] : void 0;
			const isSourceObject = overridesValue !== null && typeof overridesValue === "object" && !Array.isArray(overridesValue) && !(overridesValue instanceof Date) && !(overridesValue instanceof RegExp);
			const isTargetObject = baseValue !== null && baseValue !== void 0 && typeof baseValue === "object" && !Array.isArray(baseValue) && !(baseValue instanceof Date) && !(baseValue instanceof RegExp);
			if (isSourceObject && isTargetObject) result[key] = mergeObjects(baseValue, overridesValue);
			else result[key] = overridesValue;
		}
	}
	return result;
}
function splitDataUrl(dataUrl) {
	try {
		const [header, base64Content] = dataUrl.split(",");
		return {
			mediaType: header.split(";")[0].split(":")[1],
			base64Content
		};
	} catch (e) {
		return {
			mediaType: void 0,
			base64Content: void 0
		};
	}
}
function isTaggedFileData(value) {
	if (typeof value !== "object" || value === null) return false;
	const type = value.type;
	return type === "data" || type === "url" || type === "reference" || type === "text";
}
function convertUrlToFilePartData(url) {
	if (url.protocol === "data:") {
		const { mediaType, base64Content } = splitDataUrl(url.toString());
		if (mediaType == null || base64Content == null) throw new InvalidDataContentError({
			content: url,
			message: `Invalid data URL format in content ${url.toString()}`
		});
		return {
			data: {
				type: "data",
				data: base64Content
			},
			mediaType
		};
	}
	return {
		data: {
			type: "url",
			url
		},
		mediaType: void 0
	};
}
function convertInlineDataToFilePartData(content) {
	if (content instanceof Uint8Array) return {
		data: {
			type: "data",
			data: content
		},
		mediaType: void 0
	};
	if (content instanceof ArrayBuffer) return {
		data: {
			type: "data",
			data: new Uint8Array(content)
		},
		mediaType: void 0
	};
	if (isBuffer(content)) return {
		data: {
			type: "data",
			data: new Uint8Array(content)
		},
		mediaType: void 0
	};
	return {
		data: {
			type: "data",
			data: content
		},
		mediaType: void 0
	};
}
function convertToLanguageModelV4FilePart(content) {
	if (isTaggedFileData(content)) switch (content.type) {
		case "data":
			if (typeof content.data === "string" && content.data.startsWith("data:")) throw new InvalidDataContentError({
				content: content.data,
				message: "Data URLs are not valid inline data. Pass them as { type: \"url\", url } instead."
			});
			return convertInlineDataToFilePartData(content.data);
		case "url": return convertUrlToFilePartData(content.url);
		case "reference": return {
			data: {
				type: "reference",
				reference: content.reference
			},
			mediaType: void 0
		};
		case "text": return {
			data: {
				type: "text",
				text: content.text
			},
			mediaType: void 0
		};
	}
	if (content instanceof URL) return convertUrlToFilePartData(content);
	if (typeof content === "string") try {
		return convertUrlToFilePartData(new URL(content));
	} catch (e) {
		return convertInlineDataToFilePartData(content);
	}
	if (isProviderReference(content)) return {
		data: {
			type: "reference",
			reference: content
		},
		mediaType: void 0
	};
	return convertInlineDataToFilePartData(content);
}
async function convertToLanguageModelPrompt({ prompt, supportedUrls, download: download2 = createDefaultDownloadFunction(), provider }) {
	const downloadedAssets = await downloadAssets(prompt.messages, download2, supportedUrls);
	const approvalIdToToolCallId = /* @__PURE__ */ new Map();
	for (const message of prompt.messages) if (message.role === "assistant" && Array.isArray(message.content)) {
		for (const part of message.content) if (part.type === "tool-approval-request" && "approvalId" in part && "toolCallId" in part) approvalIdToToolCallId.set(part.approvalId, part.toolCallId);
	}
	const approvedToolCallIds = /* @__PURE__ */ new Set();
	for (const message of prompt.messages) if (message.role === "tool") {
		for (const part of message.content) if (part.type === "tool-approval-response") {
			const toolCallId = approvalIdToToolCallId.get(part.approvalId);
			if (toolCallId) approvedToolCallIds.add(toolCallId);
		}
	}
	const messages = [...prompt.instructions != null ? typeof prompt.instructions === "string" ? [{
		role: "system",
		content: prompt.instructions
	}] : asArray(prompt.instructions).map((message) => ({
		role: "system",
		content: message.content,
		providerOptions: message.providerOptions
	})) : [], ...prompt.messages.map((message) => convertToLanguageModelMessage({
		message,
		downloadedAssets,
		provider
	}))];
	const combinedMessages = [];
	for (const message of messages) {
		if (message.role !== "tool") {
			combinedMessages.push(message);
			continue;
		}
		const lastCombinedMessage = combinedMessages.at(-1);
		if ((lastCombinedMessage == null ? void 0 : lastCombinedMessage.role) === "tool") {
			const lastContentPart = lastCombinedMessage.content.at(-1);
			if (lastContentPart != null && lastCombinedMessage.providerOptions != null) lastContentPart.providerOptions = mergeObjects(lastCombinedMessage.providerOptions, lastContentPart.providerOptions);
			lastCombinedMessage.content.push(...message.content);
			lastCombinedMessage.providerOptions = message.providerOptions;
		} else combinedMessages.push(message);
	}
	const toolCallIds = /* @__PURE__ */ new Set();
	for (const message of combinedMessages) switch (message.role) {
		case "assistant":
			for (const content of message.content) if (content.type === "tool-call" && !content.providerExecuted) toolCallIds.add(content.toolCallId);
			break;
		case "tool":
			for (const content of message.content) if (content.type === "tool-result") toolCallIds.delete(content.toolCallId);
			break;
		case "user":
		case "system":
			for (const id of approvedToolCallIds) toolCallIds.delete(id);
			if (toolCallIds.size > 0) throw new MissingToolResultsError({ toolCallIds: Array.from(toolCallIds) });
	}
	for (const id of approvedToolCallIds) toolCallIds.delete(id);
	if (toolCallIds.size > 0) throw new MissingToolResultsError({ toolCallIds: Array.from(toolCallIds) });
	return combinedMessages.filter((message) => message.role !== "tool" || message.content.length > 0);
}
function convertToLanguageModelMessage({ message, downloadedAssets, provider }) {
	const warnings = [];
	const role = message.role;
	switch (role) {
		case "system": return {
			role: "system",
			content: message.content,
			providerOptions: message.providerOptions
		};
		case "user": {
			if (typeof message.content === "string") return {
				role: "user",
				content: [{
					type: "text",
					text: message.content
				}],
				providerOptions: message.providerOptions
			};
			const converted = {
				role: "user",
				content: message.content.map((part) => {
					if (part.type === "image") warnings.push({
						type: "deprecated",
						setting: "\"image\" content part",
						message: `The "image" content part type is deprecated. Use a "file" part with mediaType: 'image' (or a more specific image/* subtype) instead.`
					});
					return convertImagePartToFilePart(part);
				}).map((part) => convertPartToLanguageModelPart(part, downloadedAssets)).filter((part) => part.type !== "text" || part.text !== ""),
				providerOptions: message.providerOptions
			};
			if (warnings.length > 0) logWarnings({ warnings });
			return converted;
		}
		case "assistant": {
			if (typeof message.content === "string") return {
				role: "assistant",
				content: [{
					type: "text",
					text: message.content
				}],
				providerOptions: message.providerOptions
			};
			const converted = {
				role: "assistant",
				content: message.content.filter((part) => part.type !== "text" || part.text !== "" || part.providerOptions != null).filter((part) => part.type !== "tool-approval-request").map((part) => {
					const providerOptions = part.providerOptions;
					switch (part.type) {
						case "custom": return {
							type: "custom",
							kind: part.kind,
							providerOptions
						};
						case "file": {
							const { data, mediaType } = convertToLanguageModelV4FilePart(part.data);
							return {
								type: "file",
								data,
								filename: part.filename,
								mediaType: mediaType != null ? mediaType : part.mediaType,
								providerOptions
							};
						}
						case "reasoning": return {
							type: "reasoning",
							text: part.text,
							providerOptions
						};
						case "reasoning-file": {
							const { data, mediaType } = convertToLanguageModelV4FilePart(part.data);
							if (data.type !== "data" && data.type !== "url") throw new Error(`Unsupported reasoning-file data type: ${data.type}`);
							return {
								type: "reasoning-file",
								data,
								mediaType: mediaType != null ? mediaType : part.mediaType,
								providerOptions
							};
						}
						case "text": return {
							type: "text",
							text: part.text,
							providerOptions
						};
						case "tool-call": return {
							type: "tool-call",
							toolCallId: part.toolCallId,
							toolName: part.toolName,
							input: part.input,
							providerExecuted: part.providerExecuted,
							providerOptions
						};
						case "tool-result": return {
							type: "tool-result",
							toolCallId: part.toolCallId,
							toolName: part.toolName,
							output: mapToolResultOutput({
								output: part.output,
								provider,
								warnings,
								downloadedAssets
							}),
							providerOptions
						};
					}
				}),
				providerOptions: message.providerOptions
			};
			if (warnings.length > 0) logWarnings({ warnings });
			return converted;
		}
		case "tool": {
			const converted = {
				role: "tool",
				content: message.content.filter((part) => part.type !== "tool-approval-response" || part.providerExecuted).map((part) => {
					switch (part.type) {
						case "tool-result": return {
							type: "tool-result",
							toolCallId: part.toolCallId,
							toolName: part.toolName,
							output: mapToolResultOutput({
								output: part.output,
								provider,
								warnings,
								downloadedAssets
							}),
							providerOptions: part.providerOptions
						};
						case "tool-approval-response": return {
							type: "tool-approval-response",
							approvalId: part.approvalId,
							approved: part.approved,
							reason: part.reason
						};
					}
				}),
				providerOptions: message.providerOptions
			};
			if (warnings.length > 0) logWarnings({ warnings });
			return converted;
		}
		default: throw new InvalidMessageRoleError({ role });
	}
}
function convertImagePartToFilePart(part) {
	var _a25;
	if (part.type !== "image") return part;
	return {
		type: "file",
		data: part.image,
		mediaType: (_a25 = part.mediaType) != null ? _a25 : "image",
		providerOptions: part.providerOptions
	};
}
async function downloadAssets(messages, download2, supportedUrls) {
	const downloadableFiles = [];
	for (const message of messages) {
		if (message.role === "user" && Array.isArray(message.content)) for (const part of message.content) {
			const filePart = convertImagePartToFilePart(part);
			if (filePart.type === "file") downloadableFiles.push(filePart);
		}
		if (message.role === "tool") for (const part of message.content) {
			if (part.type !== "tool-result") continue;
			if (part.output.type !== "content") continue;
			for (const contentPart of part.output.value) if (contentPart.type === "file") downloadableFiles.push(contentPart);
		}
		if (message.role === "assistant" && Array.isArray(message.content)) for (const part of message.content) {
			if (part.type !== "tool-result") continue;
			if (part.output.type !== "content") continue;
			for (const contentPart of part.output.value) if (contentPart.type === "file") downloadableFiles.push(contentPart);
		}
	}
	const plannedDownloads = downloadableFiles.map((part) => {
		const mediaType = part.mediaType;
		const { data } = convertToLanguageModelV4FilePart(part.data);
		return {
			mediaType,
			data
		};
	}).filter((part) => part.data.type === "url").map((part) => ({
		url: part.data.url,
		isUrlSupportedByModel: part.mediaType != null && isUrlSupported({
			url: part.data.url.toString(),
			mediaType: part.mediaType,
			supportedUrls
		})
	}));
	const downloadedFiles = await download2(plannedDownloads);
	return Object.fromEntries(downloadedFiles.map((file, index) => file == null ? null : [plannedDownloads[index].url.toString(), {
		data: file.data,
		mediaType: file.mediaType
	}]).filter((file) => file != null));
}
function convertPartToLanguageModelPart(part, downloadedAssets) {
	if (part.type === "text") return {
		type: "text",
		text: part.text,
		providerOptions: part.providerOptions
	};
	const { data: normalizedData, mediaType: dataUrlMediaType } = convertToLanguageModelV4FilePart(part.data);
	let mediaType = dataUrlMediaType != null ? dataUrlMediaType : part.mediaType;
	let data = normalizedData;
	if (data.type === "url") {
		const downloadedFile = downloadedAssets[data.url.toString()];
		if (downloadedFile) {
			data = {
				type: "data",
				data: downloadedFile.data
			};
			if (downloadedFile.mediaType != null && (mediaType == null || !isFullMediaType(mediaType))) mediaType = downloadedFile.mediaType;
		}
	}
	if (data.type === "data" && (data.data instanceof Uint8Array || typeof data.data === "string")) {
		const imageMediaType = detectMediaType({
			data: data.data,
			topLevelType: "image"
		});
		if (imageMediaType != null) mediaType = imageMediaType;
	}
	if (mediaType == null) throw new Error(`Media type is missing for file part`);
	return {
		type: "file",
		mediaType,
		filename: part.filename,
		data,
		providerOptions: part.providerOptions
	};
}
function mapToolResultOutput({ output, provider, warnings = [], downloadedAssets }) {
	if (output.type !== "content") return output;
	return {
		type: "content",
		value: output.value.map((item) => {
			var _a25;
			switch (item.type) {
				case "file": {
					const convertedPart = convertPartToLanguageModelPart(item, downloadedAssets);
					if (convertedPart.type !== "file") throw new Error("Expected tool result file content to convert to file.");
					return convertedPart;
				}
				case "file-data":
					warnings.push({
						type: "deprecated",
						setting: "\"tool-result\" content of type \"file-data\"",
						message: `The "file-data" type for tool result content is deprecated. Use the "file" type with mediaType and { type: 'data', data } instead.`
					});
					return {
						type: "file",
						data: {
							type: "data",
							data: item.data
						},
						filename: item.filename,
						mediaType: item.mediaType,
						providerOptions: item.providerOptions
					};
				case "file-url": {
					const mediaType = (_a25 = item.mediaType) != null ? _a25 : getMediaTypeFromUrl(item.url);
					let message = `The "file-url" type for tool result content is deprecated. Use the "file" type with mediaType and { type: 'url', url } instead.`;
					if (!item.mediaType) {
						const inferenceSuffix = mediaType === "application/octet-stream" ? `Unable to infer media type from URL. Defaulting to 'application/octet-stream'.` : `Inferred media type '${mediaType}' from URL.`;
						message = `The "file-url" tool result content part with URL "${item.url}" is missing a "mediaType". ${inferenceSuffix} ${message}`;
					}
					warnings.push({
						type: "deprecated",
						setting: "\"tool-result\" content of type \"file-url\"",
						message
					});
					return {
						type: "file",
						data: {
							type: "url",
							url: new URL(item.url)
						},
						mediaType,
						providerOptions: item.providerOptions
					};
				}
				case "file-id":
					warnings.push({
						type: "deprecated",
						setting: "\"tool-result\" content of type \"file-id\"",
						message: `The "file-id" type for tool result content is deprecated. Use the "file" type with mediaType and { type: 'reference', reference } instead.`
					});
					return {
						type: "file",
						data: {
							type: "reference",
							reference: convertFileIdToProviderReference({
								fileId: item.fileId,
								provider
							})
						},
						mediaType: "application",
						providerOptions: item.providerOptions
					};
				case "file-reference":
					warnings.push({
						type: "deprecated",
						setting: "\"tool-result\" content of type \"file-reference\"",
						message: `The "file-reference" type for tool result content is deprecated. Use the "file" type with mediaType and { type: 'reference', reference } instead.`
					});
					return {
						type: "file",
						data: {
							type: "reference",
							reference: item.providerReference
						},
						mediaType: "application",
						providerOptions: item.providerOptions
					};
				case "image-data":
					warnings.push({
						type: "deprecated",
						setting: "\"tool-result\" content of type \"image-data\"",
						message: `The "image-data" type for tool result content is deprecated. Use the "file" type with mediaType and { type: 'data', data } instead.`
					});
					return {
						type: "file",
						data: {
							type: "data",
							data: item.data
						},
						mediaType: item.mediaType,
						providerOptions: item.providerOptions
					};
				case "image-url":
					warnings.push({
						type: "deprecated",
						setting: "\"tool-result\" content of type \"image-url\"",
						message: `The "image-url" type for tool result content is deprecated. Use the "file" type with mediaType 'image' (or a specific image/* subtype) and { type: 'url', url } instead.`
					});
					return {
						type: "file",
						data: {
							type: "url",
							url: new URL(item.url)
						},
						mediaType: "image",
						providerOptions: item.providerOptions
					};
				case "image-file-id":
					warnings.push({
						type: "deprecated",
						setting: "\"tool-result\" content of type \"image-file-id\"",
						message: `The "image-file-id" type for tool result content is deprecated. Use the "file" type with mediaType and { type: 'reference', reference } instead.`
					});
					return {
						type: "file",
						data: {
							type: "reference",
							reference: convertFileIdToProviderReference({
								fileId: item.fileId,
								provider
							})
						},
						mediaType: "image",
						providerOptions: item.providerOptions
					};
				case "image-file-reference":
					warnings.push({
						type: "deprecated",
						setting: "\"tool-result\" content of type \"image-file-reference\"",
						message: `The "image-file-reference" type for tool result content is deprecated. Use the "file" type with mediaType and { type: 'reference', reference } instead.`
					});
					return {
						type: "file",
						data: {
							type: "reference",
							reference: item.providerReference
						},
						mediaType: "image",
						providerOptions: item.providerOptions
					};
				default: return item;
			}
		})
	};
}
function convertFileIdToProviderReference({ fileId, provider }) {
	if (typeof fileId === "object") return fileId;
	if (provider == null) throw new Error("Cannot convert string fileId to provider reference without a provider ID. Use a Record<string, string> fileId or switch to the file-reference type.");
	return { [provider]: fileId };
}
var URL_EXTENSION_TO_MEDIA_TYPE = {
	jpg: "image/jpeg",
	jpeg: "image/jpeg",
	png: "image/png",
	gif: "image/gif",
	webp: "image/webp",
	svg: "image/svg+xml",
	avif: "image/avif",
	heic: "image/heic",
	bmp: "image/bmp",
	tiff: "image/tiff",
	tif: "image/tiff",
	pdf: "application/pdf",
	mp4: "video/mp4",
	webm: "video/webm",
	mp3: "audio/mpeg",
	wav: "audio/wav",
	ogg: "audio/ogg"
};
function getMediaTypeFromUrl(url, fallbackMediaType = "application/octet-stream") {
	var _a25;
	try {
		const fileExtension = (_a25 = new URL(url).pathname.split(".").pop()) == null ? void 0 : _a25.toLowerCase();
		if (fileExtension && Object.hasOwn(URL_EXTENSION_TO_MEDIA_TYPE, fileExtension)) return URL_EXTENSION_TO_MEDIA_TYPE[fileExtension];
	} catch (e) {}
	return fallbackMediaType;
}
async function createToolModelOutput({ toolCallId, input, output, tool: tool2, errorMode }) {
	if (errorMode === "text") return {
		type: "error-text",
		value: getErrorMessage(output)
	};
	else if (errorMode === "json") return {
		type: "error-json",
		value: toJSONValue(output)
	};
	if (tool2 == null ? void 0 : tool2.toModelOutput) return await tool2.toModelOutput({
		toolCallId,
		input,
		output
	});
	return typeof output === "string" ? {
		type: "text",
		value: output
	} : {
		type: "json",
		value: toJSONValue(output)
	};
}
function toJSONValue(value) {
	return value === void 0 ? null : value;
}
function prepareLanguageModelCallOptions({ maxOutputTokens, temperature, topP, topK, presencePenalty, frequencyPenalty, seed, stopSequences, reasoning }) {
	if (maxOutputTokens != null) {
		if (!Number.isInteger(maxOutputTokens)) throw new InvalidArgumentError({
			parameter: "maxOutputTokens",
			value: maxOutputTokens,
			message: "maxOutputTokens must be an integer"
		});
		if (maxOutputTokens < 1) throw new InvalidArgumentError({
			parameter: "maxOutputTokens",
			value: maxOutputTokens,
			message: "maxOutputTokens must be >= 1"
		});
	}
	if (temperature != null) {
		if (typeof temperature !== "number") throw new InvalidArgumentError({
			parameter: "temperature",
			value: temperature,
			message: "temperature must be a number"
		});
	}
	if (topP != null) {
		if (typeof topP !== "number") throw new InvalidArgumentError({
			parameter: "topP",
			value: topP,
			message: "topP must be a number"
		});
	}
	if (topK != null) {
		if (typeof topK !== "number") throw new InvalidArgumentError({
			parameter: "topK",
			value: topK,
			message: "topK must be a number"
		});
	}
	if (presencePenalty != null) {
		if (typeof presencePenalty !== "number") throw new InvalidArgumentError({
			parameter: "presencePenalty",
			value: presencePenalty,
			message: "presencePenalty must be a number"
		});
	}
	if (frequencyPenalty != null) {
		if (typeof frequencyPenalty !== "number") throw new InvalidArgumentError({
			parameter: "frequencyPenalty",
			value: frequencyPenalty,
			message: "frequencyPenalty must be a number"
		});
	}
	if (seed != null) {
		if (!Number.isInteger(seed)) throw new InvalidArgumentError({
			parameter: "seed",
			value: seed,
			message: "seed must be an integer"
		});
	}
	return {
		maxOutputTokens,
		temperature,
		topP,
		topK,
		presencePenalty,
		frequencyPenalty,
		stopSequences,
		seed,
		reasoning
	};
}
function prepareToolChoice({ toolChoice }) {
	return toolChoice == null ? { type: "auto" } : typeof toolChoice === "string" ? { type: toolChoice } : {
		type: "tool",
		toolName: toolChoice.toolName
	};
}
function isNonEmptyObject(object3) {
	return object3 != null && Object.keys(object3).length > 0;
}
async function prepareTools({ tools, toolOrder, toolsContext = {}, experimental_sandbox: sandbox }) {
	if (!isNonEmptyObject(tools)) return;
	const languageModelTools = [];
	for (const [name25, tool2] of orderToolEntries({
		tools,
		toolOrder
	})) {
		const toolType = tool2.type;
		switch (toolType) {
			case void 0:
			case "dynamic":
			case "function": {
				const description = resolveToolDescription({
					tool: tool2,
					toolName: name25,
					toolsContext,
					experimental_sandbox: sandbox
				});
				const providerOptions = tool2.providerOptions;
				const inputExamples = tool2.inputExamples;
				const strict = tool2.strict;
				languageModelTools.push({
					type: "function",
					name: name25,
					inputSchema: await asSchema(tool2.inputSchema).jsonSchema,
					...description != null ? { description } : {},
					...inputExamples != null ? { inputExamples } : {},
					...providerOptions != null ? { providerOptions } : {},
					...strict != null ? { strict } : {}
				});
				break;
			}
			case "provider":
				languageModelTools.push({
					type: "provider",
					name: name25,
					id: tool2.id,
					args: tool2.args
				});
				break;
			default: throw new Error(`Unsupported tool type: ${toolType}`);
		}
	}
	return languageModelTools;
}
function orderToolEntries({ tools, toolOrder }) {
	if (toolOrder == null) return Object.entries(tools);
	const toolEntries = Object.entries(tools);
	const orderedTools = toolEntries.filter(([name25]) => toolOrder.includes(name25)).sort(([nameA], [nameB]) => toolOrder.indexOf(nameA) - toolOrder.indexOf(nameB));
	const unorderedTools = toolEntries.filter(([name25]) => !toolOrder.includes(name25)).sort(([nameA], [nameB]) => nameA < nameB ? -1 : nameA > nameB ? 1 : 0);
	return [...orderedTools, ...unorderedTools];
}
function resolveToolDescription({ tool: tool2, toolName, toolsContext, experimental_sandbox: sandbox }) {
	return tool2.description === void 0 ? void 0 : typeof tool2.description === "string" ? tool2.description : tool2.description({
		context: toolsContext[toolName],
		experimental_sandbox: sandbox
	});
}
function getTotalTimeoutMs(timeout) {
	if (timeout == null) return;
	if (typeof timeout === "number") return timeout;
	return timeout.totalMs;
}
function getStepTimeoutMs(timeout) {
	if (timeout == null || typeof timeout === "number") return;
	return timeout.stepMs;
}
function getFirstChunkTimeoutMs(timeout) {
	if (timeout == null || typeof timeout === "number") return;
	return timeout.firstChunkMs;
}
function getChunkTimeoutMs(timeout) {
	if (timeout == null || typeof timeout === "number") return;
	return timeout.chunkMs;
}
function getToolTimeoutMs(timeout, toolName) {
	var _a25, _b25;
	if (timeout == null || typeof timeout === "number") return;
	return (_b25 = (_a25 = timeout.tools) == null ? void 0 : _a25[`${toolName}Ms`]) != null ? _b25 : timeout.toolMs;
}
var z = {
	array,
	boolean,
	custom,
	discriminatedUnion,
	enum: _enum,
	instanceof: _instanceof,
	lazy,
	literal,
	looseObject,
	never,
	null: _null,
	number,
	object,
	record,
	string,
	union,
	unknown
};
var jsonValueSchema = z.lazy(() => z.union([
	z.null(),
	z.string(),
	z.number(),
	z.boolean(),
	z.record(z.string(), jsonValueSchema.optional()),
	z.array(jsonValueSchema)
]));
var providerMetadataSchema = z.record(z.string(), z.record(z.string(), jsonValueSchema.optional()));
var fileInlineDataSchema = z.union([
	z.string(),
	z.instanceof(Uint8Array),
	z.instanceof(ArrayBuffer),
	z.custom(isBuffer, { message: "Must be a Buffer" })
]);
var providerReferenceSchema = z.record(z.string(), z.string());
var textPartSchema = z.object({
	type: z.literal("text"),
	text: z.string(),
	providerOptions: providerMetadataSchema.optional()
});
var imagePartSchema = z.object({
	type: z.literal("image"),
	image: z.union([
		fileInlineDataSchema,
		z.instanceof(URL),
		providerReferenceSchema
	]),
	mediaType: z.string().optional(),
	providerOptions: providerMetadataSchema.optional()
});
var taggedFileDataSchema = z.discriminatedUnion("type", [
	z.object({
		type: z.literal("data"),
		data: fileInlineDataSchema
	}),
	z.object({
		type: z.literal("url"),
		url: z.instanceof(URL)
	}),
	z.object({
		type: z.literal("reference"),
		reference: providerReferenceSchema
	}),
	z.object({
		type: z.literal("text"),
		text: z.string()
	})
]);
var taggedReasoningFileDataSchema = z.discriminatedUnion("type", [z.object({
	type: z.literal("data"),
	data: fileInlineDataSchema
}), z.object({
	type: z.literal("url"),
	url: z.instanceof(URL)
})]);
var filePartSchema = z.object({
	type: z.literal("file"),
	data: z.union([
		taggedFileDataSchema,
		fileInlineDataSchema,
		z.instanceof(URL),
		providerReferenceSchema
	]),
	filename: z.string().optional(),
	mediaType: z.string(),
	providerOptions: providerMetadataSchema.optional()
});
var reasoningPartSchema = z.object({
	type: z.literal("reasoning"),
	text: z.string(),
	providerOptions: providerMetadataSchema.optional()
});
var customPartSchema = z.object({
	type: z.literal("custom"),
	kind: z.string().transform((value) => value),
	providerOptions: providerMetadataSchema.optional()
});
var reasoningFilePartSchema = z.object({
	type: z.literal("reasoning-file"),
	data: z.union([
		taggedReasoningFileDataSchema,
		fileInlineDataSchema,
		z.instanceof(URL)
	]),
	mediaType: z.string(),
	providerOptions: providerMetadataSchema.optional()
});
var toolCallPartSchema = z.object({
	type: z.literal("tool-call"),
	toolCallId: z.string(),
	toolName: z.string(),
	input: z.unknown(),
	providerOptions: providerMetadataSchema.optional(),
	providerExecuted: z.boolean().optional()
});
var outputSchema = z.discriminatedUnion("type", [
	z.object({
		type: z.literal("text"),
		value: z.string(),
		providerOptions: providerMetadataSchema.optional()
	}),
	z.object({
		type: z.literal("json"),
		value: jsonValueSchema,
		providerOptions: providerMetadataSchema.optional()
	}),
	z.object({
		type: z.literal("execution-denied"),
		reason: z.string().optional(),
		providerOptions: providerMetadataSchema.optional()
	}),
	z.object({
		type: z.literal("error-text"),
		value: z.string(),
		providerOptions: providerMetadataSchema.optional()
	}),
	z.object({
		type: z.literal("error-json"),
		value: jsonValueSchema,
		providerOptions: providerMetadataSchema.optional()
	}),
	z.object({
		type: z.literal("content"),
		value: z.array(z.union([
			z.object({
				type: z.literal("text"),
				text: z.string(),
				providerOptions: providerMetadataSchema.optional()
			}),
			z.object({
				type: z.literal("file"),
				data: taggedFileDataSchema,
				mediaType: z.string(),
				filename: z.string().optional(),
				providerOptions: providerMetadataSchema.optional()
			}),
			z.object({
				type: z.literal("file-data"),
				data: z.string(),
				mediaType: z.string(),
				filename: z.string().optional(),
				providerOptions: providerMetadataSchema.optional()
			}),
			z.object({
				type: z.literal("file-url"),
				url: z.string(),
				mediaType: z.string().optional(),
				providerOptions: providerMetadataSchema.optional()
			}),
			z.object({
				type: z.literal("file-id"),
				fileId: z.union([z.string(), z.record(z.string(), z.string())]),
				providerOptions: providerMetadataSchema.optional()
			}),
			z.object({
				type: z.literal("file-reference"),
				providerReference: z.record(z.string(), z.string()),
				providerOptions: providerMetadataSchema.optional()
			}),
			z.object({
				type: z.literal("image-data"),
				data: z.string(),
				mediaType: z.string(),
				providerOptions: providerMetadataSchema.optional()
			}),
			z.object({
				type: z.literal("image-url"),
				url: z.string(),
				providerOptions: providerMetadataSchema.optional()
			}),
			z.object({
				type: z.literal("image-file-id"),
				fileId: z.union([z.string(), z.record(z.string(), z.string())]),
				providerOptions: providerMetadataSchema.optional()
			}),
			z.object({
				type: z.literal("image-file-reference"),
				providerReference: z.record(z.string(), z.string()),
				providerOptions: providerMetadataSchema.optional()
			}),
			z.object({
				type: z.literal("custom"),
				providerOptions: providerMetadataSchema.optional()
			})
		]))
	})
]);
var toolResultPartSchema = z.object({
	type: z.literal("tool-result"),
	toolCallId: z.string(),
	toolName: z.string(),
	output: outputSchema,
	providerOptions: providerMetadataSchema.optional()
});
var toolApprovalRequestSchema = z.object({
	type: z.literal("tool-approval-request"),
	approvalId: z.string(),
	toolCallId: z.string(),
	reason: z.string().optional()
});
var toolApprovalResponseSchema = z.object({
	type: z.literal("tool-approval-response"),
	approvalId: z.string(),
	approved: z.boolean(),
	reason: z.string().optional()
});
var systemModelMessageSchema = z.object({
	role: z.literal("system"),
	content: z.string(),
	providerOptions: providerMetadataSchema.optional()
});
var userModelMessageSchema = z.object({
	role: z.literal("user"),
	content: z.union([z.string(), z.array(z.union([
		textPartSchema,
		imagePartSchema,
		filePartSchema
	]))]),
	providerOptions: providerMetadataSchema.optional()
});
var assistantModelMessageSchema = z.object({
	role: z.literal("assistant"),
	content: z.union([z.string(), z.array(z.union([
		textPartSchema,
		customPartSchema,
		filePartSchema,
		reasoningPartSchema,
		reasoningFilePartSchema,
		toolCallPartSchema,
		toolResultPartSchema,
		toolApprovalRequestSchema
	]))]),
	providerOptions: providerMetadataSchema.optional()
});
var toolModelMessageSchema = z.object({
	role: z.literal("tool"),
	content: z.array(z.union([toolResultPartSchema, toolApprovalResponseSchema])),
	providerOptions: providerMetadataSchema.optional()
});
var modelMessageSchema = z.union([
	systemModelMessageSchema,
	userModelMessageSchema,
	assistantModelMessageSchema,
	toolModelMessageSchema
]);
async function standardizePrompt({ allowSystemInMessages = false, system, instructions = system, prompt, messages }) {
	if (prompt == null && messages == null) throw new InvalidPromptError({
		prompt,
		message: "prompt or messages must be defined"
	});
	if (prompt != null && messages != null) throw new InvalidPromptError({
		prompt,
		message: "prompt and messages cannot be defined at the same time"
	});
	if (typeof instructions !== "string" && !asArray(instructions).every((message) => message.role === "system")) throw new InvalidPromptError({
		prompt,
		message: "instructions must be a string, SystemModelMessage, or array of SystemModelMessage"
	});
	if (prompt != null && typeof prompt === "string") messages = [{
		role: "user",
		content: prompt
	}];
	else if (prompt != null && Array.isArray(prompt)) messages = prompt;
	else if (messages == null) throw new InvalidPromptError({
		prompt,
		message: "prompt or messages must be defined"
	});
	if (messages.length === 0) throw new InvalidPromptError({
		prompt,
		message: "messages must not be empty"
	});
	if (!allowSystemInMessages && messages.some((message) => message.role === "system")) throw new InvalidPromptError({
		prompt,
		message: "System messages are not allowed in the prompt or messages fields. Use the instructions option instead."
	});
	const validationResult = await safeValidateTypes({
		value: messages,
		schema: z.array(modelMessageSchema)
	});
	if (!validationResult.success) throw new InvalidPromptError({
		prompt,
		message: "The messages do not match the ModelMessage[] schema.",
		cause: validationResult.error
	});
	return {
		messages,
		instructions
	};
}
function wrapGatewayError(error) {
	if (!GatewayAuthenticationError.isInstance(error)) return error;
	const isProductionEnv = (process == null ? void 0 : "production") === "production";
	const moreInfoURL = "https://ai-sdk.dev/unauthenticated-ai-gateway";
	if (isProductionEnv) return new AISDKError({
		name: "GatewayError",
		message: `Unauthenticated. Configure AI_GATEWAY_API_KEY or use a provider module. Learn more: ${moreInfoURL}`
	});
	return Object.assign(/* @__PURE__ */ new Error(`\x1B[1m\x1B[31mUnauthenticated request to AI Gateway.\x1B[0m

To authenticate, set the \x1B[33mAI_GATEWAY_API_KEY\x1B[0m environment variable with your API key.

Alternatively, you can use a provider module instead of the AI Gateway.

Learn more: \x1B[34m${moreInfoURL}\x1B[0m

`), { name: "GatewayAuthenticationError" });
}
function asLanguageModelUsage(usage) {
	return {
		inputTokens: usage.inputTokens.total,
		inputTokenDetails: {
			noCacheTokens: usage.inputTokens.noCache,
			cacheReadTokens: usage.inputTokens.cacheRead,
			cacheWriteTokens: usage.inputTokens.cacheWrite
		},
		outputTokens: usage.outputTokens.total,
		outputTokenDetails: {
			textTokens: usage.outputTokens.text,
			reasoningTokens: usage.outputTokens.reasoning
		},
		totalTokens: addTokenCounts(usage.inputTokens.total, usage.outputTokens.total),
		raw: usage.raw
	};
}
function createNullLanguageModelUsage() {
	return {
		inputTokens: void 0,
		inputTokenDetails: {
			noCacheTokens: void 0,
			cacheReadTokens: void 0,
			cacheWriteTokens: void 0
		},
		outputTokens: void 0,
		outputTokenDetails: {
			textTokens: void 0,
			reasoningTokens: void 0
		},
		totalTokens: void 0,
		raw: void 0
	};
}
function addLanguageModelUsage(usage1, usage2) {
	var _a25, _b25, _c, _d, _e, _f, _g, _h, _i, _j;
	return {
		inputTokens: addTokenCounts(usage1.inputTokens, usage2.inputTokens),
		inputTokenDetails: {
			noCacheTokens: addTokenCounts((_a25 = usage1.inputTokenDetails) == null ? void 0 : _a25.noCacheTokens, (_b25 = usage2.inputTokenDetails) == null ? void 0 : _b25.noCacheTokens),
			cacheReadTokens: addTokenCounts((_c = usage1.inputTokenDetails) == null ? void 0 : _c.cacheReadTokens, (_d = usage2.inputTokenDetails) == null ? void 0 : _d.cacheReadTokens),
			cacheWriteTokens: addTokenCounts((_e = usage1.inputTokenDetails) == null ? void 0 : _e.cacheWriteTokens, (_f = usage2.inputTokenDetails) == null ? void 0 : _f.cacheWriteTokens)
		},
		outputTokens: addTokenCounts(usage1.outputTokens, usage2.outputTokens),
		outputTokenDetails: {
			textTokens: addTokenCounts((_g = usage1.outputTokenDetails) == null ? void 0 : _g.textTokens, (_h = usage2.outputTokenDetails) == null ? void 0 : _h.textTokens),
			reasoningTokens: addTokenCounts((_i = usage1.outputTokenDetails) == null ? void 0 : _i.reasoningTokens, (_j = usage2.outputTokenDetails) == null ? void 0 : _j.reasoningTokens)
		},
		totalTokens: addTokenCounts(usage1.totalTokens, usage2.totalTokens)
	};
}
function addTokenCounts(tokenCount1, tokenCount2) {
	return tokenCount1 == null && tokenCount2 == null ? void 0 : (tokenCount1 != null ? tokenCount1 : 0) + (tokenCount2 != null ? tokenCount2 : 0);
}
function getOwn(obj, key) {
	return obj != null && Object.hasOwn(obj, key) ? obj[key] : void 0;
}
function mergeAbortSignals(...signals) {
	const validSignals = filterNullable(...signals).map((signal) => typeof signal === "number" ? AbortSignal.timeout(signal) : signal);
	return validSignals.length === 0 ? void 0 : validSignals.length === 1 ? validSignals[0] : AbortSignal.any(validSignals);
}
function now() {
	var _a25, _b25;
	return (_b25 = (_a25 = globalThis == null ? void 0 : globalThis.performance) == null ? void 0 : _a25.now()) != null ? _b25 : Date.now();
}
async function notify(options) {
	await Promise.all(asArray(options.callbacks).map(async (callback) => {
		try {
			await (callback == null ? void 0 : callback(options.event));
		} catch (e) {}
	}));
}
function getRetryDelayInMs({ error, exponentialBackoffDelay }) {
	const headers = APICallError.isInstance(error) ? error.responseHeaders : APICallError.isInstance(error.cause) ? error.cause.responseHeaders : void 0;
	if (!headers) return exponentialBackoffDelay;
	let ms;
	const retryAfterMs = headers["retry-after-ms"];
	if (retryAfterMs) {
		const timeoutMs = parseFloat(retryAfterMs);
		if (!Number.isNaN(timeoutMs)) ms = timeoutMs;
	}
	const retryAfter = headers["retry-after"];
	if (retryAfter && ms === void 0) {
		const timeoutSeconds = parseFloat(retryAfter);
		if (!Number.isNaN(timeoutSeconds)) ms = timeoutSeconds * 1e3;
		else ms = Date.parse(retryAfter) - Date.now();
	}
	if (ms != null && !Number.isNaN(ms) && 0 <= ms && (ms < 6e4 || ms < exponentialBackoffDelay)) return ms;
	return exponentialBackoffDelay;
}
var retryWithExponentialBackoffRespectingRetryHeaders = ({ maxRetries = 2, initialDelayInMs = 2e3, backoffFactor = 2, abortSignal } = {}) => retryWithExponentialBackoff({
	maxRetries,
	initialDelayInMs,
	backoffFactor,
	abortSignal,
	shouldRetry: (error) => error instanceof Error && (APICallError.isInstance(error) && error.isRetryable === true || GatewayError.isInstance(error) && error.isRetryable === true),
	getDelayInMs: ({ error, exponentialBackoffDelay }) => getRetryDelayInMs({
		error,
		exponentialBackoffDelay
	}),
	createRetryError: ({ message, reason, errors }) => new RetryError({
		message,
		reason,
		errors
	})
});
function prepareRetries({ maxRetries, abortSignal, parameter = "maxRetries", defaultMaxRetries = 2 }) {
	if (maxRetries != null) {
		if (!Number.isInteger(maxRetries)) throw new InvalidArgumentError({
			parameter,
			value: maxRetries,
			message: `${parameter} must be an integer`
		});
		if (maxRetries < 0) throw new InvalidArgumentError({
			parameter,
			value: maxRetries,
			message: `${parameter} must be >= 0`
		});
	}
	const maxRetriesResult = maxRetries != null ? maxRetries : defaultMaxRetries;
	return {
		maxRetries: maxRetriesResult,
		retry: retryWithExponentialBackoffRespectingRetryHeaders({
			maxRetries: maxRetriesResult,
			abortSignal
		})
	};
}
function setAbortTimeout({ abortController, label, timeoutMs }) {
	if (abortController == null || timeoutMs == null) return;
	return setTimeout(() => abortController.abort(new DOMException(`${label} timeout of ${timeoutMs}ms exceeded`, "TimeoutError")), timeoutMs);
}
function calculateTokensPerSecond({ tokens, durationMs }) {
	const tokenRate = 1e3 * (tokens != null ? tokens : 0) / (durationMs != null ? durationMs : 0);
	return Number.isFinite(tokenRate) ? tokenRate : 0;
}
function collectToolApprovals({ messages }) {
	const lastMessage = messages.at(-1);
	if ((lastMessage == null ? void 0 : lastMessage.role) != "tool") return {
		approvedToolApprovals: [],
		deniedToolApprovals: []
	};
	const toolCallsByToolCallId = /* @__PURE__ */ Object.create(null);
	for (const message of messages) if (message.role === "assistant" && typeof message.content !== "string") {
		const content = message.content;
		for (const part of content) if (part.type === "tool-call") toolCallsByToolCallId[part.toolCallId] = part;
	}
	const toolApprovalRequestsByApprovalId = /* @__PURE__ */ Object.create(null);
	for (const message of messages) if (message.role === "assistant" && typeof message.content !== "string") {
		const content = message.content;
		for (const part of content) if (part.type === "tool-approval-request") toolApprovalRequestsByApprovalId[part.approvalId] = part;
	}
	const toolResults = /* @__PURE__ */ Object.create(null);
	for (const part of lastMessage.content) if (part.type === "tool-result") toolResults[part.toolCallId] = part;
	const approvedToolApprovals = [];
	const deniedToolApprovals = [];
	const approvalResponses = lastMessage.content.filter((part) => part.type === "tool-approval-response");
	for (const approvalResponse of approvalResponses) {
		const approvalRequest = toolApprovalRequestsByApprovalId[approvalResponse.approvalId];
		if (approvalRequest == null) throw new InvalidToolApprovalError({ approvalId: approvalResponse.approvalId });
		const existingToolResult = toolResults[approvalRequest.toolCallId];
		if (existingToolResult != null && (approvalResponse.approved || existingToolResult.output.type !== "execution-denied")) continue;
		const toolCall = toolCallsByToolCallId[approvalRequest.toolCallId];
		if (toolCall == null) throw new ToolCallNotFoundForApprovalError({
			toolCallId: approvalRequest.toolCallId,
			approvalId: approvalRequest.approvalId
		});
		const approval = {
			approvalRequest,
			approvalResponse,
			toolCall,
			...existingToolResult != null ? { existingToolResult } : {}
		};
		if (approvalResponse.approved) approvedToolApprovals.push(approval);
		else deniedToolApprovals.push(approval);
	}
	return {
		approvedToolApprovals,
		deniedToolApprovals
	};
}
var DefaultGeneratedFile = class {
	constructor({ data, mediaType, providerMetadata }) {
		const isUint8Array = data instanceof Uint8Array;
		this.base64Data = isUint8Array ? void 0 : data;
		this.uint8ArrayData = isUint8Array ? data : void 0;
		this.mediaType = mediaType;
		this.providerMetadata = providerMetadata;
	}
	get base64() {
		if (this.base64Data == null) this.base64Data = convertUint8ArrayToBase64(this.uint8ArrayData);
		return this.base64Data;
	}
	get uint8Array() {
		if (this.uint8ArrayData == null) this.uint8ArrayData = convertBase64ToUint8Array(this.base64Data);
		return this.uint8ArrayData;
	}
};
var DefaultGeneratedFileWithType = class extends DefaultGeneratedFile {
	constructor(options) {
		super(options);
		this.type = "file";
	}
};
function convertLanguageModelContent({ content, toolCalls, toolOutputs, toolApprovalRequests, toolApprovalResponses, tools }) {
	const contentParts = [];
	const toolOutputsWithApprovalResponses = [];
	const toolOutputsWithoutApprovalResponses = [];
	const toolCallIdsWithApprovalResponses = new Set(toolApprovalResponses.map((toolApprovalResponse) => toolApprovalResponse.toolCall.toolCallId));
	for (const part of content) switch (part.type) {
		case "text":
		case "reasoning":
		case "custom":
		case "source":
			contentParts.push(part);
			break;
		case "file":
		case "reasoning-file":
			contentParts.push({
				type: part.type,
				file: new DefaultGeneratedFile({
					data: part.data.type === "data" ? part.data.data : part.data.url.toString(),
					mediaType: part.mediaType
				}),
				...part.providerMetadata != null ? { providerMetadata: part.providerMetadata } : {}
			});
			break;
		case "tool-call": {
			const toolCall = toolCalls.find((toolCall2) => toolCall2.toolCallId === part.toolCallId);
			if (toolCall == null) throw new Error(`Tool call ${part.toolCallId} not found.`);
			contentParts.push(toolCall);
			break;
		}
		case "tool-result": {
			const toolCall = toolCalls.find((toolCall2) => toolCall2.toolCallId === part.toolCallId);
			if (toolCall == null) {
				const tool2 = getOwn(tools, part.toolName);
				if (!((tool2 == null ? void 0 : tool2.type) === "provider" && tool2.supportsDeferredResults)) throw new Error(`Tool call ${part.toolCallId} not found.`);
				if (part.isError) contentParts.push({
					type: "tool-error",
					toolCallId: part.toolCallId,
					toolName: part.toolName,
					input: void 0,
					error: part.result,
					providerExecuted: true,
					dynamic: part.dynamic,
					...part.providerMetadata != null ? { providerMetadata: part.providerMetadata } : {},
					...(tool2 == null ? void 0 : tool2.metadata) != null ? { toolMetadata: tool2.metadata } : {}
				});
				else contentParts.push({
					type: "tool-result",
					toolCallId: part.toolCallId,
					toolName: part.toolName,
					input: void 0,
					output: part.result,
					providerExecuted: true,
					dynamic: part.dynamic,
					...part.providerMetadata != null ? { providerMetadata: part.providerMetadata } : {},
					...(tool2 == null ? void 0 : tool2.metadata) != null ? { toolMetadata: tool2.metadata } : {}
				});
				break;
			}
			if (part.isError) contentParts.push({
				type: "tool-error",
				toolCallId: part.toolCallId,
				toolName: part.toolName,
				input: toolCall.input,
				error: part.result,
				providerExecuted: true,
				dynamic: toolCall.dynamic,
				...part.providerMetadata != null ? { providerMetadata: part.providerMetadata } : {},
				...toolCall.toolMetadata != null ? { toolMetadata: toolCall.toolMetadata } : {}
			});
			else contentParts.push({
				type: "tool-result",
				toolCallId: part.toolCallId,
				toolName: part.toolName,
				input: toolCall.input,
				output: part.result,
				providerExecuted: true,
				dynamic: toolCall.dynamic,
				...part.providerMetadata != null ? { providerMetadata: part.providerMetadata } : {},
				...toolCall.toolMetadata != null ? { toolMetadata: toolCall.toolMetadata } : {}
			});
			break;
		}
		case "tool-approval-request": {
			const toolCall = toolCalls.find((toolCall2) => toolCall2.toolCallId === part.toolCallId);
			if (toolCall == null) throw new ToolCallNotFoundForApprovalError({
				toolCallId: part.toolCallId,
				approvalId: part.approvalId
			});
			contentParts.push({
				type: "tool-approval-request",
				approvalId: part.approvalId,
				toolCall
			});
			break;
		}
	}
	for (const toolOutput of toolOutputs) if (toolCallIdsWithApprovalResponses.has(toolOutput.toolCallId)) toolOutputsWithApprovalResponses.push(toolOutput);
	else toolOutputsWithoutApprovalResponses.push(toolOutput);
	return [
		...contentParts,
		...toolOutputsWithoutApprovalResponses,
		...toolApprovalRequests,
		...toolApprovalResponses,
		...toolOutputsWithApprovalResponses
	];
}
async function validateToolContext({ toolName, context, contextSchema }) {
	if (contextSchema == null) return context;
	return await validateTypes({
		value: context,
		schema: contextSchema,
		context: {
			field: "tool context",
			entityName: toolName
		}
	});
}
async function executeToolCall({ toolCall, tools, toolsContext, callId, messages, abortSignal, timeout, experimental_sandbox: sandbox, onPreliminaryToolResult, onToolExecutionStart, onToolExecutionEnd, executeToolInTelemetryContext = async ({ execute }) => await execute(), runInTracingChannelSpan = async ({ execute }) => await execute() }) {
	const { toolName, toolCallId, input } = toolCall;
	const tool2 = getOwn(tools, toolName);
	if (!isExecutableTool(tool2)) return;
	const context = await validateToolContext({
		toolName,
		context: getOwn(toolsContext, toolName),
		contextSchema: tool2.contextSchema
	});
	const toolExecutionContext = {
		toolCall,
		messages,
		toolContext: context
	};
	const baseCallbackEvent = {
		callId,
		...toolExecutionContext
	};
	return await runInTracingChannelSpan({
		type: "executeTool",
		event: baseCallbackEvent,
		execute: async () => {
			let output;
			await notify({
				event: baseCallbackEvent,
				callbacks: onToolExecutionStart
			});
			const toolAbortSignal = mergeAbortSignals(abortSignal, getToolTimeoutMs(timeout, toolName));
			let toolExecutionMs = 0;
			try {
				await executeToolInTelemetryContext({
					callId,
					toolCallId,
					...toolExecutionContext,
					execute: async () => {
						const startTime = now();
						try {
							const stream = executeTool({
								tool: tool2,
								input,
								options: {
									toolCallId,
									messages,
									abortSignal: toolAbortSignal,
									context,
									experimental_sandbox: sandbox
								}
							});
							for await (const part of stream) if (part.type === "preliminary") onPreliminaryToolResult?.({
								...toolCall,
								type: "tool-result",
								output: part.output,
								preliminary: true
							});
							else output = part.output;
						} finally {
							toolExecutionMs = now() - startTime;
						}
					}
				});
			} catch (error) {
				const toolError = {
					type: "tool-error",
					toolCallId,
					toolName,
					input,
					error,
					dynamic: tool2.type === "dynamic",
					...toolCall.providerMetadata != null ? { providerMetadata: toolCall.providerMetadata } : {},
					...toolCall.toolMetadata != null ? { toolMetadata: toolCall.toolMetadata } : {}
				};
				await notify({
					event: {
						...baseCallbackEvent,
						toolOutput: toolError,
						toolExecutionMs
					},
					callbacks: onToolExecutionEnd
				});
				return {
					output: toolError,
					toolExecutionMs
				};
			}
			const toolResult = {
				type: "tool-result",
				toolCallId,
				toolName,
				input,
				output,
				dynamic: tool2.type === "dynamic",
				...toolCall.providerMetadata != null ? { providerMetadata: toolCall.providerMetadata } : {},
				...toolCall.toolMetadata != null ? { toolMetadata: toolCall.toolMetadata } : {}
			};
			await notify({
				event: {
					...baseCallbackEvent,
					toolOutput: toolResult,
					toolExecutionMs
				},
				callbacks: onToolExecutionEnd
			});
			return {
				output: toolResult,
				toolExecutionMs
			};
		}
	});
}
function filterActiveTools({ tools, activeTools }) {
	if (tools == null || activeTools == null) return tools;
	return Object.fromEntries(Object.entries(tools).filter(([name25]) => activeTools.includes(name25)));
}
function isToolExecutionAllowedFinishReason(finishReason) {
	return finishReason === "stop" || finishReason === "tool-calls";
}
__export({}, {
	array: () => array2,
	choice: () => choice,
	json: () => json,
	object: () => object2,
	text: () => text
});
function fixJson(input) {
	const stack = ["ROOT"];
	let lastValidIndex = -1;
	let literalStart = null;
	let unicodeEscapeDigits = 0;
	function isHexDigit(char) {
		return char >= "0" && char <= "9" || char >= "A" && char <= "F" || char >= "a" && char <= "f";
	}
	function processValueStart(char, i, swapState) {
		switch (char) {
			case "\"":
				lastValidIndex = i;
				stack.pop();
				stack.push(swapState);
				stack.push("INSIDE_STRING");
				break;
			case "f":
			case "t":
			case "n":
				lastValidIndex = i;
				literalStart = i;
				stack.pop();
				stack.push(swapState);
				stack.push("INSIDE_LITERAL");
				break;
			case "-":
				stack.pop();
				stack.push(swapState);
				stack.push("INSIDE_NUMBER");
				break;
			case "0":
			case "1":
			case "2":
			case "3":
			case "4":
			case "5":
			case "6":
			case "7":
			case "8":
			case "9":
				lastValidIndex = i;
				stack.pop();
				stack.push(swapState);
				stack.push("INSIDE_NUMBER");
				break;
			case "{":
				lastValidIndex = i;
				stack.pop();
				stack.push(swapState);
				stack.push("INSIDE_OBJECT_START");
				break;
			case "[":
				lastValidIndex = i;
				stack.pop();
				stack.push(swapState);
				stack.push("INSIDE_ARRAY_START");
		}
	}
	function processAfterObjectValue(char, i) {
		switch (char) {
			case ",":
				stack.pop();
				stack.push("INSIDE_OBJECT_AFTER_COMMA");
				break;
			case "}":
				lastValidIndex = i;
				stack.pop();
		}
	}
	function processAfterArrayValue(char, i) {
		switch (char) {
			case ",":
				stack.pop();
				stack.push("INSIDE_ARRAY_AFTER_COMMA");
				break;
			case "]":
				lastValidIndex = i;
				stack.pop();
		}
	}
	for (let i = 0; i < input.length; i++) {
		const char = input[i];
		switch (stack[stack.length - 1]) {
			case "ROOT":
				processValueStart(char, i, "FINISH");
				break;
			case "INSIDE_OBJECT_START":
				switch (char) {
					case "\"":
						stack.pop();
						stack.push("INSIDE_OBJECT_KEY");
						break;
					case "}":
						lastValidIndex = i;
						stack.pop();
				}
				break;
			case "INSIDE_OBJECT_AFTER_COMMA":
				switch (char) {
					case "\"":
						stack.pop();
						stack.push("INSIDE_OBJECT_KEY");
				}
				break;
			case "INSIDE_OBJECT_KEY":
				switch (char) {
					case "\"":
						stack.pop();
						stack.push("INSIDE_OBJECT_AFTER_KEY");
				}
				break;
			case "INSIDE_OBJECT_AFTER_KEY":
				switch (char) {
					case ":":
						stack.pop();
						stack.push("INSIDE_OBJECT_BEFORE_VALUE");
				}
				break;
			case "INSIDE_OBJECT_BEFORE_VALUE":
				processValueStart(char, i, "INSIDE_OBJECT_AFTER_VALUE");
				break;
			case "INSIDE_OBJECT_AFTER_VALUE":
				processAfterObjectValue(char, i);
				break;
			case "INSIDE_STRING":
				switch (char) {
					case "\"":
						stack.pop();
						lastValidIndex = i;
						break;
					case "\\":
						stack.push("INSIDE_STRING_ESCAPE");
						break;
					default: lastValidIndex = i;
				}
				break;
			case "INSIDE_ARRAY_START":
				switch (char) {
					case "]":
						lastValidIndex = i;
						stack.pop();
						break;
					default:
						lastValidIndex = i;
						processValueStart(char, i, "INSIDE_ARRAY_AFTER_VALUE");
				}
				break;
			case "INSIDE_ARRAY_AFTER_VALUE":
				switch (char) {
					case ",":
						stack.pop();
						stack.push("INSIDE_ARRAY_AFTER_COMMA");
						break;
					case "]":
						lastValidIndex = i;
						stack.pop();
						break;
					default: lastValidIndex = i;
				}
				break;
			case "INSIDE_ARRAY_AFTER_COMMA":
				processValueStart(char, i, "INSIDE_ARRAY_AFTER_VALUE");
				break;
			case "INSIDE_STRING_ESCAPE":
				stack.pop();
				if (char === "u") {
					unicodeEscapeDigits = 0;
					stack.push("INSIDE_STRING_UNICODE_ESCAPE");
				} else lastValidIndex = i;
				break;
			case "INSIDE_STRING_UNICODE_ESCAPE":
				if (isHexDigit(char)) {
					unicodeEscapeDigits++;
					if (unicodeEscapeDigits === 4) {
						stack.pop();
						lastValidIndex = i;
					}
				}
				break;
			case "INSIDE_NUMBER":
				switch (char) {
					case "0":
					case "1":
					case "2":
					case "3":
					case "4":
					case "5":
					case "6":
					case "7":
					case "8":
					case "9":
						lastValidIndex = i;
						break;
					case "e":
					case "E":
					case "-":
					case ".": break;
					case ",":
						stack.pop();
						if (stack[stack.length - 1] === "INSIDE_ARRAY_AFTER_VALUE") processAfterArrayValue(char, i);
						if (stack[stack.length - 1] === "INSIDE_OBJECT_AFTER_VALUE") processAfterObjectValue(char, i);
						break;
					case "}":
						stack.pop();
						if (stack[stack.length - 1] === "INSIDE_OBJECT_AFTER_VALUE") processAfterObjectValue(char, i);
						break;
					case "]":
						stack.pop();
						if (stack[stack.length - 1] === "INSIDE_ARRAY_AFTER_VALUE") processAfterArrayValue(char, i);
						break;
					default: stack.pop();
				}
				break;
			case "INSIDE_LITERAL": {
				const partialLiteral = input.substring(literalStart, i + 1);
				if (!"false".startsWith(partialLiteral) && !"true".startsWith(partialLiteral) && !"null".startsWith(partialLiteral)) {
					stack.pop();
					if (stack[stack.length - 1] === "INSIDE_OBJECT_AFTER_VALUE") processAfterObjectValue(char, i);
					else if (stack[stack.length - 1] === "INSIDE_ARRAY_AFTER_VALUE") processAfterArrayValue(char, i);
				} else lastValidIndex = i;
				break;
			}
		}
	}
	let result = input.slice(0, lastValidIndex + 1);
	for (let i = stack.length - 1; i >= 0; i--) switch (stack[i]) {
		case "INSIDE_STRING":
			result += "\"";
			break;
		case "INSIDE_OBJECT_KEY":
		case "INSIDE_OBJECT_AFTER_KEY":
		case "INSIDE_OBJECT_AFTER_COMMA":
		case "INSIDE_OBJECT_START":
		case "INSIDE_OBJECT_BEFORE_VALUE":
		case "INSIDE_OBJECT_AFTER_VALUE":
			result += "}";
			break;
		case "INSIDE_ARRAY_START":
		case "INSIDE_ARRAY_AFTER_COMMA":
		case "INSIDE_ARRAY_AFTER_VALUE":
			result += "]";
			break;
		case "INSIDE_LITERAL": {
			const partialLiteral = input.substring(literalStart, input.length);
			if ("true".startsWith(partialLiteral)) result += "true".slice(partialLiteral.length);
			else if ("false".startsWith(partialLiteral)) result += "false".slice(partialLiteral.length);
			else if ("null".startsWith(partialLiteral)) result += "null".slice(partialLiteral.length);
		}
	}
	return result;
}
async function parsePartialJson(jsonText) {
	if (jsonText === void 0) return {
		value: void 0,
		state: "undefined-input"
	};
	let result = await safeParseJSON({ text: jsonText });
	if (result.success) return {
		value: result.value,
		state: "successful-parse"
	};
	result = await safeParseJSON({ text: fixJson(jsonText) });
	if (result.success) return {
		value: result.value,
		state: "repaired-parse"
	};
	return {
		value: void 0,
		state: "failed-parse"
	};
}
var text = () => ({
	name: "text",
	responseFormat: Promise.resolve({ type: "text" }),
	async parseCompleteOutput({ text: text2 }) {
		return text2;
	},
	async parsePartialOutput({ text: text2 }) {
		return { partial: text2 };
	},
	createElementStreamTransform() {}
});
var object2 = ({ schema: inputSchema, name: name25, description }) => {
	const schema = asSchema(inputSchema);
	return {
		name: "object",
		responseFormat: resolve(schema.jsonSchema).then((jsonSchema2) => ({
			type: "json",
			schema: jsonSchema2,
			...name25 != null && { name: name25 },
			...description != null && { description }
		})),
		async parseCompleteOutput({ text: text2 }, context) {
			const parseResult = await safeParseJSON({ text: text2 });
			if (!parseResult.success) throw new NoObjectGeneratedError({
				message: "No object generated: could not parse the response.",
				cause: parseResult.error,
				text: text2,
				response: context.response,
				usage: context.usage,
				finishReason: context.finishReason
			});
			const validationResult = await safeValidateTypes({
				value: parseResult.value,
				schema
			});
			if (!validationResult.success) throw new NoObjectGeneratedError({
				message: "No object generated: response did not match schema.",
				cause: validationResult.error,
				text: text2,
				response: context.response,
				usage: context.usage,
				finishReason: context.finishReason
			});
			return validationResult.value;
		},
		async parsePartialOutput({ text: text2 }) {
			const result = await parsePartialJson(text2);
			switch (result.state) {
				case "failed-parse":
				case "undefined-input": return;
				case "repaired-parse":
				case "successful-parse": return { partial: result.value };
			}
		},
		createElementStreamTransform() {}
	};
};
var array2 = ({ element: inputElementSchema, minItems, maxItems, name: name25, description }) => {
	validateArrayBound({
		name: "minItems",
		value: minItems
	});
	validateArrayBound({
		name: "maxItems",
		value: maxItems
	});
	if (minItems != null && maxItems != null && minItems > maxItems) throw new InvalidArgumentError({
		parameter: "minItems",
		value: minItems,
		message: "minItems must be less than or equal to maxItems"
	});
	const elementSchema = asSchema(inputElementSchema);
	return {
		name: "array",
		responseFormat: resolve(elementSchema.jsonSchema).then((jsonSchema2) => {
			const { $schema: _$schema, definitions, $defs, ...itemSchema } = jsonSchema2;
			return {
				type: "json",
				schema: {
					$schema: "http://json-schema.org/draft-07/schema#",
					...definitions != null && { definitions },
					...$defs != null && { $defs },
					type: "object",
					properties: { elements: {
						type: "array",
						items: itemSchema,
						...minItems != null && { minItems },
						...maxItems != null && { maxItems }
					} },
					required: ["elements"],
					additionalProperties: false
				},
				...name25 != null && { name: name25 },
				...description != null && { description }
			};
		}),
		async parseCompleteOutput({ text: text2 }, context) {
			const parseResult = await safeParseJSON({ text: text2 });
			if (!parseResult.success) throw new NoObjectGeneratedError({
				message: "No object generated: could not parse the response.",
				cause: parseResult.error,
				text: text2,
				response: context.response,
				usage: context.usage,
				finishReason: context.finishReason
			});
			const outerValue = parseResult.value;
			if (outerValue == null || typeof outerValue !== "object" || !("elements" in outerValue) || !Array.isArray(outerValue.elements)) throw new NoObjectGeneratedError({
				message: "No object generated: response did not match schema.",
				cause: new TypeValidationError({
					value: outerValue,
					cause: "response must be an object with an elements array"
				}),
				text: text2,
				response: context.response,
				usage: context.usage,
				finishReason: context.finishReason
			});
			const lengthValidationError = getArrayLengthValidationError({
				value: outerValue.elements,
				minItems,
				maxItems
			});
			if (lengthValidationError != null) throw new NoObjectGeneratedError({
				message: "No object generated: response did not match schema.",
				cause: lengthValidationError,
				text: text2,
				response: context.response,
				usage: context.usage,
				finishReason: context.finishReason
			});
			const validatedElements = [];
			for (const element of outerValue.elements) {
				const validationResult = await safeValidateTypes({
					value: element,
					schema: elementSchema
				});
				if (!validationResult.success) throw new NoObjectGeneratedError({
					message: "No object generated: response did not match schema.",
					cause: validationResult.error,
					text: text2,
					response: context.response,
					usage: context.usage,
					finishReason: context.finishReason
				});
				validatedElements.push(validationResult.value);
			}
			return validatedElements;
		},
		async parsePartialOutput({ text: text2 }) {
			const result = await parsePartialJson(text2);
			switch (result.state) {
				case "failed-parse":
				case "undefined-input": return;
				case "repaired-parse":
				case "successful-parse": {
					const outerValue = result.value;
					if (outerValue == null || typeof outerValue !== "object" || !("elements" in outerValue) || !Array.isArray(outerValue.elements)) return;
					const rawElements = result.state === "repaired-parse" && outerValue.elements.length > 0 ? outerValue.elements.slice(0, -1) : outerValue.elements;
					const parsedElements = [];
					for (const rawElement of rawElements) {
						const validationResult = await safeValidateTypes({
							value: rawElement,
							schema: elementSchema
						});
						if (validationResult.success) parsedElements.push(validationResult.value);
					}
					return { partial: parsedElements };
				}
			}
		},
		createElementStreamTransform() {
			let publishedElements = 0;
			return new TransformStream({ transform({ partialOutput }, controller) {
				if (partialOutput != null) for (; publishedElements < partialOutput.length; publishedElements++) {
					if (maxItems != null && publishedElements >= maxItems) {
						controller.error(getArrayLengthValidationError({
							value: partialOutput,
							maxItems
						}));
						return;
					}
					controller.enqueue(partialOutput[publishedElements]);
				}
			} });
		}
	};
};
function validateArrayBound({ name: name25, value }) {
	if (value == null) return;
	if (!Number.isInteger(value)) throw new InvalidArgumentError({
		parameter: name25,
		value,
		message: `${name25} must be an integer`
	});
	if (value < 0) throw new InvalidArgumentError({
		parameter: name25,
		value,
		message: `${name25} must be greater than or equal to 0`
	});
}
function getArrayLengthValidationError({ value, minItems, maxItems }) {
	if (minItems != null && value.length < minItems) return new TypeValidationError({
		value,
		cause: `elements array must contain at least ${minItems} items`
	});
	if (maxItems != null && value.length > maxItems) return new TypeValidationError({
		value,
		cause: `elements array must contain at most ${maxItems} items`
	});
}
var choice = ({ options: choiceOptions, name: name25, description }) => {
	return {
		name: "choice",
		responseFormat: Promise.resolve({
			type: "json",
			schema: {
				$schema: "http://json-schema.org/draft-07/schema#",
				type: "object",
				properties: { result: {
					type: "string",
					enum: choiceOptions
				} },
				required: ["result"],
				additionalProperties: false
			},
			...name25 != null && { name: name25 },
			...description != null && { description }
		}),
		async parseCompleteOutput({ text: text2 }, context) {
			const parseResult = await safeParseJSON({ text: text2 });
			if (!parseResult.success) throw new NoObjectGeneratedError({
				message: "No object generated: could not parse the response.",
				cause: parseResult.error,
				text: text2,
				response: context.response,
				usage: context.usage,
				finishReason: context.finishReason
			});
			const outerValue = parseResult.value;
			if (outerValue == null || typeof outerValue !== "object" || !("result" in outerValue) || typeof outerValue.result !== "string" || !choiceOptions.includes(outerValue.result)) throw new NoObjectGeneratedError({
				message: "No object generated: response did not match schema.",
				cause: new TypeValidationError({
					value: outerValue,
					cause: "response must be an object that contains a choice value."
				}),
				text: text2,
				response: context.response,
				usage: context.usage,
				finishReason: context.finishReason
			});
			return outerValue.result;
		},
		async parsePartialOutput({ text: text2 }) {
			const result = await parsePartialJson(text2);
			switch (result.state) {
				case "failed-parse":
				case "undefined-input": return;
				case "repaired-parse":
				case "successful-parse": {
					const outerValue = result.value;
					if (outerValue == null || typeof outerValue !== "object" || !("result" in outerValue) || typeof outerValue.result !== "string") return;
					const potentialMatches = choiceOptions.filter((choiceOption) => choiceOption.startsWith(outerValue.result));
					if (result.state === "successful-parse") return potentialMatches.includes(outerValue.result) ? { partial: outerValue.result } : void 0;
					else return potentialMatches.length === 1 ? { partial: potentialMatches[0] } : void 0;
				}
			}
		},
		createElementStreamTransform() {}
	};
};
var json = ({ name: name25, description } = {}) => {
	return {
		name: "json",
		responseFormat: Promise.resolve({
			type: "json",
			...name25 != null && { name: name25 },
			...description != null && { description }
		}),
		async parseCompleteOutput({ text: text2 }, context) {
			const parseResult = await safeParseJSON({ text: text2 });
			if (!parseResult.success) throw new NoObjectGeneratedError({
				message: "No object generated: could not parse the response.",
				cause: parseResult.error,
				text: text2,
				response: context.response,
				usage: context.usage,
				finishReason: context.finishReason
			});
			return parseResult.value;
		},
		async parsePartialOutput({ text: text2 }) {
			const result = await parsePartialJson(text2);
			switch (result.state) {
				case "failed-parse":
				case "undefined-input": return;
				case "repaired-parse":
				case "successful-parse": return result.value === void 0 ? void 0 : { partial: result.value };
			}
		},
		createElementStreamTransform() {}
	};
};
async function parseToolCall({ toolCall, tools, repairToolCall, refineToolInput, messages, instructions }) {
	try {
		if (tools == null) {
			if (toolCall.providerExecuted && toolCall.dynamic) return await refineParsedToolCallInput({
				toolCall: await parseProviderExecutedDynamicToolCall(toolCall),
				refineToolInput
			});
			throw new NoSuchToolError({ toolName: toolCall.toolName });
		}
		try {
			return await refineParsedToolCallInput({
				toolCall: await doParseToolCall({
					toolCall,
					tools
				}),
				refineToolInput
			});
		} catch (error) {
			if (repairToolCall == null || !(NoSuchToolError.isInstance(error) || InvalidToolInputError.isInstance(error))) throw error;
			let repairedToolCall = null;
			try {
				repairedToolCall = await repairToolCall({
					toolCall,
					tools,
					inputSchema: async ({ toolName }) => {
						var _a25;
						const inputSchema = (_a25 = getOwn(tools, toolName)) == null ? void 0 : _a25.inputSchema;
						return await asSchema(inputSchema).jsonSchema;
					},
					instructions,
					system: instructions,
					messages,
					error
				});
			} catch (repairError) {
				throw new ToolCallRepairError({
					cause: repairError,
					originalError: error
				});
			}
			if (repairedToolCall == null) throw error;
			return await refineParsedToolCallInput({
				toolCall: await doParseToolCall({
					toolCall: repairedToolCall,
					tools
				}),
				refineToolInput
			});
		}
	} catch (error) {
		const parsedInput = await safeParseJSON({ text: toolCall.input });
		const input = parsedInput.success ? parsedInput.value : toolCall.input;
		const tool2 = getOwn(tools, toolCall.toolName);
		return {
			type: "tool-call",
			toolCallId: toolCall.toolCallId,
			toolName: toolCall.toolName,
			input,
			dynamic: true,
			invalid: true,
			error,
			title: tool2 == null ? void 0 : tool2.title,
			providerExecuted: toolCall.providerExecuted,
			providerMetadata: toolCall.providerMetadata,
			...(tool2 == null ? void 0 : tool2.metadata) != null ? { toolMetadata: tool2.metadata } : {}
		};
	}
}
async function refineParsedToolCallInput({ toolCall, refineToolInput }) {
	const refine = getOwn(refineToolInput, toolCall.toolName);
	if (refine == null) return toolCall;
	return {
		...toolCall,
		input: await refine(toolCall.input)
	};
}
async function parseProviderExecutedDynamicToolCall(toolCall) {
	const parseResult = toolCall.input.trim() === "" ? {
		success: true,
		value: {}
	} : await safeParseJSON({ text: toolCall.input });
	if (parseResult.success === false) throw new InvalidToolInputError({
		toolName: toolCall.toolName,
		toolInput: toolCall.input,
		cause: parseResult.error
	});
	return {
		type: "tool-call",
		toolCallId: toolCall.toolCallId,
		toolName: toolCall.toolName,
		input: parseResult.value,
		providerExecuted: true,
		dynamic: true,
		providerMetadata: toolCall.providerMetadata
	};
}
async function doParseToolCall({ toolCall, tools }) {
	const toolName = toolCall.toolName;
	const tool2 = getOwn(tools, toolName);
	if (tool2 == null) {
		if (toolCall.providerExecuted && toolCall.dynamic) return await parseProviderExecutedDynamicToolCall(toolCall);
		throw new NoSuchToolError({
			toolName: toolCall.toolName,
			availableTools: Object.keys(tools)
		});
	}
	const schema = asSchema(tool2.inputSchema);
	const parseResult = toolCall.input.trim() === "" ? await safeValidateTypes({
		value: {},
		schema
	}) : await safeParseJSON({
		text: toolCall.input,
		schema
	});
	if (parseResult.success === false) throw new InvalidToolInputError({
		toolName,
		toolInput: toolCall.input,
		cause: parseResult.error
	});
	return tool2.type === "dynamic" ? {
		type: "tool-call",
		toolCallId: toolCall.toolCallId,
		toolName: toolCall.toolName,
		input: parseResult.value,
		providerExecuted: toolCall.providerExecuted,
		providerMetadata: toolCall.providerMetadata,
		...tool2.metadata != null ? { toolMetadata: tool2.metadata } : {},
		dynamic: true,
		title: tool2.title
	} : {
		type: "tool-call",
		toolCallId: toolCall.toolCallId,
		toolName,
		input: parseResult.value,
		providerExecuted: toolCall.providerExecuted,
		providerMetadata: toolCall.providerMetadata,
		...tool2.metadata != null ? { toolMetadata: tool2.metadata } : {},
		title: tool2.title
	};
}
function prepareStepCallSettings({ callSettings, stepSettings }) {
	var _a25, _b25, _c, _d, _e, _f, _g, _h, _i;
	return prepareLanguageModelCallOptions({
		maxOutputTokens: (_a25 = stepSettings == null ? void 0 : stepSettings.maxOutputTokens) != null ? _a25 : callSettings.maxOutputTokens,
		temperature: (_b25 = stepSettings == null ? void 0 : stepSettings.temperature) != null ? _b25 : callSettings.temperature,
		topP: (_c = stepSettings == null ? void 0 : stepSettings.topP) != null ? _c : callSettings.topP,
		topK: (_d = stepSettings == null ? void 0 : stepSettings.topK) != null ? _d : callSettings.topK,
		presencePenalty: (_e = stepSettings == null ? void 0 : stepSettings.presencePenalty) != null ? _e : callSettings.presencePenalty,
		frequencyPenalty: (_f = stepSettings == null ? void 0 : stepSettings.frequencyPenalty) != null ? _f : callSettings.frequencyPenalty,
		stopSequences: (_g = stepSettings == null ? void 0 : stepSettings.stopSequences) != null ? _g : callSettings.stopSequences,
		seed: (_h = stepSettings == null ? void 0 : stepSettings.seed) != null ? _h : callSettings.seed,
		reasoning: (_i = stepSettings == null ? void 0 : stepSettings.reasoning) != null ? _i : callSettings.reasoning
	});
}
function unwrapReasoningFileData(data) {
	if (typeof data === "object" && data !== null && "type" in data) return data.type === "data" ? data.data : data.url;
	return data;
}
function convertFromReasoningOutputs(parts) {
	return parts.map((part) => {
		if (part.type === "reasoning") return {
			type: "reasoning",
			text: part.text,
			...part.providerMetadata != null ? { providerOptions: part.providerMetadata } : {}
		};
		return {
			type: "reasoning-file",
			data: part.file.base64,
			mediaType: part.file.mediaType,
			...part.providerMetadata != null ? { providerOptions: part.providerMetadata } : {}
		};
	});
}
function convertToReasoningOutputs(parts) {
	return parts.map((part) => {
		if (part.type === "reasoning") return {
			type: "reasoning",
			text: part.text,
			...part.providerOptions != null ? { providerMetadata: part.providerOptions } : {}
		};
		const rawData = unwrapReasoningFileData(part.data);
		return {
			type: "reasoning-file",
			file: new DefaultGeneratedFile({
				data: rawData instanceof ArrayBuffer ? new Uint8Array(rawData) : rawData instanceof URL ? rawData.toString() : rawData,
				mediaType: part.mediaType
			}),
			...part.providerOptions != null ? { providerMetadata: part.providerOptions } : {}
		};
	});
}
async function resolveToolApproval({ tools, toolCall, toolApproval, messages, toolsContext, runtimeContext }) {
	if (toolApproval != null && typeof toolApproval === "function") return normalizeToolApprovalStatus(await toolApproval({
		toolCall,
		tools,
		toolsContext,
		messages,
		runtimeContext
	}));
	const toolName = toolCall.toolName;
	const tool2 = getOwn(tools, toolName);
	const input = toolCall.input;
	const userDefinedToolApprovalStatus = getOwn(toolApproval, toolName);
	if (userDefinedToolApprovalStatus != null) return normalizeToolApprovalStatus(typeof userDefinedToolApprovalStatus === "function" ? await userDefinedToolApprovalStatus(input, {
		toolCallId: toolCall.toolCallId,
		messages,
		toolContext: await validateToolContext({
			toolName,
			context: getOwn(toolsContext, toolName),
			contextSchema: tool2 == null ? void 0 : tool2.contextSchema
		}),
		runtimeContext
	}) : userDefinedToolApprovalStatus);
	if ((tool2 == null ? void 0 : tool2.needsApproval) == null) return { type: "not-applicable" };
	return (typeof tool2.needsApproval === "function" ? await tool2.needsApproval(input, {
		toolCallId: toolCall.toolCallId,
		messages,
		context: await validateToolContext({
			toolName,
			context: getOwn(toolsContext, toolName),
			contextSchema: tool2 == null ? void 0 : tool2.contextSchema
		})
	}) : tool2.needsApproval) ? { type: "user-approval" } : { type: "not-applicable" };
}
function normalizeToolApprovalStatus(status) {
	return status === void 0 ? { type: "not-applicable" } : typeof status === "string" ? { type: status } : status;
}
function mergeCallbacks(...callbacks) {
	return async (event) => {
		await Promise.allSettled(callbacks.map(async (callback) => {
			await (callback == null ? void 0 : callback(event));
		}));
	};
}
var AI_SDK_TELEMETRY_TRACING_CHANNEL = "ai:telemetry";
function isNodeRuntime() {
	var _a25;
	return typeof process !== "undefined" && ((_a25 = process.release) == null ? void 0 : _a25.name) === "node";
}
var diagnosticsChannelPromise;
async function loadDiagnosticsChannel() {
	if (!isNodeRuntime()) return;
	if (diagnosticsChannelPromise == null) diagnosticsChannelPromise = Promise.resolve(loadBuiltinModule("node:diagnostics_channel"));
	return diagnosticsChannelPromise;
}
function loadBuiltinModule(id) {
	var _a25;
	const processWithBuiltins = globalThis.process;
	try {
		return (_a25 = processWithBuiltins == null ? void 0 : processWithBuiltins.getBuiltinModule) == null ? void 0 : _a25.call(processWithBuiltins, id);
	} catch (e) {
		return;
	}
}
async function runWithTracingChannelSpan(message, execute) {
	var _a25;
	const diagnosticsChannel = await loadDiagnosticsChannel();
	const tracingChannel = (_a25 = diagnosticsChannel == null ? void 0 : diagnosticsChannel.tracingChannel) == null ? void 0 : _a25.call(diagnosticsChannel, AI_SDK_TELEMETRY_TRACING_CHANNEL);
	if (tracingChannel == null || tracingChannel.hasSubscribers === false) return await execute();
	let executePromise;
	let executionResult;
	let executionError;
	let hasExecutionResult = false;
	let hasExecutionError = false;
	const tracedExecute = () => {
		try {
			executePromise = Promise.resolve(execute());
		} catch (error) {
			executePromise = Promise.reject(error);
		}
		executePromise = executePromise.then((result) => {
			executionResult = result;
			hasExecutionResult = true;
			return result;
		}, (error) => {
			executionError = error;
			hasExecutionError = true;
			throw error;
		});
		return executePromise;
	};
	try {
		return await tracingChannel.tracePromise(tracedExecute, message);
	} catch (e) {
		if (hasExecutionError) throw executionError;
		if (hasExecutionResult) return executionResult;
		if (executePromise != null) return await executePromise;
		return await execute();
	}
}
function openTelemetryChannelSpanContext({ message, completion }) {
	var _a25;
	if (!isNodeRuntime()) return;
	const diagnosticsChannel = loadBuiltinModule("node:diagnostics_channel");
	const asyncHooks = loadBuiltinModule("node:async_hooks");
	const tracingChannel = (_a25 = diagnosticsChannel == null ? void 0 : diagnosticsChannel.tracingChannel) == null ? void 0 : _a25.call(diagnosticsChannel, AI_SDK_TELEMETRY_TRACING_CHANNEL);
	if (tracingChannel == null || tracingChannel.hasSubscribers === false || asyncHooks == null) {
		Promise.resolve(completion).catch(() => {});
		return;
	}
	const context = message;
	let asyncResource;
	let asyncEndPublished = false;
	const safePublish = (publish) => {
		try {
			publish();
		} catch (e) {}
	};
	const publishAsyncEnd = ({ result, error }) => {
		if (asyncEndPublished) return;
		asyncEndPublished = true;
		if (error !== void 0) {
			context.error = error;
			safePublish(() => tracingChannel.error.publish(context));
		}
		if (result !== void 0) context.result = result;
		safePublish(() => tracingChannel.asyncEnd.publish(context));
	};
	safePublish(() => {
		tracingChannel.start.runStores(context, () => {
			asyncResource = new asyncHooks.AsyncResource("ai.telemetry");
		});
	});
	safePublish(() => tracingChannel.end.publish(context));
	Promise.resolve(completion).then((result) => publishAsyncEnd({ result }), (error) => publishAsyncEnd({ error }));
	return { run: (execute) => asyncResource == null ? execute() : asyncResource.runInAsyncScope(execute) };
}
function getGlobalTelemetryIntegrations() {
	var _a25;
	return (_a25 = globalThis.AI_SDK_TELEMETRY_INTEGRATIONS) != null ? _a25 : [];
}
function augmentEvent(event, telemetry) {
	return Object.assign(Object.create(Object.getPrototypeOf(event)), event, telemetry);
}
function createTelemetryDispatcher({ telemetry }) {
	if ((telemetry == null ? void 0 : telemetry.isEnabled) === false) return {};
	const localIntegrations = telemetry == null ? void 0 : telemetry.integrations;
	const integrations = localIntegrations != null ? asArray(localIntegrations) : getGlobalTelemetryIntegrations();
	const telemetryMetadata = {
		recordInputs: telemetry == null ? void 0 : telemetry.recordInputs,
		recordOutputs: telemetry == null ? void 0 : telemetry.recordOutputs,
		functionId: telemetry == null ? void 0 : telemetry.functionId
	};
	const mergeTelemetryCallback = (key) => {
		const mergedIntegrationCallback = mergeCallbacks(...integrations.map((integration) => {
			var _a25;
			return (_a25 = integration[key]) == null ? void 0 : _a25.bind(integration);
		}).filter(Boolean).map((callback) => ((event) => callback(augmentEvent(event, telemetryMetadata)))));
		return async (event) => {
			await mergedIntegrationCallback(event);
		};
	};
	const executeLanguageModelCallWrappers = integrations.map((integration) => {
		var _a25;
		return (_a25 = integration.executeLanguageModelCall) == null ? void 0 : _a25.bind(integration);
	}).filter(Boolean);
	const executeToolWrappers = integrations.map((integration) => {
		var _a25;
		return (_a25 = integration.executeTool) == null ? void 0 : _a25.bind(integration);
	}).filter(Boolean);
	return {
		runInTracingChannelSpan: async ({ type, event, execute }) => await runWithTracingChannelSpan({
			type,
			event: augmentEvent(event, telemetryMetadata)
		}, execute),
		startTracingChannelContext: ({ type, event, completion }) => openTelemetryChannelSpanContext({
			message: {
				type,
				event: augmentEvent(event, telemetryMetadata)
			},
			completion
		}),
		onStart: mergeTelemetryCallback("onStart"),
		onStepStart: mergeTelemetryCallback("onStepStart"),
		onLanguageModelCallStart: mergeTelemetryCallback("onLanguageModelCallStart"),
		onLanguageModelCallEnd: mergeTelemetryCallback("onLanguageModelCallEnd"),
		onToolExecutionStart: mergeTelemetryCallback("onToolExecutionStart"),
		onToolExecutionEnd: mergeTelemetryCallback("onToolExecutionEnd"),
		onStepEnd: mergeCallbacks(mergeTelemetryCallback("onStepEnd"), mergeTelemetryCallback("onStepFinish")),
		onObjectStepStart: mergeTelemetryCallback("onObjectStepStart"),
		onObjectStepEnd: mergeTelemetryCallback("onObjectStepEnd"),
		onEmbedStart: mergeTelemetryCallback("onEmbedStart"),
		onEmbedEnd: mergeTelemetryCallback("onEmbedEnd"),
		onRerankStart: mergeTelemetryCallback("onRerankStart"),
		onRerankEnd: mergeTelemetryCallback("onRerankEnd"),
		onEnd: mergeTelemetryCallback("onEnd"),
		onAbort: mergeTelemetryCallback("onAbort"),
		onError: mergeTelemetryCallback("onError"),
		/**
		* Runs provider calls inside integration-specific context so
		* auto-instrumented provider requests can be associated with model work.
		*/
		executeLanguageModelCall: async ({ execute, ...event }) => {
			const augmentedEvent = augmentEvent(event, telemetryMetadata);
			let wrappedExecute = execute;
			for (const executeWrapper of executeLanguageModelCallWrappers) {
				const innerExecute = wrappedExecute;
				wrappedExecute = () => executeWrapper({
					...augmentedEvent,
					execute: innerExecute
				});
			}
			return await runWithTracingChannelSpan({
				type: "languageModelCall",
				event: augmentedEvent
			}, wrappedExecute);
		},
		/**
		* Composes all `executeTool` wrappers around the original tool execution.
		* Each wrapper receives an `execute` function that calls the next wrapper in
		* the chain, so integrations can establish nested telemetry context before
		* delegating to the underlying tool.
		*/
		executeTool: async ({ execute, ...event }) => {
			const augmentedEvent = augmentEvent(event, telemetryMetadata);
			let wrappedExecute = execute;
			for (const executeWrapper of executeToolWrappers) {
				const innerExecute = wrappedExecute;
				wrappedExecute = () => executeWrapper({
					...augmentedEvent,
					execute: innerExecute
				});
			}
			return await wrappedExecute();
		}
	};
}
function asReasoningText(reasoningParts) {
	const reasoningText = reasoningParts.map((part) => "text" in part ? part.text : "").join("");
	return reasoningText.length > 0 ? reasoningText : void 0;
}
var DefaultStepResult = class {
	constructor({ callId, stepNumber, provider, modelId, runtimeContext, toolsContext, content, finishReason, rawFinishReason, usage, performance, warnings, request, response, providerMetadata }) {
		this.callId = callId;
		this.stepNumber = stepNumber;
		this.model = {
			provider,
			modelId
		};
		this.runtimeContext = runtimeContext;
		this.toolsContext = toolsContext;
		this.content = content;
		this.finishReason = finishReason;
		this.rawFinishReason = rawFinishReason;
		this.usage = usage;
		this.performance = performance;
		this.warnings = warnings;
		this.request = request;
		this.response = response;
		this.providerMetadata = providerMetadata;
	}
	get text() {
		return this.content.filter((part) => part.type === "text").map((part) => part.text).join("");
	}
	get reasoning() {
		return convertFromReasoningOutputs(this.content.filter((part) => part.type === "reasoning" || part.type === "reasoning-file"));
	}
	get reasoningText() {
		return asReasoningText(this.reasoning);
	}
	get files() {
		return this.content.filter((part) => part.type === "file").map((part) => part.file);
	}
	get sources() {
		return this.content.filter((part) => part.type === "source");
	}
	get toolCalls() {
		return this.content.filter((part) => part.type === "tool-call");
	}
	get staticToolCalls() {
		return this.toolCalls.filter((toolCall) => toolCall.dynamic !== true);
	}
	get dynamicToolCalls() {
		return this.toolCalls.filter((toolCall) => toolCall.dynamic === true);
	}
	get toolResults() {
		return this.content.filter((part) => part.type === "tool-result");
	}
	get staticToolResults() {
		return this.toolResults.filter((toolResult) => toolResult.dynamic !== true);
	}
	get dynamicToolResults() {
		return this.toolResults.filter((toolResult) => toolResult.dynamic === true);
	}
};
function filterIncludedContext({ context, includeContext }) {
	if (context == null) return {};
	return Object.fromEntries(Object.entries(context).filter(([key]) => (includeContext == null ? void 0 : includeContext[key]) === true));
}
function restrictStepResult({ step, includeRuntimeContext, includeToolsContext }) {
	return new DefaultStepResult({
		callId: step.callId,
		stepNumber: step.stepNumber,
		provider: step.model.provider,
		modelId: step.model.modelId,
		runtimeContext: filterIncludedContext({
			context: step.runtimeContext,
			includeContext: includeRuntimeContext
		}),
		toolsContext: filterToolsContext({
			toolsContext: step.toolsContext,
			includeToolsContext
		}),
		content: step.content,
		finishReason: step.finishReason,
		rawFinishReason: step.rawFinishReason,
		usage: step.usage,
		performance: step.performance,
		warnings: step.warnings,
		request: step.request,
		response: step.response,
		providerMetadata: step.providerMetadata
	});
}
function filterToolsContext({ toolsContext, includeToolsContext }) {
	if (includeToolsContext == null) return {};
	return Object.fromEntries(Object.entries(toolsContext).map(([toolName, toolContext]) => [toolName, filterToolContext({
		toolName,
		toolContext,
		includeToolsContext
	})]));
}
function filterToolContext({ toolName, toolContext, includeToolsContext }) {
	return filterIncludedContext({
		context: toolContext,
		includeContext: includeToolsContext == null ? void 0 : includeToolsContext[toolName]
	});
}
function createRestrictedTelemetryDispatcher({ telemetry, includeRuntimeContext, includeToolsContext }) {
	const telemetryDispatcher = createTelemetryDispatcher({ telemetry });
	return {
		...telemetryDispatcher,
		onStart: (event) => {
			var _a25;
			return (_a25 = telemetryDispatcher.onStart) == null ? void 0 : _a25.call(telemetryDispatcher, {
				...event,
				runtimeContext: filterIncludedContext({
					context: event.runtimeContext,
					includeContext: includeRuntimeContext
				}),
				toolsContext: filterToolsContext({
					toolsContext: event.toolsContext,
					includeToolsContext
				})
			});
		},
		onStepStart: (event) => {
			var _a25;
			return (_a25 = telemetryDispatcher.onStepStart) == null ? void 0 : _a25.call(telemetryDispatcher, {
				...event,
				runtimeContext: filterIncludedContext({
					context: event.runtimeContext,
					includeContext: includeRuntimeContext
				}),
				steps: event.steps.map((step) => restrictStepResult({
					step,
					includeRuntimeContext,
					includeToolsContext
				})),
				toolsContext: filterToolsContext({
					toolsContext: event.toolsContext,
					includeToolsContext
				})
			});
		},
		onStepEnd: (event) => {
			var _a25;
			return (_a25 = telemetryDispatcher.onStepEnd) == null ? void 0 : _a25.call(telemetryDispatcher, restrictStepResult({
				step: event,
				includeRuntimeContext,
				includeToolsContext
			}));
		},
		onStepFinish: (event) => {
			var _a25;
			return (_a25 = telemetryDispatcher.onStepEnd) == null ? void 0 : _a25.call(telemetryDispatcher, restrictStepResult({
				step: event,
				includeRuntimeContext,
				includeToolsContext
			}));
		},
		onEnd: (event) => {
			var _a25;
			return (_a25 = telemetryDispatcher.onEnd) == null ? void 0 : _a25.call(telemetryDispatcher, ((restrictedSteps) => {
				return {
					...event,
					runtimeContext: filterIncludedContext({
						context: event.runtimeContext,
						includeContext: includeRuntimeContext
					}),
					steps: restrictedSteps,
					finalStep: restrictedSteps.at(-1),
					toolsContext: filterToolsContext({
						toolsContext: event.toolsContext,
						includeToolsContext
					})
				};
			})(event.steps.map((step) => restrictStepResult({
				step,
				includeRuntimeContext,
				includeToolsContext
			}))));
		},
		onAbort: (event) => {
			var _a25;
			return (_a25 = telemetryDispatcher.onAbort) == null ? void 0 : _a25.call(telemetryDispatcher, {
				...event,
				steps: event.steps.map((step) => restrictStepResult({
					step,
					includeRuntimeContext,
					includeToolsContext
				}))
			});
		},
		onToolExecutionStart: (event) => {
			var _a25;
			return (_a25 = telemetryDispatcher.onToolExecutionStart) == null ? void 0 : _a25.call(telemetryDispatcher, {
				...event,
				toolContext: filterToolContext({
					toolName: event.toolCall.toolName,
					toolContext: event.toolContext,
					includeToolsContext
				})
			});
		},
		onToolExecutionEnd: (event) => {
			var _a25;
			return (_a25 = telemetryDispatcher.onToolExecutionEnd) == null ? void 0 : _a25.call(telemetryDispatcher, {
				...event,
				toolContext: filterToolContext({
					toolName: event.toolCall.toolName,
					toolContext: event.toolContext,
					includeToolsContext
				})
			});
		}
	};
}
function isStepCount(stepCount) {
	return ({ steps }) => steps.length === stepCount;
}
async function isStopConditionMet({ stopConditions, steps }) {
	return (await Promise.all(stopConditions.map((condition) => condition({ steps })))).some((result) => result);
}
function sumTokenCounts(tokenCount1, tokenCount2) {
	return tokenCount1 == null && tokenCount2 == null ? void 0 : (tokenCount1 != null ? tokenCount1 : 0) + (tokenCount2 != null ? tokenCount2 : 0);
}
async function toResponseMessages({ content: inputContent, tools }) {
	const responseMessages = [];
	const toolCallOrder = /* @__PURE__ */ new Map();
	const content = [];
	for (const part of inputContent) {
		if (part.type === "source") continue;
		if ((part.type === "tool-result" || part.type === "tool-error") && !part.providerExecuted) continue;
		if (part.type === "text" && part.text.length === 0) continue;
		switch (part.type) {
			case "text":
				content.push({
					type: "text",
					text: part.text,
					providerOptions: part.providerMetadata
				});
				break;
			case "custom":
				content.push({
					type: "custom",
					kind: part.kind,
					providerOptions: part.providerMetadata
				});
				break;
			case "reasoning":
				content.push({
					type: "reasoning",
					text: part.text,
					providerOptions: part.providerMetadata
				});
				break;
			case "file":
				content.push({
					type: "file",
					data: part.file.base64,
					mediaType: part.file.mediaType,
					providerOptions: part.providerMetadata
				});
				break;
			case "reasoning-file":
				content.push({
					type: "reasoning-file",
					data: part.file.base64,
					mediaType: part.file.mediaType,
					providerOptions: part.providerMetadata
				});
				break;
			case "tool-call":
				if (!toolCallOrder.has(part.toolCallId)) toolCallOrder.set(part.toolCallId, toolCallOrder.size);
				content.push({
					type: "tool-call",
					toolCallId: part.toolCallId,
					toolName: part.toolName,
					input: part.invalid && typeof part.input !== "object" ? {} : part.input,
					providerExecuted: part.providerExecuted,
					providerOptions: part.providerMetadata
				});
				break;
			case "tool-result": {
				const output = await createToolModelOutput({
					toolCallId: part.toolCallId,
					input: part.input,
					tool: getOwn(tools, part.toolName),
					output: part.output,
					errorMode: "none"
				});
				content.push({
					type: "tool-result",
					toolCallId: part.toolCallId,
					toolName: part.toolName,
					output,
					providerOptions: part.providerMetadata
				});
				break;
			}
			case "tool-error": {
				const output = await createToolModelOutput({
					toolCallId: part.toolCallId,
					input: part.input,
					tool: getOwn(tools, part.toolName),
					output: part.error,
					errorMode: "json"
				});
				content.push({
					type: "tool-result",
					toolCallId: part.toolCallId,
					toolName: part.toolName,
					output,
					providerOptions: part.providerMetadata
				});
				break;
			}
			case "tool-approval-request": content.push({
				type: "tool-approval-request",
				approvalId: part.approvalId,
				toolCallId: part.toolCall.toolCallId,
				...part.reason != null ? { reason: part.reason } : {},
				isAutomatic: part.isAutomatic,
				...part.signature != null ? { signature: part.signature } : {}
			});
		}
	}
	if (content.length > 0) responseMessages.push({
		role: "assistant",
		content
	});
	const toolResultContent = [];
	for (const part of inputContent) {
		if (part.type !== "tool-approval-response" && part.type !== "tool-result" && part.type !== "tool-error") continue;
		if (part.type === "tool-approval-response") {
			toolResultContent.push({
				type: "tool-approval-response",
				approvalId: part.approvalId,
				approved: part.approved,
				reason: part.reason,
				providerExecuted: part.providerExecuted
			});
			if (part.approved === false) toolResultContent.push({
				type: "tool-result",
				toolCallId: part.toolCall.toolCallId,
				toolName: part.toolCall.toolName,
				output: {
					type: "execution-denied",
					reason: part.reason
				}
			});
			continue;
		}
		if (part.providerExecuted) continue;
		const output = await createToolModelOutput({
			toolCallId: part.toolCallId,
			input: part.input,
			tool: getOwn(tools, part.toolName),
			output: part.type === "tool-result" ? part.output : part.error,
			errorMode: part.type === "tool-error" ? "text" : "none"
		});
		toolResultContent.push({
			type: "tool-result",
			toolCallId: part.toolCallId,
			toolName: part.toolName,
			output,
			...part.providerMetadata != null ? { providerOptions: part.providerMetadata } : {}
		});
	}
	if (toolResultContent.length > 0) responseMessages.push({
		role: "tool",
		content: sortToolResultContentByToolCallOrder({
			toolResultContent,
			toolCallOrder
		})
	});
	return responseMessages;
}
function sortToolResultContentByToolCallOrder({ toolResultContent, toolCallOrder }) {
	const sortedToolResults = toolResultContent.filter((part) => part.type === "tool-result").map((part, index) => ({
		part,
		index
	})).sort((a, b) => {
		const aOrder = toolCallOrder.get(a.part.toolCallId);
		const bOrder = toolCallOrder.get(b.part.toolCallId);
		if (aOrder == null && bOrder == null) return a.index - b.index;
		if (aOrder == null) return 1;
		if (bOrder == null) return -1;
		return aOrder - bOrder || a.index - b.index;
	}).map(({ part }) => part);
	let toolResultIndex = 0;
	return toolResultContent.map((part) => part.type === "tool-result" ? sortedToolResults[toolResultIndex++] : part);
}
var DIRECT_TOOL_CALL = "AI_SDK_DIRECT_TOOL_CALL";
function resolveToolCallerConfiguration({ tools, toolCallers }) {
	if (tools == null || toolCallers == null) return;
	const resolved = {};
	for (const [toolName, callers] of Object.entries(toolCallers)) {
		if (!Object.prototype.hasOwnProperty.call(tools, toolName)) throw new InvalidArgumentError({
			parameter: "experimental_toolCallers",
			value: toolCallers,
			message: `unknown tool "${toolName}".`
		});
		if (!Array.isArray(callers)) throw new InvalidArgumentError({
			parameter: "experimental_toolCallers",
			value: toolCallers,
			message: `callers for tool "${toolName}" must be an array.`
		});
		resolved[toolName] = callers.map((caller) => {
			if (caller === DIRECT_TOOL_CALL) return caller;
			if (typeof caller !== "string" || !Object.prototype.hasOwnProperty.call(tools, caller) || getToolCaller(tools[caller]) == null) throw new InvalidArgumentError({
				parameter: "experimental_toolCallers",
				value: toolCallers,
				message: `tool "${toolName}" contains an invalid caller.`
			});
			return caller;
		});
	}
	return resolved;
}
function prepareToolsForToolCallers({ tools, toolCallers }) {
	var _a25, _b25;
	if (tools == null || toolCallers == null) return {
		executionTools: tools,
		modelTools: tools
	};
	const executionTools = { ...tools };
	const modelTools = { ...tools };
	const localToolsByCaller = /* @__PURE__ */ new Map();
	for (const [toolName, callerNames] of Object.entries(toolCallers)) {
		const tool2 = executionTools[toolName];
		if (tool2 == null) continue;
		let availableDirectly = false;
		let availableToProvider = false;
		let preparedTool = tool2;
		for (const callerName of callerNames) {
			if (callerName === DIRECT_TOOL_CALL) {
				availableDirectly = true;
				continue;
			}
			const caller = getToolCaller(executionTools[callerName]);
			if (caller == null) continue;
			if (caller.type === "provider") {
				availableToProvider = true;
				preparedTool = {
					...preparedTool,
					providerOptions: caller.prepareProviderOptions(preparedTool.providerOptions)
				};
			} else {
				const localTools = (_a25 = localToolsByCaller.get(callerName)) != null ? _a25 : {};
				localTools[toolName] = preparedTool;
				localToolsByCaller.set(callerName, localTools);
			}
		}
		executionTools[toolName] = preparedTool;
		if (availableDirectly || availableToProvider) modelTools[toolName] = preparedTool;
		else delete modelTools[toolName];
	}
	for (const [callerName, callerTool] of Object.entries(executionTools)) {
		const caller = getToolCaller(callerTool);
		if ((caller == null ? void 0 : caller.type) !== "local") continue;
		const boundCaller = caller.bind((_b25 = localToolsByCaller.get(callerName)) != null ? _b25 : {});
		executionTools[callerName] = boundCaller;
		if (Object.prototype.hasOwnProperty.call(modelTools, callerName)) modelTools[callerName] = boundCaller;
	}
	return {
		executionTools,
		modelTools
	};
}
var encoder = new TextEncoder();
function canonicalJSON(value) {
	if (value === null || value === void 0) return JSON.stringify(value);
	if (typeof value !== "object") return JSON.stringify(value);
	if (Array.isArray(value)) return `[${value.map((element) => element === void 0 ? "null" : canonicalJSON(element)).join(",")}]`;
	return `{${Object.keys(value).sort().map((k) => `${JSON.stringify(k)}:${canonicalJSON(value[k])}`).join(",")}}`;
}
function toBase64url(bytes) {
	return convertUint8ArrayToBase64(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
async function hashCanonical(value) {
	const digest = await crypto.subtle.digest("SHA-256", encoder.encode(canonicalJSON(value)));
	return toBase64url(new Uint8Array(digest));
}
var encoder2 = new TextEncoder();
function fromBase64url(str) {
	return convertBase64ToUint8Array(str);
}
async function importKey(secret) {
	const keyData = typeof secret === "string" ? encoder2.encode(secret) : secret;
	return crypto.subtle.importKey("raw", keyData, {
		name: "HMAC",
		hash: "SHA-256"
	}, false, ["sign", "verify"]);
}
function buildPayload(approvalId, toolCallId, toolName, inputDigest) {
	return encoder2.encode(JSON.stringify([
		"ai-sdk-tool-approval-v1",
		approvalId,
		toolCallId,
		toolName,
		inputDigest
	]));
}
function buildLegacyPayload(approvalId, toolCallId, toolName, inputDigest) {
	return encoder2.encode(`${approvalId}
${toolCallId}
${toolName}
${inputDigest}`);
}
async function signToolApproval({ secret, approvalId, toolCallId, toolName, input }) {
	const key = await importKey(secret);
	const payload = buildPayload(approvalId, toolCallId, toolName, await hashCanonical(input));
	const sig = await crypto.subtle.sign("HMAC", key, payload);
	return toBase64url(new Uint8Array(sig));
}
async function verifyToolApprovalSignature({ secret, signature, approvalId, toolCallId, toolName, input }) {
	const key = await importKey(secret);
	const inputDigest = await hashCanonical(input);
	const sigBytes = fromBase64url(signature);
	const payload = buildPayload(approvalId, toolCallId, toolName, inputDigest);
	if (await crypto.subtle.verify("HMAC", key, sigBytes, payload)) return true;
	if (!approvalId.includes("\n") && !toolCallId.includes("\n") && !toolName.includes("\n")) {
		const legacyPayload = buildLegacyPayload(approvalId, toolCallId, toolName, inputDigest);
		return crypto.subtle.verify("HMAC", key, sigBytes, legacyPayload);
	}
	return false;
}
async function maybeSignApproval({ secret, approvalId, toolCallId, toolName, input }) {
	if (secret == null) return void 0;
	return signToolApproval({
		secret,
		approvalId,
		toolCallId,
		toolName,
		input
	});
}
async function validateApprovedToolApprovals({ approvedToolApprovals, tools, toolApproval, messages, toolsContext, runtimeContext, toolApprovalSecret }) {
	var _a25;
	const approved = [];
	const denied = [];
	const invalid = [];
	for (const approval of approvedToolApprovals) {
		const { toolCall, approvalRequest } = approval;
		const tool2 = getOwn(tools, toolCall.toolName);
		if (toolApprovalSecret != null) {
			if (approvalRequest.signature == null) throw new InvalidToolApprovalSignatureError({
				approvalId: approvalRequest.approvalId,
				toolCallId: toolCall.toolCallId,
				reason: "missing signature"
			});
			if (!await verifyToolApprovalSignature({
				secret: toolApprovalSecret,
				signature: approvalRequest.signature,
				approvalId: approvalRequest.approvalId,
				toolCallId: toolCall.toolCallId,
				toolName: toolCall.toolName,
				input: toolCall.input
			})) throw new InvalidToolApprovalSignatureError({
				approvalId: approvalRequest.approvalId,
				toolCallId: toolCall.toolCallId,
				reason: "invalid signature"
			});
		}
		if (isExecutableTool(tool2) && tool2.inputSchema != null) {
			const validation = await safeValidateTypes({
				value: toolCall.input,
				schema: asSchema(tool2.inputSchema)
			});
			if (!validation.success) {
				invalid.push({
					...approval,
					error: new InvalidToolInputError({
						toolName: toolCall.toolName,
						toolInput: JSON.stringify(toolCall.input),
						cause: validation.error
					})
				});
				continue;
			}
		}
		const approvalStatus = await resolveToolApproval({
			tools,
			toolApproval,
			toolCall,
			messages,
			toolsContext,
			runtimeContext
		});
		if (approvalStatus.type === "denied") denied.push({
			...approval,
			approvalResponse: {
				...approval.approvalResponse,
				approved: false,
				reason: (_a25 = approvalStatus.reason) != null ? _a25 : approval.approvalResponse.reason
			}
		});
		else approved.push(approval);
	}
	return {
		approvedToolApprovals: approved,
		deniedToolApprovals: denied,
		invalidToolApprovals: invalid
	};
}
var originalGenerateId = createIdGenerator({
	prefix: "aitxt",
	size: 24
});
var originalGenerateCallId = createIdGenerator({
	prefix: "call",
	size: 24
});
async function generateText({ model: modelArg, tools, toolChoice, instructions, system, prompt, messages, allowSystemInMessages, maxRetries: maxRetriesArg, abortSignal, timeout, headers, stopWhen = isStepCount(1), experimental_sandbox: sandbox, output, toolApproval, experimental_toolCallers, experimental_toolApprovalSecret, experimental_telemetry, telemetry = experimental_telemetry, providerOptions, activeTools, toolOrder, prepareStep, experimental_repairToolCall, repairToolCall = experimental_repairToolCall, experimental_refineToolInput: refineToolInput, experimental_download: download2, runtimeContext = {}, toolsContext = {}, experimental_include, include = experimental_include, _internal: { generateId: generateId4 = originalGenerateId, generateCallId = originalGenerateCallId, now: now2 = now } = {}, onStart, experimental_onStart, onStepStart, experimental_onStepStart, onLanguageModelCallStart, experimental_onLanguageModelCallStart, onLanguageModelCallEnd, experimental_onLanguageModelCallEnd, onToolExecutionStart, onToolExecutionEnd, experimental_onToolCallStart, experimental_onToolCallFinish, onStepEnd, onStepFinish, onFinish, onEnd = onFinish, ...settings }) {
	var _a25, _b25, _c, _d;
	include = {
		requestBody: (_a25 = include == null ? void 0 : include.requestBody) != null ? _a25 : false,
		requestMessages: (_b25 = include == null ? void 0 : include.requestMessages) != null ? _b25 : false,
		responseBody: (_c = include == null ? void 0 : include.responseBody) != null ? _c : false
	};
	const model = resolveLanguageModel(modelArg);
	const resolvedToolCallers = resolveToolCallerConfiguration({
		tools,
		toolCallers: experimental_toolCallers
	});
	const stopConditions = asArray(stopWhen);
	const resolvedOnStart = onStart != null ? onStart : experimental_onStart;
	const resolvedOnStepStart = onStepStart != null ? onStepStart : experimental_onStepStart;
	const resolvedOnLanguageModelCallStart = onLanguageModelCallStart != null ? onLanguageModelCallStart : experimental_onLanguageModelCallStart;
	const resolvedOnLanguageModelCallEnd = onLanguageModelCallEnd != null ? onLanguageModelCallEnd : experimental_onLanguageModelCallEnd;
	const resolvedOnToolExecutionStart = onToolExecutionStart != null ? onToolExecutionStart : experimental_onToolCallStart;
	const resolvedOnToolExecutionEnd = onToolExecutionEnd != null ? onToolExecutionEnd : experimental_onToolCallFinish;
	const resolvedOnStepEnd = onStepEnd != null ? onStepEnd : onStepFinish;
	const unsupportedTimeoutWarnings = [];
	if (getFirstChunkTimeoutMs(timeout) != null) unsupportedTimeoutWarnings.push({
		type: "unsupported",
		feature: "timeout.firstChunkMs",
		details: "The firstChunkMs timeout is only supported by streaming functions."
	});
	if (getChunkTimeoutMs(timeout) != null) unsupportedTimeoutWarnings.push({
		type: "unsupported",
		feature: "timeout.chunkMs",
		details: "The chunkMs timeout is only supported by streaming functions."
	});
	if (unsupportedTimeoutWarnings.length > 0) logWarnings({
		warnings: unsupportedTimeoutWarnings,
		provider: model.provider,
		model: model.modelId
	});
	const totalTimeoutMs = getTotalTimeoutMs(timeout);
	const stepTimeoutMs = getStepTimeoutMs(timeout);
	const stepAbortController = stepTimeoutMs != null ? new AbortController() : void 0;
	const mergedAbortSignal = mergeAbortSignals(abortSignal, totalTimeoutMs, stepAbortController == null ? void 0 : stepAbortController.signal);
	const { maxRetries, retry } = prepareRetries({
		maxRetries: maxRetriesArg,
		abortSignal: mergedAbortSignal
	});
	const callSettings = prepareLanguageModelCallOptions(settings);
	const headersWithUserAgent = withUserAgentSuffix(headers != null ? headers : {}, `ai/${VERSION}`);
	const initialPrompt = await standardizePrompt({
		instructions,
		system,
		prompt,
		messages,
		allowSystemInMessages
	});
	const callId = generateCallId();
	const telemetryDispatcher = createRestrictedTelemetryDispatcher({
		telemetry,
		includeRuntimeContext: telemetry == null ? void 0 : telemetry.includeRuntimeContext,
		includeToolsContext: telemetry == null ? void 0 : telemetry.includeToolsContext
	});
	const runInTracingChannelSpan = (_d = telemetryDispatcher.runInTracingChannelSpan) != null ? _d : (async ({ execute }) => await execute());
	const generateTextStartEvent = {
		callId,
		operationId: "ai.generateText",
		provider: model.provider,
		modelId: model.modelId,
		instructions: initialPrompt.instructions,
		messages: initialPrompt.messages,
		tools,
		toolChoice,
		activeTools,
		toolOrder,
		maxOutputTokens: callSettings.maxOutputTokens,
		temperature: callSettings.temperature,
		topP: callSettings.topP,
		topK: callSettings.topK,
		presencePenalty: callSettings.presencePenalty,
		frequencyPenalty: callSettings.frequencyPenalty,
		stopSequences: callSettings.stopSequences,
		seed: callSettings.seed,
		reasoning: callSettings.reasoning,
		maxRetries,
		timeout,
		headers: headersWithUserAgent,
		providerOptions,
		output,
		runtimeContext,
		toolsContext
	};
	const executeGenerateText = async () => {
		var _a26;
		await notify({
			event: generateTextStartEvent,
			callbacks: [resolvedOnStart, telemetryDispatcher.onStart]
		});
		try {
			const initialMessages = initialPrompt.messages;
			const initialResponseMessages = [];
			const { approvedToolApprovals, deniedToolApprovals: collectedDeniedToolApprovals } = collectToolApprovals({ messages: initialMessages });
			const { approvedToolApprovals: localApprovedToolApprovals, deniedToolApprovals: revalidationDeniedToolApprovals, invalidToolApprovals } = await validateApprovedToolApprovals({
				approvedToolApprovals: approvedToolApprovals.filter((toolApproval2) => !toolApproval2.toolCall.providerExecuted),
				tools,
				toolApproval,
				messages: initialMessages,
				toolsContext,
				runtimeContext,
				toolApprovalSecret: experimental_toolApprovalSecret
			});
			const deniedToolApprovalsWithoutResults = [...collectedDeniedToolApprovals, ...revalidationDeniedToolApprovals].filter((toolApproval2) => toolApproval2.existingToolResult == null);
			if (deniedToolApprovalsWithoutResults.length > 0 || localApprovedToolApprovals.length > 0 || invalidToolApprovals.length > 0) {
				const toolResults2 = await executeTools({
					toolCalls: localApprovedToolApprovals.map((toolApproval2) => toolApproval2.toolCall),
					tools,
					callId,
					messages: initialMessages,
					abortSignal: mergedAbortSignal,
					timeout,
					experimental_sandbox: sandbox,
					toolsContext,
					onToolExecutionStart: (event) => notify({
						event,
						callbacks: [resolvedOnToolExecutionStart, telemetryDispatcher.onToolExecutionStart]
					}),
					onToolExecutionEnd: (event) => notify({
						event,
						callbacks: [resolvedOnToolExecutionEnd, telemetryDispatcher.onToolExecutionEnd]
					}),
					executeToolInTelemetryContext: telemetryDispatcher.executeTool,
					runInTracingChannelSpan
				});
				const toolContent = [];
				for (const result of toolResults2) {
					const output2 = result.output;
					const modelOutput = await createToolModelOutput({
						toolCallId: output2.toolCallId,
						input: output2.input,
						tool: getOwn(tools, output2.toolName),
						output: output2.type === "tool-result" ? output2.output : output2.error,
						errorMode: output2.type === "tool-error" ? "text" : "none"
					});
					toolContent.push({
						type: "tool-result",
						toolCallId: output2.toolCallId,
						toolName: output2.toolName,
						output: modelOutput
					});
				}
				for (const toolApproval2 of invalidToolApprovals) toolContent.push({
					type: "tool-result",
					toolCallId: toolApproval2.toolCall.toolCallId,
					toolName: toolApproval2.toolCall.toolName,
					output: await createToolModelOutput({
						toolCallId: toolApproval2.toolCall.toolCallId,
						input: toolApproval2.toolCall.input,
						tool: getOwn(tools, toolApproval2.toolCall.toolName),
						output: toolApproval2.error,
						errorMode: "text"
					})
				});
				for (const toolApproval2 of deniedToolApprovalsWithoutResults) toolContent.push({
					type: "tool-result",
					toolCallId: toolApproval2.toolCall.toolCallId,
					toolName: toolApproval2.toolCall.toolName,
					output: {
						type: "execution-denied",
						reason: toolApproval2.approvalResponse.reason,
						...toolApproval2.toolCall.providerExecuted && { providerOptions: { openai: { approvalId: toolApproval2.approvalResponse.approvalId } } }
					}
				});
				initialResponseMessages.push({
					role: "tool",
					content: toolContent
				});
			}
			const callSettings2 = prepareLanguageModelCallOptions(settings);
			let currentModelResponse;
			let clientToolCalls = [];
			let clientToolOutputs = [];
			let toolApprovalResponses = [];
			let deniedToolApprovalResponses = [];
			const steps = [];
			let instructionsForNextStep = initialPrompt.instructions;
			let messagesForNextStep = [...initialMessages, ...initialResponseMessages];
			const pendingDeferredToolCalls = /* @__PURE__ */ new Map();
			do {
				if (steps.length > 0) mergedAbortSignal?.throwIfAborted();
				const stepTimeoutId = setAbortTimeout({
					abortController: stepAbortController,
					label: "Step",
					timeoutMs: stepTimeoutMs
				});
				const stepNumber = steps.length;
				try {
					await runInTracingChannelSpan({
						type: "step",
						event: {
							callId,
							stepNumber
						},
						execute: async () => {
							var _a27, _b26, _c2, _d2, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q;
							const accumulatedResponseMessages = [...initialResponseMessages, ...steps.flatMap((step) => step.response.messages)];
							const stepInputMessages = messagesForNextStep;
							const prepareStepResult = await (prepareStep == null ? void 0 : prepareStep({
								model,
								steps,
								stepNumber: steps.length,
								instructions: instructionsForNextStep,
								initialInstructions: initialPrompt.instructions,
								messages: stepInputMessages,
								initialMessages,
								responseMessages: accumulatedResponseMessages,
								runtimeContext,
								toolsContext,
								experimental_sandbox: sandbox
							}));
							const stepSandbox = (_a27 = prepareStepResult == null ? void 0 : prepareStepResult.experimental_sandbox) != null ? _a27 : sandbox;
							const stepModel = resolveLanguageModel((_b26 = prepareStepResult == null ? void 0 : prepareStepResult.model) != null ? _b26 : model);
							const stepInstructions = (_d2 = (_c2 = prepareStepResult == null ? void 0 : prepareStepResult.instructions) != null ? _c2 : prepareStepResult == null ? void 0 : prepareStepResult.system) != null ? _d2 : instructionsForNextStep;
							const promptMessages = await convertToLanguageModelPrompt({
								prompt: {
									instructions: stepInstructions,
									messages: (_e = prepareStepResult == null ? void 0 : prepareStepResult.messages) != null ? _e : stepInputMessages
								},
								supportedUrls: await stepModel.supportedUrls,
								download: download2,
								provider: stepModel.provider.split(".")[0]
							});
							runtimeContext = (_f = prepareStepResult == null ? void 0 : prepareStepResult.runtimeContext) != null ? _f : runtimeContext;
							toolsContext = (_g = prepareStepResult == null ? void 0 : prepareStepResult.toolsContext) != null ? _g : toolsContext;
							const { executionTools: stepExecutionTools, modelTools: stepModelTools } = prepareToolsForToolCallers({
								tools: filterActiveTools({
									tools,
									activeTools: (_h = prepareStepResult == null ? void 0 : prepareStepResult.activeTools) != null ? _h : activeTools
								}),
								toolCallers: resolvedToolCallers
							});
							const stepToolOrder = (_i = prepareStepResult == null ? void 0 : prepareStepResult.toolOrder) != null ? _i : toolOrder;
							const stepTools = await prepareTools({
								tools: stepModelTools,
								toolOrder: stepToolOrder,
								toolsContext,
								experimental_sandbox: stepSandbox
							});
							const stepToolChoice = prepareToolChoice({ toolChoice: (_j = prepareStepResult == null ? void 0 : prepareStepResult.toolChoice) != null ? _j : toolChoice });
							const stepMessages = (_k = prepareStepResult == null ? void 0 : prepareStepResult.messages) != null ? _k : stepInputMessages;
							const stepProviderOptions = mergeObjects(providerOptions, prepareStepResult == null ? void 0 : prepareStepResult.providerOptions);
							const stepCallSettings = prepareStepCallSettings({
								callSettings: callSettings2,
								stepSettings: prepareStepResult
							});
							await notify({
								event: {
									callId,
									provider: stepModel.provider,
									modelId: stepModel.modelId,
									stepNumber,
									instructions: stepInstructions,
									messages: stepMessages,
									tools,
									toolChoice: (_l = prepareStepResult == null ? void 0 : prepareStepResult.toolChoice) != null ? _l : toolChoice,
									activeTools: (_m = prepareStepResult == null ? void 0 : prepareStepResult.activeTools) != null ? _m : activeTools,
									toolOrder: stepToolOrder,
									steps: [...steps],
									providerOptions: stepProviderOptions,
									output,
									runtimeContext,
									promptMessages,
									stepTools,
									stepToolChoice,
									toolsContext
								},
								callbacks: [resolvedOnStepStart, telemetryDispatcher.onStepStart]
							});
							const languageModelCallContext = {
								provider: stepModel.provider,
								modelId: stepModel.modelId,
								instructions: stepInstructions,
								messages: stepMessages,
								tools: stepTools,
								...stepCallSettings
							};
							const languageModelCallStartEvent = {
								callId,
								...languageModelCallContext
							};
							const stepStartTimestampMs = now2();
							await notify({
								event: languageModelCallStartEvent,
								callbacks: [resolvedOnLanguageModelCallStart, telemetryDispatcher.onLanguageModelCallStart]
							});
							const executeLanguageModelCallInTelemetryContext = (_n = telemetryDispatcher.executeLanguageModelCall) != null ? _n : (async ({ execute }) => await execute());
							currentModelResponse = await retry(async () => {
								var _a28, _b27, _c3, _d3, _e2, _f2, _g2, _h2;
								const result = await executeLanguageModelCallInTelemetryContext({
									...languageModelCallStartEvent,
									execute: async () => await stepModel.doGenerate({
										...stepCallSettings,
										tools: stepTools,
										toolChoice: stepToolChoice,
										responseFormat: await (output == null ? void 0 : output.responseFormat),
										prompt: promptMessages,
										providerOptions: stepProviderOptions,
										abortSignal: mergedAbortSignal,
										headers: headersWithUserAgent
									})
								});
								const responseData = {
									id: (_b27 = (_a28 = result.response) == null ? void 0 : _a28.id) != null ? _b27 : generateId4(),
									timestamp: (_d3 = (_c3 = result.response) == null ? void 0 : _c3.timestamp) != null ? _d3 : /* @__PURE__ */ new Date(),
									modelId: (_f2 = (_e2 = result.response) == null ? void 0 : _e2.modelId) != null ? _f2 : stepModel.modelId,
									headers: (_g2 = result.response) == null ? void 0 : _g2.headers,
									body: (_h2 = result.response) == null ? void 0 : _h2.body
								};
								return {
									...result,
									response: responseData
								};
							});
							const responseTimeMs = now2() - stepStartTimestampMs;
							const stepUsage = asLanguageModelUsage(currentModelResponse.usage);
							const stepToolCalls = await Promise.all(currentModelResponse.content.filter((part) => part.type === "tool-call").map((toolCall) => parseToolCall({
								toolCall,
								tools: stepExecutionTools,
								repairToolCall,
								refineToolInput,
								instructions: stepInstructions,
								messages: stepMessages
							})));
							const toolApprovalRequests = {};
							const stepToolApprovalResponses = {};
							const blockedToolCallIds = /* @__PURE__ */ new Set();
							const modelCallContent = convertLanguageModelContent({
								content: currentModelResponse.content,
								toolCalls: stepToolCalls,
								toolOutputs: [],
								toolApprovalRequests: [],
								toolApprovalResponses: [],
								tools
							});
							await notify({
								event: {
									callId,
									provider: stepModel.provider,
									modelId: currentModelResponse.response.modelId,
									finishReason: currentModelResponse.finishReason.unified,
									usage: stepUsage,
									content: modelCallContent,
									responseId: currentModelResponse.response.id,
									...currentModelResponse.providerMetadata != null ? { providerMetadata: currentModelResponse.providerMetadata } : {},
									performance: {
										responseTimeMs,
										effectiveOutputTokensPerSecond: calculateTokensPerSecond({
											tokens: stepUsage.outputTokens,
											durationMs: responseTimeMs
										}),
										outputTokensPerSecond: void 0,
										inputTokensPerSecond: void 0,
										effectiveTotalTokensPerSecond: calculateTokensPerSecond({
											tokens: sumTokenCounts(stepUsage.inputTokens, stepUsage.outputTokens),
											durationMs: responseTimeMs
										}),
										timeToFirstOutputMs: void 0
									}
								},
								callbacks: [resolvedOnLanguageModelCallEnd, telemetryDispatcher.onLanguageModelCallEnd]
							});
							const enforcedToolChoice = stepToolChoice.type === "required" || stepToolChoice.type === "tool" ? stepToolChoice : void 0;
							if (enforcedToolChoice != null && !stepToolCalls.some((toolCall) => enforcedToolChoice.type === "required" || toolCall.toolName === enforcedToolChoice.toolName)) throw new ToolChoiceViolationError({
								toolChoice: enforcedToolChoice,
								finishReason: currentModelResponse.finishReason.unified,
								provider: stepModel.provider,
								modelId: stepModel.modelId,
								content: currentModelResponse.content
							});
							for (const toolCall of stepToolCalls) {
								if (toolCall.invalid) continue;
								const tool2 = getOwn(stepExecutionTools, toolCall.toolName);
								if (tool2 == null) continue;
								if (tool2.onInputStart != null) await tool2.onInputStart({
									toolCallId: toolCall.toolCallId,
									messages: stepMessages,
									abortSignal: mergedAbortSignal,
									context: runtimeContext
								});
								if ((tool2 == null ? void 0 : tool2.onInputAvailable) != null) await tool2.onInputAvailable({
									input: toolCall.input,
									toolCallId: toolCall.toolCallId,
									messages: stepMessages,
									abortSignal: mergedAbortSignal,
									context: runtimeContext
								});
								const toolApprovalStatus = await resolveToolApproval({
									tools: stepExecutionTools,
									toolApproval,
									toolCall,
									messages: stepMessages,
									toolsContext,
									runtimeContext
								});
								if (toolApprovalStatus.type === "not-applicable") continue;
								const approvalId = generateId4();
								const signature = await maybeSignApproval({
									secret: experimental_toolApprovalSecret,
									approvalId,
									toolCallId: toolCall.toolCallId,
									toolName: toolCall.toolName,
									input: toolCall.input
								});
								switch (toolApprovalStatus.type) {
									case "user-approval":
										toolApprovalRequests[toolCall.toolCallId] = {
											type: "tool-approval-request",
											approvalId,
											toolCall,
											...toolApprovalStatus.reason != null ? { reason: toolApprovalStatus.reason } : {},
											...signature != null ? { signature } : {}
										};
										blockedToolCallIds.add(toolCall.toolCallId);
										break;
									case "approved":
										toolApprovalRequests[toolCall.toolCallId] = {
											type: "tool-approval-request",
											approvalId,
											toolCall,
											isAutomatic: true,
											...signature != null ? { signature } : {}
										};
										stepToolApprovalResponses[toolCall.toolCallId] = {
											type: "tool-approval-response",
											approvalId,
											toolCall,
											approved: true,
											reason: toolApprovalStatus.reason,
											providerExecuted: toolCall.providerExecuted
										};
										break;
									case "denied":
										toolApprovalRequests[toolCall.toolCallId] = {
											type: "tool-approval-request",
											approvalId,
											toolCall,
											isAutomatic: true,
											...signature != null ? { signature } : {}
										};
										stepToolApprovalResponses[toolCall.toolCallId] = {
											type: "tool-approval-response",
											approvalId,
											toolCall,
											approved: false,
											reason: toolApprovalStatus.reason,
											providerExecuted: toolCall.providerExecuted
										};
										blockedToolCallIds.add(toolCall.toolCallId);
								}
							}
							const invalidToolCalls = stepToolCalls.filter((toolCall) => toolCall.invalid && toolCall.dynamic && !toolCall.providerExecuted);
							clientToolOutputs = [];
							for (const toolCall of invalidToolCalls) clientToolOutputs.push({
								type: "tool-error",
								toolCallId: toolCall.toolCallId,
								toolName: toolCall.toolName,
								input: toolCall.input,
								error: getErrorMessage(toolCall.error),
								dynamic: true
							});
							clientToolCalls = stepToolCalls.filter((toolCall) => !toolCall.providerExecuted);
							toolApprovalResponses = Object.values(stepToolApprovalResponses);
							deniedToolApprovalResponses = toolApprovalResponses.filter((toolApprovalResponse) => toolApprovalResponse.approved === false);
							const toolExecutionMs = {};
							if (stepExecutionTools != null && isToolExecutionAllowedFinishReason(currentModelResponse.finishReason.unified)) {
								const toolExecutionResults = await executeTools({
									toolCalls: clientToolCalls.filter((toolCall) => !toolCall.invalid && !blockedToolCallIds.has(toolCall.toolCallId)),
									tools: stepExecutionTools,
									callId,
									messages: stepMessages,
									abortSignal: mergedAbortSignal,
									timeout,
									experimental_sandbox: stepSandbox,
									toolsContext,
									onToolExecutionStart: (event) => notify({
										event,
										callbacks: [resolvedOnToolExecutionStart, telemetryDispatcher.onToolExecutionStart]
									}),
									onToolExecutionEnd: (event) => notify({
										event,
										callbacks: [resolvedOnToolExecutionEnd, telemetryDispatcher.onToolExecutionEnd]
									}),
									executeToolInTelemetryContext: telemetryDispatcher.executeTool,
									runInTracingChannelSpan
								});
								for (const result of toolExecutionResults) {
									toolExecutionMs[result.output.toolCallId] = result.toolExecutionMs;
									clientToolOutputs.push(result.output);
								}
							}
							const stepTimeMs = now2() - stepStartTimestampMs;
							const stepPerformance = {
								effectiveOutputTokensPerSecond: calculateTokensPerSecond({
									tokens: stepUsage.outputTokens,
									durationMs: responseTimeMs
								}),
								outputTokensPerSecond: void 0,
								inputTokensPerSecond: void 0,
								effectiveTotalTokensPerSecond: calculateTokensPerSecond({
									tokens: sumTokenCounts(stepUsage.inputTokens, stepUsage.outputTokens),
									durationMs: responseTimeMs
								}),
								stepTimeMs,
								responseTimeMs,
								toolExecutionMs,
								timeToFirstOutputMs: void 0
							};
							for (const toolCall of stepToolCalls) {
								if (!toolCall.providerExecuted) continue;
								const tool2 = getOwn(stepExecutionTools, toolCall.toolName);
								if ((tool2 == null ? void 0 : tool2.type) === "provider" && tool2.supportsDeferredResults) {
									if (!currentModelResponse.content.some((part) => part.type === "tool-result" && part.toolCallId === toolCall.toolCallId)) pendingDeferredToolCalls.set(toolCall.toolCallId, { toolName: toolCall.toolName });
								}
							}
							for (const part of currentModelResponse.content) if (part.type === "tool-result") pendingDeferredToolCalls.delete(part.toolCallId);
							const stepContent = convertLanguageModelContent({
								content: currentModelResponse.content,
								toolCalls: stepToolCalls,
								toolOutputs: clientToolOutputs,
								toolApprovalRequests: Object.values(toolApprovalRequests),
								toolApprovalResponses,
								tools
							});
							const stepResponseMessages = await toResponseMessages({
								content: stepContent,
								tools
							});
							const stepRequest = {
								...currentModelResponse.request,
								body: include.requestBody ? (_o = currentModelResponse.request) == null ? void 0 : _o.body : void 0,
								messages: include.requestMessages ? cloneModelMessages(stepMessages) : void 0
							};
							const stepResponse = {
								...currentModelResponse.response,
								messages: cloneModelMessages(stepResponseMessages),
								body: include.responseBody ? (_p = currentModelResponse.response) == null ? void 0 : _p.body : void 0
							};
							const currentStepResult = new DefaultStepResult({
								callId,
								stepNumber,
								provider: stepModel.provider,
								modelId: stepModel.modelId,
								runtimeContext,
								content: stepContent,
								finishReason: currentModelResponse.finishReason.unified,
								rawFinishReason: currentModelResponse.finishReason.raw,
								usage: stepUsage,
								performance: stepPerformance,
								warnings: currentModelResponse.warnings,
								providerMetadata: currentModelResponse.providerMetadata,
								request: stepRequest,
								response: stepResponse,
								toolsContext
							});
							logWarnings({
								warnings: (_q = currentModelResponse.warnings) != null ? _q : [],
								provider: stepModel.provider,
								model: stepModel.modelId
							});
							steps.push(currentStepResult);
							instructionsForNextStep = stepInstructions;
							messagesForNextStep = [...stepMessages, ...stepResponseMessages];
							await notify({
								event: currentStepResult,
								callbacks: [resolvedOnStepEnd, telemetryDispatcher.onStepEnd]
							});
							return currentStepResult;
						}
					});
				} finally {
					if (stepTimeoutId != null) clearTimeout(stepTimeoutId);
				}
			} while (clientToolOutputs.length + deniedToolApprovalResponses.length === clientToolCalls.length && (clientToolCalls.length > 0 || pendingDeferredToolCalls.size > 0) && !await isStopConditionMet({
				stopConditions,
				steps
			}));
			const lastStep = steps[steps.length - 1];
			const totalUsage = steps.reduce((totalUsage2, step) => {
				return addLanguageModelUsage(totalUsage2, step.usage);
			}, {
				inputTokens: void 0,
				inputTokenDetails: {
					noCacheTokens: void 0,
					cacheReadTokens: void 0,
					cacheWriteTokens: void 0
				},
				outputTokens: void 0,
				outputTokenDetails: {
					textTokens: void 0,
					reasoningTokens: void 0
				},
				totalTokens: void 0
			});
			const files = steps.flatMap((step) => step.files);
			const sources = steps.flatMap((step) => step.sources);
			const toolCalls = steps.flatMap((step) => step.toolCalls);
			const staticToolCalls = steps.flatMap((step) => step.staticToolCalls);
			const dynamicToolCalls = steps.flatMap((step) => step.dynamicToolCalls);
			const toolResults = steps.flatMap((step) => step.toolResults);
			const staticToolResults = steps.flatMap((step) => step.staticToolResults);
			const dynamicToolResults = steps.flatMap((step) => step.dynamicToolResults);
			const warnings = steps.flatMap((step) => {
				var _a27;
				return (_a27 = step.warnings) != null ? _a27 : [];
			});
			await notify({
				event: {
					callId,
					stepNumber: lastStep.stepNumber,
					model: lastStep.model,
					runtimeContext: lastStep.runtimeContext,
					finishReason: lastStep.finishReason,
					rawFinishReason: lastStep.rawFinishReason,
					usage: totalUsage,
					totalUsage,
					content: steps.flatMap((step) => step.content),
					text: lastStep.text,
					reasoning: lastStep.reasoning,
					reasoningText: lastStep.reasoningText,
					files,
					sources,
					toolCalls,
					staticToolCalls,
					dynamicToolCalls,
					toolResults,
					staticToolResults,
					dynamicToolResults,
					responseMessages: [...initialResponseMessages, ...steps.flatMap((step) => step.response.messages)],
					warnings,
					request: lastStep.request,
					response: lastStep.response,
					providerMetadata: lastStep.providerMetadata,
					steps,
					finalStep: lastStep,
					toolsContext
				},
				callbacks: [onEnd, telemetryDispatcher.onEnd]
			});
			let resolvedOutput;
			if (lastStep.finishReason === "stop" || lastStep.finishReason !== "tool-calls" && lastStep.text.length > 0) resolvedOutput = await (output != null ? output : text()).parseCompleteOutput({ text: lastStep.text }, {
				response: lastStep.response,
				usage: lastStep.usage,
				finishReason: lastStep.finishReason
			});
			return new DefaultGenerateTextResult({
				initialResponseMessages,
				steps,
				totalUsage,
				output: resolvedOutput
			});
		} catch (error) {
			await ((_a26 = telemetryDispatcher.onError) == null ? void 0 : _a26.call(telemetryDispatcher, {
				callId,
				error
			}));
			throw wrapGatewayError(error);
		}
	};
	return await runInTracingChannelSpan({
		type: "generateText",
		event: generateTextStartEvent,
		execute: executeGenerateText
	});
}
async function executeTools({ toolCalls, tools, callId, messages, abortSignal, timeout, experimental_sandbox: sandbox, toolsContext, onToolExecutionStart, onToolExecutionEnd, executeToolInTelemetryContext, runInTracingChannelSpan }) {
	return (await Promise.all(toolCalls.map(async (toolCall) => await executeToolCall({
		toolCall,
		tools,
		callId,
		messages,
		abortSignal,
		timeout,
		experimental_sandbox: sandbox,
		toolsContext,
		onToolExecutionStart,
		onToolExecutionEnd,
		executeToolInTelemetryContext,
		runInTracingChannelSpan
	})))).filter((result) => result != null);
}
var DefaultGenerateTextResult = class {
	constructor(options) {
		this.initialResponseMessages = options.initialResponseMessages;
		this.steps = options.steps;
		this._output = options.output;
		this.totalUsage = options.totalUsage;
	}
	get finalStep() {
		return this.steps.at(-1);
	}
	get content() {
		return this.steps.flatMap((step) => step.content);
	}
	get text() {
		return this.finalStep.text;
	}
	get files() {
		return this.steps.flatMap((step) => step.files);
	}
	get reasoningText() {
		return this.finalStep.reasoningText;
	}
	get reasoning() {
		return convertToReasoningOutputs(this.finalStep.reasoning);
	}
	get toolCalls() {
		return this.steps.flatMap((step) => step.toolCalls);
	}
	get staticToolCalls() {
		return this.steps.flatMap((step) => step.staticToolCalls);
	}
	get dynamicToolCalls() {
		return this.steps.flatMap((step) => step.dynamicToolCalls);
	}
	get toolResults() {
		return this.steps.flatMap((step) => step.toolResults);
	}
	get staticToolResults() {
		return this.steps.flatMap((step) => step.staticToolResults);
	}
	get dynamicToolResults() {
		return this.steps.flatMap((step) => step.dynamicToolResults);
	}
	get sources() {
		return this.steps.flatMap((step) => step.sources);
	}
	get finishReason() {
		return this.finalStep.finishReason;
	}
	get rawFinishReason() {
		return this.finalStep.rawFinishReason;
	}
	get warnings() {
		return this.steps.flatMap((step) => {
			var _a25;
			return (_a25 = step.warnings) != null ? _a25 : [];
		});
	}
	get providerMetadata() {
		return this.finalStep.providerMetadata;
	}
	get response() {
		return this.finalStep.response;
	}
	get responseMessages() {
		return [...this.initialResponseMessages, ...this.steps.flatMap((step) => step.response.messages)];
	}
	get request() {
		return this.finalStep.request;
	}
	get usage() {
		return this.totalUsage;
	}
	get output() {
		if (this._output == null) throw new NoOutputGeneratedError();
		return this._output;
	}
};
function prepareHeaders(headers, defaultHeaders) {
	const responseHeaders = new Headers(headers != null ? headers : {});
	for (const [key, value] of Object.entries(defaultHeaders)) if (!responseHeaders.has(key)) responseHeaders.set(key, value);
	return responseHeaders;
}
function createTextStreamResponse({ status, statusText, headers, stream }) {
	return new Response(stream.pipeThrough(new TextEncoderStream()), {
		status: status != null ? status : 200,
		statusText,
		headers: prepareHeaders(headers, { "content-type": "text/plain; charset=utf-8" })
	});
}
function writeToServerResponse({ response, status, statusText, headers, stream }) {
	const statusCode = status != null ? status : 200;
	if (statusText !== void 0) response.writeHead(statusCode, statusText, headers);
	else response.writeHead(statusCode, headers);
	const reader = stream.getReader();
	const read = async () => {
		try {
			while (true) {
				const { done, value } = await reader.read();
				if (done) break;
				const canContinue = response.write(value);
				const flush = response.flush;
				if (typeof flush === "function") flush.call(response);
				if (!canContinue) await new Promise((resolve3) => {
					response.once("drain", resolve3);
				});
			}
		} catch (error) {
			throw error;
		} finally {
			response.end();
		}
	};
	return read();
}
function pipeTextStreamToResponse({ response, status, statusText, headers, stream }) {
	return writeToServerResponse({
		response,
		status,
		statusText,
		headers: Object.fromEntries(prepareHeaders(headers, { "content-type": "text/plain; charset=utf-8" }).entries()),
		stream: stream.pipeThrough(new TextEncoderStream())
	});
}
function toTextStream({ stream }) {
	return stream.pipeThrough(new TransformStream({ transform(part, controller) {
		if (part.type === "text-delta") controller.enqueue(part.text);
	} }));
}
var JsonToSseTransformStream = class extends TransformStream {
	constructor() {
		super({
			transform(part, controller) {
				controller.enqueue(`data: ${JSON.stringify(part)}

`);
			},
			flush(controller) {
				controller.enqueue("data: [DONE]\n\n");
			}
		});
	}
};
var UI_MESSAGE_STREAM_HEADERS = {
	"content-type": "text/event-stream",
	"cache-control": "no-cache",
	connection: "keep-alive",
	"x-vercel-ai-ui-message-stream": "v1",
	"x-accel-buffering": "no"
};
function createUIMessageStreamResponse({ status, statusText, headers, stream, consumeSseStream }) {
	let sseStream = stream.pipeThrough(new JsonToSseTransformStream());
	if (consumeSseStream) {
		const [stream1, stream2] = sseStream.tee();
		sseStream = stream1;
		consumeSseStream({ stream: stream2 });
	}
	return new Response(sseStream.pipeThrough(new TextEncoderStream()), {
		status,
		statusText,
		headers: prepareHeaders(headers, UI_MESSAGE_STREAM_HEADERS)
	});
}
function pipeUIMessageStreamToResponse({ response, status, statusText, headers, stream, consumeSseStream }) {
	let sseStream = stream.pipeThrough(new JsonToSseTransformStream());
	if (consumeSseStream) {
		const [stream1, stream2] = sseStream.tee();
		sseStream = stream1;
		consumeSseStream({ stream: stream2 });
	}
	return writeToServerResponse({
		response,
		status,
		statusText,
		headers: Object.fromEntries(prepareHeaders(headers, UI_MESSAGE_STREAM_HEADERS).entries()),
		stream: sseStream.pipeThrough(new TextEncoderStream())
	});
}
function getResponseUIMessageId({ originalMessages, responseMessageId }) {
	if (originalMessages == null) return;
	const lastMessage = originalMessages[originalMessages.length - 1];
	return (lastMessage == null ? void 0 : lastMessage.role) === "assistant" ? lastMessage.id : typeof responseMessageId === "function" ? responseMessageId() : responseMessageId;
}
var toolMetadataSchema = z.record(z.string(), jsonValueSchema.optional());
lazySchema(() => zodSchema(z.union([
	z.looseObject({
		type: z.literal("text-start"),
		id: z.string(),
		providerMetadata: providerMetadataSchema.optional()
	}),
	z.looseObject({
		type: z.literal("text-delta"),
		id: z.string(),
		delta: z.string(),
		providerMetadata: providerMetadataSchema.optional()
	}),
	z.looseObject({
		type: z.literal("text-end"),
		id: z.string(),
		providerMetadata: providerMetadataSchema.optional()
	}),
	z.looseObject({
		type: z.literal("error"),
		errorText: z.string()
	}),
	z.looseObject({
		type: z.literal("tool-input-start"),
		toolCallId: z.string(),
		toolName: z.string(),
		providerExecuted: z.boolean().optional(),
		providerMetadata: providerMetadataSchema.optional(),
		toolMetadata: toolMetadataSchema.optional(),
		dynamic: z.boolean().optional(),
		title: z.string().optional()
	}),
	z.looseObject({
		type: z.literal("tool-input-delta"),
		toolCallId: z.string(),
		inputTextDelta: z.string()
	}),
	z.looseObject({
		type: z.literal("tool-input-available"),
		toolCallId: z.string(),
		toolName: z.string(),
		input: z.unknown(),
		providerExecuted: z.boolean().optional(),
		providerMetadata: providerMetadataSchema.optional(),
		toolMetadata: toolMetadataSchema.optional(),
		dynamic: z.boolean().optional(),
		title: z.string().optional()
	}),
	z.looseObject({
		type: z.literal("tool-input-error"),
		toolCallId: z.string(),
		toolName: z.string(),
		input: z.unknown(),
		providerExecuted: z.boolean().optional(),
		providerMetadata: providerMetadataSchema.optional(),
		toolMetadata: toolMetadataSchema.optional(),
		dynamic: z.boolean().optional(),
		errorText: z.string(),
		title: z.string().optional()
	}),
	z.looseObject({
		type: z.literal("tool-approval-request"),
		approvalId: z.string(),
		toolCallId: z.string(),
		approvalDescriptor: z.unknown().optional(),
		reason: z.string().optional(),
		isAutomatic: z.boolean().optional(),
		signature: z.string().optional()
	}),
	z.looseObject({
		type: z.literal("tool-approval-response"),
		approvalId: z.string(),
		approved: z.boolean(),
		reason: z.string().optional(),
		providerExecuted: z.boolean().optional(),
		providerMetadata: providerMetadataSchema.optional()
	}),
	z.looseObject({
		type: z.literal("tool-output-available"),
		toolCallId: z.string(),
		output: z.unknown(),
		providerExecuted: z.boolean().optional(),
		providerMetadata: providerMetadataSchema.optional(),
		toolMetadata: toolMetadataSchema.optional(),
		dynamic: z.boolean().optional(),
		preliminary: z.boolean().optional()
	}),
	z.looseObject({
		type: z.literal("tool-output-error"),
		toolCallId: z.string(),
		errorText: z.string(),
		providerExecuted: z.boolean().optional(),
		providerMetadata: providerMetadataSchema.optional(),
		toolMetadata: toolMetadataSchema.optional(),
		dynamic: z.boolean().optional()
	}),
	z.looseObject({
		type: z.literal("tool-output-denied"),
		toolCallId: z.string()
	}),
	z.looseObject({
		type: z.literal("reasoning-start"),
		id: z.string(),
		providerMetadata: providerMetadataSchema.optional()
	}),
	z.looseObject({
		type: z.literal("reasoning-delta"),
		id: z.string(),
		delta: z.string(),
		providerMetadata: providerMetadataSchema.optional()
	}),
	z.looseObject({
		type: z.literal("reasoning-end"),
		id: z.string(),
		providerMetadata: providerMetadataSchema.optional()
	}),
	z.looseObject({
		type: z.literal("custom"),
		kind: z.string().transform((value) => value),
		providerMetadata: providerMetadataSchema.optional()
	}),
	z.looseObject({
		type: z.literal("source-url"),
		sourceId: z.string(),
		url: z.string(),
		title: z.string().optional(),
		providerMetadata: providerMetadataSchema.optional()
	}),
	z.looseObject({
		type: z.literal("source-document"),
		sourceId: z.string(),
		mediaType: z.string(),
		title: z.string(),
		filename: z.string().optional(),
		providerMetadata: providerMetadataSchema.optional()
	}),
	z.looseObject({
		type: z.literal("file"),
		url: z.string(),
		mediaType: z.string(),
		providerMetadata: providerMetadataSchema.optional()
	}),
	z.looseObject({
		type: z.literal("reasoning-file"),
		url: z.string(),
		mediaType: z.string(),
		providerMetadata: providerMetadataSchema.optional()
	}),
	z.looseObject({
		type: z.custom((value) => typeof value === "string" && value.startsWith("data-"), { message: "Type must start with \"data-\"" }),
		id: z.string().optional(),
		data: z.unknown(),
		transient: z.boolean().optional()
	}),
	z.looseObject({ type: z.literal("start-step") }),
	z.looseObject({ type: z.literal("finish-step") }),
	z.looseObject({ type: z.literal("reset-step") }),
	z.looseObject({
		type: z.literal("start"),
		messageId: z.string().optional(),
		messageMetadata: z.unknown().optional()
	}),
	z.looseObject({
		type: z.literal("finish"),
		finishReason: z.enum([
			"stop",
			"length",
			"content-filter",
			"tool-calls",
			"error",
			"other"
		]).optional(),
		messageMetadata: z.unknown().optional()
	}),
	z.looseObject({
		type: z.literal("abort"),
		reason: z.string().optional()
	}),
	z.looseObject({
		type: z.literal("message-metadata"),
		messageMetadata: z.unknown()
	})
])));
function isDataUIMessageChunk(chunk) {
	return chunk.type.startsWith("data-");
}
function createIdMap() {
	return /* @__PURE__ */ Object.create(null);
}
function isStaticToolUIPart(part) {
	return part.type.startsWith("tool-");
}
function isDynamicToolUIPart(part) {
	return part.type === "dynamic-tool";
}
function isToolUIPart(part) {
	return isStaticToolUIPart(part) || isDynamicToolUIPart(part);
}
function getStaticToolName(part) {
	return part.type.split("-").slice(1).join("-");
}
function createStreamingUIMessageState({ lastMessage, messageId }) {
	return {
		message: (lastMessage == null ? void 0 : lastMessage.role) === "assistant" ? lastMessage : {
			id: messageId,
			metadata: void 0,
			role: "assistant",
			parts: []
		},
		activeTextParts: createIdMap(),
		activeReasoningParts: createIdMap(),
		partialToolCalls: createIdMap()
	};
}
function processUIMessageStream({ stream, messageMetadataSchema, dataPartSchemas, runUpdateMessageJob, onError, onToolCall, onData }) {
	return stream.pipeThrough(new TransformStream({ async transform(chunk, controller) {
		await runUpdateMessageJob(async ({ state, write }) => {
			var _a25, _b25, _c, _d;
			function getCurrentStepParts() {
				const parts = state.message.parts;
				let currentStepStartIndex = parts.length - 1;
				while (currentStepStartIndex >= 0 && parts[currentStepStartIndex].type !== "step-start") currentStepStartIndex--;
				return parts.slice(currentStepStartIndex + 1);
			}
			function getCurrentStepToolInvocations() {
				return getCurrentStepParts().filter(isToolUIPart);
			}
			function getToolInvocation(toolCallId) {
				let toolInvocation = getCurrentStepToolInvocations().find((invocation) => invocation.toolCallId === toolCallId);
				if (toolInvocation == null) {
					const parts = state.message.parts;
					for (let i = parts.length - 1; i >= 0; i--) {
						const part = parts[i];
						if (isToolUIPart(part) && part.toolCallId === toolCallId) {
							toolInvocation = part;
							break;
						}
					}
				}
				if (toolInvocation == null) throw new UIMessageStreamError({
					chunkType: "tool-invocation",
					chunkId: toolCallId,
					message: `No tool invocation found for tool call ID "${toolCallId}".`
				});
				return toolInvocation;
			}
			function getToolInvocationByApprovalId(approvalId) {
				const toolInvocation = state.message.parts.filter(isToolUIPart).find((invocation) => {
					var _a26;
					return ((_a26 = invocation.approval) == null ? void 0 : _a26.id) === approvalId;
				});
				if (toolInvocation == null) throw new UIMessageStreamError({
					chunkType: "tool-approval-response",
					chunkId: approvalId,
					message: `No tool invocation found for approval ID "${approvalId}".`
				});
				return toolInvocation;
			}
			function updateToolPart(options, existingPart) {
				var _a26;
				const part = existingPart != null ? existingPart : getCurrentStepParts().find((part2) => isStaticToolUIPart(part2) && part2.toolCallId === options.toolCallId);
				const anyOptions = options;
				const anyPart = part;
				if (part != null) {
					part.state = options.state;
					anyPart.input = anyOptions.input;
					anyPart.output = anyOptions.output;
					anyPart.errorText = anyOptions.errorText;
					anyPart.rawInput = anyOptions.rawInput;
					anyPart.preliminary = anyOptions.preliminary;
					if (options.title !== void 0) anyPart.title = options.title;
					if (options.toolMetadata !== void 0) anyPart.toolMetadata = options.toolMetadata;
					anyPart.providerExecuted = (_a26 = anyOptions.providerExecuted) != null ? _a26 : part.providerExecuted;
					const providerMetadata = anyOptions.providerMetadata;
					if (providerMetadata != null) {
						if (options.state === "output-available" || options.state === "output-error") {
							const resultPart = part;
							resultPart.resultProviderMetadata = providerMetadata;
						} else part.callProviderMetadata = providerMetadata;
					}
				} else state.message.parts.push({
					type: `tool-${options.toolName}`,
					toolCallId: options.toolCallId,
					state: options.state,
					title: options.title,
					...options.toolMetadata !== void 0 ? { toolMetadata: options.toolMetadata } : {},
					input: anyOptions.input,
					output: anyOptions.output,
					rawInput: anyOptions.rawInput,
					errorText: anyOptions.errorText,
					providerExecuted: anyOptions.providerExecuted,
					preliminary: anyOptions.preliminary,
					...anyOptions.providerMetadata != null && (options.state === "output-available" || options.state === "output-error") ? { resultProviderMetadata: anyOptions.providerMetadata } : {},
					...anyOptions.providerMetadata != null && !(options.state === "output-available" || options.state === "output-error") ? { callProviderMetadata: anyOptions.providerMetadata } : {}
				});
			}
			function updateDynamicToolPart(options, existingPart) {
				var _a26, _b26;
				const part = existingPart != null ? existingPart : getCurrentStepParts().find((part2) => part2.type === "dynamic-tool" && part2.toolCallId === options.toolCallId);
				const anyOptions = options;
				const anyPart = part;
				if (part != null) {
					part.state = options.state;
					anyPart.toolName = options.toolName;
					anyPart.input = anyOptions.input;
					anyPart.output = anyOptions.output;
					anyPart.errorText = anyOptions.errorText;
					anyPart.rawInput = (_a26 = anyOptions.rawInput) != null ? _a26 : anyPart.rawInput;
					anyPart.preliminary = anyOptions.preliminary;
					if (options.title !== void 0) anyPart.title = options.title;
					if (options.toolMetadata !== void 0) anyPart.toolMetadata = options.toolMetadata;
					anyPart.providerExecuted = (_b26 = anyOptions.providerExecuted) != null ? _b26 : part.providerExecuted;
					const providerMetadata = anyOptions.providerMetadata;
					if (providerMetadata != null) {
						if (options.state === "output-available" || options.state === "output-error") {
							const resultPart = part;
							resultPart.resultProviderMetadata = providerMetadata;
						} else part.callProviderMetadata = providerMetadata;
					}
				} else state.message.parts.push({
					type: "dynamic-tool",
					toolName: options.toolName,
					toolCallId: options.toolCallId,
					state: options.state,
					input: anyOptions.input,
					output: anyOptions.output,
					errorText: anyOptions.errorText,
					preliminary: anyOptions.preliminary,
					providerExecuted: anyOptions.providerExecuted,
					title: options.title,
					...options.toolMetadata !== void 0 ? { toolMetadata: options.toolMetadata } : {},
					...anyOptions.providerMetadata != null && (options.state === "output-available" || options.state === "output-error") ? { resultProviderMetadata: anyOptions.providerMetadata } : {},
					...anyOptions.providerMetadata != null && !(options.state === "output-available" || options.state === "output-error") ? { callProviderMetadata: anyOptions.providerMetadata } : {}
				});
			}
			async function updateMessageMetadata(metadata) {
				if (metadata != null) {
					const mergedMetadata = state.message.metadata != null ? mergeObjects(state.message.metadata, metadata) : metadata;
					if (messageMetadataSchema != null) await validateTypes({
						value: mergedMetadata,
						schema: messageMetadataSchema,
						context: {
							field: "message.metadata",
							entityId: state.message.id
						}
					});
					state.message.metadata = mergedMetadata;
				}
			}
			switch (chunk.type) {
				case "text-start": {
					const textPart = {
						type: "text",
						text: "",
						providerMetadata: chunk.providerMetadata,
						state: "streaming"
					};
					state.activeTextParts[chunk.id] = textPart;
					state.message.parts.push(textPart);
					write();
					break;
				}
				case "text-delta": {
					const textPart = state.activeTextParts[chunk.id];
					if (textPart == null) throw new UIMessageStreamError({
						chunkType: "text-delta",
						chunkId: chunk.id,
						message: `Received text-delta for missing text part with ID "${chunk.id}". Ensure a "text-start" chunk is sent before any "text-delta" chunks.`
					});
					textPart.text += chunk.delta;
					textPart.providerMetadata = (_a25 = chunk.providerMetadata) != null ? _a25 : textPart.providerMetadata;
					write();
					break;
				}
				case "text-end": {
					const textPart = state.activeTextParts[chunk.id];
					if (textPart == null) throw new UIMessageStreamError({
						chunkType: "text-end",
						chunkId: chunk.id,
						message: `Received text-end for missing text part with ID "${chunk.id}". Ensure a "text-start" chunk is sent before any "text-end" chunks.`
					});
					textPart.state = "done";
					textPart.providerMetadata = (_b25 = chunk.providerMetadata) != null ? _b25 : textPart.providerMetadata;
					delete state.activeTextParts[chunk.id];
					write();
					break;
				}
				case "custom": {
					const customPart = {
						type: "custom",
						kind: chunk.kind,
						providerMetadata: chunk.providerMetadata
					};
					state.message.parts.push(customPart);
					write();
					break;
				}
				case "reasoning-start": {
					const reasoningPart = {
						type: "reasoning",
						id: chunk.id,
						text: "",
						providerMetadata: chunk.providerMetadata,
						state: "streaming"
					};
					state.activeReasoningParts[chunk.id] = reasoningPart;
					state.message.parts.push(reasoningPart);
					write();
					break;
				}
				case "reasoning-delta": {
					const reasoningPart = state.activeReasoningParts[chunk.id];
					if (reasoningPart == null) throw new UIMessageStreamError({
						chunkType: "reasoning-delta",
						chunkId: chunk.id,
						message: `Received reasoning-delta for missing reasoning part with ID "${chunk.id}". Ensure a "reasoning-start" chunk is sent before any "reasoning-delta" chunks.`
					});
					reasoningPart.text += chunk.delta;
					reasoningPart.providerMetadata = (_c = chunk.providerMetadata) != null ? _c : reasoningPart.providerMetadata;
					write();
					break;
				}
				case "reasoning-end": {
					const reasoningPart = state.activeReasoningParts[chunk.id];
					if (reasoningPart == null) throw new UIMessageStreamError({
						chunkType: "reasoning-end",
						chunkId: chunk.id,
						message: `Received reasoning-end for missing reasoning part with ID "${chunk.id}". Ensure a "reasoning-start" chunk is sent before any "reasoning-end" chunks.`
					});
					reasoningPart.providerMetadata = (_d = chunk.providerMetadata) != null ? _d : reasoningPart.providerMetadata;
					reasoningPart.state = "done";
					delete state.activeReasoningParts[chunk.id];
					write();
					break;
				}
				case "file":
				case "reasoning-file":
					state.message.parts.push({
						type: chunk.type,
						mediaType: chunk.mediaType,
						url: chunk.url,
						...chunk.providerMetadata != null ? { providerMetadata: chunk.providerMetadata } : {}
					});
					write();
					break;
				case "source-url":
					state.message.parts.push({
						type: "source-url",
						sourceId: chunk.sourceId,
						url: chunk.url,
						title: chunk.title,
						providerMetadata: chunk.providerMetadata
					});
					write();
					break;
				case "source-document":
					state.message.parts.push({
						type: "source-document",
						sourceId: chunk.sourceId,
						mediaType: chunk.mediaType,
						title: chunk.title,
						filename: chunk.filename,
						providerMetadata: chunk.providerMetadata
					});
					write();
					break;
				case "tool-input-start": {
					const toolInvocations = getCurrentStepParts().filter(isStaticToolUIPart);
					state.partialToolCalls[chunk.toolCallId] = {
						text: "",
						toolName: chunk.toolName,
						index: toolInvocations.length,
						dynamic: chunk.dynamic,
						title: chunk.title,
						toolMetadata: chunk.toolMetadata
					};
					if (chunk.dynamic) updateDynamicToolPart({
						toolCallId: chunk.toolCallId,
						toolName: chunk.toolName,
						state: "input-streaming",
						input: void 0,
						providerExecuted: chunk.providerExecuted,
						title: chunk.title,
						toolMetadata: chunk.toolMetadata,
						providerMetadata: chunk.providerMetadata
					});
					else updateToolPart({
						toolCallId: chunk.toolCallId,
						toolName: chunk.toolName,
						state: "input-streaming",
						input: void 0,
						providerExecuted: chunk.providerExecuted,
						title: chunk.title,
						toolMetadata: chunk.toolMetadata,
						providerMetadata: chunk.providerMetadata
					});
					write();
					break;
				}
				case "tool-input-delta": {
					const partialToolCall = state.partialToolCalls[chunk.toolCallId];
					if (partialToolCall == null) throw new UIMessageStreamError({
						chunkType: "tool-input-delta",
						chunkId: chunk.toolCallId,
						message: `Received tool-input-delta for missing tool call with ID "${chunk.toolCallId}". Ensure a "tool-input-start" chunk is sent before any "tool-input-delta" chunks.`
					});
					partialToolCall.text += chunk.inputTextDelta;
					const { value: partialArgs } = await parsePartialJson(partialToolCall.text);
					if (partialToolCall.dynamic) updateDynamicToolPart({
						toolCallId: chunk.toolCallId,
						toolName: partialToolCall.toolName,
						state: "input-streaming",
						input: partialArgs,
						title: partialToolCall.title,
						toolMetadata: partialToolCall.toolMetadata
					});
					else updateToolPart({
						toolCallId: chunk.toolCallId,
						toolName: partialToolCall.toolName,
						state: "input-streaming",
						input: partialArgs,
						title: partialToolCall.title,
						toolMetadata: partialToolCall.toolMetadata
					});
					write();
					break;
				}
				case "tool-input-available":
					if (chunk.dynamic) updateDynamicToolPart({
						toolCallId: chunk.toolCallId,
						toolName: chunk.toolName,
						state: "input-available",
						input: chunk.input,
						providerExecuted: chunk.providerExecuted,
						providerMetadata: chunk.providerMetadata,
						title: chunk.title,
						toolMetadata: chunk.toolMetadata
					});
					else updateToolPart({
						toolCallId: chunk.toolCallId,
						toolName: chunk.toolName,
						state: "input-available",
						input: chunk.input,
						providerExecuted: chunk.providerExecuted,
						providerMetadata: chunk.providerMetadata,
						title: chunk.title,
						toolMetadata: chunk.toolMetadata
					});
					write();
					if (onToolCall && !chunk.providerExecuted) await onToolCall({ toolCall: chunk });
					break;
				case "tool-input-error": {
					const existingPart = getCurrentStepParts().filter(isToolUIPart).find((p) => p.toolCallId === chunk.toolCallId);
					if (existingPart != null ? existingPart.type === "dynamic-tool" : !!chunk.dynamic) updateDynamicToolPart({
						toolCallId: chunk.toolCallId,
						toolName: chunk.toolName,
						state: "output-error",
						input: chunk.input,
						errorText: chunk.errorText,
						providerExecuted: chunk.providerExecuted,
						providerMetadata: chunk.providerMetadata,
						toolMetadata: chunk.toolMetadata
					});
					else updateToolPart({
						toolCallId: chunk.toolCallId,
						toolName: chunk.toolName,
						state: "output-error",
						input: void 0,
						rawInput: chunk.input,
						errorText: chunk.errorText,
						providerExecuted: chunk.providerExecuted,
						providerMetadata: chunk.providerMetadata,
						toolMetadata: chunk.toolMetadata
					});
					write();
					break;
				}
				case "tool-approval-request": {
					const toolInvocation = getToolInvocation(chunk.toolCallId);
					toolInvocation.state = "approval-requested";
					toolInvocation.approval = {
						id: chunk.approvalId,
						...chunk.approvalDescriptor != null ? { descriptor: chunk.approvalDescriptor } : {},
						...chunk.reason != null ? { requestReason: chunk.reason } : {},
						...chunk.isAutomatic === true ? { isAutomatic: true } : {},
						...chunk.signature != null ? { signature: chunk.signature } : {}
					};
					write();
					break;
				}
				case "tool-approval-response": {
					const toolInvocation = getToolInvocationByApprovalId(chunk.approvalId);
					const approval = toolInvocation.approval == null ? { id: chunk.approvalId } : toolInvocation.approval;
					toolInvocation.state = "approval-responded";
					toolInvocation.approval = {
						...approval,
						id: chunk.approvalId,
						approved: chunk.approved,
						...chunk.reason != null ? { reason: chunk.reason } : {}
					};
					if (chunk.providerExecuted != null) toolInvocation.providerExecuted = chunk.providerExecuted;
					if (chunk.providerMetadata != null) toolInvocation.callProviderMetadata = chunk.providerMetadata;
					write();
					break;
				}
				case "tool-output-denied": {
					const toolInvocation = getToolInvocation(chunk.toolCallId);
					toolInvocation.state = "output-denied";
					write();
					break;
				}
				case "tool-output-available": {
					const toolInvocation = getToolInvocation(chunk.toolCallId);
					if (toolInvocation.type === "dynamic-tool") updateDynamicToolPart({
						toolCallId: chunk.toolCallId,
						toolName: toolInvocation.toolName,
						state: "output-available",
						input: toolInvocation.input,
						output: chunk.output,
						preliminary: chunk.preliminary,
						providerExecuted: chunk.providerExecuted,
						providerMetadata: chunk.providerMetadata,
						title: toolInvocation.title,
						toolMetadata: toolInvocation.toolMetadata
					}, toolInvocation);
					else updateToolPart({
						toolCallId: chunk.toolCallId,
						toolName: getStaticToolName(toolInvocation),
						state: "output-available",
						input: toolInvocation.input,
						output: chunk.output,
						providerExecuted: chunk.providerExecuted,
						preliminary: chunk.preliminary,
						providerMetadata: chunk.providerMetadata,
						title: toolInvocation.title,
						toolMetadata: toolInvocation.toolMetadata
					}, toolInvocation);
					write();
					break;
				}
				case "tool-output-error": {
					const toolInvocation = getToolInvocation(chunk.toolCallId);
					if (toolInvocation.type === "dynamic-tool") updateDynamicToolPart({
						toolCallId: chunk.toolCallId,
						toolName: toolInvocation.toolName,
						state: "output-error",
						input: toolInvocation.input,
						errorText: chunk.errorText,
						providerExecuted: chunk.providerExecuted,
						providerMetadata: chunk.providerMetadata,
						title: toolInvocation.title,
						toolMetadata: toolInvocation.toolMetadata
					}, toolInvocation);
					else updateToolPart({
						toolCallId: chunk.toolCallId,
						toolName: getStaticToolName(toolInvocation),
						state: "output-error",
						input: toolInvocation.input,
						rawInput: toolInvocation.rawInput,
						errorText: chunk.errorText,
						providerExecuted: chunk.providerExecuted,
						providerMetadata: chunk.providerMetadata,
						title: toolInvocation.title,
						toolMetadata: toolInvocation.toolMetadata
					}, toolInvocation);
					write();
					break;
				}
				case "start-step":
					state.message.parts.push({ type: "step-start" });
					break;
				case "finish-step": break;
				case "reset-step": {
					const currentStepParts = getCurrentStepParts();
					state.activeTextParts = createIdMap();
					state.activeReasoningParts = createIdMap();
					state.partialToolCalls = createIdMap();
					if (currentStepParts.length > 0) {
						state.message.parts.splice(state.message.parts.length - currentStepParts.length, currentStepParts.length);
						write();
					}
					break;
				}
				case "start":
					if (chunk.messageId != null) state.message.id = chunk.messageId;
					await updateMessageMetadata(chunk.messageMetadata);
					if (chunk.messageId != null || chunk.messageMetadata != null) write({ updateStatus: false });
					break;
				case "finish":
					if (chunk.finishReason != null) state.finishReason = chunk.finishReason;
					await updateMessageMetadata(chunk.messageMetadata);
					if (chunk.messageMetadata != null) write();
					break;
				case "message-metadata":
					await updateMessageMetadata(chunk.messageMetadata);
					if (chunk.messageMetadata != null) write();
					break;
				case "error":
					onError?.(new Error(chunk.errorText));
					break;
				default: if (isDataUIMessageChunk(chunk)) {
					if ((dataPartSchemas == null ? void 0 : dataPartSchemas[chunk.type]) != null) {
						const partIdx = state.message.parts.findIndex((p) => "id" in p && "data" in p && p.id === chunk.id && p.type === chunk.type);
						const actualPartIdx = partIdx >= 0 ? partIdx : state.message.parts.length;
						await validateTypes({
							value: chunk.data,
							schema: dataPartSchemas[chunk.type],
							context: {
								field: `message.parts[${actualPartIdx}].data`,
								entityName: chunk.type,
								entityId: chunk.id
							}
						});
					}
					const dataChunk = chunk;
					if (dataChunk.transient) {
						onData?.(dataChunk);
						break;
					}
					const existingUIPart = dataChunk.id != null ? state.message.parts.find((chunkArg) => dataChunk.type === chunkArg.type && dataChunk.id === chunkArg.id) : void 0;
					if (existingUIPart != null) existingUIPart.data = dataChunk.data;
					else state.message.parts.push(dataChunk);
					onData?.(dataChunk);
					write();
				}
			}
			controller.enqueue(chunk);
		});
	} }));
}
function handleUIMessageStreamFinish({ messageId, originalMessages = [], onStepEnd, onStepFinish, onEnd, onFinish, onError, stream, getOutcome }) {
	let lastMessage = originalMessages == null ? void 0 : originalMessages[originalMessages.length - 1];
	if ((lastMessage == null ? void 0 : lastMessage.role) !== "assistant") lastMessage = void 0;
	else messageId = lastMessage.id;
	let isAborted = false;
	let hasProcessingFailure = false;
	let processingError;
	const recordProcessingFailure = (error) => {
		hasProcessingFailure = true;
		processingError = error;
	};
	const idInjectedStream = stream.pipeThrough(new TransformStream({ transform(chunk, controller) {
		try {
			let outputChunk = chunk;
			if (chunk.type === "start") {
				const startChunk = chunk;
				if (startChunk.messageId == null && messageId != null) outputChunk = {
					...startChunk,
					messageId
				};
			}
			if (chunk.type === "abort") isAborted = true;
			controller.enqueue(outputChunk);
		} catch (error) {
			recordProcessingFailure(error);
			throw error;
		}
	} }));
	const resolvedOnStepEnd = onStepEnd != null ? onStepEnd : onStepFinish;
	const resolvedOnEnd = onEnd != null ? onEnd : onFinish;
	if (resolvedOnEnd == null && resolvedOnStepEnd == null) return idInjectedStream;
	const state = createStreamingUIMessageState({
		lastMessage: lastMessage ? structuredClone(lastMessage) : void 0,
		messageId: messageId != null ? messageId : ""
	});
	const runUpdateMessageJob = async (job) => {
		try {
			await job({
				state,
				write: () => {}
			});
		} catch (error) {
			recordProcessingFailure(error);
			throw error;
		}
	};
	let finishCalled = false;
	const callOnEnd = async () => {
		var _a25;
		if (finishCalled || !resolvedOnEnd) return;
		finishCalled = true;
		const isContinuation = state.message.id === (lastMessage == null ? void 0 : lastMessage.id);
		const declaredOutcome = (_a25 = getOutcome == null ? void 0 : getOutcome()) != null ? _a25 : { status: "unknown" };
		const outcome = hasProcessingFailure ? {
			status: "failed",
			error: processingError
		} : declaredOutcome.status === "unknown" && isAborted ? { status: "aborted" } : declaredOutcome;
		await resolvedOnEnd({
			isAborted: isAborted || outcome.status === "aborted",
			isContinuation,
			outcome,
			responseMessage: state.message,
			messages: [...isContinuation ? originalMessages.slice(0, -1) : originalMessages, state.message],
			finishReason: state.finishReason
		});
	};
	const callOnStepFinish = async () => {
		if (!resolvedOnStepEnd) return;
		const isContinuation = state.message.id === (lastMessage == null ? void 0 : lastMessage.id);
		try {
			await resolvedOnStepEnd({
				isContinuation,
				responseMessage: structuredClone(state.message),
				messages: [...isContinuation ? originalMessages.slice(0, -1) : originalMessages, structuredClone(state.message)]
			});
		} catch (error) {
			onError(error);
		}
	};
	return processUIMessageStream({
		stream: idInjectedStream,
		runUpdateMessageJob,
		onError
	}).pipeThrough(new TransformStream({
		async transform(chunk, controller) {
			if (chunk.type === "finish-step") await callOnStepFinish();
			controller.enqueue(chunk);
		},
		async cancel() {
			await callOnEnd();
		},
		async flush() {
			await callOnEnd();
		}
	}));
}
function toUIMessageChunk(part, { tools, sendReasoning = true, sendSources = false, sendStart = true, sendFinish = true, onError = () => "An error occurred.", messageMetadata, responseMessageId } = {}) {
	const isDynamic = (toolPart) => {
		const tool2 = tools == null ? void 0 : tools[toolPart.toolName];
		if (tool2 == null) return toolPart.dynamic;
		return (tool2 == null ? void 0 : tool2.type) === "dynamic" ? true : void 0;
	};
	const partType = part.type;
	switch (partType) {
		case "text-start": return {
			type: "text-start",
			id: part.id,
			...part.providerMetadata != null ? { providerMetadata: part.providerMetadata } : {}
		};
		case "text-delta": return {
			type: "text-delta",
			id: part.id,
			delta: part.text,
			...part.providerMetadata != null ? { providerMetadata: part.providerMetadata } : {}
		};
		case "text-end": return {
			type: "text-end",
			id: part.id,
			...part.providerMetadata != null ? { providerMetadata: part.providerMetadata } : {}
		};
		case "reasoning-start":
		case "reasoning-end":
			if (!sendReasoning) return;
			return {
				type: partType,
				id: part.id,
				...part.providerMetadata != null ? { providerMetadata: part.providerMetadata } : {}
			};
		case "reasoning-delta":
			if (!sendReasoning) return;
			return {
				type: "reasoning-delta",
				id: part.id,
				delta: part.text,
				...part.providerMetadata != null ? { providerMetadata: part.providerMetadata } : {}
			};
		case "file":
		case "reasoning-file":
			if (partType === "reasoning-file" && !sendReasoning) return;
			return {
				type: part.type,
				mediaType: part.file.mediaType,
				url: `data:${part.file.mediaType};base64,${part.file.base64}`,
				...part.providerMetadata != null ? { providerMetadata: part.providerMetadata } : {}
			};
		case "source":
			if (!sendSources) return;
			if (part.sourceType === "url") return {
				type: "source-url",
				sourceId: part.id,
				url: part.url,
				title: part.title,
				...part.providerMetadata != null ? { providerMetadata: part.providerMetadata } : {}
			};
			if (part.sourceType === "document") return {
				type: "source-document",
				sourceId: part.id,
				mediaType: part.mediaType,
				title: part.title,
				filename: part.filename,
				...part.providerMetadata != null ? { providerMetadata: part.providerMetadata } : {}
			};
			return;
		case "custom": return {
			type: "custom",
			kind: part.kind,
			...part.providerMetadata != null ? { providerMetadata: part.providerMetadata } : {}
		};
		case "tool-input-start": {
			const dynamic = isDynamic(part);
			return {
				type: "tool-input-start",
				toolCallId: part.id,
				toolName: part.toolName,
				...part.providerExecuted != null ? { providerExecuted: part.providerExecuted } : {},
				...part.providerMetadata != null ? { providerMetadata: part.providerMetadata } : {},
				...part.toolMetadata != null ? { toolMetadata: part.toolMetadata } : {},
				...dynamic != null ? { dynamic } : {},
				...part.title != null ? { title: part.title } : {}
			};
		}
		case "tool-input-delta": return {
			type: "tool-input-delta",
			toolCallId: part.id,
			inputTextDelta: part.delta
		};
		case "tool-call": {
			const dynamic = isDynamic(part);
			if (part.invalid) return {
				type: "tool-input-error",
				toolCallId: part.toolCallId,
				toolName: part.toolName,
				input: part.input,
				...part.providerExecuted != null ? { providerExecuted: part.providerExecuted } : {},
				...part.providerMetadata != null ? { providerMetadata: part.providerMetadata } : {},
				...part.toolMetadata != null ? { toolMetadata: part.toolMetadata } : {},
				...dynamic != null ? { dynamic } : {},
				errorText: onError(part.error),
				...part.title != null ? { title: part.title } : {}
			};
			return {
				type: "tool-input-available",
				toolCallId: part.toolCallId,
				toolName: part.toolName,
				input: part.input,
				...part.providerExecuted != null ? { providerExecuted: part.providerExecuted } : {},
				...part.providerMetadata != null ? { providerMetadata: part.providerMetadata } : {},
				...part.toolMetadata != null ? { toolMetadata: part.toolMetadata } : {},
				...dynamic != null ? { dynamic } : {},
				...part.title != null ? { title: part.title } : {}
			};
		}
		case "tool-approval-request": return {
			type: "tool-approval-request",
			approvalId: part.approvalId,
			toolCallId: part.toolCall.toolCallId,
			...part.reason != null ? { reason: part.reason } : {},
			...part.isAutomatic != null ? { isAutomatic: part.isAutomatic } : {},
			...part.signature != null ? { signature: part.signature } : {}
		};
		case "tool-approval-response": return {
			type: "tool-approval-response",
			approvalId: part.approvalId,
			approved: part.approved,
			...part.reason != null ? { reason: part.reason } : {},
			...part.providerExecuted != null ? { providerExecuted: part.providerExecuted } : {}
		};
		case "tool-result": {
			const dynamic = isDynamic(part);
			return {
				type: "tool-output-available",
				toolCallId: part.toolCallId,
				output: part.output === void 0 ? null : part.output,
				...part.providerExecuted != null ? { providerExecuted: part.providerExecuted } : {},
				...part.providerMetadata != null ? { providerMetadata: part.providerMetadata } : {},
				...part.toolMetadata != null ? { toolMetadata: part.toolMetadata } : {},
				...part.preliminary != null ? { preliminary: part.preliminary } : {},
				...dynamic != null ? { dynamic } : {}
			};
		}
		case "tool-error": {
			const dynamic = isDynamic(part);
			return {
				type: "tool-output-error",
				toolCallId: part.toolCallId,
				errorText: part.providerExecuted ? typeof part.error === "string" ? part.error : JSON.stringify(part.error) : onError(part.error),
				...part.providerExecuted != null ? { providerExecuted: part.providerExecuted } : {},
				...part.providerMetadata != null ? { providerMetadata: part.providerMetadata } : {},
				...part.toolMetadata != null ? { toolMetadata: part.toolMetadata } : {},
				...dynamic != null ? { dynamic } : {}
			};
		}
		case "tool-output-denied": return {
			type: "tool-output-denied",
			toolCallId: part.toolCallId
		};
		case "error": return {
			type: "error",
			errorText: onError(part.error)
		};
		case "start-step": return { type: "start-step" };
		case "finish-step": return { type: "finish-step" };
		case "start":
			if (!sendStart) return;
			return {
				type: "start",
				...messageMetadata != null ? { messageMetadata } : {},
				...responseMessageId != null ? { messageId: responseMessageId } : {}
			};
		case "finish":
			if (!sendFinish) return;
			return {
				type: "finish",
				finishReason: part.finishReason,
				...messageMetadata != null ? { messageMetadata } : {}
			};
		case "abort": return part;
		case "tool-input-end":
		case "raw": return;
		default: throw new Error(`Unknown chunk type: ${partType}`);
	}
}
function toUIMessageStream({ stream, tools, sendReasoning = true, sendSources = false, sendStart = true, sendFinish = true, onError = () => "An error occurred.", messageMetadata, originalMessages, generateMessageId, onEnd, onFinish }) {
	let outcome = { status: "unknown" };
	let hasFatalFailure = false;
	const setSourceOutcome = (newOutcome) => {
		if (!hasFatalFailure && outcome.status !== "completed" && outcome.status !== "aborted" && newOutcome.status !== "unknown" && (outcome.status === "unknown" || newOutcome.status !== "failed")) outcome = newOutcome;
	};
	const failOutcome = (error) => {
		hasFatalFailure = true;
		outcome = {
			status: "failed",
			error
		};
	};
	const responseMessageId = generateMessageId != null ? getResponseUIMessageId({
		originalMessages,
		responseMessageId: generateMessageId
	}) : void 0;
	const sourceReader = stream.getReader();
	let sourceReaderReleased = false;
	let sourceStreamCancelled = false;
	const releaseSourceReader = () => {
		if (!sourceReaderReleased) {
			sourceReader.releaseLock();
			sourceReaderReleased = true;
		}
	};
	return handleUIMessageStreamFinish({
		stream: new ReadableStream({
			async pull(controller) {
				try {
					const { done, value } = await sourceReader.read();
					if (done) {
						releaseSourceReader();
						if (!sourceStreamCancelled) controller.close();
					} else controller.enqueue(value);
				} catch (error) {
					releaseSourceReader();
					if (!sourceStreamCancelled) {
						failOutcome(error);
						controller.error(error);
					}
				}
			},
			async cancel(reason) {
				sourceStreamCancelled = true;
				if (sourceReaderReleased) return;
				try {
					await sourceReader.cancel(reason);
				} finally {
					releaseSourceReader();
				}
			}
		}).pipeThrough(new TransformStream({ transform: async (part, controller) => {
			try {
				const messageMetadataValue = messageMetadata == null ? void 0 : messageMetadata({ part });
				const uiMessageChunk = toUIMessageChunk(part, {
					tools,
					sendReasoning,
					sendSources,
					sendStart,
					sendFinish,
					onError,
					messageMetadata: messageMetadataValue,
					responseMessageId
				});
				if (uiMessageChunk != null) controller.enqueue(uiMessageChunk);
				if (messageMetadataValue != null && part.type !== "start" && part.type !== "finish") controller.enqueue({
					type: "message-metadata",
					messageMetadata: messageMetadataValue
				});
				if (part.type === "finish") setSourceOutcome({ status: "completed" });
				else if (part.type === "abort") setSourceOutcome({ status: "aborted" });
				else if (part.type === "error") setSourceOutcome({
					status: "failed",
					error: part.error
				});
			} catch (error) {
				failOutcome(error);
				throw error;
			}
		} })),
		messageId: responseMessageId != null ? responseMessageId : generateMessageId == null ? void 0 : generateMessageId(),
		originalMessages,
		onEnd: onEnd != null ? onEnd : onFinish,
		onError,
		getOutcome: () => outcome
	});
}
function createAsyncIterableStream(source) {
	return asAsyncIterableStream(source.pipeThrough(new TransformStream()));
}
function asAsyncIterableStream(stream) {
	stream[Symbol.asyncIterator] = function() {
		const reader = this.getReader();
		let finished = false;
		async function cleanup(cancelStream) {
			var _a25;
			if (finished) return;
			finished = true;
			try {
				if (cancelStream) await ((_a25 = reader.cancel) == null ? void 0 : _a25.call(reader));
			} finally {
				try {
					reader.releaseLock();
				} catch (e) {}
			}
		}
		return {
			/**
			* Reads the next chunk from the stream.
			* @returns A promise resolving to the next IteratorResult.
			*/
			async next() {
				if (finished) return {
					done: true,
					value: void 0
				};
				let result;
				try {
					result = await reader.read();
				} catch (error) {
					await cleanup(false);
					throw error;
				}
				const { done, value } = result;
				if (done) {
					await cleanup(true);
					return {
						done: true,
						value: void 0
					};
				}
				return {
					done: false,
					value
				};
			},
			/**
			* May be called on early exit (e.g., break from for-await) or after completion.
			* Ensures the stream is cancelled and resources are released.
			* @returns A promise resolving to a completed IteratorResult.
			*/
			async return() {
				await cleanup(true);
				return {
					done: true,
					value: void 0
				};
			},
			/**
			* Called on early exit with error.
			* Ensures the stream is cancelled and resources are released, then rethrows the error.
			* @param err The error to throw.
			* @returns A promise that rejects with the provided error.
			*/
			async throw(err) {
				await cleanup(true);
				throw err;
			}
		};
	};
	return stream;
}
async function consumeStream({ stream, onError, abortSignal }) {
	const reader = stream.getReader();
	const cancelOnAbort = () => {
		reader.cancel().catch(() => {});
	};
	if (abortSignal == null ? void 0 : abortSignal.aborted) cancelOnAbort();
	else abortSignal?.addEventListener("abort", cancelOnAbort, { once: true });
	try {
		while (true) {
			const { done } = await reader.read();
			if (done) break;
		}
	} catch (error) {
		onError?.(error);
	} finally {
		abortSignal?.removeEventListener("abort", cancelOnAbort);
		reader.releaseLock();
	}
}
function createResolvablePromise() {
	let resolve3;
	let reject;
	return {
		promise: new Promise((res, rej) => {
			resolve3 = res;
			reject = rej;
		}),
		resolve: resolve3,
		reject
	};
}
function createStitchableStream() {
	let innerStreams = [];
	let controller = null;
	let isClosed = false;
	let isCancelled = false;
	let waitForNewStream = createResolvablePromise();
	const terminate = () => {
		if (isCancelled) return;
		isClosed = true;
		waitForNewStream.resolve();
		innerStreams.forEach(({ reader, onCancel }) => {
			onCancel?.();
			reader.cancel();
		});
		innerStreams = [];
		controller?.close();
	};
	const processPull = async () => {
		var _a25;
		if (isCancelled) return;
		if (isClosed && innerStreams.length === 0) {
			controller?.close();
			return;
		}
		if (innerStreams.length === 0) {
			waitForNewStream = createResolvablePromise();
			await waitForNewStream.promise;
			return await processPull();
		}
		const currentStream = innerStreams[0];
		try {
			const { value, done } = await currentStream.reader.read();
			if (isCancelled) return;
			if (done) {
				innerStreams.shift();
				if (innerStreams.length === 0 && isClosed) controller?.close();
				else await processPull();
			} else controller?.enqueue(value);
		} catch (error) {
			if (isCancelled) return;
			(_a25 = currentStream.onError) == null || _a25.call(currentStream, error);
			controller?.error(error);
			innerStreams.shift();
			terminate();
		}
	};
	return {
		stream: new ReadableStream({
			start(controllerParam) {
				controller = controllerParam;
			},
			pull: processPull,
			async cancel() {
				isCancelled = true;
				isClosed = true;
				waitForNewStream.resolve();
				for (const { reader, onCancel } of innerStreams) {
					onCancel?.();
					await reader.cancel();
				}
				innerStreams = [];
			}
		}),
		addStream: (innerStream, callbacks) => {
			var _a25;
			if (isCancelled) {
				(_a25 = callbacks == null ? void 0 : callbacks.onCancel) == null || _a25.call(callbacks);
				innerStream.cancel().catch(() => {});
				return;
			}
			if (isClosed) throw new Error("Cannot add inner stream: outer stream is closed");
			innerStreams.push({
				reader: innerStream.getReader(),
				...callbacks
			});
			waitForNewStream.resolve();
		},
		/**
		* Gracefully close the outer stream. This will let the inner streams
		* finish processing and then close the outer stream.
		*/
		close: () => {
			if (isCancelled) return;
			isClosed = true;
			waitForNewStream.resolve();
			if (innerStreams.length === 0) controller?.close();
		},
		/**
		* Immediately close the outer stream. This will cancel all inner streams
		* and close the outer stream.
		*/
		terminate
	};
}
var streamRetryAttemptBoundarySymbol = /* @__PURE__ */ Symbol("streamRetryAttemptBoundary");
function createStreamRetryAttemptBoundaryPart({ warnings }) {
	return {
		[streamRetryAttemptBoundarySymbol]: true,
		warnings
	};
}
function isStreamRetryAttemptBoundaryPart(part) {
	return typeof part === "object" && part != null && streamRetryAttemptBoundarySymbol in part;
}
function executeToolsFromStream({ stream, tools, callId, messages, abortSignal, timeout, experimental_sandbox: sandbox, toolsContext, toolApproval, runtimeContext, toolApprovalSecret, generateId: generateId4, onToolExecutionStart, onToolExecutionEnd, executeToolInTelemetryContext, runInTracingChannelSpan }) {
	const toolCallsToExecute = [];
	return stream.pipeThrough(new TransformStream({ async transform(chunk, controller) {
		controller.enqueue(chunk);
		if (isStreamRetryAttemptBoundaryPart(chunk)) {
			toolCallsToExecute.length = 0;
			return;
		}
		switch (chunk.type) {
			case "tool-call": {
				if (chunk.invalid) return;
				const tool2 = getOwn(tools, chunk.toolName);
				if (tool2 == null) return;
				const toolApprovalStatus = await resolveToolApproval({
					tools,
					toolCall: chunk,
					toolApproval,
					messages,
					toolsContext,
					runtimeContext
				});
				if (toolApprovalStatus.type === "not-applicable") {
					if (tool2.execute != null && chunk.providerExecuted !== true) toolCallsToExecute.push(chunk);
					return;
				}
				const approvalId = generateId4();
				const signature = await maybeSignApproval({
					secret: toolApprovalSecret,
					approvalId,
					toolCallId: chunk.toolCallId,
					toolName: chunk.toolName,
					input: chunk.input
				});
				switch (toolApprovalStatus.type) {
					case "user-approval":
						controller.enqueue({
							type: "tool-approval-request",
							approvalId,
							toolCall: chunk,
							...toolApprovalStatus.reason != null ? { reason: toolApprovalStatus.reason } : {},
							...signature != null ? { signature } : {}
						});
						return;
					case "denied":
						controller.enqueue({
							type: "tool-approval-request",
							approvalId,
							toolCall: chunk,
							isAutomatic: true,
							...signature != null ? { signature } : {}
						});
						controller.enqueue({
							type: "tool-approval-response",
							approvalId,
							approved: false,
							toolCall: chunk,
							reason: toolApprovalStatus.reason,
							providerExecuted: chunk.providerExecuted
						});
						return;
					case "approved":
						controller.enqueue({
							type: "tool-approval-request",
							approvalId,
							toolCall: chunk,
							isAutomatic: true,
							...signature != null ? { signature } : {}
						});
						controller.enqueue({
							type: "tool-approval-response",
							approvalId,
							approved: true,
							toolCall: chunk,
							reason: toolApprovalStatus.reason,
							providerExecuted: chunk.providerExecuted
						});
				}
				if (tool2.execute != null && chunk.providerExecuted !== true) toolCallsToExecute.push(chunk);
				return;
			}
			case "model-call-end":
				if (!isToolExecutionAllowedFinishReason(chunk.finishReason)) return;
				await Promise.all(toolCallsToExecute.map(async (toolCall) => {
					try {
						const result = await executeToolCall({
							toolCall,
							tools,
							callId,
							messages,
							abortSignal,
							timeout,
							experimental_sandbox: sandbox,
							toolsContext,
							onToolExecutionStart,
							onToolExecutionEnd,
							executeToolInTelemetryContext,
							runInTracingChannelSpan,
							onPreliminaryToolResult: (result2) => {
								controller.enqueue(result2);
							}
						});
						if (result != null) {
							controller.enqueue({
								type: "tool-execution-end",
								toolCallId: result.output.toolCallId,
								toolExecutionMs: result.toolExecutionMs
							});
							controller.enqueue(result.output);
						}
					} catch (error) {
						controller.enqueue({
							type: "error",
							error
						});
					}
				}));
				return;
		}
	} }));
}
function invokeToolCallbacksFromStream({ stream, tools, stepInputMessages, abortSignal, runtimeContext }) {
	if (tools == null) return stream;
	const ongoingToolCallToolNames = createIdMap();
	return stream.pipeThrough(new TransformStream({ async transform(chunk, controller) {
		controller.enqueue(chunk);
		if (isStreamRetryAttemptBoundaryPart(chunk)) return;
		switch (chunk.type) {
			case "tool-input-start": {
				ongoingToolCallToolNames[chunk.id] = chunk.toolName;
				const tool2 = getOwn(tools, chunk.toolName);
				if ((tool2 == null ? void 0 : tool2.onInputStart) != null) await tool2.onInputStart({
					toolCallId: chunk.id,
					messages: stepInputMessages,
					abortSignal,
					context: runtimeContext
				});
				break;
			}
			case "tool-input-delta": {
				const toolName = ongoingToolCallToolNames[chunk.id];
				const tool2 = getOwn(tools, toolName);
				if ((tool2 == null ? void 0 : tool2.onInputDelta) != null) await tool2.onInputDelta({
					inputTextDelta: chunk.delta,
					toolCallId: chunk.id,
					messages: stepInputMessages,
					abortSignal,
					context: runtimeContext
				});
				break;
			}
			case "tool-call": {
				const toolName = ongoingToolCallToolNames[chunk.toolCallId];
				const tool2 = getOwn(tools, toolName);
				delete ongoingToolCallToolNames[chunk.toolCallId];
				if ((tool2 == null ? void 0 : tool2.onInputAvailable) != null) await tool2.onInputAvailable({
					input: chunk.input,
					toolCallId: chunk.toolCallId,
					messages: stepInputMessages,
					abortSignal,
					context: runtimeContext
				});
			}
		}
	} }));
}
function normalizeStreamProviderError(error) {
	var _a25, _b25, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p;
	if (isError(error) || AISDKError.isInstance(error) || StreamProviderError.isInstance(error)) return error;
	const outer = asRecord(error);
	if (outer == null) return error;
	const providerStreamError = isProviderStreamError(error);
	const details = providerStreamError ? outer : (_c = (_b25 = asRecord((_a25 = asRecord(outer.response)) == null ? void 0 : _a25.error)) != null ? _b25 : asRecord(outer.error)) != null ? _c : outer;
	if (typeof details.message !== "string") return error;
	const type = (_d = getString(details.type)) != null ? _d : getString(outer.type);
	const code = (_e = getStringOrNumber(details.code)) != null ? _e : getStringOrNumber(outer.code);
	const explicitStatusCode = (_l = (_k = (_j = (_i = (_h = (_g = (_f = getHttpStatusCode(details.statusCode)) != null ? _f : getHttpStatusCode(outer.statusCode)) != null ? _g : getHttpStatusCode(details.status_code)) != null ? _h : getHttpStatusCode(outer.status_code)) != null ? _i : getHttpStatusCode(details.status)) != null ? _j : getHttpStatusCode(outer.status)) != null ? _k : getHttpStatusCode(details.code)) != null ? _l : getHttpStatusCode(outer.code);
	const messageMetadata = inferExactMessageMetadata(details.message);
	const statusCode = explicitStatusCode != null ? explicitStatusCode : messageMetadata == null ? void 0 : messageMetadata.statusCode;
	const explicitRetryability = (_o = (_n = (_m = getBoolean(details.isRetryable)) != null ? _m : getBoolean(outer.isRetryable)) != null ? _n : getBoolean(details.is_retryable)) != null ? _o : getBoolean(outer.is_retryable);
	return new StreamProviderError({
		message: details.message,
		type,
		code,
		statusCode,
		isRetryable: (_p = explicitRetryability != null ? explicitRetryability : messageMetadata == null ? void 0 : messageMetadata.isRetryable) != null ? _p : isRetryableStatusCode2(statusCode),
		data: providerStreamError ? error.data : error
	});
}
function inferExactMessageMetadata(message) {
	switch (message.trim().toLowerCase()) {
		case "overloaded":
		case "overloaded error":
		case "model overloaded": return {
			statusCode: 503,
			isRetryable: true
		};
		case "internal server error": return {
			statusCode: 500,
			isRetryable: true
		};
		case "service unavailable": return {
			statusCode: 503,
			isRetryable: true
		};
		default: return;
	}
}
function isRetryableStatusCode2(statusCode) {
	return statusCode != null && (statusCode === 408 || statusCode === 409 || statusCode === 429 || statusCode >= 500);
}
function asRecord(value) {
	return typeof value === "object" && value != null ? value : void 0;
}
function isError(value) {
	return value instanceof Error || Object.prototype.toString.call(value) === "[object Error]";
}
function getString(value) {
	return typeof value === "string" ? value : void 0;
}
function getStringOrNumber(value) {
	return typeof value === "string" || typeof value === "number" ? value : void 0;
}
function getBoolean(value) {
	return typeof value === "boolean" ? value : void 0;
}
function getHttpStatusCode(value) {
	const statusCode = typeof value === "string" && /^\d{3}$/.test(value) ? Number(value) : value;
	return typeof statusCode === "number" && Number.isInteger(statusCode) && statusCode >= 400 && statusCode <= 599 ? statusCode : void 0;
}
var originalGenerateId2 = createIdGenerator({
	prefix: "aitxt",
	size: 24
});
var originalGenerateCallId2 = createIdGenerator({
	prefix: "call",
	size: 24
});
async function streamLanguageModelCall({ model, tools, toolOrder, output, toolChoice, prompt, system, instructions, messages, allowSystemInMessages, download: download2, abortSignal, headers, includeRawChunks, providerOptions, repairToolCall, refineToolInput, executeLanguageModelCallInTelemetryContext = async ({ execute }) => await execute(), callId, toolsContext, experimental_sandbox: sandbox, _internal: { generateId: generateId4 = originalGenerateId2, generateCallId = originalGenerateCallId2, now: now2 = now } = {}, onStart, onLanguageModelCallStart, onLanguageModelCallEnd, ...callSettings }) {
	const resolvedModel = resolveLanguageModel(model);
	const effectiveCallId = callId != null ? callId : generateCallId();
	const standardizedPrompt = await standardizePrompt({
		instructions,
		system,
		prompt,
		messages,
		allowSystemInMessages
	});
	const promptMessages = await convertToLanguageModelPrompt({
		prompt: {
			instructions: standardizedPrompt.instructions,
			messages: standardizedPrompt.messages
		},
		supportedUrls: await resolvedModel.supportedUrls,
		download: download2,
		provider: resolvedModel.provider.split(".")[0]
	});
	const stepTools = await prepareTools({
		tools,
		toolOrder,
		toolsContext,
		experimental_sandbox: sandbox
	});
	const stepToolChoice = prepareToolChoice({ toolChoice });
	await notify({
		event: { promptMessages },
		callbacks: onStart
	});
	const languageModelCallStartEvent = {
		callId: effectiveCallId,
		provider: resolvedModel.provider,
		modelId: resolvedModel.modelId,
		instructions: standardizedPrompt.instructions,
		messages: standardizedPrompt.messages,
		tools: stepTools,
		...callSettings
	};
	await notify({
		event: languageModelCallStartEvent,
		callbacks: onLanguageModelCallStart
	});
	const callStartTimestampMs = now2();
	const { stream: languageModelStream, response, request } = await executeLanguageModelCallInTelemetryContext({
		...languageModelCallStartEvent,
		execute: async () => await resolvedModel.doStream({
			...callSettings,
			tools: stepTools,
			toolChoice: stepToolChoice,
			responseFormat: await (output == null ? void 0 : output.responseFormat),
			prompt: promptMessages,
			providerOptions,
			abortSignal,
			headers,
			includeRawChunks
		})
	});
	return {
		stream: createAsyncIterableStream(languageModelStream.pipeThrough(createLanguageModelV4StreamPartToLanguageModelStreamPartTransform({
			tools,
			instructions: standardizedPrompt.instructions,
			messages: standardizedPrompt.messages,
			repairToolCall,
			refineToolInput,
			callId: effectiveCallId,
			provider: resolvedModel.provider,
			modelId: resolvedModel.modelId,
			generateId: generateId4,
			now: now2,
			callStartTimestampMs,
			onLanguageModelCallEnd
		}))),
		response,
		request
	};
}
function createLanguageModelV4StreamPartToLanguageModelStreamPartTransform({ tools, instructions, messages, repairToolCall, refineToolInput, callId, provider, modelId, generateId: generateId4, now: now2, callStartTimestampMs, onLanguageModelCallEnd }) {
	const toolCallsByToolCallId = /* @__PURE__ */ new Map();
	const modelCallContent = [];
	const textPartIndexes = /* @__PURE__ */ new Map();
	const reasoningPartIndexes = /* @__PURE__ */ new Map();
	let responseId = generateId4();
	let responseModelId = modelId;
	let timeToFirstOutputMs;
	let previousOutputChunkTimestampMs;
	const timeBetweenOutputChunksMs = [];
	return new TransformStream({ async transform(chunk, controller) {
		var _a25, _b25, _c;
		if (isOutputChunk(chunk)) {
			const outputChunkTimestampMs = now2();
			if (timeToFirstOutputMs == null) timeToFirstOutputMs = outputChunkTimestampMs - callStartTimestampMs;
			else if (previousOutputChunkTimestampMs != null) timeBetweenOutputChunksMs.push(outputChunkTimestampMs - previousOutputChunkTimestampMs);
			previousOutputChunkTimestampMs = outputChunkTimestampMs;
		}
		switch (chunk.type) {
			case "error":
				controller.enqueue({
					type: "error",
					error: normalizeStreamProviderError(chunk.error)
				});
				break;
			case "text-start":
				upsertTextContentPart({
					content: modelCallContent,
					partIndexes: textPartIndexes,
					id: chunk.id,
					type: "text",
					providerMetadata: chunk.providerMetadata
				});
				controller.enqueue(chunk);
				break;
			case "text-delta":
				upsertTextContentPart({
					content: modelCallContent,
					partIndexes: textPartIndexes,
					id: chunk.id,
					type: "text",
					textDelta: chunk.delta,
					providerMetadata: chunk.providerMetadata
				});
				controller.enqueue({
					type: "text-delta",
					id: chunk.id,
					text: chunk.delta,
					providerMetadata: chunk.providerMetadata
				});
				break;
			case "text-end":
				upsertTextContentPart({
					content: modelCallContent,
					partIndexes: textPartIndexes,
					id: chunk.id,
					type: "text",
					providerMetadata: chunk.providerMetadata
				});
				textPartIndexes.delete(chunk.id);
				controller.enqueue(chunk);
				break;
			case "reasoning-start":
				upsertTextContentPart({
					content: modelCallContent,
					partIndexes: reasoningPartIndexes,
					id: chunk.id,
					type: "reasoning",
					providerMetadata: chunk.providerMetadata
				});
				controller.enqueue(chunk);
				break;
			case "reasoning-delta":
				upsertTextContentPart({
					content: modelCallContent,
					partIndexes: reasoningPartIndexes,
					id: chunk.id,
					type: "reasoning",
					textDelta: chunk.delta,
					providerMetadata: chunk.providerMetadata
				});
				controller.enqueue({
					type: "reasoning-delta",
					id: chunk.id,
					text: chunk.delta,
					providerMetadata: chunk.providerMetadata
				});
				break;
			case "reasoning-end":
				upsertTextContentPart({
					content: modelCallContent,
					partIndexes: reasoningPartIndexes,
					id: chunk.id,
					type: "reasoning",
					providerMetadata: chunk.providerMetadata
				});
				reasoningPartIndexes.delete(chunk.id);
				controller.enqueue(chunk);
				break;
			case "file":
			case "reasoning-file": {
				const file = new DefaultGeneratedFileWithType({
					data: chunk.data.type === "data" ? chunk.data.data : chunk.data.url.toString(),
					mediaType: chunk.mediaType
				});
				modelCallContent.push({
					type: chunk.type,
					file,
					...chunk.providerMetadata != null ? { providerMetadata: chunk.providerMetadata } : {}
				});
				controller.enqueue({
					type: chunk.type,
					file,
					providerMetadata: chunk.providerMetadata
				});
				break;
			}
			case "finish": {
				const usage = asLanguageModelUsage(chunk.usage);
				const responseTimeMs = now2() - callStartTimestampMs;
				const performance = {
					responseTimeMs,
					effectiveOutputTokensPerSecond: calculateTokensPerSecond({
						tokens: usage.outputTokens,
						durationMs: responseTimeMs
					}),
					outputTokensPerSecond: timeToFirstOutputMs == null ? void 0 : calculateTokensPerSecond({
						tokens: usage.outputTokens,
						durationMs: responseTimeMs - timeToFirstOutputMs
					}),
					inputTokensPerSecond: timeToFirstOutputMs == null ? void 0 : calculateTokensPerSecond({
						tokens: usage.inputTokens,
						durationMs: timeToFirstOutputMs
					}),
					effectiveTotalTokensPerSecond: calculateTokensPerSecond({
						tokens: sumTokenCounts(usage.inputTokens, usage.outputTokens),
						durationMs: responseTimeMs
					}),
					timeToFirstOutputMs,
					timeBetweenOutputChunksMs: timeBetweenOutputChunksMs.length > 0 ? calculateOutputChunkTimingStats(timeBetweenOutputChunksMs) : void 0
				};
				await notify({
					event: {
						callId,
						provider,
						modelId: responseModelId,
						finishReason: chunk.finishReason.unified,
						usage,
						content: modelCallContent,
						responseId,
						...chunk.providerMetadata != null ? { providerMetadata: chunk.providerMetadata } : {},
						performance
					},
					callbacks: onLanguageModelCallEnd
				});
				controller.enqueue({
					type: "model-call-end",
					finishReason: chunk.finishReason.unified,
					rawFinishReason: chunk.finishReason.raw,
					usage,
					providerMetadata: chunk.providerMetadata,
					performance
				});
				break;
			}
			case "tool-call":
				try {
					const toolCall = await parseToolCall({
						toolCall: chunk,
						tools,
						repairToolCall,
						refineToolInput,
						instructions,
						messages
					});
					toolCallsByToolCallId.set(toolCall.toolCallId, toolCall);
					controller.enqueue(toolCall);
					modelCallContent.push(toolCall);
					if (toolCall.invalid) {
						if (!toolCall.providerExecuted) controller.enqueue({
							type: "tool-error",
							toolCallId: toolCall.toolCallId,
							toolName: toolCall.toolName,
							input: toolCall.input,
							error: getErrorMessage(toolCall.error),
							dynamic: true,
							title: toolCall.title,
							...toolCall.toolMetadata != null ? { toolMetadata: toolCall.toolMetadata } : {}
						});
						break;
					}
				} catch (error) {
					controller.enqueue({
						type: "error",
						error
					});
				}
				break;
			case "tool-approval-request": {
				const toolCall = toolCallsByToolCallId.get(chunk.toolCallId);
				if (toolCall == null) {
					controller.enqueue({
						type: "error",
						error: new ToolCallNotFoundForApprovalError({
							toolCallId: chunk.toolCallId,
							approvalId: chunk.approvalId
						})
					});
					break;
				}
				const toolApprovalRequest = {
					type: "tool-approval-request",
					approvalId: chunk.approvalId,
					toolCall
				};
				controller.enqueue(toolApprovalRequest);
				modelCallContent.push(toolApprovalRequest);
				break;
			}
			case "tool-result": {
				const toolName = chunk.toolName;
				const toolCall = toolCallsByToolCallId.get(chunk.toolCallId);
				const toolResultPart = chunk.isError ? {
					type: "tool-error",
					toolCallId: chunk.toolCallId,
					toolName,
					input: toolCall == null ? void 0 : toolCall.input,
					providerExecuted: true,
					error: chunk.result,
					dynamic: chunk.dynamic,
					...chunk.providerMetadata != null ? { providerMetadata: chunk.providerMetadata } : {},
					...(toolCall == null ? void 0 : toolCall.toolMetadata) != null ? { toolMetadata: toolCall.toolMetadata } : {}
				} : {
					type: "tool-result",
					toolCallId: chunk.toolCallId,
					toolName,
					input: toolCall == null ? void 0 : toolCall.input,
					output: chunk.result,
					providerExecuted: true,
					dynamic: chunk.dynamic,
					...chunk.providerMetadata != null ? { providerMetadata: chunk.providerMetadata } : {},
					...(toolCall == null ? void 0 : toolCall.toolMetadata) != null ? { toolMetadata: toolCall.toolMetadata } : {}
				};
				controller.enqueue(toolResultPart);
				modelCallContent.push(toolResultPart);
				break;
			}
			case "tool-input-start": {
				const tool2 = getOwn(tools, chunk.toolName);
				controller.enqueue({
					...chunk,
					dynamic: (_a25 = chunk.dynamic) != null ? _a25 : (tool2 == null ? void 0 : tool2.type) === "dynamic",
					title: tool2 == null ? void 0 : tool2.title,
					...(tool2 == null ? void 0 : tool2.metadata) != null ? { toolMetadata: tool2.metadata } : {}
				});
				break;
			}
			case "stream-start":
				controller.enqueue({
					type: "model-call-start",
					warnings: chunk.warnings
				});
				break;
			case "response-metadata":
				responseId = (_b25 = chunk.id) != null ? _b25 : responseId;
				responseModelId = (_c = chunk.modelId) != null ? _c : responseModelId;
				controller.enqueue({
					type: "model-call-response-metadata",
					id: chunk.id,
					timestamp: chunk.timestamp,
					modelId: chunk.modelId
				});
				break;
			default:
				if (chunk.type === "custom" || chunk.type === "source") modelCallContent.push(chunk);
				controller.enqueue(chunk);
		}
	} });
}
function isOutputChunk(chunk) {
	return chunk.type === "text-delta" && chunk.delta.length > 0 || chunk.type === "reasoning-delta" && chunk.delta.length > 0 || chunk.type === "tool-input-delta" && chunk.delta.length > 0 || chunk.type === "file" || chunk.type === "reasoning-file" || chunk.type === "tool-call";
}
function calculateOutputChunkTimingStats(timingsMs) {
	const sortedTimingsMs = [...timingsMs].sort((a, b) => a - b);
	const sum = timingsMs.reduce((sum2, timingMs) => sum2 + timingMs, 0);
	return {
		min: sortedTimingsMs[0],
		p10: calculateNearestRankPercentile(sortedTimingsMs, .1),
		median: calculateNearestRankPercentile(sortedTimingsMs, .5),
		avg: sum / timingsMs.length,
		p90: calculateNearestRankPercentile(sortedTimingsMs, .9),
		max: sortedTimingsMs[sortedTimingsMs.length - 1]
	};
}
function calculateNearestRankPercentile(sortedValues, percentile) {
	return sortedValues[Math.ceil(percentile * sortedValues.length) - 1];
}
function upsertTextContentPart({ content, partIndexes, id, type, textDelta, providerMetadata }) {
	let partIndex = partIndexes.get(id);
	if (partIndex == null) {
		partIndex = content.push({
			type,
			text: "",
			...providerMetadata != null ? { providerMetadata } : {}
		}) - 1;
		partIndexes.set(id, partIndex);
	}
	const part = content[partIndex];
	if (textDelta != null) part.text += textDelta;
	if (providerMetadata != null) part.providerMetadata = providerMetadata;
}
var originalGenerateId3 = createIdGenerator({
	prefix: "aitxt",
	size: 24
});
var originalGenerateCallId3 = createIdGenerator({
	prefix: "call",
	size: 24
});
var isOutputChunkType = {
	file: true,
	custom: false,
	source: false,
	"text-start": false,
	"text-end": false,
	"text-delta": true,
	"reasoning-start": false,
	"reasoning-end": false,
	"reasoning-delta": true,
	"reasoning-file": true,
	"tool-input-start": false,
	"tool-input-end": false,
	"tool-input-delta": true,
	"tool-approval-request": false,
	"tool-approval-response": false,
	"tool-call": true,
	"tool-result": false,
	"tool-error": false,
	"tool-execution-end": false,
	"model-call-start": false,
	"model-call-response-metadata": false,
	"model-call-end": false,
	error: false,
	raw: false
};
function isOutputChunk2(chunk) {
	if (!isOutputChunkType[chunk.type]) return false;
	switch (chunk.type) {
		case "text-delta":
		case "reasoning-delta": return chunk.text.length > 0;
		case "tool-input-delta": return chunk.delta.length > 0;
		case "file":
		case "reasoning-file":
		case "tool-call": return true;
		default: return false;
	}
}
function streamText({ model, tools, toolChoice, instructions, system, prompt, messages, allowSystemInMessages, maxRetries, streamRetries, abortSignal, timeout, headers, stopWhen = isStepCount(1), experimental_sandbox: sandbox, output, toolApproval, experimental_toolCallers, experimental_toolApprovalSecret, experimental_telemetry, telemetry = experimental_telemetry, prepareStep, providerOptions, activeTools, toolOrder, experimental_repairToolCall, repairToolCall = experimental_repairToolCall, experimental_refineToolInput: refineToolInput, experimental_transform: transform, experimental_download: download2, includeRawChunks, onChunk, onError: onErrorArg, onFinish, onEnd = onFinish, onAbort, onStepEnd, onStepFinish, onStart, experimental_onStart, onStepStart, experimental_onStepStart, onLanguageModelCallStart, experimental_onLanguageModelCallStart, onLanguageModelCallEnd, experimental_onLanguageModelCallEnd, onToolExecutionStart, onToolExecutionEnd, experimental_onToolCallStart, experimental_onToolCallFinish, runtimeContext = {}, toolsContext = {}, experimental_include, include = experimental_include, _internal: { now: now2 = now, generateId: generateId4 = originalGenerateId3, generateCallId = originalGenerateCallId3 } = {}, ...settings }) {
	var _a25, _b25, _c, _d;
	const totalTimeoutMs = getTotalTimeoutMs(timeout);
	const stepTimeoutMs = getStepTimeoutMs(timeout);
	const firstChunkTimeoutMs = getFirstChunkTimeoutMs(timeout);
	const chunkTimeoutMs = getChunkTimeoutMs(timeout);
	const stepAbortController = stepTimeoutMs != null ? new AbortController() : void 0;
	const firstChunkAbortController = firstChunkTimeoutMs != null ? new AbortController() : void 0;
	const chunkAbortController = chunkTimeoutMs != null ? new AbortController() : void 0;
	const onError = onErrorArg != null ? onErrorArg : (({ error }) => {
		console.error(error);
	});
	const resolvedOnStart = onStart != null ? onStart : experimental_onStart;
	const resolvedOnStepStart = onStepStart != null ? onStepStart : experimental_onStepStart;
	const resolvedOnLanguageModelCallStart = onLanguageModelCallStart != null ? onLanguageModelCallStart : experimental_onLanguageModelCallStart;
	const resolvedOnLanguageModelCallEnd = onLanguageModelCallEnd != null ? onLanguageModelCallEnd : experimental_onLanguageModelCallEnd;
	const resolvedOnToolExecutionStart = onToolExecutionStart != null ? onToolExecutionStart : experimental_onToolCallStart;
	const resolvedOnToolExecutionEnd = onToolExecutionEnd != null ? onToolExecutionEnd : experimental_onToolCallFinish;
	const resolvedOnStepEnd = onStepEnd != null ? onStepEnd : onStepFinish;
	return new DefaultStreamTextResult({
		model: resolveLanguageModel(model),
		telemetry,
		headers,
		settings,
		maxRetries,
		streamRetries,
		abortSignal: mergeAbortSignals(abortSignal, totalTimeoutMs, stepAbortController == null ? void 0 : stepAbortController.signal, firstChunkAbortController == null ? void 0 : firstChunkAbortController.signal, chunkAbortController == null ? void 0 : chunkAbortController.signal),
		stepTimeoutMs,
		stepAbortController,
		firstChunkTimeoutMs,
		firstChunkAbortController,
		chunkTimeoutMs,
		chunkAbortController,
		instructions,
		system,
		prompt,
		messages,
		allowSystemInMessages,
		experimental_sandbox: sandbox,
		tools,
		toolsContext,
		runtimeContext,
		toolChoice,
		transforms: asArray(transform),
		activeTools,
		toolOrder,
		repairToolCall,
		refineToolInput,
		stopConditions: asArray(stopWhen),
		output,
		toolApproval,
		experimental_toolCallers,
		experimental_toolApprovalSecret,
		providerOptions,
		prepareStep,
		timeout,
		onChunk,
		onError,
		canRetryStreamViaOnError: streamRetries !== void 0 && onErrorArg != null,
		onEnd,
		onAbort,
		onStepFinish: resolvedOnStepEnd,
		onStart: resolvedOnStart,
		onStepStart: resolvedOnStepStart,
		onLanguageModelCallStart: resolvedOnLanguageModelCallStart,
		onLanguageModelCallEnd: resolvedOnLanguageModelCallEnd,
		onToolExecutionStart: resolvedOnToolExecutionStart,
		onToolExecutionEnd: resolvedOnToolExecutionEnd,
		now: now2,
		generateId: generateId4,
		generateCallId,
		download: download2,
		include: {
			requestBody: (_a25 = include == null ? void 0 : include.requestBody) != null ? _a25 : false,
			requestMessages: (_b25 = include == null ? void 0 : include.requestMessages) != null ? _b25 : false,
			rawChunks: (_d = (_c = include == null ? void 0 : include.rawChunks) != null ? _c : includeRawChunks) != null ? _d : false
		}
	});
}
var streamRetryBoundarySymbol = /* @__PURE__ */ Symbol("streamRetryBoundary");
function isStreamRetryBoundaryPart(part) {
	return streamRetryBoundarySymbol in part;
}
async function markPromiseAsHandled(promise) {
	try {
		await promise;
	} catch (e) {}
}
function createOutputTransformStream(output) {
	let firstTextChunkId = void 0;
	let text2 = "";
	let textChunk = "";
	let textProviderMetadata = void 0;
	let lastPublishedValue = "";
	function resetAttemptState() {
		firstTextChunkId = void 0;
		text2 = "";
		textChunk = "";
		textProviderMetadata = void 0;
		lastPublishedValue = "";
	}
	function enqueueChunk({ controller, chunk }) {
		controller.enqueue(chunk);
	}
	function publishTextChunk({ controller, partialOutput = void 0 }) {
		enqueueChunk({
			controller,
			chunk: {
				part: {
					type: "text-delta",
					id: firstTextChunkId,
					text: textChunk,
					providerMetadata: textProviderMetadata
				},
				partialOutput
			}
		});
		textChunk = "";
	}
	return new TransformStream({ async transform(chunk, controller) {
		var _a25;
		if (isStreamRetryBoundaryPart(chunk)) {
			resetAttemptState();
			controller.enqueue(chunk);
			return;
		}
		if (chunk.type === "finish-step" && textChunk.length > 0) publishTextChunk({ controller });
		if (chunk.type !== "text-delta" && chunk.type !== "text-start" && chunk.type !== "text-end") {
			enqueueChunk({
				controller,
				chunk: {
					part: chunk,
					partialOutput: void 0
				}
			});
			return;
		}
		if (firstTextChunkId == null) firstTextChunkId = chunk.id;
		else if (chunk.id !== firstTextChunkId) {
			enqueueChunk({
				controller,
				chunk: {
					part: chunk,
					partialOutput: void 0
				}
			});
			return;
		}
		if (chunk.type === "text-start") {
			enqueueChunk({
				controller,
				chunk: {
					part: chunk,
					partialOutput: void 0
				}
			});
			return;
		}
		if (chunk.type === "text-end") {
			if (textChunk.length > 0) publishTextChunk({ controller });
			enqueueChunk({
				controller,
				chunk: {
					part: chunk,
					partialOutput: void 0
				}
			});
			return;
		}
		text2 += chunk.text;
		textChunk += chunk.text;
		textProviderMetadata = (_a25 = chunk.providerMetadata) != null ? _a25 : textProviderMetadata;
		if (chunk.text.length === 0 && chunk.providerMetadata != null) {
			enqueueChunk({
				controller,
				chunk: {
					part: chunk,
					partialOutput: void 0
				}
			});
			return;
		}
		const result = await output.parsePartialOutput({ text: text2 });
		if (result !== void 0) {
			const currentValue = typeof result.partial === "string" ? result.partial : JSON.stringify(result.partial);
			if (currentValue !== lastPublishedValue) {
				publishTextChunk({
					controller,
					partialOutput: result.partial
				});
				lastPublishedValue = currentValue;
			}
		}
	} });
}
function applyStreamTextTransforms({ stream, transforms, tools, stopStream }) {
	const sourceReader = stream.getReader();
	let sourceDone = false;
	let pendingBoundary;
	let transformedSegmentReader;
	const createTransformedSegmentReader = () => {
		let segment = new ReadableStream({
			async pull(controller) {
				const { done, value } = await sourceReader.read();
				if (done) {
					sourceDone = true;
					controller.close();
					return;
				}
				if (isStreamRetryBoundaryPart(value)) {
					pendingBoundary = value;
					controller.close();
					return;
				}
				controller.enqueue(value);
			},
			cancel(reason) {
				return sourceReader.cancel(reason);
			}
		}, { highWaterMark: 0 });
		for (const transform of transforms) segment = segment.pipeThrough(transform({
			tools,
			stopStream
		}));
		return segment.getReader();
	};
	return new ReadableStream({
		async pull(controller) {
			transformedSegmentReader ??= createTransformedSegmentReader();
			const { done, value } = await transformedSegmentReader.read();
			if (!done) {
				controller.enqueue(value);
				return;
			}
			transformedSegmentReader = void 0;
			if (pendingBoundary != null) {
				controller.enqueue(pendingBoundary);
				pendingBoundary = void 0;
				return;
			}
			if (sourceDone) controller.close();
		},
		async cancel(reason) {
			await (transformedSegmentReader == null ? void 0 : transformedSegmentReader.cancel(reason));
			await sourceReader.cancel(reason);
		}
	});
}
var DefaultStreamTextResult = class {
	constructor({ model, telemetry, headers, settings, maxRetries: maxRetriesArg, streamRetries: streamRetriesArg, abortSignal, stepTimeoutMs, stepAbortController, firstChunkTimeoutMs, firstChunkAbortController, chunkTimeoutMs, chunkAbortController, instructions, system, prompt, messages, allowSystemInMessages, experimental_sandbox: sandbox, tools, toolChoice, transforms, activeTools, toolOrder, repairToolCall, refineToolInput, stopConditions, output, toolApproval, experimental_toolCallers, experimental_toolApprovalSecret, providerOptions, prepareStep, now: now2, generateId: generateId4, generateCallId, timeout, onChunk, onError, canRetryStreamViaOnError, onEnd, onAbort, onStepFinish, onStart, onStepStart, onLanguageModelCallStart, onLanguageModelCallEnd, onToolExecutionStart, onToolExecutionEnd, runtimeContext, toolsContext, download: download2, include }) {
		this._totalUsage = new DelayedPromise();
		this._finishReason = new DelayedPromise();
		this._rawFinishReason = new DelayedPromise();
		this._steps = new DelayedPromise();
		this._initialResponseMessages = new DelayedPromise();
		this.outputSpecification = output;
		this.tools = tools;
		const resolvedToolCallers = resolveToolCallerConfiguration({
			tools,
			toolCallers: experimental_toolCallers
		});
		const telemetryDispatcher = createRestrictedTelemetryDispatcher({
			telemetry,
			includeRuntimeContext: telemetry == null ? void 0 : telemetry.includeRuntimeContext,
			includeToolsContext: telemetry == null ? void 0 : telemetry.includeToolsContext
		});
		let stepFinish;
		let recordedContent = [];
		let recordedFinishReason = void 0;
		let recordedRawFinishReason = void 0;
		let recordedTotalUsage = void 0;
		let recordedRequest = {};
		let recordedRequestMessages = [];
		let recordedWarnings = [];
		const recordedSteps = [];
		const initialResponseMessages = [];
		let stepMessagesForNextStep;
		let currentStepMessages = [];
		const createPartIdReserver = () => {
			const usedIds = /* @__PURE__ */ new Set();
			return (id) => {
				if (!usedIds.has(id)) {
					usedIds.add(id);
					return id;
				}
				const generatedId = generateId4();
				let uniqueId = generatedId;
				let suffix = 0;
				while (usedIds.has(uniqueId)) uniqueId = `${generatedId}-${++suffix}`;
				usedIds.add(uniqueId);
				return uniqueId;
			};
		};
		const reserveTextPartId = createPartIdReserver();
		const reserveReasoningPartId = createPartIdReserver();
		const pendingDeferredToolCalls = /* @__PURE__ */ new Map();
		let activeTextContent = createIdMap();
		let activeReasoningContent = createIdMap();
		let recordedNoOutputError;
		const errorsHandledForStreamRetry = /* @__PURE__ */ new Set();
		const eventProcessor = new TransformStream({
			async transform(chunk, controller) {
				var _a25, _b25, _c, _d, _e;
				if (isStreamRetryBoundaryPart(chunk)) {
					const retryBoundary = chunk[streamRetryBoundarySymbol];
					recordedContent = [];
					activeReasoningContent = createIdMap();
					activeTextContent = createIdMap();
					recordedRequest = retryBoundary.request;
					recordedRequestMessages = (_a25 = retryBoundary.request.messages) != null ? _a25 : [];
					recordedWarnings = retryBoundary.warnings;
					return;
				}
				const { part } = chunk;
				controller.enqueue(chunk);
				const callbacksHandledForStreamRetry = part.type === "error" && errorsHandledForStreamRetry.has(part.error);
				if (!callbacksHandledForStreamRetry) await notify({
					event: { chunk: part },
					callbacks: onChunk
				});
				if (part.type === "error") {
					const error = wrapGatewayError(part.error);
					if (NoOutputGeneratedError.isInstance(error)) recordedNoOutputError = error;
					if (callbacksHandledForStreamRetry) errorsHandledForStreamRetry.delete(part.error);
					else await notify({
						event: { error },
						callbacks: async (event) => {
							await onError(event);
						}
					});
				}
				if (part.type === "custom" || part.type === "source" || part.type === "tool-call" || part.type === "tool-approval-request" || part.type === "tool-approval-response" || part.type === "tool-error") recordedContent.push(part);
				if (part.type === "text-start") {
					activeTextContent[part.id] = {
						type: "text",
						text: "",
						providerMetadata: part.providerMetadata
					};
					recordedContent.push(activeTextContent[part.id]);
				}
				if (part.type === "text-delta") {
					const activeText = activeTextContent[part.id];
					if (activeText == null) {
						controller.enqueue({
							part: {
								type: "error",
								error: `text part ${part.id} not found`
							},
							partialOutput: void 0
						});
						return;
					}
					activeText.text += part.text;
					activeText.providerMetadata = (_b25 = part.providerMetadata) != null ? _b25 : activeText.providerMetadata;
				}
				if (part.type === "text-end") {
					const activeText = activeTextContent[part.id];
					if (activeText == null) {
						controller.enqueue({
							part: {
								type: "error",
								error: `text part ${part.id} not found`
							},
							partialOutput: void 0
						});
						return;
					}
					activeText.providerMetadata = (_c = part.providerMetadata) != null ? _c : activeText.providerMetadata;
					delete activeTextContent[part.id];
				}
				if (part.type === "reasoning-start") {
					activeReasoningContent[part.id] = {
						type: "reasoning",
						text: "",
						providerMetadata: part.providerMetadata
					};
					recordedContent.push(activeReasoningContent[part.id]);
				}
				if (part.type === "reasoning-delta") {
					const activeReasoning = activeReasoningContent[part.id];
					if (activeReasoning == null) {
						controller.enqueue({
							part: {
								type: "error",
								error: `reasoning part ${part.id} not found`
							},
							partialOutput: void 0
						});
						return;
					}
					activeReasoning.text += part.text;
					activeReasoning.providerMetadata = (_d = part.providerMetadata) != null ? _d : activeReasoning.providerMetadata;
				}
				if (part.type === "reasoning-end") {
					const activeReasoning = activeReasoningContent[part.id];
					if (activeReasoning == null) {
						controller.enqueue({
							part: {
								type: "error",
								error: `reasoning part ${part.id} not found`
							},
							partialOutput: void 0
						});
						return;
					}
					activeReasoning.providerMetadata = (_e = part.providerMetadata) != null ? _e : activeReasoning.providerMetadata;
					delete activeReasoningContent[part.id];
				}
				if (part.type === "file" || part.type === "reasoning-file") recordedContent.push({
					type: part.type,
					file: part.file,
					...part.providerMetadata != null ? { providerMetadata: part.providerMetadata } : {}
				});
				if (part.type === "tool-result" && !part.preliminary) recordedContent.push(part);
				if (part.type === "start-step") {
					recordedContent = [];
					activeReasoningContent = createIdMap();
					activeTextContent = createIdMap();
					recordedRequest = part.request;
					recordedWarnings = part.warnings;
				}
				if (part.type === "finish-step") {
					const stepResponseMessages = await toResponseMessages({
						content: recordedContent,
						tools
					});
					const currentStepResult = new DefaultStepResult({
						callId,
						stepNumber: recordedSteps.length,
						provider: model.provider,
						modelId: model.modelId,
						runtimeContext,
						toolsContext,
						content: recordedContent,
						finishReason: part.finishReason,
						rawFinishReason: part.rawFinishReason,
						usage: part.usage,
						performance: part.performance,
						warnings: recordedWarnings,
						request: {
							...recordedRequest,
							messages: include.requestMessages ? cloneModelMessages(recordedRequestMessages) : void 0
						},
						response: {
							...part.response,
							messages: cloneModelMessages(stepResponseMessages)
						},
						providerMetadata: part.providerMetadata
					});
					await notify({
						event: currentStepResult,
						callbacks: [onStepFinish, telemetryDispatcher.onStepEnd]
					});
					logWarnings({
						warnings: recordedWarnings,
						provider: model.provider,
						model: model.modelId
					});
					recordedSteps.push(currentStepResult);
					stepMessagesForNextStep = [...currentStepMessages, ...stepResponseMessages];
					stepFinish.resolve();
				}
				if (part.type === "finish") {
					recordedTotalUsage = part.totalUsage;
					recordedFinishReason = part.finishReason;
					recordedRawFinishReason = part.rawFinishReason;
				}
			},
			async flush(controller) {
				try {
					if (recordedSteps.length === 0 || recordedNoOutputError != null) {
						const error = (abortSignal == null ? void 0 : abortSignal.aborted) ? abortSignal.reason : recordedNoOutputError != null ? recordedNoOutputError : new NoOutputGeneratedError({ message: "No output generated. Check the stream for errors." });
						self.rejectResultPromises(error);
						return;
					}
					const finishReason = recordedFinishReason != null ? recordedFinishReason : "other";
					const totalUsage = recordedTotalUsage != null ? recordedTotalUsage : createNullLanguageModelUsage();
					self._finishReason.resolve(finishReason);
					self._rawFinishReason.resolve(recordedRawFinishReason);
					self._totalUsage.resolve(totalUsage);
					self._steps.resolve(recordedSteps);
					const finalStep = recordedSteps[recordedSteps.length - 1];
					const content = recordedSteps.flatMap((step) => step.content);
					const files = recordedSteps.flatMap((step) => step.files);
					const sources = recordedSteps.flatMap((step) => step.sources);
					const toolCalls = recordedSteps.flatMap((step) => step.toolCalls);
					const staticToolCalls = recordedSteps.flatMap((step) => step.staticToolCalls);
					const dynamicToolCalls = recordedSteps.flatMap((step) => step.dynamicToolCalls);
					const toolResults = recordedSteps.flatMap((step) => step.toolResults);
					const staticToolResults = recordedSteps.flatMap((step) => step.staticToolResults);
					const dynamicToolResults = recordedSteps.flatMap((step) => step.dynamicToolResults);
					const warnings = recordedSteps.flatMap((step) => {
						var _a25;
						return (_a25 = step.warnings) != null ? _a25 : [];
					});
					const onEndWithOutput = onEnd == null ? void 0 : async (event) => {
						const parsedOutput = output == null ? void 0 : await self.getOutputPromise().catch(() => void 0);
						await onEnd({
							...event,
							...output != null ? { output: parsedOutput } : {}
						});
					};
					const onEndEvent = {
						callId,
						toolsContext: finalStep.toolsContext,
						stepNumber: finalStep.stepNumber,
						model: finalStep.model,
						runtimeContext: finalStep.runtimeContext,
						finishReason: finalStep.finishReason,
						rawFinishReason: finalStep.rawFinishReason,
						usage: totalUsage,
						totalUsage,
						content,
						text: finalStep.text,
						reasoning: finalStep.reasoning,
						reasoningText: finalStep.reasoningText,
						files,
						sources,
						toolCalls,
						staticToolCalls,
						dynamicToolCalls,
						toolResults,
						staticToolResults,
						dynamicToolResults,
						responseMessages: [...initialResponseMessages, ...recordedSteps.flatMap((step) => step.response.messages)],
						warnings,
						request: finalStep.request,
						response: finalStep.response,
						providerMetadata: finalStep.providerMetadata,
						steps: recordedSteps,
						finalStep
					};
					await Promise.all([notify({
						event: onEndEvent,
						callbacks: onEndWithOutput
					}), notify({
						event: onEndEvent,
						callbacks: telemetryDispatcher.onEnd
					})]);
				} catch (error) {
					controller.error(error);
				}
			}
		});
		const stitchableStream = createStitchableStream();
		this.addStream = stitchableStream.addStream;
		this.closeStream = stitchableStream.close;
		const reader = stitchableStream.stream.getReader();
		let stream = new ReadableStream({
			async start(controller) {
				controller.enqueue({ type: "start" });
			},
			async pull(controller) {
				async function abort() {
					await notify({
						event: {
							callId,
							steps: recordedSteps,
							...(abortSignal == null ? void 0 : abortSignal.reason) !== void 0 ? { reason: abortSignal.reason } : {}
						},
						callbacks: [onAbort, telemetryDispatcher.onAbort]
					});
					controller.enqueue({
						type: "abort",
						...(abortSignal == null ? void 0 : abortSignal.reason) !== void 0 ? { reason: getErrorMessage(abortSignal.reason) } : {}
					});
					controller.close();
				}
				try {
					const { done, value } = await reader.read();
					if (done) {
						controller.close();
						return;
					}
					if (abortSignal == null ? void 0 : abortSignal.aborted) {
						await abort();
						return;
					}
					controller.enqueue(value);
				} catch (error) {
					if (isAbortError(error) && (abortSignal == null ? void 0 : abortSignal.aborted)) await abort();
					else controller.error(error);
				}
			},
			cancel(reason) {
				return stitchableStream.stream.cancel(reason);
			}
		});
		let isRunning = true;
		stream = stream.pipeThrough(new TransformStream({ async transform(chunk, controller) {
			if (isRunning) controller.enqueue(chunk);
		} }));
		stream = applyStreamTextTransforms({
			stream,
			transforms,
			tools,
			stopStream() {
				stitchableStream.terminate();
				isRunning = false;
			}
		});
		this.baseStream = stream.pipeThrough(createOutputTransformStream(output != null ? output : text())).pipeThrough(eventProcessor);
		const { maxRetries } = prepareRetries({
			maxRetries: maxRetriesArg,
			abortSignal
		});
		const { maxRetries: streamRetries } = prepareRetries({
			maxRetries: streamRetriesArg,
			abortSignal,
			parameter: "streamRetries",
			defaultMaxRetries: 0
		});
		const callSettings = prepareLanguageModelCallOptions(settings);
		const self = this;
		const callId = generateCallId();
		(async () => {
			var _a25;
			const initialPrompt = await standardizePrompt({
				instructions,
				system,
				prompt,
				messages,
				allowSystemInMessages
			});
			const startEvent = {
				callId,
				operationId: "ai.streamText",
				provider: model.provider,
				modelId: model.modelId,
				instructions: initialPrompt.instructions,
				messages: initialPrompt.messages,
				tools,
				toolChoice,
				activeTools,
				toolOrder,
				maxOutputTokens: callSettings.maxOutputTokens,
				temperature: callSettings.temperature,
				topP: callSettings.topP,
				topK: callSettings.topK,
				presencePenalty: callSettings.presencePenalty,
				frequencyPenalty: callSettings.frequencyPenalty,
				stopSequences: callSettings.stopSequences,
				seed: callSettings.seed,
				reasoning: callSettings.reasoning,
				maxRetries,
				timeout,
				headers,
				providerOptions,
				output,
				runtimeContext,
				toolsContext
			};
			const streamTextTracingChannelContext = (_a25 = telemetryDispatcher.startTracingChannelContext) == null ? void 0 : _a25.call(telemetryDispatcher, {
				type: "streamText",
				event: startEvent,
				completion: self._totalUsage.promise.then(() => void 0)
			});
			const runInStreamTextTracingChannelContext = (execute) => {
				var _a26;
				return (_a26 = streamTextTracingChannelContext == null ? void 0 : streamTextTracingChannelContext.run(execute)) != null ? _a26 : execute();
			};
			const runInTracingChannelSpanInStreamText = telemetryDispatcher.runInTracingChannelSpan == null ? void 0 : (options) => runInStreamTextTracingChannelContext(() => telemetryDispatcher.runInTracingChannelSpan(options));
			await notify({
				event: startEvent,
				callbacks: [onStart, telemetryDispatcher.onStart]
			});
			const initialMessages = initialPrompt.messages;
			let instructionsForNextStep = initialPrompt.instructions;
			const { approvedToolApprovals, deniedToolApprovals } = collectToolApprovals({ messages: initialMessages });
			if (deniedToolApprovals.length > 0 || approvedToolApprovals.length > 0) {
				const { approvedToolApprovals: localApprovedToolApprovals, deniedToolApprovals: revalidationDeniedToolApprovals, invalidToolApprovals } = await validateApprovedToolApprovals({
					approvedToolApprovals: approvedToolApprovals.filter((toolApproval2) => !toolApproval2.toolCall.providerExecuted),
					tools,
					toolApproval,
					messages: initialMessages,
					toolsContext,
					runtimeContext,
					toolApprovalSecret: experimental_toolApprovalSecret
				});
				const localDeniedToolApprovals = [...deniedToolApprovals.filter((toolApproval2) => !toolApproval2.toolCall.providerExecuted), ...revalidationDeniedToolApprovals];
				const localDeniedToolApprovalsWithoutResults = localDeniedToolApprovals.filter((toolApproval2) => toolApproval2.existingToolResult == null);
				const deniedProviderExecutedToolApprovals = deniedToolApprovals.filter((toolApproval2) => toolApproval2.toolCall.providerExecuted);
				let toolExecutionStepStreamController;
				const toolExecutionStepStream = new ReadableStream({ start(controller) {
					toolExecutionStepStreamController = controller;
				} });
				self.addStream(toolExecutionStepStream);
				try {
					for (const toolApproval2 of [...localDeniedToolApprovals, ...deniedProviderExecutedToolApprovals]) toolExecutionStepStreamController?.enqueue({
						type: "tool-output-denied",
						toolCallId: toolApproval2.toolCall.toolCallId,
						toolName: toolApproval2.toolCall.toolName
					});
					for (const toolApproval2 of invalidToolApprovals) toolExecutionStepStreamController?.enqueue({
						type: "tool-error",
						toolCallId: toolApproval2.toolCall.toolCallId,
						toolName: toolApproval2.toolCall.toolName,
						input: toolApproval2.toolCall.input,
						error: getErrorMessage(toolApproval2.error),
						title: toolApproval2.toolCall.title,
						...toolApproval2.toolCall.dynamic === true ? { dynamic: true } : {},
						...toolApproval2.toolCall.toolMetadata != null ? { toolMetadata: toolApproval2.toolCall.toolMetadata } : {}
					});
					const toolOutputs = [];
					await Promise.all(localApprovedToolApprovals.map(async (toolApproval2) => {
						const result = await executeToolCall({
							toolCall: toolApproval2.toolCall,
							tools,
							callId,
							messages: initialMessages,
							abortSignal,
							timeout,
							experimental_sandbox: sandbox,
							toolsContext,
							onToolExecutionStart: filterNullable(onToolExecutionStart, telemetryDispatcher.onToolExecutionStart),
							onToolExecutionEnd: filterNullable(onToolExecutionEnd, telemetryDispatcher.onToolExecutionEnd),
							executeToolInTelemetryContext: telemetryDispatcher.executeTool,
							runInTracingChannelSpan: runInTracingChannelSpanInStreamText,
							onPreliminaryToolResult: (result2) => {
								toolExecutionStepStreamController?.enqueue(result2);
							}
						});
						if (result != null) {
							toolExecutionStepStreamController?.enqueue(result.output);
							toolOutputs.push(result.output);
						}
					}));
					if (toolOutputs.length > 0 || localDeniedToolApprovalsWithoutResults.length > 0 || invalidToolApprovals.length > 0) {
						const localToolContent = [];
						for (const output2 of toolOutputs) localToolContent.push({
							type: "tool-result",
							toolCallId: output2.toolCallId,
							toolName: output2.toolName,
							output: await createToolModelOutput({
								toolCallId: output2.toolCallId,
								input: output2.input,
								tool: getOwn(tools, output2.toolName),
								output: output2.type === "tool-result" ? output2.output : output2.error,
								errorMode: output2.type === "tool-error" ? "text" : "none"
							})
						});
						for (const toolApproval2 of invalidToolApprovals) localToolContent.push({
							type: "tool-result",
							toolCallId: toolApproval2.toolCall.toolCallId,
							toolName: toolApproval2.toolCall.toolName,
							output: await createToolModelOutput({
								toolCallId: toolApproval2.toolCall.toolCallId,
								input: toolApproval2.toolCall.input,
								tool: getOwn(tools, toolApproval2.toolCall.toolName),
								output: toolApproval2.error,
								errorMode: "text"
							})
						});
						for (const toolApproval2 of localDeniedToolApprovalsWithoutResults) localToolContent.push({
							type: "tool-result",
							toolCallId: toolApproval2.toolCall.toolCallId,
							toolName: toolApproval2.toolCall.toolName,
							output: {
								type: "execution-denied",
								reason: toolApproval2.approvalResponse.reason
							}
						});
						initialResponseMessages.push({
							role: "tool",
							content: localToolContent
						});
					}
				} finally {
					toolExecutionStepStreamController?.close();
				}
			}
			self._initialResponseMessages.resolve(initialResponseMessages);
			async function streamStep({ currentStep, usage }) {
				var _a26, _b25, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l;
				const stepTimeoutId = setAbortTimeout({
					abortController: stepAbortController,
					label: "Step",
					timeoutMs: stepTimeoutMs
				});
				let firstChunkTimeoutId = void 0;
				function startFirstChunkTimeout() {
					if (abortSignal == null ? void 0 : abortSignal.aborted) return;
					firstChunkTimeoutId = setAbortTimeout({
						abortController: firstChunkAbortController,
						label: "First chunk",
						timeoutMs: firstChunkTimeoutMs
					});
				}
				function clearFirstChunkTimeout() {
					if (firstChunkTimeoutId != null) {
						clearTimeout(firstChunkTimeoutId);
						firstChunkTimeoutId = void 0;
					}
				}
				let chunkTimeoutId = void 0;
				function resetChunkTimeout() {
					if (chunkTimeoutId != null) clearTimeout(chunkTimeoutId);
					chunkTimeoutId = setAbortTimeout({
						abortController: chunkAbortController,
						label: "Chunk",
						timeoutMs: chunkTimeoutMs
					});
				}
				function clearChunkTimeout() {
					if (chunkTimeoutId != null) {
						clearTimeout(chunkTimeoutId);
						chunkTimeoutId = void 0;
					}
				}
				function clearStepTimeout() {
					if (stepTimeoutId != null) clearTimeout(stepTimeoutId);
				}
				function clearStepTimeouts() {
					clearStepTimeout();
					clearFirstChunkTimeout();
					clearChunkTimeout();
				}
				function cleanupStepTimeouts() {
					abortSignal?.removeEventListener("abort", cleanupStepTimeouts);
					clearStepTimeouts();
				}
				abortSignal?.addEventListener("abort", cleanupStepTimeouts, { once: true });
				try {
					stepFinish = new DelayedPromise();
					const stepTracingChannelContext = (_a26 = telemetryDispatcher.startTracingChannelContext) == null ? void 0 : _a26.call(telemetryDispatcher, {
						type: "step",
						event: {
							callId,
							stepNumber: currentStep
						},
						completion: stepFinish.promise
					});
					const runInStepTracingChannelContext = (execute) => {
						var _a27;
						return (_a27 = stepTracingChannelContext == null ? void 0 : stepTracingChannelContext.run(execute)) != null ? _a27 : execute();
					};
					const responseMessagesFromPreviousSteps = recordedSteps.flatMap((step) => step.response.messages);
					const accumulatedResponseMessages = [...initialResponseMessages, ...responseMessagesFromPreviousSteps];
					const stepInputMessages = stepMessagesForNextStep != null ? stepMessagesForNextStep : [...initialMessages, ...initialResponseMessages];
					const prepareStepResult = await (prepareStep == null ? void 0 : prepareStep({
						model,
						steps: recordedSteps,
						stepNumber: recordedSteps.length,
						instructions: instructionsForNextStep,
						initialInstructions: initialPrompt.instructions,
						messages: stepInputMessages,
						initialMessages,
						responseMessages: accumulatedResponseMessages,
						toolsContext,
						runtimeContext,
						experimental_sandbox: sandbox
					}));
					const stepSandbox = (_b25 = prepareStepResult == null ? void 0 : prepareStepResult.experimental_sandbox) != null ? _b25 : sandbox;
					runtimeContext = (_c = prepareStepResult == null ? void 0 : prepareStepResult.runtimeContext) != null ? _c : runtimeContext;
					toolsContext = (_d = prepareStepResult == null ? void 0 : prepareStepResult.toolsContext) != null ? _d : toolsContext;
					const stepModel = resolveLanguageModel((_e = prepareStepResult == null ? void 0 : prepareStepResult.model) != null ? _e : model);
					const { executionTools: stepExecutionTools, modelTools: stepModelTools } = prepareToolsForToolCallers({
						tools: filterActiveTools({
							tools,
							activeTools: (_f = prepareStepResult == null ? void 0 : prepareStepResult.activeTools) != null ? _f : activeTools
						}),
						toolCallers: resolvedToolCallers
					});
					const stepToolOrder = (_g = prepareStepResult == null ? void 0 : prepareStepResult.toolOrder) != null ? _g : toolOrder;
					const stepTools = await prepareTools({
						tools: stepModelTools,
						toolOrder: stepToolOrder,
						toolsContext,
						experimental_sandbox: stepSandbox
					});
					const stepToolChoice = prepareToolChoice({ toolChoice: (_h = prepareStepResult == null ? void 0 : prepareStepResult.toolChoice) != null ? _h : toolChoice });
					const stepMessages = (_i = prepareStepResult == null ? void 0 : prepareStepResult.messages) != null ? _i : stepInputMessages;
					currentStepMessages = stepMessages;
					const stepInstructions = (_k = (_j = prepareStepResult == null ? void 0 : prepareStepResult.instructions) != null ? _j : prepareStepResult == null ? void 0 : prepareStepResult.system) != null ? _k : instructionsForNextStep;
					instructionsForNextStep = stepInstructions;
					const stepProviderOptions = mergeObjects(providerOptions, prepareStepResult == null ? void 0 : prepareStepResult.providerOptions);
					const stepCallSettings = prepareStepCallSettings({
						callSettings,
						stepSettings: prepareStepResult
					});
					const stepStartTimestampMs = now2();
					const { retry } = prepareRetries({
						maxRetries,
						abortSignal
					});
					let hasNotifiedStepStart = false;
					const callLanguageModel = () => runInStepTracingChannelContext(() => retry(async () => {
						var _a27, _b26;
						return streamLanguageModelCall({
							model: (_a27 = prepareStepResult == null ? void 0 : prepareStepResult.model) != null ? _a27 : model,
							tools: stepModelTools,
							toolOrder: stepToolOrder,
							toolChoice: (_b26 = prepareStepResult == null ? void 0 : prepareStepResult.toolChoice) != null ? _b26 : toolChoice,
							instructions: stepInstructions,
							messages: stepMessages,
							allowSystemInMessages,
							repairToolCall,
							refineToolInput,
							abortSignal,
							headers,
							includeRawChunks: include.rawChunks,
							providerOptions: stepProviderOptions,
							download: download2,
							output,
							callId,
							executeLanguageModelCallInTelemetryContext: telemetryDispatcher.executeLanguageModelCall,
							toolsContext,
							experimental_sandbox: stepSandbox,
							onLanguageModelCallStart: filterNullable(onLanguageModelCallStart, telemetryDispatcher.onLanguageModelCallStart),
							onLanguageModelCallEnd: filterNullable(onLanguageModelCallEnd, telemetryDispatcher.onLanguageModelCallEnd),
							onStart: async ({ promptMessages }) => {
								var _a28, _b27;
								if (hasNotifiedStepStart) return;
								hasNotifiedStepStart = true;
								await notify({
									event: {
										callId,
										provider: stepModel.provider,
										modelId: stepModel.modelId,
										stepNumber: recordedSteps.length,
										instructions: stepInstructions,
										messages: stepMessages,
										tools,
										toolChoice: (_a28 = prepareStepResult == null ? void 0 : prepareStepResult.toolChoice) != null ? _a28 : toolChoice,
										activeTools: (_b27 = prepareStepResult == null ? void 0 : prepareStepResult.activeTools) != null ? _b27 : activeTools,
										toolOrder: stepToolOrder,
										steps: [...recordedSteps],
										providerOptions: stepProviderOptions,
										runtimeContext,
										toolsContext,
										output,
										promptMessages,
										stepTools,
										stepToolChoice
									},
									callbacks: [onStepStart, telemetryDispatcher.onStepStart]
								});
							},
							_internal: { now: now2 },
							...stepCallSettings
						});
					}));
					const initialLanguageModelCall = await callLanguageModel();
					let request = initialLanguageModelCall.request;
					let response = initialLanguageModelCall.response;
					let languageModelStreamReader = initialLanguageModelCall.stream.getReader();
					let automaticStreamRetryCount = 0;
					let callbackStreamRetryCount = 0;
					let bufferedAttemptParts = [];
					const outputChunksHandledBeforeBuffering = /* @__PURE__ */ new WeakSet();
					const openTextParts = /* @__PURE__ */ new Set();
					const openReasoningParts = /* @__PURE__ */ new Set();
					let enqueueStreamRetryAttemptBoundary = false;
					const shouldBufferToolParts = streamRetries > 0 || canRetryStreamViaOnError;
					const languageModelStream = new ReadableStream({
						async pull(controller) {
							const enqueueAttemptPart = (part) => {
								switch (part.type) {
									case "text-start":
										openTextParts.add(part.id);
										break;
									case "text-end":
										openTextParts.delete(part.id);
										break;
									case "reasoning-start":
										openReasoningParts.add(part.id);
										break;
									case "reasoning-end": openReasoningParts.delete(part.id);
								}
								controller.enqueue(part);
							};
							const flushBufferedAttemptParts = () => {
								for (const part of bufferedAttemptParts) enqueueAttemptPart(part);
								bufferedAttemptParts = [];
							};
							const closeOpenAttemptParts = () => {
								for (const id of openTextParts) controller.enqueue({
									type: "text-end",
									id
								});
								openTextParts.clear();
								for (const id of openReasoningParts) controller.enqueue({
									type: "reasoning-end",
									id
								});
								openReasoningParts.clear();
							};
							while (true) {
								const { done, value } = await languageModelStreamReader.read();
								if (enqueueStreamRetryAttemptBoundary) {
									controller.enqueue(createStreamRetryAttemptBoundaryPart({ warnings: !done && value.type === "model-call-start" ? value.warnings : [] }));
									enqueueStreamRetryAttemptBoundary = false;
								}
								if (done) {
									flushBufferedAttemptParts();
									controller.close();
									return;
								}
								const isToolPart = value.type === "tool-input-start" || value.type === "tool-input-delta" || value.type === "tool-input-end" || value.type === "tool-call" || value.type === "tool-approval-request" || value.type === "tool-approval-response" || value.type === "tool-result" || value.type === "tool-error";
								if (value.type === "model-call-end") {
									flushBufferedAttemptParts();
									enqueueAttemptPart(value);
									return;
								}
								if (shouldBufferToolParts && value.type !== "error" && (isToolPart || bufferedAttemptParts.length > 0)) {
									if (isOutputChunk2(value)) {
										clearFirstChunkTimeout();
										resetChunkTimeout();
										outputChunksHandledBeforeBuffering.add(value);
									}
									bufferedAttemptParts.push(value);
									continue;
								}
								if (value.type !== "error") {
									enqueueAttemptPart(value);
									return;
								}
								await notify({
									event: { chunk: value },
									callbacks: onChunk
								});
								const error = wrapGatewayError(value.error);
								let onErrorResult;
								try {
									onErrorResult = await onError({ error });
								} catch (e) {}
								const callbackRequestedRetry = canRetryStreamViaOnError && typeof onErrorResult === "object" && onErrorResult != null && "retry" in onErrorResult && onErrorResult.retry === true;
								const automaticRetry = automaticStreamRetryCount < streamRetries;
								if (!automaticRetry && !(!automaticRetry && callbackRequestedRetry && callbackStreamRetryCount < 1)) {
									flushBufferedAttemptParts();
									errorsHandledForStreamRetry.add(value.error);
									controller.enqueue(value);
									return;
								}
								if (automaticRetry) automaticStreamRetryCount++;
								else callbackStreamRetryCount++;
								await languageModelStreamReader.cancel(error);
								bufferedAttemptParts = [];
								closeOpenAttemptParts();
								let retryLanguageModelCall;
								try {
									retryLanguageModelCall = await callLanguageModel();
								} catch (retryError) {
									controller.enqueue({
										type: "error",
										error: retryError
									});
									controller.close();
									return;
								}
								request = retryLanguageModelCall.request;
								response = retryLanguageModelCall.response;
								languageModelStreamReader = retryLanguageModelCall.stream.getReader();
								enqueueStreamRetryAttemptBoundary = true;
							}
						},
						cancel(reason) {
							return languageModelStreamReader.cancel(reason);
						}
					});
					startFirstChunkTimeout();
					const streamAfterToolCallbackInvocation = invokeToolCallbacksFromStream({
						stream: languageModelStream,
						tools: stepExecutionTools,
						stepInputMessages: stepMessages,
						abortSignal,
						runtimeContext
					});
					const runInTracingChannelSpanInStep = telemetryDispatcher.runInTracingChannelSpan == null ? void 0 : (options) => runInStepTracingChannelContext(() => telemetryDispatcher.runInTracingChannelSpan(options));
					const streamWithToolResults = executeToolsFromStream({
						stream: streamAfterToolCallbackInvocation,
						tools: stepExecutionTools,
						callId,
						messages: stepMessages,
						abortSignal,
						timeout,
						experimental_sandbox: stepSandbox,
						toolsContext,
						toolApproval,
						runtimeContext,
						toolApprovalSecret: experimental_toolApprovalSecret,
						generateId: generateId4,
						onToolExecutionStart: filterNullable(onToolExecutionStart, telemetryDispatcher.onToolExecutionStart),
						onToolExecutionEnd: filterNullable(onToolExecutionEnd, telemetryDispatcher.onToolExecutionEnd),
						executeToolInTelemetryContext: telemetryDispatcher.executeTool,
						runInTracingChannelSpan: runInTracingChannelSpanInStep
					});
					const getStepRequest = () => ({
						...request,
						body: include.requestBody ? request == null ? void 0 : request.body : void 0,
						messages: include.requestMessages ? cloneModelMessages(stepMessages) : void 0
					});
					recordedRequestMessages = (_l = getStepRequest().messages) != null ? _l : [];
					const stepToolCalls = [];
					const stepToolOutputs = [];
					const stepToolApprovalResponses = [];
					let warnings;
					let stepFinishReason = "other";
					let stepRawFinishReason = void 0;
					let hasReceivedTerminalChunk = false;
					let hasReceivedOutputChunk = false;
					let stepUsage = createNullLanguageModelUsage();
					let stepProviderMetadata;
					let stepFirstChunk = true;
					const createModelCallPerformance = () => ({
						responseTimeMs: 0,
						effectiveOutputTokensPerSecond: 0,
						outputTokensPerSecond: void 0,
						inputTokensPerSecond: void 0,
						effectiveTotalTokensPerSecond: 0,
						timeToFirstOutputMs: void 0,
						timeBetweenOutputChunksMs: void 0
					});
					let modelCallPerformance = createModelCallPerformance();
					const toolExecutionMs = {};
					const createStepResponse = () => ({
						id: generateId4(),
						timestamp: /* @__PURE__ */ new Date(),
						modelId: model.modelId
					});
					let stepResponse = createStepResponse();
					const textPartIds = /* @__PURE__ */ new Map();
					const reasoningPartIds = /* @__PURE__ */ new Map();
					const enqueueStepPart = (controller, part) => {
						controller.enqueue(part);
					};
					self.addStream(streamWithToolResults.pipeThrough(new TransformStream({
						async transform(chunk, controller) {
							var _a27, _b26, _c2, _d2, _e2, _f2, _g2;
							if (isStreamRetryAttemptBoundaryPart(chunk)) {
								warnings = chunk.warnings;
								stepFinishReason = "other";
								stepRawFinishReason = void 0;
								hasReceivedTerminalChunk = false;
								hasReceivedOutputChunk = false;
								stepUsage = createNullLanguageModelUsage();
								stepProviderMetadata = void 0;
								modelCallPerformance = createModelCallPerformance();
								stepResponse = createStepResponse();
								textPartIds.clear();
								reasoningPartIds.clear();
								controller.enqueue({ [streamRetryBoundarySymbol]: {
									request: getStepRequest(),
									warnings
								} });
								return;
							}
							if (chunk.type === "model-call-start") {
								warnings = chunk.warnings;
								return;
							}
							if (stepFirstChunk) {
								stepFirstChunk = false;
								enqueueStepPart(controller, {
									type: "start-step",
									request: getStepRequest(),
									warnings: warnings != null ? warnings : []
								});
							}
							const chunkType = chunk.type;
							if (isOutputChunk2(chunk)) {
								const timeoutHandledBeforeBuffering = outputChunksHandledBeforeBuffering.has(chunk);
								if (!hasReceivedOutputChunk && !timeoutHandledBeforeBuffering) clearFirstChunkTimeout();
								hasReceivedOutputChunk = true;
								if (!timeoutHandledBeforeBuffering) resetChunkTimeout();
							}
							switch (chunkType) {
								case "file":
								case "custom":
								case "source":
								case "reasoning-file":
								case "tool-input-start":
								case "tool-input-end":
								case "tool-input-delta":
								case "tool-approval-request":
									enqueueStepPart(controller, chunk);
									break;
								case "text-start": {
									const id = reserveTextPartId(chunk.id);
									textPartIds.set(chunk.id, id);
									enqueueStepPart(controller, {
										...chunk,
										id
									});
									break;
								}
								case "text-delta":
									if (chunk.text.length > 0 || chunk.providerMetadata != null) enqueueStepPart(controller, {
										...chunk,
										id: (_a27 = textPartIds.get(chunk.id)) != null ? _a27 : chunk.id
									});
									break;
								case "text-end":
									enqueueStepPart(controller, {
										...chunk,
										id: (_b26 = textPartIds.get(chunk.id)) != null ? _b26 : chunk.id
									});
									textPartIds.delete(chunk.id);
									break;
								case "reasoning-start": {
									const id = reserveReasoningPartId(chunk.id);
									reasoningPartIds.set(chunk.id, id);
									enqueueStepPart(controller, {
										...chunk,
										id
									});
									break;
								}
								case "reasoning-delta":
									enqueueStepPart(controller, {
										...chunk,
										id: (_c2 = reasoningPartIds.get(chunk.id)) != null ? _c2 : chunk.id
									});
									break;
								case "reasoning-end":
									enqueueStepPart(controller, {
										...chunk,
										id: (_d2 = reasoningPartIds.get(chunk.id)) != null ? _d2 : chunk.id
									});
									reasoningPartIds.delete(chunk.id);
									break;
								case "tool-call":
									enqueueStepPart(controller, chunk);
									stepToolCalls.push(chunk);
									break;
								case "tool-approval-response":
									enqueueStepPart(controller, chunk);
									stepToolApprovalResponses.push(chunk);
									break;
								case "tool-result":
									enqueueStepPart(controller, chunk);
									if (!chunk.preliminary) stepToolOutputs.push(chunk);
									break;
								case "tool-error":
									enqueueStepPart(controller, chunk);
									stepToolOutputs.push(chunk);
									break;
								case "tool-execution-end":
									toolExecutionMs[chunk.toolCallId] = chunk.toolExecutionMs;
									break;
								case "model-call-response-metadata":
									stepResponse = {
										id: (_e2 = chunk.id) != null ? _e2 : stepResponse.id,
										timestamp: (_f2 = chunk.timestamp) != null ? _f2 : stepResponse.timestamp,
										modelId: (_g2 = chunk.modelId) != null ? _g2 : stepResponse.modelId
									};
									break;
								case "model-call-end":
									hasReceivedTerminalChunk = true;
									stepUsage = chunk.usage;
									stepFinishReason = chunk.finishReason;
									stepRawFinishReason = chunk.rawFinishReason;
									stepProviderMetadata = chunk.providerMetadata;
									modelCallPerformance = chunk.performance;
									break;
								case "error":
									hasReceivedTerminalChunk = true;
									enqueueStepPart(controller, chunk);
									stepFinishReason = "error";
									break;
								case "raw":
									if (include.rawChunks) enqueueStepPart(controller, chunk);
									break;
								default: throw new Error(`Unknown chunk type: ${chunkType}`);
							}
						},
						async flush(controller) {
							if (!hasReceivedTerminalChunk && !hasReceivedOutputChunk) {
								enqueueStepPart(controller, {
									type: "error",
									error: new NoOutputGeneratedError({ message: "No output generated. The model stream ended without a finish chunk." })
								});
								cleanupStepTimeouts();
								self.closeStream();
								return;
							}
							const stepTimeMs = now2() - stepStartTimestampMs;
							const finishStepPart = {
								type: "finish-step",
								finishReason: stepFinishReason,
								rawFinishReason: stepRawFinishReason,
								usage: stepUsage,
								performance: {
									stepTimeMs,
									toolExecutionMs,
									...modelCallPerformance
								},
								providerMetadata: stepProviderMetadata,
								response: {
									...stepResponse,
									headers: response == null ? void 0 : response.headers
								}
							};
							enqueueStepPart(controller, finishStepPart);
							const combinedUsage = addLanguageModelUsage(usage, stepUsage);
							await stepFinish.promise;
							const clientToolCalls = stepToolCalls.filter((toolCall) => toolCall.providerExecuted !== true);
							const clientToolOutputs = stepToolOutputs.filter((toolOutput) => toolOutput.providerExecuted !== true);
							const deniedToolApprovalResponses = stepToolApprovalResponses.filter((toolApprovalResponse) => toolApprovalResponse.approved === false);
							for (const toolCall of stepToolCalls) {
								if (toolCall.providerExecuted !== true) continue;
								const tool2 = getOwn(stepExecutionTools, toolCall.toolName);
								if ((tool2 == null ? void 0 : tool2.type) === "provider" && tool2.supportsDeferredResults) {
									if (!stepToolOutputs.some((output2) => (output2.type === "tool-result" || output2.type === "tool-error") && output2.toolCallId === toolCall.toolCallId)) pendingDeferredToolCalls.set(toolCall.toolCallId, { toolName: toolCall.toolName });
								}
							}
							for (const output2 of stepToolOutputs) if (output2.type === "tool-result" || output2.type === "tool-error") pendingDeferredToolCalls.delete(output2.toolCallId);
							cleanupStepTimeouts();
							if (clientToolCalls.length === clientToolOutputs.length + deniedToolApprovalResponses.length && (clientToolCalls.length > 0 || pendingDeferredToolCalls.size > 0) && !await isStopConditionMet({
								stopConditions,
								steps: recordedSteps
							})) try {
								await runInStreamTextTracingChannelContext(() => streamStep({
									currentStep: currentStep + 1,
									usage: combinedUsage
								}));
							} catch (error) {
								enqueueStepPart(controller, {
									type: "error",
									error
								});
								self.closeStream();
							}
							else {
								enqueueStepPart(controller, {
									type: "finish",
									finishReason: stepFinishReason,
									rawFinishReason: stepRawFinishReason,
									totalUsage: combinedUsage
								});
								self.closeStream();
							}
						}
					})), {
						onError: cleanupStepTimeouts,
						onCancel: cleanupStepTimeouts
					});
				} catch (error) {
					cleanupStepTimeouts();
					throw error;
				}
			}
			await runInStreamTextTracingChannelContext(() => streamStep({
				currentStep: 0,
				usage: createNullLanguageModelUsage()
			}));
		})().catch(async (error) => {
			var _a25;
			await ((_a25 = telemetryDispatcher.onError) == null ? void 0 : _a25.call(telemetryDispatcher, {
				callId,
				error
			}));
			self._initialResponseMessages.reject(error);
			markPromiseAsHandled(self._initialResponseMessages.promise);
			self.addStream(new ReadableStream({ start(controller) {
				controller.enqueue({
					type: "error",
					error
				});
				controller.close();
			} }));
			self.closeStream();
		});
	}
	get steps() {
		this.consumeStream();
		return this._steps.promise;
	}
	get finalStep() {
		return this.steps.then((steps) => steps.at(-1));
	}
	get content() {
		return this.steps.then((steps) => steps.flatMap((step) => step.content));
	}
	get warnings() {
		return this.steps.then((steps) => steps.flatMap((step) => {
			var _a25;
			return (_a25 = step.warnings) != null ? _a25 : [];
		}));
	}
	get providerMetadata() {
		return this.finalStep.then((step) => step.providerMetadata);
	}
	get text() {
		return this.finalStep.then((step) => step.text);
	}
	get reasoningText() {
		return this.finalStep.then((step) => step.reasoningText);
	}
	get reasoning() {
		return this.finalStep.then((step) => convertToReasoningOutputs(step.reasoning));
	}
	get sources() {
		return this.steps.then((steps) => steps.flatMap((step) => step.sources));
	}
	get files() {
		return this.steps.then((steps) => steps.flatMap((step) => step.files));
	}
	get toolCalls() {
		return this.steps.then((steps) => steps.flatMap((step) => step.toolCalls));
	}
	get staticToolCalls() {
		return this.steps.then((steps) => steps.flatMap((step) => step.staticToolCalls));
	}
	get dynamicToolCalls() {
		return this.steps.then((steps) => steps.flatMap((step) => step.dynamicToolCalls));
	}
	get toolResults() {
		return this.steps.then((steps) => steps.flatMap((step) => step.toolResults));
	}
	get staticToolResults() {
		return this.steps.then((steps) => steps.flatMap((step) => step.staticToolResults));
	}
	get dynamicToolResults() {
		return this.steps.then((steps) => steps.flatMap((step) => step.dynamicToolResults));
	}
	get usage() {
		return this.totalUsage;
	}
	get request() {
		return this.finalStep.then((step) => step.request);
	}
	get response() {
		return this.finalStep.then((step) => step.response);
	}
	get responseMessages() {
		return Promise.all([this._initialResponseMessages.promise, this.steps]).then(([initialResponseMessages, steps]) => [...initialResponseMessages, ...steps.flatMap((step) => step.response.messages)]);
	}
	get totalUsage() {
		this.consumeStream();
		return this._totalUsage.promise;
	}
	get finishReason() {
		this.consumeStream();
		return this._finishReason.promise;
	}
	get rawFinishReason() {
		this.consumeStream();
		return this._rawFinishReason.promise;
	}
	/**
	* Split out a new stream from the original stream.
	* The original stream is replaced to allow for further splitting,
	* since we do not know how many times the stream will be split.
	*
	* Note: this leads to buffering the stream content on the server.
	* However, the LLM results are expected to be small enough to not cause issues.
	*/
	teeStream() {
		const [stream1, stream2] = this.baseStream.tee();
		this.baseStream = stream2;
		return stream1;
	}
	get textStream() {
		return createAsyncIterableStream(toTextStream({ stream: this.stream }));
	}
	get stream() {
		return createAsyncIterableStream(this.teeStream().pipeThrough(new TransformStream({ transform({ part }, controller) {
			controller.enqueue(part);
		} })));
	}
	get fullStream() {
		return this.stream;
	}
	rejectResultPromises(error) {
		this.rejectResultPromise({
			delayedPromise: this._finishReason,
			error
		});
		this.rejectResultPromise({
			delayedPromise: this._rawFinishReason,
			error
		});
		this.rejectResultPromise({
			delayedPromise: this._totalUsage,
			error
		});
		this.rejectResultPromise({
			delayedPromise: this._steps,
			error
		});
		this.rejectResultPromise({
			delayedPromise: this._initialResponseMessages,
			error
		});
	}
	rejectResultPromise({ delayedPromise, error }) {
		if (delayedPromise.isPending()) {
			delayedPromise.reject(error);
			markPromiseAsHandled(delayedPromise.promise);
		}
	}
	async consumeStream(options) {
		var _a25;
		try {
			await consumeStream({
				stream: this.stream,
				onError: (error) => {
					var _a26;
					this.rejectResultPromises(error);
					(_a26 = options == null ? void 0 : options.onError) == null || _a26.call(options, error);
				}
			});
		} catch (error) {
			this.rejectResultPromises(error);
			(_a25 = options == null ? void 0 : options.onError) == null || _a25.call(options, error);
		}
	}
	get experimental_partialOutputStream() {
		return this.partialOutputStream;
	}
	get partialOutputStream() {
		return createAsyncIterableStream(this.teeStream().pipeThrough(new TransformStream({ transform({ partialOutput }, controller) {
			if (partialOutput != null) controller.enqueue(partialOutput);
		} })));
	}
	get elementStream() {
		var _a25, _b25, _c;
		const transform = (_a25 = this.outputSpecification) == null ? void 0 : _a25.createElementStreamTransform();
		if (transform == null) throw new UnsupportedFunctionalityError({ functionality: `element streams in ${(_c = (_b25 = this.outputSpecification) == null ? void 0 : _b25.name) != null ? _c : "text"} mode` });
		return createAsyncIterableStream(this.teeStream().pipeThrough(transform));
	}
	getOutputPromise() {
		if (this.outputPromise == null) this.outputPromise = this.finalStep.then((step) => {
			var _a25;
			return ((_a25 = this.outputSpecification) != null ? _a25 : text()).parseCompleteOutput({ text: step.text }, {
				response: step.response,
				usage: step.usage,
				finishReason: step.finishReason
			});
		});
		return this.outputPromise;
	}
	get output() {
		return this.getOutputPromise();
	}
	toUIMessageStream({ originalMessages, generateMessageId, onEnd, onFinish, messageMetadata, sendReasoning, sendSources, sendStart, sendFinish, onError } = {}) {
		return createAsyncIterableStream(toUIMessageStream({
			stream: this.stream,
			tools: this.tools,
			originalMessages,
			generateMessageId,
			onEnd: onEnd != null ? onEnd : onFinish,
			messageMetadata,
			sendReasoning,
			sendSources,
			sendStart,
			sendFinish,
			onError
		}));
	}
	pipeUIMessageStreamToResponse(response, { originalMessages, generateMessageId, onEnd, onFinish, messageMetadata, sendReasoning, sendSources, sendFinish, sendStart, onError, ...init } = {}) {
		return pipeUIMessageStreamToResponse({
			response,
			stream: this.toUIMessageStream({
				originalMessages,
				generateMessageId,
				onEnd: onEnd != null ? onEnd : onFinish,
				messageMetadata,
				sendReasoning,
				sendSources,
				sendFinish,
				sendStart,
				onError
			}),
			...init
		});
	}
	pipeTextStreamToResponse(response, init) {
		return pipeTextStreamToResponse({
			response,
			stream: this.textStream,
			...init
		});
	}
	toUIMessageStreamResponse({ originalMessages, generateMessageId, onEnd, onFinish, messageMetadata, sendReasoning, sendSources, sendFinish, sendStart, onError, ...init } = {}) {
		return createUIMessageStreamResponse({
			stream: this.toUIMessageStream({
				originalMessages,
				generateMessageId,
				onEnd: onEnd != null ? onEnd : onFinish,
				messageMetadata,
				sendReasoning,
				sendSources,
				sendFinish,
				sendStart,
				onError
			}),
			...init
		});
	}
	toTextStreamResponse(init) {
		return createTextStreamResponse({
			stream: this.textStream,
			...init
		});
	}
};
var toolMetadataSchema2 = z.record(z.string(), jsonValueSchema.optional());
var providerReferenceSchema2 = z.record(z.string(), z.string());
lazySchema(() => zodSchema(z.array(z.object({
	id: z.string(),
	role: z.enum([
		"system",
		"user",
		"assistant"
	]),
	metadata: z.unknown().optional(),
	parts: z.array(z.union([
		z.object({
			type: z.literal("text"),
			text: z.string(),
			state: z.enum(["streaming", "done"]).optional(),
			providerMetadata: providerMetadataSchema.optional()
		}),
		z.object({
			type: z.literal("reasoning"),
			id: z.string().optional(),
			text: z.string(),
			state: z.enum(["streaming", "done"]).optional(),
			providerMetadata: providerMetadataSchema.optional()
		}),
		z.object({
			type: z.literal("custom"),
			kind: z.string(),
			providerMetadata: providerMetadataSchema.optional()
		}),
		z.object({
			type: z.literal("source-url"),
			sourceId: z.string(),
			url: z.string(),
			title: z.string().optional(),
			providerMetadata: providerMetadataSchema.optional()
		}),
		z.object({
			type: z.literal("source-document"),
			sourceId: z.string(),
			mediaType: z.string(),
			title: z.string(),
			filename: z.string().optional(),
			providerMetadata: providerMetadataSchema.optional()
		}),
		z.object({
			type: z.literal("file"),
			mediaType: z.string(),
			filename: z.string().optional(),
			url: z.string(),
			providerReference: providerReferenceSchema2.optional(),
			providerMetadata: providerMetadataSchema.optional()
		}),
		z.object({
			type: z.literal("reasoning-file"),
			mediaType: z.string(),
			url: z.string(),
			providerMetadata: providerMetadataSchema.optional()
		}),
		z.object({ type: z.literal("step-start") }),
		z.object({
			type: z.string().startsWith("data-"),
			id: z.string().optional(),
			data: z.unknown()
		}),
		z.object({
			type: z.literal("dynamic-tool"),
			toolName: z.string(),
			toolCallId: z.string(),
			title: z.string().optional(),
			toolMetadata: toolMetadataSchema2.optional(),
			state: z.literal("input-streaming"),
			input: z.unknown().optional(),
			providerExecuted: z.boolean().optional(),
			callProviderMetadata: providerMetadataSchema.optional(),
			output: z.never().optional(),
			errorText: z.never().optional(),
			approval: z.never().optional()
		}),
		z.object({
			type: z.literal("dynamic-tool"),
			toolName: z.string(),
			toolCallId: z.string(),
			title: z.string().optional(),
			toolMetadata: toolMetadataSchema2.optional(),
			state: z.literal("input-available"),
			input: z.unknown(),
			providerExecuted: z.boolean().optional(),
			output: z.never().optional(),
			errorText: z.never().optional(),
			callProviderMetadata: providerMetadataSchema.optional(),
			approval: z.never().optional()
		}),
		z.object({
			type: z.literal("dynamic-tool"),
			toolName: z.string(),
			toolCallId: z.string(),
			title: z.string().optional(),
			toolMetadata: toolMetadataSchema2.optional(),
			state: z.literal("approval-requested"),
			input: z.unknown(),
			providerExecuted: z.boolean().optional(),
			output: z.never().optional(),
			errorText: z.never().optional(),
			callProviderMetadata: providerMetadataSchema.optional(),
			approval: z.object({
				id: z.string(),
				approved: z.never().optional(),
				descriptor: z.unknown().optional(),
				requestReason: z.string().optional(),
				reason: z.never().optional(),
				isAutomatic: z.boolean().optional(),
				signature: z.string().optional()
			})
		}),
		z.object({
			type: z.literal("dynamic-tool"),
			toolName: z.string(),
			toolCallId: z.string(),
			title: z.string().optional(),
			toolMetadata: toolMetadataSchema2.optional(),
			state: z.literal("approval-responded"),
			input: z.unknown(),
			providerExecuted: z.boolean().optional(),
			output: z.never().optional(),
			errorText: z.never().optional(),
			callProviderMetadata: providerMetadataSchema.optional(),
			approval: z.object({
				id: z.string(),
				approved: z.boolean(),
				descriptor: z.unknown().optional(),
				requestReason: z.string().optional(),
				reason: z.string().optional(),
				isAutomatic: z.boolean().optional(),
				signature: z.string().optional()
			})
		}),
		z.object({
			type: z.literal("dynamic-tool"),
			toolName: z.string(),
			toolCallId: z.string(),
			title: z.string().optional(),
			toolMetadata: toolMetadataSchema2.optional(),
			state: z.literal("output-available"),
			input: z.unknown(),
			providerExecuted: z.boolean().optional(),
			output: z.unknown(),
			errorText: z.never().optional(),
			callProviderMetadata: providerMetadataSchema.optional(),
			resultProviderMetadata: providerMetadataSchema.optional(),
			preliminary: z.boolean().optional(),
			approval: z.object({
				id: z.string(),
				approved: z.literal(true),
				descriptor: z.unknown().optional(),
				requestReason: z.string().optional(),
				reason: z.string().optional(),
				isAutomatic: z.boolean().optional(),
				signature: z.string().optional()
			}).optional()
		}),
		z.object({
			type: z.literal("dynamic-tool"),
			toolName: z.string(),
			toolCallId: z.string(),
			title: z.string().optional(),
			toolMetadata: toolMetadataSchema2.optional(),
			state: z.literal("output-error"),
			input: z.unknown().optional(),
			rawInput: z.unknown().optional(),
			providerExecuted: z.boolean().optional(),
			output: z.never().optional(),
			errorText: z.string(),
			callProviderMetadata: providerMetadataSchema.optional(),
			resultProviderMetadata: providerMetadataSchema.optional(),
			approval: z.object({
				id: z.string(),
				approved: z.literal(true),
				descriptor: z.unknown().optional(),
				requestReason: z.string().optional(),
				reason: z.string().optional(),
				isAutomatic: z.boolean().optional(),
				signature: z.string().optional()
			}).optional()
		}),
		z.object({
			type: z.literal("dynamic-tool"),
			toolName: z.string(),
			toolCallId: z.string(),
			title: z.string().optional(),
			toolMetadata: toolMetadataSchema2.optional(),
			state: z.literal("output-denied"),
			input: z.unknown(),
			providerExecuted: z.boolean().optional(),
			output: z.never().optional(),
			errorText: z.never().optional(),
			callProviderMetadata: providerMetadataSchema.optional(),
			approval: z.object({
				id: z.string(),
				approved: z.literal(false),
				descriptor: z.unknown().optional(),
				requestReason: z.string().optional(),
				reason: z.string().optional(),
				isAutomatic: z.boolean().optional(),
				signature: z.string().optional()
			})
		}),
		z.object({
			type: z.string().startsWith("tool-"),
			toolCallId: z.string(),
			title: z.string().optional(),
			toolMetadata: toolMetadataSchema2.optional(),
			state: z.literal("input-streaming"),
			providerExecuted: z.boolean().optional(),
			callProviderMetadata: providerMetadataSchema.optional(),
			input: z.unknown().optional(),
			output: z.never().optional(),
			errorText: z.never().optional(),
			approval: z.never().optional()
		}),
		z.object({
			type: z.string().startsWith("tool-"),
			toolCallId: z.string(),
			title: z.string().optional(),
			toolMetadata: toolMetadataSchema2.optional(),
			state: z.literal("input-available"),
			providerExecuted: z.boolean().optional(),
			input: z.unknown(),
			output: z.never().optional(),
			errorText: z.never().optional(),
			callProviderMetadata: providerMetadataSchema.optional(),
			approval: z.never().optional()
		}),
		z.object({
			type: z.string().startsWith("tool-"),
			toolCallId: z.string(),
			title: z.string().optional(),
			toolMetadata: toolMetadataSchema2.optional(),
			state: z.literal("approval-requested"),
			input: z.unknown(),
			providerExecuted: z.boolean().optional(),
			output: z.never().optional(),
			errorText: z.never().optional(),
			callProviderMetadata: providerMetadataSchema.optional(),
			approval: z.object({
				id: z.string(),
				approved: z.never().optional(),
				descriptor: z.unknown().optional(),
				requestReason: z.string().optional(),
				reason: z.never().optional(),
				isAutomatic: z.boolean().optional(),
				signature: z.string().optional()
			})
		}),
		z.object({
			type: z.string().startsWith("tool-"),
			toolCallId: z.string(),
			title: z.string().optional(),
			toolMetadata: toolMetadataSchema2.optional(),
			state: z.literal("approval-responded"),
			input: z.unknown(),
			providerExecuted: z.boolean().optional(),
			output: z.never().optional(),
			errorText: z.never().optional(),
			callProviderMetadata: providerMetadataSchema.optional(),
			approval: z.object({
				id: z.string(),
				approved: z.boolean(),
				descriptor: z.unknown().optional(),
				requestReason: z.string().optional(),
				reason: z.string().optional(),
				isAutomatic: z.boolean().optional(),
				signature: z.string().optional()
			})
		}),
		z.object({
			type: z.string().startsWith("tool-"),
			toolCallId: z.string(),
			title: z.string().optional(),
			toolMetadata: toolMetadataSchema2.optional(),
			state: z.literal("output-available"),
			providerExecuted: z.boolean().optional(),
			input: z.unknown(),
			output: z.unknown(),
			errorText: z.never().optional(),
			callProviderMetadata: providerMetadataSchema.optional(),
			resultProviderMetadata: providerMetadataSchema.optional(),
			preliminary: z.boolean().optional(),
			approval: z.object({
				id: z.string(),
				approved: z.literal(true),
				descriptor: z.unknown().optional(),
				requestReason: z.string().optional(),
				reason: z.string().optional(),
				isAutomatic: z.boolean().optional(),
				signature: z.string().optional()
			}).optional()
		}),
		z.object({
			type: z.string().startsWith("tool-"),
			toolCallId: z.string(),
			title: z.string().optional(),
			toolMetadata: toolMetadataSchema2.optional(),
			state: z.literal("output-error"),
			providerExecuted: z.boolean().optional(),
			input: z.unknown().optional(),
			rawInput: z.unknown().optional(),
			output: z.never().optional(),
			errorText: z.string(),
			callProviderMetadata: providerMetadataSchema.optional(),
			resultProviderMetadata: providerMetadataSchema.optional(),
			approval: z.object({
				id: z.string(),
				approved: z.literal(true),
				descriptor: z.unknown().optional(),
				requestReason: z.string().optional(),
				reason: z.string().optional(),
				isAutomatic: z.boolean().optional(),
				signature: z.string().optional()
			}).optional()
		}),
		z.object({
			type: z.string().startsWith("tool-"),
			toolCallId: z.string(),
			title: z.string().optional(),
			toolMetadata: toolMetadataSchema2.optional(),
			state: z.literal("output-denied"),
			providerExecuted: z.boolean().optional(),
			input: z.unknown(),
			output: z.never().optional(),
			errorText: z.never().optional(),
			callProviderMetadata: providerMetadataSchema.optional(),
			approval: z.object({
				id: z.string(),
				approved: z.literal(false),
				descriptor: z.unknown().optional(),
				requestReason: z.string().optional(),
				reason: z.string().optional(),
				isAutomatic: z.boolean().optional(),
				signature: z.string().optional()
			})
		})
	]))
}).superRefine((message, context) => {
	if (message.role !== "assistant" && message.parts.length === 0) context.addIssue({
		origin: "array",
		code: "too_small",
		minimum: 1,
		inclusive: true,
		input: message.parts,
		path: ["parts"],
		message: "Message must contain at least one part"
	});
})).nonempty("Messages array must not be empty")));
createIdGenerator({
	prefix: "call",
	size: 24
});
createIdGenerator({
	prefix: "call",
	size: 24
});
new TextEncoder();
createIdGenerator({
	prefix: "aiobj",
	size: 24
});
createIdGenerator({
	prefix: "aiobj",
	size: 24
});
createIdGenerator({
	prefix: "call",
	size: 24
});
//#endregion
export { generateText, streamText };
