"use client";
import { Toaster } from "@/components/ui/toaster";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AuthLayout({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      if (user.role === "admin") {
        router.push("/admin");
      } else if (user.role === "user") {
        router.push("/officer");
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen">
      <main>{children}</main>
      <Toaster />
    </div>
  );
}
