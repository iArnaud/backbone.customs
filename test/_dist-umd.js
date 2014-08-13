/*!
 * test/_dist-umd.js
 * 
 * Copyright (c) 2014
 */

define([
  'proclaim',
  'sinon',
  'backbone.customs'
], function (assert, sinon, BBCustoms) {


// ----------------------------------------------------------------------------
// Test
// ----------------------------------------------------------------------------

describe('umd - backbone.customs.js', function () {

  it('Should contain mixins.', function () {
    assert.ok(BBCustoms.view);
    assert.ok(BBCustoms.model);
  });

});


});