import dotenv from 'dotenv';
import fetch from 'node-fetch';
import convertInMemoryCsvToFileType from './lib/csvFormatter/convertInMemoryCsvToFileType.js';
import createInMemoryCsvForm from './lib/csvFormatter/createInMemoryCSVForm.js';
import { getCSVData, setCSVData } from './lib/csvFormatter/csv.js';
import { uuid } from './lib/util/index.js';
import { insertFieldInRecords } from './lib/util/record.js';

const { BASEURI, BASEAPIKEY } = process.env;

dotenv.config({ path: './local.env' });

function createFetchOption(sms, message, { baseApi }) {
  return {
    method: 'post',
    body: JSON.stringify({
      messages: [
        {
          from: sms.SenderId,
          destinations: [{ to: sms.MSISDN, messageId: sms.messageId }],
          text: message,
        },
      ],
    }),
    headers: {
      Authorization: `App ${baseApi}`,
      'Content-Type': 'application/json',
    },
  };
}

async function createMessageProcess(smsInCsvFormList) {
  function createAsyncDataPlaceholder(single) {
    return fetch(
      `https://${BASEURI}/sms/2/text/advanced`,
      createFetchOption(single, 'This is a sample message from the server', {
        baseApi: BASEAPIKEY,
      })
    );
  }
  return await Promise.allSettled(
    smsInCsvFormList.map(createAsyncDataPlaceholder)
  );
}

async function sendSms(smsInCsvFormList) {
  function autoGenerateId() {
    return ['messageId', uuid()];
  }

  insertFieldInRecords(smsInCsvFormList, autoGenerateId, function (sms) {
    return sms._emptyFields.includes('messageId');
  });

  const msgProcesses = await createMessageProcess(smsInCsvFormList);
  const finalResult = msgProcesses.map(function (smsProcess, index) {
    if (smsProcess.status !== 'fulfilled') return smsInCsvFormList[index];
    const [{ status }] = smsProcess.value;

    return populateEmptyField(
      smsInCsvFormList[index],
      'description',
      status.description,
      false
    );
  });

  return finalResult;
}

async function _init() {
  let inMemoryCSVForm;
  {
    const raw = await getCSVData('./message.csv', ['utf-8']);
    inMemoryCSVForm = createInMemoryCsvForm(raw);
  }

  const updatedRowData = await sendSms(inMemoryCSVForm.rows);
  return [inMemoryCSVForm.titles, updatedRowData];
}

_init()
  .then((csv) => {
    return setCSVData('./message.csv', [convertInMemoryCsvToFileType(csv)]);
  })
  .then(() => {
    console.log('Writing csv file to drive completed...');
  })
  .catch((e) => {
    console.log(e.message);
  });
