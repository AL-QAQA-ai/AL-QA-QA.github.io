declare module "next-auth/react" {
  import type { Session } from "next-auth";
  import type { BuiltInProviderType, RedirectableProviderType } from "next-auth/providers";

  export interface SignInOptions {
    provider?: BuiltInProviderType | RedirectableProviderType;
    callbackUrl?: string;
    redirect?: boolean;
    credentials?: Record<string, string>;
    csrfToken?: string;
    action?: string;
    json?: boolean;
  }

  export interface SignInResponse {
    error?: string;
    status?: number;
    ok?: boolean;
    url?: string;
  }

  export function signIn(
    provider?: BuiltInProviderType | RedirectableProviderType,
    options?: SignInOptions
  ): Promise<SignInResponse>;
  export function signIn(options: SignInOptions): Promise<SignInResponse>;

  export function signOut(options?: {
    callbackUrl?: string;
    redirect?: boolean;
  }): Promise<void>;

  export function useSession(): {
    data: Session | null;
    status: "loading" | "authenticated" | "unauthenticated";
  };

  export function SessionProvider(props: {
    children: React.ReactNode;
    session?: Session | null;
    baseUrl?: string;
    basePath?: string;
    refetchInterval?: number;
    refetchWhenOffline?: boolean;
  }): JSX.Element;
}

declare module "next-auth" {
  export interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}
