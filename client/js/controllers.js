angular.module('starter.controllers', [])

.controller('AppCtrl', function($rootScope, $scope, User, $location) {
  $scope.currentUser =
  $rootScope.currentUser = User.get({id: $rootScope.currentUserId}, function() {
    // success
  }, function() {
    console.log('User.get() err', arguments);
  });

  $scope.options = [
    {text: 'Logout', action: function() {
      User.logout(function() {
        $scope.currentUser =
        $rootScope.currentUser =
        $rootScope.currentUserId = null;
        $location.path('/');
      });
    }}
  ];

  $scope.toggleLeft = function() {
    $scope.sideMenuController.toggleLeft();
  };
})

.controller('LoginCtrl', function($rootScope, $scope, $routeParams, User, $location) {
  $scope.registration = {};
  $scope.credentials = {
    email: 'foo@bar.com',
    password: '123456'
  };

  $scope.login = function() {
    $scope.loginResult = User.login($scope.credentials,
      function() {
        $rootScope.currentUserId = $scope.loginResult.userId;
        $location.path('/');
      },
      function(res) {
        $scope.loginError = res.data.error;
      }
    );
  }
  $scope.register = function() {
    $scope.user = User.save($scope.registration,
      function() {
        // success
      },
      function(res) {
        $scope.registerError = res.data.error;
      }
    );
  }
});
