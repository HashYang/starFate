"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import Sidebar from "./sidebar";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { loading, token } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === "/login";

  useEffect(() => {
    if (!loading && !token && !isLoginPage) {
      router.push("/login");
    }
  }, [loading, token, isLoginPage, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-400 text-sm">加载中...</div>
      </div>
    );
  }

  if (!token && !isLoginPage) {
    return null;
  }

  if (isLoginPage || !token) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="pl-56">
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
