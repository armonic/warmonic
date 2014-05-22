/*jshint multistr: true*/
'use strict';

angular.module('warmonic.build.directives', [])

.directive('tree', ['RecursionHelper', function(RecursionHelper) {

  return {

    restrict: 'E',

    scope: {
      node: '='
    },

    replace: true,

    template: '<ul><li ng-show="node.data"><node data="node.data" /></li><tree ng-repeat="child in node.children" node="child" /></ul>',

    compile: function(element) {
        // Use the compile function from the RecursionHelper,
        // And return the linking function(s) which it returns
        return RecursionHelper.compile(element);
    }

  };

}])

.directive('node', [function() {

  return {

    restrict: 'E',

    scope: {
      data: '='
    },

    replace: true,

    template: '\
      <span ng-switch="data.type"> \
        \
        <h4 ng-switch-when="text">{{ data.value }}</h4> \
        \
        <span ng-switch-when="input"> \
          <nodeinput data="data" /> \
        </span> \
        \
        <span ng-switch-when="select"> \
          <nodeselect data="data" /> \
        </span> \
        \
        <form ng-switch-when="form" role="form"> \
          <legend>{{ data.legend }}</legend> \
          <nodeinput data="field" ng-repeat="field in data.fields" /> \
        </form> \
        \
      </span>',

  };

}])

.directive('nodeselect', function() {

  return {

    restrict: 'E',

    scope: {
      data: '='
    },

    replace: true,

    template: '\
      <form role="form" class="form-inline"> \
        <label>{{ data.label }}</label> \
        <select ng-model="data.value" ng-disabled="data.disabled" class="form-control" ng-options="option.value as option.label for option in data.options" ng-required></select> \
        <span ng-show="data.processing" spinner /> \
      </form>',

    controller: function($scope) {

      $scope.$watch('data.value', function(newVal, oldVal, scope) {
        if (newVal !== oldVal) {
          if (scope.data.promise) {
            scope.data.processing = true;
            scope.data.disabled = true;
            scope.data.promise.resolve(newVal);
          }
        }
      });

    }
  };
})

.directive('nodeinput', function() {

  return {

    restrict: 'E',

    scope: {
      data: '='
    },

    replace: true,

    template: '<div class="form-group" ng-show="data.show"> \
                <label class="control-label">{{ data.name }}</label> \
                <input type="text" name="{{ data.name }}" ng-model="data.value" ng-disabled="data.disabled" class="form-control" /> \
               </div>',

  };

});
