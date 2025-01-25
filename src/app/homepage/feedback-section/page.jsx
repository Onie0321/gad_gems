"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "react-toastify";

export default function FeedbackSection() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Implement contact form submission logic here
      // For now, we'll just simulate an API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Your message has been sent! We'll get back to you soon!");
      setName("");
      setEmail("");
      setMessage("");
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("Failed to send message. Please try again later.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="feedback" className="py-16 bg-gradient-to-br from-white via-violet-50/30 to-blue-50/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-blue-600 mb-4">
            Get In Touch
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            We value your feedback and are here to help. Reach out to us with any questions or concerns.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-12">
          <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-sm ring-1 ring-gray-200/50">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="name" className="text-gray-700">Your Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 border-violet-200 focus:ring-violet-500"
                  required
                />
              </div>
              <div>
                <Label htmlFor="email" className="text-gray-700">Your Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 border-violet-200 focus:ring-violet-500"
                  required
                />
              </div>
              <div>
                <Label htmlFor="message" className="text-gray-700">Your Message</Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="mt-1 border-violet-200 focus:ring-violet-500"
                  required
                />
              </div>
              <Button 
                type="submit" 
                disabled={submitting}
                className="w-full bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 text-white"
              >
                {submitting ? "Sending..." : "Send Message"}
              </Button>
            </form>
          </div>
          <div className="space-y-8">
            <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-sm ring-1 ring-gray-200/50">
              <h3 className="text-2xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-blue-600 mb-4">
                Our Office
              </h3>
              <div className="space-y-2 text-gray-600">
                <p>Brgy. Zabali, Baler, Aurora</p>
                <p>Gen Ed, Second Floor</p>
                <p>Phone: +63 9123456789</p>
                <p>
                  Email:{" "}
                  <a href="mailto:gad@ascot.edu.ph" className="text-violet-600 hover:text-violet-700">
                    gad@ascot.edu.ph
                  </a>
                </p>
              </div>
            </div>
            <div className="overflow-hidden rounded-2xl shadow-sm ring-1 ring-gray-200/50">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3917.218497498902!2d121.5740752!3d15.7440445!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3390a6dde33069ab%3A0x6352ac3889b63f4!2sAurora%20State%20College%20of%20Technology%20(ASCOT)%20Main%20Campus%20Administration%20Building!5e0!3m2!1sen!2sph!4v1691580195739"
                width="100%"
                height="300"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                className="w-full"
                title="ASCOT Main Campus"
              ></iframe>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}





 

