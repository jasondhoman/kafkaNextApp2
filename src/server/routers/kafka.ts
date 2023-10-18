/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 *
 * This is an example router, you can delete this file and then update `../pages/api/trpc/[trpc].tsx`
 */
import { observable } from '@trpc/server/observable';
import { EventEmitter } from 'events';
import { prisma } from '../prisma';
import { z } from 'zod';
import { authedProcedure, publicProcedure, router } from '../trpc';
import { connections } from 'server/wssDevServer';

interface MyEvents {
  kafkaMessage: (msg: string) => void;
  isTypingUpdate: () => void;
}

export declare interface KafkaEventEmitter {
  on<TEv extends keyof MyEvents>(event: TEv, listener: MyEvents[TEv]): this;
  off<TEv extends keyof MyEvents>(event: TEv, listener: MyEvents[TEv]): this;
  once<TEv extends keyof MyEvents>(event: TEv, listener: MyEvents[TEv]): this;
  emit<TEv extends keyof MyEvents>(
    event: TEv,
    ...args: Parameters<MyEvents[TEv]>
  ): boolean;
}

export class KafkaEventEmitter extends EventEmitter {}

// In a real app, you'd probably use Redis or something
const ee = new KafkaEventEmitter();

// who is currently typing, key is `name`
const currentlyTyping: Record<string, { lastTyped: Date }> =
  Object.create(null);

// consume(async (msg) => {
//   console.log(msg);
//   // ee.emit('add', msg);
// });

// every 1s, clear old "isTyping"
// const interval = setInterval(() => {
//   let updated = false;
//   const now = Date.now();
//   for (const [key, value] of Object.entries(currentlyTyping)) {
//     if (now - value.lastTyped.getTime() > 3e3) {
//       delete currentlyTyping[key];
//       updated = true;
//     }
//   }
//   if (updated) {
//     ee.emit('isTypingUpdate');
//   }
// }, 3e3);

process.on('SIGTERM', () => {
  // clearInterval(interval);
});

export const kafkaRouter = router({
  consumeMessage: publicProcedure
    .input(
      z.object({
        start: z.boolean(),
      }),
    )
    .mutation(async ({ input }) => {
      if (input.start) {
        connections.add(ee);
        return true;
      }
      connections.delete(ee);
      return true;
    }),
  // messageTransmittor: publicProcedure
  //   .input(z.object({ message: z.boolean() }))
  //   .mutation(({ input }) => {
  //     ee.emit('kafkaMessage', input.message.toString());
  //   }),
  messageTransmittor: publicProcedure.subscription(() => {
    const prev: string[] | null = null;
    return observable<string>((emit) => {
      const onIsTypingUpdate = (message: string) => {
        emit.next(message);
      };
      ee.on('kafkaMessage', onIsTypingUpdate);
      return () => {
        ee.off('kafkaMessage', onIsTypingUpdate);
      };
    });
  }),
  // infinite: publicProcedure
  //   .input(
  //     z.object({
  //       cursor: z.date().nullish(),
  //       take: z.number().min(1).max(50).nullish(),
  //     }),
  //   )
  //   .query(async ({ input }) => {
  //     const take = input.take ?? 10;
  //     const cursor = input.cursor;

  //     const page = await prisma.post.findMany({
  //       orderBy: {
  //         createdAt: 'desc',
  //       },
  //       cursor: cursor ? { createdAt: cursor } : undefined,
  //       take: take + 1,
  //       skip: 0,
  //     });
  //     const items = page.reverse();
  //     let prevCursor: typeof cursor | null = null;
  //     if (items.length > take) {
  //       const prev = items.shift();
  //       // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  //       prevCursor = prev!.createdAt;
  //     }
  //     return {
  //       items,
  //       prevCursor,
  //     };
  //   }),
  // whoIsTyping: publicProcedure.subscription(() => {
  //   let prev: string[] | null = null;
  //   return observable<string[]>((emit) => {
  //     const onIsTypingUpdate = () => {
  //       const newData = Object.keys(currentlyTyping);

  //       if (!prev || prev.toString() !== newData.toString()) {
  //         emit.next(newData);
  //       }
  //       prev = newData;
  //     };
  //     ee.on('isTypingUpdate', onIsTypingUpdate);
  //     return () => {
  //       ee.off('isTypingUpdate', onIsTypingUpdate);
  //     };
  //   });
  // }),
});
