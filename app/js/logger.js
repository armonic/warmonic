'use strict';

angular.module('warmonic.lib.logger', [])

.factory('logger', ['$q', '$timeout', function($q, $timeout) {

  var output = [];

  return {

    level: {
      TRACE: 0,
      DEBUG: 10,
      EVENT: 15,
      INFO: 20,
      PROCESS: 25,
      WARNING: 30,
      WARN: 30,
      ERROR: 40,
      CRITICAL: 50,
      FATAL: 50,
    },

    log: function(text, level, author) {
      var log = {date: new Date(),
                 level: level,
                 text: text,
                 author: author};
      output.splice(0, 0, log);
    },

    trace: function(text, author) {
      this.log(text, this.level.TRACE, author);
    },

    debug: function(text, author) {
      this.log(text, this.level.DEBUG, author);
    },

    info: function(text, author) {
      this.log(text, this.level.INFO, author);
    },

    warning: function(text, author) {
      this.log(text, this.level.WARNING, author);
    },

    error: function(text, author) {
      this.log(text, this.level.ERROR, author);
    },

    output: function() {
      return output;
    },

    clear: function() {
      output = [];
    }
  };
}])

.controller('loggerCtrl', ['logger', function(logger) {
  this.output = logger.output;
  this.clear = logger.clear;
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
