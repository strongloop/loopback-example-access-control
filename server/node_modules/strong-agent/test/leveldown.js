var should = require('should'),
    sinon = require('sinon');
/* global describe, it, beforeEach, afterEach */

var nf = require('../lib/nodefly');
var proxy = require('../lib/proxy');
var samples = require('../lib/samples');
var counts = require('../lib/counts');
var tiers = require('../lib/tiers');
var topFunctions = require('../lib/topFunctions');
var graphHelper = require('../lib/graphHelper');

// Ouch.
proxy.init();
counts.init();
tiers.init();

var leveldownWrapper = require('../lib/wrapping_probes/leveldown');

var mockIterator = {
  next: function(cb) { setImmediate(cb); },
  end: function(cb) { setImmediate(cb); }
};

var mockDB = {
  put: function(k, v, cb) { setImmediate(cb); },
  get: function(k, cb) { setImmediate(cb); },
  del: function(k, cb) { setImmediate(cb); },
  batch: function(ops, cb) { setImmediate(cb); },
  iterator: function() { return mockIterator; }
};

function mockLeveldown(location) {
  return mockDB;
}

mockLeveldown.destroy = function() { };
mockLeveldown.repair = function() { };

describe('leveldown wrapper transparency', function() {
  it('has the same signature as the original', function() {
    var wrapped = leveldownWrapper(mockLeveldown);
    should(wrapped.arity == mockLeveldown.arity);
  });

  it('preserves original .destroy and .repair properties', function() {
    var wrapped = leveldownWrapper(mockLeveldown);
    should(wrapped.destroy === mockLeveldown.destroy);
    should(wrapped.repair === mockLeveldown.repair);
  });

  it('intercepts the returned db object from leveldown()', function() {
    var wrapped = leveldownWrapper(mockLeveldown);
    var db = wrapped('db.location');
    should.exist(db.get);
    should.exist(db.put);
    should.exist(db.del);
  });
});

describe('wraped leveldown()', function() {
  var leveldown = leveldownWrapper(mockLeveldown);
  var db = leveldown('db.dir');

  beforeEach(function (){
    sinon.spy(topFunctions, 'add');
    sinon.spy(graphHelper, 'updateTimes');
  });
  afterEach(function() {
    topFunctions.add.restore();
    graphHelper.updateTimes.restore();
  });

  describe('each database instance', function() {

    it('records topFunction entry for #put()', function(done) {
      // TODO: query should be db.dir.put.key
      db.put('key', 'val', function() {
        should(topFunctions.add.calledOnce);
        done();
      });
    });

    it('records topFunction entry for #get()', function(done) {
      // TODO: query should be db.dir.get.key
      db.get('key', function() {
        should(topFunctions.add.calledOnce);
        done();
      });
    });

    it('records topFunction entry for #del()', function(done) {
      // TODO: query should be db.dir.del.key
      db.del('key', function() {
        should(topFunctions.add.calledOnce);
        done();
      });
    });

    it('records topFunction entry for #batch()', function(done) {
      // TODO: query should be db.dir.batch.<actions list length>
      db.batch([], function() {
        should(topFunctions.add.calledOnce);
        done();
      });
    });

    it('graphs #put() times', function(done) {
      db.put('key', 'val', function() {
        should(graphHelper.updateTimes.calledOnce);
        done();
      });
    });

    it('graphs #get() times', function(done) {
      db.get('key', function() {
        should(graphHelper.updateTimes.calledOnce);
        done();
      });
    });

    it('graphs #del() times', function(done) {
      db.del('key', function() {
        should(graphHelper.updateTimes.calledOnce);
        done();
      });
    });

    it('graphs #batch() times', function(done) {
      db.batch([], function() {
        should(graphHelper.updateTimes.calledOnce);
        done();
      });
    });

  });

  describe('each iterator instance', function() {
    var iter = db.iterator();

    it('adds topFunction entry for #next()', function(done) {
      iter.next(function() {
        should(topFunctions.add.calledOnce);
        done();
      });
    });

    it('adds topFunction entry for #end()', function(done) {
      iter.end(function() {
        should(topFunctions.add.calledOnce);
        done();
      });
    });

    it('adds a graphHelper time for #next()', function(done) {
      iter.next(function() {
        should(graphHelper.updateTimes.calledOnce);
        done();
      });
    });

    it('adds a graphHelper time for #end()', function(done) {
      iter.end(function() {
        should(graphHelper.updateTimes.calledOnce);
        done();
      });
    });

  });
});
