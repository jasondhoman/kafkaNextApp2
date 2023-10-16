import { type EachMessagePayload } from 'kafkajs';
import { Kafka } from 'kafkajs';
import { connections } from './wssDevServer';
const CLIENT_ID = 'web-client';
const BORKERS = ['127.0.0.1:9092'];
let consumerRunning = false;

const kafka: Kafka = new Kafka({
  clientId: CLIENT_ID,
  brokers: BORKERS,
  connectionTimeout: 5000,
});
const TOPIC = 'stream-events';
const samples_per_msg = 1000;
const consumer = kafka.consumer({ groupId: CLIENT_ID });

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const bufferToFloat64Array = (buffer: Buffer, decimals: number) => {
  const float64array = new Float64Array(samples_per_msg);
  for (let i = 0; i < samples_per_msg; i++) {
    float64array[i] = parseFloat(buffer.readDoubleBE(i * 8).toFixed(decimals));
  }
  return float64array;
};

export const consume = async () => {
  consumerRunning = true;
  await consumer.connect();
  await consumer.subscribe({ topic: TOPIC });
  console.log('consume', consumer);
  await consumer.run({
    // eslint-disable-next-line @typescript-eslint/require-await
    eachMessage: async ({ message }: EachMessagePayload) => {
      const value = message.value;
      if (value) {
        try {
          connections.forEach((ws) => {
            ws.send(value.toString());
          });
          // cb(value.toString());
          // await prisma.sampleData.create({
          //   data: {
          //     points: JSON.parse(value.toString()),
          //   },
          // });
        } catch (err) {
          console.error(err);
        }
      }
    },
  });
};

export const disconnect = async () => {
  await consumer.stop();
  await consumer.disconnect();
};

if (!consumerRunning) {
  consume();
}
