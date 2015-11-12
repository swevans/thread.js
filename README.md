# Thread.js
**<p>Multi-threaded Programming with Javascript or TypeScript</p>**
<p>
Thread.js is an easy to use library for leveraging the power of parallel computing in JavaScript or TypeScript. Thread.js provides an intuitive, no-hassle interface for creating, interacting with, and disposing of Web Workers. 
</p>
<br/>


## Download
Download the latest versions of Thread.js or pull from the repo:
###### Latest Release
<pre>
Minified: <a href="http://github.com">thread.min.js</a>
Unminified: <a href="http://github.com">thread.js</a>
GitHub: <a href="https://github.com/swevans/thread.js">/swevans/thread.js</a>
</pre>
<br/>


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


## Usage
Using a thread.js is really simple. There are essentially five things you can do.
<ol>
<li>Create a thread</li>
<li>Add logic to your thread</li>
<li>Run logic on your thread</li>
<li>Communiate with your thread<li>
<li>Terminate the thread when its done</li>
</ol>
#### Creating a Thread
Simply instantiate a new thread object to create a thread. The thread might start immediately or queue until more worker resources become available. Either way, your thread instance is ready to work with.
###### new Thread();
```js
// Create a thread using the new keyword
var myThread = new Thread();
```
<br/>


#### Adding Thread Logic
You can add logic to a thread by loading importing scripts, adding script, or defining script. Importing an external js file is the best way to add lots of code to the thread. Scripts are loaded synchronously within the thread; no other thread code will execute until the script is loaded and evaluated within the thread's scope.
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
myThread.addScript(threadCode);

// Another option is to add a script tag
// If we had the following script tag in our html
// it won't evaluate on the main thread, but can be loaded into the child thread
// <script id="threadCode" type="text/js-worker">console.log('hello from thread!');</script>
myThread.addScript(document.getElementById("threadCode"));
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


#### Running Thread Logic
You can invoke logic on a thread using a few thread methods.
###### Calling Functions
```js
// You can call any named function that is loaded or defined in the thread
// You may optionally provide a list of paramaters
// Parameters may be any json cloneable object
myThread.call("myEchoFunc", "My name is: ", "Bob"); // supply 2 params
myThread.call("someOtherFunc");                     // no params
myThread.call("myNamespace.anotherFunc");
```

###### Anonymous Functions
```js
// You can also temporarily define a function and call it once
// You can pass the name of a named function or an anonymouse function
// Exec will temporarily define the function, then call it
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


#### Communicating with Threads
You can communicate with threads using events or messages. Communication is a two way street:

* Communication from Parent to Child
	* Parent code calls functions on the myThread instance
	* Child code catches incoming messages by listening to the Thread.parent static class member
* Communication from Child to Parent
	* Child code calls functions on the Thread.parent static class member
	* Parent code catches incoming messages by listening to the myThread instance

Events are superiour to messages because they can be dispatched to specific event listeners, whereas messages don't have a type.

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
var myThread = new Thread();
myThread.addEventListener("pong", pongHandler);

// Add code to the thread
myThread.addScript(threadCode);

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
var myThread = new Thread();
myThread.addEventListener(Thread.MESSAGE, msgHandler);

// Add code to the thread
myThread.addScript(threadCode);

// Send a ping event to the thread
myThread.postMessage("ping");
```
<br/>


#### Terminating a Thread
Threads use resources that need to be explicitely cleaned up when you're done with the thread. Thread.js by default will only support between 4 and 16 concurrent workers depending on hardware. Any more than the allowed number, and threads will queue, waiting for existing threads to terminate. It's super important to clean your room!

There are two ways to terminate a thread, from the parent or from the child.
###### terminate();
```js
// To terminate a thread instance within the parent by calling terminate on the thread
// The thread will immediately terminate, any pending messages to the thread will be ignored
// Trying to interact with a terminated thread will throw an error
myThread.terminate();	// in parent code

// To have a child thread terminate itself, call the static terminate function from within the thread
// This will schedule the thread for termination, pending messages may still arrive until termination
Thread.terminate();	// in thread code
```
<br/>


## Examples
We've compiled a couple Thread.js examples that show off using events and performing intensive operations. More examples are sure to come in the future.
* **<a href="http://jsfiddle.net/swevans/mLbzmtm5/12/">JSFiddle Events Example</a>** - Dispatches ping and pong events as shown above
* **<a href="http://jsfiddle.net/swevans/5m6rqsro/8/">JSFiddle Prime Numbers Example</a>** - Performs intensive operations without disrupting animation
<br/>
<br/>


## Browser Support
Thread.js works anywhere that WebWorkers are supported.
* **<a href="http://caniuse.com/#feat=webworkers">Can I Use? Table for Web Workers</a>**

##### Quirks:
<ol>
<li>IE10: Inline workers (via URL.createObjectURL and new Blob()) are not supported. Thread.js will fall back to url based web workers, loading the library itself as the root code.</li>
<li>IE10: Because IE10 uses url based workers, it is subject to <a href="http://www.html5rocks.com/en/tutorials/cors/">CORS limitations</a>. There may be a fix coming for this in the future, but we'll have to see how much of an issue it is!</li>
</ol>


<br/>
