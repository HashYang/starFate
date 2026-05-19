import nodemailer from 'nodemailer';
import { config } from '../config';

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (transporter) return transporter;

  const { smtp } = config;
  if (!smtp.host || !smtp.user || !smtp.pass) {
    return null;
  }

  transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.port === 465,
    auth: { user: smtp.user, pass: smtp.pass },
  });

  return transporter;
}

export async function sendVerificationCodeEmail(email: string, code: string): Promise<void> {
  const t = getTransporter();

  if (!t) {
    console.log(`\n========================================`);
    console.log(`📧 验证码邮件 (SMTP 未配置，仅输出到控制台)`);
    console.log(`   收件人: ${email}`);
    console.log(`   验证码: ${code}`);
    console.log(`   有效期: 10 分钟`);
    console.log(`========================================\n`);
    return;
  }

  await t.sendMail({
    from: config.smtp.from,
    to: email,
    subject: '星命 - 验证码',
    text: `您的验证码是: ${code}\n有效期 10 分钟，请勿泄露给他人。`,
    html: `
      <div style="max-width:480px;margin:0 auto;padding:32px 24px;font-family:'PingFang SC',sans-serif;background:#fefcf9;">
        <div style="text-align:center;margin-bottom:32px;">
          <span style="font-size:24px;letter-spacing:0.15em;color:#c4835a;">星命</span>
        </div>
        <div style="background:#fff;border-radius:16px;padding:32px 24px;border:1px solid #eee6dc;">
          <p style="margin:0 0 8px;font-size:14px;color:#2c2416;">您的验证码是：</p>
          <div style="text-align:center;margin:24px 0;">
            <span style="font-size:36px;letter-spacing:8px;font-weight:700;color:#c4835a;">${code}</span>
          </div>
          <p style="margin:0;font-size:12px;color:#a89888;">有效期 10 分钟，请勿泄露给他人。</p>
          <p style="margin:16px 0 0;font-size:12px;color:#a89888;">如果您没有请求此验证码，请忽略此邮件。</p>
        </div>
      </div>
    `,
  });
}
