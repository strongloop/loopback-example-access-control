angular.module('starter.controllers', [])

.controller('AppCtrl', function($rootScope, $scope, User) {
  $scope.title = 'Overview';

  $rootScope.currentUser = User.get({id: $rootScope.currentUserId}, function() {
    console.log(arguments);
  }, function() {
    console.log('err', arguments);
  });

  $scope.options = [
    {text: 'Logout'},
    {text: 'Transfer Money'}
  ];

  $scope.availableCash = 4987899387;

  $scope.transactions = [
    {debit: 200.85, pos: 'Some Store Somewhere'},
    {credit: 10.95, pos: 'Some Store Somewhere'},
    {debit: 89.99, pos: 'Some Store Somewhere'},
    {debit: 12.28, pos: 'Some Store Somewhere'}
  ];

  $scope.toggleLeft = function() {
    $scope.sideMenuController.toggleLeft();
  };
})

.controller('LoginCtrl', function($rootScope, $scope, $routeParams, User, $location) {
  $scope.registration = {};
  $scope.credentials = {};

  $scope.login = function() {
    $scope.loginResult = User.login($scope.credentials,
      function() {
        $rootScope.accessToken = $scope.loginResult.id;
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
