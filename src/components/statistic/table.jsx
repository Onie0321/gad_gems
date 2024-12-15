import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from "@/components/ui/table"
  
  export function StatisticTable({ data }) {
    const totalMale = data.reduce((sum, item) => sum + (item.male || item.value || 0), 0)
    const totalFemale = data.reduce((sum, item) => sum + (item.female || 0), 0)
    const totalTotal = totalMale + totalFemale
  
    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40%]">Category</TableHead>
              <TableHead className="w-[20%]">Male</TableHead>
              <TableHead className="w-[20%]">Female</TableHead>
              <TableHead className="w-[20%]">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item, index) => (
              <TableRow key={index}>
                <TableCell>{item.category}</TableCell>
                <TableCell>{item.male || item.value || 0}</TableCell>
                <TableCell>{item.female || 0}</TableCell>
                <TableCell>{(item.male || item.value || 0) + (item.female || 0)}</TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell className="font-bold">Total</TableCell>
              <TableCell className="font-bold">{totalMale}</TableCell>
              <TableCell className="font-bold">{totalFemale}</TableCell>
              <TableCell className="font-bold">{totalTotal}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    )
  }
  
  