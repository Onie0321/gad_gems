
'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'react-toastify'
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts'


export default function NewsSection() {
  const [showChart, setShowChart] = useState(false);
        const [chartData, setChartData] = useState([]);
      
        useEffect(() => {
          // Simulated data fetch
          setChartData([
            { department: "SOIT", employees: 50, students: 500 },
            { department: "SOE", employees: 40, students: 400 },
            { department: "Others", employees: 30, students: 300 },
          ]);
        }, []);
      
        return (
          <section id="news" className="py-16">
            <div className="container mx-auto px-6 md:px-12">
              <h2 className="text-4xl font-extrabold text-center mb-12">
                Latest News
              </h2>
              <div className="grid md:grid-cols-3 gap-12">
                <NewsCard
                  title="New GAD Policy Implemented"
                  date="April 28, 2024"
                  excerpt="The local government has approved a new Gender and Development policy aimed at promoting equality in all sectors."
                  image="/placeholder.svg"
                />
                <NewsCard
                  title="Successful Women's Leadership Summit"
                  date="April 15, 2024"
                  excerpt="Over 500 participants attended our annual Women's Leadership Summit, featuring inspiring speakers and workshops."
                  image="/placeholder.svg"
                />
                <NewsCard
                  title="GAD Office Receives Recognition"
                  date="March 30, 2024"
                  excerpt="Our office has been awarded for its outstanding contributions to gender equality and community developmen"
                  image="/placeholder.svg"
                />
              </div>
              <div className="mt-8 text-center">
                <Button onClick={() => setShowChart(true)}>View Chart</Button>
              </div>
              <Dialog open={showChart} onOpenChange={setShowChart}>
                <DialogContent className="sm:max-w-[800px]">
                  <DialogHeader>
                    <DialogTitle>Employees by Department</DialogTitle>
                  </DialogHeader>
                  <div className="h-[300px] mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <XAxis dataKey="department" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="employees" fill="#8884d8" name="Employees" />
                        <Bar dataKey="students" fill="#82ca9d" name="Students" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </section>
        );
      }
      function NewsCard({ title, date, excerpt, image }) {
        return (
          <Card className="shadow-lg rounded-lg overflow-hidden">
            <CardContent className="p-4">
              <Image
                src={image}
                alt={title}
                width={400}
                height={200}
                className="rounded-lg mb-2"
              />
              <h3 className="text-xl font-semibold mb-1">{title}</h3>
              <p className="text-sm mb-1">{date}</p>
              <p className="text-sm mb-2">{excerpt}</p>
              <Button
                variant="outline"
                className="transition-all"
                onClick={() => toast.info("Full article coming soon!")}
              >
                Read More
              </Button>
            </CardContent>
          </Card>
        );
      }
