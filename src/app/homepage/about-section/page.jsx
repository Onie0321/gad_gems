"use client";
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";

export default function AboutSection() {
  return (
    <section
      id="about"
      className="py-16 bg-gradient-to-br from-[#E3FDFD] via-[#CBF1F5] to-[#E3FDFD]"
    >
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-12 text-[#71C9CE]">
          About Us
        </h2>
        <p className="text-lg text-center text-[#71C9CE]/90 leading-relaxed mb-12">
          The Gender and Development (GAD) Office is dedicated to promoting
          gender equality and inclusive development in our community.
        </p>
        <div className="flex flex-col md:flex-row gap-12 items-center justify-center">
          <div className="md:w-1/2 flex justify-center p-4">
            <div className="relative w-full max-w-lg">
              <div className="absolute -inset-4 bg-gradient-to-r from-[#A6E3E9] to-[#71C9CE] rounded-2xl blur-xl opacity-30"></div>
              <Image
                src="/logo/gadabout.png"
                alt="About GAD Office"
                width={550}
                height={350}
                priority
                className="relative w-full h-auto object-cover rounded-2xl shadow-xl transform hover:scale-105 transition-transform duration-300"
              />
            </div>
          </div>
          <div className="md:w-1/2 space-y-6 p-4">
            <div className="space-y-4">
              <h3 className="text-2xl text-center font-semibold text-[#71C9CE]">
                Our Vision
              </h3>
              <p className="text-[#71C9CE]/90">
                "ASCOT 2030: ASCOT as a globally recognized comprehensive
                inclusive higher education institution anchoring on the local
                culture of Aurora in particular and the Philippines in general."
              </p>
              <h3 className="text-2xl text-center font-semibold text-[#71C9CE]">
                Our Mission
              </h3>
              <p className="text-[#71C9CE]/90">
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
                    className="w-full bg-[#71C9CE] hover:bg-[#A6E3E9] text-white border border-[#CBF1F5]"
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
