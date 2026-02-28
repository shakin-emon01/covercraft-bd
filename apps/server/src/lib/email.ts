import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendWelcomeEmail = async (to: string, name: string) => {
  const mailOptions = {
    from: '"CoverCraft BD" <noreply@covercraftbd.com>',
    to,
    subject: 'Welcome to CoverCraft BD! 🎉',
    html: `<h2>Hi ${name}, welcome aboard!</h2><p>You can now create premium assignment covers in seconds.</p>`,
  };

  return transporter.sendMail(mailOptions);
};

/**
 * Send email verification code
 */
export const sendEmailVerificationCode = async (to: string, name: string, code: string) => {
  const mailOptions = {
    from: '"CoverCraft BD" <noreply@covercraftbd.com>',
    to,
    subject: 'Verify Your Email - CoverCraft BD',
    html: `
      <h2>Verify Your Email</h2>
      <p>Hi ${name},</p>
      <p>Thank you for registering with CoverCraft BD. Please verify your email using the code below:</p>
      <div style="background-color: #f0f0f0; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin: 0; color: #333; letter-spacing: 2px;">${code}</h3>
      </div>
      <p>This code will expire in 10 minutes.</p>
      <p>If you didn't register, please ignore this email.</p>
    `,
  };

  return transporter.sendMail(mailOptions);
};

/**
 * Send password reset OTP
 */
export const sendOTPEmail = async (to: string, name: string, otp: string) => {
  const mailOptions = {
    from: '"CoverCraft BD" <noreply@covercraftbd.com>',
    to,
    subject: 'Password Reset OTP - CoverCraft BD',
    html: `
      <h2>Password Reset Request</h2>
      <p>Hi ${name},</p>
      <p>We received a request to reset your password. Use the OTP below to proceed:</p>
      <div style="background-color: #f0f0f0; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin: 0; color: #333; letter-spacing: 2px;">${otp}</h3>
      </div>
      <p>This OTP will expire in 15 minutes.</p>
      <p>If you didn't request a password reset, please ignore this email and your password will remain unchanged.</p>
    `,
  };

  return transporter.sendMail(mailOptions);
};

/**
 * Send password reset link
 */
export const sendPasswordResetEmail = async (to: string, name: string, resetToken: string) => {
  const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;

  const mailOptions = {
    from: '"CoverCraft BD" <noreply@covercraftbd.com>',
    to,
    subject: 'Reset Your Password - CoverCraft BD',
    html: `
      <h2>Password Reset</h2>
      <p>Hi ${name},</p>
      <p>Click the link below to reset your password:</p>
      <div style="margin: 20px 0;">
        <a href="${resetLink}" style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; display: inline-block;">
          Reset Password
        </a>
      </div>
      <p>Or copy this link: <a href="${resetLink}">${resetLink}</a></p>
      <p>This link will expire in 15 minutes.</p>
      <p>If you didn't request a password reset, please ignore this email.</p>
    `,
  };

  return transporter.sendMail(mailOptions);
};

/**
 * Send session alert (new login from different device)
 */
export const sendSessionAlertEmail = async (to: string, name: string, deviceName: string, ipAddress: string) => {
  const mailOptions = {
    from: '"CoverCraft BD" <noreply@covercraftbd.com>',
    to,
    subject: 'New Login Alert - CoverCraft BD',
    html: `
      <h2>New Login Detected</h2>
      <p>Hi ${name},</p>
      <p>A new login was detected on your account:</p>
      <ul style="background-color: #f0f0f0; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <li><strong>Device:</strong> ${deviceName}</li>
        <li><strong>IP Address:</strong> ${ipAddress}</li>
        <li><strong>Time:</strong> ${new Date().toLocaleString()}</li>
      </ul>
      <p>If this wasn't you, please <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/settings/sessions">review your active sessions</a> and revoke unauthorized access.</p>
    `,
  };

  return transporter.sendMail(mailOptions);
};
