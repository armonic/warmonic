'use strict';

angular.module('warmonic.lib.xmpp.commands', [
  'warmonic.lib.xmpp'
])

.provider('commands', {
  provider: null,

  setProvider: function(jid) {
    this.provider = jid;
  },

  $get: ['$q', 'xmpp', 'roster', function($q, xmpp, roster) {

    var commandProvider = this.provider;
    roster.excludeJid(commandProvider);

    return {
      get provider() {
        return commandProvider;
      },

      create: function(cmd) {
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

      log: function(cmd) {
        console.log("jid : "+ cmd.jid);
        console.log("node : "+ cmd.node);
        console.log("sesionid : "+ cmd.sessionid);
        console.log("executeAction : "+ cmd.executeAction);
        console.log("status : "+ cmd.status);
        console.log("error : "+ cmd.error);
      },

      get providerOnline() {
        var provider = Strophe.getBareJidFromJid(this.provider);
        return roster.isJidOnline(provider);
      },

      _getFormField: function(cmd, fieldName) {
        var f = null;
        var fields = cmd.form && cmd.form.fields || cmd.fields;
        fields.forEach(function(field) {
          if (field.var == fieldName)
            f = field;
        });
        return f;
      },

      getFormFieldValue: function(cmd, fieldName) {
        var field = this._getFormField(cmd, fieldName);
        if (field && field.values.length == 1)
          return field.values[0];
        if (!field)
          return null;
        return field.values || null;
      },

      getFormFieldAttr: function(cmd, fieldName, attrName) {
        var field = this._getFormField(cmd, fieldName);
        return field[attrName] || null;
      },
    };
  }]
})

.directive('masterStatus', function() {

  return {

    restrict: 'A',

    template: '<span class="btn disabled" ng-class="{\'btn-success\': isOnline(), \'btn-danger\': !isOnline()}">Master {{ isOnline() ? "online" : "offline" }}</span>',

    controller: ['$scope', 'commands', function($scope, commands) {

      $scope.isOnline = function() {
        return commands.providerOnline;
      };

    }]
  };

});
