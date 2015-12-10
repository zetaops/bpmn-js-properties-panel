'use strict';

var TestHelper = require('../../../TestHelper');

var TestContainer = require('mocha-test-container-support');

/* global bootstrapModeler, inject */

var propertiesPanelModule = require('../../../../lib'),
  domQuery = require('min-dom/lib/query'),
  coreModule = require('bpmn-js/lib/core'),
  selectionModule = require('diagram-js/lib/features/selection'),
  modelingModule = require('bpmn-js/lib/features/modeling'),
  propertiesProviderModule = require('../../../../lib/provider/camunda'),
  camundaModdlePackage = require('camunda-bpmn-moddle/resources/camunda'),
  getBusinessObject = require('bpmn-js/lib/util/ModelUtil').getBusinessObject,
  forEach = require('lodash/collection/forEach'),
  is = require('bpmn-js/lib/util/ModelUtil').is;

describe('form-data', function() {

  var diagramXML = require('./FormData.bpmn');

  var testModules = [
    coreModule, selectionModule, modelingModule,
    propertiesPanelModule,
    propertiesProviderModule
  ];

  var container;

  beforeEach(function() {
    container = TestContainer.get(this);
  });

  beforeEach(bootstrapModeler(diagramXML, {
    modules: testModules,
    moddleExtensions: {camunda: camundaModdlePackage}
  }));

  var shape;

  beforeEach(inject(function(commandStack, propertiesPanel, elementRegistry, selection) {

    var undoButton = document.createElement('button');
    undoButton.textContent = 'UNDO';

    undoButton.addEventListener('click', function() {
      commandStack.undo();
    });

    container.appendChild(undoButton);

    propertiesPanel.attachTo(container);

    shape = elementRegistry.get('StartEvent_1');

    selection.select(shape);
  }));

  function getFormFields(extensionElements) {
    var formFields = [];
    if (extensionElements && extensionElements.values) {
      forEach(extensionElements.values, function(value) {
        if (is(value, 'camunda:FormData')) {
          if (value.fields) {
            forEach(value.fields, function(formField) {
              formFields.push(formField);
            });
          }
        }
      });
    }
    return formFields;
  }

  it('should fetch form field properties of an element',
    inject(function(propertiesPanel) {

    var formFieldId = domQuery('input[name=formFieldId]', propertiesPanel._container),
        formFieldLabel = domQuery('input[name=formFieldLabel]', propertiesPanel._container),
        formFieldType = domQuery('input[name=formFieldType]', propertiesPanel._container),
        formFieldDefaultValue = domQuery('input[name=formFieldDefaultValue]', propertiesPanel._container),
        bo = getBusinessObject(shape);

    var formFields = getFormFields(bo.extensionElements);

    // given
    expect(formFields).to.have.length(3);
    expect(formFieldId.value).to.equal('firstname');
    expect(formFieldLabel.value).to.equal('Firstname');
    expect(formFieldType.value).to.equal('string');
    expect(formFieldDefaultValue.value).is.empty;
  }));


  it('should change first form field properties of an element',
    inject(function(propertiesPanel) {

    var formFieldId = domQuery('input[name=formFieldId]', propertiesPanel._container),
        formFieldLabel = domQuery('input[name=formFieldLabel]', propertiesPanel._container),
        formFieldType = domQuery('input[name=formFieldType]', propertiesPanel._container),
        formFieldDefaultValue = domQuery('input[name=formFieldDefaultValue]', propertiesPanel._container),
        bo = getBusinessObject(shape);

    var formFields = getFormFields(bo.extensionElements);

    // given
    expect(formFields).to.have.length(3);
    expect(formFieldId.value).to.equal('firstname');
    expect(formFieldLabel.value).to.equal('Firstname');
    expect(formFieldType.value).to.equal('string');
    expect(formFieldDefaultValue.value).is.empty;

    // when
    TestHelper.triggerValue(formFieldId, 'newId', 'change');
    TestHelper.triggerValue(formFieldLabel, 'newLabel', 'change');
    TestHelper.triggerValue(formFieldDefaultValue, 'newDefaultValue', 'change');

    // then
    expect(formFieldId.value).to.equal('newId');
    expect(formFieldLabel.value).to.equal('newLabel');
    expect(formFieldType.value).to.equal('string');
    expect(formFieldDefaultValue.value).to.equal('newDefaultValue');

    expect(formFields).to.have.length(3);
    expect(formFields[0].get('id')).to.equal(formFieldId.value);
    expect(formFields[0].get('label')).to.equal(formFieldLabel.value);
    expect(formFields[0].get('type')).to.equal(formFieldType.value);
    expect(formFields[0].get('defaultValue')).to.equal(formFieldDefaultValue.value);
  }));


  it('should change third form field properties of an element',
    inject(function(propertiesPanel) {

    var formFieldId = domQuery('input[name=formFieldId]', propertiesPanel._container),
        formFieldLabel = domQuery('input[name=formFieldLabel]', propertiesPanel._container),
        formFieldType = domQuery('input[name=formFieldType]', propertiesPanel._container),
        formFieldDefaultValue = domQuery('input[name=formFieldDefaultValue]', propertiesPanel._container),
        formFieldSelectBox = domQuery('select[name=selectedOption]', propertiesPanel._container),
        bo = getBusinessObject(shape);

    // change selected form field option
    formFieldSelectBox.options[2].selected = 'selected';
    TestHelper.triggerEvent(formFieldSelectBox, 'change');

    var formFields = getFormFields(bo.extensionElements);

    // given
    expect(formFields).to.have.length(3);
    expect(formFieldSelectBox.selectedIndex).to.equal(2);
    expect(formFieldId.value).to.equal('dateOfBirth');
    expect(formFieldLabel.value).to.equal('Date of Birth');
    expect(formFieldType.value).to.equal('date');
    expect(formFieldDefaultValue.value).is.empty;

    // when
    TestHelper.triggerValue(formFieldId, 'newId', 'change');
    TestHelper.triggerValue(formFieldLabel, 'newLabel', 'change');
    TestHelper.triggerValue(formFieldDefaultValue, 'newDefaultValue', 'change');
    TestHelper.triggerValue(formFieldType, 'string', 'change');

    // then
    expect(formFieldId.value).to.equal('newId');
    expect(formFieldLabel.value).to.equal('newLabel');
    expect(formFieldType.value).to.equal('string');
    expect(formFieldDefaultValue.value).to.equal('newDefaultValue');

    expect(formFields).to.have.length(3);
    expect(formFields[2].get('id')).to.equal(formFieldId.value);
    expect(formFields[2].get('label')).to.equal(formFieldLabel.value);
    expect(formFields[2].get('type')).to.equal(formFieldType.value);
    expect(formFields[2].get('defaultValue')).to.equal(formFieldDefaultValue.value);
  }));


  it('should not set the form field id with a space to the element',
    inject(function(propertiesPanel) {

    var formFieldId = domQuery('input[name=formFieldId]', propertiesPanel._container),
        formFieldSelectBox = domQuery('select[name=selectedOption]', propertiesPanel._container),
        bo = getBusinessObject(shape);

    var formFields = getFormFields(bo.extensionElements);

    // given
    expect(formFieldSelectBox.selectedIndex).to.equal(0);
    expect(formFieldId.value).to.equal('firstname');

    // when
    TestHelper.triggerValue(formFieldId, 'new id', 'change');

    // then
    expect(formFieldId.value).to.equal('new id');
    expect(formFieldId.className).to.equal('invalid');

    expect(formFields[0].get('id')).to.equal('firstname');
  }));


  it('should not set an empty form field id to the element',
    inject(function(propertiesPanel) {

    var formFieldId = domQuery('input[name=formFieldId]', propertiesPanel._container),
        formFieldSelectBox = domQuery('select[name=selectedOption]', propertiesPanel._container),
        bo = getBusinessObject(shape);

    var formFields = getFormFields(bo.extensionElements);

    // given
    expect(formFieldSelectBox.selectedIndex).to.equal(0);
    expect(formFieldId.value).to.equal('firstname');

    // when
    TestHelper.triggerValue(formFieldId, '', 'change');

    // then
    expect(formFieldId.value).to.equal('');
    expect(formFieldId.className).to.equal('invalid');

    expect(formFields[0].get('id')).to.equal('firstname');
  }));


  it('should correctly validate ID when form field selection has changed',
    inject(function(propertiesPanel) {

    var formFieldId = domQuery('input[name=formFieldId]', propertiesPanel._container),
        formFieldSelectBox = domQuery('select[name=selectedOption]', propertiesPanel._container);

    // given
    expect(formFieldSelectBox.selectedIndex).to.equal(0);

    expect(formFieldId.value).to.equal('firstname');

    // when
    formFieldSelectBox.options[1].selected = 'selected';
    TestHelper.triggerEvent(formFieldSelectBox, 'change');

    // then
    expect(formFieldId.value).to.equal('lastname');
    expect(formFieldId.className).to.not.contain('invalid');

  }));


  it('should not set the form field id with an invalid QName to the element',
    inject(function(propertiesPanel) {

    var formFieldId = domQuery('input[name=formFieldId]', propertiesPanel._container),
        formFieldSelectBox = domQuery('select[name=selectedOption]', propertiesPanel._container),
        bo = getBusinessObject(shape);

    var formFields = getFormFields(bo.extensionElements);

    // given
    expect(formFieldSelectBox.selectedIndex).to.equal(0);
    expect(formFieldId.value).to.equal('firstname');

    // when
    TestHelper.triggerValue(formFieldId, '::foo', 'change');

    // then
    expect(formFieldId.value).to.equal('::foo');
    expect(formFieldId.className).to.equal('invalid');

    expect(formFields[0].get('id')).to.equal('firstname');
  }));


  it('should add a new form field to existing form fields',
    inject(function(propertiesPanel) {

    var addButton = domQuery('[data-entry=forms] button[data-action=formData\\\.addFormField]', propertiesPanel._container),
        formFieldSelectBox = domQuery('select[name=selectedOption]', propertiesPanel._container),
        formFieldId = domQuery('input[name=formFieldId]', propertiesPanel._container),
        formFieldType = domQuery('input[name=formFieldType]', propertiesPanel._container),
        bo = getBusinessObject(shape);

    var formFields = getFormFields(bo.extensionElements);

    // given
    expect(formFields).to.have.length.of(3);

    // when
    TestHelper.triggerEvent(addButton, 'click');

    // then
    formFields = getFormFields(bo.extensionElements);
    expect(formFields).to.have.length.of(4);

    expect(formFieldSelectBox.selectedIndex).to.equal(3);

    expect(formFieldId.value).not.to.be.empty;
    expect(formFieldId.className).to.be.empty;

    expect(formFieldType.value).to.be.empty;
    expect(formFieldType.className).to.equal('invalid');
  }));


  describe('change from form data to form key', function() {

    var taskBo;

    beforeEach(inject(function(propertiesPanel) {
      // given
      var selectBox = domQuery('select[name=formType]', propertiesPanel._container);

      selectBox.options[0].selected = 'selected';

      // when
      TestHelper.triggerEvent(selectBox, 'change');

      taskBo = getBusinessObject(shape);
    }));

    it('should execute', inject(function(propertiesPanel) {
      // then
      expect(taskBo.extensionElements).to.be.undefined;
      expect(taskBo.formKey).to.be.undefined;

      taskBo.$model.toXML(taskBo, { format:true }, function(err, xml) {
        expect(xml).not.to.contain('camunda:formKey');
        expect(xml).not.to.contain('camunda:formData');
      });
    }));


    it('should undo', inject(function(propertiesPanel, commandStack) {
      // when
      commandStack.undo();

      // then
      expect(taskBo.formKey).to.be.undefined;
      expect(taskBo).to.have.property('extensionElements');
      expect(taskBo.extensionElements.values[0].$type).to.equal('camunda:FormData');

      taskBo.$model.toXML(taskBo, { format:true }, function(err, xml) {
        expect(xml).not.to.contain('camunda:formKey');
        expect(xml).to.contain('camunda:formData');
      });
    }));


    it('should redo', inject(function(propertiesPanel) {
      // then
      expect(taskBo.extensionElements).to.be.undefined;
      expect(taskBo.formKey).to.be.undefined;

      taskBo.$model.toXML(taskBo, { format:true }, function(err, xml) {
        expect(xml).not.to.contain('camunda:formKey');
        expect(xml).not.to.contain('camunda:formData');
      });
    }));

  });


  it('should retain other extension elements when switching to formKey',
    inject(function(propertiesPanel, elementRegistry, selection) {

    shape = elementRegistry.get('UserTask_2');

    selection.select(shape);

    var selectBox = domQuery('select[name=formType]', propertiesPanel._container);

    selectBox.options[0].selected = 'selected';

    // when
    TestHelper.triggerEvent(selectBox, 'change');

    var taskBo = getBusinessObject(shape);

    expect(taskBo.extensionElements).to.exist;
    expect(is(taskBo.extensionElements.values[0], 'camunda:TaskListener')).to.be.true;
    expect(taskBo.formKey).to.be.undefined;

    taskBo.$model.toXML(taskBo, { format:true }, function(err, xml) {
      expect(xml).not.to.contain('camunda:formKey');
      expect(xml).not.to.contain('camunda:formData');
      expect(xml).to.contain('camunda:taskListener');
    });

  }));


  it('should add a new form field after changing from form key to form data',
    inject(function(propertiesPanel, elementRegistry, selection) {

    shape = elementRegistry.get('UserTask_1');

    selection.select(shape);

    var selectBox = domQuery('select[name=formType]', propertiesPanel._container),
        addButton = domQuery('[data-entry=forms] button[data-action=formData\\\.addFormField]', propertiesPanel._container),
        formFieldSelectBox = domQuery('select[name=selectedOption]', propertiesPanel._container),
        formFieldId = domQuery('input[name=formFieldId]', propertiesPanel._container),
        formFieldType = domQuery('input[name=formFieldType]', propertiesPanel._container),
        bo = getBusinessObject(shape);

    var formFields = getFormFields(bo.extensionElements);

    // given
    expect(formFields).to.have.length.of(0);
    expect(selectBox.value).to.equal('formKey');

    // when
    // change from form key to form data
    selectBox.options[1].selected = 'selected';
    TestHelper.triggerEvent(selectBox, 'change');

    TestHelper.triggerEvent(addButton, 'click');

    // then
    formFields = getFormFields(bo.extensionElements);
    expect(formFields).to.have.length.of(1);

    expect(formFieldSelectBox.options).to.have.length.of(1);
    expect(formFieldSelectBox.selectedIndex).to.equal(0);

    expect(formFieldId.value).not.to.be.empty;
    expect(formFieldId.className).to.be.empty;

    expect(formFieldType.value).to.be.empty;
    expect(formFieldType.className).to.equal('invalid');

    expect(bo.get('camunda:formKey')).to.be.undefined;

  }));

});
