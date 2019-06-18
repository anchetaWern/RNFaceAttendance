var bleno = require('bleno');
var dateFormat = require('dateformat');

var time_format = 'h:MM TT';

var attendees = [
  {id: 1, full_name: 'milfa', time_entered: dateFormat(new Date(1505901033110), time_format)},
  {id: 2, full_name: 'red', time_entered: dateFormat(new Date(1505901733110), time_format)},
  {id: 3, full_name: 'silver', time_entered: dateFormat(new Date(1505908733110), time_format)}
];

const BASE_UUID = '-5659-402b-aeb3-d2f7dcd1b999';
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