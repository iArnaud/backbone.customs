;(function (name, context, definition) {
  if (typeof module !== 'undefined' && module.exports) { module.exports = definition(); }
  else if (typeof define === 'function' && define.amd) { define(['jquery, underscore, backbone'], definition); }
  else { context[name] = definition(); }
})('bbCustoms', this, function (jquery, underscore, backbone) {