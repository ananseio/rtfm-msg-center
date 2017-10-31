import { Heartbeat, HeartbeatTimeseries } from './models/heartbeat';


export class HeartbeatStore {
  heartbeatsTs: HeartbeatTimeseries

  constructor() {
    this.heartbeatsTs = new HeartbeatTimeseries();
  }

  add(hb: Heartbeat): void {
    this.heartbeatsTs.add(hb);
  }

  report(): {
    [deviceId: string]: Heartbeat[],
  } {
    return this.heartbeatsTs.heartbeat.reduce(
      (accum, hb) => {
        const deviceId: string = String(hb.DeviceID);
        return {
          ...accum,
          [deviceId]: [
            ...(accum[deviceId] || []),
            hb
          ],
        }
      },
      {}
    )
  }

  clear(): void {
    this.heartbeatsTs.clear();
  }
}
