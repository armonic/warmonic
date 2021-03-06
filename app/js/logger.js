'use strict';

angular.module('warmonic.lib.logger', [])

.factory('logger', ['$rootScope', function($rootScope) {

  var loggers = {};

  function Logger(name) {
    this.name = name;
  }

  Logger.prototype = {

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
      // ignore EVENT level for now
      if (level == this.level.EVENT)
        return;
      var log = {date: new Date(),
                 level: level,
                 text: text,
                 author: author};
      if (!this._output)
        this._output = [];
      this._output.push(log);
      $rootScope.$apply();
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

    clear: function() {
      this._output = [];
    },

    output: function() {
      return this._output;
    }

  };

  return {
    get: function(name) {
      return loggers[name] || function() {
        var logger = new Logger(name);
        loggers[name] = logger;
        return logger;
      }();
    },

    list: function() {
      return loggers;
    }
  };

}])

.directive('logger', ['logger', function(logger) {

  return {
    restrict: 'E',

    scope: false,

    templateUrl: 'partials/logger.html',

    link: function(scope, element, attrs) {
      scope.loggerName = null;

      attrs.$observe('instanceName', function(value) {
        if (value) {
          scope.loggerName = value;
        }
      });

      scope.$watch(attrs.instance, function(newVal) {
        if (newVal) {
          scope.loggerName = newVal.name;
        }
      });
    },

    controller: function($scope) {
      $scope.show = true;
      $scope.logger = null;

      $scope.$watch('loggerName', function(newVal) {
        if (newVal) {
          $scope.logger = logger.get(newVal);
        }
      });
    }

  };

}]);
