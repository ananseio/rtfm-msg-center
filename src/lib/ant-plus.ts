import * as Ant from 'ant-plus';
import * as Logger from 'bunyan';
import * as EventEmitter from 'events';

import { Heartbeat } from './models/heartbeat';

export class AntPlusController extends EventEmitter {
  readonly stick;
  readonly scanner;
  readonly sensors = {};

  constructor(private log: Logger, private setupTimeout: number = 5000) {
    super();
    this.stick = new Ant.GarminStick2;
    this.scanner = new Ant.HeartRateScanner(this.stick);

    this.scanner.on('hbdata', this.heartbeatData());
    this.stick.on('startup', this.startup());
    this.stick.on('shutdown', this.shutdown());
  }

  scannerAttached() {
    return () => {
      this.log.info('scanner attached');
    }
  }

  scannerDetached() {
    return () => {
      this.log.info('scanner detached');
    }
  }

  heartbeatData() {
    return (data: Heartbeat) => {
      if (data.DeviceID !== 0) { // ignoring data without a proper device ID
        const timestamp: number = Date.now();
        // this.log.debug({data}, 'heartbeat received');
        this.emit('heartbeat', Object.assign({}, data, {
          Timestamp: timestamp,
        }));
      }
    };
  }

  startup() {
    return () => {
      this.log.info({
        maxChannels: this.stick.maxChannels,
      }, 'stick startup');
      this.emit('ready');
    }
  }

  shutdown() {
    return () => {
      this.log.info('stick shutdown');
      this.emit('closed');
    }
  }

  spawnSensor() {
    return new Promise<{deviceId: string, sensor: Ant.HeartRateSensor}>(
      (resolve, reject) => {
        try {
          const broadcastSensor = new Ant.HeartRateSensor(this.stick);
          const realSensor = new Ant.HeartRateSensor(this.stick);
          const setupTimeout = setTimeout(() => {
            broadcastSensor.detach();
            reject(new Error('attach timeout'));
          }, this.setupTimeout);
          let deviceIdFound: boolean = false;

          realSensor.on('hbdata', this.heartbeatData());

          broadcastSensor.on('hbdata', (data) => {
            if (deviceIdFound || data.DeviceID === 0) {
              this.log.info('waiting for deviceId');
            } else {
              this.log.info(data, 'deviceId received, detaching');
              deviceIdFound = true;
              broadcastSensor.once('detached', () => {
                realSensor.attach(0, data.DeviceID);
                resolve({deviceId: data.DeviceID, sensor: realSensor});
              });
              broadcastSensor.detach(0, 0);
            }
          });

          broadcastSensor.attach(0, 0);
        } catch (err) {
          reject(err);
        }
      }
    );
  }

  async addSensor() {
    this.log.info('adding sensor');
    const { deviceId, sensor } = await this.spawnSensor();
    this.sensors[deviceId] = sensor;

    return deviceId;
  }

  scan() {
    this.scanner.scan();
  }

  open() {
    if (!this.stick.open()) {
      this.log.error('stick not found');
    }
  }

  close() {
    this.stick.close();
  }
}
