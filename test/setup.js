global.sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

global.wait = function (waitms = 10) {
  return new Promise((resolve) => {
    setTimeout(resolve, waitms);
  });
};
