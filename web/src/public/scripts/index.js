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
    $mdThemingProvider.theme('casesTheme')
      .primaryPalette('orange')
      .accentPalette('orange')
      .warnPalette('orange');
    $mdThemingProvider.theme('focusTheme')
      .primaryPalette('cyan')
      .accentPalette('cyan')
      .warnPalette('cyan');
  });

})();

var map = L.map('map').setView([51.505, -0.09], 13);

// https: also suppported.
L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);
