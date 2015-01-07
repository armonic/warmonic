'use strict';

angular.module('warmonic.login', [])

.controller('loginCtrl', ['$scope', '$cookieStore', '$state', 'xmppSession', 'xmpp', function($scope, $cookieStore, $state, xmppSession, xmpp) {

  if (xmpp.connected)
      $state.go('provides');

  this.info = $cookieStore.get('warmonicLogin') || {jid: null, mucDomain: null, connection: null, host: null};
  this.password = null;
  this.commandsProvider = null;
  this.connections = [];
  this.host = null;

  $scope.$watch(
    angular.bind(this, function() { return (this.info.jid, this.host); }),
    angular.bind(this, function(newVal, oldVal) {
      try {
        this.domain = Strophe.getDomainFromJid(this.info.jid);
      }
      catch (error) {
        this.domain = "";
      }

      // By default, the XMPP domain is used
      if (this.host === null) {
	this.host = this.domain;
      }

      this.connections = [
        {label: "Websocket connection", value: 'ws://' + this.host + ':5280/xmpp-websocket'},
        {label: "BOSH connection", value: 'http://' + this.host + ':5280/http-bind'}
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

      this.masterJID = "master@" + this.domain + "/master";
  }));

  this.status = xmpp.status;

  this.connect = function() {
    xmppSession.data.commandsProvider = this.masterJID;
    xmppSession.data.mucDomain = this.mucDomain;
    xmpp.connect(this.info.jid, this.password, this.connection);
    $cookieStore.put('warmonicLogin', {jid: this.info.jid,
                                       mucDomain: this.mucDomain,
                                       connection: this.connection,
				       host: this.host});
  };

  this.disconnect = function() {
    xmpp.disconnect();
  };

}]);
