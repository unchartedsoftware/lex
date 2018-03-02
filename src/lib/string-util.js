export function toChar (keyCode) {
  // Magic for handling JS key codes
  // Source: https://stackoverflow.com/questions/1772179/get-character-value-from-keycode-in-javascript-then-trim
  const chrCode = keyCode - 48 * Math.floor(keyCode / 48);
  return String.fromCharCode((keyCode >= 96) ? chrCode : keyCode);
}
