"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import Particles from "react-tsparticles";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  FaFacebook,
  FaTwitter,
  FaInstagram,
  FaLinkedin,
  FaYoutube,
} from "react-icons/fa";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Calendar,
  Search,
  Menu,
  FileText,
  Phone,
  Sun,
  Moon,
  Bell,
  LogIn,
  LogOut,
  User,
  Settings,
  HelpCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const translations = {
  en: {
    search: "Search for events, news, resources...",
    language: "Language",
    notifications: "Notifications",
    signIn: "Sign In",
    signOut: "Sign Out",
    home: "Home",
    about: "About",
    events: "Events",
    resources: "Resources",
    contact: "Contact",
    heroTitle: "Welcome to our platform",
    heroSubtitle:
      "Empowering communities through inclusive and data-driven gender and development programs.",
    learnMore: "Learn More",
    getStarted: "Get Started",
    quickAccess: "Quick Access",
    upcomingEvents: "Upcoming Events",
    testimonials: "Testimonials",
    latestNews: "Latest News",
    faq: "Frequently Asked Questions",
    contactUs: "Contact Us",
    subscribe: "Subscribe",
    privacyPolicy: "Privacy Policy",
    termsOfService: "Terms of Service",
    registerNow: "Register Now",
    readMore: "Read More",
    submitForReview: "Submit for Review",
    sendMessage: "Send Message",
    yourName: "Your Name",
    yourEmail: "Your Email",
    subject: "Subject",
    yourMessage: "Your Message",
    preferences: "Preferences",
    fontSizeSmaller: "A-",
    fontSizeLarger: "A+",
  },
  fil: {
    search: "Maghanap ng mga kaganapan, balita, mapagkukunan...",
    language: "Wika",
    notifications: "Mga Abiso",
    signIn: "Mag-sign In",
    signOut: "Mag-sign Out",
    home: "Tahanan",
    about: "Tungkol Sa",
    events: "Mga Kaganapan",
    resources: "Mga Mapagkukunan",
    contact: "Makipag-ugnayan",
    heroTitle: "Maligayang pagdating sa aming platform",
    heroSubtitle:
      "Pagpapalakas ng mga komunidad sa pamamagitan ng inklusibo at data-driven na mga programa sa kasarian at pag-unlad.",
    learnMore: "Alamin Pa",
    getStarted: "Magsimula",
    quickAccess: "Mabilis na Access",
    upcomingEvents: "Mga Darating na Kaganapan",
    testimonials: "Mga Patotoo",
    latestNews: "Pinakabagong Balita",
    faq: "Mga Madalas Itanong",
    contactUs: "Makipag-ugnayan Sa Amin",
    subscribe: "Mag-subscribe",
    privacyPolicy: "Patakaran sa Privacy",
    termsOfService: "Mga Tuntunin ng Serbisyo",
    registerNow: "Magparehistro Ngayon",
    readMore: "Basahin Pa",
    submitForReview: "Isumite para sa Pagsusuri",
    sendMessage: "Magpadala ng Mensahe",
    yourName: "Iyong Pangalan",
    yourEmail: "Iyong Email",
    subject: "Paksa",
    yourMessage: "Iyong Mensahe",
    preferences: "Mga Kagustuhan",
    fontSizeSmaller: "A-",
    fontSizeLarger: "A+",
  },
};

export default function EnhancedGadLandingPage() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [fontSize, setFontSize] = useState(16);
  const [showNewsletter, setShowNewsletter] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notifications, setNotifications] = useState([
    { id: 1, message: "New event: Gender Equality Workshop next week" },
    { id: 2, message: "Your event registration has been confirmed" },
  ]);
  const [language, setLanguage] = useState("en");
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSignInPopup, setShowSignInPopup] = useState(false);
  const [showLearnMorePopup, setShowLearnMorePopup] = useState(false);
  const [showEventPopup, setShowEventPopup] = useState(false);
  const [showResourcesPopup, setShowResourcesPopup] = useState(false);
  const [showContactPopup, setShowContactPopup] = useState(false);

  const t = translations[language];

  useEffect(() => {
    const timer = setTimeout(() => setShowNewsletter(true), 5000);
    return () => clearTimeout(timer);
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle("dark");
  };

  const adjustFontSize = (increment) => {
    setFontSize((prevSize) => Math.max(12, Math.min(24, prevSize + increment)));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    toast.success(`Search completed for: ${searchQuery}`);
  };

  const handleSearchInputChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    const suggestions = [
      "Gender Equality Workshop",
      "Women's Rights Seminar",
      "LGBTQ+ Support Group",
    ].filter((item) => item.toLowerCase().includes(query.toLowerCase()));
    setSearchSuggestions(suggestions);
  };

  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage);
    toast.info(
      `Language changed to ${newLanguage === "en" ? "English" : "Filipino"}`
    );
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setIsLoggedIn(true);
    setShowSignInPopup(false);
    toast.success("Successfully logged in!");
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    toast.success("Successfully logged out!");
  };

  return (
    <div
      className={`flex flex-col min-h-screen ${isDarkMode ? "dark" : ""}`}
      style={{ fontSize: `${fontSize}px` }}
    >
      <Header
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
        adjustFontSize={adjustFontSize}
        handleSearch={handleSearch}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        handleSearchInputChange={handleSearchInputChange}
        searchSuggestions={searchSuggestions}
        isLoggedIn={isLoggedIn}
        setShowSignInPopup={setShowSignInPopup}
        handleLogout={handleLogout}
        notifications={notifications}
        language={language}
        handleLanguageChange={handleLanguageChange}
        t={t}
      />

      <main className="flex-grow">
        <HeroSection t={t} setShowLearnMorePopup={setShowLearnMorePopup} />
        <QuickAccessSection
          t={t}
          setShowEventPopup={setShowEventPopup}
          setShowResourcesPopup={setShowResourcesPopup}
          setShowContactPopup={setShowContactPopup}
        />
        <AboutSection t={t} />
        <EventsSection t={t} />
        <TestimonialsSection t={t} />
        <NewsSection t={t} />
        <FAQSection t={t} />
        <ContactSection t={t} />
      </main>

      <SignInPopup
        show={showSignInPopup}
        onClose={() => setShowSignInPopup(false)}
        handleSignIn={handleLogin}
        t={t}
      />
      <LearnMorePopup
        show={showLearnMorePopup}
        onClose={() => setShowLearnMorePopup(false)}
        t={t}
      />
      <EventPopup
        show={showEventPopup}
        onClose={() => setShowEventPopup(false)}
        t={t}
      />
      <ResourcesPopup
        show={showResourcesPopup}
        onClose={() => setShowResourcesPopup(false)}
        t={t}
      />
      <ContactPopup
        show={showContactPopup}
        onClose={() => setShowContactPopup(false)}
        t={t}
      />
      <ToastContainer position="bottom-right" />
      <Footer t={t} />
    </div>
  );
}

function Header({
  isDarkMode,
  toggleDarkMode,
  adjustFontSize,
  handleSearch,
  searchQuery,
  setSearchQuery,
  handleSearchInputChange,
  searchSuggestions,
  isLoggedIn,
  setShowSignInPopup,
  handleLogout,
  notifications,
  language,
  handleLanguageChange,
  t,
}) {
  return (
    <header className="bg-gradient-to-r from-blue-300 via-purple-400 to-pink-500 dark:bg-gradient-to-r dark:from-gray-700 dark:via-gray-800 dark:to-gray-900 shadow-lg z-50">
      <nav className="container mx-auto px-6 py-4 flex items-center justify-between flex-wrap">
        <Link href="/" className="flex items-center space-x-2">
          {/* Logo */}
          <Image
            src="/logo/gad.jpg"
            alt="GAD Office"
            width={40}
            height={40}
            className="rounded-lg shadow-xl transition-all transform hover:scale-110"
          />
          <span className="font-semibold text-2xl text-white hover:text-gray-200 dark:text-white">
            GAD Office
          </span>
        </Link>

        <form
          onSubmit={handleSearch}
          className="flex-1 max-w-md mx-4 my-2 w-full md:w-auto relative"
        >
          <div className="relative flex items-center border-2 border-white dark:border-gray-600 rounded-full overflow-hidden transition-all hover:border-pink-300">
            <Input
              type="search"
              placeholder={t.search}
              value={searchQuery}
              onChange={handleSearchInputChange}
              className="w-full py-2 px-4 text-gray-900 dark:text-white bg-transparent focus:outline-none placeholder-gray-400"
            />
            <Button
              type="submit"
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
            >
              <Search className="h-5 w-5 text-gray-500 dark:text-white" />
              <span className="sr-only">{t.search}</span>
            </Button>
          </div>
          {searchSuggestions.length > 0 && (
            <ul className="absolute z-10 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md mt-1 max-h-60 overflow-auto shadow-lg transition-all">
              {searchSuggestions.map((suggestion, index) => (
                <li
                  key={index}
                  className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-all duration-300"
                  onClick={() => {
                    setSearchQuery(suggestion);
                    handleSearch({ preventDefault: () => {} });
                  }}
                >
                  {suggestion}
                </li>
              ))}
            </ul>
          )}
        </form>

        <div className="flex items-center space-x-6 mt-2 md:mt-0">
          <Select
            value={language}
            onValueChange={handleLanguageChange}
            className="w-24 bg-transparent border-2 border-white rounded-full transition-all hover:border-pink-300"
          >
            <SelectTrigger className="rounded-full">
              <SelectValue placeholder={t.language} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="fil">Filipino</SelectItem>
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative transition-all hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full"
              >
                <Bell className="h-5 w-5 text-gray-500 dark:text-white" />
                {notifications.length > 0 && (
                  <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full" />
                )}
                <span className="sr-only">{t.notifications}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-2 p-3">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {t.notifications}
                </h3>
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="text-sm p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                  >
                    {notification.message}
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          <Button variant="ghost" size="icon" onClick={toggleDarkMode}>
            {isDarkMode ? (
              <Sun className="h-5 w-5 text-gray-500 dark:text-white" />
            ) : (
              <Moon className="h-5 w-5 text-gray-500 dark:text-white" />
            )}
            <span className="sr-only">Toggle dark mode</span>
          </Button>

          {isLoggedIn ? (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Avatar>
                    <AvatarImage src="/placeholder.svg" alt="User" />
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                  <ChevronDown className="h-4 w-4 text-gray-500 dark:text-white ml-2" />
                  <span className="sr-only">User menu</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 bg-white dark:bg-gray-800 shadow-lg">
                <div className="space-y-2 p-3">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-gray-900 dark:text-white"
                    asChild
                  >
                    <Link
                      href="/profile"
                      className="flex items-center space-x-2"
                    >
                      <User className="h-4 w-4 text-gray-500 dark:text-white" />
                      <span>{t.profile}</span>
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-gray-900 dark:text-white"
                    asChild
                  >
                    <Link
                      href="/settings"
                      className="flex items-center space-x-2"
                    >
                      <Settings className="h-4 w-4 text-gray-500 dark:text-white" />
                      <span>{t.settings}</span>
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-gray-900 dark:text-white"
                    asChild
                  >
                    <Link href="/help" className="flex items-center space-x-2">
                      <HelpCircle className="h-4 w-4 text-gray-500 dark:text-white" />
                      <span>{t.help}</span>
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={handleLogout}
                    className="w-full justify-start text-gray-900 dark:text-white"
                  >
                    <LogOut className="h-4 w-4 text-gray-500 dark:text-white" />
                    {t.signOut}
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSignInPopup(true)}
              className="border-gray-300 text-gray-900 dark:text-white hover:border-gray-500 dark:hover:border-gray-400 transition-all"
            >
              <LogIn className="h-4 w-4 mr-2" />
              {t.signIn}
            </Button>
          )}

          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-6 w-6 text-gray-500 dark:text-white" />
            <span className="sr-only">Menu</span>
          </Button>
        </div>
      </nav>
    </header>
  );
}

function HeroSection({ t, setShowLearnMorePopup }) {
  const getText = (key) => (typeof t === "function" ? t(key) : key);

  return (
    <motion.section
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      id="home"
      style={{
        position: "relative",
        padding: "2rem",
        textAlign: "center",
        color: "white",
        textShadow: "0px 2px 4px rgba(0, 0, 0, 0.5)",
        background:
          "linear-gradient(45deg, #f94144, #f3722c, #f8961e, #f9844a, #f9c74f, #90be6d, #43aa8b, #4d908e, #577590, #277da1)",
        backgroundSize: "400% 400%",
        animation: "wave-gradient 16s ease infinite",
      }}
    >
      <div className="container mx-auto">
        {/* Hero Title */}
        <h1 style={{ fontSize: "3rem", fontWeight: "bold" }}>
          {getText("Empower Your Community Through Engaging Events")}
        </h1>

        {/* Subheading */}
        <p style={{ marginTop: "1rem", fontSize: "1.25rem" }}>
          {getText(
            "Organize events that bring people together with tools designed for collaboration and outreach."
          )}
        </p>

        {/* Call to Action Button */}
        <div style={{ marginTop: "1.5rem" }}>
          <button
            onClick={() => setShowLearnMorePopup(true)}
            style={{
              backgroundColor: "#fff",
              color: "#f3722c",
              fontWeight: "500",
              padding: "0.75rem 1.25rem",
              borderRadius: "9999px",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
              transition: "all 0.3s ease",
              cursor: "pointer",
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = "#f3722c";
              e.target.style.color = "#fff";
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = "#fff";
              e.target.style.color = "#f3722c";
            }}
          >
            {getText("Start Planning")}
          </button>
        </div>

        {/* Optional Learn More Button */}
        <div style={{ marginTop: "1rem" }}>
          <button
            onClick={() => setShowLearnMorePopup(true)}
            style={{
              fontSize: "1.125rem",
              color: "yellow",
              transition: "color 0.3s ease",
              cursor: "pointer",
            }}
            onMouseOver={(e) => (e.target.style.color = "#f8961e")}
            onMouseOut={(e) => (e.target.style.color = "#f3722c")}
          >
            {getText("Learn More")}
          </button>
        </div>
      </div>

      {/* Gradient Waves Animation */}
      <style jsx>{`
        @keyframes wave-gradient {
          0% {
            background-position: 0% 50%;
          }
          25% {
            background-position: 50% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          75% {
            background-position: 50% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
      `}</style>
    </motion.section>
  );
}

function QuickAccessCard({ icon, title, onClick, gradient }) {
  return (
    <div
      className="rounded-lg shadow-md transition-all ease-in-out duration-300 hover:shadow-xl"
      style={{
        background: gradient, // Gradient background
        borderRadius: "12px", // Rounded corners
        color: "#fff", // White text for contrast
      }}
      onClick={onClick}
    >
      <div className="p-6 flex flex-col items-center gap-4 cursor-pointer">
        <div className="bg-white p-3 rounded-full shadow-md transition-transform duration-300 hover:scale-105">
          {icon}
        </div>
        <h3
          className="text-lg font-semibold text-center"
          style={{ textShadow: "2px 2px 5px rgba(0, 0, 0, 0.5)" }} // Text shadow
        >
          {title}
        </h3>
      </div>
    </div>
  );
}

function QuickAccessSection({
  t,
  setShowEventPopup,
  setShowResourcesPopup,
  setShowContactPopup,
}) {
  return (
    <section
      id="resources"
      className="py-16"
      style={{
        background: "linear-gradient(135deg, #f9c74f, #43aa8b, #4d908e)", // Section gradient
        backgroundSize: "300% 300%",
        animation: "gradient-shift 12s ease infinite", // Gradient animation
      }}
    >
      <div className="container mx-auto px-6">
        {/* Section Title */}
        <h2
          className="text-2xl md:text-3xl font-bold text-center mb-8"
          style={{
            color: "#fff", // White color
            textShadow: "3px 3px 8px rgba(0, 0, 0, 0.6)", // Title text shadow
          }}
        >
          {t.quickAccess}
        </h2>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Event Card */}
          <QuickAccessCard
            icon={<Calendar className="h-8 w-8 text-[#43aa8b]" />}
            title={t.events}
            gradient="linear-gradient(135deg, #f8961e, #f9c74f)"
            onClick={() => setShowEventPopup(true)}
          />

          {/* Resources Card */}
          <QuickAccessCard
            icon={<FileText className="h-8 w-8 text-[#90be6d]" />}
            title={t.resources}
            gradient="linear-gradient(135deg, #90be6d, #43aa8b)"
            onClick={() => setShowResourcesPopup(true)}
          />

          {/* Contact Card */}
          <QuickAccessCard
            icon={<Phone className="h-8 w-8 text-[#4d908e]" />}
            title={t.contact}
            gradient="linear-gradient(135deg, #4d908e, #577590)"
            onClick={() => setShowContactPopup(true)}
          />
        </div>
      </div>

      {/* Gradient Animation */}
      <style jsx>{`
        @keyframes gradient-shift {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
      `}</style>
    </section>
  );
}

function AboutSection({ t }) {
  const [vmgoData, setVmgoData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVmgoData = async () => {
      try {
        // Simulate a delay for data fetching
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setVmgoData({
          vision:
            "ASCOT 2030: ASCOT as a globally recognized comprehensive inclusive higher education institution anchoring on the local culture of Aurora in particular and the Philippines in general.",
          mission:
            "ASCOT shall capacitate human resources of Aurora and beyond to be globally empowered and future-proofed; generate, disseminate, and apply knowledge and technologies for sustainable development.",
        });
      } catch (error) {
        console.error("Error fetching VMGO data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchVmgoData();
  }, []);

  if (loading) {
    return (
      <div className="text-center text-2xl p-5 text-primary">Loading...</div>
    );
  }

  return (
    <section
      id="about"
      className="py-12"
      style={{
        background: "linear-gradient(135deg, #f9c74f, #43aa8b, #4d908e)",
        backgroundSize: "300% 300%",
        animation: "gradient-move 10s ease infinite",
      }}
    >
      <div className="container mx-auto px-4">
        {/* Section Title */}
        <h2
          className="text-3xl font-bold text-center mb-8"
          style={{
            color: "#fff",
            textShadow: "2px 2px 8px rgba(0, 0, 0, 0.7)",
          }}
        >
          {t.about}
        </h2>

        <div className="grid md:grid-cols-2 gap-8 items-start">
          {/* VMGO Section */}
          <div>
            <p
              className="mb-4"
              style={{
                color: "#fff",
                textShadow: "1px 1px 5px rgba(0, 0, 0, 0.6)",
              }}
            >
              The Gender and Development (GAD) Office is dedicated to promoting
              gender equality and inclusive development in our community.
            </p>

            {/* Vision */}
            <SectionHeading title="Our Vision" />
            <p
              className="mb-4"
              style={{
                color: "#fff",
                lineHeight: "1.8",
                textShadow: "1px 1px 5px rgba(0, 0, 0, 0.5)",
              }}
            >
              {vmgoData.vision}
            </p>

            {/* Mission */}
            <SectionHeading title="Our Mission" />
            <p
              className="mb-4"
              style={{
                color: "#fff",
                lineHeight: "1.8",
                textShadow: "1px 1px 5px rgba(0, 0, 0, 0.5)",
              }}
            >
              {vmgoData.mission}
            </p>

            {/* Links */}
            <div className="flex flex-col md:flex-row gap-4">
              <Link href="/organizationalchart" passHref legacyBehavior>
                <Button
                  asChild
                  style={{
                    background: "linear-gradient(135deg, #f8961e, #f9c74f)",
                    color: "#fff",
                    padding: "0.75rem 1.5rem",
                    borderRadius: "9999px",
                    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
                  }}
                >
                  <a className="w-full md:w-auto">View Organizational Chart</a>
                </Button>
              </Link>
              <Link href="/privacyandpolicy" passHref legacyBehavior>
                <Button
                  asChild
                  style={{
                    background: "linear-gradient(135deg, #90be6d, #43aa8b)",
                    color: "#fff",
                    padding: "0.75rem 1.5rem",
                    borderRadius: "9999px",
                    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
                  }}
                >
                  <a className="w-full md:w-auto">View Privacy Policy</a>
                </Button>
              </Link>
              <Link href="/mission" passHref legacyBehavior>
                <Button
                  asChild
                  style={{
                    background: "linear-gradient(135deg, #4d908e, #577590)",
                    color: "#fff",
                    padding: "0.75rem 1.5rem",
                    borderRadius: "9999px",
                    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
                  }}
                >
                  <a className="w-full md:w-auto">View VMGO</a>
                </Button>
              </Link>
            </div>
          </div>

          {/* Team Members Section */}
          <div className="grid grid-cols-2 gap-4">
            <TeamMember
              name="RENATO G. REYES"
              role="PRESIDENT II"
              image="/img/presrenato.jpg"
              gradient="linear-gradient(135deg, #f94144, #f3722c)"
            />
            <TeamMember
              name="AMPARO ROBERTA A. ESPINOSA"
              role="Director"
              image="/img/amparo.jpg"
              gradient="linear-gradient(135deg, #f8961e, #f9c74f)"
            />
            <TeamMember
              name="Maximo M. Marte Jr."
              role="GAD COORDINATOR"
              image="/img/maxi.jpg"
              gradient="linear-gradient(135deg, #90be6d, #43aa8b)"
            />
            <TeamMember
              name="Arnold Monteverde"
              role="GAD SECRETARIAT"
              image="/img/arnold.jpg"
              gradient="linear-gradient(135deg, #4d908e, #577590)"
            />
          </div>
        </div>
      </div>

      {/* Background Animation */}
      <style jsx>{`
        @keyframes gradient-move {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
      `}</style>
    </section>
  );
}

function SectionHeading({ title }) {
  return <h3 className="text-xl font-semibold mb-2">{title}</h3>;
}

function TeamMember({ name, role, image }) {
  return (
    <div className="text-center">
      <Image
        src={image}
        alt={name}
        width={150}
        height={150}
        className="rounded-full mx-auto mb-2"
      />
      <h4 className="font-semibold">{name}</h4>
      <p className="text-sm text-gray-600 dark:text-gray-400">{role}</p>
    </div>
  );
}

function EventsSection({ t }) {
  const events = [
    {
      title: "Gender Sensitivity Workshop",
      date: "May 15, 2024",
      description:
        "Join us for an interactive workshop on fostering gender sensitivity in the workplace.",
      category: "Workshop",
    },
    {
      title: "Women in Tech Conference",
      date: "June 2, 2024",
      description:
        "Explore opportunities and challenges for women in the technology sector.",
      category: "Conference",
    },
    {
      title: "LGBTQ+ Rights Seminar",
      date: "June 20, 2024",
      description:
        "Learn about current legislation and advocacy efforts for LGBTQ+ rights.",
      category: "Seminar",
    },
    {
      title: "Gender Equity Summit",
      date: "July 10, 2024",
      description: "A summit focused on achieving gender equity in education.",
      category: "Summit",
    },
  ];

  const maxEventsToShow = 3;

  return (
    <section
      id="events"
      className="py-12"
      style={{
        background: "linear-gradient(45deg, #334443, #34656D, #C6FFC1, #FFFBDF)",
        color: "#334443",
      }}
    >
      <div className="container mx-auto px-6">
        <h2 className="text-3xl font-bold text-center mb-8" style={{ color: "#FFFBDF" }}>
          {t.upcomingEvents || "Upcoming Events"}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.slice(0, maxEventsToShow).map((event, index) => (
            <EventCard key={index} {...event} />
          ))}
        </div>
        {events.length > maxEventsToShow && (
          <div className="text-center mt-8">
            <button
              className="py-2 px-6 rounded-full shadow-md"
              style={{
                background: "#34656D",
                color: "#FFFBDF",
              }}
              onClick={() => alert("See more events!")}
            >
              See More Events
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

function EventCard({ title, date, description, category }) {
  return (
    <div
      className="p-4 rounded-lg shadow-lg transition-transform duration-300"
      style={{
        background: "#FFFBDF",
        border: "1px solid #C6FFC1",
        color: "#334443",
      }}
    >
      <div className="text-sm font-semibold uppercase mb-2" style={{ color: "#34656D" }}>
        {category}
      </div>
      <h3 className="text-lg font-bold mb-1" style={{ color: "#334443" }}>
        {title}
      </h3>
      <p className="text-sm mb-3" style={{ color: "#34656D" }}>
        {date}
      </p>
      <p className="text-sm" style={{ color: "#334443" }}>
        {description}
      </p>
    </div>
  );
}

function TestimonialsSection({ t }) {
  const testimonials = [
    {
      name: "Maria Santos",
      role: "Event Participant",
      quote:
        "The GAD Office events have significantly contributed to my personal and professional growth.",
      image: "/placeholder.svg",
    },
    {
      name: "Juan dela Cruz",
      role: "Community Partner",
      quote:
        "Collaborating with the GAD Office has greatly improved our organization's approach to inclusivity.",
      image: "/placeholder.svg",
    },
    {
      name: "Ana Reyes",
      role: "Program Beneficiary",
      quote:
        "The support I received from GAD programs has empowered me to pursue my dreams without limitations.",
      image: "/placeholder.svg",
    },
  ];

  return (
    <section
      id="testimonials"
      className="py-12"
      style={{
        background: "linear-gradient(180deg, #334443, #34656D)", // Gradient from muted teal to soft greenish-blue
        padding: "3rem 1rem",
        color: "#FFFBDF", // Soft light cream text for readability
      }}
    >
      <div className="container mx-auto px-4">
        <h2
          className="text-3xl font-bold text-center mb-8"
          style={{
            background: "linear-gradient(90deg, #34656D, #334443)", // Gradient for heading
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            color: "#FFFBDF", // Light cream text for title contrast
          }}
        >
          {t.testimonials || "What People Are Saying"}
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <TestimonialCard key={index} {...testimonial} />
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialCard({ name, role, quote, image }) {
  return (
    <div
      className="testimonial-card"
      style={{
        background: "#FFFBDF", // Clean background for the card
        borderRadius: "16px",
        color: "#334443", // Muted dark greenish-grey text for contrast
        padding: "2rem",
        textAlign: "center",
        boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)", // Soft shadow
        border: "3px solid #C6FFC1", // Soft light green border
      }}
    >
      <img
        src={image}
        alt={name}
        style={{
          width: "80px",
          height: "80px",
          borderRadius: "50%",
          border: "3px solid #C6FFC1", // Light green border for images
          marginBottom: "1rem",
        }}
      />
      <p
        className="italic"
        style={{
          fontSize: "1.1rem",
          marginBottom: "1rem",
          color: "#34656D", // Soft greenish-blue for the quote text
        }}
      >
        "{quote}"
      </p>
      <h4
        className="font-bold"
        style={{
          fontSize: "1.25rem",
          color: "#334443", // Muted dark greenish-grey for the name
          marginBottom: "0.5rem",
        }}
      >
        {name}
      </h4>
      <p style={{ fontSize: "1rem", color: "#34656D" }}>{role}</p> {/* Soft greenish-blue for the role */}
    </div>
  );
}

function NewsSection({ t }) {
  const [userContent, setUserContent] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("User submitted content:", userContent);
    toast.success(
      "Your story has been submitted for review. Thank you for sharing!"
    );
    setUserContent("");
  };

  return (
    <section
      id="news"
      className="py-16 text-black"
      style={{
        backgroundImage: `linear-gradient(
          120deg,
          #ffefba, 
          #ffffff, 
          #d4fc79, 
          #96e6a1, 
          #c4e0e5
        )`,
        backgroundSize: "400% 400%",
        animation: "gradientFlow 16s ease infinite",
      }}
    >
      <div className="container mx-auto px-6 md:px-12">
        <h2
          className="text-4xl font-extrabold text-center mb-12"
          style={{
            textShadow: "0 2px 4px rgba(0, 0, 0, 0.3)",
            letterSpacing: "0.5px",
            color: "#3b3b3b",
          }}
        >
          {t.latestNews}
        </h2>
        <div className="grid md:grid-cols-3 gap-12">
          <NewsCard
            title="New GAD Policy Implemented"
            date="April 28, 2024"
            excerpt="The local government has approved a new Gender and Development policy aimed at promoting equality in all sectors."
            image="/placeholder.svg"
            t={t}
          />
          <NewsCard
            title="Successful Women's Leadership Summit"
            date="April 15, 2024"
            excerpt="Over 500 participants attended our annual Women's Leadership Summit, featuring inspiring speakers and workshops."
            image="/placeholder.svg"
            t={t}
          />
          <NewsCard
            title="GAD Office Receives Recognition"
            date="March 30, 2024"
            excerpt="Our office has been awarded for its outstanding contributions to gender equality and community development."
            image="/placeholder.svg"
            t={t}
          />
        </div>
      </div>
      <style jsx>{`
        @keyframes gradientFlow {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
      `}</style>
    </section>
  );
}

function NewsCard({ title, date, excerpt, image, t }) {
  return (
    <Card
      className="shadow-lg rounded-lg overflow-hidden"
      style={{
        backgroundImage: "linear-gradient(145deg, #f4f9f9, #d9f2f2)", // Soft pastel gradient for container
        backgroundSize: "200% 200%",
        animation: "cardGradient 15s ease infinite",
        color: "#2a2a2a", // Dark text for better readability
        boxShadow: "0 6px 15px rgba(0, 0, 0, 0.15)", // Light shadow for depth
      }}
    >
      <CardContent className="p-4">
        <Image
          src={image}
          alt={title}
          width={400}
          height={200}
          className="rounded-lg mb-2"
          style={{
            boxShadow: "0 4px 10px rgba(0, 0, 0, 0.2)",
          }}
        />
        <h3
          className="text-xl font-semibold mb-1"
          style={{
            textShadow: "0 1px 3px rgba(0, 0, 0, 0.2)",
          }}
        >
          {title}
        </h3>
        <p className="text-sm mb-1">{date}</p>
        <p className="text-sm mb-2">{excerpt}</p>
        <Button
          variant="outline"
          style={{
            borderColor: "#82c5c5", // Light teal border
            color: "#ffffff", // White text
            background: "#47b8b8", // Teal button background
            transition: "all 0.3s ease-in-out",
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = "#358f8f"; // Darker teal on hover
            e.target.style.color = "#ffffff"; // Maintain white text
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = "#47b8b8"; // Return to teal background
            e.target.style.color = "#ffffff"; // Maintain white text
          }}
          onClick={() => toast.info("Full article coming soon!")}
        >
          {t.readMore}
        </Button>
      </CardContent>
      <style jsx>{`
        @keyframes cardGradient {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
      `}</style>
    </Card>
  );
}

function FAQSection({ t }) {
  const faqs = [
    {
      question: "What is the GAD Office?",
      answer:
        "The Gender and Development (GAD) Office is a department dedicated to promoting gender equality and inclusive development in our community through various programs, policies, and initiatives.",
    },
    {
      question: "How can I participate in GAD events?",
      answer:
        "You can participate in GAD events by registering through our website or contacting our office directly. We regularly post upcoming events in the Events section of our website.",
    },
    {
      question: "What resources does the GAD Office provide?",
      answer:
        "The GAD Office provides a wide range of resources including educational materials, training programs, counseling services, and support for gender-related issues. You can find more information in our Resources section.",
    },
    {
      question: "How can I support the GAD Office's initiatives?",
      answer:
        "You can support our initiatives by volunteering, attending our events, spreading awareness about our programs, or making donations to support our work. Contact us for more information on how you can get involved.",
    },
  ];

  return (
    <section
      id="faq"
      className="py-12 bg-blue-50 text-gray-800"
      style={{ borderRadius: "10px" }}
    >
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-8 text-teal-600">
          {t.faq}
        </h2>
        <Accordion
          type="single"
          collapsible
          className="w-full max-w-2xl mx-auto bg-white shadow-md p-4 rounded-lg"
        >
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="text-lg font-semibold hover:text-teal-500">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-gray-600 bg-gray-50 p-4 rounded-md">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

function ContactSection({ t }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
  };

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
    alert("Your message has been sent successfully!");
    setFormData({ name: "", email: "", message: "" });
  };

  return (
    <section id="contact" className="py-12 bg-pink-50 text-gray-800">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-8 text-rose-600">
          {t.contactUs}
        </h2>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-semibold mb-4">Get in Touch</h3>
              <p className="mb-4">
                We’d love to hear from you. Please fill out the form below or
                use our contact information to reach us.
              </p>
              <div className="space-y-2 text-gray-700">
                <p>
                  <strong>Address:</strong> 123 Main St, Anytown, Philippines
                </p>
                <p>
                  <strong>Phone:</strong> +63 123 456 7890
                </p>
                <p>
                  <strong>Email:</strong> info@gadoffice.gov.ph
                </p>
              </div>
            </div>
            <form
              onSubmit={handleSubmit}
              className="space-y-4 bg-white p-6 rounded-lg shadow-lg border border-pink-200"
            >
              <div>
                <label htmlFor="name" className="block font-medium mb-1">
                  {t.yourName}
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full border rounded-lg p-2 bg-gray-50 focus:ring-pink-500"
                />
              </div>
              <div>
                <label htmlFor="email" className="block font-medium mb-1">
                  {t.yourEmail}
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full border rounded-lg p-2 bg-gray-50 focus:ring-pink-500"
                />
              </div>
              <div>
                <label htmlFor="message" className="block font-medium mb-1">
                  {t.yourMessage}
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  className="w-full border rounded-lg p-2 bg-gray-50 focus:ring-pink-500"
                />
              </div>
              <button
                type="submit"
                className="bg-pink-500 hover:bg-pink-700 text-white py-2 px-4 rounded"
              >
                {t.sendMessage}
              </button>
            </form>
          </div>

          <div>
            <div className="bg-white p-6 rounded-lg shadow-lg border border-teal-200 mb-8">
              <h3 className="text-xl font-semibold mb-4">Our Office</h3>
              <p className="mb-2">123 Gender Equality Street</p>
              <p className="mb-2">Inclusivity City, IC 12345</p>
              <p className="mb-2">Phone: (123) 456-7890</p>
              <p className="mb-4">
                Email:{" "}
                <a
                  href="mailto:info@gadoffice.gov"
                  className="text-teal-600 hover:underline"
                >
                  info@gadoffice.gov
                </a>
              </p>
            </div>
            <div className="relative">
              <div className="aspect-w-16 aspect-h-9 rounded-lg overflow-hidden shadow-lg">
                {/* Google Map */}
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3917.218497498902!2d121.5740752!3d15.7440445!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3390a6dde33069ab%3A0x6352ac3889b63f4!2sAurora%20State%20College%20of%20Technology%20(ASCOT)%20Main%20Campus%20Administration%20Building!5e0!3m2!1sen!2sph!4v1691580195739"
                  width="600"
                  height="450"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  title="ASCOT Main Campus"
                  className="w-full"
                ></iframe>

                {/* Thumbnail Image Inside Map */}
                <div
                  className="absolute bottom-4 right-4 bg-white p-2 rounded-lg shadow-lg cursor-pointer"
                  onClick={toggleModal}
                >
                  <img
                    src="/logo/pictureascot.jpg"
                    alt="ASCOT Campus Thumbnail"
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                </div>
              </div>
            </div>

            {isModalOpen && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg shadow-lg max-w-md w-full relative">
                  <button
                    className="absolute top-2 right-2 text-red-500"
                    onClick={toggleModal}
                  >
                    ✖
                  </button>
                  <img
                    src="/logo/pictureascot.jpg"
                    alt="ASCOT Campus"
                    className="w-full h-auto rounded-lg"
                  />
                </div>
              </div>
            )}
          
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer({ t }) {
  const [fontSize, setFontSize] = useState("text-sm");
  const [highContrast, setHighContrast] = useState(false);

  const toggleContrast = () => setHighContrast(!highContrast);
  const handleFontSizeChange = (size) => setFontSize(size);

  return (
    <footer
      className={`bg-gray-800 text-white py-8 ${
        highContrast ? "bg-black text-yellow-300" : ""
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">About Us</h3>
            <p className="text-sm">
              The GAD Office is committed to promoting gender equality and
              inclusive development in our community.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/">{t.home}</Link>
              </li>
              <li>
                <Link href="#about">{t.about}</Link>
              </li>
              {/* Add other links here */}
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Follow Us</h3>
            <div className="flex space-x-4">
              <a href="https://facebook.com" title="Facebook">
                <FaFacebook size={20} />
              </a>
              <a href="https://twitter.com" title="Twitter">
                <FaTwitter size={20} />
              </a>
              <a href="https://instagram.com" title="Instagram">
                <FaInstagram size={20} />
              </a>
              <a href="https://linkedin.com" title="LinkedIn">
                <FaLinkedin size={20} />
              </a>
              <a href="https://youtube.com" title="YouTube">
                <FaYoutube size={20} />
              </a>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">{t.subscribe}</h3>
            <form className="flex">
              <Input type="email" placeholder="Enter your email" required />
              <Button type="submit">{t.subscribe}</Button>
            </form>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-gray-700 text-center">
          <p className="text-sm">
            &copy; {new Date().getFullYear()} GAD Office. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

function SignInPopup({ show, onClose, handleSignIn }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSignIn(email, password);
  };

  return (
    <>
      {show && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-96 p-6 relative">
            {/* Close Button */}
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              onClick={onClose}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            {/* Header */}
            <div className="text-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Welcome Back</h2>
              <p className="text-gray-600 text-sm">Sign in to continue</p>
            </div>

            {/* Form */}
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700"
                >
                  Email or Username
                </label>
                <input
                  type="email"
                  id="email"
                  placeholder="Enter your email"
                  className="w-full border rounded-md px-4 py-2 focus:ring focus:ring-blue-300"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    placeholder="Enter your password"
                    className="w-full border rounded-md px-4 py-2 focus:ring focus:ring-blue-300"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-blue-500 border-gray-300 rounded focus:ring-blue-400"
                  />
                  <span className="text-sm text-gray-600">Remember Me</span>
                </label>
                <a href="#" className="text-sm text-blue-500 hover:underline">
                  Forgot Password?
                </a>
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700"
              >
                Sign In
              </button>
            </form>

            {/* OR Divider */}
            <div className="flex items-center my-4">
              <hr className="flex-grow border-gray-300" />
              <span className="px-2 text-gray-500">OR</span>
              <hr className="flex-grow border-gray-300" />
            </div>

            {/* Social Login */}
            <div className="space-y-2">
              <button className="w-full flex items-center justify-center border rounded-md py-2 hover:bg-gray-100">
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/5/51/Facebook_f_logo_%282019%29.svg"
                  alt="Facebook Logo"
                  className="w-5 h-5 mr-2"
                />
                Continue with Facebook
              </button>
              <button className="w-full flex items-center justify-center border rounded-md py-2 hover:bg-gray-100">
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/4/4a/Logo_2013_Google.png"
                  alt="Google Logo"
                  className="w-5 h-5 mr-2"
                />
                Continue with Google
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function LearnMorePopup({ show, onClose, t }) {
  return (
    <Dialog open={show} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>What is GADConnect?</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p>
            GADConnect is a platform designed for the GAD Office to simplify
            event management and demographic analysis.
          </p>
          <h3 className="text-lg font-semibold">Key Features:</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li>Streamlined event management</li>
            <li>Accurate data collection</li>
            <li>Secure access</li>
            <li>Real-time insights</li>
            <li>Customizable forms</li>
          </ul>
          <h3 className="text-lg font-semibold">Benefits:</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li>Efficient workflows</li>
            <li>Data-driven decisions</li>
            <li>Enhanced privacy</li>
            <li>User-friendly operations</li>
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EventPopup({ show, onClose, t }) {
  return (
    <Dialog open={show} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{t.events}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Upcoming Events</h3>
          <ul className="space-y-2">
            <li>Gender Equality Workshop - May 15, 2024</li>
            <li>Women in Tech Conference - June 2, 2024</li>
            <li>LGBTQ+ Rights Seminar - June 20, 2024</li>
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ResourcesPopup({ show, onClose, t }) {
  return (
    <Dialog open={show} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{t.resources}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Available Resources</h3>
          <ul className="space-y-2">
            <li>Gender Sensitivity Training Materials</li>
            <li>Policy Guides on Workplace Equality</li>
            <li>Research Reports on Gender and Development</li>
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ContactPopup({ show, onClose, t }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    // Implement contact form submission logic here
    toast.success("Your message has been sent. We'll get back to you soon!");
    onClose();
  };

  return (
    <Dialog open={show} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t.contactUs}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t.yourName}</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">{t.yourEmail}</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">{t.yourMessage}</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            />
          </div>
          <Button type="submit">{t.sendMessage}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
