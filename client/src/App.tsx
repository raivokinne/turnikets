import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { AuthProvider } from '@/providers/AuthProvider';
import { Toaster } from 'sonner';
import { AppRouter } from './router';

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
		<AppRouter />
        <Toaster position="top-right" />
      </AuthProvider>
      {import.meta.env.VITE_NODE_ENV === 'development' && <ReactQueryDevtools />}
    </QueryClientProvider>
  );
}

export default App;
