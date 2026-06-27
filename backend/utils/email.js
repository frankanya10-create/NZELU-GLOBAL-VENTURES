const nodemailer = require('nodemailer');

let transporter = null;
let etherealUrl = null;

async function getTransporter() {
  if (transporter) return transporter;

  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    return transporter;
  }

  const testAccount = await nodemailer.createTestAccount();
  transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
  etherealUrl = 'https://ethereal.email';
  console.log(`\n  [Email] Using Ethereal test account: ${testAccount.user}`);
  console.log(`  [Email] View captured emails at: https://ethereal.email\n`);
  return transporter;
}

async function sendCredentialsEmail({ name, email, username, password, role }) {
  const roleLabel = role.charAt(0).toUpperCase() + role.slice(1);

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; background: #f9fafb; border-radius: 16px;">
      <div style="text-align: center; margin-bottom: 28px;">
        <div style="display: inline-block; width: 48px; height: 48px; background: #166534; border-radius: 12px; line-height: 48px; color: white; font-size: 22px; font-weight: bold;">N</div>
        <h1 style="color: #111827; font-size: 22px; margin: 12px 0 4px;">Welcome to NGV ERP</h1>
        <p style="color: #6b7280; font-size: 14px; margin: 0;">Your account has been created</p>
      </div>

      <div style="background: white; border-radius: 12px; padding: 24px; margin-bottom: 20px;">
        <p style="color: #374151; font-size: 14px; margin: 0 0 16px;">Hi <strong>${name}</strong>,</p>
        <p style="color: #6b7280; font-size: 13px; margin: 0 0 16px; line-height: 1.5;">
          An administrator has created your NGV ERP account. Use the credentials below to sign in.
        </p>

        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px 0; color: #9ca3af; font-size: 12px;">Name</td><td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${name}</td></tr>
          <tr><td style="padding: 8px 0; color: #9ca3af; font-size: 12px; border-top: 1px solid #f3f4f6;">Email</td><td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600; text-align: right; border-top: 1px solid #f3f4f6;">${email}</td></tr>
          <tr><td style="padding: 8px 0; color: #9ca3af; font-size: 12px; border-top: 1px solid #f3f4f6;">Username</td><td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600; text-align: right; border-top: 1px solid #f3f4f6;">${username}</td></tr>
          <tr><td style="padding: 8px 0; color: #9ca3af; font-size: 12px; border-top: 1px solid #f3f4f6;">Password</td><td style="padding: 8px 0; color: #dc2626; font-size: 14px; font-weight: 700; text-align: right; border-top: 1px solid #f3f4f6;">${password}</td></tr>
          <tr><td style="padding: 8px 0; color: #9ca3af; font-size: 12px; border-top: 1px solid #f3f4f6;">Role</td><td style="padding: 8px 0; color: #166534; font-size: 14px; font-weight: 600; text-align: right; border-top: 1px solid #f3f4f6;">${roleLabel}</td></tr>
        </table>
      </div>

      <div style="background: #fef3c7; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
        <p style="color: #92400e; font-size: 12px; margin: 0; line-height: 1.5;">
          <strong>Security notice:</strong> This is a system-generated password. After your first login, please change it immediately in your account Settings page. Do not share these credentials.
        </p>
      </div>

      <p style="color: #9ca3af; font-size: 11px; text-align: center; margin: 0;">
        NGV ERP — Tarpaulins · Carpets · Centre Rugs · Artificial Grass · Tent Installations
      </p>
    </div>
  `;

  const mailOptions = {
    from: `"NGV ERP" <${process.env.EMAIL_USER || 'noreply@ngv.com'}>`,
    to: email,
    subject: `Welcome to NGV ERP — Your ${roleLabel} Account`,
    html,
  };

  const transport = await getTransporter();
  const info = await transport.sendMail(mailOptions);

  console.log(`\n  [Email] Credentials sent to: ${email}`);
  console.log(`  [Email] Message ID: ${info.messageId}`);

  if (!process.env.EMAIL_USER && info.messageId) {
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`  [Email] Preview URL: ${previewUrl}\n`);
    }
  }
}

module.exports = { sendCredentialsEmail };
