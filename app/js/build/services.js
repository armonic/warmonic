'use strict';

angular.module('warmonic.build.services', [])

.factory('buildVariables', [function() {

  var variables;

  return {

    init: function() {
      // init variables list
      variables = {};
    },

    variables: function() {
      return variables;
    },

    addField: function(field) {
      if (!variables[field.name]) {
        variables[field.name] = field;
        return variables[field.name];
      }
      return false;
    },

    getField: function(fieldName) {
      return variables[fieldName] || null;
    }

  };

}])

.factory('buildTree', [function() {

  var trees = {};

  var BuildTree = function() {
      // init the tree
      this._tree = {children: {}};
  };

  angular.extend(BuildTree.prototype, {

    getRootNode: function() {
      return this._tree;
    },

    getTreeNode: function(treeIndex, node) {
      var _treeIndex = treeIndex.slice();
      if (!node)
        node = this._tree;

      var id = _treeIndex.shift();

      if (!node.children)
        node.children = {};

      if (!node.children[id])
        node.children[id] = {children: {}, data: null};

      if (_treeIndex.length > 0) {
        return this.getTreeNode(_treeIndex, node.children[id]);
      }

      return node.children[id];
    },

    deleteNode: function(treeIndex) {
      var nodeIndex = treeIndex.pop();
      var node = this.getTreeNode(treeIndex);

      delete node.children[nodeIndex];
    },

    emptyNode: function(treeIndex) {
      var node = this.getTreeNode(treeIndex);
      node.data = null;

      return node;
    },

    fillNodeData: function(treeIndex, data) {
      var node = this.getTreeNode(treeIndex);
      node.data = data;

      return node;
    },

    fillNodeHost: function(treeIndex, host) {
      var node = this.getTreeNode(treeIndex);
      node.host = host;

      return node;
    }

  });

  return {

    get: function(id) {
      if (!trees[id])
        this.create(id);

      return trees[id];
    },

    create: function(id) {
      trees[id] = new BuildTree();

      return trees[id];
    }

  };

}])

.factory('build', ['$q', 'commands', 'buildTree', 'buildVariables', 'global', function($q, commands, buildTree, buildVariables, global) {

  var _cmd,
      tree,
      _variables;

  return {

    data: {
      sessionId: false,
    },

    init: function() {
      // init build command
      _cmd = commands.create('build');
      tree = buildTree.create('build');

      buildVariables.init();
    },

    tree: function() {
      return tree.getRootNode();
    },

    variables: function() {
      return buildVariables.variables();
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


    run: function(xpath) {

      this.init();

      tree.fillNodeData([0], {type: "loading"});

      commands.execute(_cmd)

      .then(angular.bind(this, function(cmd) {

        this.data.sessionId = cmd.sessionid;

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
      tree.fillNodeData(treeIndex, field);

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
      tree.fillNodeData(treeIndex, {type: "loading"});

      commands.next(cmd, form)
      .then(angular.bind(this, function(cmd) {

        // don't show anything if the
        // requirement is manually managed
        if (xpath == "None")
          tree.deleteNode(treeIndex);
        else
          tree.fillNodeData(treeIndex, {type: "text", value: label || xpath});

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
      var node = tree.fillNodeData(treeIndex, field);

      deferredSelection.promise.then(angular.bind(this, function(host) {
        this.sendHostChoice(cmd, host, node);
      }));
    },

    sendHostChoice: function(cmd, host, node) {
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
      tree.fillNodeHost(treeIndex, host);

      commands.next(cmd, form)
      .then(angular.bind(this, function(cmd) {
        node.data.processing = false;
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
        label: provideLabel,
        fields: []
      };
      // add configuration fields to the form
      cmd.form.fields.slice(2).forEach(angular.bind(this, function(field) {
        var fieldName = field.var;

        // don't add the same field twice
        if (! buildVariables.getField(fieldName)) {
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
          form.fields.push(buildVariables.addField(formField));
        }

      }));
      tree.fillNodeData(treeIndex, form);

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
