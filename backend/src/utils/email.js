import { Resend } from "resend";

const getResend = () => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("Missing RESEND_API_KEY in environment variables");
  }
  return new Resend(apiKey);
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
  const resend = getResend();

  await resend.emails.send({
    from: "Vidyora - Exam Platform <onboarding@resend.dev>",
    to: toEmail,
    subject: "Your verification code",
    html: baseTemplate("Verify your email", otp, "#4F46E5"),
  });
};

export const sendResetOtpEmail = async (toEmail, otp) => {
  const resend = getResend();

  await resend.emails.send({
    from: "Vidyora - Exam Platform <onboarding@resend.dev>",
    to: toEmail,
    subject: "Reset your password verification code",
    html: baseTemplate("Reset your password", otp, "#EF4444"),
  });
};
