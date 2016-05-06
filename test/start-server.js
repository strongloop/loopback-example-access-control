// Copyright IBM Corp. 2015,2016. All Rights Reserved.
// Node module: loopback-example-access-control
// This file is licensed under the Artistic License 2.0.
// License text available at https://opensource.org/licenses/Artistic-2.0

var app = require('../server/server');

module.exports = function(done) {
  if (app.loaded) {
    app.once('started', done);
    app.start();
  } else {
    app.once('loaded', function() {
      app.once('started', done);
      app.start();
    });
  }
};
