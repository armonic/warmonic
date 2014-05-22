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

}]);
