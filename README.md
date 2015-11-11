Thread.js
### Multi-threaded Programming with Javascript or TypeScript
*******

## Installation
Include thread.js in your projects like so:
#### Tag Loading
```html
<!-- Full version, recommended for debugging -->
<script src="thread.js"></script>

<!-- Minified version, recommended for release -->
<script src="thread.min.js"></script>
```

### Creating and Destroying Threads
Simply instantiate a new thread object to create a thread. Call terminate to dispose of it.
###### Creation and Disposal
```js
// Create a thread using the new keyword
var myThread = new Thread();

// ... Do something with the thread

// Terminate will dispose the thread and release it's WebWorker resources
myThread.terminate();
```

### Adding Thread Logic
You can add logic to a thread by loading external scripts or defining script via code. Loading an external js file is the quickest way to add lots of logic to a thread. Scripts are loaded synchronously within the thread; no other thread code will execute until the script is loaded and evaluated within the thread's scope.
###### Loading Scripts
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

###### Defining Script
```js
/** An example function to run on a thread. */
function myEchoFunc(a, b)
{
  console.log("Echo on thread: " + a + " " + b);
}

// Copies a named function to the thread's global scope
myThread.defineFunc(myEchoFunc);

// Defines a variable in thread's global scope
myThread.defineVar("myVarName");
```

### Running Thread Logic
You can invoke logic on a thread using a few Thread methods.
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



Thread.js
===========

### Multi-threaded Programming with Javascript or TypeScript
*******

Thread.js is an easy to use library for leveraging the power of parallel computing in JavaScript or TypeScript. Thread.js provides an intuitive, no-hassle interface for creating, interacting with, and disposing of Web Workers. 

# Installation
Include thread.js in your web projects like so:
```html
<script src="threadjs.js"></script>
```

#Usage












<ol>
<li>Worker Queuing - If more than the optimal number of threads are created, later threads will queue until resources become available.</li>
<li>Event Based Messaging - Messages to and from threads are powered by the widly understood EventTarget interface (addEventListener).</li>
</ol>
