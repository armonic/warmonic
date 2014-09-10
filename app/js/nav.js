'use strict';

angular.module('warmonic.nav', [])

.controller('navCtrl', ['$scope', 'xmpp', function($scope, xmpp) {

  this.userJID = null;
  this.userConnected = false;

  $scope.$watch(function() { return xmpp.connected; },
                angular.bind(this, function(newVal) {
    this.userConnected = newVal;
    if (this.userConnected)
      this.userJID = xmpp.connection.jid;
    else
      this.userJID = null;
  }));

}]);
