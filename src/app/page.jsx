"use client";
import { Suspense, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import GADConnectSimpleLoader from "@/components/loading/simpleLoading";
import Header from "./homepage/header/page";
import HeroSection from "./homepage/hero-section/page";
import AboutSection from "./homepage/about-section/page";
import RecentEvents from "./homepage/event-section/page";
import NewsSection from "./homepage/news-section/page";
import FeedbackSection from "./homepage/feedback-section/page";
import FAQSection from "./homepage/faq-section/page";
import { getCurrentUser } from "@/lib/appwrite";

export default function LandingPage() {
  const router = useRouter();
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      try {
        // Check localStorage first
        const wasLoggedOut = localStorage.getItem('wasLoggedOut') === 'true';
        if (wasLoggedOut) {
          if (mounted) setIsCheckingSession(false);
          return;
        }

        const user = await getCurrentUser();
        if (user && user.approvalStatus === 'approved' && mounted) {
          localStorage.setItem('userRole', user.role);
          const redirectPath = user.role === 'admin' ? '/admin' : '/officer';
          router.replace(redirectPath);
        }
      } catch (error) {
        console.error("Error checking session:", error);
      } finally {
        if (mounted) setIsCheckingSession(false);
      }
    };
    
    checkSession();

    // Cleanup function
    return () => {
      mounted = false;
    };
  }, []);

  const handleExploreEvents = async () => {
    try {
      setIsCheckingSession(true);
      const user = await getCurrentUser();
      if (user && user.approvalStatus === 'approved') {
        const redirectPath = user.role === 'admin' ? '/admin' : '/officer';
        router.replace(redirectPath);
      } else {
        router.replace('/sign-in');
      }
    } catch (error) {
      console.error("Error handling explore events:", error);
      router.replace('/sign-in');
    } finally {
      setIsCheckingSession(false);
    }
  };

  // Show loading state while checking session
  if (isCheckingSession) {
    return <GADConnectSimpleLoader />;
  }

  return (
    <div className="bg-background min-h-screen">
      <main className="flex-grow">
        <Header onExploreClick={handleExploreEvents} />
        <Suspense fallback={<GADConnectSimpleLoader />}>
          <HeroSection onExploreClick={handleExploreEvents} />
          <AboutSection />
          <RecentEvents />
          <NewsSection />
          <FeedbackSection />
          <FAQSection />
        </Suspense>
      </main>
    </div>
  );
}
