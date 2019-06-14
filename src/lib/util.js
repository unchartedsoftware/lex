/**
 * Migrate params to component state via setState
 * iff they have actually changed.
 *
 * @private
 * @param {Object} scope - A reference to the component's `this`.
 * @param {Object} incomingProps - The incoming props values.
 * @param {Object[]} toMigrate - A list of props (described by objects `{k, sk, transform, default, before, after}`) to migrate, including the potential default values and logic to run before and after the state change.
 */
export function propsToState (scope, incomingProps, toMigrate) {
  for (const conf of toMigrate) {
    const {
      k,
      sk = k,
      transform = (v) => v,
      before = () => undefined,
      after = () => undefined
    } = conf;
    const s = {};
    // if there's no incoming prop, the prop isn't set on the state, and a default value is supplied
    if (incomingProps[k] === undefined && conf.default !== undefined && scope.state[sk] === undefined) {
      before.call(scope, conf.default);
      s[sk] = conf.default;
      scope.setState(s, after.call(scope, conf.default));
    // if there is an incoming prop and it doesn't equal the current value
    } else if (incomingProps[k] !== undefined && incomingProps[k] !== scope.state[sk]) {
      const v = transform(incomingProps[k]);
      before.call(scope, v);
      s[sk] = v;
      scope.setState(s, () => after.call(scope, v));
    }
  }
}

export function lexStillHasFocus (event, searchBoxEl, assistantBoxEl) {
  const relatedTarget = event.relatedTarget || // The default behaviour which works in modern browsers
    event.explicitOriginalTarget || // FireFox fix :(
    document.activeElement; // Fallback to what the browser says is currently focused

  return relatedTarget != null && assistantBoxEl != null && searchBoxEl != null &&
    (assistantBoxEl.contains(relatedTarget) || searchBoxEl.contains(relatedTarget));
}
