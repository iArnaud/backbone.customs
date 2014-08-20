/*!
 * test/_amd.js
 * 
 * Copyright (c) 2014
 */

define([
  'proclaim',
  'sinon',
  'backbone.customs/model',
  'backbone.customs/view'
], function (assert, sinon, model, view) {


/* -----------------------------------------------------------------------------
 * test
 * ---------------------------------------------------------------------------*/

describe('amd - backbone.customs.js', function () {

  it('Should contain mixins.', function () {
    assert.ok(model);
    assert.ok(view);
  });

});


});