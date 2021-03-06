'use strict';

angular.module('warmonic.lib.xmpp.muc', [
  'warmonic.lib.xmpp',
])

.factory('muc', ['$rootScope', '$q', '$timeout', 'xmpp', 'xmppService', function($rootScope, $q, $timeout, xmpp, xmppService) {

  var Room = function(name, nick, callback) {
    var handler;
    this.name = name;
    this.nick = nick;
    console.debug("joining room " + this.name);
    if (!callback) {
      handler = angular.bind(this, this.onMessage);
    }
    else {
      // Strophe handlers must return true
      // to be used multiple times.
      // Wrap the callback to return true by
      // default.
      handler = function(msg, xmppRoom) {
        var result = callback(msg, xmppRoom);
        if (result === false)
          return result;
        return true;
      };
    }

    xmpp.connection.muc.join(this.name,
                             this.nick,
                             handler);
  };

  Room.prototype = {

    onMessage: function(msg, xmppRoom) {
      msg = $(msg);
      if (msg.children('body').text().length > 0) {
        console.log(msg.children('body').text());
      }
      return true;
    },

    leave: function() {
      console.debug("leaving room " + this.name);
      xmpp.connection.muc.leave(this.name, this.nick);
    },

  };

  var muc = xmppService.create();
  angular.extend(muc, {

    domain: null,

    join: function(roomName, msgCallback) {
      if (!xmpp.connected)
        return;

      roomName = roomName + '@' + this.domain;
      var room = new Room(roomName, Strophe.getNodeFromJid(xmpp.connection.jid), msgCallback);
      return room;
    }

  });
  muc.init();

  return muc;

}]);
