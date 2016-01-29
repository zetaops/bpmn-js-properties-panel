'use strict';

var is = require('bpmn-js/lib/util/ModelUtil').is;

var domQuery = require('min-dom/lib/query'),
    domify = require('min-dom/lib/domify'),
    forEach = require('lodash/collection/forEach'),
    assign = require('lodash/object/assign'),
    find = require('lodash/collection/find');

var getBusinessObject = require('bpmn-js/lib/util/ModelUtil').getBusinessObject;

var elementHelper = require('../../../../helper/ElementHelper'),
    cmdHelper = require('../../../../helper/CmdHelper'),
    extensionElementsHelper = require('../../../../helper/ExtensionElementsHelper'),
    utils = require('../../../../Utils');


function getAllFormFields(bo) {
  var options = [];
  var extensionElementsValues = bo.extensionElements.values;
  forEach(extensionElementsValues, function(extensionElement) {
    if (typeof extensionElement.$instanceOf === 'function' && is(extensionElement, 'camunda:FormData')) {
      if (extensionElement.fields) {
        forEach(extensionElement.fields, function(formField) {
          options.push(formField);
        });
      }
    }
  });

  return options;
}

function fillSelectBox(selectBox, options) {
  utils.removeAllChildren(selectBox);
  forEach(options, function(option){
    var optionEntry = domify('<option value="' + option.id + '">' + option.id + '</option>');
    selectBox.appendChild(optionEntry);
  });
}

function selectOption(selectBox, selectedIndex) {
  if (selectedIndex < 0 || selectedIndex >= selectBox.options.length) {
    selectBox.firstChild.selected = 'selected';
  } else {
    selectBox.options[selectedIndex].selected = 'selected';
  }
}

function updateOptionsDropDown(bo, entryNode, selectBox, selectedIndex) {
    // get all form fields
    var options = getAllFormFields(bo);

    // fill select box with options
    fillSelectBox(selectBox, options);

    if (options && options.length > 0) {
      // select the specific option
      selectOption(selectBox, selectedIndex);
    }

  return options;
}

/**
  * generate semantic id for new form field element
  */
function generateSemanticId(prefix) {

  prefix = prefix + '_';
  return utils.nextId(prefix);
}

/**
  * create an empty form field with a generated semantic id
  * - id is a generated id
  * - required fields contains an empty string
  * - optional fields are undefined
  */
function createEmptyFormField(values, formData, bpmnFactory) {
  var formField = elementHelper.createElement('camunda:FormField', {}, formData, bpmnFactory);

  // set empty strings for mandatory fields id and type
  formField.id = values.selectedOption;
  formField.type = '';

  formField.label = undefined;
  formField.defaultValue = undefined;

  return formField;
}


module.exports = {

  template:
    '<div class="pp-row pp-select">' +
      '<label for="cam-form-fields">Form Fields</label>' +
      '<div class="pp-field-wrapper">' +
        '<select id="cam-form-fields" name="selectedOption" size="5" data-value data-no-change>' +
        '</select>' +
        '<button class="add" id="addFormField" data-action="formData.addFormField"><span>+</span></button>' +
        '<button class="delete" id="deleteFormField" data-action="formData.deleteFormField"><span>-</span></button>' +
      '</div>' +
    '</div>' +

    '<div class="pp-row pp-textfield" data-show="formData.isFormFieldSelected">' +
      '<label for="cam-form-field-id">Id</label>' +
      '<div class="pp-field-wrapper">' +
        '<input id="cam-form-field-id" type="text" name="formFieldId" />' +
        '<button class="clear" data-action="formData.clearId" data-show="formData.canClearId">' +
          '<span>X</span>' +
        '</button>' +
      '</div>' +
    '</div>' +

    '<div class="pp-row pp-textfield" data-show="formData.isFormFieldSelected">' +
      '<label for="cam-form-field-label">Label</label>' +
      '<div class="pp-field-wrapper">' +
        '<input id="cam-form-field-label" type="text" name="formFieldLabel" />' +
        '<button class="clear" data-action="formData.clearLabel" data-show="formData.canClearLabel">' +
          '<span>X</span>' +
        '</button>' +
      '</div>' +
    '</div>' +

    '<div class="pp-row pp-textfield" data-show="formData.isFormFieldSelected">' +
      '<label for="cam-form-field-default-value">Default Value</label>' +
      '<div class="pp-field-wrapper">' +
        '<input id="cam-form-field-default-value" type="text" name="formFieldDefaultValue" />' +
        '<button class="clear" data-action="formData.clearDefaultValue" data-show="formData.canClearDefaultValue">' +
          '<span>X</span>' +
        '</button>' +
      '</div>' +
    '</div>' +

    '<div class="pp-row pp-textfield" data-show="formData.isFormFieldSelected">' +
      '<label for="cam-form-field-type">Type</label>' +
      '<div class="pp-field-wrapper">' +
        '<input id="cam-form-field-type" type="text" name="formFieldType" />' +
        '<button class="clear" data-action="formData.clearType" data-show="formData.canClearType">' +
          '<span>X</span>' +
        '</button>' +
      '</div>' +
    '</div>',


    get: function(formType, update, bo, entryNode) {
      var selectBox = domQuery('select[name=selectedOption]', entryNode);
      var selectedIndex = selectBox.selectedIndex;
      var options = updateOptionsDropDown(bo, entryNode, selectBox, selectedIndex);

      var id = this.__lastInvalidId;
      delete this.__lastInvalidId;

      forEach(options, function(option) {
        if (option.id === selectBox.value) {
          update.formFieldId = (id !== undefined ? id : option.id);
          update.formFieldLabel = option.label;
          update.formFieldDefaultValue = option.defaultValue;
          update.formFieldType = option.type;
          update.selectedOption = selectBox.value;
        }
      });


    },
    setEmpty: function(element, update) {
      var bo = getBusinessObject(element);

      if (bo.extensionElements && bo.extensionElements.values) {
        var formData = find(bo.extensionElements.values, function(extensionElement) {
          return is(extensionElement, 'camunda:FormData');
        });

        assign(update, extensionElementsHelper.removeEntry(bo, element, formData));
      }
    },
    set: function(element, values, update, bo, bpmnFactory) {

      var extensionElements = bo.extensionElements,
          isExtensionElementsNew = false,
          isFormDataNew = false,
          formData,
          formFieldList = [];

      // no extension elements exist, create new one
      if (!extensionElements) {
        isExtensionElementsNew = true;
        extensionElements = elementHelper.createElement('bpmn:ExtensionElements', { values: [] }, bo, bpmnFactory);
      }

      // check if form data exist
      formData = find(extensionElements.values, function(extensionElementsValue) {
        return is(extensionElementsValue, 'camunda:FormData');
      });

      // if extension elements exist and no form data, create new form data
      if (extensionElements && !formData) {
        isFormDataNew = true;
        formData = elementHelper.createElement('camunda:FormData', { fields: [] }, extensionElements, bpmnFactory);

        extensionElements.values.push(formData);
      }

      if (isExtensionElementsNew) {
        update.extensionElements = extensionElements;
        return update;
      } else if (isFormDataNew) {
        assign(update, cmdHelper.updateComplexBusinessObject(element, update, formData, 'fields', formData.formFields));
        return update;
      }

      /** delete selected form field when values.selectedOption is empty,
        * only in the delete case has selectedOption this value,
        *
        * delete only form fields, not the form data object when it is the last form field
        */
      if (values.selectedOption === '') {
        // copy form field list to make sure that we work on a new list
        // it is necessary for the undo command
        if (formData.fields) {
          formFieldList = formData.fields.slice(0);
        }

        var formFieldIndex;
        var deletingFormField = find(formFieldList, function(field, index) {
          formFieldIndex = index;
          return (field.id === values.formFieldId);
        });

        if (deletingFormField) {
          formFieldList.splice(formFieldIndex, 1);
        }

        update = assign(update, cmdHelper.setList(element, formData, 'fields', formFieldList));

        return update;
      }

      // check if form field exist for values.selectedOption
      var existingFormField = find(formData.fields, function(field) {
        return (field.id === values.selectedOption);
      });

      if (existingFormField) {
        // call 'validate' function to check whether
        // the given 'values.formFieldId' is valid
        var validationErrors = this.validate(existingFormField, values, {});

        var newFormFieldProperties = {};

        // make sure we do not update the id
        // when validation errors exist
        if (validationErrors.formFieldId) {
          this.__lastInvalidId = values.formFieldId;
        } else {
          newFormFieldProperties.id = values.formFieldId;
        }

        newFormFieldProperties.type = values.formFieldType || '';

        // set label only if input field is not empty
        if (values.formFieldLabel) {
          newFormFieldProperties.label = values.formFieldLabel;
        } else {
          newFormFieldProperties.label = undefined;
        }

        // set label only if input field is not empty
        if (values.formFieldDefaultValue) {
          newFormFieldProperties.defaultValue = values.formFieldDefaultValue;
        } else {
          newFormFieldProperties.defaultValue = undefined;
        }

        // update only the actual form field with the changes and not the complete form field list
        update = assign(update, cmdHelper.updateBusinessObject(element, existingFormField, newFormFieldProperties));

        return update;
      } else {
        // copy form field list to make sure that we work on a new list
        // it is necessary for the undo command
        if (formData.fields) {
          formFieldList = formData.fields.slice(0);
        }

        // call 'createEmptyFormField' function to create a new form field with initial values
        var newFormField = createEmptyFormField(values, formData, bpmnFactory);

        formFieldList.push(newFormField);

        update = assign(update, cmdHelper.setList(element, formData, 'fields', formFieldList));

        return update;
      }
    },
    validate: function(bo, values, validationResult) {
      var idError;
      var formFieldType = values.formFieldType;
      var formFieldId;

      if (values.formFieldId === '' || values.formFieldId) {
        formFieldId = values.formFieldId;
      } else {
        formFieldId = this.__lastInvalidId;
      }

      // find the specific form field business object
      // when the bo is not from type 'camunda:FormField'
      // the 'validate' function is called in the 'set' function and in the PropertiesPanel lifecycle
      if (!is(bo, 'camunda:FormField')) {
        var formData = find(bo.extensionElements.values, function(extensionElementsValue) {
          return is(extensionElementsValue, 'camunda:FormData');
        });
        if (formData) {
          var actualFormFieldId = values.selectedOption || formFieldId;

          bo = find(formData.fields, function(field) {
            // return the form field with the given form field id
            // use selectedOption value, because this value is never invalid
            // formFieldId could have an invalid value
            return field.id === actualFormFieldId;
          });
        }
      }

      // validate only when business object form field exist
      if (bo) {
        // check the form field id value
        idError = utils.isIdValid(bo, formFieldId);

        if (idError) {
          validationResult.formFieldId = idError;
        }

        if(formFieldType === '') {
          validationResult.formFieldType = 'Value must provide a value.';
        }
      }

      return validationResult;

    },
    clearId: function(element, inputNode) {
      var input = domQuery('input[name=formFieldId]', inputNode);

      input.value = '';

      return true;
    },
    canClearId: function(element, inputNode) {
      var input = domQuery('input[name=formFieldId]', inputNode);

      return input.value !== '';
    },
    clearLabel: function(element, inputNode) {
      var input = domQuery('input[name=formFieldLabel]', inputNode);

      input.value = '';

      return true;
    },
    canClearLabel: function(element, inputNode) {
      var input = domQuery('input[name=formFieldLabel]', inputNode);
      return input.value !== '';
    },
    clearDefaultValue: function(element, inputNode) {
      var input = domQuery('input[name=formFieldDefaultValue]', inputNode);

      input.value = '';

      return true;
    },
    canClearDefaultValue: function(element, inputNode) {
      var input = domQuery('input[name=formFieldDefaultValue]', inputNode);

      return input.value !== '';
    },
    clearType: function(element, inputNode) {
      var input = domQuery('input[name=formFieldType]', inputNode);

      input.value = '';

      return true;
    },
    canClearType: function(element, inputNode) {
      var input = domQuery('input[name=formFieldType]', inputNode);

      return input.value !== '';
    },
    isFormFieldSelected: function(element, inputNode) {
      var selectBox = domQuery('select[name=selectedOption]', inputNode);

      return selectBox.selectedIndex !== -1;
    },
    addFormField: function(element, inputNode) {

      // generate id for the new option to make sure that there is a change
      var id = generateSemanticId('FormField');

      // create option template
      var optionTemplate = domify('<option value="' + id + '">' + id + '</option>');

      var formFieldSelectBox = domQuery('select[name=selectedOption]', inputNode);

      // add new empty option as last child element
      formFieldSelectBox.appendChild(optionTemplate);
      // select last child element
      formFieldSelectBox.lastChild.selected = 'selected';

      return true;
    },
    deleteFormField: function(element, inputNode) {

      var formFieldSelectBox = domQuery('select[name=selectedOption]', inputNode);

      var selectedIndex = formFieldSelectBox.selectedIndex;

      // remove selected option from form field select box
      if (selectedIndex > -1 ) {
       formFieldSelectBox.removeChild(formFieldSelectBox.options[selectedIndex]);
       return true;
      } else {
       // do nothing when no form field is selected
       return false;
      }

    }
};
