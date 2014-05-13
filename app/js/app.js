'use strict';

angular.module('warmonic', [
  'ui.router',
  'warmonic.lib.xmpp',
  'warmonic.lib.xmpp.roster',
  'warmonic.lib.xmpp.commands',
  'warmonic.lib.logger',
  'warmonic.main'
]).

run(['$rootScope', '$state', '$stateParams', 'xmpp', function($rootScope, $state, $stateParams, xmpp) {
  $rootScope.$state = $state;
  $rootScope.$stateParams = $stateParams;
  xmpp.attach();
}]).

config(['$stateProvider', '$httpProvider', function($stateProvider, $httpProvider) {
  $stateProvider

  .state('login', {
     url: '/login',
     templateUrl: "partials/login.html"
  })

  .state('main', {
    abstract: true,
    templateUrl: 'partials/home.html'
  })

  .state('main.main', {
     url: '/main',
     views: {
       "roster": {
         templateUrl: "partials/roster.html"
       },
       "main": {
         templateUrl: "partials/main.html"
       }
     }
  })

}]);
