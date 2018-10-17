export class NoStateBuilderTypeError extends Error {
  constructor (stateClass) {
    super(`No state builder for State type: ${stateClass.name}`);
    // a workaround to make `instanceof NoStateBuilderTypeError` work in ES5
    this.constructor = NoStateBuilderTypeError;
    this.__proto__ = NoStateBuilderTypeError.prototype; // eslint-disable-line no-proto
  }
}

export class NoStateAssistantTypeError extends Error {
  constructor (stateClass) {
    super(`No state builder assistant for State type: ${stateClass.name}`);
    // a workaround to make `instanceof NoStateAssistantTypeError` work in ES5
    this.constructor = NoStateAssistantTypeError;
    this.__proto__ = NoStateAssistantTypeError.prototype; // eslint-disable-line no-proto
  }
}

export class NoActionActionButtonTypeError extends Error {
  constructor (actionClass) {
    super(`No action button for Action type: ${actionClass.name}`);
    // a workaround to make `instanceof NoActionActionButtonTypeError` work in ES5
    this.constructor = NoActionActionButtonTypeError;
    this.__proto__ = NoActionActionButtonTypeError.prototype; // eslint-disable-line no-proto
  }
}

export class StateTransitionError extends Error {
  constructor (...args) {
    super(...args);
    // a workaround to make `instanceof StateTransitionError` work in ES5
    this.constructor = StateTransitionError;
    this.__proto__ = StateTransitionError.prototype; // eslint-disable-line no-proto
  }
}

export class ValueArchiveError extends Error {
  constructor (...args) {
    super(...args);
    // a workaround to make `instanceof ValueArchiveError` work in ES5
    this.constructor = ValueArchiveError;
    this.__proto__ = ValueArchiveError.prototype; // eslint-disable-line no-proto
  }
}
