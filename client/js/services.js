angular.module('starter.services', ['ngResource'])
  .factory('LoopBack', function() {
    return { accessToken: null };
  })
  .factory('User', ['$q', '$resource', 'LoopBack', function($q,
                                                            $resource,
                                                            LoopBack) {
    return $resource('/api/users/:id', {id: '@id'}, {
      login: {
        method: 'POST',
        url: '/api/users/login',
        interceptor: {
          response: function(response) {
            var loginResult = response.data;
            LoopBack.accessToken = loginResult.id;
            return response || $q.when(response);
          }
        }
      },
      logout: {
        method: 'POST',
        url: '/api/users/logout',
        interceptor: {
          response: function(response) {
            LoopBack.accessToken = null;
            return response || $q.when(response);
          }
        }
      }
    });
  }])
  .config(function ($httpProvider) {
    $httpProvider.interceptors.push('requestInterceptor');
  })
  .factory('requestInterceptor', function ($q, LoopBack) {
    return {
           'request': function (config) {
                console.log('config', config);
                if(LoopBack.accessToken) {
                  config.headers.authorization = LoopBack.accessToken;
                }
                return config || $q.when(config);
            }
        }
    });
