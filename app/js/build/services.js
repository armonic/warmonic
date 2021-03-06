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
    addField: function(params, name, type, index) {
      if (!variables[name])
        variables[name] = {};
      if (!index)
        index = 0;
      var field = this.createField(params, name, type);
      variables[name][0] = field;
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
      choices: [],
      suggested_by: "",
      resolved_by: "",
      set_by: "",
      belongs_provide_ret: false,
      promise: null,
      expert: false,
      fields: [],
      index: 0
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

    get choices() {
      return this.params.choices;
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
      if (this.type == "input-multi" || this.type == "choose-multi") {
        return this.params.fields.map(function(field) {
          return field.value;
        });
      }
      // returns list of variables
      if (this.type == "form") {
        return this.fields.map(function(field) {
          return {name: field.name, value: field.value, index: field.params.index};
        });
      }

      return this.params.value;
    },

    set value(data) {
      this.params.value = data;
    },

    get hasValue() {
      if (this.type == "input-multi" || this.type == "choose-multi") {
        var result = false;
        this.value.forEach(function(value) {
          if (value)
            result = true;
        });
        return result;
      }

      return this.value ? true : false;
    },

    checkValue: function() {
      if (this.hasValue) {
        this.params.error = null;
        return true;
      }

      this.params.error = "Please set a value.";
      this.disabled = false;
      return false;
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
      if (this.params.belongs_provide_ret && this.hasValue && !global.options.expertMode)
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
        if (this.checkValue())
          this.params.promise.resolve(this.value);
        else
          this.submitDone();
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

    fillNode: function(treeIndex, attr, data) {
      var node = this.getTreeNode(treeIndex);
      node[attr] = data;
      return node;
    },

    fillNodeTitle: function(treeIndex, title) {
      return this.fillNode(treeIndex, 'title', title);
    },

    fillNodeData: function(treeIndex, data) {
      this.fillNode(treeIndex, 'data', data);
      return this.fillNode(treeIndex, 'show', true);
    },

    fillNodeHost: function(treeIndex, host) {
      return this.fillNode(treeIndex, 'host', host);
    },

    fillNodeLogger: function(treeIndex, logger) {
      return this.fillNode(treeIndex, 'logger', logger);
    },

    fillNodeName: function(treeIndex, name) {
      return this.fillNode(treeIndex, 'name',name);
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

.factory('build', ['$q', '$rootScope', 'logger', 'roster', 'commands', 'muc', 'buildTree', 'buildVariables', 'errors', 'global', function($q, $rootScope, logger, roster, commands, muc, buildTree, buildVariables, errors, global) {

  var _cmd,
      tree,
      _variables;

  var build = {

    data: {
      sessionId: false,
      currentNode: null,
      room: null
    },

    steps: [
      "manage",
      "lfm",
      "specialize",
      "multiplicity",
      "validation",
      "call",
      "done"
    ],

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

    _onError: function(msg) {
      msg = $(msg);
      var code = msg.children('exception').children('code').text(),
          error = msg.children('exception').children('message').text(),
          logger = this.data.currentLogger;
      logger.error(code + ": " + error);
      return true;
    },

    _onLog: function(msg, xmppRoom) {
      msg = $(msg);
      if (msg.children('body').text().length > 0) {
        var message = msg.children('body').text(),
            from = Strophe.getResourceFromJid(msg.attr('from')),
            level = msg.children('log').children('level_name').text().toUpperCase(),
            logger = this.data.currentLogger;
        if (logger) {
          logger.log(message, logger.level[level], from);
          // run digest on new message
          $rootScope.$apply();
        }
      }
    },

    _onRecv: function(cmd) {
      var treeIndex = this._getTreeIndex(cmd),
          host = commands.getFormFieldValue(cmd, 'host', true),
          provideName = tree.getTreeNode(treeIndex).name || function() {
            var provideName = commands.getFormFieldValue(cmd, "provide");
            tree.fillNodeName(treeIndex, provideName);
            return provideName;
          }();

      // fill node logger
      var provideLogger = tree.getTreeNode(treeIndex).logger || function(logger) {
        if (!host)
          return null;
        var loggerName = Strophe.getNodeFromJid(host) + ":" + provideName,
            provideLogger = logger.get(loggerName);
        provideLogger.clear();
        tree.fillNodeLogger(treeIndex, provideLogger);
        return provideLogger;
      }(logger);

      this.data.currentNode = provideName;
      this.data.currentLogger = provideLogger;

      // Show the host info only after the lfm step
      if (host && this.steps.indexOf(cmd.form.instructions) > this.steps.indexOf('lfm'))
        tree.fillNodeHost(treeIndex, host);
      else
        tree.fillNodeHost(treeIndex, null);

      // Format method name to camelCase
      var methodName = cmd.form.instructions.split('_').reduce(function(acc, elem, index) {
        if (index === 0)
          return elem;
        else
          return acc + elem.charAt(0).toUpperCase() + elem.substr(1);
      }, "");

      console.debug("Looking for method " + methodName);

      if (methodName == "manage") {
        // Always manage the first provide
        if (treeIndex == [0])
          this.sendManage(cmd, [0], true);
        else
          this.manage(cmd, treeIndex);
      }
      else if (this[methodName]) {
        this[methodName](cmd, treeIndex);
      }
      else {
        // unhandled step, just return the form as-is
        commands.next(cmd, cmd.form)
        .then(angular.bind(this, function(cmd) {
          this._onRecv(cmd);
        }));
      }
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
        if (this.data.room)
          this.data.room.leave();
        this.data.room = muc.join(cmd.sessionid, angular.bind(this, this._onLog));

        // specify the first provide
        var form = $form({
          fields: [
            $field({var: "xpath", value: xpath})
          ]
        });

        return commands.next(cmd, form);
      }))

      .then(angular.bind(this, function(cmd) {
        this._onRecv(cmd);
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
          deferredSelection = $q.defer();

      // only one choice
      if (choices.length == 1) {
        this.sendSpecialize(cmd, treeIndex, choices[0].value, choices[0].label);
      }
      else {
        // field to display on the tree
        var fieldParams = {
          fields: choices.map(function(choice) {
            return {value: choice.value, label: choice.label};
          }),
          promise: deferredSelection,
        };
        var field = buildVariables.createField(fieldParams, null, "choose");
        tree.fillNodeTitle(treeIndex, label);
        tree.fillNodeData(treeIndex, field);

        // when choice is done
        deferredSelection.promise.then(angular.bind(this, function(xpath) {
          var label;
          field.fields.some(function(field) {
            if (field.value == xpath) {
              label = field.label;
              return true;
            }
          });
          this.sendSpecialize(cmd, treeIndex, xpath, label);
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
        this.onSpecialize(cmd, treeIndex, xpath, label);
        this._onRecv(cmd);
      }));
    },

    onSpecialize: function(cmd, treeIndex, xpath, label) {
      tree.fillNodeData(treeIndex, {type: "text", value: ""});
      tree.fillNodeTitle(treeIndex, label || xpath);
    },

    onlineServers: function() {
      // return online servers
      var servers = [];
      roster.onlineItems().forEach(function(item) {
        if (item.show) {
          Object.keys(item.resources).forEach(function(resource) {
            servers.push({label: item.name, value: item.jid + "/" + resource});
          });
        }
      });

      return servers;
    },

    lfm: function(cmd, treeIndex) {
      var provideName = commands.getFormFieldValue(cmd, 'provide'),
          label = commands.getFormFieldAttr(cmd, 'host', 'label'),
          deferredSelection = $q.defer(),
          servers = this.onlineServers();

      var fieldParams = {
        label: "Choose server",
        fields: servers,
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

      commands.next(cmd, form)

      .then(angular.bind(this, function(cmd) {
        field.submitDone();
        this._onRecv(cmd);
      }));

    },

    multiplicity: function(cmd, treeIndex) {
      var nbInstances = commands.getFormFieldValue(cmd, 'multiplicity'),
          label = commands.getFormFieldAttr(cmd, 'multiplicity', 'label'),
          deferredSelection = $q.defer(),
          servers = this.onlineServers();

      var fieldParams = {
        label: "Choose servers",
        choices: servers,
        promise: deferredSelection,
      };
      var field = buildVariables.createField(fieldParams, null, "choose-multi");
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
          else if (option.label == "index")
            params[option.label] = parseInt(option.value);
          else
            params[option.label] = option.value;
        });

        formField = buildVariables.addField(params, fieldName, params.index);
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
      // [{name:..., index:..., value:...}, {...}] -> [(name, {index:value ...}), (...)]
      var values = [];
      validationForm.value.forEach(function(val) {
        var value;
        try {
          value = values.filter(function(toVal) {
            if (toVal[0] == val.name)
              return true;
          })[0];
          value[1][val.index] = val.value;
        }
        catch (err) {
          value = [val.name, {}];
          value[1][val.index] = val.value;
          values.push(value);
        }
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
      var result = commands.getFormFieldValue(cmd, "call_result");
      if (result) {
        this.showCallResult(cmd, treeIndex, JSON.parse(result));
        return;
      }

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
        tree.fillNodeData(treeIndex, {type: "text", value: ""});
        this._onRecv(cmd);
      }));

    },

    showCallResult: function(cmd, treeIndex, callResult) {
      console.log("showCallResult");
      var fields = [];
      for (var key in callResult) {
        fields.push({label: key, value: callResult[key]});
      }
      var fieldParams = {
        fields: fields
      };
      var field = buildVariables.createField(fieldParams, null, "result");
      tree.fillNodeData(treeIndex, field);

      commands.next(cmd)
      .then(angular.bind(this, this._onRecv));
    },

    done: function(cmd, treeIndex) {
      //tree.fillNodeData(treeIndex, {type: "text", value: "Finished"});
      if (cmd.status != "completed") {
        commands.next(cmd)
        .then(angular.bind(this, this._onRecv));
      }
    }
  };

  errors.addErrorHandler(angular.bind(build, build._onError));

  return build;

}]);
