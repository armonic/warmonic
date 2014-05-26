/*jshint multistr: true*/
'use strict';

angular.module('warmonic.build.directives', [])

.directive('tree', ['RecursionHelper', function(RecursionHelper) {

  return {

    restrict: 'E',

    scope: true,

    replace: true,

    template: '<ul><li ng-show="node.data"><node data="node.data" /></li><tree ng-repeat="child in node.children" node="child" /></ul>',

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

    template: '\
      <span ng-switch="data.type"> \
        \
        <h4 ng-switch-when="text">{{ data.value }}</h4> \
        \
        <span ng-switch-when="loading"> \
          Loading <span spinner /> \
        </span> \
        \
        <span ng-switch-when="input"> \
          <nodeinput data="data" /> \
        </span> \
        \
        <span ng-switch-when="select"> \
          <nodeselect data="data" /> \
        </span> \
        \
        <span ng-switch-when="specialize"> \
          <nodespecialize data="data" /> \
        </span> \
        \
        <form ng-switch-when="form" role="form"> \
          <legend>{{ data.legend }}</legend> \
          <nodeinput data="field" ng-repeat="field in data.fields" /> \
        </form> \
        \
      </span>',

    link: function(scope, element, attrs) {

      scope.$watch(attrs.data, function(newVal, oldVal) {
        scope.data = newVal;
      });

    }

  };

}])

.directive('nodeselect', function() {

  return {

    restrict: 'E',

    scope: true,

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

    template: '\
      <div class="specialize"> \
        <button class="btn btn-primary" ng-disabled="data.processing" ng-repeat="option in data.options" ng-click="select(option.value)">{{ option.label }}</button> \
        <span ng-show="data.processing" spinner /> \
      </div>',

    controller: function($scope) {

      $scope.select = function(value) {
        $scope.data.processing = true;
        $scope.data.promise.resolve(value);
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

    template: '<div class="form-group" ng-show="data.show" ng-class="{\'has-warning\': data.expert}"> \
                <label class="control-label" for="{{ data.name }}">{{ data.label }}</label> \
                <input type="text" name="{{ data.name }}" id="{{ data.name }}" ng-model="data.value" ng-disabled="data.disabled" class="form-control" /> \
                <p class="help-block" ng-if="global.options.debugMode"><small>{{ data.name }}</small></p> \
               </div>',

    link: function(scope, element, attrs) {

      scope.$watch(attrs.data, function(newVal, oldVal) {
        scope.data = newVal;
      });

    }

  };

});
