import * as config from 'config';
import * as Logger from 'bunyan';

import { AntPlusController } from './lib/ant-plus';
import { HeartbeatStore } from './lib/hb-store';
import { Heartbeat } from './lib/models/heartbeat';
import { SNS } from 'aws-sdk';

const logger: Logger = Logger.createLogger({
  name: 'rtfm-msg-center',
  level: config.get('log-level') || 'info',
  serializers: Logger.stdSerializers,
});

const sns = new SNS({
  apiVersion: '2010-03-01',
  accessKeyId: config.get<string>('aws-access-key'),
  secretAccessKey: config.get<string>('aws-secret'),
  region: config.get<string>('aws-region');
});
const snsTopic:string = config.get<string>('aws-sns-topic-arn');
const reportInterval = config.get<number>('heartbeat-interval');

const antplusCtrl = new AntPlusController(logger);
const heartbeatStore = new HeartbeatStore();

antplusCtrl.on('ready', async () => {
  antplusCtrl.scan();
});

antplusCtrl.on('heartbeat', (heartbeat: Heartbeat) => {
  heartbeatStore.add(heartbeat);
});

setInterval(() => {
  const heartbeatDetails = heartbeatStore.report();
  if (Object.keys(heartbeatDetails).length > 0) {
    const base64Msg = new Buffer(JSON.stringify(heartbeatDetails))
      .toString('base64');

    logger.debug({ heartbeatDetails }, 'publishing to SNS');

    sns.publish({
      Message: base64Msg,
      TopicArn: snsTopic,
    }, (err, data) => {
      if (err) {
        logger.warn(err);
      } else {
        logger.info({data}, 'message sent');
      }
    });

    heartbeatStore.clear();
  }
}, reportInterval);

antplusCtrl.open();
