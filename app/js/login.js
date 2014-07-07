'use strict';

angular.module('warmonic.login', [])

.controller('loginCtrl', ['$scope', '$state', 'xmpp', 'muc', 'commands',  function($scope, $state, xmpp, muc, commands) {
  if (xmpp.connected) {
    $state.go('provides');
  }

  this.masterJID = null;
  this.mucDomain = null;
  this.domain = null;
  this.connection = null;
  this.connections = [];
  this.user = {
    'jid': 'test1@im.aeolus.org',
    'password': 'test1'
  };

  $scope.$watch(
    angular.bind(this, function() { return this.user.jid; }),
    angular.bind(this, function(newVal, oldVal) {
      try {
        this.domain = Strophe.getDomainFromJid(this.user.jid);
      }
      catch (error) {
        this.domain = "";
      }
      this.connections = [
        'ws://' + this.domain + ':5280/xmpp-websocket',
        'http://' + this.domain + ':5280/http-bind'
      ];
      this.connection = this.connections[0];
      this.masterJID = "master@" + this.domain + '/master';
      this.mucDomain = "logs." + this.domain;
  }));

  this.status = xmpp.status;

  this.connect = function() {
    xmpp.connect(this.user.jid, this.user.password,
                 this.connection)
    .then(angular.bind(this, function() {
      commands.provider = this.masterJID;
      muc.mucDomain = this.mucDomain;

      $state.go('provides');
    }));
  };

  this.disconnect = function() {
    xmpp.disconnect()
    .then(function() {
      $state.go('login');
    });
  };

}]);
