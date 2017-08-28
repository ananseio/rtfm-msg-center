import { Heartbeat, HeartbeatTimeseries } from './models/heartbeat';


export class HeartbeatStore {
  heartbeatsTs: HeartbeatTimeseries

  constructor() {
    this.heartbeatsTs = new HeartbeatTimeseries();
  }

  add(hb: Heartbeat): void {
    this.heartbeatsTs.add(hb);
  }

  report(): Heartbeat[] {
    return [...this.heartbeatsTs.heartbeat];
  }

  clear(): void {
    this.heartbeatsTs.clear();
  }
}
