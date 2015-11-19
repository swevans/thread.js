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

module threadjs
{
	/**
	 * An intelligent wrapper for the JS Web Worker API. The thread class provides means to:
	 * - Create web workers
	 * - Import, define, execute, or invoke code on a web worker
	 * - Communicate with workers via messages, events, and error handling
	 *
	 * BROWSER SUPPORT:
	 * 		Should work in everything IE10+
	 */
	export class Thread extends EventDispatcher
	{
		
		//{ Event Types
		/** @const Events of this type are dispatched when the thread posts generic messages. Any data issued with the event will be found in the data property on the event. */
		public static MESSAGE = "message";
		
		/** @const Events of this type are dispatched when the thread encounters an uncaught error. The event implements the ErrorEvent interface. */
		public static ERROR = "error";
		
		/** @const Events of this type are dispatched when the thread is terminated. The event will contain a user specified exitCode property, 0 indicates no error. */
		public static TERMINATE = "terminate";
		
		/** @const Events of this type are dispatched when the thread is started. You may call methods on the thread prior to start, they will fire when in order when the thread starts. */
		public static START = "start";
		//}
		
		
		//{ Static Members
		/** @readonly Indicates if this thread is the main UI thread. */
		public static isMainThread:boolean;
		
		/** @readonly The directory of the HTML file that's currently showing in the window on the main thread. */
		public static workingDirectory:string;
		
		/** @readonly The parent thread context (if any) of this thread. Will be null on the main thread. Listen to this object for events coming from the parent thread. */
		public static parent:Context = null;
		
		/** @readonly The scope that the current thread is executing in. May be a Window (main thread) or a dedicated worker space (background threads). */
		public static get scope():any { return (Thread.isMainThread ? window : (<any>Thread.parent)._scope); }
		
		/** @readonly A unique string id of the currently executing thread, only exposed for debug purposes. The main thread is always 0. */
		public static get threadID():string { return Thread._tid + ""; }
		
		/** @private The child threads that this thread has spawned. */
		private static _children:Array<Thread> = new Array<Thread>();
		
		/** @private The id of the currently executing thread. The main thread is always 0. */
		private static _tid:string = "000";
		
		/** @private The total number of immediate child threads created by this thread. Used to create ids. */
		private static _totalChildCount:number = 0;
		
		/** @private The list of not yet started thread ids, only valid on the main thread. */
		private static _pendingThreadIds:Array<string> = new Array<string>();
		
		/** @private The list of alive thread ids, only valid on the main thread. */
		private static _liveThreadIds:Array<string> = new Array<string>();
		
		/** @private The maximum number of workers. Totally caps out at like 16. Depends on hardware. */
		private static _maxWorkers:number = 4;
		//}
		
		
		//{ Members
		/** @readonly Indicates if the thread is started or not. */
		public get isStarted():boolean { return this._isStarted; }
		
		/** @readonly Indicates if the thread is terminated or not. */
		public get isTerminated():boolean { return this._isTerminated; }
		
		/** @readonly A unique string id of the thread, only exposed for debug purposes. The main thread is always 0. */
		public get threadID():string { return this._tid + ""; }
		
		/** @private The worker that this thread manages. */
		private _worker:Worker = null;
		
		/** @private Indicates if the thread is terminated or not. */
		private _isTerminated:boolean = false;
		
		/** @private Indicates if the thread is started or not. */
		private _isStarted:boolean = false;
		
		/** @private Holds any messages that must be dispatched when the thread is started. */
		private _inbox:Array<any> = new Array<any>();
		
		/** @private The sources that this thread should import when it starts. */
		private _initSrcs:Array<string>;
		
		/** @private The id of the thread instance. */
		private _tid:string;
		
		/** @private The blob url used to create the worker, if applicable. */
		private _workerURL:string = null;
		//}
		
		
		//{ Creation
		/**
		 * Creates a new thread instance. Listen for events on the instance to capture events coming 
		 * from the thread.
		 * @param srcs (optional) An ordered listing of script urls, script definition functions, or scripts tags of script to load.
		 * @constructor
		 * @extends {threadjs.EventDispatcher}
		 */
		constructor(...srcs:Array<any>)
		{
			super();
			
			this.postEvent = this.postEvent.bind(this);
			
			Thread._children.push(this);
			
			this._initSrcs = srcs;
			
			var tid = Thread._tid;
			if (tid !== "000") tid += ".";
			else tid = "";
			Thread._totalChildCount++;
			var num = Thread._totalChildCount.toString();
			if (num.length === 1) num = "00" + num;
			else if (num.length === 2) num = "0" + num;
			tid += num;
			this._tid = tid;
			
			if (Thread.isMainThread)
			{
				Thread.handleRequest(this._tid);
			}
			else
			{
				Thread.parent.postMessage({threadjsCmd: "requestThread", tid: this._tid});
			}
		}
		
		/**
		 * @private Actually begins a thread worker.
		 */
		private start():void
		{
			if (this._isStarted) return;
			this._isStarted = true;
			
			// Get the url of the threadjs library
			var url = threadjs.url;
			if (url.indexOf("://") < 0) url = Thread.workingDirectory + url;
			
			// Create the worker
			if (threadjs.allowInlineWorkers && typeof(URL) !== "undefined")
			{
				// Use blobs if possible
				var workerBlobStr:string = "importScripts('" + url + "');";
				this._workerURL = URL.createObjectURL(new Blob([workerBlobStr]));
				try
				{
					this._worker = new Worker(this._workerURL);
				}
				catch(err)
				{
					// fall back to urls
					URL.revokeObjectURL(this._workerURL);
					this._workerURL = null;
					this._worker = new Worker(url);
				}
			}
			else
			{
				// Create the new thread worker by loading a script, be sure url is absolute
				this._worker = new Worker(url);
			}
			
			// Listen for messages from the worker
			this.worker_message = this.worker_message.bind(this);
			this._worker.addEventListener("message", this.worker_message, false);
			this.worker_error = this.worker_error.bind(this);
			this._worker.addEventListener("error", this.worker_error, false);
			
			// Initialize the thread worker right away
			this.postMessage({threadjsCmd: "init", workingDirectory: Thread.workingDirectory, url: url, tid: this._tid});
			
			// Import scripts right away if specified
			if (this._initSrcs.length > 0)
			{
				for (var i = 0; i < this._initSrcs.length; ++i)
				{
					var src = this._initSrcs[i];
					if (typeof(src) === "string") this.importScripts(src);
					else this.addScripts(src);
				}
			}
			
			// Post any pending messages
			if (this._inbox !== null)
			{
				for (var i = 0; i < this._inbox.length; ++i)
				{
					this.postMessage(this._inbox[i]);
				}
			}
			this._inbox = null;
			
			this.dispatchEvent(new ThreadEvent("started"));
		}
		//}
		
		
		//{ Termination
		/**
		 * Terminates the thread instance. Any pending messages will be ignored. Intended to be called from
		 * the parent (creator) thread. The thread will terminate nearly instantly and any pending messages
		 * will be ignored. A terminate event will be fired.
		 * @param exitCode:number (default=0) Indicates an exit code of the thread. Defaults to 0 which, by convention, indicates no error.
		 */
		public terminate(exitCode:number = 0):void
		{
			if (this._isTerminated) return;
			this._isTerminated = true;
			
			this._worker.removeEventListener("message", this.worker_message, false);
			this._worker.removeEventListener("error", this.worker_error, false);
			this._worker.terminate();
			if (this._workerURL !== null) URL.revokeObjectURL(this._workerURL);
			this._worker = null;
			this._workerURL = null;
			
			Thread._children.splice(Thread._children.indexOf(this), 1);
			
			if (Thread.isMainThread)
			{
				Thread.handleTermination(this._tid);
			}
			else
			{
				Thread.parent.postMessage({threadjsCmd: "terminatedThread", tid: this._tid});
			}
			
			this.dispatchEvent(<any>{type: "terminate", exitCode: exitCode});
		}
		
		/**
		 * Request to terminate the currently executing thread instance. Intended to be called from currently executing thread.
		 * Any pending messages may still arrive or dispatch until the thread is actualy terminated by the parent. 
		 * A terminate event will be fired for the parent thread to handle.
		 * Calling this on the main thread will issue a warning.
		 * @param exitCode:number (default=0) Indicates an exit code of the thread. Defaults to 0 which, by convention, indicates no error.
		 */
		public static terminate(exitCode:number = 0):void
		{
			if (Thread.parent !== null)
			{
				Thread.parent.postMessage({threadjsCmd: "terminate", exitCode: exitCode});
			}
			else
			{
				try
				{
					console.warn("Attempted to terminate the main thread! This will have no effect!");
				}
				catch(err){}
			}
		}
		//}
		
		
		//{ Adding Script
		/**
		 * Synchronously loads and evaluates scripts in order.
		 * @param scrs An ordered listing of script urls to load.
		 */
		public importScripts(...srcs:Array<string>):void
		{
			this.postMessage({threadjsCmd: "importScripts", srcs: srcs});
		}
		
		/**
		 * Adds the script within the supplied function to the thread's global scope.
		 * @param funcOrScriptTags An ordered list of container functions or script tags that hold script to load
		 */
		public addScripts(...funcOrScriptTags:Array<any>):void
		{
			for (var i = 0; i < funcOrScriptTags.length; ++i)
			{
				var funcOrScriptTag = funcOrScriptTags[i];
				if (typeof(funcOrScriptTag) === "function") this.exec(funcOrScriptTag);
				else this.eval(funcOrScriptTag.innerHTML);
			}
		}
		
		/**
		 * Defines a function in the thread's global scope, the function should be named for later use.
		 * @param varNameOrFunc A variable name as a string, or a reference to the function that should be defined.
		 * @param value (optional) The value to initialize the var with. Ignored if the first param is a func reference.
		 */
		public define(varNameOrFunc:any, value?:any):void
		{
			if (typeof(varNameOrFunc) === "function")
			{
				this.eval(varNameOrFunc);	// just evaluate the function, ignore value
			}
			else if (typeof(varNameOrFunc) === "string")
			{
				this.eval("var " + varNameOrFunc + " = " + value + ";");
			}
			else
			{
				throw new Error("Unknown varNameOrFunc type (" + typeof(varNameOrFunc) + "). Must be a string variable name or a function reference!");
			}
		}
		//}
		
		
		//{ Messaging & Events
		/**
		 * Sends a message to the background thread. Will cause a generic message event to dispatch 
		 * on the Thread.parent member in the background thread. The message event implements the MessageEvent interface.
		 * @param data:any Some data that is attached to the event in the MessageEvent.data member. Can be anything cloneable.
		 */
		public postMessage(data:any):void
		{
			// Verify not terminated
			if (this._isTerminated) throw new Error("Worker is already terminated!");
			
			if (!this._isStarted)
			{
				this._inbox.push(data);
				return;
			}
			
			// Send the message to the worker
			this._worker.postMessage(data);
		}
		
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
		public postEvent(threadEvent:ThreadEvent, data:any = null):void
		{
			if (typeof(threadEvent) === "string") threadEvent = new ThreadEvent(<any>threadEvent, data);
			else if (threadEvent instanceof Event) threadEvent = ThreadEvent.copyNative(<any>threadEvent);
			else if (typeof(threadEvent.type) !== "string") throw new Error("Missing string event type on supplied threadEvent parameter!");
			
			this.postMessage({threadjsCmd: "postEvent", threadEvent: threadEvent});
		}
		//}
		
		
		//{ Running Thread Logic
		/**
		 * Calls an existing function on the background thread.
		 * @param funcName:string The name of a function that already exists in the background thread scope via importScripts, defineFunc, or eval.
		 * @param ...args A optional list of arguments to supply to the function call. 
		 */
		public call(funcName:string, ...args:Array<any>):void
		{
			this.postMessage({threadjsCmd: "call", funcName: funcName, args: args});
		}
		
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
		public exec(func:Function, ...args:Array<any>):void
		{
			// define the function temporarily with one message
			this.eval("var threadjsTempFunc = " + func.toString() + ";");
			
			// call the function with another message
			args.splice(0, 0, "threadjsTempFunc");
			this.call.apply(this, args);
		}
		
		
		/** 
		 * Constructs an instance on the background thread. 
		 * @param typeName:string The name of a type definition function that already exists in the background thread scope via importScripts, defineFunc, or eval.
		 * @param ...args A optional list of arguments to supply to the function call. 
		 */
		public construct(typeName:string, ...args:Array<any>):void
		{
			this.postMessage({threadjsCmd: "construct", typeName: typeName, args: args});
		}
		
		/** 
		 * Evaluates a javascript string on the background thread.
		 * @param script The javascript to eval. It will be converted to a string. 
		 * 		If a function is supplied, the function should be named in order to call it later.
		 *		Any script evaluated will be run in the global scope, the variables and functions 
		 *		will be available for later use.
		 */
		public eval(script:any):void
		{
			this.postMessage({threadjsCmd: "eval", script: script.toString()});
		}
		//}
		
		
		//{ Management
		/**
		 * @private Called on the main thread when a descendant thread needs to be created. 
		 * @param tid The thread id that needs to be created.
		 */
		private static handleRequest(tid:string):void
		{
			if (!Thread.isMainThread) return;
			
			// Push the requested id
			Thread._pendingThreadIds.push(tid);
			
			// Check to see if we can spawn
			if (Thread._liveThreadIds.length < Thread._maxWorkers)
			{
				Thread.permit(tid);
			}
		}
		
		/**
		 * @private Checks to see if any pending threads can be permitted.
		 */
		private static permitCheck():void
		{
			if (!Thread.isMainThread) return;
			
			while (Thread._pendingThreadIds.length > 0 && Thread._liveThreadIds.length < Thread._maxWorkers)
			{
				Thread.permit(Thread._pendingThreadIds[0]);
			}
		}
		
		/**
		 * @private Allows a thread id to be created. Called on main thread only.
		 * @param tid The thread id to be created.
		 */
		private static permit(tid:string):void
		{
			if (!Thread.isMainThread) return;
			
			for (var i = 0; i < Thread._pendingThreadIds.length; ++i)
			{
				if (Thread._pendingThreadIds[i] === tid)
				{
					Thread._pendingThreadIds.splice(i, 1);
					break;
				}
			}
			Thread._liveThreadIds.push(tid);
			
			for (var i = 0; i < Thread._children.length; ++i)
			{
				if (Thread._children[i]._tid === tid)
				{
					Thread._children[i].start();
				}
				else if (tid.substring(0, Thread._children[i]._tid.length) === Thread._children[i]._tid)
				{
					Thread._children[i].postMessage({threadjsCmd: "permitThread", tid: tid});
				}
			}
		}
		
		/**
		 * @private Called on the main thread when a descendant thread is terminated.
		 * Children of terminated threads are automatically terminated, this
		 * class accounts for that!
		 * @param tid The id of the terminated thread.
		 */
		private static handleTermination(tid:string):void
		{
			if (!Thread.isMainThread) return;
			
			// Remove pending id tree
			for (var i = 0; i < Thread._pendingThreadIds.length; ++i)
			{
				if (Thread._pendingThreadIds[i] === tid)
				{
					Thread._pendingThreadIds.splice(i, 1);
					i--;
				}
				else if (Thread._pendingThreadIds[i].indexOf(tid + ".") === 0)
				{
					Thread._pendingThreadIds.splice(i, 1);
					i--;
				}
			}
			
			// remove live id tree
			for (var i = 0; i < Thread._liveThreadIds.length; ++i)
			{
				if (Thread._liveThreadIds[i] === tid)
				{
					Thread._liveThreadIds.splice(i, 1);
					i--;
				}
				else if (Thread._liveThreadIds[i].indexOf(tid + ".") === 0)
				{
					Thread._liveThreadIds.splice(i, 1);
					i--;
				}
			}
			
			// Check to see if we can spawn
			Thread.permitCheck();
		}
		//}
		
		
		//{ Event Handlers
		/**
		 * @private Handles messages coming from the worker.
		 */
		private worker_message(evt:MessageEvent):void
		{
			if (this._isTerminated) return;
			
			var data:any = evt.data;
			
			if (data.threadjsCmd === "postEvent")
			{
				this.dispatchEvent(data.threadEvent);
			}
			else if (data.threadjsCmd === "terminate")
			{
				this.terminate(data.exitCode);
			}
			else if (data.threadjsCmd === "requestThread")
			{
				if (Thread.isMainThread)
				{
					Thread.handleRequest(data.tid);
				}
				else
				{
					Thread.parent.postMessage({threadjsCmd: "requestThread", tid: data.tid});
				}
			}
			else if (data.threadjsCmd === "terminatedThread")
			{
				if (Thread.isMainThread)
				{
					Thread.handleTermination(data.tid);
				}
				else
				{
					Thread.parent.postMessage({threadjsCmd: "terminatedThread", tid: data.tid});
				}
			}
			else
			{
				this.dispatchEvent(evt);
			}
		}
		
		/**
		 * @private Handles uncaught errors coming from the worker.
		 */
		private worker_error(evt:ErrorEvent):void
		{
			if (this._isTerminated) return;
			
			this.dispatchEvent(evt);
		}
		//}
		
	}
	
	//{ On Load Initializer
	/** @private Initializes the Thread class on file load. */
	(function()
	{
		// Set up the static thread members
		if (typeof(Window) !== "undefined")
		{
			var maxWorkers = (<any>navigator).hardwareConcurrency || 4;
			if (maxWorkers < 1) maxWorkers = 1;
			else if (maxWorkers > 16) maxWorkers = 16;
			(<any>Thread)._maxWorkers = maxWorkers;
			
			Thread.isMainThread = true;
			Thread.workingDirectory = document.location.toString().substring(0, document.location.toString().lastIndexOf('/') + 1);
		}
		else
		{
			Thread.isMainThread = false;
			Thread.parent = new Context(self);
		}
		
		// Import Thread into the global scope if possible
		if (typeof(Thread.scope.Thread) === "undefined")
		{ 
			Thread.scope.Thread = Thread;
		}
		else
		{
			try
			{
				console.warn("Could not import Thread class, there is a naming collision!");
			} 
			catch (err)
			{
				// fail silently if console had an error
			}
		}
	}());
	//}
	
}
