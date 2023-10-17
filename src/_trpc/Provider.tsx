'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import {
  createWSClient,
  httpBatchLink,
  loggerLink,
  wsLink,
} from '@trpc/client';
import { useState } from 'react';
import { type AppRouter } from 'server/routers/_app';
import superjson from 'superjson';
import { trpc } from '@/client';

function getEndingLink() {
  if (typeof window === 'undefined') {
    return httpBatchLink({
      url: `${process.env.APP_URL}/api/trpc`,
      headers() {
        return {};
      },
    });
  }
  const client = createWSClient({
    url: process.env.WS_URL || 'ws://localhost:3001',
  });
  return wsLink<AppRouter>({
    client,
  });
}

export const TrpcProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { staleTime: 5000 } },
      }),
  );

  // const url = process.env.APP_URL
  //   ? `https://${process.env.APP_URL}`
  //   : 'http://localhost:3000/api/trpc/';

  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        loggerLink({
          enabled: () => true,
        }),

        getEndingLink(),
      ],
      transformer: superjson,
    }),
  );
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
        <ReactQueryDevtools />
      </QueryClientProvider>
    </trpc.Provider>
  );
};
