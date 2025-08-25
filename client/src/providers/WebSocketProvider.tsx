import { useEffect } from 'react';
import Pusher from 'pusher-js';
import { toast } from 'sonner';

type Props = { children: React.ReactNode };

export function WebSocketProvider({ children }: Props) {
    useEffect(() => {
        const appKey = import.meta.env.VITE_REVERB_APP_KEY as string | undefined;
        const host = import.meta.env.VITE_REVERB_HOST as string | undefined;
        const port = import.meta.env.VITE_REVERB_PORT as string | undefined;
        const scheme = import.meta.env.VITE_REVERB_SCHEME as string | undefined;

        if (!appKey || !host || !port) {
            console.warn('Reverb configuration is incomplete. Skipping WebSocket connection.');
            console.warn('Required: VITE_REVERB_APP_KEY, VITE_REVERB_HOST, VITE_REVERB_PORT');
            return;
        }

        // Initialize Pusher client with Reverb configuration
        const pusher = new Pusher(appKey, {
            wsHost: host,
            wsPort: parseInt(port),
            wssPort: parseInt(port),
            forceTLS: scheme === 'https',
            enabledTransports: ['ws', 'wss'],
            cluster: '', // Not needed for Reverb
        });

        // Subscribe to general notifications channel
        const channel = pusher.subscribe('notifications');

        interface ConsecutiveActionData {
            student?: {
                name: string;
            };
            action?: string;
            timestamp?: number;
        }

        channel.bind('consecutive-action', (data: ConsecutiveActionData) => {
            const name = data?.student?.name ?? 'Lietotājs';
            const action = data?.action ?? '';

            // Format timestamp in Latvian
            const timestamp = new Date(data?.timestamp ?? Date.now()).toLocaleString('lv-LV', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });

            toast.custom(
                (t) => (
                    <div className="bg-red-600/50 text-white border border-red-700/70 rounded-xl p-4 shadow-xl min-w-[400px] max-w-[500px] backdrop-blur-sm flex items-center justify-between">
                        <div className="flex flex-col flex-1">
                            <div className="text-white font-semibold mb-1">
                                {`${name} mēģināja ${action === 'exit' ? 'iziet' : 'ienākt'} divreiz pēc kārtas`}
                            </div>
                            <div className="text-white text-sm opacity-90">
                                {timestamp}
                            </div>
                        </div>
                        <button
                            onClick={() => toast.dismiss(t)}
                            className="ml-4 pb-1 bg-transparent border border-white/30 text-white font-bold text-lg cursor-pointer w-8 h-8 rounded-md opacity-80 transition-all duration-200 hover:opacity-100 hover:bg-white/10 hover:border-white/50 hover:scale-105 active:scale-95 flex-shrink-0 flex items-center justify-center"
                        >
                            ×
                        </button>
                    </div>
                ),
                {
                    duration: Infinity,
                    position: 'top-center',
                }
            );
        });

        interface EntryExitData {
            student?: {
                name: string;
            };
            action?: string;
            description?: string;
            timestamp?: number;
        }

        channel.bind('entry-exit', (data: EntryExitData) => {
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