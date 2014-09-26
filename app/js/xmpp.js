'use strict';

angular.module('warmonic.lib.xmpp', [
  'ngCookies'
])

.factory('xmppSession', ['$cookieStore', function($cookieStore) {

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

.factory('xmpp', ['$q', '$rootScope', 'xmppSession', function($q, $rootScope, xmppSession) {

  var statuses = {},
      deferredConnection = $q.defer(),
      deferredDisconnection = $q.defer(),
      events = [];

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

    get connection() {
      return this._connection;
    },

    _init: function(connectionUrl) {
      console.debug("using connection url : " + connectionUrl);
      this._connectionUrl = connectionUrl;
      if (this._connection) {
        console.debug("reset current connexion");
        this._connection.reset();
        // cleanup requests queue
        if (this._connection._proto && this._connection._proto._requests) {
          this._connection._proto._requests.forEach(angular.bind(this, function(req) {
            this._connection._proto._removeRequest(req);
          }));
        }
        // update connection url
        this._connection.service = this._connectionUrl;
      }
      else {
        this._connection = new Strophe.Connection(this._connectionUrl);
        this._connection.xmlInput = angular.bind(this, this.onInput);
        this._connection.xmlOutput = angular.bind(this, this.onOutput);
        this._connection.rawInput = function(data) {
          console.log('RECV: ' + data);
        };
        this._connection.rawOutput = function(data) {
          console.log('SENT: ' + data);
        };
      }
    },

    mode: {
      CONNECT: 0,
      ATTACH: 1
    },

    status: {
      code: Strophe.Status.DISCONNECTED,
      text: statuses[Strophe.Status.DISCONNECTED]
    },

    attach: function() {
      // No attach() with websockets
      if (xmppSession.data.connectionUrl &&
          xmppSession.data.connectionUrl.indexOf('ws://') !== -1) {
        return this.connect(xmppSession.data.jid,
                            xmppSession.data.password,
                            xmppSession.data.connectionUrl);
      }

      if (!xmppSession.data.sid ||
          !xmppSession.data.connectionUrl)
        return;

      this._init(xmppSession.data.connectionUrl);
      console.debug("attach session " + xmppSession.data.sid);
      xmppSession.data.connectionMode = this.mode.ATTACH;
      this._connection.attach(xmppSession.data.jid,
                              xmppSession.data.sid,
                              xmppSession.data.rid,
                              angular.bind(this, this.onConnect));
      return this.getConnection();
    },

    connect: function(jid, password, connectionUrl) {
      this._init(connectionUrl);
      console.debug("login with " + jid + "/" + password);
      xmppSession.data.password = password;
      xmppSession.data.connectionMode = this.mode.CONNECT;
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
      if (error)
        console.error(error);
      console.debug('connection status is ' + statuses[status]);
      this.status.code = status;
      this.status.text = statuses[status];
      if (this.status.code == Strophe.Status.CONNECTED ||
          this.status.code == Strophe.Status.ATTACHED) {
        deferredConnection.resolve(this._connection);
        //this._connection.addHandler(angular.bind(this, this.onMessage), null, "message");
        this._connection.addHandler(angular.bind(this, this.onPresence), null, "presence");
        xmppSession.data.jid = this._connection.jid;
        // no sid with websockets
        if (this._connection._proto.sid)
          xmppSession.data.sid = this._connection._proto.sid;
        xmppSession.data.connectionUrl = this._connectionUrl;
        xmppSession.save();
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
        deferredDisconnection = $q.defer();
        return promise;
      });
    },

    getConnection: function() {
      return deferredConnection.promise.finally(function(promise) {
        deferredConnection = $q.defer();
        return promise;
      });
    },

    sendPresence: function() {
      this.send($pres());
    },

    onInput: function(body) {
    },

    onOutput: function(body) {
      // no rid with websockets
      if (this.connection && this.connection._proto.rid)
        xmppSession.data.rid = this.connection._proto.rid;
      xmppSession.save();
    },

    onPresence: function(presence) {
      // store current JID resources in session
      var jid = presence.getAttribute('from'),
          jidBare = Strophe.getBareJidFromJid(jid),
          resource = Strophe.getResourceFromJid(jid),
          type = presence.getAttribute('type');

      if (jidBare === Strophe.getBareJidFromJid(xmppSession.data.jid)) {
        if (!xmppSession.data.resources)
          xmppSession.data.resources = [];
        if (!type && xmppSession.data.resources.indexOf(resource) == -1)
          xmppSession.data.resources.push(resource);
        else if (type == 'unavailable')
          xmppSession.data.resources.splice(xmppSession.data.resources.indexOf(resource), 1);
        xmppSession.save();

        $rootScope.$apply();
      }

      return true;
    }
  };

  return xmpp;
}])

// template to create xmpp services
.factory('xmppService', function(xmpp) {

  var XMPPService = Object.create(Object.prototype);
  XMPPService.prototype = {

    connection: false,

    init: function() {
      // listen for connexion/deconnexion
      this._connInit();
      this._connDeinit();
      // already connected, fire onConnection
      if (xmpp.connected) {
        this.connection = xmpp.connection;
        this.onConnection(this.connection);
      }
    },

    _connInit: function() {
      xmpp.getConnection()
      .then(angular.bind(this, function(conn) {
        this.connection = conn;
        this.onConnection(this.connection);
      }))
      .finally(angular.bind(this, function() {
        this._connInit();
      }));
    },

    _connDeinit: function() {
      xmpp.getDisconnection()
      .then(angular.bind(this, function() {
        this.onDisconnection();
      }))
      .finally(angular.bind(this, function() {
        this._connDeinit();
      }));
    },

    onConnection: function(conn) {
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
      return service;
    }
  };

})

.factory('ping', ['$q', 'xmpp', 'xmppService', function($q, xmpp, xmppService) {

  var ping = xmppService.create();
  angular.extend(ping, {
    onConnection: function(conn) {
      conn.ping.addPingHandler(angular.bind(this, this.onPing));
    },

    onPing: function(ping) {
      xmpp.connection.ping.pong(ping);
      return true;
    }
  });
  ping.init();

  return ping;

}]);
