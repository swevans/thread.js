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

module threadjs
{
	/**
	 * A reference to the execution scaope. Used in TheadJS to reference the parent execution context.
	 * The thread context class provides means to:
	 * - Terminate web workers from within the thread
	 * - Communicate with parent threads via messages, events, and error handling
	 *
	 * BROWSER SUPPORT:
	 * 		Should work in everything IE10+
	 */
	export class Context extends EventDispatcher
	{
		
		//{ Members
		/** @private A reference to the scope (Worker / Window) that the thread is executing in. */
		private _scope:any;
		//}
		
		
		//{ Constructor
		/**
		 * @internal Creates a new thread execution context. Called internally by ThreadJS.
		 * @constructor
		 * @extends {threadjs.EventDispatcher}
		 */
		constructor(scope:any)
		{
			super();
			
			this._scope = scope;
			
			// If background, look for messages from the parent
			if (!Thread.isMainThread)
			{
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
		public postMessage(data:any):void
		{
			// Post the message to the scope
			this._scope.postMessage(data);
		}
		
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
		public postEvent(threadEvent:ThreadEvent, data:any = null):void
		{
			if (typeof(threadEvent) === "string") threadEvent = new ThreadEvent(<any>threadEvent, data);
			else if (threadEvent instanceof Event) threadEvent = ThreadEvent.copyNative(<any>threadEvent);
			else if (typeof(threadEvent.type) !== "string") throw new Error("Missing string event type on supplied threadEvent parameter!");
			
			this.postMessage({threadjsCmd: "postEvent", threadEvent: threadEvent});
		}
		//}
		
		
		//{ Event Handlers
		/**
		 * @private Handles messages coming from the parent.
		 */
		private scope_message(evt:MessageEvent):void
		{
			var data = evt.data;
			if (data.threadjsCmd === "init")
			{
				Thread.workingDirectory = data.workingDirectory;
				threadjs.url = data.url;
				(<any>Thread)._tid = data.tid;
			}
			else if (data.threadjsCmd === "eval")
			{
				this._scope.eval(data.script);
			}
			else if (data.threadjsCmd === "importScripts")
			{
				// Make relative paths absolute from the working directory
				var srcs:Array<string> = data.srcs;
				for (var i = 0; i < srcs.length; ++i)
				{
					var src = srcs[i];
					if (src.indexOf("://") < 0) src = Thread.workingDirectory + src;
					srcs[i] = src;
				}
				
				// Import all the scripts synchonously
				importScripts.apply(null, srcs);
			}
			else if (data.threadjsCmd === "call")
			{
				this._scope.eval(data.funcName).apply(null, data.args);
			}
			else if (data.threadjsCmd === "construct")
			{
				data.args.splice(0, 0, "");	// HACK: something is wonky with the way the constructor is called using apply, so we prefix the args with one item
				new (Function.prototype.bind.apply(eval(data.typeName), data.args));
			}
			else if (data.threadjsCmd === "postEvent")
			{
				this.dispatchEvent(data.threadEvent);
			}
			else if (data.threadjsCmd === "permitThread")
			{
				var tid:string = data.tid;
				var children:Array<any> = (<any>Thread)._children;	// private access
				for (var i = 0; i < children.length; ++i)
				{
					if (children[i]._tid === tid)
					{
						children[i].start();
					}
					else if (tid.substring(0, children[i]._tid.length) === children[i]._tid)
					{
						children[i].postMessage({threadjsCmd: "permitThread", tid: tid});
					}
				}
			}
			else
			{
				this.dispatchEvent(evt);
			}
		}
		//}
		
	}
}
