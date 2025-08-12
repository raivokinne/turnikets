import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { AuthProvider } from '@/providers/AuthProvider';
import { Toaster } from 'sonner';
import { AppRouter } from './router';
import { WebSocketProvider } from '@/providers/WebSocketProvider';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <WebSocketProvider>
          <AppRouter />
          <Toaster position="top-right" />
        </WebSocketProvider>
      </AuthProvider>
      {import.meta.env.VITE_NODE_ENV === 'development' && <ReactQueryDevtools />}
    </QueryClientProvider>
  );
}

export default App;
