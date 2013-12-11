/*!
 * Adds dynamically-updated docs as /explorer
 */
var path = require('path');
var loopback = require('loopback');
var swagger = require('loopback/node_modules/strong-remoting/ext/swagger');
var express = require('loopback/node_modules/express');
var STATIC_ROOT = path.join(__dirname, 'public');

module.exports = explorer;

/**
 * Example usage:
 *
 * var explorer = require('loopback-explorer');
 * app.use('/explorer', explorer(app));
 */

function explorer(loopbackApplication, options) {
  var options = options || {};
  var remotes = loopbackApplication.remotes();
  swagger(remotes, options);

  var app = express();
  app.get('/config.json', function(req, res) {
    res.send({
      discoveryUrl: (options.basePath || '') + '/swagger/resources'
    });
  });
  app.use(loopback.static(STATIC_ROOT));
  return app;
}
