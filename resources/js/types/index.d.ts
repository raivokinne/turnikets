import { Config } from 'ziggy-js';

export interface User {
    id: number;
    name: string;
    email: string;
    email_verified_at?: string;
    role: string;
    avatar: string;
    created_at: string;
}

declare module '@inertiajs/react' {
  interface PageProps {
    auth: {
      user: User;
    };
  }
}

export type PageProps<
    T extends Record<string, unknown> = Record<string, unknown>,
> = T & {
    auth: {
        user: User;
    };
    ziggy: Config & { location: string };
};
