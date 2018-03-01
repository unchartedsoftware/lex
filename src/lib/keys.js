export const ENTER = 13;
export const LEFT_ARROW = 37;
export const RIGHT_ARROW = 39;
export const DOWN_ARROW = 40;
export const UP_ARROW = 38;
export const COMMA = 188;
export const TAB = 9;
export const BACKSPACE = 8;
export const ESCAPE = 27;

export function toChar (keyCode) {
  // Magic for handling JS key codes
  // Source: https://stackoverflow.com/questions/1772179/get-character-value-from-keycode-in-javascript-then-trim
  const chrCode = keyCode - 48 * Math.floor(keyCode / 48);
  return String.fromCharCode((keyCode >= 96) ? chrCode : keyCode);
}