var nf = require('../nodefly');
var proxy = require('../proxy');
var samples = require('../samples');
var counts = require('../counts');
var tiers = require('../tiers');
var topFunctions = require('../topFunctions');
var graphHelper = require('../graphHelper');

/*
 * Instrumentation for LevelDB via leveldown module, which is the de facto
 * canonical module for LevelDB in Node.
 *
 * github: https://github.com/rvagg/node-leveldown
 * npm: https://npmjs.org/package/leveldown
 *
 */
module.exports = function(leveldown) {
  /*
    This is leveldown, as we receive it:
    leveldown()
    leveldown.destroy()
    leveldown.repair()

    We wrap leveldown() to instrument the instance methods of the
    returned Database object.

    These are probably not worth instrumenting:
    leveldown#open()
    leveldown#close()

    These are set up with timers below:
    leveldown#put()
    leveldown#get()
    leveldown#del()

    These should probably be timed:
    leveldown#batch()
    leveldown#approximateSize()
    leveldown#getProperty()

    Spy on #iterator() to attach instrumentation to each iterator instance
    leveldown#iterator()
    iterator#next()
    iterator#end()
  */

  // leveldown()
  function wrappedLeveldown(location) {
    var db = leveldown(location);

    function instrumentAsync(obj, args, method) {
      if (nf.paused) {
        return;
      }

      var time = samples.timer('LevelDown', method);
      var graphNode = graphHelper.startNode('LevelDown', method, nf);
      counts.sample('leveldown');

      // get(key[, options], callback)
      // put(key, value[, options], callback)
      // del(key[, options], callback)
      // batch(operations[, options], callback)
      var key = (method == 'batch' ? args[0].length : args[0]);

      var query = location + '.' + method + ':' + key;

      function handle(obj, args, extra) {
        time.end();

        topFunctions.add('leveldownCalls', query, time.ms);
        graphHelper.updateTimes(graphNode, time);

        if (extra) {
          extra.leveldown = extra.leveldown || 0;
          extra.leveldown += time.ms;
        }

        tiers.sample('leveldown_in', time);
      }

      proxy.callback(args, -1, handle, null, true);
      if (graphNode) {
        nf.currentNode = graphNode.prevNode;
      }
    }

    // TODO: Investigate if we should instead be attaching this instrumentaiton
    //       on to Database's and Iterator's prototypes instead.

    proxy.before(db, ['get', 'put', 'del', 'batch'], instrumentAsync);

    proxy.after(db, 'iterator', function(obj, args, ret) {
      proxy.before(ret, ['next', 'end'], instrumentAsync);
    });

    return db;
  }

  // Need to maintain leveldown's exported API
  wrappedLeveldown.destroy = leveldown.destroy;
  wrappedLeveldown.repair = leveldown.repair;

  return wrappedLeveldown;
};
