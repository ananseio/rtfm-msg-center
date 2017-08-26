import { Heartbeat, HeartbeatTimeseries } from './models/heartbeat';


export class HeartbeatStore {
  heartbeats: { [DeviceId: number]: HeartbeatTimeseries }

  constructor() {
    this.heartbeats = {};
  }

  add(hb: Heartbeat) {
    if (!this.heartbeats[hb.DeviceID]) {
      this.heartbeats[hb.DeviceID] = new HeartbeatTimeseries();
    }

    this.heartbeats[hb.DeviceID].add(hb);
  }

  report() {
    return Object.keys(this.heartbeats)
      .reduce((toReport, deviceId) => Object.assign(toReport, {
        [deviceId]: this.heartbeats[deviceId].heartbeat,
      }), {});
  }

  clear() {
    Object.keys(this.heartbeats).forEach(deviceId => this.heartbeats[deviceId].clear());
    this.heartbeats = {};
  }
}
