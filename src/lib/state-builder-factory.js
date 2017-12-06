import { NoStateBuilderTypeError, NoStateAssistantTypeError } from './errors';

const _builderMap = new WeakMap();
const _assistantMap = new WeakMap();

/**
 * Capable of mapping `StateTemplate`s to an interactable builder
 * component which can visually represent that `State`.
 */
export class StateBuilderFactory {
  constructor () {
    _builderMap.set(this, new Map());
    _assistantMap.set(this, new Map());
  }

  /**
   * Register a new component as the "builder" for a certain `StateTemplate` type.
   *
   * @param {*} templateClass - A class extending `StateTemplate`.
   * @param {*} builderClass - A class extending `Component`, which can supply values to a `State` created from the `StateTemplate`.
   * @returns {StateBuilderFactory} A reference to `this` for chaining.
   */
  registerBuilder (templateClass, builderClass) {
    _builderMap.get(this).set(templateClass, builderClass);
    return this;
  }

  /**
   * @param {*} templateClass - A class extending `StateTemplate`.
   * @returns {*} A class extending `Component`, which can supply values to a `State` created from templateClass.
   * @throws {NoStateBuilderTypeError} If no builder `Component` is registered for the given `StateTemplate` class.
   */
  getBuilder (templateClass) {
    if (!_builderMap.get(this).has(templateClass)) {
      throw new NoStateBuilderTypeError(templateClass);
    } else {
      return _builderMap.get(this).get(templateClass);
    }
  }

  /**
   * Register a new component as the "assistant" for a certain `StateTemplate` type.
   *
   * @param {*} templateClass - A class extending `StateTemplate`.
   * @param {*} assistantClass - A class extending `Component`, which can supply values to a `State` created from the `StateTemplate`.
   * @returns {StateBuilderFactory} A reference to `this` for chaining.
   */
  registerAssistant (templateClass, assistantClass) {
    _assistantMap.get(this).set(templateClass, assistantClass);
    return this;
  }

  /**
   * @param {*} templateClass - A class extending `StateTemplate`.
   * @returns {*} A class extending `Component`, which can supply values to a `State` created from templateClass.
   * @throws {NoStateBuilderTypeError} If no assistant `Component` is registered for the given `StateTemplate` class.
   */
  getAssistant (templateClass) {
    if (!_assistantMap.get(this).has(templateClass)) {
      throw new NoStateAssistantTypeError(templateClass);
    } else {
      return _assistantMap.get(this).get(templateClass);
    }
  }
}
