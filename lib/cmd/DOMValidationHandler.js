'use strict';

var domify = require('min-dom/lib/domify'),
    domClasses = require('min-dom/lib/classes'),
    domQuery = require('min-dom/lib/query');

function DOMValidationHandler(elementRegistry, bpmnFactory) {
  this._elementRegistry = elementRegistry;
  this._bpmnFactory = bpmnFactory;
}

DOMValidationHandler.$inject = [ 'elementRegistry', 'bpmnFactory' ];

module.exports = DOMValidationHandler;

DOMValidationHandler.prototype.execute = function(context) {

  var entry = context.entry,
      validationError = context.validationError,
      invalidValue = context.invalidValue;

  var errorMessageNode = domify('<div></div>');

  domClasses(errorMessageNode).add('pp-error-message');

  // insert errorMessageNode after controlNode
  entry.parentNode.insertBefore(errorMessageNode, entry.nextSibling);

  errorMessageNode.innerHTML = validationError;
  domClasses(entry).add('invalid');

  entry.value = invalidValue;

};


DOMValidationHandler.prototype.revert = function(context) {

  var entry = context.entry,
      oldValue = context.oldValue;

  entry.value = oldValue;
  domClasses(entry).remove('invalid');

  entry.parentNode.removeChild(domQuery('div.pp-error-message', entry.parentNode));

};
