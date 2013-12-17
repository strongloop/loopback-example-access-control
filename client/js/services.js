angular.module('starter.services', ['ngResource'])
  .factory('User', ['$resource', function($resource) {
    return $resource('/api/users/:id', {id: '@id'}, {
      login: {
        method: 'POST',
        url: '/api/users/login'
      },
      logout: {
        method: 'POST',
        url: '/api/users/logout'
      }
    });
  }])
  .config(function ($httpProvider) {
    $httpProvider.interceptors.push('requestInterceptor');
  })
  .factory('requestInterceptor', function ($q, $rootScope) {
    return {
           'request': function (config) {
                console.log('config', config);
                if($rootScope.accessToken) {
                  config.headers.authorization = $rootScope.accessToken;
                }
                return config || $q.when(config);
            }
        }
    });
