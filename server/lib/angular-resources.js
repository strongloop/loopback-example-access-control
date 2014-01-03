var fs = require('fs');
var format = require('util').format;

var clientFileName = require.resolve('./angular-resources.client.js');
var clientScript = fs.readFileSync(clientFileName, { encoding: 'utf8' });

var scriptFormat =
  '(function() {\n' +
    '"use strict";\n\n' +
    'var models = %s\n' +
    '%s\n' +
    '})();\n';

exports = module.exports = function angularResources(app, apiPath) {
  return function(req, res, next) {
    var models = describeModels(app, apiPath);

    var script = format(
      scriptFormat,
      JSON.stringify(models, null, 2),
      clientScript
    );

    res.set('Content-Type', 'application/javascript');
    res.send(script);
  }
}

function describeModels(app, apiPath) {
  var remotes = app.remotes();
  var allClasses = remotes.classes();
  var allRoutes = remotes.handler('rest').adapter.allRoutes();

  var result = {};

  allRoutes.forEach(function(route) {
    var methodParts = route.method.split('.');
    var classPart = methodParts[0];
    var methodName = methodParts.slice(1).join('$');

    var classDef = allClasses.filter(function (item) {
      return item.name === classPart;
    })[0];


    var className = classDef && classDef.ctor.definition && classDef.ctor.definition.name;
    if (!className) {
      return; // not a LoopBack model
    }

    // Ensure the first letter is upper-case
    var className = className[0].toUpperCase() + className.slice(1);

    var modelDesc = result[className];
    if (!modelDesc) {
      modelDesc = result[className] = {
        url: undefined,
        paramDefaults: undefined,
        actions: {}
      };
    }

    var fullPath = apiPath + route.path;


    if (methodName == 'findById') {
      // findById should be mounted at the base REST path, e.g. /users/:id
      modelDesc.url = fullPath;
      // TODO - defaults should come from `route.accepts` or even class data
      modelDesc.paramDefaults = { id: '@id' };
    }

    modelDesc.actions[methodName] = {
      url: apiPath + route.path,
      method: getMethodFromVerb(route.verb),
      // TODO(bajtos) convert route accepts to angular params (?)
      isArray: isReturningArray(route.returns)
    };
  });

  return result;
}

function getMethodFromVerb(verb) {
  if (verb === 'all') return 'POST';
  return verb.toUpperCase();
}

function isReturningArray(routeReturns) {
  return routeReturns && routeReturns.length == 1 &&
    routeReturns[0].root  &&
    routeReturns[0].type === 'array' ? true : undefined;
}
