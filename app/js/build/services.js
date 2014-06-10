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
    createField: function(params, name, type) {
      var field = new VariableField(params, name, type);
      return field;
    },

    createForm: function(params, name) {
      var field = new VariableField(params, name, "form");
      return field;
    },

    /** Create a field and save a reference on it */
    addField: function(params, name, type) {
      if (!variables[name])
        variables[name] = [];
      var field = this.createField(params, name, type);
      variables[name].push(field);
      return field;
    },

    /** Get already created field */
    getField: function(fieldName, index) {
      if (!index)
        index = 0;
      return variables[fieldName] && variables[fieldName][index] || null;
    }

  };

  /** VariableField object used to instanciate
   * new variables fields
   */
  var VariableField = function(params, name, type) {
    this.type = type || "input";
    this.name = name || null;
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

    angular.extend(this.params, this.sanitizeParamsValues(params));
  };

  VariableField.prototype = {

    sanitizeParamsValues: function(params) {

      angular.forEach(params, angular.bind(this, function(value, key) {
        if (value == "True")
          value = true;
        else if (value == "False")
          value = false;
        else if (value == "None")
          value = "";
        if (key == "value" && value) {
          value = JSON.parse(value);
        }
        params[key] = value;
      }));

      if (["armonic_hosts", "list"].indexOf(params.type) > -1) {
        this.type = "input-multi";
        if (params.value) {
          params.fields = [];
          params.value.forEach(angular.bind(this, function(value) {
            params.fields.push({
              value: value
            });
          }));
          params.value = "";
        }
        else {
          params.fields = [{value: ""}];
        }
      }

      // since armonic_hosts and armonic_host are auto-filled
      if (["armonic_hosts", "armonic_host"].indexOf(params.type) > -1) {
        params.expert = true;
      }

      return params;
    },

    get fields() {
      return this.params.fields;
    },

    addField: function(value) {
      this.params.fields.push({
          value: value || ""
      });
    },

    removeField: function(field) {
      this.params.fields.splice(this.params.fields.indexOf(field), 1);
    },

    get value() {
      // returns a list
      if (this.type == "input-multi") {
        return this.params.fields.map(function(field) {
          return field.value;
        });
      }

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

    get canSubmit() {
      return this.params.promise ? true : false;
    },

    submit: function(value) {
      if (this.canSubmit) {
        this.processing = true;
        this.disabled = true;
        if (value)
          this.value = value;
        this.params.promise.resolve(this.value);
      }
    },

    submitDone: function() {
      this.processing = false;
    }

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

.factory('build', ['$q', 'commands', 'muc', 'buildTree', 'buildVariables', 'global', function($q, commands, muc, buildTree, buildVariables, global) {

  var _cmd,
      tree,
      _variables;

  return {

    data: {
      sessionId: false,
      logs: null
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
      var treeIndex = this._getTreeIndex(cmd),
          host = commands.getFormFieldValue(cmd, 'host');

      if (host)
        tree.fillNodeHost(treeIndex, host);

      if (cmd.form.instructions == "specialize")
        this.specialize(cmd, treeIndex);
      if (cmd.form.instructions == "post_specialize")
        this.hostChoice(cmd, treeIndex);
      if (cmd.form.instructions == "multiplicity")
        this.multiplicity(cmd, treeIndex);
      if (cmd.form.instructions == "validation")
        this.validation(cmd, treeIndex);
      if (cmd.form.instructions == "done")
        this.done(cmd, treeIndex);
    },

    _getTreeIndex: function(cmd) {
      return JSON.parse(commands.getFormFieldValue(cmd, "tree_id"));
    },

    run: function(xpath) {

      this.init();

      tree.fillNodeData([0], {type: "loading"});

      commands.execute(_cmd)

      .then(angular.bind(this, function(cmd) {

        this.data.sessionId = cmd.sessionid;
        this.data.logs = muc.join(cmd.sessionid + '@logs.aeolus.org');

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
        var choices = this.getSpecializeChoices(cmd),
            treeIndex = this._getTreeIndex(cmd);
        if (choices.length == 2) {
          // skip the None choice
          this.sendSpecialize(cmd, treeIndex, choices[1].xpath, choices[1].label);
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

    specialize: function(cmd, treeIndex) {
      var choices = this.getSpecializeChoices(cmd),
          deferredSelection = $q.defer(),
          label,
          options = [];

      if (choices.length == 2) {
        // on normal mode call by default
        if (! global.options.expertMode) {
          this.sendSpecialize(cmd, treeIndex, choices[1].xpath, choices[1].label);
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
      var field = buildVariables.createField(fieldParams, null, "specialize");
      tree.fillNodeData(treeIndex, field);

      // when choice is done
      deferredSelection.promise.then(angular.bind(this, function(xpath) {
        this.sendSpecialize(cmd, treeIndex, xpath);
      }));
    },

    sendSpecialize: function(cmd, treeIndex, xpath, label) {
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

    hostChoice: function(cmd, treeIndex) {
      var provideName = commands.getFormFieldValue(cmd, 'provide'),
          label = commands.getFormFieldAttr(cmd, 'host', 'label'),
          host = commands.getFormFieldValue(cmd, 'host'),
          deferredSelection = $q.defer();

      var fieldParams = {
        label: label,
        value: host,
        promise: deferredSelection,
      };
      var field = buildVariables.createField(fieldParams);
      var node = tree.fillNodeData(treeIndex, field);

      deferredSelection.promise.then(angular.bind(this, function(host) {
        this.sendHostChoice(cmd, treeIndex, field);
      }));
    },

    sendHostChoice: function(cmd, treeIndex, field) {
      var form = $form({
        type: "submit",
        fields: [
          $field({
            var: "host",
            value: field.value,
            type: "input-single"
          })
        ]
      });
      tree.fillNodeHost(treeIndex, field.value);

      commands.next(cmd, form)

      .then(angular.bind(this, function(cmd) {
        field.submitDone();
        this._onRecv(cmd);
      }));

    },

    multiplicity: function(cmd, treeIndex) {
      var nbInstances = commands.getFormFieldValue(cmd, 'multiplicity'),
          multiplicityLabel = commands.getFormFieldAttr(cmd, 'multiplicity', 'label'),
          deferredSelection = $q.defer();

      var fieldParams = {
        label: multiplicityLabel,
        fields: [
          {value: '192.168.1.1'},
          {value: '192.168.1.2'},
          {value: '192.168.1.3'}
        ],
        promise: deferredSelection,
      };
      var field = buildVariables.createField(fieldParams, null, "input-multi");
      var node = tree.fillNodeData(treeIndex, field);

      deferredSelection.promise.then(angular.bind(this, function(hosts) {
        this.sendMultiplicity(cmd, treeIndex, field);
      }));
    },

    sendMultiplicity: function(cmd, treeIndex, field) {
      var form = $form({
        type: "submit",
        fields: [
          $field({
            var: "multiplicity",
            value: field.value,
            type: "input-multi"
          })
        ]
      });

      commands.next(cmd, form)

      .then(angular.bind(this, function(cmd) {
        field.submitDone();
        this._onRecv(cmd);
      }));

    },

    validation: function(cmd, treeIndex) {
      var provideName = commands.getFormFieldValue(cmd, "provide"),
          provideLabel = commands.getFormFieldAttr(cmd, "provide", "label");

      // Configuration form to display
      var form = buildVariables.createForm({label: provideLabel});
      // add configuration fields to the form
      cmd.form.fields.slice(3).forEach(angular.bind(this, function(field) {
        var fieldName = field.var,
            formField,
            params = {};

        field.options.forEach(function(option) {
          params[option.label] = option.value;
        });

        formField = buildVariables.addField(params, fieldName);
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
