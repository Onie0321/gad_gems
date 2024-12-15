import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
  } from "@/components/ui/dialog"
  import { StatisticChart } from '@/components/statistic/chart'
  import { StatisticTable } from '@/components/statistic/table'
  import { PieChart3D } from '@/components/statistic/3dpiechart'

  export function StatisticModal({ isOpen, onClose, title, data }) {
    const isPieChart = title === "Number of Employees by Sex"

    const pieChartData = isPieChart
    ? data.map(item => ({
        category: item.category,
        value: item.male || item.female || item.value || 0,
        color: item.category === 'Male' ? 'hsl(210, 100%, 50%)' : 'hsl(350, 100%, 70%)'
      }))
    : []
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {title === "Number of Employees by Sex" ? (
              <StatisticChart data={data} type="pie" />
            ) : (
              <StatisticChart data={data} />
            )}
            <StatisticTable data={data} />
          </div>
        </DialogContent>
      </Dialog>
    )
  }
  
  