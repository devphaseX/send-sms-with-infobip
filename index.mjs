import fs from 'fs';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config({ path: './local.env' });

import {
  linePattern,
  csvFileSeparatorPattern,
  createIO_Task,
  zip,
  _metaLevelConfig,
  _createInFileCsvType,
  populateEmptyField,
} from './util.js';

const { BASEURI, BASEAPI } = process.env;

const getCSVData = createIO_Task(fs.readFile, 'csv');
const setCSVData = createIO_Task(fs.writeFile, 'csv');

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
    return csvTitles.filter(function (title) {
      return row[title].trim() === '';
    });
  }

  return csvRows.map((row) => {
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

function getDescriptionFromInfoBip(csv) {
  return Promise.allSettled(
    csv.map((info) => {
      const fetchOptions = {
        method: 'post',
        body: JSON.stringify({
          messages: [
            {
              from: info.SenderId,
              destinations: [{ to: info.MSISDN }],
              text: 'Dear Customer, Thanks for registering with our service.',
            },
          ],
        }),
        headers: {
          Authorization: `App ${BASEAPI}`,
          'Content-Type': 'application/json',
        },
      };

      return fetch(`https://${BASEURI}/sms/2/text/advanced`, fetchOptions).then(
        (response) => response.json()
      );
    })
  );
}

async function fetchSmsDescription(csv) {
  const data = await getDescriptionFromInfoBip(csv);

  const finalResult = data.map((resolveValue, index) => {
    const {
      messages: [
        {
          messageId,
          status: { description },
        },
      ],
    } = resolveValue.value;
    if (resolveValue.status === 'fulfilled') {
      return updateRecord(csv[index], { messageId, description });
    }
    return csv[index];
  });

  return finalResult;
}

function updateRecord(previousRecord, nextPartialRecord) {
  const entries = Object.entries(nextPartialRecord);
  entries.forEach(function ([key, value]) {
    populateEmptyField(previousRecord, key, value, false);
  });
  return previousRecord;
}

function convertInMemoryCsvToFileType([titles, rows]) {
  return `${_createInFileCsvType(titles)}\n${rows
    .map((row) => row._csvRawForm)
    .join('\n')}`;
}

async function _init() {
  const { titles, rows } = await getCSVData('./message.csv', ['utf-8']).then(
    createInMemoryCsvForm
  );

  const result = await fetchSmsDescription(rows);
  return [titles, result];
}

_init()
  .then((data) => {
    return setCSVData('./message.csv', [convertInMemoryCsvToFileType(data)]);
  })
  .then(() => {
    console.log('writing to file complete');
  });
