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

module threadjs
{
	
	/**
	 * A minimal event interface used to transfer events between threads. NativeEvents are not coneable 
	 * and thus cannot be transferred between threads.
	 *
	 * BROWSER SUPPORT:
	 * 		Should work in everything IE10+
	 */
	export class ThreadEvent
	{
		
		//{ Members
		/** @readonly The type of the event. */
		public type:string;
		
		/** Any generic data appended to the event. */
		public data:any;
		//}
		
		
		/**
		 * Constructs a new ThreadEvent.
		 * @param type The type of the event.
		 * @param data (optional) Any additional data to set in the data member.
		 * @constructor
		 */
		constructor(type:string, data:any = null)
		{
			this.type = type;
			this.data = data;
		}
		
		
		/**
		 * Uses memberwise cloning to copy a native event as deep as possible. 
		 * This enables passing of events like MouseEvents to threads.
		 * @param evt The native event to clone.
		 * @return The created ThreadEvent instance.
		 */
		public static copyNative(evt:Event):ThreadEvent
		{
			var threadEvent:any = new ThreadEvent(evt.type);
			
			var obj:any = <any>evt;
			for (var property in obj) 
			{
				var value = obj[property];
				var str = JSON.stringify(value);
				if (typeof(str) === "undefined") continue;	// cannot parse undefined values
				
				try
				{
					value = JSON.parse(str);
					threadEvent[property] = value;
				}
				catch (err) 
				{
					// silently fail, the property could not be parsed
				}
			}
			
			
			return threadEvent;
		}
		
	}
	
	//{ On Load Initializer
	/**
	 * @private Imports ThreadEvent into the global namespace.
	 */
	(function()
	{
		// Import ThreadEvent into the global scope if possible
		if (typeof(Thread.scope.ThreadEvent) === "undefined")
		{ 
			Thread.scope.ThreadEvent = ThreadEvent;
		}
		else
		{
			try
			{
				console.warn("Could not import ThreadEvent class, there is a naming collision!");
			} 
			catch (err)
			{
				// fail silently if console had an error
			}
		}
	}());
	//}
}