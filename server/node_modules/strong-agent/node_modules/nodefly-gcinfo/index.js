// Today we precompile nodefly-gcinfo module for 4 platforms: Windows, Solaris/SunOS, Linux, OSX
// both 32 and 64 bit architectures.
//
// lib_ver (example: 'v0.8.12') indicates the exact minor version (.12) (or is it micro?)
// that the library was compiled under.
//
// If we can't find the mapping we don't try a default compiled version like we used to

var version_map = {
	'v0.6.*': 'v0.6.9',
	'v0.8.*': 'v0.8.12',
	'v0.9.*': 'v0.9.3',
	'v0.10.*': 'v0.10.0'
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
var modpath = "./compiled/" + platform + "/" + process.arch + "/" + lib_ver + "/gcinfo";

try {
	module.exports = require(modpath);
}
catch (err) {
	module.exports = { onGC: function(){} }
}