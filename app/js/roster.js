'use strict';

angular.module('warmonic.lib.xmpp.roster', [
  'warmonic.lib.xmpp',
  'warmonic.lib.logger'
])

.factory('roster', ['$q', '$timeout', 'xmpp', 'xmppSession', 'logger', function($q, $timeout, xmpp, xmppSession, logger) {

  var roster = {
    items: function() {
      if (xmpp.connected)
        return xmpp._connection.roster.items;
      return [];
    },

    onRoster: function() {
      logger.debug("roster received");
      // send presence after getting our roster
      xmpp.sendPresence();
    },

    updateItems: function(items) {
      // Add online key to each item
      items.forEach(angular.bind(this, function(item) {
        item.online = this.isOnline(item);
        item.show = false;
        if (item.subscription == "to" || item.subscription == "both")
          item.show = true;
      }));
      logger.debug("roster items updated : " + JSON.stringify(items));
      xmppSession.data.rosterItems = items;
    },

    isOnline: function(item) {
      if (Object.getOwnPropertyNames(item.resources).length > 0) {
        return true;
      }
      return false;
    },

    addServer: function(jid) {
      if (jid)
        xmpp.send($pres({to: jid, type: "subscribe"}));
    },

    removeServer: function(jid) {
      if (jid)
        xmpp.send($pres({to: jid, type: "unsubscribe"}));
    }
  };

  // roster init
  xmpp.getConnection().then(function(conn) {
    // callback for presence updates
    conn.roster.registerCallback(angular.bind(roster, roster.updateItems));
    logger.debug("registered roster callback");
    if (xmppSession.data.rosterItems) {
      logger.debug("loading previous roster");
      logger.debug(xmppSession.data.rosterItems);
      conn.roster.items = xmppSession.data.rosterItems;
    }
    else {
      // initial roster
      conn.roster.get(angular.bind(roster, roster.onRoster));
    }
  });

  xmpp.getDisconnection().then(function() {
    logger.debug("saving roster");
    xmppSession.data.rosterItems = roster.items;
  });

  return roster;

}])

.controller('rosterCtrl', ['roster', function(roster) {
  this.items = roster.items;
  this.serverJID = "";
  this.addServer = function() {
    roster.addServer(this.serverJID);
    this.serverJID = "";
  };
  this.removeServer = roster.removeServer;
}]);
