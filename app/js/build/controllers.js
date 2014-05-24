'use strict';

angular.module('warmonic.build.controllers', [])

.controller('buildCtrl', ['$state', '$stateParams', 'xmpp', 'commands', 'build', function($state, $stateParams, xmpp, commands, build) {
  if (!xmpp.connected)
    $state.go('login');

  this.providerOnline = function() {
    return commands.providerOnline;
  };
  this.urlProvide = $stateParams.provide ? true : false;
  this.provide = $stateParams.provide || null;
  this.tree = build.tree;
  this.variables = build.variables;
  this.run = angular.bind(build, build.run);

  if (this.urlProvide)
    build.run(this.provide);
  else
    build.init();
}]);
