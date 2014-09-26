'use strict';

angular.module('warmonic.lib.xmpp.roster', [
  'warmonic.lib.xmpp'
])

.factory('roster', ['$q', '$rootScope', '$timeout', 'xmpp', 'xmppSession', 'xmppService', function($q, $rootScope, $timeout, xmpp, xmppSession, xmppService) {

  // don't show jid from this list
  // in the roster
  var exclusionList = [];
  var roster = xmppService.create();
  angular.extend(roster, {

    onConnection: function(conn) {
      conn.roster.registerCallback(angular.bind(this, this.updateItems));
      if (xmppSession.data.connectionMode == xmpp.mode.ATTACH) {
        conn.roster.items = xmppSession.data.rosterItems;
      }
      else {
        conn.roster.get(angular.bind(this, this.onRoster));
      }
    },

    items: function() {
      if (xmpp.connected) {
        return xmpp.connection.roster.items;
      }
      return [];
    },

    onlineItems: function() {
      var items = [];
      this.items().forEach(function(item) {
        if (roster.isItemOnline(item))
          items.push(item);
      });
      return items;
    },

    onRoster: function() {
      console.debug("roster received");
      // send presence after getting our roster
      xmpp.sendPresence();
    },

    updateItems: function(items) {
      // Add online key to each item
      items.forEach(angular.bind(this, function(item) {
        item.online = this.isItemOnline(item);
        item.show = false;
        item.name = Strophe.getNodeFromJid(item.jid);
        if (item.subscription == "to" || item.subscription == "both")
          item.show = true;
        if (exclusionList.indexOf(item.jid) > -1)
          item.show = false;
      }));
      console.debug("roster items updated : " + JSON.stringify(items));
      xmppSession.data.rosterItems = items;
      xmppSession.save();

      // force the run of a digest cycle
      $rootScope.$apply();
    },

    isItemOnline: function(item) {
      if (Object.getOwnPropertyNames(item.resources).length > 0) {
        return true;
      }
      return false;
    },

    isJidOnline: function(jid) {
      if (xmpp.connected) {
        var roster = xmpp.connection.roster;
        try {
          return this.isItemOnline(roster.findItem(Strophe.getBareJidFromJid(jid)));
        }
        catch (err) {
          return false;
        }
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
    },

    excludeJid: function(jid) {
      exclusionList.push(Strophe.getBareJidFromJid(jid));
    }
  });
  roster.init();

  return roster;

}])

.directive('roster', function() {
  return {
    restrict: 'E',
    templateUrl: 'partials/_roster.html',
    controller: ['$scope', 'roster', function($scope, roster) {
      $scope.items = roster.items;
      $scope.serverJID = "";
      $scope.addServer = function() {
        roster.addServer($scope.serverJID);
        $scope.serverJID = "";
      };
      $scope.removeServer = roster.removeServer;
    }]
  };
});
