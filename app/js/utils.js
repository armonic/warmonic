'use strict';

angular.module('warmonic.lib.utils', [])

.filter('join', function() {
  return function(input, sep) {
    if (!sep)
      sep = ", ";
    return input.join(sep);
  };
});
