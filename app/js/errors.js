'use strict';

angular.module('warmonic.lib.xmpp.errors', [
  'warmonic.lib.xmpp'
])

.factory('errors', ['$q', '$modal', 'xmpp', 'xmppService', function($q, $modal, xmpp, xmppService) {

  var errors = xmppService.create();
  angular.extend(errors, {
    onConnection: function(conn) {
      conn.addHandler(angular.bind(this, this.onError), 'armonic', 'iq', 'error');
    },

    onError: function(msg) {
      msg = $(msg);
      var code = msg.children('exception').children('code').text(),
          error = msg.children('exception').children('message').text();

      var modal = $modal.open({
        templateUrl: 'partials/error-modal.html',
        controller: function($scope, $modalInstance) {
          $scope.title = code;
          $scope.error = error;
          $scope.close = $modalInstance.close;
        }
      });

      return true;
    }

  });

}]);
