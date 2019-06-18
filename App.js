import React, { Component } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  PermissionsAndroid,
  NativeEventEmitter,
  NativeModules,
  Button,
  FlatList,
  Alert,
  ActivityIndicator,
  TouchableOpacity
} from 'react-native';

import RNExitApp from 'react-native-exit-app';

import BleManager from 'react-native-ble-manager';
const BleManagerModule = NativeModules.BleManager;
const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);

import { stringToBytes } from 'convert-string';
import RandomId from 'random-id';
import bytesCounter from 'bytes-counter';
import prompt from 'react-native-prompt-android';

import { RNCamera } from 'react-native-camera';
import base64ToArrayBuffer from 'base64-arraybuffer';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import axios from 'axios';

const key = 'YOUR COGNITIVE SERVICES API KEY';
const loc = 'southeastasia.api.cognitive.microsoft.com'; // replace with the server nearest to you (https://westus.dev.cognitive.microsoft.com/docs/services/563879b61984550e40cbbe8d/operations/563879b61984550f30395237)

const base_instance_options = {
  baseURL: `https://${loc}/face/v1.0`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Ocp-Apim-Subscription-Key': key
  }
};

export default class App extends Component {

  state = {
    is_scanning: false,
    peripherals: null,
    connected_peripheral: null,
    user_id: '',
    fullname: '',
    show_camera: false,
    is_loading: false
  }

  constructor(props) {
    super(props);

    this.peripherals = [];

    BleManager.enableBluetooth()
      .then(() => {
        console.log('Bluetooth is already enabled');
      })
      .catch((error) => {
        Alert.alert('Enable bluetooth', 'You need to enable bluetooth to use this app.');
      });

    BleManager.start({showAlert: false})
      .then(() => {
        console.log('Module initialized');
      });

    if (Platform.OS === 'android' && Platform.Version >= 23) {
      PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION).then((result) => {
        if(!result){
          PermissionsAndroid.requestPermission(PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION).then((result) => {
            if(!result){
              Alert.alert('You need to give access to coarse location to use this app.');
            }
          });
        }
      });
    }
  }


  componentDidMount() {
    bleManagerEmitter.addListener('BleManagerDiscoverPeripheral', (peripheral) => {
      var peripherals = this.peripherals;
      var el = peripherals.filter((el) => {
        return el.id === peripheral.id;
      });

      if (!el.length) {
        peripherals.push({
          id: peripheral.id,
          name: peripheral.name
        });

        this.peripherals = peripherals;
      }
    });

    bleManagerEmitter.addListener(
      'BleManagerStopScan',
      () => {
        console.log('scan stopped');
        if (this.peripherals.length == 0) {
          Alert.alert('Nothing found', "Sorry, no peripherals were found");
        }
        this.setState({
          is_scanning: false,
          peripherals: this.peripherals
        });
      }
    );
  }


  startScan = () => {
    this.peripherals = [];

    this.setState({
      is_scanning: true
    });

    BleManager.scan([], 3, true)
    .then(() => {
      console.log('scan started');
    });
  }


  connect = (peripheral_id) => {
    BleManager.connect(peripheral_id)
      .then(() => {
        this.setState({
          connected_peripheral: peripheral_id
        });

        prompt(
          'Enter full name',
          'Enter your full name to attend',
          [
            {
              text: 'Cancel',
              onPress: () => {
                console.log('Cancel Pressed')
              }
            },
            {
              text: 'OK',
              onPress: (fullname) => {
                this.enterRoom(fullname);
              }
            }
          ],
          {
            placeholder: 'John Wick'
          }
        );

        BleManager.retrieveServices(peripheral_id)
          .then((peripheralInfo) => {
            console.log('Peripheral info:', peripheralInfo);
          }
        );
      })
      .catch((error) => {
        Alert.alert("Err..", 'Something went wrong while trying to connect.');
      });
  }


  enterRoom = (value) => {
    this.setState({
      user_id: RandomId(15),
      fullname: value,
      show_camera: true
    });
  }


  attend = () => {
    const { user_id, fullname, connected_peripheral } = this.state;
    const me = { user_id, fullname };

    let str = JSON.stringify(me);
    let bytes = bytesCounter.count(str);
    let data = stringToBytes(str);

    const BASE_UUID = '-5659-402b-aeb3-d2f7dcd1b999';
    const PERIPHERAL_ID = '0000';
    const PRIMARY_SERVICE_ID = '0100';

    let primary_service_uuid = PERIPHERAL_ID + PRIMARY_SERVICE_ID + BASE_UUID;
    let ps_characteristic_uuid = PERIPHERAL_ID + '0300' + BASE_UUID;

    BleManager.write(connected_peripheral, primary_service_uuid, ps_characteristic_uuid, data, bytes)
      .then(() => {
        BleManager.disconnect(connected_peripheral)
          .then(() => {
            Alert.alert('Attended', 'You have successfully attended the event. The app will now close.');

            setTimeout(() => {
              RNExitApp.exitApp();
            }, 3000);
          })
          .catch((error) => {
            Alert.alert('Error disconnecting', "You have successfully attended the event but there's a problem disconnecting to the peripheral, please disable bluetooth to force disconnection.");
          });

      })
      .catch((error) => {
        Alert.alert('Error attending', "Something went wrong while trying to attend. Please try again.");
      });
  }


  renderItem = ({item}) => {
    return (
      <View style={styles.list_item} key={item.id}>
        <Text style={styles.list_item_text}>{item.name}</Text>
        <Button
          title="Connect"
          color="#1491ee"
          style={styles.list_item_button}
          onPress={() => {
            this.connect(item.id)
          }} />
      </View>
    );
  }
  //


  render() {
    const { connected_peripheral, is_scanning, peripherals, show_camera, is_loading } = this.state;

    return (
      <SafeAreaView style={{flex: 1}}>
        <View style={styles.container}>
          {
            !show_camera &&
            <View style={styles.header}>
              <View style={styles.app_title}>
                <Text style={styles.header_text}>BLE Face Attendance</Text>
              </View>
              <View style={styles.header_button_container}>
                {
                  !connected_peripheral &&
                  <Button
                    title="Scan"
                    color="#1491ee"
                    onPress={this.startScan} />
                }
              </View>
            </View>
          }

          <View style={styles.body}>
            {
              !show_camera && is_scanning &&
              <ActivityIndicator size="large" color="#0000ff" />
            }

            {
              show_camera &&
              <View style={styles.camera_container}>
                {
                  is_loading &&
                  <ActivityIndicator size="large" color="#0000ff" />
                }

                {
                  !is_loading &&
                  <View style={{flex: 1}}>
                    <RNCamera
                      ref={ref => {
                        this.camera = ref;
                      }}
                      style={styles.preview}
                      type={RNCamera.Constants.Type.front}
                      flashMode={RNCamera.Constants.FlashMode.on}
                      captureAudio={false}
                    />

                    <View style={styles.camer_button_container}>
                      <TouchableOpacity onPress={this.takePicture} style={styles.capture}>
                        <MaterialIcons name="camera" size={50} color="#e8e827" />
                      </TouchableOpacity>
                    </View>
                  </View>
                }

              </View>
            }

            {
              !connected_peripheral && !show_camera &&
              <FlatList
                data={peripherals}
                keyExtractor={(item) => item.id.toString()}
                renderItem={this.renderItem}
              />
            }

          </View>
        </View>
      </SafeAreaView>
    );
  }
  //

  takePicture = async() => {
    if (this.camera) {
      const data = await this.camera.takePictureAsync({ quality: 0.25, base64: true });
      const selfie_ab = base64ToArrayBuffer.decode(data.base64);

      this.setState({
        is_loading: true
      });

      try {
        const facedetect_instance_options = { ...base_instance_options };
        facedetect_instance_options.headers['Content-Type'] = 'application/octet-stream';
        const facedetect_instance = axios.create(facedetect_instance_options);

        const facedetect_res = await facedetect_instance.post(
          `/detect?returnFaceId=true&detectionModel=detection_02`,
          selfie_ab
        );

        console.log("face detect res: ", facedetect_res.data);

        if (facedetect_res.data.length) {

          const findsimilars_instance_options = { ...base_instance_options };
          findsimilars_instance_options.headers['Content-Type'] = 'application/json';
          const findsimilars_instance = axios.create(findsimilars_instance_options);
          const findsimilars_res = await findsimilars_instance.post(
            `/findsimilars`,
            {
              faceId: facedetect_res.data[0].faceId,
              faceListId: 'wern-faces-01',
              maxNumOfCandidatesReturned: 2,
              mode: 'matchPerson'
            }
          );

          console.log("find similars res: ", findsimilars_res.data);

          this.setState({
            is_loading: false
          });

          if (findsimilars_res.data.length) {

            Alert.alert("Found match!", "You've successfully attended!");
            this.attend();

          } else {
            Alert.alert("No match found", "Sorry, you are not registered");
          }

        } else {
          Alert.alert("error", "Cannot find any face. Please make sure there is sufficient light when taking a selfie");
        }

      } catch (err) {
        console.log("err: ", err);
        this.setState({
          is_loading: false
        });
      }
    }
  }

}
//

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignSelf: 'stretch',
    backgroundColor: '#F5FCFF',
  },
  header: {
    flex: 1,
    backgroundColor: '#3B3738',
    flexDirection: 'row',
    paddingTop: 10,
    paddingBottom: 10,
  },
  app_title: {
    flex: 7,
    margin: 10
  },
  header_button_container: {
    flex: 2,
    justifyContent: 'center',
    paddingRight: 5
  },
  header_text: {
    fontSize: 15,
    color: '#FFF',
    fontWeight: 'bold'
  },
  body: {
    flex: 19
  },

  list_item: {
    paddingLeft: 10,
    paddingRight: 10,
    paddingTop: 15,
    paddingBottom: 15,
    marginBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    flex: 1,
    flexDirection: 'row'
  },
  list_item_text: {
    flex: 8,
    color: '#575757',
    fontSize: 18
  },
  list_item_button: {
    flex: 2
  },

  camera_container: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: 'black'
  },
  preview: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  camer_button_container: {
    flex: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    backgroundColor: '#333'
  }
});