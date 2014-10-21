/*jshint multistr: true*/
'use strict';

angular.module('warmonic.build.directives', [])

.directive('tree', ['RecursionHelper', function(RecursionHelper) {

  return {

    restrict: 'E',

    scope: true,

    replace: true,

    template: '<ul class="tree"><li class="tree" ng-show="node.data"><node node-data="node.data" node-title="node.title" node-name="node.name" node-host="node.host" node-show="node.show" node-logger="node.logger" /></li><tree ng-repeat="child in node.children" node="child" /></ul>',

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

      scope.$watch(attrs.nodeLogger, function(newVal, oldVal) {
        scope.logger = newVal;
      });

      scope.$watch(attrs.nodeName, function(newVal, oldVal) {
        scope.name = newVal;
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

.directive('nodechoosemulti', function() {

  return {

    restrict: 'E',

    scope: true,

    replace: true,

    templateUrl: 'partials/build/choose_multi.html',

    controller: function($scope) {

      $scope.addField = function() {
        var choice,
            f = $scope.chooseField;
        // find the selected choice based on chosenValue
        // and add it to the fields. Also removes the choice.
        for (var i=0; i<f.choices.length; i++) {
          if (f.choices[i].value == f.chosenValue) {
            f.fields.push(f.choices[i]);
            f.choices.splice(i, 1);
            if (f.choices.length > 0)
              f.chosenValue = f.choices[0].value;
            break;
          }
        }
        f.checkValue();
      };

      $scope.removeField = function(field) {
        var f = $scope.chooseField;
        // Put the choice back and remove it from
        // the fields.
        f.choices.push(field);
        f.fields.splice(f.fields.indexOf(field), 1);
        if (f.choices.length > 0)
          f.chosenValue = f.choices[0].value;
        f.checkValue();
      };

    },

    link: function(scope, element, attrs) {

      scope.$watch(attrs.data, function(newVal, oldVal) {
        scope.chooseField = newVal;
        // set a default value
        if (scope.chooseField.choices && scope.chooseField.choices.length > 0 &&
            !scope.chooseField.chosenValue)
          scope.chooseField.chosenValue = scope.chooseField.choices[0].value;
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

})

.directive('noderesult', function() {

  return {

    restrict: 'E',

    scope: true,

    replace: true,

    templateUrl: 'partials/build/result.html',

    link: function(scope, element, attrs) {

      scope.$watch(attrs.data, function(newVal, oldVal) {
        scope.resultData = newVal;
      });

    }

  };

});
