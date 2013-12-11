var should = require('should');
var util = require('util');

describe("Agent CPU profiler", function() {
  var cpuProf = require('../lib/profilers/cpu');

  it("starts profiling", function(done) {
    cpuProf.start();
    done();
  });

  it("stops profiling", function(done) {
    var j=1;
    for(var i=0; i<1000000; i++) {
      j = (j+i)*(j+i);
    }
    cpuProf.stop(function(data){
      should.exist(data);
      data.should.have.property('childrenCount');
      data.childrenCount.should.be.above(0);
      data.should.have.property('totalSamplesCount');
      data.totalSamplesCount.should.be.above(0);
      data.should.have.property('totalTime');
      data.totalTime.should.be.above(0);
      data.should.have.property('children');
      data.children.should.be.an.instanceOf(Array);
      //console.log(util.inspect(data));
      done();
    });
  });
});
