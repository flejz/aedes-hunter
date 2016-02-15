// initializes angular js
(function() {
  'use strict';
  angular.module('app', ['ngMaterial']).config(function($mdThemingProvider) {
      $mdThemingProvider.theme('altTheme')
        .primaryPalette('purple')
        .accentPalette('blue')
        .warnPalette('red');

    })
    .controller('FabCtrl', function($scope, $mdDialog, $timeout) {
      var self = this;
      self.topDirections = ['left', 'up'];
      self.bottomDirections = ['down', 'right'];
      self.isOpen = false;
      self.availableModes = ['md-fling', 'md-scale'];
      self.selectedMode = 'md-scale';
      self.availableDirections = ['up', 'down', 'left', 'right'];
      self.selectedDirection = 'up';
      self.direction = 'left';

      // so that they have the proper position; if closing, immediately hide the tooltips
      $scope.$watch('demo.isOpen', function(isOpen) {
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