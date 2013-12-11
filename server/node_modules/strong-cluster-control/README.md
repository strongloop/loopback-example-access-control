# run-time management of a node cluster

[strong-cluster-control](https://github.com/strongloop/strong-cluster-control)
is a module for run-time management of a node cluster.

It is an extension of the node cluster module, not a replacement, and works
beside it to add the following features:

- runs `size` workers (optionally), and monitors them for unexpected death
- run-time control of cluster through command line and API
- soft shutdown as well as hard termination of workers

It can be added to an existing application using the node cluster module without
modifying how that application is currently starting up or using cluster, and
still make use of additional features.

The controller module allows the cluster to be controlled through the

- clusterctl command line, or
- API calls on the module


## Install

    slnode install strong-cluster-control

The command line:

    slnode install -g strong-cluster-control
    clusterctl --help


## Example

To instantiate cluster-control:

```javascript
var cluster = require('cluster');
var control = require('strong-cluster-control');

// global setup here...

control.start({
    size: control.CPUS
}).on('error', function(er) {
    console.error(er);
});

if(cluster.isWorker) {
    // do work here...
}
```

To control the cluster, assuming `my-server` is running in `/apps/`:

    clusterctl --path /apps/my-server/clusterctl set-size 4
    clusterctl --path /apps/my-server/clusterctl status
    worker count: 4
    worker id 0: { pid: 11454 }
    worker id 1: { pid: 11471 }
    worker id 2: { pid: 11473 }
    worker id 3: { pid: 11475 }

For more in-depth examples, see the [chat server example](https://github.com/strongloop/slnode-examples/tree/master/chat),
and the
[in-source example](https://github.com/strongloop/strong-cluster-control/blob/master/bin/example-master.js).


## clusterctl: command line interface

The `clusterctl` command line utility can be used to control a cluster at
run-time. It defaults to communicating over the `clusterctl` named socket
in the current working directory, but an explicit path or port can be
provided.

It provides the following commands:

- status: reports the status of the cluster workers
- set-size: set cluster size to some number of workers
- disconnect: disconnect all workers
- fork: fork one worker

`disconnect` and `fork` cause the cluster size to change, so new workers will
probably be started or stopped to return the cluster to the set size. They are
primarily for testing and development.


## Controller API

### control = require('strong-cluster-control')

The controller is exported by the `strong-cluster-control` module.

### control.start([options],[callback])

Start the controller.

* `options`: {Object} An options object, see below for supported properties,
  no default, and options object is not required.
* `callback`: {Function} A callback function, it is set as a listener for
  the `'start'` event.

The options are:

* `size`: {Integer} Number of workers that should be running, the default
  is to *not* control the number of workers, see `setSize()`

* `env`: {Object} Environment properties object passed to `cluster.fork()` if
  the controller has to start a worker to resize the cluster, default is null.

* `addr`: {String or Integer} Address to listen on for control, defaults to first of
  `options.path`, `options.port`, or `control.ADDR` that is defined.
* `path`: {String} Path to listen on for control, no default.
* `port`: {Integer} Localhost port to listen on for control, may be necessary to
  use on Windows, no default.

* `shutdownTimeout`: {Milliseconds} Number of milliseconds to wait after
  shutdown before terminating a worker, the default is 5 seconds, see
  `.shutdown()`
* `terminateTimeout`: {Milliseconds} Number of milliseconds to wait after
  terminate before killing a worker, the default is 5 seconds, see
  `.terminate()`

For convenience during setup, it is not necessary to wrap `.start()` in a protective
conditional `if(cluster.isMaster) {control.start()}`, when called in workers it quietly
does nothing but call its callback.

The 'start' event is emitted after the controller is started.

### control.stop([callback])

Stop the controller. Remove event listeners that were set on the `cluster`
module, and stop listening on the control port.

* `callback`: {Function} A callback function, it is set as a listener for
  the `'stop'` event.

The 'stop' event is emitted after the controller is stopped.

### control.loadOptions([defaults])

Load options from configuration files, environment, or command line.

* `defaults`: {Object} Default options, see `start()` for description
  of supported options.

An options object is returned that is suitable for passing directly to
`start()`. How you use it is up to you, but it can be conveniently used to
implement optionally clustered applications, ones that run unclustered when
deployed as single instances, perhaps behind a load balancer, or that can be
deployed as a node cluster.

Here is an example of the above usage pattern:

    // app.js
    var control = require('strong-cluster-control');
    var options = control.loadOptions();
    if(options.clustered && options.isMaster) {
        return control.start(options);
    }

    // Server setup... or any work that should be done in the master if
    // the application is not being clustered, or in the worker if it
    // is being clustered.

The options values are derived from the following configuration sources:

- command line arguments (parsed by optimist): if your app ignores unknown
  options, options can be set on the command line, ex. `node app.js --size=2`
- environment variables prefixed with `cluster_`: note that the variable must be
  lower case, ex. `cluster_size=2 node app.js`
- `.clusterrc` in either json or ini format: can be in the current working
  directory, or any parent paths
- `defaults`: as passed in, if any

This is actually a subset of the possible locations, the
[rc](https://npmjs.org/package/rc) module is used with an `appname` of
"cluster", see it's documentation for more information.

Supported values are those described in `start()`, with a few extensions for
`size`, which may be one of:

1. a positive integer, or a string that converts to a positive integer, as for `start()`
2. `"default"`, or a string containing `"cpu"`, this will be converted to the
   number of cpus, see `control.CPUS`
3. `0`, `"off"`, or anything else that isn't one of the previous values will be
   converted to `0`, and indicate a preference for *not* clustering

The returned options object will contain the following fields that are not
options to `start()`:

- clustered: false if size is 0 (after above conversions), true if a cluster
  size was specified
- isMaster, isWorker: identical to the properties of the same name in the
  cluster module

The combination of the above three allows you to determine if you are a worker,
or not, and if you are a master, if you should start the cluster control module,
or just start the server if clustering was not requested.


### control.setSize(N)

Set the size of the cluster.

* `N`: {Integer or null} The size of the cluster is the number of workers
  that should be maintained online. A size of `null` clears the size, and
  disables the size control feature of the controller.

The cluster size can be set explicitly with `setSize()`, or implicitly through
the `options` provided to `.start()`, or through the control channel.

The size cannot be set until the controller has been started, and will not be
maintained after the cluster has stopped.

Once set, the controller will listen on cluster `fork` and `exit` events,
and resize the cluster back to the set size if necessary. After the cluster has
been resized, the 'resize' event will be emitted.

When a resize is necessary, workers will be started or stopped one-by-one until
the cluster is the set size.

Cluster workers are started with `cluster.fork(control.options.env)`, so the
environment can be set, but must be the same for each worker. After a worker has
been started, the 'startWorker' event will be emitted.

Cluster workers are stopped with `.shutdown()`. After a worker has been stopped,
the 'stopWorker' event will be emitted.

### control.shutdown(id)

Disconnect worker `id` and take increasingly agressive action until it exits.

* `id` {Number} Cluster worker ID, see `cluster.workers` in [cluster docs](http://nodejs.org/docs/latest/api/cluster.html)

The effect of disconnect on a worker is to close all the servers in the worker,
wait for them to close, and then exit. This process may not occur in a timely
fashion if, for example, the server connections do not close. In order to
gracefully close any open connections, a worker may listen to the `SHUTDOWN`
message, see `control.cmd.SHUTDOWN`.

Sends a `SHUTDOWN` message to the identified worker, calls
`worker.disconnect()`, and sets a timer for `control.options.shutdownTimeout`.
If the worker has not exited by that time, calls `.terminate()` on the worker.

### control.terminate(id)

Terminate worker `id`, taking increasingly aggressive action until it exits.

* `id` {Number} Cluster worker ID, see `cluster.workers` in [cluster docs](http://nodejs.org/docs/latest/api/cluster.html)

The effect of sending SIGTERM to a node process should be to cause it to exit.
This may not occur in a timely fashion if, for example, the process is ignoring
SIGTERM, or busy looping.

Calls `worker.kill("SIGTERM")` on the identified worker, and sets a timer for
`control.options.terminateTimeout`. If the worker has not exited by that time,
calls `worker.("SIGKILL")` on the worker.

### control.options

The options set by calling `.start()`.

Visible for diagnostic and logging purposes, do *not* modify the options
directly.

### control.cmd.SHUTDOWN

* {String} `'CLUSTER_CONTROL_shutdown'`

The `SHUTDOWN` message is sent by `.shutdown()` before disconnecting the worker,
and can be used to gracefully close any open connections before the
`control.options.shutdownTimeout` expires.

All connections will be closed at the TCP level when the worker exits or is
terminated, but this message gives the opportunity to close at a more
application-appropriate time, for example, after any outstanding requests have
been completed.

The message format is:

    { cmd: control.cmd.SHUTDOWN }

It can be received in a worker by listening for a `'message'` event with a
matching `cmd` property:

    process.on('message', function(msg) {
        if(msg.cmd === control.cmd.SHUTDOWN) {
            // Close any open connections as soon as they are idle...
        }
    });


### control.ADDR

`'clusterctl'`, the default address of the control server, if none other are
specified through `options`.

### control.CPUS

The number of CPUs reported by node's `os.cpus().length`, this is a good default
for the cluster size, in the absence of application specific analysis of what
would be an optimal number of workers.


### Event: 'start'

Emitted after control has started. Currently, control is considered started
after the 'listening' event has been emitted.

Starting of workers happens in the background, if you are specifically
interested in knowning when all the workers have started, see the 'resize'
event.

### Event: 'error'

* {Error Object}

Emitted when an error occurs. The only current source of errors is the control
protocol, which may require logging of the errors, but should not effect the
operation of the controller.

### Event: 'resize'

* {Integer} size, the number of workers now that resize is complete (will always
  be the same as `cluster.options.size`)

Emitted after a resize of the cluster is complete. At this point, no more
workers will be forked or shutdown by the controller until either the size is
changed or workers fork or exit, see `setSize()`.

### Event: 'startWorker'

* `worker` {Worker object}

Emitted after a worker which was started during a resize comes online, see the
node API documentation for description of `worker` and "online".

### Event: 'stopWorker'

* `worker` {Worker object}
* `code` {Number} the exit code, if it exited normally.
* `signal` {String} the name of the signal if it exited due to signal

Emitted after a worker which was shutdown during a resize exits, see the node
API documentation for a description of `worker`.

The values of `code` and `signal`, as well as of `worker.suicide`, can be used
to determine how gracefully the worker was stopped. See `.terminate()`.

### Event: 'listening'

Emitted when the controller has been bound after calling `server.listen`.

### Event: 'connection'

* {Socket object} The connection object

Emitted when a new connection is made. `socket` is an instance of
`net.Socket`.
