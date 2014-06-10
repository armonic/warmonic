'use strict';

angular.module('warmonic.lib.xmpp.muc', [
  'warmonic.lib.xmpp',
  'warmonic.lib.logger'
])

.factory('muc', ['$q', '$timeout', 'xmpp', 'xmppSession', 'xmppService', 'logger', function($q, $timeout, xmpp, xmppSession, xmppService, logger) {

  var Room = function(name) {
    this.name = name;
    this.messages = [];
  };

  Room.prototype = {

    onMessage: function(msg, xmppRoom) {
      msg = $(msg);
      if (msg.children('body').length > 0)
        logger.warning(msg.children('body').text());
      return true;
    }

  };

  var muc = xmppService.create();
  angular.extend(muc, {

    join: function(roomName) {
      if (!xmpp.connected)
        return;

      var room = new Room(roomName);
      xmpp.connection.muc.join(roomName,
                               Strophe.getNodeFromJid(xmpp.connection.jid),
                               angular.bind(room, room.onMessage));

      return room;
    }

  });

  return muc;

}]);
