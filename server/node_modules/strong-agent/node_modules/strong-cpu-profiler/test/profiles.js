var should = require('should');
var profiler = require('../');

describe('profiles', function () {
  var test;

  function validateNode (node) {
    var numbers = [
      'childrenCount'
      , 'callUid'
      , 'selfSamplesCount'
      , 'totalSamplesCount'
      , 'selfTime'
      , 'totalTime'
      , 'lineNumber'
    ];
    numbers.forEach(function (num) {
      node[num].should.be.a('number');
    });
    node.scriptName.should.be.a('string');
    node.functionName.should.be.a('string');

    if (Array.isArray(node.children)) {
      node.children.forEach(validateNode);
    }
  }

  it('should export profiling methods', function () {
    should.exist(profiler.startProfiling);
    profiler.startProfiling.should.be.a('function');

    should.exist(profiler.startProfiling);
    profiler.stopProfiling.should.be.a('function');
  });

  it('create a profile result', function (next) {
    profiler.startProfiling('test');
    setTimeout(function () {
      test = profiler.stopProfiling('test');
      test.title.should.equal('test');
      test.uid.should.be.above(0);
      next();
    }, 100);
  });

  it('should contain delete method', function () {
    should.exist(test.delete);
    test.delete.should.be.a('function');
  });

  it('should contain bottom and top roots', function () {
    should.exist(test.bottomRoot);
    should.exist(test.topRoot);
  });

  it('should have correct root contents', function () {
    ['bottomRoot','topRoot'].forEach(function (type) {
      validateNode(test[type]);
    });
  });

  it('should have a getChild method for each root', function () {
    ['bottomRoot','topRoot'].forEach(function (type) {
      should.exist(test[type].getChild);
      test[type].getChild.should.be.a('function');
    });
  });

  it('should getChild correctly', function () {
    ['bottomRoot','topRoot'].forEach(function (type) {
      var child = test[type].getChild(0);
      validateNode(child);
    });
  });

  it('should getTopDownRoot and getBottomUpRoot correctly', function () {
    ['getTopDownRoot','getBottomUpRoot'].forEach(function (call) {
      var tree = test[call]();
      validateNode(tree);
    });
  });

});
