const { promisify, checkFileExtension } = require('../util/index');

function createIO_Task(task, ext) {
  return function (path, rest = []) {
    if (!Array.isArray(rest)) {
      throw new TypeError(
        'Expected the second argument to be a array containing rest arguments.'
      );
    }
    checkFileExtension(path, ext);
    return promisify(task, path, ...rest);
  };
}

module.exports = createIO_Task;
