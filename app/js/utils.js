/*jshint multistr: true*/
'use strict';


angular.module('warmonic.lib.utils', [])

.filter('join', function() {
  return function(input, sep) {
    if (!sep)
      sep = ", ";
    return input.join(sep);
  };
})

.filter('stringify', function() {
  return function(input, indent) {
    if(!indent)
      indent = 2;
    return JSON.stringify(input, null, indent);
  };
})

.filter('bareJid', function() {
  return Strophe.getBareJidFromJid;
})

.filter('nodeJid', function() {
  return Strophe.getNodeFromJid;
})

.filter('resourceJid', function() {
  return Strophe.getResourceFromJid;
})

.filter('domainJid', function() {
  return Strophe.getDomainFromJid;
})

.factory('RecursionHelper', ['$compile', function($compile) {
  return {
    /**
     * Manually compiles the element, fixing the recursion loop.
     * @param element
     * @param [link] A post-link function, or an object with function(s) registered via pre and post properties.
     * @returns An object containing the linking functions.
     */
    compile: function(element, link) {
      // Normalize the link parameter
      if (angular.isFunction(link)) {
        link = { post: link };
      }
      // Break the recursion loop by removing the contents
      var contents = element.contents().remove();
      var compiledContents;
      return {
        pre: (link && link.pre) ? link.pre : null,
        /**
         * Compiles and re-adds the contents
         */
        post: function(scope, element) {
          // Compile the contents
          if (!compiledContents) {
            compiledContents = $compile(contents);
          }
          // Re-add the compiled contents to the element
          compiledContents(scope, function(clone) {
            element.append(clone);
          });

          // Call the post-linking function, if any
          if(link && link.post) {
            link.post.apply(null, arguments);
          }
        }
      };
    }
  };
}])

.factory('global', ['$cookieStore', function($cookieStore) {

  var global = {
    options: {
      expertMode: false,
      debugMode: false
    },

    load: function() {
      this.options = $cookieStore.get('global') || this.options;
    },

    save: function() {
      $cookieStore.put('global', this.options);
    },

    toggleOption: function(optionName) {
      if (this.options[optionName] === true || this.options[optionName] === false) {
        this.options[optionName] = ! this.options[optionName];
        this.save();
      }
    }
  };

  global.load();

  return global;

}])

.directive('waSpinner', function() {
  return {
    restrict: 'A',
    template: '<img src="img/loadinfo.png" alt="Loading..." />',
  };
})

.directive('waFocus', function() {
  return function(scope, element, attrs) {
    element[0].focus();
  };
})

.directive('waEnter', function () {
   return function (scope, element, attrs) {
    element.bind("keydown keypress", function (event) {
      if(event.which === 13) {
        scope.$apply(function () {
          scope.$eval(attrs.waEnter);
        });

        event.preventDefault();
      }
    });
  };
});
