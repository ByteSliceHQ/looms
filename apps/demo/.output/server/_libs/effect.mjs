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
var Class$1 = /*#__PURE__*/ function() {
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
function isString(input) {
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
		case "number": return number$1(self);
		case "bigint": return string$1(self.toString(10));
		case "boolean": return string$1(String(self));
		case "symbol": return string$1(String(self));
		case "string": return string$1(self);
		case "undefined": return string$1("undefined");
		case "function":
		case "object": if (self === null) return string$1("null");
		else if (self instanceof Date) {
			if (Number.isNaN(self.getTime())) return string$1("Invalid Date");
			return string$1(self.toISOString());
		} else if (self instanceof RegExp) return string$1(self.toString());
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
	if (!randomHashCache.has(self)) randomHashCache.set(self, number$1(Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)));
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
var number$1 = (n) => {
	if (n !== n) return string$1("NaN");
	if (n === Infinity) return string$1("Infinity");
	if (n === -Infinity) return string$1("-Infinity");
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
var string$1 = (str) => {
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
var hashMap = /*#__PURE__*/ iterableWith(/*#__PURE__*/ string$1("Map"), ([k, v]) => combine(hash(k), hash(v)));
var hashSet = /*#__PURE__*/ iterableWith(/*#__PURE__*/ string$1("Set"), hash);
var randomHashCache = /*#__PURE__*/ new WeakMap();
var hashCache = /*#__PURE__*/ new WeakMap();
var visitedObjects = /*#__PURE__*/ new WeakSet();
function withVisitedTracking$1(obj, fn) {
	if (visitedObjects.has(obj)) return string$1("[Circular]");
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
function equals$1() {
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
var make$13 = (isEquivalent) => (self, that) => self === that || isEquivalent(self, that);
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0-rc.112/node_modules/effect/dist/internal/array.js
/**
* @since 2.0.0
*/
/** @internal */
var isArrayNonEmpty$1 = (self) => self.length > 0;
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0-rc.112/node_modules/effect/dist/internal/record.js
/** @internal */
function assignProperty(self, key, value) {
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
	for (const key of Reflect.ownKeys(source)) if (Object.prototype.propertyIsEnumerable.call(source, key)) assignProperty(self, key, source[key]);
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
var isExit = (u) => hasProperty(u, ExitTypeId);
/** @internal */
var CauseTypeId = "~effect/Cause";
/** @internal */
var CauseReasonTypeId = "~effect/Cause/Reason";
/** @internal */
var isCause = (self) => hasProperty(self, CauseTypeId);
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
		return isCause(that) && this.reasons.length === that.reasons.length && this.reasons.every((e, i) => equals$1(e, that.reasons[i]));
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
		return isFailReason$1(that) && equals$1(this.error, that.error) && equals$1(this.annotations, that.annotations);
	}
	[symbol$1]() {
		return combine(string$1(this._tag))(combine(hash(this.error))(hash(this.annotations)));
	}
};
/** @internal */
var causeFromReasons = (reasons) => new CauseImpl(reasons);
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
		return isDieReason(that) && equals$1(this.defect, that.defect) && equals$1(this.annotations, that.annotations);
	}
	[symbol$1]() {
		return combine(string$1(this._tag))(combine(hash(this.defect))(hash(this.annotations)));
	}
};
/** @internal */
var causeDie = (defect) => new CauseImpl([new Die(defect)]);
/** @internal */
var causeAnnotate = /*#__PURE__*/ dual((args) => isCause(args[0]), (self, annotations, options) => {
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
			return isExit(that) && that._tag === this._tag && equals$1(this[args], that[args]);
		},
		[symbol$1]() {
			return combine(string$1(options.op), hash(this[args]));
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
var withFiber = /*#__PURE__*/ makePrimitive({
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
var Error$1 = /*#__PURE__*/ function() {
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
	class Base extends Error$1 {
		_tag = tag;
	}
	Base.prototype.name = tag;
	return Base;
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
var Done = (value) => {
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
	return exitFail(Done(value));
};
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0-rc.112/node_modules/effect/dist/internal/option.js
/**
* @since 2.0.0
*/
var TypeId$16 = "~effect/data/Option";
var CommonProto$1 = {
	[TypeId$16]: { _A: (_) => _ },
	...PipeInspectableProto,
	[Symbol.iterator]() {
		return new SingleShotGen(this);
	}
};
var SomeProto = /*#__PURE__*/ Object.defineProperty(/*#__PURE__*/ Object.assign(/*#__PURE__*/ Object.create(CommonProto$1), {
	_tag: "Some",
	_op: "Some",
	[symbol](that) {
		return isOption(that) && isSome$1(that) && equals$1(this.value, that.value);
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
		return isOption(that) && isNone$1(that);
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
var isOption = (input) => hasProperty(input, TypeId$16);
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
var TypeId$15 = "~effect/data/Result";
var CommonProto = {
	[TypeId$15]: {
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
		return isResult(that) && isSuccess$1(that) && equals$1(this.success, that.success);
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
		return isResult(that) && isFailure$1(that) && equals$1(this.failure, that.failure);
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
var isResult = (input) => hasProperty(input, TypeId$15);
/** @internal */
var isFailure$1 = (result) => result._tag === "Failure";
/** @internal */
var isSuccess$1 = (result) => result._tag === "Success";
/** @internal */
var fail$5 = (failure) => {
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
var map$5 = /*#__PURE__*/ dual(2, (self, f) => isNone(self) ? none() : some(f(self.value)));
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0-rc.112/node_modules/effect/dist/Result.js
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
var fail$4 = fail$5;
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
var isFailure = isFailure$1;
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
var append$1 = /*#__PURE__*/ dual(2, (self, last) => [...self, last]);
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
Array$1.isArray;
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
var hashBucketsAdd = (buckets, value) => {
	const hash$1 = hash(value);
	const bucket = buckets.get(hash$1);
	if (bucket === void 0) {
		buckets.set(hash$1, [value]);
		return true;
	}
	for (const previous of bucket) if (equals$1(previous, value)) return false;
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
var union$1 = /*#__PURE__*/ dual(2, (self, that) => {
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
var empty$2 = () => [];
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
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0-rc.112/node_modules/effect/dist/BigDecimal.js
/**
* Decimal numbers and arithmetic for cases where JavaScript `number` rounding
* is not precise enough. A `BigDecimal` stores digits as a `bigint` plus a
* decimal scale, which lets the module parse, compare, add, subtract, multiply,
* divide, round, and format decimal values such as money, quantities, and
* measurements.
*
* @since 2.0.0
*/
var TypeId$14 = "~effect/BigDecimal";
var BigDecimalProto = {
	[TypeId$14]: TypeId$14,
	[symbol$1]() {
		const normalized = normalize(this);
		return combine(hash(normalized.value), number$1(normalized.scale));
	},
	[symbol](that) {
		return isBigDecimal(that) && equals(this, that);
	},
	toString() {
		return `BigDecimal(${format(this)})`;
	},
	toJSON() {
		return {
			_id: "BigDecimal",
			value: String(this.value),
			scale: this.scale
		};
	},
	[NodeInspectSymbol]() {
		return this.toJSON();
	},
	pipe() {
		return pipeArguments(this, arguments);
	}
};
/**
* Checks whether a given value is a `BigDecimal`.
*
* **When to use**
*
* Use to validate unknown input and narrow it to `BigDecimal`.
*
* **Example** (Checking BigDecimal values)
*
* ```ts import.meta.vitest
* import { BigDecimal } from "effect"
*
* const decimal = BigDecimal.fromNumber(123.45)
* BigDecimal.isBigDecimal(decimal) // => false
* BigDecimal.isBigDecimal(BigDecimal.fromStringUnsafe("123.45")) // => true
* BigDecimal.isBigDecimal(123.45) // => false
* BigDecimal.isBigDecimal("123.45") // => false
* ```
*
* @category guards
* @since 2.0.0
*/
var isBigDecimal = (u) => hasProperty(u, TypeId$14);
/**
* Creates a `BigDecimal` from a `bigint` value and a scale.
*
* **When to use**
*
* Use to construct a decimal directly from its unscaled integer value and
* decimal scale.
*
* **Example** (Creating decimals from bigint and scale)
*
* ```ts import.meta.vitest
* import { BigDecimal } from "effect"
*
* // Create 123.45 (12345 with scale 2)
* const decimal = BigDecimal.make(12345n, 2)
* decimal // => BigDecimal.fromStringUnsafe("123.45")
*
* // Create 42 (42 with scale 0)
* const integer = BigDecimal.make(42n, 0)
* integer // => BigDecimal.fromBigInt(42n)
* ```
*
* @see {@link fromBigInt} for constructing an integer decimal from a `bigint`
*
* @category constructors
* @since 2.0.0
*/
var make$11 = (value, scale) => {
	const o = Object.create(BigDecimalProto);
	o.value = value;
	o.scale = scale;
	return o;
};
/**
* Internal function used to create pre-normalized `BigDecimal`s.
*
* @internal
*/
var makeNormalizedUnsafe = (value, scale) => {
	if (value !== bigint0 && value % bigint10 === bigint0) throw new RangeError("Value must be normalized");
	const o = make$11(value, scale);
	o.normalized = o;
	return o;
};
var bigint0 = /*#__PURE__*/ BigInt(0);
var bigint10 = /*#__PURE__*/ BigInt(10);
var zero = /*#__PURE__*/ makeNormalizedUnsafe(bigint0, 0);
/**
* Normalizes a given `BigDecimal` by removing trailing zeros.
*
* **When to use**
*
* Use to canonicalize decimals that have equivalent values but different
* internal scales.
*
* **Example** (Normalizing trailing zeros)
*
* ```ts import.meta.vitest
* import { BigDecimal } from "effect"
*
* const decimal = BigDecimal.normalize(BigDecimal.fromStringUnsafe("123.00000"))
* const decimalStorage = [decimal.value, decimal.scale] // => [123n, 0]
*
* const largeDecimal = BigDecimal.normalize(BigDecimal.fromStringUnsafe("12300000"))
* const largeDecimalStorage = [largeDecimal.value, largeDecimal.scale] // => [123n, -5]
* ```
*
* @see {@link format} for rendering normalized decimals as strings
*
* @category scaling
* @since 2.0.0
*/
var normalize = (self) => {
	if (self.normalized === void 0) {
		if (self.value === bigint0) self.normalized = zero;
		else {
			const digits = `${self.value}`;
			let trail = 0;
			for (let i = digits.length - 1; i >= 0; i--) if (digits[i] === "0") trail++;
			else break;
			if (trail === 0) self.normalized = self;
			self.normalized = makeNormalizedUnsafe(BigInt(digits.substring(0, digits.length - trail)), self.scale - trail);
		}
	}
	return self.normalized;
};
/**
* Changes a `BigDecimal` to the specified scale.
*
* **When to use**
*
* Use to change how many decimal places are represented by a `BigDecimal`.
*
* **Details**
*
* Increasing the scale appends decimal zeros. Decreasing the scale discards
* digits beyond the target scale by `bigint` division, which truncates toward
* zero.
*
* **Example** (Scaling decimal precision)
*
* ```ts import.meta.vitest
* import { BigDecimal } from "effect"
*
* const decimal = BigDecimal.fromNumberUnsafe(123.45)
*
* // Increase scale (add more precision)
* const scaled = BigDecimal.scale(decimal, 4)
* const scaledStorage = [scaled.value, scaled.scale] // => [1234500n, 4]
*
* // Decrease scale (reduce precision, truncating toward zero)
* const reduced = BigDecimal.scale(decimal, 1)
* reduced // => BigDecimal.fromStringUnsafe("123.4")
* ```
*
* @see {@link round} for changing scale with configurable rounding
*
* @category scaling
* @since 2.0.0
*/
var scale = /*#__PURE__*/ dual(2, (self, scale) => {
	if (scale > self.scale) return make$11(self.value * bigint10 ** BigInt(scale - self.scale), scale);
	if (scale < self.scale) return make$11(self.value / bigint10 ** BigInt(self.scale - scale), scale);
	return self;
});
/**
* Determines the absolute value of a given `BigDecimal`.
*
* **When to use**
*
* Use to remove the sign from a `BigDecimal` while preserving its magnitude.
*
* **Example** (Calculating absolute values)
*
* ```ts import.meta.vitest
* import { BigDecimal } from "effect"
*
* BigDecimal.abs(BigDecimal.fromStringUnsafe("-5")) // => BigDecimal.fromBigInt(5n)
* BigDecimal.abs(BigDecimal.fromStringUnsafe("0")) // => BigDecimal.fromBigInt(0n)
* BigDecimal.abs(BigDecimal.fromStringUnsafe("5")) // => BigDecimal.fromBigInt(5n)
* ```
*
* @category math
* @since 2.0.0
*/
var abs = (n) => n.value < bigint0 ? make$11(-n.value, n.scale) : n;
/**
* Provides an `Equivalence` instance for `BigDecimal` that determines equality between BigDecimal values.
*
* **When to use**
*
* Use when comparing decimal values through APIs that accept an equivalence
* relation.
*
* **Example** (Checking decimal equivalence)
*
* ```ts import.meta.vitest
* import { BigDecimal } from "effect"
*
* const a = BigDecimal.fromStringUnsafe("1.50")
* const b = BigDecimal.fromStringUnsafe("1.5")
* const c = BigDecimal.fromStringUnsafe("2.0")
*
* BigDecimal.Equivalence(a, b) // => true
* BigDecimal.Equivalence(a, c) // => false
* ```
*
* @category instances
* @since 2.0.0
*/
var Equivalence$2 = /*#__PURE__*/ make$13((self, that) => {
	if (self.scale > that.scale) return scale(that, self.scale).value === self.value;
	if (self.scale < that.scale) return scale(self, that.scale).value === that.value;
	return self.value === that.value;
});
/**
* Checks whether two `BigDecimal`s are equal.
*
* **When to use**
*
* Use to compare two `BigDecimal` values for numeric equality.
*
* **Example** (Checking decimal equality)
*
* ```ts import.meta.vitest
* import { BigDecimal } from "effect"
*
* const a = BigDecimal.fromStringUnsafe("1.5")
* const b = BigDecimal.fromStringUnsafe("1.50")
* const c = BigDecimal.fromStringUnsafe("2.0")
*
* BigDecimal.equals(a, b) // => true
* BigDecimal.equals(a, c) // => false
* ```
*
* @see {@link Equivalence} for passing decimal equality to APIs that require an `Equivalence`
*
* @category predicates
* @since 2.0.0
*/
var equals = /*#__PURE__*/ dual(2, (self, that) => Equivalence$2(self, that));
/**
* Formats a `BigDecimal` as a string.
*
* **When to use**
*
* Use to render a `BigDecimal` as plain decimal text when possible.
*
* **Details**
*
* The value is normalized before formatting. Scientific notation is used when
* the absolute value of the normalized scale is at least `16`; otherwise plain
* decimal notation is used.
*
* **Example** (Formatting decimals)
*
* ```ts import.meta.vitest
* import { BigDecimal } from "effect"
*
* BigDecimal.format(BigDecimal.fromStringUnsafe("-5")) // => "-5"
* BigDecimal.format(BigDecimal.fromStringUnsafe("123.456")) // => "123.456"
* BigDecimal.format(BigDecimal.fromStringUnsafe("-0.00000123")) // => "-0.00000123"
* ```
*
* @see {@link toExponential} for always rendering scientific notation
*
* @category converting
* @since 2.0.0
*/
var format = (n) => {
	const normalized = normalize(n);
	if (Math.abs(normalized.scale) >= 16) return toExponential(normalized);
	const negative = normalized.value < bigint0;
	const absolute = negative ? `${normalized.value}`.substring(1) : `${normalized.value}`;
	let before;
	let after;
	if (normalized.scale >= absolute.length) {
		before = "0";
		after = "0".repeat(normalized.scale - absolute.length) + absolute;
	} else {
		const location = absolute.length - normalized.scale;
		if (location > absolute.length) {
			const zeros = location - absolute.length;
			before = `${absolute}${"0".repeat(zeros)}`;
			after = "";
		} else {
			after = absolute.slice(location);
			before = absolute.slice(0, location);
		}
	}
	const complete = after === "" ? before : `${before}.${after}`;
	return negative ? `-${complete}` : complete;
};
/**
* Formats a given `BigDecimal` as a `string` in scientific notation.
*
* **When to use**
*
* Use to render a `BigDecimal` in scientific notation.
*
* **Example** (Formatting decimals exponentially)
*
* ```ts import.meta.vitest
* import { BigDecimal } from "effect"
*
* BigDecimal.toExponential(BigDecimal.make(123456n, -5)) // => "1.23456e+10"
* ```
*
* @see {@link format} for plain decimal formatting when possible
*
* @category converting
* @since 3.11.0
*/
var toExponential = (n) => {
	if (isZero(n)) return "0e+0";
	const normalized = normalize(n);
	const digits = `${abs(normalized).value}`;
	const head = digits.slice(0, 1);
	const tail = digits.slice(1);
	let output = `${isNegative(normalized) ? "-" : ""}${head}`;
	if (tail !== "") output += `.${tail}`;
	const exp = tail.length - normalized.scale;
	return `${output}e${exp >= 0 ? "+" : ""}${exp}`;
};
/**
* Checks whether a given `BigDecimal` is `0`.
*
* **When to use**
*
* Use to test whether a `BigDecimal` is exactly zero.
*
* **Example** (Checking zero decimals)
*
* ```ts import.meta.vitest
* import { BigDecimal } from "effect"
*
* BigDecimal.isZero(BigDecimal.fromStringUnsafe("0")) // => true
* BigDecimal.isZero(BigDecimal.fromStringUnsafe("1")) // => false
* ```
*
* @category predicates
* @since 2.0.0
*/
var isZero = (n) => n.value === bigint0;
/**
* Checks whether a given `BigDecimal` is negative.
*
* **When to use**
*
* Use to test whether a `BigDecimal` is less than zero.
*
* **Example** (Checking negative decimals)
*
* ```ts import.meta.vitest
* import { BigDecimal } from "effect"
*
* BigDecimal.isNegative(BigDecimal.fromStringUnsafe("-1")) // => true
* BigDecimal.isNegative(BigDecimal.fromStringUnsafe("0")) // => false
* BigDecimal.isNegative(BigDecimal.fromStringUnsafe("1")) // => false
* ```
*
* @category predicates
* @since 2.0.0
*/
var isNegative = (n) => n.value < bigint0;
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
			return exitSucceed(get$1(fiber.context, this));
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
		return make$10(this, self);
	},
	use(f) {
		return withFiber((fiber) => f(get$1(fiber.context, this)));
	},
	useSync(f) {
		return withFiber((fiber) => exitSucceed(f(get$1(fiber.context, this))));
	}
};
var cacheKeys = /*#__PURE__*/ new Set();
var ReferenceTypeId = "~effect/Context/Reference";
var TypeId$13 = "~effect/Context";
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
	return makeUnsafe$5(map);
};
var notFound = /*#__PURE__*/ Symbol();
var lookup = (self, key) => {
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
var makeUnsafe$5 = (mapUnsafe) => makeImpl(void 0, mapUnsafe, void 0, 0);
var Proto$1 = {
	get mapUnsafe() {
		return flatten$2(this);
	},
	...PipeInspectableProto,
	[TypeId$13]: { _Services: (_) => _ },
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
		for (const [key, value] of self) if (!other.has(key) || !equals$1(value, other.get(key))) return false;
		return true;
	},
	[symbol$1]() {
		return number$1(this.mapUnsafe.size);
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
var isContext = (u) => hasProperty(u, TypeId$13);
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
var empty$1 = () => emptyContext;
var emptyContext = /*#__PURE__*/ makeUnsafe$5(/*#__PURE__*/ new Map());
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
var make$10 = (key, service) => makeUnsafe$5(/* @__PURE__ */ new Map([[key.key, service]]));
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
	const value = lookup(self, key);
	return value === notFound ? void 0 : value;
};
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
var get$1 = /* @__PURE__ */ dual(2, (self, service) => {
	const value = lookup(self, service.key);
	if (value === notFound) {
		if (isReference(service)) return getDefaultValue(service);
		throw serviceNotFoundError(service);
	}
	return value;
});
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
	return makeUnsafe$5(map);
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
var byteToHex = [];
for (let i = 0; i < 256; i++) byteToHex.push(i.toString(16).padStart(2, "0"));
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0-rc.112/node_modules/effect/dist/Tracer.js
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
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0-rc.112/node_modules/effect/dist/internal/metric.js
/** @internal */
var FiberRuntimeMetricsKey = "effect/observability/Metric/FiberRuntimeMetricsKey";
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0-rc.112/node_modules/effect/dist/internal/references.js
/** @internal */
var CurrentStackFrame = /*#__PURE__*/ Reference("effect/References/CurrentStackFrame", {
	fiberCached: true,
	defaultValue: constUndefined
});
/** @internal */
var CurrentLogLevel = /*#__PURE__*/ Reference("effect/References/CurrentLogLevel", {
	fiberCached: true,
	defaultValue: () => "Info"
});
/** @internal */
var MinimumLogLevel = /*#__PURE__*/ Reference("effect/References/MinimumLogLevel", {
	fiberCached: true,
	defaultValue: () => "Info"
});
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
		return combine(string$1(`${this._tag}:${this.fiberId}`))(random(this.annotations));
	}
};
/** @internal */
var causeInterrupt = (fiberId) => new CauseImpl([new Interrupt(fiberId)]);
/** @internal */
var findError = (self) => {
	for (let i = 0; i < self.reasons.length; i++) {
		const reason = self.reasons[i];
		if (reason._tag === "Fail") return succeed$5(reason.error);
	}
	return fail$4(self);
};
/** @internal */
var findDefect = (self) => {
	const reason = self.reasons.find(isDieReason);
	return reason ? succeed$5(reason.defect) : fail$4(self);
};
/** @internal */
var hasInterrupts = (self) => self.reasons.some(isInterruptReason);
/** @internal */
var causeCombine = /*#__PURE__*/ dual(2, (self, that) => {
	if (self.reasons.length === 0) return that;
	else if (that.reasons.length === 0) return self;
	const newCause = new CauseImpl(union$1(self.reasons, that.reasons));
	return equals$1(self, newCause) ? self : newCause;
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
		return get$1(this.context, ref);
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
		if (this.currentStackFrame) cause = causeAnnotate(cause, make$10(StackTraceKey, this.currentStackFrame));
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
		if (interruptChildren !== void 0) return this.evaluate(flatMap$1(interruptChildren, () => exit));
		this._exit = exit;
		this.runtimeMetrics?.recordFiberEnd(this.context, this._exit);
		for (let i = 0; i < this._observers.length; i++) this._observers[i](exit);
		this._observers.length = 0;
		this._stack.length = 0;
		this._children = void 0;
		this.context = empty$1();
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
					current = flatMap$1(yieldNow, () => prev);
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
		this.minimumLogLevel = this.getRef(MinimumLogLevel);
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
	return makeUnsafe$5(annotations);
};
/** @internal */
var fiberAwait = (self) => {
	const impl = self;
	if (impl._exit) return succeed$4(impl._exit);
	return callback$2((resume) => {
		if (impl._exit) return resume(succeed$4(impl._exit));
		return sync$1(self.addObserver((exit) => resume(succeed$4(exit))));
	});
};
/** @internal */
var fiberAwaitAll = (self) => callback$2((resume) => {
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
	return callback$2((resume) => {
		if (impl._exit) return resume(impl._exit);
		return sync$1(self.addObserver(resume));
	});
};
/** @internal */
var fiberInterrupt = (self) => withFiber((fiber) => fiberInterruptAs(self, fiber.id));
/** @internal */
var fiberInterruptAs = /*#__PURE__*/ dual((args) => hasProperty(args[0], FiberTypeId), (self, fiberId, annotations) => withFiber((parent) => {
	let ann = fiberStackAnnotations(parent);
	ann = ann && annotations ? merge$1(ann, annotations) : ann ?? annotations;
	self.interruptUnsafe(fiberId, ann);
	return asVoid(fiberAwait(self));
}));
/** @internal */
var fiberInterruptAll = (fibers) => withFiber((parent) => {
	const annotations = fiberStackAnnotations(parent);
	let fiberArr = empty$2();
	for (const fiber of fibers) {
		fiber.interruptUnsafe(parent.id, annotations);
		fiberArr.push(fiber);
	}
	return asVoid(fiberAwaitAll(fiberArr));
});
/** @internal */
var succeed$4 = exitSucceed;
/** @internal */
var failCause$3 = exitFailCause;
/** @internal */
var fail$3 = exitFail;
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
var suspend$1 = /*#__PURE__*/ makePrimitive({
	op: "Suspend",
	[evaluate](_fiber) {
		return this[args]();
	}
});
/** @internal */
var yieldNow = /*#__PURE__*/ (/* @__PURE__ */ makePrimitive({
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
}))(0);
/** @internal */
var succeedNone$1 = /*#__PURE__*/ succeed$4(/*#__PURE__*/ none());
/** @internal */
var failCauseSync$1 = (evaluate) => suspend$1(() => failCause$3(internalCall(evaluate)));
/** @internal */
var die$1 = (defect) => exitDie(defect);
/** @internal */
var void_$2 = /*#__PURE__*/ succeed$4(void 0);
/** @internal */
var promise$1 = (evaluate) => callbackOptions(function(resume, signal) {
	internalCall(() => evaluate(signal)).then((a) => resume(succeed$4(a)), (e) => resume(die$1(e)));
}, evaluate.length !== 0);
/** @internal */
var tryPromise$1 = (options) => {
	const f = typeof options === "function" ? options : options.try;
	const catcher = typeof options === "function" ? (cause) => new UnknownError(cause, "An error occurred in Effect.tryPromise") : options.catch;
	return callbackOptions(function(resume, signal) {
		const failWithCatch = (cause) => {
			try {
				resume(fail$3(internalCall(() => catcher(cause))));
			} catch (err) {
				resume(die$1(err));
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
var withFiberId = (f) => withFiber((fiber) => f(fiber.id));
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
		return hasInterrupts(cause) ? flatMap$1(this[args](), () => failCause$3(cause)) : failCause$3(cause);
	}
});
/** @internal */
var callback$2 = (register) => callbackOptions(register, register.length >= 2);
/** @internal */
var gen$1 = (...args) => suspend$1(() => fromIteratorUnsafe(args.length === 1 ? args[0]() : args[1].call(args[0].self)));
/** @internal */
var fnUntraced$1 = (body, ...pipeables) => {
	const fn = pipeables.length === 0 ? function() {
		return suspend$1(() => fromIteratorUnsafe(body.apply(this, arguments)));
	} : function() {
		let effect = suspend$1(() => fromIteratorUnsafe(body.apply(this, arguments)));
		for (let i = 0; i < pipeables.length; i++) effect = pipeables[i](effect, ...arguments);
		return effect;
	};
	return defineFunctionLength(body.length, fn);
};
var defineFunctionLength = (length, fn) => Object.defineProperty(fn, "length", {
	value: length,
	configurable: true
});
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
				return suspend$1(() => {
					if (isFirstExecution) {
						isFirstExecution = false;
						return flatMap$1(state.value, (value) => fromIteratorUnsafe(iterator, value));
					} else return suspend$1(() => fromIteratorUnsafe(evaluate()));
				});
			}
		}
	} catch (error) {
		return die$1(error);
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
	return flatMap$1(self, (_) => b);
});
/** @internal */
var asSome = (self) => map$3(self, some);
/** @internal */
var andThen$1 = /*#__PURE__*/ dual(2, (self, f) => flatMap$1(self, (a) => isEffect$1(f) ? f : internalCall(() => f(a))));
/** @internal */
var tap$2 = /*#__PURE__*/ dual(2, (self, f) => flatMap$1(self, (a) => as$1(isEffect$1(f) ? f : internalCall(() => f(a)), a)));
/** @internal */
var asVoid = (self) => flatMap$1(self, (_) => exitVoid);
/** @internal */
var flatMap$1 = /*#__PURE__*/ dual(2, (self, f) => {
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
var effectIsExit = (effect) => ExitTypeId in effect;
/** @internal */
var flatMapEager$1 = /*#__PURE__*/ dual(2, (self, f) => {
	if (effectIsExit(self)) return self._tag === "Success" ? f(self.value) : self;
	return flatMap$1(self, f);
});
/** @internal */
var flatten$1 = (self) => flatMap$1(self, identity);
/** @internal */
var map$3 = /*#__PURE__*/ dual(2, (self, f) => flatMap$1(self, (a) => succeed$4(internalCall(() => f(a)))));
/** @internal */
var mapEager$1 = /*#__PURE__*/ dual(2, (self, f) => effectIsExit(self) ? exitMap(self, f) : map$3(self, f));
/** @internal */
var exitInterrupt$1 = (fiberId) => exitFailCause(causeInterrupt(fiberId));
/** @internal */
var exitIsSuccess = (self) => self._tag === "Success";
/** @internal */
var exitFilterCause = (self) => self._tag === "Failure" ? succeed$5(self.cause) : fail$4(self);
/** @internal */
var exitVoid = /*#__PURE__*/ exitSucceed(void 0);
/** @internal */
var exitMap = /*#__PURE__*/ dual(2, (self, f) => self._tag === "Success" ? exitSucceed(f(self.value)) : self);
/** @internal */
var exitZipRight = /*#__PURE__*/ dual(2, (self, that) => exitIsSuccess(self) ? that : self);
/** @internal */
var exitAsVoidAll = (exits) => {
	const failures = [];
	for (const exit of exits) if (exit._tag === "Failure") failures.push(...exit.cause.reasons);
	return failures.length === 0 ? exitVoid : exitFailCause(causeFromReasons(failures));
};
/** @internal */
var updateContext = /*#__PURE__*/ dual(2, (self, f) => withFiber((fiber) => {
	const prevContext = fiber.context;
	const nextContext = f(prevContext);
	if (prevContext === nextContext) return self;
	fiber.setContext(nextContext);
	return onExitPrimitive(self, () => {
		fiber.setContext(prevContext);
	});
}));
/** @internal */
var context$1 = () => getContext;
var getContext = /*#__PURE__*/ withFiber((fiber) => succeed$4(fiber.context));
/** @internal */
var contextWith = (f) => withFiber((fiber) => f(fiber.context));
/** @internal */
var provideContext = /*#__PURE__*/ dual(2, (self, context) => {
	if (effectIsExit(self)) return self;
	return updateContext(self, merge$1(context));
});
/** @internal */
var provideService$1 = function() {
	if (arguments.length === 1) return dual(2, (self, impl) => provideServiceImpl(self, arguments[0], impl));
	return dual(3, (self, service, impl) => provideServiceImpl(self, service, impl)).apply(this, arguments);
};
var provideServiceImpl = (self, service, implementation) => updateContext(self, add(service, implementation));
/** @internal */
var forever$1 = /*#__PURE__*/ dual((args) => isEffect$1(args[0]), (self, options) => whileLoop({
	while: constTrue,
	body: constant(options?.disableYield ? self : flatMap$1(self, (_) => yieldNow)),
	step: constVoid
}));
/** @internal */
var catchCause$1 = /*#__PURE__*/ dual(2, (self, f) => {
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
var catchCauseFilter = /*#__PURE__*/ dual(3, (self, filter, f) => catchCause$1(self, (cause) => {
	const eb = filter(cause);
	return isFailure(eb) ? failCause$3(eb.failure) : internalCall(() => f(eb.success, cause));
}));
/** @internal */
var catch_$1 = /*#__PURE__*/ dual(2, (self, f) => catchCauseFilter(self, findError, (e) => f(e)));
/** @internal */
var catchDefect$1 = /*#__PURE__*/ dual(2, (self, f) => catchCauseFilter(self, findDefect, f));
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
var matchEffect = /*#__PURE__*/ dual(2, (self, options) => matchCauseEffect$1(self, {
	onFailure: (cause) => {
		const fail = cause.reasons.find(isFailReason$1);
		return fail ? internalCall(() => options.onFailure(fail.error)) : failCause$3(cause);
	},
	onSuccess: options.onSuccess
}));
/** @internal */
var match$1 = /*#__PURE__*/ dual(2, (self, options) => matchEffect(self, {
	onFailure: (error) => sync$1(() => options.onFailure(error)),
	onSuccess: (value) => sync$1(() => options.onSuccess(value))
}));
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
var ScopeTypeId = "~effect/Scope";
/** @internal */
var ScopeCloseableTypeId = "~effect/Scope/Closeable";
/** @internal */
var scopeTag = /*#__PURE__*/ Service("effect/Scope");
/** @internal */
var scopeClose = (self, exit_) => suspend$1(() => scopeCloseUnsafe(self, exit_) ?? void_$2);
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
var combineFinalizerCause = (exit_, finalizer) => exitIsSuccess(exit_) ? finalizer : catchCause$1(finalizer, (cause) => failCause$3(causeCombine(exit_.cause, cause)));
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
	return suspend$1(() => {
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
var scopeMakeUnsafe = (finalizerStrategy = "sequential") => ({
	[ScopeCloseableTypeId]: ScopeCloseableTypeId,
	[ScopeTypeId]: ScopeTypeId,
	strategy: finalizerStrategy,
	state: constScopeEmpty
});
var constScopeEmpty = { _tag: "Empty" };
/** @internal */
var scope = scopeTag;
/** @internal */
var provideScope = /*#__PURE__*/ provideService$1(scopeTag);
/** @internal */
var scopedWith = (f) => suspend$1(() => {
	const scope = scopeMakeUnsafe();
	return onExit$1(f(scope), (exit) => suspend$1(() => scopeCloseUnsafe(scope, exit) ?? void_$2));
});
/** @internal */
var addFinalizer$2 = (finalizer) => flatMap$1(scope, (scope) => contextWith((context) => scopeAddFinalizerExit(scope, (exit) => provideContext(finalizer(exit), context))));
/** @internal */
var onExitPrimitive = /*#__PURE__*/ makePrimitive({
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
		return eff ? flatMap$1(eff, (_) => exit) : exit;
	},
	[contE](cause, _, exit) {
		exit ??= exitFailCause(cause);
		const eff = this[args][1](exit);
		return eff ? flatMap$1(combineFinalizerCause(exit, eff), (_) => exit) : exit;
	}
});
/** @internal */
var onExit$1 = /*#__PURE__*/ dual(2, onExitPrimitive);
/** @internal */
var onExitFilter = /*#__PURE__*/ dual(3, (self, filter, f) => onExit$1(self, (exit) => {
	const b = filter(exit);
	return isFailure(b) ? void_$2 : f(b.success, exit);
}));
/** @internal */
var onError$1 = /*#__PURE__*/ dual(2, (self, f) => onExitFilter(self, exitFilterCause, f));
/** @internal */
var uninterruptible = (self) => withFiber((fiber) => {
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
var interruptible = (self) => withFiber((fiber) => {
	if (fiber.interruptible) return self;
	return setFiberInterruptible(fiber) ?? self;
});
/** @internal */
var uninterruptibleMask = (f) => withFiber((fiber) => {
	if (!fiber.interruptible) return f(identity);
	fiber.interruptible = false;
	fiber._stack.push(setInterruptibleTrue);
	return f(interruptible);
});
/** @internal */
var whileLoop = /*#__PURE__*/ makePrimitive({
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
var forEach = /*#__PURE__*/ dual((args) => typeof args[1] === "function", (iterable, f, options) => suspend$1(() => {
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
var forEachSequential = (iterable, f, options) => suspend$1(() => {
	const out = options?.discard ? void 0 : [];
	const iterator = iterable[Symbol.iterator]();
	let state = iterator.next();
	let index = 0;
	return as$1(whileLoop({
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
			if (!effectIsExit(effect)) return flatMap$1(exit$1(effect), (itemExit) => step(state, item, itemExit, index) ?? runSequential(state, items, index + 1, end) ?? void_$2);
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
			return fibers && fibers.size > 0 ? flatMap$1(uninterruptible(fiberInterruptAll(Array.from(fibers))), () => defect) : defect;
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
				} else if (!parentFiber) return callback$2((cb) => {
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
					return suspend$1(() => {
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
var forkIn$1 = /*#__PURE__*/ dual((args) => isEffect$1(args[0]), (self, scope, options) => withFiber((parent) => {
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
var runFork$1 = /*#__PURE__*/ runForkWith$1(/*#__PURE__*/ empty$1());
/** @internal */
var runPromiseExitWith = (context) => {
	const runFork = runForkWith$1(context);
	return (effect, options) => {
		const fiber = runFork(effect, options);
		return new Promise((resolve) => {
			fiber.addObserver((exit) => resolve(exit));
		});
	};
};
/** @internal */
var runPromiseWith = (context) => {
	const runPromiseExit = runPromiseExitWith(context);
	return (effect, options) => runPromiseExit(effect, options).then((exit) => {
		if (exit._tag === "Failure") throw causeSquash(exit.cause);
		return exit.value;
	});
};
/** @internal */
var runPromise$1 = /*#__PURE__*/ runPromiseWith(/*#__PURE__*/ empty$1());
/** @internal */
var runSyncExitWith = (context) => {
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
var runSyncExit$1 = /*#__PURE__*/ runSyncExitWith(/*#__PURE__*/ empty$1());
/** @internal */
var AsyncFiberErrorTypeId = "~effect/Cause/AsyncFiberError";
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
var UnknownError = class extends (/*#__PURE__*/ TaggedError$1("UnknownError")) {
	[UnknownErrorTypeId] = UnknownErrorTypeId;
	constructor(cause, message) {
		super({
			message,
			cause
		});
	}
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
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0-rc.112/node_modules/effect/dist/Cause.js
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
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0-rc.112/node_modules/effect/dist/Exit.js
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
var isSuccess = exitIsSuccess;
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
var makeUnsafe$4 = () => {
	const self = Object.create(DeferredProto);
	self.resumes = void 0;
	self.effect = void 0;
	return self;
};
var _await = (self) => callback$2((resume) => {
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
var makeUnsafe$3 = scopeMakeUnsafe;
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
var provide$2 = provideScope;
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
var TypeId$11 = "~effect/Layer";
var MemoMapTypeId = "~effect/Layer/MemoMap";
var memoMapReuse = (entry, scope) => {
	entry.observers++;
	return andThen$1(scopeAddFinalizerExit(scope, (exit) => entry.finalizer(exit)), entry.effect);
};
var LayerProto = {
	[TypeId$11]: {
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
	const layerScope = makeUnsafe$3();
	const deferred = makeUnsafe$4();
	const entry = {
		observers: 1,
		effect: _await(deferred),
		finalizer: (exit) => suspend$1(() => {
			entry.observers--;
			if (entry.observers === 0) {
				memoMap.map.delete(layer);
				return close(layerScope, exit);
			}
			return void_$2;
		})
	};
	memoMap.map.set(layer, entry);
	return scopeAddFinalizerExit(scope, entry.finalizer).pipe(flatMap$1(() => build(memoMap, layerScope)), onExit$1((exit) => {
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
		return suspend$1(() => {
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
var buildWithScope = /*#__PURE__*/ dual(2, (self, scope) => withFiber((fiber) => buildWithMemoMap(self, CurrentMemoMap.forkOrCreate(fiber.context), scope)));
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
var succeed$2 = function() {
	if (arguments.length === 1) return (resource) => succeedContext(make$10(arguments[0], resource));
	return succeedContext(make$10(arguments[0], arguments[1]));
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
var empty = /*#__PURE__*/ succeedContext(/*#__PURE__*/ empty$1());
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
var effectImpl = (service, effect) => effectContext(map$3(effect, (value) => make$10(service, value)));
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
var effectContext = (effect) => fromBuildMemo((_, scope) => provide$2(effect, scope));
var mergeAllEffect = (layers, memoMap, scope) => {
	const parentScope = forkUnsafe(scope, "parallel");
	return forEach(layers, (layer) => layer.build(memoMap, forkUnsafe(parentScope, "sequential")), { concurrency: layers.length }).pipe(map$3((context) => mergeAll$1(...context)));
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
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0-rc.112/node_modules/effect/dist/internal/dateTime.js
/** @internal */
var TypeId$10 = "~effect/time/DateTime";
/** @internal */
var TimeZoneTypeId = "~effect/time/DateTime/TimeZone";
var Proto = {
	[TypeId$10]: TypeId$10,
	pipe() {
		return pipeArguments(this, arguments);
	},
	[NodeInspectSymbol]() {
		return this.toString();
	},
	toJSON() {
		return toDateUtc$1(this).toJSON();
	}
};
({ ...Proto });
({ ...Proto });
var ProtoTimeZone = {
	[TimeZoneTypeId]: TimeZoneTypeId,
	[NodeInspectSymbol]() {
		return this.toString();
	}
};
({ ...ProtoTimeZone });
({ ...ProtoTimeZone });
/** @internal */
var toDateUtc$1 = (self) => new Date(self.epochMilliseconds);
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
var catchDone = /*#__PURE__*/ dual(2, (effect, f) => catchCauseFilter(effect, filterDoneLeftover, (l) => f(l)));
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
	if (done === void 0) return fail$4(cause);
	return hasFailure ? fail$4(fromReasons(cause.reasons.filter((reason) => !isDoneFailure(reason)))) : succeed$5(done);
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
	return isFailure(done) ? done : succeed$5(done.success.value);
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
	return !isFailure(halt) ? succeed$3(halt.success.value) : failCause$2(halt.failure);
};
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0-rc.112/node_modules/effect/dist/internal/layer.js
var provideLayer = (self, layer, options) => scopedWith((scope) => flatMap$1(options?.local ? buildWithMemoMap(layer, makeMemoMapUnsafe(), scope) : buildWithScope(layer, scope), (context) => provideContext(self, context)));
/** @internal */
var provide$1 = /*#__PURE__*/ dual((args) => isEffect$1(args[0]), (self, source, options) => isContext(source) ? provideContext(self, source) : provideLayer(self, Array.isArray(source) ? mergeAll(...source) : source, options));
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0-rc.112/node_modules/effect/dist/Effect.js
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
var succeed$1 = succeed$4;
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
var suspend = suspend$1;
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
var callback$1 = callback$2;
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
var fail$1 = fail$3;
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
var failCause$1 = failCause$3;
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
var die = die$1;
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
var flatMap = flatMap$1;
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
var tap$1 = tap$2;
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
var map$1 = map$3;
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
var catch_ = catch_$1;
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
var catchCause = catchCause$1;
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
var match = match$1;
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
var forever = forever$1;
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
//#region ../../node_modules/.bun/effect@4.0.0-rc.112/node_modules/effect/dist/internal/schema/annotations.js
/** @internal */
function resolve(ast) {
	return ast.checks ? ast.checks[ast.checks.length - 1].annotations : ast.annotations;
}
/** @internal */
function resolveAt(key) {
	return (ast) => resolve(ast)?.[key];
}
/** @internal */
var STRUCTURAL_ANNOTATION_KEY = "~structural";
/** @internal */
var IDENTIFIER_FALLBACK_KEY = "~identifier";
/** @internal */
var SENTINELS_ANNOTATION_KEY = "~sentinels";
/** @internal */
var CONSTRUCTOR_ANNOTATION_KEY = "~constructor";
/** @internal */
var jsonSchemaAnnotationKeys = [
	"title",
	"description",
	"default",
	"examples",
	"readOnly",
	"writeOnly",
	"format",
	"contentEncoding",
	"contentMediaType",
	"contentSchema"
];
/** @internal */
var resolveIdentifier = /*#__PURE__*/ resolveAt("identifier");
/** @internal */
var resolveIdentifierFallback = /*#__PURE__*/ resolveAt(IDENTIFIER_FALLBACK_KEY);
/** @internal */
var getExpected = /*#__PURE__*/ memoize((ast) => {
	const identifier = resolve(ast)?.identifier;
	if (typeof identifier === "string") return identifier;
	return ast.getExpected(getExpected);
});
/** @internal */
var annotationExcludedKeys = /*#__PURE__*/ new Set([
	SENTINELS_ANNOTATION_KEY,
	STRUCTURAL_ANNOTATION_KEY,
	"representation",
	"arbitrary",
	"brands",
	"toJsonSchema",
	"toCode",
	"toArbitrary",
	"toEquivalence",
	"toFormatter",
	"toCodec",
	"toCodecJson",
	"toCodecStringTree",
	"toCodecIso"
]);
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0-rc.112/node_modules/effect/dist/internal/schema/parser.js
var missing = /*#__PURE__*/ Symbol();
var succeed = succeed$3;
var missingExit = /*#__PURE__*/ succeed(missing);
var sameExit = /*#__PURE__*/ succeed(missing);
var toOption = (value) => value === missing ? none() : some(value);
var fromOptionExit = (option) => option._tag === "None" ? missingExit : succeed(option.value);
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0-rc.112/node_modules/effect/dist/SchemaIssue.js
/**
* Describes problems found while decoding, encoding, or checking data with
* schemas.
*
* An `Issue` records what failed and, for nested data, where the failure
* happened. The Schema system uses these values for missing keys, unexpected
* keys, invalid types, invalid values, failed filters, failed transformations,
* and alternatives that did not match. This module also formats issues.
*
* @since 4.0.0
*/
var TypeId$9 = "~effect/SchemaIssue/Issue";
/**
* Returns `true` if the given value is an {@link Issue}.
*
* **When to use**
*
* Use when you need to narrow an `unknown` value to `Issue` in error-handling
* code, such as distinguishing an `Issue` from other error types in a catch-all
* handler.
*
* **Details**
*
* - Checks for the internal `TypeId` brand on the value.
*
* **Example** (Type-guarding an unknown error)
*
* ```ts import.meta.vitest
* import { SchemaIssue } from "effect"
*
* const issue = new SchemaIssue.MissingKey(undefined)
* SchemaIssue.isIssue(issue) // => true
* SchemaIssue.isIssue("not an issue") // => false
* ```
*
* @see {@link Issue}
*
* @category guards
* @since 4.0.0
*/
function isIssue(u) {
	return hasProperty(u, TypeId$9) && u[TypeId$9] === TypeId$9;
}
/**
* Returns `true` when an issue contains an input reported by the schema parser.
*
* **When to use**
*
* Use when reading `Issue.input`, especially when `undefined` is a valid input
* value.
*
* **Details**
*
* Reported input is stored as an own property. This guard checks for that
* property and narrows `input` from optional to required.
*
* **Example** (Reading a reported input)
*
* ```ts import.meta.vitest
* import { Result, Schema, SchemaIssue } from "effect"
*
* const result = Schema.decodeUnknownResult(Schema.String)(1, { reportInput: true })
* if (Result.isFailure(result) && SchemaIssue.hasInput(result.failure.issue)) {
*   result.failure.issue.input // => 1
* }
* ```
*
* @see {@link Issue} for the complete issue model
*
* @category guards
* @since 4.0.0
*/
function hasInput(issue) {
	return Object.hasOwn(issue, "input");
}
var Base$1 = class {
	[TypeId$9] = TypeId$9;
	constructor(input, options) {
		if (options?.reportInput === true && input !== missing) this.input = input;
	}
};
/**
* Represents a schema issue produced when a schema filter (refinement check) fails.
*
* **When to use**
*
* Use when you need to inspect a schema issue that records which refinement
* check rejected the value.
*
* **Details**
*
* - `filter` is the AST filter node that produced this issue.
* - `issue` is the inner issue describing the failure reason.
*
* **Example** (Matching a Filter issue)
*
* ```ts import.meta.vitest
* import { SchemaAST, SchemaIssue } from "effect"
*
* const formatIssue = SchemaIssue.makeFormatterDefault()
*
* function describe(issue: SchemaIssue.Issue): string {
*   if (issue._tag === "Filter") {
*     return `Filter failed: ${formatIssue(issue.issue)}`
*   }
*   return formatIssue(issue)
* }
*
* const issue = new SchemaIssue.Filter(
*   SchemaAST.isPattern(/^valid$/),
*   new SchemaIssue.InvalidValue()
* )
* describe(issue) // => `Filter failed: Expected a valid value`
* ```
*
* @see {@link Leaf} — terminal issue types that commonly appear as the inner `issue`
* @see {@link CheckHook} — formatter hook for `Filter` issues
*
* @category models
* @since 4.0.0
*/
var Filter$1 = class extends Base$1 {
	_tag = "Filter";
	/**
	* The filter that failed.
	*/
	filter;
	/**
	* The issue that occurred.
	*/
	issue;
	constructor(filter, issue, input, options) {
		super(input, options);
		this.filter = filter;
		this.issue = issue;
	}
};
/**
* Represents a schema issue produced when a schema transformation (encode/decode step) fails.
*
* **When to use**
*
* Use when you need to inspect failures from `Schema.decodeTo` / `Schema.encodeTo`
*   transformations.
*
* **Details**
*
* - `ast` is the AST node for the transformation that failed.
* - `issue` is the inner issue describing the failure.
*
* @see {@link Filter} — failure from a refinement check (not a transformation)
* @see {@link Composite} — multiple issues from a single schema node
*
* @category models
* @since 4.0.0
*/
var Encoding = class extends Base$1 {
	_tag = "Encoding";
	/**
	* The schema that caused the issue.
	*/
	ast;
	/**
	* The issue that occurred.
	*/
	issue;
	constructor(ast, issue, input, options) {
		super(input, options);
		this.ast = ast;
		this.issue = issue;
	}
};
/**
* Wraps an inner {@link Issue} with a property-key path, indicating *where* in
* a nested structure the error occurred.
*
* **When to use**
*
* Use when you need to walk the issue tree to accumulate path segments for error
* reporting.
*
* **Details**
*
* - `path` is an array of property keys (strings, numbers, or symbols).
* - Formatters concatenate nested `Pointer` paths into a single path like
*   `["a"]["b"][0]`.
*
* @see {@link Composite} — groups multiple issues under one schema node
*
* @category models
* @since 3.10.0
*/
var Pointer = class extends Base$1 {
	_tag = "Pointer";
	/**
	* The path to the location in the input that caused the issue.
	*/
	path;
	/**
	* The issue that occurred.
	*/
	issue;
	constructor(path, issue) {
		super();
		this.path = path;
		this.issue = issue;
	}
};
/**
* Represents a schema issue produced when a required key or tuple index is missing from the input.
*
* **When to use**
*
* Use when you need to detect absent fields in struct/tuple validation.
*
* **Details**
*
* - `annotations` may contain a custom `messageMissingKey` for formatting.
*
* @see {@link Pointer} — wraps this issue with the missing key's path
* @see {@link UnexpectedKey} — the opposite case (extra key present)
*
* @category models
* @since 4.0.0
*/
var MissingKey = class extends Base$1 {
	_tag = "MissingKey";
	/**
	* The metadata for the issue.
	*/
	annotations;
	constructor(annotations) {
		super();
		this.annotations = annotations;
	}
};
/**
* Represents a schema issue produced when an input object or tuple contains a key/index not
* declared by the schema.
*
* **When to use**
*
* Use when you need to detect excess properties during strict struct/tuple
* validation.
*
* **Details**
*
* - `ast` is the schema that was being validated against.
* - `annotations` on `ast` may contain a custom `messageUnexpectedKey`.
* - The default formatter renders this as `"Expected no excess property"`, or
*   `"Unexpected key with value <input>"` when the issue reports an input.
*
* @see {@link MissingKey} — the opposite case (required key absent)
* @see {@link Pointer} — wraps this issue with the unexpected key's path
*
* @category models
* @since 4.0.0
*/
var UnexpectedKey = class extends Base$1 {
	_tag = "UnexpectedKey";
	/**
	* The schema that caused the issue.
	*/
	ast;
	constructor(ast, input, options) {
		super(input, options);
		this.ast = ast;
	}
};
/**
* Represents a schema issue that groups multiple child issues under a single schema node.
*
* **When to use**
*
* Use when you need to walk the issue tree for struct/tuple schemas that collect
* all field errors rather than failing on the first.
*
* **Details**
*
* - `issues` is a non-empty readonly array (at least one child).
* - Formatters flatten `Composite` by recursing into each child.
*
* @see {@link AnyOf} — used for union no-match errors (similar but different semantics)
* @see {@link Pointer} — adds path context to individual issues
*
* @category models
* @since 3.10.0
*/
var Composite = class extends Base$1 {
	_tag = "Composite";
	/**
	* The schema that caused the issue.
	*/
	ast;
	/**
	* The issues that occurred.
	*/
	issues;
	constructor(ast, issues, input, options) {
		super(input, options);
		this.ast = ast;
		this.issues = issues;
	}
};
/**
* Represents a schema issue produced when the runtime type of the input does not match the type
* expected by the schema.
*
* **When to use**
*
* Use when you need to detect basic type mismatches, such as a wrong primitive
* or `null` where an object was expected.
*
* **Details**
*
* - `ast` is the schema node that expected a different type.
* - The default formatter renders this as `"Expected <type>"`, adding
*   `", got <input>"` when the issue reports an input.
*
* **Example** (Formatting a type mismatch)
*
* ```ts import.meta.vitest
* import { Schema, SchemaIssue } from "effect"
*
* const formatIssue = SchemaIssue.makeFormatterDefault()
* const issue = new SchemaIssue.InvalidType(Schema.String.ast)
* formatIssue(issue) // => "Expected string"
* ```
*
* @see {@link InvalidValue} — the input has the right type but fails a value constraint
*
* @category models
* @since 4.0.0
*/
var InvalidType = class extends Base$1 {
	_tag = "InvalidType";
	/**
	* The schema that caused the issue.
	*/
	ast;
	constructor(ast, input, options) {
		super(input, options);
		this.ast = ast;
	}
};
/**
* Represents a schema issue produced when the input has the correct type but its value violates a
* constraint (e.g. a string that is too short, a number out of range).
*
* **When to use**
*
* Use when you need to detect constraint violations from `Schema.filter`,
* `Schema.minLength`, `Schema.greaterThan`, or similar checks.
*
* **Details**
*
* - A `message` annotation is returned unchanged and takes precedence over all
*   other default formatting.
* - Without `message`, an `expected` annotation is formatted as
*   `"Expected <expected>"`, adding `", got <input>"` when input is reported.
* - Without either annotation, the default formatter renders
*   `"Expected a valid value"`, or `"Invalid data <input>"` when input is
*   reported.
*
* **Example** (Returning InvalidValue from a custom filter)
*
* ```ts import.meta.vitest
* import { SchemaIssue } from "effect"
*
* const formatIssue = SchemaIssue.makeFormatterDefault()
* const issue = new SchemaIssue.InvalidValue({ message: "must not be empty" })
* formatIssue(issue) // => "must not be empty"
* ```
*
* @see {@link InvalidType} — the input has the wrong type entirely
* @see {@link Filter} — composite wrapper when a schema filter produces this issue
*
* @category models
* @since 4.0.0
*/
var InvalidValue = class extends Base$1 {
	_tag = "InvalidValue";
	/**
	* The metadata for the issue.
	*/
	annotations;
	constructor(annotations, input, options) {
		super(input, options);
		this.annotations = annotations;
	}
};
/**
* Represents a schema issue produced when a value does not match *any* member of a union schema.
*
* **When to use**
*
* Use when you need to inspect which union members were attempted and why each
* failed.
*
* **Details**
*
* - `ast` is the `Union` AST node.
* - `issues` contains the per-member failures.
*
* **Gotchas**
*
* `issues` is empty when no union member was applicable. In that case, the
* default formatter reports the expected type for the union and appends
* `", got <input>"` when input is reported.
*
* @see {@link OneOf} — the opposite: *too many* members matched
* @see {@link Composite} — groups multiple issues under a non-union schema
*
* @category models
* @since 4.0.0
*/
var AnyOf = class extends Base$1 {
	_tag = "AnyOf";
	/**
	* The schema that caused the issue.
	*/
	ast;
	/**
	* The issues that occurred.
	*/
	issues;
	constructor(ast, issues, input, options) {
		super(input, options);
		this.ast = ast;
		this.issues = issues;
	}
};
/**
* Represents a schema issue produced when a value matches *multiple* members of a union that is
* configured to allow exactly one match (oneOf mode).
*
* **When to use**
*
* Use when you need to detect ambiguous union matches when `oneOf` validation is
* enabled.
*
* **Details**
*
* - `ast` is the `Union` AST node.
* - `successes` lists the AST nodes of each member that accepted the input.
* - The default formatter renders this as
*   `"Expected exactly one member to match"`, or
*   `"Expected exactly one member to match the input <input>"` when input is
*   reported.
*
* @see {@link AnyOf} — the opposite: *no* members matched
*
* @category models
* @since 4.0.0
*/
var OneOf = class extends Base$1 {
	_tag = "OneOf";
	/**
	* The schema that caused the issue.
	*/
	ast;
	/**
	* The schemas that were successful.
	*/
	successes;
	constructor(ast, successes, input, options) {
		super(input, options);
		this.ast = ast;
		this.successes = successes;
	}
};
function makeFilterIssue(entry, input, options) {
	if (isIssue(entry)) return entry;
	if (typeof entry === "string") return new InvalidValue({ message: entry }, input, options);
	const inner = typeof entry.issue === "string" ? new InvalidValue({ message: entry.issue }, input, options) : entry.issue;
	return new Pointer(entry.path, inner);
}
/** @internal */
function makeSingle(out, input, options) {
	if (out === void 0) return;
	if (typeof out === "boolean") return out ? void 0 : new InvalidValue(void 0, input, options);
	return makeFilterIssue(out, input, options);
}
/** @internal */
function normalizeFilterOutput(ast, out, input, options) {
	if (Array.isArray(out)) {
		if (!isReadonlyArrayNonEmpty(out)) return;
		return out.length === 1 ? makeFilterIssue(out[0], input, options) : new Composite(ast, map$4(out, (entry) => makeFilterIssue(entry, input, options)), input, options);
	}
	return makeSingle(out, input, options);
}
/**
* Returns the built-in {@link LeafHook} used by default formatters.
*
* **When to use**
*
* Use as the default leaf renderer when customizing only the {@link CheckHook}.
*
* **Details**
*
* - Checks for a `message` annotation first; returns it if present.
* - For `InvalidValue`, an `expected` annotation uses the standard expected
*   value message and includes reported input when available.
* - Otherwise generates a default message per `_tag`. When the issue reports
*   input, the message includes its formatted value where applicable:
*   - `InvalidType` → `"Expected <type>"` or `"Expected <type>, got <input>"`
*   - `InvalidValue` → `"Expected a valid value"` or `"Invalid data <input>"`
*   - `MissingKey` → `"Missing key"`
*   - `UnexpectedKey` → `"Expected no excess property"` or
*     `"Unexpected key with value <input>"`
*   - `Forbidden` → `"Forbidden operation"`
*   - `OneOf` → `"Expected exactly one member to match"` or
*     `"Expected exactly one member to match the input <input>"`
*
* **Example** (Formatting Standard Schema issues with defaultLeafHook)
*
* ```ts import.meta.vitest
* import { SchemaIssue } from "effect"
*
* const formatter = SchemaIssue.makeFormatterStandardSchemaV1({
*   leafHook: SchemaIssue.defaultLeafHook
* })
* formatter(new SchemaIssue.MissingKey(undefined)) // => { issues: [{ path: [], message: "Missing key" }] }
* ```
*
* @see {@link LeafHook}
* @see {@link makeFormatterStandardSchemaV1}
*
* @category formatting
* @since 4.0.0
*/
var defaultLeafHook = (issue) => {
	const message = findMessage(issue);
	if (message !== void 0) return message;
	switch (issue._tag) {
		case "InvalidType": return getExpectedMessage(getExpected(issue.ast), issue);
		case "InvalidValue": {
			const expected = findExpected(issue);
			if (expected !== void 0) return getExpectedMessage(expected, issue);
			const input = formatInput(issue);
			return input === void 0 ? "Expected a valid value" : `Invalid data ${input}`;
		}
		case "MissingKey": return "Missing key";
		case "UnexpectedKey": {
			const input = formatInput(issue);
			return input === void 0 ? "Expected no excess property" : `Unexpected key with value ${input}`;
		}
		case "Forbidden": return "Forbidden operation";
		case "OneOf": {
			const input = formatInput(issue);
			return input === void 0 ? "Expected exactly one member to match" : `Expected exactly one member to match the input ${input}`;
		}
	}
};
/**
* Returns the built-in {@link CheckHook} used by default formatters.
*
* **When to use**
*
* Use as the default filter renderer when customizing only the {@link LeafHook}.
*
* **Details**
*
* - Looks for a `message` annotation on the inner issue first, then on the
*   filter itself.
* - Returns `undefined` when no annotation is found, causing the formatter to
*   fall back to `"Expected <filter>"` or, when the filter reports input,
*   `"Expected <filter>, got <input>"`.
*
* @see {@link CheckHook}
* @see {@link makeFormatterStandardSchemaV1}
*
* @category formatting
* @since 4.0.0
*/
var defaultCheckHook = (issue) => findMessage(issue.issue) ?? findMessage(issue);
/**
* Creates a {@link Formatter} that produces a `StandardSchemaV1.FailureResult`.
*
* **When to use**
*
* Use when you need schema parse errors in
* [Standard Schema V1](https://github.com/standard-schema/standard-schema)
* format, optionally customizing leaf or check issue rendering.
*
* **Details**
*
* - Returns a `Formatter<StandardSchemaV1.FailureResult>`.
* - Each leaf issue is flattened into `{ message, path }` entries.
* - `Pointer` paths are accumulated to produce full property paths.
* - Falls back to {@link defaultLeafHook} / {@link defaultCheckHook} when no
*   hooks are provided.
* - Default messages include reported input when the issue that produces the
*   message has an `input` field. The returned Standard Schema issues do not
*   receive an `input` field.
*
* **Gotchas**
*
* Reported input can appear inside the Standard Schema `message` string even
* though it is not exposed as a separate property. Custom hooks control their
* complete message and are not modified.
*
* **Example** (Creating a Standard Schema V1 formatter)
*
* ```ts import.meta.vitest
* import { SchemaIssue } from "effect"
*
* const formatter = SchemaIssue.makeFormatterStandardSchemaV1()
* formatter(new SchemaIssue.MissingKey(undefined)).issues[0].message // => "Missing key"
* ```
*
* @see {@link makeFormatterDefault} — produces a plain string instead
* @see {@link LeafHook}
* @see {@link CheckHook}
*
* @category formatting
* @since 4.0.0
*/
function makeFormatterStandardSchemaV1(options) {
	return (issue) => ({ issues: toDefaultIssues(issue, [], options?.leafHook ?? defaultLeafHook, options?.checkHook ?? defaultCheckHook) });
}
function formatInput(issue) {
	return hasInput(issue) ? format$1(issue.input) : void 0;
}
function findExpected(issue) {
	const expected = issue.annotations?.expected;
	return typeof expected === "string" ? expected : void 0;
}
function getExpectedMessage(expected, issue) {
	const input = formatInput(issue);
	return input === void 0 ? `Expected ${expected}` : `Expected ${expected}, got ${input}`;
}
function toDefaultIssues(issue, path, leafHook, checkHook) {
	switch (issue._tag) {
		case "Filter": {
			const message = checkHook(issue);
			if (message !== void 0) return [{
				path,
				message
			}];
			if (issue.issue._tag !== "InvalidValue") return toDefaultIssues(issue.issue, path, leafHook, checkHook);
			const expected = findExpected(issue.issue);
			return [{
				path,
				message: expected === void 0 ? getExpectedMessage(formatCheck(issue.filter), issue) : getExpectedMessage(expected, issue.issue)
			}];
		}
		case "Encoding": return toDefaultIssues(issue.issue, path, leafHook, checkHook);
		case "Pointer": return toDefaultIssues(issue.issue, [...path, ...issue.path], leafHook, checkHook);
		case "Composite": return issue.issues.flatMap((issue) => toDefaultIssues(issue, path, leafHook, checkHook));
		case "AnyOf":
			if (issue.issues.length === 0) return [{
				path,
				message: findMessage(issue) ?? getExpectedMessage(getExpected(issue.ast), issue)
			}];
			return issue.issues.flatMap((issue) => toDefaultIssues(issue, path, leafHook, checkHook));
		default: return [{
			path,
			message: leafHook(issue)
		}];
	}
}
function formatCheck(check) {
	const expected = check.annotations?.expected;
	if (typeof expected === "string") return expected;
	switch (check._tag) {
		case "Filter": return "<filter>";
		case "FilterGroup": return check.checks.map((check) => formatCheck(check)).join(" & ");
	}
}
/**
* Creates a {@link Formatter} that converts an {@link Issue} into a
* human-readable multi-line string.
*
* **When to use**
*
* Use when you need to format a `SchemaIssue.Issue` as error messages for
* logging, CLI output, or developer-facing diagnostics.
*
* **Details**
*
* - Flattens the issue tree into `{ message, path }` entries using
*   {@link defaultLeafHook} and {@link defaultCheckHook}.
* - Includes reported input in default messages when the node producing the
*   message has an `input` field.
* - Each entry is rendered as `"<message>"` or `"<message>\n  at <path>"`.
* - Multiple entries are joined with newlines.
*
* **Gotchas**
*
* Formatting an issue can disclose input retained with `reportInput: true`.
* Wrapper inputs are not inherited by child messages, and custom messages are
* returned unchanged.
*
* **Example** (Formatting an issue as a string)
*
* ```ts import.meta.vitest
* import { SchemaIssue } from "effect"
*
* const formatter = SchemaIssue.makeFormatterDefault()
* formatter(new SchemaIssue.MissingKey(undefined)) // => "Missing key"
* ```
*
* @see {@link makeFormatterStandardSchemaV1} — produces Standard Schema V1 format instead
* @see {@link Formatter}
*
* @category formatting
* @since 4.0.0
*/
function makeFormatterDefault() {
	return (issue) => formatIssue(issue, "");
}
/** @internal */
var defaultFormatter = /*#__PURE__*/ makeFormatterDefault();
function formatIssue(issue, path) {
	let message;
	switch (issue._tag) {
		case "Filter": {
			const annotated = defaultCheckHook(issue);
			if (annotated !== void 0) message = annotated;
			else {
				if (issue.issue._tag !== "InvalidValue") return formatIssue(issue.issue, path);
				const expected = findExpected(issue.issue);
				message = expected === void 0 ? getExpectedMessage(formatCheck(issue.filter), issue) : getExpectedMessage(expected, issue.issue);
			}
			break;
		}
		case "Encoding": return formatIssue(issue.issue, path);
		case "Pointer": return formatIssue(issue.issue, path + formatPath(issue.path));
		case "Composite":
		case "AnyOf":
			if (issue._tag === "Composite" || issue.issues.length > 0) return issue.issues.map((issue) => formatIssue(issue, path)).join("\n");
			message = findMessage(issue) ?? getExpectedMessage(getExpected(issue.ast), issue);
			break;
		default: message = defaultLeafHook(issue);
	}
	return path ? `${message}\n  at ${path}` : message;
}
function findMessage(issue) {
	if (issue._tag === "Pointer") return;
	if (issue._tag === "Encoding") return findMessage(issue.issue);
	const message = (issue._tag === "Filter" ? issue.filter.annotations : "annotations" in issue ? issue.annotations : issue.ast.annotations)?.[issue._tag === "MissingKey" ? "messageMissingKey" : issue._tag === "UnexpectedKey" ? "messageUnexpectedKey" : "message"];
	if (typeof message === "string") return message;
}
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0-rc.112/node_modules/effect/dist/internal/schema/cause.js
/** @internal */
function getSchemaIssue(cause) {
	let issue;
	for (const reason of cause.reasons) {
		if (!isFailReason(reason) || !isIssue(reason.error)) return;
		issue ??= reason.error;
	}
	return issue;
}
/** @internal */
function getSchemaIssueOrThrow(cause, message) {
	const issue = getSchemaIssue(cause);
	if (issue === void 0) throw new Error(message, { cause });
	return issue;
}
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0-rc.112/node_modules/effect/dist/SchemaGetter.js
/**
* Builds one-way conversions used by schemas.
*
* A `Getter<T, E, R>` receives an optional encoded value and returns an
* optional decoded value. It can also report a schema issue or require Effect
* services. Schema transformations use getters to describe one direction of a
* conversion, for example decoding a field from input data. This module
* includes basic getters, validation helpers, pure and effectful conversions,
* and ready-made conversions for common string, number, binary, date, form, and
* URL-related values.
*
* @since 4.0.0
*/
/**
* Represents a composable transformation from an encoded type `E` to a decoded type `T`.
*
* **When to use**
*
* Use when you need a schema getter to build and compose custom transformations
* for `Schema.decodeTo` or `Schema.decode`.
*
* **Details**
*
* A getter wraps a function `Option<E> -> Effect<Option<T>, Issue, R>`. It
* receives `Option.None` when the encoded key is absent, such as a missing
* struct field, and returns `Option.None` to omit the value from the decoded
* output. It fails with `Issue` on invalid input and may require Effect
* services via `R`. `.map(f)` applies `f` to the decoded value inside `Some`
* while leaving `None` unchanged. `.compose(other)` chains two getters by
* feeding the output of `this` into `other`; passthrough getters on either side
* are optimized away.
*
* **Example** (Creating and composing getters)
*
* ```ts import.meta.vitest
* import { Effect, Option, SchemaGetter } from "effect"
*
* const parseNumber = SchemaGetter.transform<number, string>((s) => Number(s))
* const double = SchemaGetter.transform<number, number>((n) => n * 2)
* const composed = parseNumber.compose(double)
* await Effect.runPromise(composed.run(Option.some("21"), {})) // => Option.some(42)
* ```
*
* @see {@link transform} to create a getter from a pure function
* @see {@link passthrough} for the identity getter
* @see {@link transformOrFail} for fallible transformation
*
* @category models
* @since 4.0.0
*/
var Getter = class Getter extends Class$1 {
	run;
	constructor(run) {
		super();
		this.run = run;
	}
	map(f) {
		return new Getter((oe, options) => this.run(oe, options).pipe(mapEager(map$5(f))));
	}
	compose(other) {
		if (isPassthrough(this)) return other;
		if (isPassthrough(other)) return this;
		return new Getter((oe, options) => this.run(oe, options).pipe(flatMapEager((ot) => other.run(ot, options))));
	}
};
var passthrough_$1 = /*#__PURE__*/ new Getter(succeed$1);
function isPassthrough(getter) {
	return getter.run === passthrough_$1.run;
}
function passthrough$1() {
	return passthrough_$1;
}
/**
* Creates a getter that applies a pure function to present values.
*
* **When to use**
*
* Use when you need a schema getter for a pure, infallible transformation
* between types.
* - Building encode/decode pairs for `Schema.decodeTo`.
*
* **Details**
*
* - This is the most commonly used constructor.
* - Transforms `Some(e)` to `Some(f(e))` and leaves `None` unchanged.
* - Skips `None` inputs — only called when a value is present.
* - Never fails.
*
* **Example** (Transforming strings to numbers)
*
* ```ts import.meta.vitest
* import { Schema, SchemaGetter } from "effect"
*
* const NumberFromString = Schema.String.pipe(
*   Schema.decodeTo(Schema.Number, {
*     decode: SchemaGetter.transform((s) => Number(s)),
*     encode: SchemaGetter.transform((n) => String(n))
*   })
* )
* Schema.decodeSync(NumberFromString)("42") // => 42
* ```
*
* @see {@link transformOrFail} when the transformation can fail
* @see {@link transformOptional} when you need to handle `None` inputs
* @see {@link passthrough} when no transformation is needed
*
* @category transforming
* @since 4.0.0
*/
function transform$1(f) {
	return transformOptional(map$5(f));
}
/**
* Creates a getter that transforms the full `Option` — both present and absent values.
*
* **When to use**
*
* Use when you need a schema getter to handle both `Some` and `None` cases.
*
* **Details**
*
* The getter is pure and never fails. It receives the full `Option<E>` and
* must return `Option<T>`, so it can turn a present value into absent or an
* absent value into present.
*
* **Example** (Filtering out empty strings)
*
* ```ts import.meta.vitest
* import { Effect, Option, SchemaGetter } from "effect"
*
* const skipEmpty = SchemaGetter.transformOptional<string, string>((o) =>
*   Option.filter(o, (s) => s.length > 0)
* )
* await Effect.runPromise(skipEmpty.run(Option.some(""), {})) // => Option.none()
* ```
*
* @see {@link transform} when you only need to transform present values
* @see {@link omit} when you always want `None`
*
* @category transforming
* @since 4.0.0
*/
function transformOptional(f) {
	return new Getter((oe) => succeed$1(f(oe)));
}
/**
* Coerces any value to a `string` using the global `String()` constructor.
*
* **When to use**
*
* Use when you need a schema getter to coerce a present encoded value to a
* string with `String()`.
*
* **Details**
*
* The getter is pure, never fails, and delegates to `globalThis.String`.
*
* **Example** (Coercing to a string)
*
* ```ts import.meta.vitest
* import { Effect, Option, SchemaGetter } from "effect"
*
* const toString = SchemaGetter.String<number>()
* await Effect.runPromise(toString.run(Option.some(42), {})) // => Option.some("42")
* ```
*
* @see {@link transform} for custom string conversions
*
* @category converting
* @since 4.0.0
*/
function String$3() {
	return transform$1(globalThis.String);
}
/**
* Coerces any value to a `number` using the global `Number()` constructor.
*
* **When to use**
*
* Use when you need a schema getter to coerce a present encoded value to a
* number with `Number()`.
*
* **Details**
*
* The getter is pure, never fails, and delegates to `globalThis.Number`. It may
* produce `NaN` for non-numeric inputs.
*
* **Example** (Coercing to a number)
*
* ```ts import.meta.vitest
* import { Effect, Option, SchemaGetter } from "effect"
*
* const toNumber = SchemaGetter.Number<string>()
* await Effect.runPromise(toNumber.run(Option.some("42"), {})) // => Option.some(42)
* ```
*
* @see {@link transformOrFail} for validated number parsing
*
* @category converting
* @since 4.0.0
*/
function Number$3() {
	return transform$1(globalThis.Number);
}
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0-rc.112/node_modules/effect/dist/SchemaTransformation.js
var TypeId$8 = "~effect/SchemaTransformation/Transformation";
/**
* Represents a bidirectional transformation between a decoded type `T` and an encoded
* type `E`, built from a pair of `Getter`s.
*
* **When to use**
*
* Use when you need a schema transformation that defines how a schema converts
* between two representations.
* - You want to compose multiple transformations into a pipeline.
* - You want to flip a transformation to swap decode/encode.
*
* **Details**
*
* This is the primary building block for `Schema.decodeTo`, `Schema.encodeTo`,
* `Schema.decode`, `Schema.encode`, and `Schema.link`. Each direction is a
* `SchemaGetter.Getter` that handles optionality, failure, and Effect services.
*
* - Immutable — `flip()` and `compose()` return new instances.
* - `flip()` swaps the decode and encode getters.
* - `compose(other)` chains: `this.decode` then `other.decode` for decoding,
*   `other.encode` then `this.encode` for encoding.
*
* **Example** (Composing two transformations)
*
* ```ts import.meta.vitest
* import { SchemaTransformation } from "effect"
*
* const trimAndLower = SchemaTransformation.trim().compose(
*   SchemaTransformation.toLowerCase()
* )
* trimAndLower._tag // => "Transformation"
* ```
*
* @see {@link make} — construct from `{ decode, encode }` getters
* @see {@link transform} — construct from pure functions
* @see {@link transformOrFail} — construct from effectful functions
* @see {@link Middleware} — effect-pipeline-level alternative
*
* @category models
* @since 4.0.0
*/
var Transformation = class Transformation {
	[TypeId$8] = TypeId$8;
	_tag = "Transformation";
	decode;
	encode;
	constructor(decode, encode) {
		this.decode = decode;
		this.encode = encode;
	}
	flip() {
		return new Transformation(this.encode, this.decode);
	}
	compose(other) {
		return new Transformation(this.decode.compose(other.decode), other.encode.compose(this.encode));
	}
};
/**
* Returns `true` if `u` is a `Transformation` instance.
*
* **When to use**
*
* Use to check whether a value is already a schema transformation before
* wrapping it.
*
* **Details**
*
* - Pure predicate, no side effects.
* - Acts as a TypeScript type guard.
*
* **Example** (Checking a value)
*
* ```ts import.meta.vitest
* import { SchemaTransformation } from "effect"
*
* SchemaTransformation.isTransformation(SchemaTransformation.trim()) // => true
* SchemaTransformation.isTransformation({ decode: null, encode: null }) // => false
* ```
*
* @see {@link Transformation}
* @see {@link make}
*
* @category guards
* @since 4.0.0
*/
function isTransformation(u) {
	return hasProperty(u, TypeId$8) && u[TypeId$8] === TypeId$8;
}
/**
* Constructs a `Transformation` from an object with `decode` and `encode`
* `Getter`s. If the input is already a `Transformation`, returns it as-is.
*
* **When to use**
*
* Use when you already have schema getter instances and want to pair them into
* a schema transformation.
* - You want idempotent wrapping (won't double-wrap).
*
* **Details**
*
* - Returns the input unchanged if it is already a `Transformation`.
*
* **Example** (Wrapping existing getters)
*
* ```ts import.meta.vitest
* import { SchemaGetter, SchemaTransformation } from "effect"
*
* const t = SchemaTransformation.make({
*   decode: SchemaGetter.transform<number, string>((s) => Number(s)),
*   encode: SchemaGetter.transform<string, number>((n) => String(n))
* })
* t._tag // => "Transformation"
* ```
*
* @see {@link transform} — simpler constructor from pure functions
* @see {@link transformOrFail} — constructor from effectful functions
* @see {@link Transformation}
*
* @category constructors
* @since 3.10.0
*/
var make$7 = (options) => {
	if (isTransformation(options)) return options;
	return new Transformation(options.decode, options.encode);
};
var passthrough_ = /*#__PURE__*/ new Transformation(/*#__PURE__*/ passthrough$1(), /*#__PURE__*/ passthrough$1());
function passthrough() {
	return passthrough_;
}
/**
* Decodes a `string` into a `number` and encodes a `number` back to a
* `string`.
*
* **When to use**
*
* Use when you need a schema transformation to parse numeric strings from APIs,
* form data, or URL parameters.
*
* **Details**
*
* Decoding coerces the string to a number like `Number(s)`. Encoding coerces
* the number to a string like `String(n)`. This does not validate that the
* result is finite; combine with `Schema.Finite` or `Schema.Int` for stricter
* checks.
*
* **Example** (Converting a string to a number)
*
* ```ts import.meta.vitest
* import { Schema, SchemaTransformation } from "effect"
*
* const schema = Schema.String.pipe(
*   Schema.decodeTo(Schema.Number, SchemaTransformation.numberFromString)
* )
* Schema.decodeSync(schema)("42") // => 42
* ```
*
* @see {@link bigintFromString}
* @see {@link transform}
*
* @category converting
* @since 4.0.0
*/
var numberFromString = /*#__PURE__*/ new Transformation(/*#__PURE__*/ Number$3(), /*#__PURE__*/ String$3());
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0-rc.112/node_modules/effect/dist/SchemaAST.js
/**
* Represents Effect schemas as runtime trees.
*
* Every `Schema` has an AST made from nodes for declarations, primitives,
* literals, arrays, objects, unions, suspended schemas, checks, annotations,
* encoding links, and parsing context. Most users work with the higher-level
* `Schema` module. Use `SchemaAST` when you need to inspect schema nodes, build
* ASTs programmatically, change encoded or decoded views, collect issues, or
* run low-level schema checks.
*
* @since 4.0.0
*/
function makeGuard(tag) {
	return (ast) => ast._tag === tag;
}
/**
* Narrows an {@link AST} to {@link Declaration}.
*
* **When to use**
*
* Use to recognize declaration AST nodes before running declaration-specific
* handling.
*
* @see {@link Declaration} for the AST node type narrowed by this guard
*
* @category guards
* @since 3.10.0
*/
var isDeclaration = /*#__PURE__*/ makeGuard("Declaration");
/**
* Narrows an {@link AST} to {@link Never}.
*
* **When to use**
*
* Use to detect the AST node for a schema that can never match before handling
* other schema variants.
*
* @see {@link Never} for the AST node type narrowed by this guard
* @see {@link never} for the singleton `Never` AST instance
*
* @category guards
* @since 4.0.0
*/
var isNever = /*#__PURE__*/ makeGuard("Never");
/**
* Narrows an {@link AST} to {@link Literal}.
*
* **When to use**
*
* Use to recognize exact string, number, boolean, or bigint literal AST nodes.
*
* @see {@link Literal} for the AST node type narrowed by this guard
* @see {@link LiteralValue} for the values stored by literal nodes
*
* @category guards
* @since 3.10.0
*/
var isLiteral = /*#__PURE__*/ makeGuard("Literal");
/**
* Narrows an {@link AST} to {@link UniqueSymbol}.
*
* @category guards
* @since 3.10.0
*/
var isUniqueSymbol = /*#__PURE__*/ makeGuard("UniqueSymbol");
/**
* Narrows an {@link AST} to {@link Arrays}.
*
* **When to use**
*
* Use to recognize array-like AST nodes before reading their element, rest, or
* mutability metadata.
*
* @see {@link Arrays} for the AST node type narrowed by this guard
*
* @category guards
* @since 4.0.0
*/
var isArrays = /*#__PURE__*/ makeGuard("Arrays");
/**
* Narrows an {@link AST} to {@link Objects}.
*
* @category guards
* @since 4.0.0
*/
var isObjects = /*#__PURE__*/ makeGuard("Objects");
/**
* Narrows an {@link AST} to {@link Suspend}.
*
* @category guards
* @since 3.10.0
*/
var isSuspend = /*#__PURE__*/ makeGuard("Suspend");
/**
* Represents a single step in an {@link Encoding} chain.
*
* **Details**
*
* A link pairs a target {@link AST} with a `Transformation` or `Middleware`
* that converts values between the current node and the target.
*
* - `to` — the AST node on the other side of this transformation step.
* - `transformation` — the bidirectional conversion logic (decode/encode).
*
* Links are composed into a non-empty array ({@link Encoding}) attached to
* AST nodes that have a different encoded representation.
*
* @see {@link Encoding}
* @see {@link decodeTo}
* @category models
* @since 4.0.0
*/
var Link = class {
	to;
	transformation;
	constructor(to, transformation) {
		this.to = to;
		this.transformation = transformation;
	}
};
/** @internal */
var defaultParseOptions = {};
/**
* Represents per-property metadata attached to AST nodes via {@link Base.context}.
*
* **Details**
*
* Tracks whether a property key is optional, mutable, has a constructor
* default, or carries key-level annotations. Typically set by helpers like
* {@link optionalKey} and `Schema.mutableKey`.
*
* - `isOptional` — the property key may be absent from the input.
* - `isMutable` — the property is `readonly` when `false`.
* - `constructorDefault` — a {@link Link} applied during construction to
*   supply missing values.
* - `annotations` — key-level annotations (e.g. description of the key
*   itself).
*
* @see {@link optionalKey}
* @see {@link isOptional}
* @category models
* @since 4.0.0
*/
var Context = class {
	isOptional;
	isMutable;
	/** Used for constructor default values (e.g. `withConstructorDefault` API) */
	constructorDefault;
	annotations;
	constructor(isOptional, isMutable, constructorDefault = void 0, annotations = void 0) {
		this.isOptional = isOptional;
		this.isMutable = isMutable;
		this.constructorDefault = constructorDefault;
		this.annotations = annotations;
	}
};
var TypeId$7 = "~effect/Schema";
/**
* Represents the abstract base class for all {@link AST} node variants.
*
* **Details**
*
* Every AST node extends `Base` and inherits these fields:
*
* - `annotations` — user-supplied metadata (identifier, title, description,
*   arbitrary keys).
* - `checks` — optional {@link Checks} for post-type-match validation.
* - `encoding` — optional {@link Encoding} chain for type ↔ wire
*   transformations.
* - `context` — optional {@link Context} for per-property metadata.
*
* Subclasses add a `_tag` discriminant and variant-specific data.
*
* @see {@link AST}
* @category models
* @since 4.0.0
*/
var Base = class {
	[TypeId$7] = TypeId$7;
	annotations;
	checks;
	encoding;
	context;
	constructor(annotations = void 0, checks = void 0, encoding = void 0, context = void 0) {
		this.annotations = annotations;
		this.checks = checks;
		this.encoding = encoding;
		this.context = context;
	}
	toString() {
		return `<${this._tag}>`;
	}
};
/**
* AST node for user-defined opaque types with custom parsing logic.
*
* **When to use**
*
* Use when you need a custom schema AST node because none of the built-in
* nodes fit.
*
* **Details**
*
* - `typeParameters` — inner schemas this declaration is parameterized over
*   (e.g. the element type for a custom collection).
* - `run` — factory that receives `typeParameters` and returns a parser that
*   validates or transforms raw input.
*
* @see {@link isDeclaration}
* @category models
* @since 3.10.0
*/
var Declaration = class Declaration extends Base {
	_tag = "Declaration";
	typeParameters;
	run;
	encodingChecks;
	/**
	* Parser factory {@link flip} swaps in, so a declaration can behave
	* differently when encoding. `undefined` reuses {@link run}.
	*/
	encodingRun;
	constructor(typeParameters, run, annotations, checks, encoding, context, encodingChecks, encodingRun) {
		super(annotations, checks, encoding, context);
		this.typeParameters = typeParameters;
		this.run = run;
		this.encodingChecks = encodingChecks;
		this.encodingRun = encodingRun;
	}
	/** @internal */
	getParser() {
		let run;
		return (input, options) => {
			if (input === missing) return missingExit;
			return (run ??= this.run(this.typeParameters))(input, this, options);
		};
	}
	_rebuild(recur, checks, encodingChecks, run, encodingRun) {
		const tps = mapOrSame(this.typeParameters, recur);
		return tps === this.typeParameters && checks === this.checks && encodingChecks === this.encodingChecks && run === this.run && encodingRun === this.encodingRun ? this : new Declaration(tps, run, this.annotations, checks, void 0, this.context, encodingChecks, encodingRun);
	}
	/** @internal */
	recur(recur) {
		return this._rebuild(recur, this.checks, this.encodingChecks, this.run, this.encodingRun);
	}
	/** @internal */
	flip(recur) {
		return this._rebuild(recur, this.encodingChecks, this.checks, this.encodingRun ?? this.run, this.run);
	}
	/** @internal */
	getExpected() {
		const expected = this.annotations?.expected;
		if (typeof expected === "string") return expected;
		return "<Declaration>";
	}
};
/**
* AST node matching the `null` literal value.
*
* **Details**
*
* Parsing succeeds only when the input is exactly `null`.
*
* @see {@link null_ null}
* @see {@link isNull}
* @category models
* @since 4.0.0
*/
var Null$1 = class extends Base {
	_tag = "Null";
	/** @internal */
	getParser() {
		return fromConst(this, null);
	}
	/** @internal */
	getExpected() {
		return "null";
	}
};
var null_ = /*#__PURE__*/ new Null$1();
/**
* AST node matching the `undefined` value.
*
* **Details**
*
* Parsing succeeds only when the input is exactly `undefined`.
*
* @see {@link undefined}
* @see {@link isUndefined}
* @category models
* @since 4.0.0
*/
var Undefined$1 = class extends Base {
	_tag = "Undefined";
	/** @internal */
	getParser() {
		return fromConst(this, void 0);
	}
	/** @internal */
	toCodecJson() {
		return replaceEncoding(this, [undefinedToNull]);
	}
	/** @internal */
	getExpected() {
		return "undefined";
	}
};
var undefinedToNull = /*#__PURE__*/ new Link(null_, /*#__PURE__*/ new Transformation(/*#__PURE__*/ transform$1(() => void 0), /*#__PURE__*/ transform$1(() => null)));
var undefined_ = /*#__PURE__*/ new Undefined$1();
/**
* AST node representing the `unknown` type — every value matches.
*
* **Details**
*
* Unlike {@link Any}, this is type-safe: the parsed result is typed as
* `unknown` rather than `any`.
*
* @see {@link unknown}
* @see {@link isUnknown}
* @category models
* @since 4.0.0
*/
var Unknown = class extends Base {
	_tag = "Unknown";
	/** @internal */
	getParser() {
		return fromRefinement(this, isUnknown);
	}
	/** @internal */
	getExpected() {
		return "unknown";
	}
};
/**
* Provides the singleton {@link Unknown} AST instance.
*
* **When to use**
*
* Use when you need the reusable AST singleton for a schema node that accepts
* every value while keeping parsed values opaque.
*
* @see {@link any} for the singleton that accepts every value as `any`
*
* @category constructors
* @since 4.0.0
*/
var unknown = /*#__PURE__*/ new Unknown();
/**
* AST node matching an exact primitive value (string, number, boolean, or
* bigint).
*
* **Details**
*
* Parsing succeeds only when the input is strictly equal (`===`) to the
* stored `literal`. Numeric literals must be finite — `Infinity`, `-Infinity`,
* and `NaN` are rejected at construction time.
*
* **Example** (Creating a literal AST)
*
* ```ts import.meta.vitest
* import { SchemaAST } from "effect"
*
* const ast = new SchemaAST.Literal("active")
* ast.literal // => "active"
* ```
*
* @see {@link LiteralValue}
* @see {@link isLiteral}
* @category models
* @since 3.10.0
*/
var Literal$1 = class extends Base {
	_tag = "Literal";
	literal;
	constructor(literal, annotations, checks, encoding, context) {
		super(annotations, checks, encoding, context);
		if (typeof literal === "number" && !globalThis.Number.isFinite(literal)) throw new Error(`A numeric literal must be finite, got ${format$1(literal)}`);
		this.literal = literal;
	}
	/** @internal */
	getParser() {
		return fromConst(this, this.literal);
	}
	/** @internal */
	matchPart(s, _options) {
		return s === globalThis.String(this.literal) ? this.literal : void 0;
	}
	/** @internal */
	toCodecJson() {
		return typeof this.literal === "bigint" ? literalToString(this) : this;
	}
	/** @internal */
	toCodecStringTree() {
		return typeof this.literal === "string" ? this : literalToString(this);
	}
	/** @internal */
	getExpected() {
		return typeof this.literal === "string" ? JSON.stringify(this.literal) : globalThis.String(this.literal);
	}
};
function literalToString(ast) {
	const literalAsString = globalThis.String(ast.literal);
	return replaceEncoding(ast, [new Link(new Literal$1(literalAsString), new Transformation(transform$1(() => ast.literal), transform$1(() => literalAsString)))]);
}
/**
* AST node matching any `string` value.
*
* @see {@link string}
* @see {@link isString}
*
* @category models
* @since 4.0.0
*/
var String$2 = class extends Base {
	_tag = "String";
	/** @internal */
	getParser() {
		return fromRefinement(this, isString);
	}
	/** @internal */
	matchPart(s, options) {
		const checks = this.checks;
		return checks && !options.disableChecks && collectIssues(checks, s, void 0, this, options) ? void 0 : s;
	}
	/** @internal */
	getExpected() {
		return "string";
	}
};
/**
* Provides the singleton {@link String} AST instance.
*
* **When to use**
*
* Use as the shared `SchemaAST` node for unconstrained JavaScript strings.
*
* @see {@link String} for the AST node class
* @see {@link isString} for narrowing an AST to a string node
*
* @category constructors
* @since 4.0.0
*/
var string = /*#__PURE__*/ new String$2();
/**
* AST node matching any `number` value (including `NaN`, `Infinity`,
* `-Infinity`).
*
* **Details**
*
* Default JSON serialization:
*
* - Finite numbers are serialized as JSON numbers.
* - `Infinity`, `-Infinity`, and `NaN` are serialized as JSON strings.
*
* If the node has an `isFinite` or `isInt` check, the string fallback is
* skipped since non-finite values cannot occur.
*
* @see {@link number}
* @see {@link isNumber}
* @category models
* @since 4.0.0
*/
var Number$2 = class extends Base {
	_tag = "Number";
	/** @internal */
	getParser() {
		return fromRefinement(this, isNumber);
	}
	/** @internal */
	matchKey(s, options) {
		return this._match(isStringNumberRegExp, s, options);
	}
	/** @internal */
	matchPart(s, options) {
		return this._match(isStringFiniteRegExp, s, options);
	}
	_match(regexp, s, options) {
		if (!regexp.test(s)) return void 0;
		const value = globalThis.Number(s);
		if (options.disableChecks || !this.checks) return value;
		return collectIssues(this.checks, value, void 0, this, options) ? void 0 : value;
	}
	/** @internal */
	toCodecJson() {
		if (this.checks && (hasCheck(this.checks, "effect/schema/isFinite") || hasCheck(this.checks, "effect/schema/isInt"))) return this;
		return replaceEncoding(this, [numberToJson]);
	}
	/** @internal */
	toCodecStringTree() {
		if (this.toCodecJson() === this) return replaceEncoding(this, [finiteToString]);
		return replaceEncoding(this, [numberToString]);
	}
	/** @internal */
	getExpected() {
		return "number";
	}
};
function hasCheck(checks, id) {
	return checks.some((check) => check.annotations?.representation?.id === id || check._tag === "FilterGroup" && hasCheck(check.checks, id));
}
/**
* Provides the singleton {@link Number} AST instance.
*
* **When to use**
*
* Use when you need the canonical `SchemaAST` node for schemas that accept any
* JavaScript number value.
*
* @see {@link Number} for the AST node class and serialization behavior
* @see {@link Literal} for exact finite numeric literal AST nodes
*
* @category constructors
* @since 4.0.0
*/
var number = /*#__PURE__*/ new Number$2();
/**
* AST node matching any `boolean` value (`true` or `false`).
*
* @see {@link boolean}
* @see {@link isBoolean}
*
* @category models
* @since 4.0.0
*/
var Boolean$1 = class extends Base {
	_tag = "Boolean";
	/** @internal */
	getParser() {
		return fromRefinement(this, isBoolean);
	}
	/** @internal */
	getExpected() {
		return "boolean";
	}
};
/**
* Provides the singleton {@link Boolean} AST instance.
*
* **When to use**
*
* Use to reuse the standard AST node that accepts either `true` or `false` when
* constructing schema ASTs directly.
*
* @see {@link Boolean} for the AST node class
* @see {@link Literal} for exact boolean literal AST nodes
*
* @category constructors
* @since 4.0.0
*/
var boolean = /*#__PURE__*/ new Boolean$1();
/**
* AST node for array-like types — both tuples and arrays.
*
* **When to use**
*
* Use when constructing or inspecting AST nodes for tuple or array-like schemas,
* including rest elements.
*
* **Details**
*
* - `elements` — positional element types (tuple elements). An element is
*   optional if its {@link Context.isOptional} is `true`.
* - `rest` — the rest/variadic element types. When non-empty, the first
*   entry is the "spread" type (e.g. `...Array<string>`), and subsequent
*   entries are trailing positional elements after the spread.
* - `isMutable` — whether the resulting array is `readonly` (`false`) or
*   mutable (`true`).
*
* **Gotchas**
*
* Construction enforces TypeScript ordering rules: a required element
* cannot follow an optional one, and an optional element cannot follow a
* rest element.
*
* **Example** (Inspecting a tuple AST)
*
* ```ts import.meta.vitest
* import { Schema, SchemaAST } from "effect"
*
* const schema = Schema.Tuple([Schema.String, Schema.Number])
* const ast = schema.ast
*
* if (SchemaAST.isArrays(ast)) {
*   [ast.elements.length, ast.rest.length] // => [2, 0]
* }
* ```
*
* @see {@link isArrays}
* @see {@link Objects}
* @category models
* @since 4.0.0
*/
var Arrays = class Arrays extends Base {
	_tag = "Arrays";
	isMutable;
	elements;
	rest;
	encodingChecks;
	constructor(isMutable, elements, rest, annotations, checks, encoding, context, encodingChecks) {
		super(annotations, checks, encoding, context);
		this.isMutable = isMutable;
		this.elements = elements;
		this.rest = rest;
		this.encodingChecks = encodingChecks;
		let hasOptional = false;
		for (let i = 0; i < elements.length; i++) if (isOptional(elements[i])) hasOptional = true;
		else if (hasOptional) throw new Error("A required element cannot follow an optional element. ts(1257)");
		if (hasOptional && rest.length > 1) throw new Error("A required element cannot follow an optional element. ts(1257)");
		for (let i = 1; i < rest.length; i++) if (isOptional(rest[i])) throw new Error("An optional element cannot follow a rest element. ts(1266)");
	}
	/** @internal */
	getParser(compile, compileConstructorDefault = compile) {
		const ast = this;
		let elements;
		let rest;
		const elementLen = ast.elements.length;
		const tailLen = Math.max(0, ast.rest.length - 1);
		function getParser(tailThreshold, index) {
			if (index < elementLen) return elements[index];
			else if (index >= tailThreshold) return rest[index - tailThreshold + 1];
			return rest[0];
		}
		return fnUntracedEager(function* (input, options) {
			if (input === missing) return missing;
			if (!Array.isArray(input)) return yield* fail$1(new InvalidType(ast, input, options));
			if (!elements) {
				elements = ast.elements.map((ast) => ({
					ast,
					parser: compileConstructorDefault(ast)
				}));
				rest = ast.rest.map((ast) => ({
					ast,
					parser: compileConstructorDefault(ast)
				}));
			}
			const len = input.length;
			const state = {
				ast,
				getParser,
				input,
				len,
				tailThreshold: Math.max(elementLen, len - tailLen),
				output: new globalThis.Array(len),
				issues: void 0,
				options
			};
			const eff = parseArray(state, input, {
				concurrency: resolveConcurrency(options?.concurrency)?.concurrency,
				end: ast.rest.length === 0 ? elementLen : Math.max(len, elementLen + tailLen)
			});
			if (eff) yield* eff;
			if (ast.rest.length === 0 && len > elementLen) for (let i = elementLen; i <= len - 1; i++) {
				const unexpected = new UnexpectedKey(ast, input[i], options);
				const issue = new Pointer([i], unexpected);
				if (options.errors === "all") {
					if (state.issues) state.issues.push(issue);
					else state.issues = [issue];
				} else return yield* fail$1(new Composite(ast, [issue], input, options));
			}
			if (state.issues) return yield* fail$1(new Composite(ast, state.issues, input, options));
			return state.output;
		});
	}
	_rebuild(recur, checks, encodingChecks) {
		const elements = mapOrSame(this.elements, recur);
		const rest = mapOrSame(this.rest, recur);
		return elements === this.elements && rest === this.rest && checks === this.checks && encodingChecks === this.encodingChecks ? this : new Arrays(this.isMutable, elements, rest, this.annotations, checks, void 0, this.context, encodingChecks);
	}
	/** @internal */
	recur(recur) {
		return this._rebuild(recur, this.checks, this.encodingChecks);
	}
	/** @internal */
	flip(recur) {
		return this._rebuild(recur, this.encodingChecks, this.checks);
	}
	/** @internal */
	getExpected() {
		return "array";
	}
};
var parseArray = /*#__PURE__*/ iterateEager()({
	onItem(s, item, i) {
		const value = i < s.len ? item : missing;
		return s.getParser(s.tailThreshold, i).parser(value, s.options);
	},
	step(s, item, exit, i) {
		if (exit._tag === "Failure") return wrapPropertyKeyIssue(s, s.ast, i, exit);
		const value = exit === sameExit ? item : exit[args];
		if (value !== missing) s.output[i] = value;
		else {
			const p = s.getParser(s.tailThreshold, i);
			if (isOptional(p.ast)) return;
			const issue = new Pointer([i], new MissingKey(p.ast.context?.annotations));
			if (s.options.errors === "all") {
				if (s.issues) s.issues.push(issue);
				else s.issues = [issue];
			} else return fail$2(new Composite(s.ast, [issue], s.input, s.options));
		}
	}
});
var resolveConcurrency = (value) => {
	value = value === "unbounded" ? Infinity : value ?? 1;
	return value > 1 ? { concurrency: value } : void 0;
};
var wrapPropertyKeyIssue = (s, ast, key, exit) => {
	if (exit.cause.reasons.length === 0) return exit;
	const issue = getSchemaIssue(exit.cause);
	if (issue === void 0) return failCause$2(map$2(exit.cause, (issue) => new Composite(ast, [new Pointer([key], issue)], s.input, s.options)));
	const pointer = new Pointer([key], issue);
	if (s.options.errors === "all") {
		if (s.issues) s.issues.push(pointer);
		else s.issues = [pointer];
	} else return fail$2(new Composite(ast, [pointer], s.input, s.options));
};
/**
* floating point or integer, with optional exponent
* @internal
*/
var FINITE_PATTERN = "[+-]?\\d*\\.?\\d+(?:[Ee][+-]?\\d+)?";
/**
* Returns the object keys that match the index signature parameter schema.
* @internal
*/
function getIndexSignatureKeys(input, parameter, options = defaultParseOptions) {
	let stringKeys;
	let symbolKeys;
	function go(parameter) {
		switch (parameter._tag) {
			case "String":
			case "TemplateLiteral": return (stringKeys ??= Object.keys(input)).filter((k) => parameter.matchPart(k, options) !== void 0);
			case "Number": return (stringKeys ??= Object.keys(input)).filter((k) => parameter.matchKey(k, options) !== void 0);
			case "Symbol": return (symbolKeys ??= Object.getOwnPropertySymbols(input)).filter((k) => parameter.matchKey(k, options) !== void 0);
			case "Union": return [...new Set(parameter.types.flatMap(go))];
			default: return [];
		}
	}
	return go(parameterFromPropertyKey(toEncoded(parameter)));
}
/**
* Represents a named property within an {@link Objects} node.
*
* **Details**
*
* Pairs a `name` (any `PropertyKey`) with a `type` ({@link AST}). The
* property's optionality and mutability are determined by the `type`'s
* {@link Context}.
*
* @see {@link Objects}
* @category models
* @since 3.10.0
*/
var PropertySignature = class {
	name;
	type;
	constructor(name, type) {
		this.name = name;
		this.type = type;
	}
};
function isIndexSignatureParameterSide(ast) {
	switch (ast._tag) {
		case "String":
		case "Number":
		case "Symbol":
		case "TemplateLiteral": return true;
		case "Union": return ast.types.every(isIndexSignatureParameterSide);
		default: return false;
	}
}
function isIndexSignatureParameter(ast) {
	return isIndexSignatureParameterSide(ast) && isIndexSignatureParameterSide(toEncoded(ast));
}
/**
* Represents an index signature entry within an {@link Objects} node.
*
* **When to use**
*
* Use when constructing or inspecting object AST entries for record-like keys
* and values.
*
* **Details**
*
* - `parameter` — the key type AST (e.g. {@link String} for `string` keys,
*   {@link TemplateLiteral} for patterned keys).
* - `type` — the value type SchemaAST.
*
* **Gotchas**
*
* Using `Schema.optionalKey` on the value type is not allowed for index
* signatures (throws at construction); use `Schema.optional` instead.
*
* @see {@link Objects}
* @see {@link PropertySignature}
* @category models
* @since 3.10.0
*/
var IndexSignature = class {
	parameter;
	type;
	constructor(parameter, type) {
		if (!isIndexSignatureParameter(parameter)) throw new Error(`Invalid index signature parameter ${parameter._tag}`);
		this.parameter = parameter;
		this.type = type;
		if (isOptional(type) && !containsUndefined(type)) throw new Error("Cannot use `Schema.optionalKey` with index signatures, use `Schema.optional` instead.");
	}
};
/**
* AST node for object-like schemas, including structs and records.
*
* **When to use**
*
* Use when constructing or inspecting AST nodes for structs or records rather
* than array-like schemas.
*
* **Details**
*
* - `propertySignatures` — named properties with their types (struct fields).
* - `indexSignatures` — index signature entries (record patterns), each with
*   a `parameter` AST for matching keys and a `type` AST for values.
*
* An `Objects` node with no properties and no index signatures performs only a
* non-nullish check: it accepts any value except `null` and `undefined`,
* including primitive values.
*
* **Gotchas**
*
* Duplicate property names throw at construction time.
*
* **Example** (Inspecting a struct AST)
*
* ```ts import.meta.vitest
* import { Schema, SchemaAST } from "effect"
*
* const schema = Schema.Struct({ name: Schema.String })
* const ast = schema.ast
*
* if (SchemaAST.isObjects(ast)) {
*   ast.propertySignatures.map((ps) => [ps.name, ps.type._tag]) // => [["name", "String"]]
* }
* ```
*
* @see {@link isObjects}
* @see {@link PropertySignature}
* @see {@link IndexSignature}
* @see {@link Arrays}
* @category models
* @since 4.0.0
*/
var Objects = class Objects extends Base {
	_tag = "Objects";
	propertySignatures;
	indexSignatures;
	encodingChecks;
	constructor(propertySignatures, indexSignatures, annotations, checks, encoding, context, encodingChecks) {
		super(annotations, checks, encoding, context);
		this.propertySignatures = propertySignatures;
		this.indexSignatures = indexSignatures;
		this.encodingChecks = encodingChecks;
		const duplicates = propertySignatures.map((ps) => ps.name).filter((name, i, arr) => arr.indexOf(name) !== i);
		if (duplicates.length > 0) throw new Error(`Duplicate identifiers: ${JSON.stringify(duplicates)}. ts(2300)`);
	}
	/** @internal */
	getParser(compile, compileConstructorDefault = compile) {
		const ast = this;
		const expectedKeys = [];
		for (const ps of ast.propertySignatures) expectedKeys.push(ps.name);
		const hasProperties = expectedKeys.length;
		const indexCount = ast.indexSignatures.length;
		let expectedKeysSet = hasProperties && indexCount ? new Set(expectedKeys) : void 0;
		if (!hasProperties && !indexCount) return fromRefinement(ast, isNotNullish);
		let properties;
		let indexes;
		const finishIndex = (s, key, k2, inputValue, exitValue) => {
			if (exitValue._tag === "Failure") return wrapPropertyKeyIssue(s, ast, key, exitValue) ?? void_$1;
			const value = exitValue === sameExit ? inputValue : exitValue[args];
			if (k2 !== missing && value !== missing) {
				if (hasProperties && (expectedKeysSet.has(key) || expectedKeysSet.has(k2))) return void_$1;
				assignProperty(s.out, k2, value);
			}
			return void_$1;
		};
		const parseIndex = (s, key, index, exitKey) => {
			if (!exitKey) {
				const eff = index.parserKey(key, s.options);
				if (!effectIsExit(eff)) return flatMap(exit(eff), (exit) => parseIndex(s, key, index, exit));
				exitKey = eff;
			}
			if (exitKey._tag === "Failure") return wrapPropertyKeyIssue(s, ast, key, exitKey) ?? void_$1;
			const k2 = exitKey === sameExit ? key : exitKey[args];
			const inputValue = s.input[key];
			const result = index.parserValue(inputValue, s.options);
			return effectIsExit(result) ? finishIndex(s, key, k2, inputValue, result) : flatMap(exit(result), (exit) => finishIndex(s, key, k2, inputValue, exit));
		};
		const parseStringIndex = (s, key, index) => {
			const inputValue = s.input[key];
			const result = index.parserValue(inputValue, s.options);
			return effectIsExit(result) ? finishIndex(s, key, key, inputValue, result) : flatMap(exit(result), (exit) => finishIndex(s, key, key, inputValue, exit));
		};
		const parseIndexes = indexCount ? iterateEager()({
			onItem: (s, [key, index]) => parseIndex(s, key, index),
			step: (_s, _, exit) => exit._tag === "Failure" ? exit : void 0
		}) : void 0;
		const compileMembers = () => {
			if (!properties) {
				properties = ast.propertySignatures.map((ps) => ({
					parser: compileConstructorDefault(ps.type),
					name: ps.name,
					type: ps.type
				}));
				indexes = indexCount ? ast.indexSignatures.map((is) => ({
					is,
					parserKey: compile(parameterFromPropertyKey(is.parameter)),
					parserValue: compileConstructorDefault(is.type)
				})) : void 0;
			}
			return properties;
		};
		const fallback = fnUntracedEager(function* (input, options) {
			if (input === missing) return missing;
			if (!(typeof input === "object" && input !== null && !Array.isArray(input))) return yield* fail$1(new InvalidType(ast, input, options));
			compileMembers();
			const record = input;
			const out = {};
			const state = {
				ast,
				input: record,
				out,
				issues: void 0,
				options
			};
			const errorsAllOption = options.errors === "all";
			const onExcessPropertyError = options.onExcessProperty === "error";
			const onExcessPropertyPreserve = options.onExcessProperty === "preserve";
			let inputKeys;
			if (!indexCount && (onExcessPropertyError || onExcessPropertyPreserve)) {
				expectedKeysSet ??= new Set(expectedKeys);
				inputKeys = Reflect.ownKeys(record);
				for (let i = 0; i < inputKeys.length; i++) {
					const key = inputKeys[i];
					if (!expectedKeysSet.has(key)) {
						if (onExcessPropertyError) {
							const unexpected = new UnexpectedKey(ast, record[key], options);
							const issue = new Pointer([key], unexpected);
							if (errorsAllOption) {
								if (state.issues) state.issues.push(issue);
								else state.issues = [issue];
								continue;
							} else return yield* fail$1(new Composite(ast, [issue], input, options));
						} else assignProperty(out, key, record[key]);
					}
				}
			}
			const concurrency = resolveConcurrency(options?.concurrency);
			if (hasProperties) {
				const eff = parseProperties(state, properties, concurrency);
				if (eff) yield* eff;
			}
			if (indexCount && !concurrency) for (let i = 0; i < indexCount; i++) {
				const index = indexes[i];
				const parse = index.is.parameter === string ? parseStringIndex : parseIndex;
				const keys = index.is.parameter === string ? Object.keys(record) : getIndexSignatureKeys(record, index.is.parameter, options);
				for (let j = 0; j < keys.length; j++) {
					const eff = parse(state, keys[j], index);
					if (!effectIsExit(eff)) yield* eff;
					else if (eff._tag === "Failure") return yield* eff;
				}
			}
			else if (parseIndexes) {
				const keyPairs = empty$2();
				for (let i = 0; i < indexCount; i++) {
					const index = indexes[i];
					const keys = getIndexSignatureKeys(record, index.is.parameter, options);
					for (let j = 0; j < keys.length; j++) keyPairs.push([keys[j], index]);
				}
				const eff = parseIndexes(state, keyPairs, concurrency);
				if (eff) yield* eff;
			}
			if (state.issues) return yield* fail$1(new Composite(ast, state.issues, input, options));
			if (options.propertyOrder === "original") {
				const keys = (inputKeys ?? Reflect.ownKeys(record)).concat(expectedKeys);
				const preserved = {};
				for (const key of keys) if (Object.hasOwn(out, key)) assignProperty(preserved, key, out[key]);
				return preserved;
			}
			return out;
		});
		if (indexCount) return fallback;
		const resume = (state, index, pending) => {
			const property = properties[index];
			return flatMap(exit(pending), (exit) => {
				const terminal = stepProperty(state, property, exit);
				if (terminal) return terminal;
				const done = () => succeed(state.out);
				const eff = parseProperties(state, properties.slice(index + 1));
				return eff ? flatMapEager(eff, done) : done();
			});
		};
		return (input, options) => {
			if (input === missing) return missingExit;
			if (options.errors === "all" || options.onExcessProperty !== void 0 || options.propertyOrder === "original" || options.concurrency !== void 0) return fallback(input, options);
			if (!(typeof input === "object" && input !== null && !Array.isArray(input))) return fail$1(new InvalidType(ast, input, options));
			const props = compileMembers();
			const record = input;
			const out = {};
			const state = {
				ast,
				input: record,
				out,
				issues: void 0,
				options
			};
			try {
				for (let index = 0; index < props.length; index++) {
					const property = props[index];
					const name = property.name;
					const hasKey = Object.hasOwn(record, name);
					const value = hasKey ? record[name] : missing;
					const exit = property.parser(value, options);
					if (!effectIsExit(exit)) return resume(state, index, exit);
					if (exit === sameExit) {
						if (hasKey) assignProperty(out, name, value);
						continue;
					}
					const terminal = stepProperty(state, property, exit);
					if (terminal) return terminal;
				}
			} catch (error) {
				return die(error);
			}
			return succeed(out);
		};
	}
	_rebuild(recur, recurParameter, checks, encodingChecks) {
		const props = mapOrSame(this.propertySignatures, (ps) => {
			const t = recur(ps.type);
			return t === ps.type ? ps : new PropertySignature(ps.name, t);
		});
		const indexes = mapOrSame(this.indexSignatures, (is) => {
			const p = recurParameter(is.parameter);
			const t = recur(is.type);
			return p === is.parameter && t === is.type ? is : new IndexSignature(p, t);
		});
		return props === this.propertySignatures && indexes === this.indexSignatures && checks === this.checks && encodingChecks === this.encodingChecks ? this : new Objects(props, indexes, this.annotations, checks, void 0, this.context, encodingChecks);
	}
	/** @internal */
	flip(recur) {
		return this._rebuild(recur, recur, this.encodingChecks, this.checks);
	}
	/** @internal */
	recur(recur, recurParameter = recur) {
		return this._rebuild(recur, recurParameter, this.checks, this.encodingChecks);
	}
	/** @internal */
	getExpected() {
		if (this.propertySignatures.length === 0 && this.indexSignatures.length === 0) return "object | array";
		return "object";
	}
};
function stepProperty(s, p, exit) {
	if (exit._tag === "Failure") return wrapPropertyKeyIssue(s, s.ast, p.name, exit);
	if (exit === sameExit) return;
	const value = exit[args];
	if (value !== missing) {
		assignProperty(s.out, p.name, value);
		return;
	}
	delete s.out[p.name];
	if (!isOptional(p.type)) {
		const issue = new Pointer([p.name], new MissingKey(p.type.context?.annotations));
		if (s.options.errors === "all") {
			if (s.issues) s.issues.push(issue);
			else s.issues = [issue];
			return;
		} else return fail$2(new Composite(s.ast, [issue], s.input, s.options));
	}
}
var parseProperties = /*#__PURE__*/ iterateEager()({
	onItem(s, p) {
		if (!Object.hasOwn(s.input, p.name)) return p.parser(missing, s.options);
		const value = s.input[p.name];
		assignProperty(s.out, p.name, value);
		return p.parser(value, s.options);
	},
	step: stepProperty
});
function combineChecks(a, b) {
	if (!a) return b;
	if (!b) return a;
	return [...a, ...b];
}
/** @internal */
function struct(fields, checks, annotations) {
	return new Objects(Reflect.ownKeys(fields).map((key) => {
		return new PropertySignature(key, fields[key].ast);
	}), [], annotations, checks);
}
/** @internal */
function getAST(self) {
	return self.ast;
}
/** @internal */
function union(members, mode, checks) {
	return new Union$1(members.map(getAST), mode, void 0, checks);
}
var toCandidate = /*#__PURE__*/ memoizeIdempotent((ast) => {
	while (true) {
		if (isSuspend(ast)) return unknown;
		const encoding = ast.encoding;
		if (!encoding) return ast.recur?.(toCandidate, identity) ?? ast;
		if (encoding.some((link) => link.transformation._tag === "Middleware" && link.transformation.decode !== identity)) return unknown;
		ast = encoding[encoding.length - 1].to;
	}
});
function getCandidateTypes(ast) {
	switch (ast._tag) {
		case "Null": return ["null"];
		case "Undefined": return ["undefined"];
		case "String":
		case "TemplateLiteral": return ["string"];
		case "Number": return ["number"];
		case "Boolean": return ["boolean"];
		case "Symbol":
		case "UniqueSymbol": return ["symbol"];
		case "BigInt": return ["bigint"];
		case "Arrays": return ["array"];
		case "ObjectKeyword": return [
			"object",
			"array",
			"function"
		];
		case "Objects": return ast.propertySignatures.length || ast.indexSignatures.length ? ["object"] : [
			"string",
			"number",
			"boolean",
			"symbol",
			"bigint",
			"object",
			"array",
			"function"
		];
		case "Enum": return Array.from(new Set(ast.enums.map(([, v]) => typeof v)));
		case "Literal": return [typeof ast.literal];
		case "Union": return Array.from(new Set(ast.types.flatMap(getCandidateTypes)));
		default: return [
			"null",
			"undefined",
			"string",
			"number",
			"boolean",
			"symbol",
			"bigint",
			"object",
			"array",
			"function"
		];
	}
}
/** @internal */
function collectSentinels(ast) {
	switch (ast._tag) {
		default: return [];
		case "Declaration": {
			const s = ast.annotations?.[SENTINELS_ANNOTATION_KEY];
			return Array.isArray(s) ? s : [];
		}
		case "Objects": return ast.propertySignatures.flatMap((ps) => {
			const type = ps.type;
			if (!isOptional(type)) {
				if (isLiteral(type)) return [{
					key: ps.name,
					literal: type.literal
				}];
				if (isUniqueSymbol(type)) return [{
					key: ps.name,
					literal: type.symbol
				}];
			}
			return [];
		});
		case "Arrays": return ast.elements.flatMap((e, i) => {
			if (!isOptional(e)) {
				if (isLiteral(e)) return [{
					key: i,
					literal: e.literal
				}];
				if (isUniqueSymbol(e)) return [{
					key: i,
					literal: e.symbol
				}];
			}
			return [];
		});
		case "Union": {
			if (ast.types.length === 0) return [];
			const members = ast.types.map((type) => collectSentinels(toCandidate(type)));
			return members[0].filter((s) => members.every((sentinels) => sentinels.some((o) => o.key === s.key && o.literal === s.literal)));
		}
		case "Suspend": return collectSentinels(ast.thunk());
	}
}
var candidateIndexCache = /*#__PURE__*/ new WeakMap();
var emptyCandidates = /*#__PURE__*/ Object.freeze([]);
function getIndex(types) {
	let index = candidateIndexCache.get(types);
	if (index) return index;
	let bySentinel;
	let sentinelCandidateCount = 0;
	let otherwise;
	let literalCandidates;
	let onlyLiterals = true;
	for (let i = 0; i < types.length; i++) {
		const a = types[i];
		const encoded = toCandidate(a);
		if (isNever(encoded)) continue;
		if (onlyLiterals) {
			if (isLiteral(encoded) || isUniqueSymbol(encoded)) {
				literalCandidates ??= /* @__PURE__ */ new Map();
				const literal = isLiteral(encoded) ? encoded.literal : encoded.symbol;
				let arr = literalCandidates.get(literal);
				if (!arr) literalCandidates.set(literal, arr = []);
				arr.push(a);
			} else onlyLiterals = false;
		}
		const sentinels = collectSentinels(encoded);
		if (sentinels.length) {
			bySentinel ??= /* @__PURE__ */ new Map();
			sentinelCandidateCount++;
			for (const { key, literal } of sentinels) {
				let entry = bySentinel.get(key);
				if (!entry) bySentinel.set(key, entry = [/* @__PURE__ */ new Map(), /* @__PURE__ */ new Set()]);
				entry[1].add(i);
				let indexes = entry[0].get(literal);
				if (!indexes) entry[0].set(literal, indexes = /* @__PURE__ */ new Set());
				indexes.add(i);
			}
		} else {
			otherwise ??= {};
			const candidateTypes = getCandidateTypes(encoded);
			for (const t of candidateTypes) (otherwise[t] ??= []).push(i);
		}
	}
	if (onlyLiterals && literalCandidates) {
		literalCandidates.forEach(Object.freeze);
		index = (input) => literalCandidates.get(input) ?? emptyCandidates;
	} else if (bySentinel?.size === 1 && !otherwise) {
		const [key, [byValue]] = bySentinel.entries().next().value;
		const candidates = byValue;
		for (const [literal, indexes] of byValue) candidates.set(literal, Object.freeze(Array.from(indexes, (index) => types[index])));
		index = (input, isConstructor) => {
			if (isObjectKeyword(input)) {
				const value = Object.hasOwn(input, key) ? input[key] : void 0;
				if (value !== void 0) return candidates.get(value) ?? emptyCandidates;
				if (isConstructor) return types;
			}
			return emptyCandidates;
		};
	} else if (bySentinel) {
		let commonSentinel;
		for (const entry of bySentinel) if ((!commonSentinel || entry[1][0].size > commonSentinel[1][0].size) && entry[1][1].size === sentinelCandidateCount) commonSentinel = entry;
		index = (input, isConstructor) => {
			const base = otherwise?.[input === null ? "null" : Array.isArray(input) ? "array" : typeof input] ?? emptyCandidates;
			if (!isObjectKeyword(input)) return base.map((i) => types[i]);
			const selected = new Set(base);
			let directKey;
			if (commonSentinel) {
				const [key, [byValue]] = commonSentinel;
				const hasKey = Object.hasOwn(input, key);
				const value = hasKey ? input[key] : void 0;
				if (hasKey && (!isConstructor || value !== void 0)) {
					const match = byValue.get(value);
					if (!match) return base.map((i) => types[i]);
					for (const i of match) selected.add(i);
					directKey = key;
				}
			}
			if (directKey === void 0) for (const [key, [byValue, all]] of bySentinel) {
				const hasKey = Object.hasOwn(input, key);
				const value = hasKey ? input[key] : void 0;
				if (hasKey && (!isConstructor || value !== void 0)) {
					const match = byValue.get(value);
					if (match) for (const i of match) selected.add(i);
				} else if (isConstructor) for (const i of all) selected.add(i);
			}
			for (const [key, [byValue, all]] of bySentinel) {
				if (key === directKey) continue;
				const hasKey = Object.hasOwn(input, key);
				const value = hasKey ? input[key] : void 0;
				if (hasKey && (!isConstructor || value !== void 0)) {
					const match = byValue.get(value);
					for (const i of selected) if (all.has(i) && !match?.has(i)) selected.delete(i);
				}
			}
			return Array.from(selected).sort((a, b) => a - b).map((i) => types[i]);
		};
	} else index = (input) => {
		return (otherwise?.[input === null ? "null" : Array.isArray(input) ? "array" : typeof input] ?? emptyCandidates).map((i) => types[i]).filter(filterLiterals(input));
	};
	candidateIndexCache.set(types, index);
	return index;
}
function filterLiterals(input) {
	return (ast) => {
		const encoded = toCandidate(ast);
		return encoded._tag === "Literal" ? encoded.literal === input : encoded._tag === "UniqueSymbol" ? encoded.symbol === input : true;
	};
}
/**
* The goal is to reduce the number of a union members that will be checked.
* This is useful to reduce the number of issues that will be returned.
*
* @internal
*/
function getCandidates(input, types, isConstructor = false) {
	return getIndex(types)(input, isConstructor);
}
/**
* AST node representing a union of schemas.
*
* **Details**
*
* - `types` — the member AST nodes.
* - `mode` — `"anyOf"` succeeds on the first match (like TypeScript unions);
*   `"oneOf"` requires exactly one member to match (fails if multiple do).
*
* During parsing, members are tried in order. An internal candidate index
* narrows which members to try based on the runtime type of the input and
* discriminant ("sentinel") fields, making large unions efficient.
*
* **Example** (Inspecting a union AST)
*
* ```ts import.meta.vitest
* import { Schema, SchemaAST } from "effect"
*
* const schema = Schema.Union([Schema.String, Schema.Number])
* const ast = schema.ast
*
* if (SchemaAST.isUnion(ast)) {
*   [ast.types.length, ast.mode] // => [2, "anyOf"]
* }
* ```
*
* @see {@link isUnion}
* @category models
* @since 3.10.0
*/
var Union$1 = class Union$1 extends Base {
	_tag = "Union";
	types;
	mode;
	encodingChecks;
	constructor(types, mode, annotations, checks, encoding, context, encodingChecks) {
		super(annotations, checks, encoding, context);
		this.types = types;
		this.mode = mode;
		this.encodingChecks = encodingChecks;
	}
	/** @internal */
	getParser(compile, compileConstructorDefault) {
		const ast = this;
		return (input, options) => {
			if (input === missing) return missingExit;
			const candidates = getCandidates(input, ast.types, compileConstructorDefault !== void 0);
			if (candidates.length === 1) {
				const result = compile(candidates[0])(input, options);
				if (result._tag === "Success") return result;
				return effectIsExit(result) ? failSingleUnionCandidate(ast, result.cause, input, options) : catchCause(result, (cause) => failSingleUnionCandidate(ast, cause, input, options));
			}
			const state = {
				ast,
				compile,
				input,
				out: void 0,
				successes: ast.mode === "oneOf" ? [] : void 0,
				issues: void 0,
				options
			};
			const concurrency = resolveConcurrency(options?.concurrency);
			const eff = parseUnion(state, candidates, concurrency ? {
				...concurrency,
				orderedStep: true
			} : void 0);
			if (!eff) {
				if (state.out) return state.out;
				return fail$1(new AnyOf(ast, state.issues ?? [], input, options));
			}
			return flatMapEager(eff, (_) => {
				if (state.out === sameExit) return succeed$1(input);
				if (state.out) return state.out;
				return fail$1(new AnyOf(ast, state.issues ?? [], input, options));
			});
		};
	}
	_rebuild(recur, checks, encodingChecks) {
		const types = mapOrSame(this.types, recur);
		return types === this.types && checks === this.checks && encodingChecks === this.encodingChecks ? this : new Union$1(types, this.mode, this.annotations, checks, void 0, this.context, encodingChecks);
	}
	/** @internal */
	recur(recur) {
		return this._rebuild(recur, this.checks, this.encodingChecks);
	}
	/** @internal */
	flip(recur) {
		return this._rebuild(recur, this.encodingChecks, this.checks);
	}
	/** @internal */
	matchPart(s, options) {
		for (const type of this.types) {
			const out = type.matchPart(s, options);
			if (out !== void 0) return out;
		}
	}
	/** @internal */
	getExpected(getExpected) {
		const expected = this.annotations?.expected;
		if (typeof expected === "string") return expected;
		if (this.types.length === 0) return "never";
		const types = this.types.map((type) => {
			const encoded = toEncoded(type);
			switch (encoded._tag) {
				case "Arrays": {
					const literals = encoded.elements.filter(isLiteral);
					if (literals.length > 0) return `${formatIsMutable(encoded.isMutable)}[ ${literals.map((e) => getExpected(e) + formatIsOptional(e.context?.isOptional)).join(", ")}, ... ]`;
					break;
				}
				case "Objects": {
					const literals = encoded.propertySignatures.filter((ps) => isLiteral(ps.type));
					if (literals.length > 0) return `{ ${literals.map((ps) => `${formatIsMutable(ps.type.context?.isMutable)}${formatPropertyKey(ps.name)}${formatIsOptional(ps.type.context?.isOptional)}: ${getExpected(ps.type)}`).join(", ")}, ... }`;
					break;
				}
			}
			return getExpected(encoded);
		});
		return Array.from(new Set(types)).join(" | ");
	}
};
function failSingleUnionCandidate(ast, cause, input, options) {
	const issue = getSchemaIssue(cause);
	if (!issue) return failCause$2(cause);
	return fail$2(new AnyOf(ast, [issue], input, options));
}
var parseUnion = /*#__PURE__*/ iterateEager()({
	onItem(s, ast) {
		return s.compile(ast)(s.input, s.options);
	},
	step(s, candidate, exit) {
		if (exit._tag === "Failure") {
			const issue = getSchemaIssue(exit.cause);
			if (issue === void 0) return exit;
			if (s.issues) s.issues.push(issue);
			else s.issues = [issue];
		} else {
			if (s.out && s.successes) {
				s.successes.push(candidate);
				return fail$2(new OneOf(s.ast, s.successes, s.input, s.options));
			}
			s.out = exit;
			if (s.successes) s.successes.push(candidate);
			else return void_$1;
		}
	}
});
var nonFiniteLiterals = /*#__PURE__*/ new Union$1([
	/*#__PURE__*/ new Literal$1("Infinity"),
	/*#__PURE__*/ new Literal$1("-Infinity"),
	/*#__PURE__*/ new Literal$1("NaN")
], "anyOf");
function formatIsMutable(isMutable) {
	return isMutable ? "" : "readonly ";
}
function formatIsOptional(isOptional) {
	return isOptional ? "?" : "";
}
/**
* Represents a single validation check attached to an AST node.
*
* **Details**
*
* - `run` — the validation function. Returns `undefined` on success, or an
*   `Issue` on failure.
* - `annotations` — optional filter-level annotations (expected message,
*   representation, arbitrary constraint hints).
* - `aborted` — when `true`, parsing stops immediately after this filter
*   fails (no further checks run).
*
* Use `.annotate()` to add metadata and `.abort()` to mark as aborting.
* Combine with another check via `.and()` to form a {@link FilterGroup}.
*
* @see {@link FilterGroup}
* @see {@link Check}
* @see {@link isPattern}
* @category models
* @since 4.0.0
*/
var Filter = class Filter extends Class$1 {
	_tag = "Filter";
	run;
	annotations;
	/**
	* Whether the parsing process should be aborted after this check has failed.
	*/
	aborted;
	constructor(run, annotations = void 0, aborted = false) {
		super();
		this.run = run;
		this.annotations = annotations;
		this.aborted = aborted;
	}
	annotate(annotations) {
		return new Filter(this.run, {
			...this.annotations,
			...annotations
		}, this.aborted);
	}
	abort() {
		return new Filter(this.run, this.annotations, true);
	}
	and(other, annotations) {
		return new FilterGroup([this, other], annotations);
	}
};
/**
* Represents a composite validation check grouping multiple {@link Check} values.
*
* **Details**
*
* Created by calling `.and()` on a {@link Filter} or another `FilterGroup`.
* All inner checks are run; failures from aborted filters still stop
* evaluation.
*
* @see {@link Filter}
* @see {@link Check}
* @category models
* @since 4.0.0
*/
var FilterGroup = class FilterGroup extends Class$1 {
	_tag = "FilterGroup";
	checks;
	annotations;
	constructor(checks, annotations = void 0) {
		super();
		this.checks = checks;
		this.annotations = annotations;
	}
	annotate(annotations) {
		return new FilterGroup(this.checks, {
			...this.annotations,
			...annotations
		});
	}
	and(other, annotations) {
		return new FilterGroup([this, other], annotations);
	}
};
/** @internal */
function makeFilter$1(filter, annotations, aborted = false) {
	return new Filter((input, ast, options) => normalizeFilterOutput(ast, filter(input, ast, options), input, options), annotations, aborted);
}
/** @internal */
function isFinite(annotations) {
	return makeFilter$1((n) => globalThis.Number.isFinite(n), {
		expected: "a finite number",
		representation: {
			id: "effect/schema/isFinite",
			payload: null
		},
		toJsonSchema: () => ({ type: "number" }),
		toCode: () => ({ runtime: "Schema.isFinite()" }),
		arbitrary: { constraint: {
			noInfinity: true,
			noNaN: true
		} },
		...annotations
	});
}
var numberToJson = /*#__PURE__*/ new Link(/*#__PURE__*/ new Union$1([/* @__PURE__ */ appendChecks(number, [/*#__PURE__*/ isFinite()]), nonFiniteLiterals], "anyOf"), /*#__PURE__*/ new Transformation(/*#__PURE__*/ Number$3(), /*#__PURE__*/ transform$1((n) => globalThis.Number.isFinite(n) ? n : globalThis.String(n))));
/**
* Creates a {@link Filter} that validates strings by running `RegExp.test`.
*
* **When to use**
*
* Use when string validation should be represented as a schema `Filter` backed
* by a regular expression.
*
* **Details**
*
* The filter can be used with `Schema.filter` or attached directly to a
* `String` AST node through checks. The regular expression is cloned and its
* `lastIndex` is reset before each test, so global and sticky expressions are
* deterministic and the provided regular expression is not mutated. The
* regular expression source is stored in annotations for serialization and
* arbitrary generation.
*
* **Gotchas**
*
* When deriving an arbitrary, only `regExp.source` is used. Regular expression
* flags are ignored because fast-check does not support them.
*
* **Example** (Validating an email pattern)
*
* ```ts import.meta.vitest
* import { SchemaAST } from "effect"
*
* const emailFilter = SchemaAST.isPattern(/^[^@]+@[^@]+$/)
* emailFilter.run("alice@example.com", SchemaAST.string, {}) // => undefined
* emailFilter.run("invalid", SchemaAST.string, {})?._tag // => "InvalidValue"
* ```
*
* @see {@link Filter}
* @category constructors
* @since 4.0.0
*/
function isPattern$1(regExp, annotations) {
	const source = regExp.source;
	const pattern = new globalThis.RegExp(source, regExp.flags);
	return makeFilter$1((s) => {
		pattern.lastIndex = 0;
		return pattern.test(s);
	}, {
		expected: `a string matching the RegExp ${source}`,
		representation: {
			id: "effect/schema/isPattern",
			payload: {
				source,
				flags: regExp.flags
			}
		},
		toJsonSchema: () => ({ pattern: source }),
		arbitrary: { constraint: { patterns: [regExp.source] } },
		...annotations
	});
}
function modifyOwnPropertyDescriptors(ast, f) {
	const d = Object.getOwnPropertyDescriptors(ast);
	f(d);
	return Object.create(Object.getPrototypeOf(ast), d);
}
var contextOwners = /*#__PURE__*/ new WeakMap();
/** @internal */
function getContextOwner(ast) {
	return contextOwners.get(ast) ?? ast;
}
/** @internal */
function replaceEncoding(ast, encoding) {
	if (ast.encoding === encoding) return ast;
	return modifyOwnPropertyDescriptors(ast, (d) => {
		d.encoding.value = encoding;
	});
}
/** @internal */
function replaceContext(ast, context) {
	if (ast.context === context) return ast;
	const owner = getContextOwner(ast);
	if (owner.context === context) return owner;
	const out = modifyOwnPropertyDescriptors(ast, (d) => {
		d.context.value = context;
	});
	contextOwners.set(out, owner);
	return out;
}
/** @internal */
function getLastEncoding(ast) {
	return ast.encoding ? getLastEncoding(ast.encoding[ast.encoding.length - 1].to) : ast;
}
/** @internal */
function annotate(ast, annotations) {
	if (ast.checks) {
		const last = ast.checks[ast.checks.length - 1];
		return replaceChecks(ast, append$1(ast.checks.slice(0, -1), last.annotate(annotations)));
	}
	return modifyOwnPropertyDescriptors(ast, (d) => {
		d.annotations.value = {
			...d.annotations.value,
			...annotations
		};
	});
}
/** @internal */
function replaceChecks(ast, checks) {
	if (ast._tag === "Suspend" && checks) throw new Error("Cannot add checks to Suspend");
	if (ast.checks === checks) return ast;
	return modifyOwnPropertyDescriptors(ast, (d) => {
		d.checks.value = checks;
	});
}
/** @internal */
function appendChecks(ast, checks) {
	return replaceChecks(ast, combineChecks(ast.checks, checks));
}
/** @internal */
function mapLink(link, f) {
	const to = f(link.to);
	return to === link.to ? link : new Link(to, link.transformation);
}
function updateLastLink(encoding, f) {
	const links = encoding;
	const last = links[links.length - 1];
	const out = mapLink(last, f);
	return out === last ? encoding : append$1(encoding.slice(0, encoding.length - 1), out);
}
/** @internal */
function applyToLastLink(f) {
	return (ast) => ast.encoding ? replaceEncoding(ast, updateLastLink(ast.encoding, f)) : ast;
}
/** @internal */
function replaceContextLastLink(ast, context) {
	return applyToLastLink((ast) => replaceContext(ast, context))(ast);
}
/** @internal */
function applyToSelfOrLastLinkEncodingIdempotent(f, options) {
	function out(ast) {
		if (ast.encoding) {
			const last = ast.encoding[ast.encoding.length - 1];
			return options?.stopAt?.(last) ? ast : replaceEncoding(ast, updateLastLink(ast.encoding, out));
		}
		return f(ast);
	}
	return memoizeIdempotent(out);
}
function appendTransformation(from, transformation, to) {
	const link = new Link(from, transformation);
	return replaceEncoding(to, to.encoding ? [...to.encoding, link] : [link]);
}
function mapOrSame(as, f) {
	let changed = false;
	const out = new Array(as.length);
	for (let i = 0; i < as.length; i++) {
		const a = as[i];
		const fa = f(a);
		if (fa !== a) changed = true;
		out[i] = fa;
	}
	return changed ? out : as;
}
/** @internal */
function annotateKey(ast, annotations) {
	return replaceContext(ast, ast.context ? new Context(ast.context.isOptional, ast.context.isMutable, ast.context.constructorDefault, {
		...ast.context.annotations,
		...annotations
	}) : new Context(false, false, void 0, annotations));
}
/** @internal */
var optionalKey = /*#__PURE__*/ memoizeIdempotent((ast) => {
	return optionalKeyLastLink(replaceContext(ast, ast.context ? ast.context.isOptional === false ? new Context(true, ast.context.isMutable, ast.context.constructorDefault, ast.context.annotations) : ast.context : new Context(true, false)));
});
var optionalKeyLastLink = /*#__PURE__*/ applyToLastLink(optionalKey);
/** @internal */
var optional$1 = /*#__PURE__*/ memoize((ast) => optionalKey(new Union$1([ast, undefined_], "anyOf")));
/**
* Attaches a `Transformation` to the `to` AST, making it decode from the
* `from` AST and encode back to it.
*
* **Details**
*
* This is the low-level primitive behind `Schema.transform` and
* `Schema.transformOrFail`. It appends a {@link Link} to the `to` node's
* encoding chain.
*
* - Returns a new AST with the same type as `to`.
*
* @see {@link Link}
* @see {@link Encoding}
* @see {@link flip}
* @category transforming
* @since 4.0.0
*/
function decodeTo$1(from, to, transformation) {
	return appendTransformation(from, transformation, to);
}
/**
* Returns `true` if the AST node represents an optional property.
*
* **Details**
*
* Checks `ast.context?.isOptional`. Defaults to `false` when no
* {@link Context} is set.
*
* @see {@link optionalKey}
* @see {@link Context}
* @category predicates
* @since 4.0.0
*/
function isOptional(ast) {
	return ast.context?.isOptional ?? false;
}
/** @internal */
function isMutable(ast) {
	return ast.context?.isMutable ?? false;
}
function isStructuralCheck(check) {
	return check.annotations?.["~structural"] === true || check._tag === "FilterGroup" && check.checks.every(isStructuralCheck);
}
function extractStructuralChecks(checks) {
	function extract(check) {
		if (isStructuralCheck(check)) return [check];
		return check._tag === "FilterGroup" ? check.checks.flatMap(extract) : [];
	}
	const out = checks.flatMap(extract);
	return isArrayNonEmpty(out) ? out : void 0;
}
/**
* Strips all encoding transformations from an AST, returning the decoded
* (type-level) representation.
*
* **Details**
*
* - Memoized: same input reference → same output reference.
* - Recursively walks into composite nodes ({@link Arrays}, {@link Objects},
*   {@link Union}, {@link Suspend}).
*
* **Example** (Getting the type AST)
*
* ```ts import.meta.vitest
* import { Schema, SchemaAST } from "effect"
*
* const schema = Schema.NumberFromString
* const typeAst = SchemaAST.toType(schema.ast)
* typeAst._tag // => "Number"
* ```
*
* @see {@link toEncoded}
* @see {@link flip}
* @category transforming
* @since 4.0.0
*/
var toType$1 = /*#__PURE__*/ memoizeIdempotent((ast) => {
	if (ast.encoding) return toType$1(replaceEncoding(ast, void 0));
	const out = ast;
	const type = out.recur?.(toType$1) ?? out;
	const encodingChecks = type.encodingChecks;
	if (encodingChecks) {
		const checks = type === ast ? encodingChecks : isArrays(type) || isObjects(type) || isDeclaration(type) && type.typeParameters.length > 0 ? extractStructuralChecks(encodingChecks) : void 0;
		return modifyOwnPropertyDescriptors(type, (d) => {
			d.encodingChecks.value = void 0;
			d.checks.value = combineChecks(type.checks, checks);
		});
	}
	return type;
});
/**
* Returns the encoded (wire-format) AST by flipping and then stripping
* encodings.
*
* **Details**
*
* Equivalent to `toType(flip(ast))`. This gives you the AST that describes
* the shape of the serialized/encoded data.
*
* - Memoized: same input reference → same output reference.
*
* **Example** (Getting the encoded AST)
*
* ```ts import.meta.vitest
* import { Schema, SchemaAST } from "effect"
*
* const schema = Schema.NumberFromString
* const encodedAst = SchemaAST.toEncoded(schema.ast)
* encodedAst._tag // => "String"
* ```
*
* @see {@link toType}
* @see {@link flip}
* @category transforming
* @since 4.0.0
*/
var toEncoded = /*#__PURE__*/ memoizeIdempotent((ast) => {
	return toType$1(flip(ast));
});
function flipEncoding(ast, encoding) {
	const links = encoding;
	const len = links.length;
	const last = links[len - 1];
	const ls = [new Link(flip(replaceEncoding(ast, void 0)), links[0].transformation.flip())];
	for (let i = 1; i < len; i++) ls.unshift(new Link(flip(links[i - 1].to), links[i].transformation.flip()));
	const to = flip(last.to);
	if (to.encoding) return replaceEncoding(to, [...to.encoding, ...ls]);
	else return replaceEncoding(to, ls);
}
/**
* Swaps the decode and encode directions of an AST's {@link Encoding} chain.
*
* **Details**
*
* After flipping, what was decoding becomes encoding and vice versa. This is
* the core operation behind `Schema.encode` — encoding a value is decoding
* with a flipped SchemaAST.
*
* - Memoized: same input reference → same output reference.
* - Recursively walks composite nodes.
*
* @see {@link toType}
* @see {@link toEncoded}
* @category transforming
* @since 4.0.0
*/
var flip = /*#__PURE__*/ memoize((ast) => {
	if (ast.encoding) return flipEncoding(ast, ast.encoding);
	const out = ast;
	return out.flip?.(flip) ?? out.recur?.(flip) ?? out;
});
/** @internal */
function containsUndefined(ast) {
	switch (ast._tag) {
		case "Undefined": return true;
		case "Union": return ast.types.some(containsUndefined);
		default: return false;
	}
}
function fromConst(ast, value) {
	const succeed$7 = succeed(value);
	return (input, options) => {
		if (input === missing) return missingExit;
		if (input === value) return succeed$7;
		return fail$1(new InvalidType(ast, input, options));
	};
}
function fromRefinement(ast, refinement) {
	return (input, options) => {
		if (input === missing) return missingExit;
		if (refinement(input)) return sameExit;
		return fail$1(new InvalidType(ast, input, options));
	};
}
var parameterFromPropertyKey = /*#__PURE__*/ applyToSelfOrLastLinkEncodingIdempotent((ast) => {
	switch (ast._tag) {
		default: return ast;
		case "Number": return ast.toCodecStringTree();
		case "Union": return ast.recur(parameterFromPropertyKey);
	}
});
/** @internal */
var parameterFromString = /*#__PURE__*/ applyToSelfOrLastLinkEncodingIdempotent((ast) => {
	switch (ast._tag) {
		default: return ast;
		case "Symbol":
		case "UniqueSymbol": return ast.toCodecStringTree();
		case "Union": return ast.recur(parameterFromString);
	}
});
/**
* any string, including newlines
* @internal
*/
var STRING_PATTERN = "[\\s\\S]*?";
var isStringFiniteRegExp = /*#__PURE__*/ new globalThis.RegExp(`^${FINITE_PATTERN}$`);
var isStringNumberRegExp = /*#__PURE__*/ new globalThis.RegExp(`^(?:${FINITE_PATTERN}|Infinity|-Infinity|NaN)$`);
/** @internal */
function isStringFinite(annotations) {
	return isPattern$1(isStringFiniteRegExp, {
		expected: "a string representing a finite number",
		representation: {
			id: "effect/schema/isStringFinite",
			payload: null
		},
		toJsonSchema: () => ({ pattern: isStringFiniteRegExp.source }),
		...annotations
	});
}
var finiteString = /*#__PURE__*/ appendChecks(string, [/*#__PURE__*/ isStringFinite()]);
var finiteToString = /*#__PURE__*/ new Link(finiteString, numberFromString);
var numberToString = /*#__PURE__*/ new Link(/*#__PURE__*/ new Union$1([finiteString, nonFiniteLiterals], "anyOf"), numberFromString);
/** @internal */
function collectIssues(checks, value, issues, ast, options) {
	for (let i = 0; i < checks.length; i++) {
		const check = checks[i];
		if (check._tag === "FilterGroup") {
			issues = collectIssues(check.checks, value, issues, ast, options);
			if (issues && (options.errors !== "all" || issues[issues.length - 1].filter.aborted)) return issues;
		} else {
			const issue = check.run(value, ast, options);
			if (issue) {
				const filter = new Filter$1(check, issue, value, options);
				if (issues) issues.push(filter);
				else issues = [filter];
				if (options.errors !== "all" || check.aborted) return issues;
			}
		}
	}
	return issues;
}
/** @internal */
function getConstructorDescriptor(ast) {
	if (!isDeclaration(ast)) return void 0;
	const getDescriptor = ast.annotations?.[CONSTRUCTOR_ANNOTATION_KEY];
	return isFunction(getDescriptor) ? getDescriptor(ast.typeParameters) : void 0;
}
function isJsonLeaf(u) {
	return u === null || typeof u === "string" || typeof u === "boolean" || typeof u === "number" && globalThis.Number.isFinite(u);
}
function isStringTreeLeaf(u) {
	return u === void 0 || typeof u === "string";
}
function isTree(u, isLeaf) {
	const cache = /* @__PURE__ */ new WeakMap();
	const stack = [];
	outer: while (true) {
		if (typeof u !== "object" || u === null) {
			if (!isLeaf(u)) return false;
		} else {
			const value = u;
			const cached = cache.get(value);
			if (cached === false) return false;
			if (cached === void 0) {
				const isArray = Array.isArray(value);
				if (!isArray) {
					const prototype = Object.getPrototypeOf(value);
					if (prototype !== null && prototype !== Object.prototype && Object.getPrototypeOf(prototype) !== null) return false;
				}
				cache.set(value, false);
				stack.push({
					value,
					keys: isArray ? value.length : Object.keys(value),
					index: 0
				});
			}
		}
		while (stack.length > 0) {
			const frame = stack[stack.length - 1];
			const keys = frame.keys;
			if (typeof keys === "number") {
				if (frame.index < keys) {
					u = frame.value[frame.index++];
					continue outer;
				}
			} else if (frame.index < keys.length) {
				u = frame.value[keys[frame.index++]];
				continue outer;
			}
			cache.set(frame.value, true);
			stack.pop();
		}
		return true;
	}
}
/**
* Returns true if the value is a JSON value.
*
* When a cyclic reference is detected, returns false.
*
* @internal
*/
function isJson(u) {
	return isTree(u, isJsonLeaf);
}
/** @internal */
var Json = /*#__PURE__*/ new Declaration([], () => (input, ast, options) => isJson(input) ? sameExit : fail$1(new InvalidType(ast, input, options)), {
	representation: {
		id: "effect/schema/Json",
		payload: null
	},
	expected: "JSON value",
	toCodecJson: () => void 0,
	toCodecStringTree: () => unknownToStringTree,
	toArbitrary: () => (fc) => fc.jsonValue()
});
/** @internal */
var MutableJson$1 = /*#__PURE__*/ annotate(Json, { representation: {
	id: "effect/schema/MutableJson",
	payload: null
} });
/** @internal */
var unknownToJson = /*#__PURE__*/ new Link(Json, /*#__PURE__*/ passthrough());
/** @internal */
var objectKeywordToJson = /*#__PURE__*/ new Link(/*#__PURE__*/ new Union$1([/*#__PURE__*/ new Arrays(false, [], [Json]), /*#__PURE__*/ new Objects([], [/*#__PURE__*/ new IndexSignature(string, Json)])], "anyOf"), /*#__PURE__*/ passthrough());
/**
* Returns true if the value is a StringTree value.
*
* When a cyclic reference is detected, returns false.
*
* @internal
*/
function isStringTree(u) {
	return isTree(u, isStringTreeLeaf);
}
/** @internal */
var unknownToStringTree = /*#__PURE__*/ new Link(/* @__PURE__ */ new Declaration([], () => (input, ast, options) => isStringTree(input) ? sameExit : fail$1(new InvalidType(ast, input, options)), {
	expected: "StringTree",
	toCodecStringTree: () => void 0
}), /*#__PURE__*/ passthrough());
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0-rc.112/node_modules/effect/dist/Fiber.js
/**
* Joins a fiber, blocking until it completes. If the fiber succeeds,
* returns its value. If it fails, the error is propagated.
*
* **When to use**
*
* Use when you need a forked fiber's failure to fail the current Effect because
* that fiber is part of the current workflow.
*
* **Gotchas**
*
* Joining a failed fiber propagates the fiber's Cause. Use {@link await_ await} when
* you need to inspect the `Exit` instead of failing.
*
* **Example** (Joining a fiber)
*
* ```ts import.meta.vitest
* import { Effect, Fiber } from "effect"
*
* const program = Effect.gen(function*() {
*   const fiber = yield* Effect.forkChild(Effect.succeed(42))
*   return yield* Fiber.join(fiber)
* })
*
* const actual = await Effect.runPromise(program)
* actual // => 42
* ```
*
* @see {@link await_ await} for inspecting the fiber outcome as an Exit
*
* @category combinators
* @since 2.0.0
*/
var join = fiberJoin;
/**
* Interrupts a fiber, causing it to stop executing and clean up any
* acquired resources.
*
* **When to use**
*
* Use when you need to cancel a forked fiber and wait for its cleanup to
* complete.
*
* **Details**
*
* The returned Effect completes only after the interrupted fiber has completed.
*
* **Gotchas**
*
* Interruption is cooperative. A fiber can continue running while it is inside
* uninterruptible work or finalizers.
*
* **Example** (Interrupting a fiber)
*
* ```ts import.meta.vitest
* import { Effect, Fiber } from "effect"
*
* const program = Effect.gen(function*() {
*   const fiber = yield* Effect.forkChild(
*     Effect.delay("1 second")(Effect.succeed(42))
*   )
*   yield* Fiber.interrupt(fiber)
* })
*
* await Effect.runPromise(program)
* ```
*
* @see {@link interruptAs} for specifying the interrupting fiber ID
* @see {@link await_ await} for observing the interrupted fiber's Exit
*
* @category interruption
* @since 2.0.0
*/
var interrupt = fiberInterrupt;
/**
* Adds a fiber to a `Scope` and returns the same fiber.
*
* **When to use**
*
* Use when a manually managed fiber should be interrupted when a Scope closes.
*
* **Details**
*
* When the scope is closed, the fiber is interrupted. If the scope is already
* closed, the fiber is interrupted immediately.
*
* **Gotchas**
*
* This does not wait for the fiber to complete. It only registers the
* interruption finalizer and returns the same fiber.
*
* @see {@link interrupt} for interrupting and waiting for completion
*
* @category resource management
* @since 4.0.0
*/
var runIn = fiberRunIn;
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0-rc.112/node_modules/effect/dist/MutableRef.js
var TypeId$6 = "~effect/MutableRef";
var MutableRefProto = {
	[TypeId$6]: TypeId$6,
	...PipeInspectableProto,
	toJSON() {
		return {
			_id: "MutableRef",
			current: toJson(this.current)
		};
	}
};
/**
* Creates a new MutableRef with the specified initial value.
*
* **When to use**
*
* Use to create a synchronous `MutableRef` initialized with a value.
*
* **Example** (Creating mutable refs)
*
* ```ts import.meta.vitest
* import { MutableRef } from "effect"
*
* // Create a counter reference
* const counter = MutableRef.make(0)
*
* MutableRef.get(counter) // => 0
*
* // Create a configuration reference
* const config = MutableRef.make({ debug: false, timeout: 5000 })
*
* MutableRef.get(config) // => { debug: false, timeout: 5000 }
*
* // Create a string reference
* const status = MutableRef.make("idle")
* MutableRef.set(status, "running")
*
* MutableRef.get(status) // => "running"
* ```
*
* @category constructors
* @since 2.0.0
*/
var make$6 = (value) => {
	const ref = Object.create(MutableRefProto);
	ref.current = value;
	return ref;
};
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0-rc.112/node_modules/effect/dist/MutableList.js
/**
* Defines the unique symbol used to represent an empty result when taking elements from a MutableList.
* This symbol is returned by `take` when the list is empty, allowing for safe type checking.
*
* **When to use**
*
* Use to detect that `take` returned no element before handling the result as a
* list item.
*
* **Example** (Checking for empty results)
*
* ```ts import.meta.vitest
* import { MutableList } from "effect"
*
* const list = MutableList.make<string>()
*
* MutableList.take(list) === MutableList.Empty // => true
* ```
*
* @category symbols
* @since 4.0.0
*/
var Empty = /*#__PURE__*/ Symbol.for("effect/MutableList/Empty");
/**
* Creates an empty MutableList.
*
* **Example** (Creating an empty mutable list)
*
* ```ts import.meta.vitest
* import { MutableList } from "effect"
*
* const list = MutableList.make<string>()
*
* list.length // => 0
* MutableList.append(list, "first")
* MutableList.take(list) // => "first"
* list.length // => 0
* ```
*
* @category constructors
* @since 2.0.0
*/
var make$5 = () => ({
	head: void 0,
	tail: void 0,
	length: 0
});
var emptyBucket = () => ({
	array: [],
	mutable: true,
	offset: 0,
	next: void 0
});
/**
* Appends an element to the end of the MutableList.
* This operation is optimized for high-frequency usage.
*
* **Example** (Appending elements)
*
* ```ts import.meta.vitest
* import { MutableList } from "effect"
*
* const list = MutableList.make<number>()
* MutableList.append(list, 1)
* MutableList.append(list, 2)
* MutableList.append(list, 3)
*
* MutableList.toArray(list) // => [1, 2, 3]
* list.length // => 3
* ```
*
* @category mutations
* @since 2.0.0
*/
var append = (self, message) => {
	if (!self.tail) self.head = self.tail = emptyBucket();
	else if (!self.tail.mutable) {
		self.tail.next = emptyBucket();
		self.tail = self.tail.next;
	}
	self.tail.array.push(message);
	self.length++;
};
/**
* Removes all elements from the MutableList, resetting it to an empty state.
* This operation is highly optimized and releases all internal memory.
*
* **Example** (Clearing a mutable list)
*
* ```ts import.meta.vitest
* import { MutableList } from "effect"
*
* const list = MutableList.make<number>()
* MutableList.appendAll(list, [1, 2, 3, 4, 5])
*
* MutableList.clear(list)
*
* MutableList.toArray(list) // => []
* list.length // => 0
* MutableList.take(list) === MutableList.Empty // => true
* ```
*
* @category mutations
* @since 4.0.0
*/
var clear = (self) => {
	self.head = self.tail = void 0;
	self.length = 0;
};
/**
* Takes up to N elements from the beginning of the MutableList and returns them as an array.
* The taken elements are removed from the list. This operation is optimized for performance
* and includes zero-copy optimizations when possible.
*
* **Example** (Taking batches)
*
* ```ts import.meta.vitest
* import { MutableList } from "effect"
*
* const list = MutableList.make<number>()
* MutableList.appendAll(list, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
*
* MutableList.takeN(list, 3) // => [1, 2, 3]
* MutableList.toArray(list) // => [4, 5, 6, 7, 8, 9, 10]
* list.length // => 7
* ```
*
* @category mutations
* @since 4.0.0
*/
var takeN = (self, n) => {
	if (n <= 0 || !self.head) return [];
	n = Math.min(n, self.length);
	if (n === self.length && self.head?.offset === 0 && !self.head.next) {
		const array = self.head.array;
		clear(self);
		return array;
	}
	const array = new Array(n);
	let index = 0;
	let chunk = self.head;
	while (chunk) {
		while (chunk.offset < chunk.array.length) {
			array[index++] = chunk.array[chunk.offset];
			if (chunk.mutable) chunk.array[chunk.offset] = void 0;
			chunk.offset++;
			if (index === n) {
				self.head = chunk;
				self.length -= n;
				if (self.length === 0) clear(self);
				return array;
			}
		}
		chunk = chunk.next;
	}
	clear(self);
	return array;
};
/**
* Takes a single element from the beginning of the MutableList.
* Returns the element if available, or the Empty symbol if the list is empty.
* The taken element is removed from the list.
*
* **Example** (Taking one element)
*
* ```ts import.meta.vitest
* import { MutableList } from "effect"
*
* const list = MutableList.make<string>()
* MutableList.appendAll(list, ["first", "second", "third"])
*
* MutableList.take(list) // => "first"
* MutableList.toArray(list) // => ["second", "third"]
* list.length // => 2
* ```
*
* @category mutations
* @since 4.0.0
*/
var take$1 = (self) => {
	if (!self.head) return Empty;
	const message = self.head.array[self.head.offset];
	if (self.head.mutable) self.head.array[self.head.offset] = void 0;
	self.head.offset++;
	self.length--;
	if (self.head.offset === self.head.array.length) {
		if (self.head.next) self.head = self.head.next;
		else clear(self);
	}
	return message;
};
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0-rc.112/node_modules/effect/dist/Queue.js
var TypeId$5 = "~effect/Queue";
var EnqueueTypeId = "~effect/Queue/Enqueue";
var DequeueTypeId = "~effect/Queue/Dequeue";
var variance = {
	_A: identity,
	_E: identity
};
var QueueProto = {
	[TypeId$5]: variance,
	[EnqueueTypeId]: variance,
	[DequeueTypeId]: variance,
	...PipeInspectableProto,
	toJSON() {
		return {
			_id: "effect/Queue",
			state: this.state._tag,
			size: sizeUnsafe(this)
		};
	}
};
/**
* Creates a `Queue` with optional capacity and overflow strategy.
*
* **Details**
*
* By default the queue is unbounded and uses the `"suspend"` strategy. Provide
* `capacity` for a bounded queue and choose `"suspend"`, `"dropping"`, or
* `"sliding"` to control what happens when the queue is full. The returned
* queue can be offered to, taken from, failed, ended, interrupted, or shut down.
*
* **Example** (Creating queues)
*
* ```ts import.meta.vitest
* import { Cause, Effect, Queue } from "effect"
*
* const program = Effect.gen(function*() {
*   const queue = yield* Queue.make<number, string | Cause.Done>()
*
*   // add messages to the queue
*   yield* Queue.offer(queue, 1)
*   yield* Queue.offer(queue, 2)
*   yield* Queue.offerAll(queue, [3, 4, 5])
*
*   // take messages from the queue
*   const messages = yield* Queue.takeAll(queue)
*
*   // signal that the queue is done
*   yield* Queue.end(queue)
*   const done = yield* Effect.flip(Queue.take(queue))
*
*   // signal that another queue has failed
*   const failedQueue = yield* Queue.make<number, string>()
*   const failed = yield* Queue.fail(failedQueue, "boom")
*   return { messages, done, failed }
* })
*
* await Effect.runPromise(program) // => { messages: [1, 2, 3, 4, 5], done: Cause.Done(), failed: true }
* ```
*
* @category constructors
* @since 4.0.0
*/
var make$4 = (options) => withFiber((fiber) => {
	const self = Object.create(QueueProto);
	self.dispatcher = fiber.currentDispatcher;
	self.capacity = options?.capacity ?? Number.POSITIVE_INFINITY;
	self.strategy = options?.strategy ?? "suspend";
	self.messages = make$5();
	self.scheduleRunning = false;
	self.state = {
		_tag: "Open",
		takers: /* @__PURE__ */ new Set(),
		offers: /* @__PURE__ */ new Set(),
		awaiters: /* @__PURE__ */ new Set()
	};
	return succeed$4(self);
});
/**
* Creates a bounded queue with the specified capacity that uses backpressure strategy.
*
* **Details**
*
* When the queue reaches capacity, producers will be suspended until space becomes available.
* This ensures all messages are processed but may slow down producers.
*
* **Example** (Creating bounded queues)
*
* ```ts import.meta.vitest
* import { Effect, Queue } from "effect"
*
* const program = Effect.gen(function*() {
*   const queue = yield* Queue.bounded<string>(5)
*
*   // This will succeed as queue has capacity
*   yield* Queue.offer(queue, "first")
*   yield* Queue.offer(queue, "second")
*
*   const size = yield* Queue.size(queue)
*   return size
* })
*
* await Effect.runPromise(program) // => 2
* ```
*
* @category constructors
* @since 2.0.0
*/
var bounded = (capacity) => make$4({ capacity });
/**
* Adds a message to the queue. Returns `false` if the queue is done.
*
* **Details**
*
* For bounded queues, this operation may suspend if the queue is at capacity,
* depending on the backpressure strategy. For dropping/sliding queues, it may
* return false or succeed immediately by dropping/sliding existing messages.
*
* **Example** (Offering a value)
*
* ```ts import.meta.vitest
* import { Effect, Queue } from "effect"
*
* const program = Effect.gen(function*() {
*   const queue = yield* Queue.bounded<number>(3)
*
*   // Successfully add messages to queue
*   const success1 = yield* Queue.offer(queue, 1)
*   const success2 = yield* Queue.offer(queue, 2)
*
*   // Queue state
*   const size = yield* Queue.size(queue)
*   return { offered: [success1, success2], size }
* })
*
* await Effect.runPromise(program) // => { offered: [true, true], size: 2 }
* ```
*
* @category offering
* @since 2.0.0
*/
var offer = (self, message) => suspend$1(() => {
	if (self.state._tag !== "Open") return exitFalse;
	else if (self.messages.length >= self.capacity) switch (self.strategy) {
		case "dropping": return exitFalse;
		case "suspend":
			if (self.capacity <= 0 && self.state.takers.size > 0) {
				append(self.messages, message);
				releaseTakers(self);
				return exitTrue;
			}
			return offerRemainingSingle(self, message);
		case "sliding":
			take$1(self.messages);
			append(self.messages, message);
			return exitTrue;
	}
	append(self.messages, message);
	scheduleReleaseTaker(self);
	return exitTrue;
});
/**
* Adds a message to the queue synchronously. Returns `false` if the queue is done.
*
* **When to use**
*
* Use when you are already in synchronous queue internals or a performance
* boundary where wrapping the mutation in `Effect` is intentionally avoided.
*
* **Gotchas**
*
* This is an unsafe operation that directly modifies the queue without Effect wrapping.
* Use this only when you're certain about the synchronous nature of the operation.
*
* **Example** (Offering a value synchronously)
*
* ```ts import.meta.vitest
* import { Effect, Queue } from "effect"
*
* // Create a queue effect and extract the queue for unsafe operations
* const program = Effect.gen(function*() {
*   const queue = yield* Queue.bounded<number>(3)
*
*   // Add messages synchronously using unsafe API
*   const success1 = Queue.offerUnsafe(queue, 1)
*   const success2 = Queue.offerUnsafe(queue, 2)
*
*   // Check current size
*   const size = Queue.sizeUnsafe(queue)
*   return { offered: [success1, success2], size }
* })
*
* await Effect.runPromise(program) // => { offered: [true, true], size: 2 }
* ```
*
* @category offering
* @since 4.0.0
*/
var offerUnsafe = (self, message) => {
	if (self.state._tag !== "Open") return false;
	else if (self.messages.length >= self.capacity) {
		if (self.strategy === "sliding") {
			take$1(self.messages);
			append(self.messages, message);
			return true;
		} else if (self.capacity <= 0 && self.state.takers.size > 0) {
			append(self.messages, message);
			releaseTakers(self);
			return true;
		}
		return false;
	}
	append(self.messages, message);
	scheduleReleaseTaker(self);
	return true;
};
/**
* Fails the queue with an error. If the queue is already done, `false` is
* returned.
*
* **Example** (Failing queues with an error)
*
* ```ts import.meta.vitest
* import { Effect, Exit, Queue } from "effect"
*
* const program = Effect.gen(function*() {
*   const queue = yield* Queue.bounded<number, string>(10)
*
*   // Fail the queue with an error
*   const failed = yield* Queue.fail(queue, "Something went wrong")
*
*   // Taking from the failed queue fails with the error
*   const exit = yield* Effect.exit(Queue.take(queue))
*   return [failed, exit]
* })
*
* await Effect.runPromise(program) // => [true, Exit.fail("Something went wrong")]
* ```
*
* @category completion
* @since 4.0.0
*/
var fail = (self, error) => failCause(self, causeFail(error));
/**
* Fails the queue with a cause. If the queue is already done, `false` is
* returned.
*
* **Example** (Failing queues with a cause)
*
* ```ts import.meta.vitest
* import { Cause, Effect, Exit, Queue } from "effect"
*
* const program = Effect.gen(function*() {
*   const queue = yield* Queue.bounded<number, string>(10)
*
*   // Create a cause and fail the queue
*   const cause = Cause.fail("Queue processing failed")
*   const failed = yield* Queue.failCause(queue, cause)
*
*   // The queue is now done with the specified failure cause
*   const exit = yield* Effect.exit(Queue.take(queue))
*   return [failed, exit]
* })
*
* await Effect.runPromise(program) // => [true, Exit.failCause(Cause.fail("Queue processing failed"))]
* ```
*
* @category completion
* @since 4.0.0
*/
var failCause = /*#__PURE__*/ dual(2, (self, cause) => sync$1(() => failCauseUnsafe(self, cause)));
/**
* Fails the queue with a cause synchronously. If the queue is already done, `false` is
* returned.
*
* **When to use**
*
* Use when queue completion must be driven from synchronous internals while
* preserving the full failure `Cause`.
*
* **Gotchas**
*
* This is an unsafe operation that directly modifies the queue without Effect wrapping.
*
* **Example** (Failing queues with a cause synchronously)
*
* ```ts import.meta.vitest
* import { Cause, Effect, Exit, Queue } from "effect"
*
* const program = Effect.gen(function*() {
*   const queue = yield* Queue.bounded<number, string>(10)
*
*   // Create a cause and fail the queue synchronously
*   const cause = Cause.fail("Processing error")
*   const failed = Queue.failCauseUnsafe(queue, cause)
*
*   // The queue is now done with the specified failure cause
*   const exit = Queue.takeUnsafe(queue)
*   return [failed, exit]
* })
*
* await Effect.runPromise(program) // => [true, Exit.failCause(Cause.fail("Processing error"))]
* ```
*
* @category completion
* @since 4.0.0
*/
var failCauseUnsafe = (self, cause) => {
	if (self.state._tag !== "Open") return false;
	const fail = exitZipRight(exitFailCause(cause), exitFailDone);
	if (self.state.offers.size === 0 && self.messages.length === 0) {
		finalize(self, fail);
		return true;
	}
	self.state = {
		...self.state,
		_tag: "Closing",
		exit: fail
	};
	return true;
};
/**
* Signals queue completion synchronously.
*
* **When to use**
*
* Use when implementing low-level queue integrations that must complete a queue
* without wrapping the operation in `Effect`.
*
* **Details**
*
* Returns `false` if the queue is already done.
*
* **Gotchas**
*
* This is an unsafe operation that directly modifies the queue without Effect wrapping.
*
* **Example** (Ending queues synchronously)
*
* ```ts import.meta.vitest
* import { Cause, Effect, Queue } from "effect"
*
* // Create a queue and use unsafe operations
* const program = Effect.gen(function*() {
*   const queue = yield* Queue.bounded<number, Cause.Done>(10)
*
*   // Add some messages
*   Queue.offerUnsafe(queue, 1)
*   Queue.offerUnsafe(queue, 2)
*
*   // End the queue synchronously
*   const ended = Queue.endUnsafe(queue)
*
*   // Existing messages can still be consumed while the queue is closing
*   const states = [queue.state._tag]
*
*   Queue.takeUnsafe(queue)
*   Queue.takeUnsafe(queue)
*
*   // After buffered messages are consumed, the queue is done
*   states.push(queue.state._tag)
*   return { ended, states }
* })
*
* await Effect.runPromise(program) // => { ended: true, states: ["Closing", "Done"] }
* ```
*
* @category completion
* @since 4.0.0
*/
var endUnsafe = (self) => failCauseUnsafe(self, causeFail(Done()));
/**
* Shuts down the queue immediately, discarding buffered messages and resuming
* pending operations.
*
* **Details**
*
* The operation is idempotent and returns `true`, including when the queue has
* already been shut down or completed.
*
* **Example** (Shutting down queues)
*
* ```ts import.meta.vitest
* import { Effect, Queue } from "effect"
*
* const program = Effect.gen(function*() {
*   const queue = yield* Queue.bounded<number>(2)
*
*   // Add messages
*   yield* Queue.offer(queue, 1)
*   yield* Queue.offer(queue, 2)
*
*   // Shutdown clears buffered messages and prevents further offers
*   const wasShutdown = yield* Queue.shutdown(queue)
*
*   // Queue is now done and cleared
*   const size = yield* Queue.size(queue)
*   return { wasShutdown, size }
* })
*
* await Effect.runPromise(program) // => { wasShutdown: true, size: 0 }
* ```
*
* @category completion
* @since 2.0.0
*/
var shutdown = (self) => sync$1(() => {
	if (self.state._tag === "Done") return true;
	clear(self.messages);
	const offers = self.state.offers;
	finalize(self, self.state._tag === "Open" ? exitInterrupt : self.state.exit);
	if (offers.size > 0) {
		for (const entry of offers) if (entry._tag === "Single") entry.resume(exitFalse);
		else entry.resume(exitSucceed(entry.remaining.slice(entry.offset)));
		offers.clear();
	}
	return true;
});
/**
* Takes all currently available messages, waiting until at least one message
* is available when the queue is empty.
*
* **When to use**
*
* Use when consumers should process the next non-empty batch of buffered
* messages instead of repeatedly taking one message at a time.
*
* **Details**
*
* Returns a non-empty array. If the queue completes or fails before a message
* can be taken, the effect fails with the queue's terminal error.
*
* **Example** (Taking all available values)
*
* ```ts import.meta.vitest
* import { Cause, Effect, Queue } from "effect"
*
* const program = Effect.gen(function*() {
*   const queue = yield* Queue.bounded<number, Cause.Done>(5)
*
*   // Add several messages
*   yield* Queue.offerAll(queue, [1, 2, 3, 4, 5])
*
*   // Take all available messages
*   const messages1 = yield* Queue.takeAll(queue)
*   return messages1
* })
*
* await Effect.runPromise(program) // => [1, 2, 3, 4, 5]
* ```
*
* @category taking
* @since 2.0.0
*/
var takeAll = (self) => takeBetween(self, 1, Number.POSITIVE_INFINITY);
/**
* Takes between `min` and `max` messages from the queue.
*
* **Details**
*
* The operation waits when fewer than the required minimum messages are
* available. It returns at most `max` messages. If the queue completes or fails
* before the minimum can be satisfied, the effect fails with the queue's
* terminal error.
*
* **Example** (Taking a bounded batch of values)
*
* ```ts import.meta.vitest
* import { Cause, Effect, Queue } from "effect"
*
* const program = Effect.gen(function*() {
*   const queue = yield* Queue.bounded<number>(10)
*
*   // Add several messages
*   yield* Queue.offerAll(queue, [1, 2, 3, 4, 5, 6, 7, 8])
*
*   // Take between 2 and 5 messages
*   const batch1 = yield* Queue.takeBetween(queue, 2, 5)
*
*   // Take between 1 and 10 messages (but only 3 remain)
*   const batch2 = yield* Queue.takeBetween(queue, 1, 10)
*
*   // No more messages available, will wait or return done
*   // const batch3 = yield* Queue.takeBetween(queue, 1, 3)
*   return [batch1, batch2]
* })
*
* await Effect.runPromise(program) // => [[1, 2, 3, 4, 5], [6, 7, 8]]
* ```
*
* @category taking
* @since 2.0.0
*/
var takeBetween = (self, min, max) => suspend$1(() => takeBetweenUnsafe(self, min, max) ?? andThen$1(awaitTake(self), takeBetween(self, 1, max)));
/**
* Takes a single message from the queue, or wait for a message to be
* available.
*
* **Details**
*
* If the queue is done, it will fail with `Done`. If the
* queue fails, the Effect will fail with the error.
*
* **Example** (Taking one value)
*
* ```ts import.meta.vitest
* import { Cause, Effect, Exit, Queue } from "effect"
*
* const program = Effect.gen(function*() {
*   const queue = yield* Queue.bounded<string, Cause.Done>(3)
*
*   // Add some messages
*   yield* Queue.offer(queue, "first")
*   yield* Queue.offer(queue, "second")
*
*   // Take messages one by one
*   const msg1 = yield* Queue.take(queue)
*   const msg2 = yield* Queue.take(queue)
*
*   // End the queue
*   yield* Queue.end(queue)
*
*   // Taking from an ended queue fails with Done
*   const result = yield* Effect.exit(Queue.take(queue))
*   return [[msg1, msg2], result]
* })
*
* await Effect.runPromise(program) // => [["first", "second"], Exit.fail(Cause.Done())]
* ```
*
* @category taking
* @since 2.0.0
*/
var take = (self) => suspend$1(() => takeUnsafe(self) ?? andThen$1(awaitTake(self), take(self)));
/**
* Attempts to take one message from the queue synchronously.
*
* **When to use**
*
* Use when polling queue internals must not suspend or register a waiting taker,
* and `undefined` is an acceptable result for an empty queue.
*
* **Details**
*
* Returns an `Exit` for an immediately available message or for the queue's
* terminal state. Returns `undefined` when no message is immediately available.
* This operation does not wait or register a taker.
*
* **Example** (Taking one value synchronously)
*
* ```ts import.meta.vitest
* import { Effect, Exit, Queue } from "effect"
*
* // Create a queue and use unsafe operations
* const program = Effect.gen(function*() {
*   const queue = yield* Queue.bounded<number>(10)
*
*   // Add some messages
*   Queue.offerUnsafe(queue, 1)
*   Queue.offerUnsafe(queue, 2)
*
*   // Take a message synchronously
*   const result1 = Queue.takeUnsafe(queue)
*
*   const result2 = Queue.takeUnsafe(queue)
*
*   // No more messages - returns undefined
*   const result3 = Queue.takeUnsafe(queue)
*   return [result1, result2, result3]
* })
*
* await Effect.runPromise(program) // => [Exit.succeed(1), Exit.succeed(2), undefined]
* ```
*
* @category taking
* @since 4.0.0
*/
var takeUnsafe = (self) => {
	if (self.state._tag === "Done") return self.state.exit;
	if (self.messages.length > 0) {
		const message = take$1(self.messages);
		releaseCapacity(self);
		return exitSucceed(message);
	} else if (self.capacity <= 0 && self.state.offers.size > 0) {
		self.capacity = 1;
		releaseCapacity(self);
		self.capacity = 0;
		const message = take$1(self.messages);
		releaseCapacity(self);
		return exitSucceed(message);
	}
};
/**
* Returns the current number of buffered messages in the queue synchronously.
*
* **When to use**
*
* Use when you need an immediate `Queue` size snapshot for diagnostics or
* internals and do not need the read wrapped in `Effect`.
*
* **Details**
*
* After `endUnsafe`, a queue remains `Closing` while buffered messages are
* drained, and its size continues to include those messages. A `Done` queue
* reports a size of `0`. This unsafe operation reads the queue state directly
* without Effect wrapping.
*
* **Example** (Checking queue size synchronously)
*
* ```ts import.meta.vitest
* import { Cause, Effect, Queue } from "effect"
*
* const program = Effect.gen(function*() {
*   const queue = yield* Queue.bounded<number, Cause.Done>(10)
*
*   // Check size of empty queue
*   const size1 = Queue.sizeUnsafe(queue)
*
*   // Add some messages
*   Queue.offerUnsafe(queue, 1)
*   Queue.offerUnsafe(queue, 2)
*   Queue.offerUnsafe(queue, 3)
*
*   // Check size after adding messages
*   const size2 = Queue.sizeUnsafe(queue)
*
*   // End the queue
*   Queue.endUnsafe(queue)
*
*   // Ending retains the buffered size while the queue is Closing
*   const size3 = Queue.sizeUnsafe(queue)
*   return [size1, size2, size3]
* })
*
* await Effect.runPromise(program) // => [0, 3, 3]
* ```
*
* @category sizes
* @since 4.0.0
*/
var sizeUnsafe = (self) => self.state._tag === "Done" ? 0 : self.messages.length;
var exitFalse = /*#__PURE__*/ exitSucceed(false);
var exitTrue = /*#__PURE__*/ exitSucceed(true);
var exitFailDone = /*#__PURE__*/ exitFail(/*#__PURE__*/ Done());
var exitInterrupt = /*#__PURE__*/ exitInterrupt$1();
var releaseTakers = (self) => {
	self.scheduleRunning = false;
	if (self.state._tag === "Done" || self.state.takers.size === 0) return;
	for (const taker of self.state.takers) {
		self.state.takers.delete(taker);
		taker(exitVoid);
		if (self.messages.length === 0) break;
	}
};
var scheduleReleaseTaker = (self) => {
	if (self.scheduleRunning || self.state._tag === "Done" || self.state.takers.size === 0) return;
	self.scheduleRunning = true;
	self.dispatcher.scheduleTask(() => releaseTakers(self), 0);
};
var takeBetweenUnsafe = (self, min, max) => {
	if (self.state._tag === "Done") return self.state.exit;
	else if (max <= 0 || min <= 0) return exitSucceed([]);
	else if (self.capacity <= 0 && self.state.offers.size > 0) {
		self.capacity = 1;
		releaseCapacity(self);
		self.capacity = 0;
		const messages = [take$1(self.messages)];
		releaseCapacity(self);
		return exitSucceed(messages);
	}
	min = Math.min(min, self.capacity || 1);
	if (min <= self.messages.length) {
		const messages = takeN(self.messages, max);
		releaseCapacity(self);
		return exitSucceed(messages);
	}
};
var offerRemainingSingle = (self, message) => {
	return callback$2((resume) => {
		if (self.state._tag !== "Open") return resume(exitFalse);
		const entry = {
			_tag: "Single",
			message,
			resume
		};
		self.state.offers.add(entry);
		return sync$1(() => {
			if (self.state._tag === "Open") self.state.offers.delete(entry);
		});
	});
};
var releaseCapacity = (self) => {
	if (self.state._tag === "Done") return isDoneCause(self.state.exit.cause);
	else if (self.state.offers.size === 0) {
		if (self.state._tag === "Closing" && self.messages.length === 0) {
			finalize(self, self.state.exit);
			return isDoneCause(self.state.exit.cause);
		}
		return false;
	}
	let n = self.capacity - self.messages.length;
	for (const entry of self.state.offers) if (n === 0) break;
	else if (entry._tag === "Single") {
		append(self.messages, entry.message);
		n--;
		entry.resume(exitTrue);
		self.state.offers.delete(entry);
	} else {
		for (; entry.offset < entry.remaining.length; entry.offset++) {
			if (n === 0) return false;
			append(self.messages, entry.remaining[entry.offset]);
			n--;
		}
		entry.resume(exitSucceed([]));
		self.state.offers.delete(entry);
	}
	return false;
};
var awaitTake = (self) => callback$2((resume) => {
	if (self.state._tag === "Done") return resume(self.state.exit);
	self.state.takers.add(resume);
	return sync$1(() => {
		if (self.state._tag !== "Done") self.state.takers.delete(resume);
	});
});
var finalize = (self, exit) => {
	if (self.state._tag === "Done") return;
	const openState = self.state;
	self.state = {
		_tag: "Done",
		exit
	};
	for (const taker of openState.takers) taker(exit);
	openState.takers.clear();
	for (const awaiter of openState.awaiters) awaiter(exit);
	openState.awaiters.clear();
};
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0-rc.112/node_modules/effect/dist/Semaphore.js
/**
* Creates a `Semaphore` synchronously with the specified total
* number of permits.
*
* **When to use**
*
* Use to construct a semaphore synchronously when an immediate value is
* required outside an Effect workflow.
*
* **Example** (Creating an unsafe semaphore)
*
* ```ts import.meta.vitest
* import { Effect, Semaphore } from "effect"
*
* const semaphore = Semaphore.makeUnsafe(3)
*
* const task = (id: number) =>
*   semaphore.withPermits(1)(
*     Effect.gen(function*() {
*       yield* Effect.yieldNow
*       return id
*     })
*   )
*
* // Only 3 tasks can run concurrently
* const program = Effect.all([
*   task(1),
*   task(2),
*   task(3),
*   task(4),
*   task(5)
* ], { concurrency: "unbounded" })
*
* await Effect.runPromise(program) // => [1, 2, 3, 4, 5]
* ```
*
* @category constructors
* @since 4.0.0
*/
var makeUnsafe$1 = (permits) => new SemaphoreImpl(permits);
var waitForPermits = (self, n, effect) => callback$2((resume) => {
	if (self.free >= n) return resume(effect);
	const observer = () => {
		if (self.free < n) return;
		self.waiters.delete(observer);
		resume(effect);
	};
	self.waiters.add(observer);
	return sync$1(() => {
		self.waiters.delete(observer);
	});
});
var SemaphoreImpl = class {
	waiters = /*#__PURE__*/ new Set();
	taken = 0;
	permits;
	constructor(permits) {
		this.permits = permits;
	}
	get free() {
		return this.permits - this.taken;
	}
	take(n) {
		const take = suspend$1(() => {
			if (this.free < n) return waitForPermits(this, n, take);
			this.taken += n;
			return succeed$4(n);
		});
		return take;
	}
	takeIfAvailable(n) {
		return suspend$1(() => {
			if (this.free < n) return succeed$4(false);
			this.taken += n;
			return succeed$4(true);
		});
	}
	releaseUnsafe(fiber, n) {
		this.taken -= n;
		if (this.waiters.size > 0) fiber.currentDispatcher.scheduleTask(() => {
			for (const observer of this.waiters) {
				if (this.free <= 0) break;
				observer();
			}
		}, 0);
		return this.free;
	}
	resize(permits) {
		return withFiber((fiber) => {
			this.permits = permits;
			if (this.free < 0) return void_$2;
			this.releaseUnsafe(fiber, 0);
			return void_$2;
		});
	}
	release(n) {
		return withFiber((fiber) => succeed$4(this.releaseUnsafe(fiber, n)));
	}
	get releaseAll() {
		return withFiber((fiber) => succeed$4(this.releaseUnsafe(fiber, this.taken)));
	}
	withPermits(n) {
		return (self) => uninterruptibleMask((restore) => {
			const acquire = suspend$1(() => {
				if (this.free < n) return flatMap$1(restore(waitForPermits(this, n, void_$2)), () => acquire);
				this.taken += n;
				return onExitPrimitive(restore(self), () => {
					this.releaseUnsafe(getCurrentFiber(), n);
				}, true);
			});
			return acquire;
		});
	}
	withPermit = /*#__PURE__*/ this.withPermits(1);
	withPermitsIfAvailable(n) {
		return (self) => uninterruptibleMask((restore) => {
			if (this.free < n) return succeedNone$1;
			this.taken += n;
			return onExitPrimitive(restore(asSome(self)), () => {
				this.releaseUnsafe(getCurrentFiber(), n);
			}, true);
		});
	}
};
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0-rc.112/node_modules/effect/dist/Channel.js
/**
* Runtime identifier stored on `Channel` values and used by `isChannel` to
* recognize them.
*
* @category type IDs
* @since 4.0.0
*/
var TypeId$4 = "~effect/Channel";
/**
* Checks whether a value is a `Channel`.
*
* **Example** (Checking for channels)
*
* ```ts import.meta.vitest
* import { Channel } from "effect"
*
* const channel = Channel.succeed(42)
* Channel.isChannel(channel) // => true
* Channel.isChannel("not a channel") // => false
* ```
*
* @category guards
* @since 3.5.4
*/
var isChannel = (u) => hasProperty(u, TypeId$4);
var ChannelProto = {
	[TypeId$4]: {
		_Env: identity,
		_InErr: identity,
		_InElem: identity,
		_OutErr: identity,
		_OutElem: identity
	},
	pipe() {
		return pipeArguments(this, arguments);
	}
};
/**
* Creates a `Channel` from a transformation function that operates on upstream pulls.
*
* **Example** (Creating channels from transforms)
*
* ```ts import.meta.vitest
* import { Channel, Effect } from "effect"
*
* const channel = Channel.fromTransform((upstream, scope) =>
*   Effect.succeed(upstream)
* )
* await Effect.runPromise(Channel.runCollect(channel)) // => []
* ```
*
* @category constructors
* @since 4.0.0
*/
var fromTransform = (transform) => {
	const self = Object.create(ChannelProto);
	self.transform = (upstream, scope) => catchCause(transform(upstream, scope), (cause) => succeed$1(failCause$1(cause)));
	return self;
};
/**
* Transforms a Channel by applying a function to its Pull implementation.
*
* **Example** (Transforming pull behavior)
*
* ```ts import.meta.vitest
* import { Channel, Effect } from "effect"
*
* // Transform a channel by modifying its pull behavior
* const originalChannel = Channel.fromIterable([1, 2, 3])
*
* const transformedChannel = Channel.transformPull(
*   originalChannel,
*   (pull, scope) =>
*     Effect.succeed(
*       Effect.map(pull, (value) => value * 2)
*     )
* )
* await Effect.runPromise(Channel.runCollect(transformedChannel)) // => [2, 4, 6]
* ```
*
* @category constructors
* @since 4.0.0
*/
var transformPull = (self, f) => fromTransform((upstream, scope) => flatMap(toTransform(self)(upstream, scope), (pull) => f(pull, scope)));
/**
* Creates a `Channel` from a transformation function that operates on upstream
* pulls, but also provides a forked scope that closes when the resulting
* Channel completes.
*
* **When to use**
*
* Use when building channels that require scoped resource lifecycle management,
* providing both the channel scope and a forked scope that automatically closes
* when the channel completes.
*
* @see {@link fromTransform} for a simpler transformation without a forked scope
* @category constructors
* @since 4.0.0
*/
var fromTransformBracket = (f) => fromTransform(fnUntraced(function* (upstream, scope) {
	const closableScope = forkUnsafe(scope);
	const onCause = (cause) => close(closableScope, doneExitFromCause(cause));
	return onError(yield* onError(f(upstream, scope, closableScope), onCause), onCause);
}));
/**
* Converts a `Channel` back to its underlying transformation function.
*
* **Example** (Extracting channel transforms)
*
* ```ts import.meta.vitest
* import { Channel, Effect } from "effect"
*
* const channel = Channel.succeed(42)
* const transform = Channel.toTransform(channel)
* typeof transform // => "function"
* Effect.runSync(Channel.runCollect(channel)) // => [42]
* ```
*
* @category destructors
* @since 4.0.0
*/
var toTransform = (channel) => channel.transform;
var asyncQueue = (scope, f, options) => make$4({
	capacity: options?.bufferSize,
	strategy: options?.strategy
}).pipe(tap$1((queue) => addFinalizer$1(scope, shutdown(queue))), tap$1((queue) => forkIn(provide$2(f(queue), scope), scope)));
/**
* Creates a `Channel` that interacts with a callback function using a queue, emitting arrays.
*
* **Example** (Creating array channels from callbacks)
*
* ```ts import.meta.vitest
* import { Channel, Effect, Queue } from "effect"
*
* const channel = Channel.callbackArray<number>(Effect.fn(function*(queue) {
*   yield* Queue.offer(queue, 1)
*   yield* Queue.offer(queue, 2)
*   yield* Queue.end(queue)
* }))
* await Effect.runPromise(Channel.runCollect(channel)) // => [[1, 2]]
* ```
*
* @category constructors
* @since 4.0.0
*/
var callbackArray = (f, options) => fromTransform((_, scope) => map$1(asyncQueue(scope, f, options), takeAll));
/**
* Maps the output of this channel using the specified function.
*
* **Example** (Mapping channel output)
*
* ```ts import.meta.vitest
* import { Channel, Data, Effect } from "effect"
*
* class TransformError extends Data.TaggedError("TransformError")<{
*   readonly reason: string
* }> {}
*
* // Basic mapping of channel values
* const numbersChannel = Channel.fromIterable([1, 2, 3, 4, 5])
* const doubledChannel = Channel.map(numbersChannel, (n) => n * 2)
* Effect.runSync(Channel.runCollect(doubledChannel)) // => [2, 4, 6, 8, 10]
*
* // Transform string data
* const wordsChannel = Channel.fromIterable(["hello", "world", "effect"])
* const upperCaseChannel = Channel.map(wordsChannel, (word) => word.toUpperCase())
* Effect.runSync(Channel.runCollect(upperCaseChannel)) // => ["HELLO", "WORLD", "EFFECT"]
*
* // Complex object transformation
* type User = { id: number; name: string }
* type UserDisplay = { displayName: string; isActive: boolean }
*
* const usersChannel = Channel.fromIterable([
*   { id: 1, name: "Alice" },
*   { id: 2, name: "Bob" }
* ])
* const displayChannel = Channel.map(usersChannel, (user): UserDisplay => ({
*   displayName: `User: ${user.name}`,
*   isActive: true
* }))
* Effect.runSync(Channel.runCollect(displayChannel)) // => [{ displayName: "User: Alice", isActive: true }, { displayName: "User: Bob", isActive: true }]
* ```
*
* @category sequencing
* @since 2.0.0
*/
var map = /*#__PURE__*/ dual(2, (self, f) => transformPull(self, (pull) => sync(() => {
	let i = 0;
	return map$1(pull, (o) => f(o, i++));
})));
var concurrencyIsSequential = (concurrency) => concurrency === void 0 || concurrency !== "unbounded" && concurrency <= 1;
/**
* Maps each output element with an effectful function, preserving the source
* channel's done value.
*
* **When to use**
*
* Use when transforming each channel output needs an Effect, service
* dependency, failure channel, or configured concurrency.
*
* **Details**
*
* The mapping function receives the output element and its zero-based index.
* By default elements are mapped sequentially. Use `options.concurrency` to
* map multiple elements concurrently, and `options.unordered` to allow
* concurrently mapped outputs to be emitted as soon as they complete.
*
* **Example** (Mapping channel output with effects)
*
* ```ts import.meta.vitest
* import { Channel, Effect } from "effect"
*
* const numbersChannel = Channel.fromIterable([1, 2, 3, 4, 5])
* const processedChannel = Channel.mapEffect(
*   numbersChannel,
*   (n) => Effect.succeed(n * n)
* )
* await Effect.runPromise(Channel.runCollect(processedChannel)) // => [1, 4, 9, 16, 25]
* ```
*
* @category sequencing
* @since 2.0.0
*/
var mapEffect$1 = /*#__PURE__*/ dual((args) => isChannel(args[0]), (self, f, options) => concurrencyIsSequential(options?.concurrency) ? mapEffectSequential(self, f) : mapEffectConcurrent(self, f, options));
var mapEffectSequential = (self, f) => fromTransform((upstream, scope) => {
	let i = 0;
	return map$1(toTransform(self)(upstream, scope), flatMap((o) => f(o, i++)));
});
var mapEffectConcurrent = (self, f, options) => fromTransformBracket(fnUntraced(function* (upstream, scope, forkedScope) {
	let i = 0;
	const pull = yield* toTransform(self)(upstream, scope);
	const concurrencyN = options.concurrency === "unbounded" ? Number.MAX_SAFE_INTEGER : options.concurrency;
	const queue = yield* bounded(0);
	yield* addFinalizer$1(forkedScope, shutdown(queue));
	const runFork = runForkWith(yield* context());
	const trackFiber = runIn(forkedScope);
	if (options.unordered) {
		const semaphore = makeUnsafe$1(concurrencyN);
		const release = constant(semaphore.release(1));
		const handle = matchCauseEffect({
			onFailure: (cause) => flatMap(failCause(queue, cause), release),
			onSuccess: (value) => flatMap(offer(queue, value), release)
		});
		yield* semaphore.take(1).pipe(flatMap(() => pull), flatMap((value) => {
			trackFiber(runFork(handle(f(value, i++))));
			return void_;
		}), forever({ disableYield: true }), catchCause((cause) => semaphore.withPermits(concurrencyN - 1)(failCause(queue, cause))), forkIn(forkedScope));
	} else {
		const effects = yield* bounded(concurrencyN - 2);
		yield* addFinalizer$1(forkedScope, shutdown(effects));
		yield* take(effects).pipe(flatten, flatMap((value) => offer(queue, value)), forever({ disableYield: true }), catchCause((cause) => failCause(queue, cause)), forkIn(forkedScope));
		let errorCause;
		const onExit = (exit) => {
			if (exit._tag === "Success") return;
			errorCause = exit.cause;
			failCauseUnsafe(queue, exit.cause);
		};
		yield* pull.pipe(flatMap((value) => {
			if (errorCause) return failCause$1(errorCause);
			const fiber = runFork(f(value, i++));
			trackFiber(fiber);
			fiber.addObserver(onExit);
			return offer(effects, join(fiber));
		}), forever({ disableYield: true }), catchCause((cause) => offer(effects, failCause$2(cause)).pipe(andThen(failCause(effects, cause)))), forkIn(forkedScope));
	}
	return take(queue);
}));
/**
* Flattens a channel that outputs arrays into a channel that outputs individual elements.
*
* **Example** (Flattening arrays of channel output)
*
* ```ts import.meta.vitest
* import { Channel, Data, Effect } from "effect"
*
* class FlattenError extends Data.TaggedError("FlattenError")<{
*   readonly message: string
* }> {}
*
* // Create a channel that outputs arrays
* const arrayChannel = Channel.fromIterable([
*   [1, 2, 3],
*   [4, 5],
*   [6, 7, 8, 9]
* ])
*
* // Flatten the arrays into individual elements
* const flattenedChannel = Channel.flattenArray(arrayChannel)
*
* Effect.runSync(Channel.runCollect(flattenedChannel)) // => [1, 2, 3, 4, 5, 6, 7, 8, 9]
* ```
*
* @category transforming
* @since 4.0.0
*/
var flattenArray = (self) => transformPull(self, (pull) => {
	let array;
	let index = 0;
	return succeed$1(suspend(function loop() {
		if (array === void 0) return flatMap(pull, (array_) => {
			switch (array_.length) {
				case 0: return loop();
				case 1: return succeed$1(array_[0]);
				default:
					array = array_;
					return succeed$1(array_[index++]);
			}
		});
		const next = array[index++];
		if (index >= array.length) {
			array = void 0;
			index = 0;
		}
		return succeed$1(next);
	}));
});
var runWith = (self, f, onHalt) => suspend(() => {
	const scope = makeUnsafe$3();
	return catchDone(flatMap(toTransform(self)(done$1(), scope), f), onHalt ? onHalt : succeed$1).pipe(onExit((exit) => close(scope, exit)));
});
/**
* Runs a channel and discards all output elements, returning only the final result.
*
* **Example** (Draining channel output at runtime)
*
* ```ts import.meta.vitest
* import { Channel, Data, Effect } from "effect"
*
* class DrainError extends Data.TaggedError("DrainError")<{
*   readonly stage: string
* }> {}
*
* // Create a channel that outputs elements and completes with a result
* const resultChannel = Channel.fromIterable([1, 2, 3])
* const completedChannel = Channel.concat(resultChannel, Channel.end("completed"))
*
* // Drain all elements and get only the final result
* const drainEffect = Channel.runDrain(completedChannel)
*
* Effect.runSync(drainEffect) // => "completed"
* ```
*
* @category running
* @since 2.0.0
*/
var runDrain$1 = (self) => runWith(self, (pull) => forever(pull, { disableYield: true }));
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0-rc.112/node_modules/effect/dist/SchemaParser.js
/**
* Runs schemas against real values.
*
* Schema parsers construct values from schema input, check whether a value
* matches a schema, decode encoded input, and encode decoded values back to
* their external form. This module exposes those operations through several
* result styles, including `Effect`, `Promise`, `Exit`, `Option`, `Result`, and
* synchronous functions that throw. It also contains the lower-level runner that
* walks a schema AST and reports schema failures as `SchemaIssue.Issue` values.
*
* @since 4.0.0
*/
/**
* Creates an effectful maker for the schema's decoded type side.
*
* **When to use**
*
* Use to construct decoded schema values in `Effect` while preserving
* construction failures as `SchemaIssue.Issue` values in the error channel.
*
* **Details**
*
* The returned function accepts constructor input, applies constructor defaults,
* runs type-side validation unless checks are disabled, and fails with a
* `SchemaIssue.Issue` when construction fails.
*
* @category constructors
* @since 4.0.0
*/
function makeEffect(schema) {
	const parser = runWithCompiler(constructorCompiler, toType$1(schema.ast));
	return (input, options) => {
		return parser(input, options?.disableChecks ? options?.parseOptions ? {
			...options.parseOptions,
			disableChecks: true
		} : { disableChecks: true } : options?.parseOptions);
	};
}
/**
* Creates a synchronous maker that returns `Option.some` with the constructed
* value on success, or `Option.none` when construction fails with schema issues.
*
* **When to use**
*
* Use when you need to validate schema constructor input and only care whether
* construction succeeds, without exposing `SchemaIssue.Issue` details.
*
* **Gotchas**
*
* Only causes made entirely of schema issues are converted to `Option.none`.
* Causes that contain defects, interruptions, or asynchronous work at this
* synchronous boundary throw an `Error` whose cause is the underlying `Cause`.
*
* @category constructors
* @since 4.0.0
*/
function makeOption(schema) {
	const parser = makeEffect(schema);
	return (input, options) => {
		const exit = runSyncExit(parser(input, options));
		if (isSuccess(exit)) return some(exit.value);
		getSchemaIssueOrThrow(exit.cause, "Option adapter can only return none for schema issues");
		return none();
	};
}
/**
* Creates a synchronous maker for the schema's decoded type side.
*
* **When to use**
*
* Use to construct decoded schema values synchronously when invalid input
* should throw an `Error` whose cause is `SchemaIssue.Issue`.
*
* **Details**
*
* The returned function constructs a value from constructor input and throws an
* `Error` with the `SchemaIssue.Issue` in its `cause` when construction fails.
* Schema validation failures use the generic message `"Schema validation failed"`.
* Format the `cause` explicitly with `SchemaIssue.makeFormatterDefault()` when
* human-readable details are needed.
*
* **Gotchas**
*
* Causes that contain defects, interruptions, or asynchronous work at this
* synchronous boundary throw an `Error` whose cause is the underlying `Cause`,
* instead of being converted to a schema validation error.
*
* @category constructors
* @since 4.0.0
*/
function make$3(schema) {
	const parser = makeEffect(schema);
	return (input, options) => {
		const exit = runSyncExit(parser(input, options));
		if (isSuccess(exit)) return exit.value;
		const issue = getSchemaIssueOrThrow(exit.cause, "Constructor adapter can only throw schema issues");
		throw new Error("Schema validation failed", { cause: issue });
	};
}
/**
* Creates a type guard that checks whether an input satisfies the schema's decoded
* type side.
*
* **When to use**
*
* Use to build a type guard for checking the decoded side of a schema without
* exposing issue details.
*
* **Details**
*
* The guard returns `true` on successful validation and `false` when validation
* fails only with schema issues, without exposing issue details.
*
* **Gotchas**
*
* Only causes made entirely of schema issues are converted to `false`. Causes
* that contain defects, interruptions, or asynchronous work at this synchronous
* boundary throw an `Error` whose cause is the underlying `Cause`.
*
* @category guards
* @since 3.10.0
*/
function is$1(schema) {
	return _is(schema.ast);
}
/** @internal */
function _is(ast) {
	const parser = asExit(run(toType$1(ast)));
	return (input) => {
		const exit = parser(input, defaultParseOptions);
		if (isSuccess(exit)) return true;
		getSchemaIssueOrThrow(exit.cause, "Type guard adapter can only return false for schema issues");
		return false;
	};
}
/**
* Creates an effectful decoder for `unknown` input.
*
* **When to use**
*
* Use when you need to decode untyped boundary input in an `Effect` whose
* failure channel is `SchemaIssue.Issue`, while preserving transformations
* and service requirements.
*
* **Details**
*
* The returned function succeeds with the schema's decoded `Type` or fails with a
* `SchemaIssue.Issue`. Decoding service requirements are preserved in the returned
* `Effect`. Parse options may be provided when creating the decoder and overridden
* when applying it.
*
* @see {@link decodeEffect} for input already typed as the schema's `Encoded` type
*
* @category decoding
* @since 4.0.0
*/
function decodeUnknownEffect$1(schema, options) {
	const parser = run(schema.ast);
	return options === void 0 ? parser : (input, overrideOptions) => parser(input, mergeParseOptions(options, overrideOptions));
}
var mergeParseOptions = (options, overrideOptions) => overrideOptions ? {
	...options,
	...overrideOptions
} : options;
var getValue = (value) => {
	if (value === missing) return fail$1(new InvalidValue());
	return succeed$1(value);
};
/** @internal */
function run(ast) {
	return runWithCompiler(normalCompiler, ast);
}
function runWithCompiler(compiler, ast) {
	let parser;
	return (input, options) => {
		const result = (parser ??= compiler(ast))(input, options ?? defaultParseOptions);
		if (result === sameExit) return succeed$1(input);
		if (!effectIsExit(result)) return flatMapEager(result, getValue);
		return result[args] === missing ? getValue(missing) : result;
	};
}
function asExit(parser) {
	return (input, options) => runSyncExit(parser(input, options));
}
var normalCompiler = /*#__PURE__*/ memoize((ast) => makeParser(ast, normalCompiler));
var constructorCompiler = /*#__PURE__*/ memoize((ast) => makeParser(ast, constructorCompiler, compileConstructorDefault));
var compileDefaulted = /*#__PURE__*/ memoize((ast) => makeParser(ast, constructorCompiler, compileConstructorDefault, ast.context?.constructorDefault));
function compileConstructorDefault(ast) {
	return ast.context?.constructorDefault ? compileDefaulted(ast) : constructorCompiler(ast);
}
function applyTransformation(result, current, transformation, options) {
	let transformed;
	if (effectIsExit(result) && result._tag === "Success") {
		const optional = toOption(result === sameExit ? current : result[args]);
		transformed = transformation._tag === "Transformation" ? transformation.decode.run(optional, options) : transformation.decode(succeed(optional), options);
	} else if (transformation._tag === "Transformation") transformed = flatMapEager(result, (value) => transformation.decode.run(toOption(value), options));
	else transformed = transformation.decode(mapEager(result, toOption), options);
	return effectIsExit(transformed) && transformed._tag === "Success" ? fromOptionExit(transformed[args]) : flatMapEager(transformed, fromOptionExit);
}
function makeConstructorParser(descriptor, compile) {
	let sourceParser;
	return (input, options) => {
		if (input === missing) return missingExit;
		if (descriptor.isConstructed(input)) return sameExit;
		return applyTransformation((sourceParser ??= compile(descriptor.link.to))(input, options), input, descriptor.link.transformation, options);
	};
}
function makeParser(ast, compile, compileConstructorDefault, constructorDefault) {
	const descriptor = compileConstructorDefault ? getConstructorDescriptor(ast) : void 0;
	const parser = descriptor ? makeConstructorParser(descriptor, compile) : ast.getParser(compile, compileConstructorDefault);
	const checks = ast.checks;
	const links = constructorDefault ? ast.encoding ? [...ast.encoding, constructorDefault] : [constructorDefault] : ast.encoding;
	const encodingChecks = ast.encodingChecks;
	const astOptions = (checks ? checks[checks.length - 1].annotations : ast.annotations)?.["parseOptions"];
	if (!links && !checks && !encodingChecks) {
		if (!astOptions) return parser;
		return (input, options) => parser(input, mergeParseOptions(options, astOptions));
	}
	let encodingParsers;
	const parseLocal = (input, options) => {
		let result = parser(input, options);
		if (encodingChecks && !options.disableChecks) {
			if (effectIsExit(result)) {
				if (result._tag === "Success") {
					const output = result === sameExit ? input : result[args];
					if (input !== missing && output !== missing) {
						const issues = collectIssues(encodingChecks, input, void 0, ast, options);
						if (issues) result = fail$1(new Composite(ast, issues, input, options));
					}
				}
			} else result = flatMap(result, (value) => {
				if (input !== missing && value !== missing) {
					const issues = collectIssues(encodingChecks, input, void 0, ast, options);
					if (issues) return fail$1(new Composite(ast, issues, input, options));
				}
				return succeed$1(value);
			});
		}
		if (checks && !options.disableChecks) {
			if (effectIsExit(result)) {
				if (result._tag === "Success") {
					const value = result === sameExit ? input : result[args];
					if (value === missing) return result;
					const issues = collectIssues(checks, value, void 0, ast, options);
					if (issues) result = fail$1(new Composite(ast, issues, value, options));
				}
			} else result = flatMap(result, (value) => {
				if (value !== missing) {
					const issues = collectIssues(checks, value, void 0, ast, options);
					if (issues) return fail$1(new Composite(ast, issues, value, options));
				}
				return succeed$1(value);
			});
		}
		return result;
	};
	if (!links) return astOptions ? (input, options) => parseLocal(input, mergeParseOptions(options, astOptions)) : parseLocal;
	return (input, options) => {
		if (astOptions) options = mergeParseOptions(options, astOptions);
		const parsers = encodingParsers ??= links.map((link) => compile(link.to));
		let current = input;
		let result = parsers[parsers.length - 1](input, options);
		for (let i = links.length - 1; i >= 0; i--) {
			result = applyTransformation(result, current, links[i].transformation, options);
			if (i !== 0) {
				const next = parsers[i - 1];
				if (result._tag === "Success") {
					current = result[args];
					result = next(current, options);
				} else result = flatMapEager(result, (value) => {
					const nextResult = next(value, options);
					return nextResult === sameExit ? succeed(value) : nextResult;
				});
			}
		}
		if (result._tag === "Success") {
			const value = result[args];
			const local = parseLocal(value, options);
			return local === sameExit ? result : local;
		}
		result = catchCause(result, (cause) => failCauseSync(() => map$2(cause, (issue) => new Encoding(ast, issue, input, options))));
		return flatMapEager(result, (value) => {
			const local = parseLocal(value, options);
			return local === sameExit ? succeed(value) : local;
		});
	};
}
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0-rc.112/node_modules/effect/dist/internal/schema/schema.js
/** @internal */
var TypeId$3 = "~effect/Schema/Schema";
var SchemaProto = {
	[TypeId$3]: TypeId$3,
	pipe() {
		return pipeArguments(this, arguments);
	},
	annotate(annotations) {
		return this.rebuild(annotate(this.ast, annotations));
	},
	annotateKey(annotations) {
		return this.rebuild(annotateKey(this.ast, annotations));
	},
	check(...checks) {
		return this.rebuild(appendChecks(this.ast, checks));
	}
};
/** @internal */
function make$2(ast, options) {
	function Schema() {}
	const self = Object.defineProperties(Object.setPrototypeOf(Schema, SchemaProto), Object.getOwnPropertyDescriptors({ ...options }));
	self.ast = ast;
	self.rebuild = (ast) => make$2(ast, options);
	self.makeEffect = makeEffect(self);
	self.make = make$3(self);
	self.makeOption = makeOption(self);
	return self;
}
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0-rc.112/node_modules/effect/dist/Struct.js
/**
* Wraps a plain function as a {@link Lambda} value so it can be used with
* {@link map}, {@link mapPick}, and {@link mapOmit}.
*
* **When to use**
*
* Use to create a typed lambda for struct mapping APIs that need type-level
* input and output tracking.
*
* **Details**
*
* The type parameter `L` encodes both the input and output types at the type
* level, allowing the compiler to track how struct value types change. At
* runtime, the returned value is the same function; `lambda` only adjusts the
* type.
*
* **Example** (Wrapping values in arrays)
*
* ```ts import.meta.vitest
* import { pipe, Struct } from "effect"
*
* interface AsArray extends Struct.Lambda {
*   <A>(self: A): Array<A>
*   readonly "~lambda.out": Array<this["~lambda.in"]>
* }
*
* const asArray = Struct.lambda<AsArray>((a) => [a])
* const result = pipe({ x: 1, y: "hello" }, Struct.map(asArray))
* result // => { x: [1], y: ["hello"] }
* ```
*
* @see {@link Lambda} – the type-level interface
* @see {@link map} – apply a lambda to all struct values
* @category constructors
* @since 4.0.0
*/
var lambda = (f) => f;
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0-rc.112/node_modules/effect/dist/internal/errors.js
/** @internal */
function errorWithPath(message, path) {
	if (path.length > 0) message += `\n  at ${formatPath(path)}`;
	return new Error(message);
}
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0-rc.112/node_modules/effect/dist/JsonPointer.js
/**
* Helpers for escaping and unescaping JSON Pointer path segments. JSON Pointer
* uses `/` to separate path tokens inside a JSON document, so token text must
* encode literal `~` and `/` characters. This module provides the two RFC 6901
* token conversions used by JSON Patch and related path handling.
*
* @since 4.0.0
*/
/**
* Escapes a JSON Pointer reference token according to RFC 6901 by encoding special characters so the token can be safely used as a segment in a JSON Pointer.
*
* **When to use**
*
* Use when you need to escape a single JSON Pointer path segment.
*
* **Details**
*
* - Returns a new escaped string
* - Replaces `~` (tilde) with `~0` and `/` (forward slash) with `~1`
* - Returns the input unchanged if it contains no special characters
* - Empty strings are valid and returned unchanged
*
* **Gotchas**
*
* The replacement order matters: `~` is replaced before `/` to prevent double-escaping.
*
* **Example** (Escaping special characters)
*
* ```ts import.meta.vitest
* import { JsonPointer } from "effect"
*
* JsonPointer.escapeToken("a/b") // => "a~1b"
* JsonPointer.escapeToken("c~d") // => "c~0d"
* JsonPointer.escapeToken("path/to~key") // => "path~1to~0key"
* ```
*
* @see {@link unescapeToken} The inverse operation for decoding escaped tokens
* @category encoding
* @since 4.0.0
*/
function escapeToken(token) {
	return token.replace(/~/g, "~0").replace(/\//g, "~1");
}
/**
* Decodes a JSON Pointer reference token according to RFC 6901 escaping rules.
*
* **When to use**
*
* Use when you need to decode a single escaped JSON Pointer path segment.
*
* **Details**
*
* - Returns a new unescaped string
* - Replaces `~1` with `/` (forward slash) and `~0` with `~` (tilde)
* - Returns the input unchanged if it contains no escaped sequences
* - Empty strings are valid and returned unchanged
*
* **Gotchas**
*
* The replacement order matters: `~1` is replaced before `~0` to prevent incorrect decoding.
*
* **Example** (Unescaping special characters)
*
* ```ts import.meta.vitest
* import { JsonPointer } from "effect"
*
* JsonPointer.unescapeToken("a~1b") // => "a/b"
* JsonPointer.unescapeToken("c~0d") // => "c~d"
* JsonPointer.unescapeToken("path~1to~0key") // => "path/to~key"
* ```
*
* @see {@link escapeToken} The inverse operation for encoding tokens
* @category decoding
* @since 4.0.0
*/
function unescapeToken(token) {
	return token.replace(/~1/g, "/").replace(/~0/g, "~");
}
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0-rc.112/node_modules/effect/dist/JsonSchema.js
/**
* Helpers for normalizing and converting JSON Schema and OpenAPI schema
* documents. Supported inputs include JSON Schema Draft-07, Draft 2020-12,
* OpenAPI 3.0, and OpenAPI 3.1; conversions normalize through
* `Document<"draft-2020-12">` before emitting another dialect, including
* JSON Schema Draft-04. The module also defines document types, meta-schema
* constants, and OpenAPI component-key helpers.
*
* @since 4.0.0
*/
/**
* Represents the `$schema` meta-schema URI for JSON Schema Draft-07.
*
* **When to use**
*
* Use when constructing a Draft-07 JSON Schema document and you need a stable
* value for the root `$schema` field.
*
* **Details**
*
* The exported value is the literal string
* `http://json-schema.org/draft-07/schema#`.
*
* @see {@link META_SCHEMA_URI_DRAFT_04} for the Draft-04 `$schema` URI
* @see {@link META_SCHEMA_URI_DRAFT_2020_12} for the Draft 2020-12 `$schema` URI
*
* @category constants
* @since 4.0.0
*/
var META_SCHEMA_URI_DRAFT_07 = "http://json-schema.org/draft-07/schema#";
function isMetaSchemaUri(value, uri) {
	return value === uri || value === (uri.endsWith("#") ? uri.slice(0, -1) : `${uri}#`);
}
/**
* Converts a `Document<"draft-2020-12">` to a `Document<"draft-07">`.
*
* **When to use**
*
* Use when you need to output a canonical JSON Schema document in Draft-07
* format.
*
* **Details**
*
* This rewrites `#/$defs/...` refs to `#/definitions/...`, converts
* Draft-2020-12 tuple syntax (`prefixItems` plus `items`) to Draft-07 form
* (`items` as array plus `additionalItems`), merges `dependentRequired` and
* `dependentSchemas` into `dependencies`, and converts both the root schema
* and all definitions. Local JSON Pointer refs are relocated when structural
* keywords move.
*
* **Gotchas**
*
* Unknown and custom keywords are copied as opaque values. Known keywords
* that Draft-07 cannot represent cause the conversion to throw
* instead of being dropped. These include dynamic references,
* `unevaluatedProperties`, `unevaluatedItems`, and non-default `minContains`
* or `maxContains` constraints. Conversion also throws when an opaque
* Draft-2020-12 keyword would collide with an active Draft-07 keyword, or when
* `$id` and `$anchor` occur together because Draft-07 cannot preserve both identifiers.
*
* **Example** (Converting to Draft-07)
*
* ```ts import.meta.vitest
* import { JsonSchema } from "effect"
*
* const doc = JsonSchema.fromSchemaDraft2020_12({
*   type: "array",
*   prefixItems: [{ type: "string" }, { type: "number" }],
*   items: { type: "boolean" }
* })
*
* const draft07 = JsonSchema.toDocumentDraft07(doc)
* draft07.dialect // => "draft-07"
* draft07.schema.items // => [{ type: "string" }, { type: "number" }]
* draft07.schema.additionalItems // => { type: "boolean" }
* ```
*
* @see {@link fromSchemaDraft07}
* @see {@link toDocumentDraft04} for converting to Draft-04
* @see {@link toMultiDocumentOpenApi3_1}
* @category encoding
* @since 4.0.0
*/
function toDocumentDraft07(document) {
	return {
		dialect: "draft-07",
		...convertDocument(document, draft07Adapter)
	};
}
function transformSchema(node, transform) {
	return walk(node, false, true);
	function walk(node, inheritedResource, isRoot = false) {
		if (!isObject(node)) return node;
		const inEmbeddedResource = inheritedResource || !isRoot && createsResource(node.$id);
		const out = {};
		for (const key of Object.keys(node)) {
			const value = node[key];
			let transformed = value;
			switch (key) {
				case "$defs":
				case "properties":
				case "patternProperties":
				case "dependentSchemas":
					transformed = mapObject(value, (value) => walk(value, inEmbeddedResource)) ?? value;
					break;
				case "allOf":
				case "anyOf":
				case "oneOf":
				case "prefixItems":
					transformed = Array.isArray(value) ? value.map((value) => walk(value, inEmbeddedResource)) : value;
					break;
				case "not":
				case "additionalProperties":
				case "propertyNames":
				case "unevaluatedProperties":
				case "items":
				case "contains":
				case "unevaluatedItems":
				case "if":
				case "then":
				case "else":
				case "contentSchema": transformed = walk(value, inEmbeddedResource);
			}
			assignProperty(out, key, transformed);
		}
		transform(out, inEmbeddedResource);
		return out;
	}
}
/** @internal */
function rewriteRefs(schema, rewrite) {
	return transformSchema(schema, (schema) => {
		rewriteSchemaRef(schema, rewrite);
	});
}
function rewriteSchemaRef(schema, rewrite) {
	if (typeof schema.$ref === "string") assignProperty(schema, "$ref", rewrite(schema.$ref, "$ref"));
	if (typeof schema.$dynamicRef === "string") assignProperty(schema, "$dynamicRef", rewrite(schema.$dynamicRef, "$dynamicRef"));
}
function mapObject(value, f) {
	if (!isObject(value)) return void 0;
	const out = {};
	for (const key of Object.keys(value)) assignProperty(out, key, f(value[key], key));
	return out;
}
function runConverter(adapter, options, use) {
	const locations = /* @__PURE__ */ new Map();
	const references = [];
	let rootUri = ROOT_URI;
	function convert(root, sourcePath = [], targetPath = []) {
		if (sourcePath.length === 0 && options?.trackIds) rootUri = resolveResourceUri(isObject(root) ? getResourceId(root) : void 0, ROOT_URI) ?? ROOT_URI;
		return loop(root, sourcePath, targetPath, {
			sourceRoot: [],
			targetRoot: [],
			uri: rootUri
		});
	}
	function finish() {
		for (const [out, value, sourceResource] of references) {
			let reference = value;
			const resolved = resolveUrl(value, sourceResource);
			if (resolved !== void 0) {
				const sourcePointer = parsePointerFragment(resolved.hash);
				resolved.hash = "";
				if (sourcePointer !== void 0) {
					const targetPath = locations.get(locationKey(resolved.href, sourcePointer));
					if (targetPath !== void 0) reference = relocateReference(value, targetPath);
				}
			}
			assignProperty(out, "$ref", reference);
		}
	}
	const out = use(convert);
	finish();
	return out;
	function loop(node, sourcePath, targetPath, resourceScope) {
		if (typeof node === "boolean") {
			recordLocations(sourcePath, targetPath, resourceScope);
			return options?.booleanAdapter?.(node) ?? node;
		}
		if (!isObject(node)) return node;
		let currentResourceScope = resourceScope;
		const id = getResourceId(node);
		if (sourcePath.length > 0 && options?.trackIds && createsResource(id)) {
			const uri = resolveResourceUri(id, resourceScope.uri);
			if (uri !== void 0) currentResourceScope = {
				parent: resourceScope,
				sourceRoot: sourcePath,
				targetRoot: targetPath,
				uri
			};
		}
		recordLocations(sourcePath, targetPath, currentResourceScope);
		const currentResource = currentResourceScope.uri;
		return adapter(node, {
			isDocumentRoot: sourcePath.length === 0,
			schema(value, sourceKey, targetKey = sourceKey) {
				return loop(value, [...sourcePath, sourceKey], [...targetPath, targetKey], currentResourceScope);
			},
			schemaAt(value, sourceSuffix, targetSuffix) {
				return loop(value, [...sourcePath, ...sourceSuffix], [...targetPath, ...targetSuffix], currentResourceScope);
			},
			schemaArray(value, sourceKey, targetKey = sourceKey) {
				return Array.isArray(value) ? value.map((item, index) => loop(item, [
					...sourcePath,
					sourceKey,
					String(index)
				], [
					...targetPath,
					targetKey,
					String(index)
				], currentResourceScope)) : value;
			},
			schemaMap(value, sourceKey, targetKey = sourceKey) {
				if (!isObject(value)) return value;
				return mapObject(value, (item, key) => loop(item, [
					...sourcePath,
					sourceKey,
					key
				], [
					...targetPath,
					targetKey,
					key
				], currentResourceScope));
			},
			reference(out, value) {
				if (typeof value === "string") references.push([
					out,
					value,
					currentResource
				]);
				else assignProperty(out, "$ref", value);
			}
		});
	}
	function getResourceId(schema) {
		return options?.ignoreRefSiblings === true && typeof schema.$ref === "string" ? void 0 : schema.$id;
	}
	function recordLocations(sourcePath, targetPath, scope) {
		if (scope.parent !== void 0) recordLocations(sourcePath, targetPath, scope.parent);
		locations.set(locationKey(scope.uri, sourcePath.slice(scope.sourceRoot.length)), targetPath.slice(scope.targetRoot.length));
	}
}
var ROOT_URI = "https://effect.invalid/.json-schema/";
function resolveUrl(value, base) {
	return URL.canParse(value, base) ? new URL(value, base) : void 0;
}
function resolveResourceUri(value, base) {
	if (typeof value !== "string") return void 0;
	const url = resolveUrl(value, base);
	if (url === void 0) return void 0;
	url.hash = "";
	return url.href;
}
function parsePointerFragment(hash) {
	if (hash.length === 0) return [];
	let pointer;
	try {
		pointer = decodeURIComponent(hash.slice(1));
	} catch {
		return;
	}
	if (!pointer.startsWith("/")) return void 0;
	return /~(?:[^01]|$)/.test(pointer) ? void 0 : pointer.slice(1).split("/").map(unescapeToken);
}
function relocateReference(reference, targetPath) {
	const index = reference.indexOf("#");
	if (index === -1 && targetPath.length === 0) return reference;
	return `${index === -1 ? reference : reference.slice(0, index)}${formatPointerFragment(targetPath)}`;
}
function formatPointerFragment(path) {
	return path.length === 0 ? "#" : `#/${path.map((token) => encodeURI(escapeToken(token)).replace(/#/g, "%23")).join("/")}`;
}
function locationKey(resource, pointer) {
	return `${resource}\u0000${JSON.stringify(pointer)}`;
}
function createsResource(id) {
	return typeof id === "string" && id.length > 0 && id[0] !== "#";
}
function convertDocument(document, adapter, options) {
	return runConverter(adapter, {
		...options,
		trackIds: true
	}, (convert) => ({
		schema: convert(document.schema),
		definitions: mapObject(document.definitions, (definition, key) => convert(definition, ["$defs", key], ["definitions", key]))
	}));
}
var SCHEMA_MAP_KEYWORDS = /*#__PURE__*/ new Set(["properties", "patternProperties"]);
var SCHEMA_ARRAY_KEYWORDS = /*#__PURE__*/ new Set([
	"allOf",
	"anyOf",
	"oneOf"
]);
var JSON_SCHEMA_SINGLE_KEYWORDS = /*#__PURE__*/ new Set([
	"not",
	"additionalProperties",
	"propertyNames",
	"contains",
	"if",
	"then",
	"else",
	"contentSchema"
]);
function convertSubschemaKeyword(out, key, value, context, singleKeywords, mapKeywords = SCHEMA_MAP_KEYWORDS) {
	let converted;
	if (mapKeywords.has(key)) converted = context.schemaMap(value, key);
	else if (SCHEMA_ARRAY_KEYWORDS.has(key)) converted = context.schemaArray(value, key);
	else if (singleKeywords.has(key)) converted = context.schema(value, key);
	else return false;
	assignProperty(out, key, converted);
	return true;
}
var PRE_2020_TO_2020_COLLISIONS = [
	"$anchor",
	"$defs",
	"$dynamicAnchor",
	"$dynamicRef",
	"$vocabulary",
	"contentSchema",
	"dependentRequired",
	"dependentSchemas",
	"maxContains",
	"minContains",
	"prefixItems",
	"unevaluatedItems",
	"unevaluatedProperties"
];
[...PRE_2020_TO_2020_COLLISIONS];
[...PRE_2020_TO_2020_COLLISIONS];
var ANCHOR_REGEXP = /^[A-Za-z_][-A-Za-z0-9._]*$/;
var LEGACY_ID_FRAGMENT_REGEXP = /^[A-Za-z][-A-Za-z0-9._:]*$/;
function unsupported(keyword, dialect, details) {
	throw new Error(`Cannot convert JSON Schema keyword "${keyword}" to ${dialect}: ${details}`);
}
function rejectKeywordCollisions(source, keywords, targetDialect, sourceDialect) {
	for (const keyword of keywords) if (Object.hasOwn(source, keyword)) unsupported(keyword, targetDialect, `it is not active in ${sourceDialect} but would become active in the target`);
}
var DRAFT_07_TARGET_COLLISIONS = [
	"additionalItems",
	"definitions",
	"dependencies"
];
function convertMetaSchemaKeyword(out, value, context, targetUri, targetDialect) {
	if (context.isDocumentRoot) assignProperty(out, "$schema", isMetaSchemaUri(value, "https://json-schema.org/draft/2020-12/schema") ? targetUri : value);
	else if (!isMetaSchemaUri(value, "https://json-schema.org/draft/2020-12/schema")) unsupported("$schema", targetDialect, "an embedded resource cannot declare a different dialect");
}
function draft07Adapter(source, context) {
	rejectKeywordCollisions(source, DRAFT_07_TARGET_COLLISIONS, "Draft-07", "Draft 2020-12");
	const out = {};
	let reference = void 0;
	let prefixItems = void 0;
	let items = void 0;
	for (const key of Object.keys(source)) {
		const value = source[key];
		if (convertSubschemaKeyword(out, key, value, context, JSON_SCHEMA_SINGLE_KEYWORDS)) continue;
		switch (key) {
			case "$ref":
				reference = value;
				break;
			case "$schema":
				convertMetaSchemaKeyword(out, value, context, META_SCHEMA_URI_DRAFT_07, "Draft-07");
				break;
			case "$id":
			case "$anchor": break;
			case "$defs":
				assignProperty(out, "definitions", context.schemaMap(value, key, "definitions"));
				break;
			case "prefixItems":
				prefixItems = value;
				break;
			case "items":
				items = value;
				break;
			case "dependentRequired":
			case "dependentSchemas":
			case "minContains":
			case "maxContains": break;
			case "$dynamicRef":
			case "$dynamicAnchor":
			case "$vocabulary":
			case "unevaluatedProperties":
			case "unevaluatedItems": unsupported(key, "Draft-07", "the target dialect has no equivalent");
			case "required":
				if (Array.isArray(value) && value.length === 0) break;
				assignProperty(out, key, value);
				break;
			default: assignProperty(out, key, value);
		}
	}
	convertTuple(out, prefixItems, items, context);
	if (Object.hasOwn(source, "contains")) {
		const minContains = source.minContains;
		const maxContains = source.maxContains;
		if (minContains !== void 0 && minContains !== 1 || maxContains !== void 0) unsupported("minContains/maxContains", "Draft-07", "contains cardinality cannot be represented");
		if (Object.hasOwn(source, "minContains")) assignProperty(out, "minContains", minContains);
	} else {
		if (Object.hasOwn(source, "minContains")) assignProperty(out, "minContains", source.minContains);
		if (Object.hasOwn(source, "maxContains")) assignProperty(out, "maxContains", source.maxContains);
	}
	convertDependencies(source, out, context, "draft-07");
	convertLegacyId(source, out, "$id", "Draft-07");
	convertReference(out, reference, context);
	return out;
}
function convertTuple(out, prefixItems, items, context) {
	if (prefixItems === void 0) {
		if (items !== void 0) assignProperty(out, "items", context.schema(items, "items"));
		return;
	}
	assignProperty(out, "items", context.schemaArray(prefixItems, "prefixItems", "items"));
	if (items !== void 0) assignProperty(out, "additionalItems", context.schema(items, "items", "additionalItems"));
}
function convertReference(out, reference, context) {
	if (reference === void 0) return;
	if (typeof reference === "string" && Object.keys(out).length > 0) {
		const referenceSchema = {};
		context.reference(referenceSchema, reference);
		appendAllOf(out, referenceSchema);
	} else context.reference(out, reference);
}
function convertDependencies(source, out, context, targetDialect) {
	const dependentRequired = isObject(source.dependentRequired) ? source.dependentRequired : void 0;
	const dependentSchemas = isObject(source.dependentSchemas) ? source.dependentSchemas : void 0;
	if (dependentRequired === void 0 && dependentSchemas === void 0) return;
	const dependencies = {};
	const keys = /* @__PURE__ */ new Set([...Object.keys(dependentRequired ?? {}), ...Object.keys(dependentSchemas ?? {})]);
	for (const key of keys) {
		const required = dependentRequired?.[key];
		const dependency = dependentSchemas?.[key];
		const omitRequired = targetDialect === "draft-04" && Array.isArray(required) && required.length === 0;
		if (dependency === void 0) {
			if (!omitRequired) assignProperty(dependencies, key, required);
		} else if (required === void 0 || omitRequired) assignProperty(dependencies, key, context.schemaAt(dependency, ["dependentSchemas", key], ["dependencies", key]));
		else assignProperty(dependencies, key, { allOf: [context.schemaAt(dependency, ["dependentSchemas", key], [
			"dependencies",
			key,
			"allOf",
			"0"
		]), { required }] });
	}
	if (Object.keys(dependencies).length > 0) assignProperty(out, "dependencies", dependencies);
}
function appendAllOf(out, schema) {
	if (Array.isArray(out.allOf)) out.allOf.push(schema);
	else assignProperty(out, "allOf", [schema]);
}
function convertLegacyId(source, out, targetKey, dialect) {
	const id = source.$id;
	const anchor = source.$anchor;
	if (anchor === void 0) {
		if (id !== void 0) assignProperty(out, targetKey, id);
		return;
	}
	if (typeof anchor !== "string" || !ANCHOR_REGEXP.test(anchor)) unsupported("$anchor", dialect, "the anchor is not valid");
	if (!LEGACY_ID_FRAGMENT_REGEXP.test(anchor)) unsupported("$anchor", dialect, "the anchor cannot be represented as a plain-name fragment identifier");
	if (id === void 0) assignProperty(out, targetKey, `#${anchor}`);
	else unsupported("$anchor", dialect, "it cannot be combined with the schema $id");
}
globalThis.RegExp;
/**
* Escapes special characters in a regular expression pattern.
*
* **When to use**
*
* Use to turn literal text into a safe regular expression pattern fragment.
*
* **Example** (Escaping a pattern string)
*
* ```ts import.meta.vitest
* import { RegExp } from "effect"
*
* RegExp.escape("a*b") // => "a\\*b"
* ```
*
* @category transforming
* @since 2.0.0
*/
var escape = (string) => string.replace(/[/\\^$*+?.()|[\]{}]/g, "\\$&");
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0-rc.112/node_modules/effect/dist/internal/schema/toJsonSchemaDocument.js
var jsonSchemaAnnotationExcludedKeys = /*#__PURE__*/ new Set([
	...annotationExcludedKeys,
	IDENTIFIER_FALLBACK_KEY,
	...jsonSchemaAnnotationKeys
]);
function collectJsonSchemaAnnotations(annotations, options) {
	if (annotations === void 0) return void 0;
	const out = {};
	const title = annotations.title;
	if (typeof title === "string") out.title = title;
	const description = annotations.description;
	const expected = annotations.expected;
	if (typeof description === "string") out.description = description;
	else if (options?.generateDescriptions === true && typeof expected === "string") out.description = expected;
	const defaultValue = annotations.default;
	if (isJson(defaultValue)) out.default = defaultValue;
	const examples = annotations.examples;
	if (Array.isArray(examples) && isJson(examples)) out.examples = examples;
	const readOnly = annotations.readOnly;
	if (typeof readOnly === "boolean") out.readOnly = readOnly;
	const writeOnly = annotations.writeOnly;
	if (typeof writeOnly === "boolean") out.writeOnly = writeOnly;
	const format = annotations.format;
	if (typeof format === "string") out.format = format;
	const contentEncoding = annotations.contentEncoding;
	if (typeof contentEncoding === "string") out.contentEncoding = contentEncoding;
	const contentMediaType = annotations.contentMediaType;
	if (typeof contentMediaType === "string") out.contentMediaType = contentMediaType;
	const contentSchema = annotations.contentSchema;
	if (isJson(contentSchema)) out.contentSchema = contentSchema;
	if (options?.includeAnnotationKey !== void 0) for (const [key, value] of Object.entries(annotations)) {
		if (jsonSchemaAnnotationExcludedKeys.has(key) || !options.includeAnnotationKey(key)) continue;
		if (isJson(value)) assignProperty(out, key, value);
	}
	return Object.keys(out).length === 0 ? void 0 : out;
}
function extractJsonSchemaNumberType(schema) {
	let type = schema.type === "number" || schema.type === "integer" ? schema.type : void 0;
	let out = schema;
	if (type !== void 0) {
		out = { ...schema };
		delete out.type;
	}
	if (Array.isArray(out.allOf)) {
		const members = [];
		let changed = false;
		for (const member of out.allOf) {
			const extracted = extractJsonSchemaNumberType(member);
			if (extracted.type !== void 0) {
				changed = true;
				if (type === void 0 || extracted.type === "integer") type = extracted.type;
			}
			if (Object.keys(extracted.schema).length > 0) members.push(extracted.schema);
		}
		if (changed) {
			const { allOf: _, ...rest } = out;
			out = members.length === 0 ? rest : {
				...rest,
				allOf: members
			};
		}
	}
	return {
		type,
		schema: out
	};
}
function isJsonSchemaNumberEncoding(schema) {
	return Array.isArray(schema.anyOf) && schema.anyOf.length === 4 && schema.anyOf[0]?.type === "number" && schema.anyOf.slice(1).every((member) => member.type === "string");
}
var inlineableCheckKeywords = "|type|format|pattern|multipleOf|minimum|maximum|exclusiveMinimum|exclusiveMaximum|minLength|maxLength|minItems|maxItems|uniqueItems|minProperties|maxProperties|propertyNames|";
function hasOnlyKeywords(schema, allowed) {
	return Object.keys(schema).every((key) => allowed.includes(`|${key}|`));
}
function hasNoCollisions(left, rightKeys) {
	return typeof left.$ref !== "string" && rightKeys.every((key) => !Object.hasOwn(left, key));
}
var promotableAnnotationKeywords = "|title|description|default|examples|readOnly|writeOnly|";
var inlineableAnnotatedCheckKeywords = inlineableCheckKeywords + promotableAnnotationKeywords;
function appendJsonSchema(left, right, inlineCheck) {
	if (Object.keys(left).length === 0) return right;
	const rightKeys = Object.keys(right);
	if (rightKeys.length === 0) return left;
	const leftType = left.type === "number" || left.type === "integer" ? left.type : void 0;
	const isNumberEncoding = isJsonSchemaNumberEncoding(left);
	if (leftType !== void 0 || isNumberEncoding) {
		const extracted = extractJsonSchemaNumberType(right);
		if (extracted.type !== void 0) {
			const type = leftType === "integer" || extracted.type === "integer" ? "integer" : "number";
			const base = {
				...left,
				type
			};
			if (isNumberEncoding) delete base.anyOf;
			const extractedKeys = Object.keys(extracted.schema);
			if (extractedKeys.length === 0) return base;
			return hasOnlyKeywords(extracted.schema, promotableAnnotationKeywords) && hasNoCollisions(base, extractedKeys) ? {
				...base,
				...extracted.schema
			} : appendJsonSchema(base, extracted.schema, inlineCheck);
		}
	}
	if (inlineCheck && hasNoCollisions(left, rightKeys)) return {
		...left,
		...right
	};
	const members = Array.isArray(right.allOf) && rightKeys.length === 1 ? right.allOf : [right];
	if (Array.isArray(left.allOf)) return {
		...left,
		allOf: [...left.allOf, ...members]
	};
	if (typeof left.$ref === "string") return { allOf: [left, ...members] };
	return {
		...left,
		allOf: members
	};
}
function compileJsonSchema(representations, rootPaths, references, options) {
	const definitionStates = /* @__PURE__ */ new Map();
	const compiledRepresentations = /* @__PURE__ */ new WeakMap();
	const fallbackDefinitions = /* @__PURE__ */ new Map();
	let hasAliases = false;
	const referenceKeys = Object.keys(references);
	for (const key of referenceKeys) compileDefinition(key, ["references", key]);
	const schemas = map$4(representations, (representation, index) => finalizeJsonSchema(recur(representation, rootPaths[index])));
	const definitions = {};
	for (const key of referenceKeys) {
		const compiled = definitionStates.get(key);
		if (typeof compiled !== "string") assignProperty(definitions, key, finalizeJsonSchema(compiled));
	}
	return {
		dialect: "draft-2020-12",
		schemas,
		definitions
	};
	function compileDefinition(key, path) {
		const compiled = definitionStates.get(key);
		if (compiled !== void 0) return typeof compiled === "string" ? compiled : key;
		if (!Object.hasOwn(references, key)) throw errorWithPath(`Invalid reference ${key}`, [...path, "$ref"]);
		definitionStates.set(key, null);
		const representation = references[key];
		const schema = recur(representation, ["references", key]);
		const fallback = getIdentifierFallback(representation);
		if (fallback !== void 0) {
			const candidates = fallbackDefinitions.get(fallback);
			const match = candidates?.find((candidate) => equals$1(definitionStates.get(candidate), schema));
			if (match === void 0) {
				if (candidates === void 0) fallbackDefinitions.set(fallback, [key]);
				else candidates.push(key);
			} else {
				hasAliases = true;
				definitionStates.set(key, match);
				return match;
			}
		}
		definitionStates.set(key, schema);
		return key;
	}
	function finalizeJsonSchema(schema) {
		if (!hasAliases) return schema;
		return rewriteRefs(schema, ($ref) => $ref.replace(/^#\/\$defs\/([^/]*)/, (match, token) => {
			const canonical = definitionStates.get(unescapeToken(token));
			return typeof canonical === "string" ? `#/$defs/${escapeToken(canonical)}` : match;
		}));
	}
	function getIdentifierFallback(representation) {
		if (representation._tag === "Reference") return void 0;
		const annotations = representation.checks.length === 0 ? representation.annotations : representation.checks[representation.checks.length - 1].annotations;
		return typeof annotations?.identifier !== "string" && typeof annotations?.["~identifier"] === "string" ? annotations[IDENTIFIER_FALLBACK_KEY] : void 0;
	}
	function annotationSchemas(representation, path) {
		return representation?.schemas?.map((schema, index) => recur(schema, [
			...path,
			"schemas",
			index
		])) ?? [];
	}
	function compileCheck(check, type, path) {
		const annotations = check.annotations;
		const callback = annotations?.toJsonSchema;
		if (callback !== void 0) {
			const fragment = callback({
				type,
				schemas: annotationSchemas(check.representation, [...path, "representation"])
			});
			const ordinary = collectJsonSchemaAnnotations(annotations, options);
			const schema = ordinary === void 0 ? fragment : {
				...fragment,
				...ordinary
			};
			const allowed = ordinary === void 0 ? inlineableCheckKeywords : inlineableAnnotatedCheckKeywords;
			return check._tag === "Filter" && hasOnlyKeywords(schema, allowed) && (ordinary === void 0 || hasOnlyKeywords(ordinary, promotableAnnotationKeywords)) ? [schema, true] : [schema];
		}
		if (check._tag === "Filter") return void 0;
		const children = check.checks.map((child, index) => compileCheck(child, type, [
			...path,
			"checks",
			index
		])).filter((child) => child !== void 0);
		if (children.length === 0) return void 0;
		const ordinary = collectJsonSchemaAnnotations(annotations, options);
		const allOf = children.map(([schema]) => schema);
		return [ordinary === void 0 ? { allOf } : {
			allOf,
			...ordinary
		}];
	}
	function recur(representation, path) {
		if (representation._tag === "Reference") return { $ref: `#/$defs/${escapeToken(compileDefinition(representation.$ref, path))}` };
		const cached = compiledRepresentations.get(representation);
		if (cached !== void 0) return cached;
		let output = on(representation, path);
		const ordinary = collectJsonSchemaAnnotations(representation.annotations, options);
		if (ordinary !== void 0) output = {
			...output,
			...ordinary
		};
		for (let index = 0; index < representation.checks.length; index++) {
			const type = typeof output.type === "string" && isJsonSchemaType(output.type) ? output.type : void 0;
			const check = compileCheck(representation.checks[index], type, [
				...path,
				"checks",
				index
			]);
			if (check !== void 0) output = appendJsonSchema(output, ...check);
		}
		compiledRepresentations.set(representation, output);
		return output;
	}
	function on(representation, path) {
		switch (representation._tag) {
			case "Any":
			case "Unknown": return {};
			case "ObjectKeyword": return { anyOf: [{ type: "object" }, { type: "array" }] };
			case "Void":
			case "Undefined":
			case "Null": return { type: "null" };
			case "BigInt": return {
				type: "string",
				allOf: [{ pattern: "^-?\\d+$" }]
			};
			case "Symbol":
			case "UniqueSymbol": return {
				type: "string",
				allOf: [{ pattern: "^Symbol\\((.*)\\)$" }]
			};
			case "Declaration": return {};
			case "Suspend": return recur(representation.thunk, [...path, "thunk"]);
			case "Never": return { not: {} };
			case "String": return { type: "string" };
			case "Number": return { anyOf: [
				{ type: "number" },
				{
					type: "string",
					enum: ["NaN"]
				},
				{
					type: "string",
					enum: ["Infinity"]
				},
				{
					type: "string",
					enum: ["-Infinity"]
				}
			] };
			case "Boolean": return { type: "boolean" };
			case "Literal": {
				const literal = representation.literal;
				return typeof literal === "bigint" ? {
					type: "string",
					enum: [globalThis.String(literal)]
				} : {
					type: typeof literal,
					enum: [literal]
				};
			}
			case "Enum": {
				const types = representation.enums.map(([title, literal]) => typeof literal === "number" && !globalThis.Number.isFinite(literal) ? {
					type: "string",
					enum: [globalThis.String(literal)],
					title
				} : {
					type: typeof literal,
					enum: [literal],
					title
				});
				return types.length === 0 ? { not: {} } : { anyOf: types };
			}
			case "TemplateLiteral": return {
				type: "string",
				pattern: `^${representation.parts.map(getPartPattern).join("")}$`
			};
			case "Arrays": {
				if (representation.rest.length > 1) throw errorWithPath("Invalid schema representation document", [...path, "rest"]);
				const out = { type: "array" };
				let minItems = representation.elements.length;
				const prefixItems = representation.elements.map((element, index) => {
					if (element.isOptional) minItems--;
					const compiled = recur(element.type, [
						...path,
						"elements",
						index,
						"type"
					]);
					const annotations = collectJsonSchemaAnnotations(element.annotations, options);
					return annotations === void 0 ? compiled : appendJsonSchema(compiled, annotations);
				});
				if (prefixItems.length > 0) {
					out.prefixItems = prefixItems;
					out.maxItems = representation.elements.length;
					if (minItems > 0) out.minItems = minItems;
				} else out.items = false;
				if (representation.rest.length === 1) {
					delete out.maxItems;
					const rest = recur(representation.rest[0], [
						...path,
						"rest",
						0
					]);
					if (Object.keys(rest).length > 0) out.items = rest;
					else delete out.items;
				}
				return out;
			}
			case "Objects": {
				if (representation.propertySignatures.length === 0 && representation.indexSignatures.length === 0) return { anyOf: [{ type: "object" }, { type: "array" }] };
				const out = { type: "object" };
				const properties = {};
				const required = [];
				for (let index = 0; index < representation.propertySignatures.length; index++) {
					const property = representation.propertySignatures[index];
					if (typeof property.name !== "string") throw errorWithPath("Invalid schema representation document", [
						...path,
						"propertySignatures",
						index,
						"name"
					]);
					const name = property.name;
					const compiled = recur(property.type, [
						...path,
						"propertySignatures",
						index,
						"type"
					]);
					const annotations = collectJsonSchemaAnnotations(property.annotations, options);
					assignProperty(properties, name, annotations === void 0 ? compiled : appendJsonSchema(compiled, annotations));
					if (!property.isOptional) required.push(name);
				}
				if (representation.propertySignatures.length > 0) out.properties = properties;
				if (required.length > 0) out.required = required;
				const patternProperties = {};
				const additionalProperties = [];
				for (let index = 0; index < representation.indexSignatures.length; index++) {
					const signature = representation.indexSignatures[index];
					let type = recur(signature.type, [
						...path,
						"indexSignatures",
						index,
						"type"
					]);
					if (Object.keys(type).length === 1 && "not" in type) type = false;
					const patterns = getParameterPatterns(signature.parameter, [
						...path,
						"indexSignatures",
						index,
						"parameter"
					], /* @__PURE__ */ new Set());
					if (patterns.length === 0) additionalProperties.push(type);
					else for (const pattern of patterns) {
						const previous = patternProperties[pattern];
						assignProperty(patternProperties, pattern, previous === void 0 ? type : previous === false || type === false ? false : appendJsonSchema(previous, type));
					}
				}
				const hasPatternProperties = Object.keys(patternProperties).length > 0;
				if (hasPatternProperties) out.patternProperties = patternProperties;
				if (representation.indexSignatures.length === 0) out.additionalProperties = options?.additionalProperties ?? false;
				else if (additionalProperties.length === 1 && representation.propertySignatures.length === 0 && !hasPatternProperties) out.additionalProperties = additionalProperties[0];
				else if (additionalProperties.length > 0) out.allOf = additionalProperties.map((type) => ({
					type: "object",
					additionalProperties: type
				}));
				if (typeof out.additionalProperties === "object" && out.additionalProperties !== null && Object.keys(out.additionalProperties).length === 0) delete out.additionalProperties;
				return out;
			}
			case "Union": {
				const types = representation.types.map((type, index) => recur(type, [
					...path,
					"types",
					index
				]));
				if (types.length === 0) return { not: {} };
				if (representation.mode === "anyOf" && types.length > 1) {
					const compacted = compactEnums(types);
					if (compacted !== void 0) return compacted;
				}
				return representation.mode === "anyOf" ? { anyOf: types } : { oneOf: types };
			}
		}
	}
	function getParameterPatterns(parameter, path, seenReferences) {
		switch (parameter._tag) {
			case "Reference": {
				if (!Object.hasOwn(references, parameter.$ref)) throw errorWithPath(`Invalid reference ${parameter.$ref}`, [...path, "$ref"]);
				compileDefinition(parameter.$ref, path);
				if (seenReferences.has(parameter.$ref)) return [];
				const next = new Set(seenReferences).add(parameter.$ref);
				return getParameterPatterns(references[parameter.$ref], ["references", parameter.$ref], next);
			}
			case "String": return collectPatterns(recur(parameter, path));
			case "TemplateLiteral": return [`^${parameter.parts.map(getPartPattern).join("")}$`];
			case "Union": return parameter.types.flatMap((type, index) => getParameterPatterns(type, [
				...path,
				"types",
				index
			], seenReferences));
			default: throw errorWithPath("Invalid schema representation document", path);
		}
	}
}
function isJsonSchemaType(input) {
	return input === "string" || input === "number" || input === "boolean" || input === "array" || input === "object" || input === "null" || input === "integer";
}
function compactEnums(schemas) {
	let sharedType = void 0;
	const values = [];
	for (const schema of schemas) {
		if (Object.keys(schema).length !== 2 || schema.type === void 0 || !Array.isArray(schema.enum) || schema.enum.length === 0) return;
		if (sharedType === void 0) sharedType = schema.type;
		else if (schema.type !== sharedType) return void 0;
		values.push(...schema.enum);
	}
	return {
		type: sharedType,
		enum: values
	};
}
function collectPatterns(schema) {
	const patterns = [];
	if (typeof schema.pattern === "string") patterns.push(schema.pattern);
	for (const key of [
		"allOf",
		"anyOf",
		"oneOf"
	]) {
		const members = schema[key];
		if (Array.isArray(members)) {
			for (const member of members) if (typeof member === "object" && member !== null && !Array.isArray(member)) patterns.push(...collectPatterns(member));
		}
	}
	return patterns;
}
function getPartPattern(part) {
	switch (part._tag) {
		case "Literal": return escape(globalThis.String(part.literal));
		case "String": return STRING_PATTERN;
		case "Number": return FINITE_PATTERN;
		case "TemplateLiteral": return part.parts.map(getPartPattern).join("");
		case "Union": return part.types.map(getPartPattern).join("|");
		default: throw errorWithPath("Invalid schema representation document", []);
	}
}
/** @internal */
function toJsonSchemaDocument$1(document, options) {
	const output = compileJsonSchema([document.representation], [["representation"]], document.references, options);
	return {
		dialect: output.dialect,
		schema: output.schemas[0],
		definitions: output.definitions
	};
}
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0-rc.112/node_modules/effect/dist/internal/schema/toRepresentation.js
var defaultReferencePolicy = ({ identifier }) => identifier;
function annotationsField(annotations) {
	return annotations === void 0 ? void 0 : { annotations };
}
/** @internal */
function toRepresentation(ast, options) {
	const { references, representations } = toRepresentations([ast], options);
	return {
		representation: representations[0],
		references
	};
}
/** @internal */
function toRepresentations(asts, options) {
	const references = {};
	const referenceOwners = /* @__PURE__ */ new Map();
	const buildingReferences = /* @__PURE__ */ new Set();
	const candidates = /* @__PURE__ */ new Map();
	const visitingCandidates = /* @__PURE__ */ new Set();
	for (const ast of asts) visit(ast);
	const referencePolicy = options?.referencePolicy ?? defaultReferencePolicy;
	for (const candidatesByIdentifier of candidates.values()) for (const candidate of candidatesByIdentifier.values()) {
		const requestedReference = referencePolicy({
			ast: candidate.ast,
			occurrences: candidate.occurrences,
			identifier: candidate.identifier
		});
		if (requestedReference !== void 0) candidate.reference = getReference(requestedReference, candidate, requestedReference === candidate.identifier || !requestedReference.endsWith("_") ? "_" : "");
		else if (candidate.isRecursive) candidate.reference = getReference(`${candidate.ast._tag}_`, candidate, "");
	}
	return {
		representations: map$4(asts, (ast) => recur(ast)),
		references
	};
	function getReference(prefix, owner, separator = "_") {
		let candidate = prefix;
		let suffix = 0;
		while (referenceOwners.has(candidate)) {
			if (referenceOwners.get(candidate) === owner) return candidate;
			candidate = `${prefix}${separator}${++suffix}`;
		}
		referenceOwners.set(candidate, owner);
		return candidate;
	}
	function annotateReference(ast, candidate, reference) {
		const fallback = candidate.fallback;
		if (fallback !== void 0) return resolveIdentifierFallback(ast) === fallback ? ast : annotate(ast, { [IDENTIFIER_FALLBACK_KEY]: fallback });
		return reference === candidate.identifier ? ast : annotate(ast, { identifier: reference });
	}
	function makeReference(reference, ast) {
		if (!Object.hasOwn(references, reference) && !buildingReferences.has(reference)) {
			buildingReferences.add(reference);
			const representation = on(ast);
			buildingReferences.delete(reference);
			assignProperty(references, reference, representation);
		}
		return {
			_tag: "Reference",
			$ref: reference
		};
	}
	function getCandidate(input) {
		const ast = getLastEncoding(input);
		const owner = getContextOwner(ast);
		let identifier = resolveIdentifier(ast);
		const fallback = identifier === void 0 ? (ast !== input ? resolveIdentifier(input) : void 0) ?? resolveIdentifierFallback(ast) : void 0;
		if (fallback !== void 0) identifier = `${fallback}Encoded`;
		let candidatesByIdentifier = candidates.get(owner);
		if (candidatesByIdentifier === void 0) {
			candidatesByIdentifier = /* @__PURE__ */ new Map();
			candidates.set(owner, candidatesByIdentifier);
		}
		let candidate = candidatesByIdentifier.get(identifier);
		if (candidate === void 0) {
			candidate = {
				ast: owner,
				identifier,
				fallback,
				occurrences: 0,
				isRecursive: false,
				reference: void 0
			};
			candidatesByIdentifier.set(identifier, candidate);
		}
		return candidate;
	}
	function visit(input) {
		const candidate = getCandidate(input);
		const ast = candidate.ast;
		candidate.occurrences++;
		if (visitingCandidates.has(candidate)) {
			candidate.isRecursive = true;
			return;
		}
		if (candidate.occurrences > 1) return;
		visitingCandidates.add(candidate);
		visitChecks(ast.checks);
		switch (ast._tag) {
			case "Declaration":
			case "Arrays":
			case "Objects":
			case "Union":
				ast.recur((child) => {
					visit(child);
					return child;
				});
				break;
			case "TemplateLiteral":
				ast.parts.forEach(visit);
				break;
			case "Suspend": visit(ast.thunk());
		}
		visitingCandidates.delete(candidate);
	}
	function visitChecks(checks) {
		checks?.forEach((check) => {
			check.annotations?.representation?.schemas?.forEach((schema) => visit(toType$1(schema)));
			if (check._tag === "FilterGroup") visitChecks(check.checks);
		});
	}
	function recur(input) {
		const candidate = getCandidate(input);
		const ast = candidate.ast;
		const reference = candidate.reference;
		if (reference !== void 0) return makeReference(reference, candidate.identifier === void 0 ? ast : annotateReference(ast, candidate, reference));
		return on(ast);
	}
	function on(ast) {
		const checks = fromChecks(ast.checks);
		switch (ast._tag) {
			case "Declaration": return {
				_tag: "Declaration",
				typeParameters: ast.typeParameters.map((ast) => recur(ast)),
				checks,
				...fromDeclarationAnnotations(ast.annotations)
			};
			case "Null":
			case "Undefined":
			case "Void":
			case "Never":
			case "Unknown":
			case "Any":
			case "String":
			case "Boolean":
			case "Number":
			case "BigInt":
			case "Symbol":
			case "ObjectKeyword": return {
				_tag: ast._tag,
				checks,
				...annotationsField(ast.annotations)
			};
			case "Literal": return {
				_tag: "Literal",
				literal: ast.literal,
				checks,
				...annotationsField(ast.annotations)
			};
			case "UniqueSymbol": return {
				_tag: "UniqueSymbol",
				symbol: ast.symbol,
				checks,
				...annotationsField(ast.annotations)
			};
			case "Enum": return {
				_tag: "Enum",
				enums: ast.enums,
				checks,
				...annotationsField(ast.annotations)
			};
			case "TemplateLiteral": return {
				_tag: "TemplateLiteral",
				parts: ast.parts.map((ast) => recur(ast)),
				checks,
				...annotationsField(ast.annotations)
			};
			case "Arrays": return {
				_tag: "Arrays",
				elements: ast.elements.map((element) => {
					const projected = getLastEncoding(element);
					const annotations = projected.context?.annotations;
					return {
						isOptional: isOptional(projected),
						type: recur(element),
						...annotationsField(annotations)
					};
				}),
				rest: ast.rest.map((ast) => recur(ast)),
				checks,
				...annotationsField(ast.annotations)
			};
			case "Objects": return {
				_tag: "Objects",
				propertySignatures: ast.propertySignatures.map((property) => {
					const projected = getLastEncoding(property.type);
					const annotations = projected.context?.annotations;
					return {
						name: property.name,
						type: recur(property.type),
						isOptional: isOptional(projected),
						isMutable: isMutable(projected),
						...annotationsField(annotations)
					};
				}),
				indexSignatures: ast.indexSignatures.map((index) => ({
					parameter: recur(index.parameter),
					type: recur(index.type)
				})),
				checks,
				...annotationsField(ast.annotations)
			};
			case "Union": return {
				_tag: "Union",
				types: ast.types.map((ast) => recur(ast)),
				mode: ast.mode,
				checks,
				...annotationsField(ast.annotations)
			};
			case "Suspend": return {
				_tag: "Suspend",
				checks: [],
				thunk: recur(ast.thunk()),
				...annotationsField(ast.annotations)
			};
		}
	}
	function fromChecks(checks) {
		return checks?.map(fromCheck) ?? [];
	}
	function fromCheck(check) {
		switch (check._tag) {
			case "Filter": return {
				_tag: "Filter",
				aborted: check.aborted,
				...fromCheckAnnotations(check.annotations)
			};
			case "FilterGroup": return {
				_tag: "FilterGroup",
				checks: map$4(check.checks, fromCheck),
				...fromCheckAnnotations(check.annotations)
			};
		}
	}
	function fromDeclarationAnnotations(annotations) {
		if (annotations === void 0) return void 0;
		const { representation, ...ordinary } = annotations;
		return {
			...representation === void 0 ? void 0 : { representation },
			...Object.keys(ordinary).length === 0 ? void 0 : { annotations: ordinary }
		};
	}
	function fromCheckAnnotations(annotations) {
		if (annotations === void 0) return void 0;
		const { representation, ...ordinary } = annotations;
		const projected = representation === void 0 ? void 0 : representation.schemas === void 0 ? representation : {
			...representation,
			schemas: representation.schemas.map((schema) => recur(toType$1(schema)))
		};
		return {
			...projected === void 0 ? void 0 : { representation: projected },
			...Object.keys(ordinary).length === 0 ? void 0 : { annotations: ordinary }
		};
	}
}
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0-rc.112/node_modules/effect/dist/Schema.js
var TypeId$2 = TypeId$3;
var SchemaErrorTypeId = "~effect/SchemaError/SchemaError";
/**
* Error thrown or returned when schema decoding or encoding fails.
*
* **Details**
*
* The `issue` field contains a structured {@link SchemaIssue.Issue} tree describing
* every validation failure, including the path to the problematic value and
* the expected type or constraint. The `message` field renders the issue tree
* with the default formatter.
*
* **Gotchas**
*
* Parsing with `reportInput: true` adds an enumerable `input` field to
* value-bearing issues. Built-in messages may include reported input, and
* custom annotations or messages are not sanitized.
*
* **Example** (Inspecting a SchemaError)
*
* ```ts import.meta.vitest
* import { Result, Schema } from "effect"
*
* const result = Schema.decodeUnknownResult(Schema.Number)("not a number")
* const message = Result.isFailure(result) ? result.failure.message : ""
* message // => "Expected number"
* ```
*
* @see {@link isSchemaError} for narrowing unknown values
* @category errors
* @since 4.0.0
*/
var SchemaError = class extends (/*#__PURE__*/ TaggedError("SchemaError")) {
	[SchemaErrorTypeId] = SchemaErrorTypeId;
	constructor(issue) {
		const stackTraceLimit = getStackTraceLimit();
		setStackTraceLimit(0);
		try {
			super({ issue });
		} finally {
			setStackTraceLimit(stackTraceLimit);
		}
	}
	get message() {
		return defaultFormatter(this.issue);
	}
	toString() {
		return `SchemaError(${this.message})`;
	}
};
/**
* Returns `true` if `u` is a {@link SchemaError}.
*
* **When to use**
*
* Use when you need to narrow an unknown value to `SchemaError`.
*
* **Example** (Narrowing Schema errors)
*
* ```ts import.meta.vitest
* import { Result, Schema } from "effect"
*
* const result = Result.try(() => Schema.decodeUnknownSync(Schema.Number)("oops"))
* const error: unknown = Result.isFailure(result) ? result.failure : undefined
* Schema.isSchemaError(error) // => true
* ```
*
* @category guards
* @since 4.0.0
*/
function isSchemaError(u) {
	return hasProperty(u, SchemaErrorTypeId) && u[SchemaErrorTypeId] === SchemaErrorTypeId;
}
function makeStandardResult(exit) {
	return isSuccess(exit) ? exit.value : { issues: [{ message: pretty(exit.cause) }] };
}
/**
* Returns a "Standard Schema" object conforming to the [Standard Schema
* v1](https://standardschema.dev/) specification.
*
* **Details**
*
* This function creates a schema whose `validate` method attempts to decode and
* validate the provided input synchronously. If the underlying `Schema`
* includes any asynchronous components (e.g., asynchronous message resolutions
* or checks), then validation will necessarily return a `Promise` instead.
*
* **Example** (Creating a standard schema from a regular schema)
*
* ```ts import.meta.vitest
* import { Schema } from "effect"
*
* // Define custom hook functions for error formatting
* const leafHook = (issue: any) => {
*   switch (issue._tag) {
*     case "InvalidType":
*       return "Expected different type"
*     case "InvalidValue":
*       return "Invalid value provided"
*     case "MissingKey":
*       return "Required property missing"
*     case "UnexpectedKey":
*       return "Unexpected property found"
*     case "Forbidden":
*       return "Operation not allowed"
*     case "OneOf":
*       return "Multiple valid options available"
*     default:
*       return "Validation error"
*   }
* }
*
* // Create a standard schema from a regular schema
* const PersonSchema = Schema.Struct({
*   name: Schema.NonEmptyString,
*   age: Schema.Finite.check(Schema.isBetween({ minimum: 0, maximum: 150 }))
* })
*
* const standardSchema = Schema.toStandardSchemaV1(PersonSchema, {
*   leafHook
* })
*
* // The standard schema can be used with any Standard Schema v1 compatible library
* const validResult = standardSchema["~standard"].validate({
*   name: "Alice",
*   age: 30
* })
* const invalidResult = standardSchema["~standard"].validate({
*   name: "",
*   age: 200
* })
*
* if (validResult instanceof Promise || invalidResult instanceof Promise) {
*   throw new Error("Expected synchronous validation")
* }
* if ("value" in validResult) {
*   validResult.value // => { name: "Alice", age: 30 }
* }
* invalidResult.issues?.map((issue) => issue.path) // => [["name"], ["age"]]
* ```
*
* @category converting
* @since 4.0.0
*/
function toStandardSchemaV1(self, options) {
	const decodeUnknownEffect = decodeUnknownEffect$1(self);
	const parseOptions = {
		errors: "all",
		...options?.parseOptions
	};
	const formatter = makeFormatterStandardSchemaV1(options);
	const validate = (value) => {
		const scheduler = new MixedScheduler("sync");
		const fiber = runFork(match(decodeUnknownEffect(value, parseOptions), {
			onFailure: formatter,
			onSuccess: (value) => ({ value })
		}), { scheduler });
		fiber.currentDispatcher?.flush();
		const exit = fiber.pollUnsafe();
		if (exit) return makeStandardResult(exit);
		return new Promise((resolve) => {
			fiber.addObserver((exit) => {
				resolve(makeStandardResult(exit));
			});
		});
	};
	if ("~standard" in self) {
		const out = self;
		if ("validate" in out["~standard"]) return out;
		Object.assign(out["~standard"], { validate });
		return out;
	} else return Object.assign(self, { "~standard": {
		version: 1,
		vendor: "effect",
		validate
	} });
}
function toBaseStandardJSONSchemaV1(self, target) {
	const doc2020_12 = toJsonSchemaDocument(self);
	if (target === "draft-2020-12") {
		const schema = doc2020_12.schema;
		if (Object.keys(doc2020_12.definitions).length > 0) schema.$defs = doc2020_12.definitions;
		return schema;
	} else if (target === "draft-07") {
		const doc07 = toDocumentDraft07(doc2020_12);
		const schema = doc07.schema;
		if (Object.keys(doc07.definitions).length > 0) schema.definitions = doc07.definitions;
		return schema;
	}
	throw new globalThis.Error(`Unsupported target: ${target}`);
}
/**
* Converts a schema to an experimental Standard JSON Schema V1 representation.
*
* **Details**
*
* https://github.com/standard-schema/standard-schema/pull/134
*
* @category converting
* @since 4.0.0
*/
function toStandardJSONSchemaV1(self) {
	const jsonSchema = {
		input(options) {
			return toBaseStandardJSONSchemaV1(self, options.target);
		},
		output(options) {
			return toBaseStandardJSONSchemaV1(toType(self), options.target);
		}
	};
	if ("~standard" in self) {
		const out = self;
		if ("jsonSchema" in out["~standard"]) return out;
		Object.assign(out["~standard"], { jsonSchema });
		return out;
	} else return Object.assign(self, { "~standard": {
		version: 1,
		vendor: "effect",
		jsonSchema
	} });
}
/**
* Creates a type guard function that checks if a value conforms to a given
* schema.
*
* **Details**
*
* This function returns a predicate that performs a type-safe check, narrowing
* the type of the input value if the check passes. The predicate returns `false`
* for schema mismatches.
*
* **Gotchas**
*
* Only causes made entirely of schema issues are converted to `false`. Causes
* that contain defects, interruptions, or other non-schema reasons throw
* instead.
*
* **Example** (Defining a basic type guard)
*
* ```ts import.meta.vitest
* import { Schema } from "effect"
*
* const isString = Schema.is(Schema.String)
*
* isString("hello") // => true
* isString(42) // => false
*
* // Type narrowing in action
* const value: unknown = "hello"
* if (isString(value)) {
*   // value is now typed as string
*   value.toUpperCase() // => "HELLO"
* }
* ```
*
* @category guards
* @since 3.10.0
*/
var is = is$1;
/**
* Decodes an `unknown` input against a schema, returning an `Effect` that
* succeeds with the decoded value or fails with a {@link SchemaError}.
*
* **When to use**
*
* Use when you need to decode unknown input in an `Effect` whose failure
* channel is `SchemaError`.
*
* **Details**
*
* Prefer {@link decodeEffect} when the input is already typed as the schema's
* `Encoded` type.
* Options may be provided either when creating the decoder or when applying it;
* application options override creation options.
*
* @see {@link SchemaParser.decodeUnknownEffect} for the adapter that fails with `SchemaIssue.Issue` directly
*
* @category decoding
* @since 4.0.0
*/
function decodeUnknownEffect(schema, options) {
	const parser = decodeUnknownEffect$1(schema, options);
	return (input, options) => {
		return fromIssueEffect(parser(input, options));
	};
}
function fromIssueEffect(self) {
	if (effectIsExit(self)) return fromIssueExit(self);
	return catchCause(self, (cause) => failCauseSync(() => map$2(cause, (issue) => new SchemaError(issue))));
}
function getSchemaErrorOrThrow(cause, message) {
	let schemaError;
	for (const reason of cause.reasons) {
		if (!isFailReason(reason) || !isSchemaError(reason.error)) throw new globalThis.Error(message, { cause });
		schemaError ??= reason.error;
	}
	if (schemaError === void 0) throw new globalThis.Error(message, { cause });
	return schemaError;
}
function runSchemaErrorSync(self) {
	const exit = runSyncExit(self);
	if (isSuccess(exit)) return exit.value;
	throw getSchemaErrorOrThrow(exit.cause, "Sync adapter can only throw schema errors");
}
function fromIssueExit(exit) {
	return isSuccess(exit) ? exit : failCause$2(map$2(exit.cause, (issue) => new SchemaError(issue)));
}
/**
* Decodes an `unknown` input against a schema synchronously, returning the
* decoded value or throwing a {@link SchemaError} for schema mismatches.
*
* **When to use**
*
* Use when you need to validate unknown data at a synchronous boundary and want
* schema mismatches to throw `SchemaError`.
*
* **Details**
*
* For input already typed as the schema's `Encoded` type use `decodeSync`.
* Only service-free schemas can be decoded synchronously. For alternatives that
* do not throw on schema mismatches, see `decodeUnknownOption`,
* `decodeUnknownExit`, or `decodeUnknownEffect`. Options may be provided either
* when creating the decoder or when applying it; application options override
* creation options.
*
* **Gotchas**
*
* Non-schema failures may throw a runtime failure instead of `SchemaError`.
*
* **Example** (Decoding with a transformation schema)
*
* ```ts import.meta.vitest
* import { Schema } from "effect"
*
* const NumberFromString = Schema.NumberFromString
*
* Schema.decodeUnknownSync(NumberFromString)("42") // => 42
* ```
*
* @see {@link SchemaParser.decodeUnknownSync} for the adapter that throws an `Error` whose cause is `SchemaIssue.Issue`
*
* @category decoding
* @since 4.0.0
*/
function decodeUnknownSync(schema, options) {
	const parser = decodeUnknownEffect(schema, options);
	return (input, options) => {
		return runSchemaErrorSync(parser(input, options));
	};
}
/**
* Creates a schema from an AST (Abstract Syntax Tree) node.
*
* **Details**
*
* This is the fundamental constructor for all schemas in the Effect Schema
* library. It takes an AST node and wraps it in a fully-typed schema that
* preserves all type information and provides the complete schema API.
*
* The `make` function is used internally to create all primitive schemas like
* `String`, `Number`, `Boolean`, etc., as well as more complex schemas. It's
* the bridge between the untyped AST representation and the strongly-typed
* schema.
*
* @category constructors
* @since 3.10.0
*/
var make$1 = make$2;
/**
* Checks whether a value is a `Schema`.
*
* @category guards
* @since 3.10.0
*/
function isSchema(u) {
	return hasProperty(u, TypeId$2) && u[TypeId$2] === TypeId$2;
}
/**
* Marks a struct field as optional, allowing the key to be absent or
* `undefined`.
*
* **Details**
*
* The resulting property may be absent or explicitly set to `undefined`.
* Equivalent to `optionalKey(UndefinedOr(S))`.
*
* Use {@link optionalKey} instead if you want exact optional semantics (absent
* only, not `undefined`).
*
* **Example** (Defining an optional field accepting undefined)
*
* ```ts import.meta.vitest
* import { Schema } from "effect"
*
* const schema = Schema.Struct({
*   name: Schema.String,
*   age: Schema.optional(Schema.Number)
* })
*
* // { readonly name: string; readonly age?: number | undefined }
* type Person = typeof schema.Type
* ```
*
* @category combinators
* @since 3.10.0
*/
var optional = /*#__PURE__*/ lambda((self) => {
	const schema = UndefinedOr(self);
	return make$1(optional$1(self.ast), { schema });
});
/**
* Extracts the type-side schema: sets `Encoded` to equal the decoded `Type`,
* discarding the encoding transformation path.
*
* @category transforming
* @since 4.0.0
*/
var toType = /*#__PURE__*/ lambda((schema) => make$1(toType$1(schema.ast), { schema }));
/**
* Creates a schema for a single literal value (string, number, bigint, boolean, or null).
*
* **Example** (Defining a string literal)
*
* ```ts import.meta.vitest
* import { Schema } from "effect"
*
* const schema = Schema.Literal("hello")
* // Type: Schema.Literal<"hello">
* Schema.decodeSync(schema)("hello") // => "hello"
* ```
*
* @see {@link Literals} for a schema that represents a union of literals.
* @see {@link tag} for a schema that represents a literal value that can be
* used as a discriminator field in tagged unions and has a constructor default.
* @category constructors
* @since 3.10.0
*/
function Literal(literal) {
	const out = make$1(new Literal$1(literal), {
		literal,
		transform(to) {
			return out.pipe(decodeTo(Literal(to), {
				decode: transform$1(() => to),
				encode: transform$1(() => literal)
			}));
		}
	});
	return out;
}
/**
* Schema for the `null` literal. Validates that the input is strictly `null`.
*
* @see {@link NullOr} for a union with another schema.
* @category schemas
* @since 3.10.0
*/
var Null = /*#__PURE__*/ make$1(null_);
/**
* Schema for the `undefined` literal. Validates that the input is strictly `undefined`.
*
* @see {@link UndefinedOr} for a union with another schema.
* @category schemas
* @since 3.10.0
*/
var Undefined = /*#__PURE__*/ make$1(undefined_);
/**
* Schema for `string` values. Validates that the input is `typeof` `"string"`.
*
* @category schemas
* @since 4.0.0
*/
var String$1 = /*#__PURE__*/ make$1(string);
/**
* Schema for `number` values, including `NaN`, `Infinity`, and `-Infinity`.
*
* **Details**
*
* Default JSON serializer:
*
* - Finite numbers are serialized as numbers.
* - Non-finite values are serialized as strings (`"NaN"`, `"Infinity"`, `"-Infinity"`).
*
* @see {@link Finite} for a schema that excludes non-finite values.
* @category schemas
* @since 4.0.0
*/
var Number$1 = /*#__PURE__*/ make$1(number);
/**
* Schema for `boolean` values. Validates that the input is `typeof` `"boolean"`.
*
* **When to use**
*
* Use to validate values that are already JavaScript booleans.
*
* @see {@link BooleanFromBit} for a schema that decodes bit literals `0` or `1` into a boolean
*
* @category schemas
* @since 4.0.0
*/
var Boolean = /*#__PURE__*/ make$1(boolean);
function makeStruct(ast, fields) {
	return make$1(ast, {
		fields,
		mapFields(f, options) {
			const fields = f(this.fields);
			return makeStruct(struct(fields, options?.unsafePreserveChecks ? this.ast.checks : void 0), fields);
		}
	});
}
/**
* Defines a struct schema from a map of field schemas.
*
* **Details**
*
* Each field value is a schema. Use {@link optionalKey} or {@link optional} to
* mark fields as optional, and {@link mutableKey} to mark them as mutable.
*
* The resulting schema's `Type` is a readonly object type with the fields'
* decoded types. The `Encoded` form mirrors the field schemas' encoded types.
*
* **Example** (Defining a basic struct)
*
* ```ts import.meta.vitest
* import { Schema } from "effect"
*
* const Person = Schema.Struct({
*   name: Schema.String,
*   age: Schema.Number,
*   email: Schema.optionalKey(Schema.String)
* })
*
* // { readonly name: string; readonly age: number; readonly email?: string }
* type Person = typeof Person.Type
*
* Schema.decodeUnknownSync(Person)({ name: "Alice", age: 30 }) // => { name: "Alice", age: 30 }
* ```
*
* @category constructors
* @since 3.10.0
*/
function Struct(fields) {
	return makeStruct(struct(fields, void 0), fields);
}
/**
* @category constructors
* @since 4.0.0
*/
var ArraySchema = /*#__PURE__*/ lambda((schema) => make$1(new Arrays(false, [], [schema.ast]), { value: schema }));
function makeUnion(ast, members) {
	return make$1(ast, {
		members,
		mapMembers(f, options) {
			const members = f(this.members);
			return makeUnion(union(members, this.ast.mode, options?.unsafePreserveChecks ? this.ast.checks : void 0), members);
		}
	});
}
/**
* Creates a union schema from an array of member schemas. Members are tested in
* order; the first match is returned.
*
* **Details**
*
* Optionally, specify `mode`:
* - `"anyOf"` (default) — matches if any member matches.
* - `"oneOf"` — matches if exactly one member matches.
*
* **Example** (Defining a string or number union)
*
* ```ts import.meta.vitest
* import { Schema } from "effect"
*
* const schema = Schema.Union([Schema.String, Schema.Number])
*
* Schema.decodeUnknownSync(schema)("hello") // => "hello"
* Schema.decodeUnknownSync(schema)(42) // => 42
* ```
*
* @category constructors
* @since 3.10.0
*/
function Union(members, options) {
	return makeUnion(union(members, options?.mode ?? "anyOf", void 0), members);
}
/**
* Creates a union schema of `S | null`.
*
* @category constructors
* @since 3.10.0
*/
var NullOr = /*#__PURE__*/ lambda((self) => Union([self, Null]));
/**
* Creates a union schema of `S | undefined`.
*
* @category constructors
* @since 3.10.0
*/
var UndefinedOr = /*#__PURE__*/ lambda((self) => Union([self, Undefined]));
function decodeTo(to, transformation) {
	return (from) => {
		return make$1(decodeTo$1(from.ast, to.ast, transformation ? make$7(transformation) : passthrough()), {
			from,
			to
		});
	};
}
globalThis.RegExp;
globalThis.URL;
globalThis.File;
globalThis.FormData;
globalThis.URLSearchParams;
globalThis.Uint8Array;
/**
* Returns a JSON Schema document using draft 2020-12.
*
* **When to use**
*
* Use when you need a draft-2020-12 description of the canonical JSON form of a runtime schema.
*
* **Details**
*
* The `options` parameter controls reference extraction and generation details
* such as additional properties and synthesized check descriptions; it does
* not change the draft target. The reference policy receives canonical JSON
* encoded ASTs. By default, anonymous non-recursive candidates remain inline, while candidates with resolved identifiers
* become definitions. Declarations are lowered through their `toCodecJson` or `toCodec`
* annotation when available before the representation document is compiled.
* For schemas whose codec JSON AST can be represented exactly in JSON Schema,
* importing the emitted document reconstructs a schema that accepts the same
* JSON values. This is a semantic round-trip guarantee; the reconstructed AST
* may have a different shape.
*
* **Gotchas**
*
* JSON Schema generation is best-effort. Some Effect schema semantics cannot
* be represented exactly in JSON Schema, and importing an emitted JSON Schema
* may produce an equivalent approximation rather than the original schema
* shape. Such schemas are outside the exact round-trip subset. When canonical
* JSON derivation adds an artificial transformation, checks and annotations on
* its source node are not copied to the JSON target, so they do not appear in
* the emitted document. Opaque declarations without a structural codec are
* represented by an unconstrained JSON Schema. Effect decoding may discard
* excess object properties by default; use `onExcessProperty: "error"` when
* comparing validation semantics with an emitted JSON Schema.
*
* @see {@link SchemaRepresentation.toJsonSchemaDocument} for compiling an existing live representation document
*
* @category converting
* @since 4.0.0
*/
function toJsonSchemaDocument(schema, options) {
	return toJsonSchemaDocument$1(toRepresentation(toCodecJsonAST(schema.ast), options), options);
}
/** @internal */
var toCodecJsonAST = /*#__PURE__*/ applyToSelfOrLastLinkEncodingIdempotent((ast) => {
	const out = toCodecJsonASTStep(ast, toCodecJsonAST);
	const context = ast.context;
	if (out === ast || context === void 0) return out;
	return replaceContextLastLink(out, withoutConstructorDefault(context));
});
function withoutConstructorDefault(context) {
	return context.constructorDefault === void 0 ? context : new Context(context.isOptional, context.isMutable, void 0, context.annotations);
}
function validateCanonicalObjectPropertyNames(ast) {
	if (ast.propertySignatures.some((ps) => typeof ps.name !== "string")) throw new globalThis.Error("Objects property names must be strings", { cause: ast });
}
function makeReorder(getPriority) {
	return (types) => {
		const indexMap = /* @__PURE__ */ new Map();
		for (let i = 0; i < types.length; i++) indexMap.set(toEncoded(types[i]), i);
		const sortedTypes = [...types].sort((a, b) => {
			a = toEncoded(a);
			b = toEncoded(b);
			const pa = getPriority(a);
			const pb = getPriority(b);
			if (pa !== pb) return pa - pb;
			return indexMap.get(a) - indexMap.get(b);
		});
		if (!sortedTypes.some((ast, index) => ast !== types[index])) return types;
		return sortedTypes;
	};
}
var toCodecJsonReorder = /*#__PURE__*/ makeReorder((ast) => {
	switch (ast._tag) {
		case "BigInt":
		case "Symbol":
		case "UniqueSymbol": return 0;
		default: return 1;
	}
});
function toCodecJsonASTStep(ast, recur) {
	switch (ast._tag) {
		case "Declaration": {
			const getLink = ast.annotations?.toCodecJson ?? ast.annotations?.toCodec;
			if (!isFunction(getLink)) return replaceEncoding(ast, [unknownToJson]);
			const link = getLink(ast.typeParameters.map((tp) => make$2(toEncoded(tp))));
			return link === void 0 ? ast : replaceEncoding(ast, [mapLink(link, recur)]);
		}
		case "Unknown": return replaceEncoding(ast, [unknownToJson]);
		case "ObjectKeyword": return replaceEncoding(ast, [objectKeywordToJson]);
		case "Undefined":
		case "Void":
		case "Literal":
		case "Number": return ast.toCodecJson();
		case "UniqueSymbol":
		case "Symbol":
		case "BigInt": return ast.toCodecStringTree();
		case "Objects":
			validateCanonicalObjectPropertyNames(ast);
			return ast.recur(recur, parameterFromString);
		case "Union": {
			const sortedTypes = toCodecJsonReorder(ast.types);
			if (sortedTypes !== ast.types) return new Union$1(sortedTypes, ast.mode, ast.annotations, ast.checks, ast.encoding, ast.context, ast.encodingChecks).recur(recur);
			return ast.recur(recur);
		}
		case "Arrays":
		case "Suspend": return ast.recur(recur);
	}
	return ast;
}
/**
* Schema that accepts any mutable JSON-compatible value. See {@link Json} for
* the immutable variant.
*
* @category schemas
* @since 4.0.0
*/
var MutableJson = /*#__PURE__*/ make$1(/*#__PURE__*/ annotate(MutableJson$1, { toCode: () => ({
	runtime: "Schema.MutableJson",
	Type: "Schema.MutableJson"
}) }));
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0-rc.112/node_modules/effect/dist/internal/stream.js
var TypeId$1 = "~effect/Stream";
var streamVariance = {
	_R: identity,
	_E: identity,
	_A: identity
};
var StreamProto = {
	[TypeId$1]: streamVariance,
	pipe() {
		return pipeArguments(this, arguments);
	}
};
/** @internal */
var fromChannel$1 = (channel) => {
	const self = Object.create(StreamProto);
	self.channel = channel;
	return self;
};
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0-rc.112/node_modules/effect/dist/Stream.js
/**
* Describes effectful sources that emit values over time.
*
* A `Stream<A, E, R>` can emit many `A` values, fail with `E`, and require
* services `R` while it is being consumed. Streams are useful for data that is
* pulled in steps, such as values from collections, queues, pubsubs, schedules,
* callbacks, async iterables, or platform streams. The APIs here cover the full
* stream lifecycle: create a stream, transform or combine it, control buffering
* and timing, handle failures, and finally consume it.
*
* @since 2.0.0
*/
/**
* Runtime identifier stored on `Stream` values and used by `isStream` to
* recognize them.
*
* **Details**
*
* This marker is part of the runtime representation of `Stream` values. Prefer
* `isStream` when narrowing unknown values.
*
* @see {@link isStream} for the public guard that checks this identifier
*
* @category type IDs
* @since 4.0.0
*/
var TypeId = "~effect/Stream";
/**
* Checks whether a value is a Stream.
*
* **Example** (Checking whether a value is a Stream)
*
* ```ts import.meta.vitest
* import { Stream } from "effect"
*
* Stream.isStream(Stream.make(1, 2, 3)) // => true
* Stream.isStream({ data: [1, 2, 3] }) // => false
* ```
*
* @category guards
* @since 4.0.0
*/
var isStream = (u) => hasProperty(u, TypeId);
/**
* Creates a stream from a array-emitting `Channel`.
*
* **Example** (Creating a stream from an array-emitting channel)
*
* ```ts import.meta.vitest
* import { Channel, Effect, Stream } from "effect"
*
* const channel = Channel.succeed([1, 2, 3] as const)
* const stream = Stream.fromChannel(channel)
* await Effect.runPromise(Stream.runCollect(stream)) // => [1, 2, 3]
* ```
*
* @category constructors
* @since 2.0.0
*/
var fromChannel = fromChannel$1;
/**
* Creates a stream from a callback that can emit values into a queue.
*
* **When to use**
*
* Use when you need callback-based code to emit stream values by offering to a
* `Queue`, or signal stream completion through the `Queue` module APIs.
*
* By default it uses an "unbounded" buffer size.
* You can customize the buffer size and strategy by passing an object as the
* second argument with the `bufferSize` and `strategy` fields.
*
* **Example** (Creating a stream from a callback that can emit values into a queue)
*
* ```ts import.meta.vitest
* import { Effect, Queue, Stream } from "effect"
*
* const stream = Stream.callback<number>((queue) =>
*   Effect.sync(() => {
*     // Emit values to the stream
*     Queue.offerUnsafe(queue, 1)
*     Queue.offerUnsafe(queue, 2)
*     Queue.offerUnsafe(queue, 3)
*     // Signal completion
*     Queue.endUnsafe(queue)
*   })
* )
*
* await Effect.runPromise(Stream.runCollect(stream)) // => [1, 2, 3]
* ```
*
* @category constructors
* @since 4.0.0
*/
var callback = (f, options) => fromChannel(callbackArray(f, options));
/**
* Maps over elements of the stream with the specified effectful function.
*
* **When to use**
*
* Use when each stream element transformation needs an Effect, service
* dependency, failure channel, or configured concurrency.
*
* **Example** (Effectfully mapping stream values)
*
* ```ts import.meta.vitest
* import { Effect, Stream } from "effect"
*
* const events: Array<string> = []
* const stream = Stream.make(1, 2, 3)
*
* const mappedStream = stream.pipe(
*   Stream.mapEffect((n) =>
*     Effect.sync(() => {
*       events.push(`Processing: ${n}`)
*       return n * 2
*     })
*   )
* )
*
* const program = Effect.gen(function*() {
*   const result = yield* Stream.runCollect(mappedStream)
*   result // => [2, 4, 6]
* })
*
* await Effect.runPromise(program)
* events // => ["Processing: 1", "Processing: 2", "Processing: 3"]
* ```
*
* @category mapping
* @since 2.0.0
*/
var mapEffect = /*#__PURE__*/ dual((args) => isStream(args[0]), (self, f, options) => self.channel.pipe(flattenArray, mapEffect$1(f, options), map(of), fromChannel));
/**
* Runs the provided effect for each element while preserving the elements.
*
* **Example** (Tapping stream values)
*
* ```ts import.meta.vitest
* import { Effect, Stream } from "effect"
*
* const events: Array<string> = []
* const program = Effect.gen(function*() {
*   const result = yield* Stream.fromArray([1, 2, 3]).pipe(
*     Stream.tap((n) => Effect.sync(() => events.push(`before mapping: ${n}`))),
*     Stream.map((n) => n * 2),
*     Stream.tap((n) => Effect.sync(() => events.push(`after mapping: ${n}`))),
*     Stream.runCollect
*   )
*
*   result // => [2, 4, 6]
* })
*
* await Effect.runPromise(program)
* events // => ["before mapping: 1", "after mapping: 2", "before mapping: 2", "after mapping: 4", "before mapping: 3", "after mapping: 6"]
* ```
*
* @category sequencing
* @since 2.0.0
*/
var tap = /*#__PURE__*/ dual((args) => isStream(args[0]), (self, f, options) => mapEffect(self, (a) => as(f(a), a), options));
/**
* Runs the stream for its effects, discarding emitted elements.
*
* **Example** (Draining a stream run)
*
* ```ts import.meta.vitest
* import { Effect, Stream } from "effect"
*
* const values: Array<number> = []
* const program = Effect.gen(function*() {
*   const stream = Stream.make(1, 2, 3).pipe(
*     Stream.mapEffect((n) => Effect.sync(() => values.push(n)))
*   )
*
*   yield* Stream.runDrain(stream)
* })
*
* await Effect.runPromise(program)
* values // => [1, 2, 3]
* ```
*
* @category destructors
* @since 2.0.0
*/
var runDrain = (self) => runDrain$1(self.channel);
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0-rc.112/node_modules/effect/dist/Ref.js
/**
* Stores fiber-safe mutable state inside Effect programs.
*
* A `Ref<A>` holds one value and exposes reads, writes, and atomic
* transformations as effects, so state changes compose with Effect's
* concurrency model. This module includes constructors, safe and unsafe reads,
* set and get-and-set helpers, update and modify helpers, and conditional
* update variants that leave the value unchanged when an `Option.none` result
* is returned.
*
* @since 2.0.0
*/
var RefProto = {
	["~effect/Ref"]: { _A: identity },
	...PipeInspectableProto,
	toJSON() {
		return {
			_id: "Ref",
			ref: this.ref
		};
	}
};
/**
* Creates a new Ref with the specified initial value (unsafe version).
*
* **When to use**
*
* Use when you need immediate synchronous construction and can guarantee
* that creating the `Ref` outside of `Effect` is safe.
*
* **Gotchas**
*
* Prefer `Ref.make` for Effect-wrapped creation in Effect programs.
*
* **Example** (Creating a ref unsafely)
*
* ```ts import.meta.vitest
* import { Ref } from "effect"
*
* const counter = Ref.makeUnsafe(0)
* Ref.getUnsafe(counter) // => 0
* ```
*
* @category constructors
* @since 4.0.0
*/
var makeUnsafe = (value) => {
	const self = Object.create(RefProto);
	self.ref = make$6(value);
	return self;
};
/**
* Creates a new Ref with the specified initial value.
*
* **When to use**
*
* Use to create a `Ref` for shared mutable state inside an Effect program.
*
* **Example** (Creating a ref)
*
* ```ts import.meta.vitest
* import { Effect, Ref } from "effect"
*
* const program = Effect.gen(function*() {
*   const ref = yield* Ref.make(42)
*   return yield* Ref.get(ref)
* })
*
* await Effect.runPromise(program) // => 42
* ```
*
* @see {@link makeUnsafe} for synchronous construction outside Effect code
*
* @category constructors
* @since 2.0.0
*/
var make = (value) => sync(() => makeUnsafe(value));
/**
* Gets the current value of the Ref.
*
* **When to use**
*
* Use to read the current `Ref` value without changing it.
*
* **Example** (Getting the current value)
*
* ```ts import.meta.vitest
* import { Effect, Ref } from "effect"
*
* const program = Effect.gen(function*() {
*   const ref = yield* Ref.make(42)
*   return yield* Ref.get(ref)
* })
*
* await Effect.runPromise(program) // => 42
* ```
*
* @see {@link set} for replacing the current value
*
* @category getters
* @since 2.0.0
*/
var get = (self) => sync(() => self.ref.current);
/**
* Updates the value of the Ref atomically using the given function.
*
* **When to use**
*
* Use to apply a `Ref` state transition without returning a value.
*
* **Example** (Updating a value)
*
* ```ts import.meta.vitest
* import { Effect, Ref } from "effect"
*
* const program = Effect.gen(function*() {
*   const counter = yield* Ref.make(5)
*
*   yield* Ref.update(counter, (n) => n * 2)
*   return yield* Ref.get(counter)
* })
*
* const program2 = Effect.gen(function*() {
*   const counter = yield* Ref.make(5)
*   yield* Ref.update(counter, (n: number) => n + 10)
*   return yield* Ref.get(counter)
* })
*
* await Effect.runPromise(program) // => 10
* await Effect.runPromise(program2) // => 15
* ```
*
* @see {@link updateAndGet} for returning the new value
* @see {@link getAndUpdate} for returning the previous value
*
* @category mutations
* @since 2.0.0
*/
var update = /*#__PURE__*/ dual(2, (self, f) => sync(() => {
	self.ref.current = f(self.ref.current);
}));
//#endregion
export { ArraySchema, Boolean, Literal, MutableJson, NullOr, Number$1 as Number, Service, String$1 as String, Struct, Union, addFinalizer, callback, callback$1, catchDefect, catch_, decodeUnknownSync, effect, empty, endUnsafe, fail, fail$1, gen, get, interrupt, is, isBoolean, isEffect, isFunction, isNumber, isObject, isReadonlyObject, isSchema, isString, make, map$1 as map, merge, offerUnsafe, optional, promise, provide, provideService, runDrain, runFork, runPromise, succeed$1 as succeed, succeed$2 as succeed$1, sync, tap, toStandardJSONSchemaV1, toStandardSchemaV1, tryPromise, update, void_ };
