var should = require('should');
var fs = require('fs');

describe('Module loading from various locations', function() {

  var module_name = 'uvmon';

  var base = process.cwd();
  var buildPath = 'build/Release/' + module_name;
  var compiledPath = 'compiled/' + process.platform + '/'
    + process.arch + '/' + process.version + '/' + module_name;
  var compiledFile = base + '/' + compiledPath + '.node';
  var buildFile = base + '/' + buildPath + '.node';
  var compiledModule = base + '/' + compiledPath;
  var buildModule = base + '/' + buildPath;
  var baseModule = base + '/index.js';

  function loadAndTest(path, callback) {
    var uvmon = require(path);
    uvmon.should.have.property('getData');
    uvmon.getData.should.be.a('function');
    var ret = uvmon.getData();
    ret.should.have.property('count');
    ret.should.have.property('sum_ms');
    ret.should.have.property('slowest_ms');
    // call this to properly unload the check_cb - only need it when we're
    // doing funky multiple versions of this module at once
    uvmon.stop();
    callback();
  }

  it('works from ' + buildModule, function(done) {
    loadAndTest(buildModule, done);
  });

  it('loads from index.js when built locally', function(done) {
    loadAndTest(baseModule, done);
  });

  it('gets moved to ./compiled/... subdirectory', function(done) {
    fs.rename(buildFile, compiledFile, function(err) {
      if (err) {
        throw err;
      } else {
        done();
      }
    });
  });

  it('works from ' + compiledModule, function(done) {
    loadAndTest(compiledModule, done);
  });

  it('loads from index.js when precompiled', function(done) {
    loadAndTest(baseModule, done);
  });
});