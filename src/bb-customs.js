/*!
 * bb-customs.js
 * 
 * Copyright (c) 2014
 */

// Use named AMD modules while authoring libraries. Better consistency
// when using amdclean during build.
define([
  'underscore',
  'backbone.epoxy',
  'customs'
], function (_, Epoxy, customs) {


// ----------------------------------------------------------------------------
// Model Mixin
// ----------------------------------------------------------------------------
var model = _.extend(Epoxy.View.mixin(), {
  //
  // Validate using customs
  //
  validate: function(attrs, options) {
    // Handle optional args
    if (!attrs) { attrs = this.toJSON(); }
    if (!options) { options = {}; }

    // Validate
    var validation = customs.check(attrs, _.extend(this.customs, options.customs || {}));

    if (!validation.isValid) {
      this._updateValidation(attrs, validation.errs);
      return validation.errs;
    }
  },

  //
  // Add errs to validationErr obj and trigger invalid:prop
  //
  _updateValidation: function (attrs, errs) {
    for (var key in attrs) {
      if (errs[key]) {
        this.validationErr = this.validationErr || {};
        this.validationErr[key] = errs[key];
        this.trigger('invalid:attribute', key, this.validationErr[key]);
      } else {
        this.trigger('valid:attribute', key);
      }
    }
  }
});

// ----------------------------------------------------------------------------
// View Mixin
// ----------------------------------------------------------------------------
var view = _.extend(Epoxy.View.mixin(), {
  //
  //
  //
  render: function (opts) {
    // Setup binding for form elements
    if (typeof this.bindings !== 'object') {
      this._createFormBindings();
    }

    // Mixin doesn't apply bindings, so I am doing so manually
    this.applyBindings();
  },

  //
  // Grab form elements and set up bindings
  //
  _createFormBindings: function () {
    this.bindings = {};
    
    // Radios
    this._bindType('input[type="radio"]', {
      defaultFn: this._defaultRadio,
      bindFn: this._bindRadioCheckbox
    });

    // Checkboxes
    this._bindType('input[type="checkbox"]', {
      defaultFn: this._defaultCheckbox,
      bindFn: this._bindRadioCheckbox
    });

    // Selects
    this._bindType('select', {
      defaultFn: this._defaultSelect,
      bindFn: this._bindDefault
    });

    // All other form elements
    this._bindType('input[type!="radio"][type!="checkbox"], textarea', {
      defaultFn: this._defaultDefault,
      bindFn: this._bindDefault
    });
  },

  //
  // Helper to loop over selector and bind elements.
  //
  _bindType: function (selector, opts) {
    var self = this;

    self.$el.find(selector).each(function () {
      // We need to make sure we have a model attr to bind to
      if (!self.model.attributes[this.name]) {
        self.model.attributes[this.name] = opts.defaultFn.call(self, this);
      }

      // Bind
      opts.bindFn.call(self, this);
    });
  },

  //
  // Return checked radio value or empty string
  //
  _defaultRadio: function (el) {
    return this.$el.find(this._createAttrSel('name', el.name) + ':checked').val() || '';
  },

  //
  // Return array of populated checkbox values or empty array
  //
  _defaultCheckbox: function (el) {
    var value = [];
    this.$el.find(this._createAttrSel('name', el.name) + ':checked').each(function () {
      value.append(this.value);
    });

    return value;
  },

  //
  // Display selected option
  //
  _defaultSelect: function (el) {
    var selected = $(el).find(':selected')[0];
    return selected.value || selected.text;
  },

  //
  // Display element value or empty string
  //
  _defaultDefault: function (el) {
    return el.value || '';
  },

  //
  // Radios and checkboxes use checked handler for binding
  // and name + value attr for selector
  //
  _bindRadioCheckbox: function (el) {
    var nameSel = this._createAttrSel('name', el.name),
        valSel  = this._createAttrSel('value', el.value);

    this.bindings[nameSel + valSel] = 'checked:' + el.name;
  },

  //
  // Default elements use a value handler for binding
  // and name attr selector.
  //
  _bindDefault: function (el) {
    var nameSel = this._createAttrSel('name', el.name);
    this.bindings[nameSel] = 'value:' + el.name + ',events:["keyup"]';
  },

  //
  // Convenience method to create attr selector
  //
  _createAttrSel: function (name, val) {
    return '[' + name + '="' + val + '"]';
  }
});

// ----------------------------------------------------------------------------
// Expose
// ----------------------------------------------------------------------------'=
return {
  model: model,
  view: view
};


});