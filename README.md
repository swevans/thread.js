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
Using a thread.js is really simple. There are essentially four steps.
<ol>
<li>Create a thread</li>
<li>Add logic to your thread</li>
<li>Run logic on your thread</li>
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
myThread.define("myVarName", 99); // runs var myVarName = 99;
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
myThread.construct("MyClassName", "param1", {someIndex: 99});
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
You can communicate with threads using events or messages. Events are more flexible and powerful. The event example below sends a ping event to a thread and the thread sends a pong event back.
###### Posting and Catching Events in Main (UI) Thread
```js
////// FILE: index.html
// Start a thread to communicate with
var myThread = new Thread("myThreadCode.js"); // load thread code

/** 
 * Handles "pong" events from the parent. Sends back a pong event.
 * @param evt The event that was supplied, in this case a ThreadEvent.
 *  supplied data is stored in the .data member of the event.
 */
function pongHandler(evt)
{
  // Do something with the data
  var responseData = evt.data;
  console.log("Main thread got pong: " + responseData.text);
}

// Watch for a pong event on the thread
myThread.addEventListener("pong", pongHandler);

// Post an event with a type and some optional data
var someData = { text: "hello world!" };
myThread.postEvent("ping", someData);
```
##### Posting and Catching Events in Child Thread
```js
////// FILE: myThreadCode.js
/** 
 * Handles "ping" events from the parent. Sends back a pong event.
 * @param evt The event that was supplied, in this case a ThreadEvent. 
 *  supplied data is stored in the .data member of the event.
 */
function pingHandler(evt)
{
  // Do something with the data
  var someData = evt.data;
  console.log("Thread got ping: " + someData.text);
  
  // Send back pong event with other data
  var responseData = { text: someData.text + " received" }
  Thread.parent.postEvent("pong", responseData);
}

// Listen for the ping event from the parent
Thread.parent.addEventListener("ping", pingHandler);
```




<br/>



<ol>
<li>Worker Queuing - If more than the optimal number of threads are created, later threads will queue until resources become available.</li>
<li>Event Based Messaging - Messages to and from threads are powered by the widly understood EventTarget interface (addEventListener).</li>
</ol>
