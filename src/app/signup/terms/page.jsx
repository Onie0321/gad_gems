import { X } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function TermsAndConditions({ onClose }) {  return (
    <Card className="w-full max-w-4xl mx-auto relative">
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-2 top-2"
        aria-label="Close"
        onClick={onClose}
      >
        <X className="h-4 w-4" />
      </Button>
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Terms and Conditions</CardTitle>
      </CardHeader>
      <CardContent className="prose prose-sm max-w-none">
        <p><strong>Effective Date:</strong> [Insert Date]</p>
        <p><strong>System Name:</strong> GADConnect: Streamlining Event Management and Demographic Analysis for Gender and Development Initiatives</p>

        <h2>1. Introduction</h2>
        <p>Welcome to GADConnect. These Terms and Conditions govern your use of the system, which is designed to streamline event management and demographic analysis for Gender and Development (GAD) initiatives. By accessing or using the system, you agree to comply with and be bound by these Terms.</p>

        <h2>2. Definitions</h2>
        <ul>
          <li><strong>"System"</strong> refers to GADConnect, including all its features, functionalities, and services.</li>
          <li><strong>"User"</strong> refers to individuals or organizations accessing the system.</li>
          <li><strong>"Content"</strong> refers to any data, text, images, or information inputted, generated, or managed within the system.</li>
          <li><strong>"Administrator"</strong> refers to system personnel with administrative access.</li>
        </ul>

        <h2>3. User Responsibilities</h2>
        <h3>3.1 Account Registration</h3>
        <ul>
          <li>Users must provide accurate and complete information during registration.</li>
          <li>Each account is for a single user and cannot be shared with others.</li>
        </ul>

        <h3>3.2 Acceptable Use</h3>
        <p>Users must use the system only for purposes related to GAD event management and demographic analysis.</p>
        <p>Prohibited activities include:</p>
        <ul>
          <li>Uploading malicious software, viruses, or inappropriate content.</li>
          <li>Unauthorized access to other users' data or accounts.</li>
          <li>Misuse of system features for non-GAD-related purposes.</li>
        </ul>

        <h3>3.3 Data Accuracy</h3>
        <p>Users are responsible for the accuracy and reliability of any information entered into the system.</p>

        <h2>4. System Access and Availability</h2>
        <ol>
          <li>GADConnect may experience downtime for maintenance or updates. Prior notice will be provided where possible.</li>
          <li>The system reserves the right to restrict or terminate access to users who violate these Terms.</li>
        </ol>

        <h2>5. Data Privacy and Security</h2>
        <ol>
          <li>GADConnect adheres to applicable data protection laws to ensure the privacy of user data.</li>
          <li>All personal and demographic data collected will only be used for:
            <ul>
              <li>Event management</li>
              <li>Statistical analysis and reporting</li>
              <li>Improving Gender and Development initiatives.</li>
            </ul>
          </li>
          <li>Users' data will not be shared with third parties without prior consent unless required by law.</li>
        </ol>

        <h2>6. Intellectual Property</h2>
        <ol>
          <li>The system's design, code, and content are the intellectual property of the system's developers.</li>
          <li>Users retain ownership of any data or content they upload to GADConnect.</li>
          <li>Unauthorized use, reproduction, or modification of system features or content is strictly prohibited.</li>
        </ol>

        <h2>7. Limitation of Liability</h2>
        <p>GADConnect and its developers will not be held liable for:</p>
        <ul>
          <li>Loss of data due to user actions, system errors, or unforeseen events.</li>
          <li>Unauthorized access resulting from user negligence (e.g., weak passwords).</li>
          <li>Inaccuracies in reports or analysis caused by incorrect user input.</li>
        </ul>

        <h2>8. Modification of Terms</h2>
        <p>GADConnect reserves the right to modify these Terms at any time. Updates will be communicated to users, and continued use of the system after modifications indicates acceptance of the new Terms.</p>

        <h2>9. Termination of Access</h2>
        <p>GADConnect may terminate or suspend user access for:</p>
        <ul>
          <li>Breach of these Terms and Conditions.</li>
          <li>Unauthorized or malicious activities.</li>
          <li>Any other action that compromises the integrity of the system.</li>
        </ul>

        <h2>10. Governing Law</h2>
        <p>These Terms are governed by the laws of [Insert Jurisdiction]. Any disputes arising will be resolved under the jurisdiction of [Insert Court/Authority].</p>

        <h2>11. Contact Information</h2>
        <p>For inquiries, support, or reporting violations of these Terms, please contact:</p>
        <p>
          Email: [Insert Email Address]<br />
          Phone: [Insert Phone Number]<br />
          Address: [Insert Office Address]
        </p>
      </CardContent>
    </Card>
  )
}

