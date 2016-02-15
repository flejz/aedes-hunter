var app;

// initializes angular js
(function() {
  'use strict';
  app = angular.module('app', ['ngMaterial']).config(function(
    $mdThemingProvider) {
    $mdThemingProvider.theme('altTheme')
      .primaryPalette('deep-purple')
      .accentPalette('deep-purple')
      .warnPalette('deep-purple');
    $mdThemingProvider.theme('chikungunyaTheme')
      .primaryPalette('deep-orange')
      .accentPalette('deep-orange')
      .warnPalette('deep-orange');
    $mdThemingProvider.theme('dengueTheme')
      .primaryPalette('cyan')
      .accentPalette('cyan')
      .warnPalette('cyan');
    $mdThemingProvider.theme('zikaTheme')
      .primaryPalette('lime')
      .accentPalette('lime')
      .warnPalette('lime');
  });
  app.controller('GpsCtrl', function($scope, $mdDialog, $timeout) {
    var self = this;
    self.tooltipVisible = false;

    // gets the gps location
    $scope.getLocation = function() {

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function showPosition(
          position) {

          //getting the latlong, adding to the map and zoom to it
          var latlng = [position.coords.latitude, position.coords.longitude];
          var marker = L.marker(latlng).addTo(map);
          map.setView(latlng, 15);

        });
      } else {
        alert("Geolocation is not supported by this browser.");
      }


    };

  });
  app.controller('TypeCtrl', function($scope, $mdDialog, $timeout) {
    var self = this;
    self.topDirections = ['left', 'up'];
    self.bottomDirections = ['down', 'right'];
    self.isOpen = false;
    self.availableModes = ['md-fling', 'md-scale'];
    self.selectedMode = 'md-scale';
    self.availableDirections = ['up', 'down', 'left', 'right'];
    self.selectedDirection = 'up';
    self.direction = 'left';
    self.tooltipVisible = false;

    // so that they have the proper position; if closing, immediately hide the tooltips
    $scope.$watch('ctrl.isOpen', function(isOpen) {
      if (isOpen) {
        $timeout(function() {
          $scope.tooltipVisible = self.isOpen;
        }, 600);
      } else {
        $scope.tooltipVisible = self.isOpen;
      }
    });

  });
})();

var map = L.map('map').setView([51.505, -0.09], 13);

// https: also suppported.
L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);
