'use strict';

angular.module('warmonic.lib.xmpp.muc', [
  'warmonic.lib.xmpp',
  'warmonic.lib.logger'
])

.factory('muc', ['$q', '$timeout', 'xmpp', 'xmppService', 'logger', function($q, $timeout, xmpp, xmppService, logger) {

  var domain = null;

  var Room = function(name, nick) {
    this.name = name;
    this.nick = nick;
    this.messages = [];
    console.debug("joining room " + this.name);
    xmpp.connection.muc.join(this.name,
                             this.nick,
                             angular.bind(this, this.onMessage));
  };

  Room.prototype = {

    onMessage: function(msg, xmppRoom) {
      msg = $(msg);
      if (msg.children('body').length > 0) {
        var message = msg.children('body').text();
        logger.info(message);
        this.messages.push(message);
      }
      return true;
    },

    leave: function() {
      console.debug("leaving room " + this.name);
      xmpp.connection.muc.leave(this.name, this.nick);
    }

  };

  var muc = xmppService.create();
  angular.extend(muc, {

    get domain() {
      return domain;
    },

    set domain(value) {
      domain = value;
    },

    join: function(roomName) {
      if (!xmpp.connected)
        return;

      var room = new Room(roomName, Strophe.getNodeFromJid(xmpp.connection.jid));
      return room;
    }

  });

  return muc;

}]);
