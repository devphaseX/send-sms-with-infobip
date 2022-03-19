function promisify(action, ...args) {
  return new Promise((res, rej) => {
    if (!(args.length > 1)) {
      throw new TypeError('Expected 2 or more argument but got less than 2');
    }

    action(...args, (err, success) => {
      if (err) {
        rej(err);
      } else {
        res(success);
      }
    });
  });
}

function generateRandomId() {
  return Math.random().toString(32).slice(2);
}

function checkFileExtension(path, ext) {
  if (!path.endsWith('.' + ext)) {
    throw new TypeError(
      `Expected a .${ext} file but got ' + ${path.slice(path.lastIndexOf('.'))}`
    );
  }
}

let linePattern = /^.+$/gm;
let csvFileSeparatorPattern = /,/;

function populateEmptyField(record, name, value, immutable = true) {
  record = immutable ? { ...record } : record;

  record[name] = value;
  const nameFieldIndex = record._emptyFields.indexOf(name);

  if (nameFieldIndex > -1) {
    const emptyFields = record._emptyFields.slice(0);
    emptyFields.splice(nameFieldIndex, 1);
    record._emptyFields = emptyFields;
  } else {
    if (value == null || value === '') {
      record._emptyFields = record._emptyFields.concat(name);
    }
  }

  return record;
}

function isEmpty(value) {
  return !isNotEmpty(value);
}

function isNotEmpty(value) {
  return (
    (typeof value === 'string' && value.trim() !== '') ||
    (typeof value === 'number' && Number.isFinite(value)) ||
    value != null
  );
}

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

function getLength(value) {
  if ('length' in value && typeof value.length === 'number') {
    return value.length;
  }

  throw new TypeError('Expected a value with the length property available');
}

function createPopulatedArray(size, defaultValue) {
  return Array(size).fill(defaultValue);
}

function zip(listA, listB) {
  let minLength = Math.min(getLength(listA), getLength(listB));
  const tupleType = createPopulatedArray(minLength, []);

  tupleType.forEach((_, i) => {
    tupleType[i] = [listA[i], listB[i]];
  });

  return tupleType;
}

function _mergeCsvRowValues(row) {
  return row.join(',');
}

function checkArrayForNested(list, depth = 1) {
  if (!Array.isArray(list)) return false;
  if (depth === 0) {
    return true;
  }
  return checkArrayForNested(list[0], depth - 1);
}

function _createInFileCsvType(data) {
  let isNested = checkArrayForNested(data, 1);
  if (isNested) {
    throw new TypeError('Nested array is not supported');
  }

  return _mergeCsvRowValues(data);
}

function _metaLevelConfig(value, isAccessorProp) {
  let behaviourConfig = { enumerable: false, configurable: false };
  if (!isAccessorProp) {
    return { value, ...behaviourConfig };
  }

  if (typeof value !== 'function')
    throw new TypeError(
      'Expected a function which return object containing accessor property'
    );

  {
    const accessor = value();

    if (
      typeof accessor === 'object' &&
      accessor &&
      isNaiveObjectInstance(accessor)
    ) {
      const { set, get } = accessor;
      return Object.assign({ set, get }, behaviourConfig);
    }
  }

  throw new TypeError(
    'Expect the return value of the function as a object contain either getter or setter method.'
  );
}

function isNaiveObjectInstance(value) {
  return Object.prototype.isPrototypeOf(value);
}

function generateMessageId() {
  return `BULK-ID-${generateRandomId()}`;
}

module.exports = {
  generateMessageId,
  _metaLevelConfig,
  _createInFileCsvType,
  getLength,
  promisify,
  linePattern,
  csvFileSeparatorPattern,
  baseURI,
  baseApiKey,
  populateEmptyField,
  checkFileExtension,
  isNotEmpty,
  createIO_Task,
  isEmpty,
  zip,
};