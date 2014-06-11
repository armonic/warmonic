'use strict';

angular.module('warmonic.lib.logger', [])

.factory('logger', ['$q', '$timeout', function($q, $timeout) {

  var output = [];

  return {

    level: {
      TRACE: 0,
      DEBUG: 1,
      INFO: 2,
      WARNING: 3,
      WARN: 3,
      ERROR: 4,
      FATAL: 5,
    },

    log: function(text, level) {
      var log = {'date': new Date(), 'level': level, 'text': text};
      output.splice(0, 0, log);
    },

    trace: function(text) {
      this.log(text, this.level.TRACE);
    },

    debug: function(text) {
      this.log(text, this.level.DEBUG);
    },

    info: function(text) {
      this.log(text, this.level.INFO);
    },

    warning: function(text) {
      this.log(text, this.level.WARNING);
    },

    error: function(text) {
      this.log(text, this.level.ERROR);
    },

    output: function() {
      return output;
    }
  };
}])

.controller('loggerCtrl', ['logger', function(logger) {
  this.output = logger.output;
}])

.controller('consoleCtrl', ['xmpp', 'logger', function(xmpp, logger) {
  this.send = function() {
    var parser = new DOMParser();
    var doc = parser.parseFromString(this.input, 'text/xml');
    var elem = doc.documentElement;
    if (xmpp._connection && elem) {
      xmpp._connection.send(elem);
      this.input = "";
    }
    else
      logger.error("no connection available");
  };
}]);
