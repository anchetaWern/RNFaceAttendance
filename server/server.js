var bleno = require('bleno');
var dateFormat = require('dateformat');

const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");
const fs = require('fs');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const loc = 'southeastasia.api.cognitive.microsoft.com'; // replace with the server nearest to you (https://westus.dev.cognitive.microsoft.com/docs/services/563879b61984550e40cbbe8d/operations/563879b61984550f30395237)

const key = 'YOUR COGNITIVE SERVICES API KEY';
const facelist_id = 'class-3e-facelist'; // replace with your unique facelist ID

const base_instance_options = {
  baseURL: `https://${loc}/face/v1.0`,
  timeout: 1000,
  headers: {
    'Content-Type': 'application/json',
    'Ocp-Apim-Subscription-Key': key
  }
};

var time_format = 'h:MM TT';

var attendees = [
  {id: 1, full_name: 'blue', time_entered: dateFormat(new Date(1505901033110), time_format)},
  {id: 2, full_name: 'red', time_entered: dateFormat(new Date(1505901733110), time_format)},
  {id: 3, full_name: 'silver', time_entered: dateFormat(new Date(1505908733110), time_format)}
];

const BASE_UUID = '-5659-402b-aeb3-d2f7dcd1b999'; // replace with your base UUID
const PERIPHERAL_ID = '0000';
const PRIMARY_SERVICE_ID = '0100';

var primary_service_uuid = PERIPHERAL_ID + PRIMARY_SERVICE_ID + BASE_UUID;
var ps_characteristic_uuid = PERIPHERAL_ID + '0300' + BASE_UUID;

var settings = {
  service_id: primary_service_uuid,
  characteristic_id: ps_characteristic_uuid
}

bleno.on('stateChange', (state) => {
  if (state === 'poweredOn') {
    bleno.startAdvertising('AttendanceApp', [settings.service_id]);
  } else {
    bleno.stopAdvertising();
  }
});

bleno.on('advertisingStart', (error) => {
  if (error) {
    console.log('something went wrong while trying to start advertisement of services');
  } else {
    console.log('started..');
    bleno.setServices([
      new bleno.PrimaryService({
        uuid : settings.service_id,
        characteristics : [
          new bleno.Characteristic({
            value : null,
            uuid : settings.characteristic_id,
            properties : ['write'],
            onWriteRequest : (data, offset, withoutResponse, callback) => {

              var attendee = JSON.parse(data.toString());
              attendee.time_entered = dateFormat(new Date(), time_format);
              attendees.push(attendee);
              console.log(attendees);

              callback(this.RESULT_SUCCESS);
            }
          })
        ]
      })
    ]);
  }
});


bleno.on('accept', (clientAddress) => {
  console.log('client address: ', clientAddress);
});

//
app.get("/create-facelist", async (req, res) => {
  try {
    const instance = { ...base_instance_options };
    const response = await instance.put(
      `/facelists/${facelist_id}`,
      {
        name: "Classroom 3-E Facelist"
      }
    );

    console.log("created facelist: ", response.data);
    res.send('ok');

  } catch (err) {
    console.log("error creating facelist: ", err);
    res.send('not ok');
  }
});


app.get("/add-face", async (req, res) => {
  try {
    const instance_options = { ...base_instance_options };
    instance_options.headers['Content-Type'] = 'application/octet-stream';
    const instance = axios.create(instance_options);

    const file_contents = fs.readFileSync('./path/to/selfie.png');

    const response = await instance.post(
      `/facelists/${facelist_id}/persistedFaces`,
      file_contents
    );

    console.log('added face: ', response.data);
    res.send('ok');

  } catch (err) {
    console.log("err: ", err);
    res.send('not ok');
  }
});

const PORT = 5000;
app.listen(PORT, (err) => {
  if (err) {
    console.error(err);
  } else {
    console.log(`Running on ports ${PORT}`);
  }
});