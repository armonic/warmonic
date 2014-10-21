'use strict';

angular.module('warmonic.lib.xmpp.commands', [
  'warmonic.lib.xmpp'
])

.factory('commands', ['$q', 'xmpp', 'xmppSession', function($q, xmpp, xmppSession) {

  var provider = null;

  return {
    get provider() {
      return provider;
    },

    set provider(value) {
      provider = value;
      console.debug("master is " + provider);
    },

    create: function(cmd) {
      if (!this.provider)
        throw "Command provider should be filled first!";
      return new Strophe.Commands.RemoteCommand(xmpp._connection, this.provider, cmd);
    },

    execute: function(cmd) {
      var deferResult = $q.defer();
      cmd.execute({
        success: function(result, cmd) {
          deferResult.resolve(cmd);
        },
        error: function(error, cmd) {
          deferResult.reject(cmd);
        }
      });
      return deferResult.promise;
    },

    next: function(cmd, form) {
      var deferResult = $q.defer();
      cmd.next({
        success: function(result, cmd) {
          deferResult.resolve(cmd);
        },
        error: function(error, cmd) {
          deferResult.reject(cmd);
        },
        responseForm: form
      });
      return deferResult.promise;
    },

    complete: function(complete) {
      var deferResult = $q.defer();
      complete.complete({
        success: function(result, cmd) {
          deferResult.resolve(cmd);
        },
        error: function(error, cmd) {
          deferResult.reject(cmd);
        }
      });
      return deferResult.promise;
    },

    prev: function(cmd) {
      var deferResult = $q.defer();
      cmd.prev({
        success: function(result, cmd) {
          deferResult.resolve(cmd);
        },
        error: function(error, cmd) {
          deferResult.reject(cmd);
        }
      });
      return deferResult.promise;
    },

    cancel: function(cmd) {
      var deferResult = $q.defer();
      cmd.cancel({
        success: function(result, cmd) {
          deferResult.resolve(result);
        },
        error: function(error, cmd) {
          deferResult.reject(error);
        }
      });
      return deferResult.promise;
    },

    get providerOnline() {
      if (!this.provider || !xmppSession.data.resources)
        return false;
      return xmppSession.data.resources.indexOf('master') > -1;
    },

    _getFormField: function(cmd, fieldName) {
      var f = null;
      var fields = cmd.form && cmd.form.fields || cmd.fields;
      if (fields)
        fields.forEach(function(field) {
          if (field.var == fieldName)
            f = field;
        });
      return f;
    },

    getFormFieldValue: function(cmd, fieldName, parseJSON) {
      var value,
          field = this._getFormField(cmd, fieldName);

      if (!field)
        return null;

      if (field && field.options.length > 0)
        value = field.options;
      else if (field && field.values.length == 1)
        value = field.values[0];
      else
        value = field.values || null;

      if (value && parseJSON)
        return JSON.parse(value);

      return value;
    },

    getFormFieldAttr: function(cmd, fieldName, attrName) {
      var field = this._getFormField(cmd, fieldName);
      return field[attrName] || null;
    },
  };

}])

.directive('masterStatus', function() {

  return {

    restrict: 'A',

    template: '<span class="btn disabled" ng-class="{\'btn-success\': isOnline, \'btn-danger\': !isOnline}">Master {{ isOnline ? "online" : "offline" }}</span>',

    controller: ['$scope', 'commands', function($scope, commands) {
      $scope.isOnline = false;
      $scope.$watch(function() { return commands.providerOnline; }, function(newVal) {
        $scope.isOnline = newVal;
      });
    }]
  };

});
