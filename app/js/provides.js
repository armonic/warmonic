'use strict';

angular.module('warmonic.provides', [
  'warmonic.lib.logger',
  'warmonic.lib.xmpp.commands'
])

.controller('providesCtrl', ['$timeout', '$state', 'logger', 'xmpp', 'commands', function($timeout, $state, logger, xmpp, commands) {
  if (!xmpp.connected)
    $state.go('login');

  this.list = [];
  this.tags = [];
  this._searchFilter = "";
  this.searchFilter = "";
  this.searchId = false;

  // called when something is typed in the search filter
  this.updateList = function() {
    if (this.searchId) {
      $timeout.cancel(this.searchId);
      this.searchId = false;
    }
    // don't apply the search filter right away,
    // wait a little
    this.searchId = $timeout(angular.bind(this, function() {
      if (this._searchFilter != this.searchFilter) {
        this._searchFilter = this.searchFilter;
        logger.debug("Searching for " + this._searchFilter);
      }
    }), 400);
  }

  // used to display the provides list
  this.getList = function() {
    var tags = this.getActiveTags();

    if (!this._searchFilter && tags.length == 0)
      return this.list;

    var self = this,
        regexps = [],
        // copy to new list
        list = this.list;

    // create regexps to search provides
    this._searchFilter.split(' ').forEach(function(term) {
      regexps.push(new RegExp(term, "i"));
    });

    // count search matches for each provide
    list.forEach(function(provide) {
      var matches = 0;

      // filter by tag
      if (tags) {
        matches += provide.tags.filter(function(tagName) {
          return tags.indexOf(tagName) > -1;
        }).length;
      }
      // filter by keyword unless active tags don't match
      // the current provide
      if (matches > 0 || tags.length == 0) {
        regexps.forEach(function(regexp) {
          angular.forEach(provide, function(value, key) {
            if (regexp.test(value)) {
              matches += 1;
            }
          });
        });
      }
      provide.matches = matches;
    });

    // return provides with at leat one match
    // and sorted by matches
    return list.filter(function(provide) {
      return provide.matches > tags.length;
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

  // Get initial provides list
  var cmd = commands.create('mss-master@im.aeolus.org/master', 'provides'),
      self = this;

  commands.execute(cmd).then(
    function(cmd) {
      var result = cmd.form.toJSON();
      result.items.forEach(function(item) {
        var provide = {
          'xpath': item.fields[0].values[0],
          'tags': item.fields[1].values[0].split(','),
          'label': item.fields[2].values[0],
          'desc': item.fields[3].values[0]
        };
        // TEMP
        var rand = Math.round(Math.random());
        provide.tags.splice(rand, 1);
        // TEMP
        provide.tags.forEach(function(tag) {
          // add tag if not exist
          if (self.tags.filter(function(a) { return a.name == tag}).length == 0) {
            self.tags.push({
              name: tag,
              active: false
            });
          }
        });
        self.list.push(provide);
      });
    },
    function(cmd) {
      logger.error("Failed to get provides list");
    }
  );

}]);
