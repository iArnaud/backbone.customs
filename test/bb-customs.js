/*
 * test/bb-customs.js:
 *
 * (C) 2014 First Opinion
 * MIT LICENCE
 *
 */ 

define([
  'jquery',
  'async',
  'fakey',
  'proclaim',
  'backbone',
  'cocktail',
  'bb-customs'
], function ($, async, fakey, assert, Backbone, cocktail, bbCustoms) {


// Scope
var $workboard = $('#workboard'),
    formHTML = $('#form-tmpl').html();

// Classes
var Person, PersonView;

//
// Helper method to populate form
//
var populateForm = function (callback) {
  async.series([
    function (next) {
      fakey.str($('[name="name"]')[0], 'Stacy', next);
    },
    function (next) {
      fakey.str($('[name="bio"]')[0], 'The only highlander', next);
    },
    function (next) {
      $('[name="sex"][value="female"]').prop('checked', true).trigger('change');
      $('[name="handedness"][value="left"]').prop('checked', true).trigger('change');;
      $('[name="interests"][value="tech"]').prop('checked', true).trigger('change');;
      $('[name="country"]').val('United States').trigger('change');

      next();
    }
  ], callback);
};

// //
// // Helper method to populate form
// //
// var populateForm = function (callback) {
//   async.series([
//     function (next) {
//       fakey('name').str('Stacy');
//     },
//     function (next) {
//       fakey('bio').str('The only highlander', next);
//     },
//     function (next) {
//       fakey('sex').select('female');
//       fakey('handedness').select('left');
//       fakey('interests').select('tech');
//       fakey('country').select('Canada');

//       next();
//     }
//   ], callback);
// };

//
// Test integration with epoxy bindings
//
var testBindings = function () {
  it('Should create undeclared model attributes on init', function () {
    var view = new PersonView({ model: new Person() });

    assert.equal(view.model.attributes.name, '');
    assert.equal(view.model.attributes.sex, '');
    assert.equal(view.model.attributes.handedness, 'right');
    assert.equal(view.model.attributes.country, 'Select');
    assert.deepEqual(view.model.attributes.interests, []);
    assert.equal(view.model.attributes.bio, '');
  });


  it('Should correctly populate model on user interaction', function (done) {
    var view = new PersonView({ model: new Person() });
    
    // Async form population
    populateForm(function () {
      assert.deepEqual(view.model.attributes, {
        sex: 'female',
        handedness: 'left',
        interests: ['tech'],
        country: 'United States',
        name: 'Stacy',
        bio: 'The only highlander'
      });
      done();
    });
  });
};

//
//
//
var testEvents = function () {
  it('Should trigger invalid if validation fails', function (done) {
    var view = new PersonView({ model: new Person() });

    // Set listener
    view.model.on('invalid', function () { done(); }, this);

    // Calls validation
    view.model.save();
  });

  it('Should trigger invalid:attribute for each attribute', function (done) {
    var view = new PersonView({ model: new Person() });

    // Set listener
    var count = 0;
    view.model.on('invalid:attribute', function () {
      count ++;
      if (count == 5) { done(); }
    }, this);

    // Calls validation
    view.model.save();
  });
};

// Test please
describe('backbone.customs', function () {

  // Create classes before test
  before(function () {
    // I <3 Inheritance with mixins
    cocktail.patch(Backbone);

    // Model Class - Used in each case
    Person = Backbone.Model.extend({
      mixins: [bbCustoms.model],
      customs: {
        name: 'required|alpha|minLength[2]',
        sex: 'required',
        handedness: 'required',
        country: 'required|default[Select]',
        interests: 'required',
        bio: 'required|minLength[2]'
      }
    });

    // View Class - Used in each case
    PersonView = Backbone.View.extend({
      mixins: [bbCustoms.view],
      el: '#form'
    });
  });

  // Remove cocktail patch
  after(function () {
    cocktail.unpatch(Backbone);
  });

  // Add blank form before each test
  beforeEach(function () {
    $workboard.html(formHTML);
  });

  // Clear workboard after each test
  afterEach(function () {
    $workboard.html('');
  });

  describe('bindings', testBindings);
  describe('events', testEvents);
});


});