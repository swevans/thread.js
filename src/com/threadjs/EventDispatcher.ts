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

module threadjs
{
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
	export class EventDispatcher
	{
		
		//{ Members
		/** @private A List of event listeners. */
		private _handlers:Array<any>;
		//}
		
		
		//{ Constructor
		/**
		 * Creates a new EventDispatcher
		 * @constructor
		 */
		constructor()
		{
			
		}
		//}
		
		
		//{ Listener Interface
		/**
		 * Register an event handler of a specific event type on the EventTarget.
		 * @param type The type of the event to listen for. 
		 * @param listener The function to call when the event is dispatched.
		 */
		public addEventListener(type:string, listener:any):void
		{
			if (typeof(this._handlers) === "undefined") this._handlers = [];
			
			var handler:any = {};
			handler.type = type;
			handler.listener = listener;
			handler.invalid = false;
			this._handlers.push(handler);
		}
		
		/**
		 * Removes an event handler of a specific event type on the EventTarget.
		 * @param type The type of the event to listen for. 
		 * @param listener The function to call when the event is dispatched.
		 */
		public removeEventListener(type:string, listener:any):void
		{
			if (typeof(this._handlers) === "undefined") this._handlers = [];
			
			for (var i = 0; i < this._handlers.length; ++i)
			{
				var handler = this._handlers[i];
				if (handler.type === type && handler.listener === listener)
				{
					handler.invalid = true;
					this._handlers.splice(i, 1);
					break;
				}
			}
		}
		//}
		
		
		//{ Dispatcher Interface
		/**
		 * Dispatches an event on the event target.
		 * @param evt The event to dispatch.
		 */
		public dispatchEvent(evt:any):void
		{
			if (typeof(this._handlers) === "undefined") this._handlers = [];
			
			var invoking = this._handlers.slice();
			
			for (var i = 0; i < invoking.length; ++i)
			{
				var handler = invoking[i];
				if (handler.invalid === true) continue;
				if (handler.type === evt.type) handler.listener(evt);
			}
		}
		//}
		
	}
}
