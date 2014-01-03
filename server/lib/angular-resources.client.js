// Note: this is a partial file that expects there is a `models` variable
// already defined. `models` should contain a definition of all models
// and shared methods
var module = angular.module('lbModels', ['ngResource']);
module
  .factory('LoopBackAuth', function() {
    return {
      accessToken: null
    };
  })
  .config(function($httpProvider) {
    $httpProvider.interceptors.push('loopbackAuthRequestInterceptor');
  })
  .factory('loopbackAuthRequestInterceptor', function($q, LoopBackAuth) {
    return {
      'request': function(config) {
        console.log('config', config);
        if (LoopBackAuth.accessToken) {
          config.headers.authorization = LoopBackAuth.accessToken;
        }
        return config || $q.when(config);
      }
    }
  });

for (var modelName in models) {
  (function defineFactory(name, meta) {
    module.factory(
      name,
      ['$q', '$resource', 'LoopBackAuth', function($q, $resource, LoopBackAuth) {
        var actions = angular.extend(meta.actions, {});
        if (name === 'User') {
          if (actions.login) {
            actions.login = angular.extend(actions.login, {
              interceptor: {
                response: function(response) {
                  var loginResult = response.data;
                  LoopBackAuth.accessToken = loginResult.id;
                  return response || $q.when(response);
                }
              }
            });
          }

          if (actions.logout) {
            actions.logout = angular.extend(actions.logout, {
              interceptor: {
                response: function(response) {
                  LoopBackAuth.accessToken = null;
                  return response || $q.when(response);
                }
              }
            });
          }
        }

        console.log('creating resource', name, meta.url, meta.paramDefaults, actions);

        var resource = $resource(meta.url, meta.paramDefaults, actions);

        // Angular always calls POST on $save()
        // This hack is based on
        // http://kirkbushell.me/angular-js-using-ng-resource-in-a-more-restful-manner/
        resource.prototype.$save = function() {
          var fn = this.id === undefined ?
            this.$create :
            this.$prototype$updateAttributes;
          fn.apply(this, Array.prototype.slice.call(arguments));
        }
        return resource;
      }]);
  })(modelName, models[modelName]);
}
