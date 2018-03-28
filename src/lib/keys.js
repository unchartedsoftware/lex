export const ENTER = 'Enter';
export const LEFT_ARROW = 'ArrowLeft';
export const RIGHT_ARROW = 'ArrowRight';
export const DOWN_ARROW = 'ArrowDown';
export const UP_ARROW = 'ArrowUp';
export const COMMA = ',';
export const TAB = 'Tab';
export const BACKSPACE = 'Backspace';
export const ESCAPE = 'Escape';
export const DELETE = 'Delete';

export function normalizeKey (e) {
  switch (e.key) {
    case 'Left':
      return LEFT_ARROW;
    case 'Right':
      return RIGHT_ARROW;
    case 'Down':
      return DOWN_ARROW;
    case 'Up':
      return UP_ARROW;
    case 'Esc':
      return ESCAPE;
    case 'Del':
      return DELETE;
    default:
      return e.key;
  }
}
