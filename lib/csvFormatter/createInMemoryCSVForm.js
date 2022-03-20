const {
  isEmpty,
  csvFileSeparatorPattern,
  linePattern,
  zip,
  _metaLevelConfig,
  pipe,
} = require('../util');

const { _createInFileCsvType } = require('./csv');

function createInMemoryCsvForm(data) {
  function extractRowData([line]) {
    return line.split(csvFileSeparatorPattern);
  }
  const csvData = Array.from(data.matchAll(linePattern), extractRowData);

  return {
    titles: csvData[0],
    rows: createCsvObject(csvData[0], csvData.slice(1)),
  };
}

function createCsvObject(csvTitles, csvRows) {
  function getEmptyProp(row) {
    return csvTitles.filter(pipe((title) => row[title], isEmpty));
  }

  return csvRows.map(function (row) {
    const csv = Object.fromEntries(zip(csvTitles, row));
    Object.defineProperty(
      csv,
      '_emptyFields',
      _metaLevelConfig(getEmptyProp(csv))
    );

    Object.defineProperty(
      csv,
      '_csvRawForm',
      _metaLevelConfig(function () {
        return {
          get: function () {
            return _createInFileCsvType(Object.values(csv));
          },
        };
      }, true)
    );

    return Object.seal(csv);
  });
}

module.exports = createInMemoryCsvForm;
