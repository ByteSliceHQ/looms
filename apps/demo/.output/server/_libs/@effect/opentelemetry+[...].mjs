import { __commonJSMin$1 as __commonJSMin, __exportAll$1 as __exportAll, __toESM$1 as __toESM } from "../../_ssr/rolldown-runtime-DaEwE2D6.mjs";
//#region ../../node_modules/.bun/effect@4.0.0-rc.112/node_modules/effect/dist/Pipeable.js
/**
* The `Pipeable` module defines the shared interface and implementation helpers
* for values that support Effect-style method chaining with `.pipe(...)`.
*
* A `Pipeable` value can pass itself through a sequence of unary functions from
* left to right, so code can be written as `value.pipe(f, g, h)` instead of
* deeply nesting calls. This is the method form used by many Effect data types
* to compose transformations, validations, and effectful operations while
* keeping the original value as the starting point of the pipeline.
*
* @since 2.0.0
*/
/**
* Applies a `pipe` method's variadic arguments to an initial value from left
* to right.
*
* **When to use**
*
* Use to implement a custom `.pipe(...)` method from JavaScript's `arguments`
* object.
*
* **Details**
*
* This helper is intended for implementing `Pipeable.pipe` methods that
* receive JavaScript's `arguments` object. With no functions it returns the
* original value; otherwise it feeds each result into the next function.
*
* **Example** (Implementing a pipe method)
*
* ```ts import.meta.vitest
* import { Pipeable } from "effect"
*
* class NumberBox {
*   constructor(readonly value: number) {}
*
*   pipe(..._fns: ReadonlyArray<(value: number) => number>): number {
*     return Pipeable.pipeArguments(this.value, arguments) as number
*   }
* }
*
* const result = new NumberBox(5).pipe(
*   (n) => n + 2,
*   (n) => n * 3
* )
* result // => 21
* ```
*
* @category combinators
* @since 2.0.0
*/
var pipeArguments = (self, args) => {
	switch (args.length) {
		case 0: return self;
		case 1: return args[0](self);
		case 2: return args[1](args[0](self));
		case 3: return args[2](args[1](args[0](self)));
		case 4: return args[3](args[2](args[1](args[0](self))));
		case 5: return args[4](args[3](args[2](args[1](args[0](self)))));
		case 6: return args[5](args[4](args[3](args[2](args[1](args[0](self))))));
		case 7: return args[6](args[5](args[4](args[3](args[2](args[1](args[0](self)))))));
		case 8: return args[7](args[6](args[5](args[4](args[3](args[2](args[1](args[0](self))))))));
		case 9: return args[8](args[7](args[6](args[5](args[4](args[3](args[2](args[1](args[0](self)))))))));
		default: {
			let ret = self;
			for (let i = 0, len = args.length; i < len; i++) ret = args[i](ret);
			return ret;
		}
	}
};
/**
* Reusable prototype that implements `Pipeable.pipe`.
*
* **When to use**
*
* Use when classes or object prototypes can reuse this value when they need the
* standard pipe implementation backed by `pipeArguments`.
*
* @category prototypes
* @since 3.15.0
*/
var Prototype$1 = { pipe() {
	return pipeArguments(this, arguments);
} };
/**
* Provides a base constructor whose instances implement the standard `Pipeable.pipe`
* method.
*
* **When to use**
*
* Use when you need to define a class that supports Effect-style method
* chaining through `.pipe(...)`.
*
* @category constructors
* @since 3.15.0
*/
var Class$2 = /*#__PURE__*/ function() {
	function PipeableBase() {}
	PipeableBase.prototype = Prototype$1;
	return PipeableBase;
}();
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0-rc.112/node_modules/effect/dist/Function.js
/**
* Creates a function that can be called in data-first style or data-last
* (`pipe`-friendly) style.
*
* **When to use**
*
* Use to expose one implementation through both direct and `pipe`-friendly
* call styles.
*
* **Details**
*
* Pass either the arity of the uncurried function or a predicate that decides
* whether the current call is data-first. Arity is the common case. Use a
* predicate when optional arguments make arity ambiguous.
*
* **Example** (Selecting data-first or data-last style by arity)
*
* ```ts import.meta.vitest
* import { Function, pipe } from "effect"
*
* const sum = Function.dual<
*   (that: number) => (self: number) => number,
*   (self: number, that: number) => number
* >(2, (self, that) => self + that)
*
* sum(2, 3) // => 5
* pipe(2, sum(3)) // => 5
* ```
*
* **Example** (Defining overloads with call signatures)
*
* ```ts import.meta.vitest
* import { Function, pipe } from "effect"
*
* const sum: {
*   (that: number): (self: number) => number
*   (self: number, that: number): number
* } = Function.dual(2, (self: number, that: number): number => self + that)
*
* sum(2, 3) // => 5
* pipe(2, sum(3)) // => 5
* ```
*
* **Example** (Selecting data-first or data-last style with a predicate)
*
* ```ts import.meta.vitest
* import { Function, pipe } from "effect"
*
* const sum = Function.dual<
*   (that: number) => (self: number) => number,
*   (self: number, that: number) => number
* >(
*   (args) => args.length === 2,
*   (self, that) => self + that
* )
*
* sum(2, 3) // => 5
* pipe(2, sum(3)) // => 5
* ```
*
* @category combinators
* @since 2.0.0
*/
var dual = function(arity, body) {
	if (typeof arity === "function") return function() {
		return arity(arguments) ? body.apply(this, arguments) : (self) => body(self, ...arguments);
	};
	switch (arity) {
		case 0:
		case 1: throw new RangeError(`Invalid arity ${arity}`);
		case 2: return function(a, b) {
			if (arguments.length >= 2) return body(a, b);
			return function(self) {
				return body(self, a);
			};
		};
		case 3: return function(a, b, c) {
			if (arguments.length >= 3) return body(a, b, c);
			return function(self) {
				return body(self, a, b);
			};
		};
		default: return function() {
			if (arguments.length >= arity) return body.apply(this, arguments);
			const args = arguments;
			return function(self) {
				return body(self, ...args);
			};
		};
	}
};
/**
* Returns its input argument unchanged.
*
* **When to use**
*
* Use to return a value unchanged where a function is required.
*
* **Example** (Returning the same value)
*
* ```ts import.meta.vitest
* import { identity } from "effect"
*
* identity(5) // => 5
* ```
*
* @category combinators
* @since 2.0.0
*/
var identity = (a) => a;
/**
* Creates a zero-argument function that always returns the provided value.
*
* **When to use**
*
* Use when you need a thunk or callback that returns the same value on every
* invocation.
*
* **Example** (Creating a constant thunk)
*
* ```ts import.meta.vitest
* import { Function } from "effect"
*
* const constNull = Function.constant(null)
*
* constNull() // => null
* constNull() // => null
* ```
*
* @category constructors
* @since 2.0.0
*/
var constant = (value) => () => value;
/**
* Returns `true` when called.
*
* **When to use**
*
* Use when you need a thunk that returns `true` on every invocation.
*
* **Example** (Returning true from a thunk)
*
* ```ts import.meta.vitest
* import { Function } from "effect"
*
* Function.constTrue() // => true
* ```
*
* @category constants
* @since 2.0.0
*/
var constTrue = /*#__PURE__*/ constant(true);
/**
* Returns `false` when called.
*
* **When to use**
*
* Use when you need a thunk that returns `false` on every invocation.
*
* **Example** (Returning false from a thunk)
*
* ```ts import.meta.vitest
* import { Function } from "effect"
*
* Function.constFalse() // => false
* ```
*
* @category constants
* @since 2.0.0
*/
var constFalse = /*#__PURE__*/ constant(false);
/**
* Returns `null` when called.
*
* **When to use**
*
* Use when you need a thunk that returns `null` on every invocation.
*
* **Example** (Returning null from a thunk)
*
* ```ts import.meta.vitest
* import { Function } from "effect"
*
* Function.constNull() // => null
* ```
*
* @category constants
* @since 2.0.0
*/
var constNull = /*#__PURE__*/ constant(null);
/**
* Returns `undefined` when called.
*
* **When to use**
*
* Use when you need a thunk that returns `undefined` on every invocation.
*
* **Example** (Returning undefined from a thunk)
*
* ```ts import.meta.vitest
* import { Function } from "effect"
*
* Function.constUndefined() // => undefined
* ```
*
* @category constants
* @since 2.0.0
*/
var constUndefined = /*#__PURE__*/ constant(void 0);
/**
* Returns no meaningful value when called.
*
* **When to use**
*
* Use when you need a thunk that is called only for its effect and has no
* meaningful return value.
*
* **Example** (Returning void from a thunk)
*
* ```ts import.meta.vitest
* import { Function } from "effect"
*
* Function.constVoid() // => undefined
* ```
*
* @category constants
* @since 2.0.0
*/
var constVoid = constUndefined;
function pipe(a, ...args) {
	return pipeArguments(a, args);
}
function flow(ab, bc, cd, de, ef, fg, gh, hi, ij) {
	switch (arguments.length) {
		case 1: return ab;
		case 2: return function() {
			return bc(ab.apply(this, arguments));
		};
		case 3: return function() {
			return cd(bc(ab.apply(this, arguments)));
		};
		case 4: return function() {
			return de(cd(bc(ab.apply(this, arguments))));
		};
		case 5: return function() {
			return ef(de(cd(bc(ab.apply(this, arguments)))));
		};
		case 6: return function() {
			return fg(ef(de(cd(bc(ab.apply(this, arguments))))));
		};
		case 7: return function() {
			return gh(fg(ef(de(cd(bc(ab.apply(this, arguments)))))));
		};
		case 8: return function() {
			return hi(gh(fg(ef(de(cd(bc(ab.apply(this, arguments))))))));
		};
		case 9: return function() {
			return ij(hi(gh(fg(ef(de(cd(bc(ab.apply(this, arguments)))))))));
		};
	}
}
/**
* Creates a memoized function whose input is an object, caching results by
* object identity.
*
* **When to use**
*
* Use to reuse the result of a synchronous computation whose output is stable
* for a given object reference.
*
* **Details**
*
* Each memoized wrapper owns a private `WeakMap` keyed by object identity.
*
* **Gotchas**
*
* `undefined` is reserved to represent a cache miss and is therefore not
* supported as a return value.
*
* Structurally equal objects do not share cache entries. If the same object is
* mutated after its first call, later calls still return the cached result for
* that reference.
*
* @category caching
* @since 4.0.0
*/
function memoize(f) {
	const cache = /* @__PURE__ */ new WeakMap();
	return (a) => {
		const cached = cache.get(a);
		if (cached !== void 0) return cached;
		const result = f(a);
		cache.set(a, result);
		return result;
	};
}
/**
* Creates a memoized idempotent object transformation that caches both inputs
* and their outputs by object identity.
*
* **When to use**
*
* Use when an object transformation is idempotent and its output can be safely
* reused as a fixed point.
*
* **Details**
*
* After computing an input, the returned function caches both the input and
* the output. Calling it with either reference returns the output without
* invoking the supplied function again.
*
* **Gotchas**
*
* The returned function treats each computed output as a fixed point. If
* applying the supplied function to an output would produce an observably
* different value, this memoization changes that behavior.
*
* @see {@link memoize} for memoizing functions without an idempotence requirement
* @category caching
* @since 4.0.0
*/
function memoizeIdempotent(f) {
	const cache = /* @__PURE__ */ new WeakMap();
	return (a) => {
		const cached = cache.get(a);
		if (cached !== void 0) return cached;
		const result = f(a);
		cache.set(a, result);
		cache.set(result, result);
		return result;
	};
}
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0-rc.112/node_modules/effect/dist/internal/equal.js
/** @internal */
var getAllObjectKeys = (obj) => {
	const keys = new Set(Reflect.ownKeys(obj));
	if (obj.constructor === Object) return keys;
	if (obj instanceof Error) keys.delete("stack");
	const proto = Object.getPrototypeOf(obj);
	let current = proto;
	while (current !== null && current !== Object.prototype) {
		const ownKeys = Reflect.ownKeys(current);
		for (let i = 0; i < ownKeys.length; i++) keys.add(ownKeys[i]);
		current = Object.getPrototypeOf(current);
	}
	if (keys.has("constructor") && typeof obj.constructor === "function" && proto === obj.constructor.prototype) keys.delete("constructor");
	return keys;
};
/** @internal */
var byReferenceInstances = /*#__PURE__*/ new WeakSet();
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0-rc.112/node_modules/effect/dist/Predicate.js
/**
* Defines runtime checks for values.
*
* A `Predicate<A>` returns `true` or `false` for an `A`. A
* `Refinement<A, B>` is a predicate that also narrows the TypeScript type when
* it succeeds. This module includes guards for common JavaScript values,
* property and tag checks, tuple and struct checks, boolean combinators, and
* helpers for composing predicates and refinements.
*
* @since 2.0.0
*/
/**
* Checks whether a value is a `string`.
*
* **When to use**
*
* Use when you need a `Predicate` guard to narrow an `unknown` value to a
* string.
*
* **Details**
*
* Uses `typeof input === "string"`.
*
* **Example** (Guarding strings)
*
* ```ts import.meta.vitest
* import { Predicate } from "effect"
*
* const data: unknown = "hi"
*
* if (Predicate.isString(data)) {
*   data.toUpperCase() // => "HI"
* }
* ```
*
* @see {@link isNumber}
* @see {@link isBoolean}
* @see {@link Refinement}
* @category guards
* @since 2.0.0
*/
function isString$1(input) {
	return typeof input === "string";
}
/**
* Checks whether a value is a `number`.
*
* **When to use**
*
* Use when you need a `Predicate` guard to narrow an `unknown` value to a
* number.
*
* **Details**
*
* Uses `typeof input === "number"` and does not exclude `NaN` or `Infinity`.
*
* **Example** (Guarding numbers)
*
* ```ts import.meta.vitest
* import { Predicate } from "effect"
*
* const data: unknown = 42
*
* if (Predicate.isNumber(data)) {
*   data + 1 // => 43
* }
* ```
*
* @see {@link isBigInt}
* @see {@link isString}
* @category guards
* @since 2.0.0
*/
function isNumber(input) {
	return typeof input === "number";
}
/**
* Checks whether a value is a `boolean`.
*
* **When to use**
*
* Use when you need a `Predicate` guard to narrow an `unknown` value to a
* boolean.
*
* **Details**
*
* Uses `typeof input === "boolean"`.
*
* **Example** (Guarding booleans)
*
* ```ts import.meta.vitest
* import { Predicate } from "effect"
*
* const data: unknown = true
*
* if (Predicate.isBoolean(data)) {
*   data ? "yes" : "no" // => "yes"
* }
* ```
*
* @see {@link isString}
* @see {@link isNumber}
* @category guards
* @since 2.0.0
*/
function isBoolean(input) {
	return typeof input === "boolean";
}
/**
* Checks whether a value is a `bigint`.
*
* **When to use**
*
* Use when you need a `Predicate` guard to narrow an `unknown` value to a
* bigint.
*
* **Details**
*
* Uses `typeof input === "bigint"`.
*
* **Example** (Guarding bigints)
*
* ```ts import.meta.vitest
* import { Predicate } from "effect"
*
* const data: unknown = 1n
*
* if (Predicate.isBigInt(data)) {
*   data + 2n // => 3n
* }
* ```
*
* @see {@link isNumber}
* @category guards
* @since 2.0.0
*/
function isBigInt(input) {
	return typeof input === "bigint";
}
/**
* Checks whether a value is a `symbol`.
*
* **When to use**
*
* Use when you need a `Predicate` guard to narrow an `unknown` value to a
* symbol.
*
* **Details**
*
* Uses `typeof input === "symbol"`.
*
* **Example** (Guarding symbols)
*
* ```ts import.meta.vitest
* import { Predicate } from "effect"
*
* const data: unknown = Symbol.for("id")
*
* if (Predicate.isSymbol(data)) {
*   data.description // => "id"
* }
* ```
*
* @see {@link isPropertyKey}
* @category guards
* @since 2.0.0
*/
function isSymbol(input) {
	return typeof input === "symbol";
}
/**
* Checks whether a value is a valid `PropertyKey` (string, number, or symbol).
*
* **When to use**
*
* Use when you need a `Predicate` guard for unknown property keys before
* indexing.
*
* **Details**
*
* Uses `isString`, `isNumber`, and `isSymbol`.
*
* **Example** (Guarding property keys)
*
* ```ts import.meta.vitest
* import { Predicate } from "effect"
*
* const key: unknown = "name"
* const obj: Record<PropertyKey, unknown> = { name: "Ada" }
*
* if (Predicate.isPropertyKey(key) && key in obj) {
*   obj[key] // => "Ada"
* }
* ```
*
* @see {@link isString}
* @see {@link isNumber}
* @see {@link isSymbol}
* @category guards
* @since 4.0.0
*/
function isPropertyKey(u) {
	return isString$1(u) || isNumber(u) || isSymbol(u);
}
/**
* Checks whether a value is a `function`.
*
* **When to use**
*
* Use when you need a `Predicate` guard to narrow an `unknown` value to a
* callable function.
*
* **Details**
*
* Uses `typeof input === "function"`.
*
* **Example** (Guarding functions)
*
* ```ts import.meta.vitest
* import { Predicate } from "effect"
*
* const data: unknown = () => 1
*
* if (Predicate.isFunction(data)) {
*   data() // => 1
* }
* ```
*
* @see {@link isObjectKeyword}
* @category guards
* @since 2.0.0
*/
function isFunction(input) {
	return typeof input === "function";
}
/**
* Checks whether a value is `undefined`.
*
* **When to use**
*
* Use when you need a `Predicate` guard for values that are exactly
* `undefined`.
*
* **Details**
*
* Uses `input === undefined`.
*
* **Example** (Guarding undefined values)
*
* ```ts import.meta.vitest
* import { Predicate } from "effect"
*
* const data: unknown = undefined
*
* Predicate.isUndefined(data) // => true
* ```
*
* @see {@link isNotUndefined}
* @see {@link isNullish}
* @category guards
* @since 2.0.0
*/
function isUndefined(input) {
	return input === void 0;
}
/**
* Checks whether a value is not `undefined`.
*
* **When to use**
*
* Use when you need a `Predicate` refinement that filters out `undefined`
* while preserving other falsy values.
*
* **Details**
*
* Returns a refinement that excludes `undefined`.
*
* **Example** (Filtering undefined values)
*
* ```ts import.meta.vitest
* import { Predicate } from "effect"
*
* const values = [1, undefined, 2]
* const defined = values.filter(Predicate.isNotUndefined) // => [1, 2]
* ```
*
* @see {@link isUndefined}
* @see {@link isNotNullish}
* @category guards
* @since 2.0.0
*/
function isNotUndefined(input) {
	return input !== void 0;
}
/**
* Checks whether a value is not `null` and not `undefined`.
*
* **When to use**
*
* Use when you need a `Predicate` refinement that filters out nullish values
* but keeps other falsy ones.
*
* **Details**
*
* Uses `input != null`.
*
* **Example** (Filtering non-nullish values)
*
* ```ts import.meta.vitest
* import { Predicate } from "effect"
*
* const values = [0, null, "", undefined]
* const present = values.filter(Predicate.isNotNullish) // => [0, ""]
* ```
*
* @see {@link isNullish}
* @see {@link isNotNull}
* @see {@link isNotUndefined}
* @category guards
* @since 4.0.0
*/
function isNotNullish(input) {
	return input != null;
}
/**
* Type guard that always returns `false`.
*
* **When to use**
*
* Use when you need a `Predicate` that never accepts, e.g. in default branches.
*
* **Example** (Matching no values)
*
* ```ts import.meta.vitest
* import { Predicate } from "effect"
*
* Predicate.isNever("anything") // => false
* ```
*
* @see {@link isUnknown}
* @category guards
* @since 2.0.0
*/
function isNever(_) {
	return false;
}
/**
* Type guard that always returns `true`.
*
* **When to use**
*
* Use when you need a `Predicate` that always accepts, e.g. as a placeholder.
*
* **Example** (Matching every value)
*
* ```ts import.meta.vitest
* import { Predicate } from "effect"
*
* Predicate.isUnknown(123) // => true
* ```
*
* @see {@link isNever}
* @category guards
* @since 2.0.0
*/
function isUnknown(_) {
	return true;
}
/**
* Checks whether a value is a non-null object value that is not an array.
*
* **When to use**
*
* Use to narrow unknown input to a non-null, non-array object with a
* `Predicate` guard.
*
* **Details**
*
* This is a structural runtime check using `typeof input === "object"`, so it
* also accepts object instances such as `Date`, `Map`, class instances, and
* typed arrays. It excludes `null` and arrays.
*
* **Example** (Guarding objects)
*
* ```ts import.meta.vitest
* import { Predicate } from "effect"
*
* Predicate.isObject({ a: 1 }) // => true
* Predicate.isObject([1, 2]) // => false
* ```
*
* @see {@link isObjectOrArray}
* @see {@link isReadonlyObject}
* @category guards
* @since 2.0.0
*/
function isObject(input) {
	return typeof input === "object" && input !== null && !Array.isArray(input);
}
/**
* Checks whether a value is a non-null, non-array object and narrows it to a
* readonly indexable object type.
*
* **When to use**
*
* Use to narrow unknown input to a readonly view of a non-null, non-array
* object with a `Predicate` guard.
*
* **Details**
*
* Readonly-ness is a TypeScript type-level view; it is not observable at
* runtime. This delegates to `isObject`, so class instances and built-in object
* instances are accepted.
*
* **Example** (Checking readonly objects)
*
* ```ts import.meta.vitest
* import { Predicate } from "effect"
*
* const data: unknown = { a: 1 }
*
* Predicate.isReadonlyObject(data) // => true
* ```
*
* @see {@link isObject}
* @category guards
* @since 4.0.0
*/
function isReadonlyObject(input) {
	return isObject(input);
}
/**
* Checks whether a value is an `object` in the JavaScript sense (objects, arrays, functions).
*
* **When to use**
*
* Use when you need a `Predicate` guard that accepts arrays and functions as
* well as objects.
*
* **Details**
*
* Returns `true` for arrays and functions, and `false` for `null`.
*
* **Example** (Checking object keywords)
*
* ```ts import.meta.vitest
* import { Predicate } from "effect"
*
* Predicate.isObjectKeyword(() => 1) // => true
* Predicate.isObjectKeyword(null) // => false
* ```
*
* @see {@link isObject}
* @see {@link isObjectOrArray}
* @category guards
* @since 4.0.0
*/
function isObjectKeyword(input) {
	return typeof input === "object" && input !== null || isFunction(input);
}
/**
* Checks whether a value has a given property key.
*
* **When to use**
*
* Use when you need a `Predicate` guard for property access on `unknown`
* values with a simple structural object check.
*
* **Details**
*
* Uses the `in` operator and `isObjectKeyword`. This does not check property
* value types.
*
* **Example** (Guarding object properties)
*
* ```ts import.meta.vitest
* import { Predicate } from "effect"
*
* const hasName = Predicate.hasProperty("name")
* const data: unknown = { name: "Ada" }
*
* if (hasName(data)) {
*   data.name // => "Ada"
* }
* ```
*
* @see {@link isTagged}
* @see {@link isObjectKeyword}
* @category guards
* @since 2.0.0
*/
var hasProperty = /*#__PURE__*/ dual(2, (self, property) => isObjectKeyword(self) && property in self);
/**
* Checks whether a value has a `_tag` property equal to the given tag.
*
* **When to use**
*
* Use when you model tagged unions with a `_tag` field and want a quick
* `Predicate` guard for tagged values.
*
* **Details**
*
* Uses `hasProperty` and strict equality on `_tag`.
*
* **Example** (Guarding tagged values)
*
* ```ts import.meta.vitest
* import { Predicate } from "effect"
*
* const isOk = Predicate.isTagged("Ok")
*
* isOk({ _tag: "Ok", value: 1 }) // => true
* ```
*
* @see {@link hasProperty}
* @category guards
* @since 2.0.0
*/
var isTagged = /*#__PURE__*/ dual(2, (self, tag) => hasProperty(self, "_tag") && self["_tag"] === tag);
/**
* Checks whether a value is an `Error`.
*
* **When to use**
*
* Use when you need a `Predicate` guard for errors caught from unknown sources.
*
* **Details**
*
* Uses `instanceof Error`.
*
* **Example** (Guarding errors)
*
* ```ts import.meta.vitest
* import { Predicate } from "effect"
*
* const data: unknown = new Error("boom")
*
* Predicate.isError(data) // => true
* ```
*
* @see {@link isUnknown}
* @category guards
* @since 2.0.0
*/
function isError(input) {
	return input instanceof Error;
}
/**
* Checks whether a value is iterable.
*
* **When to use**
*
* Use when you need a `Predicate` guard before iterating an unknown value.
*
* **Details**
*
* Accepts strings as iterable and uses `hasProperty` for `Symbol.iterator`.
*
* **Example** (Guarding iterables)
*
* ```ts import.meta.vitest
* import { Predicate } from "effect"
*
* const data: unknown = [1, 2, 3]
*
* Predicate.isIterable(data) // => true
* ```
*
* @see {@link isSet}
* @see {@link isMap}
* @category guards
* @since 2.0.0
*/
function isIterable(input) {
	return hasProperty(input, Symbol.iterator) || isString$1(input);
}
/**
* Checks whether a value is `PromiseLike` (has a `then` method).
*
* **When to use**
*
* Use when you need a `Predicate` guard for promise-like values with a
* callable `then` method.
*
* **Details**
*
* Performs a structural check for a callable `then`.
*
* **Example** (Guarding promise-like values)
*
* ```ts import.meta.vitest
* import { Predicate } from "effect"
*
* const data: unknown = { then: () => {} }
*
* Predicate.isPromiseLike(data) // => true
* ```
*
* @see {@link isPromise}
* @category guards
* @since 2.0.0
*/
function isPromiseLike(input) {
	return hasProperty(input, "then") && isFunction(input.then);
}
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0-rc.112/node_modules/effect/dist/Hash.js
/**
* Computes Effect hash values and defines the interface for objects that want
* to provide their own hash implementation. Hashes are small numeric
* fingerprints used by Effect data structures to bucket values quickly; they
* are not cryptographic digests and they are not proof that two values are
* equal. The module also includes helpers for primitive, structure, array, and
* reference-based hashes, plus functions for combining and optimizing numeric
* hash values.
*
* @since 2.0.0
*/
/**
* Defines the unique identifier used to identify objects that implement the Hash interface.
*
* **When to use**
*
* Use as the computed property key for the method that supplies a custom hash
* value on a `Hash` implementor.
*
* @see {@link Hash} for the interface implemented with this symbol
* @see {@link isHash} for checking whether a value implements `Hash`
* @see {@link hash} for computing hash values
*
* @category symbols
* @since 2.0.0
*/
var symbol$1 = "~effect/interfaces/Hash";
/**
* Computes a hash value for any given value.
*
* **When to use**
*
* Use to compute an Effect hash for primitives, collections, and hashable
* objects.
*
* **Details**
*
* This function can hash primitives (numbers, strings, booleans, etc.) as well as
* objects, arrays, and other complex data structures. It automatically handles
* different types and provides a consistent hash value for equivalent inputs.
*
* **Gotchas**
*
* Objects being hashed must be treated as immutable after their first hash
* computation. Hash results are cached, so mutating an object after hashing will
* lead to stale cached values and broken hash-based operations. For mutable
* objects, implement a custom `Hash` interface that hashes the object reference
* rather than its content.
*
* **Example** (Hashing different values)
*
* ```ts import.meta.vitest
* import { Hash } from "effect"
*
* Hash.hash(42) === Hash.hash(42) // => true
* Hash.hash("hello") === Hash.hash("hello") // => true
* Hash.hash([1, 2, 3]) === Hash.hash([1, 2, 3]) // => true
* ```
*
* @category hashing
* @since 2.0.0
*/
var hash = (self) => {
	switch (typeof self) {
		case "number": return number(self);
		case "bigint": return string(self.toString(10));
		case "boolean": return string(String(self));
		case "symbol": return string(String(self));
		case "string": return string(self);
		case "undefined": return string("undefined");
		case "function":
		case "object": if (self === null) return string("null");
		else if (self instanceof Date) {
			if (Number.isNaN(self.getTime())) return string("Invalid Date");
			return string(self.toISOString());
		} else if (self instanceof RegExp) return string(self.toString());
		else {
			if (byReferenceInstances.has(self)) return random(self);
			if (hashCache.has(self)) return hashCache.get(self);
			const h = withVisitedTracking$1(self, () => {
				if (isHash(self)) return self[symbol$1]();
				else if (typeof self === "function") return random(self);
				else if (self instanceof DataView) return array(new Uint8Array(self.buffer, self.byteOffset, self.byteLength));
				else if (Array.isArray(self) || ArrayBuffer.isView(self)) return array(self);
				else if (self instanceof Map) return hashMap(self);
				else if (self instanceof Set) return hashSet(self);
				return structure(self);
			});
			hashCache.set(self, h);
			return h;
		}
		default: throw new Error(`BUG: unhandled typeof ${typeof self} - please report an issue at https://github.com/Effect-TS/effect/issues`);
	}
};
/**
* Generates a random hash value for an object and caches it.
*
* **When to use**
*
* Use to hash an object by reference identity instead of structural content.
*
* **Details**
*
* This function creates a random hash value for objects that don't have their own
* hash implementation. The hash value is cached using a WeakMap, so the same object
* will always return the same hash value during its lifetime.
*
* **Example** (Hashing objects by reference)
*
* ```ts import.meta.vitest
* import { Hash } from "effect"
*
* const obj1 = { a: 1 }
* const obj2 = { a: 1 }
*
* Hash.random(obj1) === Hash.random(obj1) // => true
*
* typeof Hash.random(obj2) // => "number"
* ```
*
* @category hashing
* @since 2.0.0
*/
var random = (self) => {
	if (!randomHashCache.has(self)) randomHashCache.set(self, number(Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)));
	return randomHashCache.get(self);
};
/**
* Combines two hash values into a single hash value.
*
* **When to use**
*
* Use to build a hash for a composite value by folding together hash values for
* its parts.
*
* **Details**
*
* Supports both direct and pipeable usage. The implementation combines two
* hash values with `(self * 53) ^ b`.
*
* **Example** (Combining hash values)
*
* ```ts import.meta.vitest
* import { Hash, pipe } from "effect"
*
* const hash1 = Hash.hash("hello")
* const hash2 = Hash.hash("world")
*
* const combined = Hash.combine(hash2)(hash1)
* combined === pipe(hash1, Hash.combine(hash2)) // => true
* ```
*
* @see {@link hash} for computing hash values from arbitrary inputs
* @see {@link structureKeys} for hashing selected object fields without manual combination
*
* @category hashing
* @since 2.0.0
*/
var combine = /*#__PURE__*/ dual(2, (self, b) => self * 53 ^ b);
/**
* Applies bit manipulation techniques to optimize a hash value.
*
* **When to use**
*
* Use to improve the bit distribution of a raw numeric hash value.
*
* **Details**
*
* This function takes a hash value and applies bitwise operations to improve
* the distribution of hash values, reducing the likelihood of collisions.
*
* **Example** (Optimizing a hash value)
*
* ```ts import.meta.vitest
* import { Hash } from "effect"
*
* Hash.optimize(1234567890) // => 160826066
* ```
*
* @category hashing
* @since 2.0.0
*/
var optimize = (n) => n & 3221225471 | n >>> 1 & 1073741824;
/**
* Checks whether a value implements the Hash interface.
*
* **When to use**
*
* Use to detect whether an unknown value provides a custom hash implementation.
*
* **Details**
*
* This function determines whether a given value has the Hash symbol property,
* indicating that it can provide its own hash value implementation.
*
* **Example** (Checking for Hash support)
*
* ```ts import.meta.vitest
* import { Hash } from "effect"
*
* class MyHashable implements Hash.Hash {
*   [Hash.symbol]() {
*     return 42
*   }
* }
*
* Hash.isHash(new MyHashable()) // => true
* Hash.isHash({}) // => false
* Hash.isHash("string") // => false
* ```
*
* @category guards
* @since 2.0.0
*/
var isHash = (u) => hasProperty(u, symbol$1);
/**
* Computes a hash value for a number.
*
* **When to use**
*
* Use to hash a JavaScript number with Effect's numeric hash semantics.
*
* **Details**
*
* This function creates a hash value for numeric inputs, handling special cases
* like NaN, Infinity, and -Infinity with distinct hash values. It uses bitwise operations to ensure good distribution
* of hash values across different numeric inputs.
*
* **Example** (Hashing numbers)
*
* ```ts import.meta.vitest
* import { Hash } from "effect"
*
* Number.isInteger(Hash.number(42)) // => true
* Number.isInteger(Hash.number(3.14)) // => true
* Hash.number(NaN) === Hash.number(NaN) // => true
* Hash.number(Infinity) === Hash.number(Infinity) // => true
* Hash.number(100) === Hash.number(100) // => true
* ```
*
* @category hashing
* @since 2.0.0
*/
var number = (n) => {
	if (n !== n) return string("NaN");
	if (n === Infinity) return string("Infinity");
	if (n === -Infinity) return string("-Infinity");
	let h = n | 0;
	if (h !== n) h ^= n * 4294967295;
	while (n > 4294967295) h ^= n /= 4294967295;
	return optimize(h);
};
/**
* Computes a hash value for a string using the djb2 algorithm.
*
* **When to use**
*
* Use when you need a string field to contribute to a custom structural hash
* implementation.
*
* **Details**
*
* This function implements a variation of the djb2 hash algorithm, which is
* known for its good distribution properties and speed. It processes each
* character of the string to produce a consistent hash value.
*
* **Example** (Hashing strings)
*
* ```ts import.meta.vitest
* import { Hash } from "effect"
*
* Hash.string("hello") // => 181380007
* Hash.string("world") // => 164394279
* Hash.string("") // => 5381
* Hash.string("test") === Hash.string("test") // => true
* ```
*
* @category hashing
* @since 2.0.0
*/
var string = (str) => {
	let h = 5381, i = str.length;
	while (i) h = h * 33 ^ str.charCodeAt(--i);
	return optimize(h);
};
/**
* Computes a hash value for an object using only the specified keys.
*
* **When to use**
*
* Use to hash an object by a selected set of property keys.
*
* **Details**
*
* This function allows you to hash an object by considering only specific keys,
* which is useful when you want to create a hash based on a subset of an object's
* properties.
*
* **Example** (Hashing selected object keys)
*
* ```ts import.meta.vitest
* import { Hash } from "effect"
*
* const person = { name: "John", age: 30, city: "New York" }
*
* const hash1 = Hash.structureKeys(person, ["name", "age"])
* const hash2 = Hash.structureKeys(person, ["name", "city"])
*
* hash1 // => -590673747
* hash2 // => 284850673
*
* const person2 = { name: "John", age: 30, city: "Boston" }
* const hash3 = Hash.structureKeys(person2, ["name", "age"])
* hash1 === hash3 // => true
* ```
*
* @category hashing
* @since 2.0.0
*/
var structureKeys = (o, keys) => {
	let h = 12289;
	for (const key of keys) h ^= combine(hash(key), hash(o[key]));
	return optimize(h);
};
/**
* Computes a structural hash for an object using Effect's object key collection.
*
* **When to use**
*
* Use to hash an object from all structural keys collected by Effect.
*
* **Details**
*
* The hash is based on the object's structural keys and their values, including
* symbol keys and relevant prototype keys for non-plain objects.
*
* **Example** (Hashing object structures)
*
* ```ts import.meta.vitest
* import { Hash } from "effect"
*
* const obj1 = { name: "John", age: 30 }
* const obj2 = { name: "Jane", age: 25 }
* const obj3 = { name: "John", age: 30 }
*
* Hash.structure(obj1) // => -590673747
* Hash.structure(obj2) // => -590160631
* Hash.structure(obj3) // => -590673747
* Hash.structure(obj1) === Hash.structure(obj3) // => true
* ```
*
* @category hashing
* @since 2.0.0
*/
var structure = (o) => structureKeys(o, getAllObjectKeys(o));
var iterableWith = (seed, f) => (iter) => {
	let h = seed;
	for (const element of iter) h ^= f(element);
	return optimize(h);
};
/**
* Computes a hash value for an iterable by hashing all of its elements.
*
* **When to use**
*
* Use to hash the values yielded by an iterable with Effect hash semantics.
*
* **Details**
*
* The implementation folds element hashes from the seed `6151` with XOR and
* then optimizes the final hash.
*
* **Gotchas**
*
* A hash is not an equality proof. Because this implementation uses XOR,
* reordered inputs can produce the same hash.
*
* **Example** (Hashing arrays)
*
* ```ts import.meta.vitest
* import { Hash } from "effect"
*
* const arr1 = [1, 2, 3]
* const arr2 = [1, 2, 3]
* const arr3 = [3, 2, 1]
*
* Hash.array(arr1) // => 6151
* Hash.array(arr2) // => 6151
* Hash.array(arr3) // => 6151
* Hash.array(arr1) === Hash.array(arr2) // => true
* Hash.array(arr1) === Hash.array(arr3) // => true
* ```
*
* @see {@link hash} for the general-purpose hash dispatcher
*
* @category hashing
* @since 2.0.0
*/
var array = /*#__PURE__*/ iterableWith(6151, hash);
var hashMap = /*#__PURE__*/ iterableWith(/*#__PURE__*/ string("Map"), ([k, v]) => combine(hash(k), hash(v)));
var hashSet = /*#__PURE__*/ iterableWith(/*#__PURE__*/ string("Set"), hash);
var randomHashCache = /*#__PURE__*/ new WeakMap();
var hashCache = /*#__PURE__*/ new WeakMap();
var visitedObjects = /*#__PURE__*/ new WeakSet();
function withVisitedTracking$1(obj, fn) {
	if (visitedObjects.has(obj)) return string("[Circular]");
	visitedObjects.add(obj);
	const result = fn();
	visitedObjects.delete(obj);
	return result;
}
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0-rc.112/node_modules/effect/dist/Equal.js
/**
* Defines the unique string identifier for the `Equal` interface.
*
* **When to use**
*
* Use when you implement custom equality and need the computed property key for
* the equality method.
*
* **Details**
*
* This is a pure constant with no allocation or side effects.
*
* **Example** (Implementing Equal on a class)
*
* ```ts import.meta.vitest
* import { Equal, Hash } from "effect"
*
* class UserId implements Equal.Equal {
*   constructor(readonly id: string) {}
*
*   [Equal.symbol](that: Equal.Equal): boolean {
*     return that instanceof UserId && this.id === that.id
*   }
*
*   [Hash.symbol](): number {
*     return Hash.string(this.id)
*   }
* }
*
* Equal.equals(new UserId("1"), new UserId("1")) // => true
* Equal.equals(new UserId("1"), new UserId("2")) // => false
* ```
*
* @see {@link Equal} — the interface that uses this symbol
* @see {@link isEqual} — type guard for `Equal` implementors
* @category symbols
* @since 2.0.0
*/
var symbol = "~effect/interfaces/Equal";
function equals$2() {
	if (arguments.length === 1) return (self) => compareBoth(self, arguments[0]);
	return compareBoth(arguments[0], arguments[1]);
}
function compareBoth(self, that) {
	if (self === that) return true;
	if (self == null || that == null) return false;
	const selfType = typeof self;
	if (selfType !== typeof that) return false;
	if (selfType === "number" && self !== self && that !== that) return true;
	if (selfType !== "object" && selfType !== "function") return false;
	if (byReferenceInstances.has(self) || byReferenceInstances.has(that)) return false;
	return withCache(self, that, compareObjects);
}
/** Helper to run comparison with proper visited tracking */
function withVisitedTracking(self, that, fn) {
	const hasLeft = visitedLeft.has(self);
	const hasRight = visitedRight.has(that);
	if (hasLeft && hasRight) return true;
	if (hasLeft || hasRight) return false;
	visitedLeft.add(self);
	visitedRight.add(that);
	const result = fn();
	visitedLeft.delete(self);
	visitedRight.delete(that);
	return result;
}
var visitedLeft = /*#__PURE__*/ new WeakSet();
var visitedRight = /*#__PURE__*/ new WeakSet();
/** Helper to perform cached object comparison */
function compareObjects(self, that) {
	if (hash(self) !== hash(that)) return false;
	else if (self instanceof Date) {
		if (!(that instanceof Date)) return false;
		const selfTime = self.getTime();
		const thatTime = that.getTime();
		return selfTime === thatTime || Number.isNaN(selfTime) && Number.isNaN(thatTime);
	} else if (self instanceof RegExp) {
		if (!(that instanceof RegExp)) return false;
		return self.toString() === that.toString();
	}
	const selfIsEqual = isEqual(self);
	const thatIsEqual = isEqual(that);
	if (selfIsEqual !== thatIsEqual) return false;
	const bothEquals = selfIsEqual && thatIsEqual;
	if (typeof self === "function" && !bothEquals) return false;
	return withVisitedTracking(self, that, () => {
		if (bothEquals) return self[symbol](that);
		else if (Array.isArray(self)) {
			if (!Array.isArray(that) || self.length !== that.length) return false;
			return compareArrays(self, that);
		} else if (ArrayBuffer.isView(self)) {
			const selfIsDataView = self instanceof DataView;
			if (!ArrayBuffer.isView(that) || self.byteLength !== that.byteLength || selfIsDataView !== that instanceof DataView) return false;
			if (selfIsDataView) {
				const thatDataView = that;
				return compareTypedArrays(new Uint8Array(self.buffer, self.byteOffset, self.byteLength), new Uint8Array(thatDataView.buffer, thatDataView.byteOffset, thatDataView.byteLength));
			}
			return compareTypedArrays(self, that);
		} else if (self instanceof Map) {
			if (!(that instanceof Map) || self.size !== that.size) return false;
			return compareMaps(self, that);
		} else if (self instanceof Set) {
			if (!(that instanceof Set) || self.size !== that.size) return false;
			return compareSets(self, that);
		}
		return compareRecords(self, that);
	});
}
function withCache(self, that, f) {
	let selfMap = equalityCache.get(self);
	if (!selfMap) {
		selfMap = /* @__PURE__ */ new WeakMap();
		equalityCache.set(self, selfMap);
	} else if (selfMap.has(that)) return selfMap.get(that);
	const result = f(self, that);
	selfMap.set(that, result);
	let thatMap = equalityCache.get(that);
	if (!thatMap) {
		thatMap = /* @__PURE__ */ new WeakMap();
		equalityCache.set(that, thatMap);
	}
	thatMap.set(self, result);
	return result;
}
var equalityCache = /*#__PURE__*/ new WeakMap();
function compareArrays(self, that) {
	for (let i = 0; i < self.length; i++) if (!compareBoth(self[i], that[i])) return false;
	return true;
}
function compareTypedArrays(self, that) {
	if (self.length !== that.length) return false;
	for (let i = 0; i < self.length; i++) if (self[i] !== that[i]) return false;
	return true;
}
function compareRecords(self, that) {
	const selfKeys = getAllObjectKeys(self);
	const thatKeys = getAllObjectKeys(that);
	if (selfKeys.size !== thatKeys.size) return false;
	for (const key of selfKeys) if (!thatKeys.has(key) || !compareBoth(self[key], that[key])) return false;
	return true;
}
/** @internal */
function makeCompareMap(keyEquivalence, valueEquivalence) {
	return function compareMaps(self, that) {
		const thatEntries = Array.from(that);
		for (const [selfKey, selfValue] of self) {
			let found = false;
			for (let i = 0; i < thatEntries.length; i++) {
				const [thatKey, thatValue] = thatEntries[i];
				if (keyEquivalence(selfKey, thatKey) && valueEquivalence(selfValue, thatValue)) {
					thatEntries[i] = thatEntries[thatEntries.length - 1];
					thatEntries.pop();
					found = true;
					break;
				}
			}
			if (!found) return false;
		}
		return true;
	};
}
var compareMaps = /*#__PURE__*/ makeCompareMap(compareBoth, compareBoth);
/** @internal */
function makeCompareSet(equivalence) {
	return function compareSets(self, that) {
		const thatValues = Array.from(that);
		for (const selfValue of self) {
			let found = false;
			for (let i = 0; i < thatValues.length; i++) {
				const thatValue = thatValues[i];
				if (equivalence(selfValue, thatValue)) {
					thatValues[i] = thatValues[thatValues.length - 1];
					thatValues.pop();
					found = true;
					break;
				}
			}
			if (!found) return false;
		}
		return true;
	};
}
var compareSets = /*#__PURE__*/ makeCompareSet(compareBoth);
/**
* Checks whether a value implements the {@link Equal} interface.
*
* **When to use**
*
* Use when you need generic utility code to distinguish `Equal` implementors
* from plain values before calling `[Equal.symbol]` directly.
*
* **Details**
*
* - Pure function, no side effects.
* - Returns `true` if and only if `u` has a property keyed by
*   {@link symbol}.
* - Acts as a TypeScript type guard, narrowing the input to {@link Equal}.
*
* **Example** (Checking Equal values)
*
* ```ts import.meta.vitest
* import { Equal, Hash } from "effect"
*
* class Token implements Equal.Equal {
*   constructor(readonly value: string) {}
*   [Equal.symbol](that: Equal.Equal): boolean {
*     return that instanceof Token && this.value === that.value
*   }
*   [Hash.symbol](): number {
*     return Hash.string(this.value)
*   }
* }
*
* Equal.isEqual(new Token("abc")) // => true
* Equal.isEqual({ x: 1 }) // => false
* Equal.isEqual(42) // => false
* ```
*
* @see {@link Equal} — the interface being checked
* @see {@link symbol} — the property key that signals `Equal` support
* @category guards
* @since 2.0.0
*/
var isEqual = (u) => hasProperty(u, symbol);
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0-rc.112/node_modules/effect/dist/Reducer.js
/**
* Reusable strategies for reducing many values into one value. A `Reducer<A>`
* extends `Combiner.Combiner` with an `initialValue` for empty collections and
* a `combineAll` method for folding an entire iterable. This module provides a
* constructor for reducers and a helper for reversing the order in which values
* are combined.
*
* @since 4.0.0
*/
/**
* Creates a `Reducer` from a `combine` function and an `initialValue`.
*
* **When to use**
*
* Use when you have a custom reducing operation not covered by a pre-built reducer.
* - You want to provide an optimized `combineAll` (e.g. short-circuiting on
*   a known absorbing element like `0` for multiplication).
*
* **Details**
*
* - If `combineAll` is omitted, a default left-to-right fold starting from
*   `initialValue` is used.
* - If `combineAll` is provided, it completely replaces the default fold.
*
* **Example** (Multiplying with short-circuit)
*
* ```ts import.meta.vitest
* import { Reducer } from "effect"
*
* const Product = Reducer.make<number>(
*   (a, b) => a * b,
*   1,
*   (collection) => {
*     let acc = 1
*     for (const n of collection) {
*       if (n === 0) return 0
*       acc *= n
*     }
*     return acc
*   }
* )
*
* Product.combineAll([2, 3, 4]) // => 24
* Product.combineAll([2, 0, 4]) // => 0
* ```
*
* @see {@link Reducer} – the interface this creates
* @see {@link flip} – reverse the argument order
*
* @category constructors
* @since 4.0.0
*/
function make$11(combine, initialValue, combineAll) {
	return {
		combine,
		initialValue,
		combineAll: combineAll ?? ((collection) => {
			let out = initialValue;
			for (const value of collection) out = combine(out, value);
			return out;
		})
	};
}
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0-rc.112/node_modules/effect/dist/Equivalence.js
/**
* Creates a custom equivalence relation with an optimized reference equality check.
*
* **When to use**
*
* Use when you need an equality rule that the built-in instances and input
* mapping helpers cannot express, and you can provide a law-abiding comparison.
*
* **Details**
*
* The returned equivalence first checks reference equality (`===`) for
* performance. If the values are not the same reference, it falls back to the
* provided equivalence function, which must satisfy reflexive, symmetric, and
* transitive properties.
*
* **Example** (Case-insensitive string equivalence)
*
* ```ts import.meta.vitest
* import { Equivalence } from "effect"
*
* const caseInsensitive = Equivalence.make<string>((a, b) =>
*   a.toLowerCase() === b.toLowerCase()
* )
*
* caseInsensitive("Hello", "HELLO") // => true
* caseInsensitive("foo", "bar") // => false
*
* // Same reference optimization
* const str = "test"
* caseInsensitive(str, str) // => true
* ```
*
* **Example** (Comparing numbers with tolerance)
*
* ```ts import.meta.vitest
* import { Equivalence } from "effect"
*
* const tolerance = Equivalence.make<number>((a, b) => Math.abs(a - b) < 0.0001)
*
* tolerance(1.0, 1.001) // => false
* tolerance(1.0, 1.00001) // => true
* ```
*
* @see {@link strictEqual}
* @see {@link mapInput}
* @category constructors
* @since 2.0.0
*/
var make$10 = (isEquivalent) => (self, that) => self === that || isEquivalent(self, that);
var isStrictEquivalent = (x, y) => x === y;
/**
* Creates an equivalence relation that uses strict equality (`===`) to compare values.
*
* **When to use**
*
* Use when you need strict equality (`===`) as the comparison.
*
* **Details**
*
* Uses JavaScript's strict equality operator (`===`). Primitives compare by
* value. Objects compare by reference, so only the same object instance is
* equivalent. Use this as a building block for more complex equivalences via
* `mapInput` or `combine`.
*
* **Gotchas**
*
* `NaN !== NaN`, so `NaN` values are never considered equivalent.
*
* **Example** (Comparing primitive types)
*
* ```ts import.meta.vitest
* import { Equivalence } from "effect"
*
* const strictEq = Equivalence.strictEqual<number>()
*
* strictEq(1, 1) // => true
* strictEq(1, 2) // => false
* strictEq(NaN, NaN) // => false
* ```
*
* **Example** (Comparing objects by reference)
*
* ```ts import.meta.vitest
* import { Equivalence } from "effect"
*
* const obj = { value: 42 }
* const strictObjEq = Equivalence.strictEqual<typeof obj>()
*
* strictObjEq(obj, obj) // => true
* strictObjEq(obj, { value: 42 }) // => false
* ```
*
* @see {@link make}
* @see `Equal` for structural equality
* @category constructors
* @since 4.0.0
*/
var strictEqual = () => isStrictEquivalent;
/**
* Creates an equivalence for tuples with heterogeneous element types.
*
* **When to use**
*
* Use when you need an `Equivalence` for fixed-length tuples with per-position
* equivalences.
*
* **Details**
*
* Tuples must have the same length; different lengths are never equivalent.
* Each equivalence is applied to the corresponding element position. The result
* returns `true` only if all elements are equivalent according to their
* respective equivalences, and it also satisfies reflexive, symmetric, and
* transitive properties.
*
* **Example** (Comparing homogeneous tuples)
*
* ```ts import.meta.vitest
* import { Equivalence } from "effect"
*
* const stringTupleEq = Equivalence.Tuple([
*   Equivalence.strictEqual<string>(),
*   Equivalence.strictEqual<string>(),
*   Equivalence.strictEqual<string>()
* ])
*
* const tuple1 = ["hello", "world", "test"] as const
* const tuple2 = ["hello", "world", "test"] as const
* const tuple3 = ["hello", "world", "different"] as const
*
* stringTupleEq(tuple1, tuple2) // => true
* stringTupleEq(tuple1, tuple3) // => false
* ```
*
* **Example** (Comparing tuples with custom equivalences)
*
* ```ts import.meta.vitest
* import { Equivalence } from "effect"
*
* const caseInsensitive = Equivalence.mapInput(
*   Equivalence.strictEqual<string>(),
*   (s: string) => s.toLowerCase()
* )
*
* const customTupleEq = Equivalence.Tuple([
*   caseInsensitive,
*   caseInsensitive,
*   caseInsensitive
* ])
*
* customTupleEq(["Hello", "World", "Test"], ["HELLO", "WORLD", "TEST"]) // => true
* ```
*
* @category combinators
* @since 4.0.0
*/
function Tuple(elements) {
	return make$10((self, that) => {
		if (self.length !== that.length) return false;
		for (let i = 0; i < self.length; i++) if (!elements[i](self[i], that[i])) return false;
		return true;
	});
}
/**
* @since 4.0.0
*/
function Array_(item) {
	return make$10((self, that) => {
		if (self.length !== that.length) return false;
		for (let i = 0; i < self.length; i++) if (!item(self[i], that[i])) return false;
		return true;
	});
}
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0-rc.112/node_modules/effect/dist/internal/array.js
/**
* @since 2.0.0
*/
/** @internal */
var isArrayNonEmpty$1 = (self) => self.length > 0;
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0-rc.112/node_modules/effect/dist/internal/doNotation.js
/** @internal */
var let_$2 = (map) => dual(3, (self, name, f) => map(self, (a) => ({
	...a,
	[name]: f(a)
})));
/** @internal */
var bindTo$2 = (map) => dual(2, (self, name) => map(self, (a) => ({ [name]: a })));
/** @internal */
var bind$2 = (map, flatMap) => dual(3, (self, name, f) => flatMap(self, (a) => map(f(a), (b) => ({
	...a,
	[name]: b
}))));
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0-rc.112/node_modules/effect/dist/internal/record.js
/** @internal */
function assignProperty$1(self, key, value) {
	if (key === "__proto__") Object.defineProperty(self, key, {
		value,
		writable: true,
		enumerable: true,
		configurable: true
	});
	else self[key] = value;
}
/** @internal */
function assignProperties(self, source) {
	for (const key of Reflect.ownKeys(source)) if (Object.prototype.propertyIsEnumerable.call(source, key)) assignProperty$1(self, key, source[key]);
}
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0-rc.112/node_modules/effect/dist/Combiner.js
/**
* Creates a `Combiner` from a binary function.
*
* **When to use**
*
* Use when you have a custom combining operation that is not covered by
* the built-in constructors (`min`, `max`, `first`, `last`, `constant`).
*
* **Details**
*
* The returned combiner's `combine` method delegates to the provided function.
* Any purity, associativity, or mutation behavior comes from that function.
*
* **Example** (Multiplying numbers)
*
* ```ts import.meta.vitest
* import { Combiner } from "effect"
*
* const Product = Combiner.make<number>((self, that) => self * that)
*
* Product.combine(3, 5) // => 15
* ```
*
* @see {@link Combiner} – the interface this creates
* @category constructors
* @since 4.0.0
*/
function make$9(combine) {
	return { combine };
}
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0-rc.112/node_modules/effect/dist/Redactable.js
/**
* Defines the symbol used to identify objects that implement the {@link Redactable}
* protocol.
*
* **When to use**
*
* Use as the property key when implementing the `Redactable` protocol.
*
* **Details**
*
* Add a method under this key to make an object redactable. The method receives
* the current `Context` and must return the replacement value. The symbol is
* registered globally via `Symbol.for("~effect/Redactable")`, so it is
* identical across multiple copies of the library at runtime.
*
* **Example** (Masking an API key)
*
* ```ts import.meta.vitest
* import { Context, Redactable } from "effect"
*
* class ApiKey {
*   constructor(readonly raw: string) {}
*
*   [Redactable.symbolRedactable](_ctx: Context.Context<never>) {
*     return this.raw.slice(0, 4) + "..."
*   }
* }
*
* Redactable.redact(new ApiKey("secret-key")) // => "secr..."
* ```
*
* @see {@link Redactable} for the interface this symbol belongs to
* @see {@link isRedactable} to check whether a value has this symbol
* @category symbols
* @since 3.10.0
*/
var symbolRedactable = /*#__PURE__*/ Symbol.for("~effect/Redactable");
/**
* Type guard that checks whether a value implements the {@link Redactable}
* interface.
*
* **When to use**
*
* Use to narrow an unknown value before calling redaction-specific helpers.
*
* @see {@link Redactable} for the interface being checked
* @see {@link redact} to apply redaction if the value is redactable
* @category guards
* @since 3.10.0
*/
var isRedactable = (u) => hasProperty(u, symbolRedactable);
/**
* Returns a redacted value if it implements {@link Redactable}, otherwise returns it
* unchanged.
*
* **When to use**
*
* Use as the general-purpose entry point for redaction when the input may
* or may not implement the redaction protocol.
*
* **Details**
*
* This function calls {@link isRedactable} and, when it returns `true`,
* delegates to {@link getRedacted}.
*
* **Gotchas**
*
* Redaction is not recursive. Nested redactable values inside the returned
* object are not automatically redacted.
*
* @see {@link isRedactable} to check before redacting
* @see {@link getRedacted} for the lower-level variant for known redactables
* @category destructors
* @since 3.10.0
*/
function redact(u) {
	if (isRedactable(u)) return getRedacted(u);
	return u;
}
/**
* Returns the result of calling `[symbolRedactable]` on a value that is
* already known to be {@link Redactable}.
*
* **When to use**
*
* Use when you need to read the redacted representation from a value already
* verified as `Redactable`.
*
* **Details**
*
* This function reads the current fiber's `Context` from the global fiber
* reference and passes it to the redaction method.
*
* **Gotchas**
*
* If no fiber is active, an empty `Context` is passed to the redaction method.
*
* @see {@link redact} for the higher-level variant that handles non-redactable values
* @see {@link isRedactable} for the type guard to verify before calling this
* @category destructors
* @since 4.0.0
*/
function getRedacted(redactable) {
	return redactable[symbolRedactable](globalThis["~effect/Fiber/currentFiber"]?.context ?? emptyContext$1);
}
/** @internal */
var currentFiberTypeId = "~effect/Fiber/currentFiber";
var emptyMap = /*#__PURE__*/ new Map();
var emptyContext$1 = {
	"~effect/Context": {},
	base: emptyMap,
	depth: 0,
	mapUnsafe: emptyMap,
	pipe() {
		return pipeArguments(this, arguments);
	}
};
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0-rc.112/node_modules/effect/dist/Formatter.js
/**
* Formats JavaScript values into readable strings.
*
* `format` is intended for logs, diagnostics, and error messages. It handles
* primitives, objects, arrays, dates, regular expressions, maps, sets, class
* instances, errors, circular references, and redactable values. `formatJson`
* wraps JSON formatting with redaction and circular-reference handling, and the
* module also includes helpers for property keys, paths, and dates.
*
* @since 4.0.0
*/
/**
* Converts any JavaScript value into a human-readable string.
*
* **When to use**
*
* Use when you need to format arbitrary JavaScript values for debugging,
* logging, or error messages.
*
* **Details**
*
* - Output is **not** valid JSON; use {@link formatJson} when you need
*   parseable JSON.
* - Handles `BigInt`, `Symbol`, `Set`, `Map`, `Date`, `RegExp`, and class
*   instances that `JSON.stringify` cannot represent.
* - Circular references are shown as `"[Circular]"` instead of throwing.
* - Primitives: stringified naturally (`null`, `undefined`, `123`, `true`).
*   Strings are JSON-quoted.
* - Objects with a custom `toString` (not `Object.prototype.toString`):
*   `toString()` is called unless `ignoreToString` is `true`.
* - Errors with a `cause`: formatted as `"<message> (cause: <cause>)"`.
* - Iterables (`Set`, `Map`, etc.): formatted as
*   `ClassName([...elements])`.
* - Class instances: wrapped as `ClassName({...})`.
* - `Redactable` values are automatically redacted.
* - Arrays/objects with 0–1 entries are inline; larger ones are
*   pretty-printed when `space` is set.
* - `space` — indentation unit (number of spaces, or a string like
*   `"\t"`). Defaults to `0` (compact).
* - `ignoreToString` — skip calling `toString()`. Defaults to `false`.
*
* **Example** (Formatting compact output)
*
* ```ts import.meta.vitest
* import { Formatter } from "effect"
*
* Formatter.format({ a: 1, b: [2, 3] }) // => "{\"a\":1,\"b\":[2,3]}"
* ```
*
* **Example** (Pretty-printed output)
*
* ```ts import.meta.vitest
* import { Formatter } from "effect"
*
* const output = Formatter.format({ a: 1, b: [2, 3] }, { space: 2 })
* output // => "{\n  \"a\": 1,\n  \"b\": [\n    2,\n    3\n  ]\n}"
* ```
*
* **Example** (Handling circular references)
*
* ```ts import.meta.vitest
* import { Formatter } from "effect"
*
* const obj: any = { name: "loop" }
* obj.self = obj
* Formatter.format(obj) // => "{\"name\":\"loop\",\"self\":[Circular]}"
* ```
*
* @see {@link formatJson}
* @see {@link Formatter}
* @category formatting
* @since 2.0.0
*/
function format$1(input, options) {
	const space = options?.space ?? 0;
	const ancestors = /* @__PURE__ */ new WeakSet();
	const gap = !space ? "" : typeof space === "number" ? " ".repeat(space) : space;
	const ind = (d) => gap.repeat(d);
	const wrap = (v, body) => {
		const ctor = v?.constructor;
		return ctor && ctor !== Object.prototype.constructor && ctor.name ? `${ctor.name}(${body})` : body;
	};
	const ownKeys = (o) => {
		try {
			return Reflect.ownKeys(o);
		} catch {
			return ["[ownKeys threw]"];
		}
	};
	function recur(v, d = 0) {
		if (typeof v === "string") return JSON.stringify(v);
		if (typeof v === "number" || v == null || typeof v === "boolean" || typeof v === "symbol") return String(v);
		if (typeof v === "bigint") return String(v) + "n";
		if (typeof v === "object" || typeof v === "function") {
			if (ancestors.has(v)) return CIRCULAR;
			ancestors.add(v);
			let output;
			if (symbolRedactable in v) output = recur(getRedacted(v), d);
			else if (Array.isArray(v)) output = !gap || v.length <= 1 ? `[${v.map((x) => recur(x, d)).join(",")}]` : `[\n${ind(d + 1)}${v.map((x) => recur(x, d + 1)).join(",\n" + ind(d + 1))}\n${ind(d)}]`;
			else if (v instanceof Date) output = formatDate(v);
			else if (!options?.ignoreToString && hasProperty(v, "toString") && typeof v["toString"] === "function" && v["toString"] !== Object.prototype.toString && v["toString"] !== Array.prototype.toString) {
				const s = safeToString(v);
				output = v instanceof Error && v.cause ? `${s} (cause: ${recur(v.cause, d)})` : s;
			} else if (Symbol.iterator in v) output = `${v.constructor.name}(${recur(Array.from(v), d)})`;
			else {
				const keys = ownKeys(v);
				if (!gap || keys.length <= 1) {
					const body = `{${keys.map((k) => `${formatPropertyKey(k)}:${recur(v[k], d)}`).join(",")}}`;
					output = wrap(v, body);
				} else {
					const body = `{\n${keys.map((k) => `${ind(d + 1)}${formatPropertyKey(k)}: ${recur(v[k], d + 1)}`).join(",\n")}\n${ind(d)}}`;
					output = wrap(v, body);
				}
			}
			ancestors.delete(v);
			return output;
		}
		return String(v);
	}
	return recur(input, 0);
}
var CIRCULAR = "[Circular]";
/**
* @internal
*/
function formatPropertyKey(name) {
	return typeof name === "string" ? JSON.stringify(name) : String(name);
}
/**
* Formats an array of property keys as a bracket-notation path string.
*
* @internal
*/
function formatPath(path) {
	return path.map((key) => `[${formatPropertyKey(key)}]`).join("");
}
/**
* Formats a `Date` as an ISO 8601 string, returning `"Invalid Date"` for
* invalid dates instead of throwing.
*
* @internal
*/
function formatDate(date) {
	try {
		return date.toISOString();
	} catch {
		return "Invalid Date";
	}
}
function safeToString(input) {
	try {
		const s = input.toString();
		return typeof s === "string" ? s : String(s);
	} catch {
		return "[toString threw]";
	}
}
/**
* Stringifies a value to JSON safely, silently dropping circular references.
*
* **When to use**
*
* Use when you need valid JSON output, unlike `format`, and the input may
* contain circular references that should be silently omitted rather than
* throwing a `TypeError`.
*
* **Details**
*
* Uses `JSON.stringify` internally with a replacer that tracks the current
* object ancestry. Circular references are replaced with `undefined`, which
* omits them from object output. `Redactable` values are automatically redacted
* before serialization. `BigInt` values are stringified with an `n` suffix.
* Values not supported by JSON otherwise follow standard `JSON.stringify`
* behavior. The `space` parameter controls indentation and defaults to `0`.
*
* **Gotchas**
*
* When the root input is `undefined`, a symbol, or a function, `formatJson`
* returns `"null"` instead of the `undefined` returned by `JSON.stringify`.
* Nested values retain standard `JSON.stringify` behavior.
*
* **Example** (Formatting compact JSON)
*
* ```ts import.meta.vitest
* import { Formatter } from "effect"
*
* Formatter.formatJson({ name: "Alice", age: 30 }) // => "{\"name\":\"Alice\",\"age\":30}"
* ```
*
* **Example** (Handling circular references)
*
* ```ts import.meta.vitest
* import { Formatter } from "effect"
*
* const obj: any = { name: "test" }
* obj.self = obj
* Formatter.formatJson(obj) // => "{\"name\":\"test\"}"
* ```
*
* **Example** (Pretty-printed JSON)
*
* ```ts import.meta.vitest
* import { Formatter } from "effect"
*
* const output = Formatter.formatJson({ name: "Alice", age: 30 }, { space: 2 })
* output // => "{\n  \"name\": \"Alice\",\n  \"age\": 30\n}"
* ```
*
* @see {@link format}
* @see {@link Formatter}
* @category serialization
* @since 4.0.0
*/
function formatJson(input, options) {
	const ancestors = [];
	return JSON.stringify(input, function(key, value) {
		const original = Object.getOwnPropertyDescriptor(this, key)?.value;
		const redacted = hasProperty(original, symbolRedactable) ? redact(original) : redact(value);
		if (typeof redacted === "bigint") return format$1(redacted);
		if (typeof redacted !== "object" || redacted === null) return redacted;
		while (ancestors.length > 0 && ancestors[ancestors.length - 1] !== this) ancestors.pop();
		if (ancestors.includes(redacted)) return;
		ancestors.push(redacted);
		return redacted;
	}, options?.space) ?? "null";
}
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0-rc.112/node_modules/effect/dist/Inspectable.js
/**
* Controls how values appear in logs and debugging output.
*
* Effect data types use `Inspectable` to provide stable string, JSON, and
* Node.js inspection output. This keeps custom values readable in logs, REPLs,
* test failures, and diagnostics. This module defines the Node inspect symbol,
* the `Inspectable` interface, safe conversion helpers, and shared prototype or
* class implementations for custom values.
*
* @since 2.0.0
*/
/**
* Defines the symbol used by Node.js for custom object inspection.
*
* **When to use**
*
* Use to implement Node.js custom inspection for a value.
*
* **Details**
*
* This symbol is recognized by Node.js's `util.inspect()` function and the REPL
* for custom object representation. When an object has a method with this symbol,
* it will be called to determine how the object should be displayed.
*
* **Example** (Defining custom Node inspection)
*
* ```ts import.meta.vitest
* import { Inspectable } from "effect"
*
* class CustomObject {
*   constructor(private value: string) {}
*
*   [Inspectable.NodeInspectSymbol]() {
*     return `CustomObject(${this.value})`
*   }
* }
*
* const obj = new CustomObject("hello")
* obj[Inspectable.NodeInspectSymbol]() // => "CustomObject(hello)"
* ```
*
* @category symbols
* @since 2.0.0
*/
var NodeInspectSymbol = /*#__PURE__*/ Symbol.for("nodejs.util.inspect.custom");
/**
* Converts a value to its structured inspection representation.
*
* **When to use**
*
* Use when you need the structured representation of an inspectable value
* without risking unhandled errors.
*
* **Details**
*
* This function applies redaction before extracting data from objects that
* implement `toJSON`, recursively processes arrays, and handles errors
* gracefully. Plain objects are returned unchanged, so the result is not
* guaranteed to be accepted by `JSON.stringify`; it may still contain values
* such as `BigInt`, functions, or circular references.
*
* @see {@link toStringUnknown} for converting unknown values to strings
*
* @category converting
* @since 4.0.0
*/
var toJson = (input) => {
	try {
		input = redact(input);
		if (hasProperty(input, "toJSON") && isFunction(input["toJSON"]) && input["toJSON"].length === 0) return input.toJSON();
		else if (Array.isArray(input)) return input.map(toJson);
		return input;
	} catch {
		return "[toJSON threw]";
	}
};
/**
* Converts an unknown value to a string for diagnostics.
*
* **When to use**
*
* Use to produce a diagnostic string from a value whose runtime type is unknown.
*
* **Details**
*
* Strings are returned unchanged. Objects are formatted as JSON using the
* provided whitespace setting when possible, and values that cannot be
* formatted are converted with `String`.
*
* @category converting
* @since 2.0.0
*/
var toStringUnknown = (u, whitespace = 2) => {
	if (typeof u === "string") return u;
	try {
		return typeof u === "object" ? formatJson(u, { space: whitespace }) : format$1(u, { space: whitespace });
	} catch {
		return String(u);
	}
};
/**
* A base prototype object that implements the {@link Inspectable} interface.
*
* **When to use**
*
* Use as a prototype for plain objects that should share standard inspectable behavior.
*
* **Details**
*
* This object provides default implementations for the {@link Inspectable} methods.
* It can be used as a prototype for objects that want to be inspectable,
* or as a mixin to add inspection capabilities to existing objects.
*
* **Example** (Using the base inspectable prototype)
*
* ```ts import.meta.vitest
* import { Inspectable } from "effect"
*
* // Use as prototype
* const myObject = Object.create(Inspectable.BaseProto)
* myObject.name = "example"
* myObject.value = 42
*
* myObject.toString() // => "\"[toJSON threw]\""
*
* // Or extend in a constructor
* function MyClass(this: any, name: string) {
*   this.name = name
* }
* MyClass.prototype = Object.create(Inspectable.BaseProto)
* MyClass.prototype.constructor = MyClass
* ```
*
* @category prototypes
* @since 2.0.0
*/
var BaseProto = {
	toJSON() {
		return toJson(this);
	},
	[NodeInspectSymbol]() {
		return this.toJSON();
	},
	toString() {
		return format$1(this.toJSON());
	}
};
/**
* Provides an abstract base class that implements the Inspectable interface.
*
* **When to use**
*
* Use as a base class for inspectable objects that define their own JSON representation.
*
* **Details**
*
* This class provides a convenient way to create inspectable objects by extending it.
* Subclasses only need to implement the `toJSON()` method, and they automatically
* get proper `toString()` and Node.js inspection support.
*
* **Example** (Extending the inspectable base class)
*
* ```ts import.meta.vitest
* import { Inspectable } from "effect"
*
* class User extends Inspectable.Class {
*   constructor(
*     public readonly id: number,
*     public readonly name: string,
*     public readonly email: string
*   ) {
*     super()
*   }
*
*   toJSON() {
*     return {
*       _tag: "User",
*       id: this.id,
*       name: this.name,
*       email: this.email
*     }
*   }
* }
*
* const user = new User(1, "Alice", "alice@example.com")
* user.toString() // => "{\"_tag\":\"User\",\"id\":1,\"name\":\"Alice\",\"email\":\"alice@example.com\"}"
* user[Inspectable.NodeInspectSymbol]() // => { _tag: "User", id: 1, name: "Alice", email: "alice@example.com" }
* ```
*
* @category models
* @since 2.0.0
*/
var Class$1 = class {
	/**
	* Node.js custom inspection method.
	*
	* **When to use**
	*
	* Use to expose the class JSON representation to Node.js inspection.
	*
	* @since 2.0.0
	*/
	[NodeInspectSymbol]() {
		return this.toJSON();
	}
	/**
	* Returns a formatted string representation of this object.
	*
	* **When to use**
	*
	* Use to format the class JSON representation as a string.
	*
	* @since 2.0.0
	*/
	toString() {
		return format$1(this.toJSON());
	}
};
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0-rc.112/node_modules/effect/dist/Utils.js
/**
* Yields its wrapped value exactly once through an `IterableIterator`.
*
* **When to use**
*
* Use to implement `[Symbol.iterator]()` on Effect-like types so they can be
* `yield*`-ed inside generator functions, such as `Effect.gen` and
* `Option.gen`.
*
* **Details**
*
* The first call to `next()` returns `{ value: self, done: false }`. Every
* subsequent call returns `{ value: a, done: true }` where `a` is the argument
* passed to `next()`. `[Symbol.iterator]()` returns a **new** `SingleShotGen`
* wrapping the same value, so the outer type can be iterated multiple times.
*
* **Example** (Yielding a wrapped value in a generator)
*
* ```ts import.meta.vitest
* import { Utils } from "effect"
*
* const gen = new Utils.SingleShotGen<string, number>("hello")
*
* gen.next(0) // => { value: "hello", done: false }
*
* gen.next(42) // => { value: 42, done: true }
* ```
*
* @see {@link Gen} for the type-level signature that relies on `SingleShotGen`
* @category constructors
* @since 2.0.0
*/
var SingleShotGen = class SingleShotGen {
	called = false;
	self;
	constructor(self) {
		this.self = self;
	}
	/**
	* Yields the stored value once, then completes with the value sent back in.
	*
	* **When to use**
	*
	* Use to advance a `SingleShotGen` through its single yield and completion
	* step.
	*
	* @since 2.0.0
	*/
	next(a) {
		return this.called ? {
			value: a,
			done: true
		} : (this.called = true, {
			value: this.self,
			done: false
		});
	}
	/**
	* Creates a fresh single-shot iterator over the stored value.
	*
	* **When to use**
	*
	* Use to iterate the wrapped value again without reusing the consumed
	* iterator state.
	*
	* @since 2.0.0
	*/
	[Symbol.iterator]() {
		return new SingleShotGen(this.self);
	}
};
var pickInternalCall = () => {
	const InternalTypeId = "~effect/Utils/internal";
	const standard = { [InternalTypeId]: (body) => {
		return body();
	} };
	const forced = { [InternalTypeId]: (body) => {
		try {
			return body();
		} finally {}
	} };
	return standard[InternalTypeId](() => (/* @__PURE__ */ new Error()).stack)?.includes(InternalTypeId) === true ? standard[InternalTypeId] : forced[InternalTypeId];
};
/** @internal */
var internalCall = /*#__PURE__*/ pickInternalCall();
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0-rc.112/node_modules/effect/dist/internal/core.js
/** @internal */
var EffectTypeId = `~effect/Effect`;
/** @internal */
var ExitTypeId = `~effect/Exit`;
var effectVariance = {
	_A: identity,
	_E: identity,
	_R: identity
};
/** @internal */
var identifier = `${EffectTypeId}/identifier`;
/** @internal */
var args = `${EffectTypeId}/args`;
/** @internal */
var evaluate = `${EffectTypeId}/evaluate`;
/** @internal */
var contA = `${EffectTypeId}/successCont`;
/** @internal */
var contE = `${EffectTypeId}/failureCont`;
/** @internal */
var contAll = `${EffectTypeId}/ensureCont`;
/** @internal */
var Yield = /*#__PURE__*/ Symbol.for("effect/Effect/Yield");
/** @internal */
var PipeInspectableProto = {
	pipe() {
		return pipeArguments(this, arguments);
	},
	toJSON() {
		return { ...this };
	},
	toString() {
		return format$1(this.toJSON(), {
			ignoreToString: true,
			space: 2
		});
	},
	[NodeInspectSymbol]() {
		return this.toJSON();
	}
};
/** @internal */
var StructuralProto = {
	[symbol$1]() {
		return structureKeys(this, Object.keys(this));
	},
	[symbol](that) {
		const selfKeys = Object.keys(this);
		const thatKeys = Object.keys(that);
		if (selfKeys.length !== thatKeys.length) return false;
		for (let i = 0; i < selfKeys.length; i++) if (selfKeys[i] !== thatKeys[i] || !equals$2(this[selfKeys[i]], that[selfKeys[i]])) return false;
		return true;
	}
};
/** @internal */
var EffectProto = {
	[EffectTypeId]: effectVariance,
	...PipeInspectableProto,
	[Symbol.iterator]() {
		return new SingleShotGen(this);
	},
	toJSON() {
		return {
			_id: "Effect",
			op: this[identifier],
			...args in this ? { args: this[args] } : void 0
		};
	}
};
/** @internal */
var isEffect$1 = (u) => hasProperty(u, EffectTypeId);
/** @internal */
var isExit$1 = (u) => hasProperty(u, ExitTypeId);
/** @internal */
var CauseTypeId = "~effect/Cause";
/** @internal */
var CauseReasonTypeId = "~effect/Cause/Reason";
/** @internal */
var isCause$1 = (self) => hasProperty(self, CauseTypeId);
/** @internal */
var isCauseReason = (self) => hasProperty(self, CauseReasonTypeId);
/** @internal */
var CauseImpl = class {
	[CauseTypeId];
	reasons;
	constructor(failures) {
		this[CauseTypeId] = CauseTypeId;
		this.reasons = failures;
	}
	pipe() {
		return pipeArguments(this, arguments);
	}
	toJSON() {
		return {
			_id: "Cause",
			failures: this.reasons.map((f) => f.toJSON())
		};
	}
	toString() {
		return `Cause(${format$1(this.reasons)})`;
	}
	[NodeInspectSymbol]() {
		return this.toJSON();
	}
	[symbol](that) {
		return isCause$1(that) && this.reasons.length === that.reasons.length && this.reasons.every((e, i) => equals$2(e, that.reasons[i]));
	}
	[symbol$1]() {
		return array(this.reasons);
	}
};
var annotationsMap = /*#__PURE__*/ new WeakMap();
/** @internal */
var ReasonBase = class {
	[CauseReasonTypeId];
	annotations;
	_tag;
	constructor(_tag, annotations, originalError) {
		this[CauseReasonTypeId] = CauseReasonTypeId;
		this._tag = _tag;
		if (annotations !== constEmptyAnnotations && typeof originalError === "object" && originalError !== null && annotations.size > 0) {
			const prevAnnotations = annotationsMap.get(originalError);
			if (prevAnnotations) annotations = new Map([...prevAnnotations, ...annotations]);
			annotationsMap.set(originalError, annotations);
		}
		this.annotations = annotations;
	}
	annotate(annotations, options) {
		if (annotations.mapUnsafe.size === 0) return this;
		const newAnnotations = new Map(this.annotations);
		annotations.mapUnsafe.forEach((value, key) => {
			if (options?.overwrite !== true && newAnnotations.has(key)) return;
			newAnnotations.set(key, value);
		});
		const self = Object.assign(Object.create(Object.getPrototypeOf(this)), this);
		self.annotations = newAnnotations;
		return self;
	}
	pipe() {
		return pipeArguments(this, arguments);
	}
	toString() {
		return format$1(this);
	}
	[NodeInspectSymbol]() {
		return this.toString();
	}
};
/** @internal */
var constEmptyAnnotations = /*#__PURE__*/ new Map();
/** @internal */
var Fail = class extends ReasonBase {
	error;
	constructor(error, annotations = constEmptyAnnotations) {
		super("Fail", annotations, error);
		this.error = error;
	}
	toString() {
		return `Fail(${format$1(this.error)})`;
	}
	toJSON() {
		return {
			_tag: "Fail",
			error: this.error
		};
	}
	[symbol](that) {
		return isFailReason$1(that) && equals$2(this.error, that.error) && equals$2(this.annotations, that.annotations);
	}
	[symbol$1]() {
		return combine(string(this._tag))(combine(hash(this.error))(hash(this.annotations)));
	}
};
/** @internal */
var causeFromReasons = (reasons) => new CauseImpl(reasons);
/** @internal */
var causeEmpty = /*#__PURE__*/ new CauseImpl([]);
/** @internal */
var causeFail = (error) => new CauseImpl([new Fail(error)]);
/** @internal */
var Die = class extends ReasonBase {
	defect;
	constructor(defect, annotations = constEmptyAnnotations) {
		super("Die", annotations, defect);
		this.defect = defect;
	}
	toString() {
		return `Die(${format$1(this.defect)})`;
	}
	toJSON() {
		return {
			_tag: "Die",
			defect: this.defect
		};
	}
	[symbol](that) {
		return isDieReason(that) && equals$2(this.defect, that.defect) && equals$2(this.annotations, that.annotations);
	}
	[symbol$1]() {
		return combine(string(this._tag))(combine(hash(this.defect))(hash(this.annotations)));
	}
};
/** @internal */
var causeDie = (defect) => new CauseImpl([new Die(defect)]);
/** @internal */
var causeAnnotate = /*#__PURE__*/ dual((args) => isCause$1(args[0]), (self, annotations, options) => {
	if (annotations.mapUnsafe.size === 0) return self;
	return new CauseImpl(self.reasons.map((f) => f.annotate(annotations, options)));
});
/** @internal */
var isFailReason$1 = (self) => self._tag === "Fail";
/** @internal */
var isDieReason = (self) => self._tag === "Die";
/** @internal */
var isInterruptReason = (self) => self._tag === "Interrupt";
function defaultEvaluate(_fiber) {
	return exitDie(`Effect.evaluate: Not implemented`);
}
/** @internal */
var makePrimitiveProto = (options) => ({
	...EffectProto,
	[identifier]: options.op,
	[evaluate]: options[evaluate] ?? defaultEvaluate,
	[contA]: options[contA],
	[contE]: options[contE],
	[contAll]: options[contAll]
});
/** @internal */
var makePrimitive = (options) => {
	const Proto = makePrimitiveProto(options);
	return function() {
		const self = Object.create(Proto);
		self[args] = options.single === false ? arguments : arguments[0];
		return self;
	};
};
/** @internal */
var makeExit = (options) => {
	const Proto = {
		[ExitTypeId]: ExitTypeId,
		_tag: options.op,
		get [options.prop]() {
			return this[args];
		},
		...makePrimitiveProto(options),
		toString() {
			return `${options.op}(${format$1(this[args])})`;
		},
		toJSON() {
			return {
				_id: "Exit",
				_tag: options.op,
				[options.prop]: this[args]
			};
		},
		[symbol](that) {
			return isExit$1(that) && that._tag === this._tag && equals$2(this[args], that[args]);
		},
		[symbol$1]() {
			return combine(string(options.op), hash(this[args]));
		}
	};
	return function(value) {
		const self = Object.create(Proto);
		self[args] = value;
		return self;
	};
};
/** @internal */
var exitSucceed = /*#__PURE__*/ makeExit({
	op: "Success",
	prop: "value",
	[evaluate](fiber) {
		const cont = fiber.getCont(contA);
		return cont ? cont[contA](this[args], fiber, this) : fiber.yieldWith(this);
	}
});
/** @internal */
var StackTraceKey = { key: "effect/Cause/StackTrace" };
/** @internal */
var InterruptorStackTrace = { key: "effect/Cause/InterruptorStackTrace" };
/** @internal */
var exitFailCause = /*#__PURE__*/ makeExit({
	op: "Failure",
	prop: "cause",
	[evaluate](fiber) {
		let cause = this[args];
		let annotated = false;
		if (fiber.currentStackFrame) {
			cause = causeAnnotate(cause, { mapUnsafe: /* @__PURE__ */ new Map([[StackTraceKey.key, fiber.currentStackFrame]]) });
			annotated = true;
		}
		let cont = fiber.getCont(contE);
		while (fiber.interruptible && fiber._interruptedCause && cont) cont = fiber.getCont(contE);
		return cont ? cont[contE](cause, fiber, annotated ? void 0 : this) : fiber.yieldWith(annotated ? exitFailCause(cause) : this);
	}
});
/** @internal */
var exitFail = (e) => exitFailCause(causeFail(e));
/** @internal */
var exitDie = (defect) => exitFailCause(causeDie(defect));
/** @internal */
var withFiber$1 = /*#__PURE__*/ makePrimitive({
	op: "WithFiber",
	[evaluate](fiber) {
		return this[args](fiber);
	}
});
/** @internal */
var YieldableError = /*#__PURE__*/ function() {
	class YieldableError extends globalThis.Error {}
	const proto = /*#__PURE__*/ makePrimitiveProto({
		op: "YieldableError",
		[evaluate]() {
			return exitFail(this);
		}
	});
	delete proto.toString;
	Object.assign(YieldableError.prototype, proto);
	return YieldableError;
}();
/** @internal */
var Error$2 = /*#__PURE__*/ function() {
	const plainArgsSymbol = /*#__PURE__*/ Symbol.for("effect/Data/Error/plainArgs");
	return class Base extends YieldableError {
		constructor(args) {
			super(args?.message, args?.cause ? { cause: args.cause } : void 0);
			if (args) {
				assignProperties(this, args);
				Object.defineProperty(this, plainArgsSymbol, {
					value: args,
					enumerable: false
				});
			}
		}
		toJSON() {
			return {
				...this[plainArgsSymbol],
				...this
			};
		}
	};
}();
/** @internal */
var TaggedError$1 = (tag) => {
	class Base extends Error$2 {
		_tag = tag;
	}
	Base.prototype.name = tag;
	return Base;
};
/** @internal */
var NoSuchElementErrorTypeId = "~effect/Cause/NoSuchElementError";
/** @internal */
var isNoSuchElementError = (u) => hasProperty(u, NoSuchElementErrorTypeId);
/** @internal */
var NoSuchElementError$1 = class extends (/*#__PURE__*/ TaggedError$1("NoSuchElementError")) {
	[NoSuchElementErrorTypeId] = NoSuchElementErrorTypeId;
	constructor(message) {
		super({ message });
	}
};
/** @internal */
var DoneTypeId = "~effect/Cause/Done";
/** @internal */
var isDone$1 = (u) => hasProperty(u, DoneTypeId);
var DoneVoid = {
	[DoneTypeId]: DoneTypeId,
	_tag: "Done",
	value: void 0
};
/** @internal */
var Done$1 = (value) => {
	if (value === void 0) return DoneVoid;
	return {
		[DoneTypeId]: DoneTypeId,
		_tag: "Done",
		value
	};
};
var doneVoid = /*#__PURE__*/ exitFail(DoneVoid);
/** @internal */
var done$2 = (value) => {
	if (value === void 0) return doneVoid;
	return exitFail(Done$1(value));
};
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0-rc.112/node_modules/effect/dist/internal/option.js
/**
* @since 2.0.0
*/
var TypeId$10 = "~effect/data/Option";
var CommonProto$1 = {
	[TypeId$10]: { _A: (_) => _ },
	...PipeInspectableProto,
	[Symbol.iterator]() {
		return new SingleShotGen(this);
	}
};
var SomeProto = /*#__PURE__*/ Object.defineProperty(/*#__PURE__*/ Object.assign(/*#__PURE__*/ Object.create(CommonProto$1), {
	_tag: "Some",
	_op: "Some",
	[symbol](that) {
		return isOption$1(that) && isSome$1(that) && equals$2(this.value, that.value);
	},
	[symbol$1]() {
		return combine(hash(this._tag))(hash(this.value));
	},
	toString() {
		return `some(${format$1(this.value)})`;
	},
	toJSON() {
		return {
			_id: "Option",
			_tag: this._tag,
			value: toJson(this.value)
		};
	}
}), "valueOrUndefined", { get() {
	return this.value;
} });
var NoneHash = /*#__PURE__*/ hash("None");
var NoneProto = /*#__PURE__*/ Object.assign(/*#__PURE__*/ Object.create(CommonProto$1), {
	_tag: "None",
	_op: "None",
	valueOrUndefined: void 0,
	[symbol](that) {
		return isOption$1(that) && isNone$1(that);
	},
	[symbol$1]() {
		return NoneHash;
	},
	toString() {
		return `none()`;
	},
	toJSON() {
		return {
			_id: "Option",
			_tag: this._tag
		};
	}
});
/** @internal */
var isOption$1 = (input) => hasProperty(input, TypeId$10);
/** @internal */
var isNone$1 = (fa) => fa._tag === "None";
/** @internal */
var isSome$1 = (fa) => fa._tag === "Some";
/** @internal */
var none$1 = /*#__PURE__*/ Object.create(NoneProto);
/** @internal */
var some$1 = (value) => {
	const a = Object.create(SomeProto);
	a.value = value;
	return a;
};
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0-rc.112/node_modules/effect/dist/internal/result.js
var TypeId$9 = "~effect/data/Result";
var CommonProto = {
	[TypeId$9]: {
		/* v8 ignore next 2 */
		_A: (_) => _,
		_E: (_) => _
	},
	...PipeInspectableProto,
	[Symbol.iterator]() {
		return new SingleShotGen(this);
	}
};
var SuccessProto = /*#__PURE__*/ Object.assign(/*#__PURE__*/ Object.create(CommonProto), {
	_tag: "Success",
	_op: "Success",
	[symbol](that) {
		return isResult$1(that) && isSuccess$4(that) && equals$2(this.success, that.success);
	},
	[symbol$1]() {
		return combine(hash(this._tag))(hash(this.success));
	},
	toString() {
		return `success(${format$1(this.success)})`;
	},
	toJSON() {
		return {
			_id: "Result",
			_tag: this._tag,
			value: toJson(this.success)
		};
	}
});
var FailureProto = /*#__PURE__*/ Object.assign(/*#__PURE__*/ Object.create(CommonProto), {
	_tag: "Failure",
	_op: "Failure",
	[symbol](that) {
		return isResult$1(that) && isFailure$4(that) && equals$2(this.failure, that.failure);
	},
	[symbol$1]() {
		return combine(hash(this._tag))(hash(this.failure));
	},
	toString() {
		return `failure(${format$1(this.failure)})`;
	},
	toJSON() {
		return {
			_id: "Result",
			_tag: this._tag,
			failure: toJson(this.failure)
		};
	}
});
/** @internal */
var isResult$1 = (input) => hasProperty(input, TypeId$9);
/** @internal */
var isFailure$4 = (result) => result._tag === "Failure";
/** @internal */
var isSuccess$4 = (result) => result._tag === "Success";
/** @internal */
var fail$6 = (failure) => {
	const a = Object.create(FailureProto);
	a.failure = failure;
	return a;
};
/** @internal */
var succeed$6 = (success) => {
	const a = Object.create(SuccessProto);
	a.success = success;
	return a;
};
/** @internal */
var fromOption$3 = /*#__PURE__*/ dual(2, (self, onNone) => isNone$1(self) ? fail$6(onNone()) : succeed$6(self.value));
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0-rc.112/node_modules/effect/dist/Order.js
/**
* Defines comparison functions for ordered values.
*
* An `Order<A>` compares two `A` values and returns whether the first is less
* than, equal to, or greater than the second. Orders are used for sorting,
* choosing minimum or maximum values, checking ranges, and building ordered data
* structures. This module includes built-in orders, constructors for custom
* orders, tools for reversing and combining comparisons, tuple and struct
* helpers, comparison predicates, clamping, and reducer support.
*
* @since 2.0.0
*/
/**
* Creates a new `Order` instance from a comparison function.
*
* **When to use**
*
* Use when you need a sorting rule not covered by the built-in orders or input
* mapping helpers, and you can provide a total comparison.
*
* **Details**
*
* Uses reference equality (`===`) as a shortcut: if `self === that`, it returns
* `0` without calling the comparison function. The comparison function should
* return `-1`, `0`, or `1`, and the returned order satisfies total ordering
* laws when the comparison function does.
*
* **Example** (Creating an Order)
*
* ```ts import.meta.vitest
* import { Order } from "effect"
*
* const byAge = Order.make<{ name: string; age: number }>((self, that) => {
*   if (self.age < that.age) return -1
*   if (self.age > that.age) return 1
*   return 0
* })
*
* byAge({ name: "Alice", age: 30 }, { name: "Bob", age: 25 }) // => 1
* byAge({ name: "Alice", age: 25 }, { name: "Bob", age: 30 }) // => -1
* ```
*
* @see {@link mapInput} to transform an order by mapping the input type
* @see {@link combine} to combine multiple orders
* @category constructors
* @since 2.0.0
*/
function make$8(compare) {
	return (self, that) => self === that ? 0 : compare(self, that);
}
/**
* Order instance for numbers that compares them numerically.
*
* **When to use**
*
* Use when you need numeric ordering for numbers.
*
* **Details**
*
* `0` is considered equal to `-0`. All `NaN` values are considered equal to
* each other, and any `NaN` is considered less than any non-`NaN` number. All
* other values use standard numeric comparison.
*
* **Example** (Ordering numbers)
*
* ```ts import.meta.vitest
* import { Order } from "effect"
*
* Order.Number(1, 1) // => 0
* Order.Number(1, 2) // => -1
* Order.Number(2, 1) // => 1
*
* Order.Number(0, -0) // => 0
* Order.Number(NaN, 1) // => -1
* ```
*
* @see {@link mapInput} to compare objects by a number property
* @see {@link BigInt} for bigint comparisons
* @category instances
* @since 4.0.0
*/
var Number$2 = /*#__PURE__*/ make$8((self, that) => {
	if (globalThis.Number.isNaN(self) && globalThis.Number.isNaN(that)) return 0;
	if (globalThis.Number.isNaN(self)) return -1;
	if (globalThis.Number.isNaN(that)) return 1;
	return self < that ? -1 : 1;
});
/**
* Order instance for bigints that compares them numerically.
*
* **When to use**
*
* Use when you need numeric ordering for `bigint` values.
*
* **Details**
*
* Uses standard numeric comparison for bigint values and handles arbitrarily
* large integers.
*
* **Example** (Ordering BigInts)
*
* ```ts import.meta.vitest
* import { Order } from "effect"
*
* Order.BigInt(1n, 2n) // => -1
* Order.BigInt(2n, 1n) // => 1
* Order.BigInt(1n, 1n) // => 0
* ```
*
* @see {@link Number} for regular number comparisons
* @see {@link mapInput} to compare objects by a bigint property
* @category instances
* @since 4.0.0
*/
var BigInt$1 = /*#__PURE__*/ make$8((self, that) => self < that ? -1 : 1);
/**
* Transforms an `Order` on type `A` into an `Order` on type `B` by providing a function that
* maps values of type `B` to values of type `A`.
*
* **When to use**
*
* Use when you need to adapt an `Order` to compare a larger value by one
* derived property.
*
* **Details**
*
* Applies the mapping function to both values before comparison. The mapping
* function should be pure and not have side effects so the ordering properties
* of the original order are preserved.
*
* **Example** (Mapping Input)
*
* ```ts import.meta.vitest
* import { Order } from "effect"
*
* const byLength = Order.mapInput(Order.Number, (s: string) => s.length)
*
* byLength("a", "bb") // => -1
* byLength("bb", "a") // => 1
* byLength("aa", "bb") // => 0
* ```
*
* @see {@link combine} to combine mapped orders for multi-criteria comparison
* @see {@link Struct} to create orders for structs with multiple fields
* @category mapping
* @since 2.0.0
*/
var mapInput = /*#__PURE__*/ dual(2, (self, f) => make$8((b1, b2) => self(f(b1), f(b2))));
/**
* Order instance for `Date` objects that compares them chronologically by their timestamp.
*
* **When to use**
*
* Use when you need chronological ordering for JavaScript date values.
*
* **Details**
*
* Compares dates by their underlying timestamp in milliseconds since the epoch.
* Earlier dates are less than later dates. Invalid dates are compared through
* their `getTime()` result.
*
* **Example** (Ordering Dates)
*
* ```ts import.meta.vitest
* import { Order } from "effect"
*
* const date1 = new Date("2023-01-01")
* const date2 = new Date("2023-01-02")
*
* Order.Date(date1, date2) // => -1
* Order.Date(date2, date1) // => 1
* Order.Date(date1, date1) // => 0
* ```
*
* @see {@link mapInput} to compare objects by a date property
* @category instances
* @since 2.0.0
*/
var Date$1 = /*#__PURE__*/ mapInput(Number$2, (date) => date.getTime());
/**
* Checks whether one value is strictly less than another according to the given order.
*
* **When to use**
*
* Use when you need a boolean less-than predicate using an `Order`.
*
* **Details**
*
* Returns `true` if the order returns `-1`, meaning the first value is less
* than the second. Equal or greater values return `false`.
*
* **Example** (Checking less-than comparisons)
*
* ```ts import.meta.vitest
* import { Order } from "effect"
*
* const isLessThanNumber = Order.isLessThan(Order.Number)
*
* isLessThanNumber(1, 2) // => true
* isLessThanNumber(2, 1) // => false
* isLessThanNumber(1, 1) // => false
* ```
*
* @see {@link isLessThanOrEqualTo} for non-strict less than or equal
* @see {@link isGreaterThan} for strict greater than
* @category predicates
* @since 4.0.0
*/
var isLessThan = (O) => dual(2, (self, that) => O(self, that) === -1);
/**
* Checks whether one value is strictly greater than another according to the given order.
*
* **When to use**
*
* Use when you need a boolean greater-than predicate using an `Order`.
*
* **Details**
*
* Returns `true` if the order returns `1`, meaning the first value is greater
* than the second. Equal or lesser values return `false`.
*
* **Example** (Checking greater-than comparisons)
*
* ```ts import.meta.vitest
* import { Order } from "effect"
*
* const isGreaterThanNumber = Order.isGreaterThan(Order.Number)
*
* isGreaterThanNumber(2, 1) // => true
* isGreaterThanNumber(1, 2) // => false
* isGreaterThanNumber(1, 1) // => false
* ```
*
* @see {@link isGreaterThanOrEqualTo} for non-strict greater than or equal
* @see {@link isLessThan} for strict less than
* @category predicates
* @since 4.0.0
*/
var isGreaterThan = (O) => dual(2, (self, that) => O(self, that) === 1);
/**
* Checks whether one value is less than or equal to another according to the given order.
*
* **When to use**
*
* Use when you need a boolean less-than-or-equal predicate using an `Order`.
*
* **Details**
*
* Returns `true` if the order returns `-1` or `0`, and returns `false` only if
* the order returns `1`.
*
* **Example** (Checking less-than-or-equal comparisons)
*
* ```ts import.meta.vitest
* import { Order } from "effect"
*
* const isLessThanOrEqualToNumber = Order.isLessThanOrEqualTo(Order.Number)
*
* isLessThanOrEqualToNumber(1, 2) // => true
* isLessThanOrEqualToNumber(1, 1) // => true
* isLessThanOrEqualToNumber(2, 1) // => false
* ```
*
* @see {@link isLessThan} for strict less than
* @see {@link isGreaterThan} for strict greater than
* @category predicates
* @since 4.0.0
*/
var isLessThanOrEqualTo$1 = (O) => dual(2, (self, that) => O(self, that) !== 1);
/**
* Checks whether one value is greater than or equal to another according to the given order.
*
* **When to use**
*
* Use when you need a boolean greater-than-or-equal predicate using an
* `Order`.
*
* **Details**
*
* Returns `true` if the order returns `1` or `0`, and returns `false` only if
* the order returns `-1`.
*
* **Example** (Checking greater-than-or-equal comparisons)
*
* ```ts import.meta.vitest
* import { Order } from "effect"
*
* const isGreaterThanOrEqualToNumber = Order.isGreaterThanOrEqualTo(Order.Number)
*
* isGreaterThanOrEqualToNumber(2, 1) // => true
* isGreaterThanOrEqualToNumber(1, 1) // => true
* isGreaterThanOrEqualToNumber(1, 2) // => false
* ```
*
* @see {@link isGreaterThan} for strict greater than
* @see {@link isLessThanOrEqualTo} for less than or equal
* @category predicates
* @since 4.0.0
*/
var isGreaterThanOrEqualTo = (O) => dual(2, (self, that) => O(self, that) !== -1);
/**
* Returns the minimum of two values according to the given order. If they are equal, returns the first argument.
*
* **When to use**
*
* Use when you need to select the smaller of two values according to an
* `Order`.
*
* **Details**
*
* Returns the value that compares as less than or equal to the other value. If
* values are equal, the first argument is returned.
*
* **Example** (Selecting the minimum value)
*
* ```ts import.meta.vitest
* import { Order } from "effect"
*
* const minNumber = Order.min(Order.Number)
*
* minNumber(1, 2) // => 1
* minNumber(2, 1) // => 1
* minNumber(1, 1) // => 1
* ```
*
* @see {@link max} for the maximum of two values
* @see {@link clamp} to clamp a value between min and max
* @category comparisons
* @since 2.0.0
*/
var min$2 = (O) => dual(2, (self, that) => self === that || O(self, that) < 1 ? self : that);
/**
* Returns the maximum of two values according to the given order. If they are equal, returns the first argument.
*
* **When to use**
*
* Use when you need to select the larger of two values according to an
* `Order`.
*
* **Details**
*
* Returns the value that compares as greater than or equal to the other value.
* If values are equal, the first argument is returned.
*
* **Example** (Selecting the maximum value)
*
* ```ts import.meta.vitest
* import { Order } from "effect"
*
* const maxNumber = Order.max(Order.Number)
*
* maxNumber(1, 2) // => 2
* maxNumber(2, 1) // => 2
* maxNumber(1, 1) // => 1
* ```
*
* @see {@link min} for the minimum of two values
* @see {@link clamp} to clamp a value between min and max
* @category comparisons
* @since 2.0.0
*/
var max$2 = (O) => dual(2, (self, that) => self === that || O(self, that) > -1 ? self : that);
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0-rc.112/node_modules/effect/dist/Option.js
/**
* Creates an `Option` representing the absence of a value.
*
* **When to use**
*
* Use to represent a missing or uninitialized value, such as returning "no
* result" from a function.
*
* **Details**
*
* - Returns `Option<never>`, which is a subtype of `Option<A>` for any `A`
* - Always returns the same singleton instance
*
* **Example** (Creating an empty Option)
*
* ```ts import.meta.vitest
* import { Option } from "effect"
*
* //      ┌─── Option<never>
* //      ▼
* const noValue = Option.none() // => Option.none()
* ```
*
* @see {@link some} for the opposite operation.
*
* @category constructors
* @since 2.0.0
*/
var none = () => none$1;
/**
* Wraps the given value into an `Option` to represent its presence.
*
* **When to use**
*
* Use to wrap a known present value as `Option`
* - Returning a successful result from a partial function
*
* **Details**
*
* - Always returns `Some<A>`
* - Does not filter `null` or `undefined`; use {@link fromNullishOr} for that
*
* **Example** (Wrapping a value)
*
* ```ts import.meta.vitest
* import { Option } from "effect"
*
* //      ┌─── Option<number>
* //      ▼
* const value = Option.some(1) // => Option.some(1)
* ```
*
* @see {@link none} for the opposite operation.
*
* @category constructors
* @since 2.0.0
*/
var some = some$1;
/**
* Determines whether the given value is an `Option`.
*
* **When to use**
*
* Use to validate unknown values at runtime boundaries, such as type-narrowing
* in union types.
*
* **Details**
*
* - Returns `true` for both `Some` and `None` instances
* - Acts as a type guard, narrowing the input to `Option<unknown>`
*
* **Example** (Checking if a value is an Option)
*
* ```ts import.meta.vitest
* import { Option } from "effect"
*
* Option.isOption(Option.some(1)) // => true
* Option.isOption(Option.none()) // => true
* Option.isOption({}) // => false
* ```
*
* @see {@link isNone} to check for `None` specifically
* @see {@link isSome} to check for `Some` specifically
*
* @category guards
* @since 2.0.0
*/
var isOption = isOption$1;
/**
* Checks whether an `Option` is `None` (absent).
*
* **When to use**
*
* Use when you need to branch on an absent `Option` before accessing `.value`.
*
* **Details**
*
* - Acts as a type guard, narrowing to `None<A>`
*
* **Example** (Checking for None)
*
* ```ts import.meta.vitest
* import { Option } from "effect"
*
* Option.isNone(Option.some(1)) // => false
* Option.isNone(Option.none()) // => true
* ```
*
* @see {@link isSome} for the opposite check.
*
* @category guards
* @since 2.0.0
*/
var isNone = isNone$1;
/**
* Checks whether an `Option` contains a value (`Some`).
*
* **When to use**
*
* Use when you need to branch on a present `Option` before accessing `.value`.
*
* **Details**
*
* - Acts as a type guard, narrowing to `Some<A>`
*
* **Example** (Checking for Some)
*
* ```ts import.meta.vitest
* import { Option } from "effect"
*
* Option.isSome(Option.some(1)) // => true
* Option.isSome(Option.none()) // => false
* ```
*
* @see {@link isNone} for the opposite check.
*
* @category guards
* @since 2.0.0
*/
var isSome = isSome$1;
/**
* Pattern-matches on an `Option`, handling both `None` and `Some` cases.
*
* **When to use**
*
* Use when you need to handle both `Some` and `None` in one expression and
* transform an `Option` into a plain value.
*
* **Details**
*
* - If `None`, calls `onNone` and returns its result
* - If `Some`, calls `onSome` with the value and returns its result
* - Supports the `dual` API (data-last and data-first)
*
* **Example** (Matching on an Option)
*
* ```ts import.meta.vitest
* import { Option } from "effect"
*
* Option.match(Option.some(1), {
*   onNone: () => "Option is empty",
*   onSome: (value) => `Option has a value: ${value}`
* }) // => "Option has a value: 1"
* ```
*
* @see {@link getOrElse} for unwrapping with a default
*
* @category pattern matching
* @since 2.0.0
*/
var match$5 = /*#__PURE__*/ dual(2, (self, { onNone, onSome }) => isNone(self) ? onNone() : onSome(self.value));
/**
* Extracts the value from a `Some`, or evaluates a fallback thunk on `None`.
*
* **When to use**
*
* Use when providing a default value for an absent `Option`
* - Unwrapping with lazy evaluation of the fallback
*
* **Details**
*
* - `Some` → returns the inner value
* - `None` → calls `onNone()` and returns its result
* - `onNone` is only called when needed (lazy)
*
* **Example** (Unwrapping with a fallback)
*
* ```ts import.meta.vitest
* import { Option } from "effect"
*
* Option.some(1).pipe(Option.getOrElse(() => 0)) // => 1
* Option.none().pipe(Option.getOrElse(() => 0)) // => 0
* ```
*
* @see {@link getOrNull} to fall back to `null`
* @see {@link getOrUndefined} to fall back to `undefined`
* @see {@link getOrThrow} to throw on `None`
*
* @category getters
* @since 2.0.0
*/
var getOrElse$1 = /*#__PURE__*/ dual(2, (self, onNone) => isNone(self) ? onNone() : self.value);
/**
* Returns the fallback `Option` if `self` is `None`; otherwise returns `self`.
*
* **When to use**
*
* Use when you need a lazy fallback `Option`, such as when building priority
* chains of optional values.
*
* **Details**
*
* - `Some` → returns `self` unchanged
* - `None` → evaluates and returns `that()`
* - `that` is lazily evaluated
*
* **Example** (Providing a fallback Option)
*
* ```ts import.meta.vitest
* import { Option } from "effect"
*
* Option.none().pipe(Option.orElse(() => Option.some("b"))) // => Option.some("b")
* Option.some("a").pipe(Option.orElse(() => Option.some("b"))) // => Option.some("a")
* ```
*
* @see {@link orElseSome} to wrap the fallback value in `Some` automatically
* @see {@link firstSomeOf} to pick the first `Some` from a collection
*
* @category error handling
* @since 2.0.0
*/
var orElse = /*#__PURE__*/ dual(2, (self, that) => isNone(self) ? that() : self);
/**
* Converts a nullable value (`null` or `undefined`) into an `Option`.
*
* **When to use**
*
* Use when you need JavaScript nullish values to become absence at an API
* boundary while all other values, including falsy ones, remain present.
*
* **Details**
*
* - `null` or `undefined` → `None`
* - Any other value → `Some` (typed as `NonNullable<A>`)
*
* **Example** (Converting nullable values to an Option)
*
* ```ts import.meta.vitest
* import { Option } from "effect"
*
* Option.fromNullishOr(undefined) // => Option.none()
* Option.fromNullishOr(null) // => Option.none()
* Option.fromNullishOr(1) // => Option.some(1)
* ```
*
* @see {@link fromNullOr} to only treat `null` as absent
* @see {@link fromUndefinedOr} to only treat `undefined` as absent
* @see {@link liftNullishOr} to lift a nullable-returning function
*
* @category converting
* @since 4.0.0
*/
var fromNullishOr$2 = (a) => a == null ? none() : some(a);
/**
* Converts a possibly `undefined` value into an `Option`, leaving `null`
* as a valid `Some`.
*
* **When to use**
*
* Use when you want to treat only `undefined` as absent while preserving `null`
* as a meaningful value.
*
* **Details**
*
* - `undefined` → `None`
* - Any other value (including `null`) → `Some`
*
* **Example** (Converting possibly undefined values to an Option)
*
* ```ts import.meta.vitest
* import { Option } from "effect"
*
* Option.fromUndefinedOr(undefined) // => Option.none()
* Option.fromUndefinedOr(null) // => Option.some(null)
* Option.fromUndefinedOr(42) // => Option.some(42)
* ```
*
* @see {@link fromNullishOr} to treat both `null` and `undefined` as absent
* @see {@link fromNullOr} to only treat `null` as absent
*
* @category converting
* @since 4.0.0
*/
var fromUndefinedOr = (a) => a === void 0 ? none() : some(a);
/**
* Converts a possibly `null` value into an `Option`, leaving `undefined`
* as a valid `Some`.
*
* **When to use**
*
* Use when you want to treat only `null` as absent while preserving
* `undefined` as a meaningful value.
*
* **Details**
*
* - `null` → `None`
* - Any other value (including `undefined`) → `Some`
*
* **Example** (Converting possibly null values to an Option)
*
* ```ts import.meta.vitest
* import { Option } from "effect"
*
* Option.fromNullOr(null) // => Option.none()
* Option.fromNullOr(undefined) // => Option.some(undefined)
* Option.fromNullOr(42) // => Option.some(42)
* ```
*
* @see {@link fromNullishOr} to treat both `null` and `undefined` as absent
* @see {@link fromUndefinedOr} to only treat `undefined` as absent
*
* @category converting
* @since 4.0.0
*/
var fromNullOr = (a) => a === null ? none() : some(a);
/**
* Extracts the value from a `Some`, or returns `null` for `None`.
*
* **When to use**
*
* Use when you need to pass absent `Option` values to APIs that expect `null`.
*
* **Details**
*
* - `Some` → the inner value
* - `None` → `null`
*
* **Example** (Unwrapping to null)
*
* ```ts import.meta.vitest
* import { Option } from "effect"
*
* Option.getOrNull(Option.some(1)) // => 1
* Option.getOrNull(Option.none()) // => null
* ```
*
* @see {@link getOrUndefined} to return `undefined` instead
* @see {@link getOrElse} for a custom fallback
*
* @category getters
* @since 2.0.0
*/
var getOrNull = /*#__PURE__*/ getOrElse$1(constNull);
/**
* Extracts the value from a `Some`, or returns `undefined` for `None`.
*
* **When to use**
*
* Use when you need to pass absent `Option` values to APIs that expect
* `undefined`.
*
* **Details**
*
* - `Some` → the inner value
* - `None` → `undefined`
*
* **Example** (Unwrapping to undefined)
*
* ```ts import.meta.vitest
* import { Option } from "effect"
*
* Option.getOrUndefined(Option.some(1)) // => 1
* Option.getOrUndefined(Option.none()) // => undefined
* ```
*
* @see {@link getOrNull} to return `null` instead
* @see {@link getOrElse} for a custom fallback
*
* @category getters
* @since 2.0.0
*/
var getOrUndefined$1 = /*#__PURE__*/ getOrElse$1(constUndefined);
/**
* Lifts a function that may throw into one that returns an `Option`.
*
* **When to use**
*
* Use to wrap exception-throwing APIs (e.g. `JSON.parse`) for safe usage
*
* **Details**
*
* - If the function returns normally → `Some` with the result
* - If the function throws → `None` (exception is swallowed)
*
* **Example** (Lifting JSON.parse)
*
* ```ts import.meta.vitest
* import { Option } from "effect"
*
* const parse = Option.liftThrowable(JSON.parse)
*
* parse("1") // => Option.some(1)
* parse("") // => Option.none()
* ```
*
* @see {@link liftNullishOr} for nullable-returning functions
*
* @category converting
* @since 2.0.0
*/
var liftThrowable = (f) => (...a) => {
	try {
		return some(f(...a));
	} catch {
		return none();
	}
};
/**
* Extracts the value from a `Some`, or throws a default `Error` for `None`.
*
* **When to use**
*
* Use when you need quick fail-fast unwrapping of an `Option` and a generic
* error is acceptable.
*
* **Details**
*
* - `Some` → returns the inner value
* - `None` → throws `new Error("getOrThrow called on a None")`
*
* **Example** (Throwing a default error)
*
* ```ts import.meta.vitest
* import { Option, Result } from "effect"
*
* Option.getOrThrow(Option.some(1)) // => 1
*
* const failure = Result.try({
*   try: () => Option.getOrThrow(Option.none()),
*   catch: (error) => (error as Error).message
* })
* Result.getFailure(failure).pipe(Option.getOrElse(() => "no error")) // => "getOrThrow called on a None"
* ```
*
* @see {@link getOrThrowWith} for a custom error
* @see {@link getOrElse} for a non-throwing alternative
*
* @category converting
* @since 2.0.0
*/
var getOrThrow = /*#__PURE__*/ (/* @__PURE__ */ dual(2, (self, onNone) => {
	if (isSome(self)) return self.value;
	throw onNone();
}))(() => /* @__PURE__ */ new Error("getOrThrow called on a None"));
/**
* Transforms the value inside a `Some` using the provided function, leaving
* `None` unchanged.
*
* **When to use**
*
* Use to apply a pure transformation to an `Option`'s present value, especially
* when chaining transformations in a pipeline.
*
* **Details**
*
* - `Some` → applies `f` and wraps the result in a new `Some`
* - `None` → returns `None` unchanged
*
* **Example** (Mapping over an Option)
*
* ```ts import.meta.vitest
* import { Option } from "effect"
*
* Option.map(Option.some(2), (n) => n * 2) // => Option.some(4)
* Option.map(Option.none(), (n: number) => n * 2) // => Option.none()
* ```
*
* @see {@link flatMap} when `f` returns an `Option`
* @see {@link as} to replace the value with a constant
*
* @category mapping
* @since 2.0.0
*/
var map$7 = /*#__PURE__*/ dual(2, (self, f) => isNone(self) ? none() : some(f(self.value)));
/**
* Applies a function that returns an `Option` to the value of a `Some`,
* flattening the result. Returns `None` if the input is `None`.
*
* **When to use**
*
* Use when you need to chain dependent `Option` computations where each step
* may return `None`.
*
* **Details**
*
* - `Some` → applies `f` to the value and returns its `Option` result
* - `None` → returns `None` without calling `f`
* - Equivalent to `map` followed by {@link flatten}
*
* **Example** (Chaining optional lookups)
*
* ```ts import.meta.vitest
* import { Option } from "effect"
*
* interface User {
*   readonly name: string
*   readonly address: Option.Option<{ readonly street: Option.Option<string> }>
* }
*
* const user: User = {
*   name: "John",
*   address: Option.some({ street: Option.some("123 Main St") })
* }
*
* user.address.pipe(
*   Option.flatMap((addr) => addr.street)
* ) // => Option.some("123 Main St")
* ```
*
* @see {@link map} when `f` returns a plain value
* @see {@link andThen} for a more flexible variant
* @see {@link flatten} to unwrap a nested `Option<Option<A>>`
*
* @category sequencing
* @since 2.0.0
*/
var flatMap$4 = /*#__PURE__*/ dual(2, (self, f) => isNone(self) ? none() : f(self.value));
/**
* Flattens a nested `Option<Option<A>>` into `Option<A>`.
*
* **When to use**
*
* Use when you need to remove one layer of nested `Option`.
*
* **Details**
*
* - `Some(Some(value))` → `Some(value)`
* - `Some(None)` → `None`
* - `None` → `None`
*
* **Example** (Flattening nested Options)
*
* ```ts import.meta.vitest
* import { Option } from "effect"
*
* Option.flatten(Option.some(Option.some("value"))) // => Option.some("value")
* Option.flatten(Option.some(Option.none())) // => Option.none()
* ```
*
* @see {@link flatMap} which is `map` + `flatten`
*
* @category sequencing
* @since 2.0.0
*/
var flatten$4 = /*#__PURE__*/ flatMap$4(identity);
/**
* Filters an `Option` using a predicate. Returns `None` if the predicate is
* not satisfied or the input is `None`.
*
* **When to use**
*
* Use when you need to discard an `Option`'s present value when it does not
* meet a condition, while narrowing the type via a refinement predicate.
*
* **Details**
*
* - `None` → `None`
* - `Some` where `predicate(value)` is `true` → `Some(value)`
* - `Some` where `predicate(value)` is `false` → `None`
* - Supports refinements for type narrowing
*
* **Example** (Filtering with a predicate)
*
* ```ts import.meta.vitest
* import { Option } from "effect"
*
* const removeEmpty = (input: Option.Option<string>) =>
*   Option.filter(input, (value) => value !== "")
*
* removeEmpty(Option.some("hello")) // => Option.some("hello")
* removeEmpty(Option.some("")) // => Option.none()
* removeEmpty(Option.none()) // => Option.none()
* ```
*
* @see {@link filterMap} to transform and filter simultaneously
* @see {@link exists} to test without filtering
*
* @category filtering
* @since 2.0.0
*/
var filter$4 = /*#__PURE__*/ dual(2, (self, predicate) => isNone(self) ? none() : predicate(self.value) ? some(self.value) : none());
/**
* Creates an `Equivalence` for `Option<A>` from an `Equivalence` for `A`.
*
* **When to use**
*
* Use when you need equality to treat two `None` values as equal and compare
* two `Some` values with a supplied equality rule.
*
* **Details**
*
* - `None` vs `None` → `true`
* - `Some` vs `None` (or vice versa) → `false`
* - `Some(a)` vs `Some(b)` → delegates to the provided `Equivalence`
*
* **Example** (Comparing Options)
*
* ```ts import.meta.vitest
* import { Equivalence, Option } from "effect"
*
* const eq = Option.makeEquivalence(Equivalence.strictEqual<number>())
*
* eq(Option.some(1), Option.some(1)) // => true
* eq(Option.some(1), Option.some(2)) // => false
* eq(Option.none(), Option.none()) // => true
* ```
*
* @category instances
* @since 4.0.0
*/
var makeEquivalence$4 = (isEquivalent) => make$10((x, y) => isNone(x) ? isNone(y) : isNone(y) ? false : isEquivalent(x.value, y.value));
/**
* Checks whether the value in a `Some` satisfies a predicate or refinement.
*
* **When to use**
*
* Use to check a condition on an optional value without unwrapping
*
* **Details**
*
* - `None` → `false`
* - `Some` where `predicate(value)` is `true` → `true`
* - `Some` where `predicate(value)` is `false` → `false`
* - With a refinement, narrows the `Option` type on `true`
*
* **Example** (Testing a condition)
*
* ```ts import.meta.vitest
* import { Option } from "effect"
*
* const isEven = (n: number) => n % 2 === 0
*
* Option.some(2).pipe(Option.exists(isEven)) // => true
* Option.some(1).pipe(Option.exists(isEven)) // => false
* Option.none().pipe(Option.exists(isEven)) // => false
* ```
*
* @see {@link filter} to keep or discard based on a predicate
* @see {@link contains} to test for a specific value
*
* @category predicates
* @since 2.0.0
*/
var exists = /*#__PURE__*/ dual(2, (self, refinement) => isNone(self) ? false : refinement(self.value));
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0-rc.112/node_modules/effect/dist/Result.js
/**
* Models a value that has already succeeded or failed.
*
* A `Result<A, E>` is `Success<A, E>` when a value is available and
* `Failure<A, E>` when an error is available. It is plain data, so inspecting
* or transforming it does not run side effects. This module includes helpers
* for creating, checking, mapping, combining, and extracting results, plus
* conversions to and from `Option` and nullable values.
*
* @since 4.0.0
*/
/**
* Creates a `Result` holding a `Success` value.
*
* **Details**
*
* - Use when you have a value and want to lift it into the `Result` type
* - The error type `E` defaults to `never`
*
* **Example** (Wrapping a value)
*
* ```ts import.meta.vitest
* import { Result } from "effect"
*
* Result.succeed(42) // => Result.succeed(42)
* ```
*
* @see {@link fail} to create a Failure
* @see {@link void_ void} for a pre-built `Success<void>`
*
* @category constructors
* @since 4.0.0
*/
var succeed$5 = succeed$6;
/**
* Creates a `Result` holding a `Failure` value.
*
* **When to use**
*
* Use to represent a failed `Result` with a typed failure value.
*
* **Details**
*
* - The success type `A` defaults to `never`
*
* **Example** (Creating a failure)
*
* ```ts import.meta.vitest
* import { Result } from "effect"
*
* Result.fail("Something went wrong") // => Result.fail("Something went wrong")
* ```
*
* @see {@link succeed} to create a Success
* @see {@link mapError} to transform the error
*
* @category constructors
* @since 4.0.0
*/
var fail$5 = fail$6;
/**
* Converts an `Option<A>` into a `Result<A, E>`.
*
* **When to use**
*
* Use when an existing `Option` should become a `Result`, preserving `Some` as
* success and turning `None` into a caller-provided failure.
*
* **Details**
*
* - `Some<A>` becomes `Success<A>`
* - `None` becomes `Failure<E>` using the provided function
* - Supports both data-first and data-last (piped) usage
*
* **Example** (Converting an Option to a Result)
*
* ```ts import.meta.vitest
* import { Option, Result } from "effect"
*
* Result.fromOption(Option.some(1), () => "missing") // => Result.succeed(1)
*
* Result.fromOption(Option.none(), () => "missing") // => Result.fail("missing")
* ```
*
* @see {@link getSuccess} to extract the success value as an Option
* @see {@link getFailure} to extract the failure value as an Option
* @see {@link fromNullishOr} to build a Result from nullable values
*
* @category constructors
* @since 2.0.0
*/
var fromOption$2 = fromOption$3;
var try_$2 = (evaluate) => {
	if (isFunction(evaluate)) try {
		return succeed$5(evaluate());
	} catch (e) {
		return fail$5(e);
	}
	else try {
		return succeed$5(evaluate.try());
	} catch (e) {
		return fail$5(evaluate.catch(e));
	}
};
/**
* Checks whether a value is a `Result` (either `Success` or `Failure`).
*
* **When to use**
*
* Use to validate unknown input before operating on it as a `Result`.
*
* **Details**
*
* - Returns `true` for both `Success` and `Failure` variants
* - Acts as a TypeScript type guard, narrowing to `Result<unknown, unknown>`
*
* **Example** (Checking if a value is a Result)
*
* ```ts import.meta.vitest
* import { Result } from "effect"
*
* Result.isResult(Result.succeed(1)) // => true
*
* Result.isResult({ value: 1 }) // => false
* ```
*
* @see {@link isSuccess} / {@link isFailure} to narrow to a specific variant
*
* @category guards
* @since 4.0.0
*/
var isResult = isResult$1;
/**
* Checks whether a `Result` is a `Failure`.
*
* **When to use**
*
* Use to narrow a known `Result` to the `Failure` variant.
*
* **Details**
*
* - Acts as a TypeScript type guard, narrowing to `Failure<A, E>`
* - After narrowing, you can access `.failure` to read the error value
*
* **Example** (Narrowing to failure)
*
* ```ts import.meta.vitest
* import { Result } from "effect"
*
* const result = Result.fail("oops")
*
* if (Result.isFailure(result)) {
*   result.failure // => "oops"
* }
* ```
*
* @see {@link isSuccess} for the opposite check
* @see {@link isResult} to check if a value is any Result
*
* @category guards
* @since 4.0.0
*/
var isFailure$3 = isFailure$4;
/**
* Checks whether a `Result` is a `Success`.
*
* **When to use**
*
* Use to narrow a known `Result` to the `Success` variant.
*
* **Details**
*
* - Acts as a TypeScript type guard, narrowing to `Success<A, E>`
* - After narrowing, you can access `.success` to read the value
*
* **Example** (Narrowing to success)
*
* ```ts import.meta.vitest
* import { Result } from "effect"
*
* const result = Result.succeed(42)
*
* if (Result.isSuccess(result)) {
*   result.success // => 42
* }
* ```
*
* @see {@link isFailure} for the opposite check
* @see {@link isResult} to check if a value is any Result
*
* @category guards
* @since 4.0.0
*/
var isSuccess$3 = isSuccess$4;
/**
* Creates an `Equivalence` for comparing two `Result` values.
*
* **Details**
*
* - Two `Success` values are equal when the `success` equivalence says so
* - Two `Failure` values are equal when the `failure` equivalence says so
* - A `Success` and a `Failure` are never equal
*
* **Example** (Comparing Results for equality)
*
* ```ts import.meta.vitest
* import { Equivalence, Result } from "effect"
*
* const eq = Result.makeEquivalence(
*   Equivalence.strictEqual<number>(),
*   Equivalence.strictEqual<string>()
* )
*
* eq(Result.succeed(1), Result.succeed(1)) // => true
*
* eq(Result.succeed(1), Result.fail("x")) // => false
* ```
*
* @category instances
* @since 4.0.0
*/
var makeEquivalence$3 = (success, failure) => make$10((x, y) => isFailure$3(x) ? isFailure$3(y) && failure(x.failure, y.failure) : isSuccess$3(y) && success(x.success, y.success));
/**
* Transforms the failure channel of a `Result`, leaving the success channel unchanged.
*
* **When to use**
*
* Use to transform only the failure channel while preserving success values.
*
* **Details**
*
* - If the result is a `Failure`, applies `f` to the error and returns a new `Failure`
* - If the result is a `Success`, returns it as-is
*
* **Example** (Adding context to an error)
*
* ```ts import.meta.vitest
* import { pipe, Result } from "effect"
*
* pipe(
*   Result.fail("not found"),
*   Result.mapError((e) => `Error: ${e}`)
* ) // => Result.fail("Error: not found")
* ```
*
* @see {@link map} to transform only the success value
* @see {@link mapBoth} to transform both channels
*
* @category mapping
* @since 4.0.0
*/
var mapError$2 = /*#__PURE__*/ dual(2, (self, f) => isFailure$3(self) ? fail$5(f(self.failure)) : self);
/**
* Transforms the success channel of a `Result`, leaving the failure channel unchanged.
*
* **When to use**
*
* Use to apply a transformation to the success value of a `Result` while
* preserving any existing failure.
*
* **Details**
*
* - If the result is a `Success`, applies `f` to the value and returns a new `Success`
* - If the result is a `Failure`, returns it as-is
* - Use {@link flatMap} if `f` returns a `Result` (to avoid nested Results)
*
* **Example** (Doubling the success value)
*
* ```ts import.meta.vitest
* import { pipe, Result } from "effect"
*
* pipe(
*   Result.succeed(3),
*   Result.map((n) => n * 2)
* ) // => Result.succeed(6)
* ```
*
* @see {@link mapError} to transform only the error value
* @see {@link mapBoth} to transform both channels
* @see {@link flatMap} when `f` returns a `Result`
*
* @category mapping
* @since 2.0.0
*/
var map$6 = /*#__PURE__*/ dual(2, (self, f) => isSuccess$3(self) ? succeed$5(f(self.success)) : self);
/**
* Folds a `Result` into a single value by applying one of two functions.
*
* **When to use**
*
* Use when a `Result`'s success and failure branches should be collapsed into
* one plain output type.
*
* **Details**
*
* - Applies `onSuccess` if the result is a `Success`
* - Applies `onFailure` if the result is a `Failure`
* - Both branches must return the same type (or a common supertype)
*
* **Example** (Folding to a string)
*
* ```ts import.meta.vitest
* import { pipe, Result } from "effect"
*
* const format = Result.match({
*   onSuccess: (n: number) => `Got ${n}`,
*   onFailure: (e: string) => `Err: ${e}`
* })
*
* format(Result.succeed(42)) // => "Got 42"
*
* format(Result.fail("timeout")) // => "Err: timeout"
* ```
*
* @see {@link merge} to extract `A | E` without mapping
* @see {@link getOrElse} to unwrap only the success with a fallback
*
* @category pattern matching
* @since 2.0.0
*/
var match$4 = /*#__PURE__*/ dual(2, (self, { onFailure, onSuccess }) => isFailure$3(self) ? onFailure(self.failure) : onSuccess(self.success));
/**
* Unwraps a `Result` into `A | E` by returning the inner value regardless
* of whether it is a success or failure.
*
* **Details**
*
* - `Success<A>` returns `A`
* - `Failure<E>` returns `E`
* - Useful when both channels share a compatible type
*
* **Example** (Extracting the inner value)
*
* ```ts import.meta.vitest
* import { Result } from "effect"
*
* Result.merge(Result.succeed(42)) // => 42
*
* Result.merge(Result.fail("error")) // => "error"
* ```
*
* @see {@link match} to map each branch to a common type
* @see {@link getOrElse} to provide a fallback for failures
*
* @category getters
* @since 2.0.0
*/
var merge$2 = /*#__PURE__*/ match$4({
	onFailure: identity,
	onSuccess: identity
});
/**
* Extracts the success value, or computes a fallback from the error.
*
* **When to use**
*
* Use when you need the success value from a `Result`, with a fallback computed
* from the failure value.
*
* **Details**
*
* - `Success<A>` returns the inner value
* - `Failure<E>` applies `onFailure` to the error and returns the result
* - The return type is `A | A2` (union of both branches)
*
* **Example** (Providing a fallback)
*
* ```ts import.meta.vitest
* import { Result } from "effect"
*
* Result.getOrElse(Result.succeed(1), () => 0) // => 1
*
* Result.getOrElse(Result.fail("err"), () => 0) // => 0
* ```
*
* @see {@link getOrNull} / {@link getOrUndefined} for simpler fallbacks
* @see {@link getOrThrow} to throw on failure
* @see {@link match} to map both branches
* @see {@link orElse} to recover with another Result instead of unwrapping
*
* @category getters
* @since 2.0.0
*/
var getOrElse = /*#__PURE__*/ dual(2, (self, onFailure) => isFailure$3(self) ? onFailure(self.failure) : self.success);
/**
* Chains a function that returns a `Result` onto a successful value.
*
* **When to use**
*
* Use to sequence `Result`-returning computations that should short-circuit on
* failure.
*
* **Details**
*
* - If `self` is a `Success`, applies `f` to the value and returns the resulting `Result`
* - If `self` is a `Failure`, short-circuits and returns it unchanged
* - The error types are merged into a union (`E | E2`)
* - This is the monadic `bind` / `>>=` for `Result`
*
* **Example** (Validating sequentially)
*
* ```ts import.meta.vitest
* import { pipe, Result } from "effect"
*
* pipe(
*   Result.succeed(5),
*   Result.flatMap((n) =>
*     n > 0 ? Result.succeed(n * 2) : Result.fail("not positive")
*   )
* ) // => Result.succeed(10)
* ```
*
* @see {@link andThen} for a more flexible variant that also accepts plain values
* @see {@link map} when `f` does not return a `Result`
*
* @category sequencing
* @since 2.0.0
*/
var flatMap$3 = /*#__PURE__*/ dual(2, (self, f) => isFailure$3(self) ? fail$5(self.failure) : f(self.success));
/**
* Collects a structure of `Result`s into a single `Result` of collected values.
*
* **When to use**
*
* Use to collect independent `Result` values into one `Result` while preserving
* the original structure.
*
* **Details**
*
* Accepts:
* - A tuple/array: returns `Result` with a tuple/array of success values
* - A struct (record): returns `Result` with a struct of success values
* - An iterable: returns `Result` with an array of success values
*
* Short-circuits on the first `Failure` encountered; later elements are not inspected.
*
* **Example** (Collecting a tuple and a struct)
*
* ```ts import.meta.vitest
* import { Result } from "effect"
*
* // Tuple
* Result.all([Result.succeed(1), Result.succeed("two")]) // => Result.succeed([1, "two"])
*
* // Struct
* Result.all({ x: Result.succeed(1), y: Result.fail("err") }) // => Result.fail("err")
* ```
*
* @see {@link flatMap} for chaining two Results sequentially
* @see {@link gen} for generator-based composition of multiple Results
*
* @category sequencing
* @since 2.0.0
*/
var all$2 = (input) => {
	if (Symbol.iterator in input) {
		const out = [];
		for (const e of input) {
			if (isFailure$3(e)) return e;
			out.push(e.success);
		}
		return succeed$5(out);
	}
	const out = {};
	for (const key of Object.keys(input)) {
		const e = input[key];
		if (isFailure$3(e)) return e;
		assignProperty$1(out, key, e.success);
	}
	return succeed$5(out);
};
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0-rc.112/node_modules/effect/dist/Tuple.js
/**
* Creates an `Equivalence` for tuples by comparing corresponding elements
* using the provided per-position `Equivalence`s. Two tuples are equivalent
* when all their corresponding elements are equivalent.
*
* **When to use**
*
* Use when you need an `Equivalence` to compare tuples element-by-element.
*
* **Details**
*
* This is an alias of `Equivalence.Tuple`.
*
* **Example** (Comparing tuples for equivalence)
*
* ```ts import.meta.vitest
* import { Equivalence, Tuple } from "effect"
*
* const eq = Tuple.makeEquivalence([
*   Equivalence.strictEqual<string>(),
*   Equivalence.strictEqual<number>()
* ])
*
* eq(["Alice", 30], ["Alice", 30]) // => true
* eq(["Alice", 30], ["Bob", 30]) // => false
* ```
*
* @see {@link makeOrder} – create an `Order` for tuples
* @category instances
* @since 4.0.0
*/
var makeEquivalence$2 = Tuple;
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0-rc.112/node_modules/effect/dist/Iterable.js
/**
* Creates an iterable by applying a function to consecutive integers.
*
* **Details**
*
* The function is called with each index starting from `0`. If no length is
* specified, the iterable is infinite. This is useful for generating
* sequences, patterns, or any indexed data.
*
* **Example** (Generating values by index)
*
* ```ts import.meta.vitest
* import { Iterable } from "effect"
*
* // Generate first 5 even numbers
* const evens = Iterable.makeBy((n) => n * 2, { length: 5 })
* Array.from(evens) // => [0, 2, 4, 6, 8]
*
* // Generate squares
* const squares = Iterable.makeBy((n) => n * n, { length: 4 })
* Array.from(squares) // => [0, 1, 4, 9]
*
* // Infinite sequence (be careful when consuming!)
* const naturals = Iterable.makeBy((n) => n)
* const first10 = Iterable.take(naturals, 10)
* Array.from(first10) // => [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
* ```
*
* @category constructors
* @since 2.0.0
*/
var makeBy$1 = (f, options) => {
	const max = options?.length !== void 0 ? Math.max(1, Math.floor(options.length)) : Infinity;
	return { [Symbol.iterator]() {
		let i = 0;
		return { next() {
			if (i < max) return {
				value: f(i++),
				done: false
			};
			return {
				done: true,
				value: void 0
			};
		} };
	} };
};
/**
* Repeats an iterable `n` times, yielding the full contents of `self` for each
* repetition.
*
* **When to use**
*
* Use to repeat an iterable's contents a specific number of times.
*
* **Details**
*
* The result is lazy. Each repetition obtains a new iterator from `self`.
*
* @see {@link forever} for repeating without an upper bound
* @see {@link replicate} for repeating a single value
* @category constructors
* @since 4.0.0
*/
var repeat$2 = /*#__PURE__*/ dual(2, (self, n) => flatten$3(makeBy$1(() => self, { length: n })));
/**
* Repeats an iterable without an upper bound.
*
* **When to use**
*
* Use to cycle a reusable iterable without an upper bound when a downstream
* consumer controls how many values are taken.
*
* **Gotchas**
*
* The returned iterable is lazy and should usually be bounded with `take` or
* another terminating consumer before materializing it.
*
* @see {@link repeat} for repeating an iterable a specific number of times
* @see {@link take} for bounding the unbounded result before materializing it
*
* @category constructors
* @since 4.0.0
*/
var forever$3 = (self) => repeat$2(self, Infinity);
/**
* Gets the first element of a `Iterable` safely, or `None` if the `Iterable` is empty.
*
* **Example** (Getting the first element)
*
* ```ts import.meta.vitest
* import { Iterable, Option } from "effect"
*
* const numbers = [1, 2, 3]
* Iterable.head(numbers) // => Option.some(1)
*
* const empty = Iterable.empty<number>()
* Iterable.head(empty) // => Option.none()
*
* // Safe way to get first element
* const firstEven = Iterable.head(
*   Iterable.filter([1, 3, 4, 5], (x) => x % 2 === 0)
* )
* firstEven // => Option.some(4)
*
* // Use with Option methods
* const doubled = Option.map(Iterable.head([5, 10, 15]), (x) => x * 2)
* doubled // => Option.some(10)
* ```
*
* @category getters
* @since 2.0.0
*/
var head$3 = (self) => {
	const result = self[Symbol.iterator]().next();
	return result.done ? none() : some(result.value);
};
/**
* Gets the first element of an `Iterable` without returning an `Option`.
*
* **When to use**
*
* Use when the `Iterable` is known to be non-empty and direct access to the
* first element is preferred over handling `Option.none`.
*
* **Gotchas**
*
* Throws if the `Iterable` is empty.
*
* **Example** (Getting the first element unsafely)
*
* ```ts import.meta.vitest
* import { Iterable } from "effect"
*
* const numbers = [1, 2, 3]
* Iterable.headUnsafe(numbers) // => 1
*
* const letters = "hello"
* Iterable.headUnsafe(letters) // => "h"
*
* // Iterable.headUnsafe(Iterable.empty<number>())
* // throws Error: "headUnsafe: empty iterable"
*
* // Use only when you're certain the iterable is non-empty
* const nonEmpty = Iterable.range(1, 10)
* Iterable.headUnsafe(nonEmpty) // => 1
* ```
*
* @category getters
* @since 4.0.0
*/
var headUnsafe = (self) => {
	const result = self[Symbol.iterator]().next();
	if (result.done) throw new Error("headUnsafe: empty iterable");
	return result.value;
};
var constEmpty = { [Symbol.iterator]() {
	return constEmptyIterator;
} };
var constEmptyIterator = { next() {
	return {
		done: true,
		value: void 0
	};
} };
/**
* Creates an empty iterable that yields no elements.
*
* **When to use**
*
* Use when you need an empty iterable as a typed "no data" value or a base
* case for iterable operations.
*
* **Example** (Creating an empty iterable)
*
* ```ts import.meta.vitest
* import { Iterable } from "effect"
*
* Array.from(Iterable.empty<string>()) // => []
* ```
*
* @category constructors
* @since 2.0.0
*/
var empty$4 = () => constEmpty;
/**
* Flattens an Iterable of Iterables into a single Iterable
*
* **Example** (Flattening nested iterables)
*
* ```ts import.meta.vitest
* import { Iterable } from "effect"
*
* // Flatten nested arrays
* const nested = [[1, 2], [3, 4], [5, 6]]
* const flat = Iterable.flatten(nested)
* Array.from(flat) // => [1, 2, 3, 4, 5, 6]
*
* // Flatten different iterable types
* const mixed: Array<Iterable<string>> = ["ab", "cd"]
* const flatMixed = Iterable.flatten(mixed)
* Array.from(flatMixed) // => ["a", "b", "c", "d"]
*
* // Flatten deeply nested (only one level)
* const deepNested = [[[1, 2]], [[3, 4]]]
* const oneLevelFlat = Iterable.flatten(deepNested)
* Array.from(oneLevelFlat) // => [[1, 2], [3, 4]]
* // [[1, 2], [3, 4]] (still contains arrays)
*
* // Empty iterables are handled correctly
* const withEmpty = [[1, 2], [], [3, 4], []]
* const flatWithEmpty = Iterable.flatten(withEmpty)
* Array.from(flatWithEmpty) // => [1, 2, 3, 4]
* ```
*
* @category sequencing
* @since 2.0.0
*/
var flatten$3 = (self) => ({ [Symbol.iterator]() {
	const outerIterator = self[Symbol.iterator]();
	let innerIterator;
	function next() {
		while (true) {
			if (innerIterator === void 0) {
				const next = outerIterator.next();
				if (next.done) return next;
				innerIterator = next.value[Symbol.iterator]();
			}
			const result = innerIterator.next();
			if (!result.done) return result;
			innerIterator = void 0;
		}
	}
	return { next };
} });
/**
* Filters an iterable to only include elements that match a predicate.
*
* **Details**
*
* This function creates a new iterable containing only the elements for which
* the predicate function returns true. Like map, this operation is lazy and
* elements are only tested when the iterable is consumed.
*
* **Example** (Filtering elements)
*
* ```ts import.meta.vitest
* import { Iterable } from "effect"
*
* // Filter even numbers
* const numbers = [1, 2, 3, 4, 5, 6]
* const evens = Iterable.filter(numbers, (x) => x % 2 === 0)
* Array.from(evens) // => [2, 4, 6]
*
* // Filter with index
* const items = ["a", "b", "c", "d"]
* const oddPositions = Iterable.filter(items, (_, i) => i % 2 === 1)
* Array.from(oddPositions) // => ["b", "d"]
*
* // Type refinement
* const mixed: Array<string | number> = ["hello", 42, "world", 100]
* const onlyStrings = Iterable.filter(
*   mixed,
*   (x): x is string => typeof x === "string"
* )
* Array.from(onlyStrings) // => ["hello", "world"]
*
* // Combine with map
* const processed = Iterable.map(
*   Iterable.filter([1, 2, 3, 4, 5], (x) => x > 2),
*   (x) => x * 10
* )
* Array.from(processed) // => [30, 40, 50]
* ```
*
* @category filtering
* @since 2.0.0
*/
var filter$3 = /*#__PURE__*/ dual(2, (self, predicate) => ({ [Symbol.iterator]() {
	const iterator = self[Symbol.iterator]();
	let i = 0;
	return { next() {
		let result = iterator.next();
		while (!result.done) {
			if (predicate(result.value, i++)) return {
				done: false,
				value: result.value
			};
			result = iterator.next();
		}
		return {
			done: true,
			value: void 0
		};
	} };
} }));
/**
* Takes a record and returns an array of tuples containing its keys and values.
*
* **Example** (Converting a record to entries)
*
* ```ts import.meta.vitest
* import { Record } from "effect"
*
* const x = { a: 1, b: 2, c: 3 }
* Record.toEntries(x) // => [["a", 1], ["b", 2], ["c", 3]]
* ```
*
* @category converting
* @since 2.0.0
*/
var toEntries = /*#__PURE__*/ (/* @__PURE__ */ dual(2, (self, f) => {
	const out = [];
	for (const key of keys(self)) out.push(f(key, self[key]));
	return out;
}))((key, value) => [key, value]);
/**
* Checks whether a given `key` exists in a record.
*
* **Example** (Checking key membership)
*
* ```ts import.meta.vitest
* import { Record } from "effect"
*
* Record.has({ a: 1, b: 2 }, "a") // => true
* Record.has(Record.empty<string>(), "c") // => false
* ```
*
* @category predicates
* @since 2.0.0
*/
var has$1 = /*#__PURE__*/ dual(2, (self, key) => Object.hasOwn(self, key));
/**
* Maps a record into another record by applying a transformation function to each of its values.
*
* **Example** (Mapping record values)
*
* ```ts import.meta.vitest
* import { Record } from "effect"
*
* const f = (n: number) => `-${n}`
*
* Record.map({ a: 3, b: 5 }, f) // => { a: "-3", b: "-5" }
*
* const g = (n: number, key: string) => `${key.toUpperCase()}-${n}`
*
* Record.map({ a: 3, b: 5 }, g) // => { a: "A-3", b: "B-5" }
* ```
*
* @category mapping
* @since 2.0.0
*/
var map$5 = /*#__PURE__*/ dual(2, (self, f) => {
	const out = { ...self };
	for (const key of keys(self)) assignProperty$1(out, key, f(self[key], key));
	return out;
});
/**
* Retrieves the keys of a given record as an array.
*
* **Example** (Getting record keys)
*
* ```ts import.meta.vitest
* import { Record } from "effect"
*
* Record.keys({ a: 1, b: 2, c: 3 }) // => ["a", "b", "c"]
* ```
*
* @category getters
* @since 2.0.0
*/
var keys = (self) => Object.keys(self);
/**
* Mutates a record by assigning a value to a property.
*
* **When to use**
*
* Use when incrementally constructing a new record and copying it for every
* property would be unnecessary.
*
* **Gotchas**
*
* This function mutates `self`. When `key` is `"__proto__"`, it creates an
* own data property instead of changing the object's prototype.
*
* **Example** (Assigning an external key safely)
*
* ```ts import.meta.vitest
* import { Record } from "effect"
*
* const key: string = "__proto__" // Assume this comes from external input
* const value = { polluted: true }
*
* const unsafe: Record<string, unknown> = {}
* unsafe[key] = value
* Object.getPrototypeOf(unsafe) === value // => true
*
* const safe: Record<string, unknown> = {}
* Record.assignProperty(safe, key, value)
* Object.getPrototypeOf(safe) === Object.prototype // => true
* safe[key] === value // => true
* ```
*
* @see {@link set} for an immutable update
* @category mutations
* @since 4.0.0
*/
var assignProperty = assignProperty$1;
/**
* Checks whether all the keys and values in one record are also found in another record.
* Uses the provided equivalence function to compare values.
*
* **Example** (Checking subrecords with a custom equivalence)
*
* ```ts import.meta.vitest
* import { Equivalence, Record } from "effect"
*
* const isSubrecord = Record.isSubrecordBy(
*   Equivalence.make<string>((self, that) => self.toLowerCase() === that.toLowerCase())
* )
*
* const required: Record.ReadonlyRecord<string, string> = { role: "Admin" }
* const available: Record.ReadonlyRecord<string, string> = {
*   role: "admin",
*   status: "active"
* }
*
* isSubrecord(required, available) // => true
* isSubrecord({ role: "Admin", status: "inactive" }, available) // => false
* isSubrecord(required, { role: "editor", status: "active" }) // => false
* ```
*
* @category predicates
* @since 2.0.0
*/
var isSubrecordBy = (equivalence) => dual(2, (self, that) => {
	for (const key of keys(self)) if (!has$1(that, key) || !equivalence(self[key], that[key])) return false;
	return true;
});
/**
* Create an `Equivalence` for records using the provided `Equivalence` for values.
* Two records are considered equivalent if they have the same keys and their corresponding values are equivalent.
*
* **Example** (Comparing records with a value equivalence)
*
* ```ts import.meta.vitest
* import { Equal, Record } from "effect"
*
* const recordEquivalence = Record.makeEquivalence(Equal.asEquivalence<number>())
*
* recordEquivalence({ a: 1, b: 2 }, { a: 1, b: 2 }) // => true
* recordEquivalence({ a: 1, b: 2 }, { a: 1, b: 3 }) // => false
* ```
*
* @category instances
* @since 4.0.0
*/
var makeEquivalence$1 = (equivalence) => {
	const is = isSubrecordBy(equivalence);
	return (self, that) => is(self, that) && is(that, self);
};
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0-rc.112/node_modules/effect/dist/Array.js
/**
* Works with JavaScript arrays, readonly arrays, and non-empty arrays.
*
* The helpers cover common collection work such as creating arrays, reading
* elements, transforming values, sorting, grouping, splitting, combining, and
* reducing many values to one result. Helpers that change contents return new
* arrays and preserve non-empty array types when the result is guaranteed to
* contain values.
*
* @since 2.0.0
*/
/**
* Exposes the global array constructor.
*
* **When to use**
*
* Use to access native JavaScript array constructor methods such as `isArray`
* or `from` from the Effect module namespace.
*
* **Example** (Accessing the Array constructor)
*
* ```ts import.meta.vitest
* import { Array } from "effect"
*
* Array.Array === globalThis.Array // => true
* ```
*
* @category constructors
* @since 4.0.0
*/
var Array$1 = globalThis.Array;
/**
* Creates a `NonEmptyArray` of length `n` where element `i` is computed by `f(i)`.
*
* **When to use**
*
* Use when you need to compute each array element from its index.
*
* **Details**
*
* `n` is normalized to an integer greater than or equal to 1, so this function
* always returns at least one element. Supports both data-first and data-last
* usage.
*
* **Example** (Generating values from indices)
*
* ```ts import.meta.vitest
* import { Array } from "effect"
*
* Array.makeBy(5, (n) => n * 2) // => [0, 2, 4, 6, 8]
* ```
*
* @see {@link range} — create a range of integers
* @see {@link replicate} — repeat a single value
*
* @category constructors
* @since 2.0.0
*/
var makeBy = /*#__PURE__*/ dual(2, (n, f) => {
	const max = Math.max(1, Math.floor(n));
	const out = new Array$1(max);
	for (let i = 0; i < max; i++) out[i] = f(i);
	return out;
});
/**
* Creates a `NonEmptyArray` containing a range of integers, inclusive on both
* ends.
*
* **When to use**
*
* Use when you need a non-empty sequence of consecutive integers.
*
* **Details**
*
* If `start > end`, returns `[start]`.
*
* **Example** (Creating a range)
*
* ```ts import.meta.vitest
* import { Array } from "effect"
*
* Array.range(1, 3) // => [1, 2, 3]
* ```
*
* @see {@link makeBy} — generate values from a function
*
* @category constructors
* @since 2.0.0
*/
var range = (start, end) => start <= end ? makeBy(end - start + 1, (i) => start + i) : [start];
/**
* Converts an `Iterable` to an `Array`.
*
* **When to use**
*
* Use to convert any `Iterable` (Set, Generator, etc.) into an array.
*
* **Details**
*
* If the input is already an array, this returns it by reference without
* copying. Otherwise, it creates a new array from the iterable. Use `copy` if
* you need a fresh array even when the input is already an array.
*
* **Example** (Converting a Set to an array)
*
* ```ts import.meta.vitest
* import { Array } from "effect"
*
* Array.fromIterable(new Set([1, 2, 3])) // => [1, 2, 3]
* ```
*
* @see {@link ensure} — wrap a single value or return an existing array
* @see {@link copy} — create a shallow copy of an array
*
* @category constructors
* @since 2.0.0
*/
var fromIterable = (collection) => Array$1.isArray(collection) ? collection : Array$1.from(collection);
/**
* Normalizes a value that is either a single element or an array into an array.
*
* **When to use**
*
* Use to normalize input that may be a single value or an array into a consistent
* array.
*
* **Details**
*
* If the input is already an array, this returns it by reference. If the input
* is a single value, this wraps it in a one-element array. This is useful for
* APIs that accept `A | Array<A>`.
*
* **Example** (Normalizing input)
*
* ```ts import.meta.vitest
* import { Array } from "effect"
*
* Array.ensure("a") // => ["a"]
* Array.ensure(["a", "b", "c"]) // => ["a", "b", "c"]
* ```
*
* @see {@link of} — always wrap in a single-element array
* @see {@link fromIterable} — convert any iterable
*
* @category constructors
* @since 3.3.0
*/
var ensure = (self) => Array$1.isArray(self) ? self : [self];
/**
* Adds a single element to the front of an iterable, returning a `NonEmptyArray`.
*
* **When to use**
*
* Use when you need to guarantee a non-empty result after adding a required
* leading value.
*
* **Example** (Prepending an element)
*
* ```ts import.meta.vitest
* import { Array } from "effect"
*
* Array.prepend([2, 3, 4], 1) // => [1, 2, 3, 4]
* ```
*
* @see {@link append} — add to the end
* @see {@link prependAll} — prepend multiple elements
*
* @category combining
* @since 2.0.0
*/
var prepend = /*#__PURE__*/ dual(2, (self, head) => [head, ...self]);
/**
* Adds a single element to the end of an iterable, returning a `NonEmptyArray`.
*
* **When to use**
*
* Use when you need to guarantee a non-empty result after adding a required
* trailing value.
*
* **Example** (Appending an element)
*
* ```ts import.meta.vitest
* import { Array } from "effect"
*
* Array.append([1, 2, 3], 4) // => [1, 2, 3, 4]
* ```
*
* @see {@link prepend} — add to the front
* @see {@link appendAll} — append multiple elements
*
* @category combining
* @since 2.0.0
*/
var append = /*#__PURE__*/ dual(2, (self, last) => [...self, last]);
/**
* Concatenates two iterables into a single array.
*
* **When to use**
*
* Use to combine two iterable inputs into a new array with the second input's
* elements after the first.
*
* **Details**
*
* If either input is non-empty, the result is a `NonEmptyArray`.
*
* **Example** (Concatenating arrays)
*
* ```ts import.meta.vitest
* import { Array } from "effect"
*
* Array.appendAll([1, 2], [3, 4]) // => [1, 2, 3, 4]
* ```
*
* @see {@link append} — add a single element to the end
* @see {@link prependAll} — add elements to the front
*
* @category combining
* @since 2.0.0
*/
var appendAll = /*#__PURE__*/ dual(2, (self, that) => fromIterable(self).concat(fromIterable(that)));
/**
* Checks whether a value is an `Array`.
*
* **When to use**
*
* Use to verify a value is a mutable array, narrowing its type to `Array<unknown>`.
*
* **Details**
*
* Acts as a type guard narrowing the input to `Array<unknown>` and delegates to
* `globalThis.Array.isArray`.
*
* **Example** (Type-guarding an unknown value)
*
* ```ts import.meta.vitest
* import { Array } from "effect"
*
* Array.isArray(null) // => false
* Array.isArray([1, 2, 3]) // => true
* ```
*
* @see {@link isArrayEmpty} — check for an empty array
* @see {@link isArrayNonEmpty} — check for a non-empty array
*
* @category guards
* @since 2.0.0
*/
var isArray = Array$1.isArray;
/**
* Checks whether a mutable `Array` is non-empty, narrowing the type to
* `NonEmptyArray`.
*
* **When to use**
*
* Use when you need the narrowed value to remain a mutable `Array` after proving
* it has at least one element.
*
* **Example** (Checking for a non-empty array)
*
* ```ts import.meta.vitest
* import { Array } from "effect"
*
* Array.isArrayNonEmpty([]) // => false
* Array.isArrayNonEmpty([1, 2, 3]) // => true
* ```
*
* @see {@link isReadonlyArrayNonEmpty} — readonly variant
* @see {@link isArrayEmpty} — opposite check
*
* @category guards
* @since 4.0.0
*/
var isArrayNonEmpty = isArrayNonEmpty$1;
/**
* Checks whether a `ReadonlyArray` is non-empty, narrowing the type to
* `NonEmptyReadonlyArray`.
*
* **When to use**
*
* Use when you need to prove a readonly array has at least one element without
* requiring mutable array methods afterward.
*
* **Example** (Checking for a non-empty readonly array)
*
* ```ts import.meta.vitest
* import { Array } from "effect"
*
* Array.isReadonlyArrayNonEmpty([]) // => false
* Array.isReadonlyArrayNonEmpty([1, 2, 3]) // => true
* ```
*
* @see {@link isArrayNonEmpty} — mutable variant
* @see {@link isReadonlyArrayEmpty} — opposite check
*
* @category guards
* @since 4.0.0
*/
var isReadonlyArrayNonEmpty = isArrayNonEmpty$1;
/** @internal */
function isOutOfBounds(i, as) {
	return !Number.isFinite(i) || i < 0 || i >= as.length;
}
/**
* Reads an element at the given index safely, returning `Option.some` or
* `Option.none` if the index is out of bounds.
*
* **When to use**
*
* Use when you need to read an array element by index and handle an
* out-of-bounds index as `Option.none`.
*
* **Details**
*
* The index is floored to an integer. This never throws.
*
* **Example** (Accessing indexes safely)
*
* ```ts import.meta.vitest
* import { Array, Option } from "effect"
*
* Array.get([1, 2, 3], 1) // => Option.some(2)
* Array.get([1, 2, 3], 10) // => Option.none()
* ```
*
* @see {@link getUnsafe} for indexed access that throws when the index is out of bounds
* @see {@link head} for reading the first element as an `Option`
* @see {@link last} for reading the last element as an `Option`
*
* @category getters
* @since 2.0.0
*/
var get$1 = /*#__PURE__*/ dual(2, (self, index) => {
	const i = Math.floor(index);
	return isOutOfBounds(i, self) ? none() : some(self[i]);
});
/**
* Reads an element at the given index, throwing if the index is out of bounds.
*
* **When to use**
*
* Use to read an array element at a known valid index when out-of-bounds would
* be a programming error.
*
* **Details**
*
* Throws an `Error` with the message `"Index out of bounds: <i>"`. Prefer
* `get` for safe access.
*
* **Example** (Accessing indexes unsafely)
*
* ```ts import.meta.vitest
* import { Array } from "effect"
*
* Array.getUnsafe([1, 2, 3], 1) // => 2
* // Array.getUnsafe([1, 2, 3], 10) // throws Error
* ```
*
* @see {@link get} — safe version returning `Option`
*
* @category unsafe
* @since 4.0.0
*/
var getUnsafe$1 = /*#__PURE__*/ dual(2, (self, index) => {
	const i = Math.floor(index);
	if (isOutOfBounds(i, self)) throw new Error(`Index out of bounds: ${i}`);
	return self[i];
});
/**
* Returns the first element of an array safely wrapped in `Option.some`, or
* `Option.none` if the array is empty.
*
* **When to use**
*
* Use to safely get the first element of an array that may be empty.
*
* **Example** (Getting the first element)
*
* ```ts import.meta.vitest
* import { Array, Option } from "effect"
*
* Array.head([1, 2, 3]) // => Option.some(1)
* Array.head([]) // => Option.none()
* ```
*
* @see {@link headNonEmpty} — direct access when array is known non-empty
* @see {@link last} — get the last element
*
* @category getters
* @since 2.0.0
*/
var head$2 = /*#__PURE__*/ get$1(0);
/**
* Returns the first element of a `NonEmptyReadonlyArray` directly (no `Option`
* wrapper).
*
* **When to use**
*
* Use to get the first element without `Option` wrapping when the array is known
* to be non-empty.
*
* **Example** (Getting the head of a non-empty array)
*
* ```ts import.meta.vitest
* import { Array } from "effect"
*
* Array.headNonEmpty([1, 2, 3, 4]) // => 1
* ```
*
* @see {@link head} — safe version for possibly-empty arrays
*
* @category getters
* @since 2.0.0
*/
var headNonEmpty = /*#__PURE__*/ getUnsafe$1(0);
/**
* Returns the last element of a `NonEmptyReadonlyArray` directly (no `Option`
* wrapper).
*
* **When to use**
*
* Use to get the last element without `Option` wrapping when the array is known
* to be non-empty.
*
* **Example** (Getting the last of a non-empty array)
*
* ```ts import.meta.vitest
* import { Array } from "effect"
*
* Array.lastNonEmpty([1, 2, 3, 4]) // => 4
* ```
*
* @see {@link last} — safe version for possibly-empty arrays
*
* @category getters
* @since 2.0.0
*/
var lastNonEmpty = (self) => self[self.length - 1];
/**
* Takes elements from the start while the predicate holds, stopping at the
* first element that fails.
*
* **When to use**
*
* Use to keep the leading elements of an iterable while each element satisfies
* a predicate, returning the retained prefix as an array.
*
* **Details**
*
* Supports refinements for type narrowing. The predicate receives
* `(element, index)`.
*
* **Example** (Taking while condition holds)
*
* ```ts import.meta.vitest
* import { Array } from "effect"
*
* Array.takeWhile([1, 3, 2, 4, 1, 2], (x) => x < 4) // => [1, 3, 2]
* ```
*
* @see {@link take} for keeping a fixed number of leading elements
* @see {@link dropWhile} for removing the matching prefix and keeping the rest
* @see {@link span} for splitting the matching prefix from the remaining elements
*
* @category getters
* @since 2.0.0
*/
var takeWhile = /*#__PURE__*/ dual(2, (self, predicate) => {
	let i = 0;
	const out = [];
	for (const a of self) {
		if (!predicate(a, i)) break;
		out.push(a);
		i++;
	}
	return out;
});
var spanIndex = (self, predicate) => {
	let i = 0;
	for (const a of self) {
		if (!predicate(a, i)) break;
		i++;
	}
	return i;
};
/**
* Splits an iterable into two arrays: the longest prefix where the predicate
* holds, and the remaining elements.
*
* **When to use**
*
* Use when you need both the longest predicate-matching prefix and the
* remaining elements.
*
* **Details**
*
* Equivalent to `[takeWhile(pred), dropWhile(pred)]`, but more efficient
* because it runs in a single pass. Supports refinements for type narrowing of
* the prefix.
*
* **Example** (Splitting at predicate boundary)
*
* ```ts import.meta.vitest
* import { Array } from "effect"
*
* Array.span([1, 3, 2, 4, 5], (x) => x % 2 === 1) // => [[1, 3], [2, 4, 5]]
* ```
*
* @see {@link takeWhile} for keeping only the matching prefix
* @see {@link dropWhile} for keeping only the elements after the matching prefix
* @see {@link splitWhere} for splitting at the first element that satisfies a predicate
*
* @category splitting
* @since 2.0.0
*/
var span = /*#__PURE__*/ dual(2, (self, predicate) => {
	const input = fromIterable(self);
	return splitAt(input, spanIndex(input, predicate));
});
/**
* Drops elements from the start while the predicate holds, returning the rest.
*
* **When to use**
*
* Use to remove a leading prefix of elements that satisfy a predicate.
*
* **Details**
*
* The predicate receives `(element, index)`.
*
* **Example** (Dropping while condition holds)
*
* ```ts import.meta.vitest
* import { Array } from "effect"
*
* Array.dropWhile([1, 2, 3, 4, 5], (x) => x < 4) // => [4, 5]
* ```
*
* @see {@link takeWhile} — keep the matching prefix instead
* @see {@link drop} — drop a fixed count
*
* @category getters
* @since 2.0.0
*/
var dropWhile = /*#__PURE__*/ dual(2, (self, predicate) => {
	const input = fromIterable(self);
	let i = 0;
	while (i < input.length) {
		if (!predicate(input[i], i)) break;
		i++;
	}
	return input.slice(i);
});
/**
* Sorts an array by the given `Order`, returning a new array.
*
* **When to use**
*
* Use to sort an array using a single `Order` comparator.
*
* **Details**
*
* Preserves `NonEmptyArray` in the return type. Use `sortWith` to sort by a
* derived key, or `sortBy` for multi-key sorting.
*
* **Example** (Sorting numbers)
*
* ```ts import.meta.vitest
* import { Array, Order } from "effect"
*
* Array.sort([3, 1, 4, 1, 5], Order.Number) // => [1, 1, 3, 4, 5]
* ```
*
* @see {@link sortWith} — sort by a mapping function
* @see {@link sortBy} — sort by multiple orders
*
* @category sorting
* @since 2.0.0
*/
var sort = /*#__PURE__*/ dual(2, (self, O) => {
	const out = Array$1.from(self);
	out.sort(O);
	return out;
});
/**
* Splits an array of pairs into two arrays. Inverse of {@link zip}.
*
* **Example** (Unzipping pairs)
*
* ```ts import.meta.vitest
* import { Array } from "effect"
*
* Array.unzip([[1, "a"], [2, "b"], [3, "c"]]) // => [[1, 2, 3], ["a", "b", "c"]]
* ```
*
* @see {@link zip} — combine two arrays into pairs
*
* @category zipping
* @since 2.0.0
*/
var unzip = (self) => {
	const input = fromIterable(self);
	if (isReadonlyArrayNonEmpty(input)) {
		const fa = [input[0][0]];
		const fb = [input[0][1]];
		for (let i = 1; i < input.length; i++) {
			fa[i] = input[i][0];
			fb[i] = input[i][1];
		}
		return [fa, fb];
	}
	return [[], []];
};
/**
* Applies a function repeatedly to consume prefixes of the array and collect
* the values it produces.
*
* **When to use**
*
* Use when you need custom grouping logic where each step returns both a value
* and the remaining input.
*
* **Details**
*
* The function receives a `NonEmptyReadonlyArray` and returns `[value, rest]`.
* Processing continues until the remaining array is empty.
*
* **Example** (Chopping an array)
*
* ```ts import.meta.vitest
* import { Array } from "effect"
*
* Array.chop([1, 2, 3, 4, 5], (as): [number, Array<number>] => [as[0] * 2, as.slice(1)]) // => [2, 4, 6, 8, 10]
* ```
*
* @see {@link chunksOf} — split into fixed-size chunks
* @see {@link splitAt} — split at an index
*
* @category splitting
* @since 2.0.0
*/
var chop = /*#__PURE__*/ dual(2, (self, f) => {
	const input = fromIterable(self);
	if (isReadonlyArrayNonEmpty(input)) {
		const [b, rest] = f(input);
		const out = [b];
		let next = rest;
		while (isArrayNonEmpty$1(next)) {
			const [b, rest] = f(next);
			out.push(b);
			next = rest;
		}
		return out;
	}
	return [];
});
/**
* Splits an iterable into two arrays at the given index.
*
* **When to use**
*
* Use to divide an array into a prefix and suffix at a specific position.
*
* **Details**
*
* `n` can be `0`, in which case all elements are placed in the second array.
* The index is floored to an integer.
*
* **Example** (Splitting at an index)
*
* ```ts import.meta.vitest
* import { Array } from "effect"
*
* Array.splitAt([1, 2, 3, 4, 5], 3) // => [[1, 2, 3], [4, 5]]
* ```
*
* @see {@link splitAtNonEmpty} — for non-empty arrays
* @see {@link splitWhere} — split at a predicate boundary
*
* @category splitting
* @since 2.0.0
*/
var splitAt = /*#__PURE__*/ dual(2, (self, n) => {
	const input = Array$1.from(self);
	const _n = Math.floor(n);
	if (isReadonlyArrayNonEmpty(input)) {
		if (_n >= 1) return splitAtNonEmpty(input, _n);
		return [[], input];
	}
	return [input, []];
});
/**
* Splits a non-empty array into two parts at the given index. The first part
* is guaranteed to be non-empty (`n` is clamped to >= 1).
*
* **When to use**
*
* Use when downstream code requires the left side of the split to contain at
* least one element.
*
* **Example** (Splitting a non-empty array)
*
* ```ts import.meta.vitest
* import { Array } from "effect"
*
* Array.splitAtNonEmpty(["a", "b", "c", "d", "e"], 3) // => [["a", "b", "c"], ["d", "e"]]
* ```
*
* @see {@link splitAt} — for possibly-empty arrays
*
* @category splitting
* @since 4.0.0
*/
var splitAtNonEmpty = /*#__PURE__*/ dual(2, (self, n) => {
	const _n = Math.max(1, Math.floor(n));
	return _n >= self.length ? [copy(self), []] : [prepend(self.slice(1, _n), headNonEmpty(self)), self.slice(_n)];
});
/**
* Splits an iterable at the first element matching the predicate. The matching
* element is included in the second array.
*
* **When to use**
*
* Use when you need to split an array at the first element that marks a
* condition boundary.
*
* **Example** (Splitting at a condition)
*
* ```ts import.meta.vitest
* import { Array } from "effect"
*
* Array.splitWhere([1, 2, 3, 4, 5], (n) => n > 3) // => [[1, 2, 3], [4, 5]]
* ```
*
* @see {@link span} — splits at the first element that fails the predicate
* @see {@link splitAt} — split at a fixed index
*
* @category splitting
* @since 2.0.0
*/
var splitWhere = /*#__PURE__*/ dual(2, (self, predicate) => span(self, (a, i) => !predicate(a, i)));
/**
* Creates a shallow copy of an array.
*
* **When to use**
*
* Use to create a distinct array reference for an existing array, for example
* before mutating the returned array.
*
* **Details**
*
* The return type preserves `NonEmptyArray`. Use this when you need a distinct
* reference, for example before mutating the returned array.
*
* **Example** (Copying an array)
*
* ```ts import.meta.vitest
* import { Array } from "effect"
*
* const original = [1, 2, 3]
* const copied = Array.copy(original)
*
* copied // => [1, 2, 3]
* original === copied // => false
* ```
*
* @see {@link fromIterable} — returns the same reference for arrays
*
* @category transforming
* @since 2.0.0
*/
var copy = (self) => self.slice();
/**
* Splits an iterable into chunks of length `n`. The last chunk may be shorter
* if `n` does not evenly divide the length.
*
* **When to use**
*
* Use to divide an iterable into a new array of non-overlapping chunks with a
* maximum chunk size.
*
* **Details**
*
* `chunksOf(n)([])` is `[]`, not `[[]]`. Each chunk is a `NonEmptyArray`, and
* the outer return type preserves `NonEmptyArray`.
*
* **Example** (Chunking an array)
*
* ```ts import.meta.vitest
* import { Array } from "effect"
*
* Array.chunksOf([1, 2, 3, 4, 5], 2) // => [[1, 2], [3, 4], [5]]
* ```
*
* @see {@link split} — split into a given number of groups
* @see {@link window} — sliding windows
*
* @category splitting
* @since 2.0.0
*/
var chunksOf = /*#__PURE__*/ dual(2, (self, n) => {
	const input = fromIterable(self);
	if (isReadonlyArrayNonEmpty(input)) return chop(input, splitAtNonEmpty(n));
	return [];
});
var hashBucketsAdd = (buckets, value) => {
	const hash$1 = hash(value);
	const bucket = buckets.get(hash$1);
	if (bucket === void 0) {
		buckets.set(hash$1, [value]);
		return true;
	}
	for (const previous of bucket) if (equals$2(previous, value)) return false;
	bucket.push(value);
	return true;
};
/**
* Computes the union of two arrays, removing duplicates using
* `Equal.equivalence()`.
*
* **Example** (Computing array unions)
*
* ```ts import.meta.vitest
* import { Array } from "effect"
*
* Array.union([1, 2], [2, 3]) // => [1, 2, 3]
* ```
*
* @see {@link unionWith} — use custom equality
* @see {@link intersection} — elements in both arrays
* @see {@link difference} — elements only in the first array
*
* @category set operations
* @since 2.0.0
*/
var union = /*#__PURE__*/ dual(2, (self, that) => {
	const a = fromIterable(self);
	const b = fromIterable(that);
	if (isReadonlyArrayNonEmpty(a)) return isReadonlyArrayNonEmpty(b) ? dedupe(appendAll(a, b)) : a;
	return b;
});
/**
* Creates an empty array.
*
* **When to use**
*
* Use to create a typed empty array without allocating placeholder elements.
*
* **Example** (Creating an empty array)
*
* ```ts import.meta.vitest
* import { Array } from "effect"
*
* Array.empty<number>() // => []
* ```
*
* @see {@link of} — create a single-element array
* @see {@link make} — create from multiple values
*
* @category constructors
* @since 2.0.0
*/
var empty$3 = () => [];
/**
* Wraps a single value in a `NonEmptyArray`.
*
* **Example** (Creating a single-element array)
*
* ```ts import.meta.vitest
* import { Array } from "effect"
*
* Array.of(1) // => [1]
* ```
*
* @see {@link make} — create from multiple values
* @see {@link empty} — create an empty array
*
* @category constructors
* @since 2.0.0
*/
var of = (a) => [a];
/**
* Transforms each element using a function, returning a new array.
*
* **When to use**
*
* Use to transform each element independently while preserving the array shape.
*
* **Details**
*
* The function receives `(element, index)`. The return type preserves
* `NonEmptyArray`.
*
* **Example** (Doubling values)
*
* ```ts import.meta.vitest
* import { Array } from "effect"
*
* Array.map([1, 2, 3], (x) => x * 2) // => [2, 4, 6]
* ```
*
* @see {@link flatMap} — map and flatten
*
* @category mapping
* @since 2.0.0
*/
var map$4 = /*#__PURE__*/ dual(2, (self, f) => self.map(f));
/**
* Extracts all `Some` values from an iterable of `Option`s, discarding `None`s.
*
* **When to use**
*
* Use to collect only present values from an iterable of `Option` values while
* discarding `None` values.
*
* **Example** (Extracting Some values)
*
* ```ts import.meta.vitest
* import { Array, Option } from "effect"
*
* Array.getSomes([Option.some(1), Option.none(), Option.some(2)]) // => [1, 2]
* ```
*
* @see {@link fromOption} — convert a single Option
* @see {@link getSuccesses} — extract successes from Results
*
* @category filtering
* @since 2.0.0
*/
var getSomes = (self) => {
	const out = [];
	for (const a of self) if (isSome(a)) out.push(a.value);
	return out;
};
/**
* Keeps only elements satisfying a predicate (or refinement).
*
* **When to use**
*
* Use to filter an iterable into a new array of original elements that satisfy
* a boolean predicate or refinement.
*
* **Details**
*
* The predicate receives `(element, index)`. Refinements are supported for type
* narrowing.
*
* **Example** (Filtering even numbers)
*
* ```ts import.meta.vitest
* import { Array } from "effect"
*
* Array.filter([1, 2, 3, 4], (x) => x % 2 === 0) // => [2, 4]
* ```
*
* @see {@link partition} — split into matching and non-matching
* @see {@link filterMap} for transforming while filtering
*
* @category filtering
* @since 2.0.0
*/
var filter$2 = /*#__PURE__*/ dual(2, (self, predicate) => {
	const as = fromIterable(self);
	const out = [];
	for (let i = 0; i < as.length; i++) if (predicate(as[i], i)) out.push(as[i]);
	return out;
});
/**
* Splits an iterable using a `Filter` into failures and successes.
*
* **When to use**
*
* Use to partition an iterable by evaluating each element with a
* `Result`-returning filter and keeping both failure and success values.
*
* **Details**
*
* Returns `[excluded, satisfying]`. The filter receives `(element, index)`.
*
* **Example** (Partitioning with a filter)
*
* ```ts import.meta.vitest
* import { Array, Result } from "effect"
*
* Array.partition([1, -2, 3], (n, i) =>
*   n > 0 ? Result.succeed(n + i) : Result.fail(`negative:${n}`)
* ) // => [["negative:-2"], [1, 5]]
* ```
*
* @see {@link filter} — keep only matching elements
* @see {@link filterMap} for discarding failures
* @see {@link separate} — split an iterable of `Result` values
*
* @category filtering
* @since 2.0.0
*/
var partition$2 = /*#__PURE__*/ dual(2, (self, f) => {
	const excluded = [];
	const satisfying = [];
	let i = 0;
	for (const a of self) {
		const result = f(a, i++);
		if (isSuccess$3(result)) satisfying.push(result.success);
		else excluded.push(result.failure);
	}
	return [excluded, satisfying];
});
/**
* Checks whether all elements satisfy the predicate. Supports refinements for
* type narrowing.
*
* **When to use**
*
* Use to check whether every array element satisfies a predicate, including
* refinement-based type narrowing.
*
* **Example** (Testing all elements)
*
* ```ts import.meta.vitest
* import { Array } from "effect"
*
* Array.every([2, 4, 6], (x) => x % 2 === 0) // => true
* Array.every([2, 3, 6], (x) => x % 2 === 0) // => false
* ```
*
* @see {@link some} — test if any element matches
*
* @category guards
* @since 2.0.0
*/
var every = /*#__PURE__*/ dual(2, (self, refinement) => self.every(refinement));
/**
* Creates an `Equivalence` for arrays based on an element `Equivalence`. Two
* arrays are equivalent when they have the same length and all elements are
* pairwise equivalent.
*
* **Example** (Comparing arrays for equality)
*
* ```ts import.meta.vitest
* import { Array } from "effect"
*
* const eq = Array.makeEquivalence<number>((a, b) => a === b)
*
* eq([1, 2, 3], [1, 2, 3]) // => true
* ```
*
* @see {@link makeOrder} — create an ordering for arrays
*
* @category instances
* @since 4.0.0
*/
var makeEquivalence = Array_;
/**
* Removes duplicates using `Equal.equivalence()`, preserving the order of the
* first occurrence.
*
* **When to use**
*
* Use to remove repeated values from an iterable when Effect's default equality
* is the right comparison, preserving the first occurrence.
*
* **Example** (Removing duplicates)
*
* ```ts import.meta.vitest
* import { Array } from "effect"
*
* Array.dedupe([1, 2, 1, 3, 2, 4]) // => [1, 2, 3, 4]
* ```
*
* @see {@link dedupeWith} — use custom equality
* @see {@link dedupeAdjacent} — only dedupes consecutive elements
*
* @category deduplication
* @since 2.0.0
*/
var dedupe = (self) => {
	const input = fromIterable(self);
	if (input.length < 2) return [...input];
	const buckets = /* @__PURE__ */ new Map();
	const out = [];
	for (const value of input) if (hashBucketsAdd(buckets, value)) out.push(value);
	return out;
};
/**
* Joins string elements with a separator.
*
* **Example** (Joining strings)
*
* ```ts import.meta.vitest
* import { Array } from "effect"
*
* Array.join(["a", "b", "c"], "-") // => "a-b-c"
* ```
*
* @see {@link intersperse} — insert separator elements without joining
*
* @category folding
* @since 2.0.0
*/
var join = /*#__PURE__*/ dual(2, (self, sep) => fromIterable(self).join(sep));
var reducer = /*#__PURE__*/ make$11((a, b) => a.concat(b), []);
/**
* Returns a `Reducer` that combines `Array` values by concatenation.
*
* @see {@link getReadonlyReducerConcat} — readonly variant
*
* @category folding
* @since 4.0.0
*/
function makeReducerConcat() {
	return reducer;
}
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0-rc.112/node_modules/effect/dist/Effectable.js
/**
* Create a low-level `Effect` prototype.
*
* **When to use**
*
* Use when you need to create a custom Effect-like value without extending a
* class, by providing a label and an evaluate function that receives the
* current fiber.
*
* **Details**
*
* When the effect is evaluated, it calls `evaluate` with the current fiber.
*
* @see {@link Class} for a class-based approach to defining custom Effect values
*
* @category prototypes
* @since 4.0.0
*/
var Prototype = (options) => makePrimitiveProto({
	op: options.label,
	[evaluate]: options.evaluate
});
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0-rc.112/node_modules/effect/dist/Context.js
/**
* Runtime type identifier attached to `Context` service keys and used by
* `isKey` to recognize them.
*
* @category type IDs
* @since 4.0.0
*/
var ServiceTypeId = "~effect/Context/Service";
/**
* Creates a `Context` service key.
*
* **When to use**
*
* Use when you need to define a context service key for a dependency that must
* be provided by the surrounding context.
*
* **Details**
*
* Call `Context.Service("Key")` for a function-style key, or use the two-stage
* form `Context.Service<Self, Shape>()("Key")` for class-style service
* declarations. The returned key can be yielded as an Effect and passed to
* `Context.make`, `Context.add`, and the Context getter functions.
*
* **Gotchas**
*
* The string key is the runtime identity of the service. Reusing the same key
* string for unrelated services makes them occupy the same slot in a
* `Context`.
*
* **Example** (Creating service keys)
*
* ```ts import.meta.vitest
* import { Context } from "effect"
*
* // Create a simple service
* const Database = Context.Service<{
*   query: (sql: string) => string
* }>("Database")
*
* // Create a service class
* class Config extends Context.Service<Config, {
*   port: number
* }>()("Config") {}
*
* // Use the services to create contexts
* const db = Context.make(Database, {
*   query: (sql) => `Result: ${sql}`
* })
* const config = Context.make(Config, { port: 8080 })
* Context.get(db, Database).query("SELECT 1") // => "Result: SELECT 1"
* Context.get(config, Config).port // => 8080
* ```
*
* @see {@link Reference} for service keys with default values
*
* @category services
* @since 4.0.0
*/
var Service = function() {
	function KeyClass() {}
	const self = KeyClass;
	Object.setPrototypeOf(self, ServiceProto);
	const init = (key, options) => {
		self.key = key;
		if (options?.defaultValue) {
			self[ReferenceTypeId] = ReferenceTypeId;
			self.defaultValue = options.defaultValue;
		}
		if (options?.make) self.make = options.make;
		if (options?.fiberCached) cacheKeys.add(key);
		return self;
	};
	return arguments.length > 0 ? init(arguments[0], arguments[1]) : init;
};
var ServiceProto = {
	[ServiceTypeId]: ServiceTypeId,
	.../*#__PURE__*/ Prototype({
		label: "Service",
		evaluate(fiber) {
			return exitSucceed(get(fiber.context, this));
		}
	}),
	toJSON() {
		return {
			_id: "Service",
			key: this.key
		};
	},
	of(self) {
		return self;
	},
	context(self) {
		return make$7(this, self);
	},
	use(f) {
		return withFiber$1((fiber) => f(get(fiber.context, this)));
	},
	useSync(f) {
		return withFiber$1((fiber) => exitSucceed(f(get(fiber.context, this))));
	}
};
var cacheKeys = /*#__PURE__*/ new Set();
var ReferenceTypeId = "~effect/Context/Reference";
var TypeId$8 = "~effect/Context";
var MaxDepth = 8;
var FlattenAfterBaseHits = 8;
var makeImpl = (cacheRoot, base, overlay, depth) => {
	const self = Object.create(Proto$1);
	self.cacheRoot = cacheRoot ?? self;
	self.base = base;
	self.overlay = overlay;
	self.depth = depth;
	self._flat = void 0;
	self.baseHits = 0;
	return self;
};
var applyOverlays = (map, overlay) => {
	if (!overlay) return;
	applyOverlays(map, overlay.parent);
	map.set(overlay.key, overlay.value);
};
var flatten$2 = (self) => {
	if (self._flat) return self._flat;
	if (!self.overlay) return self._flat = self.base;
	const map = new Map(self.base);
	applyOverlays(map, self.overlay);
	return self._flat = map;
};
var withFlat = (self, f) => {
	const map = new Map(self.mapUnsafe);
	f(map);
	return makeUnsafe$3(map);
};
var notFound = /*#__PURE__*/ Symbol();
var lookup$1 = (self, key) => {
	const impl = self;
	for (let overlay = impl.overlay; overlay; overlay = overlay.parent) if (overlay.key === key) return overlay.value;
	const value = impl.base.get(key);
	if (value === void 0 && !impl.base.has(key)) return notFound;
	if (impl.overlay && ++impl.baseHits >= FlattenAfterBaseHits) {
		impl.base = flatten$2(impl);
		impl.overlay = void 0;
		impl.depth = 0;
	}
	return value;
};
/**
* Creates a `Context` from an existing service map.
*
* **When to use**
*
* Use when constructing a low-level `Context` from a trusted map whose lifecycle
* you control.
*
* **Gotchas**
*
* The provided map is retained without copying and must not be mutated after
* construction. Prefer `empty`, `make`, `add`, or `merge` for normal Context
* construction.
*
* **Example** (Creating a context from a map)
*
* ```ts import.meta.vitest
* import { Context } from "effect"
*
* // Create a context from a Map (unsafe)
* const map = new Map([
*   ["Logger", { log: (_msg: string) => {} }]
* ])
*
* const context = Context.makeUnsafe(map)
* context.mapUnsafe.size // => 1
* ```
*
* @category constructors
* @since 4.0.0
*/
var makeUnsafe$3 = (mapUnsafe) => makeImpl(void 0, mapUnsafe, void 0, 0);
var Proto$1 = {
	get mapUnsafe() {
		return flatten$2(this);
	},
	...PipeInspectableProto,
	[TypeId$8]: { _Services: (_) => _ },
	toJSON() {
		return {
			_id: "Context",
			services: Array.from(this.mapUnsafe).map(([key, value]) => ({
				key,
				value
			}))
		};
	},
	[symbol](that) {
		if (!isContext(that)) return false;
		const self = this.mapUnsafe;
		const other = that.mapUnsafe;
		if (self.size !== other.size) return false;
		for (const [key, value] of self) if (!other.has(key) || !equals$2(value, other.get(key))) return false;
		return true;
	},
	[symbol$1]() {
		return number(this.mapUnsafe.size);
	}
};
/** @internal */
var hasSameCache = (self, that) => self.cacheRoot === that.cacheRoot;
/**
* Checks whether the provided argument is a `Context`.
*
* **When to use**
*
* Use to narrow an unknown value before passing it to APIs that require a
* `Context`.
*
* **Details**
*
* This checks the runtime `Context` marker and does not inspect which services
* the context contains.
*
* **Gotchas**
*
* This guard only proves that the value is a `Context`; it does not prove that
* any specific service is present.
*
* **Example** (Checking for contexts)
*
* ```ts import.meta.vitest
* import { Context } from "effect"
* Context.isContext(Context.empty()) // => true
* ```
*
* @see {@link isKey} for checking service keys
* @see {@link isReference} for checking references with defaults
*
* @category guards
* @since 2.0.0
*/
var isContext = (u) => hasProperty(u, TypeId$8);
/**
* Checks whether the provided argument is a `Reference`.
*
* **Example** (Checking for references)
*
* ```ts import.meta.vitest
* import { Context } from "effect"
*
* const LoggerRef = Context.Reference("Logger", {
*   defaultValue: () => ({ log: (_msg: string) => {} })
* })
*
* Context.isReference(LoggerRef) // => true
* Context.isReference(Context.Service("Key")) // => false
* ```
*
* @category guards
* @since 3.11.0
*/
var isReference = (u) => !!u[ReferenceTypeId];
/**
* Returns an empty `Context`.
*
* **Example** (Creating an empty context)
*
* ```ts import.meta.vitest
* import { Context } from "effect"
* Context.empty().mapUnsafe.size // => 0
* ```
*
* @category constructors
* @since 2.0.0
*/
var empty$2 = () => emptyContext;
var emptyContext = /*#__PURE__*/ makeUnsafe$3(/*#__PURE__*/ new Map());
/**
* Creates a new `Context` with a single service associated to the key.
*
* **Example** (Creating a context with one service)
*
* ```ts import.meta.vitest
* import { Context } from "effect"
*
* const Port = Context.Service<{ PORT: number }>("Port")
*
* const context = Context.make(Port, { PORT: 8080 })
*
* Context.get(context, Port).PORT // => 8080
* ```
*
* @category constructors
* @since 2.0.0
*/
var make$7 = (key, service) => makeUnsafe$3(/* @__PURE__ */ new Map([[key.key, service]]));
/**
* Adds a service to a given `Context`.
*
* **When to use**
*
* Use when you need to store a known service value in a `Context`.
*
* **Details**
*
* If the context already contains the same service key, the new service
* replaces the previous one.
*
* **Example** (Adding a service to a context)
*
* ```ts import.meta.vitest
* import { Context, pipe } from "effect"
*
* const Port = Context.Service<{ PORT: number }>("Port")
* const Timeout = Context.Service<{ TIMEOUT: number }>("Timeout")
*
* const someContext = Context.make(Port, { PORT: 8080 })
*
* const context = pipe(
*   someContext,
*   Context.add(Timeout, { TIMEOUT: 5000 })
* )
*
* const values = [Context.get(context, Port).PORT, Context.get(context, Timeout).TIMEOUT]
* values // => [8080, 5000]
* ```
*
* @see {@link addOrOmit} for adding or removing a service from an `Option`
*
* @category combining
* @since 2.0.0
*/
var add = /*#__PURE__*/ dual(3, (self, key, service) => addUnsafe(self, key.key, service));
/**
* Adds a service by key to a given `Context` using a string key.
*
* @category combining
* @since 4.0.0
*/
var addUnsafe = (self, key, service) => {
	const impl = self;
	const cacheRoot = cacheKeys.has(key) ? void 0 : impl.cacheRoot;
	if (impl.depth >= MaxDepth) {
		const map = new Map(impl.mapUnsafe);
		map.set(key, service);
		return makeImpl(cacheRoot, map, void 0, 0);
	}
	return makeImpl(cacheRoot, impl.base, {
		key,
		value: service,
		parent: impl.overlay
	}, impl.depth + 1);
};
/**
* Returns the service currently stored for a key, or `undefined` when the key
* is absent.
*
* **When to use**
*
* Use when you need to read the service stored for a key without resolving
* `Context.Reference` defaults.
*
* **Gotchas**
*
* This is a raw lookup and does not resolve default values for
* `Context.Reference` keys.
*
* @see {@link getOption} for a reference-aware optional lookup
*
* @category getters
* @since 4.0.0
*/
var getOrUndefined = /*#__PURE__*/ dual(2, (self, key) => getOrUndefinedUnsafe(self, key.key));
/** @internal */
var getOrUndefinedUnsafe = (self, key) => {
	const value = lookup$1(self, key);
	return value === notFound ? void 0 : value;
};
/**
* Gets the service for a key, throwing if an absent non-reference key cannot be
* resolved.
*
* **When to use**
*
* Use when you need to read a service from a context whose type does not prove
* the service is present.
*
* **Details**
*
* If the key is a `Context.Reference` and no override is stored in the
* context, its cached default value is returned. For absent non-reference keys,
* this function throws a runtime error.
*
* **Example** (Getting services unsafely)
*
* ```ts import.meta.vitest
* import { Context, Option } from "effect"
*
* const Port = Context.Service<{ PORT: number }>("Port")
* const Timeout = Context.Service<{ TIMEOUT: number }>("Timeout")
*
* const context = Context.make(Port, { PORT: 8080 })
*
* Context.getUnsafe(context, Port).PORT // => 8080
* Context.getOption(context, Timeout) // => Option.none()
* ```
*
* @see {@link get} for type-checked service access
* @see {@link getOption} for optional service access
*
* @category unsafe
* @since 4.0.0
*/
var getUnsafe = /*#__PURE__*/ dual(2, (self, service) => {
	const value = lookup$1(self, service.key);
	if (value === notFound) {
		if (isReference(service)) return getDefaultValue(service);
		throw serviceNotFoundError(service);
	}
	return value;
});
/**
* Gets a service from the context that corresponds to the given key.
*
* **When to use**
*
* Use when you need type-checked access to a service already included in the
* context type.
*
* **Example** (Getting a service from a context)
*
* ```ts import.meta.vitest
* import { Context, pipe } from "effect"
*
* const Port = Context.Service<{ PORT: number }>("Port")
* const Timeout = Context.Service<{ TIMEOUT: number }>("Timeout")
*
* const context = pipe(
*   Context.make(Port, { PORT: 8080 }),
*   Context.add(Timeout, { TIMEOUT: 5000 })
* )
*
* Context.get(context, Timeout).TIMEOUT // => 5000
* ```
*
* @see {@link getOption} for optional service access
* @see {@link getOrElse} for fallback values
*
* @category getters
* @since 2.0.0
*/
var get = getUnsafe;
var defaultValueCacheKey = "~effect/Context/defaultValue";
var getDefaultValue = (ref) => {
	if (defaultValueCacheKey in ref) return ref[defaultValueCacheKey];
	return ref[defaultValueCacheKey] = ref.defaultValue();
};
var serviceNotFoundError = (service) => {
	const error = /* @__PURE__ */ new Error(`Service not found${service.key ? `: ${String(service.key)}` : ""}`);
	if (error.stack) {
		const lines = error.stack.split("\n");
		lines.splice(1, 3);
		error.stack = lines.join("\n");
	}
	return error;
};
/**
* Gets the service for a key safely wrapped in an `Option`.
*
* **When to use**
*
* Use when you need to read a `Context` service as an `Option` so absence is
* represented as data.
*
* **Details**
*
* Returns `Option.some` when the service is stored in the context. If the key
* is a `Context.Reference` and no override is stored, returns `Option.some` of
* the cached default value. Missing non-reference keys return `Option.none`.
*
* **Example** (Getting optional services)
*
* ```ts import.meta.vitest
* import { Context, Option } from "effect"
*
* const Port = Context.Service<{ PORT: number }>("Port")
* const Timeout = Context.Service<{ TIMEOUT: number }>("Timeout")
*
* const context = Context.make(Port, { PORT: 8080 })
*
* Context.getOption(context, Port) // => Option.some({ PORT: 8080 })
* Context.getOption(context, Timeout) // => Option.none()
* ```
*
* @see {@link getOrElse} for returning a fallback value directly
*
* @category getters
* @since 2.0.0
*/
var getOption = /*#__PURE__*/ dual(2, (self, service) => {
	const value = lookup$1(self, service.key);
	if (value !== notFound) return some(value);
	return isReference(service) ? some(getDefaultValue(service)) : none();
});
/**
* Merges two `Context`s into one.
*
* **When to use**
*
* Use when you need to combine two contexts.
*
* **Details**
*
* When both contexts contain the same service key, the service from `that`
* overrides the service from `self`.
*
* **Example** (Merging two contexts)
*
* ```ts import.meta.vitest
* import { Context } from "effect"
*
* const Port = Context.Service<{ PORT: number }>("Port")
* const Timeout = Context.Service<{ TIMEOUT: number }>("Timeout")
*
* const firstContext = Context.make(Port, { PORT: 8080 })
* const secondContext = Context.make(Timeout, { TIMEOUT: 5000 })
*
* const context = Context.merge(firstContext, secondContext)
*
* const values = [Context.get(context, Port).PORT, Context.get(context, Timeout).TIMEOUT]
* values // => [8080, 5000]
* ```
*
* @see {@link mergeAll} for merging more than two contexts at once
*
* @category combining
* @since 2.0.0
*/
var merge$1 = /*#__PURE__*/ dual(2, (self, that) => {
	if (self.mapUnsafe.size === 0) return that;
	if (that.mapUnsafe.size === 0) return self;
	return withFlat(self, (map) => that.mapUnsafe.forEach((value, key) => map.set(key, value)));
});
/**
* Merges any number of `Context`s into one.
*
* **When to use**
*
* Use when you need to combine a variadic list of contexts.
*
* **Details**
*
* When multiple contexts contain the same service key, the service from the
* last context with that key is kept.
*
* **Example** (Merging multiple contexts)
*
* ```ts import.meta.vitest
* import { Context } from "effect"
*
* const Port = Context.Service<{ PORT: number }>("Port")
* const Timeout = Context.Service<{ TIMEOUT: number }>("Timeout")
* const Host = Context.Service<{ HOST: string }>("Host")
*
* const firstContext = Context.make(Port, { PORT: 8080 })
* const secondContext = Context.make(Timeout, { TIMEOUT: 5000 })
* const thirdContext = Context.make(Host, { HOST: "localhost" })
*
* const context = Context.mergeAll(
*   firstContext,
*   secondContext,
*   thirdContext
* )
*
* context.mapUnsafe.size // => 3
* ```
*
* @see {@link merge} for merging two contexts
*
* @category combining
* @since 3.12.0
*/
var mergeAll$1 = (...ctxs) => {
	const map = /* @__PURE__ */ new Map();
	for (let i = 0; i < ctxs.length; i++) ctxs[i].mapUnsafe.forEach((value, key) => {
		map.set(key, value);
	});
	return makeUnsafe$3(map);
};
/**
* Creates a context key with a default value.
*
* **When to use**
*
* Use when you need to define a context key with a lazily computed default
* value.
*
* **Details**
*
* `Context.Reference` allows you to create a key that can hold a value. You
* can provide a default value for the service, which will automatically be used
* when the context is accessed, or override it with a custom implementation
* when needed. The default value is computed lazily and cached on the
* reference.
*
* **Example** (Creating references with default values)
*
* ```ts import.meta.vitest
* import { Context } from "effect"
*
* // Create a reference with a default value
* const messages: Array<string> = []
* const LoggerRef = Context.Reference("Logger", {
*   defaultValue: () => ({ log: (msg: string) => messages.push(`Default: ${msg}`) })
* })
*
* // The reference provides the default value when accessed from an empty context
* const context = Context.empty()
* const logger = Context.get(context, LoggerRef)
*
* // You can also override the default value
* const customContext = Context.make(LoggerRef, {
*   log: (msg: string) => messages.push(`Custom: ${msg}`)
* })
* const customLogger = Context.get(customContext, LoggerRef)
* logger.log("default")
* customLogger.log("message")
* messages // => ["Default: default", "Custom: message"]
* ```
*
* @see {@link Service} for required services without default values
*
* @category services
* @since 3.11.0
*/
var Reference = Service;
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0-rc.112/node_modules/effect/dist/Duration.js
var TypeId$7 = "~effect/time/Duration";
var bigint0$1 = /*#__PURE__*/ BigInt(0);
var bigint1 = /*#__PURE__*/ BigInt(1);
var bigint2 = /*#__PURE__*/ BigInt(2);
var bigint10 = /*#__PURE__*/ BigInt(10);
var bigint24 = /*#__PURE__*/ BigInt(24);
var bigint60 = /*#__PURE__*/ BigInt(60);
var bigint1e3 = /*#__PURE__*/ BigInt(1e3);
var bigint1e6$1 = /*#__PURE__*/ BigInt(1e6);
var roundTiesAwayFromZero = (input) => BigInt(input < 0 ? Math.ceil(input - .5) : Math.floor(input + .5));
var roundMillisToNanos = (millis) => roundTiesAwayFromZero(millis * 1e6);
var parseNanos = (input, scale) => {
	const decimalIndex = input.indexOf(".");
	if (decimalIndex === -1) return BigInt(input) * scale;
	const isNegative = input[0] === "-";
	const fractional = input.slice(decimalIndex + 1);
	const fractionalScale = bigint10 ** BigInt(fractional.length);
	const scaled = (BigInt(input.slice(isNegative ? 1 : 0, decimalIndex)) * fractionalScale + BigInt(fractional)) * scale;
	const rounded = scaled / fractionalScale + (scaled % fractionalScale * bigint2 >= fractionalScale ? bigint1 : bigint0$1);
	return isNegative ? -rounded : rounded;
};
var DURATION_REGEXP = /^(-?\d+(?:\.\d+)?)\s+(nanos?|micros?|millis?|seconds?|minutes?|hours?|days?|weeks?)$/;
/**
* Decodes a `Duration.Input` into a `Duration`.
*
* **When to use**
*
* Use when the input has already been validated or comes from a trusted source
* and throwing is acceptable for invalid duration syntax.
*
* **Gotchas**
*
* If the input is not a valid `Duration.Input`, it throws an error.
*
* **Example** (Decoding duration inputs)
*
* ```ts import.meta.vitest
* import { Duration } from "effect"
*
* Duration.fromInputUnsafe(1000) // => Duration.millis(1000)
* Duration.fromInputUnsafe("5 seconds") // => Duration.seconds(5)
* Duration.fromInputUnsafe("Infinity") // => Duration.infinity
* Duration.fromInputUnsafe([2, 500_000_000]) // => Duration.nanos(2_500_000_000n)
* ```
*
* @category constructors
* @since 4.0.0
*/
var fromInputUnsafe = (input) => {
	switch (typeof input) {
		case "number": return millis(input);
		case "bigint": return nanos(input);
		case "string": {
			if (input === "Infinity") return infinity;
			if (input === "-Infinity") return negativeInfinity;
			const match = DURATION_REGEXP.exec(input);
			if (!match) break;
			const [_, valueStr, unit] = match;
			if (unit === "nano" || unit === "nanos") return nanos(parseNanos(valueStr, bigint1));
			if (unit === "micro" || unit === "micros") return nanos(parseNanos(valueStr, bigint1e3));
			const value = Number(valueStr);
			switch (unit) {
				case "milli":
				case "millis": return millis(value);
				case "second":
				case "seconds": return seconds(value);
				case "minute":
				case "minutes": return minutes(value);
				case "hour":
				case "hours": return hours(value);
				case "day":
				case "days": return days(value);
				case "week":
				case "weeks": return weeks(value);
			}
			break;
		}
		case "object": {
			if (input === null) break;
			if (TypeId$7 in input) return input;
			if (Array.isArray(input)) {
				if (input.length !== 2 || !input.every(isNumber)) return invalid(input);
				if (Number.isNaN(input[0]) || Number.isNaN(input[1])) return zero;
				if (input[0] === -Infinity || input[1] === -Infinity) return negativeInfinity;
				if (input[0] === Infinity || input[1] === Infinity) return infinity;
				return make$6(roundTiesAwayFromZero(input[0] * 1e9 + input[1]));
			}
			const obj = input;
			let millis = 0;
			if (obj.weeks) millis += obj.weeks * 6048e5;
			if (obj.days) millis += obj.days * 864e5;
			if (obj.hours) millis += obj.hours * 36e5;
			if (obj.minutes) millis += obj.minutes * 6e4;
			if (obj.seconds) millis += obj.seconds * 1e3;
			if (obj.milliseconds) millis += obj.milliseconds;
			if (!obj.microseconds && !obj.nanoseconds) return make$6(millis);
			return make$6(roundTiesAwayFromZero(millis * 1e6 + (obj.microseconds ?? 0) * 1e3 + (obj.nanoseconds ?? 0)));
		}
	}
	return invalid(input);
};
var invalid = (input) => {
	throw new Error(`Invalid Input: ${input}`);
};
/**
* Decodes a `Input` value into a `Duration` safely, returning
* `Option.none()` if decoding fails.
*
* **Example** (Safely decoding duration inputs)
*
* ```ts import.meta.vitest
* import { Duration, Option } from "effect"
*
* Duration.fromInput(1000) // => Option.some(Duration.seconds(1))
* Duration.fromInput("invalid" as any) // => Option.none()
* ```
*
* @category constructors
* @since 4.0.0
*/
var fromInput = /*#__PURE__*/ liftThrowable(fromInputUnsafe);
var zeroDurationValue = {
	_tag: "Millis",
	millis: 0
};
var infinityDurationValue = { _tag: "Infinity" };
var negativeInfinityDurationValue = { _tag: "NegativeInfinity" };
var DurationProto = {
	[TypeId$7]: TypeId$7,
	[symbol$1]() {
		switch (this.value._tag) {
			case "Millis": {
				const nanos = this.value.millis * 1e6;
				return Number.isFinite(nanos) ? hash(roundTiesAwayFromZero(nanos)) : number(this.value.millis);
			}
			case "Nanos": return hash(this.value.nanos);
			default: return structure(this.value);
		}
	},
	[symbol](that) {
		return isDuration(that) && equals$1(this, that);
	},
	toString() {
		switch (this.value._tag) {
			case "Infinity": return "Infinity";
			case "NegativeInfinity": return "-Infinity";
			case "Nanos": return `${this.value.nanos} nanos`;
			case "Millis": return `${this.value.millis} millis`;
		}
	},
	toJSON() {
		switch (this.value._tag) {
			case "Millis": return {
				_id: "Duration",
				_tag: "Millis",
				millis: this.value.millis
			};
			case "Nanos": return {
				_id: "Duration",
				_tag: "Nanos",
				nanos: String(this.value.nanos)
			};
			case "Infinity": return {
				_id: "Duration",
				_tag: "Infinity"
			};
			case "NegativeInfinity": return {
				_id: "Duration",
				_tag: "NegativeInfinity"
			};
		}
	},
	[NodeInspectSymbol]() {
		return this.toJSON();
	},
	pipe() {
		return pipeArguments(this, arguments);
	}
};
var make$6 = (input) => {
	const duration = Object.create(DurationProto);
	if (typeof input === "number") {
		if (isNaN(input) || input === 0 || Object.is(input, -0)) duration.value = zeroDurationValue;
		else if (!Number.isFinite(input)) duration.value = input > 0 ? infinityDurationValue : negativeInfinityDurationValue;
		else if (!Number.isInteger(input)) duration.value = {
			_tag: "Nanos",
			nanos: roundMillisToNanos(input)
		};
		else duration.value = {
			_tag: "Millis",
			millis: input
		};
	} else if (input === bigint0$1) duration.value = zeroDurationValue;
	else duration.value = {
		_tag: "Nanos",
		nanos: input
	};
	return duration;
};
/**
* Checks whether a value is a Duration.
*
* **Example** (Checking for durations)
*
* ```ts import.meta.vitest
* import { Duration } from "effect"
*
* Duration.isDuration(Duration.seconds(1)) // => true
* Duration.isDuration(1000) // => false
* ```
*
* @category guards
* @since 2.0.0
*/
var isDuration = (u) => hasProperty(u, TypeId$7);
/**
* Checks whether a Duration is finite (not infinite).
*
* **Example** (Checking finite durations)
*
* ```ts import.meta.vitest
* import { Duration } from "effect"
*
* Duration.isFinite(Duration.seconds(5)) // => true
* Duration.isFinite(Duration.infinity) // => false
* ```
*
* @category predicates
* @since 2.0.0
*/
var isFinite = (self) => self.value._tag !== "Infinity" && self.value._tag !== "NegativeInfinity";
/**
* Checks whether a Duration is zero.
*
* **Example** (Checking for zero durations)
*
* ```ts import.meta.vitest
* import { Duration } from "effect"
*
* Duration.isZero(Duration.zero) // => true
* Duration.isZero(Duration.seconds(1)) // => false
* ```
*
* @category predicates
* @since 3.5.0
*/
var isZero = (self) => {
	switch (self.value._tag) {
		case "Millis": return self.value.millis === 0;
		case "Nanos": return self.value.nanos === bigint0$1;
		case "Infinity":
		case "NegativeInfinity": return false;
	}
};
/**
* Returns `true` if the duration is negative (strictly less than zero).
*
* **Example** (Checking for negative durations)
*
* ```ts import.meta.vitest
* import { Duration } from "effect"
*
* Duration.isNegative(Duration.seconds(-5)) // => true
* Duration.isNegative(Duration.zero) // => false
* Duration.isNegative(Duration.negativeInfinity) // => true
* ```
*
* @category predicates
* @since 4.0.0
*/
var isNegative = (self) => {
	switch (self.value._tag) {
		case "Millis": return self.value.millis < 0;
		case "Nanos": return self.value.nanos < bigint0$1;
		case "NegativeInfinity": return true;
		case "Infinity": return false;
	}
};
/**
* Returns the absolute value of the duration.
*
* **Example** (Taking absolute duration values)
*
* ```ts import.meta.vitest
* import { Duration } from "effect"
*
* Duration.abs(Duration.seconds(-5)) // => Duration.seconds(5)
* Duration.abs(Duration.negativeInfinity) // => Duration.infinity
* ```
*
* @category math
* @since 4.0.0
*/
var abs = (self) => {
	switch (self.value._tag) {
		case "Infinity":
		case "NegativeInfinity": return infinity;
		case "Millis": return self.value.millis < 0 ? make$6(-self.value.millis) : self;
		case "Nanos": return self.value.nanos < bigint0$1 ? make$6(-self.value.nanos) : self;
	}
};
/**
* A Duration representing zero time.
*
* **Example** (Referencing the zero duration)
*
* ```ts import.meta.vitest
* import { Duration } from "effect"
*
* Duration.toMillis(Duration.zero) // => 0
* ```
*
* @category constructors
* @since 2.0.0
*/
var zero = /*#__PURE__*/ make$6(0);
/**
* A Duration representing infinite time.
*
* **Example** (Referencing infinite duration)
*
* ```ts import.meta.vitest
* import { Duration } from "effect"
*
* Duration.toMillis(Duration.infinity) // => Infinity
* ```
*
* @category constructors
* @since 2.0.0
*/
var infinity = /*#__PURE__*/ make$6(Infinity);
/**
* A Duration representing negative infinite time.
*
* **Example** (Referencing negative infinite duration)
*
* ```ts import.meta.vitest
* import { Duration } from "effect"
*
* Duration.toMillis(Duration.negativeInfinity) // => -Infinity
* ```
*
* @category constructors
* @since 4.0.0
*/
var negativeInfinity = /*#__PURE__*/ make$6(-Infinity);
/**
* Creates a Duration from nanoseconds.
*
* **Example** (Creating durations from nanoseconds)
*
* ```ts import.meta.vitest
* import { Duration } from "effect"
*
* Duration.nanos(500_000_000n) // => Duration.nanos(500_000_000n)
* ```
*
* @category constructors
* @since 2.0.0
*/
var nanos = (nanos) => make$6(nanos);
/**
* Creates a Duration from milliseconds.
*
* **Example** (Creating durations from milliseconds)
*
* ```ts import.meta.vitest
* import { Duration } from "effect"
*
* Duration.toMillis(Duration.millis(1000)) // => 1000
* ```
*
* @category constructors
* @since 2.0.0
*/
var millis = (millis) => make$6(millis);
/**
* Creates a Duration from seconds.
*
* **Example** (Creating durations from seconds)
*
* ```ts import.meta.vitest
* import { Duration } from "effect"
*
* Duration.toMillis(Duration.seconds(30)) // => 30_000
* ```
*
* @category constructors
* @since 2.0.0
*/
var seconds = (seconds) => make$6(seconds * 1e3);
/**
* Creates a Duration from minutes.
*
* **Example** (Creating durations from minutes)
*
* ```ts import.meta.vitest
* import { Duration } from "effect"
*
* Duration.toMillis(Duration.minutes(5)) // => 300_000
* ```
*
* @category constructors
* @since 2.0.0
*/
var minutes = (minutes) => make$6(minutes * 6e4);
/**
* Creates a Duration from hours.
*
* **Example** (Creating durations from hours)
*
* ```ts import.meta.vitest
* import { Duration } from "effect"
*
* Duration.toMillis(Duration.hours(2)) // => 7_200_000
* ```
*
* @category constructors
* @since 2.0.0
*/
var hours = (hours) => make$6(hours * 36e5);
/**
* Creates a Duration from days.
*
* **Example** (Creating durations from days)
*
* ```ts import.meta.vitest
* import { Duration } from "effect"
*
* Duration.toMillis(Duration.days(1)) // => 86_400_000
* ```
*
* @category constructors
* @since 2.0.0
*/
var days = (days) => make$6(days * 864e5);
/**
* Creates a Duration from weeks.
*
* **Example** (Creating durations from weeks)
*
* ```ts import.meta.vitest
* import { Duration } from "effect"
*
* Duration.toMillis(Duration.weeks(1)) // => 604_800_000
* ```
*
* @category constructors
* @since 2.0.0
*/
var weeks = (weeks) => make$6(weeks * 6048e5);
/**
* Converts a Duration to milliseconds.
*
* **Example** (Converting durations to milliseconds)
*
* ```ts import.meta.vitest
* import { Duration } from "effect"
*
* Duration.toMillis(Duration.seconds(5)) // => 5000
* Duration.toMillis(Duration.minutes(2)) // => 120_000
* ```
*
* @category getters
* @since 2.0.0
*/
var toMillis = (self) => match$3(fromInputUnsafe(self), {
	onMillis: identity,
	onNanos: (nanos) => Number(nanos) / 1e6,
	onInfinity: () => Infinity,
	onNegativeInfinity: () => -Infinity
});
/**
* Gets the duration in nanoseconds as a bigint.
*
* **When to use**
*
* Use when the duration is known to be finite and you need the nanosecond value
* as a `bigint`.
*
* **Details**
*
* Millisecond-backed fractional durations are rounded to the nearest
* nanosecond, with ties away from zero.
*
* **Gotchas**
*
* If the duration is infinite, it throws an error.
*
* **Example** (Reading nanoseconds unsafely)
*
* ```ts import.meta.vitest
* import { Duration } from "effect"
*
* Duration.toNanosUnsafe(Duration.seconds(2)) // => 2_000_000_000n
*
* // Duration.toNanosUnsafe(Duration.infinity)
* // throws Error: "Cannot convert infinite duration to nanos"
* ```
*
* @category getters
* @since 4.0.0
*/
var toNanosUnsafe = (input) => {
	const self = fromInputUnsafe(input);
	switch (self.value._tag) {
		case "Infinity":
		case "NegativeInfinity": throw new Error("Cannot convert infinite duration to nanos");
		case "Nanos": return self.value.nanos;
		case "Millis": return roundMillisToNanos(self.value.millis);
	}
};
/**
* Gets the duration in nanoseconds safely as an `Option<bigint>`.
*
* **Details**
*
* If the duration is infinite, returns `Option.none()`.
*
* **Example** (Safely reading nanoseconds)
*
* ```ts import.meta.vitest
* import { Duration, Option } from "effect"
*
* Duration.toNanos(Duration.seconds(1)) // => Option.some(1_000_000_000n)
* Duration.toNanos(Duration.infinity) // => Option.none()
* ```
*
* @category getters
* @since 2.0.0
*/
var toNanos = /*#__PURE__*/ liftThrowable(toNanosUnsafe);
/**
* Pattern matches on the representation of a `Duration`.
*
* **Details**
*
* Provide handlers for millisecond-backed values, nanosecond-backed values,
* and positive infinity. Use `onNegativeInfinity` to handle negative infinity
* separately; otherwise negative infinity is handled by `onInfinity`.
*
* **Example** (Pattern matching on duration representations)
*
* ```ts import.meta.vitest
* import { Duration } from "effect"
*
* Duration.match(Duration.seconds(5), {
*   onMillis: (millis) => `${millis} milliseconds`,
*   onNanos: (nanos) => `${nanos} nanoseconds`,
*   onInfinity: () => "infinite"
* }) // => "5000 milliseconds"
* ```
*
* @category pattern matching
* @since 2.0.0
*/
var match$3 = /*#__PURE__*/ dual(2, (self, options) => {
	switch (self.value._tag) {
		case "Millis": return options.onMillis(self.value.millis);
		case "Nanos": return options.onNanos(self.value.nanos);
		case "Infinity": return options.onInfinity();
		case "NegativeInfinity": return (options.onNegativeInfinity ?? options.onInfinity)();
	}
});
/**
* Pattern matches on two `Duration`s, providing handlers that receive both values.
*
* **Example** (Pattern matching on duration pairs)
*
* ```ts import.meta.vitest
* import { Duration } from "effect"
*
* Duration.matchPair(Duration.seconds(3), Duration.seconds(2), {
*   onMillis: (a, b) => a + b,
*   onNanos: (a, b) => Number(a + b),
*   onInfinity: () => Infinity
* }) // => 5000
* ```
*
* @category pattern matching
* @since 4.0.0
*/
var matchPair = /*#__PURE__*/ dual(3, (self, that, options) => {
	if (self.value._tag === "Infinity" || self.value._tag === "NegativeInfinity" || that.value._tag === "Infinity" || that.value._tag === "NegativeInfinity") return options.onInfinity(self, that);
	if (self.value._tag === "Millis") return that.value._tag === "Millis" ? options.onMillis(self.value.millis, that.value.millis) : options.onNanos(toNanosUnsafe(self), that.value.nanos);
	else return options.onNanos(self.value.nanos, toNanosUnsafe(that));
});
/**
* Provides an `Order` instance for comparing `Duration` values.
*
* **Details**
*
* `NegativeInfinity` < any finite value < `Infinity`.
*
* **Example** (Sorting durations)
*
* ```ts import.meta.vitest
* import { Duration } from "effect"
*
* const durations = [
*   Duration.seconds(3),
*   Duration.seconds(1),
*   Duration.seconds(2)
* ]
* durations.sort((a, b) => Duration.Order(a, b)).map(Duration.toSeconds) // => [1, 2, 3]
* ```
*
* @category instances
* @since 2.0.0
*/
var Order$2 = /*#__PURE__*/ make$8((self, that) => matchPair(self, that, {
	onMillis: (self, that) => self < that ? -1 : self > that ? 1 : 0,
	onNanos: (self, that) => self < that ? -1 : self > that ? 1 : 0,
	onInfinity: (self, that) => {
		if (self.value._tag === that.value._tag) return 0;
		if (self.value._tag === "Infinity") return 1;
		if (self.value._tag === "NegativeInfinity") return -1;
		if (that.value._tag === "Infinity") return -1;
		return 1;
	}
}));
/**
* Provides an `Equivalence` instance for comparing `Duration` values.
*
* **Example** (Comparing durations for equivalence)
*
* ```ts import.meta.vitest
* import { Duration } from "effect"
*
* Duration.Equivalence(Duration.seconds(5), Duration.millis(5000)) // => true
* ```
*
* @category instances
* @since 2.0.0
*/
var Equivalence$2 = (self, that) => matchPair(self, that, {
	onMillis: (self, that) => self === that,
	onNanos: (self, that) => self === that,
	onInfinity: (self, that) => self.value._tag === that.value._tag
});
/**
* Returns the smaller of two Durations.
*
* **Example** (Selecting the shorter duration)
*
* ```ts import.meta.vitest
* import { Duration } from "effect"
*
* Duration.min(Duration.seconds(5), Duration.seconds(3)) // => Duration.seconds(3)
* ```
*
* @category ordering
* @since 2.0.0
*/
var min$1 = /*#__PURE__*/ min$2(Order$2);
/**
* Returns the larger of two Durations.
*
* **Example** (Selecting the longer duration)
*
* ```ts import.meta.vitest
* import { Duration } from "effect"
*
* Duration.max(Duration.seconds(5), Duration.seconds(3)) // => Duration.seconds(5)
* ```
*
* @category ordering
* @since 2.0.0
*/
var max$1 = /*#__PURE__*/ max$2(Order$2);
/**
* Subtracts one Duration from another. The result can be negative.
*
* **Details**
*
* Infinity subtraction follows signed-infinity arithmetic. Subtracting the
* same infinity from itself returns zero. Positive infinity minus negative
* infinity or any finite duration remains positive infinity. Negative infinity
* minus positive infinity or any finite duration remains negative infinity.
* Finite durations minus positive infinity produce negative infinity, and
* finite durations minus negative infinity produce positive infinity.
*
* **Example** (Subtracting durations)
*
* ```ts import.meta.vitest
* import { Duration } from "effect"
*
* Duration.subtract(Duration.seconds(10), Duration.seconds(3)) // => Duration.seconds(7)
* ```
*
* @category math
* @since 2.0.0
*/
var subtract = /*#__PURE__*/ dual(2, (self, that) => matchPair(self, that, {
	onMillis: (self, that) => make$6(self - that),
	onNanos: (self, that) => make$6(self - that),
	onInfinity: (self, that) => {
		const s = self.value._tag;
		const t = that.value._tag;
		if (s === "Infinity") return t === "Infinity" ? zero : infinity;
		if (s === "NegativeInfinity") return t === "NegativeInfinity" ? zero : negativeInfinity;
		return t === "Infinity" ? negativeInfinity : infinity;
	}
}));
/**
* Adds two Durations together.
*
* **Details**
*
* Infinity addition follows these rules:
*
* - infinity + infinity = infinity
* - infinity + negativeInfinity = zero
* - infinity + finite = infinity
* - negativeInfinity + negativeInfinity = negativeInfinity
* - negativeInfinity + finite = negativeInfinity
*
* **Example** (Adding durations)
*
* ```ts import.meta.vitest
* import { Duration } from "effect"
*
* Duration.sum(Duration.seconds(5), Duration.seconds(3)) // => Duration.seconds(8)
* ```
*
* @category math
* @since 2.0.0
*/
var sum = /*#__PURE__*/ dual(2, (self, that) => matchPair(self, that, {
	onMillis: (self, that) => make$6(self + that),
	onNanos: (self, that) => make$6(self + that),
	onInfinity: (self, that) => {
		const s = self.value._tag;
		const t = that.value._tag;
		if (s === "Infinity" && t === "NegativeInfinity") return zero;
		if (s === "NegativeInfinity" && t === "Infinity") return zero;
		if (s === "Infinity" || t === "Infinity") return infinity;
		if (s === "NegativeInfinity" || t === "NegativeInfinity") return negativeInfinity;
		return zero;
	}
}));
/**
* Checks whether the first Duration is less than or equal to the second.
*
* **Example** (Comparing durations with less than or equal)
*
* ```ts import.meta.vitest
* import { Duration } from "effect"
*
* Duration.isLessThanOrEqualTo(
*   Duration.seconds(5),
*   Duration.seconds(5)
* ) // => true
* ```
*
* @category predicates
* @since 4.0.0
*/
var isLessThanOrEqualTo = /*#__PURE__*/ isLessThanOrEqualTo$1(Order$2);
/**
* Checks whether two Durations are equal.
*
* **Example** (Checking duration equality)
*
* ```ts import.meta.vitest
* import { Duration } from "effect"
*
* Duration.equals(Duration.seconds(5), Duration.millis(5000)) // => true
* ```
*
* @category predicates
* @since 2.0.0
*/
var equals$1 = /*#__PURE__*/ dual(2, (self, that) => Equivalence$2(self, that));
/**
* Decomposes a `Duration` into normalized signed components.
*
* **Details**
*
* Finite durations are returned as `{ days, hours, minutes, seconds, millis,
* nanos }`. Infinite durations return every component as `Infinity` or
* `-Infinity`.
*
* **Example** (Decomposing durations into parts)
*
* ```ts import.meta.vitest
* import { Duration } from "effect"
*
* // Create a complex duration by adding multiple parts
* const duration = Duration.sum(
*   Duration.sum(
*     Duration.sum(Duration.days(1), Duration.hours(2)),
*     Duration.sum(Duration.minutes(30), Duration.seconds(45))
*   ),
*   Duration.millis(123)
* )
* Duration.parts(duration) // => ({ days: 1, hours: 2, minutes: 30, seconds: 45, millis: 123, nanos: 0 })
*
* const complex = Duration.sum(Duration.hours(25), Duration.minutes(90))
* Duration.parts(complex) // => ({ days: 1, hours: 2, minutes: 30, seconds: 0, millis: 0, nanos: 0 })
* ```
*
* @category converting
* @since 3.8.0
*/
var parts = (self) => {
	if (self.value._tag === "Infinity") return {
		days: Infinity,
		hours: Infinity,
		minutes: Infinity,
		seconds: Infinity,
		millis: Infinity,
		nanos: Infinity
	};
	if (self.value._tag === "NegativeInfinity") return {
		days: -Infinity,
		hours: -Infinity,
		minutes: -Infinity,
		seconds: -Infinity,
		millis: -Infinity,
		nanos: -Infinity
	};
	const n = toNanosUnsafe(self);
	const neg = n < bigint0$1;
	const a = neg ? -n : n;
	const ms = a / bigint1e6$1;
	const sec = ms / bigint1e3;
	const min = sec / bigint60;
	const hr = min / bigint60;
	const d = hr / bigint24;
	const sign = neg ? -1 : 1;
	return {
		days: sign * Number(d),
		hours: sign * Number(hr % bigint24),
		minutes: sign * Number(min % bigint60),
		seconds: sign * Number(sec % bigint60),
		millis: sign * Number(ms % bigint1e3),
		nanos: sign * Number(a % bigint1e6$1)
	};
};
/**
* Converts a `Duration` to a human readable string.
*
* **Example** (Formatting durations)
*
* ```ts import.meta.vitest
* import { Duration } from "effect"
*
* Duration.format(Duration.millis(1000)) // => "1s"
* Duration.format(Duration.millis(1001)) // => "1s 1ms"
* ```
*
* @category converting
* @since 2.0.0
*/
var format = (self) => {
	if (self.value._tag === "Infinity") return "Infinity";
	if (self.value._tag === "NegativeInfinity") return "-Infinity";
	if (isZero(self)) return "0";
	if (isNegative(self)) return "-" + format(abs(self));
	const fragments = parts(self);
	const pieces = [];
	if (fragments.days !== 0) pieces.push(`${fragments.days}d`);
	if (fragments.hours !== 0) pieces.push(`${fragments.hours}h`);
	if (fragments.minutes !== 0) pieces.push(`${fragments.minutes}m`);
	if (fragments.seconds !== 0) pieces.push(`${fragments.seconds}s`);
	if (fragments.millis !== 0) pieces.push(`${fragments.millis}ms`);
	if (fragments.nanos !== 0) pieces.push(`${fragments.nanos}ns`);
	return pieces.join(" ");
};
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0-rc.112/node_modules/effect/dist/Filter.js
/**
* Creates a `Filter` from a function that returns an `Option`; `Some(value)`
* passes with `value`, and `None` fails with the original input.
*
* @category constructors
* @since 4.0.0
*/
var fromPredicateOption = (predicate) => (input) => {
	const o = predicate(input);
	return o._tag === "None" ? fail$5(input) : succeed$5(o.value);
};
/**
* Converts a Filter into a predicate function.
*
* **When to use**
*
* Use to reuse a `Filter` with APIs that accept only boolean predicates when
* the pass and fail payloads are not needed.
*
* @see {@link toOption} for keeping passed values and discarding failure values
* @see {@link toResult} for preserving both pass and failure values
*
* @category converting
* @since 4.0.0
*/
var toPredicate = (self) => (input) => !isFailure$3(self(input));
/**
* Creates a `Filter` that passes inputs whose `has(key)` method returns
* `true` for the specified key.
*
* **When to use**
*
* Use to keep inputs that expose a `has` method, such as `Set` or `Map`, when
* they contain a required key.
*
* @see {@link fromPredicate} for custom predicate filters or inputs without a
* `has` method
* @see {@link Predicate.hasProperty} for guarding property presence instead of
* calling an input's `has` method
*
* @category constructors
* @since 4.0.0
*/
var has = (key) => (input) => input.has(key) ? succeed$5(input) : fail$5(input);
/**
* Creates a filter that checks if an input is tagged with a specific tag.
*
* **When to use**
*
* Use to keep only the matching member of a `_tag`-discriminated union while
* staying in a composable `Filter` / `Result` pipeline.
*
* **Details**
*
* The filter succeeds when `Predicate.isTagged(input, tag)` returns `true`.
* Otherwise it fails with the original input.
*
* **Gotchas**
*
* This only checks `_tag`; it does not validate the rest of the variant fields.
*
* @see {@link Predicate.isTagged} for the underlying boolean guard when a
* `Filter` result is not needed
* @see {@link reason} for extracting a nested reason variant from tagged errors
*
* @category constructors
* @since 4.0.0
*/
var tagged = function() {
	return arguments.length === 0 ? taggedImpl : taggedImpl(arguments[0]);
};
var taggedImpl = (tag) => (input) => isTagged(input, tag) ? succeed$5(input) : fail$5(input);
/**
* Composes two filters sequentially, feeding the output of the first into the second.
*
* **Example** (Composing filters)
*
* ```ts import.meta.vitest
* import { Filter, Result } from "effect"
*
* const stringFilter = Filter.string
* const nonEmptyUpper = Filter.make((s: string) =>
*   s.length > 0 ? Result.succeed(s.toUpperCase()) : Result.fail(s)
* )
*
* const stringToUpper = Filter.compose(stringFilter, nonEmptyUpper)
* stringToUpper("hello") // => Result.succeed("HELLO")
* ```
*
* @category combinators
* @since 4.0.0
*/
var compose = /*#__PURE__*/ dual(2, (left, right) => (input) => {
	const leftOut = left(input);
	if (isFailure$3(leftOut)) return leftOut;
	return right(leftOut.success);
});
/**
* Converts a `Filter` into a function that returns `Some` for passed values
* and `None` for filtered-out values.
*
* **When to use**
*
* Use when adapting a `Filter` to `Option`-based code where passed values
* become `Some` and filtered-out inputs become `None`.
*
* @see {@link toResult} for keeping the filter failure value
* @see {@link toPredicate} for plain boolean pass/fail checks
*
* @category converting
* @since 4.0.0
*/
var toOption = (self) => (input) => {
	const result = self(input);
	return isFailure$3(result) ? none() : some(result.success);
};
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0-rc.112/node_modules/effect/dist/Scheduler.js
/**
* Controls how runnable Effect fiber tasks are dispatched.
*
* A scheduler decides how tasks are queued, when queued tasks run, and when a
* fiber should pause so other work can continue. This module includes the
* scheduler service reference, the default `MixedScheduler`, dispatcher types
* for queued tasks, and references for tuning or disabling automatic scheduler
* yields.
*
* @since 2.0.0
*/
/**
* Context reference for the scheduler used by the Effect runtime.
*
* **When to use**
*
* Use when you need to replace scheduling behavior globally in tests or runtime
* setup, such as forcing deterministic task dispatch.
*
* **Details**
*
* The default value creates a `MixedScheduler`. Provide this service to
* customize execution mode, task dispatching, or yield behavior.
*
* @category services
* @since 2.0.0
*/
var Scheduler = /*#__PURE__*/ Reference("effect/Scheduler", {
	fiberCached: true,
	defaultValue: () => new MixedScheduler()
});
var setImmediate = "setImmediate" in globalThis ? (f) => {
	const timer = globalThis.setImmediate(f);
	return () => globalThis.clearImmediate(timer);
} : (f) => {
	const timer = setTimeout(f, 0);
	return () => clearTimeout(timer);
};
var setMicrotask = (f) => {
	let cancelled = false;
	Promise.resolve().then(() => {
		if (!cancelled) f();
	});
	return () => {
		cancelled = true;
	};
};
var PriorityBuckets = class {
	buckets = [];
	scheduleTask(task, priority) {
		const buckets = this.buckets;
		const len = buckets.length;
		let bucket;
		let index = 0;
		for (; index < len; index++) {
			if (buckets[index][0] > priority) break;
			bucket = buckets[index];
		}
		if (bucket && bucket[0] === priority) bucket[1].push(task);
		else if (index === len) buckets.push([priority, [task]]);
		else buckets.splice(index, 0, [priority, [task]]);
	}
	drain() {
		const buckets = this.buckets;
		this.buckets = [];
		return buckets;
	}
};
/**
* Provides a scheduler implementation that batches queued tasks and dispatches them by
* priority.
*
* **When to use**
*
* Use when you need the default runtime scheduler directly, including a
* scheduler that batches queued work by priority and preserves FIFO order within
* each priority.
*
* **Details**
*
* `MixedScheduler` supports synchronous and asynchronous execution modes, uses
* operation counts to decide when fibers should yield, and is the default
* scheduler implementation.
*
* @category models
* @since 2.0.0
*/
var MixedScheduler = class {
	executionMode;
	setImmediate;
	constructor(executionMode = "async", setImmediateFn) {
		this.executionMode = executionMode;
		this.setImmediate = setImmediateFn ?? (executionMode === "sync" ? setMicrotask : setImmediate);
	}
	/**
	* Returns whether the fiber has reached its operation budget and should yield.
	*
	* **When to use**
	*
	* Use to decide whether a fiber should yield after consuming its current
	* operation budget.
	*
	* @since 2.0.0
	*/
	shouldYield(fiber) {
		return fiber.currentOpCount >= fiber.maxOpsBeforeYield;
	}
	/**
	* Creates a dispatcher that schedules work through this scheduler.
	*
	* **When to use**
	*
	* Use when you need a standalone dispatcher from a scheduler instance, for
	* example in tests that enqueue tasks and then flush them deterministically.
	*
	* @since 4.0.0
	*/
	makeDispatcher() {
		return new MixedSchedulerDispatcher(this.setImmediate);
	}
};
var MixedSchedulerDispatcher = class {
	tasks = /*#__PURE__*/ new PriorityBuckets();
	running = void 0;
	setImmediate;
	constructor(setImmediateFn = setImmediate) {
		this.setImmediate = setImmediateFn;
	}
	/**
	* @since 2.0.0
	*/
	scheduleTask(task, priority) {
		this.tasks.scheduleTask(task, priority);
		if (this.running === void 0) this.running = this.setImmediate(this.afterScheduled);
	}
	/**
	* @since 2.0.0
	*/
	afterScheduled = () => {
		this.running = void 0;
		this.runTasks();
	};
	/**
	* @since 2.0.0
	*/
	runTasks() {
		const buckets = this.tasks.drain();
		for (let i = 0; i < buckets.length; i++) {
			const toRun = buckets[i][1];
			for (let j = 0; j < toRun.length; j++) toRun[j]();
		}
	}
	/**
	* @since 2.0.0
	*/
	flush() {
		while (this.tasks.buckets.length > 0) {
			if (this.running !== void 0) {
				this.running();
				this.running = void 0;
			}
			this.runTasks();
		}
	}
};
/**
* Context reference that controls the maximum number of operations a fiber
* can perform before yielding control back to the scheduler.
*
* **When to use**
*
* Use to tune scheduler fairness for CPU-bound fibers by changing the scheduler
* operation budget that triggers a yield.
*
* **Details**
*
* The default value is `2048` operations, which balances performance and
* fairness by helping prevent long-running fibers from monopolizing the
* execution thread.
*
* @see {@link PreventSchedulerYield} for bypassing scheduler yield checks entirely rather than tuning the operation budget
*
* @category services
* @since 4.0.0
*/
var MaxOpsBeforeYield = /*#__PURE__*/ Reference("effect/Scheduler/MaxOpsBeforeYield", {
	fiberCached: true,
	defaultValue: () => 2048
});
/**
* Context reference that controls whether the runtime should bypass scheduler
* yield checks. When set to `true`, the fiber run loop won't call
* `Scheduler.shouldYield`.
*
* **When to use**
*
* Use to bypass scheduler yield checks for controlled runtime workloads where
* cooperative yielding should be disabled.
*
* **Gotchas**
*
* Setting this reference to `true` can let long-running fibers monopolize the
* JavaScript thread.
*
* @see {@link MaxOpsBeforeYield} for tuning yield frequency without disabling yield checks
* @see {@link Scheduler} for providing custom scheduler yield behavior
*
* @category services
* @since 4.0.0
*/
var PreventSchedulerYield = /*#__PURE__*/ Reference("effect/Scheduler/PreventSchedulerYield", {
	fiberCached: true,
	defaultValue: () => false
});
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0-rc.112/node_modules/effect/dist/Data.js
/**
* Provides a base class for immutable data types.
*
* **When to use**
*
* Use when you need a lightweight immutable value type with `.pipe()` support.
*
* **Details**
*
* Extend `Class` with a type parameter to declare fields. The constructor
* accepts those fields as a single object argument. When there are no fields
* the argument is optional. Instances are `Readonly` and `Pipeable`.
*
* **Example** (Defining a value class)
*
* ```ts import.meta.vitest
* import { Data, Equal } from "effect"
*
* class Person extends Data.Class<{ readonly name: string }> {}
*
* Equal.equals(new Person({ name: "Mike" }), new Person({ name: "Mike" })) // => true
* ```
*
* @see {@link TaggedClass} — adds a `_tag` field
* @see {@link Error} — yieldable error variant
*
* @category constructors
* @since 2.0.0
*/
var Class = class extends Class$2 {
	constructor(props) {
		super();
		if (props) assignProperties(this, props);
	}
};
/**
* Provides a base class for immutable data types with a `_tag` discriminator.
*
* **When to use**
*
* Use when you need a single-variant tagged type or an ad-hoc discriminator.
*
* **Details**
*
* Like {@link Class}, but the resulting instances also carry a
* `readonly _tag: Tag` property. The `_tag` is excluded from the constructor
* argument.
*
* **Example** (Defining a tagged class)
*
* ```ts import.meta.vitest
* import { Data } from "effect"
*
* class Person extends Data.TaggedClass("Person")<{
*   readonly name: string
* }> {}
*
* new Person({ name: "Mike" })._tag // => "Person"
* ```
*
* @see {@link Class} — without a `_tag`
* @see {@link TaggedError} — tagged error variant
* @see {@link TaggedEnum} — multi-variant unions
*
* @category constructors
* @since 2.0.0
*/
var TaggedClass = (tag) => class extends Class {
	_tag = tag;
};
/**
* Provides a base class for yieldable errors.
*
* **When to use**
*
* Use when you need yieldable errors that do **not** need tag-based
* discrimination.
*
* **Details**
*
* Extends `Cause.YieldableError`, so instances can be yielded inside
* `Effect.gen` to fail the enclosing effect. Fields are passed as a single
* object; when there are no fields the argument is optional. If a `message`
* field is provided, it becomes the error's `.message`.
*
* **Example** (Defining a yieldable error)
*
* ```ts import.meta.vitest
* import { Data, Effect, Exit } from "effect"
*
* class NetworkError extends Data.Error<{
*   readonly code: number
*   readonly message: string
* }> {}
*
* const program = Effect.gen(function*() {
*   return yield* new NetworkError({ code: 500, message: "timeout" })
* })
*
* Effect.runSync(Effect.exit(program)) // => Exit.fail(new NetworkError({ code: 500, message: "timeout" }))
* ```
*
* @see {@link TaggedError} — adds a `_tag` for `Effect.catchTag`
* @see {@link Class} — non-error data class
*
* @category constructors
* @since 2.0.0
*/
var Error$1 = Error$2;
/**
* Creates a tagged error class with a `_tag` discriminator.
*
* **When to use**
*
* Use when you need domain errors with discriminated-union handling.
*
* **Details**
*
* Like {@link Error}, but instances also carry a `readonly _tag` property,
* enabling `Effect.catchTag` and `Effect.catchTags` for tag-based recovery.
* The `_tag` is excluded from the constructor argument. Yielding an instance
* inside `Effect.gen` fails the effect with this error.
*
* **Example** (Recovering by tag)
*
* ```ts import.meta.vitest
* import { Data, Effect } from "effect"
*
* class NotFound extends Data.TaggedError("NotFound")<{
*   readonly resource: string
* }> {}
*
* class Forbidden extends Data.TaggedError("Forbidden")<{
*   readonly reason: string
* }> {}
*
* const program = Effect.gen(function*() {
*   return yield* new NotFound({ resource: "/users/42" })
* })
*
* const recovered = program.pipe(
*   Effect.catchTag("NotFound", (e) =>
*     Effect.succeed(`missing: ${e.resource}`))
* )
*
* await Effect.runPromise(recovered) // => "missing: /users/42"
* ```
*
* @see {@link Error} — without a `_tag`
* @see {@link TaggedClass} — tagged class that is not an error
*
* @category constructors
* @since 2.0.0
*/
var TaggedError = TaggedError$1;
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0-rc.112/node_modules/effect/dist/Encoding.js
/**
* Encoding and decoding helpers for Base64, Base64Url, and hexadecimal text.
* The functions convert between strings, UTF-8 text, and `Uint8Array` bytes.
* Encode functions return strings directly, while decode functions return
* `Result.Result` so invalid input is reported as an `EncodingError` instead of
* being thrown.
*
* @since 4.0.0
*/
/**
* Type identifier stored on `EncodingError` values and used by
* `isEncodingError`.
*
* **When to use**
*
* Use when implementing low-level `EncodingError`-compatible values that need
* to carry the runtime marker.
*
* **Details**
*
* This marker is part of the runtime representation of `EncodingError`. Prefer
* `isEncodingError` when narrowing unknown values.
*
* @see {@link isEncodingError} for the public guard that checks this marker
*
* @category type IDs
* @since 4.0.0
*/
var EncodingErrorTypeId = "~effect/encoding/EncodingError";
/**
* Error returned when an encoding or decoding operation cannot process its
* input.
*
* **When to use**
*
* Use when you need to handle or inspect failures from encoding or decoding
* operations.
*
* **Details**
*
* The error records whether the failure happened during encoding or decoding,
* which encoding module reported it, the original input, and a human-readable
* message.
*
* @see {@link isEncodingError} for checking whether a value is an EncodingError
* @category errors
* @since 4.0.0
*/
var EncodingError = class extends (/*#__PURE__*/ TaggedError("EncodingError")) {
	/**
	* Marks this value as an encoding or decoding error for runtime guards.
	*
	* **When to use**
	*
	* Use to identify `EncodingError` instances through `isEncodingError`.
	*
	* @since 4.0.0
	*/
	[EncodingErrorTypeId] = EncodingErrorTypeId;
};
/**
* Encodes the given value into a base64 (RFC4648) `string`.
*
* **When to use**
*
* Use to encode text or bytes as a standard padded Base64 string for storage or
* transport.
*
* **Details**
*
* String inputs are encoded as UTF-8 bytes before Base64 encoding.
* `Uint8Array` inputs are encoded directly. The output uses the standard
* RFC4648 alphabet with `=` padding.
*
* **Example** (Encoding Base64 strings and bytes)
*
* ```ts import.meta.vitest
* import { Encoding } from "effect"
*
* // Encode a string
* Encoding.encodeBase64("hello") // => "aGVsbG8="
*
* // Encode binary data
* const bytes = new Uint8Array([72, 101, 108, 108, 111])
* Encoding.encodeBase64(bytes) // => "SGVsbG8="
* ```
*
* @see {@link decodeBase64} for decoding standard Base64 to bytes
* @see {@link decodeBase64String} for decoding standard Base64 to UTF-8 text
* @see {@link encodeBase64Url} for URL-safe unpadded Base64 output
*
* @category encoding
* @since 2.0.0
*/
var encodeBase64 = (input) => typeof input === "string" ? base64EncodeUint8Array(encoder.encode(input)) : base64EncodeUint8Array(input);
/**
* Decodes a base64 (RFC4648) string into bytes safely.
*
* **When to use**
*
* Use to decode a standard padded Base64 string into bytes without throwing on
* invalid input.
*
* **Details**
*
* Returns `Result.succeed` with a `Uint8Array` when decoding succeeds, or
* `Result.fail` with an `EncodingError` when the input is not valid base64.
*
* **Example** (Decoding Base64 bytes)
*
* ```ts import.meta.vitest
* import { Encoding, Result } from "effect"
*
* Encoding.decodeBase64("SGVsbG8=") // => Result.succeed(new Uint8Array([72, 101, 108, 108, 111]))
* ```
*
* @category decoding
* @since 2.0.0
*/
var decodeBase64 = (str) => {
	const stripped = stripCrlf(str);
	const length = stripped.length;
	if (length % 4 !== 0) return fail$5(new EncodingError({
		kind: "Decode",
		module: "Base64",
		input: stripped,
		message: `Length must be a multiple of 4, but is ${length}`
	}));
	const index = stripped.indexOf("=");
	if (index !== -1 && (index < length - 2 || index === length - 2 && stripped[length - 1] !== "=")) return fail$5(new EncodingError({
		kind: "Decode",
		module: "Base64",
		input: stripped,
		message: `Found a '=' character, but it is not at the end`
	}));
	try {
		const missingOctets = stripped.endsWith("==") ? 2 : stripped.endsWith("=") ? 1 : 0;
		const result = new Uint8Array(3 * (length / 4) - missingOctets);
		for (let i = 0, j = 0; i < length; i += 4, j += 3) {
			const buffer = getBase64Code(stripped.charCodeAt(i)) << 18 | getBase64Code(stripped.charCodeAt(i + 1)) << 12 | getBase64Code(stripped.charCodeAt(i + 2)) << 6 | getBase64Code(stripped.charCodeAt(i + 3));
			result[j] = buffer >> 16;
			result[j + 1] = buffer >> 8 & 255;
			result[j + 2] = buffer & 255;
		}
		return succeed$5(result);
	} catch (e) {
		return fail$5(new EncodingError({
			kind: "Decode",
			module: "Base64",
			input: stripped,
			message: e instanceof Error ? e.message : "Invalid input"
		}));
	}
};
/**
* Decodes a base64 (RFC4648) string into a UTF-8 string safely.
*
* **When to use**
*
* Use to decode a standard padded Base64 string into UTF-8 text without
* throwing on invalid input.
*
* **Details**
*
* Returns `Result.succeed` with the decoded text when decoding succeeds, or
* `Result.fail` with an `EncodingError` when the input is not valid base64.
*
* **Example** (Decoding Base64 strings)
*
* ```ts import.meta.vitest
* import { Encoding, Result } from "effect"
*
* Encoding.decodeBase64String("aGVsbG8=") // => Result.succeed("hello")
* ```
*
* @category decoding
* @since 2.0.0
*/
var decodeBase64String = (str) => map$6(decodeBase64(str), (_) => decoder.decode(_));
/**
* Encodes the given value into a base64 (URL) `string`.
*
* **When to use**
*
* Use to encode text or bytes as an unpadded Base64Url string for contexts that
* require the URL-safe alphabet.
*
* **Details**
*
* String inputs are encoded as UTF-8 bytes before Base64Url encoding.
* `Uint8Array` inputs are encoded directly. The output removes `=` padding and
* replaces `+` with `-` and `/` with `_`.
*
* **Example** (Encoding URL-safe Base64)
*
* ```ts import.meta.vitest
* import { Encoding } from "effect"
*
* // URL-safe base64 encoding (uses - and _ instead of + and /)
* Encoding.encodeBase64Url("hello?") // => "aGVsbG8_"
*
* const bytes = new Uint8Array([72, 101, 108, 108, 111, 63])
* Encoding.encodeBase64Url(bytes) // => "SGVsbG8_"
* ```
*
* @see {@link decodeBase64Url} for decoding URL-safe Base64 to bytes
* @see {@link decodeBase64UrlString} for decoding URL-safe Base64 to UTF-8 text
* @see {@link encodeBase64} for standard padded Base64 output
*
* @category encoding
* @since 2.0.0
*/
var encodeBase64Url = (input) => typeof input === "string" ? base64UrlEncodeUint8Array(encoder.encode(input)) : base64UrlEncodeUint8Array(input);
/**
* Decodes a URL-safe base64 string into bytes safely.
*
* **When to use**
*
* Use to decode padded or unpadded Base64Url text into bytes without throwing
* on invalid input.
*
* **Details**
*
* Returns `Result.succeed` with a `Uint8Array` when decoding succeeds, or
* `Result.fail` with an `EncodingError` when the input is not valid URL-safe
* base64. Both padded and unpadded URL-safe base64 forms are accepted when
* otherwise valid.
*
* **Example** (Decoding URL-safe Base64 bytes)
*
* ```ts import.meta.vitest
* import { Encoding, Result } from "effect"
*
* Encoding.decodeBase64Url("SGVsbG8_") // => Result.succeed(new Uint8Array([72, 101, 108, 108, 111, 63]))
* ```
*
* @category decoding
* @since 2.0.0
*/
var decodeBase64Url = (str) => {
	const stripped = stripCrlf(str);
	const length = stripped.length;
	if (length % 4 === 1) return fail$5(new EncodingError({
		module: "Base64Url",
		kind: "Decode",
		input: stripped,
		message: `Length should be a multiple of 4, but is ${length}`
	}));
	if (!/^[-_A-Z0-9]*?={0,2}$/i.test(stripped)) return fail$5(new EncodingError({
		module: "Base64Url",
		kind: "Decode",
		input: stripped,
		message: "Invalid input"
	}));
	let sanitized = length % 4 === 2 ? `${stripped}==` : length % 4 === 3 ? `${stripped}=` : stripped;
	sanitized = sanitized.replace(/-/g, "+").replace(/_/g, "/");
	return decodeBase64(sanitized);
};
/**
* Decodes a URL-safe base64 string into a UTF-8 string safely.
*
* **When to use**
*
* Use to decode padded or unpadded Base64Url text into UTF-8 text without
* throwing on invalid input.
*
* **Details**
*
* Returns `Result.succeed` with the decoded text when decoding succeeds, or
* `Result.fail` with an `EncodingError` when the input is not valid URL-safe
* base64.
*
* **Example** (Decoding URL-safe Base64 strings)
*
* ```ts import.meta.vitest
* import { Encoding, Result } from "effect"
*
* Encoding.decodeBase64UrlString("aGVsbG8_") // => Result.succeed("hello?")
* ```
*
* @category decoding
* @since 2.0.0
*/
var decodeBase64UrlString = (str) => map$6(decodeBase64Url(str), (_) => decoder.decode(_));
/**
* Encodes the given value into a hex `string`.
*
* **When to use**
*
* Use to encode text or bytes as lowercase hexadecimal text.
*
* **Example** (Encoding hex strings and bytes)
*
* ```ts import.meta.vitest
* import { Encoding } from "effect"
*
* // Encode a string to hex
* Encoding.encodeHex("hello") // => "68656c6c6f"
*
* // Encode binary data to hex
* const bytes = new Uint8Array([72, 101, 108, 108, 111])
* Encoding.encodeHex(bytes) // => "48656c6c6f"
* ```
*
* @category encoding
* @since 2.0.0
*/
var encodeHex = (input) => typeof input === "string" ? hexEncodeUint8Array(encoder.encode(input)) : hexEncodeUint8Array(input);
/**
* Generates a random lowercase hexadecimal string, optimized for lengths that
* are multiples of 8.
*
* `length` is not validated. The function generates `length >>> 3` random
* 8-character words, so non-negative lengths below `2 ** 32` are rounded down
* to a multiple of 8 and other values follow JavaScript's unsigned 32-bit
* coercion rules.
*
* This function uses `Math.random()` and is not cryptographically secure. For
* security-sensitive values, use the `Crypto.Crypto` service's `randomBytes`
* method and encode the result with {@link encodeHex}.
*
* @category encoding
* @since 4.0.0
*/
var randomHex = (length) => {
	let result = "";
	for (let i = length >>> 3; i > 0; i--) {
		const word = Math.random() * 4294967296 >>> 0;
		result += byteToHex[word >>> 24] + byteToHex[word >>> 16 & 255] + byteToHex[word >>> 8 & 255] + byteToHex[word & 255];
	}
	return result;
};
/**
* Decodes a hexadecimal string into bytes safely.
*
* **When to use**
*
* Use to decode hexadecimal text into bytes without throwing on invalid input.
*
* **Details**
*
* Returns `Result.succeed` with a `Uint8Array` when decoding succeeds, or
* `Result.fail` with an `EncodingError` when the input has an odd length or
* contains invalid hex characters.
*
* **Example** (Decoding hex bytes)
*
* ```ts import.meta.vitest
* import { Encoding, Result } from "effect"
*
* Encoding.decodeHex("48656c6c6f") // => Result.succeed(new Uint8Array([72, 101, 108, 108, 111]))
* ```
*
* @category decoding
* @since 2.0.0
*/
var decodeHex = (str) => {
	const bytes = new TextEncoder().encode(str);
	if (bytes.length % 2 !== 0) return fail$5(new EncodingError({
		module: "Hex",
		kind: "Decode",
		input: str,
		message: `Length must be a multiple of 2, but is ${bytes.length}`
	}));
	try {
		const length = bytes.length / 2;
		const result = new Uint8Array(length);
		for (let i = 0; i < length; i++) {
			const a = fromHexChar(bytes[i * 2]);
			const b = fromHexChar(bytes[i * 2 + 1]);
			result[i] = a << 4 | b;
		}
		return succeed$5(result);
	} catch (e) {
		return fail$5(new EncodingError({
			module: "Hex",
			kind: "Decode",
			input: str,
			message: e instanceof Error ? e.message : "Invalid input"
		}));
	}
};
/**
* Decodes a hexadecimal string into a UTF-8 string safely.
*
* **When to use**
*
* Use to decode hexadecimal text into UTF-8 text without throwing on invalid
* input.
*
* **Details**
*
* Returns `Result.succeed` with the decoded text when decoding succeeds, or
* `Result.fail` with an `EncodingError` when the input is not valid hex.
*
* **Example** (Decoding hex strings)
*
* ```ts import.meta.vitest
* import { Encoding, Result } from "effect"
*
* Encoding.decodeHexString("68656c6c6f") // => Result.succeed("hello")
* ```
*
* @category decoding
* @since 2.0.0
*/
var decodeHexString = (str) => map$6(decodeHex(str), (_) => decoder.decode(_));
var encoder = /*#__PURE__*/ new TextEncoder();
var decoder = /*#__PURE__*/ new TextDecoder();
var stripCrlf = (str) => str.replace(/[\n\r]/g, "");
var base64EncodeUint8Array = (bytes) => {
	const length = bytes.length;
	let result = "";
	let i = 2;
	for (; i < length; i += 3) {
		result += base64abc[bytes[i - 2] >> 2];
		result += base64abc[(bytes[i - 2] & 3) << 4 | bytes[i - 1] >> 4];
		result += base64abc[(bytes[i - 1] & 15) << 2 | bytes[i] >> 6];
		result += base64abc[bytes[i] & 63];
	}
	if (i === length + 1) {
		result += base64abc[bytes[i - 2] >> 2];
		result += base64abc[(bytes[i - 2] & 3) << 4];
		result += "==";
	}
	if (i === length) {
		result += base64abc[bytes[i - 2] >> 2];
		result += base64abc[(bytes[i - 2] & 3) << 4 | bytes[i - 1] >> 4];
		result += base64abc[(bytes[i - 1] & 15) << 2];
		result += "=";
	}
	return result;
};
function getBase64Code(charCode) {
	if (charCode >= base64codes.length) throw new TypeError(`Invalid character ${String.fromCharCode(charCode)}`);
	const code = base64codes[charCode];
	if (code === 255) throw new TypeError(`Invalid character ${String.fromCharCode(charCode)}`);
	return code;
}
var base64abc = [
	"A",
	"B",
	"C",
	"D",
	"E",
	"F",
	"G",
	"H",
	"I",
	"J",
	"K",
	"L",
	"M",
	"N",
	"O",
	"P",
	"Q",
	"R",
	"S",
	"T",
	"U",
	"V",
	"W",
	"X",
	"Y",
	"Z",
	"a",
	"b",
	"c",
	"d",
	"e",
	"f",
	"g",
	"h",
	"i",
	"j",
	"k",
	"l",
	"m",
	"n",
	"o",
	"p",
	"q",
	"r",
	"s",
	"t",
	"u",
	"v",
	"w",
	"x",
	"y",
	"z",
	"0",
	"1",
	"2",
	"3",
	"4",
	"5",
	"6",
	"7",
	"8",
	"9",
	"+",
	"/"
];
var base64codes = [
	255,
	255,
	255,
	255,
	255,
	255,
	255,
	255,
	255,
	255,
	255,
	255,
	255,
	255,
	255,
	255,
	255,
	255,
	255,
	255,
	255,
	255,
	255,
	255,
	255,
	255,
	255,
	255,
	255,
	255,
	255,
	255,
	255,
	255,
	255,
	255,
	255,
	255,
	255,
	255,
	255,
	255,
	255,
	62,
	255,
	255,
	255,
	63,
	52,
	53,
	54,
	55,
	56,
	57,
	58,
	59,
	60,
	61,
	255,
	255,
	255,
	0,
	255,
	255,
	255,
	0,
	1,
	2,
	3,
	4,
	5,
	6,
	7,
	8,
	9,
	10,
	11,
	12,
	13,
	14,
	15,
	16,
	17,
	18,
	19,
	20,
	21,
	22,
	23,
	24,
	25,
	255,
	255,
	255,
	255,
	255,
	255,
	26,
	27,
	28,
	29,
	30,
	31,
	32,
	33,
	34,
	35,
	36,
	37,
	38,
	39,
	40,
	41,
	42,
	43,
	44,
	45,
	46,
	47,
	48,
	49,
	50,
	51
];
var base64UrlEncodeUint8Array = (data) => base64EncodeUint8Array(data).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
var byteToHex = [];
for (let i = 0; i < 256; i++) byteToHex.push(i.toString(16).padStart(2, "0"));
var hexEncodeUint8Array = (bytes) => {
	let result = "";
	for (let i = 0; i < bytes.length; i++) result += byteToHex[bytes[i]];
	return result;
};
var fromHexChar = (byte) => {
	if (48 <= byte && byte <= 57) return byte - 48;
	if (97 <= byte && byte <= 102) return byte - 97 + 10;
	if (65 <= byte && byte <= 70) return byte - 65 + 10;
	throw new TypeError("Invalid input");
};
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0-rc.112/node_modules/effect/dist/Tracer.js
/**
* Defines the low-level tracing model used by Effect.
*
* A span records the lifetime of an operation, including its name, parent,
* attributes, links, annotations, sampling decision, kind, and completion
* status. The module also defines the tracer service, parent-span context,
* external span support, trace propagation settings, and the default in-memory
* span implementation.
*
* @since 2.0.0
*/
/**
* Defines the string key for the parent-span context service.
*
* **When to use**
*
* Use when you need the raw context key for parent span lookup in lower-level
* tracing code.
*
* **Example** (Reading the parent span key)
*
* ```ts import.meta.vitest
* import { Tracer } from "effect"
*
* // The key used to identify parent spans in the context
* Tracer.ParentSpanKey // => "effect/Tracer/ParentSpan"
* ```
*
* @category constants
* @since 4.0.0
*/
var ParentSpanKey = "effect/Tracer/ParentSpan";
/**
* Context service containing the `Span` or `ExternalSpan` to use as the parent
* of newly-created child spans.
*
* **Example** (Accessing the parent span)
*
* ```ts import.meta.vitest
* import { Effect, Tracer } from "effect"
*
* // Access the parent span from the context
* const program = Effect.gen(function*() {
*   const parentSpan = yield* Effect.service(Tracer.ParentSpan)
*   return parentSpan.spanId
* })
*
* const parent = Tracer.externalSpan({ spanId: "span-123", traceId: "trace-456" })
* await Effect.runPromise(Effect.provideService(program, Tracer.ParentSpan, parent)) // => "span-123"
* ```
*
* @category services
* @since 2.0.0
*/
var ParentSpan = class extends (/*#__PURE__*/ Service()(ParentSpanKey, { fiberCached: true })) {};
/**
* Creates a `Tracer` value from a tracer implementation object.
*
* **When to use**
*
* Use to create a custom tracing backend value that Effect can use when
* creating spans.
*
* **Details**
*
* `make` returns the supplied implementation object unchanged. The object must
* satisfy the `Tracer` contract, including a `span` method that returns a
* `Span`.
*
* @see {@link Span} for the span values returned by tracer implementations
*
* @category constructors
* @since 2.0.0
*/
var make$5 = (options) => options;
/**
* Creates an `ExternalSpan` from trace and span identifiers, defaulting
* `sampled` to `true` and annotations to an empty context when they are not
* provided.
*
* **Example** (Creating an external span)
*
* ```ts import.meta.vitest
* import { Effect, Option, Tracer } from "effect"
*
* // Create an external span from another tracing system
* const span = Tracer.externalSpan({
*   spanId: "span-abc-123",
*   traceId: "trace-xyz-789",
*   sampled: true
* })
*
* // Use the external span as a parent
* const program = Effect.succeed("Hello").pipe(
*   Effect.withSpan("child-operation", { parent: span })
* )
*
* const spans: Array<Tracer.NativeSpan> = []
* const tracer = Tracer.make({
*   span(options) {
*     const span = new Tracer.NativeSpan(options)
*     spans.push(span)
*     return span
*   }
* })
* const value = await Effect.runPromise(Effect.provideService(program, Tracer.Tracer, tracer))
*
* value // => "Hello"
* spans.map((span) => Option.getOrUndefined(span.parent)?.spanId) // => ["span-abc-123"]
* ```
*
* @category constructors
* @since 2.0.0
*/
var externalSpan = (options) => ({
	_tag: "ExternalSpan",
	spanId: options.spanId,
	traceId: options.traceId,
	sampled: options.sampled ?? true,
	annotations: options.annotations ?? empty$2()
});
/**
* Context reference for disabling trace propagation.
*
* **When to use**
*
* Use to prevent spans in a scope from propagating tracing context.
*
* **Details**
*
* When enabled on fiber or span annotations, new spans are created as
* non-propagating no-op spans and disabled spans are skipped when deriving a
* parent span.
*
* **Example** (Disabling span propagation)
*
* ```ts import.meta.vitest
* import { Effect, Tracer } from "effect"
*
* // Disable span propagation for a specific effect
* const program = Tracer.DisablePropagation.pipe(
*   Effect.provideService(Tracer.DisablePropagation, true)
* )
*
* await Effect.runPromise(program) // => true
* ```
*
* @category services
* @since 3.12.0
*/
var DisablePropagation = /*#__PURE__*/ Reference("effect/Tracer/DisablePropagation", { defaultValue: constFalse });
/**
* Context reference for controlling the current trace level for dynamic filtering.
*
* **When to use**
*
* Use to set the default trace level for spans in a scope when span options do
* not provide `level`.
*
* **Details**
*
* The default value is `"Info"`. Span creation uses `options.level ??
* CurrentTraceLevel` before applying `MinimumTraceLevel`.
*
* @see {@link MinimumTraceLevel} for the threshold that decides whether spans at that level are sampled
*
* @category services
* @since 4.0.0
*/
var CurrentTraceLevel = /*#__PURE__*/ Reference("effect/Tracer/CurrentTraceLevel", { defaultValue: () => "Info" });
/**
* Context reference for setting the minimum trace level threshold. Spans and their
* descendants below this level will have their sampling decision forced to
* false, preventing them from being exported.
*
* **When to use**
*
* Use to set the trace-level threshold that controls whether spans are sampled
* by default.
*
* **Details**
*
* The default value is `"All"`. Span creation compares the span level from
* `options.level ?? CurrentTraceLevel` against this threshold.
*
* **Gotchas**
*
* Explicit `options.sampled` bypasses threshold computation.
*
* @see {@link CurrentTraceLevel} for the default span level used when options do not specify one
*
* @category services
* @since 4.0.0
*/
var MinimumTraceLevel = /*#__PURE__*/ Reference("effect/Tracer/MinimumTraceLevel", { defaultValue: () => "All" });
/**
* Defines the string key for the active tracer context reference.
*
* **When to use**
*
* Use when you need the raw context key for active tracer lookup in lower-level
* tracing code.
*
* @category constants
* @since 4.0.0
*/
var TracerKey = "effect/Tracer";
/**
* Context reference for the active tracer service. By default it uses the
* native tracer, which creates `NativeSpan` instances.
*
* **Example** (Accessing the current tracer)
*
* ```ts import.meta.vitest
* import { Effect, Tracer } from "effect"
*
* // Access the current tracer from the context
* const program = Effect.gen(function*() {
*   const tracer = yield* Effect.service(Tracer.Tracer)
*   // Or use the built-in tracer effect
*   const tracerFromAccessor = yield* Effect.tracer
*   return tracer === tracerFromAccessor
* })
*
* await Effect.runPromise(program) // => true
* ```
*
* @category services
* @since 2.0.0
*/
var Tracer = /*#__PURE__*/ Reference(TracerKey, {
	fiberCached: true,
	defaultValue: () => make$5({ span: (options) => new NativeSpan(options) })
});
/**
* Default in-memory `Span` implementation used by the native tracer. It
* generates span and trace identifiers, stores attributes, events, and links,
* and records `Started` or `Ended` status.
*
* **Details**
*
* The constructor initializes the span with `Started` status, inherits the
* parent trace id or generates a new one, and always generates a new span id.
* Attributes, events, links, and status are then mutated through `Span` methods.
*
* @see {@link Span} for the interface implemented by native spans
*
* @category models
* @since 4.0.0
*/
var NativeSpan = class {
	_tag = "Span";
	spanId;
	traceId = "native";
	sampled;
	name;
	parent;
	annotations;
	links;
	startTime;
	kind;
	status;
	attributes;
	events = [];
	constructor(options) {
		this.name = options.name;
		this.parent = options.parent;
		this.annotations = options.annotations;
		this.links = options.links;
		this.startTime = options.startTime;
		this.kind = options.kind;
		this.sampled = options.sampled;
		this.status = {
			_tag: "Started",
			startTime: options.startTime
		};
		this.attributes = /* @__PURE__ */ new Map();
		this.traceId = getOrUndefined$1(options.parent)?.traceId ?? randomHex(32);
		this.spanId = randomHex(16);
	}
	end(endTime, exit) {
		this.status = {
			_tag: "Ended",
			endTime,
			exit,
			startTime: this.status.startTime
		};
	}
	attribute(key, value) {
		this.attributes.set(key, value);
	}
	event(name, startTime, attributes) {
		this.events.push([
			name,
			startTime,
			attributes ?? {}
		]);
	}
	addLinks(links) {
		this.links.push(...links);
	}
};
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0-rc.112/node_modules/effect/dist/internal/metric.js
/** @internal */
var FiberRuntimeMetricsKey = "effect/observability/Metric/FiberRuntimeMetricsKey";
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0-rc.112/node_modules/effect/dist/internal/references.js
/** @internal */
var CurrentErrorReporters = /*#__PURE__*/ Reference("effect/ErrorReporter/CurrentErrorReporters", { defaultValue: () => /* @__PURE__ */ new Set() });
/** @internal */
var CurrentStackFrame = /*#__PURE__*/ Reference("effect/References/CurrentStackFrame", {
	fiberCached: true,
	defaultValue: constUndefined
});
/** @internal */
var TracerEnabled = /*#__PURE__*/ Reference("effect/References/TracerEnabled", { defaultValue: constTrue });
/** @internal */
var TracerTimingEnabled$1 = /*#__PURE__*/ Reference("effect/References/TracerTimingEnabled", { defaultValue: constTrue });
/** @internal */
var TracerSpanAnnotations = /*#__PURE__*/ Reference("effect/References/TracerSpanAnnotations", { defaultValue: () => ({}) });
/** @internal */
var TracerSpanLinks = /*#__PURE__*/ Reference("effect/References/TracerSpanLinks", { defaultValue: () => [] });
/** @internal */
var CurrentLogAnnotations$1 = /*#__PURE__*/ Reference("effect/References/CurrentLogAnnotations", { defaultValue: () => ({}) });
/** @internal */
var CurrentLogLevel = /*#__PURE__*/ Reference("effect/References/CurrentLogLevel", {
	fiberCached: true,
	defaultValue: () => "Info"
});
/** @internal */
var MinimumLogLevel$1 = /*#__PURE__*/ Reference("effect/References/MinimumLogLevel", {
	fiberCached: true,
	defaultValue: () => "Info"
});
/** @internal */
var UnhandledLogLevel$1 = /*#__PURE__*/ Reference("effect/References/UnhandledLogLevel", { defaultValue: () => "Error" });
/** @internal */
var CurrentLogSpans$1 = /*#__PURE__*/ Reference("effect/References/CurrentLogSpans", { defaultValue: () => [] });
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0-rc.112/node_modules/effect/dist/internal/stackTraceLimit.js
/**
* Check if `Error.stackTraceLimit` is writable.
* Returns `false` if the property is frozen, non-writable, or `Error` is non-extensible.
*
* @internal
*/
var isStackTraceLimitWritable = () => {
	const desc = Object.getOwnPropertyDescriptor(Error, "stackTraceLimit");
	if (desc === void 0) return Object.isExtensible(Error);
	return Object.hasOwn(desc, "writable") ? desc.writable === true : desc.set !== void 0;
};
var canWriteStackTraceLimit = /*#__PURE__*/ isStackTraceLimitWritable();
/**
* Get the current `Error.stackTraceLimit` value.
* Returns `undefined` if the property doesn't exist.
*
* @internal
*/
var getStackTraceLimit = () => Error.stackTraceLimit;
/**
* Safely set `Error.stackTraceLimit` if possible, otherwise no-op.
*
* Accepts `undefined` so a value read via {@link getStackTraceLimit} can be
* restored faithfully.
*
* @internal
*/
var setStackTraceLimit = (value) => {
	if (canWriteStackTraceLimit) Error.stackTraceLimit = value;
};
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0-rc.112/node_modules/effect/dist/internal/tracer.js
/** @internal */
var addSpanStackTrace = (options) => {
	if (options?.captureStackTrace === false) return options;
	else if (options?.captureStackTrace !== void 0 && typeof options.captureStackTrace !== "boolean") return options;
	const limit = getStackTraceLimit();
	setStackTraceLimit(3);
	const traceError = /* @__PURE__ */ new Error();
	setStackTraceLimit(limit);
	return {
		...options,
		captureStackTrace: spanCleaner(() => traceError.stack)
	};
};
/** @internal */
var makeStackCleaner = (line) => (stack) => {
	let cache;
	return () => {
		if (cache !== void 0) return cache;
		const trace = stack();
		if (!trace) return void 0;
		const lines = trace.split("\n");
		if (lines[line] !== void 0) {
			cache = lines[line].trim();
			return cache;
		}
	};
};
var spanCleaner = /*#__PURE__*/ makeStackCleaner(3);
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0-rc.112/node_modules/effect/dist/internal/effect.js
/** @internal */
var Interrupt = class extends ReasonBase {
	fiberId;
	constructor(fiberId, annotations = constEmptyAnnotations) {
		super("Interrupt", annotations, "Interrupted");
		this.fiberId = fiberId;
	}
	toString() {
		return `Interrupt(${this.fiberId})`;
	}
	toJSON() {
		return {
			_tag: "Interrupt",
			fiberId: this.fiberId
		};
	}
	[symbol](that) {
		return isInterruptReason(that) && this.fiberId === that.fiberId && this.annotations === that.annotations;
	}
	[symbol$1]() {
		return combine(string(`${this._tag}:${this.fiberId}`))(random(this.annotations));
	}
};
/** @internal */
var makeInterruptReason$1 = (fiberId) => new Interrupt(fiberId);
/** @internal */
var causeInterrupt = (fiberId) => new CauseImpl([new Interrupt(fiberId)]);
/** @internal */
var hasFails$1 = (self) => self.reasons.some(isFailReason$1);
/** @internal */
var findFail = (self) => {
	const reason = self.reasons.find(isFailReason$1);
	return reason ? succeed$5(reason) : fail$5(self);
};
/** @internal */
var findError$1 = (self) => {
	for (let i = 0; i < self.reasons.length; i++) {
		const reason = self.reasons[i];
		if (reason._tag === "Fail") return succeed$5(reason.error);
	}
	return fail$5(self);
};
/** @internal */
var findErrorOption$1 = /*#__PURE__*/ toOption(findError$1);
/** @internal */
var hasDies = (self) => self.reasons.some(isDieReason);
/** @internal */
var findDefect$1 = (self) => {
	const reason = self.reasons.find(isDieReason);
	return reason ? succeed$5(reason.defect) : fail$5(self);
};
/** @internal */
var hasInterrupts$1 = (self) => self.reasons.some(isInterruptReason);
/** @internal */
var causeFilterInterruptors = (self) => {
	let interruptors;
	for (let i = 0; i < self.reasons.length; i++) {
		const f = self.reasons[i];
		if (f._tag !== "Interrupt") continue;
		interruptors ??= /* @__PURE__ */ new Set();
		if (f.fiberId !== void 0) interruptors.add(f.fiberId);
	}
	return interruptors ? succeed$5(interruptors) : fail$5(self);
};
/** @internal */
var causeInterruptors = (self) => {
	const result = causeFilterInterruptors(self);
	return isFailure$3(result) ? emptySet : result.success;
};
var emptySet = /*#__PURE__*/ new Set();
/** @internal */
var hasInterruptsOnly$1 = (self) => self.reasons.length > 0 && self.reasons.every(isInterruptReason);
/** @internal */
var causeCombine = /*#__PURE__*/ dual(2, (self, that) => {
	if (self.reasons.length === 0) return that;
	else if (that.reasons.length === 0) return self;
	const newCause = new CauseImpl(union(self.reasons, that.reasons));
	return equals$2(self, newCause) ? self : newCause;
});
/** @internal */
var causeMap = /*#__PURE__*/ dual(2, (self, f) => {
	let hasFail = false;
	const failures = self.reasons.map((failure) => {
		if (isFailReason$1(failure)) {
			hasFail = true;
			return new Fail(f(failure.error), failure.annotations);
		}
		return failure;
	});
	return hasFail ? causeFromReasons(failures) : self;
});
/** @internal */
var causePartition = (self) => {
	const obj = {
		Fail: [],
		Die: [],
		Interrupt: []
	};
	for (let i = 0; i < self.reasons.length; i++) obj[self.reasons[i]._tag].push(self.reasons[i]);
	return obj;
};
/** @internal */
var causeSquash = (self) => {
	const partitioned = causePartition(self);
	if (partitioned.Fail.length > 0) return partitioned.Fail[0].error;
	else if (partitioned.Die.length > 0) return partitioned.Die[0].defect;
	else if (partitioned.Interrupt.length > 0) return new globalThis.Error("All fibers interrupted without error");
	return new globalThis.Error("Empty cause");
};
/** @internal */
var causePrettyErrors = (self, options) => {
	const errors = [];
	const interrupts = [];
	if (self.reasons.length === 0) return errors;
	const prevStackLimit = getStackTraceLimit();
	setStackTraceLimit(1);
	for (const failure of self.reasons) {
		if (failure._tag === "Interrupt") {
			interrupts.push(failure);
			continue;
		}
		errors.push(causePrettyError(failure._tag === "Die" ? failure.defect : failure.error, failure.annotations, options));
	}
	if (errors.length === 0) {
		const cause = /* @__PURE__ */ new Error("The fiber was interrupted by:");
		cause.name = "InterruptCause";
		cause.stack = interruptCauseStack(cause, interrupts);
		const error = new globalThis.Error("All fibers interrupted without error", { cause });
		error.name = "InterruptError";
		error.stack = `${error.name}: ${error.message}`;
		errors.push(causePrettyError(error, interrupts[0].annotations, options));
	}
	setStackTraceLimit(prevStackLimit);
	return errors;
};
/** @internal */
var causePrettyError = (original, annotations, options) => {
	const kind = typeof original;
	let error;
	if (original && kind === "object") {
		error = new globalThis.Error(causePrettyMessage(original), { cause: original.cause ? causePrettyError(original.cause) : void 0 });
		if (typeof original.name === "string") error.name = original.name;
		if (typeof original.stack === "string") error.stack = cleanErrorStack(original.stack, error, annotations);
		else {
			const stack = `${error.name}: ${error.message}`;
			error.stack = annotations ? addStackAnnotations(stack, annotations) : stack;
		}
		if (options?.includeCauseInStack) error.stack = renderPrettyError(error);
		for (const key of Object.keys(original)) if (!(key in error)) error[key] = original[key];
	} else error = new globalThis.Error(!original ? `Unknown error: ${original}` : kind === "string" ? original : formatJson(original));
	return error;
};
var causePrettyMessage = (u) => {
	if (typeof u.message === "string") return u.message;
	else if (typeof u.toString === "function" && u.toString !== Object.prototype.toString && u.toString !== Array.prototype.toString) try {
		return u.toString();
	} catch {}
	return formatJson(u);
};
var locationRegExp = /\((.*)\)/g;
var cleanErrorStack = (stack, error, annotations) => {
	const message = `${error.name}: ${error.message}`;
	const lines = (stack.startsWith(message) ? stack.slice(message.length) : stack).split("\n");
	const out = [message];
	for (let i = 1; i < lines.length; i++) {
		if (/(?:Generator\.next|~effect\/Effect)/.test(lines[i])) break;
		out.push(lines[i]);
	}
	return annotations ? addStackAnnotations(out.join("\n"), annotations) : out.join("\n");
};
var addStackAnnotations = (stack, annotations) => {
	const frame = annotations?.get(StackTraceKey.key);
	if (frame) stack = `${stack}\n${currentStackTrace(frame)}`;
	return stack;
};
var interruptCauseStack = (error, interrupts) => {
	const out = [`${error.name}: ${error.message}`];
	for (const current of interrupts) {
		const fiberId = current.fiberId !== void 0 ? `#${current.fiberId}` : "unknown";
		const frame = current.annotations.get(InterruptorStackTrace.key);
		out.push(`    at fiber (${fiberId})`);
		if (frame) out.push(currentStackTrace(frame));
	}
	return out.join("\n");
};
var currentStackTrace = (frame) => {
	const out = [];
	let current = frame;
	let i = 0;
	while (current && i < 10) {
		const stack = current.stack();
		if (stack) {
			const locationMatchAll = stack.matchAll(locationRegExp);
			let match = false;
			for (const [, location] of locationMatchAll) {
				match = true;
				out.push(`    at ${current.name} (${location})`);
			}
			if (!match) out.push(`    at ${current.name} (${stack.replace(/^at /, "")})`);
		} else out.push(`    at ${current.name}`);
		current = current.parent;
		i++;
	}
	return out.join("\n");
};
/** @internal */
var causePretty = (cause) => causePrettyErrors(cause).map(renderPrettyError).join("\n");
var renderPrettyError = (e) => e.cause ? `${e.stack} {\n${renderErrorCause(e.cause, "  ")}\n}` : e.stack;
var renderErrorCause = (cause, prefix) => {
	const lines = cause.stack.split("\n");
	let stack = `${prefix}[cause]: ${lines[0]}`;
	for (let i = 1, len = lines.length; i < len; i++) stack += `\n${prefix}${lines[i]}`;
	if (cause.cause) stack += ` {\n${renderErrorCause(cause.cause, `${prefix}  `)}\n${prefix}}`;
	return stack;
};
/** @internal */
var FiberTypeId = "~effect/Fiber";
var fiberVariance = {
	_A: identity,
	_E: identity
};
var fiberIdStore = { id: 0 };
/** @internal */
var getCurrentFiber = () => globalThis[currentFiberTypeId];
/** @internal */
var FiberImpl = class {
	constructor(context, interruptible = true) {
		this[FiberTypeId] = fiberVariance;
		this.setContext(context);
		this.id = ++fiberIdStore.id;
		this.currentOpCount = 0;
		this.interruptible = interruptible;
		this._stack = [];
		this._observers = [];
		this._exit = void 0;
		this._children = void 0;
		this._interruptedCause = void 0;
		this._yielded = void 0;
		this._running = false;
		this._deferredInterrupt = false;
		this.runtimeMetrics?.recordFiberStart(this.context);
	}
	[FiberTypeId];
	id;
	interruptible;
	currentOpCount;
	_stack;
	_observers;
	_exit;
	_children;
	_interruptedCause;
	_yielded;
	_running;
	_deferredInterrupt;
	context;
	currentScheduler;
	currentTracerContext;
	currentSpan;
	currentLogLevel;
	minimumLogLevel;
	currentStackFrame;
	runtimeMetrics;
	maxOpsBeforeYield;
	currentPreventYield;
	_dispatcher = void 0;
	get currentDispatcher() {
		return this._dispatcher ??= this.currentScheduler.makeDispatcher();
	}
	getRef(ref) {
		return get(this.context, ref);
	}
	addObserver(cb) {
		if (this._exit) {
			cb(this._exit);
			return constVoid;
		}
		this._observers.push(cb);
		return () => {
			if (this._exit) return;
			const index = this._observers.indexOf(cb);
			if (index >= 0) this._observers.splice(index, 1);
		};
	}
	interruptUnsafe(fiberId, annotations) {
		if (this._exit) return;
		let cause = causeInterrupt(fiberId);
		if (this.currentStackFrame) cause = causeAnnotate(cause, make$7(StackTraceKey, this.currentStackFrame));
		if (annotations) cause = causeAnnotate(cause, annotations);
		this._interruptedCause = this._interruptedCause ? causeCombine(this._interruptedCause, cause) : cause;
		if (this.interruptible) {
			if (this._running) this._deferredInterrupt = true;
			else this.evaluate(failCause$3(this._interruptedCause));
		}
	}
	pollUnsafe() {
		return this._exit;
	}
	evaluate(effect) {
		if (this._exit) return;
		else if (this._yielded !== void 0) {
			const yielded = this._yielded;
			this._yielded = void 0;
			yielded();
		}
		const exit = this.runLoop(effect);
		if (exit === Yield) return;
		const interruptChildren = fiberMiddleware.interruptChildren && fiberMiddleware.interruptChildren(this);
		if (interruptChildren !== void 0) return this.evaluate(flatMap$2(interruptChildren, () => exit));
		this._exit = exit;
		this.runtimeMetrics?.recordFiberEnd(this.context, this._exit);
		for (let i = 0; i < this._observers.length; i++) this._observers[i](exit);
		this._observers.length = 0;
		this._stack.length = 0;
		this._children = void 0;
		this.context = empty$2();
	}
	runLoop(effect) {
		const prevFiber = globalThis[currentFiberTypeId];
		globalThis[currentFiberTypeId] = this;
		const prevRunning = this._running;
		this._running = true;
		let yielding = false;
		let current = effect;
		this.currentOpCount = 0;
		try {
			while (true) {
				if (this._deferredInterrupt) {
					this._deferredInterrupt = false;
					current = failCause$3(this._interruptedCause);
				}
				this.currentOpCount++;
				if (!yielding && !this.currentPreventYield && this.currentScheduler.shouldYield(this)) {
					yielding = true;
					const prev = current;
					current = flatMap$2(yieldNow$1, () => prev);
				}
				current = this.currentTracerContext ? this.currentTracerContext(current, this) : current[evaluate](this);
				if (current === Yield) {
					const yielded = this._yielded;
					if (ExitTypeId in yielded) {
						this._deferredInterrupt = false;
						this._yielded = void 0;
						return yielded;
					} else if (this._deferredInterrupt) {
						this._yielded = void 0;
						yielded();
						continue;
					}
					return Yield;
				}
			}
		} catch (error) {
			if (!hasProperty(current, evaluate)) return exitDie(`Fiber.runLoop: Not a valid effect: ${String(current)}`);
			return this.runLoop(exitDie(error));
		} finally {
			this._running = prevRunning;
			globalThis[currentFiberTypeId] = prevFiber;
		}
	}
	getCont(symbol) {
		if (this._deferredInterrupt) {
			this._deferredInterrupt = false;
			return deferredInterruptCont;
		}
		while (true) {
			const op = this._stack.pop();
			if (!op) return void 0;
			const cont = op[contAll] && op[contAll](this);
			if (cont) {
				cont[symbol] = cont;
				return cont;
			}
			if (op[symbol]) return op;
		}
	}
	yieldWith(value) {
		this._yielded = value;
		return Yield;
	}
	children() {
		return this._children ??= /* @__PURE__ */ new Set();
	}
	pipe() {
		return pipeArguments(this, arguments);
	}
	setContext(context) {
		const previous = this.context;
		this.context = context;
		if (previous !== void 0 && hasSameCache(previous, context)) return;
		const scheduler = this.getRef(Scheduler);
		if (scheduler !== this.currentScheduler) {
			this.currentScheduler = scheduler;
			this._dispatcher = void 0;
		}
		this.currentSpan = getOrUndefinedUnsafe(context, ParentSpanKey);
		this.currentLogLevel = this.getRef(CurrentLogLevel);
		this.minimumLogLevel = this.getRef(MinimumLogLevel$1);
		this.currentStackFrame = this.getRef(CurrentStackFrame);
		this.maxOpsBeforeYield = this.getRef(MaxOpsBeforeYield);
		this.currentPreventYield = this.getRef(PreventSchedulerYield);
		this.runtimeMetrics = getOrUndefinedUnsafe(context, FiberRuntimeMetricsKey);
		const currentTracer = getOrUndefinedUnsafe(context, TracerKey);
		this.currentTracerContext = currentTracer ? currentTracer["context"] : void 0;
	}
	get currentSpanLocal() {
		return this.currentSpan?._tag === "Span" ? this.currentSpan : void 0;
	}
};
var deferredInterruptCont = {
	[contA](_value, fiber) {
		return failCause$3(fiber._interruptedCause);
	},
	[contE](_cause, fiber) {
		return failCause$3(fiber._interruptedCause);
	}
};
var fiberMiddleware = { interruptChildren: void 0 };
var fiberStackAnnotations = (fiber) => {
	if (!fiber.currentStackFrame) return void 0;
	const annotations = /* @__PURE__ */ new Map();
	annotations.set(InterruptorStackTrace.key, fiber.currentStackFrame);
	return makeUnsafe$3(annotations);
};
var fiberInterruptChildren = (fiber) => {
	if (fiber._children === void 0 || fiber._children.size === 0) return;
	return fiberInterruptAll(fiber._children);
};
/** @internal */
var fiberAwait = (self) => {
	const impl = self;
	if (impl._exit) return succeed$4(impl._exit);
	return callback$1((resume) => {
		if (impl._exit) return resume(succeed$4(impl._exit));
		return sync$1(self.addObserver((exit) => resume(succeed$4(exit))));
	});
};
/** @internal */
var fiberAwaitAll = (self) => callback$1((resume) => {
	const iter = self[Symbol.iterator]();
	const exits = [];
	let cancel = void 0;
	function loop() {
		let result = iter.next();
		while (!result.done) {
			if (result.value._exit) {
				exits.push(result.value._exit);
				result = iter.next();
				continue;
			}
			cancel = result.value.addObserver((exit) => {
				exits.push(exit);
				loop();
			});
			return;
		}
		resume(succeed$4(exits));
	}
	loop();
	return sync$1(() => cancel?.());
});
/** @internal */
var fiberJoin = (self) => {
	const impl = self;
	if (impl._exit) return impl._exit;
	return callback$1((resume) => {
		if (impl._exit) return resume(impl._exit);
		return sync$1(self.addObserver(resume));
	});
};
/** @internal */
var fiberJoinAll = (self) => callback$1((resume) => {
	const fibers = Array.from(self);
	if (fibers.length === 0) return resume(succeed$4(empty$3()));
	const out = new Array(fibers.length);
	const cancels = empty$3();
	let done = 0;
	let failed = false;
	for (let i = 0; i < fibers.length; i++) {
		if (failed) break;
		cancels.push(fibers[i].addObserver((exit) => {
			done++;
			if (exit._tag === "Failure") {
				failed = true;
				cancels.forEach((cancel) => cancel());
				return resume(exit);
			}
			out[i] = exit.value;
			if (done === fibers.length) resume(succeed$4(out));
		}));
	}
	return sync$1(() => {
		failed = true;
		cancels.forEach((cancel) => cancel());
	});
});
/** @internal */
var fiberInterrupt = (self) => withFiber$1((fiber) => fiberInterruptAs(self, fiber.id));
/** @internal */
var fiberInterruptAs = /*#__PURE__*/ dual((args) => hasProperty(args[0], FiberTypeId), (self, fiberId, annotations) => withFiber$1((parent) => {
	let ann = fiberStackAnnotations(parent);
	ann = ann && annotations ? merge$1(ann, annotations) : ann ?? annotations;
	self.interruptUnsafe(fiberId, ann);
	return asVoid$1(fiberAwait(self));
}));
/** @internal */
var fiberInterruptAll = (fibers) => withFiber$1((parent) => {
	const annotations = fiberStackAnnotations(parent);
	let fiberArr = empty$3();
	for (const fiber of fibers) {
		fiber.interruptUnsafe(parent.id, annotations);
		fiberArr.push(fiber);
	}
	return asVoid$1(fiberAwaitAll(fiberArr));
});
/** @internal */
var succeed$4 = exitSucceed;
/** @internal */
var failCause$3 = exitFailCause;
/** @internal */
var fail$4 = exitFail;
/** @internal */
var sync$1 = /*#__PURE__*/ makePrimitive({
	op: "Sync",
	[evaluate](fiber) {
		const value = this[args]();
		const cont = fiber.getCont(contA);
		return cont ? cont[contA](value, fiber) : fiber.yieldWith(exitSucceed(value));
	}
});
/** @internal */
var suspend$2 = /*#__PURE__*/ makePrimitive({
	op: "Suspend",
	[evaluate](_fiber) {
		return this[args]();
	}
});
/** @internal */
var fromOption$1 = /*#__PURE__*/ dual((args) => args.length >= 2 || isOption(args[0]), (option, onNone) => isNone(option) ? fail$4(onNone ? onNone() : new NoSuchElementError$1("Effect.fromOption: Option.none")) : succeed$4(option.value));
/** @internal */
var fromResult$1 = /*#__PURE__*/ match$4({
	onFailure: fail$4,
	onSuccess: succeed$4
});
/** @internal */
var fromNullishOr$1 = (value) => value == null ? fail$4(new NoSuchElementError$1()) : succeed$4(value);
/** @internal */
var yieldNowWith$1 = /*#__PURE__*/ makePrimitive({
	op: "Yield",
	[evaluate](fiber) {
		let resumed = false;
		fiber.currentDispatcher.scheduleTask(() => {
			if (resumed) return;
			fiber.evaluate(exitVoid);
		}, this[args] ?? 0);
		return fiber.yieldWith(() => {
			resumed = true;
		});
	}
});
/** @internal */
var yieldNow$1 = /*#__PURE__*/ yieldNowWith$1(0);
/** @internal */
var succeedSome$1 = (a) => succeed$4(some(a));
/** @internal */
var succeedNone$1 = /*#__PURE__*/ succeed$4(/*#__PURE__*/ none());
/** @internal */
var transposeOption$1 = (self) => isNone(self) ? succeedNone$1 : map$3(self.value, some);
/** @internal */
var failCauseSync$1 = (evaluate) => suspend$2(() => failCause$3(internalCall(evaluate)));
/** @internal */
var die$3 = (defect) => exitDie(defect);
/** @internal */
var failSync$1 = (error) => suspend$2(() => fail$4(internalCall(error)));
/** @internal */
var void_$2 = /*#__PURE__*/ succeed$4(void 0);
/** @internal */
var try_$1 = (options) => {
	const evaluate = typeof options === "function" ? options : options.try;
	const catcher = typeof options === "function" ? (cause) => new UnknownError$1(cause, "An error occurred in Effect.try") : options.catch;
	return suspend$2(() => {
		try {
			return succeed$4(internalCall(evaluate));
		} catch (err) {
			return fail$4(internalCall(() => catcher(err)));
		}
	});
};
/** @internal */
var promise$1 = (evaluate) => callbackOptions(function(resume, signal) {
	internalCall(() => evaluate(signal)).then((a) => resume(succeed$4(a)), (e) => resume(die$3(e)));
}, evaluate.length !== 0);
/** @internal */
var tryPromise$1 = (options) => {
	const f = typeof options === "function" ? options : options.try;
	const catcher = typeof options === "function" ? (cause) => new UnknownError$1(cause, "An error occurred in Effect.tryPromise") : options.catch;
	return callbackOptions(function(resume, signal) {
		const failWithCatch = (cause) => {
			try {
				resume(fail$4(internalCall(() => catcher(cause))));
			} catch (err) {
				resume(die$3(err));
			}
		};
		try {
			internalCall(() => f(signal)).then((a) => resume(succeed$4(a)), failWithCatch);
		} catch (err) {
			failWithCatch(err);
		}
	}, f.length !== 0);
};
/** @internal */
var withFiberId = (f) => withFiber$1((fiber) => f(fiber.id));
/** @internal */
var fiber$1 = /*#__PURE__*/ withFiber$1(succeed$4);
/** @internal */
var fiberId$1 = /*#__PURE__*/ withFiberId(succeed$4);
var callbackOptions = /*#__PURE__*/ makePrimitive({
	op: "Async",
	single: false,
	[evaluate](fiber) {
		const register = internalCall(() => this[args][0].bind(fiber.currentScheduler));
		let resumed = false;
		let yielded = false;
		const controller = this[args][1] ? new AbortController() : void 0;
		const onCancel = register((effect) => {
			if (resumed) return;
			resumed = true;
			if (yielded) fiber.evaluate(effect);
			else yielded = effect;
		}, controller?.signal);
		if (yielded !== false) return yielded;
		yielded = true;
		fiber._yielded = () => {
			resumed = true;
		};
		if (controller === void 0 && onCancel === void 0) return Yield;
		fiber._stack.push(asyncFinalizer(() => {
			resumed = true;
			controller?.abort();
			return onCancel ?? exitVoid;
		}));
		return Yield;
	}
});
var asyncFinalizer = /*#__PURE__*/ makePrimitive({
	op: "AsyncFinalizer",
	[contAll](fiber) {
		if (fiber.interruptible) {
			fiber.interruptible = false;
			fiber._stack.push(setInterruptibleTrue);
		}
	},
	[contE](cause, _fiber) {
		return hasInterrupts$1(cause) ? flatMap$2(this[args](), () => failCause$3(cause)) : failCause$3(cause);
	}
});
/** @internal */
var callback$1 = (register) => callbackOptions(register, register.length >= 2);
/** @internal */
var never$1 = /*#__PURE__*/ callback$1(constVoid);
/** @internal */
var gen$1 = (...args) => suspend$2(() => fromIteratorUnsafe(args.length === 1 ? args[0]() : args[1].call(args[0].self)));
/** @internal */
var fnUntraced$1 = (body, ...pipeables) => {
	const fn = pipeables.length === 0 ? function() {
		return suspend$2(() => fromIteratorUnsafe(body.apply(this, arguments)));
	} : function() {
		let effect = suspend$2(() => fromIteratorUnsafe(body.apply(this, arguments)));
		for (let i = 0; i < pipeables.length; i++) effect = pipeables[i](effect, ...arguments);
		return effect;
	};
	return defineFunctionLength(body.length, fn);
};
var defineFunctionLength = (length, fn) => Object.defineProperty(fn, "length", {
	value: length,
	configurable: true
});
var fnStackCleaner = /*#__PURE__*/ makeStackCleaner(2);
/** @internal */
var fn$1 = function() {
	const nameFirst = typeof arguments[0] === "string";
	const name = nameFirst ? arguments[0] : "Effect.fn";
	const spanOptions = nameFirst ? arguments[1] : void 0;
	const prevLimit = getStackTraceLimit();
	setStackTraceLimit(2);
	const defError = new globalThis.Error();
	setStackTraceLimit(prevLimit);
	if (nameFirst) return (body, ...pipeables) => makeFn(name, body, defError, pipeables, nameFirst, spanOptions);
	return makeFn(name, arguments[0], defError, Array.prototype.slice.call(arguments, 1), nameFirst, spanOptions);
};
var makeFn = (name, bodyOrOptions, defError, pipeables, addSpan, spanOptions) => {
	const body = typeof bodyOrOptions === "function" ? bodyOrOptions : pipeables.shift().bind(bodyOrOptions.self);
	return defineFunctionLength(body.length, function(...args) {
		let result = suspend$2(() => {
			const iter = body.apply(this, arguments);
			return isEffect$1(iter) ? iter : fromIteratorUnsafe(iter);
		});
		for (let i = 0; i < pipeables.length; i++) result = pipeables[i](result, ...args);
		if (!isEffect$1(result)) return result;
		const prevLimit = getStackTraceLimit();
		setStackTraceLimit(2);
		const callError = new globalThis.Error();
		setStackTraceLimit(prevLimit);
		return updateService$1(addSpan ? useSpan$1(name, spanOptions, (span) => provideParentSpan(result, span)) : result, CurrentStackFrame, (prev) => ({
			name,
			stack: fnStackCleaner(() => callError.stack),
			parent: {
				name: `${name} (definition)`,
				stack: fnStackCleaner(() => defError.stack),
				parent: prev
			}
		}));
	});
};
/** @internal */
var fnUntracedEager$1 = (body, ...pipeables) => defineFunctionLength(body.length, pipeables.length === 0 ? function() {
	return fromIteratorEagerUnsafe(() => body.apply(this, arguments));
} : function() {
	let effect = fromIteratorEagerUnsafe(() => body.apply(this, arguments));
	for (const pipeable of pipeables) effect = pipeable(effect);
	return effect;
});
var fromIteratorEagerUnsafe = (evaluate) => {
	try {
		const iterator = evaluate();
		let value = void 0;
		while (true) {
			const state = iterator.next(value);
			if (state.done) return succeed$4(state.value);
			const primitive = state.value;
			if (primitive && primitive._tag === "Success") {
				value = primitive.value;
				continue;
			} else if (primitive && primitive._tag === "Failure") return state.value;
			else {
				let isFirstExecution = true;
				return suspend$2(() => {
					if (isFirstExecution) {
						isFirstExecution = false;
						return flatMap$2(state.value, (value) => fromIteratorUnsafe(iterator, value));
					} else return suspend$2(() => fromIteratorUnsafe(evaluate()));
				});
			}
		}
	} catch (error) {
		return die$3(error);
	}
};
var fromIteratorUnsafe = /*#__PURE__*/ makePrimitive({
	op: "Iterator",
	single: false,
	[contA](value, fiber) {
		const iter = this[args][0];
		while (true) {
			const state = iter.next(value);
			if (state.done) return succeed$4(state.value);
			if (!effectIsExit(state.value)) {
				fiber._stack.push(this);
				return state.value;
			} else if (state.value._tag === "Failure") return state.value;
			value = state.value.value;
		}
	},
	[evaluate](fiber) {
		return this[contA](this[args][1], fiber);
	}
});
/** @internal */
var as$1 = /*#__PURE__*/ dual(2, (self, value) => {
	const b = succeed$4(value);
	return flatMap$2(self, (_) => b);
});
/** @internal */
var asSome$1 = (self) => map$3(self, some);
/** @internal */
var flip$1 = (self) => matchEffect$2(self, {
	onFailure: succeed$4,
	onSuccess: fail$4
});
/** @internal */
var andThen$1 = /*#__PURE__*/ dual(2, (self, f) => flatMap$2(self, (a) => isEffect$1(f) ? f : internalCall(() => f(a))));
/** @internal */
var tap$2 = /*#__PURE__*/ dual(2, (self, f) => flatMap$2(self, (a) => as$1(isEffect$1(f) ? f : internalCall(() => f(a)), a)));
/** @internal */
var asVoid$1 = (self) => flatMap$2(self, (_) => exitVoid);
/** @internal */
var sandbox$1 = (self) => catchCause$2(self, fail$4);
/** @internal */
var raceAll$1 = (all, options) => withFiber$1((parent) => callback$1((resume) => {
	const effects = fromIterable(all);
	const len = effects.length;
	let doneCount = 0;
	let done = false;
	const fibers = /* @__PURE__ */ new Set();
	const failures = [];
	const onExit = (exit, fiber, i) => {
		doneCount++;
		if (exit._tag === "Failure") {
			failures.push(...exit.cause.reasons);
			if (doneCount >= len) resume(failCause$3(causeFromReasons(failures)));
			return;
		}
		const isWinner = !done;
		done = true;
		resume(fibers.size === 0 ? exit : flatMap$2(uninterruptible$1(fiberInterruptAll(fibers)), () => exit));
		if (isWinner && options?.onWinner) options.onWinner({
			fiber,
			index: i,
			parentFiber: parent
		});
	};
	for (let i = 0; i < len; i++) {
		const fiber = forkUnsafe$1(parent, effects[i], true, true, false);
		fibers.add(fiber);
		fiber.addObserver((exit) => {
			fibers.delete(fiber);
			onExit(exit, fiber, i);
		});
		if (done) break;
	}
	return fiberInterruptAll(fibers);
}));
/** @internal */
var raceAllFirst$1 = (all, options) => withFiber$1((parent) => callback$1((resume) => {
	let done = false;
	const fibers = /* @__PURE__ */ new Set();
	const onExit = (exit) => {
		done = true;
		resume(fibers.size === 0 ? exit : flatMap$2(uninterruptible$1(fiberInterruptAll(fibers)), () => exit));
	};
	let i = 0;
	for (const effect of all) {
		if (done) break;
		const index = i++;
		const fiber = forkUnsafe$1(parent, effect, true, true, false);
		fibers.add(fiber);
		fiber.addObserver((exit) => {
			fibers.delete(fiber);
			const isWinner = !done;
			onExit(exit);
			if (isWinner && options?.onWinner) options.onWinner({
				fiber,
				index,
				parentFiber: parent
			});
		});
	}
	return fiberInterruptAll(fibers);
}));
/** @internal */
var race$1 = /*#__PURE__*/ dual((args) => isEffect$1(args[1]), (self, that, options) => raceAll$1([self, that], options));
/** @internal */
var raceFirst$1 = /*#__PURE__*/ dual((args) => isEffect$1(args[1]), (self, that, options) => raceAllFirst$1([self, that], options));
/** @internal */
var flatMap$2 = /*#__PURE__*/ dual(2, (self, f) => {
	const onSuccess = Object.create(OnSuccessProto);
	onSuccess[args] = self;
	onSuccess[contA] = f.length !== 1 ? (a) => f(a) : f;
	return onSuccess;
});
var OnSuccessProto = /*#__PURE__*/ makePrimitiveProto({
	op: "OnSuccess",
	[evaluate](fiber) {
		fiber._stack.push(this);
		return this[args];
	}
});
/** @internal */
var matchCauseEffectEager$1 = /*#__PURE__*/ dual(2, (self, options) => {
	if (effectIsExit(self)) return self._tag === "Success" ? options.onSuccess(self.value) : options.onFailure(self.cause);
	return matchCauseEffect$1(self, options);
});
/** @internal */
var effectIsExit = (effect) => ExitTypeId in effect;
/** @internal */
var flatMapEager$1 = /*#__PURE__*/ dual(2, (self, f) => {
	if (effectIsExit(self)) return self._tag === "Success" ? f(self.value) : self;
	return flatMap$2(self, f);
});
/** @internal */
var flatten$1 = (self) => flatMap$2(self, identity);
/** @internal */
var map$3 = /*#__PURE__*/ dual(2, (self, f) => flatMap$2(self, (a) => succeed$4(internalCall(() => f(a)))));
/** @internal */
var mapEager$1 = /*#__PURE__*/ dual(2, (self, f) => effectIsExit(self) ? exitMap(self, f) : map$3(self, f));
/** @internal */
var mapErrorEager$1 = /*#__PURE__*/ dual(2, (self, f) => effectIsExit(self) ? exitMapError(self, f) : mapError$1(self, f));
/** @internal */
var mapBothEager$1 = /*#__PURE__*/ dual(2, (self, options) => effectIsExit(self) ? exitMapBoth(self, options) : mapBoth$1(self, options));
/** @internal */
var catchEager$1 = /*#__PURE__*/ dual(2, (self, f) => {
	if (effectIsExit(self)) {
		if (self._tag === "Success") return self;
		const error = findError$1(self.cause);
		if (isFailure$3(error)) return self;
		return f(error.success);
	}
	return catch_$1(self, f);
});
/** @internal */
var exitInterrupt = (fiberId) => exitFailCause(causeInterrupt(fiberId));
/** @internal */
var exitIsSuccess = (self) => self._tag === "Success";
/** @internal */
var exitIsFailure = (self) => self._tag === "Failure";
/** @internal */
var exitFilterCause = (self) => self._tag === "Failure" ? succeed$5(self.cause) : fail$5(self);
/** @internal */
var exitVoid = /*#__PURE__*/ exitSucceed(void 0);
/** @internal */
var exitMap = /*#__PURE__*/ dual(2, (self, f) => self._tag === "Success" ? exitSucceed(f(self.value)) : self);
/** @internal */
var exitMapError = /*#__PURE__*/ dual(2, (self, f) => {
	if (self._tag === "Success") return self;
	const error = findError$1(self.cause);
	if (isFailure$3(error)) return self;
	return exitFail(f(error.success));
});
/** @internal */
var exitMapBoth = /*#__PURE__*/ dual(2, (self, options) => {
	if (self._tag === "Success") return exitSucceed(options.onSuccess(self.value));
	const error = findError$1(self.cause);
	if (isFailure$3(error)) return self;
	return exitFail(options.onFailure(error.success));
});
/** @internal */
var exitZipRight = /*#__PURE__*/ dual(2, (self, that) => exitIsSuccess(self) ? that : self);
/** @internal */
var exitMatch = /*#__PURE__*/ dual(2, (self, options) => exitIsSuccess(self) ? options.onSuccess(self.value) : options.onFailure(self.cause));
/** @internal */
var exitAsVoidAll = (exits) => {
	const failures = [];
	for (const exit of exits) if (exit._tag === "Failure") failures.push(...exit.cause.reasons);
	return failures.length === 0 ? exitVoid : exitFailCause(causeFromReasons(failures));
};
/** @internal */
var service$1 = (service) => service;
/** @internal */
var serviceOption$1 = (service) => withFiber$1((fiber) => succeed$4(getOption(fiber.context, service)));
/** @internal */
var serviceOptional = (service) => withFiber$1((fiber) => fromOption$1(getOption(fiber.context, service)));
/** @internal */
var updateContext$1 = /*#__PURE__*/ dual(2, (self, f) => withFiber$1((fiber) => {
	const prevContext = fiber.context;
	const nextContext = f(prevContext);
	if (prevContext === nextContext) return self;
	fiber.setContext(nextContext);
	return onExitPrimitive$1(self, () => {
		fiber.setContext(prevContext);
	});
}));
/** @internal */
var updateService$1 = /*#__PURE__*/ dual(3, (self, service, f) => updateContext$1(self, (s) => {
	const prev = getUnsafe(s, service);
	const next = f(prev);
	if (prev === next) return s;
	return add(s, service, next);
}));
/** @internal */
var updateServiceScoped$1 = (service, update, options) => uninterruptible$1(withFiber$1((fiber) => {
	const original = getUnsafe(fiber.context, service);
	const updated = update(original);
	fiber.setContext(add(fiber.context, service, updated));
	return scopeAddFinalizerExit(getUnsafe(fiber.context, scopeTag), (_) => {
		const current = getUnsafe(fiber.context, service);
		let next;
		if (options?.reset === void 0) {
			if (current !== updated) return void_$2;
			next = original;
		} else next = options.reset(original, updated, current);
		fiber.setContext(add(fiber.context, service, next));
		return void_$2;
	});
}));
/** @internal */
var context$1 = () => getContext;
var getContext = /*#__PURE__*/ withFiber$1((fiber) => succeed$4(fiber.context));
/** @internal */
var contextWith$1 = (f) => withFiber$1((fiber) => f(fiber.context));
/** @internal */
var setContext$1 = /*#__PURE__*/ dual(2, (self, context) => updateContext$1(self, constant(context)));
/** @internal */
var provideContext$1 = /*#__PURE__*/ dual(2, (self, context) => {
	if (effectIsExit(self)) return self;
	return updateContext$1(self, merge$1(context));
});
/** @internal */
var provideService$1 = function() {
	if (arguments.length === 1) return dual(2, (self, impl) => provideServiceImpl(self, arguments[0], impl));
	return dual(3, (self, service, impl) => provideServiceImpl(self, service, impl)).apply(this, arguments);
};
var provideServiceImpl = (self, service, implementation) => updateContext$1(self, add(service, implementation));
/** @internal */
var provideServiceEffect$1 = /*#__PURE__*/ dual(3, (self, service, acquire) => flatMap$2(acquire, (implementation) => provideService$1(self, service, implementation)));
/** @internal */
var zip$1 = /*#__PURE__*/ dual((args) => isEffect$1(args[1]), (self, that, options) => zipWith$1(self, that, (a, a2) => [a, a2], options));
/** @internal */
var zipWith$1 = /*#__PURE__*/ dual((args) => isEffect$1(args[1]), (self, that, f, options) => options?.concurrent ? map$3(all$1([self, that], { concurrency: 2 }), ([a, a2]) => internalCall(() => f(a, a2))) : flatMap$2(self, (a) => map$3(that, (a2) => internalCall(() => f(a, a2)))));
var filterOrFail$1 = /*#__PURE__*/ dual((args) => isEffect$1(args[0]), (self, predicate, orFailWith) => filterOrElse$1(self, predicate, orFailWith ? (a) => fail$4(orFailWith(a)) : () => fail$4(new NoSuchElementError$1())));
/** @internal */
var when$1 = /*#__PURE__*/ dual(2, (self, condition) => flatMap$2(condition, (pass) => pass ? asSome$1(self) : succeedNone$1));
/** @internal */
var replicate$1 = /*#__PURE__*/ dual(2, (self, n) => Array.from({ length: n }, () => self));
/** @internal */
var replicateEffect$1 = /*#__PURE__*/ dual((args) => isEffect$1(args[0]), (self, n, options) => all$1(replicate$1(self, n), options));
/** @internal */
var forever$2 = /*#__PURE__*/ dual((args) => isEffect$1(args[0]), (self, options) => whileLoop$1({
	while: constTrue,
	body: constant(options?.disableYield ? self : flatMap$2(self, (_) => yieldNow$1)),
	step: constVoid
}));
/** @internal */
var catchCause$2 = /*#__PURE__*/ dual(2, (self, f) => {
	const onFailure = Object.create(OnFailureProto);
	onFailure[args] = self;
	onFailure[contE] = f.length !== 1 ? (cause) => f(cause) : f;
	return onFailure;
});
var OnFailureProto = /*#__PURE__*/ makePrimitiveProto({
	op: "OnFailure",
	[evaluate](fiber) {
		fiber._stack.push(this);
		return this[args];
	}
});
/** @internal */
var catchCauseIf$1 = /*#__PURE__*/ dual(3, (self, predicate, f) => catchCause$2(self, (cause) => {
	if (!predicate(cause)) return failCause$3(cause);
	return internalCall(() => f(cause));
}));
/** @internal */
var catchCauseFilter$1 = /*#__PURE__*/ dual(3, (self, filter, f) => catchCause$2(self, (cause) => {
	const eb = filter(cause);
	return isFailure$3(eb) ? failCause$3(eb.failure) : internalCall(() => f(eb.success, cause));
}));
/** @internal */
var catch_$1 = /*#__PURE__*/ dual(2, (self, f) => catchCauseFilter$1(self, findError$1, (e) => f(e)));
/** @internal */
var catchNoSuchElement$1 = (self) => matchEffect$2(self, {
	onFailure: (error) => isNoSuchElementError(error) ? succeedNone$1 : fail$4(error),
	onSuccess: succeedSome$1
});
/** @internal */
var catchDefect$1 = /*#__PURE__*/ dual(2, (self, f) => catchCauseFilter$1(self, findDefect$1, f));
/** @internal */
var tapCause$1 = /*#__PURE__*/ dual(2, (self, f) => catchCause$2(self, (cause) => andThen$1(internalCall(() => f(cause)), failCause$3(cause))));
/** @internal */
var tapCauseIf$1 = /*#__PURE__*/ dual(3, (self, predicate, f) => catchCauseIf$1(self, predicate, (cause) => andThen$1(internalCall(() => f(cause)), failCause$3(cause))));
/** @internal */
var tapCauseFilter$1 = /*#__PURE__*/ dual(3, (self, filter, f) => catchCause$2(self, (cause) => {
	const result = filter(cause);
	if (isFailure$3(result)) return failCause$3(cause);
	return andThen$1(internalCall(() => f(result.success, cause)), failCause$3(cause));
}));
/** @internal */
var tapError$1 = /*#__PURE__*/ dual(2, (self, f) => tapCauseFilter$1(self, findError$1, (e) => f(e)));
/** @internal */
var tapErrorTag$1 = /*#__PURE__*/ dual(3, (self, k, f) => {
	const predicate = Array.isArray(k) ? (e) => hasProperty(e, "_tag") && k.includes(e._tag) : isTagged(k);
	return tapError$1(self, (error) => predicate(error) ? f(error) : void_$2);
});
/** @internal */
var tapDefect$1 = /*#__PURE__*/ dual(2, (self, f) => tapCauseFilter$1(self, findDefect$1, (_) => f(_)));
/** @internal */
var catchIf$1 = /*#__PURE__*/ dual((args) => isEffect$1(args[0]), (self, predicate, f, orElse) => catchCause$2(self, (cause) => {
	const error = findError$1(cause);
	if (isFailure$3(error)) return failCause$3(error.failure);
	if (!predicate(error.success)) return orElse ? internalCall(() => orElse(error.success)) : failCause$3(cause);
	return internalCall(() => f(error.success));
}));
/** @internal */
var catchFilter$1 = /*#__PURE__*/ dual((args) => isEffect$1(args[0]), (self, filter, f, orElse) => catchCause$2(self, (cause) => {
	const error = findError$1(cause);
	if (isFailure$3(error)) return failCause$3(error.failure);
	const result = filter(error.success);
	if (isFailure$3(result)) return orElse ? internalCall(() => orElse(result.failure)) : failCause$3(cause);
	return internalCall(() => f(result.success));
}));
/** @internal */
var catchTag$1 = /*#__PURE__*/ dual((args) => isEffect$1(args[0]), (self, k, f, orElse) => {
	return catchIf$1(self, Array.isArray(k) ? (e) => hasProperty(e, "_tag") && k.includes(e._tag) : isTagged(k), f, orElse);
});
/** @internal */
var catchTags$1 = /*#__PURE__*/ dual((args) => isEffect$1(args[0]), (self, cases, orElse) => {
	let keys;
	return catchFilter$1(self, (e) => {
		keys ??= Object.keys(cases);
		return hasProperty(e, "_tag") && isString$1(e["_tag"]) && keys.includes(e["_tag"]) ? succeed$5(e) : fail$5(e);
	}, (e) => internalCall(() => cases[e["_tag"]](e)), orElse);
});
/** @internal */
var catchReason$1 = /*#__PURE__*/ dual((args) => isEffect$1(args[0]), (self, errorTag, reasonTag, f, orElse) => catchIf$1(self, (e) => isTagged(e, errorTag) && hasProperty(e, "reason"), (e) => {
	const reason = e.reason;
	if (isTagged(reason, reasonTag)) return f(reason, e);
	return orElse ? internalCall(() => orElse(reason, e)) : fail$4(e);
}));
/** @internal */
var catchReasons$1 = /*#__PURE__*/ dual((args) => isEffect$1(args[0]), (self, errorTag, cases, orElse) => {
	let keys;
	return catchIf$1(self, (e) => isTagged(e, errorTag) && hasProperty(e, "reason") && hasProperty(e.reason, "_tag") && isString$1(e.reason._tag), (e) => {
		const reason = e.reason;
		keys ??= Object.keys(cases);
		if (keys.includes(reason._tag)) return internalCall(() => cases[reason._tag](reason, e));
		return orElse ? internalCall(() => orElse(reason, e)) : fail$4(e);
	});
});
/** @internal */
var unwrapReason$1 = /*#__PURE__*/ dual(2, (self, errorTag) => catchFilter$1(self, (e) => {
	if (isTagged(e, errorTag) && hasProperty(e, "reason")) return succeed$5(e.reason);
	return fail$5(e);
}, fail$4));
/** @internal */
var mapError$1 = /*#__PURE__*/ dual(2, (self, f) => catch_$1(self, (error) => failSync$1(() => f(error))));
var mapBoth$1 = /*#__PURE__*/ dual(2, (self, options) => matchEffect$2(self, {
	onFailure: (e) => failSync$1(() => options.onFailure(e)),
	onSuccess: (a) => sync$1(() => options.onSuccess(a))
}));
/** @internal */
var orDie$1 = (self) => catch_$1(self, die$3);
/** @internal */
var orElseSucceed$1 = /*#__PURE__*/ dual(2, (self, f) => catch_$1(self, (_) => sync$1(f)));
/** @internal */
var firstSuccessOf$1 = (effects) => suspend$2(() => {
	const iterator = effects[Symbol.iterator]();
	let state = iterator.next();
	if (state.done) return die$3(/* @__PURE__ */ new Error("Received an empty collection of effects"));
	function loop(current) {
		const next = iterator.next();
		if (next.done) return current.value;
		return catch_$1(current.value, (_) => loop(next));
	}
	return loop(state);
});
/** @internal */
var eventually$1 = (self) => catch_$1(self, (_) => flatMap$2(yieldNow$1, () => eventually$1(self)));
/** @internal */
var ignore$1 = /*#__PURE__*/ dual((args) => isEffect$1(args[0]), (self, options) => {
	if (!options?.log) return matchEffect$2(self, {
		onFailure: (_) => void_$2,
		onSuccess: (_) => void_$2
	});
	const logEffect = logWithLevel$1(options.log === true ? void 0 : options.log);
	return matchCauseEffect$1(self, {
		onFailure(cause) {
			const failure = findFail(cause);
			return isFailure$3(failure) ? failCause$3(failure.failure) : options.message === void 0 ? logEffect(cause) : logEffect(options.message, cause);
		},
		onSuccess: (_) => void_$2
	});
});
/** @internal */
var ignoreCause$1 = /*#__PURE__*/ dual((args) => isEffect$1(args[0]), (self, options) => {
	if (!options?.log) return matchCauseEffect$1(self, {
		onFailure: (_) => void_$2,
		onSuccess: (_) => void_$2
	});
	const logEffect = logWithLevel$1(options.log === true ? void 0 : options.log);
	return matchCauseEffect$1(self, {
		onFailure: (cause) => options.message === void 0 ? logEffect(cause) : logEffect(options.message, cause),
		onSuccess: (_) => void_$2
	});
});
/** @internal */
var option$1 = (self) => match$2(self, {
	onFailure: none,
	onSuccess: some
});
/** @internal */
var result$1 = (self) => matchEager$1(self, {
	onFailure: fail$5,
	onSuccess: succeed$5
});
/** @internal */
var matchCauseEffect$1 = /*#__PURE__*/ dual(2, (self, options) => {
	const primitive = Object.create(OnSuccessAndFailureProto);
	primitive[args] = self;
	primitive[contA] = options.onSuccess.length !== 1 ? (a) => options.onSuccess(a) : options.onSuccess;
	primitive[contE] = options.onFailure.length !== 1 ? (cause) => options.onFailure(cause) : options.onFailure;
	return primitive;
});
var OnSuccessAndFailureProto = /*#__PURE__*/ makePrimitiveProto({
	op: "OnSuccessAndFailure",
	[evaluate](fiber) {
		fiber._stack.push(this);
		return this[args];
	}
});
/** @internal */
var matchCause$1 = /*#__PURE__*/ dual(2, (self, options) => matchCauseEffect$1(self, {
	onFailure: (cause) => sync$1(() => options.onFailure(cause)),
	onSuccess: (value) => sync$1(() => options.onSuccess(value))
}));
/** @internal */
var matchEffect$2 = /*#__PURE__*/ dual(2, (self, options) => matchCauseEffect$1(self, {
	onFailure: (cause) => {
		const fail = cause.reasons.find(isFailReason$1);
		return fail ? internalCall(() => options.onFailure(fail.error)) : failCause$3(cause);
	},
	onSuccess: options.onSuccess
}));
/** @internal */
var match$2 = /*#__PURE__*/ dual(2, (self, options) => matchEffect$2(self, {
	onFailure: (error) => sync$1(() => options.onFailure(error)),
	onSuccess: (value) => sync$1(() => options.onSuccess(value))
}));
/** @internal */
var matchEager$1 = /*#__PURE__*/ dual(2, (self, options) => {
	if (effectIsExit(self)) {
		if (self._tag === "Success") return exitSucceed(options.onSuccess(self.value));
		const error = findError$1(self.cause);
		if (isFailure$3(error)) return self;
		return exitSucceed(options.onFailure(error.success));
	}
	return match$2(self, options);
});
/** @internal */
var matchCauseEager$1 = /*#__PURE__*/ dual(2, (self, options) => {
	if (effectIsExit(self)) {
		if (self._tag === "Success") return exitSucceed(options.onSuccess(self.value));
		return exitSucceed(options.onFailure(self.cause));
	}
	return matchCause$1(self, options);
});
/** @internal */
var exit$1 = (self) => effectIsExit(self) ? exitSucceed(self) : exitPrimitive(self);
var exitPrimitive = /*#__PURE__*/ makePrimitive({
	op: "Exit",
	[evaluate](fiber) {
		fiber._stack.push(this);
		return this[args];
	},
	[contA](value, _, exit) {
		return succeed$4(exit ?? exitSucceed(value));
	},
	[contE](cause, _, exit) {
		return succeed$4(exit ?? exitFailCause(cause));
	}
});
/** @internal */
var isFailure$2 = /*#__PURE__*/ matchEager$1({
	onFailure: () => true,
	onSuccess: () => false
});
/** @internal */
var isSuccess$2 = /*#__PURE__*/ matchEager$1({
	onFailure: () => false,
	onSuccess: () => true
});
/** @internal */
var delay$1 = /*#__PURE__*/ dual(2, (self, duration) => andThen$1(sleep$1(duration), self));
/** @internal */
var timeoutOrElse$1 = /*#__PURE__*/ dual(2, (self, options) => raceFirst$1(self, flatMap$2(sleep$1(options.duration), options.orElse)));
/** @internal */
var timeout$1 = /*#__PURE__*/ dual(2, (self, duration) => timeoutOrElse$1(self, {
	duration,
	orElse: () => fail$4(new TimeoutError$1())
}));
/** @internal */
var timeoutOption$1 = /*#__PURE__*/ dual(2, (self, duration) => raceFirst$1(asSome$1(self), as$1(sleep$1(duration), none())));
/** @internal */
var timed$1 = (self) => clockWith$1((clock) => {
	const start = clock.monotonicTimeNanosUnsafe();
	return map$3(self, (a) => [nanos(clock.monotonicTimeNanosUnsafe() - start), a]);
});
/** @internal */
var ScopeTypeId = "~effect/Scope";
/** @internal */
var ScopeCloseableTypeId = "~effect/Scope/Closeable";
/** @internal */
var scopeTag = /*#__PURE__*/ Service("effect/Scope");
/** @internal */
var scopeClose = (self, exit_) => suspend$2(() => scopeCloseUnsafe(self, exit_) ?? void_$2);
/** @internal */
var scopeCloseUnsafe = (self, exit_) => {
	if (self.state._tag === "Closed") return;
	const closed = {
		_tag: "Closed",
		exit: exit_
	};
	if (self.state._tag === "Empty") {
		self.state = closed;
		return;
	}
	const state = self.state;
	self.state = closed;
	if (state.finalizer !== void 0) return state.finalizer(exit_);
	const finalizers = state.finalizers;
	if (finalizers === void 0 || finalizers.size === 0) return;
	else if (finalizers.size === 1) return finalizers.values().next().value(exit_);
	return scopeCloseFinalizers(self, finalizers, exit_);
};
var combineFinalizerCause = (exit_, finalizer) => exitIsSuccess(exit_) ? finalizer : catchCause$2(finalizer, (cause) => failCause$3(causeCombine(exit_.cause, cause)));
var scopeCloseFinalizers = /*#__PURE__*/ fnUntraced$1(function* (self, finalizers, exit_) {
	let exits = [];
	const fibers = [];
	const arr = Array.from(finalizers.values());
	const parent = getCurrentFiber();
	for (let i = arr.length - 1; i >= 0; i--) {
		const finalizer = arr[i];
		if (self.strategy === "sequential") exits.push(yield* exit$1(finalizer(exit_)));
		else fibers.push(forkUnsafe$1(parent, finalizer(exit_), true, true, "inherit"));
	}
	if (fibers.length > 0) exits = yield* fiberAwaitAll(fibers);
	return yield* exitAsVoidAll(exits);
});
/** @internal */
var scopeForkUnsafe = (scope, finalizerStrategy) => {
	const newScope = scopeMakeUnsafe(finalizerStrategy);
	if (scope.state._tag === "Closed") {
		newScope.state = scope.state;
		return newScope;
	}
	const key = {};
	scopeAddFinalizerUnsafe(scope, key, (exit) => scopeClose(newScope, exit));
	scopeAddFinalizerUnsafe(newScope, key, (_) => sync$1(() => scopeRemoveFinalizerUnsafe(scope, key)));
	return newScope;
};
/** @internal */
var scopeAddFinalizerExit = (scope, finalizer) => {
	return suspend$2(() => {
		if (scope.state._tag === "Closed") return finalizer(scope.state.exit);
		scopeAddFinalizerUnsafe(scope, {}, finalizer);
		return void_$2;
	});
};
/** @internal */
var scopeAddFinalizer = (scope, finalizer) => scopeAddFinalizerExit(scope, constant(finalizer));
/** @internal */
var scopeAddFinalizerUnsafe = (scope, key, finalizer) => {
	if (scope.state._tag === "Empty") scope.state = {
		_tag: "Open",
		finalizerKey: key,
		finalizer,
		finalizers: void 0
	};
	else if (scope.state._tag === "Open") {
		const state = scope.state;
		if (state.finalizer !== void 0) {
			state.finalizers = /* @__PURE__ */ new Map([[state.finalizerKey, state.finalizer]]);
			state.finalizerKey = void 0;
			state.finalizer = void 0;
			state.finalizers.set(key, finalizer);
		} else if (state.finalizers === void 0) {
			state.finalizerKey = key;
			state.finalizer = finalizer;
		} else state.finalizers.set(key, finalizer);
	}
};
/** @internal */
var scopeRemoveFinalizerUnsafe = (scope, key) => {
	if (scope.state._tag === "Open") {
		const state = scope.state;
		if (state.finalizerKey === key) {
			state.finalizerKey = void 0;
			state.finalizer = void 0;
		} else if (state.finalizers !== void 0) state.finalizers.delete(key);
	}
};
/** @internal */
var scopeFinalizerCountUnsafe = (scope) => scope.state._tag !== "Open" ? 0 : scope.state.finalizer !== void 0 ? 1 : scope.state.finalizers?.size ?? 0;
/** @internal */
var scopeMakeUnsafe = (finalizerStrategy = "sequential") => ({
	[ScopeCloseableTypeId]: ScopeCloseableTypeId,
	[ScopeTypeId]: ScopeTypeId,
	strategy: finalizerStrategy,
	state: constScopeEmpty
});
var constScopeEmpty = { _tag: "Empty" };
/** @internal */
var scopeMake = (finalizerStrategy) => sync$1(() => scopeMakeUnsafe(finalizerStrategy));
/** @internal */
var scope$1 = scopeTag;
/** @internal */
var provideScope = /*#__PURE__*/ provideService$1(scopeTag);
/** @internal */
var scoped$1 = (self) => withFiber$1((fiber) => {
	const prev = fiber.context;
	const scope = scopeMakeUnsafe();
	fiber.setContext(add(fiber.context, scopeTag, scope));
	return onExitPrimitive$1(self, (exit) => {
		fiber.setContext(prev);
		return scopeCloseUnsafe(scope, exit);
	});
});
/** @internal */
var scopedWith$1 = (f) => suspend$2(() => {
	const scope = scopeMakeUnsafe();
	return onExit$1(f(scope), (exit) => suspend$2(() => scopeCloseUnsafe(scope, exit) ?? void_$2));
});
/** @internal */
var acquireRelease$1 = (acquire, release, options) => contextWith$1((context) => uninterruptibleMask$1((restore) => flatMap$2(scope$1, (scope) => tap$2(options?.interruptible ? restore(acquire) : acquire, (a) => scopeAddFinalizerExit(scope, (exit) => provideContext$1(release(a, exit), context))))));
/** @internal */
var addFinalizer$2 = (finalizer) => flatMap$2(scope$1, (scope) => contextWith$1((context) => scopeAddFinalizerExit(scope, (exit) => provideContext$1(finalizer(exit), context))));
/** @internal */
var onExitPrimitive$1 = /*#__PURE__*/ makePrimitive({
	op: "OnExit",
	single: false,
	[evaluate](fiber) {
		fiber._stack.push(this);
		return this[args][0];
	},
	[contAll](fiber) {
		if (fiber.interruptible && this[args][2] !== true) {
			fiber._stack.push(setInterruptibleTrue);
			fiber.interruptible = false;
		}
	},
	[contA](value, _, exit) {
		exit ??= exitSucceed(value);
		const eff = this[args][1](exit);
		return eff ? flatMap$2(eff, (_) => exit) : exit;
	},
	[contE](cause, _, exit) {
		exit ??= exitFailCause(cause);
		const eff = this[args][1](exit);
		return eff ? flatMap$2(combineFinalizerCause(exit, eff), (_) => exit) : exit;
	}
});
/** @internal */
var onExit$1 = /*#__PURE__*/ dual(2, onExitPrimitive$1);
/** @internal */
var ensuring$1 = /*#__PURE__*/ dual(2, (self, finalizer) => onExit$1(self, (_) => finalizer));
/** @internal */
var onExitIf$1 = /*#__PURE__*/ dual(3, (self, predicate, f) => onExit$1(self, (exit) => {
	if (!predicate(exit)) return void_$2;
	return f(exit);
}));
/** @internal */
var onExitFilter$1 = /*#__PURE__*/ dual(3, (self, filter, f) => onExit$1(self, (exit) => {
	const b = filter(exit);
	return isFailure$3(b) ? void_$2 : f(b.success, exit);
}));
/** @internal */
var onError$1 = /*#__PURE__*/ dual(2, (self, f) => onExitFilter$1(self, exitFilterCause, f));
/** @internal */
var onErrorIf$1 = /*#__PURE__*/ dual(3, (self, predicate, f) => onExitIf$1(self, (exit) => {
	if (exit._tag !== "Failure") return false;
	return predicate(exit.cause);
}, (exit) => f(exit.cause)));
/** @internal */
var onErrorFilter$1 = /*#__PURE__*/ dual(3, (self, filter, f) => onExit$1(self, (exit) => {
	if (exit._tag !== "Failure") return void_$2;
	const result = filter(exit.cause);
	return isFailure$3(result) ? void_$2 : f(result.success, exit.cause);
}));
/** @internal */
var onInterrupt$1 = /*#__PURE__*/ dual(2, (self, finalizer) => onErrorFilter$1(causeFilterInterruptors, finalizer)(self));
/** @internal */
var acquireUseRelease$1 = (acquire, use, release) => uninterruptibleMask$1((restore) => flatMap$2(acquire, (a) => onExitPrimitive$1(restore(use(a)), (exit) => release(a, exit), true)));
/** @internal */
var acquireDisposable$1 = (acquire) => acquireRelease$1(acquire, (resource) => hasProperty(resource, Symbol.asyncDispose) ? promise$1(() => resource[Symbol.asyncDispose]()) : sync$1(() => resource[Symbol.dispose]()));
/** @internal */
var cachedInvalidateWithTTL$1 = /*#__PURE__*/ dual(2, (self, ttl) => sync$1(() => {
	const ttlMillis = toMillis(fromInputUnsafe(ttl));
	const isFinite = Number.isFinite(ttlMillis);
	const latch = makeLatchUnsafe(false);
	let expiresAt = 0;
	let running = false;
	let exit;
	const wait = flatMap$2(latch.await, () => exit);
	return [withFiber$1((fiber) => {
		const clock = fiber.getRef(ClockRef);
		const now = isFinite ? clock.currentTimeMillisUnsafe() : 0;
		if (running || now < expiresAt) return exit ?? wait;
		running = true;
		latch.closeUnsafe();
		exit = void 0;
		return onExit$1(self, (exit_) => sync$1(() => {
			running = false;
			expiresAt = clock.currentTimeMillisUnsafe() + ttlMillis;
			exit = exit_;
			latch.openUnsafe();
		}));
	}), sync$1(() => {
		expiresAt = 0;
		latch.closeUnsafe();
		exit = void 0;
	})];
}));
/** @internal */
var cachedWithTTL$1 = /*#__PURE__*/ dual(2, (self, timeToLive) => map$3(cachedInvalidateWithTTL$1(self, timeToLive), (tuple) => tuple[0]));
/** @internal */
var cached$1 = (self) => cachedWithTTL$1(self, infinity);
/** @internal */
var interrupt$2 = /*#__PURE__*/ withFiber$1((fiber) => failCause$3(causeInterrupt(fiber.id)));
/** @internal */
var uninterruptible$1 = (self) => withFiber$1((fiber) => {
	if (!fiber.interruptible) return self;
	fiber.interruptible = false;
	fiber._stack.push(setInterruptibleTrue);
	return self;
});
var setInterruptible = /*#__PURE__*/ makePrimitive({
	op: "SetInterruptible",
	[contAll](fiber) {
		fiber.interruptible = this[args];
		if (fiber._interruptedCause && fiber.interruptible) return () => failCause$3(fiber._interruptedCause);
	}
});
var setInterruptibleTrue = /*#__PURE__*/ setInterruptible(true);
var setInterruptibleFalse = /*#__PURE__*/ setInterruptible(false);
var setFiberInterruptible = (fiber) => {
	fiber.interruptible = true;
	fiber._stack.push(setInterruptibleFalse);
	if (fiber._interruptedCause) return failCause$3(fiber._interruptedCause);
};
/** @internal */
var interruptible$1 = (self) => withFiber$1((fiber) => {
	if (fiber.interruptible) return self;
	return setFiberInterruptible(fiber) ?? self;
});
/** @internal */
var uninterruptibleMask$1 = (f) => withFiber$1((fiber) => {
	if (!fiber.interruptible) return f(identity);
	fiber.interruptible = false;
	fiber._stack.push(setInterruptibleTrue);
	return f(interruptible$1);
});
/** @internal */
var interruptibleMask$1 = (f) => withFiber$1((fiber) => {
	if (fiber.interruptible) return f(identity);
	const interrupted = setFiberInterruptible(fiber);
	const effect = f(uninterruptible$1);
	return interrupted ?? effect;
});
/** @internal */
var abortSignal$1 = /*#__PURE__*/ map$3(/*#__PURE__*/ acquireRelease$1(/*#__PURE__*/ sync$1(() => new AbortController()), (controller) => sync$1(() => controller.abort())), (_) => _.signal);
/** @internal */
var all$1 = (arg, options) => {
	if (isIterable(arg)) return options?.mode === "result" ? forEach$1(arg, result$1, options) : forEach$1(arg, identity, options);
	else if (options?.discard) return options.mode === "result" ? forEach$1(Object.values(arg), result$1, options) : forEach$1(Object.values(arg), identity, options);
	return suspend$2(() => {
		const out = {};
		return as$1(forEach$1(Object.entries(arg), ([key, effect]) => map$3(options?.mode === "result" ? result$1(effect) : effect, (value) => {
			assignProperty$1(out, key, value);
		}), {
			discard: true,
			concurrency: options?.concurrency
		}), out);
	});
};
/** @internal */
var partition$1 = /*#__PURE__*/ dual((args) => isIterable(args[0]) && !isEffect$1(args[0]), (elements, f, options) => map$3(forEach$1(elements, (a, i) => result$1(f(a, i)), options), (results) => partition$2(results, identity)));
/** @internal */
var reduce$1 = /*#__PURE__*/ dual(3, (elements, zero, f) => {
	const arr = fromIterable(elements);
	if (arr.length === 0) return sync$1(zero);
	return suspend$2(() => {
		let index = 0;
		let state = zero();
		return map$3(whileLoop$1({
			while: () => index < arr.length,
			body: () => f(state, arr[index], index),
			step(next) {
				state = next;
				index++;
			}
		}), () => state);
	});
});
/** @internal */
var validate$1 = /*#__PURE__*/ dual((args) => isIterable(args[0]) && !isEffect$1(args[0]), (elements, f, options) => flatMap$2(partition$1(elements, f, { concurrency: options?.concurrency }), ([excluded, satisfying]) => {
	if (isArrayNonEmpty(excluded)) return fail$4(excluded);
	return options?.discard ? void_$2 : succeed$4(satisfying);
}));
/** @internal */
var findFirst$1 = /*#__PURE__*/ dual((args) => isIterable(args[0]) && !isEffect$1(args[0]), (elements, predicate) => suspend$2(() => {
	const iterator = elements[Symbol.iterator]();
	const next = iterator.next();
	if (!next.done) return findFirstLoop(iterator, 0, predicate, next.value);
	return succeed$4(none());
}));
var findFirstLoop = (iterator, index, predicate, value) => flatMap$2(predicate(value, index), (keep) => {
	if (keep) return succeed$4(some(value));
	const next = iterator.next();
	if (!next.done) return findFirstLoop(iterator, index + 1, predicate, next.value);
	return succeed$4(none());
});
/** @internal */
var findFirstFilter$1 = /*#__PURE__*/ dual((args) => isIterable(args[0]) && !isEffect$1(args[0]), (elements, filter) => suspend$2(() => {
	const iterator = elements[Symbol.iterator]();
	const next = iterator.next();
	if (!next.done) return findFirstFilterLoop(iterator, 0, filter, next.value);
	return succeed$4(none());
}));
var findFirstFilterLoop = (iterator, index, filter, value) => flatMap$2(filter(value, index), (result) => {
	if (isSuccess$3(result)) return succeed$4(some(result.success));
	const next = iterator.next();
	if (!next.done) return findFirstFilterLoop(iterator, index + 1, filter, next.value);
	return succeed$4(none());
});
/** @internal */
var whileLoop$1 = /*#__PURE__*/ makePrimitive({
	op: "While",
	[contA](value, fiber) {
		this[args].step(value);
		if (this[args].while()) {
			fiber._stack.push(this);
			return this[args].body();
		}
		return exitVoid;
	},
	[evaluate](fiber) {
		if (this[args].while()) {
			fiber._stack.push(this);
			return this[args].body();
		}
		return exitVoid;
	}
});
/** @internal */
var forEach$1 = /*#__PURE__*/ dual((args) => typeof args[1] === "function", (iterable, f, options) => suspend$2(() => {
	const concurrencyOption = options?.concurrency ?? 1;
	const concurrency = concurrencyOption === "unbounded" ? Number.POSITIVE_INFINITY : Math.max(1, concurrencyOption);
	if (concurrency === 1) return forEachSequential(iterable, f, options);
	const items = fromIterable(iterable);
	let length = items.length;
	if (length === 0) return options?.discard ? void_$2 : succeed$4([]);
	const out = options?.discard ? void 0 : new Array(length);
	const eff = forEachConcurrent({
		f,
		out
	}, items, { concurrency });
	return eff ? as$1(eff, out) : succeed$4(out);
}));
/** @internal */
var head$1 = (self) => flatMap$2(self, (elements) => {
	const result = elements[Symbol.iterator]().next();
	return result.done ? fail$4(new NoSuchElementError$1()) : succeed$4(result.value);
});
var forEachSequential = (iterable, f, options) => suspend$2(() => {
	const out = options?.discard ? void 0 : [];
	const iterator = iterable[Symbol.iterator]();
	let state = iterator.next();
	let index = 0;
	return as$1(whileLoop$1({
		while: () => !state.done,
		body: () => f(state.value, index++),
		step: (b) => {
			if (out) out.push(b);
			state = iterator.next();
		}
	}), out);
});
var iterateEagerImpl = (options) => {
	const onItem = options.onItem;
	const step = options.step;
	const runSequential = (state, items, index, end) => {
		for (; index < end; index++) {
			const item = items[index];
			const effect = onItem(state, item, index);
			if (!effectIsExit(effect)) return flatMap$2(exit$1(effect), (itemExit) => step(state, item, itemExit, index) ?? runSequential(state, items, index + 1, end) ?? void_$2);
			const terminal = step(state, item, effect, index);
			if (terminal) return terminal._tag === "Failure" ? terminal : void 0;
		}
	};
	return (state, items, opts) => {
		let index = 0;
		const end = opts?.end ?? items.length;
		const concurrency = opts?.concurrency ?? 1;
		if (concurrency === 1) return runSequential(state, items, 0, end);
		const orderedStep = opts?.orderedStep === true;
		let done = false;
		let parentFiber;
		let fibers;
		let resume;
		let interrupted = false;
		let terminal;
		let effect;
		let nextIndex = index;
		const exits = orderedStep ? new Array(end) : void 0;
		const failDefect = (error) => {
			const defect = exitDie(error);
			terminal = defect;
			done = true;
			interrupted = true;
			return fibers && fibers.size > 0 ? flatMap$2(uninterruptible$1(fiberInterruptAll(Array.from(fibers))), () => defect) : defect;
		};
		const runStep = (item, exit, currentIndex) => {
			if (!orderedStep) return step(state, item, exit, currentIndex);
			if (terminal) return terminal;
			exits[currentIndex] = exit;
			while (nextIndex < end) {
				const nextExit = exits[nextIndex];
				if (nextExit === void 0) return;
				exits[nextIndex] = void 0;
				const index = nextIndex++;
				const result = step(state, items[index], nextExit, index);
				if (result) return result;
			}
		};
		const go = () => {
			let paused = false;
			for (; !terminal && index < end; index++) {
				const item = items[index];
				const eff = effect ?? onItem(state, item, index);
				if (effectIsExit(eff)) {
					terminal = runStep(item, eff, index);
					if (terminal) break;
				} else if (!parentFiber) return callback$1((cb) => {
					parentFiber = getCurrentFiber();
					fibers = /* @__PURE__ */ new Set();
					effect = eff;
					resume = cb;
					let result;
					try {
						result = go();
					} catch (error) {
						return cb(failDefect(error));
					}
					if (result) return cb(result);
					return suspend$2(() => {
						terminal = exitVoid;
						interrupted = true;
						return fibers ? fiberInterruptAll(fibers) : void_$2;
					});
				});
				else {
					effect = void 0;
					const fiber = forkUnsafe$1(parentFiber, eff, true, true, "inherit");
					if (fiber._exit) {
						terminal = runStep(item, fiber._exit, index);
						if (terminal) break;
						continue;
					}
					fibers.add(fiber);
					const currentIndex = index;
					fiber.addObserver((exit) => {
						fibers.delete(fiber);
						try {
							if (terminal) {
								if (!interrupted && exit._tag === "Failure") for (const reason of exit.cause.reasons) if (reason._tag === "Interrupt") continue;
								else if (terminal._tag === "Failure") terminal.cause.reasons.push(reason);
								else terminal = exitFailCause(causeFromReasons([reason]));
							} else {
								const result = runStep(item, exit, currentIndex);
								if (result) {
									terminal = result._tag === "Failure" ? exitFailCause(causeFromReasons(result.cause.reasons.slice())) : result;
									go();
								}
							}
							if (paused) {
								const eff = go();
								if (eff) resume(eff);
							} else if (done && fibers.size === 0) resume(terminal ?? void_$2);
						} catch (error) {
							resume(failDefect(error));
						}
					});
					if (fibers.size < concurrency) continue;
					paused = true;
					index++;
					return;
				}
			}
			done = true;
			if (terminal) {
				if (fibers && fibers.size > 0) {
					const annotations = fiberStackAnnotations(parentFiber);
					fibers.forEach((f) => f.interruptUnsafe(parentFiber.id, annotations));
					return;
				}
				if (resume || terminal._tag === "Failure") return terminal;
			} else if (resume) {
				if (!fibers) return exitVoid;
				else if (fibers.size === 0) resume(void_$2);
			}
		};
		return go();
	};
};
/** @internal */
var iterateEager = () => iterateEagerImpl;
var forEachConcurrent = /*#__PURE__*/ iterateEagerImpl({
	onItem(state, item, index) {
		return state.f(item, index);
	},
	step(state, _, exit, index) {
		if (exit._tag === "Failure") return exit;
		else if (state.out) state.out[index] = exit.value;
	}
});
var filterOrElse$1 = /*#__PURE__*/ dual(3, (self, predicate, orElse) => flatMap$2(self, (a) => predicate(a) ? succeed$4(a) : orElse(a)));
/** @internal */
var filterMapOrElse$1 = /*#__PURE__*/ dual(3, (self, filter, orElse) => flatMap$2(self, (a) => {
	const result = filter(a);
	return isFailure$3(result) ? orElse(result.failure) : succeed$4(result.success);
}));
var filterMapOrFail$1 = /*#__PURE__*/ dual((args) => isEffect$1(args[0]), (self, filter, orFailWith) => filterMapOrElse$1(self, filter, orFailWith ? (x) => fail$4(orFailWith(x)) : () => fail$4(new NoSuchElementError$1())));
/** @internal */
var filter$1 = /*#__PURE__*/ dual((args) => isIterable(args[0]) && !isEffect$1(args[0]), (elements, predicate, options) => suspend$2(() => {
	const out = [];
	return as$1(forEach$1(elements, (a, i) => {
		const result = predicate(a, i);
		if (typeof result === "boolean") {
			if (result) out.push(a);
			return void_$2;
		}
		return map$3(result, (keep) => {
			if (keep) out.push(a);
		});
	}, {
		discard: true,
		concurrency: options?.concurrency
	}), out);
}));
/** @internal */
var filterMap$1 = /*#__PURE__*/ dual((args) => isIterable(args[0]) && !isEffect$1(args[0]), (elements, filter) => suspend$2(() => {
	const out = [];
	for (const a of elements) {
		const result = filter(a);
		if (isSuccess$3(result)) out.push(result.success);
	}
	return succeed$4(out);
}));
/** @internal */
var filterMapEffect$1 = /*#__PURE__*/ dual((args) => isIterable(args[0]) && !isEffect$1(args[0]), (elements, filter, options) => suspend$2(() => {
	const out = [];
	return as$1(forEach$1(elements, (a) => map$3(filter(a), (result) => {
		if (isSuccess$3(result)) out.push(result.success);
	}), {
		discard: true,
		concurrency: options?.concurrency
	}), out);
}));
/** @internal */
var Do$1 = /*#__PURE__*/ succeed$4({});
/** @internal */
var bindTo$1 = /*#__PURE__*/ bindTo$2(map$3);
/** @internal */
var bind$1 = /*#__PURE__*/ bind$2(map$3, flatMap$2);
/** @internal */
var let_$1 = /*#__PURE__*/ let_$2(map$3);
/** @internal */
var forkChild$1 = /*#__PURE__*/ dual((args) => isEffect$1(args[0]), (self, options) => withFiber$1((fiber) => {
	interruptChildrenPatch();
	return succeed$4(forkUnsafe$1(fiber, self, options?.startImmediately, false, options?.uninterruptible ?? false));
}));
/** @internal */
var forkUnsafe$1 = (parent, effect, immediate = false, daemon = false, uninterruptible = false) => {
	const parentRuntime = parent;
	const interruptible = uninterruptible === "inherit" ? parentRuntime.interruptible : !uninterruptible;
	const child = new FiberImpl(parentRuntime.context, interruptible);
	if (immediate) child.evaluate(effect);
	else parentRuntime.currentDispatcher.scheduleTask(() => child.evaluate(effect), 0);
	if (!daemon && !child._exit) {
		parentRuntime.children().add(child);
		child.addObserver(() => parentRuntime._children.delete(child));
	}
	return child;
};
/** @internal */
var forkDetach$1 = /*#__PURE__*/ dual((args) => isEffect$1(args[0]), (self, options) => withFiber$1((fiber) => succeed$4(forkUnsafe$1(fiber, self, options?.startImmediately, true, options?.uninterruptible))));
/** @internal */
var awaitAllChildren$1 = (self) => withFiber$1((fiber) => {
	const initialChildren = fiber._children && new Set(fiber._children);
	return onExit$1(self, (_) => {
		let children = fiber._children;
		if (children === void 0 || children.size === 0) return void_$2;
		else if (initialChildren) children = filter$3(children, (child) => !initialChildren.has(child));
		return asVoid$1(fiberAwaitAll(children));
	});
});
/** @internal */
var forkIn$1 = /*#__PURE__*/ dual((args) => isEffect$1(args[0]), (self, scope, options) => withFiber$1((parent) => {
	const fiber = forkUnsafe$1(parent, self, options?.startImmediately, true, options?.uninterruptible);
	if (!fiber._exit) {
		if (scope.state._tag !== "Closed") {
			const key = {};
			const finalizer = () => withFiberId((interruptor) => interruptor === fiber.id ? void_$2 : fiberInterrupt(fiber));
			scopeAddFinalizerUnsafe(scope, key, finalizer);
			fiber.addObserver(() => scopeRemoveFinalizerUnsafe(scope, key));
		} else fiber.interruptUnsafe(parent.id, fiberStackAnnotations(parent));
	}
	return succeed$4(fiber);
}));
/** @internal */
var forkScoped$1 = /*#__PURE__*/ dual((args) => isEffect$1(args[0]), (self, options) => flatMap$2(scope$1, (scope) => forkIn$1(self, scope, options)));
/** @internal */
var runForkWith$1 = (context) => (effect, options) => {
	const fiber = new FiberImpl(options?.scheduler ? add(context, Scheduler, options.scheduler) : context, options?.uninterruptible !== true);
	fiber.evaluate(effect);
	if (fiber._exit) return fiber;
	if (options?.signal) {
		if (options.signal.aborted) fiber.interruptUnsafe();
		else {
			const abort = () => fiber.interruptUnsafe();
			options.signal.addEventListener("abort", abort, { once: true });
			fiber.addObserver(() => options.signal.removeEventListener("abort", abort));
		}
	}
	if (options?.onFiberStart) options.onFiberStart(fiber);
	return fiber;
};
/** @internal */
var fiberRunIn = /*#__PURE__*/ dual(2, (self, scope) => {
	if (self._exit) return self;
	else if (scope.state._tag === "Closed") {
		self.interruptUnsafe(self.id);
		return self;
	}
	const key = {};
	scopeAddFinalizerUnsafe(scope, key, () => fiberInterrupt(self));
	self.addObserver(() => scopeRemoveFinalizerUnsafe(scope, key));
	return self;
});
/** @internal */
var runFork$1 = /*#__PURE__*/ runForkWith$1(/*#__PURE__*/ empty$2());
/** @internal */
var runCallbackWith$1 = (context) => {
	const runFork = runForkWith$1(context);
	return (effect, options) => {
		const fiber = runFork(effect, options);
		if (options?.onExit) fiber.addObserver(options.onExit);
		return (interruptor) => {
			return fiber.interruptUnsafe(interruptor);
		};
	};
};
/** @internal */
var runCallback$1 = /*#__PURE__*/ runCallbackWith$1(/*#__PURE__*/ empty$2());
/** @internal */
var runPromiseExitWith$1 = (context) => {
	const runFork = runForkWith$1(context);
	return (effect, options) => {
		const fiber = runFork(effect, options);
		return new Promise((resolve) => {
			fiber.addObserver((exit) => resolve(exit));
		});
	};
};
/** @internal */
var runPromiseExit$1 = /*#__PURE__*/ runPromiseExitWith$1(/*#__PURE__*/ empty$2());
/** @internal */
var runPromiseWith$1 = (context) => {
	const runPromiseExit = runPromiseExitWith$1(context);
	return (effect, options) => runPromiseExit(effect, options).then((exit) => {
		if (exit._tag === "Failure") throw causeSquash(exit.cause);
		return exit.value;
	});
};
/** @internal */
var runPromise$1 = /*#__PURE__*/ runPromiseWith$1(/*#__PURE__*/ empty$2());
/** @internal */
var runSyncExitWith$1 = (context) => {
	const runFork = runForkWith$1(context);
	return (effect) => {
		if (effectIsExit(effect)) return effect;
		const scheduler = new MixedScheduler("sync");
		const fiber = runFork(effect, { scheduler });
		fiber._dispatcher?.flush();
		return fiber._exit ?? exitDie(new AsyncFiberError(fiber));
	};
};
/** @internal */
var runSyncExit$1 = /*#__PURE__*/ runSyncExitWith$1(/*#__PURE__*/ empty$2());
/** @internal */
var runSyncWith$1 = (context) => {
	const runSyncExit = runSyncExitWith$1(context);
	return (effect) => {
		const exit = runSyncExit(effect);
		if (exit._tag === "Failure") throw causeSquash(exit.cause);
		return exit.value;
	};
};
/** @internal */
var runSync$1 = /*#__PURE__*/ runSyncWith$1(/*#__PURE__*/ empty$2());
var succeedTrue = /*#__PURE__*/ succeed$4(true);
var succeedFalse = /*#__PURE__*/ succeed$4(false);
var Latch = class {
	waiters = [];
	scheduled = void 0;
	_isOpen;
	constructor(isOpen) {
		this._isOpen = isOpen;
	}
	scheduleUnsafe(fiber) {
		if (this.waiters.length === 0) return succeedTrue;
		if (this.scheduled === void 0) {
			this.scheduled = this.waiters;
			fiber.currentDispatcher.scheduleTask(this.flushScheduled, 0);
		} else for (let i = 0; i < this.waiters.length; i++) this.scheduled.push(this.waiters[i]);
		this.waiters = [];
		return succeedTrue;
	}
	flushScheduled = () => {
		if (this.scheduled === void 0) return;
		const waiters = this.scheduled;
		this.scheduled = void 0;
		for (let i = 0; i < waiters.length; i++) waiters[i](exitVoid);
	};
	flushWaiters() {
		const waiters = this.waiters;
		this.waiters = [];
		this.flushScheduled();
		for (let i = 0; i < waiters.length; i++) waiters[i](exitVoid);
	}
	open = /*#__PURE__*/ withFiber$1((fiber) => {
		if (this._isOpen) return succeedFalse;
		this._isOpen = true;
		return this.scheduleUnsafe(fiber);
	});
	release = /*#__PURE__*/ withFiber$1((fiber) => this._isOpen ? succeedFalse : this.scheduleUnsafe(fiber));
	openUnsafe() {
		if (this._isOpen) return false;
		this._isOpen = true;
		this.flushWaiters();
		return true;
	}
	await = /*#__PURE__*/ callback$1((resume) => {
		if (this._isOpen) return resume(void_$2);
		this.waiters.push(resume);
		return sync$1(() => {
			let index = this.waiters.indexOf(resume);
			if (index !== -1) this.waiters.splice(index, 1);
			else if (this.scheduled !== void 0) {
				index = this.scheduled.indexOf(resume);
				if (index !== -1) this.scheduled.splice(index, 1);
			}
		});
	});
	closeUnsafe() {
		if (!this._isOpen) return false;
		this._isOpen = false;
		return true;
	}
	close = /*#__PURE__*/ sync$1(() => this.closeUnsafe());
	whenOpen = (self) => flatMap$2(this.await, () => self);
	isOpen() {
		return this._isOpen;
	}
};
/** @internal */
var makeLatchUnsafe = (open) => new Latch(open ?? false);
/** @internal */
var makeLatch = (open) => sync$1(() => makeLatchUnsafe(open));
/** @internal */
var tracer$1 = /*#__PURE__*/ withFiber$1((fiber) => succeed$4(fiber.getRef(Tracer)));
/** @internal */
var withTracer$1 = /*#__PURE__*/ dual(2, (effect, tracer) => provideService$1(effect, Tracer, tracer));
/** @internal */
var withTracerEnabled$1 = /*#__PURE__*/ provideService$1(TracerEnabled);
/** @internal */
var withTracerTiming$1 = /*#__PURE__*/ provideService$1(TracerTimingEnabled$1);
var bigint0 = /*#__PURE__*/ BigInt(0);
var NoopSpanProto = {
	_tag: "Span",
	spanId: "noop",
	traceId: "noop",
	sampled: false,
	status: {
		_tag: "Ended",
		startTime: bigint0,
		endTime: bigint0,
		exit: exitVoid
	},
	attributes: /*#__PURE__*/ new Map(),
	links: [],
	kind: "internal",
	attribute() {},
	event() {},
	end() {},
	addLinks() {}
};
/** @internal */
var noopSpan = (options) => Object.assign(Object.create(NoopSpanProto), options);
var filterDisablePropagation = (span) => {
	if (!span) return none();
	return get(span.annotations, DisablePropagation) ? span._tag === "Span" ? filterDisablePropagation(getOrUndefined$1(span.parent)) : none() : some(span);
};
/** @internal */
var makeSpanUnsafe = (fiber, name, options) => {
	const disablePropagation = !fiber.getRef(TracerEnabled) || options?.annotations && get(options.annotations, DisablePropagation);
	const parent = options?.parent !== void 0 ? some(options.parent) : options?.root ? none() : filterDisablePropagation(fiber.currentSpan);
	let span;
	if (disablePropagation) span = noopSpan({
		name,
		parent,
		annotations: add(options?.annotations ?? empty$2(), DisablePropagation, true)
	});
	else {
		const tracer = fiber.getRef(Tracer);
		const clock = fiber.getRef(ClockRef);
		const timingEnabled = fiber.getRef(TracerTimingEnabled$1);
		const annotationsFromEnv = fiber.getRef(TracerSpanAnnotations);
		const linksFromEnv = fiber.getRef(TracerSpanLinks);
		const level = options?.level ?? fiber.getRef(CurrentTraceLevel);
		const links = options?.links !== void 0 ? [...linksFromEnv, ...options.links] : linksFromEnv.length === 0 ? [] : linksFromEnv.slice();
		span = tracer.span({
			name,
			parent,
			annotations: options?.annotations ?? empty$2(),
			links,
			startTime: timingEnabled ? clock.currentTimeNanosUnsafe() : BigInt(0),
			kind: options?.kind ?? "internal",
			root: options?.root ?? isNone(parent),
			sampled: options?.sampled ?? (isSome(parent) && parent.value.sampled === false ? false : !isLogLevelGreaterThan(fiber.getRef(MinimumTraceLevel), level))
		});
		for (const key in annotationsFromEnv) span.attribute(key, annotationsFromEnv[key]);
		if (options?.attributes !== void 0) for (const key in options.attributes) span.attribute(key, options.attributes[key]);
	}
	return span;
};
/** @internal */
var makeSpan$1 = (name, options) => withFiber$1((fiber) => succeed$4(makeSpanUnsafe(fiber, name, options)));
/** @internal */
var makeSpanScoped$1 = (name, options) => uninterruptible$1(withFiber$1((fiber) => {
	const scope = getUnsafe(fiber.context, scopeTag);
	const span = makeSpanUnsafe(fiber, name, options ?? {});
	const clock = fiber.getRef(ClockRef);
	const timingEnabled = fiber.getRef(TracerTimingEnabled$1);
	return as$1(scopeAddFinalizerExit(scope, (exit) => endSpan(span, exit, clock, timingEnabled)), span);
}));
/** @internal */
var withSpanScoped$1 = function() {
	const dataFirst = typeof arguments[0] !== "string";
	const name = dataFirst ? arguments[1] : arguments[0];
	const options = addSpanStackTrace(dataFirst ? arguments[2] : arguments[1]);
	if (dataFirst) {
		const self = arguments[0];
		return flatMap$2(makeSpanScoped$1(name, options), (span) => withParentSpan$1(self, span, options));
	}
	return (self) => flatMap$2(makeSpanScoped$1(name, options), (span) => withParentSpan$1(self, span, options));
};
var provideSpanStackFrame = (name, stack) => {
	stack = typeof stack === "function" ? stack : constUndefined;
	return updateService$1(CurrentStackFrame, (parent) => ({
		name,
		stack,
		parent
	}));
};
/** @internal */
var spanAnnotations$1 = TracerSpanAnnotations;
/** @internal */
var spanLinks$1 = TracerSpanLinks;
/** @internal */
var linkSpans$1 = /*#__PURE__*/ dual((args) => isEffect$1(args[0]), (self, span, attributes = {}) => {
	const links = (Array.isArray(span) ? span : [span]).map((span) => ({
		span,
		attributes
	}));
	return updateService$1(self, TracerSpanLinks, (current) => [...current, ...links]);
});
/** @internal */
var endSpan = (span, exit, clock, timingEnabled) => sync$1(() => {
	if (span.status._tag === "Ended") return;
	span.end(timingEnabled ? clock.currentTimeNanosUnsafe() : bigint0, exit);
});
/** @internal */
var useSpan$1 = (name, ...args) => {
	const options = args.length === 1 ? void 0 : args[0];
	const evaluate = args[args.length - 1];
	return withFiber$1((fiber) => {
		const span = makeSpanUnsafe(fiber, name, options);
		const clock = fiber.getRef(ClockRef);
		const timingEnabled = fiber.getRef(TracerTimingEnabled$1);
		return onExit$1(internalCall(() => evaluate(span)), (exit) => endSpan(span, exit, clock, timingEnabled));
	});
};
var provideParentSpan = /*#__PURE__*/ provideService$1(ParentSpan);
/** @internal */
var withParentSpan$1 = function() {
	const dataFirst = isEffect$1(arguments[0]);
	const span = dataFirst ? arguments[1] : arguments[0];
	let options = dataFirst ? arguments[2] : arguments[1];
	let provideStackFrame = identity;
	if (span._tag === "Span") {
		options = addSpanStackTrace(options);
		provideStackFrame = provideSpanStackFrame(span.name, options?.captureStackTrace);
	}
	if (dataFirst) return provideParentSpan(provideStackFrame(arguments[0]), span);
	return (self) => provideParentSpan(provideStackFrame(self), span);
};
/** @internal */
var withSpan$1 = function() {
	const dataFirst = typeof arguments[0] !== "string";
	const name = dataFirst ? arguments[1] : arguments[0];
	const traceOptions = addSpanStackTrace(arguments[2]);
	if (dataFirst) {
		const self = arguments[0];
		return useSpan$1(name, arguments[2], (span) => withParentSpan$1(self, span, traceOptions));
	}
	const fnArg = typeof arguments[1] === "function" ? arguments[1] : void 0;
	const options = fnArg ? void 0 : arguments[1];
	return (self, ...args) => useSpan$1(name, fnArg ? fnArg(...args) : options, (span) => withParentSpan$1(self, span, traceOptions));
};
/** @internal */
var annotateSpans$1 = /*#__PURE__*/ dual((args) => isEffect$1(args[0]), (effect, ...args) => updateService$1(effect, TracerSpanAnnotations, (annotations) => {
	const newAnnotations = args.length === 1 ? {
		...annotations,
		...args[0]
	} : { ...annotations };
	if (args.length === 1) return newAnnotations;
	else assignProperty$1(newAnnotations, args[0], args[1]);
	return newAnnotations;
}));
/** @internal */
var annotateCurrentSpan$1 = (...args) => withFiber$1((fiber) => {
	const span = fiber.currentSpanLocal;
	if (span) {
		if (args.length === 1) for (const [key, value] of Object.entries(args[0])) span.attribute(key, value);
		else span.attribute(args[0], args[1]);
	}
	return void_$2;
});
/** @internal */
var currentSpan$1 = /*#__PURE__*/ withFiber$1((fiber) => {
	const span = fiber.currentSpanLocal;
	return span ? succeed$4(span) : fail$4(new NoSuchElementError$1());
});
/** @internal */
var currentParentSpan$1 = /*#__PURE__*/ serviceOptional(ParentSpan);
/** @internal */
var ClockRef = /*#__PURE__*/ Reference("effect/Clock", { defaultValue: () => new ClockImpl() });
var MAX_TIMER_MILLIS = 2 ** 31 - 1;
var ClockImpl = class {
	currentTimeMillisUnsafe() {
		return Date.now();
	}
	currentTimeMillis = /*#__PURE__*/ sync$1(() => this.currentTimeMillisUnsafe());
	currentTimeNanosUnsafe() {
		return wallTimeNanos();
	}
	currentTimeNanos = /*#__PURE__*/ sync$1(() => this.currentTimeNanosUnsafe());
	monotonicTimeNanosUnsafe() {
		return monotonicNowNanos();
	}
	monotonicTimeNanos = /*#__PURE__*/ sync$1(() => this.monotonicTimeNanosUnsafe());
	sleep(duration) {
		return this.sleepMillis(toMillis(duration));
	}
	sleepMillis(millis) {
		if (millis <= 0) return yieldNow$1;
		else if (!Number.isFinite(millis)) return never$1;
		return callback$1((resume) => {
			const continuation = millis > MAX_TIMER_MILLIS ? this.sleepMillis(millis - MAX_TIMER_MILLIS) : void_$2;
			const handle = setTimeout(() => resume(continuation), Math.min(millis, MAX_TIMER_MILLIS));
			return sync$1(() => clearTimeout(handle));
		});
	}
};
var nanosPerMilli = /*#__PURE__*/ BigInt(1e6);
var monotonicNowNanos = /*#__PURE__*/ function() {
	const processHrtime = globalThis.process?.hrtime;
	if (typeof processHrtime?.bigint === "function") return () => processHrtime.bigint();
	if (typeof performance !== "undefined" && typeof performance.now === "function") return () => BigInt(Math.round(performance.now() * 1e6));
	let previous = /*#__PURE__*/ BigInt(0);
	return () => {
		const current = BigInt(Date.now()) * nanosPerMilli;
		if (current > previous) previous = current;
		return previous;
	};
}();
var wallTimeNanos = /*#__PURE__*/ function() {
	const reanchorThresholdNanos = /*#__PURE__*/ BigInt(1e9);
	let origin;
	return () => {
		const monotonic = monotonicNowNanos();
		const wall = BigInt(Date.now()) * nanosPerMilli;
		if (origin === void 0) origin = wall - monotonic;
		else {
			const projected = origin + monotonic;
			if ((wall > projected ? wall - projected : projected - wall) > reanchorThresholdNanos) origin = wall - monotonic;
		}
		return origin + monotonic;
	};
}();
/** @internal */
var clockWith$1 = (f) => withFiber$1((fiber) => f(fiber.getRef(ClockRef)));
/** @internal */
var sleep$1 = (duration) => clockWith$1((clock) => clock.sleep(fromInputUnsafe(duration)));
/** @internal */
var currentTimeMillis = /*#__PURE__*/ clockWith$1((clock) => clock.currentTimeMillis);
/** @internal */
var TimeoutErrorTypeId = "~effect/Cause/TimeoutError";
/** @internal */
var TimeoutError$1 = class extends (/*#__PURE__*/ TaggedError$1("TimeoutError")) {
	[TimeoutErrorTypeId] = TimeoutErrorTypeId;
	constructor(message) {
		super({ message });
	}
};
/** @internal */
var IllegalArgumentErrorTypeId = "~effect/Cause/IllegalArgumentError";
/** @internal */
var IllegalArgumentError$1 = class extends (/*#__PURE__*/ TaggedError$1("IllegalArgumentError")) {
	[IllegalArgumentErrorTypeId] = IllegalArgumentErrorTypeId;
	constructor(message) {
		super({ message });
	}
};
/** @internal */
var ExceededCapacityErrorTypeId = "~effect/Cause/ExceededCapacityError";
/** @internal */
var ExceededCapacityError$1 = class extends (/*#__PURE__*/ TaggedError$1("ExceededCapacityError")) {
	[ExceededCapacityErrorTypeId] = ExceededCapacityErrorTypeId;
	constructor(message) {
		super({ message });
	}
};
/** @internal */
var AsyncFiberErrorTypeId = "~effect/Cause/AsyncFiberError";
/** @internal */
var isAsyncFiberError$1 = (u) => hasProperty(u, AsyncFiberErrorTypeId);
/** @internal */
var AsyncFiberError = class extends (/*#__PURE__*/ TaggedError$1("AsyncFiberError")) {
	[AsyncFiberErrorTypeId] = AsyncFiberErrorTypeId;
	constructor(fiber) {
		super({
			message: "An asynchronous Effect was executed with Effect.runSync",
			fiber
		});
	}
};
/** @internal */
var UnknownErrorTypeId = "~effect/Cause/UnknownError";
/** @internal */
var UnknownError$1 = class extends (/*#__PURE__*/ TaggedError$1("UnknownError")) {
	[UnknownErrorTypeId] = UnknownErrorTypeId;
	constructor(cause, message) {
		super({
			message,
			cause
		});
	}
};
/** @internal */
var ConsoleRef = /*#__PURE__*/ Reference("effect/Console/CurrentConsole", { defaultValue: () => globalThis.console });
/** @internal */
var logLevelToOrder = (level) => {
	switch (level) {
		case "All": return Number.MIN_SAFE_INTEGER;
		case "Fatal": return 5e4;
		case "Error": return 4e4;
		case "Warn": return 3e4;
		case "Info": return 2e4;
		case "Debug": return 1e4;
		case "Trace": return 0;
		case "None": return Number.MAX_SAFE_INTEGER;
	}
};
/** @internal */
var isLogLevelGreaterThan = /*#__PURE__*/ isGreaterThan(/* @__PURE__ */ mapInput(Number$2, logLevelToOrder));
/** @internal */
var CurrentLoggers = /*#__PURE__*/ Reference("effect/Loggers/CurrentLoggers", { defaultValue: () => /* @__PURE__ */ new Set([defaultLogger, tracerLogger]) });
/** @internal */
var LogToStderr = /*#__PURE__*/ Reference("effect/Logger/LogToStderr", { defaultValue: constFalse });
/** @internal */
var annotateLogsScoped$1 = function() {
	const entries = typeof arguments[0] === "string" ? [[arguments[0], arguments[1]]] : Object.entries(arguments[0]);
	return uninterruptible$1(withFiber$1((fiber) => {
		const prev = fiber.getRef(CurrentLogAnnotations$1);
		const next = { ...prev };
		for (let i = 0; i < entries.length; i++) {
			const [key, value] = entries[i];
			assignProperty$1(next, key, value);
		}
		fiber.setContext(add(fiber.context, CurrentLogAnnotations$1, next));
		return scopeAddFinalizerExit(getUnsafe(fiber.context, scopeTag), (_) => {
			const current = fiber.getRef(CurrentLogAnnotations$1);
			const next = { ...current };
			for (let i = 0; i < entries.length; i++) {
				const [key, value] = entries[i];
				if (current[key] !== value) continue;
				if (Object.hasOwn(prev, key)) assignProperty$1(next, key, prev[key]);
				else delete next[key];
			}
			fiber.setContext(add(fiber.context, CurrentLogAnnotations$1, next));
			return void_$2;
		});
	}));
};
var LoggerProto = {
	["~effect/Logger"]: {
		_Message: identity,
		_Output: identity
	},
	pipe() {
		return pipeArguments(this, arguments);
	}
};
/** @internal */
var loggerMake = (log) => {
	const self = Object.create(LoggerProto);
	self.log = log;
	return self;
};
/**
* Sanitize a given string by replacing spaces, equal signs, and double quotes
* with underscores.
*
* @internal
*/
var formatLabel = (key) => key.replace(/[\s="]/g, "_");
/**
* Formats a log span into a `<label>=<value>ms` string.
*
* @internal
*/
var formatLogSpan = (self, now) => {
	return `${formatLabel(self[0])}=${now - self[1]}ms`;
};
/** @internal */
var logWithLevel$1 = (level) => (...message) => {
	let cause = void 0;
	for (let i = 0, len = message.length; i < len; i++) {
		const msg = message[i];
		if (isCause$1(msg)) {
			if (cause) message.splice(i, 1);
			else message = message.slice(0, i).concat(message.slice(i + 1));
			cause = cause ? causeFromReasons(cause.reasons.concat(msg.reasons)) : msg;
			i--;
		}
	}
	if (cause === void 0) cause = causeEmpty;
	return withFiber$1((fiber) => {
		const logLevel = level ?? fiber.currentLogLevel;
		if (isLogLevelGreaterThan(fiber.minimumLogLevel, logLevel)) return void_$2;
		const clock = fiber.getRef(ClockRef);
		const loggers = fiber.getRef(CurrentLoggers);
		if (loggers.size > 0) {
			const date = new Date(clock.currentTimeMillisUnsafe());
			for (const logger of loggers) logger.log({
				cause,
				fiber,
				date,
				logLevel,
				message
			});
		}
		return void_$2;
	});
};
var colors = {
	bold: "1",
	red: "31",
	green: "32",
	yellow: "33",
	blue: "34",
	cyan: "36",
	white: "37",
	gray: "90",
	black: "30",
	bgBrightRed: "101"
};
colors.gray, colors.blue, colors.green, colors.yellow, colors.red, colors.bgBrightRed, colors.black;
var defaultDateFormat = (date) => `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}:${date.getSeconds().toString().padStart(2, "0")}.${date.getMilliseconds().toString().padStart(3, "0")}`;
/** @internal */
var defaultLogger = /*#__PURE__*/ loggerMake(({ cause, date, fiber, logLevel, message }) => {
	const message_ = Array.isArray(message) ? message.slice() : [message];
	if (cause.reasons.length > 0) message_.push(causePretty(cause));
	const now = date.getTime();
	const spans = fiber.getRef(CurrentLogSpans$1);
	let spanString = "";
	for (const span of spans) spanString += ` ${formatLogSpan(span, now)}`;
	const annotations = fiber.getRef(CurrentLogAnnotations$1);
	if (Object.keys(annotations).length > 0) message_.push(annotations);
	const console = fiber.getRef(ConsoleRef);
	(fiber.getRef(LogToStderr) ? console.error : console.log)(`[${defaultDateFormat(date)}] ${logLevel.toUpperCase()} (#${fiber.id})${spanString}:`, ...message_);
});
/** @internal */
var tracerLogger = /*#__PURE__*/ loggerMake(({ cause, fiber, logLevel, message }) => {
	const clock = fiber.getRef(ClockRef);
	const annotations = fiber.getRef(CurrentLogAnnotations$1);
	const span = fiber.currentSpan;
	if (span === void 0 || span._tag === "ExternalSpan") return;
	const attributes = {};
	for (const [key, value] of Object.entries(annotations)) assignProperty$1(attributes, key, value);
	attributes["effect.fiberId"] = fiber.id;
	attributes["effect.logLevel"] = logLevel.toUpperCase();
	if (cause.reasons.length > 0) attributes["effect.cause"] = causePretty(cause);
	span.event(toStringUnknown(Array.isArray(message) && message.length === 1 ? message[0] : message), clock.currentTimeNanosUnsafe(), attributes);
});
/** @internal */
function interruptChildrenPatch() {
	fiberMiddleware.interruptChildren ??= fiberInterruptChildren;
}
/** @internal */
var undefined_$1 = /*#__PURE__*/ succeed$4(void 0);
/** @internal */
var withErrorReporting$1 = /*#__PURE__*/ dual((args) => isEffect$1(args[0]), (self, options) => onError$1(self, (cause) => withFiber$1((fiber) => {
	reportCauseUnsafe(fiber, cause, options?.defectsOnly);
	return void_$2;
})));
/** @internal */
var reportCauseUnsafe = (fiber, cause, defectsOnly) => {
	const reporters = fiber.getRef(CurrentErrorReporters);
	if (reporters.size === 0) return;
	if (defectsOnly && !hasDies(cause)) return;
	const opts = {
		cause,
		fiber,
		timestamp: fiber.getRef(ClockRef).currentTimeNanosUnsafe()
	};
	reporters.forEach((reporter) => reporter.report(opts));
};
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0-rc.112/node_modules/effect/dist/Cause.js
/**
* Records the full reason an `Effect` failed.
*
* A `Cause<E>` can contain typed failures, unexpected defects, interruptions,
* and annotations. Keeping those details together lets code inspect or format
* failures without first collapsing them to a single error value. This module
* includes the `Cause` and `Reason` data types, helpers for building and
* checking causes, and small error types used by several Effect APIs.
*
* @since 2.0.0
*/
/**
* Checks whether an arbitrary value is a `Cause`.
*
* **Example** (Checking the runtime type)
*
* ```ts import.meta.vitest
* import { Cause } from "effect"
*
* Cause.isCause(Cause.fail("error")) // => true
* Cause.isCause("not a cause") // => false
* ```
*
* @category guards
* @since 2.0.0
*/
var isCause = isCause$1;
/**
* Checks whether an arbitrary value is a `Reason` (`Fail`, `Die`, or `Interrupt`).
*
* **Example** (Checking the runtime type)
*
* ```ts import.meta.vitest
* import { Cause } from "effect"
*
* const reason = Cause.fail("error").reasons[0]
* Cause.isReason(reason) // => true
* Cause.isReason("not a reason") // => false
* ```
*
* @category guards
* @since 4.0.0
*/
var isReason = isCauseReason;
/**
* Narrows a `Reason` to `Fail`.
*
* **When to use**
*
* Use as a predicate for `Array.filter` to pick out typed `Fail` reasons when
* iterating over `cause.reasons`.
*
* **Example** (Filtering fail reasons)
*
* ```ts import.meta.vitest
* import { Cause } from "effect"
*
* const cause = Cause.fail("error")
* const fails = cause.reasons.filter(Cause.isFailReason)
* fails[0].error // => "error"
* ```
*
* @see {@link isDieReason} — narrow to `Die`
* @see {@link isInterruptReason} — narrow to `Interrupt`
*
* @category guards
* @since 4.0.0
*/
var isFailReason = isFailReason$1;
/**
* Creates a `Cause` from an array of `Reason` values.
*
* **When to use**
*
* Use when you already have individual reasons (e.g. from filtering or
* transforming another cause's `reasons` array) and need to wrap them back
* into a `Cause`.
*
* **Details**
*
* - Returns a new `Cause`.
* - An empty array produces a cause equivalent to `empty`.
*
* **Gotchas**
*
* The `reasons` array is stored as provided. Treat the array as immutable
* after passing it to this function.
*
* **Example** (Building a cause from reasons)
*
* ```ts import.meta.vitest
* import { Cause } from "effect"
*
* const reasons = [
*   Cause.makeFailReason("err1"),
*   Cause.makeFailReason("err2")
* ]
* Cause.fromReasons(reasons) // => Cause.combine(Cause.fail("err1"), Cause.fail("err2"))
* ```
*
* @see {@link combine} — merge two existing causes
*
* @category constructors
* @since 4.0.0
*/
var fromReasons = causeFromReasons;
/**
* Represents a `Cause` with an empty `reasons` array.
*
* **When to use**
*
* Use to represent the absence of failure when constructing or combining
* causes.
*
* **Details**
*
* Represents the absence of failure. Combining any cause with `empty` via
* {@link combine} returns the original cause unchanged.
*
* **Example** (Combining with the empty cause)
*
* ```ts import.meta.vitest
* import { Cause } from "effect"
*
* Cause.combine(Cause.empty, Cause.fail("boom")) // => Cause.fail("boom")
* ```
*
* @see {@link combine} for merging causes where `empty` acts as the identity
*
* @category constructors
* @since 2.0.0
*/
var empty$1 = causeEmpty;
/**
* Creates a `Cause` containing a single `Fail` reason with the
* given typed error.
*
* **When to use**
*
* Use to construct a cause from an expected typed error.
*
* **Example** (Creating a fail cause)
*
* ```ts import.meta.vitest
* import { Cause } from "effect"
*
* Cause.fail("Something went wrong") // => Cause.fromReasons([Cause.makeFailReason("Something went wrong")])
* ```
*
* @see {@link die} — for untyped defects
* @see {@link interrupt} — for fiber interruptions
*
* @category constructors
* @since 2.0.0
*/
var fail$3 = causeFail;
/**
* Creates a `Cause` containing a single `Die` reason with the
* given defect.
*
* **When to use**
*
* Use to construct a cause from an untyped defect or unexpected thrown value.
*
* **Example** (Creating a die cause)
*
* ```ts import.meta.vitest
* import { Cause } from "effect"
*
* Cause.die("Unexpected") // => Cause.fromReasons([Cause.makeDieReason("Unexpected")])
* ```
*
* @see {@link fail} — for typed errors
* @see {@link interrupt} — for fiber interruptions
*
* @category constructors
* @since 2.0.0
*/
var die$2 = causeDie;
/**
* Creates a standalone `Fail` reason (not wrapped in a `Cause`).
*
* **When to use**
*
* Use when constructing a standalone typed failure reason for
* {@link fromReasons} or direct comparison.
*
* **Example** (Creating a Fail reason)
*
* ```ts import.meta.vitest
* import { Cause } from "effect"
*
* Cause.makeFailReason("error") // => Cause.fail("error").reasons[0]
* ```
*
* @see {@link makeDieReason} — create a `Die` reason
* @see {@link makeInterruptReason} — create an `Interrupt` reason
*
* @category constructors
* @since 4.0.0
*/
var makeFailReason = (error) => new Fail(error);
/**
* Creates a standalone `Die` reason (not wrapped in a `Cause`).
*
* **When to use**
*
* Use when constructing a standalone defect reason for {@link fromReasons} or
* direct comparison.
*
* **Example** (Creating a Die reason)
*
* ```ts import.meta.vitest
* import { Cause } from "effect"
*
* Cause.makeDieReason("bug") // => Cause.die("bug").reasons[0]
* ```
*
* @see {@link makeFailReason} — create a `Fail` reason
* @see {@link makeInterruptReason} — create an `Interrupt` reason
*
* @category constructors
* @since 4.0.0
*/
var makeDieReason = (defect) => new Die(defect);
/**
* Creates a standalone `Interrupt` reason (not wrapped in a `Cause`),
* optionally carrying the interrupting fiber's ID.
*
* **When to use**
*
* Use when constructing a standalone interrupt reason for {@link fromReasons}
* or direct comparison.
*
* **Example** (Creating an Interrupt reason)
*
* ```ts import.meta.vitest
* import { Cause } from "effect"
*
* Cause.makeInterruptReason(42) // => Cause.interrupt(42).reasons[0]
* ```
*
* @see {@link makeFailReason} — create a `Fail` reason
* @see {@link makeDieReason} — create a `Die` reason
*
* @category constructors
* @since 4.0.0
*/
var makeInterruptReason = makeInterruptReason$1;
/**
* Returns `true` if every reason in the cause is an `Interrupt` (and
* there is at least one reason).
*
* **When to use**
*
* Use when you need to detect failures caused only by interruption.
*
* **Example** (Checking interrupt-only causes)
*
* ```ts import.meta.vitest
* import { Cause } from "effect"
*
* Cause.hasInterruptsOnly(Cause.interrupt(123)) // => true
* Cause.hasInterruptsOnly(Cause.fail("error")) // => false
* Cause.hasInterruptsOnly(Cause.empty) // => false
* ```
*
* @see {@link hasInterrupts} — `true` if the cause contains *any* interrupts
*
* @category predicates
* @since 4.0.0
*/
var hasInterruptsOnly = hasInterruptsOnly$1;
/**
* Transforms the typed error values inside a `Cause` using the
* provided function. Only `Fail` reasons are affected; `Die` and `Interrupt`
* reasons pass through unchanged.
*
* **When to use**
*
* Use to transform expected typed failures while preserving defects and
* interruptions unchanged.
*
* **Details**
*
* If at least one `Fail` reason exists, this returns a new `Cause`
* containing the mapped failures. If the cause has no `Fail` reasons, the
* original cause is returned unchanged.
*
* **Example** (Mapping errors to uppercase)
*
* ```ts import.meta.vitest
* import { Cause } from "effect"
*
* const cause = Cause.fail("error")
* const mapped = Cause.map(cause, (e) => e.toUpperCase())
* const reason = mapped.reasons[0]
* if (Cause.isFailReason(reason)) {
*   reason.error // => "ERROR"
* }
* ```
*
* @category mapping
* @since 2.0.0
*/
var map$2 = causeMap;
/**
* Collapses a `Cause` into a single `unknown` value, picking the "most
* important" failure in this order:
*
* **When to use**
*
* Use to collapse a structured cause to the single value that synchronous and
* promise runners would throw.
*
* **Details**
*
* 1. First `Fail` error (the `E` value)
* 2. First `Die` defect
* 3. A generic `Error("All fibers interrupted without error")` for interrupt-only causes
* 4. A generic `Error("Empty cause")` for `empty`
*
* This is the function used by `Effect.runPromise` and `Effect.runSync` to
* decide what to throw.
*
* **Gotchas**
*
* This function is lossy. Use {@link prettyErrors} or iterate `cause.reasons`
* when you need all failures.
*
* **Example** (Squashing a cause)
*
* ```ts import.meta.vitest
* import { Cause } from "effect"
*
* Cause.squash(Cause.fail("error")) // => "error"
* Cause.squash(Cause.die("defect")) // => "defect"
* ```
*
* @see {@link prettyErrors} — non-lossy conversion to `Array<Error>`
* @see {@link pretty} — human-readable string rendering
*
* @category destructors
* @since 2.0.0
*/
var squash = causeSquash;
/**
* Returns `true` if the cause contains at least one `Fail` reason.
*
* **When to use**
*
* Use to check whether a cause includes typed failures before extracting,
* mapping, or rendering them.
*
* **Example** (Checking for typed errors)
*
* ```ts import.meta.vitest
* import { Cause } from "effect"
*
* Cause.hasFails(Cause.fail("error")) // => true
* Cause.hasFails(Cause.die("defect")) // => false
* ```
*
* @see {@link hasDies} — check for defects
* @see {@link hasInterrupts} — check for interruptions
*
* @category predicates
* @since 4.0.0
*/
var hasFails = hasFails$1;
/**
* Returns a `Result` whose success value is the first typed error value `E`
* from a `Fail` reason in the cause. If the cause has no `Fail` reason,
* the failure value is the original cause narrowed to `Cause<never>`, because
* it contains no typed error reasons.
*
* **When to use**
*
* Use when you need the first typed error value from a `Cause` as a `Result`
* that preserves the original cause when no match is found.
*
* **Example** (Extracting the first error value)
*
* ```ts import.meta.vitest
* import { Cause, Result } from "effect"
*
* Cause.findError(Cause.fail("error")) // => Result.succeed("error")
* ```
*
* @see {@link findFail} — extract the full `Fail` reason
* @see {@link findErrorOption} — `Option`-based variant
*
* @category filtering
* @since 4.0.0
*/
var findError = findError$1;
/**
* Returns the first typed error value `E` from a cause wrapped in
* `Option.some`, or `Option.none` if no `Fail` reason exists.
*
* **When to use**
*
* Use when you need the first typed error value from a `Cause` as an `Option`,
* discarding the original cause.
*
* **Example** (Extracting an error as Option)
*
* ```ts import.meta.vitest
* import { Cause, Option } from "effect"
*
* Cause.findErrorOption(Cause.fail("error")) // => Option.some("error")
* Cause.findErrorOption(Cause.die("defect")) // => Option.none()
* ```
*
* @see {@link findError} — `Result`-based variant
*
* @category filtering
* @since 4.0.0
*/
var findErrorOption = findErrorOption$1;
/**
* Returns a `Result` whose success value is the first defect value from a
* `Die` reason in the cause. If the cause has no `Die` reason, the
* failure value is the original cause.
*
* **When to use**
*
* Use when you need the first defect value from a `Cause` as a `Result`,
* without the full `Die` reason.
*
* **Example** (Extracting the first defect)
*
* ```ts import.meta.vitest
* import { Cause, Result } from "effect"
*
* Cause.findDefect(Cause.die("defect")) // => Result.succeed("defect")
* ```
*
* @see {@link findDie} — extract the full `Die` reason
* @see {@link findError} — extract the first typed error
*
* @category filtering
* @since 4.0.0
*/
var findDefect = findDefect$1;
/**
* Returns `true` if the cause contains at least one `Interrupt` reason.
*
* **Example** (Checking for interruptions)
*
* ```ts import.meta.vitest
* import { Cause } from "effect"
*
* Cause.hasInterrupts(Cause.interrupt(123)) // => true
* Cause.hasInterrupts(Cause.fail("error")) // => false
* ```
*
* @see {@link hasInterruptsOnly} — `true` only when *all* reasons are interrupts
* @see {@link hasFails} — check for typed errors
* @see {@link hasDies} — check for defects
*
* @category predicates
* @since 4.0.0
*/
var hasInterrupts = hasInterrupts$1;
/**
* Collects the defined fiber IDs from all `Interrupt` reasons in the
* cause into a `ReadonlySet`. Interrupt reasons without a `fiberId` are
* ignored. Returns an empty set when the cause has no interrupting fiber IDs.
*
* **When to use**
*
* Use when you need interrupting fiber IDs as a set, with absence represented
* as an empty set.
*
* **Example** (Collecting interruptors)
*
* ```ts import.meta.vitest
* import { Cause } from "effect"
*
* const cause = Cause.combine(
*   Cause.interrupt(1),
*   Cause.interrupt(2)
* )
*
* Cause.interruptors(cause) // => new Set([1, 2])
* ```
*
* @see {@link filterInterruptors} — `Result`-based variant
*
* @category getters
* @since 2.0.0
*/
var interruptors = causeInterruptors;
/**
* Returns a `Result` whose success value is the set of defined fiber IDs from
* the cause's `Interrupt` reasons. If the cause has no `Interrupt`
* reason, the failure value is the original cause.
*
* **When to use**
*
* Use when you need absence of interrupt reasons to fail with the original
* cause.
*
* **Gotchas**
*
* Interrupt reasons without a `fiberId` still count as interrupts, so the
* function succeeds with an empty `Set` when every interrupt reason has an
* undefined fiber ID.
*
* **Example** (Extracting interruptors with Result)
*
* ```ts import.meta.vitest
* import { Cause, Result } from "effect"
*
* Cause.filterInterruptors(Cause.interrupt(1)) // => Result.succeed(new Set([1]))
* ```
*
* @see {@link interruptors} — always-succeeding variant
*
* @category filtering
* @since 4.0.0
*/
var filterInterruptors = causeFilterInterruptors;
/**
* Converts a `Cause` into an `Array<Error>` suitable for logging or
* rethrowing.
*
* **When to use**
*
* Use to convert every renderable failure in a cause into individual `Error`
* values before logging or rethrowing.
*
* **Details**
*
* Each `Fail` and `Die` reason is converted into a standard
* `Error`:
*
* - **Objects / Error instances** — `message`, `name`, `stack`, and `cause`
*   are preserved. Extra enumerable properties are copied. Stack traces are
*   cleaned up and enriched with span annotations when available.
* - **Strings** — used directly as the `Error` message.
* - **Other primitives** (`null`, `undefined`, numbers, …) — wrapped in an
*   `Error` with message `"Unknown error: <value>"`.
*
* `Interrupt` reasons are collected separately. If the cause contains
* **only** interrupts (no `Fail` or `Die`), a single `InterruptError` is
* returned whose `cause` lists the interrupting fiber IDs.
*
* An empty cause returns an empty array.
*
* **Example** (Converting a cause to errors)
*
* ```ts import.meta.vitest
* import { Cause } from "effect"
*
* Cause.prettyErrors(Cause.fail(new Error("boom")))[0].message // => "boom"
* ```
*
* @see {@link pretty} — renders the cause as a single string
* @see {@link squash} — lossy collapse to a single thrown value
*
* @category formatting
* @since 3.2.0
*/
var prettyErrors = causePrettyErrors;
/**
* Formats a `Cause` as a human-readable string for logging or debugging.
*
* **When to use**
*
* Use to render a whole cause as one human-readable string for logs or
* diagnostics.
*
* **Details**
*
* Delegates to {@link prettyErrors} to convert each reason to an `Error`,
* then joins their stack traces with newlines. Nested `Error.cause` chains
* are rendered inline with indentation:
*
* ```text
* ErrorName: message
*     at ...
*     at ... {
*   [cause]: NestedError: message
*       at ...
* }
* ```
*
* Span annotations are appended to the relevant stack frames when available.
*
* **Gotchas**
*
* Rendering an empty cause produces an empty string because there are no
* errors to render.
*
* **Example** (Rendering a cause)
*
* ```ts import.meta.vitest
* import { Cause } from "effect"
*
* Cause.pretty(Cause.fail("something went wrong")).includes("something went wrong") // => true
* ```
*
* @see {@link prettyErrors} — get the individual `Error` instances
*
* @category formatting
* @since 2.0.0
*/
var pretty = causePretty;
/**
* Constructs a `NoSuchElementError` with an optional message.
*
* **When to use**
*
* Use to create the error value for APIs that intentionally fail when an
* expected element is absent.
*
* **Example** (Creating a NoSuchElementError)
*
* ```ts import.meta.vitest
* import { Cause } from "effect"
*
* new Cause.NoSuchElementError("Element not found").message // => "Element not found"
* ```
*
* @see {@link isNoSuchElementError} for checking unknown values
*
* @category constructors
* @since 4.0.0
*/
var NoSuchElementError = NoSuchElementError$1;
/**
* Checks whether an arbitrary value is a `Done` signal.
*
* **Example** (Checking the runtime type)
*
* ```ts import.meta.vitest
* import { Cause } from "effect"
*
* Cause.isDone(Cause.Done()) // => true
* Cause.isDone("not done") // => false
* ```
*
* @category guards
* @since 4.0.0
*/
var isDone = isDone$1;
/**
* Creates a `Done` signal with an optional value.
*
* **When to use**
*
* Use when you need to construct a low-level pull completion signal directly.
*
* @see {@link done} — create a failing `Effect` with `Done`
*
* @category constructors
* @since 4.0.0
*/
var Done = Done$1;
/**
* Creates an Effect that fails with a `Done` error. Shorthand for
* `Effect.fail(Cause.Done(value))`.
*
* **When to use**
*
* Use when you model stream or queue completion through the error channel.
*
* **Example** (Failing with Done)
*
* ```ts import.meta.vitest
* import { Cause, Effect, Exit } from "effect"
*
* const program = Cause.done("finished")
*
* await Effect.runPromiseExit(program) // => Exit.fail(Cause.Done("finished"))
* ```
*
* @see {@link Done} — create the signal value without an Effect
*
* @category constructors
* @since 4.0.0
*/
var done$1 = done$2;
/**
* Constructs a `TimeoutError` with an optional message.
*
* **Example** (Creating a TimeoutError)
*
* ```ts import.meta.vitest
* import { Cause } from "effect"
*
* new Cause.TimeoutError("Operation timed out").message // => "Operation timed out"
* ```
*
* @category constructors
* @since 4.0.0
*/
var TimeoutError = TimeoutError$1;
/**
* Constructs an `IllegalArgumentError` with an optional message.
*
* **Example** (Creating an IllegalArgumentError)
*
* ```ts import.meta.vitest
* import { Cause } from "effect"
*
* new Cause.IllegalArgumentError("Invalid argument").message // => "Invalid argument"
* ```
*
* @category constructors
* @since 4.0.0
*/
var IllegalArgumentError = IllegalArgumentError$1;
/**
* Constructs an `ExceededCapacityError` with an optional message.
*
* **When to use**
*
* Use to create the error value for bounded-resource capacity failures.
*
* **Example** (Creating an ExceededCapacityError)
*
* ```ts import.meta.vitest
* import { Cause } from "effect"
*
* new Cause.ExceededCapacityError("Queue full").message // => "Queue full"
* ```
*
* @see {@link isExceededCapacityError} for checking unknown values
*
* @category constructors
* @since 4.0.0
*/
var ExceededCapacityError = ExceededCapacityError$1;
/**
* Checks whether an arbitrary value is an `AsyncFiberError`.
*
* **Example** (Checking the runtime type)
*
* ```ts import.meta.vitest
* import { Cause, Effect } from "effect"
*
* const fiber = Effect.runFork(Effect.void)
*
* const error = new Cause.AsyncFiberError(fiber)
* Cause.isAsyncFiberError(error) // => true
* Cause.isAsyncFiberError("nope") // => false
* ```
*
* @category guards
* @since 4.0.0
*/
var isAsyncFiberError = isAsyncFiberError$1;
/**
* Constructs an `UnknownError`. The first argument is the original
* cause (stored in `Error.cause`); the second is an optional human-readable
* message.
*
* **Example** (Creating an UnknownError)
*
* ```ts import.meta.vitest
* import { Cause } from "effect"
*
* new Cause.UnknownError({ raw: true }, "Unexpected value").message // => "Unexpected value"
* ```
*
* @category constructors
* @since 4.0.0
*/
var UnknownError = UnknownError$1;
/**
* Context annotation used to store the stack frame captured at the point of failure.
*
* **When to use**
*
* Use to read the failure stack-frame annotation from a `Reason` when building
* diagnostics, logging, or custom cause renderers.
*
* **Details**
*
* The runtime annotates every reason with this when a stack frame is
* available. Retrieve it via
* `Context.get(Cause.reasonAnnotations(reason), Cause.StackTrace)`.
*
* @see {@link reasonAnnotations} for reading annotations from a single reason
* @see {@link annotations} for reading merged annotations from a cause
* @see {@link InterruptorStackTrace} for the interrupt-specific stack-frame annotation
*
* @category services
* @since 4.0.0
*/
var StackTrace = class extends (/*#__PURE__*/ Service()("effect/Cause/StackTrace")) {};
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0-rc.112/node_modules/effect/dist/Exit.js
/**
* Checks whether an unknown value is an Exit.
*
* **When to use**
*
* Use to validate unknown values at system boundaries and narrow them to
* `Exit<unknown, unknown>`.
*
* **Details**
*
* Does not inspect the contents of the Exit. Returns `true` for both Success
* and Failure exits.
*
* **Example** (Checking if a value is an Exit)
*
* ```ts import.meta.vitest
* import { Exit } from "effect"
*
* Exit.isExit(Exit.succeed(42)) // => true
* Exit.isExit(Exit.fail("err")) // => true
* Exit.isExit("not an exit") // => false
* ```
*
* @see {@link isSuccess} to check for a successful Exit
* @see {@link isFailure} to check for a failed Exit
*
* @category guards
* @since 2.0.0
*/
var isExit = isExit$1;
/**
* Creates a successful Exit containing the given value.
*
* **When to use**
*
* Use when you need an Exit that contains a known success value.
*
* **Details**
*
* Returns a `Success<A>` with the provided value. Does not perform any
* computation.
*
* **Example** (Creating a successful Exit)
*
* ```ts import.meta.vitest
* import { Exit } from "effect"
*
* Exit.succeed(42) // => Exit.succeed(42)
* ```
*
* @see {@link fail} to create a failed Exit
* @see {@link void_ void} for a pre-allocated success with no value
*
* @category constructors
* @since 2.0.0
*/
var succeed$3 = exitSucceed;
/**
* Creates a failed Exit from a Cause.
*
* **When to use**
*
* Use when you already have a `Cause<E>` and want to wrap it in an Exit
* for advanced error handling where you need full control over the Cause
* structure.
*
* **Details**
*
* Returns a `Failure<never, E>`. If you only have an error value, use
* {@link fail} instead.
*
* **Example** (Creating a failed Exit from a Cause)
*
* ```ts import.meta.vitest
* import { Cause, Exit } from "effect"
*
* Exit.failCause(Cause.fail("Something went wrong")) // => Exit.fail("Something went wrong")
* ```
*
* @see {@link fail} to create a Failure from a plain error value
* @see {@link die} to create a Failure from a defect
*
* @category constructors
* @since 2.0.0
*/
var failCause$2 = exitFailCause;
/**
* Creates a failed Exit from a typed error value.
*
* **When to use**
*
* Use when you need to represent an expected typed failure as an `Exit`.
*
* **Details**
*
* The error is wrapped in a `Cause.Fail` internally.
*
* Returns a `Failure<never, E>`.
*
* **Example** (Creating a failed Exit)
*
* ```ts import.meta.vitest
* import { Exit } from "effect"
*
* Exit.fail("Something went wrong") // => Exit.fail("Something went wrong")
* ```
*
* @see {@link succeed} to create a successful Exit
* @see {@link die} to create a Failure from an unexpected defect
* @see {@link failCause} to create a Failure from a full Cause
*
* @category constructors
* @since 2.0.0
*/
var fail$2 = exitFail;
/**
* Creates a failed Exit from a defect (unexpected error).
*
* **When to use**
*
* Use when you need unexpected, unrecoverable errors that should not appear in
* the typed error channel.
*
* **Details**
*
* The defect is wrapped in a `Cause.Die` internally.
*
* Returns a `Failure<never>` with `E = never`, since defects do not appear in
* the typed error channel.
*
* **Example** (Creating a defect Exit)
*
* ```ts import.meta.vitest
* import { Exit } from "effect"
*
* Exit.die("Unexpected error") // => Exit.die("Unexpected error")
* ```
*
* @see {@link fail} to create a Failure from a typed error
* @see {@link hasDies} to check whether an Exit contains defects
*
* @category constructors
* @since 2.0.0
*/
var die$1 = exitDie;
/**
* Creates a failed Exit representing fiber interruption.
*
* **When to use**
*
* Use to signal that a fiber was interrupted.
*
* **Details**
*
* Optionally pass a fiber ID to identify which fiber was interrupted. Returns
* a `Failure<never>` with an `Interrupt` cause.
*
* **Example** (Creating an interruption Exit)
*
* ```ts import.meta.vitest
* import { Exit } from "effect"
*
* Exit.interrupt(123) // => Exit.interrupt(123)
* ```
*
* @see {@link hasInterrupts} to check whether an Exit contains interruptions
*
* @category constructors
* @since 2.0.0
*/
var interrupt$1 = exitInterrupt;
var void_$1 = exitVoid;
/**
* Checks whether an Exit is a Success.
*
* **When to use**
*
* Use as a type guard to narrow `Exit<A, E>` to `Success<A, E>` and access the
* `value` property.
*
* **Example** (Narrowing to success)
*
* ```ts import.meta.vitest
* import { Exit } from "effect"
*
* const exit = Exit.succeed(42)
*
* if (Exit.isSuccess(exit)) {
*   exit.value // => 42
* }
* ```
*
* @see {@link isFailure} for the opposite check
* @see {@link match} for exhaustive pattern matching
*
* @category guards
* @since 2.0.0
*/
var isSuccess$1 = exitIsSuccess;
/**
* Checks whether an Exit is a Failure.
*
* **When to use**
*
* Use as a type guard to narrow `Exit<A, E>` to `Failure<A, E>` and access the
* `cause` property.
*
* **Example** (Narrowing to failure)
*
* ```ts import.meta.vitest
* import { Cause, Exit } from "effect"
*
* const exit = Exit.fail("error")
*
* if (Exit.isFailure(exit)) {
*   exit.cause // => Cause.fail("error")
* }
* ```
*
* @see {@link isSuccess} for the opposite check
* @see {@link match} for exhaustive pattern matching
*
* @category guards
* @since 2.0.0
*/
var isFailure$1 = exitIsFailure;
/**
* Pattern matches on an Exit, handling both success and failure cases.
*
* **When to use**
*
* Use when you need exhaustive handling of both `Exit` success and failure
* outcomes.
*
* **Details**
*
* Calls `onSuccess` with the value if the Exit is a Success, and calls
* `onFailure` with the Cause if the Exit is a Failure.
*
* **Example** (Matching on an Exit)
*
* ```ts import.meta.vitest
* import { Exit } from "effect"
*
* Exit.match(Exit.succeed(42), {
*   onSuccess: (value) => `Got: ${value}`,
*   onFailure: () => "Failed"
* }) // => "Got: 42"
* ```
*
* @see {@link isSuccess} and {@link isFailure} for simple boolean checks
*
* @category pattern matching
* @since 2.0.0
*/
var match$1 = exitMatch;
var DeferredProto = {
	["~effect/Deferred"]: {
		_A: identity,
		_E: identity
	},
	pipe() {
		return pipeArguments(this, arguments);
	}
};
/**
* Creates an empty `Deferred` synchronously outside the `Effect` runtime.
*
* **When to use**
*
* Use to allocate a `Deferred` synchronously when direct allocation outside
* `Effect` is required.
*
* **Example** (Creating a Deferred unsafely)
*
* ```ts import.meta.vitest
* import { Deferred } from "effect"
*
* const deferred = Deferred.makeUnsafe<number>()
* Deferred.isDoneUnsafe(deferred) // => false
* ```
*
* @category unsafe
* @since 4.0.0
*/
var makeUnsafe$2 = () => {
	const self = Object.create(DeferredProto);
	self.resumes = void 0;
	self.effect = void 0;
	return self;
};
/**
* Creates a new `Deferred`.
*
* **When to use**
*
* Use to allocate an empty `Deferred` inside an `Effect` workflow.
*
* **Example** (Creating a Deferred)
*
* ```ts import.meta.vitest
* import { Deferred, Effect } from "effect"
*
* const program = Effect.gen(function*() {
*   const deferred = yield* Deferred.make<number>()
*   yield* Deferred.succeed(deferred, 42)
*   return yield* Deferred.await(deferred)
* })
*
* await Effect.runPromise(program) // => 42
* ```
*
* @category constructors
* @since 2.0.0
*/
var make$4 = () => sync$1(() => makeUnsafe$2());
var _await = (self) => callback$1((resume) => {
	if (self.effect) return resume(self.effect);
	self.resumes ??= [];
	self.resumes.push(resume);
	return sync$1(() => {
		const resumes = self.resumes;
		if (resumes === void 0) return;
		const index = resumes.indexOf(resume);
		if (index >= 0) resumes.splice(index, 1);
	});
});
/**
* Completes the `Deferred` with the specified `Exit` value, which will be
* propagated to all fibers waiting on the value of the `Deferred`.
*
* **When to use**
*
* Use to complete a `Deferred` from an already computed `Exit`.
*
* **Details**
*
* The returned effect succeeds with `true` when this call completed the
* `Deferred`, or `false` if it was already completed.
*
* **Example** (Completing a Deferred with an Exit)
*
* ```ts import.meta.vitest
* import { Deferred, Effect, Exit } from "effect"
*
* const program = Effect.gen(function*() {
*   const deferred = yield* Deferred.make<number>()
*   yield* Deferred.done(deferred, Exit.succeed(42))
*   return yield* Effect.exit(Deferred.await(deferred))
* })
*
* await Effect.runPromise(program) // => Exit.succeed(42)
* ```
*
* @see {@link complete} for completing from an effect and memoizing its result
* @see {@link completeWith} for storing an effect directly
* @see {@link succeed} for completing with a success value
* @see {@link failCause} for completing with a failure cause
*
* @category completion
* @since 2.0.0
*/
var done = /* @__PURE__ */ dual(2, (self, effect) => sync$1(() => doneUnsafe(self, effect)));
/**
* Attempts to complete the `Deferred` with the specified error.
*
* **When to use**
*
* Use to complete a `Deferred` with a typed failure value.
*
* **Details**
*
* Fibers waiting on the `Deferred` fail with that error only if this call
* completes it. The returned effect succeeds with `true` when this call
* completed the `Deferred`, or `false` if it was already completed.
*
* **Example** (Failing a Deferred with an error)
*
* ```ts import.meta.vitest
* import { Deferred, Effect, Exit } from "effect"
*
* const program = Effect.gen(function*() {
*   const deferred = yield* Deferred.make<number, string>()
*   const success = yield* Deferred.fail(deferred, "Operation failed")
*   const exit = yield* Effect.exit(Deferred.await(deferred))
*   return [success, exit]
* })
*
* await Effect.runPromise(program) // => [true, Exit.fail("Operation failed")]
* ```
*
* @category completion
* @since 2.0.0
*/
var fail$1 = /*#__PURE__*/ dual(2, (self, error) => done(self, exitFail(error)));
/**
* Attempts to complete the `Deferred` with the specified `Cause`.
*
* **When to use**
*
* Use to complete a `Deferred` with a full failure cause.
*
* **Details**
*
* Fibers waiting on the `Deferred` observe that cause only if this call
* completes it. The returned effect succeeds with `true` when this call
* completed the `Deferred`, or `false` if it was already completed.
*
* **Example** (Failing a Deferred with a Cause)
*
* ```ts import.meta.vitest
* import { Cause, Deferred, Effect, Exit } from "effect"
*
* const program = Effect.gen(function*() {
*   const deferred = yield* Deferred.make<number, string>()
*   const success = yield* Deferred.failCause(deferred, Cause.fail("Operation failed"))
*   const exit = yield* Effect.exit(Deferred.await(deferred))
*   return [success, exit]
* })
*
* await Effect.runPromise(program) // => [true, Exit.failCause(Cause.fail("Operation failed"))]
* ```
*
* @category completion
* @since 2.0.0
*/
var failCause$1 = /*#__PURE__*/ dual(2, (self, cause) => done(self, exitFailCause(cause)));
/**
* Attempts to complete the `Deferred` with interruption by the specified
* `FiberId`.
*
* **When to use**
*
* Use to complete a `Deferred` as interrupted by a specific fiber id.
*
* **Details**
*
* Fibers waiting on the `Deferred` are interrupted with that fiber id only if
* this call completes it. The returned effect succeeds with `true` when this
* call completed the `Deferred`, or `false` if it was already completed.
*
* **Example** (Interrupting a Deferred with a fiber id)
*
* ```ts import.meta.vitest
* import { Deferred, Effect, Exit } from "effect"
*
* const program = Effect.gen(function*() {
*   const deferred = yield* Deferred.make<number>()
*   const success = yield* Deferred.interruptWith(deferred, 42)
*   const exit = yield* Effect.exit(Deferred.await(deferred))
*   return [success, exit]
* })
*
* await Effect.runPromise(program) // => [true, Exit.interrupt(42)]
* ```
*
* @category completion
* @since 2.0.0
*/
var interruptWith = /*#__PURE__*/ dual(2, (self, fiberId) => failCause$1(self, causeInterrupt(fiberId)));
/**
* Attempts to complete the `Deferred` with the specified value.
*
* **When to use**
*
* Use to complete a `Deferred` with a successful value.
*
* **Details**
*
* Fibers waiting on the `Deferred` receive the value only if this call
* completes it. The returned effect succeeds with `true` when this call
* completed the `Deferred`, or `false` if it was already completed.
*
* **Example** (Completing a Deferred with a value)
*
* ```ts import.meta.vitest
* import { Deferred, Effect } from "effect"
*
* const program = Effect.gen(function*() {
*   const deferred = yield* Deferred.make<number>()
*   yield* Deferred.succeed(deferred, 42)
*
*   return yield* Deferred.await(deferred)
* })
*
* await Effect.runPromise(program) // => 42
* ```
*
* @category completion
* @since 2.0.0
*/
var succeed$2 = /*#__PURE__*/ dual(2, (self, value) => done(self, exitSucceed(value)));
/**
* Attempts to complete the `Deferred` synchronously with the specified
* completion effect.
*
* **When to use**
*
* Use to complete a `Deferred` synchronously in low-level code that already has
* the completion effect.
*
* **Details**
*
* This mutates the `Deferred` directly and should be reserved for low-level
* code; prefer the effectful completion APIs when possible. Returns `true` if
* this call completed the `Deferred`, or `false` if it was already completed.
*
* **Example** (Completing a Deferred unsafely)
*
* ```ts import.meta.vitest
* import { Deferred, Effect } from "effect"
*
* const deferred = Deferred.makeUnsafe<number>()
* Deferred.doneUnsafe(deferred, Effect.succeed(42)) // => true
* ```
*
* @category unsafe
* @since 4.0.0
*/
var doneUnsafe = (self, effect) => {
	if (self.effect) return false;
	self.effect = effect;
	if (self.resumes) {
		const resumes = self.resumes;
		self.resumes = void 0;
		for (let i = 0; i < resumes.length; i++) resumes[i](effect);
	}
	return true;
};
/**
* Runs an `Effect` and attempts to complete a `Deferred` with the effect's
* result.
*
* **When to use**
*
* Use to pipe an effect result into a `Deferred` while preserving success,
* failure, defects, and interruption.
*
* **Details**
*
* If the effect succeeds, fails, dies, or is interrupted, that result is used
* as the attempted completion. The returned effect cannot fail; it succeeds
* with `true` if it completed the `Deferred`, or `false` if the `Deferred` was
* already completed.
*
* **Example** (Completing a Deferred from an effect result)
*
* ```ts import.meta.vitest
* import { Deferred, Effect } from "effect"
*
* const successEffect = Effect.succeed(42)
*
* const program = Effect.gen(function*() {
*   const deferred = yield* Deferred.make<number, string>()
*   const isCompleted = yield* Deferred.into(successEffect, deferred)
*   const value = yield* Deferred.await(deferred)
*   return [isCompleted, value]
* })
*
* await Effect.runPromise(program) // => [true, 42]
* ```
*
* @category completion
* @since 4.0.0
*/
var into = /*#__PURE__*/ dual(2, (self, deferred) => uninterruptibleMask$1((restore) => flatMap$2(exit$1(restore(self)), (exit) => done(deferred, exit))));
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0-rc.112/node_modules/effect/dist/References.js
/**
* Context reference for managing log annotations that are automatically added to all log entries.
* These annotations provide contextual metadata that appears in every log message.
*
* **When to use**
*
* Use to attach shared contextual metadata to every log entry emitted in the
* current context.
*
* **Example** (Managing log annotations)
*
* ```ts import.meta.vitest
* import { Effect, References } from "effect"
*
* const logAnnotationExample = Effect.gen(function*() {
*   // Get current annotations (empty by default)
*   const current = yield* References.CurrentLogAnnotations
*   const defaultCount = Object.keys(current).length
*
*   // Run with custom log annotations
*   const custom = yield* Effect.provideService(
*     Effect.gen(function*() {
*       const annotations = yield* References.CurrentLogAnnotations
*       return [annotations.requestId, annotations.userId, annotations.version]
*     }),
*     References.CurrentLogAnnotations,
*     {
*       requestId: "req-123",
*       userId: "user-456",
*       version: "1.0.0"
*     }
*   )
*
*   // Run with extended annotations
*   const extended = yield* Effect.provideService(
*     Effect.gen(function*() {
*       const annotations = yield* References.CurrentLogAnnotations
*       return [annotations.operation, annotations.timestamp]
*     }),
*     References.CurrentLogAnnotations,
*     {
*       requestId: "req-123",
*       userId: "user-456",
*       version: "1.0.0",
*       operation: "data-sync",
*       timestamp: 1234567890
*     }
*   )
*
*   return [defaultCount, custom, extended]
* })
*
* await Effect.runPromise(logAnnotationExample) // => [0, ["req-123", "user-456", "1.0.0"], ["data-sync", 1234567890]]
* ```
*
* @category references
* @since 4.0.0
*/
var CurrentLogAnnotations = CurrentLogAnnotations$1;
/**
* Context reference for managing log spans that track the duration and hierarchy of operations.
* Each span represents a labeled time period for performance analysis and debugging.
*
* **When to use**
*
* Use to carry the active log span stack that should be included with log
* entries in the current context.
*
* **Example** (Tracking log spans)
*
* ```ts import.meta.vitest
* import { Effect, References } from "effect"
*
* const logSpanExample = Effect.gen(function*() {
*   // Get current spans (empty by default)
*   const current = yield* References.CurrentLogSpans
*   const defaultCount = current.length
*
*   // Add a log span manually
*   const databaseConnectionStartedAt = 0
*   const database = yield* Effect.provideService(
*     Effect.gen(function*() {
*       const spans = yield* References.CurrentLogSpans
*       return spans.map(([label]) => label)
*     }),
*     References.CurrentLogSpans,
*     [["database-connection", databaseConnectionStartedAt]]
*   )
*
*   // Add another span
*   const dataProcessingStartedAt = 100
*   const processing = yield* Effect.provideService(
*     Effect.gen(function*() {
*       const spans = yield* References.CurrentLogSpans
*       return spans.map(([label]) => label)
*     }),
*     References.CurrentLogSpans,
*     [
*       ["database-connection", databaseConnectionStartedAt],
*       ["data-processing", dataProcessingStartedAt]
*     ]
*   )
*
*   // Clear spans when operations complete
*   const cleared = yield* Effect.provideService(
*     Effect.gen(function*() {
*       const spans = yield* References.CurrentLogSpans
*       return spans.length
*     }),
*     References.CurrentLogSpans,
*     []
*   )
*
*   return [defaultCount, database, processing, cleared]
* })
*
* await Effect.runPromise(logSpanExample) // => [0, ["database-connection"], ["database-connection", "data-processing"], 0]
* ```
*
* @category references
* @since 4.0.0
*/
var CurrentLogSpans = CurrentLogSpans$1;
/**
* Context reference for setting the minimum log level threshold. Log entries below this
* level will be filtered out completely.
*
* **When to use**
*
* Use to filter out log entries below a severity threshold.
*
* **Example** (Filtering logs below the minimum level)
*
* ```ts import.meta.vitest
* import { Effect, Logger, References } from "effect"
*
* const levels: Array<string> = []
* const logger = Logger.make<unknown, void>(({ logLevel }) => {
*   levels.push(logLevel)
* })
*
* const program = Effect.gen(function*() {
*   yield* Effect.logInfo("filtered out")
*   yield* Effect.logWarning("included at the threshold")
*   yield* Effect.logError("included above the threshold")
* })
*
* await Effect.runPromise(program.pipe(
*   Effect.provideService(References.MinimumLogLevel, "Warn"),
*   Effect.provide(Logger.layer([logger]))
* ))
* levels // => ["Warn", "Error"]
* ```
*
* @category references
* @since 4.0.0
*/
var MinimumLogLevel = MinimumLogLevel$1;
/**
* Context reference for controlling whether trace timing is enabled globally. When set
* to false, spans will not contain timing information (trace time will always
* be set to zero).
*
* **When to use**
*
* Use to disable or re-enable timing capture for spans in the current context.
*
* **Example** (Toggling trace timing)
*
* ```ts import.meta.vitest
* import { Effect, References } from "effect"
*
* const tracingControl = Effect.gen(function*() {
*   // Check if trace timing is enabled (default is true)
*   const current = yield* References.TracerTimingEnabled
*
*   // Disable trace timing globally
*   const disabled = yield* Effect.provideService(
*     References.TracerTimingEnabled,
*     References.TracerTimingEnabled,
*     false
*   )
*
*   // Re-enable trace timing
*   const enabled = yield* Effect.provideService(
*     References.TracerTimingEnabled,
*     References.TracerTimingEnabled,
*     true
*   )
*
*   return [current, disabled, enabled]
* })
*
* await Effect.runPromise(tracingControl) // => [true, false, true]
* ```
*
* @category references
* @since 4.0.0
*/
var TracerTimingEnabled = TracerTimingEnabled$1;
/**
* Context reference for the log severity used when a pool finalizer reports an
* unhandled error.
*
* **When to use**
*
* Use to choose whether and at which severity pool finalizer failures are
* reported.
*
* **Details**
*
* The default level is `"Error"`.
*
* **Gotchas**
*
* Providing `undefined` suppresses this report; it does not fall back to
* `CurrentLogLevel`.
*
* @see {@link CurrentLogLevel} for the default severity used by ordinary `Effect.log` calls
* @see {@link MinimumLogLevel} for filtering emitted log entries by threshold
*
* @category references
* @since 4.0.0
*/
var UnhandledLogLevel = UnhandledLogLevel$1;
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0-rc.112/node_modules/effect/dist/Scope.js
/**
* Controls how long resources stay open.
*
* A scope is a lifetime boundary. Code can register cleanup effects on it, and
* closing the scope runs those cleanups with the `Exit` value that ended the
* work. Most application code uses higher-level APIs such as `Effect.scoped`
* and `Layer`, while this module is useful when code needs to create, provide,
* fork, close, or inspect scopes directly.
*
* @since 2.0.0
*/
/**
* Service tag for the active resource lifetime.
*
* **When to use**
*
* Use to access the active lifetime when registering finalizers or sharing
* resources with the surrounding scope.
*
* **Example** (Accessing the scope service)
*
* ```ts import.meta.vitest
* import { Effect, Scope } from "effect"
*
* const cleanups: Array<string> = []
* const program = Effect.gen(function*() {
*   const scope = yield* Scope.Scope
*   yield* Scope.addFinalizer(scope, Effect.sync(() => cleanups.push("Cleanup")))
* })
*
* Effect.runSync(Effect.scoped(program))
* cleanups // => ["Cleanup"]
* ```
*
* @category services
* @since 2.0.0
*/
var Scope = scopeTag;
/**
* Creates a new `Scope` with the specified finalizer strategy.
*
* **Example** (Creating a scope)
*
* ```ts import.meta.vitest
* import { Effect, Exit, Scope } from "effect"
*
* const cleanups: Array<string> = []
* const program = Effect.gen(function*() {
*   const scope = yield* Scope.make("sequential")
*   yield* Scope.addFinalizer(scope, Effect.sync(() => cleanups.push("Cleanup 1")))
*   yield* Scope.addFinalizer(scope, Effect.sync(() => cleanups.push("Cleanup 2")))
*   yield* Scope.close(scope, Exit.void)
* })
*
* Effect.runSync(program)
* cleanups // => ["Cleanup 2", "Cleanup 1"]
* ```
*
* @category constructors
* @since 2.0.0
*/
var make$3 = scopeMake;
/**
* Creates a new `Scope` synchronously without wrapping it in an `Effect`.
* This is useful when you need a scope immediately but should be used with caution
* as it doesn't provide the same safety guarantees as the `Effect`-wrapped version.
*
* **When to use**
*
* Use when a scope must be allocated synchronously and the caller will close it
* manually.
*
* **Example** (Creating a scope synchronously)
*
* ```ts import.meta.vitest
* import { Effect, Exit, Scope } from "effect"
*
* const scope = Scope.makeUnsafe("sequential")
* const cleanups: Array<string> = []
* const program = Effect.gen(function*() {
*   yield* Scope.addFinalizer(scope, Effect.sync(() => cleanups.push("Cleanup")))
*   yield* Scope.close(scope, Exit.void)
* })
*
* Effect.runSync(program)
* cleanups // => ["Cleanup"]
* ```
*
* @category constructors
* @since 4.0.0
*/
var makeUnsafe$1 = scopeMakeUnsafe;
/**
* Provides a concrete `Scope` to an effect.
*
* **When to use**
*
* Use to run an effect that requires `Scope` with a scope managed by the
* caller.
*
* **Details**
*
* Providing the scope removes the `Scope` requirement from the effect context.
*
* **Example** (Providing a scope)
*
* ```ts import.meta.vitest
* import { Effect, Exit, Scope } from "effect"
*
* const events: Array<string> = []
* const program = Effect.gen(function*() {
*   const scope = yield* Scope.Scope
*   yield* Scope.addFinalizer(scope, Effect.sync(() => events.push("cleanup")))
*   events.push("working")
* })
*
* const withScope = Effect.gen(function*() {
*   const scope = yield* Scope.make()
*   yield* Scope.provide(scope)(program)
*   yield* Scope.close(scope, Exit.void)
* })
*
* Effect.runSync(withScope)
* events // => ["working", "cleanup"]
* ```
*
* @category combinators
* @since 4.0.0
*/
var provide$3 = provideScope;
/**
* Registers an exit-aware finalizer on a scope.
*
* **When to use**
*
* Use when cleanup needs to know whether the scope closed with success,
* failure, or interruption.
*
* **Details**
*
* If the scope is open, the finalizer runs when the scope closes and receives
* the scope's exit value. If the scope is already closed, the finalizer runs
* immediately with the stored exit value.
*
* **Example** (Adding an exit-aware finalizer)
*
* ```ts import.meta.vitest
* import { Effect, Exit, Scope } from "effect"
*
* const exits: Array<Exit.Exit<unknown, unknown>> = []
* const withResource = Effect.gen(function*() {
*   const scope = yield* Scope.make()
*   yield* Scope.addFinalizerExit(scope, (exit) => Effect.sync(() => exits.push(exit)))
*   yield* Scope.close(scope, Exit.void)
* })
*
* Effect.runSync(withResource)
* exits // => [Exit.void]
* ```
*
* @category combinators
* @since 2.0.0
*/
var addFinalizerExit = scopeAddFinalizerExit;
/**
* Registers a finalizer effect on a scope.
*
* **Details**
*
* If the scope is open, the finalizer runs when the scope closes, regardless of
* whether the scope closes successfully or with an error. If the scope is
* already closed, the finalizer runs immediately.
*
* **Example** (Adding finalizers)
*
* ```ts import.meta.vitest
* import { Effect, Exit, Scope } from "effect"
*
* const events: Array<string> = []
* const program = Effect.gen(function*() {
*   const scope = yield* Scope.make()
*   yield* Scope.addFinalizer(scope, Effect.sync(() => events.push("cleanup 1")))
*   yield* Scope.addFinalizer(scope, Effect.sync(() => events.push("cleanup 2")))
*   yield* Scope.addFinalizer(scope, Effect.sync(() => events.push("cleanup 3")))
*   events.push("work")
*   yield* Scope.close(scope, Exit.void)
* })
*
* Effect.runSync(program)
* events // => ["work", "cleanup 3", "cleanup 2", "cleanup 1"]
* ```
*
* @category combinators
* @since 2.0.0
*/
var addFinalizer$1 = scopeAddFinalizer;
/**
* Creates a closeable child scope synchronously and registers it with a parent scope.
*
* **When to use**
*
* Use when a child scope must be created synchronously and the caller controls
* both parent and child scope lifetimes.
*
* **Details**
*
* Closing the parent closes the child with the same exit value, and closing the
* child detaches it from the parent. The optional finalizer strategy configures
* the child scope and defaults to `"sequential"` when omitted.
*
* **Example** (Creating a child scope synchronously)
*
* ```ts import.meta.vitest
* import { Effect, Exit, Scope } from "effect"
*
* const cleanups: Array<string> = []
* const program = Effect.gen(function*() {
*   const parentScope = Scope.makeUnsafe("sequential")
*   const childScope = Scope.forkUnsafe(parentScope, "parallel")
*   yield* Scope.addFinalizer(parentScope, Effect.sync(() => cleanups.push("parent")))
*   yield* Scope.addFinalizer(childScope, Effect.sync(() => cleanups.push("child")))
*   yield* Scope.close(childScope, Exit.void)
*   yield* Scope.close(parentScope, Exit.void)
* })
*
* Effect.runSync(program)
* cleanups // => ["child", "parent"]
* ```
*
* @category combinators
* @since 4.0.0
*/
var forkUnsafe = scopeForkUnsafe;
/**
* Closes a scope and runs its registered finalizers.
*
* **When to use**
*
* Use to close a scope manually with a specific exit value.
*
* **Details**
*
* Finalizers run in the scope's configured order and receive the supplied
* `Exit`.
*
* **Example** (Running scope finalizers)
*
* ```ts import.meta.vitest
* import { Effect, Exit, Scope } from "effect"
*
* const events: Array<string> = []
* const resourceManagement = Effect.gen(function*() {
*   const scope = yield* Scope.make("sequential")
*   yield* Scope.addFinalizer(scope, Effect.sync(() => events.push("database")))
*   yield* Scope.addFinalizer(scope, Effect.sync(() => events.push("file")))
*   yield* Scope.addFinalizer(scope, Effect.sync(() => events.push("memory")))
*   events.push("work")
*   yield* Scope.close(scope, Exit.succeed("Success!"))
* })
*
* Effect.runSync(resourceManagement)
* events // => ["work", "memory", "file", "database"]
* ```
*
* @category combinators
* @since 2.0.0
*/
var close = scopeClose;
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0-rc.112/node_modules/effect/dist/Layer.js
var TypeId$5 = "~effect/Layer";
var MemoMapTypeId = "~effect/Layer/MemoMap";
var memoMapReuse = (entry, scope) => {
	entry.observers++;
	return andThen$1(scopeAddFinalizerExit(scope, (exit) => entry.finalizer(exit)), entry.effect);
};
var LayerProto = {
	[TypeId$5]: {
		_ROut: identity,
		_E: identity,
		_RIn: identity
	},
	pipe() {
		return pipeArguments(this, arguments);
	}
};
var fromBuildUnsafe = (build) => {
	const self = Object.create(LayerProto);
	self.build = build;
	return self;
};
/**
* Constructs a `Layer` from a function that uses a `MemoMap` and `Scope` to
* build the layer.
*
* **Details**
*
* The function receives a `MemoMap` for memoization and a `Scope` for resource management.
* A child scope is created, and if the build fails, the child scope is closed.
*
* **Example** (Constructing a layer from a build function)
*
* ```ts import.meta.vitest
* import { Context, Effect, Layer } from "effect"
*
* class Database extends Context.Service<Database, {
*   readonly query: (sql: string) => Effect.Effect<string>
* }>()("Database") {}
*
* const databaseLayer = Layer.fromBuild(() =>
*   Effect.sync(() =>
*     Context.make(Database, {
*       query: (sql: string) => Effect.succeed("result")
*     })
*   )
* )
*
* const program = Database.use((database) => database.query("SELECT 1"))
* Effect.runSync(Effect.provide(program, databaseLayer)) // => "result"
* ```
*
* @category constructors
* @since 4.0.0
*/
var fromBuild = (build) => fromBuildUnsafe((memoMap, scope) => {
	const layerScope = forkUnsafe(scope);
	return onExit$1(build(memoMap, layerScope), (exit) => exit._tag === "Failure" ? close(layerScope, exit) : void_$2);
});
/**
* Constructs a `Layer` from a function that uses a `MemoMap` and `Scope` to
* build the layer, with automatic memoization.
*
* **Details**
*
* This is similar to `fromBuild` but provides automatic memoization of the layer construction.
* The layer will be memoized based on the provided `MemoMap`.
*
* **Example** (Memoizing layer construction)
*
* ```ts import.meta.vitest
* import { Context, Effect, Layer } from "effect"
*
* class Database extends Context.Service<Database, {
*   readonly query: (sql: string) => Effect.Effect<string>
* }>()("Database") {}
*
* const databaseLayer = Layer.fromBuildMemo(() =>
*   Effect.sync(() =>
*     Context.make(Database, {
*       query: (sql: string) => Effect.succeed("result")
*     })
*   )
* )
*
* const program = Database.use((database) => database.query("SELECT 1"))
* Effect.runSync(Effect.provide(program, databaseLayer)) // => "result"
* ```
*
* @category constructors
* @since 4.0.0
*/
var fromBuildMemo = (build) => {
	const self = fromBuild((memoMap, scope) => memoMap.getOrElseMemoize(self, scope, build));
	return self;
};
var memoMapBuild = (memoMap, layer, scope, build) => {
	const layerScope = makeUnsafe$1();
	const deferred = makeUnsafe$2();
	const entry = {
		observers: 1,
		effect: _await(deferred),
		finalizer: (exit) => suspend$2(() => {
			entry.observers--;
			if (entry.observers === 0) {
				memoMap.map.delete(layer);
				return close(layerScope, exit);
			}
			return void_$2;
		})
	};
	memoMap.map.set(layer, entry);
	return scopeAddFinalizerExit(scope, entry.finalizer).pipe(flatMap$2(() => build(memoMap, layerScope)), onExit$1((exit) => {
		entry.effect = exit;
		return done(deferred, exit);
	}));
};
var MemoMapImpl = class {
	get [MemoMapTypeId]() {
		return MemoMapTypeId;
	}
	parent;
	constructor(parent) {
		this.parent = parent;
	}
	map = /*#__PURE__*/ new Map();
	get(layer, scope) {
		const local = this.map.get(layer);
		if (local) return memoMapReuse(local, scope);
		return this.parent?.get(layer, scope);
	}
	getOrElseMemoize(layer, scope, build) {
		return suspend$2(() => {
			const existing = this.get(layer, scope);
			if (existing) return existing;
			return memoMapBuild(this, layer, scope, build);
		});
	}
};
/**
* Constructs a `MemoMap` synchronously so it can be used to build additional layers.
*
* **Example** (Creating a memo map unsafely)
*
* ```ts import.meta.vitest
* import { Context, Effect, Layer } from "effect"
*
* class Database extends Context.Service<Database, {
*   readonly query: (sql: string) => Effect.Effect<string>
* }>()("Database") {}
*
* // Create a memo map for manual layer building
* const program = Effect.gen(function*() {
*   const memoMap = Layer.makeMemoMapUnsafe()
*   const scope = yield* Effect.scope
*
*   const dbLayer = Layer.succeed(Database, {
*     query: Effect.fn("Database.query")((sql: string) => Effect.succeed("result"))
*   })
*   const context = yield* Layer.buildWithMemoMap(dbLayer, memoMap, scope)
*
*   return Context.get(context, Database)
* })
*
* const database = Effect.runSync(Effect.scoped(program))
* Effect.runSync(database.query("SELECT 1")) // => "result"
* ```
*
* @category constructors
* @since 4.0.0
*/
var makeMemoMapUnsafe = () => new MemoMapImpl();
/**
* Constructs a child `MemoMap` synchronously, allowing it to reuse layers
* already memoized in the parent while isolating any new layer allocations to
* the child map.
*
* **When to use**
*
* Use to synchronously fork a memo map for manual layer building when child
* builds should see parent memoized layers without writing newly built layers
* back to the parent.
*
* @see {@link forkMemoMap} for allocating the child memo map inside `Effect`
* @see {@link makeMemoMapUnsafe} for creating a root memo map without a parent
*
* @category constructors
* @since 4.0.0
*/
var forkMemoMapUnsafe = (parent) => new MemoMapImpl(parent);
/**
* Context service for the current `MemoMap` used in layer construction.
*
* **When to use**
*
* Use when building custom layer operations that need to access the current
* memoization map from the fiber context.
*
* **Details**
*
* This service wraps a `MemoMap` as a `Context.Service`, making it available
* for dependency injection during layer construction.
*
* @see {@link MemoMap} the memoization map type wrapped by this service
*
* @category services
* @since 3.13.0
*/
var CurrentMemoMap = class CurrentMemoMap extends (/*#__PURE__*/ Service()("effect/Layer/CurrentMemoMap")) {
	static forkOrCreate(self) {
		const current = getOrUndefined(self, CurrentMemoMap);
		return current ? forkMemoMapUnsafe(current) : makeMemoMapUnsafe();
	}
};
/**
* Builds a layer into an `Effect` value, using the specified `MemoMap` to memoize
* the layer construction.
*
* **Example** (Building layers with an explicit memo map)
*
* ```ts import.meta.vitest
* import { Context, Effect, Layer } from "effect"
*
* class Database extends Context.Service<Database, {
*   readonly query: (sql: string) => Effect.Effect<string>
* }>()("Database") {}
*
* class Logger extends Context.Service<Logger, {
*   readonly log: (msg: string) => Effect.Effect<void>
* }>()("Logger") {}
*
* const logs: Array<string> = []
*
* // Build layers with explicit memoization control
* const program = Effect.gen(function*() {
*   const memoMap = yield* Layer.makeMemoMap
*   const scope = yield* Effect.scope
*
*   // Build database layer with memoization
*   const dbLayer = Layer.succeed(Database, {
*     query: Effect.fn("Database.query")((sql: string) => Effect.succeed("result"))
*   })
*   const dbContext = yield* Layer.buildWithMemoMap(dbLayer, memoMap, scope)
*
*   // Build logger layer with same memoization (reuses memo if same layer)
*   const loggerLayer = Layer.succeed(Logger, {
*     log: Effect.fn("Logger.log")((msg: string) => Effect.sync(() => logs.push(msg)))
*   })
*   const loggerContext = yield* Layer.buildWithMemoMap(
*     loggerLayer,
*     memoMap,
*     scope
*   )
*
*   return {
*     database: Context.get(dbContext, Database),
*     logger: Context.get(loggerContext, Logger)
*   }
* })
*
* const services = Effect.runSync(Effect.scoped(program))
* Effect.runSync(services.logger.log("ready"))
* logs // => ["ready"]
* ```
*
* @category destructors
* @since 2.0.0
*/
var buildWithMemoMap = /*#__PURE__*/ dual(3, (self, memoMap, scope) => provideService$1(map$3(self.build(memoMap, scope), add(CurrentMemoMap, memoMap)), CurrentMemoMap, memoMap));
/**
* Builds a layer into a scoped value.
*
* **Example** (Building a layer into a context)
*
* ```ts import.meta.vitest
* import { Context, Effect, Layer } from "effect"
*
* class Database extends Context.Service<Database, {
*   readonly query: (sql: string) => Effect.Effect<string>
* }>()("Database") {}
*
* // Build a layer to get its services
* const program = Effect.gen(function*() {
*   const dbLayer = Layer.succeed(Database, {
*     query: Effect.fn("Database.query")((sql: string) => Effect.succeed("result"))
*   })
*
*   // Build the layer into Context - automatically manages scope and memoization
*   const context = yield* Layer.build(dbLayer)
*
*   // Extract the specific service from the built layer
*   const database = Context.get(context, Database)
*
*   return yield* database.query("SELECT * FROM users")
* })
*
* Effect.runSync(Effect.scoped(program)) // => "result"
* ```
*
* @category destructors
* @since 2.0.0
*/
var build = (self) => withFiber$1((fiber) => buildWithMemoMap(self, CurrentMemoMap.forkOrCreate(fiber.context), getUnsafe(fiber.context, Scope)));
/**
* Builds a layer using an explicit scope.
*
* **When to use**
*
* Use to control the lifetime of layer resources with a scope supplied by the
* caller.
*
* **Details**
*
* Resources created by the layer are released when the supplied scope is
* closed, unless a resource extends its own scope.
*
* **Example** (Building a layer with an explicit scope)
*
* ```ts import.meta.vitest
* import { Context, Effect, Layer, Scope } from "effect"
*
* class Database extends Context.Service<Database, {
*   readonly query: (sql: string) => Effect.Effect<string>
* }>()("Database") {}
*
* const logs: Array<string> = []
*
* // Build a layer with explicit scope control
* const program = Effect.gen(function*() {
*   const scope = yield* Effect.scope
*
*   const dbLayer = Layer.effect(Database, Effect.gen(function*() {
*     logs.push("Initializing database...")
*     yield* Scope.addFinalizer(
*       scope,
*       Effect.sync(() => logs.push("Database closed"))
*     )
*     return { query: Effect.fn("Database.query")((sql: string) => Effect.succeed(`Result: ${sql}`)) }
*   }))
*
*   // Build with specific scope - resources tied to this scope
*   const context = yield* Layer.buildWithScope(dbLayer, scope)
*   const database = Context.get(context, Database)
*
*   return yield* database.query("SELECT * FROM users")
*   // Database will be closed when scope is closed
* })
*
* Effect.runSync(Effect.scoped(program)) // => "Result: SELECT * FROM users"
* logs // => ["Initializing database...", "Database closed"]
* ```
*
* @category destructors
* @since 2.0.0
*/
var buildWithScope = /*#__PURE__*/ dual(2, (self, scope) => withFiber$1((fiber) => buildWithMemoMap(self, CurrentMemoMap.forkOrCreate(fiber.context), scope)));
/**
* Constructs a layer that provides a single service from an already available
* value.
*
* **When to use**
*
* Use when you need a `Layer` that provides a service from an already
* constructed implementation without effectful acquisition.
*
* **Example** (Creating a layer from a service implementation)
*
* ```ts import.meta.vitest
* import { Context, Effect, Layer } from "effect"
*
* class Database extends Context.Service<Database, {
*   readonly query: (sql: string) => Effect.Effect<string>
* }>()("Database") {}
*
* const DatabaseLayer = Layer.succeed(Database, {
*   query: Effect.fn("Database.query")((sql: string) => Effect.succeed(`Query result: ${sql}`))
* })
* const program = Database.use((database) => database.query("SELECT 1"))
* Effect.runSync(Effect.provide(program, DatabaseLayer)) // => "Query result: SELECT 1"
* ```
*
* @see {@link sync} for constructing layers from lazy values
*
* @category constructors
* @since 2.0.0
*/
var succeed$1 = function() {
	if (arguments.length === 1) return (resource) => succeedContext(make$7(arguments[0], resource));
	return succeedContext(make$7(arguments[0], arguments[1]));
};
/**
* Constructs a layer that provides all services in an already available
* `Context`.
*
* **When to use**
*
* Use when you need a `Layer` built from an existing `Context`, including when
* you need to provide multiple services at once.
*
* **Details**
*
* This is a more general version of `succeed` that allows you to provide
* multiple services at once through a `Context`.
*
* **Example** (Providing multiple services from a context)
*
* ```ts import.meta.vitest
* import { Context, Effect, Layer } from "effect"
*
* class Database extends Context.Service<Database, {
*   readonly query: (sql: string) => Effect.Effect<string>
* }>()("Database") {}
*
* class Logger extends Context.Service<Logger, {
*   readonly log: (msg: string) => Effect.Effect<void>
* }>()("Logger") {}
*
* const logs: Array<string> = []
* const context = Context.make(Database, {
*   query: Effect.fn("Database.query")((sql: string) => Effect.succeed("result"))
* }).pipe(
*   Context.add(Logger, {
*     log: (msg: string) => Effect.sync(() => logs.push(msg))
*   })
* )
*
* const layer = Layer.succeedContext(context)
* const program = Logger.use((logger) => logger.log("ready"))
* Effect.runSync(Effect.provide(program, layer))
* logs // => ["ready"]
* ```
*
* @see {@link succeed} for providing a single service from a value
*
* @category constructors
* @since 2.0.0
*/
var succeedContext = (context) => fromBuildUnsafe(constant(succeed$4(context)));
/**
* An empty layer that provides no services, cannot fail, has no requirements,
* and performs no construction or finalization work.
*
* **When to use**
*
* Use as the no-op branch when conditionally composing layers.
*
* **Example** (Disabling optional lifecycle work)
*
* ```ts import.meta.vitest
* import { Context, Effect, Layer, Option } from "effect"
*
* const Service = Context.Service<string>("Service")
* const context = Effect.runSync(Effect.scoped(Layer.build(Layer.empty)))
* Context.getOption(context, Service) // => Option.none()
* ```
*
* @see {@link effectDiscard} for running an effect while providing no services
*
* @category constructors
* @since 2.0.0
*/
var empty = /*#__PURE__*/ succeedContext(/*#__PURE__*/ empty$2());
/**
* Constructs a layer from an effect that produces a single service.
*
* **When to use**
*
* Use when you need to construct a `Layer`-provided service with an `Effect`,
* dependencies, or scoped resource acquisition.
*
* **Details**
*
* This allows you to create a `Layer` from an `Effect` that produces a service.
* The `Effect` is executed in the scope of the layer, allowing for proper
* resource management.
*
* **Example** (Creating a layer from an effect)
*
* ```ts import.meta.vitest
* import { Context, Effect, Layer } from "effect"
*
* class Database extends Context.Service<Database, {
*   readonly query: (sql: string) => Effect.Effect<string>
* }>()("Database") {}
*
* const layer = Layer.effect(Database,
*   Effect.sync(() => ({
*     query: (sql: string) => Effect.succeed(`Query: ${sql}`)
*   }))
* )
* const program = Database.use((database) => database.query("SELECT 1"))
* Effect.runSync(Effect.provide(program, layer)) // => "Query: SELECT 1"
* ```
*
* @see {@link effectContext} for effectfully providing multiple services
* @see {@link effectDiscard} for running construction work without providing services
*
* @category constructors
* @since 2.0.0
*/
var effect = function() {
	if (arguments.length === 1) return (effect) => effectImpl(arguments[0], effect);
	return effectImpl(arguments[0], arguments[1]);
};
var effectImpl = (service, effect) => effectContext(map$3(effect, (value) => make$7(service, value)));
/**
* Constructs a layer from an effect that produces all services in a `Context`.
*
* **When to use**
*
* Use when you need a `Layer` that effectfully constructs a `Context` with
* multiple services.
*
* **Details**
*
* This allows you to create a `Layer` from an effectful computation that
* returns multiple services. The `Effect` is executed in the scope of the
* layer.
*
* **Example** (Creating a layer from an effectful context)
*
* ```ts import.meta.vitest
* import { Context, Effect, Layer } from "effect"
*
* class Database extends Context.Service<
*   Database,
*   { readonly query: (sql: string) => Effect.Effect<string> }
* >()("Database") {}
*
* const layer = Layer.effectContext(
*   Effect.succeed(Context.make(Database, {
*     query: (sql: string) => Effect.succeed(`Query: ${sql}`)
*   }))
* )
* const program = Database.use((database) => database.query("SELECT 1"))
* Effect.runSync(Effect.provide(program, layer)) // => "Query: SELECT 1"
* ```
*
* @see {@link effect} for effectfully providing a single service
*
* @category constructors
* @since 2.0.0
*/
var effectContext = (effect) => fromBuildMemo((_, scope) => provide$3(effect, scope));
/**
* Constructs a layer lazily using the specified factory.
*
* **Details**
*
* The factory is evaluated only when the suspended layer is first built, and
* the result is memoized with normal layer sharing semantics.
*
* **Example** (Choosing a layer lazily)
*
* ```ts import.meta.vitest
* import { Context, Effect, Layer } from "effect"
*
* class Config extends Context.Service<Config, string>()("Config") {}
*
* const useProd = true
*
* const layer = Layer.suspend(() =>
*   useProd
*     ? Layer.succeed(Config, "https://api.example.com")
*     : Layer.succeed(Config, "http://localhost:3000")
* )
* Effect.runSync(Effect.provide(Config, layer)) // => "https://api.example.com"
* ```
*
* @category constructors
* @since 2.0.0
*/
var suspend$1 = (evaluate) => fromBuildMemo((memoMap, scope) => suspend$2(() => evaluate().build(memoMap, scope)));
/**
* Unwraps a `Layer` from an `Effect`, flattening the nested structure.
*
* **When to use**
*
* Use when you have an `Effect` that produces a `Layer` and you want to
* use that layer directly.
*
* **Details**
*
* The resulting Layer will have the combined error and dependency types from
* both the outer Effect and the inner Layer.
*
* **Example** (Unwrapping an effectful layer)
*
* ```ts import.meta.vitest
* import { Context, Effect, Layer } from "effect"
*
* class Database extends Context.Service<Database, {
*   readonly query: (sql: string) => Effect.Effect<string>
* }>()("Database") {}
*
* const layerEffect = Effect.succeed(
*   Layer.succeed(Database, { query: Effect.fn("Database.query")((sql: string) => Effect.succeed("result")) })
* )
*
* const unwrappedLayer = Layer.unwrap(layerEffect)
* const program = Database.use((database) => database.query("SELECT 1"))
* Effect.runSync(Effect.provide(program, unwrappedLayer)) // => "result"
* ```
*
* @category converting
* @since 4.0.0
*/
var unwrap = (self) => {
	const service = Service("effect/Layer/unwrap");
	return flatMap$1(effect(service)(self), get(service));
};
var mergeAllEffect = (layers, memoMap, scope) => {
	const parentScope = forkUnsafe(scope, "parallel");
	return forEach$1(layers, (layer) => layer.build(memoMap, forkUnsafe(parentScope, "sequential")), { concurrency: layers.length }).pipe(map$3((context) => mergeAll$1(...context)));
};
/**
* Combines all the provided layers concurrently, creating a new layer with
* merged input, error, and output types.
*
* **When to use**
*
* Use when you need to combine multiple independent layers.
*
* **Details**
*
* All layers are built concurrently, and their outputs are merged into a single layer.
*
* If multiple merged layers depend on the same layer value, that dependency is
* shared by default. Reuse a named layer value when you want services to share
* the same resource, such as one database pool.
*
* **Example** (Merging independent layers)
*
* ```ts import.meta.vitest
* import { Context, Effect, Layer } from "effect"
*
* class Database extends Context.Service<Database, {
*   readonly query: (sql: string) => Effect.Effect<string>
* }>()("Database") {}
*
* class Logger extends Context.Service<Logger, {
*   readonly log: (msg: string) => Effect.Effect<void>
* }>()("Logger") {}
*
* const dbLayer = Layer.succeed(Database, {
*   query: Effect.fn("Database.query")((sql: string) => Effect.succeed("result"))
* })
* const logs: Array<string> = []
* const loggerLayer = Layer.succeed(Logger, {
*   log: Effect.fn("Logger.log")((msg: string) => Effect.sync(() => logs.push(msg)))
* })
*
* const mergedLayer = Layer.mergeAll(dbLayer, loggerLayer)
* const program = Logger.use((logger) => logger.log("ready"))
* Effect.runSync(Effect.provide(program, mergedLayer))
* logs // => ["ready"]
* ```
*
* @see {@link merge} for merging one layer with another layer or array
*
* @category zipping
* @since 2.0.0
*/
var mergeAll = (...layers) => fromBuild((memoMap, scope) => mergeAllEffect(layers, memoMap, scope));
/**
* Merges this layer with another layer concurrently, producing a new layer with
* combined input, error, and output types.
*
* **When to use**
*
* Use to combine an existing `Layer` with another `Layer` or an array of
* layers while preserving pipeline style.
*
* **Details**
*
* This is a binary version of `mergeAll` that merges exactly two layers or one
* layer with an array of layers. The layers are built concurrently and their
* outputs are combined.
*
* **Example** (Merging two layers)
*
* ```ts import.meta.vitest
* import { Context, Effect, Layer } from "effect"
*
* class Database extends Context.Service<Database, {
*   readonly query: (sql: string) => Effect.Effect<string>
* }>()("Database") {}
*
* class Logger extends Context.Service<Logger, {
*   readonly log: (msg: string) => Effect.Effect<void>
* }>()("Logger") {}
*
* const dbLayer = Layer.succeed(Database, {
*   query: Effect.fn("Database.query")((sql: string) => Effect.succeed("result"))
* })
* const loggerLayer = Layer.succeed(Logger, {
*   log: Effect.fn("Logger.log")((_msg: string) => Effect.void)
* })
*
* const mergedLayer = Layer.merge(dbLayer, loggerLayer)
* const program = Database.use((database) => database.query("SELECT 1"))
* Effect.runSync(Effect.provide(program, mergedLayer)) // => "result"
* ```
*
* @see {@link mergeAll} for merging several layers at once
*
* @category zipping
* @since 2.0.0
*/
var merge = /*#__PURE__*/ dual(2, (self, that) => mergeAll(self, ...Array.isArray(that) ? that : [that]));
var provideWith = (self, that, f) => fromBuild((memoMap, scope) => flatMap$2(Array.isArray(that) ? mergeAllEffect(that, memoMap, scope) : that.build(memoMap, scope), (context) => self.build(memoMap, scope).pipe(provideContext$1(context), map$3((merged) => f(merged, context)))));
/**
* Feeds the output services of the dependency layer into the requirements of
* this layer, returning a layer that only provides the services from this layer.
*
* **When to use**
*
* Use when you need to hide an implementation dependency layer from callers.
*
* **Details**
*
* In `serviceLayer.pipe(Layer.provide(dependencyLayer))`, the dependency layer is
* built first and is used to satisfy the requirements of `serviceLayer`.
*
* **Example** (Providing layer dependencies)
*
* ```ts import.meta.vitest
* import { Context, Effect, Layer } from "effect"
*
* class Database extends Context.Service<Database, {
*   readonly query: (sql: string) => Effect.Effect<string>
* }>()("Database") {}
*
* class UserService extends Context.Service<UserService, {
*   readonly getUser: (id: string) => Effect.Effect<{
*     id: string
*     name: string
*   }>
* }>()("UserService") {}
*
* class Logger extends Context.Service<Logger, {
*   readonly log: (msg: string) => Effect.Effect<void>
* }>()("Logger") {}
*
* // Create dependency layers
* const databaseLayer = Layer.succeed(Database, {
*   query: Effect.fn("Database.query")((sql: string) => Effect.succeed(`DB: ${sql}`))
* })
*
* const logs: Array<string> = []
* const loggerLayer = Layer.succeed(Logger, {
*   log: Effect.fn("Logger.log")((msg: string) => Effect.sync(() => logs.push(`[LOG] ${msg}`)))
* })
*
* // UserService depends on Database and Logger
* const userServiceLayer = Layer.effect(UserService, Effect.gen(function*() {
*   const database = yield* Database
*   const logger = yield* Logger
*
*   return {
*     getUser: Effect.fn("UserService.getUser")(function*(id: string) {
*         yield* logger.log(`Looking up user ${id}`)
*         const result = yield* database.query(
*           `SELECT * FROM users WHERE id = ${id}`
*         )
*         return { id, name: result }
*       })
*   }
* }))
*
* // Provide dependencies to UserService layer
* const userServiceWithDependencies = userServiceLayer.pipe(
*   Layer.provide(Layer.mergeAll(databaseLayer, loggerLayer))
* )
*
* // Now UserService layer has no dependencies
* const program = Effect.gen(function*() {
*   const userService = yield* UserService
*   return yield* userService.getUser("123")
* }).pipe(
*   Effect.provide(userServiceWithDependencies)
* )
* Effect.runSync(program) // => { id: "123", name: "DB: SELECT * FROM users WHERE id = 123" }
* logs // => ["[LOG] Looking up user 123"]
* ```
*
* @see {@link provideMerge} for retaining the dependency services
*
* @category providing services
* @since 2.0.0
*/
var provide$2 = /*#__PURE__*/ dual(2, (self, that) => provideWith(self, that, identity));
/**
* Feeds the output services of the dependency layer into the requirements of
* this layer, returning a layer that provides both sets of services.
*
* **When to use**
*
* Use when you need to compose `Layer`s while keeping both the constructed
* service and the dependency used to build it available.
*
* **Details**
*
* Prefer {@link provide} when the dependency should stay private.
*
* **Example** (Providing dependencies while retaining services)
*
* ```ts import.meta.vitest
* import { Context, Effect, Layer } from "effect"
*
* class Database extends Context.Service<Database, {
*   readonly query: (sql: string) => Effect.Effect<string>
* }>()("Database") {}
*
* class Logger extends Context.Service<Logger, {
*   readonly log: (msg: string) => Effect.Effect<void>
* }>()("Logger") {}
*
* class UserService extends Context.Service<UserService, {
*   readonly getUser: (id: string) => Effect.Effect<{
*     id: string
*     name: string
*   }>
* }>()("UserService") {}
*
* // Create dependency layers
* const databaseLayer = Layer.succeed(Database, {
*   query: Effect.fn("Database.query")((sql: string) => Effect.succeed(`DB: ${sql}`))
* })
*
* const logs: Array<string> = []
* const loggerLayer = Layer.succeed(Logger, {
*   log: Effect.fn("Logger.log")((msg: string) => Effect.sync(() => logs.push(`[LOG] ${msg}`)))
* })
*
* // UserService depends on Database and Logger
* const userServiceLayer = Layer.effect(UserService, Effect.gen(function*() {
*   const database = yield* Database
*   const logger = yield* Logger
*
*   return {
*     getUser: Effect.fn("UserService.getUser")(function*(id: string) {
*         yield* logger.log(`Looking up user ${id}`)
*         const result = yield* database.query(
*           `SELECT * FROM users WHERE id = ${id}`
*         )
*         return { id, name: result }
*       })
*   }
* }))
*
* // Provide dependencies and merge all services together
* const allServicesLayer = userServiceLayer.pipe(
*   Layer.provideMerge(Layer.mergeAll(databaseLayer, loggerLayer))
* )
*
* // Now the resulting layer provides UserService, Database, AND Logger
* const program = Effect.gen(function*() {
*   const userService = yield* UserService
*   const logger = yield* Logger // Still available!
*   const database = yield* Database // Still available!
*
*   const user = yield* userService.getUser("123")
*   yield* logger.log(`Found user: ${user.name}`)
*
*   return user
* }).pipe(
*   Effect.provide(allServicesLayer)
* )
* Effect.runSync(program) // => { id: "123", name: "DB: SELECT * FROM users WHERE id = 123" }
* logs // => ["[LOG] Looking up user 123", "[LOG] Found user: DB: SELECT * FROM users WHERE id = 123"]
* ```
*
* @see {@link provide} for keeping dependency services private
*
* @category providing services
* @since 2.0.0
*/
var provideMerge = /*#__PURE__*/ dual(2, (self, that) => provideWith(self, that, (self, that) => merge$1(that, self)));
/**
* Constructs a layer dynamically based on the output of this layer.
*
* **Example** (Creating services from layer output)
*
* ```ts import.meta.vitest
* import { Context, Effect, Layer } from "effect"
*
* class Config extends Context.Service<Config, {
*   readonly dbUrl: string
*   readonly logLevel: string
* }>()("Config") {}
*
* class Database extends Context.Service<Database, {
*   readonly query: (sql: string) => Effect.Effect<string>
* }>()("Database") {}
*
* class Logger extends Context.Service<Logger, {
*   readonly log: (msg: string) => Effect.Effect<void>
* }>()("Logger") {}
*
* const logs: Array<string> = []
*
* // Base config layer
* const configLayer = Layer.succeed(Config, {
*   dbUrl: "postgres://localhost:5432/mydb",
*   logLevel: "debug"
* })
*
* // Dynamically create services based on config
* const dynamicServiceLayer = configLayer.pipe(
*   Layer.flatMap((context) => {
*     const config = Context.get(context, Config)
*
*     // Create database layer based on config
*     const dbLayer = Layer.succeed(Database, {
*       query: Effect.fn("Database.query")((sql: string) =>
*         Effect.succeed(
*           `Querying ${config.dbUrl}: ${sql}`
*         ))
*     })
*
*     // Create logger layer based on config
*     const loggerLayer = Layer.succeed(Logger, {
*       log: Effect.fn("Logger.log")((msg: string) =>
*         config.logLevel === "debug"
*           ? Effect.sync(() => logs.push(`[DEBUG] ${msg}`))
*           : Effect.sync(() => logs.push(msg))
*       )
*     })
*
*     // Return combined layer
*     return Layer.mergeAll(dbLayer, loggerLayer)
*   })
* )
*
* // Use the dynamic services
* const program = Effect.gen(function*() {
*   const database = yield* Database
*   const logger = yield* Logger
*
*   yield* logger.log("Starting database query")
*   const result = yield* database.query("SELECT * FROM users")
*
*   return result
* }).pipe(
*   Effect.provide(dynamicServiceLayer)
* )
* Effect.runSync(program) // => "Querying postgres://localhost:5432/mydb: SELECT * FROM users"
* logs // => ["[DEBUG] Starting database query"]
* ```
*
* @category sequencing
* @since 2.0.0
*/
var flatMap$1 = /*#__PURE__*/ dual(2, (self, f) => fromBuild((memoMap, scope) => flatMap$2(self.build(memoMap, scope), (context) => f(context).build(memoMap, scope))));
/**
* Recovers from any failure cause by switching to another layer.
*
* **When to use**
*
* Use when you need `Layer` recovery to inspect more than the typed error,
* such as defects or interruption information.
*
* **Details**
*
* The handler receives the full `Cause` of the failed layer, including typed
* errors, unexpected defects, and interruption information, and returns the
* fallback layer to build instead. Finalizers for resources acquired by the
* failed layer are still run before the fallback layer is acquired.
*
* **Example** (Recovering from layer failures by cause)
*
* ```ts import.meta.vitest
* import { Context, Data, Effect, Layer } from "effect"
*
* class DatabaseError extends Data.TaggedError("DatabaseError")<{
*   message: string
* }> {}
*
* class Database extends Context.Service<Database, {
*   readonly query: (sql: string) => Effect.Effect<string>
* }>()("Database") {}
*
* const primaryDatabaseLayer = Layer.effect(Database,
*   Effect.fail(new DatabaseError({ message: "Primary DB unreachable" }))
* )
*
* const databaseWithFallback = primaryDatabaseLayer.pipe(
*   Layer.catchCause(() => {
*     return Layer.succeed(Database, {
*       query: Effect.fn("Database.query")((sql: string) => Effect.succeed(`Memory: ${sql}`))
*     })
*   })
* )
*
* const program = Effect.gen(function*() {
*   const database = yield* Database
*   return yield* database.query("SELECT * FROM users")
* }).pipe(
*   Effect.provide(databaseWithFallback)
* )
*
* await Effect.runPromise(program) // => "Memory: SELECT * FROM users"
* ```
*
* @see {@link catchTag} for recovering from specific tagged errors
*
* @category error handling
* @since 4.0.0
*/
var catchCause$1 = /*#__PURE__*/ dual(2, (self, onError) => fromBuildUnsafe((memoMap, scope) => catchCause$2(self.build(memoMap, scope), (cause) => onError(cause).build(memoMap, scope))));
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0-rc.112/node_modules/effect/dist/ExecutionPlan.js
/**
* Context reference containing metadata for the currently running
* execution-plan attempt.
*
* **When to use**
*
* Use to read the active plan step and attempt while code is running under an
* execution plan.
*
* @category services
* @since 4.0.0
*/
var CurrentMetadata$1 = /*#__PURE__*/ Reference("effect/ExecutionPlan/CurrentMetadata", { defaultValue: /*#__PURE__*/ constant({
	attempt: 0,
	stepIndex: 0
}) });
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0-rc.112/node_modules/effect/dist/Clock.js
/**
* Context reference for the active time service in the environment.
*
* **When to use**
*
* Use when you need to access or provide the full time service, including sleep
* operations, rather than a single timestamp accessor.
*
* **Example** (Accessing the Clock service)
*
* ```ts import.meta.vitest
* import { Clock, Effect } from "effect"
*
* const testClock: Clock.Clock = {
*   currentTimeMillisUnsafe: () => 1_000,
*   currentTimeMillis: Effect.succeed(1_000),
*   monotonicTimeNanosUnsafe: () => 1_000_000_000n,
*   monotonicTimeNanos: Effect.succeed(1_000_000_000n),
*   currentTimeNanosUnsafe: () => 1_000_000_000n,
*   currentTimeNanos: Effect.succeed(1_000_000_000n),
*   sleep: () => Effect.void
* }
*
* const program = Effect.gen(function*() {
*   const clock = yield* Clock.Clock
*   return clock.currentTimeMillisUnsafe()
* })
*
* await Effect.runPromise(Effect.provideService(program, Clock.Clock, testClock)) // => 1_000
* ```
*
* @see {@link clockWith} for using the current Clock service inside an effect
* @see {@link currentTimeMillis} for reading the current time in milliseconds
* @see {@link currentTimeNanos} for reading the current time in nanoseconds
*
* @category services
* @since 2.0.0
*/
var Clock = ClockRef;
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0-rc.112/node_modules/effect/dist/internal/dateTime.js
/** @internal */
var TypeId$4 = "~effect/time/DateTime";
/** @internal */
var TimeZoneTypeId = "~effect/time/DateTime/TimeZone";
var Proto = {
	[TypeId$4]: TypeId$4,
	pipe() {
		return pipeArguments(this, arguments);
	},
	[NodeInspectSymbol]() {
		return this.toString();
	},
	toJSON() {
		return toDateUtc(this).toJSON();
	}
};
var ProtoUtc = {
	...Proto,
	_tag: "Utc",
	[symbol$1]() {
		return number(this.epochMilliseconds);
	},
	[symbol](that) {
		return isDateTime(that) && that._tag === "Utc" && this.epochMilliseconds === that.epochMilliseconds;
	},
	toString() {
		return `DateTime.Utc(${toDateUtc(this).toJSON()})`;
	}
};
var ProtoZoned = {
	...Proto,
	_tag: "Zoned",
	[symbol$1]() {
		return combine(number(this.epochMilliseconds))(hash(this.zone));
	},
	[symbol](that) {
		return isDateTime(that) && that._tag === "Zoned" && this.epochMilliseconds === that.epochMilliseconds && equals$2(this.zone, that.zone);
	},
	toString() {
		return `DateTime.Zoned(${formatIsoZoned(this)})`;
	}
};
var ProtoTimeZone = {
	[TimeZoneTypeId]: TimeZoneTypeId,
	[NodeInspectSymbol]() {
		return this.toString();
	}
};
var ProtoTimeZoneNamed = {
	...ProtoTimeZone,
	_tag: "Named",
	[symbol$1]() {
		return string(`Named:${this.id}`);
	},
	[symbol](that) {
		return isTimeZone(that) && that._tag === "Named" && this.id === that.id;
	},
	toString() {
		return `TimeZone.Named(${this.id})`;
	},
	toJSON() {
		return {
			_id: "TimeZone",
			_tag: "Named",
			id: this.id
		};
	}
};
var ProtoTimeZoneOffset = {
	...ProtoTimeZone,
	_tag: "Offset",
	[symbol$1]() {
		return string(`Offset:${this.offset}`);
	},
	[symbol](that) {
		return isTimeZone(that) && that._tag === "Offset" && this.offset === that.offset;
	},
	toString() {
		return `TimeZone.Offset(${offsetToString(this.offset)})`;
	},
	toJSON() {
		return {
			_id: "TimeZone",
			_tag: "Offset",
			offset: this.offset
		};
	}
};
/** @internal */
var makeZonedProto = (epochMillis, zone, partsUtc) => {
	const self = Object.create(ProtoZoned);
	self.epochMilliseconds = epochMillis;
	self.zone = zone;
	Object.defineProperty(self, "partsUtc", {
		value: partsUtc,
		enumerable: false,
		writable: true
	});
	Object.defineProperty(self, "adjustedEpochMillis", {
		value: void 0,
		enumerable: false,
		writable: true
	});
	Object.defineProperty(self, "partsAdjusted", {
		value: void 0,
		enumerable: false,
		writable: true
	});
	return self;
};
/** @internal */
var isDateTime = (u) => hasProperty(u, TypeId$4);
var isDateTimeArgs = (args) => isDateTime(args[0]);
/** @internal */
var isTimeZone = (u) => hasProperty(u, TimeZoneTypeId);
/** @internal */
var isTimeZoneOffset = (u) => isTimeZone(u) && u._tag === "Offset";
/** @internal */
var isTimeZoneNamed = (u) => isTimeZone(u) && u._tag === "Named";
/** @internal */
var isUtc = (self) => self._tag === "Utc";
/** @internal */
var isZoned = (self) => self._tag === "Zoned";
/** @internal */
var Equivalence$1 = /*#__PURE__*/ make$10((a, b) => a.epochMilliseconds === b.epochMilliseconds);
/** @internal */
var Order$1 = /*#__PURE__*/ make$8((self, that) => self.epochMilliseconds < that.epochMilliseconds ? -1 : self.epochMilliseconds > that.epochMilliseconds ? 1 : 0);
var makeUtc = (epochMillis) => {
	const self = Object.create(ProtoUtc);
	self.epochMilliseconds = epochMillis;
	Object.defineProperty(self, "partsUtc", {
		value: void 0,
		enumerable: false,
		writable: true
	});
	return self;
};
/** @internal */
var fromDateUnsafe = (date) => {
	const epochMillis = date.getTime();
	if (Number.isNaN(epochMillis)) throw new IllegalArgumentError("Invalid date");
	return makeUtc(epochMillis);
};
/** @internal */
var makeUnsafe = (input) => {
	if (isDateTime(input)) return input;
	else if (input instanceof Date) return fromDateUnsafe(input);
	else if (typeof input === "object") {
		if ("epochMilliseconds" in input) return fromDateUnsafe(new Date(input.epochMilliseconds));
		const date = /* @__PURE__ */ new Date(0);
		setPartsDate(date, input);
		return fromDateUnsafe(date);
	} else if (typeof input === "string" && !hasZone(input)) return fromDateUnsafe(/* @__PURE__ */ new Date(input + "Z"));
	return fromDateUnsafe(new Date(input));
};
/**
* Detects whether a date string already contains timezone info.
* Without a zone, `new Date("2024-01-01T12:00:00")` is parsed as local time,
* so `makeUnsafe` appends "Z" to force UTC interpretation.
* This check prevents appending "Z" to strings that already have a zone
* (e.g. "2024-01-01T12:00:00Z", "...+05:30", "...GMT"), which would produce invalid dates.
*/
var hasZone = (input) => /Z|GMT|[+-]\d{2}$|[+-]\d{2}:?\d{2}$|\]$/.test(input);
var minEpochMillis = -864e13 + 432e5;
var maxEpochMillis = 864e13 - 504e5;
/** @internal */
var makeZonedUnsafe = (input, options) => {
	let timeZoneOption = options?.timeZone;
	if (timeZoneOption === void 0 && isDateTime(input) && isZoned(input)) return input;
	const self = makeUnsafe(input);
	if (self.epochMilliseconds < minEpochMillis || self.epochMilliseconds > maxEpochMillis) throw new RangeError(`Epoch millis out of range: ${self.epochMilliseconds}`);
	if (timeZoneOption === void 0 && typeof input === "object" && "timeZoneId" in input) timeZoneOption = input.timeZoneId;
	let zone;
	if (timeZoneOption === void 0) zone = zoneMakeOffset(new Date(self.epochMilliseconds).getTimezoneOffset() * -60 * 1e3);
	else if (isTimeZone(timeZoneOption)) zone = timeZoneOption;
	else if (typeof timeZoneOption === "number") zone = zoneMakeOffset(timeZoneOption);
	else {
		const parsedZone = zoneFromString(timeZoneOption);
		if (isNone(parsedZone)) throw new IllegalArgumentError(`Invalid time zone: ${timeZoneOption}`);
		zone = parsedZone.value;
	}
	if (options?.adjustForTimeZone !== true) return makeZonedProto(self.epochMilliseconds, zone, self.partsUtc);
	return makeZonedFromAdjusted(self.epochMilliseconds, zone, options?.disambiguation ?? "compatible");
};
/** @internal */
var makeZoned = /*#__PURE__*/ liftThrowable(makeZonedUnsafe);
/** @internal */
var make$2 = /*#__PURE__*/ liftThrowable(makeUnsafe);
var zonedStringRegExp = /^(.{17,35})\[(.+)\]$/;
/** @internal */
var makeZonedFromString = (input) => {
	const match = zonedStringRegExp.exec(input);
	if (match === null) {
		const offset = parseOffset(input);
		return offset !== null ? makeZoned(input, { timeZone: offset }) : none();
	}
	const [, isoString, timeZone] = match;
	return makeZoned(isoString, { timeZone });
};
/** @internal */
var toUtc = (self) => makeUtc(self.epochMilliseconds);
var validZoneCache = /*#__PURE__*/ new Map();
var formatOptions = {
	day: "numeric",
	month: "numeric",
	year: "numeric",
	hour: "numeric",
	minute: "numeric",
	second: "numeric",
	timeZoneName: "longOffset",
	fractionalSecondDigits: 3,
	hourCycle: "h23"
};
var zoneMakeIntl = (format) => {
	const zoneId = format.resolvedOptions().timeZone;
	if (validZoneCache.has(zoneId)) return validZoneCache.get(zoneId);
	const zone = Object.create(ProtoTimeZoneNamed);
	zone.id = zoneId;
	zone.format = format;
	validZoneCache.set(zoneId, zone);
	return zone;
};
/** @internal */
var zoneMakeNamedUnsafe = (zoneId) => {
	if (validZoneCache.has(zoneId)) return validZoneCache.get(zoneId);
	try {
		return zoneMakeIntl(new Intl.DateTimeFormat("en-US", {
			...formatOptions,
			timeZone: zoneId
		}));
	} catch {
		throw new IllegalArgumentError(`Invalid time zone: ${zoneId}`);
	}
};
/** @internal */
var zoneMakeOffset = (offset) => {
	const zone = Object.create(ProtoTimeZoneOffset);
	zone.offset = offset;
	return zone;
};
/** @internal */
var zoneMakeNamed = /*#__PURE__*/ liftThrowable(zoneMakeNamedUnsafe);
var offsetZoneRegExp = /^(?:GMT|[+-])/;
/** @internal */
var zoneFromString = (zone) => {
	if (offsetZoneRegExp.test(zone)) {
		const offset = parseOffset(zone);
		return offset === null ? none() : some(zoneMakeOffset(offset));
	}
	return zoneMakeNamed(zone);
};
/** @internal */
var zoneToString = (self) => {
	if (self._tag === "Offset") return offsetToString(self.offset);
	return self.id;
};
/** @internal */
var toDateUtc = (self) => new Date(self.epochMilliseconds);
/** @internal */
var toDate = (self) => {
	if (self._tag === "Utc") return new Date(self.epochMilliseconds);
	else if (self.zone._tag === "Offset") return new Date(self.epochMilliseconds + self.zone.offset);
	else if (self.adjustedEpochMilliseconds !== void 0) return new Date(self.adjustedEpochMilliseconds);
	const parts = self.zone.format.formatToParts(self.epochMilliseconds).filter((_) => _.type !== "literal");
	const date = /* @__PURE__ */ new Date(0);
	date.setUTCFullYear(Number(parts[2].value), Number(parts[0].value) - 1, Number(parts[1].value));
	date.setUTCHours(Number(parts[3].value), Number(parts[4].value), Number(parts[5].value), Number(parts[6].value));
	self.adjustedEpochMilliseconds = date.getTime();
	return date;
};
/** @internal */
var zonedOffset = (self) => {
	return toDate(self).getTime() - toEpochMillis(self);
};
var offsetToString = (offset) => {
	const abs = Math.abs(offset);
	let hours = Math.floor(abs / 36e5);
	let minutes = Math.round(abs % 36e5 / 6e4);
	if (minutes === 60) {
		hours += 1;
		minutes = 0;
	}
	return `${offset < 0 ? "-" : "+"}${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
};
/** @internal */
var zonedOffsetIso = (self) => offsetToString(zonedOffset(self));
/** @internal */
var toEpochMillis = (self) => self.epochMilliseconds;
var setPartsDate = (date, parts) => {
	if (parts.year !== void 0) date.setUTCFullYear(parts.year);
	if (parts.month !== void 0) date.setUTCMonth(parts.month - 1);
	if (parts.day !== void 0) date.setUTCDate(parts.day);
	if (parts.weekDay !== void 0) {
		const diff = parts.weekDay - date.getUTCDay();
		date.setUTCDate(date.getUTCDate() + diff);
	}
	if (parts.hour !== void 0) date.setUTCHours(parts.hour);
	if (parts.minute !== void 0) date.setUTCMinutes(parts.minute);
	if (parts.second !== void 0) date.setUTCSeconds(parts.second);
	if (parts.millisecond !== void 0) date.setUTCMilliseconds(parts.millisecond);
};
var constDayMillis = 864e5;
var makeZonedFromAdjusted = (adjustedMillis, zone, disambiguation) => {
	if (zone._tag === "Offset") return makeZonedProto(adjustedMillis - zone.offset, zone);
	const beforeOffset = calculateNamedOffset(adjustedMillis - constDayMillis, adjustedMillis, zone);
	const afterOffset = calculateNamedOffset(adjustedMillis + constDayMillis, adjustedMillis, zone);
	if (beforeOffset === afterOffset) return makeZonedProto(adjustedMillis - beforeOffset, zone);
	const isForwards = beforeOffset < afterOffset;
	const transitionMillis = beforeOffset - afterOffset;
	if (isForwards) {
		if (calculateNamedOffset(adjustedMillis - afterOffset, adjustedMillis, zone) === afterOffset) return makeZonedProto(adjustedMillis - afterOffset, zone);
		const before = makeZonedProto(adjustedMillis - beforeOffset, zone);
		if (adjustedMillis !== toDate(before).getTime()) switch (disambiguation) {
			case "reject": {
				const formatted = new Date(adjustedMillis).toISOString();
				throw new RangeError(`Gap time: ${formatted} does not exist in time zone ${zone.id}`);
			}
			case "earlier": return makeZonedProto(adjustedMillis - afterOffset, zone);
			case "compatible":
			case "later": return before;
		}
		return before;
	}
	if (calculateNamedOffset(adjustedMillis - beforeOffset, adjustedMillis, zone) === beforeOffset) {
		if (disambiguation === "earlier" || disambiguation === "compatible") return makeZonedProto(adjustedMillis - beforeOffset, zone);
		if (calculateNamedOffset(adjustedMillis - beforeOffset + transitionMillis, adjustedMillis + transitionMillis, zone) === beforeOffset) return makeZonedProto(adjustedMillis - beforeOffset, zone);
		if (disambiguation === "reject") {
			const formatted = new Date(adjustedMillis).toISOString();
			throw new RangeError(`Ambiguous time: ${formatted} occurs twice in time zone ${zone.id}`);
		}
	}
	return makeZonedProto(adjustedMillis - afterOffset, zone);
};
var offsetRegExp = /([+-])(\d{2}):(\d{2})$/;
var parseOffset = (offset) => {
	const match = offsetRegExp.exec(offset);
	if (match === null) return null;
	const [, sign, hours, minutes] = match;
	return (sign === "+" ? 1 : -1) * (Number(hours) * 60 + Number(minutes)) * 60 * 1e3;
};
var calculateNamedOffset = (utcMillis, adjustedMillis, zone) => {
	const offset = zone.format.formatToParts(utcMillis).find((_) => _.type === "timeZoneName")?.value ?? "";
	if (offset === "GMT") return 0;
	const result = parseOffset(offset);
	if (result === null) return zonedOffset(makeZonedProto(adjustedMillis, zone));
	return result;
};
/** @internal */
var mutate = /*#__PURE__*/ dual(isDateTimeArgs, (self, f, options) => {
	if (self._tag === "Utc") {
		const date = toDateUtc(self);
		f(date);
		return makeUtc(date.getTime());
	}
	const adjustedDate = toDate(self);
	const newAdjustedDate = new Date(adjustedDate.getTime());
	f(newAdjustedDate);
	return makeZonedFromAdjusted(newAdjustedDate.getTime(), self.zone, options?.disambiguation ?? "compatible");
});
/** @internal */
var formatIso = (self) => toDateUtc(self).toISOString();
/** @internal */
var formatIsoOffset = (self) => {
	const date = toDate(self);
	return self._tag === "Utc" ? date.toISOString() : `${date.toISOString().slice(0, -1)}${zonedOffsetIso(self)}`;
};
/** @internal */
var formatIsoZoned = (self) => self.zone._tag === "Offset" ? formatIsoOffset(self) : `${formatIsoOffset(self)}[${self.zone.id}]`;
globalThis.Number;
/**
* Order instance for `number` values.
*
* **When to use**
*
* Use when you need to sort or compare numbers through APIs that accept an
* ordering instance.
*
* **Example** (Comparing numbers)
*
* ```ts import.meta.vitest
* import { Number } from "effect"
*
* Number.Order(1, 2) // => -1
* Number.Order(2, 1) // => 1
* Number.Order(1, 1) // => 0
* ```
*
* @category instances
* @since 2.0.0
*/
var Order = Number$2;
/**
* Returns the remainder left over when one operand is divided by a second operand, always taking the sign of the dividend.
*
* **When to use**
*
* Use to compute a numeric remainder while preserving decimal precision better
* than direct JavaScript `%` for decimal operands.
*
* **Example** (Calculating remainders)
*
* ```ts import.meta.vitest
* import { Number } from "effect"
*
* Number.remainder(2, 2) // => 0
* Number.remainder(3, 2) // => 1
* Number.remainder(-4, 2) // => -0
* ```
*
* @see {@link divide} for quotient calculation with division-by-zero represented as `Option.none`
*
* @category math
* @since 2.0.0
*/
var remainder = /*#__PURE__*/ dual(2, (self, divisor) => {
	const selfString = self.toString();
	const divisorString = divisor.toString();
	if (selfString.includes("e") || divisorString.includes("e")) {
		if (!globalThis.Number.isFinite(self) || !globalThis.Number.isFinite(divisor) || divisor === 0) return NaN;
		return remainderWithScientificNotation(self, divisor);
	}
	const selfDecCount = (selfString.split(".")[1] || "").length;
	const divisorDecCount = (divisorString.split(".")[1] || "").length;
	const decCount = selfDecCount > divisorDecCount ? selfDecCount : divisorDecCount;
	return parseInt(self.toFixed(decCount).replace(".", "")) % parseInt(divisor.toFixed(decCount).replace(".", "")) / Math.pow(10, decCount);
});
function remainderWithScientificNotation(self, divisor) {
	const [selfCoefficient, selfExponent] = toScientificInteger(self);
	const [divisorCoefficient, divisorExponent] = toScientificInteger(divisor);
	const exponent = Math.min(selfExponent, divisorExponent);
	const out = selfCoefficient * BigInt(10) ** BigInt(selfExponent - exponent) % (divisorCoefficient * BigInt(10) ** BigInt(divisorExponent - exponent));
	if (out === BigInt(0)) return self < 0 || Object.is(self, -0) ? -0 : 0;
	const remainder = globalThis.Number(`${out}e${exponent}`);
	return remainder === 0 ? Math.sign(self) * globalThis.Number.MIN_VALUE : remainder;
}
function toScientificInteger(n) {
	const scientific = Math.abs(n).toExponential();
	const eIndex = scientific.indexOf("e");
	const digits = scientific.slice(0, eIndex).replace(".", "");
	return [BigInt(digits) * (n < 0 ? -BigInt(1) : BigInt(1)), globalThis.Number(scientific.slice(eIndex + 1)) - digits.length + 1];
}
/**
* Returns the next power of 2 from the given number.
*
* **When to use**
*
* Use to round a number up to the next power of two.
*
* **Example** (Finding the next power of two)
*
* ```ts import.meta.vitest
* import { Number } from "effect"
*
* Number.nextPow2(5) // => 8
* Number.nextPow2(17) // => 32
* ```
*
* @category math
* @since 2.0.0
*/
var nextPow2 = (n) => {
	const nextPow = Math.ceil(Math.log(n) / Math.log(2));
	return Math.max(Math.pow(2, nextPow), 2);
};
/**
* Reducer for reducing `number`s by keeping the maximum value.
*
* **When to use**
*
* Use to keep the largest number through APIs that consume a `Reducer`.
*
* **Details**
*
* The reducer starts from `-Infinity`, so reducing an empty collection returns
* `-Infinity`.
*
* **Gotchas**
*
* `NaN` values propagate through `Math.max`.
*
* @see {@link ReducerMin} for keeping the smallest number
* @see {@link max} for comparing two numbers directly
*
* @category math
* @since 4.0.0
*/
var ReducerMax = /*#__PURE__*/ make$11((a, b) => Math.max(a, b), -Infinity);
/**
* Reducer for reducing `number`s by keeping the minimum value.
*
* **When to use**
*
* Use to keep the smallest number through APIs that consume a `Reducer`.
*
* **Details**
*
* The reducer starts from `Infinity`, so reducing an empty collection returns
* `Infinity`.
*
* **Gotchas**
*
* `NaN` values propagate through `Math.min`.
*
* @see {@link ReducerMax} for keeping the largest number
* @see {@link min} for comparing two numbers directly
*
* @category math
* @since 4.0.0
*/
var ReducerMin = /*#__PURE__*/ make$11((a, b) => Math.min(a, b), Infinity);
globalThis.String;
/**
* Checks whether a value is a `string`.
*
* **Example** (Checking for strings)
*
* ```ts import.meta.vitest
* import { String } from "effect"
*
* String.isString("a") // => true
* String.isString(1) // => false
* ```
*
* @category guards
* @since 2.0.0
*/
var isString = isString$1;
/**
* Converts a string to lowercase.
*
* **Example** (Converting strings to lowercase)
*
* ```ts import.meta.vitest
* import { pipe, String } from "effect"
*
* pipe("A", String.toLowerCase) // => "a"
* String.toLowerCase("HELLO") // => "hello"
* ```
*
* @category transforming
* @since 2.0.0
*/
var toLowerCase = (self) => self.toLowerCase();
/**
* Removes whitespace from both ends of a string.
*
* **Example** (Trimming whitespace)
*
* ```ts import.meta.vitest
* import { String } from "effect"
*
* String.trim(" a ") // => "a"
* String.trim("  hello world  ") // => "hello world"
* ```
*
* @category transforming
* @since 2.0.0
*/
var trim = (self) => self.trim();
/**
* Checks whether a `string` is non-empty.
*
* **Example** (Checking for non-empty strings)
*
* ```ts import.meta.vitest
* import { String } from "effect"
*
* String.isNonEmpty("") // => false
* String.isNonEmpty("a") // => true
* ```
*
* @category predicates
* @since 2.0.0
*/
var isNonEmpty = (self) => self.length > 0;
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0-rc.112/node_modules/effect/dist/Cron.js
/**
* Utilities for recurring calendar schedules written as cron expressions or
* explicit field constraints. A `Cron` value stores allowed seconds, minutes,
* hours, days of month, months, weekdays, and an optional time zone. The module
* can create or parse schedules, compare them, test whether a date matches, and
* find previous or next scheduled occurrences.
*
* @since 2.0.0
*/
var TypeId$3 = "~effect/time/Cron";
function toPojo(cron) {
	return {
		tz: cron.tz,
		and: cron.and,
		seconds: fromIterable(cron.seconds),
		minutes: fromIterable(cron.minutes),
		hours: fromIterable(cron.hours),
		days: fromIterable(cron.days),
		months: fromIterable(cron.months),
		weekdays: fromIterable(cron.weekdays)
	};
}
var CronProto = {
	[TypeId$3]: TypeId$3,
	[symbol](that) {
		return isCron(that) && equals(this, that);
	},
	[symbol$1]() {
		return pipe(hash(this.tz), combine(hash(this.and)), combine(array(fromIterable(this.seconds))), combine(array(fromIterable(this.minutes))), combine(array(fromIterable(this.hours))), combine(array(fromIterable(this.days))), combine(array(fromIterable(this.months))), combine(array(fromIterable(this.weekdays))));
	},
	toObject() {
		return toPojo(this);
	},
	toString() {
		return `Cron(${format$1(toPojo(this))})`;
	},
	toJSON() {
		const out = toPojo(this);
		out["_id"] = "Cron";
		return out;
	},
	[NodeInspectSymbol]() {
		return this.toJSON();
	},
	pipe() {
		return pipeArguments(this, arguments);
	}
};
/**
* Checks whether a given value is a Cron instance.
*
* **When to use**
*
* Use to narrow an unknown value before treating it as a `Cron` schedule.
*
* **Details**
*
* This function is a type guard that determines whether the provided
* value is a valid Cron instance by checking for the presence of the
* Cron type identifier.
*
* **Example** (Checking cron values)
*
* ```ts import.meta.vitest
* import { Cron } from "effect"
*
* const cron = Cron.make({
*   minutes: [0],
*   hours: [9],
*   days: [1, 15],
*   months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
*   weekdays: [1, 2, 3, 4, 5]
* })
*
* Cron.isCron(cron) // => true
* Cron.isCron({}) // => false
* Cron.isCron("not a cron") // => false
* ```
*
* @see {@link make} for constructing a `Cron` value directly
* @see {@link parse} for constructing a `Cron` value from a string
*
* @category guards
* @since 2.0.0
*/
var isCron = (u) => hasProperty(u, TypeId$3);
/**
* Creates a Cron instance from time constraints.
*
* **When to use**
*
* Use to build a cron schedule from explicit sets of allowed time-field values.
*
* **Details**
*
* Constructs a cron schedule by specifying which seconds, minutes, hours,
* days, months, and weekdays the schedule should match. Empty arrays leave a
* time unit unrestricted. If only days or weekdays are restricted, that field
* must match. When both are restricted, the default matches either field; set
* `and: true` to require both fields to match. Weekdays range from `0` (Sunday)
* to `7` (also Sunday). The constructor throws a `RangeError` when a field
* contains a non-integer or out-of-range value.
*
* **Example** (Creating schedules from constraints)
*
* ```ts import.meta.vitest
* import { Cron, DateTime } from "effect"
*
* const utc = DateTime.zoneMakeNamedUnsafe("UTC")
*
* // Every day at midnight
* const midnight = Cron.make({
*   minutes: [0],
*   hours: [0],
*   days: [
*     1,
*     2,
*     3,
*     4,
*     5,
*     6,
*     7,
*     8,
*     9,
*     10,
*     11,
*     12,
*     13,
*     14,
*     15,
*     16,
*     17,
*     18,
*     19,
*     20,
*     21,
*     22,
*     23,
*     24,
*     25,
*     26,
*     27,
*     28,
*     29,
*     30,
*     31
*   ],
*   months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
*   weekdays: [0, 1, 2, 3, 4, 5, 6],
*   tz: utc
* })
*
* // Every 15 minutes during business hours on weekdays
* const businessHours = Cron.make({
*   minutes: [0, 15, 30, 45],
*   hours: [9, 10, 11, 12, 13, 14, 15, 16, 17],
*   days: [],
*   months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
*   weekdays: [1, 2, 3, 4, 5], // Monday to Friday
*   tz: utc
* })
*
* Cron.match(midnight, "2024-01-01T00:00:00Z") // => true
* Cron.match(businessHours, "2024-01-01T09:15:00Z") // => true
* ```
*
* @see {@link parse} for building a schedule from a cron expression string
*
* @category constructors
* @since 2.0.0
*/
var make$1 = (values) => {
	const o = Object.create(CronProto);
	o.seconds = restrictions.seconds(values.seconds ?? [0]);
	o.minutes = restrictions.minutes(values.minutes);
	o.hours = restrictions.hours(values.hours);
	o.days = restrictions.days(values.days);
	o.months = restrictions.months(values.months);
	o.weekdays = restrictions.weekdays(values.weekdays);
	o.and = values.and === true;
	o.tz = fromUndefinedOr(values.tz);
	const seconds = Array.from(o.seconds);
	const minutes = Array.from(o.minutes);
	const hours = Array.from(o.hours);
	const days = Array.from(o.days);
	const months = Array.from(o.months);
	const weekdays = Array.from(o.weekdays);
	o.first = {
		second: seconds[0] ?? 0,
		minute: minutes[0] ?? 0,
		hour: hours[0] ?? 0,
		day: days[0] ?? 1,
		month: (months[0] ?? 1) - 1,
		weekday: weekdays[0] ?? 0
	};
	o.last = {
		second: seconds[seconds.length - 1] ?? 59,
		minute: minutes[minutes.length - 1] ?? 59,
		hour: hours[hours.length - 1] ?? 23,
		day: days[days.length - 1] ?? 31,
		month: (months[months.length - 1] ?? 12) - 1,
		weekday: weekdays[weekdays.length - 1] ?? 6
	};
	o.next = {
		second: lookup.next.second(seconds),
		minute: lookup.next.minute(minutes),
		hour: lookup.next.hour(hours),
		day: lookup.next.day(days),
		month: lookup.next.month(months),
		weekday: lookup.next.weekday(weekdays)
	};
	o.prev = {
		second: lookup.prev.second(seconds),
		minute: lookup.prev.minute(minutes),
		hour: lookup.prev.hour(hours),
		day: lookup.prev.day(days),
		month: lookup.prev.month(months),
		weekday: lookup.prev.weekday(weekdays)
	};
	return o;
};
var makeRestrictions = (field, min, max, normalize = (value) => value) => (values) => {
	const restrictions = [];
	for (const value of values) {
		if (!Number.isInteger(value) || value < min || value > max) throw new RangeError(`${field} must contain only integers between ${min} and ${max}`);
		restrictions.push(normalize(value));
	}
	return new Set(sort(restrictions, Order));
};
var restrictions = {
	seconds: /*#__PURE__*/ makeRestrictions("seconds", 0, 59),
	minutes: /*#__PURE__*/ makeRestrictions("minutes", 0, 59),
	hours: /*#__PURE__*/ makeRestrictions("hours", 0, 23),
	days: /*#__PURE__*/ makeRestrictions("days", 1, 31),
	months: /*#__PURE__*/ makeRestrictions("months", 1, 12),
	weekdays: /*#__PURE__*/ makeRestrictions("weekdays", 0, 7, (value) => value === 7 ? 0 : value)
};
var makeLookupTable = (size, dir) => (values) => {
	const result = new Array(size).fill(void 0);
	if (values.length === 0) return result;
	let current = void 0;
	if (dir === "next") {
		let index = values.length - 1;
		for (let i = size - 1; i >= 0; i--) {
			while (index >= 0 && values[index] >= i) current = values[index--];
			result[i] = current;
		}
	} else {
		let index = 0;
		for (let i = 0; i < size; i++) {
			while (index < values.length && values[index] <= i) current = values[index++];
			result[i] = current;
		}
	}
	return result;
};
var lookup = {
	prev: {
		second: /*#__PURE__*/ makeLookupTable(60, "prev"),
		minute: /*#__PURE__*/ makeLookupTable(60, "prev"),
		hour: /*#__PURE__*/ makeLookupTable(24, "prev"),
		day: /*#__PURE__*/ makeLookupTable(32, "prev"),
		month: /*#__PURE__*/ makeLookupTable(13, "prev"),
		weekday: /*#__PURE__*/ makeLookupTable(7, "prev")
	},
	next: {
		second: /*#__PURE__*/ makeLookupTable(60, "next"),
		minute: /*#__PURE__*/ makeLookupTable(60, "next"),
		hour: /*#__PURE__*/ makeLookupTable(24, "next"),
		day: /*#__PURE__*/ makeLookupTable(32, "next"),
		month: /*#__PURE__*/ makeLookupTable(13, "next"),
		weekday: /*#__PURE__*/ makeLookupTable(7, "next")
	}
};
var CronParseErrorTypeId = "~effect/time/Cron/CronParseError";
/**
* Represents an error that occurs when parsing a cron expression fails.
*
* **When to use**
*
* Use to handle invalid cron expression failures returned by `parse`.
*
* **Details**
*
* This error provides information about what went wrong during parsing,
* including the error message and optionally the input that caused the error.
*
* **Example** (Handling cron parse failures)
*
* ```ts import.meta.vitest
* import { Cron, Result } from "effect"
*
* const expected = Result.fail(new Cron.CronParseError({
*   message: "Invalid number of segments in cron expression",
*   input: "invalid expression"
* }))
*
* Cron.parse("invalid expression") // => expected
* ```
*
* @see {@link parse} for the parser that returns this error in `Result.fail`
* @see {@link isCronParseError} for narrowing unknown values to this error type
*
* @category errors
* @since 4.0.0
*/
var CronParseError = class extends (/*#__PURE__*/ TaggedError("CronParseError")) {
	[CronParseErrorTypeId] = CronParseErrorTypeId;
};
/**
* Parses a cron expression safely into a `Cron` instance, returning a `Result`
* instead of throwing.
*
* **When to use**
*
* Use to parse cron expressions from configuration or user input while handling
* invalid input as a `Result`.
*
* **Details**
*
* The expression may contain five fields, where seconds default to `0`, or six
* fields including seconds. Fields support `*`, comma-separated values, ranges,
* steps, and month or weekday aliases. Invalid expressions fail with
* `CronParseError`. When both the day-of-month and weekday fields are
* restricted, a date matches if either field matches. When either field starts
* with `*`, both fields must match; an unrestricted field always matches.
*
* **Example** (Parsing cron expressions)
*
* ```ts import.meta.vitest
* import { Cron, Result } from "effect"
*
* // At 04:00 on every day-of-month from 8 through 14.
* const cron = Result.getOrThrow(Cron.parse("0 0 4 8-14 * *"))
*
* Array.from(cron.hours) // => [4]
* Array.from(cron.days) // => [8, 9, 10, 11, 12, 13, 14]
* ```
*
* @see {@link parseUnsafe} for throwing on invalid cron expressions
* @see {@link make} for constructing a schedule from explicit field constraints
*
* @category constructors
* @since 2.0.0
*/
var parse = (cron, tz) => {
	const segments = cron.trim().split(/\s+/).filter(isNonEmpty);
	if (segments.length !== 5 && segments.length !== 6) return fail$5(new CronParseError({
		message: `Invalid number of segments in cron expression`,
		input: cron
	}));
	if (segments.length === 5) segments.unshift("0");
	const [seconds, minutes, hours, days, months, weekdays] = segments;
	return all$2({
		tz: tz === void 0 || isTimeZone(tz) ? succeed$5(tz) : fromOption$2(zoneFromString(tz), () => new CronParseError({
			message: `Invalid time zone in cron expression`,
			input: tz
		})),
		seconds: parseSegment(seconds, secondOptions),
		minutes: parseSegment(minutes, minuteOptions),
		hours: parseSegment(hours, hourOptions),
		days: parseSegment(days, dayOptions),
		months: parseSegment(months, monthOptions),
		weekdays: parseSegment(weekdays, weekdayOptions)
	}).pipe(map$6(({ tz, seconds, minutes, hours, days, months, weekdays }) => make$1({
		tz,
		seconds: seconds.values,
		minutes: minutes.values,
		hours: hours.values,
		days: days.values,
		months: months.values,
		weekdays: weekdays.values,
		and: (days.wildcard || weekdays.wildcard) && days.values.size !== 0 && weekdays.values.size !== 0
	})));
};
var daysInMonth = (date) => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
/**
* Returns the next scheduled date/time for the given Cron instance.
*
* **When to use**
*
* Use to find the next occurrence of a cron schedule after a specific date/time
* or after the current time.
*
* **Details**
*
* Searches for the next date and time when the cron schedule should trigger,
* starting after the specified date/time or after the current time when no
* date is provided.
*
* **Example** (Finding the next occurrence)
*
* ```ts import.meta.vitest
* import { Cron, Result } from "effect"
*
* const cron = Result.getOrThrow(Cron.parse("0 0 4 8-14 * *", "UTC"))
*
* // Get next run after a specific date
* Cron.next(cron, "2021-01-01T00:00:00Z").toISOString() // => "2021-01-08T04:00:00.000Z"
* ```
*
* @see {@link prev} for finding the previous scheduled occurrence
* @see {@link sequence} for iterating future scheduled occurrences
*
* @category getters
* @since 2.0.0
*/
var next = (cron, now) => {
	return stepCron(cron, now, "next");
};
var stepCron = (cron, now, direction) => {
	const tz = getOrUndefined$1(cron.tz);
	const zoned = makeZonedUnsafe(now ?? /* @__PURE__ */ new Date(), { timeZone: tz });
	const reverse = direction === "prev";
	const tick = reverse ? -1 : 1;
	const table = cron[direction];
	const boundary = reverse ? cron.last : cron.first;
	const needsStep = reverse ? (next, current) => next < current : (next, current) => next > current;
	const adjustDst = tz !== void 0 && isTimeZoneNamed(tz) && tz.id === "UTC" ? constVoid : (current) => {
		const adjusted = makeZonedUnsafe(current, {
			timeZone: zoned.zone,
			adjustForTimeZone: true,
			disambiguation: reverse ? "later" : void 0
		}).pipe(toDate);
		const drift = current.getTime() - adjusted.getTime();
		if (reverse ? drift !== 0 : drift > 0) current.setTime(reverse ? adjusted.getTime() : current.getTime() + drift);
	};
	return toDateUtc(mutate(zoned, (current) => {
		current.setUTCSeconds(current.getUTCSeconds() + tick, 0);
		for (let i = 0; i < 1e4; i++) {
			if (cron.seconds.size !== 0) {
				const currentSecond = current.getUTCSeconds();
				const nextSecond = table.second[currentSecond];
				if (nextSecond === void 0) {
					current.setUTCMinutes(current.getUTCMinutes() + tick, boundary.second);
					adjustDst(current);
					continue;
				}
				if (needsStep(nextSecond, currentSecond)) {
					current.setUTCSeconds(nextSecond);
					adjustDst(current);
					continue;
				}
			}
			if (cron.minutes.size !== 0) {
				const currentMinute = current.getUTCMinutes();
				const nextMinute = table.minute[currentMinute];
				if (nextMinute === void 0) {
					current.setUTCHours(current.getUTCHours() + tick, boundary.minute, boundary.second);
					adjustDst(current);
					continue;
				}
				if (needsStep(nextMinute, currentMinute)) {
					current.setUTCMinutes(nextMinute, boundary.second);
					adjustDst(current);
					continue;
				}
			}
			if (cron.hours.size !== 0) {
				const currentHour = current.getUTCHours();
				const nextHour = table.hour[currentHour];
				if (nextHour === void 0) {
					current.setUTCDate(current.getUTCDate() + tick);
					current.setUTCHours(boundary.hour, boundary.minute, boundary.second);
					adjustDst(current);
					continue;
				}
				if (needsStep(nextHour, currentHour)) {
					current.setUTCHours(nextHour, boundary.minute, boundary.second);
					adjustDst(current);
					continue;
				}
			}
			if (cron.weekdays.size !== 0 || cron.days.size !== 0) {
				if (cron.and) {
					const matchesDay = cron.days.size === 0 || cron.days.has(current.getUTCDate());
					const matchesWeekday = cron.weekdays.size === 0 || cron.weekdays.has(current.getUTCDay());
					if (!matchesDay || !matchesWeekday) {
						current.setUTCDate(current.getUTCDate() + tick);
						current.setUTCHours(boundary.hour, boundary.minute, boundary.second);
						adjustDst(current);
						continue;
					}
				} else {
					let a = reverse ? -Infinity : Infinity;
					let b = reverse ? -Infinity : Infinity;
					if (cron.weekdays.size !== 0) {
						const currentWeekday = current.getUTCDay();
						const nextWeekday = table.weekday[currentWeekday];
						if (nextWeekday === void 0) a = reverse ? boundary.weekday - 7 - currentWeekday : 7 - currentWeekday + boundary.weekday;
						else a = nextWeekday - currentWeekday;
					}
					if (cron.days.size !== 0 && a !== 0) {
						const currentDay = current.getUTCDate();
						const nextDay = table.day[currentDay];
						if (nextDay === void 0) {
							if (reverse) {
								const previous = new Date(current);
								previous.setUTCDate(0);
								let day = table.day[previous.getUTCDate()];
								if (day === void 0) {
									previous.setUTCDate(0);
									day = table.day[previous.getUTCDate()];
								}
								if (day === void 0) throw new Error("Unable to find cron date");
								previous.setUTCDate(day);
								b = (previous.getTime() - current.getTime()) / 864e5;
							} else b = daysInMonth(current) - currentDay + boundary.day;
						} else if (!reverse && nextDay > daysInMonth(current)) b = daysInMonth(current) - currentDay + boundary.day;
						else b = nextDay - currentDay;
					}
					const addDays = reverse ? Math.max(a, b) : Math.min(a, b);
					if (addDays !== 0) {
						current.setUTCDate(current.getUTCDate() + addDays);
						current.setUTCHours(boundary.hour, boundary.minute, boundary.second);
						adjustDst(current);
						continue;
					}
				}
			}
			if (cron.months.size !== 0) {
				const currentMonth = current.getUTCMonth() + 1;
				const nextMonth = table.month[currentMonth];
				const clampBoundaryDay = (targetMonthIndex) => {
					const maxDayInMonth = daysInMonth(new Date(Date.UTC(current.getUTCFullYear(), targetMonthIndex + 1, 0)));
					if (cron.days.size !== 0 && cron.weekdays.size === 0) return reverse ? table.day[maxDayInMonth] ?? maxDayInMonth : boundary.day;
					return reverse ? maxDayInMonth : 1;
				};
				if (nextMonth === void 0) {
					current.setUTCFullYear(current.getUTCFullYear() + tick);
					current.setUTCMonth(boundary.month, clampBoundaryDay(boundary.month));
					current.setUTCHours(boundary.hour, boundary.minute, boundary.second);
					adjustDst(current);
					continue;
				}
				if (needsStep(nextMonth, currentMonth)) {
					const targetMonthIndex = nextMonth - 1;
					current.setUTCMonth(targetMonthIndex, clampBoundaryDay(targetMonthIndex));
					current.setUTCHours(boundary.hour, boundary.minute, boundary.second);
					adjustDst(current);
					continue;
				}
			}
			return;
		}
		throw new Error("Unable to find cron date");
	}));
};
/**
* Equivalence instance for comparing the timezone, field restrictions, and
* day-matching mode of two `Cron` schedules.
*
* **When to use**
*
* Use to compare cron schedules through APIs that accept an equivalence
* relation.
*
* **Details**
*
* This comparison checks the optional timezone, the `and` day-matching mode,
* seconds, minutes, hours, days, months, and weekdays.
*
* **Example** (Comparing schedules with equivalence)
*
* ```ts import.meta.vitest
* import { Cron } from "effect"
*
* const cron1 = Cron.make({
*   minutes: [0, 30],
*   hours: [9],
*   days: [1, 15],
*   months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
*   weekdays: [1, 2, 3, 4, 5]
* })
*
* const cron2 = Cron.make({
*   minutes: [30, 0], // Different order
*   hours: [9],
*   days: [15, 1], // Different order
*   months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
*   weekdays: [1, 2, 3, 4, 5]
* })
*
* Cron.Equivalence(cron1, cron2) // => true
* ```
*
* @see {@link equals} for directly comparing two `Cron` values
*
* @category instances
* @since 2.0.0
*/
var Equivalence = /*#__PURE__*/ make$10((self, that) => equals$2(self.tz, that.tz) && self.and === that.and && restrictionsEquals(self.seconds, that.seconds) && restrictionsEquals(self.minutes, that.minutes) && restrictionsEquals(self.hours, that.hours) && restrictionsEquals(self.days, that.days) && restrictionsEquals(self.months, that.months) && restrictionsEquals(self.weekdays, that.weekdays));
var restrictionsArrayEquals = /*#__PURE__*/ Array_(/*#__PURE__*/ strictEqual());
var restrictionsEquals = (self, that) => restrictionsArrayEquals(fromIterable(self), fromIterable(that));
/**
* Checks whether two `Cron` instances have equal timezone values, field
* restrictions, and day-matching modes.
*
* **When to use**
*
* Use to directly compare two cron schedules, including their timezones and
* day-matching modes.
*
* **Details**
*
* The comparison checks the optional timezone, the `and` day-matching mode,
* seconds, minutes, hours, days, months, and weekdays.
*
* **Example** (Checking schedule equality)
*
* ```ts import.meta.vitest
* import { Cron } from "effect"
*
* const cron1 = Cron.make({
*   minutes: [0],
*   hours: [9],
*   days: [1, 15],
*   months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
*   weekdays: [1, 2, 3, 4, 5]
* })
*
* const cron2 = Cron.make({
*   minutes: [0],
*   hours: [9],
*   days: [1, 15],
*   months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
*   weekdays: [1, 2, 3, 4, 5]
* })
*
* Cron.equals(cron1, cron2) // => true
* Cron.equals(cron1)(cron2) // => true
* ```
*
* @see {@link Equivalence} for the reusable equivalence instance
*
* @category predicates
* @since 2.0.0
*/
var equals = /*#__PURE__*/ dual(2, (self, that) => Equivalence(self, that));
var secondOptions = {
	min: 0,
	max: 59
};
var minuteOptions = {
	min: 0,
	max: 59
};
var hourOptions = {
	min: 0,
	max: 23
};
var dayOptions = {
	min: 1,
	max: 31
};
var monthOptions = {
	min: 1,
	max: 12,
	aliases: {
		jan: 1,
		feb: 2,
		mar: 3,
		apr: 4,
		may: 5,
		jun: 6,
		jul: 7,
		aug: 8,
		sep: 9,
		oct: 10,
		nov: 11,
		dec: 12
	}
};
var weekdayOptions = {
	min: 0,
	max: 7,
	normalize: (value) => value === 7 ? 0 : value,
	aliases: {
		sun: 0,
		mon: 1,
		tue: 2,
		wed: 3,
		thu: 4,
		fri: 5,
		sat: 6
	}
};
var parseSegment = (input, options) => {
	const values = /* @__PURE__ */ new Set();
	const fields = input.split(",");
	const first = splitStep(fields[0]);
	const wildcard = first[0] === "*";
	const normalize = options.normalize ?? ((value) => value);
	const add = wildcard && (first[1] === void 0 || first[1] === 1) ? constVoid : (value) => {
		values.add(normalize(value));
	};
	for (let index = 0; index < fields.length; index++) {
		const field = fields[index];
		const [raw, step] = index === 0 ? first : splitStep(field);
		if (step !== void 0) {
			if (!Number.isInteger(step)) return fail$5(new CronParseError({
				message: `Expected step value to be a positive integer`,
				input
			}));
			if (step < 1) return fail$5(new CronParseError({
				message: `Expected step value to be greater than 0`,
				input
			}));
			if (step > options.max) return fail$5(new CronParseError({
				message: `Expected step value to be less than or equal to ${options.max}`,
				input
			}));
		}
		if (raw === "*") {
			if (index === 0 && (step === void 0 || step === 1)) continue;
			for (let i = options.min; i <= options.max; i += step ?? 1) add(i);
		} else {
			const [left, right] = splitRange(raw, options.aliases);
			if (!Number.isInteger(left)) return fail$5(new CronParseError({
				message: `Expected a positive integer`,
				input
			}));
			if (left < options.min || left > options.max) return fail$5(new CronParseError({
				message: `Expected a value between ${options.min} and ${options.max}`,
				input
			}));
			if (right === void 0) for (let i = left; i <= (step === void 0 ? left : options.max); i += step ?? 1) add(i);
			else {
				if (!Number.isInteger(right)) return fail$5(new CronParseError({
					message: `Expected a positive integer`,
					input
				}));
				if (right < options.min || right > options.max) return fail$5(new CronParseError({
					message: `Expected a value between ${options.min} and ${options.max}`,
					input
				}));
				if (left > right) return fail$5(new CronParseError({
					message: `Invalid value range`,
					input
				}));
				for (let i = left; i <= right; i += step ?? 1) add(i);
			}
		}
	}
	return succeed$5({
		values,
		wildcard
	});
};
var splitStep = (input) => {
	const separator = input.indexOf("/");
	if (separator !== -1) {
		const step = input.slice(separator + 1);
		return [input.slice(0, separator), decimalRegex.test(step) ? Number(step) : NaN];
	}
	return [input, void 0];
};
var splitRange = (input, aliases) => {
	const separator = input.indexOf("-");
	if (separator !== -1) return [aliasOrValue(input.slice(0, separator), aliases), aliasOrValue(input.slice(separator + 1), aliases)];
	return [aliasOrValue(input, aliases), void 0];
};
function aliasOrValue(field, aliases) {
	return aliases?.[toLowerCase(field)] ?? (decimalRegex.test(field) ? Number(field) : NaN);
}
var decimalRegex = /^\d+$/;
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0-rc.112/node_modules/effect/dist/internal/random.js
/** @internal */
var Random = /*#__PURE__*/ Reference("effect/Random", { defaultValue: () => ({
	nextIntUnsafe() {
		return Math.floor(Math.random() * (Number.MAX_SAFE_INTEGER - Number.MIN_SAFE_INTEGER + 1)) + Number.MIN_SAFE_INTEGER;
	},
	nextDoubleUnsafe() {
		return Math.random();
	}
}) });
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0-rc.112/node_modules/effect/dist/Pull.js
/**
* Models one low-level pull step for stream-like consumers.
*
* A `Pull<A, E, Done, R>` is an `Effect` that can produce one `A`, fail with an
* ordinary error `E`, or signal end-of-input with `Cause.Done<Done>`. The
* separate done signal lets low-level consumers distinguish normal completion
* from failure. This module includes type extractors and helpers for detecting,
* filtering, catching, converting, and matching done signals separately from
* ordinary failures.
*
* @since 4.0.0
*/
/**
* Handles `Cause.Done` failures in an effect while leaving ordinary failures
* in the error channel.
*
* **When to use**
*
* Use to recover from a `Cause.Done` completion signal in an effect, such as
* turning a pull leftover value into a successful recovery effect while
* preserving ordinary failures.
*
* **Details**
*
* The handler receives the done leftover value and may recover with a new
* effect. Non-done errors are preserved.
*
* @see {@link matchEffect} for handling success, ordinary failure, and done outcomes explicitly
* @see {@link filterDoneLeftover} for extracting a done leftover from an existing `Cause`
*
* @category error handling
* @since 4.0.0
*/
var catchDone = /*#__PURE__*/ dual(2, (effect, f) => catchCauseFilter$1(effect, filterDoneLeftover, (l) => f(l)));
/**
* Checks whether a Cause contains any done errors.
*
* **When to use**
*
* Use when you need to test whether a pull failure cause represents normal
* completion and only need a boolean result.
*
* @see {@link isDoneFailure} for checking a single `Cause.Reason`
* @see {@link filterDone} for extracting the `Cause.Done` value from a `Cause`
* @see {@link filterNoDone} for selecting causes with no done failures
*
* @category predicates
* @since 4.0.0
*/
var isDoneCause = (cause) => cause.reasons.some(isDoneFailure);
/**
* Checks whether a `Cause.Reason` is a `Fail` reason whose error is a
* `Cause.Done` signal.
*
* **When to use**
*
* Use when you need to identify done completion reasons while traversing
* `cause.reasons`, before handling ordinary failures.
*
* @see {@link isDoneCause} for checking an entire `Cause` for any done reason
* @see {@link filterDone} for extracting the `Cause.Done` value from a `Cause`
*
* @category guards
* @since 4.0.0
*/
var isDoneFailure = (failure) => failure._tag === "Fail" && isDone(failure.error);
/**
* Finds a `Cause.Done` failure in a `Cause`.
*
* **When to use**
*
* Use to separate `Cause.Done` completion from ordinary causes while preserving
* the typed done value.
*
* **Details**
*
* Returns a successful `Result` with the `Cause.Done` value when the cause
* contains a done signal and no other failures besides interruptions. When the
* done signal was merged with a real failure (for example a failing
* finalizer), the `Result` fails with the remaining cause, stripped of the
* done signal. Without a done signal the `Result` fails with the original
* cause.
*
* @category filtering
* @since 4.0.0
*/
var filterDone = (cause) => {
	let done;
	let hasFailure = false;
	for (const reason of cause.reasons) if (isDoneFailure(reason)) done ??= reason.error;
	else if (reason._tag !== "Interrupt") hasFailure = true;
	if (done === void 0) return fail$5(cause);
	return hasFailure ? fail$5(fromReasons(cause.reasons.filter((reason) => !isDoneFailure(reason)))) : succeed$5(done);
};
/**
* Filters a Cause to extract the leftover value from done errors.
*
* **When to use**
*
* Use to extract only the leftover value carried by a `Cause.Done` completion
* signal.
*
* @category filtering
* @since 4.0.0
*/
var filterDoneLeftover = (cause) => {
	const done = filterDone(cause);
	return isFailure$3(done) ? done : succeed$5(done.success.value);
};
/**
* Converts a `Cause` into an `Exit`, treating `Cause.Done` as successful
* completion.
*
* **When to use**
*
* Use to produce an `Exit` for finalizing a low-level pull workflow when a
* `Cause.Done` signal should be treated as success and any remaining cause
* should fail.
*
* **Details**
*
* If the done signal is the only failure in the cause, its leftover becomes
* the successful value. Otherwise the non-done cause becomes the failure
* cause.
*
* @see {@link filterDone} for extracting the done signal without converting the cause to an `Exit`
* @see {@link matchEffect} for handling `Pull` success, failure, and done outcomes directly
*
* @category converting
* @since 4.0.0
*/
var doneExitFromCause = (cause) => {
	const halt = filterDone(cause);
	return !isFailure$3(halt) ? succeed$3(halt.success.value) : failCause$2(halt.failure);
};
/**
* Pattern matches on a Pull, handling success, failure, and done cases.
*
* **When to use**
*
* Use to handle all three `Pull` outcomes with effectful handlers.
*
* **Example** (Matching Pull outcomes)
*
* ```ts import.meta.vitest
* import { Cause, Effect, Pull } from "effect"
*
* const pull = Cause.done("stream ended")
*
* const result = Pull.matchEffect(pull, {
*   onSuccess: (value) => Effect.succeed(`Got value: ${value}`),
*   onFailure: (cause) => Effect.succeed(`Got error: ${cause}`),
*   onDone: (leftover) => Effect.succeed(`Stream halted with: ${leftover}`)
* })
*
* await Effect.runPromise(result) // => "Stream halted with: stream ended"
* ```
*
* @category pattern matching
* @since 4.0.0
*/
var matchEffect$1 = /*#__PURE__*/ dual(2, (self, options) => matchCauseEffect$1(self, {
	onSuccess: options.onSuccess,
	onFailure: (cause) => {
		const halt = filterDone(cause);
		return !isFailure$3(halt) ? options.onDone(halt.success.value) : options.onFailure(halt.failure);
	}
}));
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0-rc.112/node_modules/effect/dist/Schedule.js
var Schedule_exports = /* @__PURE__ */ __exportAll({
	CurrentMetadata: () => CurrentMetadata,
	addDelay: () => addDelay,
	concat: () => concat,
	concatResult: () => concatResult,
	cron: () => cron,
	duration: () => duration,
	during: () => during,
	exponential: () => exponential,
	fibonacci: () => fibonacci,
	fixed: () => fixed,
	forever: () => forever$1,
	fromStep: () => fromStep,
	fromStepWithMetadata: () => fromStepWithMetadata,
	identity: () => identity_,
	isSchedule: () => isSchedule,
	jittered: () => jittered,
	map: () => map$1,
	max: () => max,
	min: () => min,
	modifyDelay: () => modifyDelay,
	passthrough: () => passthrough,
	recurs: () => recurs,
	setInputType: () => setInputType,
	spaced: () => spaced,
	tap: () => tap$1,
	toStep: () => toStep,
	toStepWithMetadata: () => toStepWithMetadata,
	toStepWithSleep: () => toStepWithSleep,
	upTo: () => upTo,
	while: () => while_,
	windowed: () => windowed
});
var TypeId$2 = "~effect/Schedule";
var randomNext = /*#__PURE__*/ Random.useSync((random) => random.nextDoubleUnsafe());
/**
* Context reference containing metadata for the currently running schedule step.
*
* **Details**
*
* Repeat, retry, stream, and channel scheduling operations provide this service
* to effects run between schedule steps. The default value contains undefined
* input and output values, zero duration, and zeroed timing fields before any
* schedule step has produced metadata.
*
* @category services
* @since 4.0.0
*/
var CurrentMetadata = /*#__PURE__*/ Reference("effect/Schedule/CurrentMetadata", { defaultValue: /*#__PURE__*/ constant({
	input: void 0,
	output: void 0,
	duration: zero,
	attempt: 0,
	start: 0,
	now: 0,
	elapsed: 0,
	elapsedSincePrevious: 0
}) });
var ScheduleProto = {
	[TypeId$2]: {
		_Out: identity,
		_In: identity,
		_Env: identity
	},
	pipe() {
		return pipeArguments(this, arguments);
	}
};
/**
* Type guard that checks if a value is a Schedule.
*
* **Example** (Checking for schedules)
*
* ```ts import.meta.vitest
* import { Schedule } from "effect"
*
* const schedule = Schedule.exponential("100 millis")
* const notSchedule = { foo: "bar" }
*
* Schedule.isSchedule(schedule) // => true
* Schedule.isSchedule(notSchedule) // => false
* Schedule.isSchedule(null) // => false
* Schedule.isSchedule(undefined) // => false
* ```
*
* @category guards
* @since 2.0.0
*/
var isSchedule = (u) => hasProperty(u, TypeId$2);
/**
* Creates a Schedule from a step function that returns a Pull.
*
* **Example** (Creating a custom schedule from a step function)
*
* ```ts import.meta.vitest
* import { Cause, Duration, Effect, Schedule } from "effect"
*
* const schedule = Schedule.fromStep(Effect.sync(() => {
*   let count = 0
*
*   return (_now: number, _input: string) => {
*     if (count >= 3) {
*       return Cause.done(count)
*     }
*     return Effect.succeed([count++, Duration.millis(100)] as [number, Duration.Duration])
*   }
* }))
*
* const program = Effect.gen(function*() {
*   const step = yield* Schedule.toStep(schedule)
*   const [output] = yield* step(0, "input")
*   return output
* })
*
* await Effect.runPromise(program) // => 0
* ```
*
* @category constructors
* @since 4.0.0
*/
var fromStep = (step) => {
	const self = Object.create(ScheduleProto);
	self.step = step;
	return self;
};
var metadataFn = () => {
	let n = 0;
	let previous;
	let start;
	return (now, input) => {
		if (start === void 0) start = now;
		const elapsed = now - start;
		const elapsedSincePrevious = previous === void 0 ? 0 : now - previous;
		previous = now;
		return {
			input,
			attempt: ++n,
			start,
			now,
			elapsed,
			elapsedSincePrevious
		};
	};
};
/**
* Creates a Schedule from a step function that receives metadata about the schedule's execution.
*
* **Example** (Creating a metadata-aware schedule)
*
* ```ts import.meta.vitest
* import { Cause, Duration, Effect, Schedule } from "effect"
*
* const firstThreeInputs = Schedule.fromStepWithMetadata(Effect.succeed((metadata: Schedule.InputMetadata<string>) => {
*   if (metadata.attempt > 3) {
*     return Cause.done("finished")
*   }
*
*   return Effect.succeed([
*     `attempt ${metadata.attempt}: ${metadata.input}`,
*     Duration.millis(250)
*   ] as [string, Duration.Duration])
* }))
*
* const program = Effect.gen(function*() {
*   const step = yield* Schedule.toStep(firstThreeInputs)
*   const [output] = yield* step(0, "input")
*   return output
* })
*
* await Effect.runPromise(program) // => "attempt 1: input"
* ```
*
* @category constructors
* @since 4.0.0
*/
var fromStepWithMetadata = (step) => fromStep(map$3(step, (f) => {
	const meta = metadataFn();
	return (now, input) => f(meta(now, input));
}));
/**
* Extracts the step function from a Schedule.
*
* **Example** (Extracting a schedule step function)
*
* ```ts import.meta.vitest
* import { Duration, Effect, Schedule } from "effect"
*
* // Extract step function from an existing schedule
* const schedule = Schedule.exponential("100 millis").pipe(Schedule.upTo({ times: 3 }))
*
* const program = Effect.gen(function*() {
*   const stepFn = yield* Schedule.toStep(schedule)
*
*   // Use the step function directly for custom logic. The timestamp is
*   // supplied by the caller, so tests can pass a deterministic value.
*   const now = 0
*   return yield* stepFn(now, "input")
* })
*
* await Effect.runPromise(program) // => [Duration.millis(100), Duration.millis(100)]
* ```
*
* @category destructors
* @since 4.0.0
*/
var toStep = (schedule) => catchCause$2(schedule.step, (cause) => succeed$4(() => failCause$3(cause)));
/**
* Extracts a step function from a `Schedule` that sleeps for each computed
* delay and returns metadata for the completed step.
*
* **When to use**
*
* Use to drive a schedule manually while preserving the computed output,
* delay, input, attempt, and elapsed timing metadata for each step.
*
* **Details**
*
* The returned step reads the current time from `Clock` when invoked, calls the
* schedule step with that timestamp and input, sleeps for the returned
* duration, and then yields `Metadata`.
*
* @see {@link toStep} for manually supplying the timestamp and handling the returned delay yourself
* @see {@link toStepWithSleep} for the same automatic sleeping behavior when only the schedule output is needed
*
* @category destructors
* @since 4.0.0
*/
var toStepWithMetadata = (schedule) => clockWith$1((clock) => map$3(toStep(schedule), (step) => {
	const metaFn = metadataFn();
	return (input) => suspend$2(() => {
		const now = clock.currentTimeMillisUnsafe();
		return flatMap$2(step(now, input), ([output, duration]) => {
			const meta = metaFn(now, input);
			meta.output = output;
			meta.duration = duration;
			return as$1(sleep$1(duration), meta);
		});
	});
}));
/**
* Extracts a step function from a Schedule that automatically handles sleep delays.
*
* **Example** (Extracting a sleeping step function)
*
* ```ts import.meta.vitest
* import { Effect, Schedule } from "effect"
* import { TestClock } from "effect/testing"
*
* const schedule = Schedule.recurs(3)
*
* const program = Effect.gen(function*() {
*   const stepWithSleep = yield* Schedule.toStepWithSleep(schedule)
*
*   return [yield* stepWithSleep("first"), yield* stepWithSleep("second")]
* })
*
* await Effect.runPromise(Effect.provide(program, TestClock.layer())) // => [0, 1]
* ```
*
* @category destructors
* @since 4.0.0
*/
var toStepWithSleep = (schedule) => map$3(toStepWithMetadata(schedule), (step) => (input) => map$3(step(input), (meta) => meta.output));
/**
* Returns a new `Schedule` that adds the delay computed by the specified
* effectful function to the next recurrence of the schedule.
*
* **Example** (Adding extra delay to a schedule)
*
* ```ts import.meta.vitest
* import { Duration, Effect, Schedule } from "effect"
*
* const schedule = Schedule.recurs(1).pipe(
*   Schedule.addDelay(() => Effect.succeed("25 millis"))
* )
* const program = Effect.gen(function*() {
*   const step = yield* Schedule.toStep(schedule)
*   const [, delay] = yield* step(0, undefined)
*   return delay
* })
*
* await Effect.runPromise(program) // => Duration.millis(25)
* ```
*
* @category delays & timeouts
* @since 2.0.0
*/
var addDelay = /*#__PURE__*/ dual(2, (self, f) => modifyDelay(self, (metadata) => map$3(f(metadata), (d) => sum(fromInputUnsafe(d), metadata.duration))));
/**
* Returns a schedule that runs `self` to completion, then runs `other`, and
* merges their outputs.
*
* **Example** (Sequencing quick and slow retries)
*
* ```ts import.meta.vitest
* import { Schedule } from "effect"
*
* const schedule = Schedule.concat(Schedule.recurs(1), Schedule.recurs(2))
* Schedule.isSchedule(schedule) // => true
* ```
*
* @category sequencing
* @since 2.0.0
*/
var concat = /*#__PURE__*/ dual(2, (self, other) => map$1(concatResult(self, other), ({ output }) => succeed$4(merge$2(output))));
/**
* Returns a schedule that runs `self` to completion, then runs `other`, and
* preserves which schedule produced each output.
*
* **Details**
*
* The resulting schedule emits a `Result` to indicate which phase produced
* each output: outputs from `self` are emitted as `Failure`, and outputs from
* `other` are emitted as `Success`.
*
* **Example** (Tracking sequential schedule phases)
*
* ```ts import.meta.vitest
* import { Schedule } from "effect"
*
* const schedule = Schedule.concatResult(Schedule.recurs(1), Schedule.recurs(2))
* Schedule.isSchedule(schedule) // => true
* ```
*
* @category sequencing
* @since 4.0.0
*/
var concatResult = /*#__PURE__*/ dual(2, (self, other) => fromStep(sync$1(() => {
	let currentSide = 0;
	let currentStep;
	const left = map$1(self, ({ output }) => fail$5(output));
	const right = map$1(other, ({ output }) => succeed$5(output));
	return function recur(now, input) {
		if (currentStep) return currentStep(now, input);
		return toStep(currentSide === 0 ? left : right).pipe(flatMap$2((step) => {
			currentSide++;
			if (currentSide === 1) {
				currentStep = (now, input) => catchDone(step(now, input), (_) => {
					currentStep = void 0;
					return recur(now, input);
				});
				return currentStep(now, input);
			}
			currentStep = step;
			return currentStep(now, input);
		}));
	};
})));
/**
* Combines schedules by recurring while all schedules want to recur, using the
* maximum delay between recurrences and outputting that maximum delay.
*
* **When to use**
*
* Use when a combined policy should continue only while every schedule still
* recurs, and should wait for the slowest schedule between recurrences.
*
* **Example** (Combining retry schedules by their maximum delay)
*
* ```ts import.meta.vitest
* import { Schedule } from "effect"
*
* const schedule = Schedule.max([Schedule.fixed("5 seconds"), Schedule.spaced("10 seconds")])
* Schedule.isSchedule(schedule) // => true
* ```
*
* @category combining
* @since 4.0.0
*/
var max = (schedules) => fromStep(map$3(all$1(schedules.map(toStep)), (steps) => (now, input) => flatMap$2(forEach$1(steps, (step) => matchEffect$1(step(now, input), {
	onSuccess: (result) => succeed$4(result[1]),
	onDone: () => undefined_$1,
	onFailure: failCause$3
})), (results) => {
	const duration = maxDuration(results);
	if (duration === void 0) return done$1(zero);
	return succeed$4([duration, duration]);
})));
var maxDuration = (results) => {
	let max = results[0];
	for (let i = 1; i < results.length; i++) {
		max = results[i] && max && max$1(max, results[i]);
		if (max === void 0) break;
	}
	return max;
};
/**
* Returns a new `Schedule` that recurs on the specified `Cron` schedule and
* outputs the duration between recurrences.
*
* **Example** (Scheduling work with cron expressions)
*
* ```ts import.meta.vitest
* import { Schedule } from "effect"
*
* const everyMinute = Schedule.cron("* * * * *")
* Schedule.isSchedule(everyMinute) // => true
* ```
*
* @category constructors
* @since 2.0.0
*/
var cron = (expression, tz) => {
	return fromStep(map$3(fromResult$1(isCron(expression) ? succeed$5(expression) : parse(expression, tz)), (cron) => (now, _) => {
		if (now === Number.POSITIVE_INFINITY) return done$1(zero);
		return sync$1(() => {
			const duration = millis(next(cron, now).getTime() - now);
			return [duration, duration];
		});
	}));
};
/**
* Returns a schedule that recurs once after the specified duration.
*
* **When to use**
*
* Use when you need a schedule that recurs once after a fixed delay.
*
* **Details**
*
* The schedule outputs the configured duration for its first recurrence and
* then completes.
*
* **Example** (Recurring once after a duration)
*
* ```ts import.meta.vitest
* import { Schedule } from "effect"
*
* Schedule.isSchedule(Schedule.duration("1 second")) // => true
* ```
*
* @see {@link during} for recurring until a duration has elapsed
*
* @category constructors
* @since 2.0.0
*/
var duration = (durationInput) => {
	const duration = fromInputUnsafe(durationInput);
	return fromStepWithMetadata(succeed$4((meta) => meta.attempt === 1 ? succeed$4([duration, duration]) : done$1(zero)));
};
/**
* Returns a new `Schedule` that will always recur, but only during the
* specified `duration` of time.
*
* **When to use**
*
* Use to bound a repeating or retrying schedule by elapsed time.
*
* **Example** (Repeating work during a duration)
*
* ```ts import.meta.vitest
* import { Schedule } from "effect"
*
* Schedule.isSchedule(Schedule.during("5 seconds")) // => true
* ```
*
* @see {@link duration} for one delayed recurrence
*
* @category constructors
* @since 4.0.0
*/
var during = (duration) => {
	const durationMillis = toMillis(duration);
	return fromStepWithMetadata(succeed$4((meta) => {
		const elapsed = millis(meta.elapsed);
		return meta.elapsed > durationMillis ? done$1(elapsed) : succeed$4([elapsed, zero]);
	}));
};
/**
* Combines schedules by recurring while at least one schedule wants to recur,
* using the minimum delay between recurrences and outputting that minimum delay.
*
* **When to use**
*
* Use when a combined policy should continue while any schedule still recurs,
* and should wait for the fastest schedule between recurrences.
*
* **Example** (Combining retry schedules by their minimum delay)
*
* ```ts import.meta.vitest
* import { Schedule } from "effect"
*
* const schedule = Schedule.min([Schedule.fixed("5 seconds"), Schedule.spaced("10 seconds")])
* Schedule.isSchedule(schedule) // => true
* ```
*
* @category combining
* @since 4.0.0
*/
var min = (schedules) => fromStep(map$3(all$1(schedules.map(toStep)), (steps) => (now, input) => flatMap$2(forEach$1(steps, (step) => matchEffect$1(step(now, input), {
	onSuccess: (result) => succeed$4(result[1]),
	onDone: () => undefined_$1,
	onFailure: failCause$3
})), (results) => {
	const duration = minDuration(results);
	if (duration === void 0) return done$1(zero);
	return succeed$4([duration, duration]);
})));
var minDuration = (results) => {
	let min = void 0;
	for (let i = 0; i < results.length; i++) {
		const duration = results[i];
		if (duration !== void 0) min = min === void 0 ? duration : min$1(min, duration);
	}
	return min;
};
/**
* Schedule that always recurs, but will wait a certain amount between
* repetitions, given by `base * factor.pow(n)`, where `n` is the number of
* repetitions so far. Returns the current duration between recurrences.
*
* **Example** (Retrying with exponential backoff)
*
* ```ts import.meta.vitest
* import { Duration, Effect, Schedule } from "effect"
*
* const program = Effect.gen(function*() {
*   const step = yield* Schedule.toStep(Schedule.exponential("100 millis"))
*   return yield* step(0, undefined)
* })
*
* await Effect.runPromise(program) // => [Duration.millis(100), Duration.millis(100)]
* ```
*
* @category constructors
* @since 2.0.0
*/
var exponential = (base, factor = 2) => {
	const baseMillis = toMillis(fromInputUnsafe(base));
	return fromStepWithMetadata(succeed$4((meta) => {
		const duration = millis(baseMillis * Math.pow(factor, meta.attempt - 1));
		return succeed$4([duration, duration]);
	}));
};
/**
* Schedule that always recurs, increasing delays by summing the preceding
* two delays (similar to the Fibonacci sequence). Returns the current
* duration between recurrences.
*
* **Example** (Retrying with Fibonacci backoff)
*
* ```ts import.meta.vitest
* import { Duration, Effect, Schedule } from "effect"
*
* const program = Effect.gen(function*() {
*   const step = yield* Schedule.toStep(Schedule.fibonacci("100 millis"))
*   return yield* step(0, undefined)
* })
*
* await Effect.runPromise(program) // => [Duration.millis(100), Duration.millis(100)]
* ```
*
* @category constructors
* @since 2.0.0
*/
var fibonacci = (one) => {
	const oneMillis = toMillis(fromInputUnsafe(one));
	return fromStep(sync$1(() => {
		let a = 0;
		let b = oneMillis;
		return constant(sync$1(() => {
			const next = a + b;
			a = b;
			b = next;
			const duration = millis(next);
			return [duration, duration];
		}));
	}));
};
/**
* Returns a `Schedule` that recurs on the specified fixed `interval` and
* outputs the number of repetitions of the schedule so far.
*
* **When to use**
*
* Use when recurrences should stay aligned to a regular cadence.
*
* **Gotchas**
*
* If the action run between recurrences takes longer than the interval, the
* next recurrence happens immediately, but missed intervals are not replayed.
*
* ```text
* |-----interval-----|-----interval-----|-----interval-----|
* |---------action--------||action|-----|action|-----------|
* ```
*
* **Example** (Repeating on fixed intervals)
*
* ```ts import.meta.vitest
* import { Duration, Effect, Schedule } from "effect"
*
* const program = Effect.gen(function*() {
*   const step = yield* Schedule.toStep(Schedule.fixed("1 second"))
*   return yield* step(0, undefined)
* })
*
* await Effect.runPromise(program) // => [0, Duration.seconds(1)]
* ```
*
* @see {@link spaced} for delaying after each action completes
*
* @category constructors
* @since 2.0.0
*/
var fixed = (interval) => {
	const window = toMillis(fromInputUnsafe(interval));
	return fromStepWithMetadata(sync$1(() => {
		let start = 0;
		let lastRun = 0;
		return (meta) => sync$1(() => {
			if (window === 0) return [meta.attempt - 1, zero];
			if (meta.attempt === 1) {
				start = meta.now;
				lastRun = meta.now + window;
				return [0, millis(window)];
			}
			const runningBehind = meta.now > lastRun + window;
			const boundary = window - (meta.now - start) % window;
			const delay = runningBehind ? 0 : boundary === 0 ? window : boundary;
			lastRun = runningBehind ? meta.now : meta.now + delay;
			return [meta.attempt - 1, millis(delay)];
		});
	}));
};
/**
* Returns a new `Schedule` that maps each schedule decision to a new output
* using the full schedule metadata.
*
* **Details**
*
* The callback receives the schedule input, output, selected delay duration,
* current attempt, and elapsed timing information. Return either a plain value
* or an `Effect` that produces the new output.
*
* **Example** (Mapping schedule outputs)
*
* ```ts import.meta.vitest
* import { Effect, Schedule } from "effect"
*
* const countSchedule = Schedule.recurs(5).pipe(
*   Schedule.map(({ output: count }) => Effect.succeed(`Execution #${count + 1}`))
* )
* const program = Effect.gen(function*() {
*   const step = yield* Schedule.toStep(countSchedule)
*   const [output] = yield* step(0, undefined)
*   return output
* })
*
* await Effect.runPromise(program) // => "Execution #1"
* ```
*
* @category mapping
* @since 2.0.0
*/
var map$1 = /*#__PURE__*/ dual(2, (self, f) => fromStep(map$3(toStep(self), (step) => {
	const meta = metadataFn();
	return (now, input) => matchEffect$1(step(now, input), {
		onSuccess: ([output, duration]) => {
			const result = f({
				...meta(now, input),
				output,
				duration
			});
			if (!isEffect$1(result)) return succeed$4([result, duration]);
			return map$3(result, (output) => [output, duration]);
		},
		onFailure: failCause$3,
		onDone: (output) => {
			const result = f({
				...meta(now, input),
				output,
				duration: zero
			});
			if (!isEffect$1(result)) return done$1(result);
			return flatMap$2(result, done$1);
		}
	});
})));
/**
* Returns a new `Schedule` that modifies the delay of the next recurrence
* of the schedule using the specified effectful function.
*
* **Example** (Modifying delays from schedule metadata)
*
* ```ts import.meta.vitest
* import { Duration, Effect, Schedule } from "effect"
*
* const schedule = Schedule.spaced("10 millis").pipe(
*   Schedule.modifyDelay(({ duration }) => Effect.succeed(Duration.times(duration, 2)))
* )
* const program = Effect.gen(function*() {
*   const step = yield* Schedule.toStep(schedule)
*   const [, delay] = yield* step(0, undefined)
*   return delay
* })
*
* await Effect.runPromise(program) // => Duration.millis(20)
* ```
*
* @category delays & timeouts
* @since 2.0.0
*/
var modifyDelay = /*#__PURE__*/ dual(2, (self, f) => fromStep(map$3(toStep(self), (step) => {
	const meta = metadataFn();
	return (now, input) => flatMap$2(step(now, input), ([output, duration]) => map$3(f({
		...meta(now, input),
		output,
		duration
	}), (replacement) => [output, fromInputUnsafe(replacement)]));
})));
/**
* Returns a new `Schedule` that randomly adjusts each recurrence delay.
*
* **When to use**
*
* Use to add random variation to an existing schedule's recurrence delays while
* preserving its output and completion behavior.
*
* **Details**
*
* Each recurrence delay is scaled by a random factor between `0.8` and `1.2`.
*
* @see {@link modifyDelay} for replacing recurrence delays with a custom effectful transformation
*
* @category delays & timeouts
* @since 2.0.0
*/
var jittered = (self) => modifyDelay(self, ({ duration }) => map$3(randomNext, (random) => {
	const millis$1 = toMillis(duration);
	return millis(millis$1 * .8 * (1 - random) + millis$1 * 1.2 * random);
}));
/**
* Returns a new `Schedule` that outputs the inputs of the specified schedule.
*
* **Example** (Passing inputs through as outputs)
*
* ```ts import.meta.vitest
* import { Effect, Schedule } from "effect"
*
* const inputSchedule = Schedule.passthrough(
*   Schedule.exponential("100 millis").pipe(Schedule.upTo({ times: 3 }))
* )
* const program = Effect.gen(function*() {
*   const step = yield* Schedule.toStep(inputSchedule)
*   const [output] = yield* step(0, "input")
*   return output
* })
*
* await Effect.runPromise(program) // => "input"
* ```
*
* @category mapping
* @since 2.0.0
*/
var passthrough = (self) => fromStep(map$3(toStep(self), (step) => (now, input) => matchEffect$1(step(now, input), {
	onSuccess: (result) => succeed$4([input, result[1]]),
	onFailure: failCause$3,
	onDone: () => done$1(input)
})));
/**
* Returns a `Schedule` which can only be stepped the specified number of
* `times` before it terminates.
*
* **When to use**
*
* Use when you need a counter schedule with no additional delay.
*
* **Gotchas**
*
* `recurs(n)` counts schedule recurrences, not the first evaluation of the
* effect being repeated or retried. For retrying, this means one initial
* attempt plus at most `n` retries.
*
* **Example** (Limiting recurrences)
*
* ```ts import.meta.vitest
* import { Effect, Schedule } from "effect"
* import { TestClock } from "effect/testing"
*
* const executions: Array<number> = []
* const program = Effect.sync(() => executions.push(executions.length + 1)).pipe(
*   Effect.repeat(Schedule.recurs(3)),
*   Effect.as(executions)
* )
*
* await Effect.runPromise(Effect.provide(program, TestClock.layer())) // => [1, 2, 3, 4]
* ```
*
* @see {@link upTo} for limiting an existing schedule
*
* @category constructors
* @since 2.0.0
*/
var recurs = (times) => while_(forever$1, ({ attempt }) => succeed$4(attempt <= times));
/**
* Returns a schedule that recurs continuously, each repetition spaced the
* specified duration from the last run.
*
* **When to use**
*
* Use when each delay should start after the previous action completes.
*
* **Example** (Repeating with fixed spacing)
*
* ```ts import.meta.vitest
* import { Duration, Effect, Schedule } from "effect"
*
* const program = Effect.gen(function*() {
*   const step = yield* Schedule.toStep(Schedule.spaced("2 seconds"))
*   return yield* step(0, undefined)
* })
*
* await Effect.runPromise(program) // => [0, Duration.seconds(2)]
* ```
*
* @see {@link fixed} for recurrence aligned to a regular cadence
*
* @category constructors
* @since 2.0.0
*/
var spaced = (duration) => {
	const decoded = fromInputUnsafe(duration);
	return fromStepWithMetadata(succeed$4((meta) => succeed$4([meta.attempt - 1, decoded])));
};
/**
* Returns a new `Schedule` that allows execution of an effectful function for
* every decision of the schedule, but does not alter the inputs and outputs of
* the schedule.
*
* **Details**
*
* The callback receives the full schedule metadata, including the input, output,
* computed delay duration, current attempt, and elapsed timing information.
*
* **Example** (Tapping schedule metadata)
*
* ```ts import.meta.vitest
* import { Effect, Schedule } from "effect"
*
* const attempts: Array<number> = []
* const monitoredSchedule = Schedule.recurs(2).pipe(
*   Schedule.tap((metadata) => Effect.sync(() => attempts.push(metadata.attempt)))
* )
* const program = Effect.gen(function*() {
*   const step = yield* Schedule.toStep(monitoredSchedule)
*   const [output] = yield* step(0, undefined)
*   return { attempts, output }
* })
*
* await Effect.runPromise(program) // => { attempts: [1], output: 0 }
* ```
*
* @category sequencing
* @since 4.0.0
*/
var tap$1 = /*#__PURE__*/ dual(2, (self, f) => fromStep(map$3(toStep(self), (step) => {
	const meta = metadataFn();
	return (now, input) => tap$2(step(now, input), ([output, duration]) => f({
		...meta(now, input),
		output,
		duration
	}));
})));
/**
* Returns a new `Schedule` that limits an existing schedule by elapsed
* duration, number of outputs, or both.
*
* **When to use**
*
* Use to bound an existing schedule while preserving its output and delay
* behavior. When both `duration` and `times` are specified, the schedule
* stops as soon as either limit is reached.
*
* **Gotchas**
*
* The `times` option limits schedule outputs. When used with repeat or retry,
* the effect is evaluated once before the schedule is stepped, so the total
* number of evaluations can be one greater than the configured number of
* outputs.
*
* The `duration` option is based on the elapsed time observed by the schedule
* step. Long-running effects can cause the duration limit to be detected on the
* following schedule step.
*
* **Example** (Limiting by duration and recurrence count)
*
* ```ts import.meta.vitest
* import { Effect, Schedule } from "effect"
* import { TestClock } from "effect/testing"
*
* const executions: Array<number> = []
* const schedule = Schedule.forever.pipe(Schedule.upTo({ times: 2 }))
* const program = Effect.sync(() => executions.push(executions.length + 1)).pipe(
*   Effect.repeat(schedule),
*   Effect.as(executions)
* )
*
* await Effect.runPromise(Effect.provide(program, TestClock.layer())) // => [1, 2, 3]
* ```
*
* @category filtering
* @since 4.0.0
*/
var upTo = /*#__PURE__*/ dual(2, (self, options) => {
	const duration = options.duration === void 0 ? void 0 : fromInputUnsafe(options.duration);
	return while_(self, ({ attempt, elapsed }) => succeed$4((options.times === void 0 || attempt <= options.times) && (duration === void 0 || isLessThanOrEqualTo(millis(elapsed), duration))));
});
var while_ = /*#__PURE__*/ dual(2, (self, predicate) => fromStep(map$3(toStep(self), (step) => {
	const meta = metadataFn();
	return (now, input) => flatMap$2(step(now, input), (result) => {
		const [output, duration] = result;
		const eff = predicate({
			...meta(now, input),
			output,
			duration
		});
		return flatMap$2(isEffect$1(eff) ? eff : succeed$4(eff), (check) => check ? succeed$4(result) : done$1(output));
	});
})));
/**
* Schedule that divides the timeline to `interval`-long windows, and sleeps
* until the nearest window boundary every time it recurs.
*
* **Details**
*
* For example, `Schedule.windowed("10 seconds")` would produce a schedule as
* follows:
*
* ```text
*      10s        10s        10s       10s
* |----------|----------|----------|----------|
* |action------|sleep---|act|-sleep|action----|
* ```
*
* **Example** (Repeating on aligned windows)
*
* ```ts import.meta.vitest
* import { Duration, Effect, Schedule } from "effect"
*
* const program = Effect.gen(function*() {
*   const step = yield* Schedule.toStep(Schedule.windowed("5 seconds"))
*   return yield* step(0, undefined)
* })
*
* await Effect.runPromise(program) // => [0, Duration.seconds(5)]
* ```
*
* @category constructors
* @since 2.0.0
*/
var windowed = (interval) => {
	const window = toMillis(fromInputUnsafe(interval));
	return fromStepWithMetadata(succeed$4((meta) => sync$1(() => [meta.attempt - 1, window === 0 ? zero : millis(window - meta.elapsed % window)])));
};
/**
* Returns a new `Schedule` that will recur forever.
*
* **Details**
*
* The output of the schedule is the current count of its repetitions thus far
* (i.e. `0, 1, 2, ...`).
*
* **Example** (Repeating forever)
*
* ```ts import.meta.vitest
* import { Effect, Schedule } from "effect"
* import { TestClock } from "effect/testing"
*
* const executions: Array<number> = []
* const schedule = Schedule.forever.pipe(Schedule.upTo({ times: 2 }))
* const program = Effect.sync(() => executions.push(executions.length + 1)).pipe(
*   Effect.repeat(schedule),
*   Effect.as(executions)
* )
*
* await Effect.runPromise(Effect.provide(program, TestClock.layer())) // => [1, 2, 3]
* ```
*
* @category constructors
* @since 2.0.0
*/
var forever$1 = /*#__PURE__*/ spaced(zero);
var constIdentity = /*#__PURE__*/ fromStep(/*#__PURE__*/ succeed$4((_now, input) => succeed$4([input, zero])));
var identity_ = () => constIdentity;
/**
* Sets the input type of the provided schedule without altering its behavior.
*
* **When to use**
*
* Use to adapt a schedule that does not depend on its input values.
*
* **Details**
*
* This helper is checked at compile time and does not change the schedule's
* runtime behavior.
*
* **Example** (Setting a schedule input type)
*
* ```ts import.meta.vitest
* import { Schedule } from "effect"
*
* const schedule = Schedule.recurs(3).pipe(
*   Schedule.setInputType<string>()
* )
* Schedule.isSchedule(schedule) // => true
* ```
*
* @category utility types
* @since 4.0.0
*/
var setInputType = () => (self) => self;
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0-rc.112/node_modules/effect/dist/internal/layer.js
var provideLayer = (self, layer, options) => scopedWith$1((scope) => flatMap$2(options?.local ? buildWithMemoMap(layer, makeMemoMapUnsafe(), scope) : buildWithScope(layer, scope), (context) => provideContext$1(self, context)));
/** @internal */
var provide$1 = /*#__PURE__*/ dual((args) => isEffect$1(args[0]), (self, source, options) => isContext(source) ? provideContext$1(self, source) : provideLayer(self, Array.isArray(source) ? mergeAll(...source) : source, options));
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0-rc.112/node_modules/effect/dist/internal/schedule.js
/** @internal */
var repeatOrElse$1 = /*#__PURE__*/ dual(3, (self, schedule, orElse) => flatMap$2(toStepWithMetadata(schedule), (step) => {
	let meta = CurrentMetadata.defaultValue();
	return catch_$1(forever$2(tap$2(flatMap$2(suspend$2(() => provideService$1(self, CurrentMetadata, meta)), step), (meta_) => sync$1(() => {
		meta = meta_;
	})), { disableYield: true }), (error) => isDone$1(error) ? succeed$4(error.value) : orElse(error, meta.attempt === 0 ? none() : some(meta)));
}));
/** @internal */
var retryOrElse$1 = /*#__PURE__*/ dual(3, (self, policy, orElse) => flatMap$2(toStepWithMetadata(policy), (step) => {
	let meta = CurrentMetadata.defaultValue();
	let lastError;
	const loop = catch_$1(suspend$2(() => provideService$1(self, CurrentMetadata, meta)), (error) => {
		lastError = error;
		return flatMap$2(step(error), (meta_) => {
			meta = meta_;
			return loop;
		});
	});
	return catchDone(loop, (out) => internalCall(() => orElse(lastError, out)));
}));
/** @internal */
var repeat$1 = /*#__PURE__*/ dual(2, (self, options) => {
	return repeatOrElse$1(self, typeof options === "function" ? options(identity) : isSchedule(options) ? options : buildFromOptions(options), fail$4);
});
/** @internal */
var retry$1 = /*#__PURE__*/ dual(2, (self, options) => {
	return retryOrElse$1(self, typeof options === "function" ? options(identity) : isSchedule(options) ? options : buildFromOptions(options), fail$4);
});
/** @internal */
var scheduleFrom$1 = /*#__PURE__*/ dual(3, (self, initial, schedule) => flatMap$2(toStepWithMetadata(schedule), (step) => {
	let meta = CurrentMetadata.defaultValue();
	const selfWithMeta = suspend$2(() => provideService$1(self, CurrentMetadata, meta));
	return catch_$1(flatMap$2(step(initial), (meta_) => {
		meta = meta_;
		return whileLoop$1({
			while: constTrue,
			body: constant(flatMap$2(selfWithMeta, step)),
			step(meta_) {
				meta = meta_;
			}
		});
	}), (error) => isDone$1(error) ? succeed$4(error.value) : fail$4(error));
}));
var passthroughForever = /*#__PURE__*/ passthrough(forever$1);
/** @internal */
var buildFromOptions = (options) => {
	let schedule = options.schedule ? passthrough(options.schedule) : passthroughForever;
	if (options.while) schedule = while_(schedule, ({ input }) => {
		const applied = options.while(input);
		return isEffect$1(applied) ? applied : succeed$4(applied);
	});
	if (options.until) schedule = while_(schedule, ({ input }) => {
		const applied = options.until(input);
		return isEffect$1(applied) ? map$3(applied, (b) => !b) : succeed$4(!applied);
	});
	if (options.times !== void 0) schedule = while_(schedule, ({ attempt }) => succeed$4(attempt <= options.times));
	return schedule;
};
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0-rc.112/node_modules/effect/dist/internal/executionPlan.js
/** @internal */
var makeEventEmitter = (onEvent, currentMetadata) => {
	let lastStepIndex = -1;
	let stepAttempt = 0;
	const emit = (event) => ignoreCause$1(onEvent(event));
	return {
		begin: clockWith$1((clock) => suspend$2(() => {
			const meta = currentMetadata();
			if (meta.stepIndex !== lastStepIndex) {
				lastStepIndex = meta.stepIndex;
				stepAttempt = 0;
			}
			stepAttempt++;
			const state = {
				attempt: meta.attempt,
				stepAttempt,
				stepIndex: meta.stepIndex,
				startNanos: clock.monotonicTimeNanosUnsafe()
			};
			return as$1(emit({
				_tag: "AttemptStart",
				attempt: state.attempt,
				stepAttempt: state.stepAttempt,
				stepIndex: state.stepIndex
			}), state);
		})),
		end: (state, exit) => clockWith$1((clock) => {
			const duration = nanos(clock.monotonicTimeNanosUnsafe() - state.startNanos);
			return emit(exit._tag === "Success" ? {
				_tag: "AttemptSuccess",
				attempt: state.attempt,
				stepAttempt: state.stepAttempt,
				stepIndex: state.stepIndex,
				duration
			} : {
				_tag: "AttemptFailure",
				attempt: state.attempt,
				stepAttempt: state.stepAttempt,
				stepIndex: state.stepIndex,
				duration,
				cause: exit.cause
			});
		})
	};
};
/** @internal */
var withExecutionPlan$1 = /*#__PURE__*/ dual((args) => isEffect$1(args[0]), (self, plan, options) => suspend$2(() => {
	let i = 0;
	let meta = {
		attempt: 0,
		stepIndex: 0
	};
	const provideMeta = provideServiceEffect$1(CurrentMetadata$1, sync$1(() => {
		meta = {
			attempt: meta.attempt + 1,
			stepIndex: i
		};
		return meta;
	}));
	const emitter = options?.onEvent === void 0 ? void 0 : makeEventEmitter(options.onEvent, () => meta);
	const instrument = emitter === void 0 ? identity : (attempt) => uninterruptibleMask$1((restore) => flatMap$2(emitter.begin, (state) => onExit$1(restore(attempt), (exit) => emitter.end(state, exit))));
	let result;
	return flatMap$2(whileLoop$1({
		while: () => i < plan.steps.length && (result === void 0 || isFailure$3(result)),
		body() {
			const step = plan.steps[i];
			let nextEffect = provideMeta(instrument(provide$1(self, step.provide)));
			if (result) {
				let attempted = false;
				const wrapped = nextEffect;
				nextEffect = suspend$2(() => {
					if (attempted) return wrapped;
					attempted = true;
					return fromResult$1(result);
				});
				nextEffect = retry$1(nextEffect, scheduleFromStep(step, false));
			} else {
				const schedule = scheduleFromStep(step, true);
				nextEffect = schedule ? retry$1(nextEffect, schedule) : nextEffect;
			}
			return result$1(nextEffect);
		},
		step(result_) {
			result = result_;
			i++;
		}
	}), () => fromResult$1(result));
}));
/** @internal */
var scheduleFromStep = (step, first) => {
	if (!first) return buildFromOptions({
		schedule: step.schedule ? step.schedule : step.attempts ? void 0 : scheduleOnce,
		times: step.attempts,
		while: step.while
	});
	else if (step.attempts === 1 || !(step.schedule || step.attempts)) return;
	return buildFromOptions({
		schedule: step.schedule,
		while: step.while,
		times: step.attempts ? step.attempts - 1 : void 0
	});
};
var scheduleOnce = /*#__PURE__*/ recurs(1);
({ ...StructuralProto });
/**
* Creates a `Request.Entry` from its component fields.
*
* **Details**
*
* This is a low-level helper for request runtime and resolver infrastructure;
* most application code receives entries from a `RequestResolver` instead of
* constructing them directly.
*
* @category constructors
* @since 2.0.0
*/
var makeEntry = (options) => options;
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0-rc.112/node_modules/effect/dist/internal/request.js
/** @internal */
var request$1 = /*#__PURE__*/ dual(2, (self, resolver) => {
	const withResolver = (resolver) => callback$1((resume) => {
		return maybeRemoveEntry(resolver, addEntry(resolver, self, resume, getCurrentFiber()));
	});
	return isEffect$1(resolver) ? flatMap$2(resolver, withResolver) : withResolver(resolver);
});
/** @internal */
var requestUnsafe$1 = (self, options) => {
	const entry = addEntry(options.resolver, self, options.onExit, {
		context: options.context,
		currentScheduler: get(options.context, Scheduler)
	});
	return () => removeEntryUnsafe(options.resolver, entry);
};
var batchPool = [];
var pendingBatches = /*#__PURE__*/ new WeakMap();
var addEntry = (resolver, request, resume, fiber) => {
	let batchMap = pendingBatches.get(resolver);
	if (!batchMap) {
		batchMap = /* @__PURE__ */ new Map();
		pendingBatches.set(resolver, batchMap);
	}
	let batch;
	let completed = false;
	const entry = makeEntry({
		request,
		context: fiber.context,
		uninterruptible: false,
		completeUnsafe(effect) {
			if (completed) return;
			completed = true;
			resume(effect);
			batch?.entrySet.delete(entry);
		}
	});
	if (resolver.preCheck !== void 0 && !resolver.preCheck(entry)) return entry;
	const key = resolver.batchKey(entry);
	batch = batchMap.get(key);
	if (!batch) {
		if (batchPool.length > 0) {
			batch = batchPool.pop();
			batch.key = key;
			batch.resolver = resolver;
			batch.map = batchMap;
		} else {
			const newBatch = {
				key,
				resolver,
				map: batchMap,
				entrySet: /* @__PURE__ */ new Set(),
				entries: /* @__PURE__ */ new Set(),
				delayEffect: flatMap$2(suspend$2(() => newBatch.resolver.delay), (_) => runBatch(newBatch)),
				run: onExit$1(suspend$2(() => newBatch.resolver.runAll(Array.from(newBatch.entries), newBatch.key)), (exit) => {
					for (const entry of newBatch.entrySet) entry.completeUnsafe(exit._tag === "Success" ? exitDie(new Error("Effect.request: RequestResolver did not complete request", { cause: entry.request })) : exit);
					newBatch.entries.clear();
					if (batchPool.length < 128) {
						newBatch.entrySet.clear();
						newBatch.key = void 0;
						newBatch.fiber = void 0;
						newBatch.resolver = void 0;
						newBatch.map = void 0;
						batchPool.push(newBatch);
					}
					return void_$2;
				})
			};
			batch = newBatch;
		}
		batchMap.set(key, batch);
		batch.fiber = runForkWith$1(fiber.context)(batch.delayEffect, { scheduler: fiber.currentScheduler });
	}
	batch.entrySet.add(entry);
	batch.entries.add(entry);
	if (batch.resolver.collectWhile(batch.entries)) return entry;
	batch.fiber.interruptUnsafe(fiber.id);
	batch.fiber = runForkWith$1(fiber.context)(runBatch(batch), { scheduler: fiber.currentScheduler });
	return entry;
};
var removeEntryUnsafe = (resolver, entry) => {
	if (entry.uninterruptible) return;
	const batchMap = pendingBatches.get(resolver);
	if (!batchMap) return;
	const key = resolver.batchKey(entry);
	const batch = batchMap.get(key);
	if (!batch) return;
	batch.entries.delete(entry);
	batch.entrySet.delete(entry);
	if (batch.entries.size === 0) {
		batchMap.delete(key);
		batch.fiber?.interruptUnsafe();
	}
};
var maybeRemoveEntry = (resolver, entry) => sync$1(() => removeEntryUnsafe(resolver, entry));
function runBatch(batch) {
	if (!batch.map.has(batch.key)) return void_$2;
	batch.map.delete(batch.key);
	return batch.run;
}
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0-rc.112/node_modules/effect/dist/Metric.js
/**
* Updates the metric with the specified input.
*
* **Details**
*
* The behavior of `update` depends on the metric type. Counters add the input
* value to the current count, gauges replace the current value with the input
* value, frequencies increment the occurrence count for the input string,
* histograms record the input value in the appropriate bucket, and summaries
* record the input value as a new observation.
*
* **Example** (Updating metric values)
*
* ```ts import.meta.vitest
* import { Effect, Metric } from "effect"
*
* const cpuUsage = Metric.gauge("cpu_usage_percent")
* const httpStatus = Metric.frequency("http_status_codes")
* const responseTime = Metric.histogram("response_time_ms", {
*   boundaries: [100, 500, 1000, 2000]
* })
*
* const program = Effect.gen(function*() {
*   // Update gauge to specific values
*   yield* Metric.update(cpuUsage, 45.2)
*   yield* Metric.update(cpuUsage, 67.8) // Replaces previous value
*
*   // Track HTTP status code occurrences
*   yield* Metric.update(httpStatus, "200")
*   yield* Metric.update(httpStatus, "404")
*   yield* Metric.update(httpStatus, "200") // Increments 200 count
*
*   // Record response times
*   yield* Metric.update(responseTime, 250)
*   yield* Metric.update(responseTime, 750)
*   yield* Metric.update(responseTime, 1500)
*
*   // Check current states
*   const cpu = yield* Metric.value(cpuUsage)
*   const statuses = yield* Metric.value(httpStatus)
*   const times = yield* Metric.value(responseTime)
*   return [cpu.value, statuses.occurrences.get("200"), times.count] as const
* })
*
* await Effect.runPromise(Effect.provideService(program, Metric.MetricRegistry, new Map())) // => [67.8, 2, 3]
* ```
*
* @category mutations
* @since 2.0.0
*/
var update = /*#__PURE__*/ dual(2, (self, input) => contextWith$1((services) => sync$1(() => self.updateUnsafe(input, services))));
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0-rc.112/node_modules/effect/dist/Effect.js
var Effect_exports = /* @__PURE__ */ __exportAll({
	Do: () => Do,
	Transaction: () => Transaction,
	TypeId: () => TypeId,
	abortSignal: () => abortSignal,
	acquireDisposable: () => acquireDisposable,
	acquireRelease: () => acquireRelease,
	acquireUseRelease: () => acquireUseRelease,
	addFinalizer: () => addFinalizer,
	all: () => all,
	andThen: () => andThen,
	annotateCurrentSpan: () => annotateCurrentSpan,
	annotateLogs: () => annotateLogs,
	annotateLogsScoped: () => annotateLogsScoped,
	annotateSpans: () => annotateSpans,
	as: () => as,
	asSome: () => asSome,
	asVoid: () => asVoid,
	awaitAllChildren: () => awaitAllChildren,
	bind: () => bind,
	bindTo: () => bindTo,
	cached: () => cached,
	cachedInvalidateWithTTL: () => cachedInvalidateWithTTL,
	cachedWithTTL: () => cachedWithTTL,
	callback: () => callback,
	catch: () => catch_,
	catchCause: () => catchCause,
	catchCauseFilter: () => catchCauseFilter,
	catchCauseIf: () => catchCauseIf,
	catchDefect: () => catchDefect,
	catchEager: () => catchEager,
	catchFilter: () => catchFilter,
	catchIf: () => catchIf,
	catchNoSuchElement: () => catchNoSuchElement,
	catchReason: () => catchReason,
	catchReasons: () => catchReasons,
	catchTag: () => catchTag,
	catchTags: () => catchTags,
	clockWith: () => clockWith,
	context: () => context,
	contextWith: () => contextWith,
	currentParentSpan: () => currentParentSpan,
	currentSpan: () => currentSpan,
	delay: () => delay,
	die: () => die,
	effectify: () => effectify,
	ensuring: () => ensuring,
	eventually: () => eventually,
	exit: () => exit,
	fail: () => fail,
	failCause: () => failCause,
	failCauseSync: () => failCauseSync,
	failSync: () => failSync,
	fiber: () => fiber,
	fiberId: () => fiberId,
	filter: () => filter,
	filterMap: () => filterMap,
	filterMapEffect: () => filterMapEffect,
	filterMapOrElse: () => filterMapOrElse,
	filterMapOrFail: () => filterMapOrFail,
	filterOrElse: () => filterOrElse,
	filterOrFail: () => filterOrFail,
	findFirst: () => findFirst,
	findFirstFilter: () => findFirstFilter,
	firstSuccessOf: () => firstSuccessOf,
	flatMap: () => flatMap,
	flatMapEager: () => flatMapEager,
	flatten: () => flatten,
	flip: () => flip,
	fn: () => fn,
	fnUntraced: () => fnUntraced,
	fnUntracedEager: () => fnUntracedEager,
	forEach: () => forEach,
	forever: () => forever,
	forkChild: () => forkChild,
	forkDetach: () => forkDetach,
	forkIn: () => forkIn,
	forkScoped: () => forkScoped,
	fromNullishOr: () => fromNullishOr,
	fromOption: () => fromOption,
	fromResult: () => fromResult,
	gen: () => gen,
	head: () => head,
	ignore: () => ignore,
	ignoreCause: () => ignoreCause,
	interrupt: () => interrupt,
	interruptible: () => interruptible,
	interruptibleMask: () => interruptibleMask,
	isEffect: () => isEffect,
	isFailure: () => isFailure,
	isSuccess: () => isSuccess,
	let: () => let_,
	linkSpans: () => linkSpans,
	log: () => log,
	logDebug: () => logDebug,
	logError: () => logError,
	logFatal: () => logFatal,
	logInfo: () => logInfo,
	logTrace: () => logTrace,
	logWarning: () => logWarning,
	logWithLevel: () => logWithLevel,
	makeSpan: () => makeSpan,
	makeSpanScoped: () => makeSpanScoped,
	map: () => map,
	mapBoth: () => mapBoth,
	mapBothEager: () => mapBothEager,
	mapEager: () => mapEager,
	mapError: () => mapError,
	mapErrorEager: () => mapErrorEager,
	match: () => match,
	matchCause: () => matchCause,
	matchCauseEager: () => matchCauseEager,
	matchCauseEffect: () => matchCauseEffect,
	matchCauseEffectEager: () => matchCauseEffectEager,
	matchEager: () => matchEager,
	matchEffect: () => matchEffect,
	never: () => never,
	onError: () => onError,
	onErrorFilter: () => onErrorFilter,
	onErrorIf: () => onErrorIf,
	onExit: () => onExit,
	onExitFilter: () => onExitFilter,
	onExitIf: () => onExitIf,
	onExitPrimitive: () => onExitPrimitive,
	onInterrupt: () => onInterrupt,
	option: () => option,
	orDie: () => orDie,
	orElseSucceed: () => orElseSucceed,
	partition: () => partition,
	promise: () => promise,
	provide: () => provide,
	provideContext: () => provideContext,
	provideService: () => provideService,
	provideServiceEffect: () => provideServiceEffect,
	race: () => race,
	raceAll: () => raceAll,
	raceAllFirst: () => raceAllFirst,
	raceFirst: () => raceFirst,
	reduce: () => reduce,
	repeat: () => repeat,
	repeatOrElse: () => repeatOrElse,
	replicate: () => replicate,
	replicateEffect: () => replicateEffect,
	request: () => request,
	requestUnsafe: () => requestUnsafe,
	result: () => result,
	retry: () => retry,
	retryOrElse: () => retryOrElse,
	runCallback: () => runCallback,
	runCallbackWith: () => runCallbackWith,
	runFork: () => runFork,
	runForkWith: () => runForkWith,
	runPromise: () => runPromise,
	runPromiseExit: () => runPromiseExit,
	runPromiseExitWith: () => runPromiseExitWith,
	runPromiseWith: () => runPromiseWith,
	runSync: () => runSync,
	runSyncExit: () => runSyncExit,
	runSyncExitWith: () => runSyncExitWith,
	runSyncWith: () => runSyncWith,
	sandbox: () => sandbox,
	satisfiesErrorType: () => satisfiesErrorType,
	satisfiesServicesType: () => satisfiesServicesType,
	satisfiesSuccessType: () => satisfiesSuccessType,
	schedule: () => schedule,
	scheduleFrom: () => scheduleFrom,
	scope: () => scope,
	scoped: () => scoped,
	scopedWith: () => scopedWith,
	service: () => service,
	serviceOption: () => serviceOption,
	setContext: () => setContext,
	sleep: () => sleep,
	spanAnnotations: () => spanAnnotations,
	spanLinks: () => spanLinks,
	succeed: () => succeed,
	succeedNone: () => succeedNone,
	succeedSome: () => succeedSome,
	suspend: () => suspend,
	sync: () => sync,
	tap: () => tap,
	tapCause: () => tapCause,
	tapCauseFilter: () => tapCauseFilter,
	tapCauseIf: () => tapCauseIf,
	tapDefect: () => tapDefect,
	tapError: () => tapError,
	tapErrorTag: () => tapErrorTag,
	timed: () => timed,
	timeout: () => timeout,
	timeoutOption: () => timeoutOption,
	timeoutOrElse: () => timeoutOrElse,
	tracer: () => tracer,
	track: () => track,
	trackDefects: () => trackDefects,
	trackDuration: () => trackDuration,
	trackErrors: () => trackErrors,
	trackSuccesses: () => trackSuccesses,
	transposeOption: () => transposeOption,
	try: () => try_,
	tryPromise: () => tryPromise,
	tx: () => tx,
	txRetry: () => txRetry,
	undefined: () => undefined_,
	uninterruptible: () => uninterruptible,
	uninterruptibleMask: () => uninterruptibleMask,
	unwrapReason: () => unwrapReason,
	updateContext: () => updateContext,
	updateService: () => updateService,
	updateServiceScoped: () => updateServiceScoped,
	useSpan: () => useSpan,
	validate: () => validate,
	void: () => void_,
	when: () => when,
	whileLoop: () => whileLoop,
	withErrorReporting: () => withErrorReporting,
	withExecutionPlan: () => withExecutionPlan,
	withFiber: () => withFiber,
	withLogSpan: () => withLogSpan,
	withLogger: () => withLogger,
	withParentSpan: () => withParentSpan,
	withSpan: () => withSpan,
	withSpanScoped: () => withSpanScoped,
	withTracer: () => withTracer,
	withTracerEnabled: () => withTracerEnabled,
	withTracerTiming: () => withTracerTiming,
	yieldNow: () => yieldNow,
	yieldNowWith: () => yieldNowWith,
	zip: () => zip,
	zipWith: () => zipWith
});
/**
* Runtime identifier used to recognize `Effect` values.
*
* @category type IDs
* @since 4.0.0
*/
var TypeId = EffectTypeId;
/**
* Checks whether a value is an `Effect`.
*
* **Example** (Checking whether a value is an Effect)
*
* ```ts import.meta.vitest
* import { Effect } from "effect"
*
* Effect.isEffect(Effect.succeed(1)) // => true
* Effect.isEffect("hello") // => false
* ```
*
* @category guards
* @since 2.0.0
*/
var isEffect = isEffect$1;
/**
* Combines an iterable or record of effects into one effect whose success shape
* follows the input.
*
* **When to use**
*
* Use to run a known collection of effects and collect results in the same
* tuple, iterable, or record shape.
*
* **Details**
*
* Tuple and iterable inputs collect results in order. Record inputs collect
* results under the same keys. By default, the combined effect fails on the
* first failure; with concurrent execution, effects that have already started
* may be interrupted, while effects not yet started are skipped.
*
* Options:
*
* Use `concurrency` to control sequential or concurrent execution. Use
* `mode: "result"` to run every effect and collect each success or failure as a
* `Result` in the same output shape. Use `discard: true` to ignore successful
* values and return `void`.
*
* **Example** (Collecting tuple results in order)
*
* ```ts import.meta.vitest
* import { Effect } from "effect"
*
* const tupleOfEffects = [
*   Effect.succeed(42),
*   Effect.succeed("Hello")
* ] as const
*
* //      ┌─── Effect<[number, string], never, never>
* //      ▼
* const resultsAsTuple = Effect.all(tupleOfEffects)
*
* await Effect.runPromise(resultsAsTuple) // => [42, "Hello"]
* ```
*
* **Example** (Collecting iterable results in order)
*
* ```ts import.meta.vitest
* import { Effect } from "effect"
*
* const iterableOfEffects: Iterable<Effect.Effect<number>> = [1, 2, 3].map(
*   Effect.succeed
* )
*
* //      ┌─── Effect<number[], never, never>
* //      ▼
* const resultsAsArray = Effect.all(iterableOfEffects)
*
* await Effect.runPromise(resultsAsArray) // => [1, 2, 3]
* ```
*
* **Example** (Collecting struct results by key)
*
* ```ts import.meta.vitest
* import { Effect } from "effect"
*
* const structOfEffects = {
*   a: Effect.succeed(42),
*   b: Effect.succeed("Hello")
* }
*
* //      ┌─── Effect<{ a: number; b: string; }, never, never>
* //      ▼
* const resultsAsStruct = Effect.all(structOfEffects)
*
* await Effect.runPromise(resultsAsStruct) // => { a: 42, b: "Hello" }
* ```
*
* **Example** (Collecting record results by key)
*
* ```ts import.meta.vitest
* import { Effect } from "effect"
*
* const recordOfEffects: Record<string, Effect.Effect<number>> = {
*   key1: Effect.succeed(1),
*   key2: Effect.succeed(2)
* }
*
* //      ┌─── Effect<{ [x: string]: number; }, never, never>
* //      ▼
* const resultsAsRecord = Effect.all(recordOfEffects)
*
* await Effect.runPromise(resultsAsRecord) // => { key1: 1, key2: 2 }
* ```
*
* **Example** (Stopping on the first failure)
*
* ```ts import.meta.vitest
* import { Effect, Exit } from "effect"
* const output: Array<unknown> = []
* const record = (value: unknown) => Effect.sync(() => { output.push(value) })
*
* const program = Effect.all([
*   Effect.succeed("Task1").pipe(Effect.tap(record)),
*   Effect.fail("Task2: Oh no!").pipe(Effect.tap(record)),
*   // Won't execute due to earlier failure
*   Effect.succeed("Task3").pipe(Effect.tap(record))
* ])
*
* const outcome = await Effect.runPromiseExit(program)
* const observation = [output, outcome] // => [["Task1"], Exit.fail("Task2: Oh no!")]
* ```
*
* @see {@link forEach} for iterating over elements and applying an effect.
* @category combining
* @since 2.0.0
*/
var all = all$1;
/**
* Applies an effectful function to each element and partitions failures and
* successes.
*
* **Details**
*
* The returned tuple is `[excluded, satisfying]`, where `excluded` contains
* all failures and `satisfying` contains all successes.
*
* This function runs every effect and never fails. Use `concurrency` to control
* parallelism.
*
* **Example** (Separating successes and failures)
*
* ```ts import.meta.vitest
* import { Effect } from "effect"
*
* const program = Effect.partition([0, 1, 2, 3], (n) =>
*   n % 2 === 0 ? Effect.fail(`${n} is even`) : Effect.succeed(n)
* )
*
* await Effect.runPromise(program) // => [['0 is even', '2 is even'], [1, 3]]
* ```
*
* @category filtering
* @since 2.0.0
*/
var partition = partition$1;
/**
* Reduces elements from left to right with an effectful accumulator function.
*
* **When to use**
*
* Use when each accumulation step is effectful and must run sequentially in
* iteration order.
*
* **Details**
*
* The accumulator function receives the current accumulator, the current
* element, and its zero-based index. The `zero` function is evaluated each
* time the effect runs. An empty iterable succeeds with its result. If a step
* fails, remaining elements are not processed.
*
* **Example** (Summing values sequentially)
*
* ```ts import.meta.vitest
* import { Effect } from "effect"
* const output: Array<unknown> = []
*
* const program = Effect.reduce(
*   [1, 2, 3],
*   () => 0,
*   (total, value, index) =>
*     Effect.sync(() => { output.push(`Adding ${value} at index ${index}`) }).pipe(
*       Effect.as(total + value)
*     )
* )
*
* void output.push(await Effect.runPromise(program))
* output // => ["Adding 1 at index 0", "Adding 2 at index 1", "Adding 3 at index 2", 6]
* ```
*
* @category folding
* @since 2.0.0
*/
var reduce = reduce$1;
/**
* Applies an effectful function to each element and accumulates all failures.
*
* **Details**
*
* This function always evaluates every element. If at least one effect fails,
* all failures are returned as a non-empty array and successes are discarded.
* If all effects succeed, it returns all collected successes.
*
* Use `discard: true` to ignore successful values while still validating all
* elements.
*
* **Example** (Validating every element)
*
* ```ts import.meta.vitest
* import { Effect, Exit } from "effect"
*
* const program = Effect.validate([0, 1, 2, 3], (n) =>
*   n % 2 === 0 ? Effect.fail(`${n} is even`) : Effect.succeed(n)
* )
*
* await Effect.runPromiseExit(program) // => Exit.fail(["0 is even", "2 is even"])
* ```
*
* @category validation
* @since 2.0.0
*/
var validate = validate$1;
/**
* Returns the first element that satisfies an effectful predicate.
*
* **Details**
*
* The predicate receives the element and its index. Evaluation short-circuits
* as soon as an element matches.
*
* **Example** (Finding the first successful match)
*
* ```ts import.meta.vitest
* import { Effect, Option } from "effect"
*
* const program = Effect.findFirst([1, 2, 3, 4], (n) => Effect.succeed(n > 2))
*
* await Effect.runPromise(program) // => Option.some(3)
* ```
*
* @category searching
* @since 2.0.0
*/
var findFirst = findFirst$1;
/**
* Returns the first value that passes an effectful `FilterEffect`.
*
* **When to use**
*
* Use when you need to find the first element that satisfies an effectful
* filter returning a `Result`, which also transforms the matching element.
*
* **Details**
*
* The filter receives the element and index. Evaluation short-circuits on the
* first `Result.succeed` and returns the transformed value in `Option.some`.
*
* @see {@link findFirst} for the simpler effectful predicate-based variant
*
* @category searching
* @since 4.0.0
*/
var findFirstFilter = findFirstFilter$1;
/**
* Executes an effectful operation for each element in an `Iterable`.
*
* **When to use**
*
* Use to traverse an iterable with an effectful function while preserving
* element order in the collected results.
*
* **Details**
*
* The `forEach` function applies a provided operation to each element in the
* iterable, producing a new effect that returns an array of results.
*
* If any effect fails, the iteration stops immediately (short-circuiting), and
* the error is propagated.
*
* Concurrency:
*
* The `concurrency` option controls how many operations are performed
* concurrently. By default, the operations are performed sequentially.
*
* Discarding Results:
*
* If the `discard` option is set to `true`, the intermediate results are not
* collected, and the final result of the operation is `void`.
*
* **Example** (Mapping over an iterable with effects)
*
* ```ts import.meta.vitest
* import { Effect } from "effect"
* const output: Array<unknown> = []
*
* const result = Effect.forEach(
*   [1, 2, 3, 4, 5],
*   (n, index) =>
*     Effect.sync(() => { output.push(`Currently at index ${index}`) }).pipe(Effect.as(n * 2))
* )
*
* void output.push(await Effect.runPromise(result))
* output // => ["Currently at index 0", "Currently at index 1", "Currently at index 2", "Currently at index 3", "Currently at index 4", [2, 4, 6, 8, 10]]
* ```
*
* **Example** (Running effects without collecting results)
*
* ```ts import.meta.vitest
* import { Effect } from "effect"
* const output: Array<unknown> = []
*
* // Apply effects but discard the results
* const result = Effect.forEach(
*   [1, 2, 3, 4, 5],
*   (n, index) =>
*     Effect.sync(() => { output.push(`Currently at index ${index}`) }).pipe(Effect.as(n * 2)),
*   { discard: true }
* )
*
* void output.push(await Effect.runPromise(result))
* output // => ["Currently at index 0", "Currently at index 1", "Currently at index 2", "Currently at index 3", "Currently at index 4", undefined]
* ```
*
* @see {@link all} for combining multiple effects into one.
* @category sequencing
* @since 2.0.0
*/
var forEach = forEach$1;
/**
* Returns the first element of the iterable produced by an effect, or fails
* with `NoSuchElementError` if the iterable is empty.
*
* **When to use**
*
* Use when an effect produces a collection that must contain at least one
* element and absence should be represented in the typed error channel.
*
* **Example** (Getting the first element)
*
* ```ts import.meta.vitest
* import { Effect, Option } from "effect"
*
* const first = await Effect.runPromise(Effect.head(Effect.succeed([1, 2, 3])))
* first // => 1
*
* const empty = Effect.head(Effect.succeed([] as Array<number>)).pipe(Effect.catchNoSuchElement)
* await Effect.runPromise(empty) // => Option.none()
* ```
*
* @category getters
* @since 2.0.0
*/
var head = head$1;
/**
* Executes a body effect repeatedly while a condition holds true.
*
* **Example** (Repeating an effectful loop)
*
* ```ts import.meta.vitest
* import { Effect } from "effect"
* const output: Array<unknown> = []
*
* let counter = 0
*
* const program = Effect.whileLoop({
*   while: () => counter < 5,
*   body: () => Effect.sync(() => ++counter),
*   step: (n) => void output.push(`Current count: ${n}`)
* })
*
* await Effect.runPromise(program)
* output // => ["Current count: 1", "Current count: 2", "Current count: 3", "Current count: 4", "Current count: 5"]
* ```
*
* @category repetition
* @since 2.0.0
*/
var whileLoop = whileLoop$1;
/**
* Creates an `Effect` that represents an asynchronous computation guaranteed to
* succeed.
*
* **When to use**
*
* Use to convert a `Promise` into an `Effect` when the async operation is
* guaranteed to succeed and will not reject.
*
* **Details**
*
* An optional `AbortSignal` can be provided to allow for interruption of the
* wrapped `Promise` API.
*
* **Gotchas**
*
* The `Promise` must not reject. If it rejects, the rejection is treated as a
* defect, not as a typed failure. Use `tryPromise` when rejection is expected.
*
* Interruption aborts the provided `AbortSignal`, but the underlying
* asynchronous operation only stops if it observes that signal.
*
* **Example** (Wrapping a non-rejecting Promise)
*
* ```ts import.meta.vitest
* import { Effect } from "effect"
*
* const succeedAsync = (message: string) =>
*   Effect.promise<string>(() => Promise.resolve(message))
*
* //      ┌─── Effect<string, never, never>
* //      ▼
* const program = succeedAsync("Async operation completed successfully!")
* await Effect.runPromise(program) // => "Async operation completed successfully!"
* ```
*
* @see {@link tryPromise} for a version that can handle failures.
* @category constructors
* @since 2.0.0
*/
var promise = promise$1;
/**
* Creates an `Effect` from an asynchronous computation that may throw or
* reject, mapping failures into the error channel.
*
* **When to use**
*
* Use when you need to perform asynchronous operations that might fail, such
* as fetching data from an API, and want thrown exceptions or rejected promises
* captured as Effect errors.
*
* **Details**
*
* The promise thunk is evaluated when the effect runs. If it returns a promise
* that resolves, the resolved value becomes the success value. If the thunk
* throws before returning a promise, or if the returned promise rejects, the
* thrown or rejected value is mapped into the error channel.
*
* Passing the thunk directly maps failures to {@link Cause.UnknownError}.
* Passing `{ try, catch }` uses `catch` to map failures to an error of type
* `E`.
*
* The thunk receives an `AbortSignal` that is aborted if the effect is
* interrupted. The underlying asynchronous operation only stops if it observes
* that signal.
*
* **Gotchas**
*
* If `catch` throws while mapping the error, that thrown value is treated as a
* defect. Return the error value you want in the error channel instead of
* throwing it.
*
* **Example** (Wrapping a fetch request that may fail)
*
* ```ts import.meta.vitest
* import { Effect } from "effect"
*
* const getTodo = (id: number) =>
*   Effect.tryPromise(() => Promise.resolve({ id, completed: false }))
*
* //      ┌─── Effect<{ id: number; completed: boolean }, UnknownError, never>
* //      ▼
* const program = getTodo(1)
* await Effect.runPromise(program) // => { id: 1, completed: false }
* ```
*
* **Example** (Mapping Promise rejections to a tagged error)
*
* ```ts import.meta.vitest
* import { Data, Effect } from "effect"
*
* class TodoFetchError extends Data.TaggedError("TodoFetchError")<{ readonly cause: unknown }> {}
*
* const getTodo = (id: number) =>
*   Effect.tryPromise({
*     try: () => Promise.reject(`Todo ${id} is unavailable`),
*     // remap the error
*     catch: (cause) => new TodoFetchError({ cause })
*   })
*
* //      ┌─── Effect<never, TodoFetchError, never>
* //      ▼
* const program = Effect.flip(getTodo(1))
* const error = await Effect.runPromise(program)
* error._tag // => "TodoFetchError"
* ```
*
* @see {@link promise} if the effectful computation is asynchronous and does not throw errors.
* @category constructors
* @since 2.0.0
*/
var tryPromise = tryPromise$1;
/**
* Creates an `Effect` that always succeeds with a given value.
*
* **When to use**
*
* Use when an effect should complete successfully with a specific value without any errors
* or external dependencies.
*
* **Example** (Creating a successful effect)
*
* ```ts import.meta.vitest
* import { Effect } from "effect"
*
* // Creating an effect that represents a successful scenario
* //
* //      ┌─── Effect<number, never, never>
* //      ▼
* const success = Effect.succeed(42)
* Effect.runSync(success) // => 42
* ```
*
* @see {@link fail} to create an effect that represents a failure.
* @category constructors
* @since 2.0.0
*/
var succeed = succeed$4;
/**
* Returns an effect which succeeds with `None`.
*
* **Example** (Succeeding with Option.none)
*
* ```ts import.meta.vitest
* import { Effect, Option } from "effect"
*
* const program = Effect.succeedNone
*
* Effect.runSync(program) // => Option.none()
* ```
*
* @category constructors
* @since 2.0.0
*/
var succeedNone = succeedNone$1;
/**
* Returns an effect which succeeds with the value wrapped in a `Some`.
*
* **Example** (Succeeding with Option.some)
*
* ```ts import.meta.vitest
* import { Effect, Option } from "effect"
*
* const program = Effect.succeedSome(42)
*
* Effect.runSync(program) // => Option.some(42)
* ```
*
* @category constructors
* @since 2.0.0
*/
var succeedSome = succeedSome$1;
/**
* Creates an `Effect` lazily, delaying construction until it is needed.
*
* **When to use**
*
* Use when you need to defer the evaluation of an effect until it is required.
*
* **Details**
*
* `suspend` takes a thunk that represents an effect and delays creating it
* until the suspended effect is evaluated. This is useful for optimizing
* expensive computations, managing circular dependencies such as recursive
* functions, and helping TypeScript unify return types when branches construct
* different effects. Any side effects or scoped captures inside the thunk are
* re-executed on each invocation.
*
* **Example** (Lazily evaluating side effects)
*
* ```ts import.meta.vitest
* import { Effect } from "effect"
*
* let i = 0
*
* const bad = Effect.succeed(i++)
*
* const good = Effect.suspend(() => Effect.succeed(i++))
*
* Effect.runSync(bad) // => 0
* Effect.runSync(bad) // => 0
*
* Effect.runSync(good) // => 1
* Effect.runSync(good) // => 2
* ```
*
* **Example** (Suspending recursive Fibonacci evaluation)
*
* ```ts import.meta.vitest
* import { Effect } from "effect"
*
* const blowsUp = (n: number): Effect.Effect<number> =>
*   n < 2
*     ? Effect.succeed(1)
*     : Effect.zipWith(blowsUp(n - 1), blowsUp(n - 2), (a, b) => a + b)
*
* // console.log(Effect.runSync(blowsUp(32)))
* // crash: JavaScript heap out of memory
*
* const allGood = (n: number): Effect.Effect<number> =>
*   n < 2
*     ? Effect.succeed(1)
*     : Effect.zipWith(
*         Effect.suspend(() => allGood(n - 1)),
*         Effect.suspend(() => allGood(n - 2)),
*         (a, b) => a + b
*       )
*
* Effect.runSync(allGood(16)) // => 1597
* ```
*
* **Example** (Helping TypeScript infer recursive effect types)
*
* ```ts import.meta.vitest
* import { Effect } from "effect"
*
* //   Without suspend, TypeScript may struggle with type inference.
* //   Inferred type:
* //     (a: number, b: number) =>
* //       Effect<never, Error, never> | Effect<number, never, never>
* const withoutSuspend = (a: number, b: number) =>
*   b === 0
*     ? Effect.fail(new Error("Cannot divide by zero"))
*     : Effect.succeed(a / b)
*
* //   Using suspend to unify return types.
* //   Inferred type:
* //     (a: number, b: number) => Effect<number, Error, never>
* const withSuspend = (a: number, b: number) =>
*   Effect.suspend(() =>
*     b === 0
*       ? Effect.fail(new Error("Cannot divide by zero"))
*       : Effect.succeed(a / b)
*   )
*
* Effect.runSync(withSuspend(6, 2)) // => 3
* ```
*
* @category constructors
* @since 2.0.0
*/
var suspend = suspend$2;
/**
* Creates an `Effect` that represents a synchronous side-effectful computation.
*
* **When to use**
*
* Use when you need to wrap a synchronous side-effectful operation that is not
* expected to throw.
*
* **Details**
*
* The provided function is evaluated lazily when the effect runs.
*
* **Gotchas**
*
* The function must not throw. If it throws, the thrown value is treated as a
* defect, not as a typed failure. Use `try` when throwing is expected.
*
* **Example** (Capturing synchronous logging in an Effect)
*
* ```ts import.meta.vitest
* import { Effect } from "effect"
* const output: Array<unknown> = []
*
* const log = (message: string) =>
*   Effect.sync(() => {
*     void output.push(message) // side effect
*   })
*
* //      ┌─── Effect<void, never, never>
* //      ▼
* const program = log("Hello, World!")
* Effect.runSync(program)
* output // => ["Hello, World!"]
* ```
*
* @see {@link try_ | try} for a version that can handle failures.
* @category constructors
* @since 2.0.0
*/
var sync = sync$1;
var void_ = void_$2;
var undefined_ = undefined_$1;
/**
* Creates an `Effect` from a callback-based asynchronous API.
*
* **When to use**
*
* Use when you need to integrate APIs that complete through callbacks instead
* of returning a `Promise`.
*
* **Details**
*
* The registration function receives a `resume` callback and, when requested,
* an `AbortSignal`. Call `resume` at most once with the effect that should
* complete the fiber; later calls are ignored. Return an optional cleanup
* effect from the registration function to run if the fiber is interrupted.
*
* **Example** (Integrating callback APIs)
*
* ```ts import.meta.vitest
* import { Effect } from "effect"
* const output: Array<unknown> = []
*
* const fromCallback = (message: string) =>
*   Effect.callback<void>((resume) => {
*     queueMicrotask(() => {
*       void output.push(message)
*       resume(Effect.void)
*     })
*   })
*
* await Effect.runPromise(fromCallback("callback completed"))
* output // => ["callback completed"]
* ```
*
* @category constructors
* @since 4.0.0
*/
var callback = callback$1;
/**
* Returns an effect that will never produce anything. The moral equivalent of
* `while(true) {}`, only without the wasted CPU cycles.
*
* **Example** (Creating a never-ending effect)
*
* ```ts import.meta.vitest
* import { Effect, Option } from "effect"
*
* const program = Effect.timeoutOption(Effect.never, 0)
* await Effect.runPromise(program) // => Option.none()
* ```
*
* @category constructors
* @since 2.0.0
*/
var never = never$1;
/**
* Effect that succeeds with an empty record `{}`, used as the starting point
* for do notation chains.
*
* **Example** (Starting do notation)
*
* ```ts import.meta.vitest
* import { Effect, pipe } from "effect"
*
* const program = pipe(
*   Effect.Do,
*   Effect.bind("x", () => Effect.succeed(2)),
*   Effect.bind("y", ({ x }) => Effect.succeed(x + 1)),
*   Effect.let("sum", ({ x, y }) => x + y)
* )
*
* Effect.runSync(program) // => { x: 2, y: 3, sum: 5 }
* ```
*
* @category constructors
* @since 2.0.0
*/
var Do = Do$1;
/**
* Gives a name to the success value of an `Effect`, creating a single-key
* record used in do notation pipelines.
*
* **When to use**
*
* Use to start a do-notation pipeline from an existing `Effect` when its
* success value should become the first named field in the accumulated record.
*
* @see {@link Do} for starting from an empty accumulated record
* @see {@link bind} for adding fields produced by effects
*
* @category mapping
* @since 2.0.0
*/
var bindTo = bindTo$1;
var let_ = let_$1;
/**
* Adds an `Effect` value to the do notation record under a given name.
*
* **When to use**
*
* Use to sequence an effectful step in a do-notation pipeline when that step
* depends on fields already accumulated in the record and its success value
* should be stored under a name.
*
* **Details**
*
* The function receives the current record, runs the returned effect after the
* input effect succeeds, and inserts its success value under `name`. The
* resulting effect combines the error and service requirements of both steps.
*
* **Gotchas**
*
* Binding a name that already exists replaces that field in the resulting
* record.
*
* @see {@link Do} for starting from an empty do-notation record
* @see {@link bindTo} for naming the success value of an existing effect
* @see {@link gen} for generator-based sequencing without accumulating a record
*
* @category sequencing
* @since 2.0.0
*/
var bind = bind$1;
/**
* Provides a way to write effectful code using generator functions, simplifying
* control flow and error handling.
*
* **When to use**
*
* Use when you want to write effectful code that looks and behaves like
* synchronous code, while still handling asynchronous tasks, errors, and complex
* control flow such as loops and conditions.
*
* Generator functions work similarly to `async/await` but keep errors,
* requirements, and interruption in the Effect type. You can `yield*` values
* from effects and return the final result at the end.
*
* **Example** (Sequencing effects with generators)
*
* ```ts import.meta.vitest
* import { Data, Effect } from "effect"
*
* class DiscountRateError extends Data.TaggedError("DiscountRateError")<{}> {}
*
* const addServiceCharge = (amount: number) => amount + 1
*
* const applyDiscount = (
*   total: number,
*   discountRate: number
* ): Effect.Effect<number, DiscountRateError> =>
*   discountRate === 0
*     ? Effect.fail(new DiscountRateError())
*     : Effect.succeed(total - (total * discountRate) / 100)
*
* const fetchTransactionAmount = Effect.promise(() => Promise.resolve(100))
*
* const fetchDiscountRate = Effect.promise(() => Promise.resolve(5))
*
* export const program = Effect.gen(function*() {
*   const transactionAmount = yield* fetchTransactionAmount
*   const discountRate = yield* fetchDiscountRate
*   const discountedAmount = yield* applyDiscount(
*     transactionAmount,
*     discountRate
*   )
*   const finalAmount = addServiceCharge(discountedAmount)
*   return `Final amount to charge: ${finalAmount}`
* })
*
* await Effect.runPromise(program) // => "Final amount to charge: 96"
* ```
*
* @category constructors
* @since 2.0.0
*/
var gen = gen$1;
/**
* Creates an `Effect` that represents a recoverable error.
*
* **When to use**
*
* Use to explicitly signal a recoverable error in an `Effect`.
*
* **Details**
*
* The error keeps propagating unless it is handled. You can handle tagged
* errors with functions like {@link catchTag} or {@link catchTags}.
*
* **Example** (Creating a failed effect)
*
* ```ts import.meta.vitest
* import { Data, Effect } from "effect"
*
* class OperationFailedError extends Data.TaggedError("OperationFailedError")<{}> {}
*
* //      ┌─── Effect<never, OperationFailedError, never>
* //      ▼
* const failure = Effect.fail(
*   new OperationFailedError()
* )
* Effect.runSync(Effect.flip(failure))._tag // => "OperationFailedError"
* ```
*
* @see {@link succeed} to create an effect that represents a successful value.
* @category constructors
* @since 2.0.0
*/
var fail = fail$4;
/**
* Creates an `Effect` that represents a recoverable error using a lazy evaluation.
*
* **When to use**
*
* Use to defer computing a recoverable error value until the effect is run.
*
* **Details**
*
* The error-producing function is evaluated each time the effect is executed.
*
* **Example** (Lazily creating failures)
*
* ```ts import.meta.vitest
* import { Data, Effect } from "effect"
*
* class ProgramError extends Data.TaggedError("ProgramError")<{ readonly operation: string }> {}
*
* const program = Effect.failSync(() => new ProgramError({ operation: "sync" }))
*
* Effect.runSync(Effect.flip(program)).operation // => "sync"
* ```
*
* @category constructors
* @since 2.0.0
*/
var failSync = failSync$1;
/**
* Creates an `Effect` that represents a failure with a specific `Cause`.
*
* **When to use**
*
* Use when you already have a full `Cause` and need to preserve defects,
* interruptions, annotations, or combined failures in the effect's failure
* channel.
*
* **Details**
*
* This function allows you to create effects that fail with complex error
* structures, including multiple errors, defects, interruptions, and more.
*
* **Example** (Failing with a full Cause)
*
* ```ts import.meta.vitest
* import { Cause, Effect } from "effect"
*
* const program = Effect.failCause(
*   Cause.fail("Network error")
* )
*
* Effect.runSync(Effect.flip(program)) // => "Network error"
* ```
*
* @category constructors
* @since 2.0.0
*/
var failCause = failCause$3;
/**
* Creates an `Effect` that represents a failure with a `Cause` computed lazily.
*
* **When to use**
*
* Use to defer computing a full `Cause` until the effect is run.
*
* **Details**
*
* The cause-producing function is evaluated each time the effect is executed.
*
* **Example** (Lazily creating a Cause)
*
* ```ts import.meta.vitest
* import { Cause, Effect } from "effect"
*
* const program = Effect.failCauseSync(() =>
*   Cause.fail("Error computed at runtime")
* )
*
* Effect.runSync(Effect.flip(program)) // => "Error computed at runtime"
* ```
*
* @category constructors
* @since 2.0.0
*/
var failCauseSync = failCauseSync$1;
/**
* Creates an effect that terminates a fiber with a specified error.
*
* **When to use**
*
* Use when you need an `Effect` to report an unrecoverable defect instead of a
* typed error.
*
* **Details**
*
* The `die` function is used to signal a defect, which represents a critical
* and unexpected error in the code. When invoked, it produces an effect that
* does not handle the error and instead terminates the fiber.
*
* The error channel of the resulting effect is of type `never`, indicating that
* it cannot recover from this failure.
*
* **Example** (Failing on division by zero)
*
* ```ts import.meta.vitest
* import { Effect, Exit } from "effect"
*
* const defect = new Error("Cannot divide by zero")
* const divide = (a: number, b: number) =>
*   b === 0
*     ? Effect.die(defect)
*     : Effect.succeed(a / b)
*
* //      ┌─── Effect<number, never, never>
* //      ▼
* const program = divide(1, 0)
*
* Effect.runSyncExit(program) // => Exit.die(defect)
* ```
*
* @category constructors
* @since 2.0.0
*/
var die = die$3;
var try_ = try_$1;
/**
* Yields control back to the Effect runtime, allowing other fibers to execute.
*
* **Example** (Yielding to other fibers)
*
* ```ts import.meta.vitest
* import { Effect } from "effect"
* const output: Array<unknown> = []
*
* const program = Effect.gen(function*() {
*   void output.push("Before yield")
*   yield* Effect.yieldNow
*   void output.push("After yield")
* })
*
* await Effect.runPromise(program)
* output // => ["Before yield", "After yield"]
* ```
*
* @category constructors
* @since 2.0.0
*/
var yieldNow = yieldNow$1;
/**
* Yields control back to the Effect runtime with a specified priority, allowing other fibers to execute.
*
* **Example** (Yielding with priority)
*
* ```ts import.meta.vitest
* import { Effect } from "effect"
* const output: Array<unknown> = []
*
* const program = Effect.gen(function*() {
*   void output.push("High priority task")
*   yield* Effect.yieldNowWith(10) // Higher priority
*   void output.push("Continued after yield")
* })
*
* await Effect.runPromise(program)
* output // => ["High priority task", "Continued after yield"]
* ```
*
* @category constructors
* @since 4.0.0
*/
var yieldNowWith = yieldNowWith$1;
/**
* Provides access to the current fiber within an effect computation.
*
* **Example** (Reading the current fiber)
*
* ```ts import.meta.vitest
* import { Effect } from "effect"
*
* const program = Effect.withFiber((fiber) => Effect.succeed(typeof fiber.id))
*
* Effect.runSync(program) // => "number"
* ```
*
* @category constructors
* @since 4.0.0
*/
var withFiber = withFiber$1;
/**
* Converts a `Result` to an `Effect`.
*
* **Example** (Converting a Result into an Effect)
*
* ```ts import.meta.vitest
* import { Effect, Result } from "effect"
* const output: Array<unknown> = []
*
* const success = Result.succeed(42)
* const failure = Result.fail("Something went wrong")
*
* const effect1 = Effect.fromResult(success)
* const effect2 = Effect.fromResult(failure)
*
* void output.push(Effect.runSync(effect1))
* void output.push(Effect.runSync(Effect.flip(effect2)))
* output // => [42, "Something went wrong"]
* ```
*
* @category converting
* @since 4.0.0
*/
var fromResult = fromResult$1;
/**
* Converts an `Option` into an `Effect`.
*
* **When to use**
*
* Use when absence should become a typed `NoSuchElementError` in the effect error
* channel.
*
* **Details**
*
* `Option.some` becomes a successful effect with the contained value, while
* `Option.none` becomes a failed effect. By default the failure is a
* `NoSuchElementError`, but you can provide an `onNone` callback to customize
* the error value.
*
* **Example** (Converting an Option into an Effect)
*
* ```ts import.meta.vitest
* import { Effect, Option } from "effect"
* const output: Array<unknown> = []
*
* const some = Option.some(42)
* const none = Option.none()
*
* const effect1 = Effect.fromOption(some)
* const effect2 = Effect.fromOption(none)
* const effect3 = Effect.fromOption(none, () => new Error("missing"))
*
* void output.push(Effect.runSync(effect1))
* void output.push(Effect.runSync(Effect.flip(effect2))._tag)
* void output.push(Effect.runSync(Effect.flip(effect3)).message)
* output // => [42, "NoSuchElementError", "missing"]
* ```
*
* @category converting
* @since 4.0.0
*/
var fromOption = fromOption$1;
/**
* Converts an `Option` of an `Effect` into an `Effect` of an `Option`.
*
* **When to use**
*
* Use when an effect should run only when an optional value is present, while
* preserving absence as a successful `None`.
*
* **Details**
*
* - `None` becomes an effect that succeeds with `None`
* - `Some(effect)` runs the inner effect and wraps its success value in `Some`
* - Inner failures are preserved in the resulting effect
*
* **Example** (Transposing an Option of an Effect)
*
* ```ts import.meta.vitest
* import { Effect, Option } from "effect"
*
* const some = Option.some(Effect.succeed(42))
*
* //      ┌─── Effect<Option<number>, never, never>
* //      ▼
* const program = Effect.transposeOption(some)
*
* Effect.runSync(program) // => Option.some(42)
* ```
*
* @category converting
* @since 3.13.0
*/
var transposeOption = transposeOption$1;
/**
* Converts a nullable value to an `Effect`, failing with a `NoSuchElementError`
* when the value is `null` or `undefined`.
*
* **Example** (Failing on nullish values)
*
* ```ts import.meta.vitest
* import { Effect } from "effect"
* const output: Array<unknown> = []
*
* const program = Effect.fn(function*(input: string | null) {
*   const value = yield* Effect.fromNullishOr(input)
*   yield* Effect.sync(() => { output.push(value) })
* },
*   Effect.catch(() => Effect.sync(() => { output.push("missing") }))
* )
*
* await Effect.runPromise(program(null))
* await Effect.runPromise(program("hello"))
* output // => ["missing", "hello"]
* ```
*
* @category converting
* @since 4.0.0
*/
var fromNullishOr = fromNullishOr$1;
/**
* Chains effects to produce new `Effect` instances, useful for combining
* operations that depend on previous results.
*
* **When to use**
*
* Use when you need to chain multiple effects, ensuring that each
* step produces a new `Effect` while flattening any nested effects that may
* occur.
*
* **Details**
*
* `flatMap` lets you sequence effects so that the result of one effect can be
* used in the next step. It is similar to `flatMap` used with arrays but works
* specifically with `Effect` instances, allowing you to avoid deeply nested
* effect structures.
*
* Since effects are immutable, `flatMap` always returns a new effect instead of
* changing the original one.
*
* **Example** (Choosing flatMap syntax variants)
*
* ```ts import.meta.vitest
* import { Effect, pipe } from "effect"
* const output: Array<unknown> = []
*
* const myEffect = Effect.succeed(1)
* const transformation = (n: number) => Effect.succeed(n + 1)
*
* const flatMappedWithPipe = pipe(myEffect, Effect.flatMap(transformation))
* const flatMappedWithDataFirst = Effect.flatMap(myEffect, transformation)
* const flatMappedWithMethod = myEffect.pipe(Effect.flatMap(transformation))
*
* void output.push(Effect.runSync(Effect.all([
*   flatMappedWithPipe,
*   flatMappedWithDataFirst,
*   flatMappedWithMethod
* ])))
* output // => [[2, 2, 2]]
* ```
*
* **Example** (Sequencing dependent effects)
*
* ```ts import.meta.vitest
* import { Data, Effect, pipe } from "effect"
*
* class DiscountRateError extends Data.TaggedError("DiscountRateError")<{}> {}
*
* // Function to apply a discount safely to a transaction amount
* const applyDiscount = (
*   total: number,
*   discountRate: number
* ): Effect.Effect<number, DiscountRateError> =>
*   discountRate === 0
*     ? Effect.fail(new DiscountRateError())
*     : Effect.succeed(total - (total * discountRate) / 100)
*
* // Simulated asynchronous task to fetch a transaction amount from database
* const fetchTransactionAmount = Effect.promise(() => Promise.resolve(100))
*
* // Chaining the fetch and discount application using `flatMap`
* const finalAmount = pipe(
*   fetchTransactionAmount,
*   Effect.flatMap((amount) => applyDiscount(amount, 5))
* )
*
* await Effect.runPromise(finalAmount) // => 95
* ```
*
* @see {@link tap} for a version that ignores the result of the effect.
* @category sequencing
* @since 2.0.0
*/
var flatMap = flatMap$2;
/**
* Flattens an `Effect` that produces another `Effect` into a single effect.
*
* **Example** (Flattening nested effects)
*
* ```ts import.meta.vitest
* import { Effect } from "effect"
* const output: Array<unknown> = []
*
* const nested = Effect.succeed(Effect.succeed("hello"))
*
* const program = Effect.gen(function*() {
*   const value = yield* Effect.flatten(nested)
*   yield* Effect.sync(() => { output.push(value) })
* })
*
* Effect.runSync(program)
* output // => ["hello"]
* ```
*
* @category sequencing
* @since 2.0.0
*/
var flatten = flatten$1;
/**
* Runs this effect and then runs another effect, optionally using the first
* effect's success value to choose the next effect.
*
* **When to use**
*
* Use when you need one effect to run after another and the second effect may
* depend on the first effect's success value.
*
* **Details**
*
* When the second argument is an `Effect`, the first success value is discarded
* and the returned effect produces the second effect's value. When the second
* argument is a function, it receives the first success value and must return
* the next `Effect`.
*
* Failures or requirements from either effect are preserved in the returned
* effect.
*
* **Example** (Choosing andThen syntax variants)
*
* ```ts import.meta.vitest
* import { Effect, pipe } from "effect"
* const output: Array<unknown> = []
*
* const myEffect = Effect.succeed(1)
* const anotherEffect = Effect.succeed("done")
*
* const transformedWithPipe = pipe(myEffect, Effect.andThen(anotherEffect))
* const transformedWithDataFirst = Effect.andThen(myEffect, anotherEffect)
* const transformedWithMethod = myEffect.pipe(Effect.andThen(anotherEffect))
*
* void output.push(Effect.runSync(Effect.all([
*   transformedWithPipe,
*   transformedWithDataFirst,
*   transformedWithMethod
* ])))
* output // => [['done', 'done', 'done']]
* ```
*
* **Example** (Sequencing a discount calculation after fetching a total)
*
* ```ts import.meta.vitest
* import { Data, Effect, pipe } from "effect"
*
* class DiscountRateError extends Data.TaggedError("DiscountRateError")<{}> {}
*
* // Function to apply a discount safely to a transaction amount
* const applyDiscount = (
*   total: number,
*   discountRate: number
* ): Effect.Effect<number, DiscountRateError> =>
*   discountRate === 0
*     ? Effect.fail(new DiscountRateError())
*     : Effect.succeed(total - (total * discountRate) / 100)
*
* // Simulated asynchronous task to fetch a transaction amount from database
* const fetchTransactionAmount = Effect.promise(() => Promise.resolve(100))
*
* // Using Effect.map and Effect.flatMap
* const result1 = pipe(
*   fetchTransactionAmount,
*   Effect.map((amount) => amount * 2),
*   Effect.flatMap((amount) => applyDiscount(amount, 5))
* )
*
* await Effect.runPromise(result1) // => 190
*
* // Using Effect.andThen
* const result2 = pipe(
*   fetchTransactionAmount,
*   Effect.andThen((amount) => Effect.succeed(amount * 2)),
*   Effect.andThen((amount) => applyDiscount(amount, 5))
* )
*
* await Effect.runPromise(result2) // => 190
* ```
*
* @category sequencing
* @since 2.0.0
*/
var andThen = andThen$1;
/**
* Runs a side effect with the result of an effect without changing the original
* value.
*
* **When to use**
*
* Use when you need to run an effectful observation, such as logging or
* tracking, while passing the original success value to the next step.
*
* **Details**
*
* `tap` works similarly to `flatMap`, but it ignores the result of the function
* passed to it. The value from the previous effect remains available for the
* next part of the chain. Note that if the side effect fails, the entire chain
* will fail too.
*
* **Example** (Logging a step in a pipeline)
*
* ```ts import.meta.vitest
* import { Data, Effect, pipe } from "effect"
* const output: Array<unknown> = []
*
* class DiscountRateError extends Data.TaggedError("DiscountRateError")<{}> {}
*
* // Function to apply a discount safely to a transaction amount
* const applyDiscount = (
*   total: number,
*   discountRate: number
* ): Effect.Effect<number, DiscountRateError> =>
*   discountRate === 0
*     ? Effect.fail(new DiscountRateError())
*     : Effect.succeed(total - (total * discountRate) / 100)
*
* // Simulated asynchronous task to fetch a transaction amount from database
* const fetchTransactionAmount = Effect.promise(() => Promise.resolve(100))
*
* const finalAmount = pipe(
*   fetchTransactionAmount,
*   // Log the fetched transaction amount
*   Effect.tap((amount) => Effect.sync(() => { output.push(`Apply a discount to: ${amount}`) })),
*   // `amount` is still available!
*   Effect.flatMap((amount) => applyDiscount(amount, 5))
* )
*
* void output.push(await Effect.runPromise(finalAmount))
* output // => ["Apply a discount to: 100", 95]
* ```
*
* @category sequencing
* @since 2.0.0
*/
var tap = tap$2;
/**
* Converts both success and failure of an `Effect` into a `Result` type.
*
* **When to use**
*
* Use when you want an `Effect`'s typed failures to be handled as `Result`
* data while preserving the original error value.
*
* **Details**
*
* This function converts an effect that may fail into an effect that always
* succeeds, wrapping the outcome in a `Result` type. The result will be
* `Result.Failure` if the effect fails, containing the recoverable error, or
* `Result.Success` if it succeeds, containing the result.
*
* Using this function, you can handle recoverable errors explicitly without
* causing the effect to fail. This is particularly useful in scenarios where
* you want to chain effects and manage both success and failure in the same
* logical flow.
*
* The resulting effect cannot fail directly because all recoverable failures
* are represented inside the `Result` type.
*
* **Gotchas**
*
* `result` only captures typed, recoverable failures. Defects and
* interruptions are not captured inside the `Result` and still fail the
* effect.
*
* **Example** (Capturing success or failure as Result)
*
* ```ts import.meta.vitest
* import { Effect, Result } from "effect"
*
* const success = Effect.succeed(42)
* const failure = Effect.fail("Something went wrong")
*
* const program1 = Effect.result(success)
* const program2 = Effect.result(failure)
*
* Effect.runSync(program1) // => Result.succeed(42)
*
* Effect.runSync(program2) // => Result.fail("Something went wrong")
* ```
*
* @see {@link option} for a version that uses `Option` instead.
* @see {@link exit} for a version that encapsulates both recoverable errors and defects in an `Exit`.
*
* @category error handling
* @since 4.0.0
*/
var result = result$1;
/**
* Converts success to `Option.some` and failure to `Option.none`.
*
* **When to use**
*
* Use when you only care whether an effect succeeds and want recoverable
* failures represented as `Option.none`.
*
* **Details**
*
* Success values become `Option.some`, recoverable failures become
* `Option.none`, and defects still fail the effect.
*
* **Gotchas**
*
* `option` only captures typed, recoverable failures as `Option.none`.
* Defects and interruptions are not captured inside the `Option` and still
* fail the effect.
*
* `option` also discards typed failure values. Use `result` if the failure
* value matters.
*
* **Example** (Capturing success or failure as Option)
*
* ```ts import.meta.vitest
* import { Effect, Option } from "effect"
*
* const program = Effect.all([
*   Effect.option(Effect.succeed(1)),
*   Effect.option(Effect.fail("missing"))
* ])
*
* Effect.runSync(program) // => [Option.some(1), Option.none()]
* ```
*
* @see {@link result} for a version that uses `Result` instead.
* @see {@link exit} for a version that encapsulates both recoverable errors and defects in an `Exit`.
*
* @category error handling
* @since 2.0.0
*/
var option = option$1;
/**
* Transforms an effect to encapsulate both failure and success using the `Exit`
* data type.
*
* **When to use**
*
* Use when you need to inspect the full outcome, including typed failures, defects,
* and interruptions.
*
* **Details**
*
* `exit` wraps an effect's success or failure inside an `Exit` type, allowing
* you to handle both cases explicitly.
*
* The resulting effect cannot fail because the failure is encapsulated within
* the `Exit.Failure` type. The error type is set to `never`, indicating that
* the effect is structured to never fail directly.
*
* **Example** (Capturing completion as Exit)
*
* ```ts import.meta.vitest
* import { Effect, Exit } from "effect"
*
* const success = Effect.succeed(42)
* const failure = Effect.fail("Something went wrong")
*
* const program1 = Effect.exit(success)
* const program2 = Effect.exit(failure)
*
* Effect.runSync(program1) // => Exit.succeed(42)
*
* Effect.runSync(program2) // => Exit.fail("Something went wrong")
* ```
*
* @see {@link option} for a version that uses `Option` instead.
* @see {@link result} for a version that uses `Result` instead.
*
* @category error handling
* @since 2.0.0
*/
var exit = exit$1;
/**
* Transforms the value inside an effect by applying a function to it.
*
* **When to use**
*
* Use to transform an effect's success value with a function that returns a
* plain value, producing a new effect without changing the original effect's
* typed error or context requirements.
*
* **Details**
*
* `map` takes a function and applies it to the value contained within an
* effect, creating a new effect with the transformed value.
*
* It's important to note that effects are immutable, meaning that the original
* effect is not modified. Instead, a new effect is returned with the updated
* value.
*
* **Example** (Choosing map syntax variants)
*
* ```ts import.meta.vitest
* import { Effect, pipe } from "effect"
* const output: Array<unknown> = []
*
* const myEffect = Effect.succeed(1)
* const transformation = (n: number) => n + 1
*
* const mappedWithPipe = pipe(myEffect, Effect.map(transformation))
* const mappedWithDataFirst = Effect.map(myEffect, transformation)
* const mappedWithMethod = myEffect.pipe(Effect.map(transformation))
*
* void output.push(Effect.runSync(Effect.all([
*   mappedWithPipe,
*   mappedWithDataFirst,
*   mappedWithMethod
* ])))
* output // => [[2, 2, 2]]
* ```
*
* **Example** (Adding a service charge)
*
* ```ts import.meta.vitest
* import { Effect, pipe } from "effect"
*
* const addServiceCharge = (amount: number) => amount + 1
*
* const fetchTransactionAmount = Effect.promise(() => Promise.resolve(100))
*
* const finalAmount = pipe(
*   fetchTransactionAmount,
*   Effect.map(addServiceCharge)
* )
*
* await Effect.runPromise(finalAmount) // => 101
* ```
*
* @see {@link mapError} for a version that operates on the error channel.
* @see {@link mapBoth} for a version that operates on both channels.
* @see {@link flatMap} or {@link andThen} for a version that can return a new effect.
* @category mapping
* @since 2.0.0
*/
var map = map$3;
/**
* Replaces the value inside an effect with a constant value.
*
* **When to use**
*
* Use to replace a successful value with a constant while preserving failures
* and requirements.
*
* **Details**
*
* `as` allows you to ignore the original value inside an effect and
* replace it with a new constant value.
*
* **Example** (Replacing a success value)
*
* ```ts import.meta.vitest
* import { Effect, pipe } from "effect"
*
* // Replaces the value 5 with the constant "new value"
* const program = pipe(Effect.succeed(5), Effect.as("new value"))
*
* Effect.runSync(program) // => "new value"
* ```
*
* @see {@link map} for deriving the replacement value from the success value
* @see {@link asVoid} for replacing the success value with `void`
*
* @category mapping
* @since 2.0.0
*/
var as = as$1;
/**
* Maps the success value of an `Effect` to `Some`, preserving failures.
*
* **Example** (Wrapping success in Option.some)
*
* ```ts import.meta.vitest
* import { Effect, Option } from "effect"
*
* const program = Effect.asSome(Effect.succeed(42))
*
* Effect.runSync(program) // => Option.some(42)
* ```
*
* @category mapping
* @since 2.0.0
*/
var asSome = asSome$1;
/**
* Maps the success value of an `Effect` to `void`, preserving failures.
*
* **Example** (Discarding success values)
*
* ```ts import.meta.vitest
* import { Effect } from "effect"
*
* const program = Effect.asVoid(Effect.succeed(42))
*
* Effect.runSync(program) // => undefined
* ```
*
* @category mapping
* @since 2.0.0
*/
var asVoid = asVoid$1;
/**
* Swaps an effect's success and failure channels.
*
* **When to use**
*
* Use to swap an `Effect`'s success and failure channels.
*
* **Details**
*
* For an `Effect<A, E, R>`, the returned effect has type `Effect<E, A, R>`.
*
* **Example** (Swapping success and failure channels)
*
* ```ts import.meta.vitest
* import { Effect } from "effect"
*
* //      ┌─── Effect<number, string, never>
* //      ▼
* const program = Effect.fail("Oh uh!").pipe(Effect.as(2))
*
* //      ┌─── Effect<string, number, never>
* //      ▼
* const flipped = Effect.flip(program)
* Effect.runSync(flipped) // => "Oh uh!"
* ```
*
* @category mapping
* @since 2.0.0
*/
var flip = flip$1;
/**
* Combines two effects into a single effect, producing a tuple with the results of both effects.
*
* **When to use**
*
* Use to combine exactly two effects into a tuple.
*
* **Details**
*
* The `zip` function executes the first effect (left) and then the second effect (right).
* Once both effects succeed, their results are combined into a tuple.
*
* Concurrency:
*
* By default, `zip` processes the effects sequentially. To execute the effects concurrently,
* use the `{ concurrent: true }` option.
*
* **Example** (Combining two effects sequentially)
*
* ```ts import.meta.vitest
* import { Effect } from "effect"
*
* const task1 = Effect.succeed(1)
* const task2 = Effect.succeed("hello")
*
* // Combine the two effects together
* //
* //      ┌─── Effect<[number, string], never, never>
* //      ▼
* const program = Effect.zip(task1, task2)
*
* Effect.runSync(program) // => [1, 'hello']
* ```
*
* **Example** (Combining two effects concurrently)
*
* ```ts import.meta.vitest
* import { Effect } from "effect"
*
* const task1 = Effect.succeed(1)
* const task2 = Effect.succeed("hello")
*
* // Run both effects concurrently using the concurrent option
* const program = Effect.zip(task1, task2, { concurrent: true })
*
* await Effect.runPromise(program) // => [1, 'hello']
* ```
*
* @see {@link zipWith} for a version that combines the results with a custom function.
* @see {@link all} for collecting a larger structure of effects.
*
* @category zipping
* @since 2.0.0
*/
var zip = zip$1;
/**
* Combines two effects sequentially and applies a function to their results to
* produce a single value.
*
* **When to use**
*
* Use when you need to run two effects sequentially and combine their results
* with a function instead of keeping the results as a tuple.
*
* **Details**
*
* Concurrency:
*
* By default, the effects are run sequentially. To execute them concurrently,
* use the `{ concurrent: true }` option.
*
* **Example** (Combining two success values with a function)
*
* ```ts import.meta.vitest
* import { Effect } from "effect"
*
* const task1 = Effect.succeed(1)
* const task2 = Effect.succeed("hello")
*
* const task3 = Effect.zipWith(
*   task1,
*   task2,
*   // Combines results into a single value
*   (number, string) => number + string.length
* )
*
* Effect.runSync(task3) // => 6
* ```
*
* @category zipping
* @since 2.0.0
*/
var zipWith = zipWith$1;
var catch_ = catch_$1;
/**
* Catches and handles specific errors by their `_tag` field, which is used as a
* discriminator.
*
* **When to use**
*
* Use when you need to recover from one specific tagged error in an effect
* error channel.
*
* **Details**
*
* The error type must have a readonly `_tag` field. `catchTag` matches that
* field and only handles errors with the requested tag.
*
* **Example** (Handling a tagged error)
*
* ```ts import.meta.vitest
* import { Effect } from "effect"
*
* class NetworkError {
*   readonly _tag = "NetworkError"
*   constructor(readonly message: string) {}
* }
*
* class ValidationError {
*   readonly _tag = "ValidationError"
*   constructor(readonly message: string) {}
* }
*
* const task: Effect.Effect<string, NetworkError | ValidationError> =
*   Effect.fail(new NetworkError("offline"))
*
* const program = Effect.catchTag(
*   task,
*   "NetworkError",
*   (error) => Effect.succeed(`Recovered from network error: ${error.message}`)
* )
*
* Effect.runSync(program) // => "Recovered from network error: offline"
* ```
*
* @see {@link catchTags} for handling multiple tagged errors in one call
* @see {@link catchIf} for recovering from errors that match a predicate
*
* @category error handling
* @since 2.0.0
*/
var catchTag = catchTag$1;
/**
* Handles multiple errors in a single block of code using their `_tag` field.
*
* **When to use**
*
* Use when one recovery step should handle several tagged error types by
* matching their readonly `_tag` fields.
*
* **Details**
*
* Pass a handler table whose keys are tags, plus an optional fallback for
* unmatched errors.
*
* The error type must have a readonly `_tag` field to use `catchTags`. This
* field is used to identify and match errors.
*
* **Example** (Handling multiple tagged errors)
*
* ```ts import.meta.vitest
* import { Data, Effect } from "effect"
*
* // Define tagged error types
* class ValidationError extends Data.TaggedError("ValidationError")<{
*   message: string
* }> {}
*
* class NetworkError extends Data.TaggedError("NetworkError")<{
*   statusCode: number
* }> {}
*
* // An effect that might fail with multiple error types
* const program: Effect.Effect<string, ValidationError | NetworkError> =
*   Effect.fail(new NetworkError({ statusCode: 503 }))
*
* // Handle multiple error types at once
* const handled = Effect.catchTags(program, {
*   ValidationError: (error) =>
*     Effect.succeed(`Validation failed: ${error.message}`),
*   NetworkError: (error) => Effect.succeed(`Network error: ${error.statusCode}`)
* })
*
* Effect.runSync(handled) // => "Network error: 503"
* ```
*
* @category error handling
* @since 2.0.0
*/
var catchTags = catchTags$1;
/**
* Catches a specific reason within a tagged error.
*
* **When to use**
*
* Use to handle one nested reason inside an `Effect`'s tagged error while
* preserving the parent error shape for unmatched reasons.
*
* **Details**
*
* Use this to handle nested error causes without removing the parent error
* from the error channel. The handler receives the unwrapped reason.
*
* **Example** (Handling an error reason)
*
* ```ts import.meta.vitest
* import { Data, Effect } from "effect"
*
* class RateLimitError extends Data.TaggedError("RateLimitError")<{
*   retryAfter: number
* }> {}
*
* class QuotaExceededError extends Data.TaggedError("QuotaExceededError")<{
*   limit: number
* }> {}
*
* class AiError extends Data.TaggedError("AiError")<{
*   reason: RateLimitError | QuotaExceededError
* }> {}
*
* const program: Effect.Effect<string, AiError> = Effect.fail(
*   new AiError({ reason: new RateLimitError({ retryAfter: 30 }) })
* )
*
* // Handle rate limits specifically
* const handled = program.pipe(
*   Effect.catchReason("AiError", "RateLimitError", (reason) =>
*     Effect.succeed(`Retry after ${reason.retryAfter}s`)
*   )
* )
*
* Effect.runSync(handled) // => "Retry after 30s"
* ```
*
* @see {@link catchReasons} for handling several nested reason tags
*
* @category error handling
* @since 4.0.0
*/
var catchReason = catchReason$1;
/**
* Catches multiple reasons within a tagged error using an object of handlers.
*
* **Example** (Handling multiple error reasons)
*
* ```ts import.meta.vitest
* import { Data, Effect } from "effect"
*
* class RateLimitError extends Data.TaggedError("RateLimitError")<{
*   retryAfter: number
* }> {}
*
* class QuotaExceededError extends Data.TaggedError("QuotaExceededError")<{
*   limit: number
* }> {}
*
* class AiError extends Data.TaggedError("AiError")<{
*   reason: RateLimitError | QuotaExceededError
* }> {}
*
* const program: Effect.Effect<string, AiError> = Effect.fail(
*   new AiError({ reason: new QuotaExceededError({ limit: 100 }) })
* )
*
* const handled = program.pipe(
*   Effect.catchReasons("AiError", {
*     RateLimitError: (reason) =>
*       Effect.succeed(`Retry after ${reason.retryAfter}s`),
*     QuotaExceededError: (reason) =>
*       Effect.succeed(`Quota exceeded: ${reason.limit}`)
*   })
* )
*
* Effect.runSync(handled) // => "Quota exceeded: 100"
* ```
*
* @category error handling
* @since 4.0.0
*/
var catchReasons = catchReasons$1;
/**
* Promotes nested reason errors into the Effect error channel, replacing
* the parent error.
*
* **Example** (Extracting the reason from a tagged error)
*
* ```ts import.meta.vitest
* import { Data, Effect } from "effect"
*
* class RateLimitError extends Data.TaggedError("RateLimitError")<{
*   retryAfter: number
* }> {}
*
* class QuotaExceededError extends Data.TaggedError("QuotaExceededError")<{
*   limit: number
* }> {}
*
* class AiError extends Data.TaggedError("AiError")<{
*   reason: RateLimitError | QuotaExceededError
* }> {}
*
* const program: Effect.Effect<string, AiError> = Effect.fail(
*   new AiError({ reason: new RateLimitError({ retryAfter: 30 }) })
* )
*
* // Before: Effect<string, AiError>
* // After:  Effect<string, RateLimitError | QuotaExceededError>
* const unwrapped = program.pipe(Effect.unwrapReason("AiError"))
* Effect.runSync(Effect.flip(unwrapped))._tag // => "RateLimitError"
* ```
*
* @category error handling
* @since 4.0.0
*/
var unwrapReason = unwrapReason$1;
/**
* Handles both recoverable and unrecoverable errors by providing a recovery
* effect.
*
* **When to use**
*
* Use when you need to recover from an `Effect` by inspecting the full `Cause`,
* including recoverable failures, defects, and interruptions, instead of only
* the typed error value.
*
* **Details**
*
* When to Recover from Defects:
*
* Defects are unexpected errors that typically shouldn't be recovered from, as
* they often indicate serious issues. However, in some cases, such as
* dynamically loaded plugins, controlled recovery might be needed.
*
* **Example** (Recovering from full failure causes)
*
* ```ts import.meta.vitest
* import { Cause, Effect } from "effect"
* const output: Array<unknown> = []
*
* // An effect that might fail in different ways
* const program = Effect.die("Something went wrong")
*
* // Recover from any cause (including defects)
* const recovered = Effect.catchCause(program, (cause) => {
*   if (Cause.hasDies(cause)) {
*     return Effect.sync(() => { output.push("Caught defect") }).pipe(
*       Effect.as("Recovered from defect")
*     )
*   }
*   return Effect.succeed("Unknown error")
* })
*
* void output.push(Effect.runSync(recovered))
* output // => ["Caught defect", "Recovered from defect"]
* ```
*
* @category error handling
* @since 4.0.0
*/
var catchCause = catchCause$2;
/**
* Recovers from defects using a provided recovery function.
*
* **When to use**
*
* Use when you need to report or translate defects at integration boundaries.
*
* **Details**
*
* `catchDefect` handles unexpected defects, such as thrown exceptions or
* values passed to `die`, without catching typed failures or interruptions.
*
* When to Recover from Defects:
*
* Defects are unexpected errors that typically should not be recovered from, as
* they often indicate serious issues. In some cases, such as dynamically loaded
* plugins, controlled recovery may be needed.
*
* **Example** (Recovering from defects)
*
* ```ts import.meta.vitest
* import { Effect } from "effect"
* const output: Array<unknown> = []
*
* // An effect that might throw an unexpected error (defect)
* const program = Effect.sync(() => {
*   throw new Error("Unexpected error")
* })
*
* // Recover from defects only
* const recovered = Effect.catchDefect(program, (defect) => {
*   return Effect.sync(() => { output.push(`Caught defect: ${(defect as Error).message}`) }).pipe(
*     Effect.as("Recovered from defect")
*   )
* })
*
* void output.push(Effect.runSync(recovered))
* output // => ["Caught defect: Unexpected error", "Recovered from defect"]
* ```
*
* @category error handling
* @since 4.0.0
*/
var catchDefect = catchDefect$1;
/**
* Recovers from specific errors using a `Predicate` or `Refinement`.
*
* **When to use**
*
* Use when you need to recover from errors that match a condition.
*
* **Details**
*
* Use a `Refinement` for type narrowing or a `Predicate` for simple boolean
* matching. Non-matching errors re-fail with the original cause. Defects and
* interrupts are not caught.
*
* **Example** (Recovering when a predicate matches)
*
* ```ts import.meta.vitest
* import { Data, Effect, Filter } from "effect"
*
* class NotFound extends Data.TaggedError("NotFound")<{ id: string }> {}
*
* const program = Effect.fail(new NotFound({ id: "user-1" }))
*
* // With a refinement
* const recovered = program.pipe(
*   Effect.catchIf(
*     (error): error is NotFound => error._tag === "NotFound",
*     (error) => Effect.succeed(`missing:${error.id}`)
*   )
* )
*
* // With a Filter
* const recovered2 = program.pipe(
*   Effect.catchFilter(
*     Filter.tagged("NotFound"),
*     (error) => Effect.succeed(`missing:${error.id}`)
*   )
* )
*
* Effect.runSync(Effect.all([recovered, recovered2])) // => ['missing:user-1', 'missing:user-1']
* ```
*
* @category error handling
* @since 2.0.0
*/
var catchIf = catchIf$1;
/**
* Recovers from specific errors using a `Filter`.
*
* **When to use**
*
* Use to recover from typed `Effect` errors with a reusable `Filter` when
* matching can also narrow or transform the error before choosing the recovery
* effect.
*
* **Details**
*
* The filter runs on typed failures extracted from the `Cause`. Successful
* filter results are passed to `f`; failed filter results are passed to
* `orElse` when provided. Without `orElse`, the original failure cause is
* preserved.
*
* @see {@link catchIf} for predicate-based recovery from typed errors
* @see {@link catchTag} for recovering from a single tagged error
* @see {@link catchTags} for recovering from several tagged errors
* @see {@link catchCauseFilter} for filtering full causes instead of typed errors
*
* @category error handling
* @since 4.0.0
*/
var catchFilter = catchFilter$1;
/**
* Catches `NoSuchElementError` failures and converts them to `Option.none`.
*
* **When to use**
*
* Use when you expect missing-value failures and want them to become an
* optional success while all other failures keep failing.
*
* **Details**
*
* Success values become `Option.some`, `NoSuchElementError` becomes
* `Option.none`, and all other errors are preserved.
*
* **Example** (Recovering from missing Option values)
*
* ```ts import.meta.vitest
* import { Effect, Option } from "effect"
* const output: Array<unknown> = []
*
* const some = Effect.fromNullishOr(1).pipe(Effect.catchNoSuchElement)
* const none = Effect.fromNullishOr(null).pipe(Effect.catchNoSuchElement)
*
* void output.push(Effect.runSync(some))
* void output.push(Effect.runSync(none))
* output // => [Option.some(1), Option.none()]
* ```
*
* @see {@link fromOption} for converting `Option.none` into `NoSuchElementError`
* @see {@link fromNullishOr} for converting nullish values into `NoSuchElementError`
* @see {@link option} for converting any failure into `Option.none`
*
* @category error handling
* @since 4.0.0
*/
var catchNoSuchElement = catchNoSuchElement$1;
/**
* Recovers from specific failures based on a predicate.
*
* **When to use**
*
* Use to recover an `Effect` from full causes selected by a predicate.
*
* **Details**
*
* This function allows you to conditionally catch and recover from failures
* that match a specific predicate. This is useful when you want to handle
* only certain types of errors while letting others propagate.
*
* **Example** (Recovering from selected causes)
*
* ```ts import.meta.vitest
* import { Cause, Effect } from "effect"
* const output: Array<unknown> = []
*
* const httpRequest = Effect.fail("Network Error")
*
* // Only catch network-related failures
* const program = Effect.catchCauseIf(
*   httpRequest,
*   Cause.hasFails,
*   (cause) =>
*     Effect.gen(function*() {
*       yield* Effect.sync(() => { output.push(`Caught network error: ${Cause.squash(cause)}`) })
*       return "Fallback response"
*     })
* )
*
* void output.push(Effect.runSync(program))
* output // => ["Caught network error: Network Error", "Fallback response"]
* ```
*
* @see {@link catchCause} for recovering from every cause
* @see {@link catchCauseFilter} for selecting full causes with a `Filter`
* @see {@link catchIf} for predicate-based recovery from typed errors
*
* @category error handling
* @since 4.0.0
*/
var catchCauseIf = catchCauseIf$1;
/**
* Recovers from specific failures based on a `Filter`.
*
* **When to use**
*
* Use when you need to recover an `Effect` only from causes selected by a
* `Filter`, while giving the recovery both the selected value and the original
* `Cause`.
*
* **Details**
*
* The filter is applied to the full `Cause`. When it succeeds, the handler
* receives the selected value and the original cause. When it fails, the effect
* re-fails with the residual cause returned by the filter.
*
* @see {@link catchCauseIf} for predicate-based cause selection
* @see {@link catchFilter} for filtering typed error values instead of full causes
* @see {@link catchCause} for recovering from every cause without filtering
*
* @category error handling
* @since 4.0.0
*/
var catchCauseFilter = catchCauseFilter$1;
/**
* Transforms the failure value of an effect without changing its success value.
*
* **When to use**
*
* Use to translate an `Effect`'s typed failures while leaving successful values
* unchanged.
*
* **Details**
*
* Only the failure channel is transformed. The success channel and requirements
* are preserved.
*
* **Example** (Transforming the error channel)
*
* ```ts import.meta.vitest
* import { Data, Effect } from "effect"
*
* class TaskError extends Data.TaggedError("TaskError")<{ readonly message: string }> {}
*
* //      ┌─── Effect<number, string, never>
* //      ▼
* const simulatedTask = Effect.fail("Oh no!").pipe(Effect.as(1))
*
* //      ┌─── Effect<number, TaskError, never>
* //      ▼
* const mapped = Effect.mapError(
*   simulatedTask,
*   (message) => new TaskError({ message })
* )
* Effect.runSync(Effect.flip(mapped)).message // => "Oh no!"
* ```
*
* @see {@link map} for a version that operates on the success channel.
* @see {@link mapBoth} for a version that operates on both channels.
*
* @category error handling
* @since 2.0.0
*/
var mapError = mapError$1;
/**
* Applies transformations to both the success and error channels of an effect.
*
* **When to use**
*
* Use to transform both success and failure channels of an `Effect` without
* changing whether it succeeds or fails.
*
* **Details**
*
* This function takes two map functions as arguments: one for the error channel
* and one for the success channel. You can use it when you want to modify both
* the error and the success values without altering the overall success or
* failure status of the effect.
*
* **Example** (Transforming success and failure channels)
*
* ```ts import.meta.vitest
* import { Data, Effect } from "effect"
*
* class TaskError extends Data.TaggedError("TaskError")<{ readonly message: string }> {}
*
* //      ┌─── Effect<number, string, never>
* //      ▼
* const simulatedTask = Effect.fail("Oh no!").pipe(Effect.as(1))
*
* //      ┌─── Effect<boolean, TaskError, never>
* //      ▼
* const modified = Effect.mapBoth(simulatedTask, {
*   onFailure: (message) => new TaskError({ message }),
*   onSuccess: (n) => n > 0
* })
* Effect.runSync(Effect.flip(modified)).message // => "Oh no!"
* ```
*
* @see {@link map} for a version that operates on the success channel.
* @see {@link mapError} for a version that operates on the error channel.
*
* @category mapping
* @since 2.0.0
*/
var mapBoth = mapBoth$1;
/**
* Converts typed failures from the error channel into defects, removing the
* error type from the returned effect.
*
* **When to use**
*
* Use when you need to turn an `Effect` typed failure that represents an
* unrecoverable bug or invalid state into a defect.
*
* **Example** (Converting typed failures into defects)
*
* ```ts import.meta.vitest
* import { Data, Effect, Exit } from "effect"
*
* class DivideByZeroError extends Data.TaggedError("DivideByZeroError")<{}> {}
*
* const divide = (a: number, b: number) =>
*   b === 0
*     ? Effect.fail(new DivideByZeroError())
*     : Effect.succeed(a / b)
*
* //      ┌─── Effect<number, never, never>
* //      ▼
* const program = Effect.orDie(divide(1, 0))
*
* Effect.runSyncExit(program) // => Exit.die(new DivideByZeroError())
* ```
*
* @category error handling
* @since 2.0.0
*/
var orDie = orDie$1;
/**
* Runs an effectful operation when the source effect fails, while preserving
* the original failure when the operation succeeds.
*
* **Details**
*
* Use this for logging, metrics, or other failure-side observations. If the
* operation passed to `tapError` fails, that error is also represented in the
* returned effect's error channel.
*
* **Example** (Running effects on failure)
*
* ```ts import.meta.vitest
* import { Effect, Exit } from "effect"
* const output: Array<unknown> = []
*
* // Simulate a task that fails with an error
* const task: Effect.Effect<number, string> = Effect.fail("NetworkError")
*
* // Use tapError to log the error message when the task fails
* const tapping = Effect.tapError(
*   task,
*   (error) => Effect.sync(() => { output.push(`expected error: ${error}`) })
* )
*
* void output.push(Effect.runSyncExit(tapping))
* output // => ["expected error: NetworkError", Exit.fail("NetworkError")]
* ```
*
* @category sequencing
* @since 2.0.0
*/
var tapError = tapError$1;
/**
* Runs an effectful handler when a failure's `_tag` matches.
*
* **Details**
*
* Use this with tagged-union errors to perform side effects for one tag or a
* list of tags. When the handler succeeds, the original failure is preserved;
* if the handler fails, its error is also included in the returned effect.
*
* **Example** (Running effects for tagged failures)
*
* ```ts import.meta.vitest
* import { Data, Effect, Exit } from "effect"
* const output: Array<unknown> = []
*
* class NetworkError extends Data.TaggedError("NetworkError")<{
*   statusCode: number
* }> {}
*
* class ValidationError extends Data.TaggedError("ValidationError")<{
*   field: string
* }> {}
*
* const task: Effect.Effect<number, NetworkError | ValidationError> =
*   Effect.fail(new NetworkError({ statusCode: 504 }))
*
* const program = Effect.tapErrorTag(task, "NetworkError", (error) =>
*   Effect.sync(() => { output.push(`expected error: ${error.statusCode}`) })
* )
*
* void output.push(Effect.runSyncExit(program))
* output // => ["expected error: 504", Exit.fail(new NetworkError({ statusCode: 504 }))]
* ```
*
* @category sequencing
* @since 2.0.0
*/
var tapErrorTag = tapErrorTag$1;
/**
* Runs an effectful operation with the full `Cause` when the source effect
* fails.
*
* **When to use**
*
* Use when failure observation needs typed failures, defects, and interruptions
* rather than only the typed error value.
*
* **Details**
*
* Use this to log or inspect typed failures, defects, and interruptions. When
* the operation succeeds, the original cause is preserved. If the operation
* fails, its error is also represented in the returned effect.
*
* **Example** (Observing full failure causes)
*
* ```ts import.meta.vitest
* import { Cause, Effect, Exit } from "effect"
* const output: Array<unknown> = []
*
* const task = Effect.fail("Something went wrong")
*
* const program = Effect.tapCause(
*   task,
*   (cause) => Effect.sync(() => { output.push(`Logging cause: ${Cause.squash(cause)}`) })
* )
*
* void output.push(Effect.runSyncExit(program))
* output // => ["Logging cause: Something went wrong", Exit.fail("Something went wrong")]
* ```
*
* @category sequencing
* @since 4.0.0
*/
var tapCause = tapCause$1;
/**
* Executes a side effect conditionally when a failed effect's cause matches a predicate.
*
* **Details**
*
* This function allows you to tap into the cause of an effect's failure only when
* the cause matches a specific predicate. This is useful for conditional logging,
* monitoring, or other side effects based on the type of failure.
*
* **Example** (Observing selected failure causes)
*
* ```ts import.meta.vitest
* import { Cause, Effect, Exit } from "effect"
* const output: Array<unknown> = []
*
* const task = Effect.fail("Network timeout")
*
* // Only log causes that contain failures (not interrupts or defects)
* const program = Effect.tapCauseIf(
*   task,
*   Cause.hasFails,
*   (cause) => Effect.sync(() => { output.push(`Logging failure cause: ${Cause.squash(cause)}`) })
* )
*
* void output.push(Effect.runSyncExit(program))
* output // => ["Logging failure cause: Network timeout", Exit.fail("Network timeout")]
* ```
*
* @category sequencing
* @since 4.0.0
*/
var tapCauseIf = tapCauseIf$1;
/**
* Executes a side effect conditionally when a failed effect's cause passes a filter.
*
* **When to use**
*
* Use when you need to observe only failure causes selected by a `Filter`,
* while giving the side effect both the selected value and the original
* `Cause`.
*
* **Details**
*
* A successful filter result runs the side effect with the selected value and
* original cause. A failed filter result skips the side effect and preserves the
* original cause.
*
* @see {@link tapCauseIf} for selecting causes with a boolean predicate
* @see {@link tapCause} for observing every failure cause
* @see {@link catchCauseFilter} for recovering from selected causes instead of only observing them
*
* @category sequencing
* @since 4.0.0
*/
var tapCauseFilter = tapCauseFilter$1;
/**
* Runs an effectful operation when the source effect dies with a defect.
*
* **Details**
*
* Use this for diagnostics such as logging unexpected thrown exceptions or
* values passed to `die`. Recoverable failures are not handled. When the
* operation succeeds, the original defect is preserved; if the operation fails,
* its error is also represented in the returned effect.
*
* **Example** (Observing defects)
*
* ```ts import.meta.vitest
* import { Effect, Exit } from "effect"
* const output: Array<unknown> = []
*
* // Simulate a severe failure in the system
* const task2: Effect.Effect<number> = Effect.die(
*   "Something went wrong"
* )
*
* // Log the defect using tapDefect
* const tapping2 = Effect.tapDefect(
*   task2,
*   (defect) => Effect.sync(() => { output.push(`defect: ${defect}`) })
* )
*
* void output.push(Effect.runSyncExit(tapping2))
* output // => ["defect: Something went wrong", Exit.die("Something went wrong")]
* ```
*
* @category sequencing
* @since 2.0.0
*/
var tapDefect = tapDefect$1;
/**
* Retries an effect until it succeeds, discarding failures.
*
* **Details**
*
* Yields between attempts so other fibers can run.
*
* **Example** (Retrying until success)
*
* ```ts import.meta.vitest
* import { Effect } from "effect"
* const output: Array<unknown> = []
*
* let attempts = 0
*
* const flaky = Effect.gen(function*() {
*   attempts++
*   yield* Effect.sync(() => { output.push(`Attempt ${attempts}`) })
*   if (attempts < 3) {
*     return yield* Effect.fail("Not ready")
*   }
*   return "Ready"
* })
*
* const program = Effect.eventually(flaky)
*
* void output.push(await Effect.runPromise(program))
* output // => ["Attempt 1", "Attempt 2", "Attempt 3", "Ready"]
* ```
*
* @category repetition
* @since 2.0.0
*/
var eventually = eventually$1;
/**
* Retries typed failures from an effect according to a retry policy.
*
* **When to use**
*
* Use when you need to rerun an effect after transient typed failures, such as
* network issues or temporary resource unavailability.
*
* **Details**
*
* The policy can be a `Schedule`, a schedule builder, or a `Retry.Options`
* object using `schedule`, `times`, `while`, or `until`. If a retry eventually
* succeeds, the returned effect succeeds with that value. If the policy stops
* while the effect is still failing, the last failure is propagated.
*
* **Gotchas**
*
* The source effect is always evaluated once before any retry policy is
* applied. For example, `Schedule.recurs(3)` allows up to three retries after
* the initial attempt.
*
* Defects and interruptions are not retried.
*
* **Example** (Retrying with a schedule)
*
* ```ts import.meta.vitest
* import { Data, Effect, Schedule } from "effect"
*
* class AttemptError extends Data.TaggedError("AttemptError")<{ readonly attempt: number }> {}
*
* let attempt = 0
* const task = Effect.callback<string, AttemptError>((resume) => {
*   attempt++
*   if (attempt <= 2) {
*     resume(Effect.fail(new AttemptError({ attempt })))
*   } else {
*     resume(Effect.succeed("Success!"))
*   }
* })
*
* const policy = Schedule.recurs(5)
* const program = Effect.retry(task, policy)
*
* await Effect.runPromise(program) // => "Success!"
* ```
*
* @see {@link retryOrElse} for a version that allows you to run a fallback.
* @see {@link repeat} if your retry condition is based on successful outcomes rather than errors.
* @category error handling
* @since 2.0.0
*/
var retry = retry$1;
/**
* Retries a failing effect and runs a fallback effect if retries are exhausted.
*
* **When to use**
*
* Use when you want to handle failures gracefully by specifying an alternative
* action after repeated failures.
*
* **Details**
*
* The `Effect.retryOrElse` function attempts to retry a failing effect multiple
* times according to a defined {@link Schedule} policy.
*
* If the retries are exhausted and the effect still fails, it runs a fallback
* effect instead.
*
* **Example** (Falling back after retries are exhausted)
*
* ```ts import.meta.vitest
* import { Data, Effect, Schedule } from "effect"
* const output: Array<unknown> = []
*
* class NetworkTimeoutError extends Data.TaggedError("NetworkTimeoutError")<{}> {}
*
* let attempt = 0
* const networkRequest = Effect.gen(function*() {
*   attempt++
*   yield* Effect.sync(() => { output.push(`Network attempt ${attempt}`) })
*   if (attempt < 3) {
*     return yield* Effect.fail(new NetworkTimeoutError())
*   }
*   return "Network data"
* })
*
* // Retry up to 2 times, then fall back to cached data
* const program = Effect.retryOrElse(
*   networkRequest,
*   Schedule.recurs(2),
*   (error, retryCount) =>
*     Effect.gen(function*() {
*       yield* Effect.sync(() => { output.push(`All ${retryCount} retries failed, using cache`) })
*       return "Cached data"
*     })
* )
*
* void output.push(await Effect.runPromise(program))
* output // => ["Network attempt 1", "Network attempt 2", "Network attempt 3", "Network data"]
* ```
*
* @see {@link retry} for a version that does not run a fallback effect.
* @category error handling
* @since 2.0.0
*/
var retryOrElse = retryOrElse$1;
/**
* Exposes an effect's full failure cause in the error channel as `Cause<E>`.
*
* **Details**
*
* Use `sandbox` when downstream error handling needs to distinguish typed
* failures, defects, and interruptions. Use `unsandbox` to restore the original
* typed error channel after cause-level handling.
*
* **Example** (Exposing failures as causes)
*
* ```ts import.meta.vitest
* import { Cause, Effect } from "effect"
*
* const task = Effect.fail("Something went wrong")
*
* // Sandbox exposes the full cause as the error type
* const program = Effect.gen(function*() {
*   const result = yield* Effect.flip(Effect.sandbox(task))
*   return `Caught cause: ${Cause.squash(result)}`
* })
*
* Effect.runSync(program) // => "Caught cause: Something went wrong"
* ```
*
* @category error handling
* @since 2.0.0
*/
var sandbox = sandbox$1;
/**
* Discards both the success and failure values of an effect.
*
* **When to use**
*
* Use when an effect should run for its side effects while both success and
* failure values are discarded.
*
* **Details**
*
* Use the `log` option to emit the full {@link Cause} when the effect fails,
* and `message` to prepend a custom log message.
*
* **Example** (Discarding success and failure values)
*
* ```ts import.meta.vitest
* import { Effect } from "effect"
*
* //      ┌─── Effect<number, string, never>
* //      ▼
* const task = Effect.fail("Uh oh!").pipe(Effect.as(5))
*
* //      ┌─── Effect<void, never, never>
* //      ▼
* const program = task.pipe(Effect.ignore)
* Effect.runSync(program) // => undefined
* ```
*
* **Example** (Logging failures while ignoring results)
*
* ```ts import.meta.vitest
* import { Effect } from "effect"
*
* const task = Effect.fail("Uh oh!")
*
* const program = task.pipe(Effect.ignore)
* Effect.runSync(program) // => undefined
* ```
*
* @category error handling
* @since 2.0.0
*/
var ignore = ignore$1;
/**
* Ignores the effect's failure cause, including defects and interruptions.
*
* **When to use**
*
* Use when a best-effort effect should never fail, even from defects or
* interruption, and optional cause logging is enough.
*
* **Details**
*
* Use the `log` option to emit the full {@link Cause} when the effect fails,
* and `message` to prepend a custom log message.
*
* **Example** (Ignoring failures and logging causes)
*
* ```ts import.meta.vitest
* import { Effect } from "effect"
*
* const task = Effect.fail("boom")
*
* const program = task.pipe(Effect.ignoreCause)
* Effect.runSync(program) // => undefined
* ```
*
* @category error handling
* @since 4.0.0
*/
var ignoreCause = ignoreCause$1;
/**
* Applies an `ExecutionPlan` to an effect, retrying with step-provided resources
* until it succeeds or the plan is exhausted.
*
* **Details**
*
* Each attempt updates `ExecutionPlan.CurrentMetadata` (attempt and step index),
* and retry timing is derived per step (the first attempt uses the remaining
* attempts schedule; later retries apply the step schedule at least once).
*
* Attempts can be observed from outside the effect by passing
* `options.onEvent`, which receives an `ExecutionPlan.Event` before each
* attempt and after it settles. The handler is awaited inline before and after
* every attempt, so events are strictly ordered; keep it cheap. It cannot
* fail, which keeps observation from changing the plan's outcome, and its
* requirements are added to the resulting effect. Terminal events run like
* finalizers, so they are emitted even when the attempt is interrupted.
*
* **Example** (Retrying with an execution plan)
*
* ```ts import.meta.vitest
* import { Context, Effect, ExecutionPlan, Layer } from "effect"
*
* const Endpoint = Context.Service<{ url: string }>("Endpoint")
*
* const fetchUrl = Effect.gen(function*() {
*   const endpoint = yield* Effect.service(Endpoint)
*   if (endpoint.url === "bad") {
*     return yield* Effect.fail("Unavailable")
*   }
*   return endpoint.url
* })
*
* const plan = ExecutionPlan.make(
*   { provide: Layer.succeed(Endpoint, { url: "bad" }), attempts: 2 },
*   { provide: Layer.succeed(Endpoint, { url: "good" }) }
* )
*
* const program = Effect.withExecutionPlan(fetchUrl, plan)
* Effect.runSync(program) // => "good"
* ```
*
* **Example** (Observing execution-plan attempts)
*
* ```ts import.meta.vitest
* import { Context, Effect, ExecutionPlan, Layer } from "effect"
*
* const Endpoint = Context.Service<{ url: string }>("Endpoint")
*
* const fetchUrl = Effect.gen(function*() {
*   const endpoint = yield* Effect.service(Endpoint)
*   if (endpoint.url === "bad") {
*     return yield* Effect.fail("Unavailable")
*   }
*   return endpoint.url
* })
*
* const plan = ExecutionPlan.make(
*   { provide: Layer.succeed(Endpoint, { url: "bad" }) },
*   { provide: Layer.succeed(Endpoint, { url: "good" }) }
* )
*
* const events: Array<string> = []
* const program = Effect.withExecutionPlan(fetchUrl, plan, {
*   onEvent: (event) => Effect.sync(() => events.push(`${event._tag}:${event.stepIndex}`))
* })
*
* await Effect.runPromise(program) // => "good"
*
* events // => ["AttemptStart:0", "AttemptFailure:0", "AttemptStart:1", "AttemptSuccess:1"]
* ```
*
* @category error handling
* @since 3.16.0
*/
var withExecutionPlan = withExecutionPlan$1;
/**
* Runs an effect and reports any errors to the configured `ErrorReporter`s.
*
* **Details**
*
* If the `defectsOnly` option is set to `true`, only defects (unrecoverable
* errors) will be reported, while regular failures will be ignored.
*
* @category error handling
* @since 4.0.0
*/
var withErrorReporting = withErrorReporting$1;
/**
* Recovers from a typed failure by producing a fallback success value.
*
* **Details**
*
* If the source effect succeeds, its value is preserved. If it fails in the
* error channel, `orElseSucceed` evaluates the fallback and succeeds with that
* value, removing the typed error from the returned effect.
*
* Defects and interruptions are not recovered by this operator.
*
* **Example** (Replacing failures with a value)
*
* ```ts import.meta.vitest
* import { Effect, Exit } from "effect"
*
* const validate = (age: number): Effect.Effect<number, string> => {
*   if (age < 0) {
*     return Effect.fail("NegativeAgeError")
*   } else if (age < 18) {
*     return Effect.fail("IllegalAgeError")
*   } else {
*     return Effect.succeed(age)
*   }
* }
*
* const program = Effect.orElseSucceed(validate(-1), () => 18)
*
* Effect.runSyncExit(program) // => Exit.succeed(18)
* ```
*
* @category error handling
* @since 2.0.0
*/
var orElseSucceed = orElseSucceed$1;
/**
* Runs a sequence of effects and returns the result of the first successful
* one.
*
* **When to use**
*
* Use when you have prioritized fallback `Effect`s, such as attempting
* multiple APIs, reading configuration from several sources, or trying
* alternative resource locations in order.
*
* **Details**
*
* This function executes the provided effects in sequence, stopping at the
* first success. If an effect succeeds, its result is returned immediately and
* no further effects in the sequence are executed.
*
* If all effects fail, the returned effect fails with the error from the last
* effect. If the collection is empty, the returned effect defects with an
* `Error` whose message is `"Received an empty collection of effects"`.
*
* **Example** (Trying alternatives until one succeeds)
*
* ```ts import.meta.vitest
* import { Effect } from "effect"
*
* const primary = Effect.fail("primary unavailable")
* const secondary = Effect.succeed("secondary result")
* const tertiary = Effect.sync(() => {
*   throw new Error("not evaluated")
* })
*
* const program = Effect.firstSuccessOf([
*   primary,
*   secondary,
*   tertiary
* ])
*
* Effect.runSync(program) // => "secondary result"
* ```
*
* @category error handling
* @since 2.0.0
*/
var firstSuccessOf = firstSuccessOf$1;
/**
* Adds a time limit to an effect, triggering a timeout if the effect exceeds
* the duration.
*
* **When to use**
*
* Use when you need a timeout of an `Effect` to be represented as a typed
* failure.
*
* **Details**
*
* The `timeout` function allows you to specify a time limit for an
* effect's execution. If the effect does not complete within the given time, a
* `TimeoutError` is raised. This can be useful for controlling how long your
* program waits for a task to finish, ensuring that it doesn't hang
* indefinitely if the task takes too long.
*
* **Gotchas**
*
* If the timeout wins, the source effect is interrupted.
*
* **Example** (Failing when work takes too long)
*
* ```ts import.meta.vitest
* import { Effect } from "effect"
*
* const timedEffect = Effect.never.pipe(Effect.timeout(0))
* const error = await Effect.runPromise(Effect.flip(timedEffect))
* error._tag // => "TimeoutError"
* ```
*
* @see {@link timeoutOption} for returning `Option.none` on timeout.
* @see {@link timeoutOrElse} for a version that allows specifying both success and timeout handlers.
*
* @category delays & timeouts
* @since 2.0.0
*/
var timeout = timeout$1;
/**
* Runs an effect with a time limit and represents only the timeout case as
* `Option.none`.
*
* **When to use**
*
* Use when a timeout of an `Effect` should be handled as `Option.none`.
*
* **Details**
*
* If the source effect succeeds before the timeout, the returned effect
* succeeds with `Option.some(value)`. If the timeout wins, the source effect is
* interrupted and the returned effect succeeds with `Option.none`. If the
* source effect fails before the timeout, that failure is preserved.
*
* **Example** (Returning None on timeout)
*
* ```ts import.meta.vitest
* import { Effect, Option } from "effect"
*
* const timedOutEffect = Effect.never.pipe(Effect.timeoutOption(0))
* await Effect.runPromise(timedOutEffect) // => Option.none()
* ```
*
* @see {@link timeout} for a version that raises a `TimeoutError`.
* @see {@link timeoutOrElse} for a version that allows specifying both success and timeout handlers.
*
* @category delays & timeouts
* @since 3.1.0
*/
var timeoutOption = timeoutOption$1;
/**
* Applies a timeout to an effect, with a fallback effect executed if the timeout is reached.
*
* **When to use**
*
* Use when a timeout of an `Effect` should switch to a fallback effect.
*
* **Details**
*
* The fallback effect is created lazily by `orElse` and may introduce its own
* success, failure, and requirement types.
*
* **Gotchas**
*
* If the timeout wins, the source effect is interrupted before the fallback is
* run.
*
* **Example** (Falling back on timeout)
*
* ```ts import.meta.vitest
* import { Effect } from "effect"
* const output: Array<unknown> = []
*
* const program = Effect.timeoutOrElse(Effect.never, {
*   duration: 0,
*   orElse: () => Effect.sync(() => { output.push("Query timed out, using cached data") }).pipe(
*     Effect.as("Cached result")
*   )
* })
*
* void output.push(await Effect.runPromise(program))
* output // => ["Query timed out, using cached data", "Cached result"]
* ```
*
* @see {@link timeout} for failing with a `TimeoutError`.
* @see {@link timeoutOption} for returning `Option.none` on timeout.
*
* @category delays & timeouts
* @since 4.0.0
*/
var timeoutOrElse = timeoutOrElse$1;
/**
* Returns an effect that is delayed from this effect by the specified
* `Duration`.
*
* **Example** (Delaying an effect)
*
* ```ts import.meta.vitest
* import { Effect } from "effect"
* const output: Array<unknown> = []
*
* const program = Effect.delay(Effect.sync(() => { output.push("Delayed message") }), 0)
*
* await Effect.runPromise(program)
* output // => ["Delayed message"]
* ```
*
* @category delays & timeouts
* @since 2.0.0
*/
var delay = delay$1;
/**
* Returns an effect that suspends the current fiber for the specified duration
* without blocking a JavaScript thread.
*
* **Example** (Pausing without blocking)
*
* ```ts import.meta.vitest
* import { Effect } from "effect"
* const output: Array<unknown> = []
*
* const program = Effect.gen(function*() {
*   yield* Effect.sync(() => { output.push("Start") })
*   yield* Effect.sleep(0)
*   yield* Effect.sync(() => { output.push("End") })
* })
*
* await Effect.runPromise(program)
* output // => ["Start", "End"]
* ```
*
* @category delays & timeouts
* @since 2.0.0
*/
var sleep = sleep$1;
/**
* Returns the runtime duration of an effect together with its result.
*
* **Details**
*
* The original success, failure, or interruption is preserved; only the success
* value is paired with the duration.
*
* **Example** (Measuring execution time)
*
* ```ts import.meta.vitest
* import { Effect } from "effect"
*
* const program = Effect.gen(function*() {
*   const [, value] = yield* Effect.timed(Effect.succeed("ok"))
*   return value
* })
*
* Effect.runSync(program) // => "ok"
* ```
*
* @category delays & timeouts
* @since 2.0.0
*/
var timed = timed$1;
/**
* Runs multiple effects concurrently and returns the first successful result.
*
* **When to use**
*
* Use when early failures should be ignored until a success occurs
* or all effects fail.
*
* **Details**
*
* Early failures do not finish the race; `raceAll` keeps waiting until one
* effect succeeds or every effect has failed. When one effect succeeds, the
* remaining effects are interrupted. If every effect fails, the returned effect
* fails with a cause containing the collected failure reasons.
*
* **Example** (Racing many effects)
*
* ```ts import.meta.vitest
* import { Effect } from "effect"
*
* const raced = Effect.raceAll([
*   Effect.succeed("Fast"),
*   Effect.never
* ])
* await Effect.runPromise(raced) // => "Fast"
* ```
*
* @see {@link race} for a version that handles only two effects.
* @category racing
* @since 2.0.0
*/
var raceAll = raceAll$1;
/**
* Runs multiple effects concurrently and completes with the first effect to
* finish, whether it succeeds or fails.
*
* **Details**
*
* After the first effect completes, all remaining effects are interrupted. Use
* `raceAll` when early failures should be ignored until a success occurs or
* all effects fail.
*
* **Example** (Taking the first settled result)
*
* ```ts import.meta.vitest
* import { Effect } from "effect"
*
* const raced = Effect.raceAllFirst([
*   Effect.fail("First failed"),
*   Effect.never
* ])
* await Effect.runPromise(Effect.flip(raced)) // => "First failed"
* ```
*
* @category racing
* @since 4.0.0
*/
var raceAllFirst = raceAllFirst$1;
/**
* Races two effects and returns the first successful result.
*
* **Details**
*
* If one effect succeeds, the other is interrupted and `onWinner` can observe the
* winning fiber. If both fail, the race fails.
*
* **Example** (Racing two effects)
*
* ```ts import.meta.vitest
* import { Effect } from "effect"
* const output: Array<unknown> = []
*
* const fastFail = Effect.fail("fast-fail")
* const slowSuccess = Effect.succeed("slow-success")
*
* const program = Effect.gen(function*() {
*   const result = yield* Effect.race(fastFail, slowSuccess)
*   yield* Effect.sync(() => { output.push(`winner: ${result}`) })
* })
*
* await Effect.runPromise(program)
* output // => ["winner: slow-success"]
* ```
*
* @category racing
* @since 2.0.0
*/
var race = race$1;
/**
* Races two effects and returns the result of the first one to complete, whether
* it succeeds or fails.
*
* **When to use**
*
* Use when any completion, including failure, should decide the race and
* interrupt the losing effect.
*
* **Details**
*
* The losing effect is interrupted, and `onWinner` can observe the winning fiber.
*
* **Example** (Observing the winning fiber)
*
* ```ts import.meta.vitest
* import { Effect } from "effect"
* const output: Array<unknown> = []
*
* const fastFail = Effect.fail("fast-fail")
* const slowSuccess = Effect.never
*
* const program = Effect.gen(function*() {
*   const message = yield* Effect.match(Effect.raceFirst(fastFail, slowSuccess), {
*     onFailure: (error) => `failed: ${error}`,
*     onSuccess: (value) => `succeeded: ${value}`
*   })
*   yield* Effect.sync(() => { output.push(message) })
* })
*
* await Effect.runPromise(program)
* output // => ["failed: fast-fail"]
* ```
*
* @category racing
* @since 2.0.0
*/
var raceFirst = raceFirst$1;
/**
* Filters elements of an iterable using a predicate, refinement, or effectful
* predicate.
*
* **Example** (Filtering success values)
*
* ```ts import.meta.vitest
* import { Effect } from "effect"
* const output: Array<unknown> = []
*
* // Sync predicate
* const evens = Effect.filter([1, 2, 3, 4], (n) => n % 2 === 0)
*
* // Effectful predicate
* const checked = Effect.filter([1, 2, 3], (n) => Effect.succeed(n > 1))
*
* void output.push(Effect.runSync(evens))
* void output.push(Effect.runSync(checked))
* output // => [[2, 4], [2, 3]]
* ```
*
* @category filtering
* @since 2.0.0
*/
var filter = filter$1;
/**
* Filters and maps elements of an iterable with a `Filter`.
*
* **When to use**
*
* Use when you need to filter an iterable with a `Filter` inside an `Effect`,
* collecting each filter success value.
*
* **Details**
*
* `Result.succeed` values are collected in the returned array, and
* `Result.fail` values are skipped.
*
* @see {@link filter} for keeping original elements with a boolean predicate, refinement, or effectful predicate
* @see {@link filterMapEffect} for using an effectful `Filter`
*
* @category filtering
* @since 2.0.0
*/
var filterMap = filterMap$1;
/**
* Filters and maps elements of an iterable effectfully with a `FilterEffect`.
*
* **When to use**
*
* Use when you need to filter each iterable element effectfully and transform
* accepted elements into successful output values.
*
* **Details**
*
* `Result.succeed` values are collected in the returned array, and
* `Result.fail` values are skipped.
*
* **Gotchas**
*
* With concurrent execution, successful values are collected in completion
* order, not input order.
*
* @see {@link filterMap} for using a synchronous `Filter`
* @see {@link filter} for keeping original elements with a predicate
*
* @category filtering
* @since 4.0.0
*/
var filterMapEffect = filterMapEffect$1;
/**
* Filters an effect, providing an alternative effect if the predicate fails.
*
* **When to use**
*
* Use when a successful value that fails a predicate should continue with an
* effectful fallback instead of failing the effect.
*
* **Details**
*
* This function applies a predicate to the result of an effect. If the
* predicate evaluates to `false`, it executes the `orElse` effect instead. The
* `orElse` effect can produce an alternative value or perform additional
* computations.
*
* **Example** (Filtering with a fallback effect)
*
* ```ts import.meta.vitest
* import { Effect } from "effect"
*
* // An effect that produces a number
* const program = Effect.succeed(5)
*
* // Filter for even numbers, provide alternative for odd numbers
* const filtered = Effect.filterOrElse(
*   program,
*   (n) => n % 2 === 0,
*   (n) => Effect.succeed(`Number ${n} is odd`)
* )
*
* Effect.runSync(filtered) // => "Number 5 is odd"
* ```
*
* @category filtering
* @since 2.0.0
*/
var filterOrElse = filterOrElse$1;
/**
* Filters an effect with a `Filter`, providing an alternative effect on failure.
*
* **When to use**
*
* Use when a successful effect value should be accepted and transformed by a
* `Filter`, while rejected values should continue with an alternative effect
* built from the filter failure.
*
* **Details**
*
* `Result.succeed` becomes the returned success value, and `Result.fail` is
* passed to `orElse`.
*
* @see {@link filterOrElse} for using a predicate and fallback effect
* @see {@link filterMapOrFail} for failing the effect when the filter fails
*
* @category filtering
* @since 4.0.0
*/
var filterMapOrElse = filterMapOrElse$1;
/**
* Filters an effect, failing with a custom error if the predicate fails.
*
* **Details**
*
* This function applies a predicate to the result of an effect. If the
* predicate evaluates to `false`, the effect fails with either a custom
* error (if `orFailWith` is provided) or a `NoSuchElementError`.
*
* **Example** (Filtering with a custom failure)
*
* ```ts import.meta.vitest
* import { Effect } from "effect"
*
* // An effect that produces a number
* const program = Effect.succeed(5)
*
* // Filter for even numbers, fail for odd numbers
* const filtered = Effect.filterOrFail(
*   program,
*   (n) => n % 2 === 0,
*   (n) => `Expected even number, got ${n}`
* )
*
* Effect.runSync(Effect.flip(filtered)) // => "Expected even number, got 5"
* ```
*
* @category filtering
* @since 2.0.0
*/
var filterOrFail = filterOrFail$1;
/**
* Filters and maps an effect with a `Filter`, failing when the filter fails.
*
* **When to use**
*
* Use when validating and transforming one effect success with a synchronous
* `Filter`, while rejected values should fail the effect.
*
* **Details**
*
* `Result.succeed` becomes the returned success value. `Result.fail` is mapped
* with `orFailWith` when provided, or fails with `NoSuchElementError`.
*
* @see {@link filterMapOrElse} for continuing with a fallback effect when the filter fails
* @see {@link filterOrFail} for validating with a predicate instead of a `Filter`
* @see {@link filterMap} for filtering and mapping iterable elements
*
* @category filtering
* @since 4.0.0
*/
var filterMapOrFail = filterMapOrFail$1;
/**
* Runs an effect conditionally based on the result of an effectful boolean
* condition.
*
* **When to use**
*
* Use when you need an effectful check to decide whether another effect should
* run while representing the skipped case explicitly.
*
* **Details**
*
* The condition effect is evaluated first. If it succeeds with `true`, the
* source effect is run and its success value is wrapped in `Option.some`. If it
* succeeds with `false`, the source effect is skipped and the result is
* `Option.none`. If the condition effect fails, that failure is preserved.
*
* **Example** (Conditionally running an effect)
*
* ```ts import.meta.vitest
* import { Effect, Option } from "effect"
* const output: Array<unknown> = []
*
* const shouldLog = true
*
* const program = Effect.when(
*   Effect.sync(() => { output.push("Condition is true!") }),
*   Effect.succeed(shouldLog)
* )
*
* void output.push(Effect.runSync(program))
* output // => ["Condition is true!", Option.some(undefined)]
* ```
*
* @category filtering
* @since 2.0.0
*/
var when = when$1;
/**
* Handles both success and failure cases of an effect without performing side
* effects.
*
* **When to use**
*
* Use when you need to fold an `Effect` into a value by handling success and
* failure differently without triggering side effects.
*
* **Details**
*
* `match` lets you define custom handlers for both success and failure
* scenarios. You provide separate functions to handle each case, allowing you
* to process the result if the effect succeeds, or handle the error if the
* effect fails.
*
* **Example** (Matching success and failure values)
*
* ```ts import.meta.vitest
* import { Data, Effect } from "effect"
*
* class ExampleError extends Data.TaggedError("ExampleError")<{ readonly message: string }> {}
*
* const success: Effect.Effect<number, ExampleError> = Effect.succeed(42)
*
* const program1 = Effect.match(success, {
*   onFailure: (error) => `failure: ${error.message}`,
*   onSuccess: (value) => `success: ${value}`
* })
*
* // Run and log the result of the successful effect
* Effect.runSync(program1) // => "success: 42"
*
* const failure: Effect.Effect<number, ExampleError> = Effect.fail(
*   new ExampleError({ message: "Uh oh!" })
* )
*
* const program2 = Effect.match(failure, {
*   onFailure: (error) => `failure: ${error.message}`,
*   onSuccess: (value) => `success: ${value}`
* })
*
* // Run and log the result of the failed effect
* Effect.runSync(program2) // => "failure: Uh oh!"
* ```
*
* @see {@link matchEffect} if you need to perform side effects in the handlers.
* @category pattern matching
* @since 2.0.0
*/
var match = match$2;
/**
* Handles both success and failure cases of an effect without performing side
* effects, with eager evaluation for resolved effects.
*
* **When to use**
*
* Use when you need to handle both success and failure cases of an
* already-resolved `Effect` with optimized handling.
*
* **Details**
*
* `matchEager` works like `match` but provides better performance for resolved
* effects (Success or Failure). When the effect is already resolved, it applies
* the handlers immediately without fiber scheduling. For unresolved effects,
* it falls back to the regular `match` behavior.
*
* **Example** (Pattern matching eagerly when possible)
*
* ```ts import.meta.vitest
* import { Effect } from "effect"
* const output: Array<unknown> = []
*
* const program = Effect.gen(function*() {
*   const result = yield* Effect.matchEager(Effect.succeed(42), {
*     onFailure: (error) => `Failed: ${error}`,
*     onSuccess: (value) => `Success: ${value}`
*   })
*   void output.push(result)
* })
*
* Effect.runSync(program)
* output // => ["Success: 42"]
* ```
*
* @see {@link match} for the non-eager version.
* @see {@link matchEffect} if you need to perform side effects in the handlers.
* @category pattern matching
* @since 4.0.0
*/
var matchEager = matchEager$1;
/**
* Handles failures by matching the cause of failure.
*
* **When to use**
*
* Use when you need to fold an `Effect` while the failure handler inspects the
* full `Cause`.
*
* **Details**
*
* The `matchCause` function allows you to handle failures with access to the
* full cause of the failure within a fiber.
*
* **Example** (Matching on success or failure causes)
*
* ```ts import.meta.vitest
* import { Cause, Effect } from "effect"
*
* const task = Effect.fail("Something went wrong")
*
* const program = Effect.matchCause(task, {
*   onFailure: (cause) => `Failed: ${Cause.squash(cause)}`,
*   onSuccess: (value) => `Success: ${value}`
* })
*
* Effect.runSync(program) // => "Failed: Something went wrong"
* ```
*
* @see {@link matchCauseEffect} if you need to perform side effects in the
* handlers.
* @see {@link match} if you don't need to handle the cause of the failure.
* @category pattern matching
* @since 2.0.0
*/
var matchCause = matchCause$1;
/**
* Handles failures by matching the cause of failure with eager evaluation.
*
* **When to use**
*
* Use when you expect an `Effect` to already be resolved and want to match the
* `Cause` without regular effect pipeline overhead.
*
* **Details**
*
* `matchCauseEager` works like `matchCause` but provides better performance for resolved
* effects by immediately applying the matching function instead of deferring it
* through the effect pipeline.
*
* **Example** (Eagerly matching already completed effects)
*
* ```ts import.meta.vitest
* import { Effect } from "effect"
*
* const handleResult = Effect.matchCauseEager(Effect.succeed(42), {
*   onSuccess: (value) => `Success: ${value}`,
*   onFailure: (cause) => `Failed: ${cause}`
* })
* Effect.runSync(handleResult) // => "Success: 42"
* ```
*
* @category pattern matching
* @since 4.0.0
*/
var matchCauseEager = matchCauseEager$1;
/**
* Handles success or failure eagerly with effectful handlers when the effect is already resolved.
*
* **When to use**
*
* Use when you need effectful success and cause-aware failure handlers for
* `Effect` inputs that may already be resolved.
*
* **Details**
*
* If the effect is an `Exit`, the matching handler runs immediately; otherwise it behaves like
* {@link matchCauseEffect}.
*
* @see {@link matchCauseEffect} for the non-eager effectful variant
* @see {@link matchCauseEager} for eager cause matching with pure handlers
* @see {@link matchEffect} for effectful matching on typed failures instead of full causes
*
* @category pattern matching
* @since 4.0.0
*/
var matchCauseEffectEager = matchCauseEffectEager$1;
/**
* Handles failures with access to the cause and allows performing side effects.
*
* **When to use**
*
* Use when you need to fold an `Effect` with effectful success handlers and
* `Cause`-aware failure handlers.
*
* **Details**
*
* The `matchCauseEffect` function works similarly to {@link matchCause}, but it
* also allows you to perform additional side effects based on the failure
* cause. This function provides access to the complete cause of the failure,
* making it possible to differentiate between various failure types, and allows
* you to respond accordingly while performing side effects (like logging or
* other operations).
*
* **Example** (Effectfully matching on causes)
*
* ```ts import.meta.vitest
* import { Cause, Data, Effect, Result } from "effect"
* const output: Array<unknown> = []
*
* class TaskError extends Data.TaggedError("TaskError")<{ readonly message: string }> {}
*
* const task = Effect.fail(new TaskError({ message: "Task failed" }))
*
* const program = Effect.matchCauseEffect(task, {
*   onFailure: (cause) =>
*     Effect.gen(function*() {
*       if (Cause.hasFails(cause)) {
*         const error = Cause.findError(cause)
*         if (Result.isSuccess(error)) {
*           yield* Effect.sync(() => { output.push(`Handling error: ${error.success.message}`) })
*         }
*         return "recovered from error"
*       } else {
*         yield* Effect.sync(() => { output.push("Handling interruption or defect") })
*         return "recovered from interruption/defect"
*       }
*     }),
*   onSuccess: (value) =>
*     Effect.gen(function*() {
*       yield* Effect.sync(() => { output.push(`Success: ${value}`) })
*       return `processed ${value}`
*     })
* })
*
* void output.push(Effect.runSync(program))
* output // => ["Handling error: Task failed", "recovered from error"]
* ```
*
* @see {@link matchCause} if you don't need side effects and only want to handle the result or failure.
* @see {@link matchEffect} if you don't need to handle the cause of the failure.
*
* @category pattern matching
* @since 2.0.0
*/
var matchCauseEffect = matchCauseEffect$1;
/**
* Handles both success and failure by running effectful handlers.
*
* **When to use**
*
* Use when you need to handle an `Effect`'s failure or success with handlers
* that return effects.
*
* **Details**
*
* Use `matchEffect` when either branch needs to return an `Effect`, such as
* performing logging, recovery, notification, or other effectful work. The
* returned effect succeeds or fails according to the handler that is run.
*
* **Example** (Matching success and failure with effectful handlers)
*
* ```ts import.meta.vitest
* import { Data, Effect } from "effect"
*
* class ExampleError extends Data.TaggedError("ExampleError")<{ readonly message: string }> {}
*
* const success: Effect.Effect<number, ExampleError> = Effect.succeed(42)
* const failure: Effect.Effect<number, ExampleError> = Effect.fail(
*   new ExampleError({ message: "Uh oh!" })
* )
*
* const program1 = Effect.matchEffect(success, {
*   onFailure: (error) =>
*     Effect.succeed(`failure: ${error.message}`),
*   onSuccess: (value) =>
*     Effect.succeed(`success: ${value}`)
* })
*
* Effect.runSync(program1) // => "success: 42"
*
* const program2 = Effect.matchEffect(failure, {
*   onFailure: (error) =>
*     Effect.succeed(`failure: ${error.message}`),
*   onSuccess: (value) =>
*     Effect.succeed(`success: ${value}`)
* })
*
* Effect.runSync(program2) // => "failure: Uh oh!"
* ```
*
* @see {@link match} if you don't need side effects and only want to handle the
* result or failure.
* @category pattern matching
* @since 2.0.0
*/
var matchEffect = matchEffect$2;
/**
* Determines whether an effect fails.
*
* **Details**
*
* Defects are not converted; if the effect dies, the resulting effect dies too.
*
* **Example** (Checking whether an effect fails)
*
* ```ts import.meta.vitest
* import { Effect } from "effect"
* const output: Array<unknown> = []
*
* const program = Effect.gen(function*() {
*   const failed = yield* Effect.isFailure(Effect.fail("Uh oh!"))
*   yield* Effect.sync(() => { output.push(failed) })
* })
*
* Effect.runSync(program)
* output // => [true]
* ```
*
* @category predicates
* @since 2.0.0
*/
var isFailure = isFailure$2;
/**
* Returns whether an effect completes successfully.
*
* **Details**
*
* Returns `false` for failures in the error channel, but defects still fail the
* effect.
*
* **Example** (Checking whether an effect succeeds)
*
* ```ts import.meta.vitest
* import { Effect } from "effect"
* const output: Array<unknown> = []
*
* const program = Effect.gen(function*() {
*   const ok = yield* Effect.isSuccess(Effect.succeed("done"))
*   const failed = yield* Effect.isSuccess(Effect.fail("Uh oh"))
*   yield* Effect.sync(() => { output.push(`ok: ${ok}`) })
*   yield* Effect.sync(() => { output.push(`failed: ${failed}`) })
* })
*
* Effect.runSync(program)
* output // => ["ok: true", "failed: false"]
* ```
*
* @category predicates
* @since 2.0.0
*/
var isSuccess = isSuccess$2;
/**
* Returns the complete context.
*
* **When to use**
*
* Use to read the complete `Context` available to the current effect.
*
* **Details**
*
* This function allows you to access all services that are currently available
* in the effect's environment. This can be useful for debugging, introspection,
* or when you need to pass the entire context to another function.
*
* **Example** (Reading the full context)
*
* ```ts import.meta.vitest
* import { Context, Effect, Option } from "effect"
* const output: Array<unknown> = []
*
* const Logger = Context.Service<{
*   log: (msg: string) => void
* }>("Logger")
* const Database = Context.Service<{
*   query: (sql: string) => string
* }>("Database")
*
* const program = Effect.gen(function*() {
*   const allServices = yield* Effect.context()
*
*   // Check if specific services are available
*   const loggerOption = Context.getOption(allServices, Logger)
*   const databaseOption = Context.getOption(allServices, Database)
*
*   yield* Effect.sync(() => { output.push(`Logger available: ${Option.isSome(loggerOption)}`) })
*   yield* Effect.sync(() => { output.push(`Database available: ${Option.isSome(databaseOption)}`) })
* })
*
* const context = Context.make(Logger, { log: () => {} })
*   .pipe(Context.add(Database, { query: () => "result" }))
*
* const provided = Effect.provideContext(program, context)
* Effect.runSync(provided)
* output // => ["Logger available: true", "Database available: true"]
* ```
*
* @see {@link contextWith} for deriving an effect from the complete context
* @see {@link service} for reading one service from the context
*
* @category accessors
* @since 2.0.0
*/
var context = context$1;
/**
* Transforms the current context using the provided function.
*
* **When to use**
*
* Use to derive an effect from the complete `Context`.
*
* **Details**
*
* This function allows you to access the complete context and perform
* computations based on all available services. This is useful when you need
* to conditionally execute logic based on what services are available.
*
* **Example** (Deriving values from the context)
*
* ```ts import.meta.vitest
* import { Context, Effect, Option } from "effect"
* const output: Array<unknown> = []
*
* const Logger = Context.Service<{
*   log: (msg: string) => void
* }>("Logger")
* const Cache = Context.Service<{
*   get: (key: string) => string | null
* }>("Cache")
*
* const program = Effect.contextWith((services: Context.Context<Context.Service.Identifier<typeof Cache>>) => {
*   const cacheOption = Context.getOption(services, Cache)
*   const hasCache = Option.isSome(cacheOption)
*
*   if (hasCache) {
*     return Effect.gen(function*() {
*       const cache = yield* Effect.service(Cache)
*       yield* Effect.sync(() => { output.push("Using cached data") })
*       return cache.get("user:123") || "default"
*     })
*   } else {
*     return Effect.gen(function*() {
*       yield* Effect.sync(() => { output.push("No cache available, using fallback") })
*       return "fallback data"
*     })
*   }
* })
*
* const withCache = Effect.provideService(program, Cache, {
*   get: () => "cached_value"
* })
* void output.push(Effect.runSync(withCache))
* output // => ["Using cached data", "cached_value"]
* ```
*
* @see {@link context} for reading the complete context as a value
* @see {@link service} for reading one service from the context
*
* @category accessors
* @since 2.0.0
*/
var contextWith = contextWith$1;
/**
* Provides dependencies to an effect using layers or a context. Use `options.local`
* to build the layer every time; by default, layers are shared between provide
* calls.
*
* **Example** (Providing dependencies with a layer)
*
* ```ts import.meta.vitest
* import { Context, Effect, Layer } from "effect"
*
* interface Database {
*   readonly query: (sql: string) => Effect.Effect<string>
* }
*
* const Database = Context.Service<Database>("Database")
*
* const DatabaseLayer = Layer.succeed(Database)({
*   query: Effect.fn("Database.query")((sql: string) => Effect.succeed(`Result for: ${sql}`))
* })
*
* const program = Effect.gen(function*() {
*   const db = yield* Database
*   return yield* db.query("SELECT * FROM users")
* })
*
* const provided = Effect.provide(program, DatabaseLayer)
*
* await Effect.runPromise(provided) // => "Result for: SELECT * FROM users"
* ```
*
* @category providing services
* @since 2.0.0
*/
var provide = provide$1;
/**
* Provides a context to an effect, fulfilling its service requirements.
*
* **Details**
*
* This function provides multiple services at once by supplying a context
* that contains all the required services. It removes the provided services
* from the effect's requirements, making them available to the effect.
*
* **Example** (Providing a complete context)
*
* ```ts import.meta.vitest
* import { Context, Effect } from "effect"
* const output: Array<unknown> = []
*
* // Define service keys
* const Logger = Context.Service<{
*   log: (msg: string) => void
* }>("Logger")
* const Database = Context.Service<{
*   query: (sql: string) => string
* }>("Database")
*
* // Create a context with multiple services
* const context = Context.make(Logger, { log: (message) => { output.push(message) } })
*   .pipe(Context.add(Database, { query: () => "result" }))
*
* // An effect that requires both services
* const program = Effect.gen(function*() {
*   const logger = yield* Effect.service(Logger)
*   const db = yield* Effect.service(Database)
*   logger.log("Querying database")
*   return db.query("SELECT * FROM users")
* })
*
* const provided = Effect.provideContext(program, context)
* void output.push(Effect.runSync(provided))
* output // => ["Querying database", "result"]
* ```
*
* @category providing services
* @since 4.0.0
*/
var provideContext = provideContext$1;
/**
* Runs an effect with the provided context as its complete environment.
*
* **When to use**
*
* Use when you already have a `Context` containing every service required by
* the effect and want the wrapped effect to run with exactly that context.
*
* **Gotchas**
*
* `setContext` replaces the current context for the wrapped effect. Services
* from an outer context are not inherited unless they are also present in the
* context passed to `setContext`.
*
* **Example** (Running with a complete context)
*
* ```ts import.meta.vitest
* import { Context, Effect } from "effect"
*
* class Config extends Context.Service<Config, {
*   readonly greeting: string
* }>()("Config") {}
*
* const program = Effect.gen(function*() {
*   const config = yield* Effect.service(Config)
*   return `${config.greeting}, World!`
* })
*
* const context = Context.make(Config, { greeting: "Hello" })
*
* const runnable = Effect.setContext(program, context)
*
* Effect.runSync(runnable) // => "Hello, World!"
* ```
*
* @see {@link provideContext} for partially satisfying an effect's context requirements.
* @see {@link updateContext} for deriving the required context from the current one.
*
* @category providing services
* @since 4.0.0
*/
var setContext = setContext$1;
/**
* Accesses a service from the context.
*
* **Example** (Accessing a required service)
*
* ```ts import.meta.vitest
* import { Context, Effect } from "effect"
*
* interface Database {
*   readonly query: (sql: string) => Effect.Effect<string>
* }
*
* const Database = Context.Service<Database>("Database")
*
* const program = Effect.gen(function*() {
*   const db = yield* Effect.service(Database)
*   return yield* db.query("SELECT * FROM users")
* })
*
* const runnable = Effect.provideService(program, Database, {
*   query: (sql) => Effect.succeed(`Result for: ${sql}`)
* })
* Effect.runSync(runnable) // => "Result for: SELECT * FROM users"
* ```
*
* @category accessors
* @since 4.0.0
*/
var service = service$1;
/**
* Optionally accesses a service from the environment.
*
* **When to use**
*
* Use to read an optional dependency from the current context without making
* that dependency part of the effect's required environment.
*
* **Details**
*
* This function attempts to access a service from the environment. If the
* service is available, it returns `Some(service)`. If the service is not
* available, it returns `None`. Unlike `service`, this function does not
* require the service to be present in the environment.
*
* **Example** (Accessing an optional service)
*
* ```ts import.meta.vitest
* import { Context, Effect, Option } from "effect"
* const output: Array<unknown> = []
*
* // Define a service key
* const Logger = Context.Service<{
*   log: (msg: string) => void
* }>("Logger")
*
* // Use serviceOption to optionally access the logger
* const program = Effect.gen(function*() {
*   const maybeLogger = yield* Effect.serviceOption(Logger)
*
*   if (Option.isSome(maybeLogger)) {
*     maybeLogger.value.log("Service is available")
*   } else {
*     void output.push("Service not available")
*   }
* })
*
* Effect.runSync(program)
* output // => ["Service not available"]
* ```
*
* @category accessors
* @since 2.0.0
*/
var serviceOption = serviceOption$1;
/**
* Provides part of the required context while leaving the rest unchanged.
*
* **Details**
*
* This function allows you to transform the context required by an effect,
* providing part of the context and leaving the rest to be fulfilled later.
*
* **Example** (Updating the context before running)
*
* ```ts import.meta.vitest
* import { Context, Effect } from "effect"
*
* // Define services
* const Logger = Context.Service<{
*   log: (msg: string) => void
* }>("Logger")
* const Config = Context.Service<{
*   name: string
* }>("Config")
*
* const program = Effect.service(Config).pipe(
*   Effect.map((config) => `Hello ${config.name}!`)
* )
*
* // Transform services by providing Config while keeping Logger requirement
* const configured = program.pipe(
*   Effect.updateContext((context: Context.Context<Context.Service.Identifier<typeof Logger>>) =>
*     Context.add(context, Config, { name: "World" })
*   )
* )
*
* // The effect now requires only Logger service
* const result = Effect.provideService(configured, Logger, {
*   log: () => {}
* })
* Effect.runSync(result) // => "Hello World!"
* ```
*
* @category providing services
* @since 4.0.0
*/
var updateContext = updateContext$1;
/**
* Runs an effect with a service implementation transformed by the provided
* function.
*
* **Details**
*
* The service must be available in the effect's context; `updateService`
* replaces it for the wrapped effect with the value returned by the updater.
*
* **Example** (Replacing a service for one effect)
*
* ```ts import.meta.vitest
* import { Context, Effect } from "effect"
* const output: Array<unknown> = []
*
* // Define a counter service
* const Counter = Context.Service<{ count: number }>("Counter")
*
* const program = Effect.gen(function*() {
*   const updatedCounter = yield* Effect.service(Counter)
*   yield* Effect.sync(() => { output.push(`Updated count: ${updatedCounter.count}`) })
*   return updatedCounter.count
* }).pipe(
*   Effect.updateService(Counter, (counter) => ({ count: counter.count + 1 }))
* )
*
* // Provide initial service and run
* const result = Effect.provideService(program, Counter, { count: 0 })
* void output.push(Effect.runSync(result))
* output // => ["Updated count: 1", 1]
* ```
*
* @category providing services
* @since 2.0.0
*/
var updateService = updateService$1;
/**
* Updates a service for the lifetime of the current scope and restores its
* previous value when the scope closes.
*
* **When to use**
*
* Use when you need a setup effect to change a service for subsequent effects
* in the same scope.
*
* **Details**
*
* The updater receives the currently visible service value. A
* `Context.Service` remains in the requirements, while a `Context.Reference`
* uses its default when no override is present and adds no service requirement.
* The returned effect always requires `Scope`. The optional `reset` function
* receives the original, updated, and current values when the scope closes,
* allowing changes to be merged during restoration. It defaults to returning
* the original value.
*
* **Example** (Updating a reference within a scope)
*
* ```ts import.meta.vitest
* import { Context, Effect } from "effect"
* const output: Array<unknown> = []
*
* const CurrentNumber = Context.Reference<number>("CurrentNumber", {
*   defaultValue: () => 1
* })
*
* const program = Effect.gen(function*() {
*   const before = yield* CurrentNumber
*   const during = yield* Effect.scoped(
*     Effect.gen(function*() {
*       yield* Effect.updateServiceScoped(
*         CurrentNumber,
*         (value) => value + 1,
*         {
*           // Optional: when omitted, the original value is restored
*           reset: (original, updated, current) =>
*             Math.max(original, updated, current) + 1
*         }
*       )
*       return yield* CurrentNumber
*     })
*   )
*   const after = yield* CurrentNumber
*
*   void output.push([before, during, after])
* })
*
* await Effect.runPromise(program)
* output // => [[1, 2, 3]]
* ```
*
* @see {@link updateService} for updating a service only within a wrapped effect
*
* @category providing services
* @since 4.0.0
*/
var updateServiceScoped = updateServiceScoped$1;
/**
* Provides one concrete service implementation to an effect.
*
* **When to use**
*
* Use to satisfy one service requirement with an already-built implementation.
*
* **Details**
*
* The service requirement identified by the `Context.Key` is removed from the
* effect requirements after the implementation is provided.
*
* **Example** (Providing a service value)
*
* ```ts import.meta.vitest
* import { Context, Effect } from "effect"
* const output: Array<unknown> = []
*
* // Define a service for configuration
* const Config = Context.Service<{
*   apiUrl: string
*   timeout: number
* }>("Config")
*
* const fetchData = Effect.gen(function*() {
*   const config = yield* Effect.service(Config)
*   yield* Effect.sync(() => { output.push(`Fetching from: ${config.apiUrl}`) })
*   yield* Effect.sync(() => { output.push(`Timeout: ${config.timeout}ms`) })
*   return "data"
* })
*
* // Provide the service implementation
* const program = Effect.provideService(fetchData, Config, {
*   apiUrl: "https://api.example.com",
*   timeout: 5000
* })
*
* void output.push(Effect.runSync(program))
* output // => ["Fetching from: https://api.example.com", "Timeout: 5000ms", "data"]
* ```
*
* @see {@link provide} for providing multiple layers to an effect.
* @see {@link provideServiceEffect} for acquiring the service implementation effectfully.
* @see {@link provideContext} for providing a complete context.
* @category providing services
* @since 2.0.0
*/
var provideService = provideService$1;
/**
* Provides one service to an effect using an effectful acquisition.
*
* **When to use**
*
* Use when the service implementation must be created by an effect and its
* acquisition failure should remain in the returned effect.
*
* **Details**
*
* `provideServiceEffect` runs the acquisition effect to produce the service
* implementation, removes that service from the wrapped effect's requirements,
* and leaves any other requirements to be provided later. Acquisition failures
* are included in the returned effect's error channel.
*
* **Example** (Providing a service with an effect)
*
* ```ts import.meta.vitest
* import { Context, Effect } from "effect"
* const output: Array<unknown> = []
*
* // Define a database connection service
* interface DatabaseConnection {
*   readonly query: (sql: string) => Effect.Effect<string>
* }
* const Database = Context.Service<DatabaseConnection>("Database")
*
* // Effect that creates a database connection
* const createConnection = Effect.gen(function*() {
*   yield* Effect.sync(() => { output.push("Establishing database connection...") })
*   yield* Effect.sync(() => { output.push("Database connected!") })
*   return {
*     query: (sql: string) => Effect.succeed(`Result for: ${sql}`)
*   }
* })
*
* const program = Effect.gen(function*() {
*   const db = yield* Effect.service(Database)
*   return yield* db.query("SELECT * FROM users")
* })
*
* // Provide the service through an effect
* const withDatabase = Effect.provideServiceEffect(
*   program,
*   Database,
*   createConnection
* )
*
* void output.push(await Effect.runPromise(withDatabase))
* output // => ["Establishing database connection...", "Database connected!", "Result for: SELECT * FROM users"]
* ```
*
* @category providing services
* @since 2.0.0
*/
var provideServiceEffect = provideServiceEffect$1;
/**
* Returns the current scope for resource management.
*
* **Example** (Accessing the current scope)
*
* ```ts import.meta.vitest
* import { Effect } from "effect"
* const output: Array<unknown> = []
*
* const program = Effect.gen(function*() {
*   const currentScope = yield* Effect.scope
*   yield* Effect.sync(() => { output.push("Got scope for resource management") })
*
*   // Use the scope to manually manage resources if needed
*   const resource = yield* Effect.acquireRelease(
*     Effect.sync(() => { output.push("Acquiring resource") }).pipe(Effect.as("resource")),
*     () => Effect.sync(() => { output.push("Releasing resource") })
*   )
*
*   return resource
* })
*
* void output.push(Effect.runSync(Effect.scoped(program)))
* output // => ["Got scope for resource management", "Acquiring resource", "Releasing resource", "resource"]
* ```
*
* @category resource management
* @since 2.0.0
*/
var scope = scope$1;
/**
* Runs an effect with a scope that closes when the effect completes.
*
* **When to use**
*
* Use to acquire scoped resources for the duration of a single workflow.
*
* **Details**
*
* Finalizers for resources acquired inside the workflow run as soon as the
* workflow completes, whether by success, failure, or interruption.
*
* **Example** (Running a scoped acquisition)
*
* ```ts import.meta.vitest
* import { Effect } from "effect"
* const output: Array<unknown> = []
*
* const resource = Effect.acquireRelease(
*   Effect.sync(() => { output.push("Acquiring resource") }).pipe(Effect.as("resource")),
*   () => Effect.sync(() => { output.push("Releasing resource") })
* )
*
* const program = Effect.scoped(
*   Effect.gen(function*() {
*     const res = yield* resource
*     yield* Effect.sync(() => { output.push(`Using ${res}`) })
*     return res
*   })
* )
*
* Effect.runSync(program)
* output // => ["Acquiring resource", "Using resource", "Releasing resource"]
* ```
*
* @category resource management
* @since 2.0.0
*/
var scoped = scoped$1;
/**
* Creates a scoped effect by providing access to the scope.
*
* **When to use**
*
* Use when resource acquisition needs direct access to the scope being created,
* for example to register finalizers manually.
*
* **Example** (Working with an explicit scope)
*
* ```ts import.meta.vitest
* import { Effect, Scope } from "effect"
* const output: Array<unknown> = []
*
* const program = Effect.scopedWith((scope) =>
*   Effect.gen(function*() {
*     yield* Effect.sync(() => { output.push("Inside scoped context") })
*
*     // Manually add a finalizer to the scope
*     yield* Scope.addFinalizer(scope, Effect.sync(() => { output.push("Manual finalizer") }))
*
*     // Create a scoped resource
*     const resource = yield* Effect.scoped(
*       Effect.acquireRelease(
*         Effect.sync(() => { output.push("Acquiring resource") }).pipe(Effect.as("resource")),
*         () => Effect.sync(() => { output.push("Releasing resource") })
*       )
*     )
*
*     return resource
*   })
* )
*
* void output.push(Effect.runSync(program))
* output // => ["Inside scoped context", "Acquiring resource", "Releasing resource", "Manual finalizer", "resource"]
* ```
*
* @category resource management
* @since 3.11.0
*/
var scopedWith = scopedWith$1;
/**
* Constructs a scoped resource from an acquisition effect and a release
* finalizer.
*
* **When to use**
*
* Use to acquire a scoped resource with an explicit release finalizer.
*
* **Details**
*
* If acquisition succeeds, the release finalizer is added to the current scope
* and is guaranteed to run when that scope closes. The finalizer receives the
* `Exit` value used to close the scope.
*
* By default, acquisition is protected by an uninterruptible region. Pass
* `{ interruptible: true }` to allow the acquisition effect to be interrupted.
*
* **Example** (Acquiring and releasing a resource)
*
* ```ts import.meta.vitest
* import { Effect, Exit } from "effect"
* const output: Array<unknown> = []
*
* // Simulate a resource that needs cleanup
* interface FileHandle {
*   readonly path: string
*   readonly content: string
* }
*
* // Acquire a file handle
* const acquire = Effect.gen(function*() {
*   yield* Effect.sync(() => { output.push("Opening file") })
*   return { path: "/tmp/file.txt", content: "file content" }
* })
*
* // Release the file handle
* const release = (handle: FileHandle, exit: Exit.Exit<unknown, unknown>) =>
*   Effect.sync(() => { output.push(
*     `Closing file ${handle.path} with exit: ${
*       Exit.isSuccess(exit) ? "success" : "failure"
*     }`
*   ) })
*
* // Create a scoped resource
* const resource = Effect.acquireRelease(acquire, release)
*
* // Use the resource within a scope
* const program = Effect.scoped(
*   Effect.gen(function*() {
*     const handle = yield* resource
*     yield* Effect.sync(() => { output.push(`Using file: ${handle.path}`) })
*     return handle.content
*   })
* )
*
* void output.push(Effect.runSync(program))
* output // => ["Opening file", "Using file: /tmp/file.txt", "Closing file /tmp/file.txt with exit: success", "file content"]
* ```
*
* @see {@link acquireDisposable} for resources that implement JavaScript disposal protocols
* @see {@link acquireUseRelease} for bracketing acquire, use, and release in one effect
*
* @category resource management
* @since 2.0.0
*/
var acquireRelease = acquireRelease$1;
/**
* Acquires a scoped resource that implements JavaScript disposal protocols.
*
* **When to use**
*
* Use when you work with JavaScript `Disposable` or `AsyncDisposable` resources
* that should be closed with the surrounding scope.
*
* **Details**
*
* The resource is automatically disposed when the surrounding
* {@link Scope} is closed, using {@link Symbol.dispose} for
* synchronous disposables or {@link Symbol.asyncDispose} for asynchronous
* disposables.
*
* This is similar to {@link acquireRelease}, but uses the standard
* JavaScript disposal protocol instead of requiring an explicit release
* function. It works with JavaScript `Disposable` and `AsyncDisposable`
* resources.
*
* **Example** (Acquiring a disposable resource)
*
* ```ts import.meta.vitest
* import { Effect } from "effect"
* const output: Array<unknown> = []
*
* class Resource implements Disposable {
*   [Symbol.dispose]() {
*     void output.push("disposed")
*   }
* }
*
* const program = Effect.scoped(
*   Effect.gen(function*() {
*     yield* Effect.acquireDisposable(Effect.succeed(new Resource()))
*     void output.push("acquired")
*   })
* )
*
* Effect.runSync(program)
* output // => ["acquired", "disposed"]
* ```
*
* @see {@link acquireRelease} for resources that need an explicit finalizer
*
* @category resource management
* @since 4.0.0
*/
var acquireDisposable = acquireDisposable$1;
/**
* Runs resource acquisition, usage, and release as one bracketed effect.
*
* **When to use**
*
* Use to bracket acquire, use, and release logic in one effect.
*
* **Details**
*
* `acquireUseRelease` does the following:
*
*   1. Ensures that the `Effect` value that acquires the resource will not be
*      interrupted. Note that acquisition may still fail due to internal
*      reasons (such as an uncaught exception).
*   2. Ensures that the `release` `Effect` value will not be interrupted,
*      and will be executed as long as the acquisition `Effect` value
*      successfully acquires the resource.
*
* During the time period between the acquisition and release of the resource,
* the `use` `Effect` value will be executed.
*
* If the `release` `Effect` value fails, then the entire `Effect` value will
* fail, even if the `use` `Effect` value succeeds. If this fail-fast behavior
* is not desired, errors produced by the `release` `Effect` value can be caught
* and ignored.
*
* **Example** (Acquiring resources with cleanup)
*
* ```ts import.meta.vitest
* import { Effect, Exit } from "effect"
* const output: Array<unknown> = []
*
* interface Database {
*   readonly connection: string
*   readonly query: (sql: string) => Effect.Effect<string>
* }
*
* const program = Effect.acquireUseRelease(
*   // Acquire - connect to database
*   Effect.gen(function*() {
*     yield* Effect.sync(() => { output.push("Connecting to database...") })
*     return {
*       connection: "db://localhost:5432",
*       query: (sql: string) => Effect.succeed(`Result for: ${sql}`)
*     }
*   }),
*   // Use - perform database operations
*   (db) =>
*     Effect.gen(function*() {
*       yield* Effect.sync(() => { output.push(`Connected to ${db.connection}`) })
*       const result = yield* db.query("SELECT * FROM users")
*       yield* Effect.sync(() => { output.push(`Query result: ${result}`) })
*       return result
*     }),
*   // Release - close database connection
*   (db, exit) =>
*     Effect.gen(function*() {
*       if (Exit.isSuccess(exit)) {
*         yield* Effect.sync(() => { output.push(`Closing connection to ${db.connection} (success)`) })
*       } else {
*         yield* Effect.sync(() => { output.push(`Closing connection to ${db.connection} (failure)`) })
*       }
*     })
* )
*
* await Effect.runPromise(program)
* output // => ["Connecting to database...", "Connected to db://localhost:5432", "Query result: Result for: SELECT * FROM users", "Closing connection to db://localhost:5432 (success)"]
* ```
*
* @see {@link acquireRelease} for scoped resources whose use happens later
*
* @category resource management
* @since 2.0.0
*/
var acquireUseRelease = acquireUseRelease$1;
/**
* Adds a finalizer to the current scope.
*
* **When to use**
*
* Use to register low-level cleanup in the current scope.
*
* **Details**
*
* The finalizer runs when the surrounding scope is closed and receives the
* `Exit` value used to close the scope.
*
* **Example** (Registering scope finalizers)
*
* ```ts import.meta.vitest
* import { Effect, Exit } from "effect"
* const output: Array<unknown> = []
*
* const program = Effect.scoped(
*   Effect.gen(function*() {
*     // Add a finalizer that runs when the scope closes
*     yield* Effect.addFinalizer((exit) =>
*       Effect.sync(() => { output.push(
*         Exit.isSuccess(exit)
*           ? "Cleanup: Operation completed successfully"
*           : "Cleanup: Operation failed, cleaning up resources"
*       ) })
*     )
*
*     yield* Effect.sync(() => { output.push("Performing main operation...") })
*
*     // This could succeed or fail
*     return "operation result"
*   })
* )
*
* void output.push(Effect.runSync(program))
* output // => ["Performing main operation...", "Cleanup: Operation completed successfully", "operation result"]
* ```
*
* @see {@link acquireRelease} for resource acquisition with a release finalizer
* @see {@link ensuring} for attaching a finalizer to one effect
*
* @category resource management
* @since 2.0.0
*/
var addFinalizer = addFinalizer$2;
/**
* Returns an effect that, if this effect _starts_ execution, then the
* specified `finalizer` is guaranteed to be executed, whether this effect
* succeeds, fails, or is interrupted.
*
* **Details**
*
* For use cases that need access to the effect's result, see `onExit`.
*
* Finalizers offer very powerful guarantees, but they are low-level, and
* should generally not be used for releasing resources. For higher-level
* logic built on `ensuring`, see the `acquireRelease` family of methods.
*
* **Example** (Always running cleanup)
*
* ```ts import.meta.vitest
* import { Effect } from "effect"
* const output: Array<unknown> = []
*
* const task = Effect.gen(function*() {
*   yield* Effect.sync(() => { output.push("Task started") })
*   yield* Effect.sync(() => { output.push("Task completed") })
*   return 42
* })
*
* // Ensure cleanup always runs, regardless of success or failure
* const program = Effect.ensuring(
*   task,
*   Effect.sync(() => { output.push("Cleanup: This always runs!") })
* )
*
* void output.push(Effect.runSync(program))
* output // => ["Task started", "Task completed", "Cleanup: This always runs!", 42]
* ```
*
* @category resource management
* @since 2.0.0
*/
var ensuring = ensuring$1;
/**
* Runs the specified effect if this effect fails, providing the error to the
* effect if it exists. The provided effect will not be interrupted.
*
* **Example** (Running cleanup on failure)
*
* ```ts import.meta.vitest
* import { Cause, Data, Effect, Exit } from "effect"
* const output: Array<unknown> = []
*
* class TaskError extends Data.TaggedError("TaskError")<{ readonly message: string }> {}
*
* const error = new TaskError({ message: "Something went wrong" })
* const task = Effect.fail(error)
*
* const program = Effect.onError(
*   task,
*   (cause) => Effect.sync(() => { output.push(`Cleanup on error: ${Cause.squash(cause)}`) })
* )
*
* void output.push(Effect.runSyncExit(program))
* output // => ["Cleanup on error: TaskError: Something went wrong", Exit.fail(error)]
* ```
*
* @category resource management
* @since 2.0.0
*/
var onError = onError$1;
/**
* Runs the finalizer only when this effect fails and the `Cause` matches the
* provided predicate.
*
* **Example** (Running cleanup for selected failures)
*
* ```ts import.meta.vitest
* import { Cause, Effect, Exit } from "effect"
* const output: Array<unknown> = []
*
* const task = Effect.fail("boom")
*
* const program = Effect.onErrorIf(
*   task,
*   Cause.hasFails,
*   (cause) =>
*     Effect.gen(function*() {
*       yield* Effect.sync(() => { output.push(`Cause: ${Cause.squash(cause)}`) })
*     })
* )
*
* void output.push(Effect.runSyncExit(program))
* output // => ["Cause: boom", Exit.fail("boom")]
* ```
*
* @category resource management
* @since 4.0.0
*/
var onErrorIf = onErrorIf$1;
/**
* Runs the finalizer only when this effect fails and the cause matches the provided `Filter`.
*
* **When to use**
*
* Use when cleanup or diagnostics should run only for failures whose full
* `Cause` is accepted or transformed by a `Filter`, and the finalizer needs the
* filter's pass value plus the original cause.
*
* @see {@link onError} for cleanup on every failure
* @see {@link onErrorIf} for selecting failures with a boolean predicate
* @see {@link onExitFilter} for selecting from every exit instead of only failures
*
* @category resource management
* @since 4.0.0
*/
var onErrorFilter = onErrorFilter$1;
/**
* Runs an optional finalizer with the effect's `Exit` value when the effect
* completes.
*
* **When to use**
*
* Use when you are building a low-level `Effect` operator that must inspect the
* source effect's `Exit`, may skip finalization by returning `undefined`, or
* must choose whether finalization is forced into an uninterruptible region.
*
* **Details**
*
* This low-level operator preserves the source effect's result unless the
* finalizer fails. If both the source effect and the finalizer fail, the two
* causes are merged. Prefer `onExit` for normal cleanup logic.
*
* @see {@link onExit} for ordinary exit-aware cleanup whose finalizer always returns an effect
*
* @category resource management
* @since 4.0.0
*/
var onExitPrimitive = onExitPrimitive$1;
/**
* Ensures that a cleanup function runs whether this effect succeeds, fails, or
* is interrupted.
*
* If both the effect and the cleanup function fail, the two causes are merged.
*
* **Example** (Observing every exit)
*
* ```ts import.meta.vitest
* import { Effect, Exit } from "effect"
* const output: Array<unknown> = []
*
* const task = Effect.succeed(42)
*
* const program = Effect.onExit(task, (exit) =>
*   Effect.sync(() => { output.push(
*     Exit.isSuccess(exit)
*       ? `Task succeeded with: ${exit.value}`
*       : `Task failed: ${Exit.isFailure(exit) ? exit.cause : "interrupted"}`
*   ) }))
*
* void output.push(Effect.runSync(program))
* output // => ["Task succeeded with: 42", 42]
* ```
*
* @category resource management
* @since 2.0.0
*/
var onExit = onExit$1;
/**
* Runs the cleanup effect only when the `Exit` satisfies the provided
* predicate.
*
* **Example** (Observing selected exits)
*
* ```ts import.meta.vitest
* import { Effect, Exit } from "effect"
* const output: Array<unknown> = []
*
* const program = Effect.onExitIf(
*   Effect.succeed(42),
*   Exit.isSuccess,
*   (exit) =>
*     Exit.isSuccess(exit)
*       ? Effect.sync(() => { output.push(`Succeeded with: ${exit.value}`) })
*       : Effect.void
* )
*
* void output.push(Effect.runSync(program))
* output // => ["Succeeded with: 42", 42]
* ```
*
* @category resource management
* @since 4.0.0
*/
var onExitIf = onExitIf$1;
/**
* Runs the cleanup effect only when the `Exit` matches the provided `Filter`.
*
* **When to use**
*
* Use when cleanup should run only for `Exit` values selected by a `Filter`,
* and the cleanup needs the extracted pass value together with the original
* `Exit`.
*
* **Details**
*
* `Result.fail` skips cleanup, and `Result.succeed` runs cleanup with the
* selected value and the original `Exit`.
*
* @see {@link onExit} for cleanup on every exit
* @see {@link onExitIf} for selecting exits with a boolean predicate
* @see {@link onErrorFilter} for selecting only failure causes
*
* @category resource management
* @since 4.0.0
*/
var onExitFilter = onExitFilter$1;
/**
* Returns an effect that lazily computes a result and caches it for subsequent
* evaluations.
*
* **When to use**
*
* Use when you need an expensive or time-consuming operation to be evaluated
* once and reused by later callers.
*
* **Details**
*
* This function wraps an effect and ensures that its result is computed only
* once. Once the result is computed, it is cached, meaning that subsequent
* evaluations of the same effect will return the cached result without
* re-executing the logic.
*
* **Example** (Memoizing an effect until invalidated)
*
* ```ts import.meta.vitest
* import { Effect } from "effect"
* const output: Array<unknown> = []
* const record = (value: unknown) => Effect.sync(() => { output.push(value) })
*
* let i = 1
* const expensiveTask = Effect.sync(() => {
*   void output.push("expensive task...")
*   return `result ${i++}`
* })
*
* const program = Effect.gen(function*() {
*   void output.push("non-cached version:")
*   yield* expensiveTask.pipe(Effect.andThen(record))
*   yield* expensiveTask.pipe(Effect.andThen(record))
*   void output.push("cached version:")
*   const cached = yield* Effect.cached(expensiveTask)
*   yield* cached.pipe(Effect.andThen(record))
*   yield* cached.pipe(Effect.andThen(record))
* })
*
* await Effect.runPromise(program)
* output // => ["non-cached version:", "expensive task...", "result 1", "expensive task...", "result 2", "cached version:", "expensive task...", "result 3", "result 3"]
* ```
*
* @see {@link cachedWithTTL} for a similar function that includes a
* time-to-live duration for the cached value.
* @see {@link cachedInvalidateWithTTL} for a similar function that includes an
* additional effect for manually invalidating the cached value.
* @category caching
* @since 2.0.0
*/
var cached = cached$1;
/**
* Returns an effect that caches its result for a specified `Duration`,
* known as "timeToLive" (TTL).
*
* **When to use**
*
* Use when you need a costly effect result to be reused for a bounded duration
* before being recomputed.
*
* **Details**
*
* This function is used to cache the result of an effect for a specified amount
* of time. This means that the first time the effect is evaluated, its result
* is computed and stored.
*
* If the effect is evaluated again within the specified `timeToLive`, the
* cached result will be used, avoiding recomputation.
*
* After the specified duration has passed, the cache expires, and the effect
* will be recomputed upon the next evaluation.
*
* **Example** (Memoizing an effect with TTL)
*
* ```ts import.meta.vitest
* import { Effect } from "effect"
* const output: Array<unknown> = []
* const record = (value: unknown) => Effect.sync(() => { output.push(value) })
*
* let i = 1
* const expensiveTask = Effect.sync(() => {
*   void output.push("expensive task...")
*   return `result ${i++}`
* })
*
* const program = Effect.gen(function*() {
*   const cached = yield* Effect.cachedWithTTL(expensiveTask, "1 hour")
*   yield* cached.pipe(Effect.andThen(record))
*   yield* cached.pipe(Effect.andThen(record))
*   yield* cached.pipe(Effect.andThen(record))
* })
*
* Effect.runSync(program)
* output // => ["expensive task...", "result 1", "result 1", "result 1"]
* ```
*
* @see {@link cached} for a similar function that caches the result
* indefinitely.
* @see {@link cachedInvalidateWithTTL} for a similar function that includes an
* additional effect for manually invalidating the cached value.
* @category caching
* @since 2.0.0
*/
var cachedWithTTL = cachedWithTTL$1;
/**
* Creates a cached effect result for a specified duration and allows manual
* invalidation before expiration.
*
* **When to use**
*
* Use when an effect result should be cached for a bounded time and callers
* also need a manual invalidation effect to force recomputation before
* expiration.
*
* **Details**
*
* This function behaves similarly to {@link cachedWithTTL} by caching the
* result of an effect for a specified period of time. However, it introduces an
* additional feature: it provides an effect that allows you to manually
* invalidate the cached result before it naturally expires.
*
* This gives you more control over the cache, allowing you to refresh the
* result when needed, even if the original cache has not yet expired.
*
* Once the cache is invalidated, the next time the effect is evaluated, the
* result will be recomputed, and the cache will be refreshed.
*
* **Example** (Memoizing with TTL and invalidation)
*
* ```ts import.meta.vitest
* import { Effect } from "effect"
* const output: Array<unknown> = []
* const record = (value: unknown) => Effect.sync(() => { output.push(value) })
*
* let i = 1
* const expensiveTask = Effect.sync(() => {
*   void output.push("expensive task...")
*   return `result ${i++}`
* })
*
* const program = Effect.gen(function*() {
*   const [cached, invalidate] = yield* Effect.cachedInvalidateWithTTL(
*     expensiveTask,
*     "1 hour"
*   )
*   yield* cached.pipe(Effect.andThen(record))
*   yield* cached.pipe(Effect.andThen(record))
*   yield* invalidate
*   yield* cached.pipe(Effect.andThen(record))
* })
*
* Effect.runSync(program)
* output // => ["expensive task...", "result 1", "result 1", "expensive task...", "result 2"]
* ```
*
* @see {@link cached} for a similar function that caches the result
* indefinitely.
* @see {@link cachedWithTTL} for a similar function that caches the result for
* a specified duration but does not include an effect for manual invalidation.
* @category caching
* @since 2.0.0
*/
var cachedInvalidateWithTTL = cachedInvalidateWithTTL$1;
/**
* Returns an effect that is immediately interrupted.
*
* **Example** (Creating an interrupted effect)
*
* ```ts import.meta.vitest
* import { Effect } from "effect"
*
* const program = Effect.gen(function*() {
*   return yield* Effect.interrupt
*   yield* Effect.succeed("This won't execute and is unreachable")
* })
*
* Effect.runSyncExit(program)._tag // => "Failure"
* ```
*
* @category interruption
* @since 2.0.0
*/
var interrupt = interrupt$2;
/**
* Returns a new effect that allows the effect to be interruptible.
*
* **Example** (Allowing interruption)
*
* ```ts import.meta.vitest
* import { Effect, Option } from "effect"
*
* const program = Effect.interruptible(Effect.never).pipe(
*   Effect.timeoutOption(0)
* )
* await Effect.runPromise(program) // => Option.none()
* ```
*
* @category interruption
* @since 2.0.0
*/
var interruptible = interruptible$1;
/**
* Runs the specified finalizer effect if this effect is interrupted.
*
* **Example** (Running cleanup on interruption)
*
* ```ts import.meta.vitest
* import { Effect, Fiber } from "effect"
* const output: Array<unknown> = []
*
* const task = Effect.forever(Effect.succeed("working..."))
*
* const program = Effect.onInterrupt(
*   task,
*   () => Effect.sync(() => { output.push("Task was interrupted, cleaning up...") })
* )
*
* const fiber = Effect.runFork(program)
* await Effect.runPromise(Fiber.interrupt(fiber))
* output // => ["Task was interrupted, cleaning up..."]
* ```
*
* @category interruption
* @since 2.0.0
*/
var onInterrupt = onInterrupt$1;
/**
* Returns a new effect that disables interruption for the given effect.
*
* **Example** (Preventing interruption)
*
* ```ts import.meta.vitest
* import { Effect } from "effect"
* const output: Array<unknown> = []
*
* const criticalTask = Effect.gen(function*() {
*   yield* Effect.sync(() => { output.push("Starting critical section...") })
*   yield* Effect.sync(() => { output.push("Critical section completed") })
* })
*
* const program = Effect.uninterruptible(criticalTask)
*
* Effect.runSync(program)
* output // => ["Starting critical section...", "Critical section completed"]
* ```
*
* @category interruption
* @since 2.0.0
*/
var uninterruptible = uninterruptible$1;
/**
* Disables interruption and provides a restore function to restore the
* interruptible state within the effect.
*
* **Example** (Restoring interruption in protected regions)
*
* ```ts import.meta.vitest
* import { Effect } from "effect"
* const output: Array<unknown> = []
*
* const program = Effect.uninterruptibleMask((restore) =>
*   Effect.gen(function*() {
*     yield* Effect.sync(() => { output.push("Uninterruptible phase...") })
*     // Restore interruptibility for this part
*     yield* restore(
*       Effect.gen(function*() {
*         yield* Effect.sync(() => { output.push("Interruptible phase...") })
*       })
*     )
*
*     yield* Effect.sync(() => { output.push("Back to uninterruptible") })
*   })
* )
*
* Effect.runSync(program)
* output // => ["Uninterruptible phase...", "Interruptible phase...", "Back to uninterruptible"]
* ```
*
* @category interruption
* @since 2.0.0
*/
var uninterruptibleMask = uninterruptibleMask$1;
/**
* Runs an effect in an interruptible region while providing `restore` for
* locally restoring the previous interruptibility.
*
* **Example** (Controlling interruptibility locally)
*
* ```ts import.meta.vitest
* import { Effect } from "effect"
* const output: Array<unknown> = []
*
* const program = Effect.interruptibleMask((restore) =>
*   Effect.gen(function*() {
*     yield* Effect.sync(() => { output.push("Interruptible phase...") })
*     // Make this part uninterruptible
*     yield* restore(
*       Effect.gen(function*() {
*         yield* Effect.sync(() => { output.push("Uninterruptible phase...") })
*       })
*     )
*
*     yield* Effect.sync(() => { output.push("Back to interruptible") })
*   })
* )
*
* Effect.runSync(program)
* output // => ["Interruptible phase...", "Uninterruptible phase...", "Back to interruptible"]
* ```
*
* @category interruption
* @since 2.0.0
*/
var interruptibleMask = interruptibleMask$1;
/**
* Creates an AbortSignal that is managed by the provided scope.
*
* **When to use**
*
* Use to obtain a scope-managed `AbortSignal` for APIs that accept cancellation
* through a signal.
*
* **Details**
*
* Each acquisition creates a fresh `AbortController`. Closing the owning scope
* runs a finalizer that aborts the controller and the effect succeeds with the
* controller's signal.
*
* **Gotchas**
*
* The signal is aborted when its owning scope closes, so avoid keeping it for
* work that outlives that scope.
*
* @see {@link scoped} for binding resource lifetime to a scope
*
* @category interruption
* @since 4.0.0
*/
var abortSignal = abortSignal$1;
/**
* Repeats this effect forever (until the first error).
*
* **Example** (Repeating forever)
*
* ```ts import.meta.vitest
* import { Effect, Option } from "effect"
*
* const program = Effect.forever(Effect.never).pipe(Effect.timeoutOption(0))
* await Effect.runPromise(program) // => Option.none()
* ```
*
* @category repetition
* @since 2.0.0
*/
var forever = forever$2;
/**
* Repeats an effect based on a specified schedule or until the first failure.
*
* **When to use**
*
* Use to rerun an effect after successful executions.
*
* **Details**
*
* This function executes an effect repeatedly according to the given schedule.
* Each repetition occurs after the initial execution of the effect, meaning
* that the schedule determines the number of additional repetitions. For
* example, using `Schedule.once` will result in the effect being executed twice
* (once initially and once as part of the repetition).
*
* If the effect succeeds, it is repeated according to the schedule. If it
* fails, the repetition stops immediately, and the failure is returned.
*
* The schedule can also specify delays between repetitions, making it useful
* for tasks like retrying operations with backoff, periodic execution, or
* performing a series of dependent actions.
*
* You can combine schedules for more advanced repetition logic, such as adding
* delays, limiting recursions, or dynamically adjusting based on the outcome of
* each execution.
*
* **Gotchas**
*
* The source effect is always evaluated once before the schedule is stepped.
* The schedule controls additional repetitions, not the initial execution.
*
* **Example** (Repeating successful effects with a schedule)
*
* ```ts import.meta.vitest
* // Success Example
* import { Effect, Schedule } from "effect"
* const output: Array<unknown> = []
*
* const action = Effect.sync(() => { output.push("success") })
* const policy = Schedule.recurs(2)
* const program = Effect.repeat(action, policy)
*
* void output.push(Effect.runSync(program))
* output // => ["success", "success", "success", 2]
* ```
*
* **Example** (Stopping repetition on failure)
*
* ```ts import.meta.vitest
* // Failure Example
* import { Effect, Schedule } from "effect"
* const output: Array<unknown> = []
*
* let count = 0
*
* // Define a callback effect that simulates an action with possible failures
* const action = Effect.callback<string, string>((resume) => {
*   if (count > 1) {
*     void output.push("failure")
*     resume(Effect.fail("Uh oh!"))
*   } else {
*     count++
*     void output.push("success")
*     resume(Effect.succeed("yay!"))
*   }
* })
*
* const policy = Schedule.recurs(2)
* const program = Effect.repeat(action, policy)
*
* void output.push((await Effect.runPromiseExit(program))._tag)
* output // => ["success", "success", "failure", "Failure"]
* ```
*
* @see {@link retry} for failure-based repetition
* @see {@link repeatOrElse} for fallback handling when repetition fails
*
* @category repetition
* @since 2.0.0
*/
var repeat = repeat$1;
/**
* Repeats an effect according to a schedule and runs a fallback effect if
* repetition fails before the schedule completes.
*
* **When to use**
*
* Use when successful repetitions should follow a schedule, but failures from
* the repeated effect or schedule need an effectful fallback.
*
* **Details**
*
* If the repeated effect or schedule step fails, `orElse` receives the failure
* and the latest schedule metadata when at least one schedule step has run;
* otherwise it receives `None`. If the schedule completes normally, the
* returned effect succeeds with the schedule's output.
*
* **Example** (Recovering after repetition stops)
*
* ```ts import.meta.vitest
* import { Effect, Option, Schedule } from "effect"
* const output: Array<unknown> = []
*
* let attempt = 0
* const task = Effect.gen(function*() {
*   attempt++
*   if (attempt <= 2) {
*     yield* Effect.sync(() => { output.push(`Attempt ${attempt} failed`) })
*     return yield* Effect.fail(`Error ${attempt}`)
*   }
*   yield* Effect.sync(() => { output.push(`Attempt ${attempt} succeeded`) })
*   return "success"
* })
*
* const program = Effect.repeatOrElse(
*   task,
*   Schedule.recurs(3),
*   (error, attempts) =>
*     Effect.sync(() => { output.push(
*       `Final failure: ${error}, after ${
*         Option.getOrElse(attempts, () => 0)
*       } attempts`
*     ) }).pipe(Effect.map(() => 0))
* )
*
* void output.push(Effect.runSync(program))
* output // => ["Attempt 1 failed", "Final failure: Error 1, after 0 attempts", 0]
* ```
*
* @category repetition
* @since 2.0.0
*/
var repeatOrElse = repeatOrElse$1;
/**
* Returns an array of `n` identical effects.
*
* **When to use**
*
* Use when you need an array of identical effect values without running them
* yet.
*
* **Details**
*
* This only creates the array of effects. It does not run or collect them.
*
* @see {@link all} for running the returned effects and collecting results
* @see {@link replicateEffect} for repeating an effect and collecting results in one step with concurrency and discard options
*
* @category repetition
* @since 2.0.0
*/
var replicate = replicate$1;
/**
* Performs this effect `n` times and collects results with `Effect.all` semantics.
*
* **When to use**
*
* Use when you want to run the repeated effects immediately, with optional
* concurrency control or result discarding.
*
* **Details**
*
* Use `concurrency` to control parallelism and `discard: true` to ignore results.
*
* **Example** (Replicating an effect)
*
* ```ts import.meta.vitest
* import { Effect } from "effect"
* const output: Array<unknown> = []
*
* const program = Effect.gen(function*() {
*   const results = yield* Effect.replicateEffect(3)(Effect.succeed(1))
*   yield* Effect.sync(() => { output.push(results) })
* })
*
* Effect.runSync(program)
* output // => [[1, 1, 1]]
* ```
*
* @category repetition
* @since 2.0.0
*/
var replicateEffect = replicateEffect$1;
/**
* Runs an effect repeatedly according to a schedule and returns the schedule's
* final output.
*
* **When to use**
*
* Use to rerun a successful effect according to a `Schedule` when the schedule
* does not need a custom initial input.
*
* **Details**
*
* The schedule is first stepped with `undefined`. After each successful
* execution, the effect's success value is fed to the schedule to decide
* whether to run again. The returned effect fails if the effect or schedule
* fails, and otherwise succeeds with the schedule output when the schedule
* completes.
*
* **Example** (Scheduling repeated execution)
*
* ```ts import.meta.vitest
* import { Effect, Schedule } from "effect"
* const output: Array<unknown> = []
*
* const task = Effect.gen(function*() {
*   yield* Effect.sync(() => { output.push("Task executing...") })
*   return 1
* })
*
* const program = Effect.schedule(task, Schedule.recurs(2))
*
* void output.push(Effect.runSync(program))
* output // => ["Task executing...", "Task executing...", 2]
* ```
*
* @see {@link scheduleFrom} for a variant that allows the schedule's decision
* to depend on the result of this effect.
*
* @category repetition
* @since 2.0.0
*/
var schedule = /*#__PURE__*/ dual(2, (self, schedule) => scheduleFrom(self, void 0, schedule));
/**
* Runs an effect repeatedly according to a schedule that is initialized with a
* specific schedule input.
*
* **Details**
*
* `initial` is passed to the schedule before the first execution, not to the
* effect itself. After each successful execution, the effect's success value is
* fed back into the schedule to decide whether to continue. The returned effect
* succeeds with the schedule output when the schedule completes and fails if
* the effect or schedule fails.
*
* **Example** (Scheduling from an initial value)
*
* ```ts import.meta.vitest
* import { Effect, Schedule } from "effect"
* const output: Array<unknown> = []
*
* const task = (input: number) =>
*   Effect.gen(function*() {
*     yield* Effect.sync(() => { output.push(`Processing: ${input}`) })
*     return input + 1
*   })
*
* // Start with 0, repeat 3 times
* const program = Effect.scheduleFrom(
*   task(0),
*   0,
*   Schedule.recurs(2)
* )
*
* void output.push(Effect.runSync(program))
* output // => ["Processing: 0", "Processing: 0", 2]
* ```
*
* @category repetition
* @since 2.0.0
*/
var scheduleFrom = scheduleFrom$1;
/**
* Returns the current tracer from the context.
*
* **Example** (Accessing the current tracer)
*
* ```ts import.meta.vitest
* import { Effect } from "effect"
*
* const program = Effect.gen(function*() {
*   const currentTracer = yield* Effect.tracer
*   return typeof currentTracer.span
* })
*
* Effect.runSync(program) // => "function"
* ```
*
* @category tracing
* @since 2.0.0
*/
var tracer = tracer$1;
/**
* Provides a tracer to an effect.
*
* **Example** (Providing a tracer)
*
* ```ts import.meta.vitest
* import { Effect } from "effect"
*
* const program = Effect.gen(function*() {
*   const tracer = yield* Effect.tracer
*   return yield* Effect.withTracer(Effect.succeed("completed"), tracer)
* })
*
* Effect.runSync(program) // => "completed"
* ```
*
* @category tracing
* @since 2.0.0
*/
var withTracer = withTracer$1;
/**
* Enables or disables tracing for spans created by the given effect.
*
* **Details**
*
* When `enabled` is `false`, spans created inside the effect are not registered
* with the current tracer and do not propagate as normal trace parents.
*
* **Example** (Enabling or disabling tracing)
*
* ```ts import.meta.vitest
* import { Effect } from "effect"
*
* const program = Effect.succeed(42).pipe(
*   Effect.withSpan("my-span"),
*   // the span will not be registered with the tracer
*   Effect.withTracerEnabled(false)
* )
* Effect.runSync(program) // => 42
* ```
*
* @category tracing
* @since 2.0.0
*/
var withTracerEnabled = withTracerEnabled$1;
/**
* Enables or disables tracer timing for the given Effect.
*
* **Example** (Enabling or disabling tracing timing)
*
* ```ts import.meta.vitest
* import { Effect } from "effect"
*
* const program = Effect.succeed(42).pipe(
*   Effect.withSpan("my-span"),
*   // the span will not have timing information
*   Effect.withTracerTiming(false)
* )
* Effect.runSync(program) // => 42
* ```
*
* @category tracing
* @since 2.0.0
*/
var withTracerTiming = withTracerTiming$1;
/**
* Adds an annotation to each span in this effect.
*
* **Example** (Annotating all spans)
*
* ```ts import.meta.vitest
* import { Effect } from "effect"
*
* const program = Effect.succeed("result")
*
* // Add single annotation
* const annotated1 = Effect.annotateSpans(program, "user", "john")
*
* // Add multiple annotations
* const annotated2 = Effect.annotateSpans(program, {
*   operation: "data-processing",
*   version: "1.0.0",
*   environment: "production"
* })
*
* Effect.runSync(Effect.all([annotated1, annotated2])) // => ['result', 'result']
* ```
*
* @category tracing
* @since 2.0.0
*/
var annotateSpans = annotateSpans$1;
/**
* Adds an annotation to the current span if available.
*
* **Example** (Annotating the current span)
*
* ```ts import.meta.vitest
* import { Effect } from "effect"
*
* const program = Effect.gen(function*() {
*   yield* Effect.annotateCurrentSpan("userId", "123")
*   yield* Effect.annotateCurrentSpan({
*     operation: "user-lookup"
*   })
*   return "success"
* })
*
* const traced = Effect.withSpan(program, "user-operation")
* Effect.runSync(traced) // => "success"
* ```
*
* @category tracing
* @since 2.0.0
*/
var annotateCurrentSpan = annotateCurrentSpan$1;
/**
* Returns the currently active local tracing span.
*
* **Details**
*
* The effect fails with `NoSuchElementError` when there is no active local
* `Span`.
*
* **Example** (Reading the current span)
*
* ```ts import.meta.vitest
* import { Effect } from "effect"
*
* const program = Effect.gen(function*() {
*   const span = yield* Effect.currentSpan
*   return span.name
* })
*
* const traced = Effect.withSpan(program, "my-span")
* Effect.runSync(traced) // => "my-span"
* ```
*
* @category tracing
* @since 2.0.0
*/
var currentSpan = currentSpan$1;
/**
* Returns the current parent span from the effect context.
*
* **Details**
*
* The effect succeeds with either a local span or external span when one is
* present, and fails with `NoSuchElementError` when no parent span is
* available.
*
* **Example** (Reading the parent span)
*
* ```ts import.meta.vitest
* import { Effect } from "effect"
*
* const childOperation = Effect.gen(function*() {
*   const parentSpan = yield* Effect.currentParentSpan
*   return parentSpan._tag
* })
*
* const program = Effect.withSpan(childOperation, "child-span")
*
* const traced = Effect.withSpan(program, "parent-span")
* Effect.runSync(traced) // => "Span"
* ```
*
* @category tracing
* @since 2.0.0
*/
var currentParentSpan = currentParentSpan$1;
/**
* Returns the tracing span annotations currently carried in the effect context.
*
* **Details**
*
* These annotations are applied to spans created inside the context, such as
* spans created by `withSpan`, `useSpan`, or `makeSpan`.
*
* **Example** (Providing span annotations)
*
* ```ts import.meta.vitest
* import { Effect } from "effect"
*
* const program = Effect.gen(function*() {
*   const annotations = yield* Effect.spanAnnotations
*   return annotations
* }).pipe(Effect.annotateSpans({ userId: "123", operation: "data-processing" }))
*
* Effect.runSync(program) // => { userId: '123', operation: 'data-processing' }
* ```
*
* @category tracing
* @since 2.0.0
*/
var spanAnnotations = spanAnnotations$1;
/**
* Returns the tracing span links currently carried in the effect context.
*
* **Details**
*
* These links are attached to spans created inside the context. Span links
* connect related spans without making one span the parent of another.
*
* **Example** (Providing span links)
*
* ```ts import.meta.vitest
* import { Effect } from "effect"
*
* const program = Effect.gen(function*() {
*   // Get the current span links
*   const links = yield* Effect.spanLinks
*   return links
* })
*
* Effect.runSync(program).length // => 0
* ```
*
* @category tracing
* @since 2.0.0
*/
var spanLinks = spanLinks$1;
/**
* Adds a link with the provided span to all spans in this effect.
*
* **Details**
*
* This is useful for connecting spans that are related but not in a direct
* parent-child relationship. For example, you might want to link spans from
* parallel operations or connect spans across different traces.
*
* **Example** (Linking one span to another span)
*
* ```ts import.meta.vitest
* import { Effect } from "effect"
*
* const program = Effect.withSpan(Effect.gen(function*() {
*   const parentSpan = yield* Effect.currentSpan
*   return yield* Effect.spanLinks.pipe(
*     Effect.linkSpans(parentSpan, { relationship: "follows" })
*   )
* }), "parent-operation")
*
* Effect.runSync(program).length // => 1
* ```
*
* **Example** (Linking multiple spans at once)
*
* ```ts import.meta.vitest
* import { Effect } from "effect"
*
* const program = Effect.gen(function*() {
*   const span1 = yield* Effect.makeSpan("span-1")
*   const span2 = yield* Effect.makeSpan("span-2")
*
*   return yield* Effect.spanLinks.pipe(
*     Effect.linkSpans([span1, span2], {
*       type: "dependency",
*       source: "multiple-operations"
*     })
*   )
* })
*
* Effect.runSync(program).length // => 2
* ```
*
* @category tracing
* @since 2.0.0
*/
var linkSpans = linkSpans$1;
/**
* Creates a new tracing span and returns it without managing its lifetime.
*
* **Details**
*
* The span is not added to the current span stack and is not ended
* automatically. Use `withSpan`, `useSpan`, or `makeSpanScoped` when the span
* should be installed as context or closed automatically.
*
* **Example** (Creating a span manually)
*
* ```ts import.meta.vitest
* import { Effect } from "effect"
*
* const program = Effect.gen(function*() {
*   const span = yield* Effect.makeSpan("my-operation")
*   return span.name
* })
*
* Effect.runSync(program) // => "my-operation"
* ```
*
* @category tracing
* @since 2.0.0
*/
var makeSpan = makeSpan$1;
/**
* Create a new span for tracing, and automatically close it when the Scope
* finalizes.
*
* **Details**
*
* The span is not added to the current span stack, so no child spans will be
* created for it.
*
* **Example** (Creating a scoped standalone span)
*
* ```ts import.meta.vitest
* import { Effect } from "effect"
*
* const program = Effect.scoped(
*   Effect.gen(function*() {
*     const span = yield* Effect.makeSpanScoped("scoped-operation")
*     return span.name
*     // Span automatically closes when scope ends
*   })
* )
*
* Effect.runSync(program) // => "scoped-operation"
* ```
*
* @category tracing
* @since 2.0.0
*/
var makeSpanScoped = makeSpanScoped$1;
/**
* Create a new span for tracing, and automatically close it when the effect
* completes.
*
* **Details**
*
* The span is not added to the current span stack, so no child spans will be
* created for it.
*
* **Example** (Running an effect with a standalone span)
*
* ```ts import.meta.vitest
* import { Effect } from "effect"
*
* const program = Effect.useSpan(
*   "user-operation",
*   (span) => Effect.succeed(`${span.name}: success`)
* )
* Effect.runSync(program) // => "user-operation: success"
* ```
*
* @category tracing
* @since 2.0.0
*/
var useSpan = useSpan$1;
/**
* Wraps the effect with a child span for tracing.
*
* **Example** (Wrapping an effect in a child span)
*
* ```ts import.meta.vitest
* import { Effect } from "effect"
*
* const task = Effect.succeed("result")
*
* const traced = Effect.withSpan(task, "my-task", {
*   attributes: { version: "1.0" }
* })
* Effect.runSync(traced) // => "result"
* ```
*
* @category tracing
* @since 2.0.0
*/
var withSpan = withSpan$1;
/**
* Wraps the effect with a scoped child span for tracing.
*
* **Details**
*
* The span is ended when the Scope is finalized.
*
* **Example** (Creating a scoped child span)
*
* ```ts import.meta.vitest
* import { Effect } from "effect"
*
* const program = Effect.scoped(
*   Effect.gen(function*() {
*     const task = Effect.succeed("working")
*     yield* Effect.withSpanScoped(task, "scoped-task")
*     return "completed"
*   })
* )
* Effect.runSync(program) // => "completed"
* ```
*
* @category tracing
* @since 2.0.0
*/
var withSpanScoped = withSpanScoped$1;
/**
* Adds the provided span to the current span stack.
*
* **Example** (Setting a parent span)
*
* ```ts import.meta.vitest
* import { Effect } from "effect"
*
* const program = Effect.gen(function*() {
*   const span = yield* Effect.makeSpan("parent-span")
*   const childTask = Effect.succeed("child operation")
*   yield* Effect.withParentSpan(childTask, span)
*   return "completed"
* })
* Effect.runSync(program) // => "completed"
* ```
*
* @category tracing
* @since 2.0.0
*/
var withParentSpan = withParentSpan$1;
/**
* Executes a request using the provided resolver.
*
* **When to use**
*
* Use when you need resolver-driven batching for a typed `Request`.
*
* **Example** (Executing a request through a resolver)
*
* ```ts import.meta.vitest
* import { Effect, Exit, Request, RequestResolver } from "effect"
* const output: Array<unknown> = []
*
* interface GetUser extends Request.Request<string> {
*   readonly _tag: "GetUser"
*   readonly id: number
* }
* const GetUser = Request.tagged<GetUser>("GetUser")
*
* const resolver = RequestResolver.make<GetUser>(
*   Effect.fnUntraced(function*(entries) {
*     for (const entry of entries) {
*       yield* Request.complete(entry, Exit.succeed(`user-${entry.request.id}`))
*     }
*   })
* )
*
* const program = Effect.gen(function*() {
*   const name = yield* Effect.request(GetUser({ id: 1 }), resolver)
*   yield* Effect.sync(() => { output.push(name) })
* })
*
* await Effect.runPromise(program)
* output // => ["user-1"]
* ```
*
* @see {@link requestUnsafe} for the low-level entry point when you already have a `Context` and need to enqueue outside an `Effect`
*
* @category running
* @since 2.0.0
*/
var request = request$1;
/**
* Registers a request with a resolver and delivers the exit value via `onExit`.
*
* **When to use**
*
* Use when you already have a `Context` and need to enqueue a request outside
* an `Effect` while receiving completion through `onExit`.
*
* **Details**
*
* It returns a canceler that removes the pending request entry.
*
* @see {@link request} for the `Effect`-returning API used for normal request execution
*
* @category unsafe
* @since 4.0.0
*/
var requestUnsafe = requestUnsafe$1;
/**
* Returns an effect that forks this effect into its own separate fiber,
* returning the fiber immediately, without waiting for it to begin executing
* the effect.
*
* **Details**
*
* You can use the `forkChild` method whenever you want to execute an effect in a
* new fiber, concurrently and without "blocking" the fiber executing other
* effects. Using fibers can be tricky, so instead of using this method
* directly, consider other higher-level methods, such as `raceWith`,
* `zipPar`, and so forth.
*
* The fiber returned by this method has methods to interrupt the fiber and to
* wait for it to finish executing the effect. See `Fiber` for more
* information.
*
* Whenever you use this method to launch a new fiber, the new fiber is
* attached to the parent fiber's scope. This means when the parent fiber
* terminates, the child fiber will be terminated as well, ensuring that no
* fibers leak. This behavior is called "auto supervision", and if this
* behavior is not desired, you may use the `forkDetach` or `forkIn` methods.
*
* **Example** (Forking a child fiber)
*
* ```ts import.meta.vitest
* import { Effect, Fiber } from "effect"
*
* const task = Effect.succeed("result")
*
* const program = Effect.gen(function*() {
*   const fiber = yield* task.pipe(Effect.forkChild)
*   const result = yield* Fiber.join(fiber)
*   return result
* })
*
* await Effect.runPromise(program) // => "result"
* ```
*
* @category forking
* @since 4.0.0
*/
var forkChild = forkChild$1;
/**
* Forks the effect in the specified scope. The fiber will be interrupted
* when the scope is closed.
*
* **Example** (Forking into a supplied scope)
*
* ```ts import.meta.vitest
* import { Effect } from "effect"
*
* const task = Effect.never
*
* const program = Effect.scoped(
*   Effect.gen(function*() {
*     const scope = yield* Effect.scope
*     const fiber = yield* Effect.forkIn(task, scope)
*     // Fiber will be interrupted when scope closes
*     return "done"
*   })
* )
*
* await Effect.runPromise(program) // => "done"
* ```
*
* @category forking
* @since 2.0.0
*/
var forkIn = forkIn$1;
/**
* Forks the fiber in a `Scope`, interrupting it when the scope is closed.
*
* **Example** (Forking into the current scope)
*
* ```ts import.meta.vitest
* import { Effect } from "effect"
*
* const backgroundTask = Effect.never
*
* const program = Effect.scoped(
*   Effect.gen(function*() {
*     yield* backgroundTask.pipe(Effect.forkScoped)
*
*     // Fiber will be interrupted when scope closes
*     return "scope completed"
*   })
* )
*
* await Effect.runPromise(program) // => "scope completed"
* ```
*
* @category forking
* @since 2.0.0
*/
var forkScoped = forkScoped$1;
/**
* Forks the effect into a new fiber attached to the global scope. Because the
* new fiber is attached to the global scope, when the fiber executing the
* returned effect terminates, the forked fiber will continue running.
*
* **Example** (Forking a detached fiber)
*
* ```ts import.meta.vitest
* import { Effect, Fiber } from "effect"
*
* const daemonTask = Effect.succeed("daemon result")
*
* const program = Effect.gen(function*() {
*   const fiber = yield* daemonTask.pipe(Effect.forkDetach)
*   return yield* Fiber.join(fiber)
* })
*
* await Effect.runPromise(program) // => "daemon result"
* ```
*
* @category forking
* @since 4.0.0
*/
var forkDetach = forkDetach$1;
/**
* Waits for all child fibers forked by this effect to complete before this
* effect completes.
*
* **When to use**
*
* Use to let an effect start child work concurrently while still delaying its
* own completion until that child work is done.
*
* **Gotchas**
*
* Child fibers that already exist before the wrapped effect starts are not
* awaited.
*
* @see {@link forkChild} for forking child fibers that are awaited by this operator
* @see {@link forkDetach} for forking fibers outside the child scope
* @see {@link forkIn} for forking into an explicit scope
* @see {@link forkScoped} for forking fibers tied to the current scope
*
* @category sequencing
* @since 2.0.0
*/
var awaitAllChildren = awaitAllChildren$1;
/**
* Accesses the fiber currently executing the effect.
*
* **Example** (Accessing the current fiber)
*
* ```ts import.meta.vitest
* import { Effect } from "effect"
* const output: Array<unknown> = []
*
* const program = Effect.gen(function*() {
*   const fiber = yield* Effect.fiber
*   yield* Effect.sync(() => { output.push(typeof fiber.id) })
* })
*
* Effect.runSync(program)
* output // => ["number"]
* ```
*
* @category accessors
* @since 4.0.0
*/
var fiber = fiber$1;
/**
* Accesses the current fiber id executing the effect.
*
* **Example** (Accessing the current fiber id)
*
* ```ts import.meta.vitest
* import { Effect } from "effect"
*
* const program = Effect.fiberId.pipe(Effect.map((id) => typeof id))
* Effect.runSync(program) // => "number"
* ```
*
* @category accessors
* @since 2.0.0
*/
var fiberId = fiberId$1;
/**
* Runs an effect in the background, returning a fiber that can
* be observed or interrupted.
*
* **When to use**
*
* Use when you need to start an effect in the background and receive a fiber.
*
* **Example** (Running an effect in the background)
*
* ```ts import.meta.vitest
* import { Effect, Fiber } from "effect"
* const output: Array<unknown> = []
*
* //      ┌─── Effect<number, never, never>
* //      ▼
* const program = Effect.sync(() => { output.push("running...") }).pipe(Effect.as("done"))
*
* //      ┌─── RuntimeFiber<number, never>
* //      ▼
* const fiber = Effect.runFork(program)
*
* void output.push(await Effect.runPromise(Fiber.join(fiber)))
* output // => ["running...", "done"]
* ```
*
* @category running
* @since 2.0.0
*/
var runFork = runFork$1;
/**
* Runs an effect in the background with the provided services.
*
* **When to use**
*
* Use when an effect still requires services, you already have a `Context`, and
* you want a background fiber.
*
* **Example** (Running with services in the background)
*
* ```ts import.meta.vitest
* import { Context, Effect, Fiber } from "effect"
* const output: Array<unknown> = []
*
* interface Logger {
*   log: (message: string) => void
* }
*
* const Logger = Context.Service<Logger>("Logger")
*
* const services = Context.make(Logger, {
*   log: (message) => void output.push(message)
* })
*
* const program = Effect.gen(function*() {
*   const logger = yield* Logger
*   logger.log("Hello from service!")
*   return "done"
* })
*
* const fiber = Effect.runForkWith(services)(program)
* void output.push(await Effect.runPromise(Fiber.join(fiber)))
* output // => ["Hello from service!", "done"]
* ```
*
* @category running
* @since 4.0.0
*/
var runForkWith = runForkWith$1;
/**
* Forks an effect with the provided services, registers `onExit` as a fiber observer, and returns an interruptor.
*
* **When to use**
*
* Use when embedding an effect into callback-style code with explicit services
* and a synchronous interruptor.
*
* **Details**
*
* The returned interruptor calls `fiber.interruptUnsafe`, optionally with an interruptor id.
*
* **Example** (Running with services and a callback)
*
* ```ts import.meta.vitest
* import { Context, Effect } from "effect"
* const output: Array<unknown> = []
*
* interface Logger {
*   log: (message: string) => Effect.Effect<void>
* }
*
* const Logger = Context.Service<Logger>("Logger")
*
* const services = Context.make(Logger, {
*   log: (message) => Effect.sync(() => { output.push(message) })
* })
*
* const program = Effect.gen(function*() {
*   const logger = yield* Logger
*   yield* logger.log("Started")
*   return "done"
* })
*
* await new Promise<void>((resolve) => {
*   Effect.runCallbackWith(services)(program, {
*     onExit: (exit) => {
*       void output.push(exit._tag)
*       resolve()
*     }
*   })
* })
* output // => ["Started", "Success"]
* ```
*
* @category running
* @since 4.0.0
*/
var runCallbackWith = runCallbackWith$1;
/**
* Runs an effect asynchronously, registering `onExit` as a fiber observer and
* returning an interruptor.
*
* **Details**
*
* The interruptor calls `fiber.interruptUnsafe` with the optional interruptor
* id.
*
* **Example** (Running with a callback)
*
* ```ts import.meta.vitest
* import { Effect, Exit } from "effect"
* const output: Array<unknown> = []
*
* const program = Effect.gen(function*() {
*   yield* Effect.sync(() => { output.push("working") })
*   return "done"
* })
*
* await new Promise<void>((resolve) => {
*   Effect.runCallback(program, {
*     onExit: (exit) => {
*       Effect.runSync(
*         Exit.match(exit, {
*           onFailure: () => Effect.sync(() => { output.push("failed") }),
*           onSuccess: (value) => Effect.sync(() => { output.push(`success: ${value}`) })
*         })
*       )
*       resolve()
*     }
*   })
* })
*
* output // => ["working", "success: done"]
* ```
*
* @category running
* @since 2.0.0
*/
var runCallback = runCallback$1;
/**
* Executes an effect and returns the result as a `Promise`.
*
* **When to use**
*
* Use when you need to execute an effect and work with the
* result using `Promise` syntax, typically for compatibility with other
* promise-based code.
*
* If the effect succeeds, the promise will resolve with the result. If the
* effect fails, the promise will reject with an error.
*
* **Example** (Running a successful effect as a Promise)
*
* ```ts import.meta.vitest
* import { Effect } from "effect"
*
* await Effect.runPromise(Effect.succeed(1)) // => 1
* ```
*
* **Example** (Running effects as promises)
*
* ```ts import.meta.vitest
* //Example: Handling a Failing Effect as a Rejected Promise
* import { Effect } from "effect"
* const output: Array<unknown> = []
*
* await Effect.runPromise(Effect.fail("my error")).catch(() => {
*   void output.push("rejected")
* })
* output // => ["rejected"]
* ```
*
* @see {@link runPromiseExit} for a version that returns an `Exit` type instead of rejecting.
* @category running
* @since 2.0.0
*/
var runPromise = runPromise$1;
/**
* Executes an effect as a Promise with the provided services.
*
* **When to use**
*
* Use when you already have a `Context` and need Promise interop that rejects on
* effect failure.
*
* **Example** (Running with services as a promise)
*
* ```ts import.meta.vitest
* import { Context, Effect } from "effect"
*
* interface Config {
*   apiUrl: string
* }
*
* const Config = Context.Service<Config>("Config")
*
* const context = Context.make(Config, {
*   apiUrl: "https://api.example.com"
* })
*
* const program = Effect.gen(function*() {
*   const config = yield* Config
*   return `Connecting to ${config.apiUrl}`
* })
*
* await Effect.runPromiseWith(context)(program) // => "Connecting to https://api.example.com"
* ```
*
* @category running
* @since 4.0.0
*/
var runPromiseWith = runPromiseWith$1;
/**
* Runs an effect and returns a `Promise` that resolves to an `Exit`, which
* represents the outcome (success or failure) of the effect.
*
* **When to use**
*
* Use when you need to determine if an effect succeeded
* or failed, including any defects, and you want to work with a `Promise`.
*
* **Details**
*
* The `Exit` type represents the result of the effect. Successful effects are
* wrapped in `Success`, and failed effects are wrapped in `Failure` with a
* `Cause`.
*
* **Example** (Observing promise results as Exit)
*
* ```ts import.meta.vitest
* import { Effect, Exit } from "effect"
*
* // Execute a successful effect and get the Exit result as a Promise
* await Effect.runPromiseExit(Effect.succeed(1)) // => Exit.succeed(1)
*
* // Execute a failing effect and get the Exit result as a Promise
* await Effect.runPromiseExit(Effect.fail("my error")) // => Exit.fail("my error")
* ```
*
* @see {@link runPromise} for a version that rejects on failure.
*
* @category running
* @since 2.0.0
*/
var runPromiseExit = runPromiseExit$1;
/**
* Runs an effect and returns a Promise of Exit with provided services.
*
* **When to use**
*
* Use when you already have a `Context` and need Promise interop that preserves
* success and failure as an `Exit`.
*
* **Example** (Running with services as an Exit promise)
*
* ```ts import.meta.vitest
* import { Context, Effect, Exit } from "effect"
* const output: Array<unknown> = []
*
* interface Database {
*   query: (sql: string) => string
* }
*
* const Database = Context.Service<Database>("Database")
*
* const services = Context.make(Database, {
*   query: (sql) => `Result for: ${sql}`
* })
*
* const program = Effect.gen(function*() {
*   const db = yield* Database
*   return db.query("SELECT * FROM users")
* })
*
* const exit = await Effect.runPromiseExitWith(services)(program)
* if (Exit.isSuccess(exit)) {
*   void output.push(`Success: ${exit.value}`)
* }
* output // => ["Success: Result for: SELECT * FROM users"]
* ```
*
* @category running
* @since 4.0.0
*/
var runPromiseExitWith = runPromiseExitWith$1;
/**
* Executes an effect synchronously and returns its success value.
*
* **When to use**
*
* Use when you need to execute an effect that is guaranteed to complete
* synchronously.
*
* **Details**
*
* If the effect fails, dies, is interrupted, or performs asynchronous work,
* `runSync` throws a `FiberFailure` instead of returning a value. Use
* `runSyncExit` when you want the failure captured as an `Exit`.
*
* **Example** (Running a synchronous effect)
*
* ```ts import.meta.vitest
* import { Effect } from "effect"
* const output: Array<unknown> = []
*
* const program = Effect.sync(() => {
*   void output.push("Hello, World!")
*   return 1
* })
*
* const result = Effect.runSync(program)
* void output.push(result)
* output // => ["Hello, World!", 1]
* ```
*
* **Example** (Throwing for failed or async effects)
*
* ```ts import.meta.vitest
* import { Effect } from "effect"
* const output: Array<unknown> = []
*
* try {
*   // Attempt to run an effect that fails
*   Effect.runSync(Effect.fail("my error"))
* } catch (e) {
*   void output.push("failed effect")
* }
* try {
*   // Attempt to run an effect that involves async work
*   Effect.runSync(Effect.promise(() => Promise.resolve(1)))
* } catch (e) {
*   void output.push("async effect")
* }
* output // => ["failed effect", "async effect"]
* ```
*
* @see {@link runSyncExit} for a version that returns an `Exit` type instead of
* throwing an error.
* @category running
* @since 2.0.0
*/
var runSync = runSync$1;
/**
* Executes an effect synchronously with provided services.
*
* **When to use**
*
* Use when you already have a `Context`, the effect is known to complete
* synchronously, and failures should throw.
*
* **Example** (Running synchronously with services)
*
* ```ts import.meta.vitest
* import { Context, Effect } from "effect"
*
* interface MathService {
*   add: (a: number, b: number) => number
* }
*
* const MathService = Context.Service<MathService>("MathService")
*
* const context = Context.make(MathService, {
*   add: (a, b) => a + b
* })
*
* const program = Effect.gen(function*() {
*   const math = yield* MathService
*   return math.add(2, 3)
* })
*
* const result = Effect.runSyncWith(context)(program)
* result // => 5
* ```
*
* @category running
* @since 4.0.0
*/
var runSyncWith = runSyncWith$1;
/**
* Runs an effect synchronously and captures the outcome safely as an `Exit` type, which
* represents the outcome (success or failure) of the effect.
*
* **When to use**
*
* Use to find out whether an effect succeeded or failed,
* including any defects, without dealing with asynchronous operations.
*
* **Details**
*
* The `Exit` type represents the result of the effect. Successful effects are
* wrapped in `Success`, and failed effects are wrapped in `Failure` with a
* `Cause`.
*
* If the effect contains asynchronous operations, `runSyncExit` will
* return an `Failure` with a `Die` cause, indicating that the effect cannot be
* resolved synchronously.
*
* **Example** (Observing synchronous results as Exit)
*
* ```ts import.meta.vitest
* import { Effect, Exit } from "effect"
*
* Effect.runSyncExit(Effect.succeed(1)) // => Exit.succeed(1)
*
* Effect.runSyncExit(Effect.fail("my error")) // => Exit.fail("my error")
* ```
*
* **Example** (Capturing async work as a Die cause)
*
* ```ts import.meta.vitest
* import { Cause, Effect, Exit } from "effect"
*
* const exit = Effect.runSyncExit(Effect.promise(() => Promise.resolve(1)))
* const isAsyncDie = Exit.hasDies(exit) && exit.cause.reasons.some(
*   (reason) => Cause.isDieReason(reason) && Cause.isAsyncFiberError(reason.defect)
* )
*
* isAsyncDie // => true
* ```
*
* @see {@link runSync} for a version that throws on failure.
*
* @category running
* @since 2.0.0
*/
var runSyncExit = runSyncExit$1;
/**
* Runs an effect synchronously with provided services, returning an Exit result safely.
*
* **When to use**
*
* Use when you already have a `Context` and need a synchronous `Exit` instead of
* throwing on failure.
*
* **Example** (Running synchronously with services as Exit)
*
* ```ts import.meta.vitest
* import { Context, Effect, Exit } from "effect"
* const output: Array<unknown> = []
*
* // Define a logger service
* const Logger = Context.Service<{
*   log: (msg: string) => void
* }>("Logger")
*
* const program = Effect.gen(function*() {
*   const logger = yield* Effect.service(Logger)
*   logger.log("Computing result...")
*   return 42
* })
*
* // Prepare context
* const context = Context.make(Logger, {
*   log: (msg) => void output.push(`[LOG] ${msg}`)
* })
*
* const exit = Effect.runSyncExitWith(context)(program)
*
* if (Exit.isSuccess(exit)) {
*   void output.push(`Success: ${exit.value}`)
* } else {
*   void output.push(`Failure: ${exit.cause}`)
* }
* output // => ["[LOG] Computing result...", "Success: 42"]
* ```
*
* @category running
* @since 4.0.0
*/
var runSyncExitWith = runSyncExitWith$1;
/**
* Creates an Effect-returning function without tracing.
*
* **When to use**
*
* Use when you are defining a reusable Effect function whose implementation
* would otherwise be a normal function returning {@link gen}, especially when
* tracing spans or stack-frame capture are not needed.
*
* **Details**
*
* Compared to a plain function that returns {@link gen}, `Effect.fnUntraced`
* reuses the generator body instead of allocating a fresh generator closure
* around the arguments on every call. It does not record an Effect stack-frame
* boundary and does not create tracing spans. Use {@link fn} when you need
* those stack frames or spans. Additional arguments after the generator body
* act like `pipe` transforms: each transform receives the previous result and
* the original function arguments. Annotate the generator return type with
* `Effect.fn.Return<A, E, R>` when the produced `Effect` type needs to be
* stated explicitly.
*
* **Example** (Defining untraced effect functions)
*
* ```ts import.meta.vitest
* import { Effect } from "effect"
*
* const f = Effect.fnUntraced(function*(
*   value: string
* ) {
*   return yield* Effect.succeed(value.length)
* })
*
* //      ┌─── Effect.Effect<number>
* //      ▼
* const program = f("hello")
* Effect.runSync(program) // => 5
* ```
*
* **Example** (Transforming the returned Effect)
*
* ```ts import.meta.vitest
* import { Effect } from "effect"
*
* const f = Effect.fnUntraced(
*   function*(value: string) {
*     return yield* Effect.succeed(value.length)
*   },
*   (effect, value) =>
*     effect.pipe(Effect.map((length) => `${value}: ${length}`))
* )
*
* //      ┌─── Effect.Effect<string>
* //      ▼
* const program = f("hello")
* Effect.runSync(program) // => "hello: 5"
* ```
*
* **Example** (Annotating an untraced non-parametric function)
*
* ```ts import.meta.vitest
* import { Effect } from "effect"
*
* const f = Effect.fnUntraced(function*(
*   value: string
* ): Effect.fn.Return<number> {
*   return yield* Effect.succeed(value.length)
* })
*
* //      ┌─── Effect.Effect<number>
* //      ▼
* const program = f("hello")
* Effect.runSync(program) // => 5
* ```
*
* **Example** (Annotating an untraced parametric function)
*
* ```ts import.meta.vitest
* import { Effect } from "effect"
*
* const f = Effect.fnUntraced(function*<A>(
*   value: A
* ): Effect.fn.Return<A> {
*   return yield* Effect.succeed(value)
* })
*
* //      ┌─── Effect.Effect<string>
* //      ▼
* const program = f("hello")
* Effect.runSync(program) // => "hello"
* ```
*
* @category constructors
* @since 3.12.0
*/
var fnUntraced = fnUntraced$1;
/**
* Creates a reusable traced function from an Effect body.
*
* **When to use**
*
* Use when you are defining a reusable Effect function whose implementation
* would otherwise be a normal function returning {@link gen}, and you want
* tracing spans or stack-frame capture.
*
* **Details**
*
* Compared to a plain function that returns {@link gen}, `Effect.fn` reuses the
* generator body instead of allocating a fresh generator closure around the
* arguments on every call. Call `Effect.fn(body, ...)` for a generic
* stack-frame boundary without creating a span. Call
* `Effect.fn("operationName", options?)(body, ...)` when that boundary should
* have a readable operation name and the returned `Effect` should create a
* tracing span when run. {@link SpanOptionsNoTrace} configures span metadata
* such as attributes, links, parent or root selection, kind, sampling, and log
* level. Additional arguments after the generator body act like `pipe`
* transforms: each transform receives the previous result and the original
* function arguments. When those transforms return an `Effect`, the returned
* effect includes stack-frame metadata and, for the named form, a tracing span.
* Generator bodies may declare a `this` parameter; pass `{ self }` before the
* body to bind `this` when the function is created.
*
* **Example** (Defining traced effect functions)
*
* ```ts import.meta.vitest
* import { Effect } from "effect"
*
* const f = Effect.fn("calculateLength")(function*(value: string) {
*   return yield* Effect.succeed(value.length)
* })
*
* //      ┌─── Effect.Effect<number>
* //      ▼
* const program = f("hello")
* Effect.runSync(program) // => 5
* ```
*
* **Example** (Transforming the returned Effect)
*
* ```ts import.meta.vitest
* import { Effect } from "effect"
*
* const f = Effect.fn("formatLength")(
*   function*(value: string) {
*     return yield* Effect.succeed(value.length)
*   },
*   (effect, value) =>
*     effect.pipe(Effect.map((length) => `${value}: ${length}`))
* )
*
* //      ┌─── Effect.Effect<string>
* //      ▼
* const program = f("hello")
* Effect.runSync(program) // => "hello: 5"
* ```
*
* **Example** (Binding this)
*
* ```ts import.meta.vitest
* import { Effect } from "effect"
*
* class Counter {
*   count = 0
*
*   increment = Effect.fn("Counter.increment")(
*     { self: this },
*     function*(this: Counter, by: number) {
*       this.count += by
*       return yield* Effect.succeed(this.count)
*     }
*   )
* }
*
* const counter = new Counter()
*
* //      ┌─── Effect.Effect<number>
* //      ▼
* const program = counter.increment(1)
* Effect.runSync(program) // => 1
* ```
*
* **Example** (Annotating a traced non-parametric function)
*
* ```ts import.meta.vitest
* import { Effect } from "effect"
*
* const f = Effect.fn("calculateLength")(function*(
*   value: string
* ): Effect.fn.Return<number> {
*   return yield* Effect.succeed(value.length)
* })
*
* //      ┌─── Effect.Effect<number>
* //      ▼
* const program = f("hello")
* Effect.runSync(program) // => 5
* ```
*
* **Example** (Annotating a traced parametric function)
*
* ```ts import.meta.vitest
* import { Effect } from "effect"
*
* const f = Effect.fn("succeed")(function*<A>(
*   value: A
* ): Effect.fn.Return<A> {
*   return yield* Effect.succeed(value)
* })
*
* //      ┌─── Effect.Effect<string>
* //      ▼
* const program = f("hello")
* Effect.runSync(program) // => "hello"
* ```
*
* @category constructors
* @since 3.11.0
*/
var fn = fn$1;
/**
* Retrieves the `Clock` service from the context and provides it to the
* specified effectful function.
*
* **Example** (Accessing the Clock service)
*
* ```ts import.meta.vitest
* import { Effect } from "effect"
*
* const program = Effect.clockWith((clock) =>
*   clock.currentTimeMillis.pipe(
*     Effect.map(() => "Clock is available")
*   )
* )
*
* Effect.runSync(program) // => "Clock is available"
* ```
*
* @category accessors
* @since 2.0.0
*/
var clockWith = clockWith$1;
/**
* Creates a logger function that logs at the specified level.
*
* **Details**
*
* If no level is provided, the logger uses the fiber's current log level and
* extracts any `Cause` values from the message list.
*
* **Example** (Logging at a dynamic level)
*
* ```ts import.meta.vitest
* import { Effect, Logger, References } from "effect"
* const output: Array<unknown> = []
*
* const logWarn = Effect.logWithLevel("Warn")
*
* const program = Effect.gen(function*() {
*   yield* logWarn("Cache miss")
* })
* const logger = Logger.make<unknown, void>(({ logLevel, message }) => {
*   void output.push(`${logLevel}: ${Array.isArray(message) ? message.map(String).join(" ") : String(message)}`)
* })
* const runnable = program.pipe(
*   Effect.provideService(References.MinimumLogLevel, "Debug"),
*   Effect.provide(Logger.layer([logger]))
* )
* Effect.runSync(runnable)
* output // => ["Warn: Cache miss"]
* ```
*
* @category logging
* @since 2.0.0
*/
var logWithLevel = logWithLevel$1;
/**
* Logs one or more messages using the default log level.
*
* **Example** (Logging at the default level)
*
* ```ts import.meta.vitest
* import { Effect, Logger } from "effect"
* const output: Array<unknown> = []
*
* const program = Effect.gen(function*() {
*   const result = 2 + 2
*   yield* Effect.log("Result:", result)
*   return result
* })
*
* const logger = Logger.make<unknown, void>(({ logLevel, message }) => {
*   void output.push(`${logLevel}: ${Array.isArray(message) ? message.map(String).join(" ") : String(message)}`)
* })
* const runnable = Effect.provide(program, Logger.layer([logger]))
* void output.push(Effect.runSync(runnable))
* output // => ["Info: Result: 4", 4]
* ```
*
* @category logging
* @since 2.0.0
*/
var log = /*#__PURE__*/ logWithLevel$1();
/**
* Logs one or more messages at the FATAL level.
*
* **Example** (Logging fatal messages)
*
* ```ts import.meta.vitest
* import { Effect, Logger } from "effect"
* const output: Array<unknown> = []
*
* const program = Effect.gen(function*() {
*   yield* Effect.logFatal("Critical system failure")
* })
*
* const logger = Logger.make<unknown, void>(({ logLevel, message }) => {
*   void output.push(`${logLevel}: ${Array.isArray(message) ? message.map(String).join(" ") : String(message)}`)
* })
* const runnable = Effect.provide(program, Logger.layer([logger]))
* Effect.runSync(runnable)
* output // => ["Fatal: Critical system failure"]
* ```
*
* @category logging
* @since 2.0.0
*/
var logFatal = /*#__PURE__*/ logWithLevel$1("Fatal");
/**
* Logs one or more messages at the WARNING level.
*
* **Example** (Logging warnings)
*
* ```ts import.meta.vitest
* import { Effect, Logger } from "effect"
* const output: Array<unknown> = []
*
* const program = Effect.gen(function*() {
*   yield* Effect.logWarning("API rate limit approaching")
* })
*
* const logger = Logger.make<unknown, void>(({ logLevel, message }) => {
*   void output.push(`${logLevel}: ${Array.isArray(message) ? message.map(String).join(" ") : String(message)}`)
* })
* Effect.runSync(Effect.provide(program, Logger.layer([logger])))
* output // => ["Warn: API rate limit approaching"]
* ```
*
* @category logging
* @since 2.0.0
*/
var logWarning = /*#__PURE__*/ logWithLevel$1("Warn");
/**
* Logs one or more messages at the ERROR level.
*
* **Example** (Logging errors)
*
* ```ts import.meta.vitest
* import { Effect, Logger } from "effect"
* const output: Array<unknown> = []
*
* const program = Effect.gen(function*() {
*   yield* Effect.logError("Database connection failed")
* })
*
* const logger = Logger.make<unknown, void>(({ logLevel, message }) => {
*   void output.push(`${logLevel}: ${Array.isArray(message) ? message.map(String).join(" ") : String(message)}`)
* })
* Effect.runSync(Effect.provide(program, Logger.layer([logger])))
* output // => ["Error: Database connection failed"]
* ```
*
* @category logging
* @since 2.0.0
*/
var logError = /*#__PURE__*/ logWithLevel$1("Error");
/**
* Logs one or more messages at the INFO level.
*
* **Example** (Logging information)
*
* ```ts import.meta.vitest
* import { Effect, Logger } from "effect"
* const output: Array<unknown> = []
*
* const program = Effect.gen(function*() {
*   yield* Effect.logInfo("Application starting up")
* })
*
* const logger = Logger.make<unknown, void>(({ logLevel, message }) => {
*   void output.push(`${logLevel}: ${Array.isArray(message) ? message.map(String).join(" ") : String(message)}`)
* })
* Effect.runSync(Effect.provide(program, Logger.layer([logger])))
* output // => ["Info: Application starting up"]
* ```
*
* @category logging
* @since 2.0.0
*/
var logInfo = /*#__PURE__*/ logWithLevel$1("Info");
/**
* Logs one or more messages at the DEBUG level.
*
* **Example** (Logging debug messages)
*
* ```ts import.meta.vitest
* import { Effect, Logger, References } from "effect"
* const output: Array<unknown> = []
*
* const program = Effect.gen(function*() {
*   yield* Effect.logDebug("Debug mode enabled")
* })
*
* const logger = Logger.make<unknown, void>(({ logLevel, message }) => {
*   void output.push(`${logLevel}: ${Array.isArray(message) ? message.map(String).join(" ") : String(message)}`)
* })
* const runnable = program.pipe(
*   Effect.provideService(References.MinimumLogLevel, "Debug"),
*   Effect.provide(Logger.layer([logger]))
* )
* Effect.runSync(runnable)
* output // => ["Debug: Debug mode enabled"]
* ```
*
* @category logging
* @since 2.0.0
*/
var logDebug = /*#__PURE__*/ logWithLevel$1("Debug");
/**
* Logs one or more messages at the TRACE level.
*
* **Example** (Logging trace messages)
*
* ```ts import.meta.vitest
* import { Effect, Logger, References } from "effect"
* const output: Array<unknown> = []
*
* const program = Effect.gen(function*() {
*   yield* Effect.logTrace("Entering function processData")
* })
*
* const logger = Logger.make<unknown, void>(({ logLevel, message }) => {
*   void output.push(`${logLevel}: ${Array.isArray(message) ? message.map(String).join(" ") : String(message)}`)
* })
* const runnable = program.pipe(
*   Effect.provideService(References.MinimumLogLevel, "Trace"),
*   Effect.provide(Logger.layer([logger]))
* )
* Effect.runSync(runnable)
* output // => ["Trace: Entering function processData"]
* ```
*
* @category logging
* @since 2.0.0
*/
var logTrace = /*#__PURE__*/ logWithLevel$1("Trace");
/**
* Adds a logger to the set of loggers which will output logs for this effect.
*
* **Example** (Adding a logger to an effect)
*
* ```ts import.meta.vitest
* import { Effect, Logger } from "effect"
* const output: Array<unknown> = []
*
* // Create a custom logger that logs to the console
* const customLogger = Logger.make<unknown, void>(({ message }) =>
*   void output.push(`[CUSTOM]: ${Array.isArray(message) ? message.map(String).join(" ") : String(message)}`)
* )
*
* const program = Effect.gen(function*() {
*   yield* Effect.log("This will go to both default and custom logger")
*   return "completed"
* })
*
* // Add the custom logger to the effect
* const programWithLogger = Effect.withLogger(program, customLogger)
*
* Effect.runSync(Effect.provide(programWithLogger, Logger.layer([])))
* output // => ["[CUSTOM]: This will go to both default and custom logger"]
* ```
*
* @category logging
* @since 4.0.0
*/
var withLogger = /*#__PURE__*/ dual(2, (effect, logger) => updateService$1(effect, CurrentLoggers, (loggers) => /* @__PURE__ */ new Set([...loggers, logger])));
/**
* Adds an annotation to each log line in this effect.
*
* **Example** (Adding log annotations)
*
* ```ts import.meta.vitest
* import { Effect, Logger } from "effect"
* const output: Array<unknown> = []
*
* const program = Effect.gen(function*() {
*   yield* Effect.log("Starting operation")
* })
*
* // Add annotations to all log messages
* const annotatedProgram = Effect.annotateLogs(program, {
*   userId: "user123",
*   operation: "data-processing"
* })
*
* // Also supports single key-value annotations
* const singleAnnotated = Effect.annotateLogs(program, "requestId", "req-456")
*
* const logger = Logger.make<unknown, void>(({ message }) =>
*   void output.push(Array.isArray(message) ? message.join(" ") : String(message))
* )
* const run = (effect: Effect.Effect<void>) =>
*   Effect.runSync(Effect.provide(effect, Logger.layer([logger])))
* run(annotatedProgram)
* run(singleAnnotated)
* output // => ["Starting operation", "Starting operation"]
* ```
*
* @category logging
* @since 2.0.0
*/
var annotateLogs = /*#__PURE__*/ dual((args) => isEffect(args[0]), (effect, ...args) => updateService$1(effect, CurrentLogAnnotations, (annotations) => {
	const newAnnotations = args.length === 1 ? {
		...annotations,
		...args[0]
	} : { ...annotations };
	if (args.length === 1) return newAnnotations;
	else assignProperty$1(newAnnotations, args[0], args[1]);
	return newAnnotations;
}));
/**
* Adds log annotations to the current scope.
*
* **When to use**
*
* Use to attach log annotations that last until the current scope closes.
*
* **Details**
*
* This differs from `annotateLogs`, which only annotates a specific effect.
* `annotateLogsScoped` updates annotations for the entire current `Scope` and
* restores the previous annotations when the scope closes.
*
* **Example** (Adding scoped log annotations)
*
* ```ts import.meta.vitest
* import { Effect, Logger } from "effect"
* const output: Array<unknown> = []
*
* const program = Effect.scoped(
*   Effect.gen(function*() {
*     yield* Effect.log("before")
*     yield* Effect.annotateLogsScoped({ requestId: "req-123" })
*     yield* Effect.log("inside scope")
*   })
* )
*
* const logger = Logger.make<unknown, void>(({ message }) =>
*   void output.push(Array.isArray(message) ? message.join(" ") : String(message))
* )
* Effect.runSync(Effect.provide(program, Logger.layer([logger])))
* output // => ["before", "inside scope"]
* ```
*
* @see {@link annotateLogs} for annotating one effect
*
* @category logging
* @since 3.1.0
*/
var annotateLogsScoped = annotateLogsScoped$1;
/**
* Adds a span to each log line in this effect.
*
* **Example** (Adding a log span)
*
* ```ts import.meta.vitest
* import { Effect, Logger } from "effect"
* const output: Array<unknown> = []
*
* const databaseOperation = Effect.gen(function*() {
*   yield* Effect.log("Connecting to database")
*   yield* Effect.log("Executing query")
*   yield* Effect.log("Processing results")
*   return "data"
* })
*
* const httpRequest = Effect.gen(function*() {
*   yield* Effect.log("Making HTTP request")
*   const data = yield* Effect.withLogSpan(databaseOperation, "db-operation")
*   yield* Effect.log("Sending response")
*   return data
* })
*
* const program = Effect.withLogSpan(httpRequest, "http-handler")
*
* const logger = Logger.make<unknown, void>(({ message }) =>
*   void output.push(Array.isArray(message) ? message.join(" ") : String(message))
* )
* void output.push(Effect.runSync(Effect.provide(program, Logger.layer([logger]))))
* output // => ["Making HTTP request", "Connecting to database", "Executing query", "Processing results", "Sending response", "data"]
* ```
*
* @category logging
* @since 2.0.0
*/
var withLogSpan = /*#__PURE__*/ dual(2, (effect, label) => flatMap$2(currentTimeMillis, (now) => updateService$1(effect, CurrentLogSpans, (spans) => {
	return [[label, now], ...spans];
})));
/**
* Updates the `Metric` every time the `Effect` is executed.
*
* **Details**
*
* Also accepts an optional function which can be used to map the `Exit` value
* of the `Effect` into a valid `Input` for the `Metric`.
*
* **Example** (Incrementing a metric for each execution)
*
* ```ts import.meta.vitest
* import { Effect, Metric } from "effect"
*
* const counter = Metric.counter("effect_executions", {
*   description: "Counts effect executions"
* }).pipe(Metric.withConstantInput(1))
*
* const program = Effect.succeed("Hello").pipe(
*   Effect.track(counter)
* )
*
* Effect.runSync(program)
* Effect.runSync(Metric.value(counter)).count // => 1
* ```
*
* **Example** (Mapping exits before updating a metric)
*
* ```ts import.meta.vitest
* import { Effect, Exit, Metric } from "effect"
*
* // Track different exit types with custom mapping
* const exitTracker = Metric.frequency("exit_types", {
*   description: "Tracks success/failure/defect counts"
* })
*
* const mapExitToString = (exit: Exit.Exit<string, Error>) => {
*   if (Exit.isSuccess(exit)) return "success"
*   if (Exit.isFailure(exit)) return "failure"
*   return "defect"
* }
*
* const effect = Effect.succeed("result").pipe(
*   Effect.track(exitTracker, mapExitToString)
* )
* Effect.runSync(effect)
* Effect.runSync(Metric.value(exitTracker)).occurrences.get("success") // => 1
* ```
*
* @category metrics
* @since 4.0.0
*/
var track = /*#__PURE__*/ dual((args) => isEffect(args[0]), (self, metric, f) => onExit(self, (exit) => {
	return update(metric, f === void 0 ? exit : internalCall(() => f(exit)));
}));
/**
* Updates the provided `Metric` every time the wrapped `Effect` succeeds with
* a value.
*
* **Details**
*
* Also accepts an optional function which can be used to map the success value
* of the `Effect` into a valid `Input` for the `Metric`.
*
* **Example** (Counting successful results)
*
* ```ts import.meta.vitest
* import { Effect, Metric } from "effect"
*
* const successCounter = Metric.counter("successes").pipe(
*   Metric.withConstantInput(1)
* )
*
* const program = Effect.succeed(42).pipe(
*   Effect.trackSuccesses(successCounter)
* )
*
* Effect.runSync(program)
* Effect.runSync(Metric.value(successCounter)).count // => 1
* ```
*
* **Example** (Mapping successes before tracking)
*
* ```ts import.meta.vitest
* import { Effect, Metric } from "effect"
*
* // Track successful request sizes
* const requestSizeGauge = Metric.gauge("request_size_bytes")
*
* const program = Effect.succeed("Hello World!").pipe(
*   Effect.trackSuccesses(requestSizeGauge, (value: string) => value.length)
* )
*
* Effect.runSync(program)
* Effect.runSync(Metric.value(requestSizeGauge)).value // => 12
* ```
*
* @category metrics
* @since 4.0.0
*/
var trackSuccesses = /*#__PURE__*/ dual((args) => isEffect(args[0]), (self, metric, f) => tap(self, (value) => {
	return update(metric, f === void 0 ? value : f(value));
}));
/**
* Updates the provided `Metric` every time the wrapped `Effect` fails with an
* **expected** error.
*
* **Details**
*
* Also accepts an optional function which can be used to map the error value
* of the `Effect` into a valid `Input` for the `Metric`.
*
* **Example** (Counting expected failures)
*
* ```ts import.meta.vitest
* import { Effect, Metric } from "effect"
*
* const errorCounter = Metric.counter("errors").pipe(
*   Metric.withConstantInput(1)
* )
*
* const program = Effect.fail("Network timeout").pipe(
*   Effect.trackErrors(errorCounter)
* )
*
* Effect.runSyncExit(program)
* Effect.runSync(Metric.value(errorCounter)).count // => 1
* ```
*
* **Example** (Mapping errors before tracking)
*
* ```ts import.meta.vitest
* import { Data, Effect, Metric } from "effect"
*
* class ConnectionFailedError extends Data.TaggedError("ConnectionFailedError")<{}> {}
*
* // Track error types using frequency metric
* const errorTypeFrequency = Metric.frequency("error_types")
*
* const program = Effect.fail(new ConnectionFailedError()).pipe(
*   Effect.trackErrors(errorTypeFrequency, (error: ConnectionFailedError) => error._tag)
* )
*
* Effect.runSyncExit(program)
* Effect.runSync(Metric.value(errorTypeFrequency)).occurrences.get("ConnectionFailedError") // => 1
* ```
*
* @category metrics
* @since 4.0.0
*/
var trackErrors = /*#__PURE__*/ dual((args) => isEffect(args[0]), (self, metric, f) => tapError(self, (error) => {
	return update(metric, f === void 0 ? error : internalCall(() => f(error)));
}));
/**
* Updates the provided `Metric` every time the wrapped `Effect` fails with an
* **unexpected** error (i.e. a defect).
*
* **Details**
*
* Also accepts an optional function which can be used to map the defect value
* of the `Effect` into a valid `Input` for the `Metric`.
*
* **Example** (Counting defects)
*
* ```ts import.meta.vitest
* import { Effect, Metric } from "effect"
*
* const defectCounter = Metric.counter("defects").pipe(
*   Metric.withConstantInput(1)
* )
*
* const program = Effect.die("Critical system failure").pipe(
*   Effect.trackDefects(defectCounter)
* )
*
* Effect.runSyncExit(program)
* Effect.runSync(Metric.value(defectCounter)).count // => 1
* ```
*
* **Example** (Mapping defects before tracking)
*
* ```ts import.meta.vitest
* import { Effect, Metric } from "effect"
*
* // Track defect types using frequency metric
* const defectTypeFrequency = Metric.frequency("defect_types")
*
* const program = Effect.die(new Error("Null pointer exception")).pipe(
*   Effect.trackDefects(defectTypeFrequency, (defect: unknown) => {
*     if (defect instanceof Error) return defect.constructor.name
*     return typeof defect
*   })
* )
*
* Effect.runSyncExit(program)
* Effect.runSync(Metric.value(defectTypeFrequency)).occurrences.get("Error") // => 1
* ```
*
* @category metrics
* @since 4.0.0
*/
var trackDefects = /*#__PURE__*/ dual((args) => isEffect(args[0]), (self, metric, f) => tapDefect(self, (defect) => {
	return update(metric, f === void 0 ? defect : internalCall(() => f(defect)));
}));
/**
* Updates the provided `Metric` with the `Duration` of time (in nanoseconds)
* that the wrapped `Effect` took to complete.
*
* **Details**
*
* Also accepts an optional function which can be used to map the `Duration`
* that the wrapped `Effect` took to complete into a valid `Input` for the
* `Metric`.
*
* **Example** (Recording execution duration)
*
* ```ts import.meta.vitest
* import { Effect, Metric } from "effect"
*
* const executionTimer = Metric.timer("execution_time")
*
* const program = Effect.succeed("done").pipe(
*   Effect.trackDuration(executionTimer)
* )
*
* Effect.runSync(program)
* Effect.runSync(Metric.value(executionTimer)).count // => 1
* ```
*
* **Example** (Mapping duration before tracking)
*
* ```ts import.meta.vitest
* import { Effect, Metric } from "effect"
*
* // Track execution time in milliseconds using custom mapping
* const durationGauge = Metric.gauge("execution_millis")
*
* const program = Effect.succeed("done").pipe(
*   Effect.trackDuration(durationGauge, () => 1)
* )
*
* Effect.runSync(program)
* Effect.runSync(Metric.value(durationGauge)).value // => 1
* ```
*
* @category metrics
* @since 4.0.0
*/
var trackDuration = /*#__PURE__*/ dual((args) => isEffect(args[0]), (self, metric, f) => clockWith((clock) => {
	const startTime = clock.monotonicTimeNanosUnsafe();
	return onExit(self, () => {
		const duration = subtract(fromInputUnsafe(clock.monotonicTimeNanosUnsafe()), fromInputUnsafe(startTime));
		return update(metric, f === void 0 ? duration : internalCall(() => f(duration)));
	});
}));
/**
* Service that holds the current transaction state.
*
* **Details**
*
* It includes a journal that stores non-committed changes to `TxRef` values and
* a retry flag that records whether the transaction should be retried.
*
* **Example** (Building transactions)
*
* ```ts import.meta.vitest
* import { Effect } from "effect"
*
* // Transaction class for software transactional memory operations
* const txEffect = Effect.gen(function*() {
*   const tx = yield* Effect.Transaction
*   // Use transaction for coordinated state changes
*   return "Transaction complete"
* })
*
* const runnable = Effect.provideService(txEffect, Effect.Transaction, {
*   retry: false,
*   journal: new Map()
* })
* Effect.runSync(runnable) // => "Transaction complete"
* ```
*
* @category services
* @since 4.0.0
*/
var Transaction = class extends (/*#__PURE__*/ Service()("effect/Effect/Transaction")) {};
/**
* Defines a transaction boundary. Transactions are "all or nothing" with respect to changes
* made to transactional values (i.e. TxRef) that occur within the transaction body.
*
* **Details**
*
* If called inside an active transaction, `tx` composes with the current transaction and reuses
* its journal and retry state instead of creating a nested boundary.
*
* Effect transactions are optimistic with retry. A transaction is retried when
* its body explicitly calls `Effect.txRetry` and any accessed transactional
* value changes, or when any accessed transactional value changes because a
* different transaction commits before the current one.
*
* The outermost `tx` call creates the transaction boundary and commits or rolls back the full
* composed transaction.
*
* **Example** (Running a transaction)
*
* ```ts import.meta.vitest
* import { Effect, TxRef } from "effect"
* const output: Array<unknown> = []
*
* const program = Effect.gen(function*() {
*   const ref1 = yield* TxRef.make(0)
*   const ref2 = yield* TxRef.make(0)
*
*   // Nested tx calls compose into the same transaction
*   yield* Effect.tx(Effect.gen(function*() {
*     yield* TxRef.set(ref1, 10)
*     yield* Effect.tx(TxRef.set(ref2, 20))
*     const sum = (yield* TxRef.get(ref1)) + (yield* TxRef.get(ref2))
*     void output.push(`Transaction sum: ${sum}`)
*   }))
*
*   void output.push(`Final ref1: ${yield* TxRef.get(ref1)}`)
*   void output.push(`Final ref2: ${yield* TxRef.get(ref2)}`)
* })
*
* Effect.runSync(program)
* output // => ["Transaction sum: 30", "Final ref1: 10", "Final ref2: 20"]
* ```
*
* @category transactions
* @since 4.0.0
*/
var tx = (effect) => withFiber((fiber) => {
	let state = getOrUndefined(fiber.context, Transaction);
	if (state) return effect;
	state = {
		journal: /* @__PURE__ */ new Map(),
		retry: false
	};
	let result;
	return uninterruptibleMask((restore) => flatMap(whileLoop({
		while: () => !result,
		body: constant(restore(effect).pipe(provideService(Transaction, state), tapCause(() => {
			if (!state.retry) return void_;
			return restore(awaitPendingTransaction(state));
		}), exit)),
		step(exit) {
			if (state.retry || !isTransactionConsistent(state)) return clearTransaction(state);
			if (isSuccess$1(exit)) commitTransaction(fiber, state);
			else clearTransaction(state);
			result = exit;
		}
	}), () => result));
});
var isTransactionConsistent = (state) => {
	for (const [ref, { version }] of state.journal) if (ref.version !== version) return false;
	return true;
};
var awaitPendingTransaction = (state) => suspend(() => {
	const key = {};
	const refs = Array.from(state.journal.keys());
	const clearPending = () => {
		for (const clear of refs) clear.pending.delete(key);
	};
	return callback((resume) => {
		const onCall = () => {
			clearPending();
			resume(void_);
		};
		for (const ref of refs) ref.pending.set(key, onCall);
		return sync(clearPending);
	});
});
function commitTransaction(fiber, state) {
	for (const [ref, { value }] of state.journal) {
		if (value !== ref.value) {
			ref.version = ref.version + 1;
			ref.value = value;
		}
		for (const pending of ref.pending.values()) fiber.currentDispatcher.scheduleTask(pending, 0);
		ref.pending.clear();
	}
}
function clearTransaction(state) {
	state.retry = false;
	state.journal.clear();
}
/**
* Retries the current transaction by signaling that it must be retried.
*
* **Details**
*
* NOTE: the transaction retries on any change to transactional values (i.e. TxRef) accessed in its body.
*
* **Example** (Retrying transactions)
*
* ```ts import.meta.vitest
* import { Deferred, Effect, TxRef } from "effect"
*
* const program = Effect.gen(function*() {
*   const ref = yield* TxRef.make(0)
*   const update = yield* Deferred.make<void>()
*
*   yield* Effect.forkChild(
*     Deferred.await(update).pipe(Effect.andThen(Effect.tx(TxRef.set(ref, 1))))
*   )
*
*   return yield* Effect.tx(Effect.gen(function*() {
*     const value = yield* TxRef.get(ref)
*     if (value === 0) {
*       yield* Deferred.succeed(update, undefined)
*       return yield* Effect.txRetry
*     }
*     return value
*   }))
* })
*
* await Effect.runPromise(program) // => 1
* ```
*
* @category transactions
* @since 4.0.0
*/
var txRetry = /*#__PURE__*/ flatMap(Transaction, (state) => {
	state.retry = true;
	return interrupt;
});
/**
* Converts an error-first callback API into a function that returns an
* `Effect`.
*
* **Details**
*
* The original function is called with the supplied arguments plus a final
* callback. A non-null callback error fails the returned effect, while a
* successful callback value becomes the effect success. Use `onError` to map
* callback errors and `onSyncError` to turn synchronous throws into typed
* failures; otherwise synchronous throws become defects.
*
* **Example** (Converting callbacks to effects)
*
* ```ts import.meta.vitest
* import { Effect } from "effect"
*
* const uppercase = (
*   input: string,
*   callback: (error: Error | null, value?: string) => void
* ) => queueMicrotask(() => callback(null, input.toUpperCase()))
*
* const effectfulUppercase = Effect.effectify(uppercase)
* const program = effectfulUppercase("hello")
*
* await Effect.runPromise(program) // => "HELLO"
* ```
*
* **Example** (Mapping callback errors to typed failures)
*
* ```ts import.meta.vitest
* import { Effect } from "effect"
*
* const fail = (
*   input: string,
*   callback: (error: Error | null, value?: string) => void
* ) => queueMicrotask(() => callback(new Error("unavailable")))
*
* const effectfulFail = Effect.effectify(
*   fail,
*   (error, args) => new Error(`Failed to process ${args[0]}: ${error.message}`)
* )
*
* const program = Effect.flip(effectfulFail("hello"))
*
* const error = await Effect.runPromise(program)
* error.message // => "Failed to process hello: unavailable"
* ```
*
* @category converting
* @since 4.0.0
*/
var effectify = (fn, onError, onSyncError) => (...args) => callback((resume) => {
	try {
		fn(...args, (err, result) => {
			if (err) resume(fail(onError ? onError(err, args) : err));
			else resume(succeed(result));
		});
	} catch (err) {
		resume(onSyncError ? fail(onSyncError(err, args)) : die(err));
	}
});
/**
* Ensures that an effect's success type extends a given type `A`.
*
* **Details**
*
* This helper is checked at compile time and does not change the effect's
* runtime behavior.
*
* **Example** (Constraining the success type)
*
* ```ts import.meta.vitest
* import { Effect } from "effect"
*
* // Define a constraint that the success type must be a number
* const satisfiesNumber = Effect.satisfiesSuccessType<number>()
*
* // This works - Effect<42, never, never> extends Effect<number, never, never>
* const validEffect = satisfiesNumber(Effect.succeed(42))
* Effect.runSync(validEffect) // => 42
*
* // This would cause a TypeScript compilation error:
* // const invalidEffect = satisfiesNumber(Effect.succeed("string"))
* //                                      ^^^^^^^^^^^^^^^^^^^^^^
* // Type 'string' is not assignable to type 'number'
* ```
*
* @category utility types
* @since 4.0.0
*/
var satisfiesSuccessType = () => (effect) => effect;
/**
* Ensures that an effect's error type extends a given type `E`.
*
* **Details**
*
* This helper is checked at compile time and does not change the effect's
* runtime behavior.
*
* **Example** (Constraining the error type)
*
* ```ts import.meta.vitest
* import { Data, Effect } from "effect"
*
* class ValidationError extends Data.TaggedError("ValidationError")<{}> {}
*
* // Define a constraint that the error type must be a ValidationError
* const satisfiesError = Effect.satisfiesErrorType<ValidationError>()
*
* // This works - Effect<number, ValidationError, never> extends the constrained type
* const validEffect = satisfiesError(Effect.fail(new ValidationError()))
* Effect.runSync(Effect.flip(validEffect))._tag // => "ValidationError"
*
* // This would cause a TypeScript compilation error:
* // const invalidEffect = satisfiesError(Effect.fail("string error"))
* //                                     ^^^^^^^^^^^^^^^^^^^^^^^^^^^
* // Type 'string' is not assignable to type 'ValidationError'
* ```
*
* @category utility types
* @since 4.0.0
*/
var satisfiesErrorType = () => (effect) => effect;
/**
* Ensures that an effect's requirements type extends a given type `R`.
*
* **Details**
*
* This helper is checked at compile time and does not change the effect's
* runtime behavior.
*
* **Example** (Constraining the services type)
*
* ```ts import.meta.vitest
* import { Effect } from "effect"
*
* // Define a constraint that requires a string as the requirements type
* const satisfiesStringServices = Effect.satisfiesServicesType<string>()
*
* // This works - effect requires string
* const validEffect: Effect.Effect<number, never, "config"> = Effect.succeed(42)
* const constrainedEffect = satisfiesStringServices(validEffect)
*
* // This would cause a TypeScript compilation error if uncommented:
* // const invalidEffect: Effect.Effect<number, never, number> = Effect.succeed(42)
* // const constrainedInvalid = satisfiesStringServices(invalidEffect)
* ```
*
* @category utility types
* @since 4.0.0
*/
var satisfiesServicesType = () => (effect) => effect;
/**
* Applies `map` eagerly when an effect is already resolved.
*
* **When to use**
*
* Use when an already-resolved effect should apply a success transformation
* immediately while pending effects still use regular mapping.
*
* **Details**
*
* Success effects apply the mapping function immediately. Failure effects pass
* through unchanged, and pending effects fall back to regular `map` behavior.
*
* **Example** (Mapping already completed effects)
*
* ```ts import.meta.vitest
* import { Effect } from "effect"
*
* // For resolved effects, the mapping is applied immediately
* const resolved = Effect.succeed(5)
* const mapped = Effect.mapEager(resolved, (n) => n * 2) // Applied eagerly
*
* // For pending effects, behaves like regular map
* const pending = Effect.delay(Effect.succeed(5), 0)
* const mappedPending = Effect.mapEager(pending, (n) => n * 2) // Uses regular map
*
* await Effect.runPromise(Effect.all([mapped, mappedPending])) // => [10, 10]
* ```
*
* @category mapping
* @since 4.0.0
*/
var mapEager = mapEager$1;
/**
* Applies `mapError` eagerly when an effect is already resolved.
*
* **When to use**
*
* Use when an already-resolved failed effect should apply an error
* transformation immediately while pending effects still use regular error
* mapping.
*
* **Details**
*
* Success effects pass through unchanged because there is no error to
* transform. Failure effects apply the mapping function immediately, and
* pending effects fall back to regular `mapError` behavior.
*
* **Example** (Mapping errors eagerly when possible)
*
* ```ts import.meta.vitest
* import { Effect } from "effect"
* const output: Array<unknown> = []
*
* // For resolved failure effects, the error mapping is applied immediately
* const failed = Effect.fail("original error")
* const mapped = Effect.mapErrorEager(failed, (err: string) => `mapped: ${err}`) // Applied eagerly
*
* // For pending effects, behaves like regular mapError
* const pending = Effect.delay(Effect.fail("error"), 0)
* const mappedPending = Effect.mapErrorEager(
*   pending,
*   (err: string) => `mapped: ${err}`
* ) // Uses regular mapError
*
* void output.push(await Effect.runPromise(Effect.all([
*   Effect.flip(mapped),
*   Effect.flip(mappedPending)
* ])))
* output // => [['mapped: original error', 'mapped: error']]
* ```
*
* @category error handling
* @since 4.0.0
*/
var mapErrorEager = mapErrorEager$1;
/**
* Applies `mapBoth` eagerly when an effect is already resolved.
*
* **When to use**
*
* Use when an already-resolved effect should transform either success or
* failure immediately while pending effects still use regular channel mapping.
*
* **Details**
*
* Success effects apply `onSuccess` immediately, and failure effects apply
* `onFailure` immediately. Pending effects fall back to regular `mapBoth`
* behavior.
*
* **Example** (Mapping both channels eagerly when possible)
*
* ```ts import.meta.vitest
* import { Effect } from "effect"
* const output: Array<unknown> = []
*
* // For resolved effects, the appropriate mapping is applied immediately
* const success = Effect.succeed(5)
* const mapped = Effect.mapBothEager(success, {
*   onFailure: (err: string) => `Failed: ${err}`,
*   onSuccess: (n: number) => n * 2
* }) // onSuccess applied eagerly
*
* const failure = Effect.fail("error")
* const mappedError = Effect.mapBothEager(failure, {
*   onFailure: (err: string) => `Failed: ${err}`,
*   onSuccess: (n: number) => n * 2
* }) // onFailure applied eagerly
*
* void output.push(Effect.runSync(mapped))
* void output.push(Effect.runSync(Effect.flip(mappedError)))
* output // => [10, "Failed: error"]
* ```
*
* @category mapping
* @since 4.0.0
*/
var mapBothEager = mapBothEager$1;
/**
* Applies `flatMap` eagerly when an effect is already resolved.
*
* **When to use**
*
* Use when an already-resolved successful effect should bind immediately to the
* next effect while pending effects still use regular flat mapping.
*
* **Details**
*
* Success effects apply the flatMap function immediately. Failure effects pass
* through unchanged, and pending effects fall back to regular `flatMap`
* behavior.
*
* **Example** (Flat mapping eagerly when possible)
*
* ```ts import.meta.vitest
* import { Effect } from "effect"
*
* // For resolved effects, the flatMap is applied immediately
* const resolved = Effect.succeed(5)
* const flatMapped = Effect.flatMapEager(resolved, (n) => Effect.succeed(n * 2)) // Applied eagerly
*
* // For pending effects, behaves like regular flatMap
* const pending = Effect.delay(Effect.succeed(5), 0)
* const flatMappedPending = Effect.flatMapEager(
*   pending,
*   (n) => Effect.succeed(n * 2)
* ) // Uses regular flatMap
*
* await Effect.runPromise(Effect.all([flatMapped, flatMappedPending])) // => [10, 10]
* ```
*
* @category sequencing
* @since 4.0.0
*/
var flatMapEager = flatMapEager$1;
/**
* Applies `catch` eagerly when an effect is already resolved.
*
* **When to use**
*
* Use when an already-resolved failed effect should recover immediately while
* pending effects still use regular error recovery.
*
* **Details**
*
* Success effects pass through unchanged because there is no error to catch.
* Failure effects apply the catch function immediately, and pending effects
* fall back to regular `catch` behavior.
*
* **Example** (Catching failures eagerly when possible)
*
* ```ts import.meta.vitest
* import { Effect } from "effect"
* const output: Array<unknown> = []
*
* // For resolved failure effects, the catch function is applied immediately
* const failed = Effect.fail("original error")
* const recovered = Effect.catchEager(
*   failed,
*   (err: string) => Effect.succeed(`recovered from: ${err}`)
* ) // Applied eagerly
*
* // For success effects, returns success as-is
* const success = Effect.succeed(42)
* const unchanged = Effect.catchEager(
*   success,
*   (err: string) => Effect.succeed(`recovered from: ${err}`)
* ) // Returns success as-is
*
* // For pending effects, behaves like regular catch
* const pending = Effect.delay(Effect.fail("error"), 0)
* const recoveredPending = Effect.catchEager(
*   pending,
*   (err: string) => Effect.succeed(`recovered from: ${err}`)
* ) // Uses regular catch
*
* void output.push(await Effect.runPromise(Effect.all([
*   recovered,
*   unchanged,
*   recoveredPending
* ])))
* output // => [['recovered from: original error', 42, 'recovered from: error']]
* ```
*
* @category error handling
* @since 4.0.0
*/
var catchEager = catchEager$1;
/**
* Creates untraced function effects with eager evaluation optimization.
*
* **Details**
*
* Executes generator functions eagerly when all yielded effects are synchronous,
* stopping at the first async effect and deferring to normal execution.
*
* **Example** (Defining eager untraced effect functions)
*
* ```ts import.meta.vitest
* import { Effect } from "effect"
*
* const computation = Effect.fnUntracedEager(function*() {
*   yield* Effect.succeed(1)
*   yield* Effect.succeed(2)
*   return "computed eagerly"
* })
*
* const effect = computation() // Executed immediately if all effects are sync
* Effect.runSync(effect) // => "computed eagerly"
* ```
*
* @category constructors
* @since 4.0.0
*/
var fnUntracedEager = fnUntracedEager$1;
//#endregion
//#region ../../node_modules/.bun/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/platform/node/globalThis.js
var require_globalThis = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports._globalThis = void 0;
	/** only globals that common to node and browsers are allowed */
	exports._globalThis = typeof globalThis === "object" ? globalThis : global;
}));
//#endregion
//#region ../../node_modules/.bun/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/platform/node/index.js
var require_node = /* @__PURE__ */ __commonJSMin(((exports) => {
	var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
		if (k2 === void 0) k2 = k;
		Object.defineProperty(o, k2, {
			enumerable: true,
			get: function() {
				return m[k];
			}
		});
	}) : (function(o, m, k, k2) {
		if (k2 === void 0) k2 = k;
		o[k2] = m[k];
	}));
	var __exportStar = exports && exports.__exportStar || function(m, exports$2) {
		for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports$2, p)) __createBinding(exports$2, m, p);
	};
	Object.defineProperty(exports, "__esModule", { value: true });
	__exportStar(require_globalThis(), exports);
}));
//#endregion
//#region ../../node_modules/.bun/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/platform/index.js
var require_platform = /* @__PURE__ */ __commonJSMin(((exports) => {
	var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
		if (k2 === void 0) k2 = k;
		Object.defineProperty(o, k2, {
			enumerable: true,
			get: function() {
				return m[k];
			}
		});
	}) : (function(o, m, k, k2) {
		if (k2 === void 0) k2 = k;
		o[k2] = m[k];
	}));
	var __exportStar = exports && exports.__exportStar || function(m, exports$1) {
		for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports$1, p)) __createBinding(exports$1, m, p);
	};
	Object.defineProperty(exports, "__esModule", { value: true });
	__exportStar(require_node(), exports);
}));
//#endregion
//#region ../../node_modules/.bun/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/version.js
var require_version = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.VERSION = void 0;
	exports.VERSION = "1.9.0";
}));
//#endregion
//#region ../../node_modules/.bun/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/internal/semver.js
var require_semver = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.isCompatible = exports._makeCompatibilityCheck = void 0;
	var version_1 = require_version();
	var re = /^(\d+)\.(\d+)\.(\d+)(-(.+))?$/;
	/**
	* Create a function to test an API version to see if it is compatible with the provided ownVersion.
	*
	* The returned function has the following semantics:
	* - Exact match is always compatible
	* - Major versions must match exactly
	*    - 1.x package cannot use global 2.x package
	*    - 2.x package cannot use global 1.x package
	* - The minor version of the API module requesting access to the global API must be less than or equal to the minor version of this API
	*    - 1.3 package may use 1.4 global because the later global contains all functions 1.3 expects
	*    - 1.4 package may NOT use 1.3 global because it may try to call functions which don't exist on 1.3
	* - If the major version is 0, the minor version is treated as the major and the patch is treated as the minor
	* - Patch and build tag differences are not considered at this time
	*
	* @param ownVersion version which should be checked against
	*/
	function _makeCompatibilityCheck(ownVersion) {
		const acceptedVersions = /* @__PURE__ */ new Set([ownVersion]);
		const rejectedVersions = /* @__PURE__ */ new Set();
		const myVersionMatch = ownVersion.match(re);
		if (!myVersionMatch) return () => false;
		const ownVersionParsed = {
			major: +myVersionMatch[1],
			minor: +myVersionMatch[2],
			patch: +myVersionMatch[3],
			prerelease: myVersionMatch[4]
		};
		if (ownVersionParsed.prerelease != null) return function isExactmatch(globalVersion) {
			return globalVersion === ownVersion;
		};
		function _reject(v) {
			rejectedVersions.add(v);
			return false;
		}
		function _accept(v) {
			acceptedVersions.add(v);
			return true;
		}
		return function isCompatible(globalVersion) {
			if (acceptedVersions.has(globalVersion)) return true;
			if (rejectedVersions.has(globalVersion)) return false;
			const globalVersionMatch = globalVersion.match(re);
			if (!globalVersionMatch) return _reject(globalVersion);
			const globalVersionParsed = {
				major: +globalVersionMatch[1],
				minor: +globalVersionMatch[2],
				patch: +globalVersionMatch[3],
				prerelease: globalVersionMatch[4]
			};
			if (globalVersionParsed.prerelease != null) return _reject(globalVersion);
			if (ownVersionParsed.major !== globalVersionParsed.major) return _reject(globalVersion);
			if (ownVersionParsed.major === 0) {
				if (ownVersionParsed.minor === globalVersionParsed.minor && ownVersionParsed.patch <= globalVersionParsed.patch) return _accept(globalVersion);
				return _reject(globalVersion);
			}
			if (ownVersionParsed.minor <= globalVersionParsed.minor) return _accept(globalVersion);
			return _reject(globalVersion);
		};
	}
	exports._makeCompatibilityCheck = _makeCompatibilityCheck;
	/**
	* Test an API version to see if it is compatible with this API.
	*
	* - Exact match is always compatible
	* - Major versions must match exactly
	*    - 1.x package cannot use global 2.x package
	*    - 2.x package cannot use global 1.x package
	* - The minor version of the API module requesting access to the global API must be less than or equal to the minor version of this API
	*    - 1.3 package may use 1.4 global because the later global contains all functions 1.3 expects
	*    - 1.4 package may NOT use 1.3 global because it may try to call functions which don't exist on 1.3
	* - If the major version is 0, the minor version is treated as the major and the patch is treated as the minor
	* - Patch and build tag differences are not considered at this time
	*
	* @param version version of the API requesting an instance of the global API
	*/
	exports.isCompatible = _makeCompatibilityCheck(version_1.VERSION);
}));
//#endregion
//#region ../../node_modules/.bun/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/internal/global-utils.js
var require_global_utils = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.unregisterGlobal = exports.getGlobal = exports.registerGlobal = void 0;
	var platform_1 = require_platform();
	var version_1 = require_version();
	var semver_1 = require_semver();
	var major = version_1.VERSION.split(".")[0];
	var GLOBAL_OPENTELEMETRY_API_KEY = Symbol.for(`opentelemetry.js.api.${major}`);
	var _global = platform_1._globalThis;
	function registerGlobal(type, instance, diag, allowOverride = false) {
		var _a;
		const api = _global[GLOBAL_OPENTELEMETRY_API_KEY] = (_a = _global[GLOBAL_OPENTELEMETRY_API_KEY]) !== null && _a !== void 0 ? _a : { version: version_1.VERSION };
		if (!allowOverride && api[type]) {
			const err = /* @__PURE__ */ new Error(`@opentelemetry/api: Attempted duplicate registration of API: ${type}`);
			diag.error(err.stack || err.message);
			return false;
		}
		if (api.version !== version_1.VERSION) {
			const err = /* @__PURE__ */ new Error(`@opentelemetry/api: Registration of version v${api.version} for ${type} does not match previously registered API v${version_1.VERSION}`);
			diag.error(err.stack || err.message);
			return false;
		}
		api[type] = instance;
		diag.debug(`@opentelemetry/api: Registered a global for ${type} v${version_1.VERSION}.`);
		return true;
	}
	exports.registerGlobal = registerGlobal;
	function getGlobal(type) {
		var _a, _b;
		const globalVersion = (_a = _global[GLOBAL_OPENTELEMETRY_API_KEY]) === null || _a === void 0 ? void 0 : _a.version;
		if (!globalVersion || !(0, semver_1.isCompatible)(globalVersion)) return;
		return (_b = _global[GLOBAL_OPENTELEMETRY_API_KEY]) === null || _b === void 0 ? void 0 : _b[type];
	}
	exports.getGlobal = getGlobal;
	function unregisterGlobal(type, diag) {
		diag.debug(`@opentelemetry/api: Unregistering a global for ${type} v${version_1.VERSION}.`);
		const api = _global[GLOBAL_OPENTELEMETRY_API_KEY];
		if (api) delete api[type];
	}
	exports.unregisterGlobal = unregisterGlobal;
}));
//#endregion
//#region ../../node_modules/.bun/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/diag/ComponentLogger.js
var require_ComponentLogger = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.DiagComponentLogger = void 0;
	var global_utils_1 = require_global_utils();
	/**
	* Component Logger which is meant to be used as part of any component which
	* will add automatically additional namespace in front of the log message.
	* It will then forward all message to global diag logger
	* @example
	* const cLogger = diag.createComponentLogger({ namespace: '@opentelemetry/instrumentation-http' });
	* cLogger.debug('test');
	* // @opentelemetry/instrumentation-http test
	*/
	var DiagComponentLogger = class {
		constructor(props) {
			this._namespace = props.namespace || "DiagComponentLogger";
		}
		debug(...args) {
			return logProxy("debug", this._namespace, args);
		}
		error(...args) {
			return logProxy("error", this._namespace, args);
		}
		info(...args) {
			return logProxy("info", this._namespace, args);
		}
		warn(...args) {
			return logProxy("warn", this._namespace, args);
		}
		verbose(...args) {
			return logProxy("verbose", this._namespace, args);
		}
	};
	exports.DiagComponentLogger = DiagComponentLogger;
	function logProxy(funcName, namespace, args) {
		const logger = (0, global_utils_1.getGlobal)("diag");
		if (!logger) return;
		args.unshift(namespace);
		return logger[funcName](...args);
	}
}));
//#endregion
//#region ../../node_modules/.bun/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/diag/types.js
var require_types = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.DiagLogLevel = void 0;
	(function(DiagLogLevel) {
		/** Diagnostic Logging level setting to disable all logging (except and forced logs) */
		DiagLogLevel[DiagLogLevel["NONE"] = 0] = "NONE";
		/** Identifies an error scenario */
		DiagLogLevel[DiagLogLevel["ERROR"] = 30] = "ERROR";
		/** Identifies a warning scenario */
		DiagLogLevel[DiagLogLevel["WARN"] = 50] = "WARN";
		/** General informational log message */
		DiagLogLevel[DiagLogLevel["INFO"] = 60] = "INFO";
		/** General debug log message */
		DiagLogLevel[DiagLogLevel["DEBUG"] = 70] = "DEBUG";
		/**
		* Detailed trace level logging should only be used for development, should only be set
		* in a development environment.
		*/
		DiagLogLevel[DiagLogLevel["VERBOSE"] = 80] = "VERBOSE";
		/** Used to set the logging level to include all logging */
		DiagLogLevel[DiagLogLevel["ALL"] = 9999] = "ALL";
	})(exports.DiagLogLevel || (exports.DiagLogLevel = {}));
}));
//#endregion
//#region ../../node_modules/.bun/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/diag/internal/logLevelLogger.js
var require_logLevelLogger = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.createLogLevelDiagLogger = void 0;
	var types_1 = require_types();
	function createLogLevelDiagLogger(maxLevel, logger) {
		if (maxLevel < types_1.DiagLogLevel.NONE) maxLevel = types_1.DiagLogLevel.NONE;
		else if (maxLevel > types_1.DiagLogLevel.ALL) maxLevel = types_1.DiagLogLevel.ALL;
		logger = logger || {};
		function _filterFunc(funcName, theLevel) {
			const theFunc = logger[funcName];
			if (typeof theFunc === "function" && maxLevel >= theLevel) return theFunc.bind(logger);
			return function() {};
		}
		return {
			error: _filterFunc("error", types_1.DiagLogLevel.ERROR),
			warn: _filterFunc("warn", types_1.DiagLogLevel.WARN),
			info: _filterFunc("info", types_1.DiagLogLevel.INFO),
			debug: _filterFunc("debug", types_1.DiagLogLevel.DEBUG),
			verbose: _filterFunc("verbose", types_1.DiagLogLevel.VERBOSE)
		};
	}
	exports.createLogLevelDiagLogger = createLogLevelDiagLogger;
}));
//#endregion
//#region ../../node_modules/.bun/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/api/diag.js
var require_diag = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.DiagAPI = void 0;
	var ComponentLogger_1 = require_ComponentLogger();
	var logLevelLogger_1 = require_logLevelLogger();
	var types_1 = require_types();
	var global_utils_1 = require_global_utils();
	var API_NAME = "diag";
	exports.DiagAPI = class DiagAPI {
		/**
		* Private internal constructor
		* @private
		*/
		constructor() {
			function _logProxy(funcName) {
				return function(...args) {
					const logger = (0, global_utils_1.getGlobal)("diag");
					if (!logger) return;
					return logger[funcName](...args);
				};
			}
			const self = this;
			const setLogger = (logger, optionsOrLogLevel = { logLevel: types_1.DiagLogLevel.INFO }) => {
				var _a, _b, _c;
				if (logger === self) {
					const err = /* @__PURE__ */ new Error("Cannot use diag as the logger for itself. Please use a DiagLogger implementation like ConsoleDiagLogger or a custom implementation");
					self.error((_a = err.stack) !== null && _a !== void 0 ? _a : err.message);
					return false;
				}
				if (typeof optionsOrLogLevel === "number") optionsOrLogLevel = { logLevel: optionsOrLogLevel };
				const oldLogger = (0, global_utils_1.getGlobal)("diag");
				const newLogger = (0, logLevelLogger_1.createLogLevelDiagLogger)((_b = optionsOrLogLevel.logLevel) !== null && _b !== void 0 ? _b : types_1.DiagLogLevel.INFO, logger);
				if (oldLogger && !optionsOrLogLevel.suppressOverrideMessage) {
					const stack = (_c = (/* @__PURE__ */ new Error()).stack) !== null && _c !== void 0 ? _c : "<failed to generate stacktrace>";
					oldLogger.warn(`Current logger will be overwritten from ${stack}`);
					newLogger.warn(`Current logger will overwrite one already registered from ${stack}`);
				}
				return (0, global_utils_1.registerGlobal)("diag", newLogger, self, true);
			};
			self.setLogger = setLogger;
			self.disable = () => {
				(0, global_utils_1.unregisterGlobal)(API_NAME, self);
			};
			self.createComponentLogger = (options) => {
				return new ComponentLogger_1.DiagComponentLogger(options);
			};
			self.verbose = _logProxy("verbose");
			self.debug = _logProxy("debug");
			self.info = _logProxy("info");
			self.warn = _logProxy("warn");
			self.error = _logProxy("error");
		}
		/** Get the singleton instance of the DiagAPI API */
		static instance() {
			if (!this._instance) this._instance = new DiagAPI();
			return this._instance;
		}
	};
}));
//#endregion
//#region ../../node_modules/.bun/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/baggage/internal/baggage-impl.js
var require_baggage_impl = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.BaggageImpl = void 0;
	exports.BaggageImpl = class BaggageImpl {
		constructor(entries) {
			this._entries = entries ? new Map(entries) : /* @__PURE__ */ new Map();
		}
		getEntry(key) {
			const entry = this._entries.get(key);
			if (!entry) return;
			return Object.assign({}, entry);
		}
		getAllEntries() {
			return Array.from(this._entries.entries()).map(([k, v]) => [k, v]);
		}
		setEntry(key, entry) {
			const newBaggage = new BaggageImpl(this._entries);
			newBaggage._entries.set(key, entry);
			return newBaggage;
		}
		removeEntry(key) {
			const newBaggage = new BaggageImpl(this._entries);
			newBaggage._entries.delete(key);
			return newBaggage;
		}
		removeEntries(...keys) {
			const newBaggage = new BaggageImpl(this._entries);
			for (const key of keys) newBaggage._entries.delete(key);
			return newBaggage;
		}
		clear() {
			return new BaggageImpl();
		}
	};
}));
//#endregion
//#region ../../node_modules/.bun/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/baggage/internal/symbol.js
var require_symbol = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.baggageEntryMetadataSymbol = void 0;
	/**
	* Symbol used to make BaggageEntryMetadata an opaque type
	*/
	exports.baggageEntryMetadataSymbol = Symbol("BaggageEntryMetadata");
}));
//#endregion
//#region ../../node_modules/.bun/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/baggage/utils.js
var require_utils$1 = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.baggageEntryMetadataFromString = exports.createBaggage = void 0;
	var diag_1 = require_diag();
	var baggage_impl_1 = require_baggage_impl();
	var symbol_1 = require_symbol();
	var diag = diag_1.DiagAPI.instance();
	/**
	* Create a new Baggage with optional entries
	*
	* @param entries An array of baggage entries the new baggage should contain
	*/
	function createBaggage(entries = {}) {
		return new baggage_impl_1.BaggageImpl(new Map(Object.entries(entries)));
	}
	exports.createBaggage = createBaggage;
	/**
	* Create a serializable BaggageEntryMetadata object from a string.
	*
	* @param str string metadata. Format is currently not defined by the spec and has no special meaning.
	*
	*/
	function baggageEntryMetadataFromString(str) {
		if (typeof str !== "string") {
			diag.error(`Cannot create baggage metadata from unknown type: ${typeof str}`);
			str = "";
		}
		return {
			__TYPE__: symbol_1.baggageEntryMetadataSymbol,
			toString() {
				return str;
			}
		};
	}
	exports.baggageEntryMetadataFromString = baggageEntryMetadataFromString;
}));
//#endregion
//#region ../../node_modules/.bun/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/context/context.js
var require_context$1 = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.ROOT_CONTEXT = exports.createContextKey = void 0;
	/** Get a key to uniquely identify a context value */
	function createContextKey(description) {
		return Symbol.for(description);
	}
	exports.createContextKey = createContextKey;
	/** The root context is used as the default parent context when there is no active context */
	exports.ROOT_CONTEXT = new class BaseContext {
		/**
		* Construct a new context which inherits values from an optional parent context.
		*
		* @param parentContext a context from which to inherit values
		*/
		constructor(parentContext) {
			const self = this;
			self._currentContext = parentContext ? new Map(parentContext) : /* @__PURE__ */ new Map();
			self.getValue = (key) => self._currentContext.get(key);
			self.setValue = (key, value) => {
				const context = new BaseContext(self._currentContext);
				context._currentContext.set(key, value);
				return context;
			};
			self.deleteValue = (key) => {
				const context = new BaseContext(self._currentContext);
				context._currentContext.delete(key);
				return context;
			};
		}
	}();
}));
//#endregion
//#region ../../node_modules/.bun/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/diag/consoleLogger.js
var require_consoleLogger = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.DiagConsoleLogger = void 0;
	var consoleMap = [
		{
			n: "error",
			c: "error"
		},
		{
			n: "warn",
			c: "warn"
		},
		{
			n: "info",
			c: "info"
		},
		{
			n: "debug",
			c: "debug"
		},
		{
			n: "verbose",
			c: "trace"
		}
	];
	/**
	* A simple Immutable Console based diagnostic logger which will output any messages to the Console.
	* If you want to limit the amount of logging to a specific level or lower use the
	* {@link createLogLevelDiagLogger}
	*/
	var DiagConsoleLogger = class {
		constructor() {
			function _consoleFunc(funcName) {
				return function(...args) {
					if (console) {
						let theFunc = console[funcName];
						if (typeof theFunc !== "function") theFunc = console.log;
						if (typeof theFunc === "function") return theFunc.apply(console, args);
					}
				};
			}
			for (let i = 0; i < consoleMap.length; i++) this[consoleMap[i].n] = _consoleFunc(consoleMap[i].c);
		}
	};
	exports.DiagConsoleLogger = DiagConsoleLogger;
}));
//#endregion
//#region ../../node_modules/.bun/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/metrics/NoopMeter.js
var require_NoopMeter = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.createNoopMeter = exports.NOOP_OBSERVABLE_UP_DOWN_COUNTER_METRIC = exports.NOOP_OBSERVABLE_GAUGE_METRIC = exports.NOOP_OBSERVABLE_COUNTER_METRIC = exports.NOOP_UP_DOWN_COUNTER_METRIC = exports.NOOP_HISTOGRAM_METRIC = exports.NOOP_GAUGE_METRIC = exports.NOOP_COUNTER_METRIC = exports.NOOP_METER = exports.NoopObservableUpDownCounterMetric = exports.NoopObservableGaugeMetric = exports.NoopObservableCounterMetric = exports.NoopObservableMetric = exports.NoopHistogramMetric = exports.NoopGaugeMetric = exports.NoopUpDownCounterMetric = exports.NoopCounterMetric = exports.NoopMetric = exports.NoopMeter = void 0;
	/**
	* NoopMeter is a noop implementation of the {@link Meter} interface. It reuses
	* constant NoopMetrics for all of its methods.
	*/
	var NoopMeter = class {
		constructor() {}
		/**
		* @see {@link Meter.createGauge}
		*/
		createGauge(_name, _options) {
			return exports.NOOP_GAUGE_METRIC;
		}
		/**
		* @see {@link Meter.createHistogram}
		*/
		createHistogram(_name, _options) {
			return exports.NOOP_HISTOGRAM_METRIC;
		}
		/**
		* @see {@link Meter.createCounter}
		*/
		createCounter(_name, _options) {
			return exports.NOOP_COUNTER_METRIC;
		}
		/**
		* @see {@link Meter.createUpDownCounter}
		*/
		createUpDownCounter(_name, _options) {
			return exports.NOOP_UP_DOWN_COUNTER_METRIC;
		}
		/**
		* @see {@link Meter.createObservableGauge}
		*/
		createObservableGauge(_name, _options) {
			return exports.NOOP_OBSERVABLE_GAUGE_METRIC;
		}
		/**
		* @see {@link Meter.createObservableCounter}
		*/
		createObservableCounter(_name, _options) {
			return exports.NOOP_OBSERVABLE_COUNTER_METRIC;
		}
		/**
		* @see {@link Meter.createObservableUpDownCounter}
		*/
		createObservableUpDownCounter(_name, _options) {
			return exports.NOOP_OBSERVABLE_UP_DOWN_COUNTER_METRIC;
		}
		/**
		* @see {@link Meter.addBatchObservableCallback}
		*/
		addBatchObservableCallback(_callback, _observables) {}
		/**
		* @see {@link Meter.removeBatchObservableCallback}
		*/
		removeBatchObservableCallback(_callback) {}
	};
	exports.NoopMeter = NoopMeter;
	var NoopMetric = class {};
	exports.NoopMetric = NoopMetric;
	var NoopCounterMetric = class extends NoopMetric {
		add(_value, _attributes) {}
	};
	exports.NoopCounterMetric = NoopCounterMetric;
	var NoopUpDownCounterMetric = class extends NoopMetric {
		add(_value, _attributes) {}
	};
	exports.NoopUpDownCounterMetric = NoopUpDownCounterMetric;
	var NoopGaugeMetric = class extends NoopMetric {
		record(_value, _attributes) {}
	};
	exports.NoopGaugeMetric = NoopGaugeMetric;
	var NoopHistogramMetric = class extends NoopMetric {
		record(_value, _attributes) {}
	};
	exports.NoopHistogramMetric = NoopHistogramMetric;
	var NoopObservableMetric = class {
		addCallback(_callback) {}
		removeCallback(_callback) {}
	};
	exports.NoopObservableMetric = NoopObservableMetric;
	var NoopObservableCounterMetric = class extends NoopObservableMetric {};
	exports.NoopObservableCounterMetric = NoopObservableCounterMetric;
	var NoopObservableGaugeMetric = class extends NoopObservableMetric {};
	exports.NoopObservableGaugeMetric = NoopObservableGaugeMetric;
	var NoopObservableUpDownCounterMetric = class extends NoopObservableMetric {};
	exports.NoopObservableUpDownCounterMetric = NoopObservableUpDownCounterMetric;
	exports.NOOP_METER = new NoopMeter();
	exports.NOOP_COUNTER_METRIC = new NoopCounterMetric();
	exports.NOOP_GAUGE_METRIC = new NoopGaugeMetric();
	exports.NOOP_HISTOGRAM_METRIC = new NoopHistogramMetric();
	exports.NOOP_UP_DOWN_COUNTER_METRIC = new NoopUpDownCounterMetric();
	exports.NOOP_OBSERVABLE_COUNTER_METRIC = new NoopObservableCounterMetric();
	exports.NOOP_OBSERVABLE_GAUGE_METRIC = new NoopObservableGaugeMetric();
	exports.NOOP_OBSERVABLE_UP_DOWN_COUNTER_METRIC = new NoopObservableUpDownCounterMetric();
	/**
	* Create a no-op Meter
	*/
	function createNoopMeter() {
		return exports.NOOP_METER;
	}
	exports.createNoopMeter = createNoopMeter;
}));
//#endregion
//#region ../../node_modules/.bun/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/metrics/Metric.js
var require_Metric = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.ValueType = void 0;
	(function(ValueType) {
		ValueType[ValueType["INT"] = 0] = "INT";
		ValueType[ValueType["DOUBLE"] = 1] = "DOUBLE";
	})(exports.ValueType || (exports.ValueType = {}));
}));
//#endregion
//#region ../../node_modules/.bun/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/propagation/TextMapPropagator.js
var require_TextMapPropagator = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.defaultTextMapSetter = exports.defaultTextMapGetter = void 0;
	exports.defaultTextMapGetter = {
		get(carrier, key) {
			if (carrier == null) return;
			return carrier[key];
		},
		keys(carrier) {
			if (carrier == null) return [];
			return Object.keys(carrier);
		}
	};
	exports.defaultTextMapSetter = { set(carrier, key, value) {
		if (carrier == null) return;
		carrier[key] = value;
	} };
}));
//#endregion
//#region ../../node_modules/.bun/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/context/NoopContextManager.js
var require_NoopContextManager = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.NoopContextManager = void 0;
	var context_1 = require_context$1();
	var NoopContextManager = class {
		active() {
			return context_1.ROOT_CONTEXT;
		}
		with(_context, fn, thisArg, ...args) {
			return fn.call(thisArg, ...args);
		}
		bind(_context, target) {
			return target;
		}
		enable() {
			return this;
		}
		disable() {
			return this;
		}
	};
	exports.NoopContextManager = NoopContextManager;
}));
//#endregion
//#region ../../node_modules/.bun/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/api/context.js
var require_context = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.ContextAPI = void 0;
	var NoopContextManager_1 = require_NoopContextManager();
	var global_utils_1 = require_global_utils();
	var diag_1 = require_diag();
	var API_NAME = "context";
	var NOOP_CONTEXT_MANAGER = new NoopContextManager_1.NoopContextManager();
	exports.ContextAPI = class ContextAPI {
		/** Empty private constructor prevents end users from constructing a new instance of the API */
		constructor() {}
		/** Get the singleton instance of the Context API */
		static getInstance() {
			if (!this._instance) this._instance = new ContextAPI();
			return this._instance;
		}
		/**
		* Set the current context manager.
		*
		* @returns true if the context manager was successfully registered, else false
		*/
		setGlobalContextManager(contextManager) {
			return (0, global_utils_1.registerGlobal)(API_NAME, contextManager, diag_1.DiagAPI.instance());
		}
		/**
		* Get the currently active context
		*/
		active() {
			return this._getContextManager().active();
		}
		/**
		* Execute a function with an active context
		*
		* @param context context to be active during function execution
		* @param fn function to execute in a context
		* @param thisArg optional receiver to be used for calling fn
		* @param args optional arguments forwarded to fn
		*/
		with(context, fn, thisArg, ...args) {
			return this._getContextManager().with(context, fn, thisArg, ...args);
		}
		/**
		* Bind a context to a target function or event emitter
		*
		* @param context context to bind to the event emitter or function. Defaults to the currently active context
		* @param target function or event emitter to bind
		*/
		bind(context, target) {
			return this._getContextManager().bind(context, target);
		}
		_getContextManager() {
			return (0, global_utils_1.getGlobal)(API_NAME) || NOOP_CONTEXT_MANAGER;
		}
		/** Disable and remove the global context manager */
		disable() {
			this._getContextManager().disable();
			(0, global_utils_1.unregisterGlobal)(API_NAME, diag_1.DiagAPI.instance());
		}
	};
}));
//#endregion
//#region ../../node_modules/.bun/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/trace/trace_flags.js
var require_trace_flags = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.TraceFlags = void 0;
	(function(TraceFlags) {
		/** Represents no flag set. */
		TraceFlags[TraceFlags["NONE"] = 0] = "NONE";
		/** Bit to represent whether trace is sampled in trace flags. */
		TraceFlags[TraceFlags["SAMPLED"] = 1] = "SAMPLED";
	})(exports.TraceFlags || (exports.TraceFlags = {}));
}));
//#endregion
//#region ../../node_modules/.bun/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/trace/invalid-span-constants.js
var require_invalid_span_constants = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.INVALID_SPAN_CONTEXT = exports.INVALID_TRACEID = exports.INVALID_SPANID = void 0;
	var trace_flags_1 = require_trace_flags();
	exports.INVALID_SPANID = "0000000000000000";
	exports.INVALID_TRACEID = "00000000000000000000000000000000";
	exports.INVALID_SPAN_CONTEXT = {
		traceId: exports.INVALID_TRACEID,
		spanId: exports.INVALID_SPANID,
		traceFlags: trace_flags_1.TraceFlags.NONE
	};
}));
//#endregion
//#region ../../node_modules/.bun/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/trace/NonRecordingSpan.js
var require_NonRecordingSpan = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.NonRecordingSpan = void 0;
	var invalid_span_constants_1 = require_invalid_span_constants();
	/**
	* The NonRecordingSpan is the default {@link Span} that is used when no Span
	* implementation is available. All operations are no-op including context
	* propagation.
	*/
	var NonRecordingSpan = class {
		constructor(_spanContext = invalid_span_constants_1.INVALID_SPAN_CONTEXT) {
			this._spanContext = _spanContext;
		}
		spanContext() {
			return this._spanContext;
		}
		setAttribute(_key, _value) {
			return this;
		}
		setAttributes(_attributes) {
			return this;
		}
		addEvent(_name, _attributes) {
			return this;
		}
		addLink(_link) {
			return this;
		}
		addLinks(_links) {
			return this;
		}
		setStatus(_status) {
			return this;
		}
		updateName(_name) {
			return this;
		}
		end(_endTime) {}
		isRecording() {
			return false;
		}
		recordException(_exception, _time) {}
	};
	exports.NonRecordingSpan = NonRecordingSpan;
}));
//#endregion
//#region ../../node_modules/.bun/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/trace/context-utils.js
var require_context_utils = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.getSpanContext = exports.setSpanContext = exports.deleteSpan = exports.setSpan = exports.getActiveSpan = exports.getSpan = void 0;
	var context_1 = require_context$1();
	var NonRecordingSpan_1 = require_NonRecordingSpan();
	var context_2 = require_context();
	/**
	* span key
	*/
	var SPAN_KEY = (0, context_1.createContextKey)("OpenTelemetry Context Key SPAN");
	/**
	* Return the span if one exists
	*
	* @param context context to get span from
	*/
	function getSpan(context) {
		return context.getValue(SPAN_KEY) || void 0;
	}
	exports.getSpan = getSpan;
	/**
	* Gets the span from the current context, if one exists.
	*/
	function getActiveSpan() {
		return getSpan(context_2.ContextAPI.getInstance().active());
	}
	exports.getActiveSpan = getActiveSpan;
	/**
	* Set the span on a context
	*
	* @param context context to use as parent
	* @param span span to set active
	*/
	function setSpan(context, span) {
		return context.setValue(SPAN_KEY, span);
	}
	exports.setSpan = setSpan;
	/**
	* Remove current span stored in the context
	*
	* @param context context to delete span from
	*/
	function deleteSpan(context) {
		return context.deleteValue(SPAN_KEY);
	}
	exports.deleteSpan = deleteSpan;
	/**
	* Wrap span context in a NoopSpan and set as span in a new
	* context
	*
	* @param context context to set active span on
	* @param spanContext span context to be wrapped
	*/
	function setSpanContext(context, spanContext) {
		return setSpan(context, new NonRecordingSpan_1.NonRecordingSpan(spanContext));
	}
	exports.setSpanContext = setSpanContext;
	/**
	* Get the span context of the span if it exists.
	*
	* @param context context to get values from
	*/
	function getSpanContext(context) {
		var _a;
		return (_a = getSpan(context)) === null || _a === void 0 ? void 0 : _a.spanContext();
	}
	exports.getSpanContext = getSpanContext;
}));
//#endregion
//#region ../../node_modules/.bun/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/trace/spancontext-utils.js
var require_spancontext_utils = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.wrapSpanContext = exports.isSpanContextValid = exports.isValidSpanId = exports.isValidTraceId = void 0;
	var invalid_span_constants_1 = require_invalid_span_constants();
	var NonRecordingSpan_1 = require_NonRecordingSpan();
	var VALID_TRACEID_REGEX = /^([0-9a-f]{32})$/i;
	var VALID_SPANID_REGEX = /^[0-9a-f]{16}$/i;
	function isValidTraceId(traceId) {
		return VALID_TRACEID_REGEX.test(traceId) && traceId !== invalid_span_constants_1.INVALID_TRACEID;
	}
	exports.isValidTraceId = isValidTraceId;
	function isValidSpanId(spanId) {
		return VALID_SPANID_REGEX.test(spanId) && spanId !== invalid_span_constants_1.INVALID_SPANID;
	}
	exports.isValidSpanId = isValidSpanId;
	/**
	* Returns true if this {@link SpanContext} is valid.
	* @return true if this {@link SpanContext} is valid.
	*/
	function isSpanContextValid(spanContext) {
		return isValidTraceId(spanContext.traceId) && isValidSpanId(spanContext.spanId);
	}
	exports.isSpanContextValid = isSpanContextValid;
	/**
	* Wrap the given {@link SpanContext} in a new non-recording {@link Span}
	*
	* @param spanContext span context to be wrapped
	* @returns a new non-recording {@link Span} with the provided context
	*/
	function wrapSpanContext(spanContext) {
		return new NonRecordingSpan_1.NonRecordingSpan(spanContext);
	}
	exports.wrapSpanContext = wrapSpanContext;
}));
//#endregion
//#region ../../node_modules/.bun/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/trace/NoopTracer.js
var require_NoopTracer = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.NoopTracer = void 0;
	var context_1 = require_context();
	var context_utils_1 = require_context_utils();
	var NonRecordingSpan_1 = require_NonRecordingSpan();
	var spancontext_utils_1 = require_spancontext_utils();
	var contextApi = context_1.ContextAPI.getInstance();
	/**
	* No-op implementations of {@link Tracer}.
	*/
	var NoopTracer = class {
		startSpan(name, options, context = contextApi.active()) {
			if (Boolean(options === null || options === void 0 ? void 0 : options.root)) return new NonRecordingSpan_1.NonRecordingSpan();
			const parentFromContext = context && (0, context_utils_1.getSpanContext)(context);
			if (isSpanContext(parentFromContext) && (0, spancontext_utils_1.isSpanContextValid)(parentFromContext)) return new NonRecordingSpan_1.NonRecordingSpan(parentFromContext);
			else return new NonRecordingSpan_1.NonRecordingSpan();
		}
		startActiveSpan(name, arg2, arg3, arg4) {
			let opts;
			let ctx;
			let fn;
			if (arguments.length < 2) return;
			else if (arguments.length === 2) fn = arg2;
			else if (arguments.length === 3) {
				opts = arg2;
				fn = arg3;
			} else {
				opts = arg2;
				ctx = arg3;
				fn = arg4;
			}
			const parentContext = ctx !== null && ctx !== void 0 ? ctx : contextApi.active();
			const span = this.startSpan(name, opts, parentContext);
			const contextWithSpanSet = (0, context_utils_1.setSpan)(parentContext, span);
			return contextApi.with(contextWithSpanSet, fn, void 0, span);
		}
	};
	exports.NoopTracer = NoopTracer;
	function isSpanContext(spanContext) {
		return typeof spanContext === "object" && typeof spanContext["spanId"] === "string" && typeof spanContext["traceId"] === "string" && typeof spanContext["traceFlags"] === "number";
	}
}));
//#endregion
//#region ../../node_modules/.bun/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/trace/ProxyTracer.js
var require_ProxyTracer = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.ProxyTracer = void 0;
	var NOOP_TRACER = new (require_NoopTracer()).NoopTracer();
	/**
	* Proxy tracer provided by the proxy tracer provider
	*/
	var ProxyTracer = class {
		constructor(_provider, name, version, options) {
			this._provider = _provider;
			this.name = name;
			this.version = version;
			this.options = options;
		}
		startSpan(name, options, context) {
			return this._getTracer().startSpan(name, options, context);
		}
		startActiveSpan(_name, _options, _context, _fn) {
			const tracer = this._getTracer();
			return Reflect.apply(tracer.startActiveSpan, tracer, arguments);
		}
		/**
		* Try to get a tracer from the proxy tracer provider.
		* If the proxy tracer provider has no delegate, return a noop tracer.
		*/
		_getTracer() {
			if (this._delegate) return this._delegate;
			const tracer = this._provider.getDelegateTracer(this.name, this.version, this.options);
			if (!tracer) return NOOP_TRACER;
			this._delegate = tracer;
			return this._delegate;
		}
	};
	exports.ProxyTracer = ProxyTracer;
}));
//#endregion
//#region ../../node_modules/.bun/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/trace/NoopTracerProvider.js
var require_NoopTracerProvider = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.NoopTracerProvider = void 0;
	var NoopTracer_1 = require_NoopTracer();
	/**
	* An implementation of the {@link TracerProvider} which returns an impotent
	* Tracer for all calls to `getTracer`.
	*
	* All operations are no-op.
	*/
	var NoopTracerProvider = class {
		getTracer(_name, _version, _options) {
			return new NoopTracer_1.NoopTracer();
		}
	};
	exports.NoopTracerProvider = NoopTracerProvider;
}));
//#endregion
//#region ../../node_modules/.bun/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/trace/ProxyTracerProvider.js
var require_ProxyTracerProvider = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.ProxyTracerProvider = void 0;
	var ProxyTracer_1 = require_ProxyTracer();
	var NOOP_TRACER_PROVIDER = new (require_NoopTracerProvider()).NoopTracerProvider();
	/**
	* Tracer provider which provides {@link ProxyTracer}s.
	*
	* Before a delegate is set, tracers provided are NoOp.
	*   When a delegate is set, traces are provided from the delegate.
	*   When a delegate is set after tracers have already been provided,
	*   all tracers already provided will use the provided delegate implementation.
	*/
	var ProxyTracerProvider = class {
		/**
		* Get a {@link ProxyTracer}
		*/
		getTracer(name, version, options) {
			var _a;
			return (_a = this.getDelegateTracer(name, version, options)) !== null && _a !== void 0 ? _a : new ProxyTracer_1.ProxyTracer(this, name, version, options);
		}
		getDelegate() {
			var _a;
			return (_a = this._delegate) !== null && _a !== void 0 ? _a : NOOP_TRACER_PROVIDER;
		}
		/**
		* Set the delegate tracer provider
		*/
		setDelegate(delegate) {
			this._delegate = delegate;
		}
		getDelegateTracer(name, version, options) {
			var _a;
			return (_a = this._delegate) === null || _a === void 0 ? void 0 : _a.getTracer(name, version, options);
		}
	};
	exports.ProxyTracerProvider = ProxyTracerProvider;
}));
//#endregion
//#region ../../node_modules/.bun/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/trace/SamplingResult.js
var require_SamplingResult = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.SamplingDecision = void 0;
	(function(SamplingDecision) {
		/**
		* `Span.isRecording() === false`, span will not be recorded and all events
		* and attributes will be dropped.
		*/
		SamplingDecision[SamplingDecision["NOT_RECORD"] = 0] = "NOT_RECORD";
		/**
		* `Span.isRecording() === true`, but `Sampled` flag in {@link TraceFlags}
		* MUST NOT be set.
		*/
		SamplingDecision[SamplingDecision["RECORD"] = 1] = "RECORD";
		/**
		* `Span.isRecording() === true` AND `Sampled` flag in {@link TraceFlags}
		* MUST be set.
		*/
		SamplingDecision[SamplingDecision["RECORD_AND_SAMPLED"] = 2] = "RECORD_AND_SAMPLED";
	})(exports.SamplingDecision || (exports.SamplingDecision = {}));
}));
//#endregion
//#region ../../node_modules/.bun/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/trace/span_kind.js
var require_span_kind = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.SpanKind = void 0;
	(function(SpanKind) {
		/** Default value. Indicates that the span is used internally. */
		SpanKind[SpanKind["INTERNAL"] = 0] = "INTERNAL";
		/**
		* Indicates that the span covers server-side handling of an RPC or other
		* remote request.
		*/
		SpanKind[SpanKind["SERVER"] = 1] = "SERVER";
		/**
		* Indicates that the span covers the client-side wrapper around an RPC or
		* other remote request.
		*/
		SpanKind[SpanKind["CLIENT"] = 2] = "CLIENT";
		/**
		* Indicates that the span describes producer sending a message to a
		* broker. Unlike client and server, there is no direct critical path latency
		* relationship between producer and consumer spans.
		*/
		SpanKind[SpanKind["PRODUCER"] = 3] = "PRODUCER";
		/**
		* Indicates that the span describes consumer receiving a message from a
		* broker. Unlike client and server, there is no direct critical path latency
		* relationship between producer and consumer spans.
		*/
		SpanKind[SpanKind["CONSUMER"] = 4] = "CONSUMER";
	})(exports.SpanKind || (exports.SpanKind = {}));
}));
//#endregion
//#region ../../node_modules/.bun/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/trace/status.js
var require_status = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.SpanStatusCode = void 0;
	(function(SpanStatusCode) {
		/**
		* The default status.
		*/
		SpanStatusCode[SpanStatusCode["UNSET"] = 0] = "UNSET";
		/**
		* The operation has been validated by an Application developer or
		* Operator to have completed successfully.
		*/
		SpanStatusCode[SpanStatusCode["OK"] = 1] = "OK";
		/**
		* The operation contains an error.
		*/
		SpanStatusCode[SpanStatusCode["ERROR"] = 2] = "ERROR";
	})(exports.SpanStatusCode || (exports.SpanStatusCode = {}));
}));
//#endregion
//#region ../../node_modules/.bun/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/trace/internal/tracestate-validators.js
var require_tracestate_validators = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.validateValue = exports.validateKey = void 0;
	var VALID_KEY_CHAR_RANGE = "[_0-9a-z-*/]";
	var VALID_KEY_REGEX = new RegExp(`^(?:${`[a-z]${VALID_KEY_CHAR_RANGE}{0,255}`}|${`[a-z0-9]${VALID_KEY_CHAR_RANGE}{0,240}@[a-z]${VALID_KEY_CHAR_RANGE}{0,13}`})$`);
	var VALID_VALUE_BASE_REGEX = /^[ -~]{0,255}[!-~]$/;
	var INVALID_VALUE_COMMA_EQUAL_REGEX = /,|=/;
	/**
	* Key is opaque string up to 256 characters printable. It MUST begin with a
	* lowercase letter, and can only contain lowercase letters a-z, digits 0-9,
	* underscores _, dashes -, asterisks *, and forward slashes /.
	* For multi-tenant vendor scenarios, an at sign (@) can be used to prefix the
	* vendor name. Vendors SHOULD set the tenant ID at the beginning of the key.
	* see https://www.w3.org/TR/trace-context/#key
	*/
	function validateKey(key) {
		return VALID_KEY_REGEX.test(key);
	}
	exports.validateKey = validateKey;
	/**
	* Value is opaque string up to 256 characters printable ASCII RFC0020
	* characters (i.e., the range 0x20 to 0x7E) except comma , and =.
	*/
	function validateValue(value) {
		return VALID_VALUE_BASE_REGEX.test(value) && !INVALID_VALUE_COMMA_EQUAL_REGEX.test(value);
	}
	exports.validateValue = validateValue;
}));
//#endregion
//#region ../../node_modules/.bun/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/trace/internal/tracestate-impl.js
var require_tracestate_impl = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.TraceStateImpl = void 0;
	var tracestate_validators_1 = require_tracestate_validators();
	var MAX_TRACE_STATE_ITEMS = 32;
	var MAX_TRACE_STATE_LEN = 512;
	var LIST_MEMBERS_SEPARATOR = ",";
	var LIST_MEMBER_KEY_VALUE_SPLITTER = "=";
	exports.TraceStateImpl = class TraceStateImpl {
		constructor(rawTraceState) {
			this._internalState = /* @__PURE__ */ new Map();
			if (rawTraceState) this._parse(rawTraceState);
		}
		set(key, value) {
			const traceState = this._clone();
			if (traceState._internalState.has(key)) traceState._internalState.delete(key);
			traceState._internalState.set(key, value);
			return traceState;
		}
		unset(key) {
			const traceState = this._clone();
			traceState._internalState.delete(key);
			return traceState;
		}
		get(key) {
			return this._internalState.get(key);
		}
		serialize() {
			return this._keys().reduce((agg, key) => {
				agg.push(key + LIST_MEMBER_KEY_VALUE_SPLITTER + this.get(key));
				return agg;
			}, []).join(LIST_MEMBERS_SEPARATOR);
		}
		_parse(rawTraceState) {
			if (rawTraceState.length > MAX_TRACE_STATE_LEN) return;
			this._internalState = rawTraceState.split(LIST_MEMBERS_SEPARATOR).reverse().reduce((agg, part) => {
				const listMember = part.trim();
				const i = listMember.indexOf(LIST_MEMBER_KEY_VALUE_SPLITTER);
				if (i !== -1) {
					const key = listMember.slice(0, i);
					const value = listMember.slice(i + 1, part.length);
					if ((0, tracestate_validators_1.validateKey)(key) && (0, tracestate_validators_1.validateValue)(value)) agg.set(key, value);
				}
				return agg;
			}, /* @__PURE__ */ new Map());
			if (this._internalState.size > MAX_TRACE_STATE_ITEMS) this._internalState = new Map(Array.from(this._internalState.entries()).reverse().slice(0, MAX_TRACE_STATE_ITEMS));
		}
		_keys() {
			return Array.from(this._internalState.keys()).reverse();
		}
		_clone() {
			const traceState = new TraceStateImpl();
			traceState._internalState = new Map(this._internalState);
			return traceState;
		}
	};
}));
//#endregion
//#region ../../node_modules/.bun/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/trace/internal/utils.js
var require_utils = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.createTraceState = void 0;
	var tracestate_impl_1 = require_tracestate_impl();
	function createTraceState(rawTraceState) {
		return new tracestate_impl_1.TraceStateImpl(rawTraceState);
	}
	exports.createTraceState = createTraceState;
}));
//#endregion
//#region ../../node_modules/.bun/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/context-api.js
var require_context_api = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.context = void 0;
	/** Entrypoint for context API */
	exports.context = require_context().ContextAPI.getInstance();
}));
//#endregion
//#region ../../node_modules/.bun/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/diag-api.js
var require_diag_api = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.diag = void 0;
	/**
	* Entrypoint for Diag API.
	* Defines Diagnostic handler used for internal diagnostic logging operations.
	* The default provides a Noop DiagLogger implementation which may be changed via the
	* diag.setLogger(logger: DiagLogger) function.
	*/
	exports.diag = require_diag().DiagAPI.instance();
}));
//#endregion
//#region ../../node_modules/.bun/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/metrics/NoopMeterProvider.js
var require_NoopMeterProvider = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.NOOP_METER_PROVIDER = exports.NoopMeterProvider = void 0;
	var NoopMeter_1 = require_NoopMeter();
	/**
	* An implementation of the {@link MeterProvider} which returns an impotent Meter
	* for all calls to `getMeter`
	*/
	var NoopMeterProvider = class {
		getMeter(_name, _version, _options) {
			return NoopMeter_1.NOOP_METER;
		}
	};
	exports.NoopMeterProvider = NoopMeterProvider;
	exports.NOOP_METER_PROVIDER = new NoopMeterProvider();
}));
//#endregion
//#region ../../node_modules/.bun/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/api/metrics.js
var require_metrics = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.MetricsAPI = void 0;
	var NoopMeterProvider_1 = require_NoopMeterProvider();
	var global_utils_1 = require_global_utils();
	var diag_1 = require_diag();
	var API_NAME = "metrics";
	exports.MetricsAPI = class MetricsAPI {
		/** Empty private constructor prevents end users from constructing a new instance of the API */
		constructor() {}
		/** Get the singleton instance of the Metrics API */
		static getInstance() {
			if (!this._instance) this._instance = new MetricsAPI();
			return this._instance;
		}
		/**
		* Set the current global meter provider.
		* Returns true if the meter provider was successfully registered, else false.
		*/
		setGlobalMeterProvider(provider) {
			return (0, global_utils_1.registerGlobal)(API_NAME, provider, diag_1.DiagAPI.instance());
		}
		/**
		* Returns the global meter provider.
		*/
		getMeterProvider() {
			return (0, global_utils_1.getGlobal)(API_NAME) || NoopMeterProvider_1.NOOP_METER_PROVIDER;
		}
		/**
		* Returns a meter from the global meter provider.
		*/
		getMeter(name, version, options) {
			return this.getMeterProvider().getMeter(name, version, options);
		}
		/** Remove the global meter provider */
		disable() {
			(0, global_utils_1.unregisterGlobal)(API_NAME, diag_1.DiagAPI.instance());
		}
	};
}));
//#endregion
//#region ../../node_modules/.bun/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/metrics-api.js
var require_metrics_api = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.metrics = void 0;
	/** Entrypoint for metrics API */
	exports.metrics = require_metrics().MetricsAPI.getInstance();
}));
//#endregion
//#region ../../node_modules/.bun/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/propagation/NoopTextMapPropagator.js
var require_NoopTextMapPropagator = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.NoopTextMapPropagator = void 0;
	/**
	* No-op implementations of {@link TextMapPropagator}.
	*/
	var NoopTextMapPropagator = class {
		/** Noop inject function does nothing */
		inject(_context, _carrier) {}
		/** Noop extract function does nothing and returns the input context */
		extract(context, _carrier) {
			return context;
		}
		fields() {
			return [];
		}
	};
	exports.NoopTextMapPropagator = NoopTextMapPropagator;
}));
//#endregion
//#region ../../node_modules/.bun/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/baggage/context-helpers.js
var require_context_helpers = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.deleteBaggage = exports.setBaggage = exports.getActiveBaggage = exports.getBaggage = void 0;
	var context_1 = require_context();
	/**
	* Baggage key
	*/
	var BAGGAGE_KEY = (0, require_context$1().createContextKey)("OpenTelemetry Baggage Key");
	/**
	* Retrieve the current baggage from the given context
	*
	* @param {Context} Context that manage all context values
	* @returns {Baggage} Extracted baggage from the context
	*/
	function getBaggage(context) {
		return context.getValue(BAGGAGE_KEY) || void 0;
	}
	exports.getBaggage = getBaggage;
	/**
	* Retrieve the current baggage from the active/current context
	*
	* @returns {Baggage} Extracted baggage from the context
	*/
	function getActiveBaggage() {
		return getBaggage(context_1.ContextAPI.getInstance().active());
	}
	exports.getActiveBaggage = getActiveBaggage;
	/**
	* Store a baggage in the given context
	*
	* @param {Context} Context that manage all context values
	* @param {Baggage} baggage that will be set in the actual context
	*/
	function setBaggage(context, baggage) {
		return context.setValue(BAGGAGE_KEY, baggage);
	}
	exports.setBaggage = setBaggage;
	/**
	* Delete the baggage stored in the given context
	*
	* @param {Context} Context that manage all context values
	*/
	function deleteBaggage(context) {
		return context.deleteValue(BAGGAGE_KEY);
	}
	exports.deleteBaggage = deleteBaggage;
}));
//#endregion
//#region ../../node_modules/.bun/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/api/propagation.js
var require_propagation = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.PropagationAPI = void 0;
	var global_utils_1 = require_global_utils();
	var NoopTextMapPropagator_1 = require_NoopTextMapPropagator();
	var TextMapPropagator_1 = require_TextMapPropagator();
	var context_helpers_1 = require_context_helpers();
	var utils_1 = require_utils$1();
	var diag_1 = require_diag();
	var API_NAME = "propagation";
	var NOOP_TEXT_MAP_PROPAGATOR = new NoopTextMapPropagator_1.NoopTextMapPropagator();
	exports.PropagationAPI = class PropagationAPI {
		/** Empty private constructor prevents end users from constructing a new instance of the API */
		constructor() {
			this.createBaggage = utils_1.createBaggage;
			this.getBaggage = context_helpers_1.getBaggage;
			this.getActiveBaggage = context_helpers_1.getActiveBaggage;
			this.setBaggage = context_helpers_1.setBaggage;
			this.deleteBaggage = context_helpers_1.deleteBaggage;
		}
		/** Get the singleton instance of the Propagator API */
		static getInstance() {
			if (!this._instance) this._instance = new PropagationAPI();
			return this._instance;
		}
		/**
		* Set the current propagator.
		*
		* @returns true if the propagator was successfully registered, else false
		*/
		setGlobalPropagator(propagator) {
			return (0, global_utils_1.registerGlobal)(API_NAME, propagator, diag_1.DiagAPI.instance());
		}
		/**
		* Inject context into a carrier to be propagated inter-process
		*
		* @param context Context carrying tracing data to inject
		* @param carrier carrier to inject context into
		* @param setter Function used to set values on the carrier
		*/
		inject(context, carrier, setter = TextMapPropagator_1.defaultTextMapSetter) {
			return this._getGlobalPropagator().inject(context, carrier, setter);
		}
		/**
		* Extract context from a carrier
		*
		* @param context Context which the newly created context will inherit from
		* @param carrier Carrier to extract context from
		* @param getter Function used to extract keys from a carrier
		*/
		extract(context, carrier, getter = TextMapPropagator_1.defaultTextMapGetter) {
			return this._getGlobalPropagator().extract(context, carrier, getter);
		}
		/**
		* Return a list of all fields which may be used by the propagator.
		*/
		fields() {
			return this._getGlobalPropagator().fields();
		}
		/** Remove the global propagator */
		disable() {
			(0, global_utils_1.unregisterGlobal)(API_NAME, diag_1.DiagAPI.instance());
		}
		_getGlobalPropagator() {
			return (0, global_utils_1.getGlobal)(API_NAME) || NOOP_TEXT_MAP_PROPAGATOR;
		}
	};
}));
//#endregion
//#region ../../node_modules/.bun/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/propagation-api.js
var require_propagation_api = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.propagation = void 0;
	/** Entrypoint for propagation API */
	exports.propagation = require_propagation().PropagationAPI.getInstance();
}));
//#endregion
//#region ../../node_modules/.bun/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/api/trace.js
var require_trace = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.TraceAPI = void 0;
	var global_utils_1 = require_global_utils();
	var ProxyTracerProvider_1 = require_ProxyTracerProvider();
	var spancontext_utils_1 = require_spancontext_utils();
	var context_utils_1 = require_context_utils();
	var diag_1 = require_diag();
	var API_NAME = "trace";
	exports.TraceAPI = class TraceAPI {
		/** Empty private constructor prevents end users from constructing a new instance of the API */
		constructor() {
			this._proxyTracerProvider = new ProxyTracerProvider_1.ProxyTracerProvider();
			this.wrapSpanContext = spancontext_utils_1.wrapSpanContext;
			this.isSpanContextValid = spancontext_utils_1.isSpanContextValid;
			this.deleteSpan = context_utils_1.deleteSpan;
			this.getSpan = context_utils_1.getSpan;
			this.getActiveSpan = context_utils_1.getActiveSpan;
			this.getSpanContext = context_utils_1.getSpanContext;
			this.setSpan = context_utils_1.setSpan;
			this.setSpanContext = context_utils_1.setSpanContext;
		}
		/** Get the singleton instance of the Trace API */
		static getInstance() {
			if (!this._instance) this._instance = new TraceAPI();
			return this._instance;
		}
		/**
		* Set the current global tracer.
		*
		* @returns true if the tracer provider was successfully registered, else false
		*/
		setGlobalTracerProvider(provider) {
			const success = (0, global_utils_1.registerGlobal)(API_NAME, this._proxyTracerProvider, diag_1.DiagAPI.instance());
			if (success) this._proxyTracerProvider.setDelegate(provider);
			return success;
		}
		/**
		* Returns the global tracer provider.
		*/
		getTracerProvider() {
			return (0, global_utils_1.getGlobal)(API_NAME) || this._proxyTracerProvider;
		}
		/**
		* Returns a tracer from the global tracer provider.
		*/
		getTracer(name, version) {
			return this.getTracerProvider().getTracer(name, version);
		}
		/** Remove the global tracer provider */
		disable() {
			(0, global_utils_1.unregisterGlobal)(API_NAME, diag_1.DiagAPI.instance());
			this._proxyTracerProvider = new ProxyTracerProvider_1.ProxyTracerProvider();
		}
	};
}));
//#endregion
//#region ../../node_modules/.bun/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/trace-api.js
var require_trace_api = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.trace = void 0;
	/** Entrypoint for trace API */
	exports.trace = require_trace().TraceAPI.getInstance();
}));
//#endregion
//#region ../../node_modules/.bun/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/src/index.js
var require_src = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.trace = exports.propagation = exports.metrics = exports.diag = exports.context = exports.INVALID_SPAN_CONTEXT = exports.INVALID_TRACEID = exports.INVALID_SPANID = exports.isValidSpanId = exports.isValidTraceId = exports.isSpanContextValid = exports.createTraceState = exports.TraceFlags = exports.SpanStatusCode = exports.SpanKind = exports.SamplingDecision = exports.ProxyTracerProvider = exports.ProxyTracer = exports.defaultTextMapSetter = exports.defaultTextMapGetter = exports.ValueType = exports.createNoopMeter = exports.DiagLogLevel = exports.DiagConsoleLogger = exports.ROOT_CONTEXT = exports.createContextKey = exports.baggageEntryMetadataFromString = void 0;
	var utils_1 = require_utils$1();
	Object.defineProperty(exports, "baggageEntryMetadataFromString", {
		enumerable: true,
		get: function() {
			return utils_1.baggageEntryMetadataFromString;
		}
	});
	var context_1 = require_context$1();
	Object.defineProperty(exports, "createContextKey", {
		enumerable: true,
		get: function() {
			return context_1.createContextKey;
		}
	});
	Object.defineProperty(exports, "ROOT_CONTEXT", {
		enumerable: true,
		get: function() {
			return context_1.ROOT_CONTEXT;
		}
	});
	var consoleLogger_1 = require_consoleLogger();
	Object.defineProperty(exports, "DiagConsoleLogger", {
		enumerable: true,
		get: function() {
			return consoleLogger_1.DiagConsoleLogger;
		}
	});
	var types_1 = require_types();
	Object.defineProperty(exports, "DiagLogLevel", {
		enumerable: true,
		get: function() {
			return types_1.DiagLogLevel;
		}
	});
	var NoopMeter_1 = require_NoopMeter();
	Object.defineProperty(exports, "createNoopMeter", {
		enumerable: true,
		get: function() {
			return NoopMeter_1.createNoopMeter;
		}
	});
	var Metric_1 = require_Metric();
	Object.defineProperty(exports, "ValueType", {
		enumerable: true,
		get: function() {
			return Metric_1.ValueType;
		}
	});
	var TextMapPropagator_1 = require_TextMapPropagator();
	Object.defineProperty(exports, "defaultTextMapGetter", {
		enumerable: true,
		get: function() {
			return TextMapPropagator_1.defaultTextMapGetter;
		}
	});
	Object.defineProperty(exports, "defaultTextMapSetter", {
		enumerable: true,
		get: function() {
			return TextMapPropagator_1.defaultTextMapSetter;
		}
	});
	var ProxyTracer_1 = require_ProxyTracer();
	Object.defineProperty(exports, "ProxyTracer", {
		enumerable: true,
		get: function() {
			return ProxyTracer_1.ProxyTracer;
		}
	});
	var ProxyTracerProvider_1 = require_ProxyTracerProvider();
	Object.defineProperty(exports, "ProxyTracerProvider", {
		enumerable: true,
		get: function() {
			return ProxyTracerProvider_1.ProxyTracerProvider;
		}
	});
	var SamplingResult_1 = require_SamplingResult();
	Object.defineProperty(exports, "SamplingDecision", {
		enumerable: true,
		get: function() {
			return SamplingResult_1.SamplingDecision;
		}
	});
	var span_kind_1 = require_span_kind();
	Object.defineProperty(exports, "SpanKind", {
		enumerable: true,
		get: function() {
			return span_kind_1.SpanKind;
		}
	});
	var status_1 = require_status();
	Object.defineProperty(exports, "SpanStatusCode", {
		enumerable: true,
		get: function() {
			return status_1.SpanStatusCode;
		}
	});
	var trace_flags_1 = require_trace_flags();
	Object.defineProperty(exports, "TraceFlags", {
		enumerable: true,
		get: function() {
			return trace_flags_1.TraceFlags;
		}
	});
	var utils_2 = require_utils();
	Object.defineProperty(exports, "createTraceState", {
		enumerable: true,
		get: function() {
			return utils_2.createTraceState;
		}
	});
	var spancontext_utils_1 = require_spancontext_utils();
	Object.defineProperty(exports, "isSpanContextValid", {
		enumerable: true,
		get: function() {
			return spancontext_utils_1.isSpanContextValid;
		}
	});
	Object.defineProperty(exports, "isValidTraceId", {
		enumerable: true,
		get: function() {
			return spancontext_utils_1.isValidTraceId;
		}
	});
	Object.defineProperty(exports, "isValidSpanId", {
		enumerable: true,
		get: function() {
			return spancontext_utils_1.isValidSpanId;
		}
	});
	var invalid_span_constants_1 = require_invalid_span_constants();
	Object.defineProperty(exports, "INVALID_SPANID", {
		enumerable: true,
		get: function() {
			return invalid_span_constants_1.INVALID_SPANID;
		}
	});
	Object.defineProperty(exports, "INVALID_TRACEID", {
		enumerable: true,
		get: function() {
			return invalid_span_constants_1.INVALID_TRACEID;
		}
	});
	Object.defineProperty(exports, "INVALID_SPAN_CONTEXT", {
		enumerable: true,
		get: function() {
			return invalid_span_constants_1.INVALID_SPAN_CONTEXT;
		}
	});
	var context_api_1 = require_context_api();
	Object.defineProperty(exports, "context", {
		enumerable: true,
		get: function() {
			return context_api_1.context;
		}
	});
	var diag_api_1 = require_diag_api();
	Object.defineProperty(exports, "diag", {
		enumerable: true,
		get: function() {
			return diag_api_1.diag;
		}
	});
	var metrics_api_1 = require_metrics_api();
	Object.defineProperty(exports, "metrics", {
		enumerable: true,
		get: function() {
			return metrics_api_1.metrics;
		}
	});
	var propagation_api_1 = require_propagation_api();
	Object.defineProperty(exports, "propagation", {
		enumerable: true,
		get: function() {
			return propagation_api_1.propagation;
		}
	});
	var trace_api_1 = require_trace_api();
	Object.defineProperty(exports, "trace", {
		enumerable: true,
		get: function() {
			return trace_api_1.trace;
		}
	});
	exports.default = {
		context: context_api_1.context,
		diag: diag_api_1.diag,
		metrics: metrics_api_1.metrics,
		propagation: propagation_api_1.propagation,
		trace: trace_api_1.trace
	};
}));
//#endregion
//#region ../../node_modules/.bun/@effect+opentelemetry@4.0.0-rc.111+cb92704adacdc5e3/node_modules/@effect/opentelemetry/dist/internal/attributes.js
var import_src = /* @__PURE__ */ __toESM(require_src(), 1);
var bigint1e9$1 = /*#__PURE__*/ BigInt(1e9);
/** @internal */
var nanosToHrTime = (timestamp) => {
	return [Number(timestamp / bigint1e9$1), Number(timestamp % bigint1e9$1)];
};
/** @internal */
var recordToAttributes = (record) => {
	const attributes = {};
	for (const [key, value] of Object.entries(record)) assignProperty(attributes, key, unknownToAttributeValue(value));
	return attributes;
};
/** @internal */
var unknownToAttributeValue = (value) => {
	if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value;
	else if (typeof value === "bigint") return value.toString();
	return toStringUnknown(value);
};
//#endregion
//#region ../../node_modules/.bun/@effect+opentelemetry@4.0.0-rc.111+cb92704adacdc5e3/node_modules/@effect/opentelemetry/dist/OtelTracer.js
/**
* Bridges Effect tracing into OpenTelemetry by installing an Effect `Tracer`
* that creates OpenTelemetry spans, records attributes, events, links, errors,
* and status, and keeps OpenTelemetry context active while traced effects run.
* Use this module when an application already has an OpenTelemetry
* `TracerProvider`, or when the Node and Web SDK layers should expose Effect
* spans to OTLP, console, or other OpenTelemetry-compatible exporters.
*
* The layer constructors wire Effect's tracer service to either the global
* OpenTelemetry tracer provider or an explicitly provided `OtelTracer`. This
* module does not create exporters or span processors by itself, so spans are
* exported only when the provider has been configured by the application or by
* the Node/Web SDK layers. Parentage is taken from Effect spans first and can
* also attach to the active OpenTelemetry context, while `makeExternalSpan` and
* `withSpanContext` are the entry points for continuing an incoming remote
* trace. Preserve `traceFlags` and `traceState` when building external spans;
* otherwise sampling defaults to sampled and trace state cannot be propagated.
*
* @since 4.0.0
*/
/**
* Context service containing the OpenTelemetry `Tracer` used to create spans for Effect tracing.
*
* @category services
* @since 4.0.0
*/
var OtelTracer = class extends (/*#__PURE__*/ Service()("@effect/opentelemetry/Tracer")) {};
/**
* Context service containing OpenTelemetry trace flags used when constructing external span contexts.
*
* @category services
* @since 4.0.0
*/
var OtelTraceFlags = class extends (/*#__PURE__*/ Service()("@effect/opentelemetry/Tracer/OtelTraceFlags")) {};
/**
* Context service containing OpenTelemetry trace state used when constructing external span contexts.
*
* @category services
* @since 4.0.0
*/
var OtelTraceState = class extends (/*#__PURE__*/ Service()("@effect/opentelemetry/Tracer/OtelTraceState")) {};
/**
* Creates an Effect `Tracer` implementation backed by the configured OpenTelemetry tracer.
*
* @category constructors
* @since 4.0.0
*/
var make = /*#__PURE__*/ map(/*#__PURE__*/ service(OtelTracer), (tracer) => make$5({
	span(options) {
		return new OtelSpan(import_src.context, import_src.trace, tracer, options);
	},
	context(primitive, fiber) {
		const currentSpan = fiber.currentSpan;
		if (currentSpan === void 0) return primitive["~effect/Effect/evaluate"](fiber);
		return import_src.context.with(populateContext(import_src.context.active(), currentSpan), () => primitive["~effect/Effect/evaluate"](fiber));
	}
}));
/**
* Creates an Effect external span from an OpenTelemetry span context, preserving trace flags and trace state when provided.
*
* @category constructors
* @since 4.0.0
*/
var makeExternalSpan = (options) => {
	let annotations = empty$2();
	if (options.traceFlags !== void 0) annotations = add(annotations, OtelTraceFlags, options.traceFlags);
	if (typeof options.traceState === "string") try {
		annotations = add(annotations, OtelTraceState, import_src.createTraceState(options.traceState));
	} catch {}
	else if (options.traceState) annotations = add(annotations, OtelTraceState, options.traceState);
	return {
		_tag: "ExternalSpan",
		traceId: options.traceId,
		spanId: options.spanId,
		sampled: isNotUndefined(options.traceFlags) ? isSampled(options.traceFlags) : true,
		annotations
	};
};
/**
* Layer that installs the Effect tracer using an `OtelTracer` already provided in the environment.
*
* @category layers
* @since 4.0.0
*/
var layerWithoutOtelTracer = /*#__PURE__*/ effect(Tracer, make);
var bigint1e6 = /*#__PURE__*/ BigInt(1e6);
var bigint1e9 = /*#__PURE__*/ BigInt(1e9);
/**
* Gets the current OpenTelemetry span.
*
* **Details**
*
* This accessor works with both the official OpenTelemetry API, such as
* `Tracer.layer` and `NodeSdk.layer`, and the lightweight OTLP module, such as
* `OtlpTracer.layer`. When using OTLP, the returned span is a wrapper that
* conforms to the OpenTelemetry `Span` interface.
*
* @category accessors
* @since 4.0.0
*/
var currentOtelSpan = /*#__PURE__*/ clockWith((clock) => map(currentSpan, (span) => OtelSpanTypeId in span ? span.span : makeOtelSpan(span, clock)));
var makeOtelSpan = (span, clock) => {
	const spanContext = {
		traceId: span.traceId,
		spanId: span.spanId,
		traceFlags: span.sampled ? import_src.TraceFlags.SAMPLED : import_src.TraceFlags.NONE,
		isRemote: false
	};
	let exit = void_$1;
	const self = {
		spanContext: () => spanContext,
		setAttribute(key, value) {
			span.attribute(key, value);
			return self;
		},
		setAttributes(attributes) {
			for (const [key, value] of Object.entries(attributes)) span.attribute(key, value);
			return self;
		},
		addEvent(name) {
			let attributes = void 0;
			let startTime = void 0;
			if (arguments.length === 3) {
				attributes = arguments[1];
				startTime = arguments[2];
			} else startTime = arguments[1];
			span.event(name, convertOtelTimeInput(startTime, clock), attributes);
			return self;
		},
		addLink(link) {
			span.addLinks([{
				span: makeExternalSpan(link.context),
				attributes: link.attributes ?? {}
			}]);
			return self;
		},
		addLinks(links) {
			span.addLinks(links.map((link) => ({
				span: makeExternalSpan(link.context),
				attributes: link.attributes ?? {}
			})));
			return self;
		},
		setStatus(status) {
			exit = status.code === import_src.SpanStatusCode.ERROR ? die$1(status.message ?? "Unknown error") : void_$1;
			return self;
		},
		updateName: () => self,
		end(endTime) {
			const time = convertOtelTimeInput(endTime, clock);
			span.end(time, exit);
			return self;
		},
		isRecording: constTrue,
		recordException(exception, timeInput) {
			const time = convertOtelTimeInput(timeInput, clock);
			const error = prettyErrors(fail$3(exception), { includeCauseInStack: true })[0];
			span.event(error.message, time, {
				"exception.type": error.name,
				"exception.message": error.message,
				"exception.stacktrace": error.stack ?? ""
			});
		}
	};
	return self;
};
var convertOtelTimeInput = (input, clock) => {
	if (input === void 0) return clock.currentTimeNanosUnsafe();
	else if (typeof input === "number") return BigInt(Math.round(input * 1e6));
	else if (input instanceof Date) return BigInt(input.getTime()) * bigint1e6;
	const [seconds, nanos] = input;
	return BigInt(seconds) * bigint1e9 + BigInt(nanos);
};
var OtelSpanTypeId = "~@effect/opentelemetry/Tracer/OtelSpan";
var kindMap = {
	"internal": import_src.SpanKind.INTERNAL,
	"client": import_src.SpanKind.CLIENT,
	"server": import_src.SpanKind.SERVER,
	"producer": import_src.SpanKind.PRODUCER,
	"consumer": import_src.SpanKind.CONSUMER
};
/** @internal */
var OtelSpan = class {
	[OtelSpanTypeId];
	_tag = "Span";
	name;
	kind;
	annotations;
	links;
	span;
	spanId;
	traceId;
	attributes = /*#__PURE__*/ new Map();
	sampled;
	parent;
	status;
	constructor(contextApi, traceApi, tracer, options) {
		this[OtelSpanTypeId] = OtelSpanTypeId;
		this.name = options.name;
		this.annotations = options.annotations;
		this.links = options.links;
		this.kind = options.kind;
		const active = contextApi.active();
		this.parent = options.root !== true ? orElse(options.parent, () => getOtelParent(traceApi, active, options.annotations)) : options.parent;
		this.span = tracer.startSpan(options.name, {
			startTime: nanosToHrTime(options.startTime),
			links: options.links.length > 0 ? options.links.map((link) => ({
				context: makeSpanContext(link.span),
				attributes: recordToAttributes(link.attributes)
			})) : void 0,
			kind: kindMap[this.kind]
		}, isSome(this.parent) ? populateContext(active, this.parent.value, options.annotations) : import_src.trace.deleteSpan(active));
		const spanContext = this.span.spanContext();
		this.spanId = spanContext.spanId;
		this.traceId = spanContext.traceId;
		this.status = {
			_tag: "Started",
			startTime: options.startTime
		};
		this.sampled = isSampled(spanContext.traceFlags);
	}
	attribute(key, value) {
		this.span.setAttribute(key, unknownToAttributeValue(value));
		this.attributes.set(key, value);
	}
	addLinks(links) {
		this.links.push(...links);
		this.span.addLinks(links.map((link) => ({
			context: makeSpanContext(link.span),
			attributes: recordToAttributes(link.attributes)
		})));
	}
	end(endTime, exit) {
		const hrTime = nanosToHrTime(endTime);
		this.status = {
			_tag: "Ended",
			endTime,
			exit,
			startTime: this.status.startTime
		};
		if (exit._tag === "Success") this.span.setStatus({ code: import_src.SpanStatusCode.OK });
		else if (hasInterruptsOnly(exit.cause)) {
			this.span.setStatus({
				code: import_src.SpanStatusCode.OK,
				message: pretty(exit.cause)
			});
			this.span.setAttribute("span.label", "⚠︎ Interrupted");
			this.span.setAttribute("status.interrupted", true);
		} else {
			const errors = prettyErrors(exit.cause, { includeCauseInStack: true });
			if (errors.length > 0) {
				for (const error of errors) this.span.recordException(error, hrTime);
				this.span.setStatus({
					code: import_src.SpanStatusCode.ERROR,
					message: errors[0].message
				});
			} else this.span.setStatus({ code: import_src.SpanStatusCode.OK });
		}
		this.span.end(hrTime);
	}
	event(name, startTime, attributes) {
		this.span.addEvent(name, attributes ? recordToAttributes(attributes) : void 0, nanosToHrTime(startTime));
	}
};
var isSampled = (traceFlags) => (traceFlags & import_src.TraceFlags.SAMPLED) === import_src.TraceFlags.SAMPLED;
var OtelParentSpanContext = class extends (/*#__PURE__*/ Service()("@effect/opentelemetry/Tracer/OtelParentSpanContext")) {};
var getOtelParent = (tracer, context, annotations) => {
	const otelParent = tracer.getSpanContext(context);
	if (!otelParent) return none();
	return some(externalSpan({
		spanId: otelParent.spanId,
		traceId: otelParent.traceId,
		sampled: isSampled(otelParent.traceFlags),
		annotations: add(annotations, OtelParentSpanContext, otelParent)
	}));
};
var makeSpanContext = (span, annotations) => {
	const otelParent = getOrUndefined(span.annotations, OtelParentSpanContext);
	if (otelParent !== void 0) {
		if (annotations === void 0) return otelParent;
		const traceFlags = extractTraceService(span, annotations, OtelTraceFlags);
		const traceState = extractTraceService(span, annotations, OtelTraceState);
		return {
			...otelParent,
			traceFlags: traceFlags ?? otelParent.traceFlags,
			traceState: traceState ?? otelParent.traceState
		};
	}
	const traceFlags = makeTraceFlags(span, annotations);
	const traceState = makeTraceState(span, annotations);
	return {
		spanId: span.spanId,
		traceId: span.traceId,
		isRemote: span._tag === "ExternalSpan",
		traceFlags,
		traceState
	};
};
var makeTraceFlags = (span, annotations) => {
	let traceFlags;
	if (isNotUndefined(annotations)) {
		traceFlags = extractTraceService(span, annotations, OtelTraceFlags);
		if (isUndefined(traceFlags)) traceFlags = getOrUndefined(span.annotations, OtelTraceFlags);
	}
	return traceFlags ?? (span.sampled ? import_src.TraceFlags.SAMPLED : import_src.TraceFlags.NONE);
};
var makeTraceState = (span, annotations) => {
	let traceState;
	if (isNotUndefined(annotations)) {
		traceState = extractTraceService(span, annotations, OtelTraceState);
		if (isUndefined(traceState)) traceState = getOrUndefined(span.annotations, OtelTraceState);
	}
	return traceState;
};
var extractTraceService = (parent, annotations, service) => {
	const instance = getOrUndefined(annotations, service);
	if (isNotUndefined(instance)) return instance;
	return getOrUndefined(parent.annotations, service);
};
var populateContext = (context, span, annotations) => span instanceof OtelSpan ? import_src.trace.setSpan(context, span.span) : import_src.trace.setSpanContext(context, makeSpanContext(span, annotations));
//#endregion
export { Array_, BaseProto, BigInt$1 as BigInt, Class, Class$1, Class$2, Clock, ClockRef, ConsoleRef, CurrentLoggers, CurrentMetadata, CurrentMetadata$1, Date$1 as Date, DisablePropagation, Done, Done$1, Effect_exports, Equivalence$1 as Equivalence, Equivalence$2 as Equivalence$1, Error$1 as Error, Error$2 as Error$1, ExceededCapacityError, MinimumLogLevel, MixedScheduler, NoSuchElementError, NodeInspectSymbol, Number$2 as Number, Order$1 as Order, OtelTracer, ParentSpan, PipeInspectableProto, Prototype, ReducerMax, ReducerMin, Reference, Schedule_exports, Scope, Service, StackTrace, TaggedClass, TaggedError, TimeoutError, Tracer, TracerTimingEnabled, Transaction, UnhandledLogLevel, UnknownError, _await, acquireRelease, acquireUseRelease, add, addDelay, addFinalizer, addFinalizer$1, addFinalizerExit, addSpanStackTrace, andThen, andThen$1, annotateCurrentSpan, annotateLogs, append, appendAll, args, array, as, asSome, asSome$1, asVoid, assignProperty$1 as assignProperty, build, buildWithMemoMap, buildWithScope, cached, callback, callback$1, catchCause, catchCause$1, catchDefect, catchDone, catchEager, catchIf, catchTag, catch_, causeFail, chunksOf, clockWith, close, combine, compose, constFalse, constTrue, constUndefined, constVoid, constant, context, contextWith, currentOtelSpan, currentSpan, decodeBase64, decodeBase64String, decodeBase64Url, decodeBase64UrlString, decodeHex, decodeHexString, dedupe, delay, die, die$1, die$2, done, done$1, doneExitFromCause, doneUnsafe, dropWhile, dual, effect, effectContext, effectIsExit, empty, empty$1, empty$2, empty$3, empty$4, encodeBase64, encodeBase64Url, encodeHex, endSpan, ensure, ensuring, equals$2 as equals, every, exists, exit, exitFail, exitFailCause, exitInterrupt, exitSucceed, exitVoid, exitZipRight, exponential, fail, fail$1, fail$2, fail$3, fail$5 as fail$4, failCause, failCause$2 as failCause$1, failCauseSync, failSync, fiberAwait, fiberInterrupt, fiberInterruptAll, fiberInterruptAs, fiberJoin, fiberJoinAll, fiberRunIn, filter, filter$2 as filter$1, filter$3 as filter$2, filter$4 as filter$3, filterDone, filterInterruptors, filterMapEffect, filterMapOrElse, filterOrElse, findDefect, findError, findErrorOption, flatMap, flatMap$2 as flatMap$1, flatMap$3 as flatMap$2, flatMap$4 as flatMap$3, flatMapEager, flatten, flatten$4 as flatten$1, flow, fn, fnUntraced, fnUntracedEager, forEach, forever, forever$1, forever$3 as forever$2, forkChild, forkDetach, forkIn, forkScoped, forkUnsafe, format, format$1, formatDate, formatIso, formatIsoZoned, formatJson, formatPath, formatPropertyKey, fromDateUnsafe, fromInput, fromInputUnsafe, fromIterable, fromNullOr, fromNullishOr, fromNullishOr$2 as fromNullishOr$1, fromOption, fromPredicateOption, fromReasons, fromResult, fromUndefinedOr, gen, get, getCurrentFiber, getOption, getOrElse, getOrElse$1, getOrNull, getOrThrow, getOrUndefined, getOrUndefined$1, getOrUndefinedUnsafe, getSomes, getStackTraceLimit, getUnsafe, getUnsafe$1, has, hasFails, hasInterrupts, hasInterruptsOnly, hasProperty, hash, head$2 as head, head$3 as head$1, headNonEmpty, headUnsafe, identity, ignore, ignoreCause, infinity, interrupt, interrupt$1, interrupt$2, interruptWith, interruptible, interruptibleMask, interruptors, into, isArray, isArrayNonEmpty, isAsyncFiberError, isBigInt, isBoolean, isCause, isContext, isDateTime, isDone, isDoneCause, isDuration, isEffect, isError, isExit, isFailReason, isFailure$1 as isFailure, isFailure$3 as isFailure$1, isFinite, isFunction, isGreaterThan, isGreaterThanOrEqualTo, isLessThan, isLessThanOrEqualTo$1 as isLessThanOrEqualTo, isNever, isNone, isNotNullish, isNotUndefined, isNumber, isObject, isObjectKeyword, isOption, isPromiseLike, isPropertyKey, isReadonlyArrayNonEmpty, isReadonlyObject, isReason, isResult, isSome, isString, isString$1, isSuccess$1 as isSuccess, isSuccess$3 as isSuccess$1, isSymbol, isTagged, isTimeZone, isTimeZoneNamed, isTimeZoneOffset, isUndefined, isUnknown, isUtc, isZero, isZoned, iterateEager, join, lastNonEmpty, layerWithoutOtelTracer, log, logDebug, logError, logWarning, logWithLevel, make$2 as make, make$3 as make$1, make$4 as make$2, make$5 as make$3, make$7 as make$4, make$8 as make$5, make$9 as make$6, make$10 as make$7, make$11 as make$8, makeCompareMap, makeCompareSet, makeDieReason, makeEquivalence, makeEquivalence$1, makeEquivalence$2, makeEquivalence$3, makeEquivalence$4, makeEventEmitter, makeExternalSpan, makeFailReason, makeInterruptReason, makeLatch, makeLatchUnsafe, makeMemoMapUnsafe, makeReducerConcat, makeSpan, makeSpanScoped, makeUnsafe$1 as makeUnsafe, makeUnsafe$2 as makeUnsafe$1, makeUnsafe$3 as makeUnsafe$2, makeZonedFromString, makeZonedUnsafe, map, map$2 as map$1, map$4 as map$2, map$5 as map$3, map$6 as map$4, map$7 as map$5, mapBothEager, mapEager, mapError, mapError$2 as mapError$1, mapErrorEager, match, match$1, match$4 as match$2, match$5 as match$3, matchCauseEffect, matchEffect, matchEffect$1, memoize, memoizeIdempotent, merge, merge$1, mergeAll, millis, min, min$1, minutes, modifyDelay, nanos, negativeInfinity, never, nextPow2, none, number, of, onError, onExit, onExitPrimitive, onExitPrimitive$1, onInterrupt, onInterrupt$1, optimize, orDie, orElse, partition$2 as partition, pipe, pipeArguments, pretty, prettyErrors, promise, provide, provide$2 as provide$1, provide$3 as provide$2, provideContext, provideMerge, provideService, raceAll, raceFirst, range, redact, remainder, replicateEffect, require_src, retry, retryOrElse, runCallback, runCallbackWith, runFork, runForkWith, runPromise, runPromiseExit, runPromiseExitWith, runPromiseWith, runSync, runSyncExit, runSyncExitWith, runSyncWith, schedule, scheduleFromStep, scope, scopeAddFinalizerUnsafe, scopeCloseUnsafe, scopeFinalizerCountUnsafe, scopeMakeUnsafe, scoped, scopedWith, seconds, service, serviceOption, setStackTraceLimit, sleep, some, spaced, splitWhere, squash, strictEqual, string, structure, succeed, succeed$1, succeed$2, succeed$3, succeed$4, succeed$5, succeedNone, succeedNone$1, succeedSome, suspend, suspend$1, suspend$2, symbol, symbol$1, symbolRedactable, sync, sync$1, tagged, takeWhile, tap, tapCause, tapError, timeout, timeoutOrElse, toDateUtc, toEntries, toEpochMillis, toJson, toMillis, toNanos, toPredicate, toStepWithMetadata, toStepWithSleep, toUtc, tracer, tracerLogger, trim, tryPromise, try_, try_$2 as try_$1, tx, txRetry, undefined_, uninterruptible, uninterruptibleMask, uninterruptibleMask$1, unwrap, unzip, upTo, updateContext, updateService, useSpan, void_, void_$1, void_$2, when, whileLoop, withFiber, withFiber$1, withParentSpan, withSpan, yieldNow, zero, zip, zoneFromString, zoneMakeNamed, zoneMakeNamedUnsafe, zoneMakeOffset, zoneToString };
