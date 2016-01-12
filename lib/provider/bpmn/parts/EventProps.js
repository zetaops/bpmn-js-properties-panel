'use strict';

var is = require('bpmn-js/lib/util/ModelUtil').is,
  eventDefinitionHelper = require('../../../helper/EventDefinitionHelper');

var forEach = require('lodash/collection/forEach');

var message = require('./implementation/MessageEventDefinition'),
    signal = require('./implementation/SignalEventDefinition'),
    error = require('./implementation/ErrorEventDefinition'),
    escalation = require('./implementation/EscalationEventDefinition'),
    timer = require('./implementation/TimerEventDefinition'),
    receiveTask = require('./implementation/ReceiveTask');


module.exports = function(group, element, bpmnFactory) {
  var events = [
    'bpmn:StartEvent',
    'bpmn:EndEvent',
    'bpmn:IntermediateThrowEvent',
    'bpmn:BoundaryEvent',
    'bpmn:IntermediateCatchEvent'
  ];

  // Message and Signal Event Definition
  forEach(events, function(event) {
    if(is(element, event)) {

      var messageEventDefinition = eventDefinitionHelper.getMessageEventDefinition(element),
          signalEventDefinition = eventDefinitionHelper.getSignalEventDefinition(element);

      if(messageEventDefinition) {
        message(group, element, bpmnFactory, messageEventDefinition);
      }

      if(signalEventDefinition) {
        signal(group, element, bpmnFactory, signalEventDefinition);
      }

    }
  });

  // Special Case: Receive Task
  if(is(element, 'bpmn:ReceiveTask')) {
    receiveTask(group, element, bpmnFactory);
  }

  // Error Event Definition
  var errorEvents = [
    'bpmn:StartEvent',
    'bpmn:BoundaryEvent',
    'bpmn:EndEvent'
  ];

  forEach(errorEvents, function(event) {
    if(is(element, event)) {

      var showErrorCodeVariable = is(element, 'bpmn:StartEvent') || is (element, 'bpmn:BoundaryEvent');

      var errorEventDefinition = eventDefinitionHelper.getErrorEventDefinition(element);

      if(errorEventDefinition) {
        error(group, element, bpmnFactory, errorEventDefinition, showErrorCodeVariable);
      }
    }
  });

  // Escalation Event Definition
  var escalationEvents = [
    'bpmn:StartEvent',
    'bpmn:BoundaryEvent',
    'bpmn:IntermediateThrowEvent',
    'bpmn:EndEvent'
  ];

  forEach(escalationEvents, function(event) {
    if(is(element, event)) {

      var showEscalationCodeVariable = is(element, 'bpmn:StartEvent') || is(element, 'bpmn:BoundaryEvent');

      // get business object
      var escalationEventDefinition = eventDefinitionHelper.getEscalationEventDefinition(element);

      if(escalationEventDefinition) {
        escalation(group, element, bpmnFactory, escalationEventDefinition, showEscalationCodeVariable);
      }
    }

  });

  // Timer Event Definition
  var timerEvents = [
    'bpmn:StartEvent',
    'bpmn:BoundaryEvent',
    'bpmn:IntermediateCatchEvent'
  ];

  forEach(timerEvents, function(event) {
    if(is(element, event)) {

      // get business object
      var timerEventDefinition = eventDefinitionHelper.getTimerEventDefinition(element);

      if(timerEventDefinition) {
        timer(group, element, bpmnFactory, timerEventDefinition);
      }
    }
  });

};
