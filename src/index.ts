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

const antplusCtrl = new AntPlusController(logger);
const heartbeatStore = new HeartbeatStore();
const customerId = config.get<string>('customer-id');
const mqttTopic = `rtfm/${customerId}`;

antplusCtrl.on('ready', async () => {
  antplusCtrl.scan();
});

antplusCtrl.on('heartbeat', (heartbeat: Heartbeat) => {
  heartbeatStore.add(heartbeat);
});

antplusCtrl.open();

export function processHeartbeatData(deviceId: string, heartbeats: Heartbeat[]) {
  const timestamp_nodeId = `${Date.now()}.${nodeId}`;
  try {
    const msg = {
      deviceId,
      timestamp_nodeId,
      nodeId,
      data: heartbeats,
    };
    logger.trace({ mqttTopic, msgToAWS: msg }, 'publishing to AWS IoT');
    device.publish(mqttTopic, JSON.stringify(msg));
  } catch (err) {
    console.error(err);
  }
}

export function tick() {
  const heartbeats: {
    [deviceId: string]: Heartbeat[],
  } = heartbeatStore.report();
  const devices = Object.keys(heartbeats);
  if (devices.length > 0) {
    devices.forEach((deviceId) => processHeartbeatData(
      deviceId,
      heartbeats[deviceId]
    ));
    heartbeatStore.clear();
  }
}

device.on('connect', () => {
  logger.info('Connected to AWS IoT Core');
  setInterval(tick, reportInterval);
});
