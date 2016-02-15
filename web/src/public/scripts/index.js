var app;

// initializes angular js
(function() {
  'use strict';
  app = angular.module('app', ['ngMaterial']).config(function(
    $mdThemingProvider) {
    $mdThemingProvider.theme('defaultTheme')
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

  app.controller('FilterCtrl', function ($scope, $timeout, $mdSidenav, $log) {
      $scope.toggleLeft = buildToggler('left');
      $scope.isOpenRight = function(){
        return $mdSidenav('right').isOpen();
      };
      /**
       * Supplies a function that will continue to operate until the
       * time is up.
       */
      function debounce(func, wait, context) {
        var timer;
        return function debounced() {
          var context = $scope,
              args = Array.prototype.slice.call(arguments);
          $timeout.cancel(timer);
          timer = $timeout(function() {
            timer = undefined;
            func.apply(context, args);
          }, wait || 10);
        };
      }
      /**
       * Build handler to open/close a SideNav; when animation finishes
       * report completion in console
       */
      function buildDelayedToggler(navID) {
        return debounce(function() {
          $mdSidenav(navID)
            .toggle()
            .then(function () {
              $log.debug("toggle " + navID + " is done");
            });
        }, 200);
      }
      function buildToggler(navID) {
        return function() {
          $mdSidenav(navID)
            .toggle()
            .then(function () {
              $log.debug("toggle " + navID + " is done");
            });
        }
      }
    })
    .controller('LeftCtrl', function ($scope, $timeout, $mdSidenav, $log) {
      $scope.close = function () {
        $mdSidenav('left').close()
          .then(function () {
            $log.debug("close LEFT is done");
          });
      };
    })
    .controller('RightCtrl', function ($scope, $timeout, $mdSidenav, $log) {
      $scope.close = function () {
        $mdSidenav('right').close()
          .then(function () {
            $log.debug("close RIGHT is done");
          });
      };
    });



})();

var map = L.map('map').setView([51.505, -0.09], 13);

// https: also suppported.
L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);
