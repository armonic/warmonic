'use strict';

angular.module('warmonic.lib.xmpp.commands', [
  'warmonic.lib.logger',
  'warmonic.lib.xmpp'
])

.factory('commands', ['$q', 'xmpp', 'logger', function($q, xmpp, logger) {

  return {
    create: function(jid, cmd) {
      return new Strophe.Commands.RemoteCommand(xmpp._connection, jid, cmd);
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
          deferResult.resolve(result);
        },
        error: function(error, cmd) {
          deferResult.reject(error);
        },
        responseForm: form
      });
      return deferResult.promise;
    },

    prev: function(cmd) {
      var deferResult = $q.defer();
      cmd.prev({
        success: function(result, cmd) {
          deferResult.resolve(result);
        },
        error: function(error, cmd) {
          deferResult.reject(error);
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
    }
  }
}]);
