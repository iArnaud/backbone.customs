(function(root, factory) {
    if(typeof exports === 'object') {
        module.exports = factory(require('underscore'), require('backbone.epoxy'));
    }
    else if(typeof define === 'function' && define.amd) {
        define(['underscore', 'backbone.epoxy'], factory);
    }
    else {
        root['BBCustoms'] = factory(root.underscore, root.Backbone.Epoxy);
    }
}(this, function(underscore, backboneepoxy) {

/*!
 * utils.js
 * 
 * Copyright (c) 2014
 */
var customsUtils, customsChecks, customsExam, customsCustoms, backbonecustomsModel, backbonecustomsView, index;
customsUtils = {
  /**
   * Determine if an object is empty.
   *
   * @example
   * var isEmpty = isEmpty({});
   * // true
   *
   * @public
   *
   * @param {object} obj - obj to run isEmpty test on
   * @reutns {boolean} - true if object is empty. false if not.
   */
  isEmpty: function (obj) {
    // Array
    if (Object.prototype.toString.call(obj) === '[object Array]') {
      return obj.length > 0;
    }
    // Object
    for (var prop in obj) {
      if (obj.hasOwnProperty(prop)) {
        return false;
      }
    }
    return true;
  },
  /**
   * Micro template function.
   *
   * @example
   * var msg = tmpl('{0}', ['msg']);
   *
   * @public
   *
   * @param {string} str - string to template.
   * @param {array} data - array of values to template.
   * @reutns {str} - error msg string.
   */
  tmpl: function (str, data) {
    return str.replace(/{([^{}]*)}/g, function (a, b) {
      return typeof data[b] === 'string' ? data[b] : a;
    });
  }
};
/*!
 * checks.js
 * 
 * Copyright (c) 2014
 */
customsChecks = function (_) {
  // ----------------------------------------------------------------------------
  // Regular Expressions
  // ----------------------------------------------------------------------------
  var regExs = {
      numeric: /^[0-9]+$/,
      integer: /^\-?[0-9]+$/,
      decimal: /^\-?[0-9]*\.?[0-9]+$/,
      email: /^[a-zA-Z0-9.!#$%&amp;'*+\-\/=?\^_`{|}~\-]+@[a-zA-Z0-9\-]+(?:\.[a-zA-Z0-9\-]+)*$/,
      alpha: /^[a-z]+$/i,
      alphaNumeric: /^[a-z0-9]+$/i,
      alphaDash: /^[a-z0-9_\-]+$/i,
      natural: /^[0-9]+$/i,
      naturalNoZero: /^[1-9][0-9]*$/i,
      ip: /^((25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})\.){3}(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})$/i,
      base64: /[^a-zA-Z0-9\/\+=]/i,
      numericDash: /^[\d\-\s]+$/,
      url: /^(https?|s?ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i
    };
  // ----------------------------------------------------------------------------
  // Rules
  // ----------------------------------------------------------------------------
  var checks = {};
  //
  // required
  // returns false if the value is empty.
  //
  checks['required'] = {
    msg: 'The {0} field is required.',
    check: function (val) {
      return val !== null && typeof val === 'object' ? _.isEmpty(val) : val !== null && val !== '';
    }
  };
  //
  // default[value]
  // returns false if the value is equal to the specified value
  //
  checks['default'] = {
    'msg': 'The {0} field is still set to default, please change.',
    'check': function (val, name) {
      return val !== name;
    }
  };
  //
  // email
  // returns false if the value is not a valid email address.
  //
  checks['email'] = {
    'msg': 'The {0} field must contain a valid email address.',
    'check': function (val) {
      return regExs['email'].test(val);
    }
  };
  //
  // emails
  // returns false if any value provided in a comma separated list is not
  // a valid email.
  //
  checks['emails'] = {
    'msg': 'The {0} field must contain all valid email addresses.',
    'check': function (val) {
      // Split emails
      var result = val.split(',');
      // Loop over and check each individual email
      for (var i = 0; i < result.length; i++) {
        var stripped = String(result[i]).replace(/^\s+|\s+$/g, '');
        if (!regExs['email'].test(stripped)) {
          return false;
        }
      }
      return true;
    }
  };
  //
  // minLength[length]
  // returns false if the value is shorter than the parameter.
  //
  checks['minLength'] = {
    'msg': 'The {0} field must be at least {1} characters in length.',
    'check': function (val, length) {
      return !regExs['numeric'].test(length) ? false : val.length >= parseInt(length, 10);
    }
  };
  //
  // maxLength[length]
  // returns false if the value is longer than the parameter.
  //
  checks['maxLength'] = {
    'msg': 'The {0} field must not exceed {1} characters in length.',
    'check': function (val, length) {
      return !regExs['numeric'].test(length) ? false : val.length <= parseInt(length, 10);
    }
  };
  //
  // exactLength[length]
  // returns false if the value length is not exactly the parameter.
  //
  checks['exactLength'] = {
    'msg': 'The {0} field must be exactly {1} characters in length.',
    'check': function (val, length) {
      return !regExs['numeric'].test(length) ? false : val.length === parseInt(length, 10);
    }
  };
  //
  // greaterThan[param]
  // returns false if the value is less than the parameter
  // after using parseFloat.
  //
  checks['greaterThan'] = {
    'msg': 'The {0} field must contain a number greater than {1}.',
    'check': function (val, param) {
      return !regExs['decimal'].test(val) ? false : parseFloat(val) > parseFloat(param);
    }
  };
  //
  // lessThan[param]
  // returns false if the value is greater than the parameter
  // after using parseFloat.
  //
  checks['lessThan'] = {
    'msg': 'The {0} field must contain a number less than {1}.',
    'check': function (val, param) {
      return !regExs['decimal'].test(val) ? false : parseFloat(val) < parseFloat(param);
    }
  };
  //
  // alpha
  // returns false if the value contains anything other than
  // alphabetical characters.
  //
  checks['alpha'] = {
    'msg': 'The {0} field must only contain alphabetical characters.',
    'check': function (val) {
      return regExs['alpha'].test(val);
    }
  };
  //
  // alphaNumeric
  // returns false if the value contains anything other than
  // alpha-numeric characters.
  //
  checks['alphaNumeric'] = {
    'msg': 'The {0} field must only contain alpha-numeric characters.',
    'check': function (val) {
      return regExs['alphaNumeric'].test(val);
    }
  };
  //
  // alphaDash
  // returns false if the value contains anything other than
  // alphanumeric characters, underscores, or dashes.
  //
  checks['alphaDash'] = {
    'msg': 'The {0} field must only contain alpha-numeric characters, underscores, and dashes.',
    'check': function (val) {
      return regExs['alphaDash'].test(val);
    }
  };
  //
  // numeric
  // returns false if the value contains anything other than
  // numeric characters.
  //
  checks['numeric'] = {
    'msg': 'The {0} field must contain only numbers.',
    'check': function (val) {
      return regExs['numeric'].test(val);
    }
  };
  //
  // integer
  // returns false if the value contains anything other than an integer.
  //
  checks['integer'] = {
    'msg': 'The {0} field must contain an integer.',
    'check': function (val) {
      return regExs['integer'].test(val);
    }
  };
  //
  // decimal
  // returns false if the value contains anything other than a decimal.
  //
  checks['decimal'] = {
    'msg': 'The {0} field must contain a decimal number.',
    'check': function (val) {
      return regExs['decimal'].test(val);
    }
  };
  //
  // natural
  // returns false if the value contains anything other than a
  // natural number: 0, 1, 2, 3, etc.
  //
  checks['natural'] = {
    'msg': 'The {0} field must contain only positive numbers.',
    'check': function (val) {
      return regExs['natural'].test(val);
    }
  };
  //
  // naturalNoZero
  // returns false if the value contains anything other than a
  // natural number, but not zero: 1, 2, 3, etc.
  //
  checks['naturalNoZero'] = {
    'msg': 'The {0} field must contain a number greater than zero.',
    'check': function (val) {
      return regExs['naturalNoZero'].test(val);
    }
  };
  //
  // url
  // returns false if the supplied string is not a valid url
  //
  checks['url'] = {
    'msg': 'The {0} field must contain a valid URL.',
    'check': function (val) {
      return regExs['url'].test(val);
    }
  };
  //
  // creditCard
  // returns false if the supplied string is not a valid credit card
  //
  checks['creditCard'] = {
    'msg': 'The {0} field must contain a valid credit card number.',
    'check': function (val) {
      // accept only digits, dashes or spaces
      if (!regExs['numericDash'].test(val)) {
        return false;
      }
      var str = val.replace(/[ -]+/g, ''), len = str.length, mul = 0, sum = 0, prodArr = [
          [
            0,
            1,
            2,
            3,
            4,
            5,
            6,
            7,
            8,
            9
          ],
          [
            0,
            2,
            4,
            6,
            8,
            1,
            3,
            5,
            7,
            9
          ]
        ];
      while (len--) {
        sum += prodArr[mul][parseInt(str.charAt(len), 10)];
        mul ^= 1;
      }
      return sum % 10 === 0 && sum > 0;
    }
  };
  //
  // fileType
  // returns false if the supplied file is not part of the comma
  // separated list in the paramter
  //
  checks['fileType'] = {
    'msg': 'The {0} field must contain only {1} files.',
    'check': function (val, type) {
      // Get ext of val
      var ext = val.substr(val.lastIndexOf('.') + 1);
      // Get accepted types
      var types = type.split(',');
      // Loop over all types and check if ext matches
      for (var i = 0; i < types.length; i++) {
        var stripped = String(types[i]).replace(/^\s+|\s+$/g, '');
        if (ext === stripped) {
          return true;
        }
      }
      return false;
    }
  };
  // ----------------------------------------------------------------------------
  // Expose
  // ----------------------------------------------------------------------------
  return checks;
}(customsUtils);
/*!
 * exam.js
 * 
 * Copyright (c) 2014
 */
customsExam = function (_, checks) {
  // ----------------------------------------------------------------------------
  // Exam
  // ----------------------------------------------------------------------------
  /**
   * Class to run validation checks and return
   * formatted results.
   *
   * @example
   * var exam = new Exam(data, rules);
   *
   * @public
   * @constructor
   *
   * @param {object} data - data to validate
   * @param {object} rules - rules object to validate data against.
   */
  var Exam = function () {
    // Default values
    this.isValid = true;
    this.errors = {};
  };
  /**
   * Run validation suite.
   *
   * @example
   * exam.run();
   *
   * @public
   *
   * @param {object} data - data to validate
   * @param {object} rules - rules object to validate data against.
   */
  Exam.prototype.run = function (data, rules) {
    for (var name in data) {
      if (!rules[name]) {
        continue;
      }
      this.checkRules(name, data[name], rules[name]);
    }
  };
  /**
   * Check value against all rules defined for that value.
   *
   * @private
   *
   * @param {string} name - name of property we are validating.
   * @param {value} value - value of named property.
   * @param {array} rules - array of rules applied to specified name.
   */
  Exam.prototype.checkRules = function (name, value, rules) {
    var errors = [];
    var isEmpty = value === '';
    var hasRules = rules[0];
    // If first rule is not required
    // and we have an empty value - continue
    if (isEmpty && hasRules && rules[0].name !== 'required') {
      return true;
    }
    // Check each rule
    for (var rule in rules) {
      var error = this.checkRule(name, value, rules[rule]);
      if (error) {
        errors.push(error);
      }
    }
    // Add any errors we find
    if (errors.length) {
      this.errors[name] = errors;
    }
  };
  /**
   * Validate an individual rule.
   *
   * @private
   *
   * @param {string} name - name of property we are validating.
   * @param {value} value - value of named property.
   * @param {object} rule - rule object to validate.
   * @reutns {str|null} - string with error message or null if
   *   no error.
   */
  Exam.prototype.checkRule = function (name, value, rule) {
    // If no check exists, throw err
    if (!checks[rule.name]) {
      throw new Error('There is no check defined by the name: ' + rule.name);
    }
    return !checks[rule.name].check(value, rule.args) ? this.formatError(name, rule) : null;
  };
  /**
   * Format error message.
   *
   * @private
   *
   * @param {string} name - name of property we are validating.
   * @param {object} rule - rule object to validate.
   * @reutns {object} - object containg the rule name and error string.
   */
  Exam.prototype.formatError = function (name, rule) {
    // We have an error :(
    this.isValid = false;
    var msg = checks[rule.name].msg;
    var data = [name];
    // Add any additional data for templating error msg
    if (rule.args) {
      data = data.concat([rule.args]);
    }
    return {
      name: rule.name,
      msg: _.tmpl(msg, data)
    };
  };
  // ----------------------------------------------------------------------------
  // expose
  // ----------------------------------------------------------------------------
  return Exam;
}(customsUtils, customsChecks);
/*!
 * customs.js
 * 
 * Copyright (c) 2014
 */
customsCustoms = function (Exam) {
  // ----------------------------------------------------------------------------
  // Customs
  // ----------------------------------------------------------------------------
  /**
   * Interface for valiating data against a set
   * of rules.
   *
   * @example
   * var validator = new Customs(rules);
   *
   * @public
   * @constructor
   *
   * @param {object} definitions - key, value pair where the name refers to
   *   the item id and the value is a string representation of validation
   *   requirements.
   */
  var Customs = function (definitions) {
    // Build and parse definitions
    this.rules = this.build(definitions);
  };
  /**
   * Method to take a user formatted rules object and return
   * a customs formatted rules object. Breaks apart strings
   * and returns and array of rule objects.
   *
   * @private
   *
   * @param {object} definitions - user defined rules object (aka
   *   rule definitions).
   * @returns {object} - formatted rules object.
   */
  Customs.prototype.build = function (definitions) {
    var formatted = {};
    for (var name in definitions) {
      formatted[name] = this.buildRules(definitions[name]);
    }
    return formatted;
  };
  /**
   * Create array of rules from pipe seperated string.
   *
   * @private
   *
   * @param {string} str - user defined string of rules. Each rule is
   *   seperated by a "|".
   * @returns {array} - array of rule objects.
   */
  Customs.prototype.buildRules = function (str) {
    var parts = str.split('|');
    var rules = [];
    for (var i = 0, l = parts.length; i < l; i++) {
      var rule = this.parseRule(parts[i]);
      var method = rule.name === 'required' ? 'unshift' : 'push';
      rules[method](rule);
    }
    return rules;
  };
  /**
   * Parse string to grab optional arguments specified
   *   by nesting in brackets (ex: [argument]).
   *
   * @private
   *
   * @param {string} str - rule string.
   * @returns {object} - rule object (name and args properties).
   */
  Customs.prototype.parseRule = function (str) {
    var parts = /^(.+?)\[(.+)\]$/.exec(str);
    return parts ? {
      name: parts[1],
      args: parts[2]
    } : { name: str };
  };
  /**
   * Run exam and return result object
   *
   * @private
   *
   * @param {object} data - data to validate.
   * @returns {object} - result (isValid and erors properties).
   */
  Customs.prototype.check = function (data) {
    var exam = new Exam();
    exam.run(data, this.rules || {});
    return {
      isValid: exam.isValid,
      errors: exam.errors
    };
  };
  // ----------------------------------------------------------------------------
  // expose
  // ----------------------------------------------------------------------------
  return Customs;
}(customsExam);
/*!
 * model.js
 * 
 * Copyright (c) 2014
 */
backbonecustomsModel = function (_, Epoxy, Customs) {
  // ----------------------------------------------------------------------------
  // model mixin
  // ----------------------------------------------------------------------------
  return _.extend(Epoxy.View.mixin(), {
    /**
     * Validate model or passed attributes.
     *
     * @example
     * model.validate();
     *
     * @public
     *
     * @param {object} attrs - attributes to validate.
     * @param {object} options - optional options to pass (ex: additional
     *   customs definitions).
     */
    validate: function (attrs, options) {
      // Defaults
      attrs = attrs || this.toJSON();
      options = options || {};
      // Lets try to keep a cached instance
      // of validator alive
      if (!this.validator || options.customs) {
        var passed = options.customs || {};
        var defaults = this.customs || {};
        // Store validator so we don't have to coninually
        // parse rules.
        var definitions = _.extend(passed, defaults);
        this.validator = new Customs(definitions);
      }
      // Validate
      var validation = this.validator.check(attrs);
      if (!validation.isValid) {
        this._handleValidation(attrs, validation.errors);
        return validation.errors;
      }
    },
    /**
     * Keep track of validation status of model. Trigger
     * validation events per attribute.
     *
     * @private
     *
     * @param {object} attrs - attributes to validate.
     * @param {object} options - optional properties to pass (ex: additional
     *   customs definitions).
     */
    _handleValidation: function (attrs, errors) {
      for (var name in attrs) {
        if (errors[name]) {
          this.validationError = this.validationError || {};
          this.validationError[name] = errors[name];
          this.trigger('invalid:attribute', name, errors[name]);
        } else {
          this.trigger('valid:attribute', name);
        }
      }
    }
  });
}(underscore, backboneepoxy, customsCustoms);
/*!
 * view.js
 * 
 * Copyright (c) 2014
 */
backbonecustomsView = function (_, Epoxy) {
  // ----------------------------------------------------------------------------
  // view
  // ----------------------------------------------------------------------------
  return _.extend(Epoxy.View.mixin(), {
    /**
     * Bind elements to view.
     *
     * @example
     * view.initCustoms();
     *
     * @public
     */
    initCustoms: function () {
      // Setup binding for form elements
      if (!_.isObject(this.bindings)) {
        this.bindings = {};
        this._create();
      }
      // Epoxy mixin doesn't apply bindings by default
      // so I am doing so manually.
      this.applyBindings();
    },
    // --------------------------------------------------------------------------
    // private
    // --------------------------------------------------------------------------
    /**
     * Create "bind" object. Add any undefined
     * model attributes.
     *
     * @private
     */
    _create: function () {
      var elements = {
          other: 'input[type!="radio"][type!="checkbox"], textarea',
          radio: 'input[type="radio"]',
          check: 'input[type="checkbox"]',
          select: 'select'
        };
      // Loop over each element and bind
      for (var name in elements) {
        this._bindElements(name, elements[name]);
      }
    },
    /**
     * Loop over each element for specified
     * type and bind.
     *
     * @private
     */
    _bindElements: function (type, selector) {
      this.$el.find(selector).each(_.bind(function (index, el) {
        this._bindElement(type, el);
      }, this));
    },
    /**
     * Call bind for element type. Add attribute
     * to model if necessary.
     *
     * @private
     */
    _bindElement: function (type, el) {
      var name = el.name;
      var attributes = this.model.attributes;
      var attribute = attributes[name];
      // If the model does not yet have this prop
      // then we need to add it.
      if (!attribute) {
        attributes[name] = this['_' + type + 'Default'](el);
      }
      // Also need to bind
      this['_' + type + 'Bind'](el);
    },
    /**
     * Convenience method to create attr selector.
     *
     * @private
     */
    _selector: function (name, val) {
      return '[' + name + '="' + val + '"]';
    },
    // --------------------------------------------------------------------------
    // shared methods
    // --------------------------------------------------------------------------
    /**
     * Radios and checkboxes use checked handler for binding
     * and name + value attr for selector
     *
     * @private
     */
    _optionBind: function (el) {
      var name = el.name;
      var value = el.value;
      var nameSel = this._selector('name', name);
      var valSel = this._selector('value', value);
      this.bindings[nameSel + valSel] = 'checked:' + name;
    },
    /**
     * Default elements use a value handler for binding
     * and name attr selector.
     *
     * @private
     */
    _basicBind: function (el) {
      var name = el.name;
      var selector = this._selector('name', name);
      this.bindings[selector] = 'value:' + name + ',events:["keyup"]';
    },
    // --------------------------------------------------------------------------
    // type methods
    // --------------------------------------------------------------------------
    /**
     * Element value or empty string
     *
     * @private
     */
    _otherDefault: function (el) {
      return el.value || '';
    },
    /**
     * Proxy to basicBind
     *
     * @private
     */
    _otherBind: function (el) {
      this._basicBind(el);
    },
    /**
     * Return checked radio value or empty string
     *
     * @private
     */
    _radioDefault: function (el) {
      var name = el.name;
      var selector = this._selector('name', name) + ':checked';
      var value = this.$el.find(selector).val();
      return value || '';
    },
    /**
     * Proxy to optionBind
     *
     * @private
     */
    _radioBind: function (el) {
      this._optionBind(el);
    },
    /**
     * Return array of populated checkbox values or empty array
     *
     * @private
     */
    _checkDefault: function (el) {
      var name = el.name;
      var selector = this._selector('name', name) + ':checked';
      var value = [];
      this.$el.find(selector).each(function () {
        value.append(this.value);
      });
      return value;
    },
    /**
     * Proxy to optionBind
     *
     * @private
     */
    _checkBind: function (el) {
      this._optionBind(el);
    },
    /**
     * Display selected option
     *
     * @private
     */
    _selectDefault: function (el) {
      var selected = $(el).find(':selected')[0];
      return selected.value || selected.text;
    },
    /**
     * 
     *
     * @private
     */
    _selectBind: function (el) {
      this._basicBind(el);
    }
  });
}(underscore, backboneepoxy);
/*!
 * _index.js
 * 
 * Copyright (c) 2014
 */
index = function (model, view) {
  // ----------------------------------------------------------------------------
  // Expose
  // ----------------------------------------------------------------------------
  return {
    model: model,
    view: view
  };
}(backbonecustomsModel, backbonecustomsView);

return index;

}));
