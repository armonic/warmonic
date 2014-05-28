/*jshint multistr: true*/
'use strict';

angular.module('warmonic.build.directives', [])

.directive('tree', ['RecursionHelper', function(RecursionHelper) {

  return {

    restrict: 'E',

    scope: true,

    replace: true,

    template: '<ul><li ng-show="node.data"><node data="node.data" host="node.host" /></li><tree ng-repeat="child in node.children" node="child" /></ul>',

    compile: function(element) {
        // Use the compile function from the RecursionHelper,
        // And return the linking function(s) which it returns
        return RecursionHelper.compile(element, this.link);
    },

    link: function(scope, element, attrs) {

      scope.$watch(attrs.node, function(newVal, oldVal) {
        scope.node = newVal;
      });

    }

  };

}])

.directive('node', [function() {

  return {

    restrict: 'E',

    scope: true,

    replace: true,

    templateUrl: 'partials/build/node.html',

    link: function(scope, element, attrs) {

      scope.$watch(attrs.data, function(newVal, oldVal) {
        scope.data = newVal;
      });

      scope.$watch(attrs.host, function(newVal, oldVal) {
        scope.host = newVal;
      });

    }

  };

}])

.directive('nodeselect', function() {

  return {

    restrict: 'E',

    scope: true,

    replace: true,

    templateUrl: 'partials/build/select.html',

    controller: function($scope) {

      $scope.$watch('data.value', function(newVal, oldVal, scope) {
        if (newVal !== oldVal) {
          if (scope.data.params.promise) {
            scope.data.processing = true;
            scope.data.disabled = true;
            scope.data.params.promise.resolve(newVal);
          }
        }
      });

    },

    link: function(scope, element, attrs) {

      scope.$watch(attrs.data, function(newVal, oldVal) {
        scope.data = newVal;
      });

    }
  };
})

/** In th specilize step use buttons instead of a select box */
.directive('nodespecialize', function() {

  return {

    restrict: 'E',

    scope: true,

    replace: true,

    templateUrl: 'partials/build/specialize.html',

    controller: function($scope) {

      $scope.select = function(value) {
        $scope.data.processing = true;
        $scope.data.params.promise.resolve(value);
      };

    },

    link: function(scope, element, attrs) {

      scope.$watch(attrs.data, function(newVal, oldVal) {
        scope.data = newVal;
      });

    }
  };
})

.directive('nodeinput', function() {

  return {

    restrict: 'E',

    scope: true,

    replace: true,

    templateUrl: 'partials/build/input.html',

    controller: function($scope) {

      $scope.submit = function() {
        if ($scope.data.params.promise) {
          $scope.data.processing = true;
          $scope.data.disabled = true;
          $scope.data.params.promise.resolve($scope.data.value);
        }
      };

    },

    link: function(scope, element, attrs) {

      scope.$watch(attrs.data, function(newVal, oldVal) {
        scope.data = newVal;
      });

    }

  };

});
