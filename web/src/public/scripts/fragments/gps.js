'use strict';

app.controller('GpsCtrl', function($scope, $mdDialog, $timeout) {
  var self = this;
  self.hidden = true;


  // gets the gps location
  $scope.getLocation = function() {

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(function showPosition(
        position) {

        //getting the latlong, adding to the map and zoom to it
        var latlng = [position.coords.latitude, position.coords.longitude];
        var marker = L.marker(latlng).addTo(map);
        map.setView(latlng, 15);

        $scope.ctrl.hidden = false;
        $scope.$apply()
      });
    } else {
      self.hidden = true;
    }
  };
});
