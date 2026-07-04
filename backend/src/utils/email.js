import nodemailer from "nodemailer";

const createTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error("Missing email credentials: set EMAIL_USER and EMAIL_PASS in .env");
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

export const sendOtpEmail = async (toEmail, otp) => {
  const transporter = createTransporter();

  await transporter.sendMail({
    from: `"Exam Platform" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "Your verification code",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto;">
        <h2 style="color: #4F46E5;">Verify your email</h2>
        <p>Use the code below to verify your email and create your organizer account:</p>
        <div style="font-size: 32px; font-weight: bold; letter-spacing: 4px; background: #F3F4F6; padding: 16px; text-align: center; border-radius: 8px;">
          ${otp}
        </div>
        <p style="color: #6B7280; font-size: 14px;">This code expires in 10 minutes. If you didn't request this, you can ignore this email.</p>
      </div>
    `,
  });
};

export const sendResetOtpEmail = async (toEmail, otp) => {
  const transporter = createTransporter();

  await transporter.sendMail({
    from: `"Exam Platform" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "Reset your password verification code",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto;">
        <h2 style="color: #EF4444;">Reset your password</h2>
        <p>Use the code below to reset your password:</p>
        <div style="font-size: 32px; font-weight: bold; letter-spacing: 4px; background: #F3F4F6; padding: 16px; text-align: center; border-radius: 8px;">
          ${otp}
        </div>
        <p style="color: #6B7280; font-size: 14px;">This code expires in 10 minutes. If you didn't request this, you can ignore this email.</p>
      </div>
    `,
  });
};
