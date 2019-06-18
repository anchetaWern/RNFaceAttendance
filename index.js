/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';

import { YellowBox } from 'react-native';
YellowBox.ignoreWarnings(['Setting a timer']);

AppRegistry.registerComponent(appName, () => App);
