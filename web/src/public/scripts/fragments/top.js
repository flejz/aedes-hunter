'use strict';

app.controller('AppCtrl', function($scope, $mdDialog, $mdMedia) {
  $scope.status = '  ';
  $scope.customFullscreen = $mdMedia('xs') || $mdMedia('sm');
  $scope.theme = 'defaultTheme';


  //** about function
  $scope.about = function(ev) {
    var useFullScreen = ($mdMedia('sm') || $mdMedia('xs')) && $scope.customFullscreen;
    $mdDialog.show({
      controller: DialogController,
      templateUrl: 'templates/about.html',
      parent: angular.element(document.body),
      targetEvent: ev,
      clickOutsideToClose: true,
      fullscreen: useFullScreen
    });

    $scope.$watch(function() {
      return $mdMedia('xs') || $mdMedia('sm');
    }, function(wantsFullScreen) {
      $scope.customFullscreen = (wantsFullScreen === true);
    });
  };

});

// the dialog controller class
function DialogController($scope, $mdDialog) {
  $scope.close = function() {
    $mdDialog.cancel();
  };
}

app.controller('GeocodeCtrl', function DemoCtrl($timeout, $q, $log) {
  var self = this;
  geocoder = self;
  self.simulateQuery = true;
  self.isDisabled = false;
  // list of `state` value/display objects
  self.states = loadAll();
  self.querySearch = querySearch;
  self.selectedItemChange = selectedItemChange;
  self.searchTextChange = searchTextChange;

  self.adresses = [];

  // ******************************
  // Internal methods
  // ******************************
  /**
   * Search for states... use $timeout to simulate
   * remote dataservice call.
   */
  function querySearch(query) {
    var results = query ? self.adresses.filter(createFilterFor(query)) :
      self
      .adresses,
      deferred;
    if (self.simulateQuery) {
      deferred = $q.defer();
      $timeout(function() {
        deferred.resolve(results);
      }, Math.random() * 1000, false);
      return deferred.promise;
    } else {
      return results;
    }
  }

  function searchTextChange(text) {
    $log.info('Text changed to ' + text);
  }

  function selectedItemChange(item) {
    $log.info('Item changed to ' + JSON.stringify(item));
  }
  /**
   * Build `states` list of key/value pairs
   */
  function loadAll() {
    var allStates =
      'Alabama, Alaska, Arizona, Arkansas, California, Colorado, Connecticut, Delaware,\
              Florida, Georgia, Hawaii, Idaho, Illinois, Indiana, Iowa, Kansas, Kentucky, Louisiana,\
              Maine, Maryland, Massachusetts, Michigan, Minnesota, Mississippi, Missouri, Montana,\
              Nebraska, Nevada, New Hampshire, New Jersey, New Mexico, New York, North Carolina,\
              North Dakota, Ohio, Oklahoma, Oregon, Pennsylvania, Rhode Island, South Carolina,\
              South Dakota, Tennessee, Texas, Utah, Vermont, Virginia, Washington, West Virginia,\
              Wisconsin, Wyoming';
    return allStates.split(/, +/g).map(function(state) {
      return {
        value: state.toLowerCase(),
        display: state
      };
    });
  }
  /**
   * Create filter function for a query string
   */
  function createFilterFor(query) {
    var lowercaseQuery = angular.lowercase(query);
    return function filterFn(state) {
      return (state.value.indexOf(lowercaseQuery) === 0);
    };
  }
});


//** Initiales the Google Places API (Autocomplete)
var geocoder;

function initAutocomplete() {

  // Create the autocomplete object, restricting the search to geographical
  // location types.
  var autocomplete = new google.maps.places.Autocomplete(
    document.getElementById('geocoder'), {
      types: ['geocode']
    });

  // When the user selects an address from the dropdown, populate the address
  // fields in the form.
  autocomplete.addListener('place_changed', function() {

    // Get the place details from the autocomplete object.
    var place = autocomplete.getPlace(),
      geocoder = new google.maps.Geocoder();

    // geocoding the address
    geocoder.geocode({
      'address': place.formatted_address
    }, function(results, status) {
      if (status === google.maps.GeocoderStatus.OK) {

        //getting the latlong, adding to the map and zoom to it
        var latlng = [results[0].geometry.location.lat(), results[0].geometry.location.lng()];
        var marker = L.marker(latlng).addTo(map);
        map.setView(latlng, 15);

      } else {
        alert('Geocode was not successful for the following reason: ' +
          status);
      }
    });

    geocoder.adresses = place.address_components;
  });
};
