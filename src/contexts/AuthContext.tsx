"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  ReactNode,
  useState,
} from "react";
import { UserRole } from "@prisma/client";
import { signIn, signOut, useSession } from "next-auth/react";

interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  businessId?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  login: (identifier: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isBusinessOwner: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const loading = status === "loading";
  const [ready, setReady] = useState(false);
  const user = useMemo<AuthUser | null>(() => {
    if (!session?.user?.id || !session.user.email) {
      return null;
    }
    return {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name || "",
      role: session.user.role,
      businessId: session.user.businessId || undefined,
    };
  }, [session?.user]);

  useEffect(() => {
    if (status === "loading") {
      setReady(false);
      return;
    }

    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("isAuthenticated", "true");
    } else {
      localStorage.removeItem("user");
      localStorage.setItem("isAuthenticated", "false");
    }

    setReady(true);
  }, [status, user]);

  const login = async (identifier: string, password: string) => {
    const result = await signIn("credentials", {
      identifier,
      password,
      redirect: false,
    });
    return !result?.error;
  };

  const logout = async () => {
    await signOut({ redirect: true, callbackUrl: "/" });
  };

  const value = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === "admin",
    isBusinessOwner: user?.role === "business_owner",
    loading,
  };

  if (loading || !ready) {
    return null;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
