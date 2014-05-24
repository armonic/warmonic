'use strict';

angular.module('warmonic.provides', [
  'warmonic.lib.logger',
  'warmonic.lib.xmpp.commands'
])

.controller('providesCtrl', ['$scope', '$timeout', '$state', 'logger', 'xmpp', 'commands', function($scope, $timeout, $state, logger, xmpp, commands) {
  if (!xmpp.connected)
    $state.go('login');

  this.providerOnline = function() {
    return commands.providerOnline;
  };
  // original provides list
  this._list = [];
  // filtered provides list
  this.list = [];
  this.tags = [];
  this.searchFilter = "";
  this._searchFilter = "";
  this.searchId = false;
  this.searching = false;

  // called when something is typed in the search filter
  this.filterList = function() {
    if (this.searchFilter.trim() == this._searchFilter)
      return;

    if (this.searchId) {
      $timeout.cancel(this.searchId);
      this.searchId = false;
    }
    // don't apply the search filter right away,
    // wait a little
    this.searching = true;
    this.searchId = $timeout(angular.bind(this, function() {
      logger.debug("Searching for: " + this.searchFilter);
      this._searchFilter = this.searchFilter;
      this.list = this.updateList();
      this.searching = false;
    }), 400);
  };

  // update list when tag selection changes
  $scope.$watch(
    'provides.tags',
    angular.bind(this, function(newVal, oldVal) {
      this.list = this.updateList();
    }),
    true
  );

  // used to display the provides list
  this.updateList = function() {
    var tags = this.getActiveTags();

    // no filtering, return fast
    if (!this._searchFilter && tags.length === 0)
      return this._list;

    var self = this;
    // create regexps to search provides
    var regexps = this._searchFilter.split(' ').map(function(term) {
      return new RegExp(term, "i");
    });

    // count search matches for each provide
    this._list.forEach(function(provide) {
      var matches = 0;

      // filter by tag
      if (tags) {
        matches += provide.tags.filter(function(tagName) {
          return tags.indexOf(tagName) > -1;
        }).length;
      }
      // filter by keyword unless active tags don't match
      // the current provide
      if (matches > 0 || tags.length === 0) {
        var filterMatch = 0;
        regexps.forEach(function(regexp) {
          angular.forEach(provide, function(value, key) {
            if (regexp.test(value)) {
              filterMatch += 1;
            }
          });
        });
        // if no match set matches to 0
        // even if the tags matches
        if (filterMatch)
          matches += filterMatch;
        else
          matches = 0;
      }
      provide.matches = matches;
    });

    // return provides with at leat one match
    // and sorted by matches
    return this._list.filter(function(provide) {
      return provide.matches;
    }).sort(function(a, b) {
      return a.matches < b.matches;
    });
  };

  this.getActiveTags = function() {
    return this.tags.filter(function(tag) {
      return tag.active;
    }).map(function(tag) {
      return tag.name;
    });
  };

  this.getList = function() {

    var cmd = commands.create('provides'),
        self = this;

    self.searching = true;
    commands.execute(cmd).then(
      function(cmd) {
        var result = cmd.form.toJSON();
        result.items.forEach(function(item) {
          var tags = [];
          if (item.fields[1].values[0])
            tags = item.fields[1].values[0].split(',');

          // don't use internal provides
          if (tags.indexOf('internal') > -1)
            return;

          var provide = {
            'xpath': item.fields[0].values[0],
            'tags': tags,
            'label': item.fields[2].values[0] || item.fields[0].values[0],
            'desc': item.fields[3].values[0]
          };
          provide.tags.forEach(function(tagName) {
            var found = self.tags.some(function(tag) {
              if (tag.name == tagName) {
                tag.count += 1;
                return true;
              }
              return false;
            });
            if (!found) {
              self.tags.push({
                name: tagName,
                active: false,
                count: 1
              });
            }
          });
          self._list.push(provide);
        });
        self.list = self._list;
        self.searching = false;
      },
      function(cmd) {
        logger.error("Failed to get provides list");
        self.searching = false;
      }
    );

  };

  if (this.providerOnline())
    this.getList();

  $scope.$watch('provides.providerOnline()', angular.bind(this, function(newVal, oldVal) {
    if (oldVal === false && newVal === true)
      this.getList();
  }));

}]);

