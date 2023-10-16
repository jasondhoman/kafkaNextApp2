/**
 * Instantiates a single instance PrismaClient and save it on the global object.
 */
import { Kafka } from 'kafkajs';

const kafkaGlobal = global as typeof global & {
  kafka?: Kafka;
  subscribers?: string[];
};
const CLIENT_ID = 'consumer-client';
const BORKERS = ['127.0.0.1:9092'];

export const kafka: Kafka =
  kafkaGlobal.kafka ||
  new Kafka({
    clientId: CLIENT_ID,
    brokers: BORKERS,
    connectionTimeout: 5000,
  });

if (process.env.NODE_ENV !== 'production') {
  kafkaGlobal.kafka = kafka;
}
