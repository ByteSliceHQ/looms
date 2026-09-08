import { _enum, any, array, boolean, literal, number, object, record, safeParseAsync, string, toJSONSchema, union, unknown } from "../@ai-sdk/gateway+[...].mjs";
//#region ../../node_modules/.bun/zod@4.5.4/node_modules/zod/v3/helpers/util.js
var util;
(function(util) {
	util.assertEqual = (_) => {};
	function assertIs(_arg) {}
	util.assertIs = assertIs;
	function assertNever(_x) {
		throw new Error();
	}
	util.assertNever = assertNever;
	util.arrayToEnum = (items) => {
		const obj = {};
		for (const item of items) obj[item] = item;
		return obj;
	};
	util.getValidEnumValues = (obj) => {
		const validKeys = util.objectKeys(obj).filter((k) => typeof obj[obj[k]] !== "number");
		const filtered = {};
		for (const k of validKeys) filtered[k] = obj[k];
		return util.objectValues(filtered);
	};
	util.objectValues = (obj) => {
		return util.objectKeys(obj).map(function(e) {
			return obj[e];
		});
	};
	util.objectKeys = typeof Object.keys === "function" ? (obj) => Object.keys(obj) : (object) => {
		const keys = [];
		for (const key in object) if (Object.prototype.hasOwnProperty.call(object, key)) keys.push(key);
		return keys;
	};
	util.find = (arr, checker) => {
		for (const item of arr) if (checker(item)) return item;
	};
	util.isInteger = typeof Number.isInteger === "function" ? (val) => Number.isInteger(val) : (val) => typeof val === "number" && Number.isFinite(val) && Math.floor(val) === val;
	function joinValues(array, separator = " | ") {
		return array.map((val) => typeof val === "string" ? `'${val}'` : val).join(separator);
	}
	util.joinValues = joinValues;
	util.jsonStringifyReplacer = (_, value) => {
		if (typeof value === "bigint") return value.toString();
		return value;
	};
})(util || (util = {}));
var objectUtil;
(function(objectUtil) {
	objectUtil.mergeShapes = (first, second) => {
		return {
			...first,
			...second
		};
	};
})(objectUtil || (objectUtil = {}));
var ZodParsedType = util.arrayToEnum([
	"string",
	"nan",
	"number",
	"integer",
	"float",
	"boolean",
	"date",
	"bigint",
	"symbol",
	"function",
	"undefined",
	"null",
	"array",
	"object",
	"unknown",
	"promise",
	"void",
	"never",
	"map",
	"set"
]);
var getParsedType = (data) => {
	switch (typeof data) {
		case "undefined": return ZodParsedType.undefined;
		case "string": return ZodParsedType.string;
		case "number": return Number.isNaN(data) ? ZodParsedType.nan : ZodParsedType.number;
		case "boolean": return ZodParsedType.boolean;
		case "function": return ZodParsedType.function;
		case "bigint": return ZodParsedType.bigint;
		case "symbol": return ZodParsedType.symbol;
		case "object":
			if (Array.isArray(data)) return ZodParsedType.array;
			if (data === null) return ZodParsedType.null;
			if (data.then && typeof data.then === "function" && data.catch && typeof data.catch === "function") return ZodParsedType.promise;
			if (typeof Map !== "undefined" && data instanceof Map) return ZodParsedType.map;
			if (typeof Set !== "undefined" && data instanceof Set) return ZodParsedType.set;
			if (typeof Date !== "undefined" && data instanceof Date) return ZodParsedType.date;
			return ZodParsedType.object;
		default: return ZodParsedType.unknown;
	}
};
//#endregion
//#region ../../node_modules/.bun/zod@4.5.4/node_modules/zod/v3/ZodError.js
var ZodIssueCode = util.arrayToEnum([
	"invalid_type",
	"invalid_literal",
	"custom",
	"invalid_union",
	"invalid_union_discriminator",
	"invalid_enum_value",
	"unrecognized_keys",
	"invalid_arguments",
	"invalid_return_type",
	"invalid_date",
	"invalid_string",
	"too_small",
	"too_big",
	"invalid_intersection_types",
	"not_multiple_of",
	"not_finite"
]);
var ZodError = class ZodError extends Error {
	get errors() {
		return this.issues;
	}
	constructor(issues) {
		super();
		this.issues = [];
		this.addIssue = (sub) => {
			this.issues = [...this.issues, sub];
		};
		this.addIssues = (subs = []) => {
			this.issues = [...this.issues, ...subs];
		};
		const actualProto = new.target.prototype;
		if (Object.setPrototypeOf) Object.setPrototypeOf(this, actualProto);
		else this.__proto__ = actualProto;
		this.name = "ZodError";
		this.issues = issues;
	}
	format(_mapper) {
		const mapper = _mapper || function(issue) {
			return issue.message;
		};
		const fieldErrors = { _errors: [] };
		const processError = (error) => {
			for (const issue of error.issues) if (issue.code === "invalid_union") issue.unionErrors.map(processError);
			else if (issue.code === "invalid_return_type") processError(issue.returnTypeError);
			else if (issue.code === "invalid_arguments") processError(issue.argumentsError);
			else if (issue.path.length === 0) fieldErrors._errors.push(mapper(issue));
			else {
				let curr = fieldErrors;
				let i = 0;
				while (i < issue.path.length) {
					const el = issue.path[i];
					const terminal = i === issue.path.length - 1;
					if (el === "_errors") {
						if (terminal) curr._errors.push(mapper(issue));
						i++;
						continue;
					}
					if (!Object.prototype.hasOwnProperty.call(curr, el)) {
						if (el === "__proto__") Object.defineProperty(curr, el, {
							value: { _errors: [] },
							writable: true,
							enumerable: true,
							configurable: true
						});
						else curr[el] = { _errors: [] };
					}
					curr = curr[el];
					if (terminal) curr._errors.push(mapper(issue));
					i++;
				}
			}
		};
		processError(this);
		return fieldErrors;
	}
	static assert(value) {
		if (!(value instanceof ZodError)) throw new Error(`Not a ZodError: ${value}`);
	}
	toString() {
		return this.message;
	}
	get message() {
		return JSON.stringify(this.issues, util.jsonStringifyReplacer, 2);
	}
	get isEmpty() {
		return this.issues.length === 0;
	}
	flatten(mapper = (issue) => issue.message) {
		const fieldErrors = Object.create(null);
		const formErrors = [];
		for (const sub of this.issues) if (sub.path.length > 0) {
			const firstEl = sub.path[0];
			fieldErrors[firstEl] = fieldErrors[firstEl] || [];
			fieldErrors[firstEl].push(mapper(sub));
		} else formErrors.push(mapper(sub));
		return {
			formErrors,
			fieldErrors
		};
	}
	get formErrors() {
		return this.flatten();
	}
};
ZodError.create = (issues) => {
	return new ZodError(issues);
};
//#endregion
//#region ../../node_modules/.bun/zod@4.5.4/node_modules/zod/v3/locales/en.js
var errorMap = (issue, _ctx) => {
	let message;
	switch (issue.code) {
		case ZodIssueCode.invalid_type:
			if (issue.received === ZodParsedType.undefined) message = "Required";
			else message = `Expected ${issue.expected}, received ${issue.received}`;
			break;
		case ZodIssueCode.invalid_literal:
			message = `Invalid literal value, expected ${JSON.stringify(issue.expected, util.jsonStringifyReplacer)}`;
			break;
		case ZodIssueCode.unrecognized_keys:
			message = `Unrecognized key(s) in object: ${util.joinValues(issue.keys, ", ")}`;
			break;
		case ZodIssueCode.invalid_union:
			message = `Invalid input`;
			break;
		case ZodIssueCode.invalid_union_discriminator:
			message = `Invalid discriminator value. Expected ${util.joinValues(issue.options)}`;
			break;
		case ZodIssueCode.invalid_enum_value:
			message = `Invalid enum value. Expected ${util.joinValues(issue.options)}, received '${issue.received}'`;
			break;
		case ZodIssueCode.invalid_arguments:
			message = `Invalid function arguments`;
			break;
		case ZodIssueCode.invalid_return_type:
			message = `Invalid function return type`;
			break;
		case ZodIssueCode.invalid_date:
			message = `Invalid date`;
			break;
		case ZodIssueCode.invalid_string:
			if (typeof issue.validation === "object") {
				if ("includes" in issue.validation) {
					message = `Invalid input: must include "${issue.validation.includes}"`;
					if (typeof issue.validation.position === "number") message = `${message} at one or more positions greater than or equal to ${issue.validation.position}`;
				} else if ("startsWith" in issue.validation) message = `Invalid input: must start with "${issue.validation.startsWith}"`;
				else if ("endsWith" in issue.validation) message = `Invalid input: must end with "${issue.validation.endsWith}"`;
				else util.assertNever(issue.validation);
			} else if (issue.validation !== "regex") message = `Invalid ${issue.validation}`;
			else message = "Invalid";
			break;
		case ZodIssueCode.too_small:
			if (issue.type === "array") message = `Array must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `more than`} ${issue.minimum} element(s)`;
			else if (issue.type === "string") message = `String must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `over`} ${issue.minimum} character(s)`;
			else if (issue.type === "number") message = `Number must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${issue.minimum}`;
			else if (issue.type === "bigint") message = `Number must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${issue.minimum}`;
			else if (issue.type === "date") message = `Date must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${new Date(Number(issue.minimum))}`;
			else message = "Invalid input";
			break;
		case ZodIssueCode.too_big:
			if (issue.type === "array") message = `Array must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `less than`} ${issue.maximum} element(s)`;
			else if (issue.type === "string") message = `String must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `under`} ${issue.maximum} character(s)`;
			else if (issue.type === "number") message = `Number must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
			else if (issue.type === "bigint") message = `BigInt must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
			else if (issue.type === "date") message = `Date must be ${issue.exact ? `exactly` : issue.inclusive ? `smaller than or equal to` : `smaller than`} ${new Date(Number(issue.maximum))}`;
			else message = "Invalid input";
			break;
		case ZodIssueCode.custom:
			message = `Invalid input`;
			break;
		case ZodIssueCode.invalid_intersection_types:
			message = `Intersection results could not be merged`;
			break;
		case ZodIssueCode.not_multiple_of:
			message = `Number must be a multiple of ${issue.multipleOf}`;
			break;
		case ZodIssueCode.not_finite:
			message = "Number must be finite";
			break;
		default:
			message = _ctx.defaultError;
			util.assertNever(issue);
	}
	return { message };
};
//#endregion
//#region ../../node_modules/.bun/zod@4.5.4/node_modules/zod/v3/errors.js
var overrideErrorMap = errorMap;
function getErrorMap() {
	return overrideErrorMap;
}
//#endregion
//#region ../../node_modules/.bun/zod@4.5.4/node_modules/zod/v3/helpers/parseUtil.js
var makeIssue = (params) => {
	const { data, path, errorMaps, issueData } = params;
	const fullPath = [...path, ...issueData.path || []];
	const fullIssue = {
		...issueData,
		path: fullPath
	};
	if (issueData.message !== void 0) return {
		...issueData,
		path: fullPath,
		message: issueData.message
	};
	let errorMessage = "";
	const maps = errorMaps.filter((m) => !!m).slice().reverse();
	for (const map of maps) errorMessage = map(fullIssue, {
		data,
		defaultError: errorMessage
	}).message;
	return {
		...issueData,
		path: fullPath,
		message: errorMessage
	};
};
function addIssueToContext(ctx, issueData) {
	const overrideMap = getErrorMap();
	const issue = makeIssue({
		issueData,
		data: ctx.data,
		path: ctx.path,
		errorMaps: [
			ctx.common.contextualErrorMap,
			ctx.schemaErrorMap,
			overrideMap,
			overrideMap === errorMap ? void 0 : errorMap
		].filter((x) => !!x)
	});
	ctx.common.issues.push(issue);
}
var ParseStatus = class ParseStatus {
	constructor() {
		this.value = "valid";
	}
	dirty() {
		if (this.value === "valid") this.value = "dirty";
	}
	abort() {
		if (this.value !== "aborted") this.value = "aborted";
	}
	static mergeArray(status, results) {
		const arrayValue = [];
		for (const s of results) {
			if (s.status === "aborted") return INVALID;
			if (s.status === "dirty") status.dirty();
			arrayValue.push(s.value);
		}
		return {
			status: status.value,
			value: arrayValue
		};
	}
	static async mergeObjectAsync(status, pairs) {
		const syncPairs = [];
		for (const pair of pairs) {
			const key = await pair.key;
			const value = await pair.value;
			syncPairs.push({
				key,
				value
			});
		}
		return ParseStatus.mergeObjectSync(status, syncPairs);
	}
	static mergeObjectSync(status, pairs) {
		const finalObject = {};
		for (const pair of pairs) {
			const { key, value } = pair;
			if (key.status === "aborted") return INVALID;
			if (value.status === "aborted") return INVALID;
			if (key.status === "dirty") status.dirty();
			if (value.status === "dirty") status.dirty();
			if (key.value !== "__proto__" && (typeof value.value !== "undefined" || pair.alwaysSet)) finalObject[key.value] = value.value;
		}
		return {
			status: status.value,
			value: finalObject
		};
	}
};
var INVALID = Object.freeze({ status: "aborted" });
var DIRTY = (value) => ({
	status: "dirty",
	value
});
var OK = (value) => ({
	status: "valid",
	value
});
var isAborted = (x) => x.status === "aborted";
var isDirty = (x) => x.status === "dirty";
var isValid = (x) => x.status === "valid";
var isAsync = (x) => typeof Promise !== "undefined" && x instanceof Promise;
//#endregion
//#region ../../node_modules/.bun/zod@4.5.4/node_modules/zod/v3/helpers/errorUtil.js
var errorUtil;
(function(errorUtil) {
	errorUtil.errToObj = (message) => typeof message === "string" ? { message } : message || {};
	errorUtil.toString = (message) => typeof message === "string" ? message : message?.message;
})(errorUtil || (errorUtil = {}));
//#endregion
//#region ../../node_modules/.bun/zod@4.5.4/node_modules/zod/v3/types.js
var ParseInputLazyPath = class {
	constructor(parent, value, path, key) {
		this._cachedPath = [];
		this.parent = parent;
		this.data = value;
		this._path = path;
		this._key = key;
	}
	get path() {
		if (!this._cachedPath.length) {
			if (Array.isArray(this._key)) this._cachedPath.push(...this._path, ...this._key);
			else this._cachedPath.push(...this._path, this._key);
		}
		return this._cachedPath;
	}
};
var handleResult = (ctx, result) => {
	if (isValid(result)) return {
		success: true,
		data: result.value
	};
	else {
		if (!ctx.common.issues.length) throw new Error("Validation failed but no issues detected.");
		return {
			success: false,
			get error() {
				if (this._error) return this._error;
				const error = new ZodError(ctx.common.issues);
				this._error = error;
				return this._error;
			}
		};
	}
};
function processCreateParams(params) {
	if (!params) return {};
	const { errorMap, invalid_type_error, required_error, description } = params;
	if (errorMap && (invalid_type_error || required_error)) throw new Error(`Can't use "invalid_type_error" or "required_error" in conjunction with custom error map.`);
	if (errorMap) return {
		errorMap,
		description
	};
	const customMap = (iss, ctx) => {
		const { message } = params;
		if (iss.code === "invalid_enum_value") return { message: message ?? ctx.defaultError };
		if (typeof ctx.data === "undefined") return { message: message ?? required_error ?? ctx.defaultError };
		if (iss.code !== "invalid_type") return { message: ctx.defaultError };
		return { message: message ?? invalid_type_error ?? ctx.defaultError };
	};
	return {
		errorMap: customMap,
		description
	};
}
var ZodType = class {
	get description() {
		return this._def.description;
	}
	_getType(input) {
		return getParsedType(input.data);
	}
	_getOrReturnCtx(input, ctx) {
		return ctx || {
			common: input.parent.common,
			data: input.data,
			parsedType: getParsedType(input.data),
			schemaErrorMap: this._def.errorMap,
			path: input.path,
			parent: input.parent
		};
	}
	_processInputParams(input) {
		return {
			status: new ParseStatus(),
			ctx: {
				common: input.parent.common,
				data: input.data,
				parsedType: getParsedType(input.data),
				schemaErrorMap: this._def.errorMap,
				path: input.path,
				parent: input.parent
			}
		};
	}
	_parseSync(input) {
		const result = this._parse(input);
		if (isAsync(result)) throw new Error("Synchronous parse encountered promise.");
		return result;
	}
	_parseAsync(input) {
		const result = this._parse(input);
		return Promise.resolve(result);
	}
	parse(data, params) {
		const result = this.safeParse(data, params);
		if (result.success) return result.data;
		throw result.error;
	}
	safeParse(data, params) {
		const ctx = {
			common: {
				issues: [],
				async: params?.async ?? false,
				contextualErrorMap: params?.errorMap
			},
			path: params?.path || [],
			schemaErrorMap: this._def.errorMap,
			parent: null,
			data,
			parsedType: getParsedType(data)
		};
		return handleResult(ctx, this._parseSync({
			data,
			path: ctx.path,
			parent: ctx
		}));
	}
	"~validate"(data) {
		const ctx = {
			common: {
				issues: [],
				async: !!this["~standard"].async
			},
			path: [],
			schemaErrorMap: this._def.errorMap,
			parent: null,
			data,
			parsedType: getParsedType(data)
		};
		if (!this["~standard"].async) try {
			const result = this._parseSync({
				data,
				path: [],
				parent: ctx
			});
			return isValid(result) ? { value: result.value } : { issues: ctx.common.issues };
		} catch (err) {
			if (err?.message?.toLowerCase()?.includes("encountered")) this["~standard"].async = true;
			ctx.common = {
				issues: [],
				async: true
			};
		}
		return this._parseAsync({
			data,
			path: [],
			parent: ctx
		}).then((result) => isValid(result) ? { value: result.value } : { issues: ctx.common.issues });
	}
	async parseAsync(data, params) {
		const result = await this.safeParseAsync(data, params);
		if (result.success) return result.data;
		throw result.error;
	}
	async safeParseAsync(data, params) {
		const ctx = {
			common: {
				issues: [],
				contextualErrorMap: params?.errorMap,
				async: true
			},
			path: params?.path || [],
			schemaErrorMap: this._def.errorMap,
			parent: null,
			data,
			parsedType: getParsedType(data)
		};
		const maybeAsyncResult = this._parse({
			data,
			path: ctx.path,
			parent: ctx
		});
		return handleResult(ctx, await (isAsync(maybeAsyncResult) ? maybeAsyncResult : Promise.resolve(maybeAsyncResult)));
	}
	refine(check, message) {
		const getIssueProperties = (val) => {
			if (typeof message === "string" || typeof message === "undefined") return { message };
			else if (typeof message === "function") return message(val);
			else return message;
		};
		return this._refinement((val, ctx) => {
			const result = check(val);
			const setError = () => ctx.addIssue({
				code: ZodIssueCode.custom,
				...getIssueProperties(val)
			});
			if (typeof Promise !== "undefined" && result instanceof Promise) return result.then((data) => {
				if (!data) {
					setError();
					return false;
				} else return true;
			});
			if (!result) {
				setError();
				return false;
			} else return true;
		});
	}
	refinement(check, refinementData) {
		return this._refinement((val, ctx) => {
			if (!check(val)) {
				ctx.addIssue(typeof refinementData === "function" ? refinementData(val, ctx) : refinementData);
				return false;
			} else return true;
		});
	}
	_refinement(refinement) {
		return new ZodEffects({
			schema: this,
			typeName: ZodFirstPartyTypeKind.ZodEffects,
			effect: {
				type: "refinement",
				refinement
			}
		});
	}
	superRefine(refinement) {
		return this._refinement(refinement);
	}
	constructor(def) {
		/** Alias of safeParseAsync */
		this.spa = this.safeParseAsync;
		this._def = def;
		this.parse = this.parse.bind(this);
		this.safeParse = this.safeParse.bind(this);
		this.parseAsync = this.parseAsync.bind(this);
		this.safeParseAsync = this.safeParseAsync.bind(this);
		this.spa = this.spa.bind(this);
		this.refine = this.refine.bind(this);
		this.refinement = this.refinement.bind(this);
		this.superRefine = this.superRefine.bind(this);
		this.optional = this.optional.bind(this);
		this.nullable = this.nullable.bind(this);
		this.nullish = this.nullish.bind(this);
		this.array = this.array.bind(this);
		this.promise = this.promise.bind(this);
		this.or = this.or.bind(this);
		this.and = this.and.bind(this);
		this.transform = this.transform.bind(this);
		this.brand = this.brand.bind(this);
		this.default = this.default.bind(this);
		this.catch = this.catch.bind(this);
		this.describe = this.describe.bind(this);
		this.pipe = this.pipe.bind(this);
		this.readonly = this.readonly.bind(this);
		this.isNullable = this.isNullable.bind(this);
		this.isOptional = this.isOptional.bind(this);
		this["~standard"] = {
			version: 1,
			vendor: "zod",
			validate: (data) => this["~validate"](data)
		};
	}
	optional() {
		return ZodOptional.create(this, this._def);
	}
	nullable() {
		return ZodNullable.create(this, this._def);
	}
	nullish() {
		return this.nullable().optional();
	}
	array() {
		return ZodArray.create(this);
	}
	promise() {
		return ZodPromise.create(this, this._def);
	}
	or(option) {
		return ZodUnion.create([this, option], this._def);
	}
	and(incoming) {
		return ZodIntersection.create(this, incoming, this._def);
	}
	transform(transform) {
		return new ZodEffects({
			...processCreateParams(this._def),
			schema: this,
			typeName: ZodFirstPartyTypeKind.ZodEffects,
			effect: {
				type: "transform",
				transform
			}
		});
	}
	default(def) {
		const defaultValueFunc = typeof def === "function" ? def : () => def;
		return new ZodDefault({
			...processCreateParams(this._def),
			innerType: this,
			defaultValue: defaultValueFunc,
			typeName: ZodFirstPartyTypeKind.ZodDefault
		});
	}
	brand() {
		return new ZodBranded({
			typeName: ZodFirstPartyTypeKind.ZodBranded,
			type: this,
			...processCreateParams(this._def)
		});
	}
	catch(def) {
		const catchValueFunc = typeof def === "function" ? def : () => def;
		return new ZodCatch({
			...processCreateParams(this._def),
			innerType: this,
			catchValue: catchValueFunc,
			typeName: ZodFirstPartyTypeKind.ZodCatch
		});
	}
	describe(description) {
		const This = this.constructor;
		return new This({
			...this._def,
			description
		});
	}
	pipe(target) {
		return ZodPipeline.create(this, target);
	}
	readonly() {
		return ZodReadonly.create(this);
	}
	isOptional() {
		return this.safeParse(void 0).success;
	}
	isNullable() {
		return this.safeParse(null).success;
	}
};
var cuidRegex = /^c[^\s-]{8,}$/i;
var cuid2Regex = /^[0-9a-z]+$/;
var ulidRegex = /^[0-9A-HJKMNP-TV-Z]{26}$/i;
var uuidRegex = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/i;
var nanoidRegex = /^[a-z0-9_-]{21}$/i;
var jwtRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/;
var durationRegex = /^[-+]?P(?!$)(?:(?:[-+]?\d+Y)|(?:[-+]?\d+[.,]\d+Y$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:(?:[-+]?\d+W)|(?:[-+]?\d+[.,]\d+W$))?(?:(?:[-+]?\d+D)|(?:[-+]?\d+[.,]\d+D$))?(?:T(?=[\d+-])(?:(?:[-+]?\d+H)|(?:[-+]?\d+[.,]\d+H$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:[-+]?\d+(?:[.,]\d+)?S)?)??$/;
var emailRegex = /^(?!\.)(?!.*\.\.)([A-Z0-9_'+\-\.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\-]*\.)+[A-Z]{2,}$/i;
var _emojiRegex = `^[\\p{Extended_Pictographic}\\p{Emoji_Component}]+$`;
var emojiRegex$1;
var ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/;
var ipv4CidrRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/(3[0-2]|[12]?[0-9])$/;
var ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
var ipv6CidrRegex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/;
var base64Regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
var base64urlRegex = /^([0-9a-zA-Z-_]{4})*(([0-9a-zA-Z-_]{2}(==)?)|([0-9a-zA-Z-_]{3}(=)?))?$/;
var dateRegexSource = `((\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-((0[13578]|1[02])-(0[1-9]|[12]\\d|3[01])|(0[469]|11)-(0[1-9]|[12]\\d|30)|(02)-(0[1-9]|1\\d|2[0-8])))`;
var dateRegex = new RegExp(`^${dateRegexSource}$`);
function timeRegexSource(args) {
	let secondsRegexSource = `[0-5]\\d`;
	if (args.precision) secondsRegexSource = `${secondsRegexSource}\\.\\d{${args.precision}}`;
	else if (args.precision == null) secondsRegexSource = `${secondsRegexSource}(\\.\\d+)?`;
	const secondsQuantifier = args.precision ? "+" : "?";
	return `([01]\\d|2[0-3]):[0-5]\\d(:${secondsRegexSource})${secondsQuantifier}`;
}
function timeRegex(args) {
	return new RegExp(`^${timeRegexSource(args)}$`);
}
function datetimeRegex(args) {
	let regex = `${dateRegexSource}T${timeRegexSource(args)}`;
	const opts = [];
	opts.push(args.local ? `Z?` : `Z`);
	if (args.offset) opts.push(`([+-]\\d{2}:?\\d{2})`);
	regex = `${regex}(${opts.join("|")})`;
	return new RegExp(`^${regex}$`);
}
function isValidIP(ip, version) {
	if ((version === "v4" || !version) && ipv4Regex.test(ip)) return true;
	if ((version === "v6" || !version) && ipv6Regex.test(ip)) return true;
	return false;
}
function isValidJWT(jwt, alg) {
	if (!jwtRegex.test(jwt)) return false;
	try {
		const [header] = jwt.split(".");
		if (!header) return false;
		const base64 = header.replace(/-/g, "+").replace(/_/g, "/").padEnd(header.length + (4 - header.length % 4) % 4, "=");
		const decoded = JSON.parse(atob(base64));
		if (typeof decoded !== "object" || decoded === null) return false;
		if ("typ" in decoded && decoded?.typ !== "JWT") return false;
		if (!decoded.alg) return false;
		if (alg && decoded.alg !== alg) return false;
		return true;
	} catch {
		return false;
	}
}
function isValidCidr(ip, version) {
	if ((version === "v4" || !version) && ipv4CidrRegex.test(ip)) return true;
	if ((version === "v6" || !version) && ipv6CidrRegex.test(ip)) return true;
	return false;
}
var ZodString = class ZodString extends ZodType {
	_parse(input) {
		if (this._def.coerce) input.data = String(input.data);
		if (this._getType(input) !== ZodParsedType.string) {
			const ctx = this._getOrReturnCtx(input);
			addIssueToContext(ctx, {
				code: ZodIssueCode.invalid_type,
				expected: ZodParsedType.string,
				received: ctx.parsedType
			});
			return INVALID;
		}
		const status = new ParseStatus();
		let ctx = void 0;
		for (const check of this._def.checks) if (check.kind === "min") {
			if (input.data.length < check.value) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					code: ZodIssueCode.too_small,
					minimum: check.value,
					type: "string",
					inclusive: true,
					exact: false,
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "max") {
			if (input.data.length > check.value) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					code: ZodIssueCode.too_big,
					maximum: check.value,
					type: "string",
					inclusive: true,
					exact: false,
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "length") {
			const tooBig = input.data.length > check.value;
			const tooSmall = input.data.length < check.value;
			if (tooBig || tooSmall) {
				ctx = this._getOrReturnCtx(input, ctx);
				if (tooBig) addIssueToContext(ctx, {
					code: ZodIssueCode.too_big,
					maximum: check.value,
					type: "string",
					inclusive: true,
					exact: true,
					message: check.message
				});
				else if (tooSmall) addIssueToContext(ctx, {
					code: ZodIssueCode.too_small,
					minimum: check.value,
					type: "string",
					inclusive: true,
					exact: true,
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "email") {
			if (!emailRegex.test(input.data)) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					validation: "email",
					code: ZodIssueCode.invalid_string,
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "emoji") {
			if (!emojiRegex$1) emojiRegex$1 = new RegExp(_emojiRegex, "u");
			if (!emojiRegex$1.test(input.data)) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					validation: "emoji",
					code: ZodIssueCode.invalid_string,
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "uuid") {
			if (!uuidRegex.test(input.data)) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					validation: "uuid",
					code: ZodIssueCode.invalid_string,
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "nanoid") {
			if (!nanoidRegex.test(input.data)) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					validation: "nanoid",
					code: ZodIssueCode.invalid_string,
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "cuid") {
			if (!cuidRegex.test(input.data)) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					validation: "cuid",
					code: ZodIssueCode.invalid_string,
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "cuid2") {
			if (!cuid2Regex.test(input.data)) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					validation: "cuid2",
					code: ZodIssueCode.invalid_string,
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "ulid") {
			if (!ulidRegex.test(input.data)) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					validation: "ulid",
					code: ZodIssueCode.invalid_string,
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "url") try {
			new URL(input.data);
		} catch {
			ctx = this._getOrReturnCtx(input, ctx);
			addIssueToContext(ctx, {
				validation: "url",
				code: ZodIssueCode.invalid_string,
				message: check.message
			});
			status.dirty();
		}
		else if (check.kind === "regex") {
			check.regex.lastIndex = 0;
			if (!check.regex.test(input.data)) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					validation: "regex",
					code: ZodIssueCode.invalid_string,
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "trim") input.data = input.data.trim();
		else if (check.kind === "includes") {
			if (!input.data.includes(check.value, check.position)) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					code: ZodIssueCode.invalid_string,
					validation: {
						includes: check.value,
						position: check.position
					},
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "toLowerCase") input.data = input.data.toLowerCase();
		else if (check.kind === "toUpperCase") input.data = input.data.toUpperCase();
		else if (check.kind === "startsWith") {
			if (!input.data.startsWith(check.value)) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					code: ZodIssueCode.invalid_string,
					validation: { startsWith: check.value },
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "endsWith") {
			if (!input.data.endsWith(check.value)) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					code: ZodIssueCode.invalid_string,
					validation: { endsWith: check.value },
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "datetime") {
			if (!datetimeRegex(check).test(input.data)) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					code: ZodIssueCode.invalid_string,
					validation: "datetime",
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "date") {
			if (!dateRegex.test(input.data)) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					code: ZodIssueCode.invalid_string,
					validation: "date",
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "time") {
			if (!timeRegex(check).test(input.data)) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					code: ZodIssueCode.invalid_string,
					validation: "time",
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "duration") {
			if (!durationRegex.test(input.data)) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					validation: "duration",
					code: ZodIssueCode.invalid_string,
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "ip") {
			if (!isValidIP(input.data, check.version)) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					validation: "ip",
					code: ZodIssueCode.invalid_string,
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "jwt") {
			if (!isValidJWT(input.data, check.alg)) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					validation: "jwt",
					code: ZodIssueCode.invalid_string,
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "cidr") {
			if (!isValidCidr(input.data, check.version)) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					validation: "cidr",
					code: ZodIssueCode.invalid_string,
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "base64") {
			if (!base64Regex.test(input.data)) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					validation: "base64",
					code: ZodIssueCode.invalid_string,
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "base64url") {
			if (!base64urlRegex.test(input.data)) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					validation: "base64url",
					code: ZodIssueCode.invalid_string,
					message: check.message
				});
				status.dirty();
			}
		} else util.assertNever(check);
		return {
			status: status.value,
			value: input.data
		};
	}
	_regex(regex, validation, message) {
		return this.refinement((data) => regex.test(data), {
			validation,
			code: ZodIssueCode.invalid_string,
			...errorUtil.errToObj(message)
		});
	}
	_addCheck(check) {
		return new ZodString({
			...this._def,
			checks: [...this._def.checks, check]
		});
	}
	email(message) {
		return this._addCheck({
			kind: "email",
			...errorUtil.errToObj(message)
		});
	}
	url(message) {
		return this._addCheck({
			kind: "url",
			...errorUtil.errToObj(message)
		});
	}
	emoji(message) {
		return this._addCheck({
			kind: "emoji",
			...errorUtil.errToObj(message)
		});
	}
	uuid(message) {
		return this._addCheck({
			kind: "uuid",
			...errorUtil.errToObj(message)
		});
	}
	nanoid(message) {
		return this._addCheck({
			kind: "nanoid",
			...errorUtil.errToObj(message)
		});
	}
	cuid(message) {
		return this._addCheck({
			kind: "cuid",
			...errorUtil.errToObj(message)
		});
	}
	cuid2(message) {
		return this._addCheck({
			kind: "cuid2",
			...errorUtil.errToObj(message)
		});
	}
	ulid(message) {
		return this._addCheck({
			kind: "ulid",
			...errorUtil.errToObj(message)
		});
	}
	base64(message) {
		return this._addCheck({
			kind: "base64",
			...errorUtil.errToObj(message)
		});
	}
	base64url(message) {
		return this._addCheck({
			kind: "base64url",
			...errorUtil.errToObj(message)
		});
	}
	jwt(options) {
		return this._addCheck({
			kind: "jwt",
			...errorUtil.errToObj(options)
		});
	}
	ip(options) {
		return this._addCheck({
			kind: "ip",
			...errorUtil.errToObj(options)
		});
	}
	cidr(options) {
		return this._addCheck({
			kind: "cidr",
			...errorUtil.errToObj(options)
		});
	}
	datetime(options) {
		if (typeof options === "string") return this._addCheck({
			kind: "datetime",
			precision: null,
			offset: false,
			local: false,
			message: options
		});
		return this._addCheck({
			kind: "datetime",
			precision: typeof options?.precision === "undefined" ? null : options?.precision,
			offset: options?.offset ?? false,
			local: options?.local ?? false,
			...errorUtil.errToObj(options?.message)
		});
	}
	date(message) {
		return this._addCheck({
			kind: "date",
			message
		});
	}
	time(options) {
		if (typeof options === "string") return this._addCheck({
			kind: "time",
			precision: null,
			message: options
		});
		return this._addCheck({
			kind: "time",
			precision: typeof options?.precision === "undefined" ? null : options?.precision,
			...errorUtil.errToObj(options?.message)
		});
	}
	duration(message) {
		return this._addCheck({
			kind: "duration",
			...errorUtil.errToObj(message)
		});
	}
	regex(regex, message) {
		return this._addCheck({
			kind: "regex",
			regex,
			...errorUtil.errToObj(message)
		});
	}
	includes(value, options) {
		return this._addCheck({
			kind: "includes",
			value,
			position: options?.position,
			...errorUtil.errToObj(options?.message)
		});
	}
	startsWith(value, message) {
		return this._addCheck({
			kind: "startsWith",
			value,
			...errorUtil.errToObj(message)
		});
	}
	endsWith(value, message) {
		return this._addCheck({
			kind: "endsWith",
			value,
			...errorUtil.errToObj(message)
		});
	}
	min(minLength, message) {
		return this._addCheck({
			kind: "min",
			value: minLength,
			...errorUtil.errToObj(message)
		});
	}
	max(maxLength, message) {
		return this._addCheck({
			kind: "max",
			value: maxLength,
			...errorUtil.errToObj(message)
		});
	}
	length(len, message) {
		return this._addCheck({
			kind: "length",
			value: len,
			...errorUtil.errToObj(message)
		});
	}
	/**
	* Equivalent to `.min(1)`
	*/
	nonempty(message) {
		return this.min(1, errorUtil.errToObj(message));
	}
	trim() {
		return new ZodString({
			...this._def,
			checks: [...this._def.checks, { kind: "trim" }]
		});
	}
	toLowerCase() {
		return new ZodString({
			...this._def,
			checks: [...this._def.checks, { kind: "toLowerCase" }]
		});
	}
	toUpperCase() {
		return new ZodString({
			...this._def,
			checks: [...this._def.checks, { kind: "toUpperCase" }]
		});
	}
	get isDatetime() {
		return !!this._def.checks.find((ch) => ch.kind === "datetime");
	}
	get isDate() {
		return !!this._def.checks.find((ch) => ch.kind === "date");
	}
	get isTime() {
		return !!this._def.checks.find((ch) => ch.kind === "time");
	}
	get isDuration() {
		return !!this._def.checks.find((ch) => ch.kind === "duration");
	}
	get isEmail() {
		return !!this._def.checks.find((ch) => ch.kind === "email");
	}
	get isURL() {
		return !!this._def.checks.find((ch) => ch.kind === "url");
	}
	get isEmoji() {
		return !!this._def.checks.find((ch) => ch.kind === "emoji");
	}
	get isUUID() {
		return !!this._def.checks.find((ch) => ch.kind === "uuid");
	}
	get isNANOID() {
		return !!this._def.checks.find((ch) => ch.kind === "nanoid");
	}
	get isCUID() {
		return !!this._def.checks.find((ch) => ch.kind === "cuid");
	}
	get isCUID2() {
		return !!this._def.checks.find((ch) => ch.kind === "cuid2");
	}
	get isULID() {
		return !!this._def.checks.find((ch) => ch.kind === "ulid");
	}
	get isIP() {
		return !!this._def.checks.find((ch) => ch.kind === "ip");
	}
	get isCIDR() {
		return !!this._def.checks.find((ch) => ch.kind === "cidr");
	}
	get isBase64() {
		return !!this._def.checks.find((ch) => ch.kind === "base64");
	}
	get isBase64url() {
		return !!this._def.checks.find((ch) => ch.kind === "base64url");
	}
	get minLength() {
		let min = null;
		for (const ch of this._def.checks) if (ch.kind === "min") {
			if (min === null || ch.value > min) min = ch.value;
		}
		return min;
	}
	get maxLength() {
		let max = null;
		for (const ch of this._def.checks) if (ch.kind === "max") {
			if (max === null || ch.value < max) max = ch.value;
		}
		return max;
	}
};
ZodString.create = (params) => {
	return new ZodString({
		checks: [],
		typeName: ZodFirstPartyTypeKind.ZodString,
		coerce: params?.coerce ?? false,
		...processCreateParams(params)
	});
};
function floatSafeRemainder(val, step) {
	const valDecCount = (val.toString().split(".")[1] || "").length;
	const stepDecCount = (step.toString().split(".")[1] || "").length;
	const decCount = valDecCount > stepDecCount ? valDecCount : stepDecCount;
	return Number.parseInt(val.toFixed(decCount).replace(".", "")) % Number.parseInt(step.toFixed(decCount).replace(".", "")) / 10 ** decCount;
}
var ZodNumber = class ZodNumber extends ZodType {
	constructor() {
		super(...arguments);
		this.min = this.gte;
		this.max = this.lte;
		this.step = this.multipleOf;
	}
	_parse(input) {
		if (this._def.coerce) input.data = Number(input.data);
		if (this._getType(input) !== ZodParsedType.number) {
			const ctx = this._getOrReturnCtx(input);
			addIssueToContext(ctx, {
				code: ZodIssueCode.invalid_type,
				expected: ZodParsedType.number,
				received: ctx.parsedType
			});
			return INVALID;
		}
		let ctx = void 0;
		const status = new ParseStatus();
		for (const check of this._def.checks) if (check.kind === "int") {
			if (!util.isInteger(input.data)) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					code: ZodIssueCode.invalid_type,
					expected: "integer",
					received: "float",
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "min") {
			if (check.inclusive ? input.data < check.value : input.data <= check.value) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					code: ZodIssueCode.too_small,
					minimum: check.value,
					type: "number",
					inclusive: check.inclusive,
					exact: false,
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "max") {
			if (check.inclusive ? input.data > check.value : input.data >= check.value) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					code: ZodIssueCode.too_big,
					maximum: check.value,
					type: "number",
					inclusive: check.inclusive,
					exact: false,
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "multipleOf") {
			if (floatSafeRemainder(input.data, check.value) !== 0) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					code: ZodIssueCode.not_multiple_of,
					multipleOf: check.value,
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "finite") {
			if (!Number.isFinite(input.data)) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					code: ZodIssueCode.not_finite,
					message: check.message
				});
				status.dirty();
			}
		} else util.assertNever(check);
		return {
			status: status.value,
			value: input.data
		};
	}
	gte(value, message) {
		return this.setLimit("min", value, true, errorUtil.toString(message));
	}
	gt(value, message) {
		return this.setLimit("min", value, false, errorUtil.toString(message));
	}
	lte(value, message) {
		return this.setLimit("max", value, true, errorUtil.toString(message));
	}
	lt(value, message) {
		return this.setLimit("max", value, false, errorUtil.toString(message));
	}
	setLimit(kind, value, inclusive, message) {
		return new ZodNumber({
			...this._def,
			checks: [...this._def.checks, {
				kind,
				value,
				inclusive,
				message: errorUtil.toString(message)
			}]
		});
	}
	_addCheck(check) {
		return new ZodNumber({
			...this._def,
			checks: [...this._def.checks, check]
		});
	}
	int(message) {
		return this._addCheck({
			kind: "int",
			message: errorUtil.toString(message)
		});
	}
	positive(message) {
		return this._addCheck({
			kind: "min",
			value: 0,
			inclusive: false,
			message: errorUtil.toString(message)
		});
	}
	negative(message) {
		return this._addCheck({
			kind: "max",
			value: 0,
			inclusive: false,
			message: errorUtil.toString(message)
		});
	}
	nonpositive(message) {
		return this._addCheck({
			kind: "max",
			value: 0,
			inclusive: true,
			message: errorUtil.toString(message)
		});
	}
	nonnegative(message) {
		return this._addCheck({
			kind: "min",
			value: 0,
			inclusive: true,
			message: errorUtil.toString(message)
		});
	}
	multipleOf(value, message) {
		return this._addCheck({
			kind: "multipleOf",
			value,
			message: errorUtil.toString(message)
		});
	}
	finite(message) {
		return this._addCheck({
			kind: "finite",
			message: errorUtil.toString(message)
		});
	}
	safe(message) {
		return this._addCheck({
			kind: "min",
			inclusive: true,
			value: Number.MIN_SAFE_INTEGER,
			message: errorUtil.toString(message)
		})._addCheck({
			kind: "max",
			inclusive: true,
			value: Number.MAX_SAFE_INTEGER,
			message: errorUtil.toString(message)
		});
	}
	get minValue() {
		let min = null;
		for (const ch of this._def.checks) if (ch.kind === "min") {
			if (min === null || ch.value > min) min = ch.value;
		}
		return min;
	}
	get maxValue() {
		let max = null;
		for (const ch of this._def.checks) if (ch.kind === "max") {
			if (max === null || ch.value < max) max = ch.value;
		}
		return max;
	}
	get isInt() {
		return !!this._def.checks.find((ch) => ch.kind === "int" || ch.kind === "multipleOf" && util.isInteger(ch.value));
	}
	get isFinite() {
		let max = null;
		let min = null;
		for (const ch of this._def.checks) if (ch.kind === "finite" || ch.kind === "int" || ch.kind === "multipleOf") return true;
		else if (ch.kind === "min") {
			if (min === null || ch.value > min) min = ch.value;
		} else if (ch.kind === "max") {
			if (max === null || ch.value < max) max = ch.value;
		}
		return Number.isFinite(min) && Number.isFinite(max);
	}
};
ZodNumber.create = (params) => {
	return new ZodNumber({
		checks: [],
		typeName: ZodFirstPartyTypeKind.ZodNumber,
		coerce: params?.coerce || false,
		...processCreateParams(params)
	});
};
var ZodBigInt = class ZodBigInt extends ZodType {
	constructor() {
		super(...arguments);
		this.min = this.gte;
		this.max = this.lte;
	}
	_parse(input) {
		if (this._def.coerce) try {
			input.data = BigInt(input.data);
		} catch {
			return this._getInvalidInput(input);
		}
		if (this._getType(input) !== ZodParsedType.bigint) return this._getInvalidInput(input);
		let ctx = void 0;
		const status = new ParseStatus();
		for (const check of this._def.checks) if (check.kind === "min") {
			if (check.inclusive ? input.data < check.value : input.data <= check.value) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					code: ZodIssueCode.too_small,
					type: "bigint",
					minimum: check.value,
					inclusive: check.inclusive,
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "max") {
			if (check.inclusive ? input.data > check.value : input.data >= check.value) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					code: ZodIssueCode.too_big,
					type: "bigint",
					maximum: check.value,
					inclusive: check.inclusive,
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "multipleOf") {
			if (input.data % check.value !== BigInt(0)) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					code: ZodIssueCode.not_multiple_of,
					multipleOf: check.value,
					message: check.message
				});
				status.dirty();
			}
		} else util.assertNever(check);
		return {
			status: status.value,
			value: input.data
		};
	}
	_getInvalidInput(input) {
		const ctx = this._getOrReturnCtx(input);
		addIssueToContext(ctx, {
			code: ZodIssueCode.invalid_type,
			expected: ZodParsedType.bigint,
			received: ctx.parsedType
		});
		return INVALID;
	}
	gte(value, message) {
		return this.setLimit("min", value, true, errorUtil.toString(message));
	}
	gt(value, message) {
		return this.setLimit("min", value, false, errorUtil.toString(message));
	}
	lte(value, message) {
		return this.setLimit("max", value, true, errorUtil.toString(message));
	}
	lt(value, message) {
		return this.setLimit("max", value, false, errorUtil.toString(message));
	}
	setLimit(kind, value, inclusive, message) {
		return new ZodBigInt({
			...this._def,
			checks: [...this._def.checks, {
				kind,
				value,
				inclusive,
				message: errorUtil.toString(message)
			}]
		});
	}
	_addCheck(check) {
		return new ZodBigInt({
			...this._def,
			checks: [...this._def.checks, check]
		});
	}
	positive(message) {
		return this._addCheck({
			kind: "min",
			value: BigInt(0),
			inclusive: false,
			message: errorUtil.toString(message)
		});
	}
	negative(message) {
		return this._addCheck({
			kind: "max",
			value: BigInt(0),
			inclusive: false,
			message: errorUtil.toString(message)
		});
	}
	nonpositive(message) {
		return this._addCheck({
			kind: "max",
			value: BigInt(0),
			inclusive: true,
			message: errorUtil.toString(message)
		});
	}
	nonnegative(message) {
		return this._addCheck({
			kind: "min",
			value: BigInt(0),
			inclusive: true,
			message: errorUtil.toString(message)
		});
	}
	multipleOf(value, message) {
		return this._addCheck({
			kind: "multipleOf",
			value,
			message: errorUtil.toString(message)
		});
	}
	get minValue() {
		let min = null;
		for (const ch of this._def.checks) if (ch.kind === "min") {
			if (min === null || ch.value > min) min = ch.value;
		}
		return min;
	}
	get maxValue() {
		let max = null;
		for (const ch of this._def.checks) if (ch.kind === "max") {
			if (max === null || ch.value < max) max = ch.value;
		}
		return max;
	}
};
ZodBigInt.create = (params) => {
	return new ZodBigInt({
		checks: [],
		typeName: ZodFirstPartyTypeKind.ZodBigInt,
		coerce: params?.coerce ?? false,
		...processCreateParams(params)
	});
};
var ZodBoolean = class extends ZodType {
	_parse(input) {
		if (this._def.coerce) input.data = Boolean(input.data);
		if (this._getType(input) !== ZodParsedType.boolean) {
			const ctx = this._getOrReturnCtx(input);
			addIssueToContext(ctx, {
				code: ZodIssueCode.invalid_type,
				expected: ZodParsedType.boolean,
				received: ctx.parsedType
			});
			return INVALID;
		}
		return OK(input.data);
	}
};
ZodBoolean.create = (params) => {
	return new ZodBoolean({
		typeName: ZodFirstPartyTypeKind.ZodBoolean,
		coerce: params?.coerce || false,
		...processCreateParams(params)
	});
};
var ZodDate = class ZodDate extends ZodType {
	_parse(input) {
		if (this._def.coerce) input.data = new Date(input.data);
		if (this._getType(input) !== ZodParsedType.date) {
			const ctx = this._getOrReturnCtx(input);
			addIssueToContext(ctx, {
				code: ZodIssueCode.invalid_type,
				expected: ZodParsedType.date,
				received: ctx.parsedType
			});
			return INVALID;
		}
		if (Number.isNaN(input.data.getTime())) {
			addIssueToContext(this._getOrReturnCtx(input), { code: ZodIssueCode.invalid_date });
			return INVALID;
		}
		const status = new ParseStatus();
		let ctx = void 0;
		for (const check of this._def.checks) if (check.kind === "min") {
			if (input.data.getTime() < check.value) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					code: ZodIssueCode.too_small,
					message: check.message,
					inclusive: true,
					exact: false,
					minimum: check.value,
					type: "date"
				});
				status.dirty();
			}
		} else if (check.kind === "max") {
			if (input.data.getTime() > check.value) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					code: ZodIssueCode.too_big,
					message: check.message,
					inclusive: true,
					exact: false,
					maximum: check.value,
					type: "date"
				});
				status.dirty();
			}
		} else util.assertNever(check);
		return {
			status: status.value,
			value: new Date(input.data.getTime())
		};
	}
	_addCheck(check) {
		return new ZodDate({
			...this._def,
			checks: [...this._def.checks, check]
		});
	}
	min(minDate, message) {
		return this._addCheck({
			kind: "min",
			value: minDate.getTime(),
			message: errorUtil.toString(message)
		});
	}
	max(maxDate, message) {
		return this._addCheck({
			kind: "max",
			value: maxDate.getTime(),
			message: errorUtil.toString(message)
		});
	}
	get minDate() {
		let min = null;
		for (const ch of this._def.checks) if (ch.kind === "min") {
			if (min === null || ch.value > min) min = ch.value;
		}
		return min != null ? new Date(min) : null;
	}
	get maxDate() {
		let max = null;
		for (const ch of this._def.checks) if (ch.kind === "max") {
			if (max === null || ch.value < max) max = ch.value;
		}
		return max != null ? new Date(max) : null;
	}
};
ZodDate.create = (params) => {
	return new ZodDate({
		checks: [],
		coerce: params?.coerce || false,
		typeName: ZodFirstPartyTypeKind.ZodDate,
		...processCreateParams(params)
	});
};
var ZodSymbol = class extends ZodType {
	_parse(input) {
		if (this._getType(input) !== ZodParsedType.symbol) {
			const ctx = this._getOrReturnCtx(input);
			addIssueToContext(ctx, {
				code: ZodIssueCode.invalid_type,
				expected: ZodParsedType.symbol,
				received: ctx.parsedType
			});
			return INVALID;
		}
		return OK(input.data);
	}
};
ZodSymbol.create = (params) => {
	return new ZodSymbol({
		typeName: ZodFirstPartyTypeKind.ZodSymbol,
		...processCreateParams(params)
	});
};
var ZodUndefined = class extends ZodType {
	_parse(input) {
		if (this._getType(input) !== ZodParsedType.undefined) {
			const ctx = this._getOrReturnCtx(input);
			addIssueToContext(ctx, {
				code: ZodIssueCode.invalid_type,
				expected: ZodParsedType.undefined,
				received: ctx.parsedType
			});
			return INVALID;
		}
		return OK(input.data);
	}
};
ZodUndefined.create = (params) => {
	return new ZodUndefined({
		typeName: ZodFirstPartyTypeKind.ZodUndefined,
		...processCreateParams(params)
	});
};
var ZodNull = class extends ZodType {
	_parse(input) {
		if (this._getType(input) !== ZodParsedType.null) {
			const ctx = this._getOrReturnCtx(input);
			addIssueToContext(ctx, {
				code: ZodIssueCode.invalid_type,
				expected: ZodParsedType.null,
				received: ctx.parsedType
			});
			return INVALID;
		}
		return OK(input.data);
	}
};
ZodNull.create = (params) => {
	return new ZodNull({
		typeName: ZodFirstPartyTypeKind.ZodNull,
		...processCreateParams(params)
	});
};
var ZodAny = class extends ZodType {
	constructor() {
		super(...arguments);
		this._any = true;
	}
	_parse(input) {
		return OK(input.data);
	}
};
ZodAny.create = (params) => {
	return new ZodAny({
		typeName: ZodFirstPartyTypeKind.ZodAny,
		...processCreateParams(params)
	});
};
var ZodUnknown = class extends ZodType {
	constructor() {
		super(...arguments);
		this._unknown = true;
	}
	_parse(input) {
		return OK(input.data);
	}
};
ZodUnknown.create = (params) => {
	return new ZodUnknown({
		typeName: ZodFirstPartyTypeKind.ZodUnknown,
		...processCreateParams(params)
	});
};
var ZodNever = class extends ZodType {
	_parse(input) {
		const ctx = this._getOrReturnCtx(input);
		addIssueToContext(ctx, {
			code: ZodIssueCode.invalid_type,
			expected: ZodParsedType.never,
			received: ctx.parsedType
		});
		return INVALID;
	}
};
ZodNever.create = (params) => {
	return new ZodNever({
		typeName: ZodFirstPartyTypeKind.ZodNever,
		...processCreateParams(params)
	});
};
var ZodVoid = class extends ZodType {
	_parse(input) {
		if (this._getType(input) !== ZodParsedType.undefined) {
			const ctx = this._getOrReturnCtx(input);
			addIssueToContext(ctx, {
				code: ZodIssueCode.invalid_type,
				expected: ZodParsedType.void,
				received: ctx.parsedType
			});
			return INVALID;
		}
		return OK(input.data);
	}
};
ZodVoid.create = (params) => {
	return new ZodVoid({
		typeName: ZodFirstPartyTypeKind.ZodVoid,
		...processCreateParams(params)
	});
};
var ZodArray = class ZodArray extends ZodType {
	_parse(input) {
		const { ctx, status } = this._processInputParams(input);
		const def = this._def;
		if (ctx.parsedType !== ZodParsedType.array) {
			addIssueToContext(ctx, {
				code: ZodIssueCode.invalid_type,
				expected: ZodParsedType.array,
				received: ctx.parsedType
			});
			return INVALID;
		}
		if (def.exactLength !== null) {
			const tooBig = ctx.data.length > def.exactLength.value;
			const tooSmall = ctx.data.length < def.exactLength.value;
			if (tooBig || tooSmall) {
				addIssueToContext(ctx, {
					code: tooBig ? ZodIssueCode.too_big : ZodIssueCode.too_small,
					minimum: tooSmall ? def.exactLength.value : void 0,
					maximum: tooBig ? def.exactLength.value : void 0,
					type: "array",
					inclusive: true,
					exact: true,
					message: def.exactLength.message
				});
				status.dirty();
			}
		}
		if (def.minLength !== null) {
			if (ctx.data.length < def.minLength.value) {
				addIssueToContext(ctx, {
					code: ZodIssueCode.too_small,
					minimum: def.minLength.value,
					type: "array",
					inclusive: true,
					exact: false,
					message: def.minLength.message
				});
				status.dirty();
			}
		}
		if (def.maxLength !== null) {
			if (ctx.data.length > def.maxLength.value) {
				addIssueToContext(ctx, {
					code: ZodIssueCode.too_big,
					maximum: def.maxLength.value,
					type: "array",
					inclusive: true,
					exact: false,
					message: def.maxLength.message
				});
				status.dirty();
			}
		}
		if (ctx.common.async) return Promise.all([...ctx.data].map((item, i) => {
			return def.type._parseAsync(new ParseInputLazyPath(ctx, item, ctx.path, i));
		})).then((result) => {
			return ParseStatus.mergeArray(status, result);
		});
		const result = [...ctx.data].map((item, i) => {
			return def.type._parseSync(new ParseInputLazyPath(ctx, item, ctx.path, i));
		});
		return ParseStatus.mergeArray(status, result);
	}
	get element() {
		return this._def.type;
	}
	min(minLength, message) {
		return new ZodArray({
			...this._def,
			minLength: {
				value: minLength,
				message: errorUtil.toString(message)
			}
		});
	}
	max(maxLength, message) {
		return new ZodArray({
			...this._def,
			maxLength: {
				value: maxLength,
				message: errorUtil.toString(message)
			}
		});
	}
	length(len, message) {
		return new ZodArray({
			...this._def,
			exactLength: {
				value: len,
				message: errorUtil.toString(message)
			}
		});
	}
	nonempty(message) {
		return this.min(1, message);
	}
};
ZodArray.create = (schema, params) => {
	return new ZodArray({
		type: schema,
		minLength: null,
		maxLength: null,
		exactLength: null,
		typeName: ZodFirstPartyTypeKind.ZodArray,
		...processCreateParams(params)
	});
};
function deepPartialify(schema) {
	if (schema instanceof ZodObject) {
		const newShape = {};
		for (const key in schema.shape) {
			const fieldSchema = schema.shape[key];
			newShape[key] = ZodOptional.create(deepPartialify(fieldSchema));
		}
		return new ZodObject({
			...schema._def,
			shape: () => newShape
		});
	} else if (schema instanceof ZodArray) return new ZodArray({
		...schema._def,
		type: deepPartialify(schema.element)
	});
	else if (schema instanceof ZodOptional) return ZodOptional.create(deepPartialify(schema.unwrap()));
	else if (schema instanceof ZodNullable) return ZodNullable.create(deepPartialify(schema.unwrap()));
	else if (schema instanceof ZodTuple) return ZodTuple.create(schema.items.map((item) => deepPartialify(item)));
	else return schema;
}
var ZodObject = class ZodObject extends ZodType {
	constructor() {
		super(...arguments);
		this._cached = null;
		/**
		* @deprecated In most cases, this is no longer needed - unknown properties are now silently stripped.
		* If you want to pass through unknown properties, use `.passthrough()` instead.
		*/
		this.nonstrict = this.passthrough;
		/**
		* @deprecated Use `.extend` instead
		*  */
		this.augment = this.extend;
	}
	_getCached() {
		if (this._cached !== null) return this._cached;
		const shape = this._def.shape();
		const keys = util.objectKeys(shape);
		this._cached = {
			shape,
			keys
		};
		return this._cached;
	}
	_parse(input) {
		if (this._getType(input) !== ZodParsedType.object) {
			const ctx = this._getOrReturnCtx(input);
			addIssueToContext(ctx, {
				code: ZodIssueCode.invalid_type,
				expected: ZodParsedType.object,
				received: ctx.parsedType
			});
			return INVALID;
		}
		const { status, ctx } = this._processInputParams(input);
		const { shape, keys: shapeKeys } = this._getCached();
		const extraKeys = [];
		if (!(this._def.catchall instanceof ZodNever && this._def.unknownKeys === "strip")) {
			for (const key in ctx.data) if (!shapeKeys.includes(key)) extraKeys.push(key);
		}
		const pairs = [];
		for (const key of shapeKeys) {
			const keyValidator = shape[key];
			const value = ctx.data[key];
			pairs.push({
				key: {
					status: "valid",
					value: key
				},
				value: keyValidator._parse(new ParseInputLazyPath(ctx, value, ctx.path, key)),
				alwaysSet: key in ctx.data
			});
		}
		if (this._def.catchall instanceof ZodNever) {
			const unknownKeys = this._def.unknownKeys;
			if (unknownKeys === "passthrough") for (const key of extraKeys) pairs.push({
				key: {
					status: "valid",
					value: key
				},
				value: {
					status: "valid",
					value: ctx.data[key]
				}
			});
			else if (unknownKeys === "strict") {
				if (extraKeys.length > 0) {
					addIssueToContext(ctx, {
						code: ZodIssueCode.unrecognized_keys,
						keys: extraKeys
					});
					status.dirty();
				}
			} else if (unknownKeys === "strip") {} else throw new Error(`Internal ZodObject error: invalid unknownKeys value.`);
		} else {
			const catchall = this._def.catchall;
			for (const key of extraKeys) {
				const value = ctx.data[key];
				pairs.push({
					key: {
						status: "valid",
						value: key
					},
					value: catchall._parse(new ParseInputLazyPath(ctx, value, ctx.path, key)),
					alwaysSet: key in ctx.data
				});
			}
		}
		if (ctx.common.async) return Promise.resolve().then(async () => {
			const syncPairs = [];
			for (const pair of pairs) {
				const key = await pair.key;
				const value = await pair.value;
				syncPairs.push({
					key,
					value,
					alwaysSet: pair.alwaysSet
				});
			}
			return syncPairs;
		}).then((syncPairs) => {
			return ParseStatus.mergeObjectSync(status, syncPairs);
		});
		else return ParseStatus.mergeObjectSync(status, pairs);
	}
	get shape() {
		return this._def.shape();
	}
	strict(message) {
		errorUtil.errToObj;
		return new ZodObject({
			...this._def,
			unknownKeys: "strict",
			...message !== void 0 ? { errorMap: (issue, ctx) => {
				const defaultError = this._def.errorMap?.(issue, ctx).message ?? ctx.defaultError;
				if (issue.code === "unrecognized_keys") return { message: errorUtil.errToObj(message).message ?? defaultError };
				return { message: defaultError };
			} } : {}
		});
	}
	strip() {
		return new ZodObject({
			...this._def,
			unknownKeys: "strip"
		});
	}
	passthrough() {
		return new ZodObject({
			...this._def,
			unknownKeys: "passthrough"
		});
	}
	extend(augmentation) {
		return new ZodObject({
			...this._def,
			shape: () => ({
				...this._def.shape(),
				...augmentation
			})
		});
	}
	/**
	* Prior to zod@1.0.12 there was a bug in the
	* inferred type of merged objects. Please
	* upgrade if you are experiencing issues.
	*/
	merge(merging) {
		return new ZodObject({
			unknownKeys: merging._def.unknownKeys,
			catchall: merging._def.catchall,
			shape: () => ({
				...this._def.shape(),
				...merging._def.shape()
			}),
			typeName: ZodFirstPartyTypeKind.ZodObject
		});
	}
	setKey(key, schema) {
		return this.augment({ [key]: schema });
	}
	catchall(index) {
		return new ZodObject({
			...this._def,
			catchall: index
		});
	}
	pick(mask) {
		const shape = {};
		for (const key of util.objectKeys(mask)) if (mask[key] && this.shape[key]) shape[key] = this.shape[key];
		return new ZodObject({
			...this._def,
			shape: () => shape
		});
	}
	omit(mask) {
		const shape = {};
		for (const key of util.objectKeys(this.shape)) if (!mask[key]) shape[key] = this.shape[key];
		return new ZodObject({
			...this._def,
			shape: () => shape
		});
	}
	/**
	* @deprecated
	*/
	deepPartial() {
		return deepPartialify(this);
	}
	partial(mask) {
		const newShape = {};
		for (const key of util.objectKeys(this.shape)) {
			const fieldSchema = this.shape[key];
			if (mask && !mask[key]) newShape[key] = fieldSchema;
			else newShape[key] = fieldSchema.optional();
		}
		return new ZodObject({
			...this._def,
			shape: () => newShape
		});
	}
	required(mask) {
		const newShape = {};
		for (const key of util.objectKeys(this.shape)) if (mask && !mask[key]) newShape[key] = this.shape[key];
		else {
			let newField = this.shape[key];
			while (newField instanceof ZodOptional) newField = newField._def.innerType;
			newShape[key] = newField;
		}
		return new ZodObject({
			...this._def,
			shape: () => newShape
		});
	}
	keyof() {
		return createZodEnum(util.objectKeys(this.shape));
	}
};
ZodObject.create = (shape, params) => {
	return new ZodObject({
		shape: () => shape,
		unknownKeys: "strip",
		catchall: ZodNever.create(),
		typeName: ZodFirstPartyTypeKind.ZodObject,
		...processCreateParams(params)
	});
};
ZodObject.strictCreate = (shape, params) => {
	return new ZodObject({
		shape: () => shape,
		unknownKeys: "strict",
		catchall: ZodNever.create(),
		typeName: ZodFirstPartyTypeKind.ZodObject,
		...processCreateParams(params)
	});
};
ZodObject.lazycreate = (shape, params) => {
	return new ZodObject({
		shape,
		unknownKeys: "strip",
		catchall: ZodNever.create(),
		typeName: ZodFirstPartyTypeKind.ZodObject,
		...processCreateParams(params)
	});
};
var ZodUnion = class extends ZodType {
	_parse(input) {
		const { ctx } = this._processInputParams(input);
		const options = this._def.options;
		function handleResults(results) {
			for (const result of results) if (result.result.status === "valid") return result.result;
			for (const result of results) if (result.result.status === "dirty") {
				ctx.common.issues.push(...result.ctx.common.issues);
				return result.result;
			}
			const unionErrors = results.map((result) => new ZodError(result.ctx.common.issues));
			addIssueToContext(ctx, {
				code: ZodIssueCode.invalid_union,
				unionErrors
			});
			return INVALID;
		}
		if (ctx.common.async) return Promise.all(options.map(async (option) => {
			const childCtx = {
				...ctx,
				common: {
					...ctx.common,
					issues: []
				},
				parent: null
			};
			return {
				result: await option._parseAsync({
					data: ctx.data,
					path: ctx.path,
					parent: childCtx
				}),
				ctx: childCtx
			};
		})).then(handleResults);
		else {
			let dirty = void 0;
			const issues = [];
			for (const option of options) {
				const childCtx = {
					...ctx,
					common: {
						...ctx.common,
						issues: []
					},
					parent: null
				};
				const result = option._parseSync({
					data: ctx.data,
					path: ctx.path,
					parent: childCtx
				});
				if (result.status === "valid") return result;
				else if (result.status === "dirty" && !dirty) dirty = {
					result,
					ctx: childCtx
				};
				if (childCtx.common.issues.length) issues.push(childCtx.common.issues);
			}
			if (dirty) {
				ctx.common.issues.push(...dirty.ctx.common.issues);
				return dirty.result;
			}
			const unionErrors = issues.map((issues) => new ZodError(issues));
			addIssueToContext(ctx, {
				code: ZodIssueCode.invalid_union,
				unionErrors
			});
			return INVALID;
		}
	}
	get options() {
		return this._def.options;
	}
};
ZodUnion.create = (types, params) => {
	return new ZodUnion({
		options: types,
		typeName: ZodFirstPartyTypeKind.ZodUnion,
		...processCreateParams(params)
	});
};
var getDiscriminator = (type) => {
	if (type instanceof ZodLazy) return getDiscriminator(type.schema);
	else if (type instanceof ZodEffects) return getDiscriminator(type.innerType());
	else if (type instanceof ZodLiteral) return [type.value];
	else if (type instanceof ZodEnum) return type.options;
	else if (type instanceof ZodNativeEnum) return util.objectValues(type.enum);
	else if (type instanceof ZodDefault) return getDiscriminator(type._def.innerType);
	else if (type instanceof ZodUndefined) return [void 0];
	else if (type instanceof ZodNull) return [null];
	else if (type instanceof ZodOptional) return [void 0, ...getDiscriminator(type.unwrap())];
	else if (type instanceof ZodNullable) return [null, ...getDiscriminator(type.unwrap())];
	else if (type instanceof ZodBranded) return getDiscriminator(type.unwrap());
	else if (type instanceof ZodReadonly) return getDiscriminator(type.unwrap());
	else if (type instanceof ZodCatch) return getDiscriminator(type._def.innerType);
	else return [];
};
var ZodDiscriminatedUnion = class ZodDiscriminatedUnion extends ZodType {
	_parse(input) {
		const { ctx } = this._processInputParams(input);
		if (ctx.parsedType !== ZodParsedType.object) {
			addIssueToContext(ctx, {
				code: ZodIssueCode.invalid_type,
				expected: ZodParsedType.object,
				received: ctx.parsedType
			});
			return INVALID;
		}
		const discriminator = this.discriminator;
		const discriminatorValue = ctx.data[discriminator];
		const option = this.optionsMap.get(discriminatorValue);
		if (!option) {
			addIssueToContext(ctx, {
				code: ZodIssueCode.invalid_union_discriminator,
				options: Array.from(this.optionsMap.keys()),
				path: [discriminator]
			});
			return INVALID;
		}
		if (ctx.common.async) return option._parseAsync({
			data: ctx.data,
			path: ctx.path,
			parent: ctx
		});
		else return option._parseSync({
			data: ctx.data,
			path: ctx.path,
			parent: ctx
		});
	}
	get discriminator() {
		return this._def.discriminator;
	}
	get options() {
		return this._def.options;
	}
	get optionsMap() {
		return this._def.optionsMap;
	}
	/**
	* The constructor of the discriminated union schema. Its behaviour is very similar to that of the normal z.union() constructor.
	* However, it only allows a union of objects, all of which need to share a discriminator property. This property must
	* have a different value for each object in the union.
	* @param discriminator the name of the discriminator property
	* @param types an array of object schemas
	* @param params
	*/
	static create(discriminator, options, params) {
		const optionsMap = /* @__PURE__ */ new Map();
		for (const type of options) {
			const discriminatorValues = getDiscriminator(type.shape[discriminator]);
			if (!discriminatorValues.length) throw new Error(`A discriminator value for key \`${discriminator}\` could not be extracted from all schema options`);
			for (const value of discriminatorValues) {
				if (optionsMap.has(value)) throw new Error(`Discriminator property ${String(discriminator)} has duplicate value ${String(value)}`);
				optionsMap.set(value, type);
			}
		}
		return new ZodDiscriminatedUnion({
			typeName: ZodFirstPartyTypeKind.ZodDiscriminatedUnion,
			discriminator,
			options,
			optionsMap,
			...processCreateParams(params)
		});
	}
};
function mergeValues(a, b) {
	const aType = getParsedType(a);
	const bType = getParsedType(b);
	if (a === b) return {
		valid: true,
		data: a
	};
	else if (aType === ZodParsedType.object && bType === ZodParsedType.object) {
		const bKeys = util.objectKeys(b);
		const sharedKeys = util.objectKeys(a).filter((key) => bKeys.indexOf(key) !== -1);
		const newObj = {
			...a,
			...b
		};
		if (Object.prototype.hasOwnProperty.call(newObj, "__proto__")) delete newObj.__proto__;
		for (const key of sharedKeys) {
			if (key === "__proto__") continue;
			const sharedValue = mergeValues(a[key], b[key]);
			if (!sharedValue.valid) return { valid: false };
			newObj[key] = sharedValue.data;
		}
		return {
			valid: true,
			data: newObj
		};
	} else if (aType === ZodParsedType.array && bType === ZodParsedType.array) {
		if (a.length !== b.length) return { valid: false };
		const newArray = [];
		for (let index = 0; index < a.length; index++) {
			const itemA = a[index];
			const itemB = b[index];
			const sharedValue = mergeValues(itemA, itemB);
			if (!sharedValue.valid) return { valid: false };
			newArray.push(sharedValue.data);
		}
		return {
			valid: true,
			data: newArray
		};
	} else if (aType === ZodParsedType.date && bType === ZodParsedType.date && +a === +b) return {
		valid: true,
		data: a
	};
	else return { valid: false };
}
var ZodIntersection = class extends ZodType {
	_parse(input) {
		const { status, ctx } = this._processInputParams(input);
		const handleParsed = (parsedLeft, parsedRight) => {
			if (isAborted(parsedLeft) || isAborted(parsedRight)) return INVALID;
			const merged = mergeValues(parsedLeft.value, parsedRight.value);
			if (!merged.valid) {
				addIssueToContext(ctx, { code: ZodIssueCode.invalid_intersection_types });
				return INVALID;
			}
			if (isDirty(parsedLeft) || isDirty(parsedRight)) status.dirty();
			return {
				status: status.value,
				value: merged.data
			};
		};
		if (ctx.common.async) return Promise.all([this._def.left._parseAsync({
			data: ctx.data,
			path: ctx.path,
			parent: ctx
		}), this._def.right._parseAsync({
			data: ctx.data,
			path: ctx.path,
			parent: ctx
		})]).then(([left, right]) => handleParsed(left, right));
		else return handleParsed(this._def.left._parseSync({
			data: ctx.data,
			path: ctx.path,
			parent: ctx
		}), this._def.right._parseSync({
			data: ctx.data,
			path: ctx.path,
			parent: ctx
		}));
	}
};
ZodIntersection.create = (left, right, params) => {
	return new ZodIntersection({
		left,
		right,
		typeName: ZodFirstPartyTypeKind.ZodIntersection,
		...processCreateParams(params)
	});
};
var ZodTuple = class ZodTuple extends ZodType {
	_parse(input) {
		const { status, ctx } = this._processInputParams(input);
		if (ctx.parsedType !== ZodParsedType.array) {
			addIssueToContext(ctx, {
				code: ZodIssueCode.invalid_type,
				expected: ZodParsedType.array,
				received: ctx.parsedType
			});
			return INVALID;
		}
		if (ctx.data.length < this._def.items.length) {
			addIssueToContext(ctx, {
				code: ZodIssueCode.too_small,
				minimum: this._def.items.length,
				inclusive: true,
				exact: false,
				type: "array"
			});
			return INVALID;
		}
		if (!this._def.rest && ctx.data.length > this._def.items.length) {
			addIssueToContext(ctx, {
				code: ZodIssueCode.too_big,
				maximum: this._def.items.length,
				inclusive: true,
				exact: false,
				type: "array"
			});
			status.dirty();
		}
		const items = [...ctx.data].map((item, itemIndex) => {
			const schema = this._def.items[itemIndex] || this._def.rest;
			if (!schema) return null;
			return schema._parse(new ParseInputLazyPath(ctx, item, ctx.path, itemIndex));
		}).filter((x) => !!x);
		if (ctx.common.async) return Promise.all(items).then((results) => {
			return ParseStatus.mergeArray(status, results);
		});
		else return ParseStatus.mergeArray(status, items);
	}
	get items() {
		return this._def.items;
	}
	rest(rest) {
		return new ZodTuple({
			...this._def,
			rest
		});
	}
};
ZodTuple.create = (schemas, params) => {
	if (!Array.isArray(schemas)) throw new Error("You must pass an array of schemas to z.tuple([ ... ])");
	return new ZodTuple({
		items: schemas,
		typeName: ZodFirstPartyTypeKind.ZodTuple,
		rest: null,
		...processCreateParams(params)
	});
};
var ZodRecord = class ZodRecord extends ZodType {
	get keySchema() {
		return this._def.keyType;
	}
	get valueSchema() {
		return this._def.valueType;
	}
	_parse(input) {
		const { status, ctx } = this._processInputParams(input);
		if (ctx.parsedType !== ZodParsedType.object) {
			addIssueToContext(ctx, {
				code: ZodIssueCode.invalid_type,
				expected: ZodParsedType.object,
				received: ctx.parsedType
			});
			return INVALID;
		}
		const pairs = [];
		const keyType = this._def.keyType;
		const valueType = this._def.valueType;
		for (const key in ctx.data) pairs.push({
			key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, key)),
			value: valueType._parse(new ParseInputLazyPath(ctx, ctx.data[key], ctx.path, key)),
			alwaysSet: key in ctx.data
		});
		if (ctx.common.async) return ParseStatus.mergeObjectAsync(status, pairs);
		else return ParseStatus.mergeObjectSync(status, pairs);
	}
	get element() {
		return this._def.valueType;
	}
	static create(first, second, third) {
		if (second instanceof ZodType) return new ZodRecord({
			keyType: first,
			valueType: second,
			typeName: ZodFirstPartyTypeKind.ZodRecord,
			...processCreateParams(third)
		});
		return new ZodRecord({
			keyType: ZodString.create(),
			valueType: first,
			typeName: ZodFirstPartyTypeKind.ZodRecord,
			...processCreateParams(second)
		});
	}
};
var ZodMap = class extends ZodType {
	get keySchema() {
		return this._def.keyType;
	}
	get valueSchema() {
		return this._def.valueType;
	}
	_parse(input) {
		const { status, ctx } = this._processInputParams(input);
		if (ctx.parsedType !== ZodParsedType.map) {
			addIssueToContext(ctx, {
				code: ZodIssueCode.invalid_type,
				expected: ZodParsedType.map,
				received: ctx.parsedType
			});
			return INVALID;
		}
		const keyType = this._def.keyType;
		const valueType = this._def.valueType;
		const pairs = [...ctx.data.entries()].map(([key, value], index) => {
			return {
				key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, [index, "key"])),
				value: valueType._parse(new ParseInputLazyPath(ctx, value, ctx.path, [index, "value"]))
			};
		});
		if (ctx.common.async) {
			const finalMap = /* @__PURE__ */ new Map();
			return Promise.resolve().then(async () => {
				for (const pair of pairs) {
					const key = await pair.key;
					const value = await pair.value;
					if (key.status === "aborted" || value.status === "aborted") return INVALID;
					if (key.status === "dirty" || value.status === "dirty") status.dirty();
					finalMap.set(key.value, value.value);
				}
				return {
					status: status.value,
					value: finalMap
				};
			});
		} else {
			const finalMap = /* @__PURE__ */ new Map();
			for (const pair of pairs) {
				const key = pair.key;
				const value = pair.value;
				if (key.status === "aborted" || value.status === "aborted") return INVALID;
				if (key.status === "dirty" || value.status === "dirty") status.dirty();
				finalMap.set(key.value, value.value);
			}
			return {
				status: status.value,
				value: finalMap
			};
		}
	}
};
ZodMap.create = (keyType, valueType, params) => {
	return new ZodMap({
		valueType,
		keyType,
		typeName: ZodFirstPartyTypeKind.ZodMap,
		...processCreateParams(params)
	});
};
var ZodSet = class ZodSet extends ZodType {
	_parse(input) {
		const { status, ctx } = this._processInputParams(input);
		if (ctx.parsedType !== ZodParsedType.set) {
			addIssueToContext(ctx, {
				code: ZodIssueCode.invalid_type,
				expected: ZodParsedType.set,
				received: ctx.parsedType
			});
			return INVALID;
		}
		const def = this._def;
		if (def.minSize !== null) {
			if (ctx.data.size < def.minSize.value) {
				addIssueToContext(ctx, {
					code: ZodIssueCode.too_small,
					minimum: def.minSize.value,
					type: "set",
					inclusive: true,
					exact: false,
					message: def.minSize.message
				});
				status.dirty();
			}
		}
		if (def.maxSize !== null) {
			if (ctx.data.size > def.maxSize.value) {
				addIssueToContext(ctx, {
					code: ZodIssueCode.too_big,
					maximum: def.maxSize.value,
					type: "set",
					inclusive: true,
					exact: false,
					message: def.maxSize.message
				});
				status.dirty();
			}
		}
		const valueType = this._def.valueType;
		function finalizeSet(elements) {
			const parsedSet = /* @__PURE__ */ new Set();
			for (const element of elements) {
				if (element.status === "aborted") return INVALID;
				if (element.status === "dirty") status.dirty();
				parsedSet.add(element.value);
			}
			return {
				status: status.value,
				value: parsedSet
			};
		}
		const elements = [...ctx.data.values()].map((item, i) => valueType._parse(new ParseInputLazyPath(ctx, item, ctx.path, i)));
		if (ctx.common.async) return Promise.all(elements).then((elements) => finalizeSet(elements));
		else return finalizeSet(elements);
	}
	min(minSize, message) {
		return new ZodSet({
			...this._def,
			minSize: {
				value: minSize,
				message: errorUtil.toString(message)
			}
		});
	}
	max(maxSize, message) {
		return new ZodSet({
			...this._def,
			maxSize: {
				value: maxSize,
				message: errorUtil.toString(message)
			}
		});
	}
	size(size, message) {
		return this.min(size, message).max(size, message);
	}
	nonempty(message) {
		return this.min(1, message);
	}
};
ZodSet.create = (valueType, params) => {
	return new ZodSet({
		valueType,
		minSize: null,
		maxSize: null,
		typeName: ZodFirstPartyTypeKind.ZodSet,
		...processCreateParams(params)
	});
};
var ZodFunction = class ZodFunction extends ZodType {
	constructor() {
		super(...arguments);
		this.validate = this.implement;
	}
	_parse(input) {
		const { ctx } = this._processInputParams(input);
		if (ctx.parsedType !== ZodParsedType.function) {
			addIssueToContext(ctx, {
				code: ZodIssueCode.invalid_type,
				expected: ZodParsedType.function,
				received: ctx.parsedType
			});
			return INVALID;
		}
		function makeArgsIssue(args, error) {
			return makeIssue({
				data: args,
				path: ctx.path,
				errorMaps: [
					ctx.common.contextualErrorMap,
					ctx.schemaErrorMap,
					getErrorMap(),
					errorMap
				].filter((x) => !!x),
				issueData: {
					code: ZodIssueCode.invalid_arguments,
					argumentsError: error
				}
			});
		}
		function makeReturnsIssue(returns, error) {
			return makeIssue({
				data: returns,
				path: ctx.path,
				errorMaps: [
					ctx.common.contextualErrorMap,
					ctx.schemaErrorMap,
					getErrorMap(),
					errorMap
				].filter((x) => !!x),
				issueData: {
					code: ZodIssueCode.invalid_return_type,
					returnTypeError: error
				}
			});
		}
		const params = { errorMap: ctx.common.contextualErrorMap };
		const fn = ctx.data;
		if (this._def.returns instanceof ZodPromise) {
			const me = this;
			return OK(async function(...args) {
				const error = new ZodError([]);
				const parsedArgs = await me._def.args.parseAsync(args, params).catch((e) => {
					error.addIssue(makeArgsIssue(args, e));
					throw error;
				});
				const result = await Reflect.apply(fn, this, parsedArgs);
				return await me._def.returns._def.type.parseAsync(result, params).catch((e) => {
					error.addIssue(makeReturnsIssue(result, e));
					throw error;
				});
			});
		} else {
			const me = this;
			return OK(function(...args) {
				const parsedArgs = me._def.args.safeParse(args, params);
				if (!parsedArgs.success) throw new ZodError([makeArgsIssue(args, parsedArgs.error)]);
				const result = Reflect.apply(fn, this, parsedArgs.data);
				const parsedReturns = me._def.returns.safeParse(result, params);
				if (!parsedReturns.success) throw new ZodError([makeReturnsIssue(result, parsedReturns.error)]);
				return parsedReturns.data;
			});
		}
	}
	parameters() {
		return this._def.args;
	}
	returnType() {
		return this._def.returns;
	}
	args(...items) {
		return new ZodFunction({
			...this._def,
			args: ZodTuple.create(items).rest(ZodUnknown.create())
		});
	}
	returns(returnType) {
		return new ZodFunction({
			...this._def,
			returns: returnType
		});
	}
	implement(func) {
		return this.parse(func);
	}
	strictImplement(func) {
		return this.parse(func);
	}
	static create(args, returns, params) {
		return new ZodFunction({
			args: args ? args : ZodTuple.create([]).rest(ZodUnknown.create()),
			returns: returns || ZodUnknown.create(),
			typeName: ZodFirstPartyTypeKind.ZodFunction,
			...processCreateParams(params)
		});
	}
};
var ZodLazy = class extends ZodType {
	get schema() {
		return this._def.getter();
	}
	_parse(input) {
		const { ctx } = this._processInputParams(input);
		return this._def.getter()._parse({
			data: ctx.data,
			path: ctx.path,
			parent: ctx
		});
	}
};
ZodLazy.create = (getter, params) => {
	return new ZodLazy({
		getter,
		typeName: ZodFirstPartyTypeKind.ZodLazy,
		...processCreateParams(params)
	});
};
var ZodLiteral = class extends ZodType {
	_parse(input) {
		if (input.data !== this._def.value) {
			const ctx = this._getOrReturnCtx(input);
			addIssueToContext(ctx, {
				received: ctx.data,
				code: ZodIssueCode.invalid_literal,
				expected: this._def.value
			});
			return INVALID;
		}
		return {
			status: "valid",
			value: input.data
		};
	}
	get value() {
		return this._def.value;
	}
};
ZodLiteral.create = (value, params) => {
	return new ZodLiteral({
		value,
		typeName: ZodFirstPartyTypeKind.ZodLiteral,
		...processCreateParams(params)
	});
};
function createZodEnum(values, params) {
	return new ZodEnum({
		values,
		typeName: ZodFirstPartyTypeKind.ZodEnum,
		...processCreateParams(params)
	});
}
var ZodEnum = class ZodEnum extends ZodType {
	_parse(input) {
		if (typeof input.data !== "string") {
			const ctx = this._getOrReturnCtx(input);
			const expectedValues = this._def.values;
			addIssueToContext(ctx, {
				expected: util.joinValues(expectedValues),
				received: ctx.parsedType,
				code: ZodIssueCode.invalid_type
			});
			return INVALID;
		}
		if (!this._cache) this._cache = new Set(this._def.values);
		if (!this._cache.has(input.data)) {
			const ctx = this._getOrReturnCtx(input);
			const expectedValues = this._def.values;
			addIssueToContext(ctx, {
				received: ctx.data,
				code: ZodIssueCode.invalid_enum_value,
				options: expectedValues
			});
			return INVALID;
		}
		return OK(input.data);
	}
	get options() {
		return this._def.values;
	}
	get enum() {
		const enumValues = {};
		for (const val of this._def.values) enumValues[val] = val;
		return enumValues;
	}
	get Values() {
		const enumValues = {};
		for (const val of this._def.values) enumValues[val] = val;
		return enumValues;
	}
	get Enum() {
		const enumValues = {};
		for (const val of this._def.values) enumValues[val] = val;
		return enumValues;
	}
	extract(values, newDef = this._def) {
		return ZodEnum.create(values, {
			...this._def,
			...newDef
		});
	}
	exclude(values, newDef = this._def) {
		return ZodEnum.create(this.options.filter((opt) => !values.includes(opt)), {
			...this._def,
			...newDef
		});
	}
};
ZodEnum.create = createZodEnum;
var ZodNativeEnum = class extends ZodType {
	_parse(input) {
		const nativeEnumValues = util.getValidEnumValues(this._def.values);
		const ctx = this._getOrReturnCtx(input);
		if (ctx.parsedType !== ZodParsedType.string && ctx.parsedType !== ZodParsedType.number) {
			const expectedValues = util.objectValues(nativeEnumValues);
			addIssueToContext(ctx, {
				expected: util.joinValues(expectedValues),
				received: ctx.parsedType,
				code: ZodIssueCode.invalid_type
			});
			return INVALID;
		}
		if (!this._cache) this._cache = new Set(util.getValidEnumValues(this._def.values));
		if (!this._cache.has(input.data)) {
			const expectedValues = util.objectValues(nativeEnumValues);
			addIssueToContext(ctx, {
				received: ctx.data,
				code: ZodIssueCode.invalid_enum_value,
				options: expectedValues
			});
			return INVALID;
		}
		return OK(input.data);
	}
	get enum() {
		return this._def.values;
	}
};
ZodNativeEnum.create = (values, params) => {
	return new ZodNativeEnum({
		values,
		typeName: ZodFirstPartyTypeKind.ZodNativeEnum,
		...processCreateParams(params)
	});
};
var ZodPromise = class extends ZodType {
	unwrap() {
		return this._def.type;
	}
	_parse(input) {
		const { ctx } = this._processInputParams(input);
		if (ctx.parsedType !== ZodParsedType.promise && ctx.common.async === false) {
			addIssueToContext(ctx, {
				code: ZodIssueCode.invalid_type,
				expected: ZodParsedType.promise,
				received: ctx.parsedType
			});
			return INVALID;
		}
		return OK((ctx.parsedType === ZodParsedType.promise ? ctx.data : Promise.resolve(ctx.data)).then((data) => {
			return this._def.type.parseAsync(data, {
				path: ctx.path,
				errorMap: ctx.common.contextualErrorMap
			});
		}));
	}
};
ZodPromise.create = (schema, params) => {
	return new ZodPromise({
		type: schema,
		typeName: ZodFirstPartyTypeKind.ZodPromise,
		...processCreateParams(params)
	});
};
var ZodEffects = class extends ZodType {
	innerType() {
		return this._def.schema;
	}
	sourceType() {
		return this._def.schema._def.typeName === ZodFirstPartyTypeKind.ZodEffects ? this._def.schema.sourceType() : this._def.schema;
	}
	_parse(input) {
		const { status, ctx } = this._processInputParams(input);
		const effect = this._def.effect || null;
		const checkCtx = {
			addIssue: (arg) => {
				addIssueToContext(ctx, arg);
				if (arg.fatal) status.abort();
				else status.dirty();
			},
			get path() {
				return ctx.path;
			}
		};
		checkCtx.addIssue = checkCtx.addIssue.bind(checkCtx);
		if (effect.type === "preprocess") {
			const processed = effect.transform(ctx.data, checkCtx);
			if (ctx.common.async) return Promise.resolve(processed).then(async (processed) => {
				if (status.value === "aborted") return INVALID;
				const result = await this._def.schema._parseAsync({
					data: processed,
					path: ctx.path,
					parent: ctx
				});
				if (result.status === "aborted") return INVALID;
				if (result.status === "dirty") return DIRTY(result.value);
				if (status.value === "dirty") return DIRTY(result.value);
				return result;
			});
			else {
				if (status.value === "aborted") return INVALID;
				const result = this._def.schema._parseSync({
					data: processed,
					path: ctx.path,
					parent: ctx
				});
				if (result.status === "aborted") return INVALID;
				if (result.status === "dirty") return DIRTY(result.value);
				if (status.value === "dirty") return DIRTY(result.value);
				return result;
			}
		}
		if (effect.type === "refinement") {
			const executeRefinement = (acc) => {
				const result = effect.refinement(acc, checkCtx);
				if (ctx.common.async) return Promise.resolve(result);
				if (result instanceof Promise) throw new Error("Async refinement encountered during synchronous parse operation. Use .parseAsync instead.");
				return acc;
			};
			if (ctx.common.async === false) {
				const inner = this._def.schema._parseSync({
					data: ctx.data,
					path: ctx.path,
					parent: ctx
				});
				if (inner.status === "aborted") return INVALID;
				if (inner.status === "dirty") status.dirty();
				executeRefinement(inner.value);
				return {
					status: status.value,
					value: inner.value
				};
			} else return this._def.schema._parseAsync({
				data: ctx.data,
				path: ctx.path,
				parent: ctx
			}).then((inner) => {
				if (inner.status === "aborted") return INVALID;
				if (inner.status === "dirty") status.dirty();
				return executeRefinement(inner.value).then(() => {
					return {
						status: status.value,
						value: inner.value
					};
				});
			});
		}
		if (effect.type === "transform") {
			if (ctx.common.async === false) {
				const base = this._def.schema._parseSync({
					data: ctx.data,
					path: ctx.path,
					parent: ctx
				});
				if (!isValid(base)) return INVALID;
				const result = effect.transform(base.value, checkCtx);
				if (result instanceof Promise) throw new Error(`Asynchronous transform encountered during synchronous parse operation. Use .parseAsync instead.`);
				return {
					status: status.value,
					value: result
				};
			} else return this._def.schema._parseAsync({
				data: ctx.data,
				path: ctx.path,
				parent: ctx
			}).then((base) => {
				if (!isValid(base)) return INVALID;
				return Promise.resolve(effect.transform(base.value, checkCtx)).then((result) => ({
					status: status.value,
					value: result
				}));
			});
		}
		util.assertNever(effect);
	}
};
ZodEffects.create = (schema, effect, params) => {
	return new ZodEffects({
		schema,
		typeName: ZodFirstPartyTypeKind.ZodEffects,
		effect,
		...processCreateParams(params)
	});
};
ZodEffects.createWithPreprocess = (preprocess, schema, params) => {
	return new ZodEffects({
		schema,
		effect: {
			type: "preprocess",
			transform: preprocess
		},
		typeName: ZodFirstPartyTypeKind.ZodEffects,
		...processCreateParams(params)
	});
};
var ZodOptional = class extends ZodType {
	_parse(input) {
		if (this._getType(input) === ZodParsedType.undefined) return OK(void 0);
		return this._def.innerType._parse(input);
	}
	unwrap() {
		return this._def.innerType;
	}
};
ZodOptional.create = (type, params) => {
	return new ZodOptional({
		innerType: type,
		typeName: ZodFirstPartyTypeKind.ZodOptional,
		...processCreateParams(params)
	});
};
var ZodNullable = class extends ZodType {
	_parse(input) {
		if (this._getType(input) === ZodParsedType.null) return OK(null);
		return this._def.innerType._parse(input);
	}
	unwrap() {
		return this._def.innerType;
	}
};
ZodNullable.create = (type, params) => {
	return new ZodNullable({
		innerType: type,
		typeName: ZodFirstPartyTypeKind.ZodNullable,
		...processCreateParams(params)
	});
};
var ZodDefault = class extends ZodType {
	_parse(input) {
		const { ctx } = this._processInputParams(input);
		let data = ctx.data;
		if (ctx.parsedType === ZodParsedType.undefined) data = this._def.defaultValue();
		return this._def.innerType._parse({
			data,
			path: ctx.path,
			parent: ctx
		});
	}
	removeDefault() {
		return this._def.innerType;
	}
};
ZodDefault.create = (type, params) => {
	return new ZodDefault({
		innerType: type,
		typeName: ZodFirstPartyTypeKind.ZodDefault,
		defaultValue: typeof params.default === "function" ? params.default : () => params.default,
		...processCreateParams(params)
	});
};
var ZodCatch = class extends ZodType {
	_parse(input) {
		const { ctx } = this._processInputParams(input);
		const newCtx = {
			...ctx,
			common: {
				...ctx.common,
				issues: []
			}
		};
		const result = this._def.innerType._parse({
			data: newCtx.data,
			path: newCtx.path,
			parent: { ...newCtx }
		});
		if (isAsync(result)) return result.then((result) => {
			return {
				status: "valid",
				value: result.status === "valid" ? result.value : this._def.catchValue({
					get error() {
						return new ZodError(newCtx.common.issues);
					},
					input: newCtx.data
				})
			};
		});
		else return {
			status: "valid",
			value: result.status === "valid" ? result.value : this._def.catchValue({
				get error() {
					return new ZodError(newCtx.common.issues);
				},
				input: newCtx.data
			})
		};
	}
	removeCatch() {
		return this._def.innerType;
	}
};
ZodCatch.create = (type, params) => {
	return new ZodCatch({
		innerType: type,
		typeName: ZodFirstPartyTypeKind.ZodCatch,
		catchValue: typeof params.catch === "function" ? params.catch : () => params.catch,
		...processCreateParams(params)
	});
};
var ZodNaN = class extends ZodType {
	_parse(input) {
		if (this._getType(input) !== ZodParsedType.nan) {
			const ctx = this._getOrReturnCtx(input);
			addIssueToContext(ctx, {
				code: ZodIssueCode.invalid_type,
				expected: ZodParsedType.nan,
				received: ctx.parsedType
			});
			return INVALID;
		}
		return {
			status: "valid",
			value: input.data
		};
	}
};
ZodNaN.create = (params) => {
	return new ZodNaN({
		typeName: ZodFirstPartyTypeKind.ZodNaN,
		...processCreateParams(params)
	});
};
var ZodBranded = class extends ZodType {
	_parse(input) {
		const { ctx } = this._processInputParams(input);
		const data = ctx.data;
		return this._def.type._parse({
			data,
			path: ctx.path,
			parent: ctx
		});
	}
	unwrap() {
		return this._def.type;
	}
};
var ZodPipeline = class ZodPipeline extends ZodType {
	_parse(input) {
		const { status, ctx } = this._processInputParams(input);
		if (ctx.common.async) {
			const handleAsync = async () => {
				const inResult = await this._def.in._parseAsync({
					data: ctx.data,
					path: ctx.path,
					parent: ctx
				});
				if (inResult.status === "aborted") return INVALID;
				if (inResult.status === "dirty") {
					status.dirty();
					return DIRTY(inResult.value);
				} else return this._def.out._parseAsync({
					data: inResult.value,
					path: ctx.path,
					parent: ctx
				});
			};
			return handleAsync();
		} else {
			const inResult = this._def.in._parseSync({
				data: ctx.data,
				path: ctx.path,
				parent: ctx
			});
			if (inResult.status === "aborted") return INVALID;
			if (inResult.status === "dirty") {
				status.dirty();
				return {
					status: "dirty",
					value: inResult.value
				};
			} else return this._def.out._parseSync({
				data: inResult.value,
				path: ctx.path,
				parent: ctx
			});
		}
	}
	static create(a, b) {
		return new ZodPipeline({
			in: a,
			out: b,
			typeName: ZodFirstPartyTypeKind.ZodPipeline
		});
	}
};
var ZodReadonly = class extends ZodType {
	_parse(input) {
		const result = this._def.innerType._parse(input);
		const freeze = (data) => {
			if (isValid(data)) data.value = Object.freeze(data.value);
			return data;
		};
		return isAsync(result) ? result.then((data) => freeze(data)) : freeze(result);
	}
	unwrap() {
		return this._def.innerType;
	}
};
ZodReadonly.create = (type, params) => {
	return new ZodReadonly({
		innerType: type,
		typeName: ZodFirstPartyTypeKind.ZodReadonly,
		...processCreateParams(params)
	});
};
ZodObject.lazycreate;
var ZodFirstPartyTypeKind;
(function(ZodFirstPartyTypeKind) {
	ZodFirstPartyTypeKind["ZodString"] = "ZodString";
	ZodFirstPartyTypeKind["ZodNumber"] = "ZodNumber";
	ZodFirstPartyTypeKind["ZodNaN"] = "ZodNaN";
	ZodFirstPartyTypeKind["ZodBigInt"] = "ZodBigInt";
	ZodFirstPartyTypeKind["ZodBoolean"] = "ZodBoolean";
	ZodFirstPartyTypeKind["ZodDate"] = "ZodDate";
	ZodFirstPartyTypeKind["ZodSymbol"] = "ZodSymbol";
	ZodFirstPartyTypeKind["ZodUndefined"] = "ZodUndefined";
	ZodFirstPartyTypeKind["ZodNull"] = "ZodNull";
	ZodFirstPartyTypeKind["ZodAny"] = "ZodAny";
	ZodFirstPartyTypeKind["ZodUnknown"] = "ZodUnknown";
	ZodFirstPartyTypeKind["ZodNever"] = "ZodNever";
	ZodFirstPartyTypeKind["ZodVoid"] = "ZodVoid";
	ZodFirstPartyTypeKind["ZodArray"] = "ZodArray";
	ZodFirstPartyTypeKind["ZodObject"] = "ZodObject";
	ZodFirstPartyTypeKind["ZodUnion"] = "ZodUnion";
	ZodFirstPartyTypeKind["ZodDiscriminatedUnion"] = "ZodDiscriminatedUnion";
	ZodFirstPartyTypeKind["ZodIntersection"] = "ZodIntersection";
	ZodFirstPartyTypeKind["ZodTuple"] = "ZodTuple";
	ZodFirstPartyTypeKind["ZodRecord"] = "ZodRecord";
	ZodFirstPartyTypeKind["ZodMap"] = "ZodMap";
	ZodFirstPartyTypeKind["ZodSet"] = "ZodSet";
	ZodFirstPartyTypeKind["ZodFunction"] = "ZodFunction";
	ZodFirstPartyTypeKind["ZodLazy"] = "ZodLazy";
	ZodFirstPartyTypeKind["ZodLiteral"] = "ZodLiteral";
	ZodFirstPartyTypeKind["ZodEnum"] = "ZodEnum";
	ZodFirstPartyTypeKind["ZodEffects"] = "ZodEffects";
	ZodFirstPartyTypeKind["ZodNativeEnum"] = "ZodNativeEnum";
	ZodFirstPartyTypeKind["ZodOptional"] = "ZodOptional";
	ZodFirstPartyTypeKind["ZodNullable"] = "ZodNullable";
	ZodFirstPartyTypeKind["ZodDefault"] = "ZodDefault";
	ZodFirstPartyTypeKind["ZodCatch"] = "ZodCatch";
	ZodFirstPartyTypeKind["ZodPromise"] = "ZodPromise";
	ZodFirstPartyTypeKind["ZodBranded"] = "ZodBranded";
	ZodFirstPartyTypeKind["ZodPipeline"] = "ZodPipeline";
	ZodFirstPartyTypeKind["ZodReadonly"] = "ZodReadonly";
})(ZodFirstPartyTypeKind || (ZodFirstPartyTypeKind = {}));
ZodString.create;
ZodNumber.create;
ZodNaN.create;
ZodBigInt.create;
ZodBoolean.create;
ZodDate.create;
ZodSymbol.create;
ZodUndefined.create;
ZodNull.create;
ZodAny.create;
ZodUnknown.create;
ZodNever.create;
ZodVoid.create;
ZodArray.create;
ZodObject.create;
ZodObject.strictCreate;
ZodUnion.create;
ZodDiscriminatedUnion.create;
ZodIntersection.create;
ZodTuple.create;
ZodRecord.create;
ZodMap.create;
ZodSet.create;
ZodFunction.create;
ZodLazy.create;
ZodLiteral.create;
ZodEnum.create;
ZodNativeEnum.create;
ZodPromise.create;
ZodEffects.create;
ZodOptional.create;
ZodNullable.create;
ZodEffects.createWithPreprocess;
ZodPipeline.create;
//#endregion
//#region ../../node_modules/.bun/@openrouter+ai-sdk-provider@3.0.0+1b0add4fbaf9f739/node_modules/@openrouter/ai-sdk-provider/dist/index.js
var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __typeError = (msg) => {
	throw TypeError(msg);
};
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, {
	enumerable: true,
	configurable: true,
	writable: true,
	value
}) : obj[key] = value;
var __spreadValues = (a, b) => {
	for (var prop in b || (b = {})) if (__hasOwnProp.call(b, prop)) __defNormalProp(a, prop, b[prop]);
	if (__getOwnPropSymbols) {
		for (var prop of __getOwnPropSymbols(b)) if (__propIsEnum.call(b, prop)) __defNormalProp(a, prop, b[prop]);
	}
	return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
var __objRest = (source, exclude) => {
	var target = {};
	for (var prop in source) if (__hasOwnProp.call(source, prop) && exclude.indexOf(prop) < 0) target[prop] = source[prop];
	if (source != null && __getOwnPropSymbols) {
		for (var prop of __getOwnPropSymbols(source)) if (exclude.indexOf(prop) < 0 && __propIsEnum.call(source, prop)) target[prop] = source[prop];
	}
	return target;
};
var __accessCheck = (obj, member, msg) => member.has(obj) || __typeError("Cannot " + msg);
var __privateGet = (obj, member, getter) => (__accessCheck(obj, member, "read from private field"), getter ? getter.call(obj) : member.get(obj));
var __privateAdd = (obj, member, value) => member.has(obj) ? __typeError("Cannot add the same private member more than once") : member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
var marker = "vercel.ai.error";
var symbol = Symbol.for(marker);
var _a;
var _b;
var AISDKError = class _AISDKError extends (_b = Error, _a = symbol, _b) {
	/**
	* Creates an AI SDK Error.
	*
	* @param {Object} params - The parameters for creating the error.
	* @param {string} params.name - The name of the error.
	* @param {string} params.message - The error message.
	* @param {unknown} [params.cause] - The underlying cause of the error.
	*/
	constructor({ name: name152, message, cause }) {
		super(message);
		this[_a] = true;
		this.name = name152;
		this.cause = cause;
	}
	/**
	* Checks if the given error is an AI SDK Error.
	* @param {unknown} error - The error to check.
	* @returns {boolean} True if the error is an AI SDK Error, false otherwise.
	*/
	static isInstance(error) {
		return _AISDKError.hasMarker(error, marker);
	}
	static hasMarker(error, marker162) {
		const markerSymbol = Symbol.for(marker162);
		return error != null && typeof error === "object" && markerSymbol in error && typeof error[markerSymbol] === "boolean" && error[markerSymbol] === true;
	}
};
var name = "AI_APICallError";
var marker2 = `vercel.ai.error.${name}`;
var symbol2 = Symbol.for(marker2);
var _a2;
var _b2;
var APICallError = class extends (_b2 = AISDKError, _a2 = symbol2, _b2) {
	constructor({ message, url, requestBodyValues, statusCode, responseHeaders, responseBody, cause, isRetryable = statusCode != null && (statusCode === 408 || statusCode === 409 || statusCode === 429 || statusCode >= 500), data }) {
		super({
			name,
			message,
			cause
		});
		this[_a2] = true;
		this.url = url;
		this.requestBodyValues = requestBodyValues;
		this.statusCode = statusCode;
		this.responseHeaders = responseHeaders;
		this.responseBody = responseBody;
		this.isRetryable = isRetryable;
		this.data = data;
	}
	static isInstance(error) {
		return AISDKError.hasMarker(error, marker2);
	}
};
var name2 = "AI_EmptyResponseBodyError";
var marker3 = `vercel.ai.error.${name2}`;
var symbol3 = Symbol.for(marker3);
var _a3;
var _b3;
var EmptyResponseBodyError = class extends (_b3 = AISDKError, _a3 = symbol3, _b3) {
	constructor({ message = "Empty response body" } = {}) {
		super({
			name: name2,
			message
		});
		this[_a3] = true;
	}
	static isInstance(error) {
		return AISDKError.hasMarker(error, marker3);
	}
};
function getErrorMessage(error) {
	if (error == null) return "unknown error";
	if (typeof error === "string") return error;
	if (error instanceof Error) return error.toString();
	return JSON.stringify(error);
}
var name3 = "AI_InvalidArgumentError";
var marker4 = `vercel.ai.error.${name3}`;
var symbol4 = Symbol.for(marker4);
var _a4;
var _b4;
var InvalidArgumentError = class extends (_b4 = AISDKError, _a4 = symbol4, _b4) {
	constructor({ message, cause, argument }) {
		super({
			name: name3,
			message,
			cause
		});
		this[_a4] = true;
		this.argument = argument;
	}
	static isInstance(error) {
		return AISDKError.hasMarker(error, marker4);
	}
};
var name4 = "AI_InvalidPromptError";
var marker5 = `vercel.ai.error.${name4}`;
var symbol5 = Symbol.for(marker5);
var _a5;
var _b5;
var InvalidPromptError = class extends (_b5 = AISDKError, _a5 = symbol5, _b5) {
	constructor({ prompt, message, cause }) {
		super({
			name: name4,
			message: `Invalid prompt: ${message}`,
			cause
		});
		this[_a5] = true;
		this.prompt = prompt;
	}
	static isInstance(error) {
		return AISDKError.hasMarker(error, marker5);
	}
};
var name5 = "AI_InvalidResponseDataError";
var marker6 = `vercel.ai.error.${name5}`;
var symbol6 = Symbol.for(marker6);
var _a6;
var _b6;
var InvalidResponseDataError = class extends (_b6 = AISDKError, _a6 = symbol6, _b6) {
	constructor({ data, message = `Invalid response data: ${JSON.stringify(data)}.` }) {
		super({
			name: name5,
			message
		});
		this[_a6] = true;
		this.data = data;
	}
	static isInstance(error) {
		return AISDKError.hasMarker(error, marker6);
	}
};
var name6 = "AI_JSONParseError";
var marker7 = `vercel.ai.error.${name6}`;
var symbol7 = Symbol.for(marker7);
var _a7;
var _b7;
var JSONParseError = class extends (_b7 = AISDKError, _a7 = symbol7, _b7) {
	constructor({ text, cause }) {
		super({
			name: name6,
			message: `JSON parsing failed: Text: ${text}.
Error message: ${getErrorMessage(cause)}`,
			cause
		});
		this[_a7] = true;
		this.text = text;
	}
	static isInstance(error) {
		return AISDKError.hasMarker(error, marker7);
	}
};
var name7 = "AI_LoadAPIKeyError";
var marker8 = `vercel.ai.error.${name7}`;
var symbol8 = Symbol.for(marker8);
var _a8;
var _b8;
var LoadAPIKeyError = class extends (_b8 = AISDKError, _a8 = symbol8, _b8) {
	constructor({ message }) {
		super({
			name: name7,
			message
		});
		this[_a8] = true;
	}
	static isInstance(error) {
		return AISDKError.hasMarker(error, marker8);
	}
};
var name9 = "AI_NoContentGeneratedError";
var marker10 = `vercel.ai.error.${name9}`;
var symbol10 = Symbol.for(marker10);
var _a10;
var _b10;
var NoContentGeneratedError = class extends (_b10 = AISDKError, _a10 = symbol10, _b10) {
	constructor({ message = "No content generated." } = {}) {
		super({
			name: name9,
			message
		});
		this[_a10] = true;
	}
	static isInstance(error) {
		return AISDKError.hasMarker(error, marker10);
	}
};
var name13 = "AI_TypeValidationError";
var marker14 = `vercel.ai.error.${name13}`;
var symbol14 = Symbol.for(marker14);
var _a14;
var _b14;
var TypeValidationError = class _TypeValidationError extends (_b14 = AISDKError, _a14 = symbol14, _b14) {
	constructor({ value, cause, context }) {
		let contextPrefix = "Type validation failed";
		if (context == null ? void 0 : context.field) contextPrefix += ` for ${context.field}`;
		if ((context == null ? void 0 : context.entityName) || (context == null ? void 0 : context.entityId)) {
			contextPrefix += " (";
			const parts = [];
			if (context.entityName) parts.push(context.entityName);
			if (context.entityId) parts.push(`id: "${context.entityId}"`);
			contextPrefix += parts.join(", ");
			contextPrefix += ")";
		}
		super({
			name: name13,
			message: `${contextPrefix}: Value: ${JSON.stringify(value)}.
Error message: ${getErrorMessage(cause)}`,
			cause
		});
		this[_a14] = true;
		this.value = value;
		this.context = context;
	}
	static isInstance(error) {
		return AISDKError.hasMarker(error, marker14);
	}
	/**
	* Wraps an error into a TypeValidationError.
	* If the cause is already a TypeValidationError with the same value and context, it returns the cause.
	* Otherwise, it creates a new TypeValidationError.
	*
	* @param {Object} params - The parameters for wrapping the error.
	* @param {unknown} params.value - The value that failed validation.
	* @param {unknown} params.cause - The original error or cause of the validation failure.
	* @param {TypeValidationContext} params.context - Optional context about what is being validated.
	* @returns {TypeValidationError} A TypeValidationError instance.
	*/
	static wrap({ value, cause, context }) {
		var _a162, _b162, _c;
		if (_TypeValidationError.isInstance(cause) && cause.value === value && ((_a162 = cause.context) == null ? void 0 : _a162.field) === (context == null ? void 0 : context.field) && ((_b162 = cause.context) == null ? void 0 : _b162.entityName) === (context == null ? void 0 : context.entityName) && ((_c = cause.context) == null ? void 0 : _c.entityId) === (context == null ? void 0 : context.entityId)) return cause;
		return new _TypeValidationError({
			value,
			cause,
			context
		});
	}
};
var name14 = "AI_UnsupportedFunctionalityError";
var marker15 = `vercel.ai.error.${name14}`;
var symbol15 = Symbol.for(marker15);
var _a15;
var _b15;
var UnsupportedFunctionalityError = class extends (_b15 = AISDKError, _a15 = symbol15, _b15) {
	constructor({ functionality, message = `'${functionality}' functionality not supported.` }) {
		super({
			name: name14,
			message
		});
		this[_a15] = true;
		this.functionality = functionality;
	}
	static isInstance(error) {
		return AISDKError.hasMarker(error, marker15);
	}
};
var ParseError = class extends Error {
	constructor(message, options) {
		super(message), this.name = "ParseError", this.type = options.type, this.field = options.field, this.value = options.value, this.line = options.line;
	}
};
var LF = 10;
var CR = 13;
var SPACE = 32;
function noop(_arg) {}
function createParser(config) {
	if (typeof config == "function") throw new TypeError("`config` must be an object, got a function instead. Did you mean `createParser({onEvent: fn})`?");
	const { onEvent = noop, onError = noop, onRetry = noop, onComment, maxBufferSize } = config, pendingFragments = [];
	let pendingFragmentsLength = 0, isFirstChunk = true, id, data = "", dataLines = 0, eventType, terminated = false;
	function feed(chunk) {
		if (terminated) throw new Error("Cannot feed parser: it was terminated after exceeding the configured max buffer size. Call `reset()` to resume parsing.");
		if (isFirstChunk && (isFirstChunk = false, chunk.charCodeAt(0) === 239 && chunk.charCodeAt(1) === 187 && chunk.charCodeAt(2) === 191 && (chunk = chunk.slice(3))), pendingFragments.length === 0) {
			const trailing2 = processLines(chunk);
			trailing2 !== "" && (pendingFragments.push(trailing2), pendingFragmentsLength = trailing2.length), checkBufferSize();
			return;
		}
		if (chunk.indexOf(`
`) === -1 && chunk.indexOf("\r") === -1) {
			pendingFragments.push(chunk), pendingFragmentsLength += chunk.length, checkBufferSize();
			return;
		}
		pendingFragments.push(chunk);
		const input = pendingFragments.join("");
		pendingFragments.length = 0, pendingFragmentsLength = 0;
		const trailing = processLines(input);
		trailing !== "" && (pendingFragments.push(trailing), pendingFragmentsLength = trailing.length), checkBufferSize();
	}
	function checkBufferSize() {
		maxBufferSize !== void 0 && (pendingFragmentsLength + data.length <= maxBufferSize || (terminated = true, pendingFragments.length = 0, pendingFragmentsLength = 0, id = void 0, data = "", dataLines = 0, eventType = void 0, onError(new ParseError(`Buffered data exceeded max buffer size of ${maxBufferSize} characters`, { type: "max-buffer-size-exceeded" }))));
	}
	function processLines(chunk) {
		let searchIndex = 0;
		if (chunk.indexOf("\r") === -1) {
			let lfIndex = chunk.indexOf(`
`, searchIndex);
			for (; lfIndex !== -1;) {
				if (searchIndex === lfIndex) {
					dataLines > 0 && onEvent({
						id,
						event: eventType,
						data
					}), id = void 0, data = "", dataLines = 0, eventType = void 0, searchIndex = lfIndex + 1, lfIndex = chunk.indexOf(`
`, searchIndex);
					continue;
				}
				const firstCharCode = chunk.charCodeAt(searchIndex);
				if (isDataPrefix(chunk, searchIndex, firstCharCode)) {
					const valueStart = chunk.charCodeAt(searchIndex + 5) === SPACE ? searchIndex + 6 : searchIndex + 5, value = chunk.slice(valueStart, lfIndex);
					if (dataLines === 0 && chunk.charCodeAt(lfIndex + 1) === LF) {
						onEvent({
							id,
							event: eventType,
							data: value
						}), id = void 0, data = "", eventType = void 0, searchIndex = lfIndex + 2, lfIndex = chunk.indexOf(`
`, searchIndex);
						continue;
					}
					data = dataLines === 0 ? value : `${data}
${value}`, dataLines++;
				} else isEventPrefix(chunk, searchIndex, firstCharCode) ? eventType = chunk.slice(chunk.charCodeAt(searchIndex + 6) === SPACE ? searchIndex + 7 : searchIndex + 6, lfIndex) || void 0 : parseLine(chunk, searchIndex, lfIndex);
				searchIndex = lfIndex + 1, lfIndex = chunk.indexOf(`
`, searchIndex);
			}
			return chunk.slice(searchIndex);
		}
		for (; searchIndex < chunk.length;) {
			const crIndex = chunk.indexOf("\r", searchIndex), lfIndex = chunk.indexOf(`
`, searchIndex);
			let lineEnd = -1;
			if (crIndex !== -1 && lfIndex !== -1 ? lineEnd = crIndex < lfIndex ? crIndex : lfIndex : crIndex !== -1 ? crIndex === chunk.length - 1 ? lineEnd = -1 : lineEnd = crIndex : lfIndex !== -1 && (lineEnd = lfIndex), lineEnd === -1) break;
			parseLine(chunk, searchIndex, lineEnd), searchIndex = lineEnd + 1, chunk.charCodeAt(searchIndex - 1) === CR && chunk.charCodeAt(searchIndex) === LF && searchIndex++;
		}
		return chunk.slice(searchIndex);
	}
	function parseLine(chunk, start, end) {
		if (start === end) {
			dispatchEvent();
			return;
		}
		const firstCharCode = chunk.charCodeAt(start);
		if (isDataPrefix(chunk, start, firstCharCode)) {
			const valueStart = chunk.charCodeAt(start + 5) === SPACE ? start + 6 : start + 5, value2 = chunk.slice(valueStart, end);
			data = dataLines === 0 ? value2 : `${data}
${value2}`, dataLines++;
			return;
		}
		if (isEventPrefix(chunk, start, firstCharCode)) {
			eventType = chunk.slice(chunk.charCodeAt(start + 6) === SPACE ? start + 7 : start + 6, end) || void 0;
			return;
		}
		if (firstCharCode === 105 && chunk.charCodeAt(start + 1) === 100 && chunk.charCodeAt(start + 2) === 58) {
			const value2 = chunk.slice(chunk.charCodeAt(start + 3) === SPACE ? start + 4 : start + 3, end);
			id = value2.includes("\0") ? void 0 : value2;
			return;
		}
		if (firstCharCode === 58) {
			if (onComment) {
				const line2 = chunk.slice(start, end);
				onComment(line2.slice(chunk.charCodeAt(start + 1) === SPACE ? 2 : 1));
			}
			return;
		}
		const line = chunk.slice(start, end), fieldSeparatorIndex = line.indexOf(":");
		if (fieldSeparatorIndex === -1) {
			processField(line, "", line);
			return;
		}
		const field = line.slice(0, fieldSeparatorIndex), offset = line.charCodeAt(fieldSeparatorIndex + 1) === SPACE ? 2 : 1;
		processField(field, line.slice(fieldSeparatorIndex + offset), line);
	}
	function processField(field, value, line) {
		switch (field) {
			case "event":
				eventType = value || void 0;
				break;
			case "data":
				data = dataLines === 0 ? value : `${data}
${value}`, dataLines++;
				break;
			case "id":
				id = value.includes("\0") ? void 0 : value;
				break;
			case "retry":
				/^\d+$/.test(value) ? onRetry(parseInt(value, 10)) : onError(new ParseError(`Invalid \`retry\` value: "${value}"`, {
					type: "invalid-retry",
					value,
					line
				}));
				break;
			default: onError(new ParseError(`Unknown field "${field.length > 20 ? `${field.slice(0, 20)}\u2026` : field}"`, {
				type: "unknown-field",
				field,
				value,
				line
			}));
		}
	}
	function dispatchEvent() {
		dataLines > 0 && onEvent({
			id,
			event: eventType,
			data
		}), id = void 0, data = "", dataLines = 0, eventType = void 0;
	}
	function reset(options = {}) {
		if (options.consume && pendingFragments.length > 0) {
			const incompleteLine = pendingFragments.join("");
			parseLine(incompleteLine, 0, incompleteLine.length);
		}
		isFirstChunk = true, id = void 0, data = "", dataLines = 0, eventType = void 0, pendingFragments.length = 0, pendingFragmentsLength = 0, terminated = false;
	}
	return {
		feed,
		reset
	};
}
function isDataPrefix(chunk, i, firstCharCode) {
	return firstCharCode === 100 && chunk.charCodeAt(i + 1) === 97 && chunk.charCodeAt(i + 2) === 116 && chunk.charCodeAt(i + 3) === 97 && chunk.charCodeAt(i + 4) === 58;
}
function isEventPrefix(chunk, i, firstCharCode) {
	return firstCharCode === 101 && chunk.charCodeAt(i + 1) === 118 && chunk.charCodeAt(i + 2) === 101 && chunk.charCodeAt(i + 3) === 110 && chunk.charCodeAt(i + 4) === 116 && chunk.charCodeAt(i + 5) === 58;
}
var EventSourceParserStream = class extends TransformStream {
	constructor({ onError, onRetry, onComment, maxBufferSize } = {}) {
		let parser;
		super({
			start(controller) {
				parser = createParser({
					onEvent: (event) => {
						controller.enqueue(event);
					},
					onError(error) {
						typeof onError == "function" && onError(error), (onError === "terminate" || error.type === "max-buffer-size-exceeded") && controller.error(error);
					},
					onRetry,
					onComment,
					maxBufferSize
				});
			},
			transform(chunk) {
				parser.feed(chunk);
			}
		});
	}
};
function combineHeaders(...headers) {
	return headers.reduce((combinedHeaders, currentHeaders) => __spreadValues(__spreadValues({}, combinedHeaders), currentHeaders != null ? currentHeaders : {}), {});
}
var { btoa, atob: atob$1 } = globalThis;
function convertUint8ArrayToBase64(array) {
	let latin1string = "";
	for (let i = 0; i < array.length; i++) latin1string += String.fromCodePoint(array[i]);
	return btoa(latin1string);
}
async function delay(delayInMs, options) {
	if (delayInMs == null) return Promise.resolve();
	const signal = options == null ? void 0 : options.abortSignal;
	return new Promise((resolve2, reject) => {
		if (signal == null ? void 0 : signal.aborted) {
			reject(createAbortError());
			return;
		}
		const timeoutId = setTimeout(() => {
			cleanup();
			resolve2();
		}, delayInMs);
		const cleanup = () => {
			clearTimeout(timeoutId);
			signal?.removeEventListener("abort", onAbort);
		};
		const onAbort = () => {
			cleanup();
			reject(createAbortError());
		};
		signal?.addEventListener("abort", onAbort);
	});
}
function createAbortError() {
	return new DOMException("Delay was aborted", "AbortError");
}
function extractResponseHeaders(response) {
	return Object.fromEntries([...response.headers]);
}
var createIdGenerator = ({ prefix, size = 16, alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz", separator = "-" } = {}) => {
	const generator = () => {
		const alphabetLength = alphabet.length;
		const chars = new Array(size);
		for (let i = 0; i < size; i++) chars[i] = alphabet[Math.random() * alphabetLength | 0];
		return chars.join("");
	};
	if (prefix == null) return generator;
	if (alphabet.includes(separator)) throw new InvalidArgumentError({
		argument: "separator",
		message: `The separator "${separator}" must not be part of the alphabet "${alphabet}".`
	});
	return () => `${prefix}${separator}${generator()}`;
};
var generateId = createIdGenerator();
function isAbortError(error) {
	return (error instanceof Error || error instanceof DOMException) && (error.name === "AbortError" || error.name === "ResponseAborted" || error.name === "TimeoutError");
}
var FETCH_FAILED_ERROR_MESSAGES = ["fetch failed", "failed to fetch"];
var BUN_ERROR_CODES = [
	"ConnectionRefused",
	"ConnectionClosed",
	"FailedToOpenSocket",
	"ECONNRESET",
	"ECONNREFUSED",
	"ETIMEDOUT",
	"EPIPE"
];
function isBunNetworkError(error) {
	if (!(error instanceof Error)) return false;
	const code = error.code;
	if (typeof code === "string" && BUN_ERROR_CODES.includes(code)) return true;
	return false;
}
function handleFetchError({ error, url, requestBodyValues }) {
	if (isAbortError(error)) return error;
	if (error instanceof TypeError && FETCH_FAILED_ERROR_MESSAGES.includes(error.message.toLowerCase())) {
		const cause = error.cause;
		if (cause != null) return new APICallError({
			message: `Cannot connect to API: ${cause.message}`,
			cause,
			url,
			requestBodyValues,
			isRetryable: true
		});
	}
	if (isBunNetworkError(error)) return new APICallError({
		message: `Cannot connect to API: ${error.message}`,
		cause: error,
		url,
		requestBodyValues,
		isRetryable: true
	});
	return error;
}
function getRuntimeEnvironmentUserAgent(globalThisAny = globalThis) {
	var _a22, _b22, _c;
	if (globalThisAny.window) return `runtime/browser`;
	if ((_a22 = globalThisAny.navigator) == null ? void 0 : _a22.userAgent) return `runtime/${globalThisAny.navigator.userAgent.toLowerCase()}`;
	if ((_c = (_b22 = globalThisAny.process) == null ? void 0 : _b22.versions) == null ? void 0 : _c.node) return `runtime/node.js/${globalThisAny.process.version.substring(0)}`;
	if (globalThisAny.EdgeRuntime) return `runtime/vercel-edge`;
	return "runtime/unknown";
}
function normalizeHeaders(headers) {
	if (headers == null) return {};
	const normalized = {};
	if (headers instanceof Headers) headers.forEach((value, key) => {
		normalized[key.toLowerCase()] = value;
	});
	else {
		if (!Array.isArray(headers)) headers = Object.entries(headers);
		for (const [key, value] of headers) if (value != null) normalized[key.toLowerCase()] = value;
	}
	return normalized;
}
function withUserAgentSuffix(headers, ...userAgentSuffixParts) {
	const normalizedHeaders = new Headers(normalizeHeaders(headers));
	const currentUserAgentHeader = normalizedHeaders.get("user-agent") || "";
	normalizedHeaders.set("user-agent", [currentUserAgentHeader, ...userAgentSuffixParts].filter(Boolean).join(" "));
	return Object.fromEntries(normalizedHeaders.entries());
}
var VERSION = "5.0.0";
var getOriginalFetch = () => globalThis.fetch;
var getFromApi = async ({ url, headers = {}, successfulResponseHandler, failedResponseHandler, abortSignal, fetch: fetch2 = getOriginalFetch() }) => {
	try {
		const response = await fetch2(url, {
			method: "GET",
			headers: withUserAgentSuffix(headers, `ai-sdk/provider-utils/${VERSION}`, getRuntimeEnvironmentUserAgent()),
			signal: abortSignal
		});
		const responseHeaders = extractResponseHeaders(response);
		if (!response.ok) {
			let errorInformation;
			try {
				errorInformation = await failedResponseHandler({
					response,
					url,
					requestBodyValues: {}
				});
			} catch (error) {
				if (isAbortError(error) || APICallError.isInstance(error)) throw error;
				throw new APICallError({
					message: "Failed to process error response",
					cause: error,
					statusCode: response.status,
					url,
					responseHeaders,
					requestBodyValues: {}
				});
			}
			throw errorInformation.value;
		}
		try {
			return await successfulResponseHandler({
				response,
				url,
				requestBodyValues: {}
			});
		} catch (error) {
			if (error instanceof Error) {
				if (isAbortError(error) || APICallError.isInstance(error)) throw error;
			}
			throw new APICallError({
				message: "Failed to process successful response",
				cause: error,
				statusCode: response.status,
				url,
				responseHeaders,
				requestBodyValues: {}
			});
		}
	} catch (error) {
		throw handleFetchError({
			error,
			url,
			requestBodyValues: {}
		});
	}
};
function loadApiKey({ apiKey, environmentVariableName, apiKeyParameterName = "apiKey", description }) {
	if (typeof apiKey === "string") return apiKey;
	if (apiKey != null) throw new LoadAPIKeyError({ message: `${description} API key must be a string.` });
	if (typeof process === "undefined") throw new LoadAPIKeyError({ message: `${description} API key is missing. Pass it using the '${apiKeyParameterName}' parameter. Environment variables are not supported in this environment.` });
	apiKey = process.env[environmentVariableName];
	if (apiKey == null) throw new LoadAPIKeyError({ message: `${description} API key is missing. Pass it using the '${apiKeyParameterName}' parameter or the ${environmentVariableName} environment variable.` });
	if (typeof apiKey !== "string") throw new LoadAPIKeyError({ message: `${description} API key must be a string. The value of the ${environmentVariableName} environment variable is not a string.` });
	return apiKey;
}
var suspectProtoRx = /"(?:_|\\u005[Ff])(?:_|\\u005[Ff])(?:p|\\u0070)(?:r|\\u0072)(?:o|\\u006[Ff])(?:t|\\u0074)(?:o|\\u006[Ff])(?:_|\\u005[Ff])(?:_|\\u005[Ff])"\s*:/;
var suspectConstructorRx = /"(?:c|\\u0063)(?:o|\\u006[Ff])(?:n|\\u006[Ee])(?:s|\\u0073)(?:t|\\u0074)(?:r|\\u0072)(?:u|\\u0075)(?:c|\\u0063)(?:t|\\u0074)(?:o|\\u006[Ff])(?:r|\\u0072)"\s*:/;
function _parse(text) {
	const obj = JSON.parse(text);
	if (obj === null || typeof obj !== "object") return obj;
	if (suspectProtoRx.test(text) === false && suspectConstructorRx.test(text) === false) return obj;
	return filter(obj);
}
function filter(obj) {
	let next = [obj];
	while (next.length) {
		const nodes = next;
		next = [];
		for (const node of nodes) {
			if (Object.prototype.hasOwnProperty.call(node, "__proto__")) throw new SyntaxError("Object contains forbidden prototype property");
			if (Object.prototype.hasOwnProperty.call(node, "constructor") && node.constructor !== null && typeof node.constructor === "object" && Object.prototype.hasOwnProperty.call(node.constructor, "prototype")) throw new SyntaxError("Object contains forbidden prototype property");
			for (const key in node) {
				const value = node[key];
				if (value && typeof value === "object") next.push(value);
			}
		}
	}
	return obj;
}
function secureJsonParse(text) {
	const { stackTraceLimit } = Error;
	try {
		Error.stackTraceLimit = 0;
	} catch (e) {
		return _parse(text);
	}
	try {
		return _parse(text);
	} finally {
		Error.stackTraceLimit = stackTraceLimit;
	}
}
function addAdditionalPropertiesToJsonSchema(jsonSchema2) {
	if (jsonSchema2.type === "object" || Array.isArray(jsonSchema2.type) && jsonSchema2.type.includes("object")) {
		jsonSchema2.additionalProperties = false;
		const { properties } = jsonSchema2;
		if (properties != null) for (const key of Object.keys(properties)) properties[key] = visit(properties[key]);
	}
	if (jsonSchema2.items != null) jsonSchema2.items = Array.isArray(jsonSchema2.items) ? jsonSchema2.items.map(visit) : visit(jsonSchema2.items);
	if (jsonSchema2.anyOf != null) jsonSchema2.anyOf = jsonSchema2.anyOf.map(visit);
	if (jsonSchema2.allOf != null) jsonSchema2.allOf = jsonSchema2.allOf.map(visit);
	if (jsonSchema2.oneOf != null) jsonSchema2.oneOf = jsonSchema2.oneOf.map(visit);
	const { definitions } = jsonSchema2;
	if (definitions != null) for (const key of Object.keys(definitions)) definitions[key] = visit(definitions[key]);
	return jsonSchema2;
}
function visit(def) {
	if (typeof def === "boolean") return def;
	return addAdditionalPropertiesToJsonSchema(def);
}
var ignoreOverride = /* @__PURE__ */ Symbol("Let zodToJsonSchema decide on which parser to use");
var defaultOptions = {
	name: void 0,
	$refStrategy: "root",
	basePath: ["#"],
	effectStrategy: "input",
	pipeStrategy: "all",
	dateStrategy: "format:date-time",
	mapStrategy: "entries",
	removeAdditionalStrategy: "passthrough",
	allowedAdditionalProperties: true,
	rejectedAdditionalProperties: false,
	definitionPath: "definitions",
	strictUnions: false,
	definitions: {},
	errorMessages: false,
	patternStrategy: "escape",
	applyRegexFlags: false,
	emailStrategy: "format:email",
	base64Strategy: "contentEncoding:base64",
	nameStrategy: "ref"
};
var getDefaultOptions = (options) => typeof options === "string" ? __spreadProps(__spreadValues({}, defaultOptions), { name: options }) : __spreadValues(__spreadValues({}, defaultOptions), options);
function parseAnyDef() {
	return {};
}
function parseArrayDef(def, refs) {
	var _a22, _b22, _c;
	const res = { type: "array" };
	if (((_a22 = def.type) == null ? void 0 : _a22._def) && ((_c = (_b22 = def.type) == null ? void 0 : _b22._def) == null ? void 0 : _c.typeName) !== ZodFirstPartyTypeKind.ZodAny) res.items = parseDef(def.type._def, __spreadProps(__spreadValues({}, refs), { currentPath: [...refs.currentPath, "items"] }));
	if (def.minLength) res.minItems = def.minLength.value;
	if (def.maxLength) res.maxItems = def.maxLength.value;
	if (def.exactLength) {
		res.minItems = def.exactLength.value;
		res.maxItems = def.exactLength.value;
	}
	return res;
}
function parseBigintDef(def) {
	const res = {
		type: "integer",
		format: "int64"
	};
	if (!def.checks) return res;
	for (const check of def.checks) switch (check.kind) {
		case "min":
			if (check.inclusive) res.minimum = check.value;
			else res.exclusiveMinimum = check.value;
			break;
		case "max":
			if (check.inclusive) res.maximum = check.value;
			else res.exclusiveMaximum = check.value;
			break;
		case "multipleOf": res.multipleOf = check.value;
	}
	return res;
}
function parseBooleanDef() {
	return { type: "boolean" };
}
function parseBrandedDef(_def, refs) {
	return parseDef(_def.type._def, refs);
}
var parseCatchDef = (def, refs) => {
	return parseDef(def.innerType._def, refs);
};
function parseDateDef(def, refs, overrideDateStrategy) {
	const strategy = overrideDateStrategy != null ? overrideDateStrategy : refs.dateStrategy;
	if (Array.isArray(strategy)) return { anyOf: strategy.map((item) => parseDateDef(def, refs, item)) };
	switch (strategy) {
		case "string":
		case "format:date-time": return {
			type: "string",
			format: "date-time"
		};
		case "format:date": return {
			type: "string",
			format: "date"
		};
		case "integer": return integerDateParser(def);
	}
}
var integerDateParser = (def) => {
	const res = {
		type: "integer",
		format: "unix-time"
	};
	for (const check of def.checks) switch (check.kind) {
		case "min":
			res.minimum = check.value;
			break;
		case "max": res.maximum = check.value;
	}
	return res;
};
function parseDefaultDef(_def, refs) {
	return __spreadProps(__spreadValues({}, parseDef(_def.innerType._def, refs)), { default: _def.defaultValue() });
}
function parseEffectsDef(_def, refs) {
	return refs.effectStrategy === "input" ? parseDef(_def.schema._def, refs) : parseAnyDef();
}
function parseEnumDef(def) {
	return {
		type: "string",
		enum: Array.from(def.values)
	};
}
var isJsonSchema7AllOfType = (type) => {
	if ("type" in type && type.type === "string") return false;
	return "allOf" in type;
};
function parseIntersectionDef(def, refs) {
	const allOf = [parseDef(def.left._def, __spreadProps(__spreadValues({}, refs), { currentPath: [
		...refs.currentPath,
		"allOf",
		"0"
	] })), parseDef(def.right._def, __spreadProps(__spreadValues({}, refs), { currentPath: [
		...refs.currentPath,
		"allOf",
		"1"
	] }))].filter((x) => !!x);
	const mergedAllOf = [];
	allOf.forEach((schema) => {
		if (isJsonSchema7AllOfType(schema)) mergedAllOf.push(...schema.allOf);
		else {
			let nestedSchema = schema;
			if ("additionalProperties" in schema && schema.additionalProperties === false) {
				const _a17 = schema, { additionalProperties: _additionalProperties } = _a17;
				nestedSchema = __objRest(_a17, ["additionalProperties"]);
			}
			mergedAllOf.push(nestedSchema);
		}
	});
	return mergedAllOf.length ? { allOf: mergedAllOf } : void 0;
}
function parseLiteralDef(def) {
	const parsedType = typeof def.value;
	if (parsedType !== "bigint" && parsedType !== "number" && parsedType !== "boolean" && parsedType !== "string") return { type: Array.isArray(def.value) ? "array" : "object" };
	return {
		type: parsedType === "bigint" ? "integer" : parsedType,
		const: def.value
	};
}
var emojiRegex = void 0;
var zodPatterns = {
	/**
	* `c` was changed to `[cC]` to replicate /i flag
	*/
	cuid: /^[cC][^\s-]{8,}$/,
	cuid2: /^[0-9a-z]+$/,
	ulid: /^[0-9A-HJKMNP-TV-Z]{26}$/,
	/**
	* `a-z` was added to replicate /i flag
	*/
	email: /^(?!\.)(?!.*\.\.)([a-zA-Z0-9_'+\-\.]*)[a-zA-Z0-9_+-]@([a-zA-Z0-9][a-zA-Z0-9\-]*\.)+[a-zA-Z]{2,}$/,
	/**
	* Constructed a valid Unicode RegExp
	*
	* Lazily instantiate since this type of regex isn't supported
	* in all envs (e.g. React Native).
	*
	* See:
	* https://github.com/colinhacks/zod/issues/2433
	* Fix in Zod:
	* https://github.com/colinhacks/zod/commit/9340fd51e48576a75adc919bff65dbc4a5d4c99b
	*/
	emoji: () => {
		if (emojiRegex === void 0) emojiRegex = RegExp("^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$", "u");
		return emojiRegex;
	},
	/**
	* Unused
	*/
	uuid: /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/,
	/**
	* Unused
	*/
	ipv4: /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/,
	ipv4Cidr: /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/(3[0-2]|[12]?[0-9])$/,
	/**
	* Unused
	*/
	ipv6: /^(([a-f0-9]{1,4}:){7}|::([a-f0-9]{1,4}:){0,6}|([a-f0-9]{1,4}:){1}:([a-f0-9]{1,4}:){0,5}|([a-f0-9]{1,4}:){2}:([a-f0-9]{1,4}:){0,4}|([a-f0-9]{1,4}:){3}:([a-f0-9]{1,4}:){0,3}|([a-f0-9]{1,4}:){4}:([a-f0-9]{1,4}:){0,2}|([a-f0-9]{1,4}:){5}:([a-f0-9]{1,4}:){0,1})([a-f0-9]{1,4}|(((25[0-5])|(2[0-4][0-9])|(1[0-9]{2})|([0-9]{1,2}))\.){3}((25[0-5])|(2[0-4][0-9])|(1[0-9]{2})|([0-9]{1,2})))$/,
	ipv6Cidr: /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/,
	base64: /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/,
	base64url: /^([0-9a-zA-Z-_]{4})*(([0-9a-zA-Z-_]{2}(==)?)|([0-9a-zA-Z-_]{3}(=)?))?$/,
	nanoid: /^[a-zA-Z0-9_-]{21}$/,
	jwt: /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/
};
function parseStringDef(def, refs) {
	const res = { type: "string" };
	if (def.checks) for (const check of def.checks) switch (check.kind) {
		case "min":
			res.minLength = typeof res.minLength === "number" ? Math.max(res.minLength, check.value) : check.value;
			break;
		case "max":
			res.maxLength = typeof res.maxLength === "number" ? Math.min(res.maxLength, check.value) : check.value;
			break;
		case "email":
			switch (refs.emailStrategy) {
				case "format:email":
					addFormat(res, "email", check.message, refs);
					break;
				case "format:idn-email":
					addFormat(res, "idn-email", check.message, refs);
					break;
				case "pattern:zod": addPattern(res, zodPatterns.email, check.message, refs);
			}
			break;
		case "url":
			addFormat(res, "uri", check.message, refs);
			break;
		case "uuid":
			addFormat(res, "uuid", check.message, refs);
			break;
		case "regex":
			addPattern(res, check.regex, check.message, refs);
			break;
		case "cuid":
			addPattern(res, zodPatterns.cuid, check.message, refs);
			break;
		case "cuid2":
			addPattern(res, zodPatterns.cuid2, check.message, refs);
			break;
		case "startsWith":
			addPattern(res, RegExp(`^${escapeLiteralCheckValue(check.value, refs)}`), check.message, refs);
			break;
		case "endsWith":
			addPattern(res, RegExp(`${escapeLiteralCheckValue(check.value, refs)}$`), check.message, refs);
			break;
		case "datetime":
			addFormat(res, "date-time", check.message, refs);
			break;
		case "date":
			addFormat(res, "date", check.message, refs);
			break;
		case "time":
			addFormat(res, "time", check.message, refs);
			break;
		case "duration":
			addFormat(res, "duration", check.message, refs);
			break;
		case "length":
			res.minLength = typeof res.minLength === "number" ? Math.max(res.minLength, check.value) : check.value;
			res.maxLength = typeof res.maxLength === "number" ? Math.min(res.maxLength, check.value) : check.value;
			break;
		case "includes":
			addPattern(res, RegExp(escapeLiteralCheckValue(check.value, refs)), check.message, refs);
			break;
		case "ip":
			if (check.version !== "v6") addFormat(res, "ipv4", check.message, refs);
			if (check.version !== "v4") addFormat(res, "ipv6", check.message, refs);
			break;
		case "base64url":
			addPattern(res, zodPatterns.base64url, check.message, refs);
			break;
		case "jwt":
			addPattern(res, zodPatterns.jwt, check.message, refs);
			break;
		case "cidr":
			if (check.version !== "v6") addPattern(res, zodPatterns.ipv4Cidr, check.message, refs);
			if (check.version !== "v4") addPattern(res, zodPatterns.ipv6Cidr, check.message, refs);
			break;
		case "emoji":
			addPattern(res, zodPatterns.emoji(), check.message, refs);
			break;
		case "ulid":
			addPattern(res, zodPatterns.ulid, check.message, refs);
			break;
		case "base64":
			switch (refs.base64Strategy) {
				case "format:binary":
					addFormat(res, "binary", check.message, refs);
					break;
				case "contentEncoding:base64":
					res.contentEncoding = "base64";
					break;
				case "pattern:zod": addPattern(res, zodPatterns.base64, check.message, refs);
			}
			break;
		case "nanoid": addPattern(res, zodPatterns.nanoid, check.message, refs);
	}
	return res;
}
function escapeLiteralCheckValue(literal, refs) {
	return refs.patternStrategy === "escape" ? escapeNonAlphaNumeric(literal) : literal;
}
var ALPHA_NUMERIC = /* @__PURE__ */ new Set("ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvxyz0123456789");
function escapeNonAlphaNumeric(source) {
	let result = "";
	for (let i = 0; i < source.length; i++) {
		if (!ALPHA_NUMERIC.has(source[i])) result += "\\";
		result += source[i];
	}
	return result;
}
function addFormat(schema, value, message, refs) {
	var _a22;
	if (schema.format || ((_a22 = schema.anyOf) == null ? void 0 : _a22.some((x) => x.format))) {
		if (!schema.anyOf) schema.anyOf = [];
		if (schema.format) {
			schema.anyOf.push({ format: schema.format });
			delete schema.format;
		}
		schema.anyOf.push(__spreadValues({ format: value }, message && refs.errorMessages && { errorMessage: { format: message } }));
	} else schema.format = value;
}
function addPattern(schema, regex, message, refs) {
	var _a22;
	if (schema.pattern || ((_a22 = schema.allOf) == null ? void 0 : _a22.some((x) => x.pattern))) {
		if (!schema.allOf) schema.allOf = [];
		if (schema.pattern) {
			schema.allOf.push({ pattern: schema.pattern });
			delete schema.pattern;
		}
		schema.allOf.push(__spreadValues({ pattern: stringifyRegExpWithFlags(regex, refs) }, message && refs.errorMessages && { errorMessage: { pattern: message } }));
	} else schema.pattern = stringifyRegExpWithFlags(regex, refs);
}
function stringifyRegExpWithFlags(regex, refs) {
	var _a22;
	if (!refs.applyRegexFlags || !regex.flags) return regex.source;
	const flags = {
		i: regex.flags.includes("i"),
		m: regex.flags.includes("m"),
		s: regex.flags.includes("s")
	};
	const source = flags.i ? regex.source.toLowerCase() : regex.source;
	let pattern = "";
	let isEscaped = false;
	let inCharGroup = false;
	let inCharRange = false;
	for (let i = 0; i < source.length; i++) {
		if (isEscaped) {
			pattern += source[i];
			isEscaped = false;
			continue;
		}
		if (flags.i) {
			if (inCharGroup) {
				if (source[i].match(/[a-z]/)) {
					if (inCharRange) {
						pattern += source[i];
						pattern += `${source[i - 2]}-${source[i]}`.toUpperCase();
						inCharRange = false;
					} else if (source[i + 1] === "-" && ((_a22 = source[i + 2]) == null ? void 0 : _a22.match(/[a-z]/))) {
						pattern += source[i];
						inCharRange = true;
					} else pattern += `${source[i]}${source[i].toUpperCase()}`;
					continue;
				}
			} else if (source[i].match(/[a-z]/)) {
				pattern += `[${source[i]}${source[i].toUpperCase()}]`;
				continue;
			}
		}
		if (flags.m) {
			if (source[i] === "^") {
				pattern += `(^|(?<=[\r
]))`;
				continue;
			} else if (source[i] === "$") {
				pattern += `($|(?=[\r
]))`;
				continue;
			}
		}
		if (flags.s && source[i] === ".") {
			pattern += inCharGroup ? `${source[i]}\r
` : `[${source[i]}\r
]`;
			continue;
		}
		pattern += source[i];
		if (source[i] === "\\") isEscaped = true;
		else if (inCharGroup && source[i] === "]") inCharGroup = false;
		else if (!inCharGroup && source[i] === "[") inCharGroup = true;
	}
	try {
		new RegExp(pattern);
	} catch (e) {
		console.warn(`Could not convert regex pattern at ${refs.currentPath.join("/")} to a flag-independent form! Falling back to the flag-ignorant source`);
		return regex.source;
	}
	return pattern;
}
function parseRecordDef(def, refs) {
	var _a22, _b22, _c, _d, _e, _f;
	const schema = {
		type: "object",
		additionalProperties: (_a22 = parseDef(def.valueType._def, __spreadProps(__spreadValues({}, refs), { currentPath: [...refs.currentPath, "additionalProperties"] }))) != null ? _a22 : refs.allowedAdditionalProperties
	};
	if (((_b22 = def.keyType) == null ? void 0 : _b22._def.typeName) === ZodFirstPartyTypeKind.ZodString && ((_c = def.keyType._def.checks) == null ? void 0 : _c.length)) {
		const _a17 = parseStringDef(def.keyType._def, refs), { type: _type } = _a17, keyType = __objRest(_a17, ["type"]);
		return __spreadProps(__spreadValues({}, schema), { propertyNames: keyType });
	} else if (((_d = def.keyType) == null ? void 0 : _d._def.typeName) === ZodFirstPartyTypeKind.ZodEnum) return __spreadProps(__spreadValues({}, schema), { propertyNames: { enum: def.keyType._def.values } });
	else if (((_e = def.keyType) == null ? void 0 : _e._def.typeName) === ZodFirstPartyTypeKind.ZodBranded && def.keyType._def.type._def.typeName === ZodFirstPartyTypeKind.ZodString && ((_f = def.keyType._def.type._def.checks) == null ? void 0 : _f.length)) {
		const _b17 = parseBrandedDef(def.keyType._def, refs), { type: _type } = _b17, keyType = __objRest(_b17, ["type"]);
		return __spreadProps(__spreadValues({}, schema), { propertyNames: keyType });
	}
	return schema;
}
function parseMapDef(def, refs) {
	if (refs.mapStrategy === "record") return parseRecordDef(def, refs);
	return {
		type: "array",
		maxItems: 125,
		items: {
			type: "array",
			items: [parseDef(def.keyType._def, __spreadProps(__spreadValues({}, refs), { currentPath: [
				...refs.currentPath,
				"items",
				"items",
				"0"
			] })) || parseAnyDef(), parseDef(def.valueType._def, __spreadProps(__spreadValues({}, refs), { currentPath: [
				...refs.currentPath,
				"items",
				"items",
				"1"
			] })) || parseAnyDef()],
			minItems: 2,
			maxItems: 2
		}
	};
}
function parseNativeEnumDef(def) {
	const object = def.values;
	const actualValues = Object.keys(def.values).filter((key) => {
		return typeof object[object[key]] !== "number";
	}).map((key) => object[key]);
	const parsedTypes = Array.from(new Set(actualValues.map((values) => typeof values)));
	return {
		type: parsedTypes.length === 1 ? parsedTypes[0] === "string" ? "string" : "number" : ["string", "number"],
		enum: actualValues
	};
}
function parseNeverDef() {
	return { not: parseAnyDef() };
}
function parseNullDef() {
	return { type: "null" };
}
var primitiveMappings = {
	ZodString: "string",
	ZodNumber: "number",
	ZodBigInt: "integer",
	ZodBoolean: "boolean",
	ZodNull: "null"
};
function parseUnionDef(def, refs) {
	const options = def.options instanceof Map ? Array.from(def.options.values()) : def.options;
	if (options.every((x) => x._def.typeName in primitiveMappings && (!x._def.checks || !x._def.checks.length))) {
		const types = options.reduce((types2, x) => {
			const type = primitiveMappings[x._def.typeName];
			return type && !types2.includes(type) ? [...types2, type] : types2;
		}, []);
		return { type: types.length > 1 ? types : types[0] };
	} else if (options.every((x) => x._def.typeName === "ZodLiteral" && !x.description)) {
		const types = options.reduce((acc, x) => {
			const type = typeof x._def.value;
			switch (type) {
				case "string":
				case "number":
				case "boolean": return [...acc, type];
				case "bigint": return [...acc, "integer"];
				case "object": if (x._def.value === null) return [...acc, "null"];
				default: return acc;
			}
		}, []);
		if (types.length === options.length) {
			const uniqueTypes = types.filter((x, i, a) => a.indexOf(x) === i);
			return {
				type: uniqueTypes.length > 1 ? uniqueTypes : uniqueTypes[0],
				enum: options.reduce((acc, x) => {
					return acc.includes(x._def.value) ? acc : [...acc, x._def.value];
				}, [])
			};
		}
	} else if (options.every((x) => x._def.typeName === "ZodEnum")) return {
		type: "string",
		enum: options.reduce((acc, x) => [...acc, ...x._def.values.filter((x2) => !acc.includes(x2))], [])
	};
	return asAnyOf(def, refs);
}
var asAnyOf = (def, refs) => {
	const anyOf = (def.options instanceof Map ? Array.from(def.options.values()) : def.options).map((x, i) => parseDef(x._def, __spreadProps(__spreadValues({}, refs), { currentPath: [
		...refs.currentPath,
		"anyOf",
		`${i}`
	] }))).filter((x) => !!x && (!refs.strictUnions || typeof x === "object" && Object.keys(x).length > 0));
	return anyOf.length ? { anyOf } : void 0;
};
function parseNullableDef(def, refs) {
	if ([
		"ZodString",
		"ZodNumber",
		"ZodBigInt",
		"ZodBoolean",
		"ZodNull"
	].includes(def.innerType._def.typeName) && (!def.innerType._def.checks || !def.innerType._def.checks.length)) return { type: [primitiveMappings[def.innerType._def.typeName], "null"] };
	const base = parseDef(def.innerType._def, __spreadProps(__spreadValues({}, refs), { currentPath: [
		...refs.currentPath,
		"anyOf",
		"0"
	] }));
	return base && { anyOf: [base, { type: "null" }] };
}
function parseNumberDef(def) {
	const res = { type: "number" };
	if (!def.checks) return res;
	for (const check of def.checks) switch (check.kind) {
		case "int":
			res.type = "integer";
			break;
		case "min":
			if (check.inclusive) res.minimum = check.value;
			else res.exclusiveMinimum = check.value;
			break;
		case "max":
			if (check.inclusive) res.maximum = check.value;
			else res.exclusiveMaximum = check.value;
			break;
		case "multipleOf": res.multipleOf = check.value;
	}
	return res;
}
function parseObjectDef(def, refs) {
	const result = {
		type: "object",
		properties: {}
	};
	const required = [];
	const shape = def.shape();
	for (const propName in shape) {
		let propDef = shape[propName];
		if (propDef === void 0 || propDef._def === void 0) continue;
		const propOptional = safeIsOptional(propDef);
		const parsedDef = parseDef(propDef._def, __spreadProps(__spreadValues({}, refs), {
			currentPath: [
				...refs.currentPath,
				"properties",
				propName
			],
			propertyPath: [
				...refs.currentPath,
				"properties",
				propName
			]
		}));
		if (parsedDef === void 0) continue;
		result.properties[propName] = parsedDef;
		if (!propOptional) required.push(propName);
	}
	if (required.length) result.required = required;
	const additionalProperties = decideAdditionalProperties(def, refs);
	if (additionalProperties !== void 0) result.additionalProperties = additionalProperties;
	return result;
}
function decideAdditionalProperties(def, refs) {
	if (def.catchall._def.typeName !== "ZodNever") return parseDef(def.catchall._def, __spreadProps(__spreadValues({}, refs), { currentPath: [...refs.currentPath, "additionalProperties"] }));
	switch (def.unknownKeys) {
		case "passthrough": return refs.allowedAdditionalProperties;
		case "strict": return refs.rejectedAdditionalProperties;
		case "strip": return refs.removeAdditionalStrategy === "strict" ? refs.allowedAdditionalProperties : refs.rejectedAdditionalProperties;
	}
}
function safeIsOptional(schema) {
	try {
		return schema.isOptional();
	} catch (e) {
		return true;
	}
}
var parseOptionalDef = (def, refs) => {
	var _a22;
	if (refs.currentPath.toString() === ((_a22 = refs.propertyPath) == null ? void 0 : _a22.toString())) return parseDef(def.innerType._def, refs);
	const innerSchema = parseDef(def.innerType._def, __spreadProps(__spreadValues({}, refs), { currentPath: [
		...refs.currentPath,
		"anyOf",
		"1"
	] }));
	return innerSchema ? { anyOf: [{ not: parseAnyDef() }, innerSchema] } : parseAnyDef();
};
var parsePipelineDef = (def, refs) => {
	if (refs.pipeStrategy === "input") return parseDef(def.in._def, refs);
	else if (refs.pipeStrategy === "output") return parseDef(def.out._def, refs);
	const inputSchema = parseDef(def.in._def, __spreadProps(__spreadValues({}, refs), { currentPath: [
		...refs.currentPath,
		"allOf",
		"0"
	] }));
	return { allOf: [inputSchema, parseDef(def.out._def, __spreadProps(__spreadValues({}, refs), { currentPath: [
		...refs.currentPath,
		"allOf",
		inputSchema ? "1" : "0"
	] }))].filter((schema) => schema !== void 0) };
};
function parsePromiseDef(def, refs) {
	return parseDef(def.type._def, refs);
}
function parseSetDef(def, refs) {
	const schema = {
		type: "array",
		uniqueItems: true,
		items: parseDef(def.valueType._def, __spreadProps(__spreadValues({}, refs), { currentPath: [...refs.currentPath, "items"] }))
	};
	if (def.minSize) schema.minItems = def.minSize.value;
	if (def.maxSize) schema.maxItems = def.maxSize.value;
	return schema;
}
function parseTupleDef(def, refs) {
	if (def.rest) return {
		type: "array",
		minItems: def.items.length,
		items: def.items.map((x, i) => parseDef(x._def, __spreadProps(__spreadValues({}, refs), { currentPath: [
			...refs.currentPath,
			"items",
			`${i}`
		] }))).reduce((acc, x) => x === void 0 ? acc : [...acc, x], []),
		additionalItems: parseDef(def.rest._def, __spreadProps(__spreadValues({}, refs), { currentPath: [...refs.currentPath, "additionalItems"] }))
	};
	else return {
		type: "array",
		minItems: def.items.length,
		maxItems: def.items.length,
		items: def.items.map((x, i) => parseDef(x._def, __spreadProps(__spreadValues({}, refs), { currentPath: [
			...refs.currentPath,
			"items",
			`${i}`
		] }))).reduce((acc, x) => x === void 0 ? acc : [...acc, x], [])
	};
}
function parseUndefinedDef() {
	return { not: parseAnyDef() };
}
function parseUnknownDef() {
	return parseAnyDef();
}
var parseReadonlyDef = (def, refs) => {
	return parseDef(def.innerType._def, refs);
};
var selectParser = (def, typeName, refs) => {
	switch (typeName) {
		case ZodFirstPartyTypeKind.ZodString: return parseStringDef(def, refs);
		case ZodFirstPartyTypeKind.ZodNumber: return parseNumberDef(def);
		case ZodFirstPartyTypeKind.ZodObject: return parseObjectDef(def, refs);
		case ZodFirstPartyTypeKind.ZodBigInt: return parseBigintDef(def);
		case ZodFirstPartyTypeKind.ZodBoolean: return parseBooleanDef();
		case ZodFirstPartyTypeKind.ZodDate: return parseDateDef(def, refs);
		case ZodFirstPartyTypeKind.ZodUndefined: return parseUndefinedDef();
		case ZodFirstPartyTypeKind.ZodNull: return parseNullDef();
		case ZodFirstPartyTypeKind.ZodArray: return parseArrayDef(def, refs);
		case ZodFirstPartyTypeKind.ZodUnion:
		case ZodFirstPartyTypeKind.ZodDiscriminatedUnion: return parseUnionDef(def, refs);
		case ZodFirstPartyTypeKind.ZodIntersection: return parseIntersectionDef(def, refs);
		case ZodFirstPartyTypeKind.ZodTuple: return parseTupleDef(def, refs);
		case ZodFirstPartyTypeKind.ZodRecord: return parseRecordDef(def, refs);
		case ZodFirstPartyTypeKind.ZodLiteral: return parseLiteralDef(def);
		case ZodFirstPartyTypeKind.ZodEnum: return parseEnumDef(def);
		case ZodFirstPartyTypeKind.ZodNativeEnum: return parseNativeEnumDef(def);
		case ZodFirstPartyTypeKind.ZodNullable: return parseNullableDef(def, refs);
		case ZodFirstPartyTypeKind.ZodOptional: return parseOptionalDef(def, refs);
		case ZodFirstPartyTypeKind.ZodMap: return parseMapDef(def, refs);
		case ZodFirstPartyTypeKind.ZodSet: return parseSetDef(def, refs);
		case ZodFirstPartyTypeKind.ZodLazy: return () => def.getter()._def;
		case ZodFirstPartyTypeKind.ZodPromise: return parsePromiseDef(def, refs);
		case ZodFirstPartyTypeKind.ZodNaN:
		case ZodFirstPartyTypeKind.ZodNever: return parseNeverDef();
		case ZodFirstPartyTypeKind.ZodEffects: return parseEffectsDef(def, refs);
		case ZodFirstPartyTypeKind.ZodAny: return parseAnyDef();
		case ZodFirstPartyTypeKind.ZodUnknown: return parseUnknownDef();
		case ZodFirstPartyTypeKind.ZodDefault: return parseDefaultDef(def, refs);
		case ZodFirstPartyTypeKind.ZodBranded: return parseBrandedDef(def, refs);
		case ZodFirstPartyTypeKind.ZodReadonly: return parseReadonlyDef(def, refs);
		case ZodFirstPartyTypeKind.ZodCatch: return parseCatchDef(def, refs);
		case ZodFirstPartyTypeKind.ZodPipeline: return parsePipelineDef(def, refs);
		case ZodFirstPartyTypeKind.ZodFunction:
		case ZodFirstPartyTypeKind.ZodVoid:
		case ZodFirstPartyTypeKind.ZodSymbol: return;
		default: return /* @__PURE__ */ ((_) => void 0)(typeName);
	}
};
var getRelativePath = (pathA, pathB) => {
	let i = 0;
	for (; i < pathA.length && i < pathB.length; i++) if (pathA[i] !== pathB[i]) break;
	return [(pathA.length - i).toString(), ...pathB.slice(i)].join("/");
};
function parseDef(def, refs, forceResolution = false) {
	var _a22;
	const seenItem = refs.seen.get(def);
	if (refs.override) {
		const overrideResult = (_a22 = refs.override) == null ? void 0 : _a22.call(refs, def, refs, seenItem, forceResolution);
		if (overrideResult !== ignoreOverride) return overrideResult;
	}
	if (seenItem && !forceResolution) {
		const seenSchema = get$ref(seenItem, refs);
		if (seenSchema !== void 0) return seenSchema;
	}
	const newItem = {
		def,
		path: refs.currentPath,
		jsonSchema: void 0
	};
	refs.seen.set(def, newItem);
	const jsonSchemaOrGetter = selectParser(def, def.typeName, refs);
	const jsonSchema2 = typeof jsonSchemaOrGetter === "function" ? parseDef(jsonSchemaOrGetter(), refs) : jsonSchemaOrGetter;
	if (jsonSchema2) addMeta(def, refs, jsonSchema2);
	if (refs.postProcess) {
		const postProcessResult = refs.postProcess(jsonSchema2, def, refs);
		newItem.jsonSchema = jsonSchema2;
		return postProcessResult;
	}
	newItem.jsonSchema = jsonSchema2;
	return jsonSchema2;
}
var get$ref = (item, refs) => {
	switch (refs.$refStrategy) {
		case "root": return { $ref: item.path.join("/") };
		case "relative": return { $ref: getRelativePath(refs.currentPath, item.path) };
		case "none":
		case "seen":
			if (item.path.length < refs.currentPath.length && item.path.every((value, index) => refs.currentPath[index] === value)) {
				console.warn(`Recursive reference detected at ${refs.currentPath.join("/")}! Defaulting to any`);
				return parseAnyDef();
			}
			return refs.$refStrategy === "seen" ? parseAnyDef() : void 0;
	}
};
var addMeta = (def, refs, jsonSchema2) => {
	if (def.description) jsonSchema2.description = def.description;
	return jsonSchema2;
};
var getRefs = (options) => {
	const _options = getDefaultOptions(options);
	const currentPath = _options.name !== void 0 ? [
		..._options.basePath,
		_options.definitionPath,
		_options.name
	] : _options.basePath;
	return __spreadProps(__spreadValues({}, _options), {
		currentPath,
		propertyPath: void 0,
		seen: new Map(Object.entries(_options.definitions).map(([name22, def]) => [def._def, {
			def: def._def,
			path: [
				..._options.basePath,
				_options.definitionPath,
				name22
			],
			jsonSchema: void 0
		}]))
	});
};
var zod3ToJsonSchema = (schema, options) => {
	var _a22;
	const refs = getRefs(options);
	let definitions = typeof options === "object" && options.definitions ? Object.entries(options.definitions).reduce((acc, [name32, schema2]) => {
		var _a32;
		return __spreadProps(__spreadValues({}, acc), { [name32]: (_a32 = parseDef(schema2._def, __spreadProps(__spreadValues({}, refs), { currentPath: [
			...refs.basePath,
			refs.definitionPath,
			name32
		] }), true)) != null ? _a32 : parseAnyDef() });
	}, {}) : void 0;
	const name22 = typeof options === "string" ? options : (options == null ? void 0 : options.nameStrategy) === "title" ? void 0 : options == null ? void 0 : options.name;
	const main = (_a22 = parseDef(schema._def, name22 === void 0 ? refs : __spreadProps(__spreadValues({}, refs), { currentPath: [
		...refs.basePath,
		refs.definitionPath,
		name22
	] }), false)) != null ? _a22 : parseAnyDef();
	const title = typeof options === "object" && options.name !== void 0 && options.nameStrategy === "title" ? options.name : void 0;
	if (title !== void 0) main.title = title;
	const combined = name22 === void 0 ? definitions ? __spreadProps(__spreadValues({}, main), { [refs.definitionPath]: definitions }) : main : {
		$ref: [
			...refs.$refStrategy === "relative" ? [] : refs.basePath,
			refs.definitionPath,
			name22
		].join("/"),
		[refs.definitionPath]: __spreadProps(__spreadValues({}, definitions), { [name22]: main })
	};
	combined.$schema = "http://json-schema.org/draft-07/schema#";
	return combined;
};
var schemaSymbol = /* @__PURE__ */ Symbol.for("vercel.ai.schema");
function jsonSchema(jsonSchema2, { validate } = {}) {
	return {
		[schemaSymbol]: true,
		_type: void 0,
		get jsonSchema() {
			if (typeof jsonSchema2 === "function") jsonSchema2 = jsonSchema2();
			return jsonSchema2;
		},
		validate
	};
}
function isSchema(value) {
	return typeof value === "object" && value !== null && schemaSymbol in value && value[schemaSymbol] === true && "jsonSchema" in value && "validate" in value;
}
function asSchema(schema) {
	return schema == null ? jsonSchema({
		type: "object",
		properties: {},
		additionalProperties: false
	}) : isSchema(schema) ? schema : "~standard" in schema ? schema["~standard"].vendor === "zod" ? zodSchema(schema) : standardSchema(schema) : schema();
}
function standardSchema(standardSchema2) {
	return jsonSchema(() => addAdditionalPropertiesToJsonSchema(standardSchema2["~standard"].jsonSchema.input({ target: "draft-07" })), { validate: async (value) => {
		const result = await standardSchema2["~standard"].validate(value);
		return "value" in result ? {
			success: true,
			value: result.value
		} : {
			success: false,
			error: new TypeValidationError({
				value,
				cause: result.issues
			})
		};
	} });
}
function zod3Schema(zodSchema2, options) {
	var _a22;
	const useReferences = (_a22 = options == null ? void 0 : options.useReferences) != null ? _a22 : false;
	return jsonSchema(() => zod3ToJsonSchema(zodSchema2, { $refStrategy: useReferences ? "root" : "none" }), { validate: async (value) => {
		const result = await zodSchema2.safeParseAsync(value);
		return result.success ? {
			success: true,
			value: result.data
		} : {
			success: false,
			error: result.error
		};
	} });
}
function zod4Schema(zodSchema2, options) {
	var _a22;
	const useReferences = (_a22 = options == null ? void 0 : options.useReferences) != null ? _a22 : false;
	return jsonSchema(() => addAdditionalPropertiesToJsonSchema(toJSONSchema(zodSchema2, {
		target: "draft-7",
		io: "input",
		reused: useReferences ? "ref" : "inline"
	})), { validate: async (value) => {
		const result = await safeParseAsync(zodSchema2, value);
		return result.success ? {
			success: true,
			value: result.data
		} : {
			success: false,
			error: result.error
		};
	} });
}
function isZod4Schema(zodSchema2) {
	return "_zod" in zodSchema2;
}
function zodSchema(zodSchema2, options) {
	if (isZod4Schema(zodSchema2)) return zod4Schema(zodSchema2, options);
	else return zod3Schema(zodSchema2, options);
}
async function validateTypes({ value, schema, context }) {
	const result = await safeValidateTypes({
		value,
		schema,
		context
	});
	if (!result.success) throw TypeValidationError.wrap({
		value,
		cause: result.error,
		context
	});
	return result.value;
}
async function safeValidateTypes({ value, schema, context }) {
	const actualSchema = asSchema(schema);
	try {
		if (actualSchema.validate == null) return {
			success: true,
			value,
			rawValue: value
		};
		const result = await actualSchema.validate(value);
		if (result.success) return {
			success: true,
			value: result.value,
			rawValue: value
		};
		return {
			success: false,
			error: TypeValidationError.wrap({
				value,
				cause: result.error,
				context
			}),
			rawValue: value
		};
	} catch (error) {
		return {
			success: false,
			error: TypeValidationError.wrap({
				value,
				cause: error,
				context
			}),
			rawValue: value
		};
	}
}
async function parseJSON({ text, schema }) {
	try {
		const value = secureJsonParse(text);
		if (schema == null) return value;
		return await validateTypes({
			value,
			schema
		});
	} catch (error) {
		if (JSONParseError.isInstance(error) || TypeValidationError.isInstance(error)) throw error;
		throw new JSONParseError({
			text,
			cause: error
		});
	}
}
async function safeParseJSON({ text, schema }) {
	try {
		const value = secureJsonParse(text);
		if (schema == null) return {
			success: true,
			value,
			rawValue: value
		};
		return await safeValidateTypes({
			value,
			schema
		});
	} catch (error) {
		return {
			success: false,
			error: JSONParseError.isInstance(error) ? error : new JSONParseError({
				text,
				cause: error
			}),
			rawValue: void 0
		};
	}
}
function isParsableJson(input) {
	try {
		secureJsonParse(input);
		return true;
	} catch (e) {
		return false;
	}
}
function parseJsonEventStream({ stream, schema }) {
	return stream.pipeThrough(new TextDecoderStream()).pipeThrough(new EventSourceParserStream()).pipeThrough(new TransformStream({ async transform({ data }, controller) {
		if (data === "[DONE]") return;
		controller.enqueue(await safeParseJSON({
			text: data,
			schema
		}));
	} }));
}
var getOriginalFetch2 = () => globalThis.fetch;
var postJsonToApi = async ({ url, headers, body, failedResponseHandler, successfulResponseHandler, abortSignal, fetch: fetch2 }) => await postToApi({
	url,
	headers: __spreadValues({ "Content-Type": "application/json" }, headers),
	body: {
		content: JSON.stringify(body),
		values: body
	},
	failedResponseHandler,
	successfulResponseHandler,
	abortSignal,
	fetch: fetch2
});
var postToApi = async ({ url, headers = {}, body, successfulResponseHandler, failedResponseHandler, abortSignal, fetch: fetch2 = getOriginalFetch2() }) => {
	try {
		const response = await fetch2(url, {
			method: "POST",
			headers: withUserAgentSuffix(headers, `ai-sdk/provider-utils/${VERSION}`, getRuntimeEnvironmentUserAgent()),
			body: body.content,
			signal: abortSignal
		});
		const responseHeaders = extractResponseHeaders(response);
		if (!response.ok) {
			let errorInformation;
			try {
				errorInformation = await failedResponseHandler({
					response,
					url,
					requestBodyValues: body.values
				});
			} catch (error) {
				if (isAbortError(error) || APICallError.isInstance(error)) throw error;
				throw new APICallError({
					message: "Failed to process error response",
					cause: error,
					statusCode: response.status,
					url,
					responseHeaders,
					requestBodyValues: body.values
				});
			}
			throw errorInformation.value;
		}
		try {
			return await successfulResponseHandler({
				response,
				url,
				requestBodyValues: body.values
			});
		} catch (error) {
			if (error instanceof Error) {
				if (isAbortError(error) || APICallError.isInstance(error)) throw error;
			}
			throw new APICallError({
				message: "Failed to process successful response",
				cause: error,
				statusCode: response.status,
				url,
				responseHeaders,
				requestBodyValues: body.values
			});
		}
	} catch (error) {
		throw handleFetchError({
			error,
			url,
			requestBodyValues: body.values
		});
	}
};
function tool(tool2) {
	return tool2;
}
function createProviderDefinedToolFactory({ id, inputSchema }) {
	return (_a17) => {
		var _b17 = _a17, { execute, outputSchema, needsApproval, toModelOutput, onInputStart, onInputDelta, onInputAvailable } = _b17;
		return tool({
			type: "provider",
			isProviderExecuted: false,
			id,
			args: __objRest(_b17, [
				"execute",
				"outputSchema",
				"needsApproval",
				"toModelOutput",
				"onInputStart",
				"onInputDelta",
				"onInputAvailable"
			]),
			inputSchema,
			outputSchema,
			execute,
			needsApproval,
			toModelOutput,
			onInputStart,
			onInputDelta,
			onInputAvailable
		});
	};
}
var createJsonErrorResponseHandler = ({ errorSchema, errorToMessage, isRetryable }) => async ({ response, url, requestBodyValues }) => {
	const responseBody = await response.text();
	const responseHeaders = extractResponseHeaders(response);
	if (responseBody.trim() === "") return {
		responseHeaders,
		value: new APICallError({
			message: response.statusText,
			url,
			requestBodyValues,
			statusCode: response.status,
			responseHeaders,
			responseBody,
			isRetryable: isRetryable == null ? void 0 : isRetryable(response)
		})
	};
	try {
		const parsedError = await parseJSON({
			text: responseBody,
			schema: errorSchema
		});
		return {
			responseHeaders,
			value: new APICallError({
				message: errorToMessage(parsedError),
				url,
				requestBodyValues,
				statusCode: response.status,
				responseHeaders,
				responseBody,
				data: parsedError,
				isRetryable: isRetryable == null ? void 0 : isRetryable(response, parsedError)
			})
		};
	} catch (e) {
		return {
			responseHeaders,
			value: new APICallError({
				message: response.statusText,
				url,
				requestBodyValues,
				statusCode: response.status,
				responseHeaders,
				responseBody,
				isRetryable: isRetryable == null ? void 0 : isRetryable(response)
			})
		};
	}
};
var createEventSourceResponseHandler = (chunkSchema) => async ({ response }) => {
	const responseHeaders = extractResponseHeaders(response);
	if (response.body == null) throw new EmptyResponseBodyError({});
	return {
		responseHeaders,
		value: parseJsonEventStream({
			stream: response.body,
			schema: chunkSchema
		})
	};
};
var createJsonResponseHandler = (responseSchema) => async ({ response, url, requestBodyValues }) => {
	const responseBody = await response.text();
	const parsedResult = await safeParseJSON({
		text: responseBody,
		schema: responseSchema
	});
	const responseHeaders = extractResponseHeaders(response);
	if (!parsedResult.success) throw new APICallError({
		message: "Invalid JSON response",
		cause: parsedResult.error,
		statusCode: response.status,
		responseHeaders,
		responseBody,
		url,
		requestBodyValues
	});
	return {
		responseHeaders,
		value: parsedResult.value,
		rawValue: parsedResult.rawValue
	};
};
function withoutTrailingSlash(url) {
	return url == null ? void 0 : url.replace(/\/$/, "");
}
function isDefinedOrNotNull(value) {
	return value !== null && value !== void 0;
}
var ReasoningFormat = /* @__PURE__ */ ((ReasoningFormat2) => {
	ReasoningFormat2["Unknown"] = "unknown";
	ReasoningFormat2["OpenAIResponsesV1"] = "openai-responses-v1";
	ReasoningFormat2["AzureOpenAIResponsesV1"] = "azure-openai-responses-v1";
	ReasoningFormat2["XAIResponsesV1"] = "xai-responses-v1";
	ReasoningFormat2["AnthropicClaudeV1"] = "anthropic-claude-v1";
	ReasoningFormat2["GoogleGeminiV1"] = "google-gemini-v1";
	return ReasoningFormat2;
})(ReasoningFormat || {});
var DEFAULT_REASONING_FORMAT = "anthropic-claude-v1";
var CommonReasoningDetailSchema = object({
	id: string().nullish(),
	format: _enum(ReasoningFormat).nullish(),
	index: number().optional()
}).loose();
var ReasoningDetailSummarySchema = object({
	type: literal("reasoning.summary"),
	summary: string()
}).extend(CommonReasoningDetailSchema.shape);
var ReasoningDetailEncryptedSchema = object({
	type: literal("reasoning.encrypted"),
	data: string()
}).extend(CommonReasoningDetailSchema.shape);
var ReasoningDetailTextSchema = object({
	type: literal("reasoning.text"),
	text: string().nullish(),
	signature: string().nullish()
}).extend(CommonReasoningDetailSchema.shape);
var ReasoningDetailUnionSchema = union([
	ReasoningDetailSummarySchema,
	ReasoningDetailEncryptedSchema,
	ReasoningDetailTextSchema
]);
var ReasoningDetailsWithUnknownSchema = union([ReasoningDetailUnionSchema, unknown().transform(() => null)]);
var ReasoningDetailArraySchema = array(ReasoningDetailsWithUnknownSchema).transform((d) => d.filter((d2) => !!d2));
union([
	object({ delta: object({ reasoning_details: array(ReasoningDetailsWithUnknownSchema) }) }).transform((data) => data.delta.reasoning_details.filter(isDefinedOrNotNull)),
	object({ message: object({ reasoning_details: array(ReasoningDetailsWithUnknownSchema) }) }).transform((data) => data.message.reasoning_details.filter(isDefinedOrNotNull)),
	object({
		text: string(),
		reasoning_details: array(ReasoningDetailsWithUnknownSchema)
	}).transform((data) => data.reasoning_details.filter(isDefinedOrNotNull))
]);
var OpenRouterErrorResponseSchema = object({ error: object({
	code: union([string(), number()]).nullable().optional().default(null),
	message: string(),
	type: string().nullable().optional().default(null),
	param: any().nullable().optional().default(null)
}).passthrough() }).passthrough();
function extractErrorMessage(data) {
	const metadata = data.error.metadata;
	if (!metadata) return data.error.message;
	const parts = [];
	if (typeof metadata.provider_name === "string" && metadata.provider_name) parts.push(`[${metadata.provider_name}]`);
	const raw = metadata.raw;
	const rawMessage = extractRawMessage(raw);
	if (rawMessage && rawMessage !== data.error.message) parts.push(rawMessage);
	else parts.push(data.error.message);
	return parts.join(" ");
}
function extractRawMessage(raw) {
	if (typeof raw === "string") try {
		const parsed = JSON.parse(raw);
		if (typeof parsed === "object" && parsed !== null) return extractRawMessage(parsed);
		return raw;
	} catch (e) {
		return raw;
	}
	if (typeof raw !== "object" || raw === null) return;
	const obj = raw;
	for (const field of [
		"message",
		"error",
		"detail",
		"details",
		"msg"
	]) {
		const value = obj[field];
		if (typeof value === "string" && value.length > 0) return value;
		if (typeof value === "object" && value !== null) {
			const nested = extractRawMessage(value);
			if (nested) return nested;
		}
	}
}
var openrouterFailedResponseHandler = createJsonErrorResponseHandler({
	errorSchema: OpenRouterErrorResponseSchema,
	errorToMessage: extractErrorMessage
});
var FileAnnotationSchema = object({
	type: literal("file"),
	file: object({
		hash: string(),
		name: string(),
		content: array(object({
			type: string(),
			text: string().optional()
		}).catchall(any())).optional()
	}).catchall(any())
}).catchall(any());
var OpenRouterProviderMetadataSchema = object({
	provider: string(),
	reasoning_details: array(ReasoningDetailUnionSchema).optional(),
	annotations: array(FileAnnotationSchema).optional(),
	usage: object({
		promptTokens: number(),
		promptTokensDetails: object({ cachedTokens: number() }).catchall(any()).optional(),
		completionTokens: number(),
		completionTokensDetails: object({ reasoningTokens: number() }).catchall(any()).optional(),
		totalTokens: number(),
		cost: number().optional(),
		costDetails: object({ upstreamInferenceCost: number() }).catchall(any()).optional()
	}).catchall(any())
}).catchall(any());
var OpenRouterProviderOptionsSchema = object({ openrouter: object({
	reasoning_details: ReasoningDetailArraySchema.optional(),
	annotations: array(FileAnnotationSchema).optional()
}).optional() }).optional();
function computeTokenUsage(usage) {
	var _a17, _b17, _c, _d, _e, _f, _g, _h;
	const promptTokens = (_a17 = usage.prompt_tokens) != null ? _a17 : 0;
	const completionTokens = (_b17 = usage.completion_tokens) != null ? _b17 : 0;
	const cacheReadTokens = (_d = (_c = usage.prompt_tokens_details) == null ? void 0 : _c.cached_tokens) != null ? _d : 0;
	const cacheWriteTokens = (_f = (_e = usage.prompt_tokens_details) == null ? void 0 : _e.cache_write_tokens) != null ? _f : void 0;
	const reasoningTokens = (_h = (_g = usage.completion_tokens_details) == null ? void 0 : _g.reasoning_tokens) != null ? _h : 0;
	return {
		inputTokens: {
			total: promptTokens,
			noCache: promptTokens - cacheReadTokens,
			cacheRead: cacheReadTokens,
			cacheWrite: cacheWriteTokens
		},
		outputTokens: {
			total: completionTokens,
			text: completionTokens - reasoningTokens,
			reasoning: reasoningTokens
		},
		raw: usage
	};
}
function emptyUsage() {
	return {
		inputTokens: {
			total: 0,
			noCache: void 0,
			cacheRead: void 0,
			cacheWrite: void 0
		},
		outputTokens: {
			total: 0,
			text: void 0,
			reasoning: void 0
		},
		raw: void 0
	};
}
function mapToUnified(finishReason) {
	switch (finishReason) {
		case "stop": return "stop";
		case "length": return "length";
		case "content_filter": return "content-filter";
		case "function_call":
		case "tool_calls": return "tool-calls";
		default: return "other";
	}
}
function mapOpenRouterFinishReason(finishReason) {
	return {
		unified: mapToUnified(finishReason),
		raw: finishReason != null ? finishReason : void 0
	};
}
function createFinishReason(unified, raw) {
	return {
		unified,
		raw
	};
}
function withStreamErrorHandling(source, onError) {
	const reader = source.getReader();
	return new ReadableStream({
		async pull(controller) {
			try {
				const { done, value } = await reader.read();
				if (done) controller.close();
				else controller.enqueue(value);
			} catch (err) {
				onError(err);
				reader.cancel().catch(() => {});
				controller.close();
			}
		},
		cancel(reason) {
			reader.cancel(reason);
		}
	});
}
function deterministicStringify(value) {
	return JSON.stringify(sortKeys(value));
}
function sortKeys(value) {
	if (value === null || value === void 0) return value;
	if (Array.isArray(value)) return value.map(sortKeys);
	if (typeof value === "object") {
		const sorted = {};
		const entries = Object.entries(value);
		entries.sort(([a], [b]) => a.localeCompare(b));
		for (const [key, val] of entries) sorted[key] = sortKeys(val);
		return sorted;
	}
	return value;
}
var _seenKeys;
var ReasoningDetailsDuplicateTracker = class {
	constructor() {
		__privateAdd(this, _seenKeys, /* @__PURE__ */ new Set());
	}
	/**
	* Attempts to track a detail.
	* Returns true if this is a NEW detail (not seen before and has valid key),
	* false if it was skipped (no valid key) or already seen (duplicate).
	*/
	upsert(detail) {
		const key = this.getCanonicalKey(detail);
		if (key === null) return false;
		if (__privateGet(this, _seenKeys).has(key)) return false;
		__privateGet(this, _seenKeys).add(key);
		return true;
	}
	getCanonicalKey(detail) {
		switch (detail.type) {
			case "reasoning.summary": return detail.summary;
			case "reasoning.encrypted":
				if (detail.id) return detail.id;
				return detail.data;
			case "reasoning.text":
				if (detail.text) return detail.text;
				if (detail.signature) return detail.signature;
				return null;
			default: return null;
		}
	}
};
_seenKeys = /* @__PURE__ */ new WeakMap();
var OPENROUTER_AUDIO_FORMATS = [
	"wav",
	"mp3",
	"aiff",
	"aac",
	"ogg",
	"flac",
	"m4a",
	"pcm16",
	"pcm24"
];
function isUrl({ url, protocols }) {
	try {
		const urlObj = new URL(url);
		return protocols.has(urlObj.protocol);
	} catch (_) {
		return false;
	}
}
function buildFileDataUrl({ data, mediaType, defaultMediaType }) {
	if (data instanceof Uint8Array) {
		const base64 = convertUint8ArrayToBase64(data);
		return `data:${mediaType != null ? mediaType : defaultMediaType};base64,${base64}`;
	}
	const stringData = data.toString();
	if (isUrl({
		url: stringData,
		protocols: /* @__PURE__ */ new Set(["http:", "https:"])
	})) return stringData;
	return stringData.startsWith("data:") ? stringData : `data:${mediaType != null ? mediaType : defaultMediaType};base64,${stringData}`;
}
function getFileUrl({ part, defaultMediaType }) {
	return getFileDataUrl({
		data: part.data,
		mediaType: part.mediaType,
		defaultMediaType
	});
}
function getFileDataUrl({ data, mediaType, defaultMediaType }) {
	switch (data.type) {
		case "data": return buildFileDataUrl({
			data: data.data,
			mediaType,
			defaultMediaType
		});
		case "url": {
			const url = data.url.toString();
			if (url.startsWith("data:") || isUrl({
				url,
				protocols: /* @__PURE__ */ new Set(["http:", "https:"])
			})) return url;
			throw new Error("Only http(s) and data: file URLs are supported by OpenRouter");
		}
		case "text": return buildFileDataUrl({
			data: new TextEncoder().encode(data.text),
			mediaType: mediaType != null ? mediaType : "text/plain",
			defaultMediaType
		});
		case "reference": throw new Error("Provider file references are not supported by OpenRouter");
	}
	return buildFileDataUrl({
		data,
		mediaType,
		defaultMediaType
	});
}
function getMediaType(dataUrl, defaultMediaType) {
	var _a17;
	const match = dataUrl.match(/^data:([^;]+)/);
	return match ? (_a17 = match[1]) != null ? _a17 : defaultMediaType : defaultMediaType;
}
function getBase64FromDataUrl(dataUrl) {
	const match = dataUrl.match(/^data:[^;]*;base64,(.+)$/);
	return match ? match[1] : dataUrl;
}
var MIME_TO_FORMAT = {
	mpeg: "mp3",
	mp3: "mp3",
	"x-wav": "wav",
	wave: "wav",
	wav: "wav",
	ogg: "ogg",
	vorbis: "ogg",
	aac: "aac",
	"x-aac": "aac",
	m4a: "m4a",
	"x-m4a": "m4a",
	mp4: "m4a",
	aiff: "aiff",
	"x-aiff": "aiff",
	flac: "flac",
	"x-flac": "flac",
	pcm16: "pcm16",
	pcm24: "pcm24"
};
function getInputAudioData(part) {
	const fileData = getFileUrl({
		part,
		defaultMediaType: "audio/mpeg"
	});
	if (isUrl({
		url: fileData,
		protocols: /* @__PURE__ */ new Set(["http:", "https:"])
	})) throw new Error(`Audio files cannot be provided as URLs.

OpenRouter requires audio to be base64-encoded. Please:
1. Download the audio file locally
2. Read it as a Buffer or Uint8Array
3. Pass it as the data parameter

The AI SDK will automatically handle base64 encoding.

Learn more: https://openrouter.ai/docs/features/multimodal/audio`);
	const data = getBase64FromDataUrl(fileData);
	const mediaType = part.mediaType || "audio/mpeg";
	const format = MIME_TO_FORMAT[mediaType.replace("audio/", "")];
	if (format === void 0) {
		const supportedList = OPENROUTER_AUDIO_FORMATS.join(", ");
		throw new Error(`Unsupported audio format: "${mediaType}"

OpenRouter supports the following audio formats: ${supportedList}

Learn more: https://openrouter.ai/docs/features/multimodal/audio`);
	}
	return {
		data,
		format
	};
}
function getCacheControl(providerMetadata) {
	var _a17, _b17, _c;
	const anthropic = providerMetadata == null ? void 0 : providerMetadata.anthropic;
	const openrouter2 = providerMetadata == null ? void 0 : providerMetadata.openrouter;
	return (_c = (_b17 = (_a17 = openrouter2 == null ? void 0 : openrouter2.cacheControl) != null ? _a17 : openrouter2 == null ? void 0 : openrouter2.cache_control) != null ? _b17 : anthropic == null ? void 0 : anthropic.cacheControl) != null ? _c : anthropic == null ? void 0 : anthropic.cache_control;
}
function convertToOpenRouterChatMessages(prompt) {
	var _a17, _b17, _c, _d, _e, _f, _g, _h;
	const messages = [];
	const reasoningDetailsTracker = new ReasoningDetailsDuplicateTracker();
	for (const { role, content, providerOptions } of prompt) switch (role) {
		case "system": {
			const cacheControl = getCacheControl(providerOptions);
			messages.push({
				role: "system",
				content: [__spreadValues({
					type: "text",
					text: content
				}, cacheControl && { cache_control: cacheControl })]
			});
			break;
		}
		case "user": {
			if (content.length === 1 && ((_a17 = content[0]) == null ? void 0 : _a17.type) === "text") {
				const cacheControl = (_b17 = getCacheControl(providerOptions)) != null ? _b17 : getCacheControl(content[0].providerOptions);
				const contentWithCacheControl = cacheControl ? [{
					type: "text",
					text: content[0].text,
					cache_control: cacheControl
				}] : content[0].text;
				messages.push({
					role: "user",
					content: contentWithCacheControl
				});
				break;
			}
			const messageCacheControl = getCacheControl(providerOptions);
			let lastTextPartIndex = -1;
			for (let i = content.length - 1; i >= 0; i--) if (((_c = content[i]) == null ? void 0 : _c.type) === "text") {
				lastTextPartIndex = i;
				break;
			}
			const contentParts = content.map((part, index) => {
				var _a18, _b18, _c2, _d2, _e2, _f2, _g2;
				const isLastTextPart = part.type === "text" && index === lastTextPartIndex;
				const partCacheControl = getCacheControl(part.providerOptions);
				const cacheControl = part.type === "text" ? partCacheControl != null ? partCacheControl : isLastTextPart ? messageCacheControl : void 0 : partCacheControl;
				switch (part.type) {
					case "text": return __spreadValues({
						type: "text",
						text: part.text
					}, cacheControl && { cache_control: cacheControl });
					case "file": {
						if ((_a18 = part.mediaType) == null ? void 0 : _a18.startsWith("image/")) return __spreadValues({
							type: "image_url",
							image_url: { url: getFileUrl({
								part,
								defaultMediaType: "image/jpeg"
							}) }
						}, cacheControl && { cache_control: cacheControl });
						if ((_b18 = part.mediaType) == null ? void 0 : _b18.startsWith("video/")) return __spreadValues({
							type: "video_url",
							video_url: { url: getFileUrl({
								part,
								defaultMediaType: "video/mp4"
							}) }
						}, cacheControl && { cache_control: cacheControl });
						if ((_c2 = part.mediaType) == null ? void 0 : _c2.startsWith("audio/")) return __spreadValues({
							type: "input_audio",
							input_audio: getInputAudioData(part)
						}, cacheControl && { cache_control: cacheControl });
						const fileName = String((_g2 = (_f2 = (_e2 = (_d2 = part.providerOptions) == null ? void 0 : _d2.openrouter) == null ? void 0 : _e2.filename) != null ? _f2 : part.filename) != null ? _g2 : "");
						const fileData = getFileUrl({
							part,
							defaultMediaType: "application/pdf"
						});
						if (isUrl({
							url: fileData,
							protocols: /* @__PURE__ */ new Set(["http:", "https:"])
						})) return {
							type: "file",
							file: {
								filename: fileName,
								file_data: fileData
							}
						};
						return __spreadValues({
							type: "file",
							file: {
								filename: fileName,
								file_data: fileData
							}
						}, cacheControl && { cache_control: cacheControl });
					}
					default: return __spreadValues({
						type: "text",
						text: ""
					}, cacheControl && { cache_control: cacheControl });
				}
			});
			messages.push({
				role: "user",
				content: contentParts
			});
			break;
		}
		case "assistant": {
			let text = "";
			let reasoning = "";
			const toolCalls = [];
			for (const part of content) switch (part.type) {
				case "text":
					text += part.text;
					break;
				case "tool-call":
					toolCalls.push({
						id: part.toolCallId,
						type: "function",
						function: {
							name: part.toolName,
							arguments: deterministicStringify(part.input)
						}
					});
					break;
				case "reasoning": reasoning += part.text;
			}
			const parsedProviderOptions = OpenRouterProviderOptionsSchema.safeParse(providerOptions);
			const messageReasoningDetails = parsedProviderOptions.success ? (_e = (_d = parsedProviderOptions.data) == null ? void 0 : _d.openrouter) == null ? void 0 : _e.reasoning_details : void 0;
			const messageAnnotations = parsedProviderOptions.success ? (_g = (_f = parsedProviderOptions.data) == null ? void 0 : _f.openrouter) == null ? void 0 : _g.annotations : void 0;
			const candidateReasoningDetails = messageReasoningDetails && Array.isArray(messageReasoningDetails) ? messageReasoningDetails : findFirstReasoningDetails(content);
			let finalReasoningDetails;
			if (candidateReasoningDetails) {
				const validDetails = candidateReasoningDetails.filter((detail) => {
					var _a18;
					if (detail.type !== "reasoning.text") return true;
					const format = (_a18 = detail.format) != null ? _a18 : DEFAULT_REASONING_FORMAT;
					if (format !== "anthropic-claude-v1" && format !== "google-gemini-v1") return true;
					return !!detail.signature;
				});
				if (validDetails.length < candidateReasoningDetails.length) {
					const logger = globalThis.AI_SDK_LOG_WARNINGS;
					if (logger !== false && typeof logger !== "function") console.warn("[openrouter] Some reasoning_details entries were removed because they were missing signatures. See https://github.com/OpenRouterTeam/ai-sdk-provider/issues/423 and https://github.com/OpenRouterTeam/ai-sdk-provider/issues/418 for more details.");
				}
				const uniqueDetails = [];
				for (const detail of validDetails) if (reasoningDetailsTracker.upsert(detail)) uniqueDetails.push(detail);
				finalReasoningDetails = uniqueDetails;
			}
			const effectiveReasoning = reasoning && finalReasoningDetails && finalReasoningDetails.length > 0 ? reasoning : void 0;
			messages.push({
				role: "assistant",
				content: text || null,
				tool_calls: toolCalls.length > 0 ? toolCalls : void 0,
				reasoning: effectiveReasoning,
				reasoning_details: finalReasoningDetails,
				annotations: messageAnnotations,
				cache_control: getCacheControl(providerOptions)
			});
			break;
		}
		case "tool": for (const toolResponse of content) {
			if (toolResponse.type === "tool-approval-response") continue;
			const content2 = getToolResultContent(toolResponse);
			messages.push({
				role: "tool",
				tool_call_id: toolResponse.toolCallId,
				content: content2,
				name: toolResponse.toolName,
				cache_control: (_h = getCacheControl(providerOptions)) != null ? _h : getCacheControl(toolResponse.providerOptions)
			});
		}
	}
	return messages;
}
function getToolResultContent(input) {
	var _a17;
	switch (input.output.type) {
		case "text":
		case "error-text": return input.output.value;
		case "json":
		case "error-json": return JSON.stringify(input.output.value);
		case "content": return mapToolResultContentParts(input.output.value);
		case "execution-denied": return (_a17 = input.output.reason) != null ? _a17 : "Tool execution denied";
	}
}
function mapToolResultContentParts(parts) {
	return parts.map((part) => {
		var _a17, _b17, _c, _d;
		switch (part.type) {
			case "text": return {
				type: "text",
				text: part.text
			};
			case "file": {
				const dataUrl = getFileDataUrl({
					data: part.data,
					mediaType: part.mediaType,
					defaultMediaType: "application/octet-stream"
				});
				if ((_a17 = part.mediaType) == null ? void 0 : _a17.startsWith("image/")) return {
					type: "image_url",
					image_url: { url: dataUrl }
				};
				if ((_b17 = part.mediaType) == null ? void 0 : _b17.startsWith("video/")) return {
					type: "video_url",
					video_url: { url: dataUrl }
				};
				if ((_c = part.mediaType) == null ? void 0 : _c.startsWith("audio/")) {
					const format = MIME_TO_FORMAT[part.mediaType.replace("audio/", "")];
					if (format !== void 0) return {
						type: "input_audio",
						input_audio: {
							data: getBase64FromDataUrl(dataUrl),
							format
						}
					};
				}
				return {
					type: "file",
					file: {
						filename: (_d = part.filename) != null ? _d : "",
						file_data: dataUrl
					}
				};
			}
			case "custom": return {
				type: "text",
				text: JSON.stringify(part)
			};
			default: return {
				type: "text",
				text: JSON.stringify(part)
			};
		}
	});
}
function findFirstReasoningDetails(content) {
	var _a17, _b17, _c, _d;
	for (const part of content) if (part.type === "tool-call") {
		const parsed = OpenRouterProviderOptionsSchema.safeParse(part.providerOptions);
		if (parsed.success && ((_b17 = (_a17 = parsed.data) == null ? void 0 : _a17.openrouter) == null ? void 0 : _b17.reasoning_details) && parsed.data.openrouter.reasoning_details.length > 0) return parsed.data.openrouter.reasoning_details;
	}
	for (const part of content) if (part.type === "reasoning") {
		const parsed = OpenRouterProviderOptionsSchema.safeParse(part.providerOptions);
		if (parsed.success && ((_d = (_c = parsed.data) == null ? void 0 : _c.openrouter) == null ? void 0 : _d.reasoning_details) && parsed.data.openrouter.reasoning_details.length > 0) return parsed.data.openrouter.reasoning_details;
	}
}
union([
	literal("auto"),
	literal("none"),
	literal("required"),
	object({
		type: literal("function"),
		function: object({ name: string() })
	})
]);
function getChatCompletionToolChoice(toolChoice) {
	switch (toolChoice.type) {
		case "auto":
		case "none":
		case "required": return toolChoice.type;
		case "tool": return {
			type: "function",
			function: { name: toolChoice.toolName }
		};
		default: throw new InvalidArgumentError({
			argument: "toolChoice",
			message: `Invalid tool choice type: ${JSON.stringify(toolChoice)}`
		});
	}
}
var ImageResponseSchema = object({
	type: literal("image_url"),
	image_url: object({ url: string() }).passthrough()
}).passthrough();
var ImageResponseWithUnknownSchema = union([ImageResponseSchema, unknown().transform(() => null)]);
var ImageResponseArraySchema = array(ImageResponseWithUnknownSchema).transform((d) => d.filter((d2) => !!d2));
var OpenRouterChatCompletionBaseResponseSchema = object({
	id: string().optional(),
	model: string().optional(),
	provider: string().optional(),
	usage: object({
		prompt_tokens: number(),
		prompt_tokens_details: object({
			cached_tokens: number(),
			cache_write_tokens: number().nullish()
		}).passthrough().nullish(),
		completion_tokens: number(),
		completion_tokens_details: object({ reasoning_tokens: number() }).passthrough().nullish(),
		total_tokens: number(),
		cost: number().optional(),
		cost_details: object({ upstream_inference_cost: number().nullish() }).passthrough().nullish()
	}).passthrough().nullish()
}).passthrough();
var OpenRouterNonStreamChatCompletionResponseSchema = union([OpenRouterChatCompletionBaseResponseSchema.extend({ choices: array(object({
	message: object({
		role: literal("assistant"),
		content: string().nullable().optional(),
		reasoning: string().nullable().optional(),
		reasoning_details: ReasoningDetailArraySchema.nullish(),
		images: ImageResponseArraySchema.nullish(),
		tool_calls: array(object({
			id: string().optional().nullable(),
			type: literal("function"),
			function: object({
				name: string(),
				arguments: string().optional()
			}).passthrough()
		}).passthrough()).optional(),
		annotations: array(union([
			object({
				type: literal("url_citation"),
				url_citation: object({
					url: string(),
					title: string().optional(),
					start_index: number().optional(),
					end_index: number().optional(),
					content: string().optional()
				}).passthrough()
			}).passthrough(),
			object({
				type: literal("file_annotation"),
				file_annotation: object({
					file_id: string(),
					quote: string().optional()
				}).passthrough()
			}).passthrough(),
			object({
				type: literal("file"),
				file: object({
					hash: string(),
					name: string(),
					content: array(object({
						type: string(),
						text: string().optional()
					}).passthrough()).optional()
				}).passthrough()
			}).passthrough()
		])).nullish()
	}).passthrough(),
	index: number().nullish(),
	logprobs: object({ content: array(object({
		token: string(),
		logprob: number(),
		top_logprobs: array(object({
			token: string(),
			logprob: number()
		}).passthrough())
	}).passthrough()).nullable() }).passthrough().nullable().optional(),
	finish_reason: string().optional().nullable()
}).passthrough()) }), OpenRouterErrorResponseSchema.extend({ user_id: string().optional() })]);
var OpenRouterStreamChatCompletionChunkSchema = union([OpenRouterChatCompletionBaseResponseSchema.extend({ choices: array(object({
	delta: object({
		role: _enum(["assistant"]).optional(),
		content: string().nullish(),
		reasoning: string().nullish().optional(),
		reasoning_details: ReasoningDetailArraySchema.nullish(),
		images: ImageResponseArraySchema.nullish(),
		tool_calls: array(object({
			index: number().nullish(),
			id: string().nullish(),
			type: literal("function").optional(),
			function: object({
				name: string().nullish(),
				arguments: string().nullish()
			}).passthrough()
		}).passthrough()).nullish(),
		annotations: array(union([
			object({
				type: literal("url_citation"),
				url_citation: object({
					url: string(),
					title: string().optional(),
					start_index: number().optional(),
					end_index: number().optional(),
					content: string().optional()
				}).passthrough()
			}).passthrough(),
			object({
				type: literal("file_annotation"),
				file_annotation: object({
					file_id: string(),
					quote: string().optional()
				}).passthrough()
			}).passthrough(),
			object({
				type: literal("file"),
				file: object({
					hash: string(),
					name: string(),
					content: array(object({
						type: string(),
						text: string().optional()
					}).passthrough()).optional()
				}).passthrough()
			}).passthrough()
		])).nullish()
	}).passthrough().nullish(),
	logprobs: object({ content: array(object({
		token: string(),
		logprob: number(),
		top_logprobs: array(object({
			token: string(),
			logprob: number()
		}).passthrough())
	}).passthrough()).nullable() }).passthrough().nullish(),
	finish_reason: string().nullable().optional(),
	index: number().nullish()
}).passthrough()) }), OpenRouterErrorResponseSchema]);
var OpenRouterChatLanguageModel = class {
	constructor(modelId, settings, config) {
		this.specificationVersion = "v4";
		this.provider = "openrouter";
		this.defaultObjectGenerationMode = "tool";
		this.supportsImageUrls = true;
		this.supportedUrls = {
			"image/*": [/^data:image\/[a-zA-Z]+;base64,/, /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)(?:[?#].*)?$/i],
			"application/*": [/^data:application\//, /^https?:\/\/.+$/]
		};
		this.modelId = modelId;
		this.settings = settings;
		this.config = config;
	}
	getArgs({ prompt, maxOutputTokens, temperature, topP, frequencyPenalty, presencePenalty, seed, stopSequences, responseFormat, topK, tools, toolChoice }) {
		var _a17, _b17, _c, _d;
		const baseArgs = __spreadValues(__spreadValues({
			model: this.modelId,
			models: this.settings.models,
			logit_bias: this.settings.logitBias,
			logprobs: this.settings.logprobs === true || typeof this.settings.logprobs === "number" ? true : void 0,
			top_logprobs: typeof this.settings.logprobs === "number" ? this.settings.logprobs : typeof this.settings.logprobs === "boolean" ? this.settings.logprobs ? 0 : void 0 : void 0,
			user: this.settings.user,
			parallel_tool_calls: this.settings.parallelToolCalls,
			max_tokens: maxOutputTokens != null ? maxOutputTokens : this.settings.maxTokens,
			temperature: temperature != null ? temperature : this.settings.temperature,
			top_p: topP != null ? topP : this.settings.topP,
			frequency_penalty: frequencyPenalty != null ? frequencyPenalty : this.settings.frequencyPenalty,
			presence_penalty: presencePenalty != null ? presencePenalty : this.settings.presencePenalty,
			seed,
			stop: stopSequences,
			response_format: (responseFormat == null ? void 0 : responseFormat.type) === "json" ? responseFormat.schema != null ? {
				type: "json_schema",
				json_schema: __spreadValues({
					schema: responseFormat.schema,
					strict: (_b17 = (_a17 = this.settings.structuredOutputs) == null ? void 0 : _a17.strict) != null ? _b17 : true,
					name: (_c = responseFormat.name) != null ? _c : "response"
				}, responseFormat.description && { description: responseFormat.description })
			} : { type: "json_object" } : void 0,
			top_k: topK != null ? topK : this.settings.topK,
			messages: convertToOpenRouterChatMessages(prompt),
			include_reasoning: this.settings.includeReasoning,
			reasoning: this.settings.reasoning,
			usage: this.settings.usage,
			plugins: this.settings.plugins,
			web_search_options: this.settings.web_search_options,
			provider: this.settings.provider,
			debug: this.settings.debug,
			cache_control: this.settings.cache_control
		}, this.config.extraBody), this.settings.extraBody);
		if (tools && tools.length > 0) {
			const mappedTools = [];
			for (const tool2 of tools) if (tool2.type === "function") {
				const openrouterOptions = (_d = tool2.providerOptions) == null ? void 0 : _d.openrouter;
				const eagerInputStreaming = openrouterOptions == null ? void 0 : openrouterOptions.eager_input_streaming;
				mappedTools.push(__spreadValues({
					type: "function",
					function: {
						name: tool2.name,
						description: tool2.description,
						parameters: tool2.inputSchema
					}
				}, eagerInputStreaming != null && { eager_input_streaming: eagerInputStreaming }));
			} else if (tool2.type === "provider") mappedTools.push(mapProviderTool(tool2));
			return __spreadProps(__spreadValues({}, baseArgs), {
				tools: mappedTools,
				tool_choice: toolChoice ? getChatCompletionToolChoice(toolChoice) : void 0
			});
		}
		return baseArgs;
	}
	async doGenerate(options) {
		var _b17, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s, _t, _u, _v;
		const _a17 = (options.providerOptions || {}).openrouter || {}, { cacheControl } = _a17, restOpenrouterOptions = __objRest(_a17, ["cacheControl"]);
		const args = __spreadValues(__spreadValues(__spreadValues({}, this.getArgs(options)), restOpenrouterOptions), cacheControl != null && !("cache_control" in restOpenrouterOptions) ? { cache_control: cacheControl } : {});
		const { value: responseValue, responseHeaders } = await postJsonToApi({
			url: this.config.url({
				path: "/chat/completions",
				modelId: this.modelId
			}),
			headers: combineHeaders(this.config.headers(), options.headers),
			body: args,
			failedResponseHandler: openrouterFailedResponseHandler,
			successfulResponseHandler: createJsonResponseHandler(OpenRouterNonStreamChatCompletionResponseSchema),
			abortSignal: options.abortSignal,
			fetch: this.config.fetch
		});
		if ("error" in responseValue) {
			const errorData = responseValue.error;
			throw new APICallError({
				message: errorData.message,
				url: this.config.url({
					path: "/chat/completions",
					modelId: this.modelId
				}),
				requestBodyValues: args,
				statusCode: 200,
				responseHeaders,
				data: errorData
			});
		}
		const response = responseValue;
		const choice = response.choices[0];
		if (!choice) throw new NoContentGeneratedError({ message: "No choice in response" });
		const usageInfo = response.usage ? computeTokenUsage(response.usage) : emptyUsage();
		const reasoningDetails = (_b17 = choice.message.reasoning_details) != null ? _b17 : [];
		const reasoning = reasoningDetails.length > 0 ? reasoningDetails.map((detail) => {
			switch (detail.type) {
				case "reasoning.text":
					if (detail.text) return {
						type: "reasoning",
						text: detail.text,
						providerMetadata: { openrouter: { reasoning_details: [detail] } }
					};
					break;
				case "reasoning.summary": if (detail.summary) return {
					type: "reasoning",
					text: detail.summary,
					providerMetadata: { openrouter: { reasoning_details: [detail] } }
				};
			}
			return null;
		}).filter((p) => p !== null) : choice.message.reasoning ? [{
			type: "reasoning",
			text: choice.message.reasoning
		}] : [];
		const content = [];
		content.push(...reasoning);
		if (choice.message.content) content.push({
			type: "text",
			text: choice.message.content
		});
		if (choice.message.tool_calls) {
			let reasoningDetailsAttachedToToolCall = false;
			const seenToolCallIds = /* @__PURE__ */ new Set();
			for (const toolCall of choice.message.tool_calls) {
				let toolCallId = toolCall.id;
				if (!toolCallId || seenToolCallIds.has(toolCallId)) toolCallId = generateId();
				seenToolCallIds.add(toolCallId);
				content.push({
					type: "tool-call",
					toolCallId,
					toolName: toolCall.function.name,
					input: (_c = toolCall.function.arguments) != null ? _c : "{}",
					providerMetadata: !reasoningDetailsAttachedToToolCall ? { openrouter: { reasoning_details: reasoningDetails } } : void 0
				});
				reasoningDetailsAttachedToToolCall = true;
			}
		}
		if (choice.message.images) for (const image of choice.message.images) content.push({
			type: "file",
			mediaType: getMediaType(image.image_url.url, "image/jpeg"),
			data: {
				type: "data",
				data: getBase64FromDataUrl(image.image_url.url)
			}
		});
		if (choice.message.annotations) {
			for (const annotation of choice.message.annotations) if (annotation.type === "url_citation") content.push({
				type: "source",
				sourceType: "url",
				id: annotation.url_citation.url,
				url: annotation.url_citation.url,
				title: (_d = annotation.url_citation.title) != null ? _d : "",
				providerMetadata: { openrouter: {
					content: (_e = annotation.url_citation.content) != null ? _e : "",
					startIndex: (_f = annotation.url_citation.start_index) != null ? _f : 0,
					endIndex: (_g = annotation.url_citation.end_index) != null ? _g : 0
				} }
			});
		}
		const fileAnnotations = (_h = choice.message.annotations) == null ? void 0 : _h.filter((a) => a.type === "file");
		const hasToolCalls = choice.message.tool_calls && choice.message.tool_calls.length > 0;
		const hasEncryptedReasoning = reasoningDetails.some((d) => d.type === "reasoning.encrypted" && d.data);
		const mappedFinishReason = hasToolCalls && hasEncryptedReasoning && choice.finish_reason === "stop" ? createFinishReason("tool-calls", (_i = choice.finish_reason) != null ? _i : void 0) : mapOpenRouterFinishReason(choice.finish_reason);
		return {
			content,
			finishReason: hasToolCalls && mappedFinishReason.unified === "other" ? createFinishReason("tool-calls", mappedFinishReason.raw) : mappedFinishReason,
			usage: usageInfo,
			warnings: [],
			providerMetadata: { openrouter: OpenRouterProviderMetadataSchema.parse({
				provider: (_j = response.provider) != null ? _j : "",
				reasoning_details: (_k = choice.message.reasoning_details) != null ? _k : [],
				annotations: fileAnnotations && fileAnnotations.length > 0 ? fileAnnotations : void 0,
				usage: __spreadValues(__spreadValues(__spreadValues(__spreadValues({
					promptTokens: (_l = usageInfo.inputTokens.total) != null ? _l : 0,
					completionTokens: (_m = usageInfo.outputTokens.total) != null ? _m : 0,
					totalTokens: ((_n = usageInfo.inputTokens.total) != null ? _n : 0) + ((_o = usageInfo.outputTokens.total) != null ? _o : 0)
				}, ((_p = response.usage) == null ? void 0 : _p.cost) != null ? { cost: response.usage.cost } : {}), ((_r = (_q = response.usage) == null ? void 0 : _q.prompt_tokens_details) == null ? void 0 : _r.cached_tokens) != null ? { promptTokensDetails: { cachedTokens: response.usage.prompt_tokens_details.cached_tokens } } : {}), ((_t = (_s = response.usage) == null ? void 0 : _s.completion_tokens_details) == null ? void 0 : _t.reasoning_tokens) != null ? { completionTokensDetails: { reasoningTokens: response.usage.completion_tokens_details.reasoning_tokens } } : {}), ((_v = (_u = response.usage) == null ? void 0 : _u.cost_details) == null ? void 0 : _v.upstream_inference_cost) != null ? { costDetails: { upstreamInferenceCost: response.usage.cost_details.upstream_inference_cost } } : {})
			}) },
			request: { body: args },
			response: {
				id: response.id,
				modelId: response.model,
				headers: responseHeaders,
				body: response
			}
		};
	}
	async doStream(options) {
		var _b17;
		const _a17 = (options.providerOptions || {}).openrouter || {}, { cacheControl } = _a17, restOpenrouterOptions = __objRest(_a17, ["cacheControl"]);
		const args = __spreadValues(__spreadValues(__spreadValues({}, this.getArgs(options)), restOpenrouterOptions), cacheControl != null && !("cache_control" in restOpenrouterOptions) ? { cache_control: cacheControl } : {});
		const { value: response, responseHeaders } = await postJsonToApi({
			url: this.config.url({
				path: "/chat/completions",
				modelId: this.modelId
			}),
			headers: combineHeaders(this.config.headers(), options.headers),
			body: __spreadProps(__spreadValues({}, args), {
				stream: true,
				stream_options: this.config.compatibility === "strict" ? __spreadValues({ include_usage: true }, ((_b17 = this.settings.usage) == null ? void 0 : _b17.include) ? { include_usage: true } : {}) : void 0
			}),
			failedResponseHandler: openrouterFailedResponseHandler,
			successfulResponseHandler: createEventSourceResponseHandler(OpenRouterStreamChatCompletionChunkSchema),
			abortSignal: options.abortSignal,
			fetch: this.config.fetch
		});
		let streamError;
		const safeResponse = withStreamErrorHandling(response, (err) => {
			streamError = err;
		});
		const toolCalls = [];
		const seenToolCallIds = /* @__PURE__ */ new Set();
		let finishReason = createFinishReason("other");
		const usage = {
			inputTokens: {
				total: void 0,
				noCache: void 0,
				cacheRead: void 0,
				cacheWrite: void 0
			},
			outputTokens: {
				total: void 0,
				text: void 0,
				reasoning: void 0
			},
			raw: void 0
		};
		const openrouterUsage = {};
		let rawUsage;
		const accumulatedReasoningDetails = [];
		let reasoningDetailsAttachedToToolCall = false;
		const accumulatedFileAnnotations = [];
		let textStarted = false;
		let reasoningStarted = false;
		let textId;
		let reasoningId;
		let openrouterResponseId;
		let provider;
		const warnings = [];
		return {
			stream: safeResponse.pipeThrough(new TransformStream({
				start(controller) {
					controller.enqueue({
						type: "stream-start",
						warnings
					});
				},
				transform(chunk, controller) {
					var _a18, _b18, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s, _t, _u;
					if (options.includeRawChunks) controller.enqueue({
						type: "raw",
						rawValue: chunk.rawValue
					});
					if (!chunk.success) {
						finishReason = createFinishReason("error");
						controller.enqueue({
							type: "error",
							error: chunk.error
						});
						return;
					}
					const value = chunk.value;
					if ("error" in value) {
						finishReason = createFinishReason("error");
						controller.enqueue({
							type: "error",
							error: value.error
						});
						return;
					}
					if (value.provider) provider = value.provider;
					if (value.id) {
						openrouterResponseId = value.id;
						controller.enqueue({
							type: "response-metadata",
							id: value.id
						});
					}
					if (value.model) controller.enqueue({
						type: "response-metadata",
						modelId: value.model
					});
					if (value.usage != null) {
						const computed = computeTokenUsage(value.usage);
						Object.assign(usage.inputTokens, computed.inputTokens);
						Object.assign(usage.outputTokens, computed.outputTokens);
						rawUsage = value.usage;
						const promptTokens = (_a18 = value.usage.prompt_tokens) != null ? _a18 : 0;
						const completionTokens = (_b18 = value.usage.completion_tokens) != null ? _b18 : 0;
						openrouterUsage.promptTokens = promptTokens;
						if (value.usage.prompt_tokens_details) openrouterUsage.promptTokensDetails = { cachedTokens: (_c = value.usage.prompt_tokens_details.cached_tokens) != null ? _c : 0 };
						openrouterUsage.completionTokens = completionTokens;
						if (value.usage.completion_tokens_details) openrouterUsage.completionTokensDetails = { reasoningTokens: (_d = value.usage.completion_tokens_details.reasoning_tokens) != null ? _d : 0 };
						if (value.usage.cost != null) openrouterUsage.cost = value.usage.cost;
						openrouterUsage.totalTokens = value.usage.total_tokens;
						const upstreamInferenceCost = (_e = value.usage.cost_details) == null ? void 0 : _e.upstream_inference_cost;
						if (upstreamInferenceCost != null) openrouterUsage.costDetails = { upstreamInferenceCost };
					}
					const choice = value.choices[0];
					if ((choice == null ? void 0 : choice.finish_reason) != null) finishReason = mapOpenRouterFinishReason(choice.finish_reason);
					if ((choice == null ? void 0 : choice.delta) == null) return;
					const delta = choice.delta;
					const emitReasoningChunk = (chunkText) => {
						if (!reasoningStarted) {
							reasoningId = generateId();
							controller.enqueue({
								type: "reasoning-start",
								id: reasoningId
							});
							reasoningStarted = true;
						}
						controller.enqueue({
							type: "reasoning-delta",
							delta: chunkText,
							id: reasoningId || generateId()
						});
					};
					if (delta.reasoning_details && delta.reasoning_details.length > 0) {
						for (const detail of delta.reasoning_details) if (detail.type === "reasoning.text") {
							const lastDetail = accumulatedReasoningDetails[accumulatedReasoningDetails.length - 1];
							if ((lastDetail == null ? void 0 : lastDetail.type) === "reasoning.text") {
								lastDetail.text = (lastDetail.text || "") + (detail.text || "");
								lastDetail.signature = lastDetail.signature || detail.signature;
								lastDetail.format = lastDetail.format || detail.format;
							} else accumulatedReasoningDetails.push(__spreadValues({}, detail));
						} else accumulatedReasoningDetails.push(detail);
						if (!textStarted) for (const detail of delta.reasoning_details) switch (detail.type) {
							case "reasoning.text":
								emitReasoningChunk(detail.text || "");
								break;
							case "reasoning.encrypted": break;
							case "reasoning.summary": if (detail.summary) emitReasoningChunk(detail.summary);
						}
					} else if (delta.reasoning && !textStarted) emitReasoningChunk(delta.reasoning);
					if (delta.content) {
						if (reasoningStarted && !textStarted) {
							controller.enqueue({
								type: "reasoning-end",
								id: reasoningId || generateId(),
								providerMetadata: { openrouter: { reasoning_details: accumulatedReasoningDetails } }
							});
							reasoningStarted = false;
						}
						if (!textStarted) {
							textId = openrouterResponseId || generateId();
							controller.enqueue({
								type: "text-start",
								id: textId
							});
							textStarted = true;
						}
						controller.enqueue({
							type: "text-delta",
							delta: delta.content,
							id: textId || generateId()
						});
					}
					if (delta.annotations) {
						for (const annotation of delta.annotations) if (annotation.type === "url_citation") controller.enqueue({
							type: "source",
							sourceType: "url",
							id: annotation.url_citation.url,
							url: annotation.url_citation.url,
							title: (_f = annotation.url_citation.title) != null ? _f : "",
							providerMetadata: { openrouter: {
								content: (_g = annotation.url_citation.content) != null ? _g : "",
								startIndex: (_h = annotation.url_citation.start_index) != null ? _h : 0,
								endIndex: (_i = annotation.url_citation.end_index) != null ? _i : 0
							} }
						});
						else if (annotation.type === "file") {
							const file = annotation.file;
							if (file && typeof file === "object" && "hash" in file && "name" in file) accumulatedFileAnnotations.push(annotation);
						}
					}
					if (delta.tool_calls != null) for (const toolCallDelta of delta.tool_calls) {
						const index = (_j = toolCallDelta.index) != null ? _j : toolCalls.length - 1;
						if (toolCalls[index] == null) {
							if (toolCallDelta.type !== "function") throw new InvalidResponseDataError({
								data: toolCallDelta,
								message: `Expected 'function' type.`
							});
							if (((_k = toolCallDelta.function) == null ? void 0 : _k.name) == null) throw new InvalidResponseDataError({
								data: toolCallDelta,
								message: `Expected 'function.name' to be a string.`
							});
							let toolCallId = (_l = toolCallDelta.id) != null ? _l : "";
							if (!toolCallId || seenToolCallIds.has(toolCallId)) toolCallId = generateId();
							seenToolCallIds.add(toolCallId);
							toolCalls[index] = {
								id: toolCallId,
								type: "function",
								function: {
									name: toolCallDelta.function.name,
									arguments: (_m = toolCallDelta.function.arguments) != null ? _m : ""
								},
								inputStarted: false,
								sent: false
							};
							const toolCall2 = toolCalls[index];
							if (toolCall2 == null) throw new InvalidResponseDataError({
								data: {
									index,
									toolCallsLength: toolCalls.length
								},
								message: `Tool call at index ${index} is missing after creation.`
							});
							if (((_n = toolCall2.function) == null ? void 0 : _n.name) != null && ((_o = toolCall2.function) == null ? void 0 : _o.arguments) != null && isParsableJson(toolCall2.function.arguments)) {
								toolCall2.inputStarted = true;
								controller.enqueue({
									type: "tool-input-start",
									id: toolCall2.id,
									toolName: toolCall2.function.name
								});
								controller.enqueue({
									type: "tool-input-delta",
									id: toolCall2.id,
									delta: toolCall2.function.arguments
								});
								controller.enqueue({
									type: "tool-input-end",
									id: toolCall2.id
								});
								controller.enqueue({
									type: "tool-call",
									toolCallId: toolCall2.id,
									toolName: toolCall2.function.name,
									input: toolCall2.function.arguments,
									providerMetadata: !reasoningDetailsAttachedToToolCall ? { openrouter: { reasoning_details: accumulatedReasoningDetails } } : void 0
								});
								reasoningDetailsAttachedToToolCall = true;
								toolCall2.sent = true;
							}
							continue;
						}
						const toolCall = toolCalls[index];
						if (toolCall == null) throw new InvalidResponseDataError({
							data: {
								index,
								toolCallsLength: toolCalls.length,
								toolCallDelta
							},
							message: `Tool call at index ${index} is missing during merge.`
						});
						if (!toolCall.inputStarted) {
							toolCall.inputStarted = true;
							controller.enqueue({
								type: "tool-input-start",
								id: toolCall.id,
								toolName: toolCall.function.name
							});
							if (toolCall.function.arguments) controller.enqueue({
								type: "tool-input-delta",
								id: toolCall.id,
								delta: toolCall.function.arguments
							});
						}
						if (((_p = toolCallDelta.function) == null ? void 0 : _p.arguments) != null) toolCall.function.arguments += (_r = (_q = toolCallDelta.function) == null ? void 0 : _q.arguments) != null ? _r : "";
						controller.enqueue({
							type: "tool-input-delta",
							id: toolCall.id,
							delta: (_s = toolCallDelta.function.arguments) != null ? _s : ""
						});
						if (!toolCall.sent && ((_t = toolCall.function) == null ? void 0 : _t.name) != null && ((_u = toolCall.function) == null ? void 0 : _u.arguments) != null && isParsableJson(toolCall.function.arguments)) {
							controller.enqueue({
								type: "tool-input-end",
								id: toolCall.id
							});
							controller.enqueue({
								type: "tool-call",
								toolCallId: toolCall.id,
								toolName: toolCall.function.name,
								input: toolCall.function.arguments,
								providerMetadata: !reasoningDetailsAttachedToToolCall ? { openrouter: { reasoning_details: accumulatedReasoningDetails } } : void 0
							});
							reasoningDetailsAttachedToToolCall = true;
							toolCall.sent = true;
						}
					}
					if (delta.images != null) for (const image of delta.images) controller.enqueue({
						type: "file",
						mediaType: getMediaType(image.image_url.url, "image/jpeg"),
						data: {
							type: "data",
							data: getBase64FromDataUrl(image.image_url.url)
						}
					});
				},
				flush(controller) {
					const hasToolCalls = toolCalls.length > 0;
					if (streamError != null) {
						finishReason = createFinishReason("error");
						controller.enqueue({
							type: "error",
							error: streamError
						});
					}
					const hasEncryptedReasoning = accumulatedReasoningDetails.some((d) => d.type === "reasoning.encrypted" && d.data);
					if (hasToolCalls && hasEncryptedReasoning && finishReason.unified === "stop") finishReason = createFinishReason("tool-calls", finishReason.raw);
					if (hasToolCalls && finishReason.unified === "other") finishReason = createFinishReason("tool-calls", finishReason.raw);
					if (finishReason.unified === "tool-calls") {
						for (const toolCall of toolCalls) if (toolCall && !toolCall.sent) {
							const input = isParsableJson(toolCall.function.arguments) ? toolCall.function.arguments : "{}";
							if (!toolCall.inputStarted) {
								controller.enqueue({
									type: "tool-input-start",
									id: toolCall.id,
									toolName: toolCall.function.name
								});
								controller.enqueue({
									type: "tool-input-delta",
									id: toolCall.id,
									delta: input
								});
							}
							controller.enqueue({
								type: "tool-input-end",
								id: toolCall.id
							});
							controller.enqueue({
								type: "tool-call",
								toolCallId: toolCall.id,
								toolName: toolCall.function.name,
								input,
								providerMetadata: !reasoningDetailsAttachedToToolCall ? { openrouter: { reasoning_details: accumulatedReasoningDetails } } : void 0
							});
							reasoningDetailsAttachedToToolCall = true;
							toolCall.sent = true;
						}
					}
					if (reasoningStarted) controller.enqueue({
						type: "reasoning-end",
						id: reasoningId || generateId(),
						providerMetadata: { openrouter: { reasoning_details: accumulatedReasoningDetails } }
					});
					if (textStarted) controller.enqueue({
						type: "text-end",
						id: textId || generateId()
					});
					const openrouterMetadata = { usage: openrouterUsage };
					if (provider !== void 0) openrouterMetadata.provider = provider;
					openrouterMetadata.reasoning_details = accumulatedReasoningDetails;
					if (accumulatedFileAnnotations.length > 0) openrouterMetadata.annotations = accumulatedFileAnnotations;
					if (usage.inputTokens.total === void 0 && openrouterUsage.promptTokens !== void 0) usage.inputTokens.total = openrouterUsage.promptTokens;
					if (usage.outputTokens.total === void 0 && openrouterUsage.completionTokens !== void 0) usage.outputTokens.total = openrouterUsage.completionTokens;
					usage.raw = rawUsage;
					controller.enqueue({
						type: "finish",
						finishReason,
						usage,
						providerMetadata: { openrouter: openrouterMetadata }
					});
				}
			})),
			warnings,
			request: { body: args },
			response: { headers: responseHeaders }
		};
	}
};
function mapProviderTool(tool2) {
	const [provider, toolName] = tool2.id.split(".");
	const apiToolType = `${provider}:${toolName}`;
	const mappedArgs = {};
	for (const [key, value] of Object.entries(tool2.args)) if (value !== void 0) mappedArgs[camelToSnake(key)] = value;
	return __spreadValues({ type: apiToolType }, mappedArgs);
}
function camelToSnake(str) {
	return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}
function convertToOpenRouterCompletionPrompt({ prompt, inputFormat, user = "user", assistant = "assistant" }) {
	if (inputFormat === "prompt" && prompt.length === 1 && prompt[0] && prompt[0].role === "user" && prompt[0].content.length === 1 && prompt[0].content[0] && prompt[0].content[0].type === "text") return { prompt: prompt[0].content[0].text };
	let text = "";
	if (prompt[0] && prompt[0].role === "system") {
		text += `${prompt[0].content}

`;
		prompt = prompt.slice(1);
	}
	for (const { role, content } of prompt) switch (role) {
		case "system": throw new InvalidPromptError({
			message: `Unexpected system message in prompt: ${content}`,
			prompt
		});
		case "user": {
			const userMessage = content.map((part) => {
				switch (part.type) {
					case "text": return part.text;
					case "file": throw new UnsupportedFunctionalityError({ functionality: "file attachments" });
					default: return "";
				}
			}).join("");
			text += `${user}:
${userMessage}

`;
			break;
		}
		case "assistant": {
			const assistantMessage = content.map((part) => {
				switch (part.type) {
					case "text": return part.text;
					case "tool-call": throw new UnsupportedFunctionalityError({ functionality: "tool-call messages" });
					case "tool-result": throw new UnsupportedFunctionalityError({ functionality: "tool-result messages" });
					case "reasoning": throw new UnsupportedFunctionalityError({ functionality: "reasoning messages" });
					case "file": throw new UnsupportedFunctionalityError({ functionality: "file attachments" });
					default: return "";
				}
			}).join("");
			text += `${assistant}:
${assistantMessage}

`;
			break;
		}
		case "tool": throw new UnsupportedFunctionalityError({ functionality: "tool messages" });
	}
	text += `${assistant}:
`;
	return { prompt: text };
}
var OpenRouterCompletionChunkSchema = union([object({
	id: string().optional(),
	model: string().optional(),
	provider: string().optional(),
	choices: array(object({
		text: string(),
		reasoning: string().nullish().optional(),
		reasoning_details: ReasoningDetailArraySchema.nullish(),
		finish_reason: string().nullish(),
		index: number().nullish(),
		logprobs: object({
			tokens: array(string()),
			token_logprobs: array(number()),
			top_logprobs: array(record(string(), number())).nullable()
		}).passthrough().nullable().optional()
	}).passthrough()),
	usage: object({
		prompt_tokens: number(),
		prompt_tokens_details: object({
			cached_tokens: number(),
			cache_write_tokens: number().nullish()
		}).passthrough().nullish(),
		completion_tokens: number(),
		completion_tokens_details: object({ reasoning_tokens: number() }).passthrough().nullish(),
		total_tokens: number(),
		cost: number().optional(),
		cost_details: object({ upstream_inference_cost: number().nullish() }).passthrough().nullish()
	}).passthrough().nullish()
}).passthrough(), OpenRouterErrorResponseSchema]);
var OpenRouterCompletionLanguageModel = class {
	constructor(modelId, settings, config) {
		this.specificationVersion = "v4";
		this.provider = "openrouter";
		this.supportsImageUrls = true;
		this.supportedUrls = {
			"image/*": [/^data:image\/[a-zA-Z]+;base64,/, /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)(?:[?#].*)?$/i],
			"text/*": [/^data:text\//, /^https?:\/\/.+$/],
			"application/*": [/^data:application\//, /^https?:\/\/.+$/]
		};
		this.defaultObjectGenerationMode = void 0;
		this.modelId = modelId;
		this.settings = settings;
		this.config = config;
	}
	getArgs({ prompt, maxOutputTokens, temperature, topP, frequencyPenalty, presencePenalty, seed, responseFormat, topK, stopSequences, tools, toolChoice }) {
		const { prompt: completionPrompt } = convertToOpenRouterCompletionPrompt({
			prompt,
			inputFormat: "prompt"
		});
		if (tools == null ? void 0 : tools.length) throw new UnsupportedFunctionalityError({ functionality: "tools" });
		if (toolChoice) throw new UnsupportedFunctionalityError({ functionality: "toolChoice" });
		return __spreadValues(__spreadValues({
			model: this.modelId,
			models: this.settings.models,
			logit_bias: this.settings.logitBias,
			logprobs: typeof this.settings.logprobs === "number" ? this.settings.logprobs : typeof this.settings.logprobs === "boolean" ? this.settings.logprobs ? 0 : void 0 : void 0,
			suffix: this.settings.suffix,
			user: this.settings.user,
			max_tokens: maxOutputTokens != null ? maxOutputTokens : this.settings.maxTokens,
			temperature: temperature != null ? temperature : this.settings.temperature,
			top_p: topP != null ? topP : this.settings.topP,
			frequency_penalty: frequencyPenalty != null ? frequencyPenalty : this.settings.frequencyPenalty,
			presence_penalty: presencePenalty != null ? presencePenalty : this.settings.presencePenalty,
			seed,
			stop: stopSequences,
			response_format: responseFormat,
			top_k: topK != null ? topK : this.settings.topK,
			prompt: completionPrompt,
			include_reasoning: this.settings.includeReasoning,
			reasoning: this.settings.reasoning
		}, this.config.extraBody), this.settings.extraBody);
	}
	async doGenerate(options) {
		var _a17, _b17, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q;
		const openrouterOptions = (options.providerOptions || {}).openrouter || {};
		const args = __spreadValues(__spreadValues({}, this.getArgs(options)), openrouterOptions);
		const { value: response, responseHeaders } = await postJsonToApi({
			url: this.config.url({
				path: "/completions",
				modelId: this.modelId
			}),
			headers: combineHeaders(this.config.headers(), options.headers),
			body: args,
			failedResponseHandler: openrouterFailedResponseHandler,
			successfulResponseHandler: createJsonResponseHandler(OpenRouterCompletionChunkSchema),
			abortSignal: options.abortSignal,
			fetch: this.config.fetch
		});
		if ("error" in response) {
			const errorData = response.error;
			throw new APICallError({
				message: errorData.message,
				url: this.config.url({
					path: "/completions",
					modelId: this.modelId
				}),
				requestBodyValues: args,
				statusCode: 200,
				responseHeaders,
				data: errorData
			});
		}
		const choice = response.choices[0];
		if (!choice) throw new NoContentGeneratedError({ message: "No choice in OpenRouter completion response" });
		return {
			content: [{
				type: "text",
				text: (_a17 = choice.text) != null ? _a17 : ""
			}],
			finishReason: mapOpenRouterFinishReason(choice.finish_reason),
			usage: response.usage ? computeTokenUsage(response.usage) : emptyUsage(),
			warnings: [],
			providerMetadata: { openrouter: OpenRouterProviderMetadataSchema.parse({
				provider: (_b17 = response.provider) != null ? _b17 : "",
				usage: __spreadValues(__spreadValues(__spreadValues(__spreadValues({
					promptTokens: (_d = (_c = response.usage) == null ? void 0 : _c.prompt_tokens) != null ? _d : 0,
					completionTokens: (_f = (_e = response.usage) == null ? void 0 : _e.completion_tokens) != null ? _f : 0,
					totalTokens: ((_h = (_g = response.usage) == null ? void 0 : _g.prompt_tokens) != null ? _h : 0) + ((_j = (_i = response.usage) == null ? void 0 : _i.completion_tokens) != null ? _j : 0)
				}, ((_k = response.usage) == null ? void 0 : _k.cost) != null ? { cost: response.usage.cost } : {}), ((_m = (_l = response.usage) == null ? void 0 : _l.prompt_tokens_details) == null ? void 0 : _m.cached_tokens) != null ? { promptTokensDetails: { cachedTokens: response.usage.prompt_tokens_details.cached_tokens } } : {}), ((_o = (_n = response.usage) == null ? void 0 : _n.completion_tokens_details) == null ? void 0 : _o.reasoning_tokens) != null ? { completionTokensDetails: { reasoningTokens: response.usage.completion_tokens_details.reasoning_tokens } } : {}), ((_q = (_p = response.usage) == null ? void 0 : _p.cost_details) == null ? void 0 : _q.upstream_inference_cost) != null ? { costDetails: { upstreamInferenceCost: response.usage.cost_details.upstream_inference_cost } } : {})
			}) },
			response: { headers: responseHeaders }
		};
	}
	async doStream(options) {
		const openrouterOptions = (options.providerOptions || {}).openrouter || {};
		const args = __spreadValues(__spreadValues({}, this.getArgs(options)), openrouterOptions);
		const { value: response, responseHeaders } = await postJsonToApi({
			url: this.config.url({
				path: "/completions",
				modelId: this.modelId
			}),
			headers: combineHeaders(this.config.headers(), options.headers),
			body: __spreadProps(__spreadValues({}, args), {
				stream: true,
				stream_options: this.config.compatibility === "strict" ? { include_usage: true } : void 0
			}),
			failedResponseHandler: openrouterFailedResponseHandler,
			successfulResponseHandler: createEventSourceResponseHandler(OpenRouterCompletionChunkSchema),
			abortSignal: options.abortSignal,
			fetch: this.config.fetch
		});
		let streamError;
		const safeResponse = withStreamErrorHandling(response, (err) => {
			streamError = err;
		});
		let finishReason = createFinishReason("other");
		const usage = {
			inputTokens: {
				total: void 0,
				noCache: void 0,
				cacheRead: void 0,
				cacheWrite: void 0
			},
			outputTokens: {
				total: void 0,
				text: void 0,
				reasoning: void 0
			},
			raw: void 0
		};
		const openrouterUsage = {};
		let provider;
		let rawUsage;
		const warnings = [];
		return {
			stream: safeResponse.pipeThrough(new TransformStream({
				start(controller) {
					controller.enqueue({
						type: "stream-start",
						warnings
					});
				},
				transform(chunk, controller) {
					var _a17, _b17, _c, _d, _e;
					if (options.includeRawChunks) controller.enqueue({
						type: "raw",
						rawValue: chunk.rawValue
					});
					if (!chunk.success) {
						finishReason = createFinishReason("error");
						controller.enqueue({
							type: "error",
							error: chunk.error
						});
						return;
					}
					const value = chunk.value;
					if ("error" in value) {
						finishReason = createFinishReason("error");
						controller.enqueue({
							type: "error",
							error: value.error
						});
						return;
					}
					if (value.provider) provider = value.provider;
					if (value.usage != null) {
						const computed = computeTokenUsage(value.usage);
						Object.assign(usage.inputTokens, computed.inputTokens);
						Object.assign(usage.outputTokens, computed.outputTokens);
						rawUsage = value.usage;
						const promptTokens = (_a17 = value.usage.prompt_tokens) != null ? _a17 : 0;
						const completionTokens = (_b17 = value.usage.completion_tokens) != null ? _b17 : 0;
						openrouterUsage.promptTokens = promptTokens;
						if (value.usage.prompt_tokens_details) openrouterUsage.promptTokensDetails = { cachedTokens: (_c = value.usage.prompt_tokens_details.cached_tokens) != null ? _c : 0 };
						openrouterUsage.completionTokens = completionTokens;
						if (value.usage.completion_tokens_details) openrouterUsage.completionTokensDetails = { reasoningTokens: (_d = value.usage.completion_tokens_details.reasoning_tokens) != null ? _d : 0 };
						if (value.usage.cost != null) openrouterUsage.cost = value.usage.cost;
						openrouterUsage.totalTokens = value.usage.total_tokens;
						const upstreamInferenceCost = (_e = value.usage.cost_details) == null ? void 0 : _e.upstream_inference_cost;
						if (upstreamInferenceCost != null) openrouterUsage.costDetails = { upstreamInferenceCost };
					}
					const choice = value.choices[0];
					if ((choice == null ? void 0 : choice.finish_reason) != null) finishReason = mapOpenRouterFinishReason(choice.finish_reason);
					if ((choice == null ? void 0 : choice.text) != null) controller.enqueue({
						type: "text-delta",
						delta: choice.text,
						id: generateId()
					});
				},
				flush(controller) {
					if (streamError != null) {
						finishReason = createFinishReason("error");
						controller.enqueue({
							type: "error",
							error: streamError
						});
					}
					usage.raw = rawUsage;
					const openrouterMetadata = { usage: openrouterUsage };
					if (provider !== void 0) openrouterMetadata.provider = provider;
					controller.enqueue({
						type: "finish",
						finishReason,
						usage,
						providerMetadata: { openrouter: openrouterMetadata }
					});
				}
			})),
			response: { headers: responseHeaders }
		};
	}
};
var openrouterEmbeddingUsageSchema = object({
	prompt_tokens: number(),
	total_tokens: number(),
	cost: number().optional()
});
var openrouterEmbeddingDataSchema = object({
	object: literal("embedding"),
	embedding: array(number()),
	index: number().optional()
});
var OpenRouterEmbeddingResponseSchema = object({
	id: string().optional(),
	object: literal("list"),
	data: array(openrouterEmbeddingDataSchema),
	model: string(),
	provider: string().optional(),
	usage: openrouterEmbeddingUsageSchema.optional()
});
var OpenRouterEmbeddingModel = class {
	constructor(modelId, settings, config) {
		this.specificationVersion = "v4";
		this.provider = "openrouter";
		this.maxEmbeddingsPerCall = void 0;
		this.supportsParallelCalls = true;
		this.modelId = modelId;
		this.settings = settings;
		this.config = config;
	}
	async doEmbed(options) {
		var _a17, _b17, _c, _d, _e, _f;
		const { values, abortSignal, headers } = options;
		const args = __spreadValues(__spreadValues({
			model: this.modelId,
			input: values,
			user: this.settings.user,
			provider: this.settings.provider
		}, this.config.extraBody), this.settings.extraBody);
		const { value: responseValue, responseHeaders } = await postJsonToApi({
			url: this.config.url({
				path: "/embeddings",
				modelId: this.modelId
			}),
			headers: combineHeaders(this.config.headers(), headers),
			body: args,
			failedResponseHandler: openrouterFailedResponseHandler,
			successfulResponseHandler: createJsonResponseHandler(OpenRouterEmbeddingResponseSchema),
			abortSignal,
			fetch: this.config.fetch
		});
		return {
			embeddings: responseValue.data.map((item) => item.embedding),
			usage: responseValue.usage ? { tokens: responseValue.usage.prompt_tokens } : void 0,
			providerMetadata: { openrouter: OpenRouterProviderMetadataSchema.parse({
				provider: (_a17 = responseValue.provider) != null ? _a17 : "",
				usage: __spreadValues({
					promptTokens: (_c = (_b17 = responseValue.usage) == null ? void 0 : _b17.prompt_tokens) != null ? _c : 0,
					completionTokens: 0,
					totalTokens: (_e = (_d = responseValue.usage) == null ? void 0 : _d.total_tokens) != null ? _e : 0
				}, ((_f = responseValue.usage) == null ? void 0 : _f.cost) != null ? { cost: responseValue.usage.cost } : {})
			}) },
			response: {
				headers: responseHeaders,
				body: responseValue
			},
			warnings: []
		};
	}
};
var OpenRouterImageResponseSchema = object({
	created: number().optional(),
	data: array(object({ b64_json: string() }).passthrough()),
	usage: object({
		prompt_tokens: number(),
		completion_tokens: number(),
		total_tokens: number()
	}).passthrough().optional()
}).passthrough();
var OpenRouterImageModel = class {
	constructor(modelId, settings, config) {
		this.specificationVersion = "v4";
		this.provider = "openrouter";
		this.maxImagesPerCall = 10;
		this.modelId = modelId;
		this.settings = settings;
		this.config = config;
	}
	async doGenerate(options) {
		const { prompt, n, size, aspectRatio, seed, files, mask, abortSignal, headers, providerOptions } = options;
		const openrouterOptions = (providerOptions == null ? void 0 : providerOptions.openrouter) || {};
		const warnings = [];
		if (mask !== void 0) throw new UnsupportedFunctionalityError({ functionality: "image inpainting (mask parameter)" });
		const inputReferences = files !== void 0 && files.length > 0 ? files.map((file) => convertFileToInputReference(file)) : void 0;
		const body = __spreadValues(__spreadValues(__spreadValues(__spreadValues(__spreadValues(__spreadValues(__spreadValues(__spreadValues(__spreadValues(__spreadValues({
			model: this.modelId,
			prompt: prompt != null ? prompt : ""
		}, n !== void 0 && { n }), size !== void 0 && { size }), aspectRatio !== void 0 && { aspect_ratio: aspectRatio }), seed !== void 0 && { seed }), inputReferences !== void 0 && { input_references: inputReferences }), this.settings.user !== void 0 && { user: this.settings.user }), this.settings.provider !== void 0 && { provider: this.settings.provider }), this.config.extraBody), this.settings.extraBody), openrouterOptions);
		const { value: responseValue, responseHeaders } = await postJsonToApi({
			url: this.config.url({
				path: "/images",
				modelId: this.modelId
			}),
			headers: combineHeaders(this.config.headers(), headers),
			body,
			failedResponseHandler: openrouterFailedResponseHandler,
			successfulResponseHandler: createJsonResponseHandler(OpenRouterImageResponseSchema),
			abortSignal,
			fetch: this.config.fetch
		});
		if (!responseValue.data || responseValue.data.length === 0) throw new NoContentGeneratedError({ message: "No images in response" });
		const images = responseValue.data.map((item) => item.b64_json);
		const usage = responseValue.usage ? {
			inputTokens: responseValue.usage.prompt_tokens,
			outputTokens: responseValue.usage.completion_tokens,
			totalTokens: responseValue.usage.total_tokens
		} : void 0;
		return {
			images,
			warnings,
			response: {
				timestamp: /* @__PURE__ */ new Date(),
				modelId: this.modelId,
				headers: responseHeaders
			},
			usage
		};
	}
};
var DEFAULT_IMAGE_MEDIA_TYPE = "image/png";
function convertFileToInputReference(file) {
	if (file.type === "url") return {
		type: "image_url",
		image_url: { url: file.url }
	};
	return {
		type: "image_url",
		image_url: { url: buildFileDataUrl({
			data: file.data,
			mediaType: file.mediaType,
			defaultMediaType: DEFAULT_IMAGE_MEDIA_TYPE
		}) }
	};
}
var webSearch = createProviderDefinedToolFactory({
	id: "openrouter.web_search",
	inputSchema: object({ 
	/** Search results returned by the server tool */
results: array(unknown()).optional() })
});
function removeUndefinedEntries(record) {
	return Object.fromEntries(Object.entries(record).filter(([, value]) => value != null));
}
function normalizeHeaders2(headers) {
	if (!headers) return {};
	if (headers instanceof Headers) return Object.fromEntries(headers.entries());
	if (Array.isArray(headers)) return Object.fromEntries(headers);
	return headers;
}
function findHeaderKey(headers, targetKey) {
	const lowerTarget = targetKey.toLowerCase();
	return Object.keys(headers).find((key) => key.toLowerCase() === lowerTarget);
}
function withUserAgentSuffix2(headers, ...userAgentSuffixParts) {
	const cleanedHeaders = removeUndefinedEntries(normalizeHeaders2(headers));
	const existingUserAgentKey = findHeaderKey(cleanedHeaders, "user-agent");
	const existingUserAgentValue = existingUserAgentKey ? cleanedHeaders[existingUserAgentKey] : void 0;
	const userAgent = (existingUserAgentValue == null ? void 0 : existingUserAgentValue.trim()) ? existingUserAgentValue : userAgentSuffixParts.filter(Boolean).join(" ");
	return __spreadProps(__spreadValues({}, Object.fromEntries(Object.entries(cleanedHeaders).filter(([key]) => key.toLowerCase() !== "user-agent"))), { "user-agent": userAgent });
}
var VERSION2 = "3.0.0";
var VideoGenerationSubmitResponseSchema = object({
	id: string(),
	generation_id: string().optional(),
	polling_url: string(),
	status: string()
}).passthrough();
var VideoGenerationPollResponseSchema = object({
	id: string(),
	generation_id: string().optional(),
	polling_url: string(),
	status: string(),
	unsigned_urls: array(string()).optional(),
	usage: object({
		cost: number().optional(),
		is_byok: boolean().optional()
	}).passthrough().optional(),
	error: string().optional()
}).passthrough();
var DEFAULT_POLL_INTERVAL_MS = 2e3;
var DEFAULT_MAX_POLL_TIME_MS = 6e5;
var OpenRouterVideoModel = class {
	constructor(modelId, settings, config) {
		this.specificationVersion = "v4";
		this.provider = "openrouter";
		this.maxVideosPerCall = 1;
		this.modelId = modelId;
		this.settings = settings;
		this.config = config;
	}
	async doGenerate(options) {
		var _a17, _b17, _c, _d, _e;
		const { prompt, n, aspectRatio, resolution, duration, seed, image, abortSignal, headers, providerOptions } = options;
		const warnings = [];
		if (n > 1) warnings.push({
			type: "unsupported",
			feature: "n > 1",
			details: `OpenRouter video generation returns 1 video per call. Requested ${n} videos.`
		});
		const body = __spreadValues(__spreadValues(__spreadValues(__spreadValues(__spreadValues(__spreadValues(__spreadValues(__spreadValues(__spreadValues({
			model: this.modelId,
			prompt: prompt != null ? prompt : ""
		}, aspectRatio !== void 0 && { aspect_ratio: aspectRatio }), resolution !== void 0 && { size: resolution }), duration !== void 0 && { duration }), seed !== void 0 && { seed }), this.settings.generateAudio !== void 0 && { generate_audio: this.settings.generateAudio }), image !== void 0 && { frame_images: [convertImageToFrameImage(image)] }), this.config.extraBody), this.settings.extraBody), providerOptions.openrouter);
		const mergedHeaders = combineHeaders(this.config.headers(), headers);
		const { value: submitResponse, responseHeaders } = await postJsonToApi({
			url: this.config.url({
				path: "/videos",
				modelId: this.modelId
			}),
			headers: mergedHeaders,
			body,
			failedResponseHandler: openrouterFailedResponseHandler,
			successfulResponseHandler: createJsonResponseHandler(VideoGenerationSubmitResponseSchema),
			abortSignal,
			fetch: this.config.fetch
		});
		const pollIntervalMs = (_a17 = this.settings.pollIntervalMs) != null ? _a17 : DEFAULT_POLL_INTERVAL_MS;
		const maxPollTimeMs = (_b17 = this.settings.maxPollTimeMs) != null ? _b17 : DEFAULT_MAX_POLL_TIME_MS;
		const pollResult = await this.pollUntilComplete({
			jobId: submitResponse.id,
			headers: mergedHeaders,
			abortSignal,
			pollIntervalMs,
			maxPollTimeMs
		});
		const videos = [];
		if (pollResult.unsigned_urls) for (const url of pollResult.unsigned_urls) videos.push({
			type: "url",
			url,
			mediaType: "video/mp4"
		});
		return {
			videos,
			warnings,
			providerMetadata: { openrouter: {
				generationId: (_c = pollResult.generation_id) != null ? _c : null,
				cost: (_e = (_d = pollResult.usage) == null ? void 0 : _d.cost) != null ? _e : null
			} },
			response: {
				timestamp: /* @__PURE__ */ new Date(),
				modelId: this.modelId,
				headers: responseHeaders
			}
		};
	}
	async pollUntilComplete({ jobId, headers, abortSignal, pollIntervalMs, maxPollTimeMs }) {
		var _a17;
		const startTime = Date.now();
		while (Date.now() - startTime < maxPollTimeMs) {
			abortSignal?.throwIfAborted();
			await delay(pollIntervalMs);
			abortSignal?.throwIfAborted();
			const { value: pollResponse } = await getFromApi({
				url: this.config.url({
					path: `/videos/${jobId}`,
					modelId: this.modelId
				}),
				headers,
				failedResponseHandler: openrouterFailedResponseHandler,
				successfulResponseHandler: createJsonResponseHandler(VideoGenerationPollResponseSchema),
				abortSignal,
				fetch: this.config.fetch
			});
			if (pollResponse.status === "completed") return {
				generation_id: pollResponse.generation_id,
				unsigned_urls: pollResponse.unsigned_urls,
				usage: pollResponse.usage
			};
			if (pollResponse.status === "failed" || pollResponse.status === "dead" || pollResponse.status === "cancelled" || pollResponse.status === "expired") throw new APICallError({
				message: (_a17 = pollResponse.error) != null ? _a17 : `Video generation failed with status: ${pollResponse.status}`,
				url: this.config.url({
					path: `/videos/${jobId}`,
					modelId: this.modelId
				}),
				requestBodyValues: {},
				statusCode: 500,
				isRetryable: false
			});
		}
		throw new APICallError({
			message: `Video generation timed out after ${maxPollTimeMs}ms`,
			url: this.config.url({
				path: `/videos/${jobId}`,
				modelId: this.modelId
			}),
			requestBodyValues: {},
			statusCode: 408,
			isRetryable: true
		});
	}
};
function convertImageToFrameImage(file) {
	if (file.type === "url") return {
		type: "image_url",
		image_url: { url: file.url },
		frame_type: "first_frame"
	};
	return {
		type: "image_url",
		image_url: { url: buildFileDataUrl({
			data: file.data,
			mediaType: file.mediaType,
			defaultMediaType: "image/png"
		}) },
		frame_type: "first_frame"
	};
}
function createOpenRouter(options = {}) {
	var _a17, _b17, _c;
	const baseURL = (_b17 = withoutTrailingSlash((_a17 = options.baseURL) != null ? _a17 : options.baseUrl)) != null ? _b17 : "https://openrouter.ai/api/v1";
	const compatibility = (_c = options.compatibility) != null ? _c : "compatible";
	const getHeaders = () => withUserAgentSuffix2(__spreadValues(__spreadValues(__spreadValues(__spreadValues({ Authorization: `Bearer ${loadApiKey({
		apiKey: options.apiKey,
		environmentVariableName: "OPENROUTER_API_KEY",
		description: "OpenRouter"
	})}` }, options.appName && { "X-OpenRouter-Title": options.appName }), options.appUrl && { "HTTP-Referer": options.appUrl }), options.headers), options.api_keys && Object.keys(options.api_keys).length > 0 && { "X-Provider-API-Keys": JSON.stringify(options.api_keys) }), `ai-sdk/openrouter/${VERSION2}`);
	const createChatModel = (modelId, settings = {}) => new OpenRouterChatLanguageModel(modelId, settings, {
		provider: "openrouter.chat",
		url: ({ path }) => `${baseURL}${path}`,
		headers: getHeaders,
		compatibility,
		fetch: options.fetch,
		extraBody: options.extraBody
	});
	const createCompletionModel = (modelId, settings = {}) => new OpenRouterCompletionLanguageModel(modelId, settings, {
		provider: "openrouter.completion",
		url: ({ path }) => `${baseURL}${path}`,
		headers: getHeaders,
		compatibility,
		fetch: options.fetch,
		extraBody: options.extraBody
	});
	const createEmbeddingModel = (modelId, settings = {}) => new OpenRouterEmbeddingModel(modelId, settings, {
		provider: "openrouter.embedding",
		url: ({ path }) => `${baseURL}${path}`,
		headers: getHeaders,
		fetch: options.fetch,
		extraBody: options.extraBody
	});
	const createImageModel = (modelId, settings = {}) => new OpenRouterImageModel(modelId, settings, {
		provider: "openrouter.image",
		url: ({ path }) => `${baseURL}${path}`,
		headers: getHeaders,
		fetch: options.fetch,
		extraBody: options.extraBody
	});
	const createVideoModel = (modelId, settings = {}) => new OpenRouterVideoModel(modelId, settings, {
		provider: "openrouter.video",
		url: ({ path }) => `${baseURL}${path}`,
		headers: getHeaders,
		fetch: options.fetch,
		extraBody: options.extraBody
	});
	const createLanguageModel = (modelId, settings) => {
		if (new.target) throw new Error("The OpenRouter model function cannot be called with the new keyword.");
		if (modelId === "openai/gpt-3.5-turbo-instruct") return createCompletionModel(modelId, settings);
		return createChatModel(modelId, settings);
	};
	const provider = (modelId, settings) => createLanguageModel(modelId, settings);
	provider.languageModel = createLanguageModel;
	provider.chat = createChatModel;
	provider.completion = createCompletionModel;
	provider.textEmbeddingModel = createEmbeddingModel;
	provider.embedding = createEmbeddingModel;
	provider.imageModel = createImageModel;
	provider.videoModel = createVideoModel;
	provider.tools = { webSearch };
	return provider;
}
createOpenRouter({ compatibility: "strict" });
//#endregion
export { createOpenRouter };
