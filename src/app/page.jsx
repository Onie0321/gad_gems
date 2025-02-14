"use client";
import { Suspense, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import Header from "./homepage/header/page";
import HeroSection from "./homepage/hero-section/page";
import AboutSection from "./homepage/about-section/page";
import RecentEvents from "./homepage/event-section/page";
import NewsSection from "./homepage/news-section/page";
import FeedbackSection from "./homepage/feedback-section/page";
import FAQSection from "./homepage/faq-section/page";
import { getCurrentUser, handleAuthRedirect } from "@/lib/appwrite";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  const router = useRouter();
  const [isDataReady, setIsDataReady] = useState(false);
  const [authStatus, setAuthStatus] = useState(null);

  useEffect(() => {
    const checkAuthAndFetchData = async () => {
      try {
        // Check auth status and get redirect info
        const authResult = await handleAuthRedirect();
        setAuthStatus(authResult);

        // If authenticated, mark data as ready
        if (authResult) {
          setIsDataReady(true);
        }
      } catch (error) {
        console.error("Error checking auth status:", error);
      }
    };

    checkAuthAndFetchData();
  }, []);

  const handleExploreClick = () => {
    if (isDataReady && authStatus?.authenticated) {
      // If data is ready and user is authenticated, redirect to their dashboard
      router.push(authStatus.redirectTo);
    } else {
      // Otherwise, redirect to sign in
      router.push('/sign-in');
    }
  };

  return (
    <div className="bg-background min-h-screen">
      <main className="flex-grow">
        <Header onExploreClick={handleExploreClick} />
        <HeroSection onExploreClick={handleExploreClick} />
        <AboutSection />
        <RecentEvents />
        <NewsSection />
        <FeedbackSection />
        <FAQSection />
      </main>
      <Button onClick={handleExploreClick}>
        Explore Events
      </Button>
    </div>
  );
}
