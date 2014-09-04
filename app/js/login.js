'use strict';

angular.module('warmonic.login', [])

.controller('loginCtrl', ['$scope', '$cookieStore', '$state', 'xmppSession', 'xmpp', function($scope, $cookieStore, $state, xmppSession, xmpp) {

  this.info = $cookieStore.get('warmonicLogin') || {jid: null, mucDomain: null, connection: null};
  this.password = null;
  this.commandsProvider = null;
  this.connections = [];

  $scope.$watch(
    angular.bind(this, function() { return this.info.jid; }),
    angular.bind(this, function(newVal, oldVal) {
      try {
        this.domain = Strophe.getDomainFromJid(this.info.jid);
      }
      catch (error) {
        this.domain = "";
      }
      this.connections = [
        {label: "Websocket connection", value: 'ws://' + this.domain + ':5280/xmpp-websocket'},
        {label: "BOSH connection", value: 'http://' + this.domain + ':5280/http-bind'}
      ];
      this.connection = this.connections[0].value;
      if (this.info.connection) {
        for (var i=0; i<this.connections.length; i++) {
          if (this.connections[i].value == this.info.connection) {
            this.connection = this.info.connection;
            break;
          }
        }
      }
      this.commandsProvider = this.info.jid + '/master';
      if (this.info.mucDomain && this.domain && this.info.mucDomain.indexOf(this.domain) != -1)
        this.mucDomain = this.info.mucDomain;
      else
        this.mucDomain = "logs." + this.domain;
  }));

  this.status = xmpp.status;

  this.connect = function() {
    xmppSession.data.commandsProvider = this.masterJID;
    xmppSession.data.mucDomain = this.mucDomain;
    xmpp.connect(this.info.jid, this.password, this.connection);
    $cookieStore.put('warmonicLogin', {jid: this.info.jid,
                                       mucDomain: this.mucDomain,
                                       connection: this.connection});
  };

  this.disconnect = function() {
    xmpp.disconnect();
  };

}]);
