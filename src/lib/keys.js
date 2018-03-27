export const ENTER = ['Enter'];
export const LEFT_ARROW = ['Left', 'ArrowLeft'];
export const RIGHT_ARROW = ['Right', 'ArrowRight'];
export const DOWN_ARROW = ['Down', 'ArrowDown'];
export const UP_ARROW = ['Up', 'ArrowUp'];
export const COMMA = [','];
export const TAB = ['Tab'];
export const BACKSPACE = ['Backspace'];
export const ESCAPE = ['Esc', 'Escape'];

export function normalizeKey (key) {
  if (UP_ARROW.indexOf(key) > -1) {
    return 'up';
  } else if (DOWN_ARROW.indexOf(key) > -1) {
    return 'down';
  } else if (TAB.indexOf(key) > -1) {
    return 'tab';
  } else if (ENTER.indexOf(key) > -1) {
    return 'enter';
  } else if (BACKSPACE.indexOf(key) > -1) {
    return 'backspace';
  } else if (ESCAPE.indexOf(key) > -1) {
    return 'escape';
  }
}
