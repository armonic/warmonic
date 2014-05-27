'use strict';

angular.module('warmonic.build.services', [])

.factory('build', ['$q', 'commands', 'global', function($q, commands, global) {

  var _cmd,
      tree,
      variablesFields;

  return {

    init: function() {
      // init the tree
      tree = {children: []};
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
      if (cmd.form.instructions == "post_specialize")
        this.hostChoice(cmd);
      if (cmd.form.instructions == "validation")
        this.validation(cmd);
      if (cmd.form.instructions == "done")
        this.done(cmd);
    },

    _getFormField: function(cmd, fieldName) {
      var f;
      cmd.form.fields.forEach(function(field) {
        if (field.var == fieldName)
          f = field;
      });
      return f;
    },

    _getFormFieldValue: function(cmd, fieldName) {
      var field = this._getFormField(cmd, fieldName);
      if (field && field.values.length == 1)
        return field.values[0];
      return field.values || null;
    },

    _getFormFieldAttr: function(cmd, fieldName, attrName) {
      var field = this._getFormField(cmd, fieldName);
      return field[attrName] || null;
    },

    _getTreeIndex: function(cmd) {
      var strTreeIndex = this._getFormFieldValue(cmd, "tree_id");
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

      this._fillNode([0], {type: "loading"});

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
        var choices = this.getSpecializeChoices(cmd);
        if (choices.length == 2) {
          // skip the None choice
          this.sendSpecialize(cmd, choices[1].xpath, choices[1].label);
        }
        // else, let the user decide
        else {
          this._onRecv(cmd);
        }
      }));

    },

    getSpecializeChoices: function(cmd) {
      var choices = [];
      // get possible xpaths
      cmd.form.fields.forEach(function(field) {
        if (field.var == "specialize") {
          field.options.forEach(function(option) {
            choices.push({
              label: option.label,
              xpath: option.value
            });
          });
        }
      });
      return choices;
    },

    specialize: function(cmd) {
      var choices = this.getSpecializeChoices(cmd),
          treeIndex = this._getTreeIndex(cmd),
          deferredSelection = $q.defer(),
          label,
          options = [];

      if (choices.length == 2) {
        // on normal mode call by default
        if (! global.options.expertMode) {
          this.sendSpecialize(cmd, choices[1].xpath, choices[1].label);
          return;
        }

        options = [
          {label: choices[1].label, value: choices[1].xpath},
          {label: choices[0].label, value: choices[0].xpath}
        ];
      }
      else {
        choices.forEach(function(choice) {
          if (choice.xpath != "None")
            options.push({label: choice.label, value: choice.xpath});
        });
      }

      // field to display on the tree
      var field = {
        type: "specialize",
        options: options,
        promise: deferredSelection,
        disabled: false,
        processing: false
      };
      this._fillNode(treeIndex, field);

      // when choice is done
      deferredSelection.promise.then(angular.bind(this, function(xpath) {
        this.sendSpecialize(cmd, xpath);
      }));
    },

    sendSpecialize: function(cmd, xpath, label) {
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
      this._fillNode(treeIndex, {type: "loading"});

      commands.next(cmd, form)
      .then(angular.bind(this, function(cmd) {
        this._fillNode(treeIndex, {type: "text", value: label || xpath});
        this._onRecv(cmd);
      }));

    },

    hostChoice: function(cmd) {
      var treeIndex = this._getTreeIndex(cmd),
          provideName = this._getFormFieldValue(cmd, 'provide'),
          label = this._getFormFieldAttr(cmd, 'host', 'label'),
          host = this._getFormFieldValue(cmd, 'host'),
          deferredSelection = $q.defer();

      var field = {
        type: "input",
        label: label,
        value: host,
        promise: deferredSelection,
        disabled: false,
        processing: false,
        required: true,
        show: true
      };
      this._fillNode(treeIndex, field);

      deferredSelection.promise.then(angular.bind(this, function(host) {
        this.sendHostChoice(cmd, host, field);
      }));
    },

    sendHostChoice: function(cmd, host, field) {
      var treeIndex = this._getTreeIndex(cmd);

      var form = $form({
        type: "submit",
        fields: [
          $field({
            var: "host",
            value: host,
            type: "input-single"
          })
        ]
      });

      commands.next(cmd, form)
      .then(angular.bind(this, function(cmd) {
        field.processing = false;
        this._onRecv(cmd);
      }));

    },


    validation: function(cmd) {
      var treeIndex = this._getTreeIndex(cmd),
          provideName = this._getFormFieldValue(cmd, "provide"),
          provideLabel = this._getFormFieldAttr(cmd, "provide", "label");

      // Configuration form to display
      var form = {
        type: "form",
        legend: provideLabel,
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
            else if (value == "None")
              value = "";
            formField[option.label] = value;
          });
          form.fields.push(this._addVariableField(formField));
        }

      }));
      this._fillNode(treeIndex, form);

      commands.next(cmd)
      .then(angular.bind(this, this._onRecv));
    },

    done: function(cmd) {
      if (cmd.status != "completed") {
        commands.next(cmd)
        .then(angular.bind(this, this._onRecv));
      }
    }
  };

}]);
