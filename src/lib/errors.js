export class UnknownTokenBuilderTypeError extends Error {
  constructor (name) {
    super(`Unknown token builder type: ${name}`);
  }
}

export class StateTransitionError extends Error {}
