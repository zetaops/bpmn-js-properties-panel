'use strict';

var assign = require('lodash/object/assign');

/**
 * A handler that implements a combination of BPMN 2.0 property
 * updates for a business object with the execution of an additional
 * (custom) command.
 * This is helpful to update simple properties of an business object and
 * execute another command in addition. Both updates are bundled on the
 * command stack and executed in one step. This also makes it possible to
 * revert the changes in one step.
 *
 * Example: execute updateProperties to remove the camunda:formKey and
 * in addition add all form fields needed for the formData property.
 *
 * @class
 * @constructor
 */
function ComplexUpdateHandler(commandStack, modeling) {
  this._commandStack = commandStack;
  this._modeling = modeling;
}

ComplexUpdateHandler.$inject = [ 'commandStack', 'modeling' ];

module.exports = ComplexUpdateHandler;


////// api /////////////////////////////////////////////

ComplexUpdateHandler.prototype.preExecute = function(context) {

  var element = context.element;

  var updatedProperties = context.updatedProperties,
      customCommand = context.customCommand,
      customCommandContext;

  if (updatedProperties) {
    this._modeling.updateProperties(element, {
      element: element,
      properties: updatedProperties
    });
  }

  if (customCommand) {
    customCommandContext = assign({ element: element }, customCommand.context);

    this._commandStack.execute(customCommand.id, customCommandContext);
  }
};