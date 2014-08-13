/*!
 * model.js
 * 
 * Copyright (c) 2014
 */

define([
  'underscore',
  'backbone.epoxy',
  'customs/customs'
], function (_, Epoxy, Customs) {


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
  validate: function(attrs, options) {
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


});