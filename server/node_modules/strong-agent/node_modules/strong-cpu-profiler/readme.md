# strong-profiler

Provides bindings for the v8 profiler in node.js

## Installation

    npm install strong-cpu-profiler

We now include node v0.10 binaries for a number of platforms.  During the
install, node-gyp will attempt to build the module for your platform.  If it
fails (see builderror.log), the module will still be installed, but will
attempt to load up an appropriate pre-built binary for your platform if there
is one available.

## Usage

    var profiler = require('strong-cpu-profiler');

## API

    profiler.startProfiling([name])                   // start cpu profiling
    var cpuProfile = profiler.stopProfiling([name])   // stop cpu profiling
