"use client";
import HeroSection from "./homepage/hero-section/page";
import AboutSection from "./homepage/about-section/page";
import Events from "./homepage/event-section/page";
import NewsSection from "./homepage/news-section/page";
import ArchivedContentSection from "./homepage/archieved-content-section/page";
import FeedbackSection from "./homepage/feedback-section/page";
import FAQSection from "./homepage/faq-section/page";
import Header from "./homepage/header/page";
import Footer from "./homepage/footer/page";


export default function EnhancedGadLandingPage() {
  return (
    <div>
      <main className="flex-grow">
        <Header />
        <HeroSection />
        <AboutSection />
        <Events />
        <NewsSection />
        <ArchivedContentSection />
        <FeedbackSection />
        <FAQSection />
        <Footer/>
      </main>
    </div>
  );
}
