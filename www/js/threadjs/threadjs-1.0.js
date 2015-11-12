/** @preserve thread.js | (c) 2015 Spencer Evans | MIT License (MIT) https://github.com/swevans/thread.js/blob/master/LICENSE */
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Spencer Evans
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 * version     1.0
 * copyright   Copyright © 2015 Spencer Evans
 * author		Spencer Evans	evans.spencer@gmail.com
 * license     http://opensource.org/licenses/MIT
 * website     http://spencer-evans.com/
 */
/*
FUTURE IDEAS:
- Wrapper for objects constructed on the thread, so you can call functions directly on them
- Wrapper for function calls on the thread so you can tell when they're complete and get the return result
- Change import scripts to use XHR so CORS (and thus IE10 everywhere) is supported
*/
/**
 * @private Assert that the threadjs library is not already defined by checking for the namespace existance
 */
(function () {
    if (typeof (threadjs) !== "undefined") {
        if (typeof (Window) === "undefined") {
            throw new Error("threadjs is already defined, you don't need to import the script on child threads created using threadjs! Did you attempt to load the script twice? Do you possibly have a conflicting reference?");
        }
        else {
            throw new Error("threadjs is already defined, did you attempt to load the script twice? Do you possibly have a conflicting reference?");
        }
    }
}());
/**
 * Declare namespace utils and vars
 */
var threadjs;
(function (threadjs) {
    /** The URL of the threadjs library script file. This member is automatically set if you use synchronous tag loading of the library (recommended). */
    threadjs.url = null;
    /** Gets or the maximum number of alive threads. If there are more threads than the new cap, they will remain alive.
    Only valid on the main thread! Be ware of setting this value too high.*/
    Object.defineProperty(threadjs, "maxThreads", {
        get: function () {
            if (!threadjs.Thread.isMainThread)
                throw new Error("maxThreads is only valid on the main thread!");
            return threadjs.Thread._maxThreads;
        },
        set: function (value) {
            if (!threadjs.Thread.isMainThread)
                throw new Error("maxThreads is only valid on the main thread!");
            if (value < 1) {
                try {
                    console.warn("Setting maxThreads below 1 will result in no threads starting!");
                }
                catch (err) { }
            }
            if (value > 999) {
                throw new Error("ThreadJS does not support over 999 threads!");
            }
            if (value > 16) {
                try {
                    console.warn("Setting maxThreads above 16 may result in a browser crash!");
                }
                catch (err) { }
            }
            threadjs.Thread._maxThreads = value;
            threadjs.Thread.permitCheck();
        }
    });
    /** Indicates if threadjs (and WebWorkers) are supported in the current runtime */
    Object.defineProperty(threadjs, "isSupported", {
        get: function () {
            if (typeof (Worker) === "undefined")
                return false;
            else
                return true;
        }
    });
})(threadjs || (threadjs = {}));
// Init namespace
/**
 * @private If we're on the main thread, then look for a script tag that imported the threadjs library.
 */
(function () {
    if (typeof (Window) !== "undefined") {
        var scripts = document.getElementsByTagName("script");
        if (scripts.length > 0) {
            var script = scripts[scripts.length - 1];
            if (script.hasAttribute("src"))
                threadjs.url = script.getAttribute("src");
        }
    }
}());
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Spencer Evans
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 * version     1.0
 * copyright   Copyright © 2015 Spencer Evans
 * author		Spencer Evans	evans.spencer@gmail.com
 * license     http://opensource.org/licenses/MIT
 * website     http://spencer-evans.com/
 */
///<reference path="threadjs.ts"/>
var threadjs;
(function (threadjs) {
    /**
     * A minimal implementation of the native code EventTarget class.
     * @see https://developer.mozilla.org/en-US/docs/Web/API/EventTarget
     *
     * This class is a simple utility to for dispatching events on objects
     * other than the normal window / document / etc.
     *
     * KNOWN LIMITATIONS:
     *	 - Does not support stopImmediatePropagation.
     *	 - Does not support target or currentTarget.
     */
    var EventDispatcher = (function () {
        //}
        //{ Constructor
        /**
         * Creates a new EventDispatcher
         * @constructor
         */
        function EventDispatcher() {
        }
        //}
        //{ Listener Interface
        /**
         * Register an event handler of a specific event type on the EventTarget.
         * @param type The type of the event to listen for.
         * @param listener The function to call when the event is dispatched.
         */
        EventDispatcher.prototype.addEventListener = function (type, listener) {
            if (typeof (this._handlers) === "undefined")
                this._handlers = [];
            var handler = {};
            handler.type = type;
            handler.listener = listener;
            handler.invalid = false;
            this._handlers.push(handler);
        };
        /**
         * Removes an event handler of a specific event type on the EventTarget.
         * @param type The type of the event to listen for.
         * @param listener The function to call when the event is dispatched.
         */
        EventDispatcher.prototype.removeEventListener = function (type, listener) {
            if (typeof (this._handlers) === "undefined")
                this._handlers = [];
            for (var i = 0; i < this._handlers.length; ++i) {
                var handler = this._handlers[i];
                if (handler.type === type && handler.listener === listener) {
                    handler.invalid = true;
                    this._handlers.splice(i, 1);
                    break;
                }
            }
        };
        //}
        //{ Dispatcher Interface
        /**
         * Dispatches an event on the event target.
         * @param evt The event to dispatch.
         */
        EventDispatcher.prototype.dispatchEvent = function (evt) {
            if (typeof (this._handlers) === "undefined")
                this._handlers = [];
            var invoking = this._handlers.slice();
            for (var i = 0; i < invoking.length; ++i) {
                var handler = invoking[i];
                if (handler.invalid === true)
                    continue;
                if (handler.type === evt.type)
                    handler.listener(evt);
            }
        };
        return EventDispatcher;
    })();
    threadjs.EventDispatcher = EventDispatcher;
})(threadjs || (threadjs = {}));
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Spencer Evans
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 * version     1.0
 * copyright   Copyright © 2015 Spencer Evans
 * author		Spencer Evans	evans.spencer@gmail.com
 * license     http://opensource.org/licenses/MIT
 * website     http://spencer-evans.com/
 */
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
///<reference path="threadjs.ts"/>
///<reference path="EventDispatcher.ts"/>
var threadjs;
(function (threadjs) {
    /**
     * A reference to the execution scaope. Used in TheadJS to reference the parent execution context.
     * The thread context class provides means to:
     * - Terminate web workers from within the thread
     * - Communicate with parent threads via messages, events, and error handling
     *
     * BROWSER SUPPORT:
     * 		Should work in everything IE10+
     */
    var Context = (function (_super) {
        __extends(Context, _super);
        //}
        //{ Constructor
        /**
         * @internal Creates a new thread execution context. Called internally by ThreadJS.
         * @constructor
         * @extends {threadjs.EventDispatcher}
         */
        function Context(scope) {
            _super.call(this);
            this._scope = scope;
            // If background, look for messages from the parent
            if (!threadjs.Thread.isMainThread) {
                this.scope_message = this.scope_message.bind(this);
                scope.addEventListener("message", this.scope_message, false);
            }
        }
        //}
        //{ Messaging
        /**
         * Sends a message to the parent thread. Will cause a generic message event to dispatch
         * on the thread instance in the main thread. The message event implements the MessageEvent interface.
         * @param data:any Some data that is attached to the event in the MessageEvent.data member. Can be anything cloneable.
         */
        Context.prototype.postMessage = function (data) {
            // Post the message to the scope
            this._scope.postMessage(data);
        };
        /**
         * Dispatches an event in the main thread. Will cause a correspondlying typed event to dispatch
         * on the thread instance in the main thread. The event won't implement any specific interface.
         * Note that if you supply a native event as a parameter, the event will be memberwise cloned as much as possible.
         * @param threadEvent Can be one of many types:
         * 		ThreadEvent: Supplying a ThreadEvent instance will dispatch that event in the main thread. The second parameter is ignored.
         *		Event: Supplying any native event instance will dispatch a memberwise clone of that event in the main thread. The second parameter is ignored.
         *		object: Supplying any javascript object will dispatch that object as an event in the main thread. It must have a type member as a string. The second parameter is ignored.
         *		string: Supplying any string as the first param will dispatch an event with the type specified. The second parameter is included as a data property on the event.
         * @param data:any (optional) Some data that is attached to the event in the MessageEvent.data member. Can be anything cloneable. Only used if the first paramater is a string.
         */
        Context.prototype.postEvent = function (threadEvent, data) {
            if (data === void 0) { data = null; }
            if (typeof (threadEvent) === "string")
                threadEvent = new threadjs.ThreadEvent(threadEvent, data);
            else if (threadEvent instanceof Event)
                threadEvent = threadjs.ThreadEvent.copyNative(threadEvent);
            else if (typeof (threadEvent.type) !== "string")
                throw new Error("Missing string event type on supplied threadEvent parameter!");
            this.postMessage({ threadjsCmd: "postEvent", threadEvent: threadEvent });
        };
        //}
        //{ Event Handlers
        /**
         * @private Handles messages coming from the parent.
         */
        Context.prototype.scope_message = function (evt) {
            var data = evt.data;
            if (data.threadjsCmd === "init") {
                threadjs.Thread.workingDirectory = data.workingDirectory;
                threadjs.url = data.url;
                threadjs.Thread._tid = data.tid;
            }
            else if (data.threadjsCmd === "eval") {
                this._scope.eval(data.script);
            }
            else if (data.threadjsCmd === "importScripts") {
                // Make relative paths absolute from the working directory
                var srcs = data.srcs;
                for (var i = 0; i < srcs.length; ++i) {
                    var src = srcs[i];
                    if (src.indexOf("://") < 0)
                        src = threadjs.Thread.workingDirectory + src;
                    srcs[i] = src;
                }
                // Import all the scripts synchonously
                importScripts.apply(null, srcs);
            }
            else if (data.threadjsCmd === "call") {
                this._scope.eval(data.funcName).apply(null, data.args);
            }
            else if (data.threadjsCmd === "construct") {
                data.args.splice(0, 0, ""); // HACK: something is wonky with the way the constructor is called using apply, so we prefix the args with one item
                new (Function.prototype.bind.apply(eval(data.typeName), data.args));
            }
            else if (data.threadjsCmd === "postEvent") {
                this.dispatchEvent(data.threadEvent);
            }
            else if (data.threadjsCmd === "permitThread") {
                var tid = data.tid;
                var children = threadjs.Thread._children; // private access
                for (var i = 0; i < children.length; ++i) {
                    if (children[i]._tid === tid) {
                        children[i].start();
                    }
                    else if (tid.substring(0, children[i]._tid.length) === children[i]._tid) {
                        children[i].postMessage({ threadjsCmd: "permitThread", tid: tid });
                    }
                }
            }
            else {
                this.dispatchEvent(evt);
            }
        };
        return Context;
    })(threadjs.EventDispatcher);
    threadjs.Context = Context;
})(threadjs || (threadjs = {}));
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Spencer Evans
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 * version     1.0
 * copyright   Copyright © 2015 Spencer Evans
 * author		Spencer Evans	evans.spencer@gmail.com
 * license     http://opensource.org/licenses/MIT
 * website     http://spencer-evans.com/
 */
///<reference path="threadjs.ts"/>
///<reference path="EventDispatcher.ts"/>
///<reference path="Context.ts"/>
var threadjs;
(function (threadjs) {
    /**
     * An intelligent wrapper for the JS Web Worker API. The thread class provides means to:
     * - Create web workers
     * - Import, define, execute, or invoke code on a web worker
     * - Communicate with workers via messages, events, and error handling
     *
     * BROWSER SUPPORT:
     * 		Should work in everything IE10+
     */
    var Thread = (function (_super) {
        __extends(Thread, _super);
        //}
        //{ Creation
        /**
         * Creates a new thread instance. Listen for events on the instance to capture events coming
         * from the thread.
         * @param scrs (optional) An ordered listing of script urls to load.
         * @constructor
         * @extends {threadjs.EventDispatcher}
         */
        function Thread() {
            var srcs = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                srcs[_i - 0] = arguments[_i];
            }
            _super.call(this);
            /** @private The worker that this thread manages. */
            this._worker = null;
            /** @private Indicates if the thread is terminated or not. */
            this._isTerminated = false;
            /** @private Indicates if the thread is started or not. */
            this._isStarted = false;
            /** @private Holds any messages that must be dispatched when the thread is started. */
            this._inbox = new Array();
            /** @private The blob url used to create the worker, if applicable. */
            this._workerURL = null;
            Thread._children.push(this);
            this._initSrcs = srcs;
            var tid = Thread._tid;
            if (tid !== "000")
                tid += ".";
            else
                tid = "";
            Thread._totalChildCount++;
            var num = Thread._totalChildCount.toString();
            if (num.length === 1)
                num = "00" + num;
            else if (num.length === 2)
                num = "0" + num;
            tid += num;
            this._tid = tid;
            if (Thread.isMainThread) {
                Thread.handleRequest(this._tid);
            }
            else {
                Thread.parent.postMessage({ threadjsCmd: "requestThread", tid: this._tid });
            }
        }
        Object.defineProperty(Thread, "scope", {
            /** @readonly The scope that the current thread is executing in. May be a Window (main thread) or a dedicated worker space (background threads). */
            get: function () { return (Thread.isMainThread ? window : Thread.parent._scope); },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Thread, "threadID", {
            /** @readonly A unique string id of the currently executing thread, only exposed for debug purposes. The main thread is always 0. */
            get: function () { return Thread._tid + ""; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Thread.prototype, "isStarted", {
            //}
            //{ Members
            /** @readonly Indicates if the thread is started or not. */
            get: function () { return this._isStarted; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Thread.prototype, "isTerminated", {
            /** @readonly Indicates if the thread is terminated or not. */
            get: function () { return this._isTerminated; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Thread.prototype, "threadID", {
            /** @readonly A unique string id of the thread, only exposed for debug purposes. The main thread is always 0. */
            get: function () { return this._tid + ""; },
            enumerable: true,
            configurable: true
        });
        /**
         * @private Actually begins a thread worker.
         */
        Thread.prototype.start = function () {
            if (this._isStarted)
                return;
            this._isStarted = true;
            // Get the url of the threadjs library
            var url = threadjs.url;
            if (url.indexOf("://") < 0)
                url = Thread.workingDirectory + url;
            // Create the worker
            if (typeof (URL) !== "undefined") {
                // Use blobs if possible
                var workerBlobStr = "importScripts('" + url + "');";
                this._workerURL = URL.createObjectURL(new Blob([workerBlobStr]));
                try {
                    this._worker = new Worker(this._workerURL);
                }
                catch (err) {
                    // fall back to urls
                    URL.revokeObjectURL(this._workerURL);
                    this._workerURL = null;
                    this._worker = new Worker(url);
                }
            }
            else {
                // Create the new thread worker by loading a script, be sure url is absolute
                this._worker = new Worker(url);
            }
            // Listen for messages from the worker
            this.worker_message = this.worker_message.bind(this);
            this._worker.addEventListener("message", this.worker_message, false);
            this.worker_error = this.worker_error.bind(this);
            this._worker.addEventListener("error", this.worker_error, false);
            // Initialize the thread worker right away
            this.postMessage({ threadjsCmd: "init", workingDirectory: Thread.workingDirectory, url: url, tid: this._tid });
            // Import scripts right away if specified
            if (this._initSrcs.length > 0)
                this.importScripts.apply(this, this._initSrcs);
            // Post any pending messages
            if (this._inbox !== null) {
                for (var i = 0; i < this._inbox.length; ++i) {
                    this.postMessage(this._inbox[i]);
                }
            }
            this._inbox = null;
            this.dispatchEvent(new threadjs.ThreadEvent("started"));
        };
        //}
        //{ Termination
        /**
         * Terminates the thread instance. Any pending messages will be ignored. Intended to be called from
         * the parent (creator) thread. The thread will terminate nearly instantly and any pending messages
         * will be ignored. A terminate event will be fired.
         * @param exitCode:number (default=0) Indicates an exit code of the thread. Defaults to 0 which, by convention, indicates no error.
         */
        Thread.prototype.terminate = function (exitCode) {
            if (exitCode === void 0) { exitCode = 0; }
            if (this._isTerminated)
                return;
            this._isTerminated = true;
            this._worker.removeEventListener("message", this.worker_message, false);
            this._worker.removeEventListener("error", this.worker_error, false);
            this._worker.terminate();
            if (this._workerURL !== null)
                URL.revokeObjectURL(this._workerURL);
            this._worker = null;
            this._workerURL = null;
            Thread._children.splice(Thread._children.indexOf(this), 1);
            if (Thread.isMainThread) {
                Thread.handleTermination(this._tid);
            }
            else {
                Thread.parent.postMessage({ threadjsCmd: "terminatedThread", tid: this._tid });
            }
            this.dispatchEvent({ type: "terminate", exitCode: exitCode });
        };
        /**
         * Request to terminate the currently executing thread instance. Intended to be called from currently executing thread.
         * Any pending messages may still arrive or dispatch until the thread is actualy terminated by the parent.
         * A terminate event will be fired for the parent thread to handle.
         * Calling this on the main thread will issue a warning.
         * @param exitCode:number (default=0) Indicates an exit code of the thread. Defaults to 0 which, by convention, indicates no error.
         */
        Thread.terminate = function (exitCode) {
            if (exitCode === void 0) { exitCode = 0; }
            if (Thread.parent !== null) {
                Thread.parent.postMessage({ threadjsCmd: "terminate", exitCode: exitCode });
            }
            else {
                try {
                    console.warn("Attempted to terminate the main thread! This will have no effect!");
                }
                catch (err) { }
            }
        };
        //}
        //{ Adding Script
        /**
         * Synchronously loads and evaluates scripts in order.
         * @param scrs An ordered listing of script urls to load.
         */
        Thread.prototype.importScripts = function () {
            var srcs = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                srcs[_i - 0] = arguments[_i];
            }
            this.postMessage({ threadjsCmd: "importScripts", srcs: srcs });
        };
        /**
         * Adds the script within the supplied function to the thread's global scope.
         * @param funcOrScriptTag A container function that holds all the script to add, or an
         */
        Thread.prototype.addScript = function (funcOrScriptTag) {
            if (typeof (funcOrScriptTag) === "function")
                this.exec(funcOrScriptTag);
            else
                this.eval(funcOrScriptTag.innerHTML);
        };
        /**
         * Defines a function in the thread's global scope, the function should be named for later use.
         * @param varNameOrFunc A variable name as a string, or a reference to the function that should be defined.
         * @param value (optional) The value to initialize the var with. Ignored if the first param is a func reference.
         */
        Thread.prototype.define = function (varNameOrFunc, value) {
            if (typeof (varNameOrFunc) === "function") {
                this.eval(varNameOrFunc); // just evaluate the function, ignore value
            }
            else if (typeof (varNameOrFunc) === "string") {
                this.eval("var " + varNameOrFunc + " = " + value + ";");
            }
            else {
                throw new Error("Unknown varNameOrFunc type (" + typeof (varNameOrFunc) + "). Must be a string variable name or a function reference!");
            }
        };
        //}
        //{ Messaging & Events
        /**
         * Sends a message to the background thread. Will cause a generic message event to dispatch
         * on the Thread.parent member in the background thread. The message event implements the MessageEvent interface.
         * @param data:any Some data that is attached to the event in the MessageEvent.data member. Can be anything cloneable.
         */
        Thread.prototype.postMessage = function (data) {
            // Verify not terminated
            if (this._isTerminated)
                throw new Error("Worker is already terminated!");
            if (!this._isStarted) {
                this._inbox.push(data);
                return;
            }
            // Send the message to the worker
            this._worker.postMessage(data);
        };
        /**
         * Dispatches an event in the background thread. Will cause a correspondlying typed event to dispatch
         * on the Thread.parent member in the background thread. The event won't implement any specific interface.
         * Note that if you supply a native event as a parameter, the event will be memberwise cloned as much as possible.
         * @param threadEvent Can be one of many types:
         * 		ThreadEvent: Supplying a ThreadEvent instance will dispatch that event in the background thread. The second parameter is ignored.
         *		Event: Supplying any native event instance will dispatch a memberwise clone of that event in the background thread. The second parameter is ignored.
         *		object: Supplying any javascript object will dispatch that object as an event in the background thread. It must have a type member as a string. The second parameter is ignored.
         *		string: Supplying any string as the first param will dispatch an event with the type specified. The second parameter is included as a data property on the event.
         * @param data:any (optional) Some data that is attached to the event in the MessageEvent.data member. Can be anything cloneable. Only used if the first paramater is a string.
         */
        Thread.prototype.postEvent = function (threadEvent, data) {
            if (data === void 0) { data = null; }
            if (typeof (threadEvent) === "string")
                threadEvent = new threadjs.ThreadEvent(threadEvent, data);
            else if (threadEvent instanceof Event)
                threadEvent = threadjs.ThreadEvent.copyNative(threadEvent);
            else if (typeof (threadEvent.type) !== "string")
                throw new Error("Missing string event type on supplied threadEvent parameter!");
            this.postMessage({ threadjsCmd: "postEvent", threadEvent: threadEvent });
        };
        //}
        //{ Running Thread Logic
        /**
         * Calls an existing function on the background thread.
         * @param funcName:string The name of a function that already exists in the background thread scope via importScripts, defineFunc, or eval.
         * @param ...args A optional list of arguments to supply to the function call.
         */
        Thread.prototype.call = function (funcName) {
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            this.postMessage({ threadjsCmd: "call", funcName: funcName, args: args });
        };
        /**
         * Temporarily defines (optional) and executes a function on the background thread. If the function already
         * exists, exec can be used to call that existing function instead (as a short hand for call).
         * The exec function provides a means to call unnamed functions.
         * Note that the exec function only temporarily defines the function; the function will not exist after it is called.
         * Exec exists as a partial short hand for:
         *		myThread.defineFunc(myFunction() { console.log("hello world!"); });
         *		myThread.call("myFunction");
         * @param func A reference to the function that should be defined, a string representation of the function,
         *		or the name of a predefined function to call.
         * @param ...args A optional list of arguments to supply to the function call.
         */
        Thread.prototype.exec = function (func) {
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            // define the function temporarily with one message
            this.eval("var threadjsTempFunc = " + func.toString() + ";");
            // call the function with another message
            args.splice(0, 0, "threadjsTempFunc");
            this.call.apply(this, args);
        };
        /**
         * Constructs an instance on the background thread.
         * @param typeName:string The name of a type definition function that already exists in the background thread scope via importScripts, defineFunc, or eval.
         * @param ...args A optional list of arguments to supply to the function call.
         */
        Thread.prototype.construct = function (typeName) {
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            this.postMessage({ threadjsCmd: "construct", typeName: typeName, args: args });
        };
        /**
         * Evaluates a javascript string on the background thread.
         * @param script The javascript to eval. It will be converted to a string.
         * 		If a function is supplied, the function should be named in order to call it later.
         *		Any script evaluated will be run in the global scope, the variables and functions
         *		will be available for later use.
         */
        Thread.prototype.eval = function (script) {
            this.postMessage({ threadjsCmd: "eval", script: script.toString() });
        };
        //}
        //{ Management
        /**
         * @private Called on the main thread when a descendant thread needs to be created.
         * @param tid The thread id that needs to be created.
         */
        Thread.handleRequest = function (tid) {
            if (!Thread.isMainThread)
                return;
            // Push the requested id
            Thread._pendingThreadIds.push(tid);
            // Check to see if we can spawn
            if (Thread._liveThreadIds.length < Thread._maxThreads) {
                Thread.permit(tid);
            }
        };
        /**
         * @private Checks to see if any pending threads can be permitted.
         */
        Thread.permitCheck = function () {
            if (!Thread.isMainThread)
                return;
            while (Thread._pendingThreadIds.length > 0 && Thread._liveThreadIds.length < Thread._maxThreads) {
                Thread.permit(Thread._pendingThreadIds[0]);
            }
        };
        /**
         * @private Allows a thread id to be created. Called on main thread only.
         * @param tid The thread id to be created.
         */
        Thread.permit = function (tid) {
            if (!Thread.isMainThread)
                return;
            for (var i = 0; i < Thread._pendingThreadIds.length; ++i) {
                if (Thread._pendingThreadIds[i] === tid) {
                    Thread._pendingThreadIds.splice(i, 1);
                    break;
                }
            }
            Thread._liveThreadIds.push(tid);
            for (var i = 0; i < Thread._children.length; ++i) {
                if (Thread._children[i]._tid === tid) {
                    Thread._children[i].start();
                }
                else if (tid.substring(0, Thread._children[i]._tid.length) === Thread._children[i]._tid) {
                    Thread._children[i].postMessage({ threadjsCmd: "permitThread", tid: tid });
                }
            }
        };
        /**
         * @private Called on the main thread when a descendant thread is terminated.
         * Children of terminated threads are automatically terminated, this
         * class accounts for that!
         * @param tid The id of the terminated thread.
         */
        Thread.handleTermination = function (tid) {
            if (!Thread.isMainThread)
                return;
            // Remove pending id tree
            for (var i = 0; i < Thread._pendingThreadIds.length; ++i) {
                if (Thread._pendingThreadIds[i] === tid) {
                    Thread._pendingThreadIds.splice(i, 1);
                    i--;
                }
                else if (Thread._pendingThreadIds[i].indexOf(tid + ".") === 0) {
                    Thread._pendingThreadIds.splice(i, 1);
                    i--;
                }
            }
            // remove live id tree
            for (var i = 0; i < Thread._liveThreadIds.length; ++i) {
                if (Thread._liveThreadIds[i] === tid) {
                    Thread._liveThreadIds.splice(i, 1);
                    i--;
                }
                else if (Thread._liveThreadIds[i].indexOf(tid + ".") === 0) {
                    Thread._liveThreadIds.splice(i, 1);
                    i--;
                }
            }
            // Check to see if we can spawn
            Thread.permitCheck();
        };
        //}
        //{ Event Handlers
        /**
         * @private Handles messages coming from the worker.
         */
        Thread.prototype.worker_message = function (evt) {
            if (this._isTerminated)
                return;
            var data = evt.data;
            if (data.threadjsCmd === "postEvent") {
                this.dispatchEvent(data.threadEvent);
            }
            else if (data.threadjsCmd === "terminate") {
                this.terminate(data.exitCode);
            }
            else if (data.threadjsCmd === "requestThread") {
                if (Thread.isMainThread) {
                    Thread.handleRequest(data.tid);
                }
                else {
                    Thread.parent.postMessage({ threadjsCmd: "requestThread", tid: data.tid });
                }
            }
            else if (data.threadjsCmd === "terminatedThread") {
                if (Thread.isMainThread) {
                    Thread.handleTermination(data.tid);
                }
                else {
                    Thread.parent.postMessage({ threadjsCmd: "terminatedThread", tid: data.tid });
                }
            }
            else {
                this.dispatchEvent(evt);
            }
        };
        /**
         * @private Handles uncaught errors coming from the worker.
         */
        Thread.prototype.worker_error = function (evt) {
            if (this._isTerminated)
                return;
            this.dispatchEvent(evt);
        };
        //{ Event Types
        /** @const Events of this type are dispatched when the thread posts generic messages. Any data issued with the event will be found in the data property on the event. */
        Thread.MESSAGE = "message";
        /** @const Events of this type are dispatched when the thread encounters an uncaught error. The event implements the ErrorEvent interface. */
        Thread.ERROR = "error";
        /** @const Events of this type are dispatched when the thread is terminated. The event will contain a user specified exitCode property, 0 indicates no error. */
        Thread.TERMINATE = "terminate";
        /** @const Events of this type are dispatched when the thread is started. You may call methods on the thread prior to start, they will fire when in order when the thread starts. */
        Thread.START = "start";
        /** @readonly The parent thread context (if any) of this thread. Will be null on the main thread. Listen to this object for events coming from the parent thread. */
        Thread.parent = null;
        /** @private The child threads that this thread has spawned. */
        Thread._children = new Array();
        /** @private The id of the currently executing thread. The main thread is always 0. */
        Thread._tid = "000";
        /** @private The total number of immediate child threads created by this thread. Used to create ids. */
        Thread._totalChildCount = 0;
        /** @private The list of not yet started thread ids, only valid on the main thread. */
        Thread._pendingThreadIds = new Array();
        /** @private The list of alive thread ids, only valid on the main thread. */
        Thread._liveThreadIds = new Array();
        /** @private The maximum number of threads. Totally caps out at like 20ish. Depends on hardware. */
        Thread._maxThreads = 4;
        return Thread;
    })(threadjs.EventDispatcher);
    threadjs.Thread = Thread;
    //{ On Load Initializer
    /** @private Initializes the Thread class on file load. */
    (function () {
        // Set up the static thread members
        if (typeof (Window) !== "undefined") {
            var maxThreads = navigator.hardwareConcurrency || 4;
            if (maxThreads < 1)
                maxThreads = 1;
            else if (maxThreads > 16)
                maxThreads = 16;
            Thread._maxThreads = maxThreads;
            Thread.isMainThread = true;
            Thread.workingDirectory = document.location.toString().substring(0, document.location.toString().lastIndexOf('/') + 1);
        }
        else {
            Thread.isMainThread = false;
            Thread.parent = new threadjs.Context(self);
        }
        // Import Thread into the global scope if possible
        if (typeof (Thread.scope.Thread) === "undefined") {
            Thread.scope.Thread = Thread;
        }
        else {
            try {
                console.warn("Could not import Thread class, there is a naming collision!");
            }
            catch (err) {
            }
        }
    }());
})(threadjs || (threadjs = {}));
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Spencer Evans
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 * version     1.0
 * copyright   Copyright © 2015 Spencer Evans
 * author		Spencer Evans	evans.spencer@gmail.com
 * license     http://opensource.org/licenses/MIT
 * website     http://spencer-evans.com/
 */
///<reference path="threadjs.ts"/>
///<reference path="Thread.ts"/>
var threadjs;
(function (threadjs) {
    /**
     * A minimal event interface used to transfer events between threads. NativeEvents are not coneable
     * and thus cannot be transferred between threads.
     *
     * BROWSER SUPPORT:
     * 		Should work in everything IE10+
     */
    var ThreadEvent = (function () {
        //}
        /**
         * Constructs a new ThreadEvent.
         * @param type The type of the event.
         * @param data (optional) Any additional data to set in the data member.
         * @constructor
         */
        function ThreadEvent(type, data) {
            if (data === void 0) { data = null; }
            this.type = type;
            this.data = data;
        }
        /**
         * Uses memberwise cloning to copy a native event as deep as possible.
         * This enables passing of events like MouseEvents to threads.
         * @param evt The native event to clone.
         * @return The created ThreadEvent instance.
         */
        ThreadEvent.copyNative = function (evt) {
            var threadEvent = new ThreadEvent(evt.type);
            var obj = evt;
            for (var property in obj) {
                var value = obj[property];
                var str = JSON.stringify(value);
                if (typeof (str) === "undefined")
                    continue; // cannot parse undefined values
                try {
                    value = JSON.parse(str);
                    threadEvent[property] = value;
                }
                catch (err) {
                }
            }
            return threadEvent;
        };
        return ThreadEvent;
    })();
    threadjs.ThreadEvent = ThreadEvent;
    //{ On Load Initializer
    /**
     * @private Imports ThreadEvent into the global namespace.
     */
    (function () {
        // Import ThreadEvent into the global scope if possible
        if (typeof (threadjs.Thread.scope.ThreadEvent) === "undefined") {
            threadjs.Thread.scope.ThreadEvent = ThreadEvent;
        }
        else {
            try {
                console.warn("Could not import ThreadEvent class, there is a naming collision!");
            }
            catch (err) {
            }
        }
    }());
})(threadjs || (threadjs = {}));
