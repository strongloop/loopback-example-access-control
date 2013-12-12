angular.module('starter.controllers', [])

.controller('AppCtrl', function($scope) {
  $scope.title = 'Overview';

  $scope.options = [
    {text: 'Logout'},
    {text: 'Transfer Money'}
  ]

  $scope.toggleLeft = function() {
    $scope.sideMenuController.toggleLeft();
  };

})

// A simple controller that fetches a list of data
.controller('PetsTabCtrl', function($scope, Pets) {
  // "Pets" is a service returning mock data (services.js)
  $scope.pets = Pets.all();

  $scope.$on('tab.shown', function() {
    // Might do a load here
  });
  $scope.$on('tab.hidden', function() {
    // Might recycle content here
  });
})

// A simple controller that shows a tapped item's data
.controller('RegisterCtrl', function($scope, $routeParams, Pets) {


});
