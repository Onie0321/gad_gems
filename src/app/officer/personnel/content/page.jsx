import { useState, useEffect } from 'react'
import { StatisticSection } from '../section/page'
import { DashboardHeader } from '../header/page'

const fetchData = (date, categories) => {
    // In a real application, this would be an API call
    // For now, we'll just return the same data regardless of filters
    return {
      totalEmployees: 1000,
      maleEmployees: 550,
      femaleEmployees: 450,
      sections: [
        {
          title: "Number of Employees by Sex",
          data: [
            { category: 'Male', male: 550 },
            { category: 'Female', female: 450 },
          ]
        },
        {
          title: "Number of Employees by Civil Status (Teaching and Non-Teaching)",
          data: [
            { category: 'Teaching', male: 200, female: 180 },
            { category: 'Non-Teaching', male: 350, female: 270 },
          ]
        },
        {
          title: "Number of Employees per Management Type",
          data: [
            { category: 'Top Management', male: 50, female: 30 },
            { category: 'Middle Management', male: 100, female: 80 },
            { category: 'Administrative and Support', male: 400, female: 340 },
          ]
        },
        {
          title: "Number of Employees in Specific Categories",
          data: [
            { category: 'Differently-abled', male: 20, female: 15 },
            { category: 'Indigenous Peoples (IP) Groups', male: 30, female: 25 },
            { category: 'Solo Parents', male: 40, female: 60 },
            { category: 'With children below 7 years old', male: 100, female: 120 },
            { category: 'With differently-abled children', male: 10, female: 15 },
          ]
        },
        {
          title: "Number of Employees by Employment Status",
          data: [
            { category: 'Permanent', male: 400, female: 350 },
            { category: 'Contractual', male: 80, female: 60 },
            { category: 'Temporary', male: 40, female: 30 },
            { category: 'Job Order', male: 20, female: 10 },
            { category: 'Part-Time', male: 10, female: 0 },
          ]
        },
        {
          title: "Number of Employees by Educational Attainment",
          data: [
            { category: "Bachelor's Degree", male: 300, female: 250 },
            { category: "Master's Degree", male: 150, female: 130 },
            { category: 'Doctorate Degree', male: 80, female: 60 },
            { category: 'Others', male: 20, female: 10 },
          ]
        }
      ]
    }
  }
  

export function DashboardContent() {
    const [filters, setFilters] = useState({ date: undefined, categories: ["all"] })
    const [data, setData] = useState(fetchData(filters.date, filters.categories))
  
    useEffect(() => {
      const newData = fetchData(filters.date, filters.categories)
      setData(newData)
    }, [filters])
  
    const handleFilterChange = (newFiltersx) => {
      setFilters(newFilters)
    }
  
    return (
      <div className="space-y-6">
        <DashboardHeader
          totalEmployees={data.totalEmployees}
          maleEmployees={data.maleEmployees}
          femaleEmployees={data.femaleEmployees}
          onFilterChange={handleFilterChange}
        />
        <div className="grid gap-6 md:grid-cols-2">
          {data.sections.slice(0, 2).map((section, index) => (
            <StatisticSection key={index} title={section.title} data={section.data} />
          ))}
        </div>
        <div className="space-y-6">
          {data.sections.slice(2).map((section, index) => (
            <StatisticSection key={index} title={section.title} data={section.data} />
          ))}
        </div>
      </div>
    )
  }
  
  