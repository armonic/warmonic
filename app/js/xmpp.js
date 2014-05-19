'use strict';

angular.module('warmonic.lib.xmpp', [
  'warmonic.lib.logger',
  'ngCookies'
])

.factory('xmppSession', ['$cookieStore', 'logger', function($cookieStore, logger) {

  var session = {
    data: {},
    load: function() {
      var sessionData = $cookieStore.get('xmppSession') || {};
      if (sessionData.timestamp && Date.now() / 1000 - sessionData.timestamp < 3600)
        this.data = sessionData;
    },
    save: function() {
      this.data.timestamp = Date.now() / 1000;
      $cookieStore.put('xmppSession', this.data);
    },
    clear: function() {
      this.data = {};
      this.save();
    }
  };

  session.load();

  return session;

}])

.factory('xmpp', ['$q', 'xmppSession', 'logger', function($q, xmppSession, logger) {

  var statuses = {},
      deferredConnection = $q.defer(),
      deferredDisconnection = $q.defer(),
      events = [];

  // Log Strophe events
  Strophe.log = angular.bind(logger, function(level, msg) {
    if (!level)
      level = 0;
    if (msg)
      this.log("[Strophe] " + msg, level);
  });

  statuses[Strophe.Status.ERROR] = "an error occurred";
  statuses[Strophe.Status.CONNECTING] = "connecting";
  statuses[Strophe.Status.CONNFAIL] = "connection failed";
  statuses[Strophe.Status.AUTHENTICATING] = "authenticating";
  statuses[Strophe.Status.AUTHFAIL] = "authentication failed";
  statuses[Strophe.Status.CONNECTED] = "connected";
  statuses[Strophe.Status.DISCONNECTED] = "disconnected";
  statuses[Strophe.Status.DISCONNECTING] = "disconnecting";
  statuses[Strophe.Status.ATTACHED] = "attached";

  var xmpp = {
    _connectionUrl: null,
    _connection: null,

    get connected() {
      if (this._connection)
        return this._connection.connected;
      return false;
    },

    _init: function(connectionUrl) {
      logger.debug(connectionUrl);
      this._connectionUrl = connectionUrl;
      if (this._connection) {
        logger.info("reset current connexion");
        this._connection.reset();
        // cleanup requests queue
        this._connection._proto._requests.forEach(angular.bind(this, function(req) {
          this._connection._proto._removeRequest(req);
        }));
        // update connection url
        this._connection.service = this._connectionUrl;
      }
      else {
        this._connection = new Strophe.Connection(this._connectionUrl);
        this._connection.xmlInput = angular.bind(this, this.onInput);
        this._connection.xmlOutput = angular.bind(this, this.onOutput);
      }
    },

    status: {
      code: Strophe.Status.DISCONNECTED,
      text: statuses[Strophe.Status.DISCONNECTED]
    },

    attach: function() {
      if (!xmppSession.data.sid ||
          !xmppSession.data.connectionUrl)
        return;
      this._init(xmppSession.data.connectionUrl);
      logger.debug("attach session " + xmppSession.data.sid);
      this._connection.attach(xmppSession.data.jid,
                              xmppSession.data.sid,
                              xmppSession.data.rid,
                              angular.bind(this, this.onConnect));
      return this.getConnection();
    },

    connect: function(jid, password, connectionUrl) {
      this._init(connectionUrl);
      logger.debug("login with " + jid + "/" + password);
      this._connection.connect(jid,
                               password,
                               angular.bind(this, this.onConnect));
      return this.getConnection();
    },

    disconnect: function() {
      this._connection.disconnect("disconnecting");
      return this.getDisconnection();
    },

    send: function(arg) {
      this._connection.send(arg);
    },

    onConnect: function(status, error) {
      logger.debug('connection status is ' + statuses[status]);
      this.status.code = status;
      this.status.text = statuses[status];
      if (this.status.code == Strophe.Status.CONNECTED ||
          this.status.code == Strophe.Status.ATTACHED) {
        deferredConnection.resolve(this._connection);
        this._connection.addHandler(angular.bind(this, this.onMessage), null, "message");
        xmppSession.data.jid = this._connection.jid;
        xmppSession.data.sid = this._connection._proto.sid;
        xmppSession.data.connectionUrl = this._connectionUrl;
      }
      else if (this.status.code == Strophe.Status.CONNFAIL ||
               this.status.code == Strophe.Status.AUTHFAIL) {
        this._connection = null;
        deferredConnection.reject(this._connection);
      }
      else if (this.status.code == Strophe.Status.DISCONNECTED) {
        xmppSession.clear();
        this._connection = null;
        deferredDisconnection.resolve();
      }
    },

    getDisconnection: function() {
      return deferredDisconnection.promise.finally(function(promise) {
        console.log("recreate disconnect");
        deferredDisconnection = $q.defer();
        return promise;
      });
    },

    getConnection: function() {
      return deferredConnection.promise.finally(function(promise) {
        console.log("recreate connect");
        deferredConnection = $q.defer();
        return promise;
      });
    },

    sendPresence: function() {
      this.send($pres());
    },

    onMessage: function(message) {
      logger.warning("[" + $(message).attr("from") + "] " + $(message).find('body').html());
      return true;
    },

    onInput: function(body) {
      logger.trace('[<<] ' + Strophe.serialize(body));
    },

    onOutput: function(body) {
      logger.trace('[>>] ' + Strophe.serialize(body));
      if (this._connection && this._connection._proto.rid) {
        xmppSession.data.rid = this._connection._proto.rid;
        xmppSession.save();
      }
    }
  };

  return xmpp;
}])

.controller('loginCtrl', ['$scope', '$timeout', '$state', 'xmppSession', 'xmpp', 'roster', function($scope, $timeout, $state, xmppSession, xmpp, roster) {
  if (xmpp.connected) {
    $state.go('provides');
  }

  this.user = {
    'jid': 'test1@im.aeolus.org',
    'password': 'test1'
  };
  this.connection = 'http://im.aeolus.org/http-bind';

  this.session = xmppSession.data;
  this.status = xmpp.status;

  this.connect = function() {
    xmpp.connect(this.user.jid, this.user.password,
                 this.connection)
    .then(angular.bind(this, function() {
      $state.go('provides');
    }));
  };

  this.disconnect = function() {
    xmpp.disconnect()
    .then(function() {
      $state.go('login');
    });
  };

}])

// template to create xmpp services
.factory('xmppService', function(xmpp) {

  var XMPPService = Object.create(Object.prototype);
  XMPPService.prototype = {
    _conn_init: function() {
      xmpp.getConnection()
      .then(angular.bind(this, function(conn) {
        this.onConnection(conn);
      }))
      .finally(angular.bind(this, function() {
        this._conn_init();
      }));
    },

    _conn_deinit: function() {
      xmpp.getDisconnection()
      .then(angular.bind(this, function() {
        this.onDisconnection();
      }))
      .finally(angular.bind(this, function() {
        this._conn_deinit();
      }));
    },

    onConnection: function() {
      // can be overriden by service
      // run when the xmpp connection is connected
      return true;
    },

    onDisconnection: function() {
      // can be overriden by service
      // run when the xmpp connection is disconnected
      return true;
    }

  };

  return {
    create: function() {
      var service = Object.create(XMPPService.prototype);
      service._conn_init();
      service._conn_deinit();
      return service;
    }
  };

});
