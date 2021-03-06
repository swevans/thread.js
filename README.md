<a name="top"></a>
# Thread.js
**<p>Multithreading in JavaScript</p>**
<p>
Thread.js is lightweight multithreading library for the JavaScript <a target="_blank" href="https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API">Web Worker API</a>. Web Workers are fast and powerful. They're the best option for performing heavy computation without ruining user experience, but the code required to use them is <a target="_blank" href="http://www.html5rocks.com/en/tutorials/workers/basics/">unintuitive, cumbersome, and error prone</a>. This library was created to make writing parallel applications easier and faster.
</p>
<p>
Thread.js provides an intuitive, high-level interface for Web Worker creation, programming, communication, and termination. It works in any browser that <a href="http://caniuse.com/#feat=webworkers">supports Web Workers</a> (IE10+).
</p>
###### Key Features:
* Flexible, robust method set for creating and managing threads
* Typed Event messaging between threads
* Self terminating thread support
* A thread queue automagically manages worker resources

###### Demo:
* **<a target="_blank" href="http://jsfiddle.net/swevans/5m6rqsro/9/">JSFiddle Prime Numbers Example</a>** - Performs intensive operations without disrupting animation
<br/>
<br/>


<a name="download"></a>
## Download
Download the latest versions of Thread.js here:
###### Latest JavaScript Release
<pre>
Minified: <a download href="http://spencer-evans.com/share/github/threadjs/latest/thread.min.zip">thread.min.js</a>
Unminified: <a downlod href="http://spencer-evans.com/share/github/threadjs/latest/thread.zip">thread.js</a>
</pre>
<br/>


<a name="installation"></a>
## Installation 
Include thread.js in your projects like so:
###### Tag Loading
```html
<!-- Minified version, recommended for release -->
<script src="pathto/thread.min.js"></script>

<!-- Full version, recommended for debugging -->
<script src="pathto/thread.js"></script>
```
</br>


<a name="gettingStarted"></a>
## Getting Started
Thread.js is simple enough that we can just jump into code. The below code creates a thread and runs some code on it. We've created a fiddle to show how easy it is. <a target="_blank" href="http://jsfiddle.net/swevans/57exndpp/6/">Try it yourself</a>.
```js
// Check for threadjs support in the current browser
if (threadjs.isSupported)
{
	// Start a thread and have it evaluate the supplied function
	var myThread = new Thread(function()
	{
		// do something in the thread
		console.log("hello world!");
	});
}
```
Now move on to review <a href="#concepts">Thread.js Concepts</a> to learn more about how threads work, or jump to the <a href="#usage">Usage Guide</a> to learn more about using thread.js.
</br>
<br/>

<a name="toc"></a>
## Table of Contents
There is a lot to thread.js, choose a section below
* <a href="#concepts">Thread.js Concepts</a>
* <a href="#usage">Usage Guide</a>
	* <a href="#creatingAThread">Creating a Thread</a>
	* <a href="#addThreadLogic">Adding Thread Logic</a>
	* <a href="#run">Running Thread Logic</a>
	* <a href="#comm">Communicating with Threads</a>
	* <a href="#termination">Terminating Threads</a>
* <a href="#examples">Examples</a>
* <a href="#browsers">Browser Support</a>
* <a href="#faq">FAQ</a>
* Documentation (Coming Soon, see typescript or unminified js comments for now)
* <a href="#advanced">Advanced Topics</a>
	* <a href="#threadEvents">Thread Events</a>
	* <a href="#subThreads">Sub Threads (Sub Workers)</a>
	* <a href="#threadScope">Thread Scope & Loading within a Thread</a>
	* <a href="#passingData">Passing Data Between Threads</a>
	* <a href="#asyncLib">Asynchronously Loading Thread.js</a>
	* <a href="#CORS">Cross Domain Security (CORS)</a>
	* <a href="#queuing">Thread Queuing, Max Workers, and Thread Lock</a>
	* <a href="#optimization">Memory & Traffic Optimization</a>
	* <a href="#debugging">Debugging & Error Handling</a>
* <a href="#future">Future Changes</a>
* <a href="#underTheHood">Under the Hood</a>
* <a href="#compilingTS">Compiling TypeScript</a>
<br/>
<br/>

<a name="concepts"></a>
## Thread.js Concepts
Programming multi-threaded applications can sometimes be a little mind bending. It never hurts to review a few of the core concepts before diving deep. 

1. There is one Main UI (Window) thread that starts when your page loads. This is the thread that your html files load into. Any javascript you load from your html is loaded into the main thread. This thread is not managed by thread.js.

2. Child Threads are background threads. Child threads always operate in their own space. They do not have access to the window, DOM, or files loaded into the main thread. By default child threads have no code to run. You must add code to them and set that code up to run

3. Child (background) threads can run for extended periods of time without affecting page performance. Imagine a while loop that does a very large number of calculations.. so much so that it takes 10 full seconds to finish. If you ran this code on the main thread, your browser would hang.. yuck. However, background threads have no problem running that code!

4. Threads can communicate with one another using Events and Messages.

The following code and simplified thread diagram illustrate the relationship between 3 threads: Our Main UI thread, a child thread, and a grandchild (sub) thread.
###### index.html
```js
var myThread = new Thread("scriptA.js");
```
###### scriptA.js
```js
var mySubThread = new Thread();
```
###### Thread Diagram
![Thread Diagram Image](http://spencer-evans.com/share/github/threadjs/pages/ThreadScope.png "Thread Diagram")
<br/>
This simple diagram illustrates that each thread runs in its own independant space. It has its own set of loaded files and its own set of variables in memory.<br/>
<br/>
Each thread has a reference to any child thread it creates. The child also has a reference to the thread that created it (it's parent). We have 4 references in this example:<br/>
* The main thread has a reference to the child thread via a myThread instance.
* The child thread has a reference to the main thread via the static Thread.parent member.
* The child thread also has a reference to the sub thread via a mySubThread instance.
* The sub thread has a reference to the middle child thread via the static Thread.parent member.

Threads can use these references to communicate with one another. Scroll down to the usage guide to see how its done.
<br/><br/>

<a name="usage"></a>
## Usage Guide
Using a thread.js is really simple. There are essentially five things you can do.
<ol>
<li>Create a thread</li>
<li>Add logic to your thread</li>
<li>Run logic on your thread</li>
<li>Communiate with your thread</li>
<li>Terminate the thread when its done</li>
</ol>
<a name="creatingAThread"></a>
#### Creating a Thread
Simply instantiate a new thread object to create a thread. The thread will typically start running immediately. If all workers are currently in use, it will <a href="#queuing">queue</a> until more worker resources become available. Either way, your thread instance is ready to work with.
###### new Thread();
```js
// Create a thread using the new keyword
var myThread = new Thread();
```
<br/>


<a name="addThreadLogic"></a>
#### Adding Thread Logic
You can add logic to a thread by importing scripts, adding script, or defining script. Importing an external js file is the best way to add lots of code to the thread. Scripts are loaded synchronously within the thread; no other code within the scope of a thread will execute until the script is loaded and evaluated.
###### Importing Scripts
```js
// Loads two scripts into the thread's scope
// A loads, A evaluates, B loads, B evaluates
myThread.importScripts("scriptA.js");
myThread.importScripts("scriptB.js");

// You can also load multiple scripts at once
// A and B load, A evaluates, B evaluates
myThread.importScripts("scriptA.js", "scriptB.js");

// Another option is to specify scripts to load in the constructor
// A and B load, A evaluates, B evaluates
var myThread = new Thread("scriptA.js", "scriptB.js");
```

###### Adding Script
```js
// You can add code to the thread via one big body function
// This is another fast way to add a large amount of code
function threadCode()
{
	// The code within this function will be added to the threads' global scope
}
myThread.addScripts(threadCode);

// Another option is to add a script tag
// If we had the following script tag in our html
// it won't evaluate on the main thread, but can be loaded into the child thread
// <script id="threadCode" type="text/js-worker">console.log('hello from thread!');</script>
myThread.addScripts(document.getElementById("threadCode"));

// One last option is to supply the constructor with function references or tags
// This is pretty powerful as you can mix and match how you add code
// Adds threadCode function, Adds threadCode tag, finally loads and evaluates script A
var myThread = new Thread(threadCode, document.getElementById("threadCode"), "scriptA.js");
```

###### Defining Script
```js
/** An example function to run on a thread. */
function myEchoFunc(a, b)
{
	console.log("Echo on thread: " + a + " " + b);
}

// Copies a named function to the thread's global scope
myThread.define(myEchoFunc);

// Defines a variable in thread's global scope
myThread.define("keyToUniverse", 42); // runs var keyToUniverse = 42;
```
<br/>


<a name="run"></a>
#### Running Thread Logic
You can invoke logic on a thread using a few thread methods.
###### Calling Functions
```js
/** An example function to run on a thread. */
function myEchoFunc(a, b)
{
	console.log("Echo on thread: " + a + " " + b);
}
myThread.define(myEchoFunc);

// You can call any named function that is loaded or defined in the thread
// You may optionally provide a list of paramaters
// Parameters may be any json cloneable object
myThread.call("myEchoFunc", "My name is: ", "Bob"); // supply 2 params
myThread.call("someOtherFunc");                     // no params
myThread.call("myNamespace.anotherFunc");
```

###### Anonymous Functions
```js
// You can execute a function once using exec()
// Exec will temporarily define the function, then call it
// This can be an anonymous function or a named function that
// exists in the main code
myThread.exec(function(param1) { /* do something */ }, "paramValue");
```

###### Constructing Objects
```js
// You can also construct any named function in the thread
// You can optionally provide a list of paramaters
// This example constructs MyClassName with a string and object param
myThread.construct("MyClassName", "param1", { keyToUniverse: 42 });
myThread.construct("myNamespace.MyNamespacedClass");  // You can use namespaces
```

###### Eval
```js
// You can also evaluate any javascript in the threads scope
// There are generally better ways to do things, but this 
// function can be handy from time to time
myThread.eval("console.log('hi from the thread!');");
```
<br/>


<a name="comm"></a>
#### Communicating with Threads
You can communicate with threads using events or messages. Communication is a two way street:

* Communication from Parent to Child
	* Parent code calls functions on the myThread instance
	* Child code catches incoming messages by listening to the Thread.parent static class member
* Communication from Child to Parent
	* Child code calls functions on the Thread.parent static class member
	* Parent code catches incoming messages by listening to the myThread instance

Events are superiour to messages because they can be dispatched to specific event listeners, whereas messages don't have a type.<br/>
<br/>
The examples below send a ping event/message from the main code (parent) to the child thread. The child then responds to the ping by sending a pong event/message back to the parent. 

###### Events Example
```js
/** Defines the code that will run in the thread. */
function threadCode()
{
	/** Handles ping events sent to the thead. */
	function pingHandler(evt) 
	{
		// Send back a pong
		Thread.parent.postEvent("pong", "Hi from thread " + Thread.threadID);
	}
	
	// Watch for ping events from the parent
	Thread.parent.addEventListener("ping", pingHandler);
}

/** Will run in Main window context to handle pong events from the child thread. */
function pongHandler(evt) 
{
	console.log("Received pong from thread!");
	console.log(" Got message: " + evt.data);
}

// Create a new thread and watch for pong events from it
var myThread = new Thread(threadCode);
myThread.addEventListener("pong", pongHandler);

// Send a ping event to the thread
myThread.postEvent("ping");
```

###### Messages Example
```js
/** Defines the code that will run in the thread. */
function threadCode()
{
	/** Handles ping events sent to the thead. */
	function msgHandler(evt) 
	{
		// Send back a pong if the message was a ping
		if (evt.data === "ping")
		{
			Thread.parent.postMessage("pong");
		}
	}
	
	// Watch for ping events from the parent
	Thread.parent.addEventListener(Thread.MESSAGE, msgHandler);
}

/** Will run in Main window context to handle pong events from the child thread. */
function msgHandler(evt) 
{
	// Respond to the message if it was a pong
	if (evt.data === "pong")
	{
		console.log("Received pong from thread!");
		console.log(" Got message: " + evt.data);
	}
}

// Create a new thread and watch for pong events from it
var myThread = new Thread(threadCode);
myThread.addEventListener(Thread.MESSAGE, msgHandler);

// Send a ping event to the thread
myThread.postMessage("ping");
```
<br/>


<a name="termination"></a>
#### Terminating a Thread
Threads use resources that need to be explicitely cleaned up when you're done with the thread. By default, thread.js will only support between 4 and 16 concurrent workers (depending on hardware). Any more than the allowed number, and threads will queue, waiting for existing threads to terminate. Remember to call terminate()- It's super important to clean your room!

There are two ways to terminate a thread, from the parent or from the child. Any fully terminated thread is no longer valid.
###### terminate();
```js
// To terminate a thread instance within the parent, you call terminate on the thread instance
// The thread will immediately terminate, any pending messages to the thread will be ignored
// Trying to interact with a terminated thread will throw an error
myThread.terminate();	// in parent code

// To have a child thread terminate itself, call the static terminate function from within the thread
// This will schedule the thread for termination, pending messages may still arrive until termination
Thread.terminate();	// in thread code
```
<br/>


<a name="examples"></a>
## Examples
We've compiled a couple Thread.js examples that show off using events and performing intensive operations. More examples are sure to come in the future.
* **<a target="_blank" href="http://jsfiddle.net/swevans/mLbzmtm5/13/">JSFiddle Events Example</a>** - Dispatches ping and pong events as shown above
* **<a target="_blank" href="http://jsfiddle.net/swevans/5m6rqsro/9/">JSFiddle Prime Numbers Example</a>** - Performs intensive operations without disrupting animation
<br/>
<br/>


<a name="browsers"></a>
## Browser Support
Thread.js works anywhere that WebWorkers are supported.
* **<a target="_blank" href="http://caniuse.com/#feat=webworkers">Can I Use? Table for Web Workers</a>**

###### Quirks:
<ol>
<li>IE10: <a target="_blank" href="http://www.html5rocks.com/en/tutorials/workers/basics/#toc-inlineworkers">Inline workers</a> are not supported. Thread.js will fall back to url based web workers, loading the library itself as the root code.</li>
<li>IE10: Because IE10 uses url based workers, it is subject to <a target="_blank" href="http://www.html5rocks.com/en/tutorials/cors/">CORS limitations</a>. There may be a fix coming for this in the future, but we'll have to see how much of an issue it is!</li>
</ol>
<br/>


<a name="faq"></a>
## FAQ
**Q: I am calling a function on my thread then terminating the thread and the function never evaluates, why?!**<br/>
**A:** Calling myThread.terminate() terminates the thread immediately. The prior function you're calling via myThread.call() is schedule to be called, but the thread terminates before it does. You should use events or messages to let the parent know the thread is done, OR have the thread terminate itself. 
```js
function threadCode {
	function myFunc()
	{
		// do some things
		
		// now self terminate
		Thread.terminate();
	}
}
var myThread = new Thread(threadCode);
myThread.call("myFunc");
```
<br/>

**Q: I am using many threads and nothing seems to be getting done or a thread never starts, why?!**<br/>
**A:** You're likely creating too many threads that are waiting for one another to finish. Lets say you have four threads; A, B, C, and D. You then create a 5th thread E. The thread code in A, B, C, and D all rely on E to finish, however E will never be able to start because A, B, C, and D are using all available workers. This is thread lock. You should first try to remove this dependancy. If you can't, increase max workers with threadjs.maxWorkers = 16; (be careful with this and don't go over 16!). See the <a href="#queuing">Max Workers and Thread Queuing</a> section below.
<br/>
<br/>

<a name="advanced"></a>
## Advanced Topics
Thread.js is simple enough to pick up quickly, but there are a few advanced topics worth posting.
##### Checking for Suppport
You can check for browser support using:
```js
// Will be true if the Web Worker API is supported
threadjs.isSupported;
```
<br/>

<a name="threadEvents"></a>
##### Thread Events
The Thread class has a few built in events. It is not necessary to use them. They're provided more for debugging than anything else.
```js
/** Code within the parent */
// The start event is dispatched when a thread starts 
// This might be dispatched within the Thread() constructor and thus you can't catch it
// You'll only catch this event if the thread was queued, see Thread Queuing topic
// The event type is a ThreadEvent
myThread.addEventListener(Thread.START, startHandler);

// Catches messages sent from child to parent
// Only applies if you're using Thread.parent.postMessage
// It is recommended that you use postEvent instead
// The event type is a MessageEvent
// Data passed with the message is in the data member of the event
myThread.addEventListener(Thread.MESSAGE, msgFromChildHandler);

// Dispatched whenever a thread actually terminates
// You can use this to tell if your thread self terminated via a static Thread.terminate()
// The event type is a ThreadEvent
myThread.addEventListener(Thread.TERMINATE, terminateHandler);

// Dispatched whenever an error is thrown within the thread code
// The event type is some form of ErrorEvent
myThread.addEventListener(Thread.ERROR, errorHandler);

/** Code within the thread */
// Catches messages sent from parent to child
// Only applies if you're using myThread.postMessage
// It is recommended that you use postEvent instead
// The event type is a MessageEvent
// Data passed with the message is in the data member of the event
Thread.parent.addEventListener(Thread.MESSAGE, msgFromParentHandler);
```
<br/>

<a name="subThreads"></a>
##### Sub Threads (Sub Workers)
Thread.js supports child threads, aka Sub Workers. You may spawn a thread within a thread. The maxWorkers limit and thread queuing are still enforced. See <a href="#queuing">Max Workers and Thread Queuing</a> below. Sub Threads are very-slightly slower to start.<br/>
<p>
Sub threads are dependant on their parent; when the parent terminates, the child will terminate. An example; Your main code in index.html creates myThread, myThread then creates mySubThread, index.html calls myThread.terminate(), both mySubThread and myThread will terminate.
</p>
```js
// Define code for the thread
function myThreadCode() {

	// Define code for the sub thread
	function mySubThreadCode() {}
	
	// Create the sub thread
	var mySubThread = new Thread(mySubThreadCode);
}

// Create the thread, which in turn creates a sub thread
var myThread = new Thread(myThreadCode);

// Terminate myThread, which will also terminate mySubThread
myThread.terminate();
```
<br/>

<a name="threadScope"></a>
##### Thread Scope & Loading within a Thread
<p>
Threads operate in their own execution scope. Thus code must be loaded into the thread even if it already exists in the parent scope. Additionally, thread scope does not have access to the DOM or window.
</p>
<p>
One benefit to loading within a thread is that loading can be done synchronously without disrupting user experience. On the flip side, a drawback is that urls provided to loaders must be absolute. Thread.js makes this simple by providing the Thread.workingDirectory static member. An example below shows how to use it.
</p>
```js
function threadCode()
{
	// load something synchronously within the thread
	// using Thread.workingDirectory and a url that is relative to the page
	var xhttp = new XMLHttpRequest();
  	xhttp.open("GET", Thread.workingDirectory + "myFile.txt", false);
  	xhttp.send();
}

var myThread = new Thread(threadCode);
```
<br/>

<a name="passingData"></a>
##### Passing Data Between Threads
<p>
Objects are passed between threads via cloning. The actual instances of the objects are not shared. This is a limitation of the Web Worker API. An additional limitation is that you cannot pass objects that contain native code (ie HTMLElements).
</p>
<p>
One exception is that you may post native events (like a mouse event) between threads using postEvent(someNativeEvent). This is accomplished by creating a partial copy of the native event as a ThreadEvent.
</p>
<p>
As of now, Thread.js only supports copying data between threads. Transferrable objects are not yet supported.
</p>
<br/>

<a name="asyncLib"></a>
##### Asynchronously Loading Thread.js
It is highly recommended that you load thread.js using a synchronous script tag within your document. If for some reason you must load thread.js using an asynchronous method, you are required to set the threadjs.url property before using Threads. It should point to the location of the thread.js library file.
```js
// ... some code to load and evaluate thread.js

// Set the threadjs url relative to the document
threadjs.url = "pathto/thread.js";
```
<br/>

<a name="CORS"></a>
##### Cross Domain Security (CORS)
It is highly recommended that you host thread.js and your thread code scripts in the same domain as your page. If for some reason you can't, you will lose IE10 support. You may also run into security issues loading your thread code if it is in a different domain than the threadjs library.
<br/>
<br/>

<a name="queuing"></a>
##### Thread Queuing, Max Workers, and Thread Lock
Thread.js only allows a maximum number of workers. This is typically 4 by default, but may go up to 16 depending on device hardware. This limitation is to prevent you from accidentally crashing the browser by creating too many workers. However, you can create as many Thread instances as you want and act on them immediately. This is thanks to thread.js's Thread Queuing functionality.
###### Thread Queuing
<p>
If you create more threads than the allowed number of workers, the threads created most recently will queue until a worker become available when an existing thread terminates. Queued threads will dequeue and start in the order they are created.
</p>
<p>
A Thread.START ("start") event is dispatched by the thread instance when it dequeues. Even if a thread queues, you may call any functions on it. Any functions you call on a queued thread will execute, in order, after the thread starts. If you call terminate on a queued thread, it will never start and no longer be valid.
</p>
<a name="maxWorkers"></a>
###### Max Workers
<p>
The maximum number of workers is safely determined by Thread.js when the library is loaded. It is safest to assume that this value is 4. You can manually increase this number (not recommended) by setting threadjs.maxWorkers. You should probably not set this above 12, and definitely not set this value above 16 for anything you plan to release. Setting this value too high will cause the browser to crash.
</p>
###### Thread Lock
<p>
Thread lock happens when you have active threads which depend on queued threads. This is something you should avidly try to avoid by removing thread dependancies and avoiding sub threads.
</p>
<br/>
An Example:<br/>
Let's say you have four threads; A, B, C, and D. You then create a 5th thread E. The thread code in A, B, C, and D all rely on E to finish, however E will never be able to start because A, B, C, and D are using all available workers. This is thread lock. You should first try to remove this dependancy. If you can't, then your only option is to increase max workers with threadjs.maxWorkers (be careful with this and don't go over 16!). See the <a href="#maxWorkers">Max Workers</a> section above.
<br/>


<a name="optimization"></a>
##### Memory & Traffic Optimization
Code supplied to the thread might be lengthy and heavy to keep in memory. If you define the code inline in your main javascript, the code will be stored in memory on both the parent and child thread. If you use the script tag code definition defined above, the code won't be defined in memory on the main thread. The absolute best way to conserve memory and traffic is to define your thread code in an external js file.
###### Inline Thread Code
```js
// threadCode src will obviously download with the page
// threadCode will exist in memory in the page root and the thread.
function threadCode() {
	// some code
}
var myThread = new Thread(threadCode);
```
###### Tag Defined Thread Code
```html
<html>
	<head>
		 <script id="threadCode" type="text/js-worker">
			// threadCode src will obviously download with the page
			// threadCode will exist in memory only in the thread
			function threadCode() {
				// some code
			}
		</script>
		<script>
			var myThread = new Thread(document.getElementById("threadCode"));
		</script>
	</head>
</html>
```
###### Externally Loaded Thread Code
```js
// threadCode src will only download when the thread starts
// threadCode will only exist in memory within the thread only
var myThread = new Thread("myThreadCode.js");
```
<br/>

<a name="debugging"></a>
##### Debugging & Error Handling
Debugging multithreaded code can be challenging. Luckily Threadjs and Web Workers provide some safety and help. As always.. your browser console is there to help (use F12)! FWIW- we have found Firefox to be the best browser for debugging multithreaded code.
###### Unminified Thread.js
It is best to use the unminified thread.js file while developing or debugging your application.
```html
<!-- Full version, recommended for debugging -->
<script src="pathto/thread.js"></script>
```
###### Disallowing Inline Workers
Inline workers create fictional urls to run code. Threadjs uses inline workers by default. These can be tricky to debug because file name and line information may be lost. Thankfully, you can disable inline workers.
```js
threadjs.allowInlineWorkers = false;	// turn off inline workers
```
###### Catching Errors Generated in the Thread
Thread instances dispatch an error event anytime their thread code throws an error. You can catch it like so:
```js
// Dispatched whenever an error is thrown within the thread code
// The event type is some form of ErrorEvent
myThread.addEventListener(Thread.ERROR, function(errorEvent) {/* do something */} );
```
<br/>


<a name="future"></a>
## Future Changes
There are many different ways to expand upon Thread.js. Feel free to weigh in on future direction by forking the repo, adding a comment, or emailing me at <a target="_blank" href="mailto:evans.spencer@gmail.com">evans.spencer@gmail.com</a>. Here are a few things being considered:
 * Wrapper for objects constructed on the thread via myThread.construct(). Will allow you to call functions on the constructed object.
 * Wrapper for function calls on the thread via myThread.call(). Will allow you to listen for function completion and get the return result.
 * Change importScripts to use XHR such that CORS is supported.
 * Add support for transferrable objects.
 * Add a object sync feature that mirrors an object between two threads.
 * Add support for synchronous threads when workers are not supported.
<br/>
<br/>


<a name="underTheHood"></a>
## Under the Hood
For those who already understand Web Workers, here a few details about how Thread.js works.
###### Worker Types:
* Thread.js only uses dedicated workers.
* Thread.js uses <a target="_blank" href="http://www.html5rocks.com/en/tutorials/workers/basics/#toc-inlineworkers">inline workers</a> whenever possible. IE10 is the only known browser that does not support inline workers.
* Thread.js currently uses the web worker API <a target="_blank" href="https://developer.mozilla.org/en-US/docs/Web/API/WorkerGlobalScope/importScripts">importScripts</a> function to load scripts in a thread. This limits non-inline workers and script importing to the same origin. 
 
###### Max Workers:
* Thread.js uses the navigator.hardwareConcurrency to determine the maximum number of workers allowed. Thread.js enforces a default minimum number of 4 workers and a max of 16. Any number of thread instances can be created, but they will queue until more workers become available. You can override this setting with the threadjs.maxWorkers property.
* Thread.js allows sub-workers but enforces a maximum number of workers by keeping track of all descendant threads within the Main UI process.

###### Base Thread Code:
* Whenever a new worker is created, it is immediately passed all of the threadjs library, making the library available on that thread. 

###### Working Directory, Library URL, and CORS:
* Threadjs maintains a string url to the working directory of the web page. This url is passed to all threads to allow script loading when workers are not running in the page location. You can find this value in Thread.workingDirectory.
* Threadjs needs to know its own library script url. This is determined when the library is loaded by looking at the last script tag loaded in the DOM. If you load thread.js via XHR / jQuery / some other means, you will need to set the threadjs.url property immediately after importing the library.

###### Event System:
* Threadjs has its own tiny, built-in EventTarget like interface called EventDispatcher. It allows Thread.js to dispatch events. 
* Threadjs allows you to partially pass native events between threads by creating a partial copy of the native event as a threadjs ThreadEvent. Thus you can pass myThread.postEvent(mouseEvent) etc.
<br/>
<br/>

<a name="compilingTS"></a>
## Compiling TypeScript
Compiling the typescript is not required to use the library. Should you decide to do so, run the compiler within the src directory. It should pickup the tsconfig.json configuration file and output to www/js/thread.js.

