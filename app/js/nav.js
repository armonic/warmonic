'use strict';

angular.module('warmonic.nav', [])

.controller('navCtrl', ['xmppSession', 'global', function(xmppSession, global) {

  this.xmppSession = xmppSession;

  this.toggleExpertMode = function() {
    global.toggleOption("expertMode");
  };

  this.inExpertMode = function() {
    return global.options.expertMode;
  };

  this.toggleDebugMode = function() {
    global.toggleOption("debugMode");
  };

  this.inDebugMode = function() {
    return global.options.debugMode;
  };

}]);
