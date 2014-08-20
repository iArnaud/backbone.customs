/*!
 * view.js
 * 
 * Copyright (c) 2014
 */

define([
  'underscore',
  'backbone.epoxy'
], function (_, Epoxy) {


/* -----------------------------------------------------------------------------
 * view
 * ---------------------------------------------------------------------------*/

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


  /* ---------------------------------------------------------------------------
   * private
   * -------------------------------------------------------------------------*/

  /**
   * Create "bind" object. Add any undefined
   * model attributes.
   *
   * @private
   */
  _create: function () {
    var elements = {
      other  : 'input[type!="radio"][type!="checkbox"], textarea',
      radio  : 'input[type="radio"]',
      check  : 'input[type="checkbox"]',
      select : 'select'
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


  /* ---------------------------------------------------------------------------
   * shared
   * -------------------------------------------------------------------------*/

  /**
   * Radios and checkboxes use checked handler for binding
   * and name + value attr for selector
   *
   * @private
   */
  _optionBind: function (el) {
    var name  = el.name;
    var value = el.value;

    var nameSel = this._selector('name', name);
    var valSel  = this._selector('value', value);

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


  /* ---------------------------------------------------------------------------
   * types
   * -------------------------------------------------------------------------*/

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


});