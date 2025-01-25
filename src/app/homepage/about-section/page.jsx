"use client";
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";

export default function AboutSection() {
  return (
    <section
      id="about"
      className="py-16 bg-gradient-to-br from-white via-violet-50/30 to-blue-50/30"
    >
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-12 bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-blue-600">
          About Us
        </h2>
        <div className="flex flex-col md:flex-row gap-12 items-center justify-center">
          <div className="md:w-1/2 flex justify-center">
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-violet-200 to-blue-200 rounded-2xl blur-xl opacity-30"></div>
              <Image
                src="/logo/gadabout.png"
                alt="About GAD Office"
                width={500}
                height={300}
                className="relative w-full h-auto object-cover rounded-2xl shadow-xl"
              />
            </div>
          </div>
          <div className="md:w-1/2 space-y-6">
            <p className="text-lg text-gray-600 leading-relaxed">
              The Gender and Development (GAD) Office is dedicated to promoting
              gender equality and inclusive development in our community.
            </p>
            <div className="space-y-4">
              <h3 className="text-2xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-blue-600">
                Our Vision
              </h3>
              <p className="text-gray-600">
                {" "}
                "ASCOT 2030: ASCOT as a globally recognized comprehensive
                inclusive higher education institution anchoring on the local
                culture of Aurora in particular and the Philippines in general."
              </p>
              <h3 className="text-2xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-blue-600">
                Our Mission
              </h3>
              <p className="text-gray-600">
                {" "}
                "ASCOT shall capacitate human resources of Aurora and beyond to
                be globally empowered and future-proofed; generate, disseminate,
                and apply knowledge and technologies for sustainable
                development"
              </p>
            </div>
            <div className="flex flex-col md:flex-row gap-4">
              {["Organizational Chart", "VMGO"].map((item) => (
                <Link
                  key={item}
                  href={`/${item.toLowerCase().replace(" ", "-")}`}
                  className="flex-1"
                >
                  <Button
                    className="w-full bg-gradient-to-r from-violet-50 to-blue-50 hover:from-violet-100 hover:to-blue-100 text-violet-700 border border-violet-200"
                    variant="outline"
                  >
                    View {item}
                  </Button>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
