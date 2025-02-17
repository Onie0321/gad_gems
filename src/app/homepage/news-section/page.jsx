"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CalendarIcon } from "lucide-react";
import { databases, databaseId, newsCollectionId } from "@/lib/appwrite";
import { Query } from "appwrite";
import { motion } from "framer-motion";
import { Newspaper } from "lucide-react";

export default function NewsSection() {
  const [mounted, setMounted] = useState(false);
  const [news, setNews] = useState([]);
  const [visibleNews, setVisibleNews] = useState(3);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await databases.listDocuments(
          databaseId,
          newsCollectionId,
          [Query.equal("showOnHomepage", true), Query.orderDesc("date")]
        );

        setNews(response.documents);
      } catch (error) {
        console.error("Error fetching news:", error);
      }
    };

    setMounted(true);
    fetchNews();
  }, []);

  const loadMore = () => {
    setVisibleNews((prevVisible) => prevVisible + 3);
  };

  const renderContent = () => {
    if (!mounted) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-[500px] bg-gray-100 rounded-2xl animate-pulse"
            />
          ))}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {news.slice(0, visibleNews).map((item) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="group h-full flex flex-col hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm border-0 ring-1 ring-gray-200/50">
              <CardHeader className="flex-none">
                <CardTitle className="text-xl font-semibold line-clamp-2 min-h-[3.5rem]">
                  {item.title || "Untitled"}
                </CardTitle>
                {item.date && (
                  <div className="flex items-center text-sm text-violet-600">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    <span>{item.date}</span>
                  </div>
                )}
              </CardHeader>
              <CardContent className="flex-grow">
                {item.description && (
                  <p className="text-gray-600 line-clamp-3 min-h-[4.5rem]">
                    {item.description}
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    );
  };

  return (
    <section
      id="news"
      className="py-16 bg-gradient-to-br from-white via-violet-50/30 to-blue-50/30"
    >
      <div className="container mx-auto px-4">
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <Newspaper className="w-8 h-8 text-violet-600" />
            <h2 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-blue-600">
              Latest News
            </h2>
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Stay updated with our latest announcements and developments
          </p>
        </motion.div>
        {renderContent()}
        {mounted && visibleNews < news.length && (
          <div className="mt-12 text-center">
            <Button
              onClick={loadMore}
              className="bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 text-white px-8 py-2"
            >
              Load More
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
