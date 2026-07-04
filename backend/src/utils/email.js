import nodemailer from "nodemailer";

const getTransporter = () => {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  if (!user || !pass) {
    throw new Error("Missing EMAIL_USER or EMAIL_PASS in environment variables");
  }
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user,
      pass,
    },
  });
};

const baseTemplate = (title, otp, color) => `
  <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto;">
    <h2 style="color: ${color};">${title}</h2>
    <p>Use the code below:</p>
    <div style="font-size: 32px; font-weight: bold; letter-spacing: 4px; background: #F3F4F6; padding: 16px; text-align: center; border-radius: 8px;">
      ${otp}
    </div>
    <p style="color: #6B7280; font-size: 14px;">
      This code expires in 10 minutes. If you didn’t request this, ignore it.
    </p>
  </div>
`;

export const sendOtpEmail = async (toEmail, otp) => {
  // Print OTP to console for easy local development/testing
  console.log(`[DEVELOPMENT] Signup OTP for ${toEmail}: ${otp}`);

  const transporter = getTransporter();
  await transporter.sendMail({
    from: `"Vidyora" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "Your verification code",
    html: baseTemplate("Verify your email", otp, "#4F46E5"),
  });
};

export const sendResetOtpEmail = async (toEmail, otp) => {
  // Print OTP to console for easy local development/testing
  console.log(`[DEVELOPMENT] Password Reset OTP for ${toEmail}: ${otp}`);

  const transporter = getTransporter();
  await transporter.sendMail({
    from: `"Vidyora" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "Reset your password verification code",
    html: baseTemplate("Reset your password", otp, "#EF4444"),
  });
};
