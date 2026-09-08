import { __commonJSMin$1 as __commonJSMin, __toESM$1 as __toESM } from "../_ssr/rolldown-runtime-DaEwE2D6.mjs";
import { ClientDocumentTableDefSymbol, SessionIdSymbol, deepEqual, omitUndefineds, shouldNeverHappen } from "./@livestore/common+[...].mjs";
import { captureStackInfo, computeRcRefKey, createQueryResource, normalizeQueryable, queryDb, removeUndefinedValues, runInitialQuery, validateTableOptions } from "./@livestore/framework-toolkit+[...].mjs";
//#region ../../node_modules/.bun/react@19.2.8/node_modules/react/cjs/react.production.js
/**
* @license React
* react.production.js
*
* Copyright (c) Meta Platforms, Inc. and affiliates.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/
var require_react_production = /* @__PURE__ */ __commonJSMin(((exports) => {
	var REACT_ELEMENT_TYPE = Symbol.for("react.transitional.element");
	var REACT_PORTAL_TYPE = Symbol.for("react.portal");
	var REACT_FRAGMENT_TYPE = Symbol.for("react.fragment");
	var REACT_STRICT_MODE_TYPE = Symbol.for("react.strict_mode");
	var REACT_PROFILER_TYPE = Symbol.for("react.profiler");
	var REACT_CONSUMER_TYPE = Symbol.for("react.consumer");
	var REACT_CONTEXT_TYPE = Symbol.for("react.context");
	var REACT_FORWARD_REF_TYPE = Symbol.for("react.forward_ref");
	var REACT_SUSPENSE_TYPE = Symbol.for("react.suspense");
	var REACT_MEMO_TYPE = Symbol.for("react.memo");
	var REACT_LAZY_TYPE = Symbol.for("react.lazy");
	var REACT_ACTIVITY_TYPE = Symbol.for("react.activity");
	var MAYBE_ITERATOR_SYMBOL = Symbol.iterator;
	function getIteratorFn(maybeIterable) {
		if (null === maybeIterable || "object" !== typeof maybeIterable) return null;
		maybeIterable = MAYBE_ITERATOR_SYMBOL && maybeIterable[MAYBE_ITERATOR_SYMBOL] || maybeIterable["@@iterator"];
		return "function" === typeof maybeIterable ? maybeIterable : null;
	}
	var ReactNoopUpdateQueue = {
		isMounted: function() {
			return !1;
		},
		enqueueForceUpdate: function() {},
		enqueueReplaceState: function() {},
		enqueueSetState: function() {}
	};
	var assign = Object.assign;
	var emptyObject = {};
	function Component(props, context, updater) {
		this.props = props;
		this.context = context;
		this.refs = emptyObject;
		this.updater = updater || ReactNoopUpdateQueue;
	}
	Component.prototype.isReactComponent = {};
	Component.prototype.setState = function(partialState, callback) {
		if ("object" !== typeof partialState && "function" !== typeof partialState && null != partialState) throw Error("takes an object of state variables to update or a function which returns an object of state variables.");
		this.updater.enqueueSetState(this, partialState, callback, "setState");
	};
	Component.prototype.forceUpdate = function(callback) {
		this.updater.enqueueForceUpdate(this, callback, "forceUpdate");
	};
	function ComponentDummy() {}
	ComponentDummy.prototype = Component.prototype;
	function PureComponent(props, context, updater) {
		this.props = props;
		this.context = context;
		this.refs = emptyObject;
		this.updater = updater || ReactNoopUpdateQueue;
	}
	var pureComponentPrototype = PureComponent.prototype = new ComponentDummy();
	pureComponentPrototype.constructor = PureComponent;
	assign(pureComponentPrototype, Component.prototype);
	pureComponentPrototype.isPureReactComponent = !0;
	var isArrayImpl = Array.isArray;
	function noop() {}
	var ReactSharedInternals = {
		H: null,
		A: null,
		T: null,
		S: null
	};
	var hasOwnProperty = Object.prototype.hasOwnProperty;
	function ReactElement(type, key, props) {
		var refProp = props.ref;
		return {
			$$typeof: REACT_ELEMENT_TYPE,
			type,
			key,
			ref: void 0 !== refProp ? refProp : null,
			props
		};
	}
	function cloneAndReplaceKey(oldElement, newKey) {
		return ReactElement(oldElement.type, newKey, oldElement.props);
	}
	function isValidElement(object) {
		return "object" === typeof object && null !== object && object.$$typeof === REACT_ELEMENT_TYPE;
	}
	function escape(key) {
		var escaperLookup = {
			"=": "=0",
			":": "=2"
		};
		return "$" + key.replace(/[=:]/g, function(match) {
			return escaperLookup[match];
		});
	}
	var userProvidedKeyEscapeRegex = /\/+/g;
	function getElementKey(element, index) {
		return "object" === typeof element && null !== element && null != element.key ? escape("" + element.key) : index.toString(36);
	}
	function resolveThenable(thenable) {
		switch (thenable.status) {
			case "fulfilled": return thenable.value;
			case "rejected": throw thenable.reason;
			default: switch ("string" === typeof thenable.status ? thenable.then(noop, noop) : (thenable.status = "pending", thenable.then(function(fulfilledValue) {
				"pending" === thenable.status && (thenable.status = "fulfilled", thenable.value = fulfilledValue);
			}, function(error) {
				"pending" === thenable.status && (thenable.status = "rejected", thenable.reason = error);
			})), thenable.status) {
				case "fulfilled": return thenable.value;
				case "rejected": throw thenable.reason;
			}
		}
		throw thenable;
	}
	function mapIntoArray(children, array, escapedPrefix, nameSoFar, callback) {
		var type = typeof children;
		if ("undefined" === type || "boolean" === type) children = null;
		var invokeCallback = !1;
		if (null === children) invokeCallback = !0;
		else switch (type) {
			case "bigint":
			case "string":
			case "number":
				invokeCallback = !0;
				break;
			case "object": switch (children.$$typeof) {
				case REACT_ELEMENT_TYPE:
				case REACT_PORTAL_TYPE:
					invokeCallback = !0;
					break;
				case REACT_LAZY_TYPE: return invokeCallback = children._init, mapIntoArray(invokeCallback(children._payload), array, escapedPrefix, nameSoFar, callback);
			}
		}
		if (invokeCallback) return callback = callback(children), invokeCallback = "" === nameSoFar ? "." + getElementKey(children, 0) : nameSoFar, isArrayImpl(callback) ? (escapedPrefix = "", null != invokeCallback && (escapedPrefix = invokeCallback.replace(userProvidedKeyEscapeRegex, "$&/") + "/"), mapIntoArray(callback, array, escapedPrefix, "", function(c) {
			return c;
		})) : null != callback && (isValidElement(callback) && (callback = cloneAndReplaceKey(callback, escapedPrefix + (null == callback.key || children && children.key === callback.key ? "" : ("" + callback.key).replace(userProvidedKeyEscapeRegex, "$&/") + "/") + invokeCallback)), array.push(callback)), 1;
		invokeCallback = 0;
		var nextNamePrefix = "" === nameSoFar ? "." : nameSoFar + ":";
		if (isArrayImpl(children)) for (var i = 0; i < children.length; i++) nameSoFar = children[i], type = nextNamePrefix + getElementKey(nameSoFar, i), invokeCallback += mapIntoArray(nameSoFar, array, escapedPrefix, type, callback);
		else if (i = getIteratorFn(children), "function" === typeof i) for (children = i.call(children), i = 0; !(nameSoFar = children.next()).done;) nameSoFar = nameSoFar.value, type = nextNamePrefix + getElementKey(nameSoFar, i++), invokeCallback += mapIntoArray(nameSoFar, array, escapedPrefix, type, callback);
		else if ("object" === type) {
			if ("function" === typeof children.then) return mapIntoArray(resolveThenable(children), array, escapedPrefix, nameSoFar, callback);
			array = String(children);
			throw Error("Objects are not valid as a React child (found: " + ("[object Object]" === array ? "object with keys {" + Object.keys(children).join(", ") + "}" : array) + "). If you meant to render a collection of children, use an array instead.");
		}
		return invokeCallback;
	}
	function mapChildren(children, func, context) {
		if (null == children) return children;
		var result = [], count = 0;
		mapIntoArray(children, result, "", "", function(child) {
			return func.call(context, child, count++);
		});
		return result;
	}
	function lazyInitializer(payload) {
		if (-1 === payload._status) {
			var ctor = payload._result;
			ctor = ctor();
			ctor.then(function(moduleObject) {
				if (0 === payload._status || -1 === payload._status) payload._status = 1, payload._result = moduleObject;
			}, function(error) {
				if (0 === payload._status || -1 === payload._status) payload._status = 2, payload._result = error;
			});
			-1 === payload._status && (payload._status = 0, payload._result = ctor);
		}
		if (1 === payload._status) return payload._result.default;
		throw payload._result;
	}
	var reportGlobalError = "function" === typeof reportError ? reportError : function(error) {
		if ("object" === typeof window && "function" === typeof window.ErrorEvent) {
			var event = new window.ErrorEvent("error", {
				bubbles: !0,
				cancelable: !0,
				message: "object" === typeof error && null !== error && "string" === typeof error.message ? String(error.message) : String(error),
				error
			});
			if (!window.dispatchEvent(event)) return;
		} else if ("object" === typeof process && "function" === typeof process.emit) {
			process.emit("uncaughtException", error);
			return;
		}
		console.error(error);
	};
	var Children = {
		map: mapChildren,
		forEach: function(children, forEachFunc, forEachContext) {
			mapChildren(children, function() {
				forEachFunc.apply(this, arguments);
			}, forEachContext);
		},
		count: function(children) {
			var n = 0;
			mapChildren(children, function() {
				n++;
			});
			return n;
		},
		toArray: function(children) {
			return mapChildren(children, function(child) {
				return child;
			}) || [];
		},
		only: function(children) {
			if (!isValidElement(children)) throw Error("React.Children.only expected to receive a single React element child.");
			return children;
		}
	};
	exports.Activity = REACT_ACTIVITY_TYPE;
	exports.Children = Children;
	exports.Component = Component;
	exports.Fragment = REACT_FRAGMENT_TYPE;
	exports.Profiler = REACT_PROFILER_TYPE;
	exports.PureComponent = PureComponent;
	exports.StrictMode = REACT_STRICT_MODE_TYPE;
	exports.Suspense = REACT_SUSPENSE_TYPE;
	exports.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = ReactSharedInternals;
	exports.__COMPILER_RUNTIME = {
		__proto__: null,
		c: function(size) {
			return ReactSharedInternals.H.useMemoCache(size);
		}
	};
	exports.cache = function(fn) {
		return function() {
			return fn.apply(null, arguments);
		};
	};
	exports.cacheSignal = function() {
		return null;
	};
	exports.cloneElement = function(element, config, children) {
		if (null === element || void 0 === element) throw Error("The argument must be a React element, but you passed " + element + ".");
		var props = assign({}, element.props), key = element.key;
		if (null != config) for (propName in void 0 !== config.key && (key = "" + config.key), config) !hasOwnProperty.call(config, propName) || "key" === propName || "__self" === propName || "__source" === propName || "ref" === propName && void 0 === config.ref || (props[propName] = config[propName]);
		var propName = arguments.length - 2;
		if (1 === propName) props.children = children;
		else if (1 < propName) {
			for (var childArray = Array(propName), i = 0; i < propName; i++) childArray[i] = arguments[i + 2];
			props.children = childArray;
		}
		return ReactElement(element.type, key, props);
	};
	exports.createContext = function(defaultValue) {
		defaultValue = {
			$$typeof: REACT_CONTEXT_TYPE,
			_currentValue: defaultValue,
			_currentValue2: defaultValue,
			_threadCount: 0,
			Provider: null,
			Consumer: null
		};
		defaultValue.Provider = defaultValue;
		defaultValue.Consumer = {
			$$typeof: REACT_CONSUMER_TYPE,
			_context: defaultValue
		};
		return defaultValue;
	};
	exports.createElement = function(type, config, children) {
		var propName, props = {}, key = null;
		if (null != config) for (propName in void 0 !== config.key && (key = "" + config.key), config) hasOwnProperty.call(config, propName) && "key" !== propName && "__self" !== propName && "__source" !== propName && (props[propName] = config[propName]);
		var childrenLength = arguments.length - 2;
		if (1 === childrenLength) props.children = children;
		else if (1 < childrenLength) {
			for (var childArray = Array(childrenLength), i = 0; i < childrenLength; i++) childArray[i] = arguments[i + 2];
			props.children = childArray;
		}
		if (type && type.defaultProps) for (propName in childrenLength = type.defaultProps, childrenLength) void 0 === props[propName] && (props[propName] = childrenLength[propName]);
		return ReactElement(type, key, props);
	};
	exports.createRef = function() {
		return { current: null };
	};
	exports.forwardRef = function(render) {
		return {
			$$typeof: REACT_FORWARD_REF_TYPE,
			render
		};
	};
	exports.isValidElement = isValidElement;
	exports.lazy = function(ctor) {
		return {
			$$typeof: REACT_LAZY_TYPE,
			_payload: {
				_status: -1,
				_result: ctor
			},
			_init: lazyInitializer
		};
	};
	exports.memo = function(type, compare) {
		return {
			$$typeof: REACT_MEMO_TYPE,
			type,
			compare: void 0 === compare ? null : compare
		};
	};
	exports.startTransition = function(scope) {
		var prevTransition = ReactSharedInternals.T, currentTransition = {};
		ReactSharedInternals.T = currentTransition;
		try {
			var returnValue = scope(), onStartTransitionFinish = ReactSharedInternals.S;
			null !== onStartTransitionFinish && onStartTransitionFinish(currentTransition, returnValue);
			"object" === typeof returnValue && null !== returnValue && "function" === typeof returnValue.then && returnValue.then(noop, reportGlobalError);
		} catch (error) {
			reportGlobalError(error);
		} finally {
			null !== prevTransition && null !== currentTransition.types && (prevTransition.types = currentTransition.types), ReactSharedInternals.T = prevTransition;
		}
	};
	exports.unstable_useCacheRefresh = function() {
		return ReactSharedInternals.H.useCacheRefresh();
	};
	exports.use = function(usable) {
		return ReactSharedInternals.H.use(usable);
	};
	exports.useActionState = function(action, initialState, permalink) {
		return ReactSharedInternals.H.useActionState(action, initialState, permalink);
	};
	exports.useCallback = function(callback, deps) {
		return ReactSharedInternals.H.useCallback(callback, deps);
	};
	exports.useContext = function(Context) {
		return ReactSharedInternals.H.useContext(Context);
	};
	exports.useDebugValue = function() {};
	exports.useDeferredValue = function(value, initialValue) {
		return ReactSharedInternals.H.useDeferredValue(value, initialValue);
	};
	exports.useEffect = function(create, deps) {
		return ReactSharedInternals.H.useEffect(create, deps);
	};
	exports.useEffectEvent = function(callback) {
		return ReactSharedInternals.H.useEffectEvent(callback);
	};
	exports.useId = function() {
		return ReactSharedInternals.H.useId();
	};
	exports.useImperativeHandle = function(ref, create, deps) {
		return ReactSharedInternals.H.useImperativeHandle(ref, create, deps);
	};
	exports.useInsertionEffect = function(create, deps) {
		return ReactSharedInternals.H.useInsertionEffect(create, deps);
	};
	exports.useLayoutEffect = function(create, deps) {
		return ReactSharedInternals.H.useLayoutEffect(create, deps);
	};
	exports.useMemo = function(create, deps) {
		return ReactSharedInternals.H.useMemo(create, deps);
	};
	exports.useOptimistic = function(passthrough, reducer) {
		return ReactSharedInternals.H.useOptimistic(passthrough, reducer);
	};
	exports.useReducer = function(reducer, initialArg, init) {
		return ReactSharedInternals.H.useReducer(reducer, initialArg, init);
	};
	exports.useRef = function(initialValue) {
		return ReactSharedInternals.H.useRef(initialValue);
	};
	exports.useState = function(initialState) {
		return ReactSharedInternals.H.useState(initialState);
	};
	exports.useSyncExternalStore = function(subscribe, getSnapshot, getServerSnapshot) {
		return ReactSharedInternals.H.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
	};
	exports.useTransition = function() {
		return ReactSharedInternals.H.useTransition();
	};
	exports.version = "19.2.8";
}));
//#endregion
//#region ../../node_modules/.bun/react@19.2.8/node_modules/react/index.js
var require_react = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = require_react_production();
}));
//#endregion
//#region ../../node_modules/.bun/react@19.2.8/node_modules/react/cjs/react-jsx-runtime.production.js
/**
* @license React
* react-jsx-runtime.production.js
*
* Copyright (c) Meta Platforms, Inc. and affiliates.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/
var require_react_jsx_runtime_production = /* @__PURE__ */ __commonJSMin(((exports) => {
	var REACT_ELEMENT_TYPE = Symbol.for("react.transitional.element");
	var REACT_FRAGMENT_TYPE = Symbol.for("react.fragment");
	function jsxProd(type, config, maybeKey) {
		var key = null;
		void 0 !== maybeKey && (key = "" + maybeKey);
		void 0 !== config.key && (key = "" + config.key);
		if ("key" in config) {
			maybeKey = {};
			for (var propName in config) "key" !== propName && (maybeKey[propName] = config[propName]);
		} else maybeKey = config;
		config = maybeKey.ref;
		return {
			$$typeof: REACT_ELEMENT_TYPE,
			type,
			key,
			ref: void 0 !== config ? config : null,
			props: maybeKey
		};
	}
	exports.Fragment = REACT_FRAGMENT_TYPE;
	exports.jsx = jsxProd;
	exports.jsxs = jsxProd;
}));
//#endregion
//#region ../../node_modules/.bun/react@19.2.8/node_modules/react/jsx-runtime.js
var require_jsx_runtime = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = require_react_jsx_runtime_production();
}));
//#endregion
//#region ../../node_modules/.bun/@livestore+react@0.5.0-dev.0+f0ff817a39ee5ceb/node_modules/@livestore/react/dist/useRcResource.js
var import_jsx_runtime = require_jsx_runtime();
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
/**
* Creates a reference-counted resource object that is "stable" across React lifecycles.
*
* The hook is primarily intended for creating stateful objects or entities where:
* 1) reference identity is crucial (e.g. stateful objects, references, ...)
*    and needed to persist across multiple component instances
* 2) the `create`/`dispose` functions might be effectful and can be called exactly once per key
*
* **Goals:**
* - Guarantee stable reference identity for stateful entities that are created via the `create` function.
* - Strong guarantees about the `create`/`dispose` calls (i.e. exactly one `create`/`dispose` call per key)
* - Ensure that such state is retained across component re-mounts, even in development environments like
*   React Strict Mode or during Fast Refresh.
* - Automatically handle resource disposal by decrementing a reference count and disposing of the resource
*   when no components are using it.
*
* **Behavior:**
* - On the first render with a specific key, the `create` function is invoked to create the stateful entity,
*   and the resource is stored in a cache with a reference count set to 1.
* - If another component renders with the same key, the cached entity is reused and its reference count is incremented.
* - When a component renders with a new key, the previous key's reference count is decremented and, if it reaches zero,
*   the `dispose` function is called for that resource.
* - Upon component unmount, the reference count is decremented, leading to disposal (via the `dispose` function)
*   if the reference count drops to zero. An unmount is either detected via React's `useEffect` callback or
*   in the useMemo hook when the key changes.
*
* Why this is needed in LiveStore:
* Let's first take a look at the "trivial implementation":
*
* ```ts
* const useSimpleResource = <T>(create: () => T, dispose: (resource: T) => void) => {
*     const val = React.useMemo(() => create(), [create])
*
*     React.useEffect(() => {
*       return () => {
*         dispose(val)
*       }
*     }, [dispose, val])

*     return val
* }
* ```
*
* LiveStore uses this hook to create LiveQuery instances which are stateful and must not be leaked.
* The simple implementation above would leak the LiveQuery instance if the component is unmounted or props change.
*
* **Usage:**
* ```tsx
* // Create a stateful object instance for a unique key and share it between components.
* const statefulObject = useRcResource(
*   'stable-object-key',
*   () => createObjectInstance(),
*   (object) => object.dispose()
* );
* ```
*
* **Caveats:**
* - The `create` function is intentionally omitted from the dependency array in `useMemo` to prevent
*   unintended re-creations of the stateful entity. Avoid closing over changing values within `create`
*   or include them in the `key`.
* - Ensure that the `dispose` function is stable or properly memoized as its reference is used in a `useEffect`.
* - Although the caching mechanism prevents duplicate instance creation for the same key, the strategy
*   can interact in unexpected ways with React’s development patterns. Please report any issues if encountered.
*
* @template T The type of the stateful entity managed by the hook.
* @param key A unique identifier for the stateful entity. A change in this key triggers a disposal of the previous resource.
* @param create Function to create the stateful entity when it does not exist in the cache.
* @param dispose Function to dispose of the stateful entity when it’s no longer needed. Needs to be stable.
* @param _options Optional. Additional options such as a debug print callback for logging purposes.
* @returns The stateful entity corresponding to the provided key.
*/
var useRcResource = (scope, key, create, dispose, _options) => {
	const keyRef = import_react.useRef(void 0);
	const scopeRef = import_react.useRef(void 0);
	const didDisposeInMemo = import_react.useRef(false);
	const createRef = import_react.useRef(create);
	const disposeRef = import_react.useRef(dispose);
	createRef.current = create;
	disposeRef.current = dispose;
	const resource = import_react.useMemo(() => {
		const bucket = getBucket(scope);
		if (didDisposeInMemo.current === true) {
			const cachedItem = bucket.get(key);
			if (cachedItem !== void 0 && cachedItem._tag === "active") return cachedItem.resource;
		}
		if (keyRef.current !== void 0 && (keyRef.current !== key || scopeRef.current !== scope)) {
			const previousKey = keyRef.current;
			const previousBucket = getBucket(scopeRef.current);
			const cachedItemForPreviousKey = previousBucket.get(previousKey);
			if (cachedItemForPreviousKey !== void 0 && cachedItemForPreviousKey._tag === "active") {
				cachedItemForPreviousKey.rc--;
				if (cachedItemForPreviousKey.rc === 0) {
					disposeRef.current(cachedItemForPreviousKey.resource);
					previousBucket.set(previousKey, { _tag: "destroyed" });
					didDisposeInMemo.current = true;
				}
			}
		}
		const cachedItem = bucket.get(key);
		if (cachedItem !== void 0 && cachedItem._tag === "active") {
			cachedItem.rc++;
			return cachedItem.resource;
		}
		const resource = createRef.current();
		bucket.set(key, {
			_tag: "active",
			rc: 1,
			resource
		});
		return resource;
	}, [scope, key]);
	import_react.useEffect(() => {
		return () => {
			if (didDisposeInMemo.current === true) {
				didDisposeInMemo.current = false;
				return;
			}
			const bucket = getBucket(scope);
			const cachedItem = bucket.get(key);
			if (cachedItem === void 0 || cachedItem._tag === "destroyed") return;
			cachedItem.rc--;
			if (cachedItem.rc === 0) {
				disposeRef.current(cachedItem.resource);
				bucket.delete(key);
			}
		};
	}, [scope, key]);
	keyRef.current = key;
	scopeRef.current = scope;
	return resource;
};
var scopedBuckets = /* @__PURE__ */ new WeakMap();
var getBucket = (scope) => {
	let bucket = scopedBuckets.get(scope);
	if (bucket === void 0) {
		bucket = /* @__PURE__ */ new Map();
		scopedBuckets.set(scope, bucket);
	}
	return bucket;
};
//#endregion
//#region ../../node_modules/.bun/@livestore+react@0.5.0-dev.0+f0ff817a39ee5ceb/node_modules/@livestore/react/dist/utils/useStateRefWithReactiveInput.js
/**
* A variant of `React.useState` which allows the `inputState` to change over time as well.
* Important: This hook is synchronous / single-render-pass (i.e. doesn't use `useEffect` or `setState` directly).
*
* Notes:
* - The output state is always reset to the input state in case the input state changes (i.e. the previous "external" `setStateAndRerender` call is forgotten)
* - This hook might not work properly with React Suspense
* - Also see this Tweet for more potential problems: https://twitter.com/schickling/status/1677317711104278528
*
*/
var useStateRefWithReactiveInput = (inputState) => {
	const [_, rerender] = import_react.useState(0);
	const lastKnownInputStateRef = import_react.useRef(inputState);
	const stateRef = import_react.useRef(inputState);
	if (lastKnownInputStateRef.current !== inputState) {
		lastKnownInputStateRef.current = inputState;
		stateRef.current = inputState;
	}
	return [stateRef, import_react.useCallback((newState) => {
		const val = typeof newState === "function" ? newState(stateRef.current) : newState;
		stateRef.current = val;
		rerender((c) => c + 1);
	}, [])];
};
//#endregion
//#region ../../node_modules/.bun/@livestore+react@0.5.0-dev.0+f0ff817a39ee5ceb/node_modules/@livestore/react/dist/useQuery.js
/**
* Returns the result of a query and subscribes to future updates.
*
* Example:
* ```tsx
* const App = () => {
*   const todos = useQuery(queryDb(tables.todos.query.where({ complete: true })))
*   return <div>{todos.map((todo) => <div key={todo.id}>{todo.title}</div>)}</div>
* }
* ```
*/
var useQuery = (queryable, options) => useQueryRef(queryable, options).valueRef.current;
/**
* Like `useQuery`, but also returns a reference to the underlying LiveQuery instance.
*
* Usage
* - Accepts any `Queryable<TResult>`: a `LiveQueryDef`, `SignalDef`, a `LiveQuery` instance
*   or a SQL `QueryBuilder`. Unions of queryables are supported and the result type is
*   inferred via `Queryable.Result<TQueryable>`.
* - Creates an OpenTelemetry span per unique query, reusing it while the ref-counted
*   resource is alive. The span name is updated once the dynamic label is known.
* - Manages a reference-counted resource under-the-hood so query instances are shared
*   across re-renders and properly disposed once no longer referenced.
*
* Parameters
* - `queryable`: The query definition/instance/builder to run and subscribe to.
* - `options.store`: The store to use. Required when calling `useQueryRef` directly; automatically provided when using `store.useQuery()`.
* - `options.otelContext`: Optional parent otel context for the query span.
* - `options.otelSpanName`: Optional explicit span name; otherwise derived from the query label.
*
* Returns
* - `valueRef`: A React ref whose `current` holds the latest query result. The type is
*   `Queryable.Result<TQueryable>` with full inference for unions.
* - `queryRcRef`: The underlying reference-counted `LiveQuery` instance used by the store.
*/
var useQueryRef = (queryable, options) => {
	const store = options?.store ?? shouldNeverHappen(`No store provided to useQuery`);
	const normalized = import_react.useMemo(() => normalizeQueryable(queryable), [queryable]);
	const rcRefKey = import_react.useMemo(() => computeRcRefKey(store, normalized), [normalized, store]);
	const stackInfo = import_react.useMemo(() => captureStackInfo(), []);
	const { queryRcRef, span, otelContext } = useRcResource(store, rcRefKey, () => createQueryResource(store, normalized, stackInfo, {
		otelSpanName: options?.otelSpanName,
		otelContext: options?.otelContext
	}), () => {});
	const query$ = queryRcRef.value;
	import_react.useDebugValue(`LiveStore:useQuery:${query$.id}:${query$.label}`);
	const [valueRef, setValue] = useStateRefWithReactiveInput(import_react.useMemo(() => runInitialQuery(query$, otelContext, stackInfo, "react"), [
		otelContext,
		query$,
		stackInfo
	]));
	import_react.useEffect(() => {
		query$.activeSubscriptions.add(stackInfo);
		span.updateName(options?.otelSpanName ?? `LiveStore:useQuery:${query$.label}`);
		return store.subscribe(query$, (newValue) => {
			if (deepEqual(newValue, valueRef.current) === false) setValue(newValue);
		}, {
			onUnsubsubscribe: () => {
				query$.activeSubscriptions.delete(stackInfo);
			},
			label: query$.label,
			otelContext
		});
	}, [
		stackInfo,
		query$,
		setValue,
		store,
		valueRef,
		otelContext,
		span,
		options?.otelSpanName
	]);
	useRcResource(store, rcRefKey, () => ({
		queryRcRef,
		span
	}), ({ queryRcRef, span }) => {
		queryRcRef.deref();
		span.end();
	});
	return {
		valueRef,
		queryRcRef
	};
};
//#endregion
//#region ../../node_modules/.bun/@livestore+react@0.5.0-dev.0+f0ff817a39ee5ceb/node_modules/@livestore/react/dist/StoreRegistryContext.js
var StoreRegistryContext = import_react.createContext(void 0);
/**
* React context provider that makes a {@link StoreRegistry} available to descendant components.
*
* Wrap your application (or a subtree) with this provider to enable {@link useStore} and
* {@link useStoreRegistry} hooks within that tree.
*
* @example
* ```tsx
* import { StoreRegistry } from '@livestore/livestore'
* import { StoreRegistryProvider } from '@livestore/react'
* import { unstable_batchedUpdates as batchUpdates } from 'react-dom'
*
* const storeRegistry = new StoreRegistry({
*   defaultOptions: { batchUpdates }
* })
*
* function App() {
*   return (
*     <StoreRegistryProvider storeRegistry={storeRegistry}>
*       <MyComponent />
*     </StoreRegistryProvider>
*   )
* }
* ```
*/
var StoreRegistryProvider = ({ storeRegistry, children }) => {
	return (0, import_jsx_runtime.jsx)(StoreRegistryContext, {
		value: storeRegistry,
		children
	});
};
/**
* Hook to access the {@link StoreRegistry} from context. Useful for advanced operations like preloading.
*
* @param override - Optional registry to use instead of the context value.
*   When provided, skips context lookup entirely.
* @returns The registry provided by the nearest {@link StoreRegistryProvider} ancestor, or the `override` if provided.
* @throws Error if called outside a {@link StoreRegistryProvider} and no override is provided
*
* @example
* ```tsx
* function PreloadButton({ issueId }: { issueId: string }) {
*   const storeRegistry = useStoreRegistry()
*
*   const handleMouseEnter = () => {
*     storeRegistry.preload(issueStoreOptions(issueId))
*   }
*
*   return <button onMouseEnter={handleMouseEnter}>View Issue</button>
* }
* ```
*/
var useStoreRegistry = (override) => {
	if (override !== void 0) return override;
	const storeRegistry = import_react.use(StoreRegistryContext);
	if (storeRegistry == null) throw new Error("useStoreRegistry() must be used within <StoreRegistryProvider>");
	return storeRegistry;
};
//#endregion
//#region ../../node_modules/.bun/@livestore+react@0.5.0-dev.0+f0ff817a39ee5ceb/node_modules/@livestore/react/dist/useClientDocument.js
/**
* Similar to `React.useState` but returns a tuple of `[state, setState, id, query$]` for a given table where ...
*
*   - `state` is the current value of the row (fully decoded according to the table schema)
*   - `setState` is a function that can be used to update the document
*   - `id` is the id of the document
*   - `query$` is a `LiveQuery` that e.g. can be used to subscribe to changes to the document
*
* `useClientDocument` only works for client-document tables:
*
* ```tsx
* const MyState = State.SQLite.clientDocument({
*   name: 'MyState',
*   schema: Schema.Struct({
*     showSidebar: Schema.Boolean,
*   }),
*   default: { id: SessionIdSymbol, value: { showSidebar: true } },
* })
*
* const MyComponent = () => {
*   const [{ showSidebar }, setState] = useClientDocument(MyState)
*   return (
*     <div onClick={() => setState({ showSidebar: !showSidebar })}>
*       {showSidebar ? 'Sidebar is open' : 'Sidebar is closed'}
*     </div>
*   )
* }
* ```
*
* If the table has a default id, `useClientDocument` can be called without an `id` argument. Otherwise, the `id` argument is required.
*/
var useClientDocument = (table, idOrOptions, options_, storeArg) => {
	const id = typeof idOrOptions === "string" || idOrOptions === SessionIdSymbol ? idOrOptions : table[ClientDocumentTableDefSymbol].options.default.id;
	const { default: defaultValues } = (typeof idOrOptions === "string" || idOrOptions === SessionIdSymbol ? options_ : idOrOptions) ?? {};
	import_react.useMemo(() => validateTableOptions(table), [table]);
	const tableName = table.sqliteDef.name;
	const store = storeArg?.store ?? shouldNeverHappen(`No store provided to useClientDocument`);
	const idStr = id === SessionIdSymbol ? store.sessionId : id;
	const queryRef = useQueryRef(import_react.useMemo(() => queryDb(table.get(id, { default: defaultValues }), { deps: [
		idStr,
		table.sqliteDef.name,
		JSON.stringify(defaultValues)
	] }), [
		table,
		id,
		defaultValues,
		idStr
	]), {
		otelSpanName: `LiveStore:useClientDocument:${tableName}:${idStr}`,
		...omitUndefineds({ store: storeArg?.store })
	});
	const setState = import_react.useMemo(() => (newValueOrFn) => {
		const newValue = typeof newValueOrFn === "function" ? newValueOrFn(queryRef.valueRef.current) : newValueOrFn;
		if (queryRef.valueRef.current === newValue) return;
		store.commit(table.set(removeUndefinedValues(newValue), id));
	}, [
		id,
		queryRef.valueRef,
		store,
		table
	]);
	return [
		queryRef.valueRef.current,
		setState,
		idStr,
		queryRef.queryRcRef.value
	];
};
//#endregion
//#region ../../node_modules/.bun/@livestore+react@0.5.0-dev.0+f0ff817a39ee5ceb/node_modules/@livestore/react/dist/useSyncStatus.js
/**
* React hook that subscribes to sync status changes.
*
* Returns the current synchronization status between the client session and
* the leader thread. The component re-renders whenever the sync status changes.
*
* @example
* ```tsx
* function SyncIndicator() {
*   const status = store.useSyncStatus()
*   return <span>{status.isSynced ? '✓ Synced' : `Syncing (${status.pendingCount} pending)...`}</span>
* }
* ```
*
* @param options - Options containing the store instance
* @returns The current sync status
*/
var useSyncStatus = (options) => {
	const { store } = options;
	const [status, setStatus] = import_react.useState(() => store.syncStatus());
	import_react.useEffect(() => {
		return store.subscribeSyncStatus(setStatus);
	}, [store]);
	import_react.useDebugValue(`LiveStore:useSyncStatus:${status.isSynced === true ? "synced" : "pending"}`);
	return status;
};
//#endregion
//#region ../../node_modules/.bun/@livestore+react@0.5.0-dev.0+f0ff817a39ee5ceb/node_modules/@livestore/react/dist/useStore.js
/**
* Returns a store instance augmented with hooks (`store.useQuery()` and `store.useClientDocument()`) for reactive queries.
*
* @example
* ```tsx
* function Issue() {
*   // Suspends until loaded or returns immediately if already loaded
*   const issueStore = useStore(issueStoreOptions('abc123'))
*   const [issue] = issueStore.useQuery(queryDb(tables.issue.select()))
*
*   const toggleStatus = () =>
*     issueStore.commit(
*       issueEvents.issueStatusChanged({
*         id: issue.id,
*         status: issue.status === 'done' ? 'todo' : 'done',
*       }),
*     )
*
*   const preloadParentIssue = (issueId: string) =>
*     storeRegistry.preload({
*       ...issueStoreOptions(issueId),
*       unusedCacheTime: 10_000,
*     })
*
*   return (
*     <>
*       <h2>{issue.title}</h2>
*       <button onClick={() => toggleStatus()}>Toggle Status</button>
*       <button onMouseEnter={() => preloadParentIssue(issue.parentIssueId)}>Open Parent Issue</button>
*     </>
*   )
* }
* ```
*
* @remarks
* - Suspends until the store is loaded.
* - Store is cached by its `storeId` in the `StoreRegistry`. Multiple calls with the same `storeId` return the same store instance.
* - Store is cached as long as it's being used, and after `unusedCacheTime` expires (default `60_000` ms in browser, `Infinity` in non-browser)
* - Default store options can be configured in `StoreRegistry` constructor.
* - Store options are only applied when the store is loaded. Subsequent calls with different options will not affect the store if it's already loaded and cached in the registry.
*
* @typeParam TSchema - The schema type for the store
* @returns The loaded store instance augmented with React hooks
* @throws unknown - store loading error or if called outside `<StoreRegistryProvider>`
*/
var useStore = (options) => {
	const storeRegistry = useStoreRegistry();
	const storeOrPromise = storeRegistry.getOrLoadPromise(options);
	const store = storeOrPromise instanceof Promise ? import_react.use(storeOrPromise) : storeOrPromise;
	import_react.useEffect(() => storeRegistry.retain(options), [storeRegistry, options]);
	return withReactApi(store);
};
/**
* Augments a Store instance with React-specific methods (`useQuery`, `useClientDocument`).
*
* This is called automatically by `useStore()`. You typically don't need to call it
* directly unless you're building custom integrations.
*
* @internal
*/
var withReactApi = (store) => {
	store.useQuery = (queryable) => useQuery(queryable, { store });
	store.useClientDocument = (table, idOrOptions, options) => useClientDocument(table, idOrOptions, options, { store });
	store.useSyncStatus = () => useSyncStatus({ store });
	return store;
};
//#endregion
export { StoreRegistryProvider, require_jsx_runtime, require_react, useStore, useSyncStatus };
