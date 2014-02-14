/*!
 * bb-customs.js
 * 
 * Copyright (c) 2014
 */

define([
  'underscore',
  'cocktail',
  'backbone.epoxy',
  'customs'
], function (_, cocktail, Epoxy, customs) {


// ----------------------------------------------------------------------------
// Little wrapper for Cocktail - I <3 Inheritance
// ----------------------------------------------------------------------------
var createMixin = function () {
  // Oh Javascript... whyyyyyyy?
  var args = Array.prototype.slice.call(arguments, 0);

  // A little trickery to move the last item to be the first item
  // This is purely done for a prettier interface. Probably not
  // great for performance
  var mixin = args.pop();
  args.unshift(mixin);

  // Mix my cocktail
  cocktail.mixin.apply(this, args);

  // Return the result
  return mixin;
};

// ----------------------------------------------------------------------------
// Model Mixin
// ----------------------------------------------------------------------------
var model = createMixin(Epoxy.View.mixin(), {
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
      this._addValidationErr(validation.errs);
      return validation.errs;
    }
  },

  //
  // Add errs to validationErr obj and trigger invalid:prop
  //
  _addValidationErr: function (errs) {
    for (var key in errs) {
      this.validationErr = this.validationErr || {};
      this.validationErr[key] = errs[key];

      this.trigger('invalid:attribute', key, this.validationErr[key]);
    }
  }
});

// ----------------------------------------------------------------------------
// View Mixin
// ----------------------------------------------------------------------------
var view = createMixin(Epoxy.View.mixin(), {
  //
  //
  //
  initialize: function (opts) {
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
  //
  //
  _defaultRadio: function (el) {
    return this.$el.find(this._createAttrSel('name', el.name) + ':checked').val() || '';
  },

  //
  //
  //
  _defaultCheckbox: function (el) {
    var value = [];
    this.$el.find(this._createAttrSel('name', el.name) + ':checked').each(function () {
      value.append(this.value);
    });

    return value;
  },

  //
  //
  //
  _defaultSelect: function (el) {
    var selected = $(el).find(':selected')[0];
    return selected.value || selected.text;
  },

  //
  //
  //
  _defaultDefault: function (el) {
    return el.value;
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