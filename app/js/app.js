'use strict';

angular.module('warmonic', [
  'ngAnimate',
  'ui.router',
  'ui.bootstrap.tooltip',
  'warmonic.lib.utils',
  'warmonic.lib.xmpp',
  'warmonic.lib.xmpp.roster',
  'warmonic.lib.xmpp.muc',
  'warmonic.lib.xmpp.commands',
  'warmonic.lib.logger',
  'warmonic.login',
  'warmonic.nav',
  'warmonic.provides',
  'warmonic.build.directives',
  'warmonic.build.services',
  'warmonic.build.controllers',
])

.run(['$rootScope', '$state', '$stateParams', 'xmppSession', 'xmpp', 'global', 'commands', 'muc', function($rootScope, $state, $stateParams, xmppSession, xmpp, global, commands, muc) {
  $rootScope.$state = $state;
  $rootScope.$stateParams = $stateParams;
  $rootScope.global = global;
  // default page
  $state.go('login');
  // try to connect
  xmpp.attach();
  // listen connections/disconnections globally
  var listenDisconnect = function() {
    xmpp.getDisconnection().then(function () {
      $state.go('login');
      listenDisconnect();
    });
  };
  listenDisconnect();
  var listenConnect = function() {
    xmpp.getConnection().then(function(conn) {
      $state.go('provides');
      // configure services
      commands.provider = xmppSession.data.commandsProvider;
      muc.domain = xmppSession.data.mucDomain;
      listenConnect();
    });
  };
  listenConnect();
}])

.config(['$stateProvider', function($stateProvider) {
  $stateProvider

  .state('login', {
     url: '/login',
     templateUrl: "partials/login.html"
  })

  .state('provides', {
    url: '/provides',
    templateUrl: 'partials/provides.html'
  })

  .state('build', {
    url: '/build?provide',
    templateUrl: 'partials/build.html'
  });

}])

.config(['$tooltipProvider', function($tooltipProvider) {

  $tooltipProvider.options({
    placement: 'right',
    popupDelay: 0,
    appendToBody: true
  });

}]);
