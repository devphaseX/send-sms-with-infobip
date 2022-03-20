const { checkArrayForNested } = require('../util/index.js');
const { _mergeCsvRowValues } = require('./csv.js');

function unwrapCsvRawForm(row) {
  return '_csvRawForm' in row
    ? row._csvRawForm
    : _createInFileCsvType(Object.values());
}

function convertInMemoryCsvToFileType([titles, rows]) {
  return `${_createInFileCsvType(titles)}\n${rows
    .map(unwrapCsvRawForm)
    .join('\n')}`;
}

function _createInFileCsvType(data) {
  let isNested = checkArrayForNested(data, 1);
  if (isNested) {
    throw new TypeError('Nested array is not supported');
  }

  return _mergeCsvRowValues(data);
}

module.exports = convertInMemoryCsvToFileType;
