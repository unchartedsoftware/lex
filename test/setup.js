import 'regenerator-runtime/runtime';

global.sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
