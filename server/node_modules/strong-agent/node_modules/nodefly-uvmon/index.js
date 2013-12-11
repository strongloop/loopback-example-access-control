// Precompile the profiler module for 4 platforms: Windows, Solaris/SunOS,
// Linux, OSX on both 32 and 64 bit architectures where relevant
//
// lib_ver (example: 'v0.10.12') indicates the version (.12)
// that the library was compiled under.
//
// we first try a locally compiled version; failing that we'll look for a
// precompiled version

var module_name = "uvmon";

// Need to always build under the same verisons, or remove the old directories
// and update to new ones when we use a different version on the same minor
// release number.

var version_map = {
  'v0.10.*': 'v0.10.12'
  }
  , platform = process.platform
  , key
  , lib_ver
  ;

if (platform == 'solaris') platform = 'sunos';

for (key in version_map) {
  if (RegExp(key).test(process.version)) {
    lib_ver = version_map[key];
  }
}

// if lib_ver stays undefined require will fail and we'll catch it
// same behaviour when there's a new version of node and we haven't 
// compiled for it yet
var modpath = "./compiled/" + platform + "/" + process.arch + "/" + lib_ver
  + "/" + module_name;
var buildpath = "./build/Release/" + module_name;

try {
  // try local build dir in case node-gyp was successful
  module.exports = require(buildpath);
}
catch (err) {
  try {
    module.exports = require(modpath);
  }
  catch (err) {
    // stub out the API functions in case we were unable to load the native
    // module, which will prevent it from blowing up
    module.exports = { getData: function(){} }
    console.log("Unable to load native module " + module_name
      + "; some features may be unavailable without compiling it.");
  }
}
