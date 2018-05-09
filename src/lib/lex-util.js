import { StateTemplate } from './state';

// TODO Modify Lex static from to delegate here. Need a non jsx version for use in unit tests.
export function lexFrom (vkey, StateKlass, config = {}) {
  let Klass = StateKlass;
  let confObj = config;
  if (typeof vkey === 'string') {
    confObj.vkey = vkey;
  } else {
    Klass = vkey;
    confObj = StateKlass;
  }
  return new StateTemplate(Klass, confObj);
}
