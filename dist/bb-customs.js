;(function (root, factory) {

  // --------------------------------------------------------------------------
  // UMD wrapper (returnExports)
  // https://github.com/umdjs/umd/blob/master/returnExports.js
  //
  // I don't love the redundancy in how the dependencies are defined but my
  // attempt to make this DRY backfired while using the r.js optimizer.
  // Apparently the supported UMD definitions can be found here:
  // https://github.com/umdjs/umd
  //
  // Also would like to investigate implementing. Would be nice if this was
  // mixed into amdclean as an option:
  // https://github.com/alexlawrence/grunt-umd
  // --------------------------------------------------------------------------
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['underscore', 'backbone.epoxy', 'customs'], factory);
  } else if (typeof exports === 'object') {
    // Node. Does not work with strict CommonJS, but
    // only CommonJS-like environments that support module.exports,
    // like Node.
    module.exports = factory(require('underscore', 'backbone.epoxy', 'customs'));
  } else {
    // Browser globals (root is window)
    root['bbCustoms'] = factory(root._, root.Epoxy, root.customs);
  }
}(this, function (underscore, backboneepoxy, customs) {
/*!
 * bb-customs.js
 * 
 * Copyright (c) 2014
 */
// Use named AMD modules while authoring libraries. Better consistency
// when using amdclean during build.
var bb_customs = function (_, Epoxy, customs) {
    var model = _.extend(Epoxy.View.mixin(), {
        validate: function (attrs, options) {
          if (!attrs) {
            attrs = this.toJSON();
          }
          if (!options) {
            options = {};
          }
          var validation = customs.check(attrs, _.extend(this.customs, options.customs || {}));
          if (!validation.isValid) {
            this._updateValidation(attrs, validation.errs);
            return validation.errs;
          }
        },
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
    var view = _.extend(Epoxy.View.mixin(), {
        render: function (opts) {
          if (typeof this.bindings !== 'object') {
            this._createFormBindings();
          }
          this.applyBindings();
        },
        _createFormBindings: function () {
          this.bindings = {};
          this._bindType('input[type="radio"]', {
            defaultFn: this._defaultRadio,
            bindFn: this._bindRadioCheckbox
          });
          this._bindType('input[type="checkbox"]', {
            defaultFn: this._defaultCheckbox,
            bindFn: this._bindRadioCheckbox
          });
          this._bindType('select', {
            defaultFn: this._defaultSelect,
            bindFn: this._bindDefault
          });
          this._bindType('input[type!="radio"][type!="checkbox"], textarea', {
            defaultFn: this._defaultDefault,
            bindFn: this._bindDefault
          });
        },
        _bindType: function (selector, opts) {
          var self = this;
          self.$el.find(selector).each(function () {
            if (!self.model.attributes[this.name]) {
              self.model.attributes[this.name] = opts.defaultFn.call(self, this);
            }
            opts.bindFn.call(self, this);
          });
        },
        _defaultRadio: function (el) {
          return this.$el.find(this._createAttrSel('name', el.name) + ':checked').val() || '';
        },
        _defaultCheckbox: function (el) {
          var value = [];
          this.$el.find(this._createAttrSel('name', el.name) + ':checked').each(function () {
            value.append(this.value);
          });
          return value;
        },
        _defaultSelect: function (el) {
          var selected = $(el).find(':selected')[0];
          return selected.value || selected.text;
        },
        _defaultDefault: function (el) {
          return el.value || '';
        },
        _bindRadioCheckbox: function (el) {
          var nameSel = this._createAttrSel('name', el.name), valSel = this._createAttrSel('value', el.value);
          this.bindings[nameSel + valSel] = 'checked:' + el.name;
        },
        _bindDefault: function (el) {
          var nameSel = this._createAttrSel('name', el.name);
          this.bindings[nameSel] = 'value:' + el.name + ',events:["keyup"]';
        },
        _createAttrSel: function (name, val) {
          return '[' + name + '="' + val + '"]';
        }
      });
    return {
      model: model,
      view: view
    };
  }(underscore, backboneepoxy, customs);
  return bb_customs;

}));