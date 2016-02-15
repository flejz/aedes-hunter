(function() {
      'use strict';
      angular.module('app', ['ngMaterial']).config(function($mdThemingProvider) {
            $mdThemingProvider.theme('altTheme')
                  .primaryPalette('grey')
                  .accentPalette('grey')
                  .warnPalette('grey');

      })
            .controller('FabCtrl', function() {
                  this.topDirections = ['left', 'up'];
                  this.bottomDirections = ['down', 'right'];
                  this.isOpen = false;
                  this.availableModes = ['md-fling', 'md-scale'];
                  this.selectedMode = 'md-scale';
                  this.availableDirections = ['up', 'down', 'left', 'right'];
                  this.selectedDirection = 'up';
            });
})();

var map = L.map('map').setView([51.505, -0.09], 13);

// https: also suppported.
L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);