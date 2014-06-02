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

.directive('node', ['RecursionHelper', function(RecursionHelper) {

  return {

    restrict: 'E',

    scope: true,

    replace: true,

    templateUrl: 'partials/build/node.html',

    compile: function(element) {
      // Use the compile function from the RecursionHelper,
      // And return the linking function(s) which it returns
      return RecursionHelper.compile(element, this.link);
    },

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

      $scope.$watch('selectData.value', function(newVal, oldVal, scope) {
        if (newVal !== oldVal) {
          if (scope.selectData.params.promise) {
            scope.selectData.processing = true;
            scope.selectData.disabled = true;
            scope.selectData.params.promise.resolve(newVal);
          }
        }
      });

    },

    link: function(scope, element, attrs) {

      scope.$watch(attrs.selectData, function(newVal, oldVal) {
        scope.selectData = newVal;
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
        $scope.specializeData.processing = true;
        $scope.specializeData.params.promise.resolve(value);
      };

    },

    link: function(scope, element, attrs) {

      scope.$watch(attrs.specializeData, function(newVal, oldVal) {
        scope.specializeData = newVal;
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
        if ($scope.inputData.params.promise) {
          $scope.inputData.processing = true;
          $scope.inputData.disabled = true;
          $scope.inputData.params.promise.resolve($scope.inputData.value);
        }
      };

    },

    link: function(scope, element, attrs) {

      scope.$watch(attrs.inputData, function(newVal, oldVal) {
        scope.inputData = newVal;
      });

    }

  };

});
