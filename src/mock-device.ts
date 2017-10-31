import * as config from 'config';
import * as Logger from 'bunyan';

import { AntPlusController } from './lib/ant-plus';
import { HeartbeatStore } from './lib/hb-store';
import { Heartbeat } from './lib/models/heartbeat';

import { device as IoTDevice } from 'aws-iot-device-sdk';

const logger: Logger = Logger.createLogger({
  name: 'rtfm-msg-center',
  level: config.get('log-level') || 'info',
  serializers: Logger.stdSerializers,
});

const deviceName: string = config.get<string>('name');
const nodeId: string = config.get<string>('node-id');
const reportInterval = config.get<number>('heartbeat-interval');
const device = IoTDevice({
  keyPath: config.get<string>('aws-iot-device-private-key'),
  certPath: config.get<string>('aws-iot-device-cert'),
  caPath: config.get<string>('aws-iot-root-ca'),
  clientId: `${deviceName}::${nodeId}`,
  host: config.get<string>('aws-iot-endpoint'),
});

// const antplusCtrl = new AntPlusController(logger);
const heartbeatStore = new HeartbeatStore();

// antplusCtrl.on('ready', async () => {
//   antplusCtrl.scan();
// });

// antplusCtrl.on('heartbeat', (heartbeat: Heartbeat) => {
//   heartbeatStore.add(heartbeat);
// });

// antplusCtrl.open();

export function tick() {
  const heartbeats: {
    [deviceId: string]: Heartbeat[],
  } = heartbeatStore.report();
  const timestamp_nodeId = `${Date.now()}.${nodeId}`;
  const devices = Object.keys(heartbeats);
  if (devices.length > 0) {
    for ( let deviceId of devices ) {
      const msg = {
        deviceId,
        timestamp_nodeId,
        nodeId,
        data: heartbeats[deviceId],
      };
      logger.trace({ msgToAWS: msg }, 'publishing to AWS IoT');
      device.publish('rtfm_data', JSON.stringify(msg));
    }

    heartbeatStore.clear();
  }
}

device.on('connect', () => {
  logger.info('Connected to AWS IoT Core');
  setInterval(tick, reportInterval);
});

/* ============== */

let beatcount = 1;
let previousBeat = Date.now() % 65536;
const DeviceID = 105171;
const heartbeatReading: number[] = [];

for (let i = 0; i < 10; i++) {
  heartbeatReading.push(65 + Math.floor(Math.random() * 10));
}

setInterval(() => {
  const curTime = Date.now();
  const curBeat = curTime % 65536;
  heartbeatReading.shift();
  heartbeatReading.push(65 + Math.floor(Math.random() * 10));
  const hb = {
    DeviceID,
    Timestamp: curTime,
    BeatCount: beatcount,
    PreviousBeat: previousBeat,
    BeatTime: curBeat,
    ComputedHeartRate: Math.floor(heartbeatReading.reduce((accum, hr) => accum+hr, 0) / heartbeatReading.length),
  };
  heartbeatStore.add(hb);
  beatcount += 1;
  previousBeat = curBeat;
}, 1500);
