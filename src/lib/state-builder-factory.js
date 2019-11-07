import { NoStateBuilderTypeError, NoStateAssistantTypeError, NoActionActionButtonTypeError } from './errors';
import { State } from './state';
import { Action } from './action';

const _builderMap = new WeakMap();
const _assistantMap = new WeakMap();
const _actionButtonMap = new WeakMap();

// Recursively search the given map for the given key (clazz)
// if we don't have a value for clazz, check if its prototype
// is an instance of baseClazz and then retry the check
function recursiveClassGet (map, clazz, baseClazz = State) {
  if (map.has(clazz)) {
    return map.get(clazz);
  }

  const prototype = Object.getPrototypeOf(clazz);

  if (!baseClazz.isPrototypeOf(prototype)) {
    return null;
  } else {
    return recursiveClassGet(map, prototype);
  }
}

/**
 * Capable of mapping `StateTemplate`s to an interactable builder
 * component which can visually represent that `State`.
 *
 * @private
 */
export class StateBuilderFactory {
  constructor () {
    _builderMap.set(this, new Map());
    _assistantMap.set(this, new Map());
    _actionButtonMap.set(this, new Map());
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
   * @throws {NoStateBuilderTypeError} If no builder `Component` is registered for the given `StateTemplate` class or its super classes.
   */
  getBuilder (templateClass) {
    const builder = recursiveClassGet(_builderMap.get(this), templateClass, State);
    if (builder == null) {
      throw new NoStateBuilderTypeError(templateClass);
    }
    return builder;
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
   * @throws {NoStateAssistantTypeError} If no assistant `Component` is registered for the given `StateTemplate` class or its super classes.
   */
  getAssistant (templateClass) {
    const assistant = recursiveClassGet(_assistantMap.get(this), templateClass, State);
    if (assistant == null) {
      throw new NoStateAssistantTypeError(templateClass);
    }
    return assistant;
  }

  /**
   * Register a new component as the "action button" for a certain `Action` type.
   *
   * @param {*} templateClass - A class extending `Action`.
   * @param {*} actionButtonClass - A class extending `Component`, which can supply values to an `Action`.
   * @returns {StateBuilderFactory} A reference to `this` for chaining.
   */
  registerActionButton (templateClass, actionButtonClass) {
    _actionButtonMap.get(this).set(templateClass, actionButtonClass);
    return this;
  }

  /**
   * @param {*} templateClass - A class extending `Action`.
   * @returns {*} A class extending `Component`, which can supply values to an `Action`.
   * @throws {NoActionActionButtonTypeError} If no action button `Component` is registered for the given `Action` class or its super classes.
   */
  getActionButton (templateClass) {
    const assistant = recursiveClassGet(_actionButtonMap.get(this), templateClass, Action);
    if (assistant == null) {
      throw new NoActionActionButtonTypeError(templateClass);
    }
    return assistant;
  }
}
