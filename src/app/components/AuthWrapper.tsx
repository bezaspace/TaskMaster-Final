"use client";

import { useAuth } from "../contexts/AuthContext";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import NavBar from "../NavBar";

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // If not loading and not authenticated and not on login page, redirect to login
    if (!isLoading && !isAuthenticated && pathname !== '/login') {
      console.log('🔄 Redirecting to login from AuthWrapper');
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, pathname, router]);

  // Show loading state
  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Inter, sans-serif'
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  // If on login page, show login page without navbar
  if (pathname === '/login') {
    return <>{children}</>;
  }

  // If not authenticated, don't render anything (redirect will happen)
  if (!isAuthenticated) {
    return null;
  }

  // If authenticated, show navbar and content
  return (
    <>
      <NavBar />
      {children}
    </>
  );
}