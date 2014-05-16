'use strict';

angular.module('warmonic.lib.utils', [])

.filter('join', function() {
  return function(input, sep) {
    if (!sep)
      sep = ", ";
    return input.join(sep);
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

.directive('spinner', function() {
  return {
    restrict: 'A',
    template: '<img src="img/loadinfo.png" alt="Loading..." />',
  };
});
