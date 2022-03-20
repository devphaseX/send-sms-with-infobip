const fs = require('fs');
const createIO_Task = require('../io/index');
const { checkArrayForNested } = require('../util/index.js');

const getCSVData = createIO_Task(fs.readFile, 'csv');
const setCSVData = createIO_Task(fs.writeFile, 'csv');

function _mergeCsvRowValues(row) {
  return row.join(',');
}

function _createInFileCsvType(data) {
  let isNested = checkArrayForNested(data, 1);
  if (isNested) {
    throw new TypeError('Nested array is not supported');
  }

  return _mergeCsvRowValues(data);
}

let csvFileSeparatorPattern = /,/;

module.exports = {
  _createInFileCsvType,
  _mergeCsvRowValues,
  csvFileSeparatorPattern,
  getCSVData,
  setCSVData,
};
