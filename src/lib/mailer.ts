import nodemailer from "nodemailer";

function getTransporter() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) {
    throw new Error("GMAIL_USER / GMAIL_APP_PASSWORD орчны хувьсагч тохируулаагүй байна (.env.local)");
  }
  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
}

export async function sendVerificationEmail(to: string, verifyUrl: string) {
  const transporter = getTransporter();
  await transporter.sendMail({
    from: `"Login System" <${process.env.GMAIL_USER}>`,
    to,
    subject: "Имэйл хаягаа баталгаажуулна уу",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Имэйл хаягаа баталгаажуулах</h2>
        <p>Бүртгэлээ ашиглахын өмнө имэйл хаягаа баталгаажуулна уу. Доорх товч дээр дарна уу.</p>
        <p style="margin: 24px 0;">
          <a href="${verifyUrl}" style="background:#111827;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;">
            Имэйл баталгаажуулах
          </a>
        </p>
        <p style="color:#666;font-size:13px;">
          Энэ холбоос 24 цагийн дараа хүчингүй болно. Хэрэв та бүртгүүлээгүй бол энэ имэйлийг үл тоомсорлоно уу.
        </p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  const transporter = getTransporter();
  await transporter.sendMail({
    from: `"Login System" <${process.env.GMAIL_USER}>`,
    to,
    subject: "Нууц үг сэргээх хүсэлт",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Нууц үг сэргээх</h2>
        <p>Та нууц үгээ сэргээх хүсэлт илгээсэн байна. Доорх товч дээр дарж шинэ нууц үг тохируулна уу.</p>
        <p style="margin: 24px 0;">
          <a href="${resetUrl}" style="background:#111827;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;">
            Нууц үг сэргээх
          </a>
        </p>
        <p style="color:#666;font-size:13px;">
          Энэ холбоос 1 цагийн дараа хүчингүй болно. Хэрэв та энэ хүсэлтийг илгээгээгүй бол энэ имэйлийг үл тоомсорлоно уу.
        </p>
      </div>
    `,
  });
}
