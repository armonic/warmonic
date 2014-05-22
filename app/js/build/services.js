'use strict';

angular.module('warmonic.build.services', [])

.factory('build', ['$q', 'commands', 'global', function($q, commands, global) {

  var _cmd,
      tree,
      variablesFields;

  return {

    init: function() {
      // init the tree
      tree = {children: [], data: null};
      // init variablesFields list
      variablesFields = {};
      // init build command
      _cmd = commands.create('build');
    },

    tree: function() {
      return tree;
    },

    variables: function() {
      return variablesFields;
    },

    _onRecv: function(cmd) {
      if (cmd.form.instructions == "specialize")
        this.specialize(cmd);
      if (cmd.form.instructions == "manage")
        this.manage(cmd);
      if (cmd.form.instructions == "validation")
        this.validation(cmd);
      if (cmd.form.instructions == "done")
        this.done(cmd);
    },

    _getFormField: function(cmd, fieldName) {
      var value;
      cmd.form.fields.forEach(function(field) {
        if (field.var == fieldName)
          value = field.values;
      });
      if (value.length == 1)
        return value[0];
      return value;
    },

    _getTreeIndex: function(cmd) {
      var strTreeIndex = this._getFormField(cmd, "tree_id");
      var treeIndex = strTreeIndex.replace('[', '').replace(']', '').split(',').map(function(i) {
        return parseInt(i.trim());
      });
      return treeIndex;
    },

    _fillNode: function(treeIndex, data, node) {
      var _treeIndex = treeIndex.slice();
      if (!node)
        node = tree;

      var id = _treeIndex.shift();

      if (!node.children)
        node.children = [];

      if (!node.children[id])
        node.children[id] = {children: [], data: null};

      if (_treeIndex.length > 0) {
        return this._fillNode(_treeIndex, data, node.children[id]);
      }

      node.children[id].data = data;
    },

    _addVariableField: function(field) {
      if (!variablesFields[field.name]) {
        variablesFields[field.name] = field;
        return variablesFields[field.name];
      }
      return false;
    },

    _getVariableField: function(fieldName) {
      return variablesFields[fieldName] || null;
    },

    run: function(xpath) {

      this.init();
      commands.execute(_cmd)

      .then(angular.bind(this, function(cmd) {
        // specify the first provide
        var form = $form({
          fields: [
            $field({var: "xpath", value: xpath})
          ]
        });

        return commands.next(cmd, form);
      }))

      .then(angular.bind(this, function(cmd) {
        // On the first provide, choose automatically
        // if there is only one provide
        var xpaths = this.getSpecializeChoices(cmd);
        if (xpaths.length == 2) {
          // skip the None choice
          this.specializeNode(cmd, xpaths[1]);
        }
        // else, let the user decide
        else {
          this._onRecv(cmd);
        }
      }));

    },

    getSpecializeChoices: function(cmd) {
      var xpaths = [];
      // get possible xpaths
      cmd.form.fields.forEach(function(field) {
        if (field.var == "specialize") {
          field.options.forEach(function(option) {
            xpaths.push(option.value);
          });
        }
      });
      return xpaths;
    },

    specialize: function(cmd) {
      var xpaths = this.getSpecializeChoices(cmd),
          treeIndex = this._getTreeIndex(cmd),
          deferredSelection = $q.defer(),
          label,
          options = [];

      if (xpaths.length == 2) {
        // on normal mode call by default
        if (! global.options.expertMode)
          this.specializeNode(cmd, xpaths[1]);

        label = "Call " + xpaths[1] + " ?";
        options = [
          {label: "Yes", value: xpaths[1]},
          {label: "Manual", value: xpaths[0]}
        ];
      }
      else {
        label = "Choose the provide to call";
        xpaths.forEach(function(xpath) {
          if (xpath != "None")
            options.push({label: xpath, value: xpath});
        });
      }

      // field to display on the tree
      var field = {
        type: "select",
        label: label,
        options: options,
        promise: deferredSelection,
        disabled: false,
        processing: false
      };
      console.log(treeIndex);
      this._fillNode(treeIndex, field);

      // when choice is done
      deferredSelection.promise.then(angular.bind(this, function(xpath) {
        this.specializeNode(cmd, xpath);
      }));
    },

    specializeNode: function(cmd, xpath) {
      var treeIndex = this._getTreeIndex(cmd);

      var form = $form({
        type: "submit",
        fields: [
          $field({
            var: "xpath",
            value: xpath,
            type: "list-single"
          })
        ]
      });

      commands.next(cmd, form)
      .then(angular.bind(this, function(cmd) {
        console.log(treeIndex);
        this._fillNode(treeIndex, {type: "text", value: xpath});
        this._onRecv(cmd);
      }));

    },

    manage: function(cmd) {
      var xpath = cmd.form.fields[0].values[0];
      // always manage for now
      var form = $form({
        type: "submit",
        fields: [
          $field({var: "xpath", value: xpath})
        ]
      });

      commands.next(cmd, form)
      .then(angular.bind(this, this._onRecv));
    },

    validation: function(cmd) {
      var treeIndex = this._getTreeIndex(cmd),
          provideName = this._getFormField(cmd, "provide");

      // Configuration form to display
      var form = {
        type: "form",
        legend: provideName + " configuration",
        fields: []
      };
      // add configuration fields to the form
      cmd.form.fields.slice(2).forEach(angular.bind(this, function(field) {
        var fieldName = field.var;

        // don't add the same field twice
        if (! this._getVariableField(fieldName)) {
          var formField = {
            type: "input",
            name: fieldName,
            label: field.label,
            required: field.required,
            get show() {
              if (this.resolved_by || this.set_by)
                return false;
              if (this.expert && !global.options.expertMode)
                return false;
              return true;
            },
          };
          field.options.forEach(function(option) {
            var value = option.value;
            if (value == "True")
              value = true;
            else if (value == "False")
              value = false;
            formField[option.label] = value;
          });
          form.fields.push(this._addVariableField(formField));
        }

      }));
      console.log(treeIndex);
      this._fillNode(treeIndex, form);

      commands.next(cmd)
      .then(angular.bind(this, this._onRecv));
    },

    done: function(cmd) {
      console.log("end build");
      if (cmd.status != "completed") {
        commands.next(cmd)
        .then(angular.bind(this, this._onRecv));
      }
      else {
        console.log(tree);
      }
    }
  };

}]);
