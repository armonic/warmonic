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
  'warmonic.nav',
  'warmonic.provides',
  'warmonic.build.directives',
  'warmonic.build.services',
  'warmonic.build.controllers',
])

.run(['$rootScope', '$state', '$stateParams', 'xmpp', 'global', function($rootScope, $state, $stateParams, xmpp, global) {
  $rootScope.$state = $state;
  $rootScope.$stateParams = $stateParams;
  $rootScope.global = global;
  $state.go('login');
  xmpp.attach();
  var listenDisconnect = function() {
    xmpp.getDisconnection().then(function () {
      $state.go('login');
      listenDisconnect();
    });
  };
  listenDisconnect();
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

.config(['commandsProvider', function(commandsProvider) {

  commandsProvider.setProvider('mss-master@im.aeolus.org/master');

}])

.config(['mucProvider', function(mucProvider) {

  mucProvider.setMucDomain('logs.im.aeolus.org');

}])

.config(['$tooltipProvider', function($tooltipProvider) {

  $tooltipProvider.options({
    placement: 'right',
    popupDelay: 0,
    appendToBody: true
  });

}]);
