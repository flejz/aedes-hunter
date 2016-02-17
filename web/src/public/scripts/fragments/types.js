'use strict';

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
