import { NoStateBuilderTypeError, NoStateAssistantTypeError } from './errors';
import { StateTemplate } from './state';

const _builderMap = new WeakMap();
const _assistantMap = new WeakMap();

// Recursively search the given map for the given key (clazz)
// if we don't have a value for clazz, check if its prototype
// is an instance of StateTemplate and then retry the check
function recursiveClassGet (map, clazz) {
  if (map.has(clazz)) {
    return map.get(clazz);
  }

  const prototype = Object.getPrototypeOf(clazz);

  if (!StateTemplate.isPrototypeOf(prototype)) {
    return null;
  } else {
    return recursiveClassGet(map, prototype);
  }
}

/**
 * Capable of mapping `StateTemplate`s to an interactable builder
 * component which can visually represent that `State`.
 * @private
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
   * @throws {NoStateBuilderTypeError} If no builder `Component` is registered for the given `StateTemplate` class or its super classes.
   */
  getBuilder (templateClass) {
    const builder = recursiveClassGet(_builderMap.get(this), templateClass);
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
    const assistant = recursiveClassGet(_assistantMap.get(this), templateClass);
    if (assistant == null) {
      throw new NoStateAssistantTypeError(templateClass);
    }
    return assistant;
  }
}
