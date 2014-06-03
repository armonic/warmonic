'use strict';

angular.module('warmonic.build.services', [])

.factory('buildVariables', ['global', function(global) {

  var variables;

  /** BuildVariables service used to create
   * variables fields and keep a reference
   * to them if necessary.
   */
  var BuildVariables = {

    init: function() {
      // init variables list
      variables = {};
    },

    variables: function() {
      return variables;
    },

    /** Just create a new field */
    createField: function(type, name, params) {
      var field = new VariableField(type, name, params);

      return field;
    },

    /** Create a field and save a reference on it */
    addField: function(type, name, params) {
      // Don't add the same variable twice
      if (!variables[name]) {
        variables[name] = this.createField(type, name, params);
        return variables[name];
      }
      return variables[name];
    },

    /** Get already created field */
    getField: function(fieldName) {
      return variables[fieldName] || null;
    }

  };

  /** VariableField object used to instanciate
   * new variables fields
   */
  var VariableField = function(type, name, params) {
    this.type = type;
    this.name = name;
    this.params = {
      value: "",
      label: "",
      help: "",
      suggested_by: "",
      resolved_by: "",
      set_by: "",
      promise: null,
      expert: false,
      fields: []
    };
    this.disabled = false;
    this.processing = false;
    this.required = false;

    angular.extend(this.params, params);

    this.sanitizeParamsValues();
  };

  VariableField.prototype = {

    sanitizeParamsValues: function() {

      angular.forEach(this.params, angular.bind(this, function(value, key) {
        if (value == "True")
          value = true;
        else if (value == "False")
          value = false;
        else if (value == "None")
          value = "";
        this.params[key] = value;
      }));

    },

    get fields() {
      return this.params.fields;
    },

    get value() {
      return this.params.value;
    },

    set value(data) {
      this.params.value = data;
    },

    /** Get the label text to show */
    get label() {
      var labelText = this.params.label || this.name;
      if (this.params.suggested_by) {
        var suggested_by_field = BuildVariables.getField(this.params.suggested_by);
        if (suggested_by_field && suggested_by_field.label)
          labelText = suggested_by_field.label;
      }
      return labelText;
    },

    /** Get the tooltip text to show */
    get help() {
      var tooltipText = this.params.help || null;
      if (this.params.suggested_by) {
        var suggested_by_field = BuildVariables.getField(this.params.suggested_by);
        if (suggested_by_field && suggested_by_field.help)
          tooltipText = suggested_by_field.help;
      }
      return tooltipText;
    },

    /** Should the field be visible ? */
    get show() {
      if (this.params.resolved_by || this.params.set_by)
        return false;
      if (this.params.expert && !global.options.expertMode)
        return false;
      return true;
    },

  };

  return BuildVariables;

}])

.factory('buildTree', [function() {

  var trees = {};

  /** BuildTree object used to create
   * the structure for the build service
   */
  var BuildTree = function() {
      // init the tree
      this._tree = {};
  };

  BuildTree.prototype = {

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

  };

  /** buildTree service manage a list
   * of BuildTree instances
   */
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
      this.data.sessionId = null;
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
      if (cmd.form.instructions == "multiplicity")
        this.multiplicity(cmd);
      if (cmd.form.instructions == "validation")
        this.validation(cmd);
      if (cmd.form.instructions == "done")
        this.done(cmd);
    },

    _getTreeIndex: function(cmd) {
      var strTreeIndex = commands.getFormFieldValue(cmd, "tree_id");
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
      var fieldParams = {
        fields: options,
        promise: deferredSelection,
      };
      var field = buildVariables.createField("specialize",
                                             null,
                                             fieldParams);
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
          provideName = commands.getFormFieldValue(cmd, 'provide'),
          label = commands.getFormFieldAttr(cmd, 'host', 'label'),
          host = commands.getFormFieldValue(cmd, 'host'),
          deferredSelection = $q.defer();

      var fieldParams = {
        label: label,
        value: host,
        promise: deferredSelection,
      };
      var field = buildVariables.createField("input",
                                             null,
                                             fieldParams);
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

    multiplicity: function(cmd) {
      var nbInstances = commands.getFormFieldValue(cmd, 'multiplicity'),
          treeIndex = this._getTreeIndex(cmd),
          deferredSelection = $q.defer();

      var fieldParams = {
        label: "How many time do you want to call ",
        value: nbInstances,
        promise: deferredSelection,
      };
      var field = buildVariables.createField("input",
                                             null,
                                             fieldParams);
      var node = tree.fillNodeData(treeIndex, field);

      deferredSelection.promise.then(angular.bind(this, function(multiplicity) {
        this.sendMultiplicity(cmd, multiplicity, node);
      }));
    },

    sendMultiplicity: function(cmd, multiplicity, node) {
      var treeIndex = this._getTreeIndex(cmd);

      var form = $form({
        type: "submit",
        fields: [
          $field({
            var: "multiplicity",
            value: multiplicity,
            type: "input-single"
          })
        ]
      });

      commands.next(cmd, form)
      .then(angular.bind(this, function(cmd) {
        node.data.processing = false;
        this._onRecv(cmd);
      }));

    },

    validation: function(cmd) {
      var treeIndex = this._getTreeIndex(cmd),
          provideName = commands.getFormFieldValue(cmd, "provide"),
          provideLabel = commands.getFormFieldAttr(cmd, "provide", "label");

      // Configuration form to display
      var form = buildVariables.createField("form",
                                            null,
                                            {label: provideLabel});
      // add configuration fields to the form
      cmd.form.fields.slice(2).forEach(angular.bind(this, function(field) {
        var fieldName = field.var,
            formField,
            params = {};

        field.options.forEach(function(option) {
          params[option.label] = option.value;
        });

        formField = buildVariables.addField("input",
                                            fieldName,
                                            params);
        if (formField)
          form.fields.push(formField);

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
