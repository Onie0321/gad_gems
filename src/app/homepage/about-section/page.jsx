"use client";
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";

export default function AboutSection() {
  const [vmgoData, setVmgoData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVmgoData = async () => {
      try {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setVmgoData({
          vision:
            "ASCOT 2030: ASCOT as a globally recognized comprehensive inclusive higher education institution anchoring on the local culture of Aurora in particular and the Philippines in general.",
          mission:
            "ASCOT shall capacitate human resources of Aurora and beyond to be globally empowered and future-proofed; generate, disseminate, and apply knowledge and technologies for sustainable development",
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
    return <div className="text-center text-2xl p-5">Loading...</div>;
  }

  return (
    <section id="about" className="py-12 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-8">About</h2>
        <div className="flex flex-col md:flex-row gap-8 items-center justify-center">
          <div className="md:w-1/2 flex justify-center">
            <Image
              src="/logo/gadabout.png"
              alt="About GAD Office"
              width={500}
              height={300}
              className="w-full h-auto object-cover rounded-lg"
            />
          </div>
          <div className="md:w-1/2 text-center md:text-left">
            <p className="mb-4">
              The Gender and Development (GAD) Office is dedicated to promoting
              gender equality and inclusive development in our community.
            </p>
            <h3 className="text-xl font-semibold mb-2">Our Vision</h3>
            <p className="mb-4">{vmgoData.vision}</p>
            <h3 className="text-xl font-semibold mb-2">Our Mission</h3>
            <p className="mb-4">{vmgoData.mission}</p>
            <div className="flex flex-col md:flex-row gap-4 justify-center md:justify-start">
              <Link href="/organizational-chart" passHref legacyBehavior>
                <Button asChild className="w-full md:w-auto">
                  <a>View Organizational Chart</a>
                </Button>
              </Link>
              <Link href="/privacy-policy" passHref legacyBehavior>
                <Button asChild className="w-full md:w-auto">
                  <a>View Privacy Policy</a>
                </Button>
              </Link>
              <Link href="/vmgo" passHref legacyBehavior>
                <Button asChild className="w-full md:w-auto">
                  <a>View VMGO</a>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
