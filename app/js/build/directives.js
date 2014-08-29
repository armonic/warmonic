/*jshint multistr: true*/
'use strict';

angular.module('warmonic.build.directives', [])

.directive('tree', ['RecursionHelper', function(RecursionHelper) {

  return {

    restrict: 'E',

    scope: true,

    replace: true,

    template: '<ul><li ng-show="node.data"><node node-data="node.data" node-title="node.title" node-host="node.host" node-show="node.show" /></li><tree ng-repeat="child in node.children" node="child" /></ul>',

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

    replace: false,

    templateUrl: 'partials/build/node.html',

    compile: function(element) {
      // Use the compile function from the RecursionHelper,
      // And return the linking function(s) which it returns
      return RecursionHelper.compile(element, this.link);
    },

    link: function(scope, element, attrs) {

      scope.$watch(attrs.nodeTitle, function(newVal, oldVal) {
        scope.title = newVal;
      });

      scope.$watch(attrs.nodeData, function(newVal, oldVal) {
        scope.data = newVal;
      });

      scope.$watch(attrs.nodeHost, function(newVal, oldVal) {
        scope.host = newVal;
      });

      scope.$watch(attrs.nodeShow, function(newVal, oldVal) {
        scope.show = newVal;
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

      $scope.$watch('selectField.value', function(newVal, oldVal, scope) {
        if (newVal && newVal !== oldVal) {
          scope.selectField.submit(newVal);
        }
      });

    },

    link: function(scope, element, attrs) {

      scope.$watch(attrs.data, function(newVal, oldVal) {
        scope.selectField = newVal;
      });

    }
  };
})

.directive('nodechoose', function() {

  return {

    restrict: 'E',

    scope: true,

    replace: true,

    templateUrl: 'partials/build/choose.html',

    link: function(scope, element, attrs) {

      scope.$watch(attrs.data, function(newVal, oldVal) {
        scope.chooseField = newVal;
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

    link: function(scope, element, attrs) {

      scope.$watch(attrs.data, function(newVal, oldVal) {
        scope.inputField = newVal;
      });

    }

  };

})

.directive('nodeinputmulti', function() {

  return {

    restrict: 'E',

    scope: true,

    replace: true,

    templateUrl: 'partials/build/input_multi.html',

    link: function(scope, element, attrs) {

      scope.$watch(attrs.data, function(newVal, oldVal) {
        scope.inputField = newVal;
      });

    }

  };

})

.directive('nodeform', function() {

  return {

    restrict: 'E',

    scope: true,

    replace: true,

    templateUrl: 'partials/build/form.html',

    link: function(scope, element, attrs) {

      scope.$watch(attrs.data, function(newVal, oldVal) {
        scope.formData = newVal;
      });

    }

  };

});
