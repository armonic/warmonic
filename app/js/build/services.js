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
      error: "",
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

    get hasVisibleFields() {
      var result = false;
      this.params.fields.forEach(function(field) {
        if (field.show)
          result = true;
      });

      return result;
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
      // returns list of variables
      if (this.type == "form") {
        return this.fields.map(function(field) {
          return {name: field.name, value: field.value};
        });
      }

      return this.params.value;
    },

    set value(data) {
      this.params.value = data;
    },

    get hasValue() {
      if (this.type == "input-multi") {
        var result = false;
        this.value.forEach(function(value) {
          if (value)
            result = true;
        });
        return result;
      }

      return this.value ? true : false;
    },

    get error() {
      return this.params.error;
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
      if (this.params.expert && !global.options.expertMode && this.hasValue && !this.error)
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
        if (value !== undefined)
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
        node.children[id] = {children: {}, data: null, host: null, title: null};

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

    fillNodeTitle: function(treeIndex, title) {
      var node = this.getTreeNode(treeIndex);
      node.title = title;

      return node;
    },

    fillNodeData: function(treeIndex, data) {
      var node = this.getTreeNode(treeIndex);
      node.data = data;
      node.show = true;

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

.factory('build', ['$q', 'logger', 'roster', 'commands', 'muc', 'buildTree', 'buildVariables', 'global', function($q, logger, roster, commands, muc, buildTree, buildVariables, global) {

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
      logger.clear();
    },

    tree: function() {
      return tree.getRootNode();
    },

    variables: function() {
      return buildVariables.variables();
    },

    _onRecv: function(cmd) {
      var treeIndex = this._getTreeIndex(cmd),
          host = commands.getFormFieldValue(cmd, 'host', true);

      if (host)
        tree.fillNodeHost(treeIndex, host);

      if (cmd.form.instructions == "manage")
        this.manage(cmd, treeIndex);
      else if (cmd.form.instructions == "lfm")
        this.lfm(cmd, treeIndex);
      else if (cmd.form.instructions == "specialize")
        this.specialize(cmd, treeIndex);
      else if (cmd.form.instructions == "multiplicity")
        this.multiplicity(cmd, treeIndex);
      else if (cmd.form.instructions == "validation")
        this.validation(cmd, treeIndex);
      else if (cmd.form.instructions == "call")
        this.call(cmd, treeIndex);
      else if (cmd.form.instructions == "done")
        this.done(cmd, treeIndex);
    },

    _getTreeIndex: function(cmd) {
      return commands.getFormFieldValue(cmd, "tree_id", true);
    },

    run: function(xpath) {

      this.init();

      tree.fillNodeData([0], {type: "loading", value: "Loading"});

      commands.execute(_cmd)

      .then(angular.bind(this, function(cmd) {

        this.data.sessionId = cmd.sessionid;
        // leave previous room
        if (this.data.logs)
          this.data.logs.leave();
        this.data.logs = muc.join(cmd.sessionid);

        // specify the first provide
        var form = $form({
          fields: [
            $field({var: "xpath", value: xpath})
          ]
        });

        return commands.next(cmd, form);
      }))

      .then(angular.bind(this, function(cmd) {
        // Always manage the first provide
        this.sendManage(cmd, [0], true);
      }));

    },

    manage: function(cmd, treeIndex) {
      // On expert mode always to manage or not
      if (global.options.expertMode) {
        var deferredSelection = $q.defer(),
            label = commands.getFormFieldAttr(cmd, 'manage', 'label');

        var fieldParams = {
          fields: [
            {label: "Yes", value: true},
            {label: "No", value: false},
          ],
          promise: deferredSelection,
        };
        var field = buildVariables.createField(fieldParams, null, "choose");
        tree.fillNodeTitle(treeIndex, label);
        tree.fillNodeData(treeIndex, field);

        deferredSelection.promise.then(angular.bind(this, function(manage) {
          this.sendManage(cmd, treeIndex, manage);
        }));
      }
      // Don't ask to manage on normal mode.
      else {
        this.sendManage(cmd, treeIndex, true);
      }

    },

    sendManage: function(cmd, treeIndex, manage) {
      var form = $form({
        type: "submit",
        fields: [
          $field({
            var: "manage",
            value: manage,
            type: "input-single"
          })
        ]
      });
      tree.fillNodeData(treeIndex, {type: "loading", value: "Loading"});

      commands.next(cmd, form)

      .then(angular.bind(this, function(cmd) {
        // don't show anything if the
        // requirement is manually managed
        if (!manage) {
          tree.deleteNode(treeIndex);
        }

        this._onRecv(cmd);

      }));

    },

    specialize: function(cmd, treeIndex) {
      var choices = commands.getFormFieldValue(cmd, "specialize"),
          label = commands.getFormFieldAttr(cmd, "specialize", "label"),
          deferredSelection = $q.defer(),
          options = [];

      // only one choice
      if (choices.length == 1) {
        this.sendSpecialize(cmd, treeIndex, choices[0].value, choices[0].label);
      }
      else {
        // field to display on the tree
        var fieldParams = {
          fields: options,
          promise: deferredSelection,
        };
        var field = buildVariables.createField(fieldParams, null, "choose");
        tree.fillNodeTitle(treeIndex, label);
        tree.fillNodeData(treeIndex, field);

        // when choice is done
        deferredSelection.promise.then(angular.bind(this, function(xpath) {
          this.sendSpecialize(cmd, treeIndex, xpath);
        }));
      }
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
      tree.fillNodeData(treeIndex, {type: "loading", value: "Loading"});

      commands.next(cmd, form)

      .then(angular.bind(this, function(cmd) {
        tree.fillNodeData(treeIndex, {type: "text", value: label || xpath});
        this._onRecv(cmd);
      }));

    },

    lfm: function(cmd, treeIndex) {
      var provideName = commands.getFormFieldValue(cmd, 'provide'),
          label = commands.getFormFieldAttr(cmd, 'host', 'label'),
          host = commands.getFormFieldValue(cmd, 'host', true),
          deferredSelection = $q.defer();

      // get online servers
      var fields = [];
      roster.onlineItems().forEach(function(item) {
        if (item.show) {
          for (var resource in Object.getOwnPropertyNames(item.resources)) {
            fields.push({label: item.name, value: item.jid + "/" + resource});
            break;
          }
        }
      });

      var fieldParams = {
        label: "Choose server",
        fields: fields,
        promise: deferredSelection,
      };
      var field = buildVariables.createField(fieldParams, null, "select");

      tree.fillNodeTitle(treeIndex, label);
      tree.fillNodeData(treeIndex, field);

      deferredSelection.promise.then(angular.bind(this, function(host) {
        this.sendLfm(cmd, treeIndex, field);
      }));
    },

    sendLfm: function(cmd, treeIndex, field) {
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
          label = commands.getFormFieldAttr(cmd, 'multiplicity', 'label'),
          deferredSelection = $q.defer();

      var fieldParams = {
        fields: [
          {value: '192.168.1.1'},
          {value: '192.168.1.2'},
          {value: '192.168.1.3'}
        ],
        promise: deferredSelection,
      };
      var field = buildVariables.createField(fieldParams, null, "input-multi");
      tree.fillNodeTitle(treeIndex, label);
      tree.fillNodeData(treeIndex, field);

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
            type: "input-single"
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
          label = commands.getFormFieldAttr(cmd, "provide", "label"),
          deferredValidation = $q.defer();

      // Configuration form to display
      var form = buildVariables.createForm({
        promise: deferredValidation
      });
      // add configuration fields to the form
      cmd.form.fields.slice(3).forEach(angular.bind(this, function(field) {
        var fieldName = field.var,
            formField,
            params = {};

        field.options.forEach(function(option) {
          // value is JSON serialized
          if (option.label == "value")
            params[option.label] = JSON.parse(option.value);
          else
            params[option.label] = option.value;
        });

        formField = buildVariables.addField(params, fieldName);
        if (formField)
          form.fields.push(formField);

      }));
      tree.fillNodeTitle(treeIndex, label);
      tree.fillNodeData(treeIndex, form);

      deferredValidation.promise.then(angular.bind(this, function(values) {
        this.sendValidation(cmd, treeIndex, form);
      }));

      if (!form.hasVisibleFields)
        form.submit();

    },

    sendValidation: function(cmd, treeIndex, validationForm) {
      // Format variables
      var values = validationForm.value.map(function(variable) {
        var value = {};
        if (variable.value instanceof Array) {
          for (var i=0; i<variable.value.length; i++)
            value[i] = variable.value[i];
        }
        else {
          value[0] = variable.value;
        }

        return [
          variable.name,
          value
        ];
      });

      var form = $form({
        type: "submit",
        fields: [
          $field({
            var: "validation",
            value: JSON.stringify(values),
            type: "input-single"
          })
        ]
      });

      commands.next(cmd, form)

      .then(angular.bind(this, function(cmd) {
        validationForm.submitDone();
        /* If the form has been validated,
         * the next step is not validation */
        if (cmd.form.instructions !== "validation") {
          validationForm.fields.forEach(function(field) {
            field.disabled = true;
            field.params.error = "";
          });
        }
        /* Handle the next step */
        this._onRecv(cmd);
      }));

    },

    call: function(cmd, treeIndex) {
      if (global.options.expertMode) {
        var deferredSelection = $q.defer(),
            provideLabel = commands.getFormFieldAttr(cmd, "provide", "label");

        var fieldParams = {
          label: provideLabel,
          fields: [
            {label: "Call", value: true},
            {label: "Don't call", value: false},
          ],
          promise: deferredSelection
        };
        var field = buildVariables.createField(fieldParams, null, "choose");
        var node = tree.fillNodeData(treeIndex, field);

        deferredSelection.promise.then(angular.bind(this, function(callValue) {
          this.sendCall(cmd, treeIndex, callValue);
        }));
      }
      // Call by default on normal mode
      else {
        tree.fillNodeData(treeIndex, {type: "loading", value: "In progress..."});
        this.sendCall(cmd, treeIndex, true);
      }
    },

    sendCall: function(cmd, treeIndex, callValue) {
      var form = $form({
        type: "submit",
        fields: [
          $field({
            var: "call",
            value: callValue,
            type: "input-single"
          })
        ]
      });

      commands.next(cmd, form)

      .then(angular.bind(this, function(cmd) {
        tree.fillNodeData(treeIndex, {type: "text", value: "Call done"});
        this._onRecv(cmd);
      }));

    },

    done: function(cmd, treeIndex) {
      tree.fillNodeData(treeIndex, {type: "text", value: "Finished"});
      if (cmd.status != "completed") {
        commands.next(cmd)
        .then(angular.bind(this, this._onRecv));
      }
    }
  };

}]);
