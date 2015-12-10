'use strict';

var is = require('bpmn-js/lib/util/ModelUtil').is,
    getBusinessObject = require('bpmn-js/lib/util/ModelUtil').getBusinessObject;

var forEach = require('lodash/collection/forEach'),
    utils = require('../../../Utils');

var formKey = require('./implementation/FormKey'),
    formData = require('./implementation/FormData');


function getFormType(node) {
  return utils.selectedType('select[name=formType]', node.parentElement);
}


module.exports = function(group, element, bpmnFactory) {

  var bo;

  if(is(element, 'bpmn:StartEvent') || (is(element, 'bpmn:UserTask'))) {
    bo = getBusinessObject(element);
  }

  if (!bo) {
    return;
  }

  group.entries.push({
    'id': 'forms',
    'description': 'Configure form properties.',
    label: 'Forms',
    'html': '<div class="pp-row pp-select">' +
              '<label for="cam-form-type">Form Type</label>' +
              '<div class="pp-field-wrapper">' +
                '<select id="cam-form-type" name="formType" data-value>' +
                  '<option value="formKey">Form Key</option>' +
                  '<option value="formData">Form Data</option>' +
                '</select>' +
              '</div>' +
            '</div>' +
            '<div data-show="isFormKey">' + formKey.template + '</div>' +
            '<div data-show="isFormData">' + formData.template + '</div>',

    get: function (element, propertyName) {
      var update = {},
          formType = 'formKey'; // default value

      if (bo.extensionElements) {
        var extensionElementsValues = getBusinessObject(element).extensionElements.values;
        forEach(extensionElementsValues, function(extensionElement) {
          if (typeof extensionElement.$instanceOf === 'function' && is(extensionElement, 'camunda:FormData')) {
            formType = 'formData';
            formData.get(formType, update, bo, propertyName);
            return;
          }
        });
      } else {
        var boFormKey = bo.get('camunda:formKey');
        formKey.get(formType, boFormKey, update, bo);
      }

      update.formType = formType;

      return update;
    },

    set: function (element, values, containerElement) {
      var formType = values.formType,
          update = {};

      formKey.setEmpty(update);
      formData.setEmpty(element, update);

      if (formType === 'formKey') {
        formKey.set(values, update);
      } else if (formType === 'formData') {
        formData.set(element, values, update, bo, bpmnFactory);
      }
      return update;
    },
    validate: function(element, values) {
      var formType = values.formType,
          validationResult = {};

      if (formType === 'formData') {
        formData.validate(getBusinessObject(element), values, validationResult);
      }

      return validationResult;
    },
    isFormKey: function(element, node) {
      var formType = getFormType(node);

      return formType === 'formKey';
    },
    isFormData: function(element, node) {
      var formType = getFormType(node);

      return formType === 'formData';
    },

    formKey : formKey,
    formData : formData,

    cssClasses: ['pp-forms']

  });

};
