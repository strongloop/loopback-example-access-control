# nodefly-uvmon #

Native plugin monitoring the libuv event loop.  Used as part of strong-agent.

The npm release includes compiled binaries for node 0.10.x for several
platforms.  By default, node-gyp will attempt to compile the module
locally and will use that version first before falling back on the pre-built
binaries that are included under the compiled/ subdirectory.

Check builderror.log after install if the module isn't working correctly.

Works on node 0.8.x and up.
