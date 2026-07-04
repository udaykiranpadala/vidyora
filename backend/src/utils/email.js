import axios from "axios";

const getApiKey = () => {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    throw new Error("Missing BREVO_API_KEY in environment variables");
  }
  return apiKey;
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

  const apiKey = getApiKey();
  const senderEmail = process.env.EMAIL_USER || "udaykiranpadala1818@gmail.com";

  await axios.post(
    "https://api.brevo.com/v3/smtp/email",
    {
      sender: { name: "Vidyora", email: senderEmail },
      to: [{ email: toEmail }],
      subject: "Your verification code",
      htmlContent: baseTemplate("Verify your email", otp, "#4F46E5"),
    },
    {
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
        "accept": "application/json",
      },
    }
  );
};

export const sendResetOtpEmail = async (toEmail, otp) => {
  // Print OTP to console for easy local development/testing
  console.log(`[DEVELOPMENT] Password Reset OTP for ${toEmail}: ${otp}`);

  const apiKey = getApiKey();
  const senderEmail = process.env.EMAIL_USER || "udaykiranpadala1818@gmail.com";

  await axios.post(
    "https://api.brevo.com/v3/smtp/email",
    {
      sender: { name: "Vidyora", email: senderEmail },
      to: [{ email: toEmail }],
      subject: "Reset your password verification code",
      htmlContent: baseTemplate("Reset your password", otp, "#EF4444"),
    },
    {
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
        "accept": "application/json",
      },
    }
  );
};
