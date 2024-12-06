import StudentInfoTabs from '@/components/student/form'

export default function StudentRegistrationPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Student Registration Form</h1>
      <StudentInfoTabs />
    </div>
  )
}