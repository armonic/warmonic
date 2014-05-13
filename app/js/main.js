'use strict';

angular.module('warmonic.main', [
  'warmonic.lib.logger',
  'warmonic.lib.xmpp.commands'
])

.controller('mainCtrl', ['$state', 'logger', 'xmpp', 'commands', function($state, logger, xmpp, commands) {
  if (!xmpp.connected)
    $state.go('login');

  this.provides = "";

  var cmd = commands.create('mss-master@im.aeolus.org/master', 'provides');
  commands.execute(cmd).then(
    angular.bind(this, function(cmd) {
      this.provides = cmd.form.toJSON();
      console.log(this.provides);
    }),
    function(cmd) {
      console.log("provides error");
    }
  )
}]);
