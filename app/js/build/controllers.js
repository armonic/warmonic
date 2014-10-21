'use strict';

angular.module('warmonic.build.controllers', [])

.controller('buildCtrl', ['$scope', '$state', '$stateParams', '$location', '$anchorScroll', 'xmpp', 'commands', 'build', function($scope, $state, $stateParams, $location, $anchorScroll, xmpp, commands, build) {
  if (!xmpp.connected)
    $state.go('login');

  this.providerOnline = function() {
    return commands.providerOnline;
  };
  this.provide = $stateParams.provide || null;
  this.tree = build.tree;
  this.variables = build.variables;
  this.data = build.data;
  this.run = angular.bind(build, build.run);

  $scope.$watch(this.providerOnline, angular.bind(this, function(newVal, oldVal) {
    if (newVal === true && this.provide)
      build.run(this.provide);
    else
      build.init();
  }));

  $scope.$watch(function() { return build.data; }, function(newVal, oldVal) {
    if (newVal.currentNode && newVal.currentNode !== oldVal.currentNode) {
      console.debug("Now on " + newVal.currentNode);
      $location.hash(newVal.currentNode);
    }
  }, true);

}]);
