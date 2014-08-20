/*
 * test/backbone.customs.js:
 *
 * (C) 2014 First Opinion
 * MIT LICENCE
 *
 */

define([
  'underscore',
  'jquery',
  'proclaim',
  'sinon',
  'async',
  'fakey/fakey',
  'backbone',
  'multiline',
  'model',
  'view'
], function (_, $, assert, sinon, async, fakey, Backbone, multiline, model, view) {


/* -----------------------------------------------------------------------------
 * reusable
 * ---------------------------------------------------------------------------*/

// Cache
var formHtml = multiline(function(){/*
  <form id="form">
    <input type="text" name="name">
    <input type="radio" name="sex" value="male">
    <input type="radio" name="sex" value="female">
    <input type="radio" name="handedness" value="left">
    <input type="radio" name="handedness" value="right" checked>
    <select name="country">
      <option>Select</option>
      <option>Canada</option>
      <option>United States</option>
    </select>
    <input type="checkbox" name="interests" value="tech">
    <input type="checkbox" name="interests" value="sports">
    <textarea name="bio"></textarea>
  </form>
*/});

// Base Classes
var CustomsModel = Backbone.Model.extend(model);
var CustomsView = Backbone.View.extend(view);

// Person
var Person = CustomsModel.extend({
  customs: {
    name: 'required|alpha|minLength[2]',
    sex: 'required',
    handedness: 'required',
    country: 'required|default[Select]',
    interests: 'required',
    bio: 'required|minLength[2]'
  }
});

// Person View
var PersonView = CustomsView.extend({
  template: _.template(formHtml),
  render: function() {
    this.$el.html(this.template());
    this.initCustoms();
  }
});


/* -----------------------------------------------------------------------------
 * helper
 * ---------------------------------------------------------------------------*/

var enterName = function (next) {
  fakey.str($('[name="name"]')[0], 'Stacy', next);
};

var enterBio = function (next) {
  fakey.str($('[name="bio"]')[0], 'The only highlander', next);
};

var enterMeta = function (next) {
  $('[name="sex"][value="female"]').prop('checked', true).trigger('change');
  $('[name="handedness"][value="left"]').prop('checked', true).trigger('change');
  $('[name="interests"][value="tech"]').prop('checked', true).trigger('change');
  $('[name="country"]').val('United States').trigger('change');
  next();
};

var populate = function (callback) {
  async.series([
    enterName,
    enterBio,
    enterMeta
  ], callback);
};


/* -----------------------------------------------------------------------------
 * test
 * ---------------------------------------------------------------------------*/

describe('backbone.customs', function () {

  before(function () {
    this.$workboard = $('#workboard');
  });

  // Add blank form before each test
  beforeEach(function () {
    this.model = new Person();
    this.view = new PersonView({ model: this.model });

    // Add to
    this.view.render();
    this.$workboard.append(this.view.$el);
  });

  // Clear workboard after each test
  afterEach(function () {
    this.view.remove();
  });


  /* ---------------------------------------------------------------------------
   * bindings
   * -------------------------------------------------------------------------*/

  describe('bindings', function () {

    it('Should create undeclared model attributes on init', function () {
      assert.equal(this.model.attributes.name, '');
      assert.equal(this.model.attributes.sex, '');
      assert.equal(this.model.attributes.handedness, 'right');
      assert.equal(this.model.attributes.country, 'Select');
      assert.deepEqual(this.model.attributes.interests, []);
      assert.equal(this.model.attributes.bio, '');
    });


    it('Should correctly populate model on user interaction', function (done) {
      var checkValues = _.bind(function () {
        assert.deepEqual(this.model.attributes, {
          sex: 'female',
          handedness: 'left',
          interests: ['tech'],
          country: 'United States',
          name: 'Stacy',
          bio: 'The only highlander'
        });
      }, this);

      populate(function () {
        checkValues();
        done();
      });
    });

  });


  /* ---------------------------------------------------------------------------
   * events
   * -------------------------------------------------------------------------*/

  describe('events', function () {

    it('Should trigger invalid if validation fails.', function () {
      var spy = sinon.spy();

      this.model.on('invalid', spy);
      this.model.save();

      assert.ok(spy.called);
    });

    it('Should trigger invalid:attribute for each attribute.', function () {
      var spy = sinon.spy();

      this.model.on('invalid:attribute', spy);
      this.model.save();

      assert.equal(spy.callCount, 5);
    });

  });

});


});