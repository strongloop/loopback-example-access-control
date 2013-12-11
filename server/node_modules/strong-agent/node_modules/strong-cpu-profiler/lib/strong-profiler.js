// Precompile the profiler module for 4 platforms: Windows, Solaris/SunOS, Linux, OSX
// both 32 and 64 bit architectures
//
// lib_ver (example: 'v0.10.12') indicates the version (.12)
// that the library was compiled under.
//
// we first try a locally compiled version; failing that we'll look for a
// precompiled version

var version_map = {
  'v0.10.*': 'v0.10.12'
};
var platform = process.platform;
var key, lib_ver;

if (platform === 'solaris') platform = 'sunos';

for (key in version_map) {
  if (RegExp(key).test(process.version)) {
    lib_ver = version_map[key];
  }
}

// if lib_ver stays undefined require will fail and we'll catch it
// same behaviour when there's a new version of node and we haven't 
// compiled for it yet
var modpath = '../compiled/' + platform + '/' + process.arch + '/' + lib_ver
  + '/profiler';
var buildpath = '../build/Release/profiler';
var binding

// try local build dir in case node-gyp was successful
try { binding = require(buildpath); }
catch (err) {
  // Try pre-built modules
  try { binding = require(modpath); }
  catch (err) {
    // stub out the API functions in case we were unable to load the native
    // module, which will prevent it from blowing up
    binding = {
      takeSnapshot: function(){},
      startProfiling: function(){},
      stopProfiling: function(){}
    }
    console.log('unable to load native module "profiler.node" from ' +
      buildpath + ' or ' + modpath);
  }
}

function extend (target) {
  var sources = Array.prototype.slice.call(arguments, 1);
  sources.forEach(function (source) {
    Object.keys(source).forEach(function (key) {
      target[key] = source[key];
    });
  });
  return target;
}

function CpuProfile() {}

function inspectorObjectFor(node) {
  var i, count, child;
  var result = extend({
    numberOfCalls: 0
    , visible: true
    , children: []
  }, node);
  
  for (i = 0, count = node.childrenCount; i < count; i++) {
    child = node.getChild(i);
    result.children.push(inspectorObjectFor(child));
  }
  
  return result;
}

CpuProfile.prototype.getTopDownRoot = function() {
  return inspectorObjectFor(this.topRoot);
};

CpuProfile.prototype.getBottomUpRoot = function() {
  return inspectorObjectFor(this.bottomRoot);
};

var cpuCache = [];

exports.startProfiling = function(name) {
  if (!name || !name.length) {
    name = 'org.nodejs.profiles.cpu.user-initiated.' + (cpuCache.length + 1);
  }

  binding.startProfiling(name);
};

exports.stopProfiling = function(name) {
  name = name ? name : '';
  var profile = binding.stopProfiling(name);
  profile.__proto__ = CpuProfile.prototype;
  cpuCache.push(profile);
  return profile;
};

exports.getProfile = function(index) {
  return cpuCache[index];
};

exports.findProfile = function(uid) {
  return cpuCache.filter(function(s) {return s.uid === uid;})[0];
};

exports.profileCount = function() {
  return cpuCache.length;
};

exports.deleteAllProfiles = function() {
  cpuCache = [];
  binding.deleteAllProfiles();
};

process.profiler = exports;
