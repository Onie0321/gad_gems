import nodemailer from 'nodemailer';

// Create a transporter object using Gmail SMTP
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // Your Gmail address
    pass: process.env.EMAIL_PASS, // Your Gmail password or app-specific password
  },
});

// Function to send an email
export const sendEmail = async ({ to, subject, text }) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER, // Sender address
      to,                          // Recipient address
      subject,                     // Email subject
      text,                        // Plain text body
      // html: '<p>HTML content</p>', // Optional HTML body
    };

    // Send the email
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.response);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};