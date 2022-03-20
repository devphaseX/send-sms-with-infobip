const { isEmpty } = require('../util/index');

function insertFieldInRecords(records, createField, shouldInsert) {
  records.forEach(function accessRecord(record) {
    if (!shouldInsert(record)) return;
    populateEmptyField(record, ...createField(), false);
  });
}

function populateEmptyField(record, name, value, immutable = true) {
  record = immutable ? { ...record } : record;

  record[name] = value;
  const nameFieldIndex = record._emptyFields.indexOf(name);

  if (nameFieldIndex > -1) {
    const emptyFields = record._emptyFields.slice(0);
    emptyFields.splice(nameFieldIndex, 1);
    record._emptyFields = emptyFields;
  } else {
    if (isEmpty(value)) {
      record._emptyFields = record._emptyFields.concat(name);
    }
  }

  return record;
}

module.exports = { populateEmptyField, insertFieldInRecords };
