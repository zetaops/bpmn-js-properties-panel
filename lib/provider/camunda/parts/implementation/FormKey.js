'use strict';

var domQuery = require('min-dom/lib/query');


module.exports = {
  template:
    '<div class="pp-row pp-textfield">' +
      '<label for="camunda-form-key">Form Key</label>' +
      '<div class="pp-field-wrapper">' +
        '<input id="camunda-form-key" type="text" name="formKey" />' +
        '<button class="clear" data-action="formKey.clear" data-show="formKey.canClear">' +
          '<span>X</span>' +
        '</button>' +
      '</div>' +
    '</div>',

    get: function(formType, formKeyValue, update, bo) {
      update.formKey = formKeyValue;
    },
    setEmpty: function(update) {
      update['camunda:formKey'] = undefined;
    },
    set: function(values, update) {
      var formKeyValue = values.formKey;

      if (formKeyValue) {
        update['camunda:formKey'] = formKeyValue;
      }
    },
    clear: function(element, inputNode) {
      domQuery('input[name=formKey]', inputNode).value='';

      return true;
    },
    canClear: function(element, inputNode) {
      var input = domQuery('input[name=formKey]', inputNode);

      return input.value !== '';
    }

};
