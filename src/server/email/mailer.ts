import { ApiError } from "@/server/api/errors";

type VerificationMail = {
  to: string;
  code: string;
  purpose: "EMAIL_VERIFY" | "PASSWORD_RESET";
};

export async function sendVerificationEmail(input: VerificationMail) {
  const subject = input.purpose === "EMAIL_VERIFY" ? "StockSense email verification" : "StockSense password reset";
  const action = input.purpose === "EMAIL_VERIFY" ? "verify your email" : "reset your password";
  const text = [
    "StockSense",
    "",
    `Use this code to ${action}: ${input.code}`,
    "The code expires in 10 minutes and can be used once.",
    "Do not share this code with anyone.",
  ].join("\n");

  if (!smtpConfigured()) {
    if (process.env.NODE_ENV === "production") {
      throw new ApiError(503, "EMAIL_NOT_CONFIGURED", "Email delivery is not configured.");
    }

    console.info(`[DEV EMAIL VERIFICATION] to=${input.to} purpose=${input.purpose} code=${input.code}`);
    return;
  }

  try {
    const { createTransport } = await import("nodemailer");
    const transport = createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    await transport.sendMail({
      from: process.env.SMTP_FROM,
      to: input.to,
      subject,
      text,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(503, "EMAIL_DELIVERY_FAILED", "The verification email could not be sent. Try again.");
  }
}

function smtpConfigured() {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASSWORD &&
      process.env.SMTP_FROM,
  );
}
