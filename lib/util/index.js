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

function isEmpty(value) {
  return (
    (typeof value === 'string' && value.trim() === '') ||
    (typeof value === 'number' && Number.isNaN(value)) ||
    !Number.isFinite(value) ||
    typeof value === 'undefined' ||
    (typeof value === 'object' && Object(value) !== value)
  );
}

function checkFileExtension(path, ext) {
  if (!path.endsWith('.' + ext)) {
    throw new TypeError(
      `Expected a .${ext} file but got ' + ${path.slice(path.lastIndexOf('.'))}`
    );
  }
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

function checkArrayForNested(list, depth = 1) {
  if (!Array.isArray(list)) return false;
  if (depth === 0) {
    return true;
  }
  return checkArrayForNested(list[0], depth - 1);
}

function isAccessorPropObject(value) {
  if (!isNaiveObjectInstance(value)) return false;
  return ['set', 'get'].some(function (prop) {
    return prop in value && typeof value[prop] === 'function';
  });
}

function getValueObjectForm(value) {
  return Object.prototype.toString.call(value);
}

function isNaiveObjectInstance(value) {
  return Object.prototype.isPrototypeOf(value);
}

function uuid() {
  return Math.random().toString().slice(2);
}

function _metaLevelConfig(value, isAccessorProp) {
  let behaviourConfig = { enumerable: false, configurable: false };

  if (!isAccessorProp) return { value, ...behaviourConfig };

  let isValueAccessorCreator = typeof value === 'function';
  let isValueAccessorObject = isAccessorPropObject(value);

  if (!(isValueAccessorCreator || isValueAccessorObject)) {
    throw new TypeError(
      `Expected an accessor creator function or object accessor, but got ${
        typeof value !== 'object' ? typeof value : getValueObjectForm(value)
      }`
    );
  }

  check: {
    const accessor = typeof value === 'object' ? value : value();
    if (!isValueAccessorObject && !isAccessorPropObject(accessor)) {
      break check;
    }
    const { set, get } = accessor;
    return Object.assign({ set, get }, behaviourConfig);
  }

  throw new TypeError(
    'Expect the return value of the function or the object doesnt contain either getter or setter method.'
  );
}

function pipe(...fns) {
  return function tunnelData(value) {
    return fns.reduce((result, fn) => fn(result), value);
  };
}

let linePattern = /^.+$/gm;

module.exports = {
  pipe,
  linePattern,
  _metaLevelConfig,
  uuid,
  getValueObjectForm,
  isNaiveObjectInstance,
  promisify,
  checkFileExtension,
  isEmpty,
  getLength,
  createPopulatedArray,
  zip,
  checkArrayForNested,
  isAccessorPropObject,
};
