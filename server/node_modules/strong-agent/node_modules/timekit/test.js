var tk = require('/usr/local/node-timekit/build/Release/timekit.node');


var start = tk.time();
var startCpu = tk.cputime();
console.time('date');

setTimeout(function() {
  for(var i = 0; i < 1000000; i++) {
    tk.time();
    tk.cputime();
  }

  console.timeEnd('date');
  console.log('time', tk.time() - start);
  console.log('cputime', tk.cputime() - startCpu);
  console.log(tk.cputime(), tk.time())
}, 3000);


tk.startV8Profiler();

function test3(count) {
  if(count < 10000) {
    test3(count + 1)
  }
  
  var b = 3 + 4;
}

function test2() {
  var a = 1 + 2;
}

function test1() {
  test3(0);

  for(var i = 0; i < 100000000; i++) {
    test2();
  }

}

test1();

tk.stopV8Profiler(function(parentNodeUid, nodeUid, totalSamplesCount, functionName, scriptResourceName, lineNumber) {
  console.log(parentNodeUid, nodeUid, totalSamplesCount, functionName, scriptResourceName, lineNumber);
});


