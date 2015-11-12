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
(function()
{
	if (typeof(threadjs) !== "undefined")
	{
		if (typeof(Window) === "undefined")
		{
			throw new Error("threadjs is already defined, you don't need to import the script on child threads created using threadjs! Did you attempt to load the script twice? Do you possibly have a conflicting reference?");
		}
		else
		{
			throw new Error("threadjs is already defined, did you attempt to load the script twice? Do you possibly have a conflicting reference?");
		}
	}
}());
 
/**
 * Declare namespace utils and vars
 */
module threadjs
{
	/** The URL of the threadjs library script file. This member is automatically set if you use synchronous tag loading of the library (recommended). */
	export var url:string = null;
	
	/** Gets or the maximum number of alive threads. If there are more threads than the new cap, they will remain alive. 
	Only valid on the main thread! Be ware of setting this value too high.*/
	Object.defineProperty(threadjs, "maxThreads",
	{
		get: function()
		{
			if (!Thread.isMainThread) throw new Error("maxThreads is only valid on the main thread!");
			return (<any>Thread)._maxThreads; 
		},
		set: function(value)
		{
			if (!Thread.isMainThread) throw new Error("maxThreads is only valid on the main thread!");
			if (value < 1) 
			{
				try
				{
					console.warn("Setting maxThreads below 1 will result in no threads starting!");
				}
				catch(err) {}
			}
			if (value > 999) 
			{
				throw new Error("ThreadJS does not support over 999 threads!");
			}
			if (value > 16) 
			{
				try
				{
					console.warn("Setting maxThreads above 16 may result in a browser crash!");
				}
				catch(err) {}
			}
			(<any>Thread)._maxThreads = value; 
			(<any>Thread).permitCheck(); 
		}
	});
	
	/** Indicates if threadjs (and WebWorkers) are supported in the current runtime */
	Object.defineProperty(threadjs, "isSupported",
	{
		get: function()
		{
			if (typeof(Worker) === "undefined") return false;
			else return true;
		}
	});
	
}

// Init namespace
/**
 * @private If we're on the main thread, then look for a script tag that imported the threadjs library.
 */
(function()
{
	if (typeof(Window) !== "undefined")
	{
		var scripts = document.getElementsByTagName("script");
		if (scripts.length > 0)
		{
			var script = scripts[scripts.length - 1];
			if (script.hasAttribute("src")) threadjs.url = script.getAttribute("src");
		}
	}
}());


