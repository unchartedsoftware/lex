import simulant from 'simulant';

global.sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
global.simulant = simulant;
global.wait = function (waitms = 10) {
  return new Promise((resolve) => {
    setTimeout(resolve, waitms);
  });
};
global.click = function (node) {
  simulant.fire(node, 'mouseover');
  simulant.fire(node, 'mousedown');
  simulant.fire(node, 'mouseup');
  simulant.fire(node, 'click');
};
global.type = async function (inputNode, text = '') {
  const chars = text.split('');
  let buff = '';
  for (const c of chars) {
    buff += c;
    simulant.fire(inputNode, 'keydown', { key: c });
    simulant.fire(inputNode, 'keypress', { key: c });
    inputNode.value = buff;
    simulant.fire(inputNode, 'input', { target: { value: buff } });
    simulant.fire(inputNode, 'keyup', { key: c });
    await wait();
  }
};
// might need this if Simulant doesn't serve our needs
// https://stackoverflow.com/questions/24025165/simulating-a-mousedown-click-mouseup-sequence-in-tampermonkey
// global.mouseEvent = function (node, eventType) {
//   const clickEvent = document.createEvent('MouseEvents');
//   clickEvent.initEvent(eventType, true, true);
//   node.dispatchEvent(clickEvent);
// };
// global.keyEvent = function (node, eventType) {
//   const keyEvent = document.createEvent('KeyboardEvent');
//   keyEvent.initKeyboardEvent(
//     eventType, // event type : keydown, keyup, keypress
//     true, // bubbles
//     true // cancelable
//     // global.window, // viewArg: should be window
//     // false, // ctrlKeyArg
//     // false, // altKeyArg
//     // false, // shiftKeyArg
//     // false, // metaKeyArg
//     // 40, // keyCodeArg : unsigned long the virtual key code, else 0
//     // 0 // charCodeArgs : unsigned long the Unicode character associated with the depressed key, else 0
//   );
//   node.dispatchEvent(keyEvent);
// };
