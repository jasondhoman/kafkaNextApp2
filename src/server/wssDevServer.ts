import { disconnect } from './consumer';
import { createContext } from './context';
import { appRouter } from './routers/_app';
import { applyWSSHandler } from '@trpc/server/adapters/ws';
import ws from 'ws';
import { KafkaEventEmitter } from './routers/kafka';

const wss = new ws.Server({
  port: 3001,
});

// const kafkaWss = new ws.Server({
//   port: 3002,
//   path: '/kafka',
// });

export const connections = new Set<KafkaEventEmitter>();

const handler = applyWSSHandler({ wss, router: appRouter, createContext });

wss.on('connection', (ws) => {
  console.log(`➕➕ Connection (${wss.clients.size})`);
  ws.once('close', () => {
    console.log(`➖➖ Connection (${wss.clients.size})`);
  });
});

// kafkaWss.on('connection', (ws) => {
//   console.log(`➕➕ Connection (${wss.clients.size}) to kafka stream`);
//   connections.add(ws);
//   ws.once('close', () => {
//     console.log(`➖➖ Connection (${wss.clients.size}) from kafka stream`);
//   });
//   ws.on('kafka-message', (msg) => {
//     console.log(msg);
//   });
// });

// kafkaWss.on('close', () => {
//   console.log('kafkaWss closed');
//   disconnect();
// });

console.log('✅ WebSocket Server listening on ws://localhost:3001');

process.on('SIGTERM', () => {
  console.log('SIGTERM');
  handler.broadcastReconnectNotification();
  wss.close();
  // kafkaWss.close();
  disconnect();
});
