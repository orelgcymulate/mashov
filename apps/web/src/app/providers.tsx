'use client';

import { ReactNode, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

export function Providers({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchInterval: 60_000,
            refetchOnWindowFocus: true,
            refetchOnReconnect: true,
            staleTime: 30_000,
            retry: (failureCount, error) => {
              const status = (error as { status?: number }).status;
              if (status === 401) return false;
              return failureCount < 1;
            },
          },
          mutations: {
            onError: (error) => {
              const status = (error as { status?: number }).status;
              if (status === 401) router.push('/login');
            },
          },
        },
      }),
  );
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
