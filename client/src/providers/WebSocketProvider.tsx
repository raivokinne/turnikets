import { useEffect } from 'react';
import Pusher from 'pusher-js';
import { toast } from 'sonner';

type Props = { children: React.ReactNode };

export function WebSocketProvider({ children }: Props) {
  useEffect(() => {
    const key = import.meta.env.VITE_PUSHER_KEY as string | undefined;
    const cluster = (import.meta.env.VITE_PUSHER_CLUSTER as string | undefined) || 'eu';

    if (!key) {
      console.warn('VITE_PUSHER_KEY is not set. Skipping WebSocket connection.');
      return;
    }

    // Initialize Pusher client
    const pusher = new Pusher(key, {
      cluster,
      forceTLS: true,
    });

    // Subscribe to general notifications channel
    const channel = pusher.subscribe('notifications');

    // Consecutive action warning
    channel.bind('consecutive-action', (data: any) => {
      const name = data?.student?.name ?? 'User';
      const action = data?.action ?? '';
      toast.warning(`${name} attempted ${action} twice in a row`, {
        description: new Date(data?.timestamp ?? Date.now()).toLocaleString(),
      });
    });

    // Optional: normal entry/exit notification
    channel.bind('entry-exit', (data: any) => {
      const name = data?.student?.name ?? 'User';
      const action = data?.action ?? '';
      toast(`${name} ${action === 'exit' ? 'exited' : 'entered'}`, {
        description: data?.description ?? new Date(data?.timestamp ?? Date.now()).toLocaleString(),
      });
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe('notifications');
      pusher.disconnect();
    };
  }, []);

  return <>{children}</>;
}
