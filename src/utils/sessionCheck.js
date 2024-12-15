"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/appwrite';

export function SessionCheck({ children }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const user = await getCurrentUser();
        if (!user || user.approvalStatus !== "approved") {
          router.push('/sign-in');
        }
      } catch (error) {
        console.error("Session check error:", error);
        router.push('/sign-in');
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, [router]);

  if (isLoading) {
    return <div>Loading...</div>; // Or a more sophisticated loading component
  }

  return children;
}

