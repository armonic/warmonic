'use strict';

angular.module('warmonic.build', [
  'warmonic.lib.logger',
  'warmonic.lib.xmpp.commands'
])

.controller('buildCtrl', ['$timeout', '$state', '$stateParams', 'logger', 'xmpp', 'commands', function($timeout, $state, $stateParams, logger, xmpp, commands) {

  this.provide = $stateParams.provide;

}]);
