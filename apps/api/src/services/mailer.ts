import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const APP_URL = process.env.APP_URL ?? 'http://localhost:5173';
const FROM    = process.env.SMTP_FROM ?? 'TransitOps <noreply@transitops.io>';

function base(title: string, body: string) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#1A1C22;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#1A1C22;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#22252D;border-radius:12px;border:1px solid #353840;overflow:hidden;">
        <!-- Header -->
        <tr>
          <td style="background:#22252D;padding:28px 36px;border-bottom:1px solid #353840;">
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:#D68910;width:36px;height:36px;border-radius:8px;text-align:center;vertical-align:middle;">
                  <span style="color:#fff;font-weight:900;font-size:18px;line-height:36px;">T</span>
                </td>
                <td style="padding-left:12px;color:#F0F0F0;font-weight:700;font-size:17px;letter-spacing:-0.3px;">TransitOps</td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:32px 36px;">
            <h2 style="margin:0 0 16px;color:#F0F0F0;font-size:20px;font-weight:700;">${title}</h2>
            ${body}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:20px 36px;border-top:1px solid #353840;color:#A0A8B8;font-size:12px;">
            TransitOps Fleet Management · This is an automated message, please do not reply.
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function p(text: string) {
  return `<p style="margin:0 0 14px;color:#A0A8B8;font-size:15px;line-height:1.6;">${text}</p>`;
}

function btn(text: string, url: string) {
  return `
  <table cellpadding="0" cellspacing="0" style="margin:24px 0;">
    <tr>
      <td style="background:#D68910;border-radius:8px;">
        <a href="${url}" style="display:inline-block;padding:12px 28px;color:#fff;font-weight:600;font-size:14px;text-decoration:none;">${text}</a>
      </td>
    </tr>
  </table>`;
}

// 1. To user — registration request received
export async function sendRequestReceived(to: string, name: string) {
  await transporter.sendMail({
    from: FROM, to,
    subject: 'TransitOps — Registration Request Received',
    html: base('Request Received', `
      ${p(`Hi <strong style="color:#F0F0F0;">${name}</strong>,`)}
      ${p('Your registration request for a Fleet Manager account on TransitOps has been submitted successfully.')}
      ${p('An administrator will review your request and you\'ll receive an email once a decision has been made.')}
      ${p('If you did not make this request, please ignore this email.')}
    `),
  });
}

// 2. To admin — new registration request to review
export async function sendAdminNewRequest(adminEmail: string, name: string, email: string) {
  await transporter.sendMail({
    from: FROM, to: adminEmail,
    subject: `TransitOps — New Registration Request from ${name}`,
    html: base('New Registration Request', `
      ${p(`A new Fleet Manager account request has been submitted and is awaiting your review.`)}
      <table style="margin:0 0 20px;border:1px solid #353840;border-radius:8px;overflow:hidden;width:100%;">
        <tr style="border-bottom:1px solid #353840;">
          <td style="padding:10px 16px;color:#A0A8B8;font-size:13px;width:100px;">Name</td>
          <td style="padding:10px 16px;color:#F0F0F0;font-size:13px;font-weight:600;">${name}</td>
        </tr>
        <tr>
          <td style="padding:10px 16px;color:#A0A8B8;font-size:13px;">Email</td>
          <td style="padding:10px 16px;color:#F0F0F0;font-size:13px;font-weight:600;">${email}</td>
        </tr>
      </table>
      ${btn('Review Request', `${APP_URL}/settings`)}
    `),
  });
}

// 3. To user — request approved
export async function sendRequestApproved(to: string, name: string) {
  await transporter.sendMail({
    from: FROM, to,
    subject: 'TransitOps — Your Account Has Been Approved!',
    html: base('Account Approved 🎉', `
      ${p(`Hi <strong style="color:#F0F0F0;">${name}</strong>,`)}
      ${p('Great news! Your registration request has been <strong style="color:#4ade80;">approved</strong>. Your Fleet Manager account is now active.')}
      ${p('You can log in using the email address and password you registered with.')}
      ${btn('Log In to TransitOps', `${APP_URL}/login`)}
      ${p('If you have any issues logging in, please contact your administrator.')}
    `),
  });
}

// 4. To user — request rejected
export async function sendRequestRejected(to: string, name: string, reason?: string) {
  await transporter.sendMail({
    from: FROM, to,
    subject: 'TransitOps — Registration Request Update',
    html: base('Request Not Approved', `
      ${p(`Hi <strong style="color:#F0F0F0;">${name}</strong>,`)}
      ${p('Unfortunately, your registration request for a TransitOps Fleet Manager account has not been approved at this time.')}
      ${reason ? `<div style="margin:0 0 14px;padding:14px 16px;background:#2E3240;border-left:3px solid #f87171;border-radius:4px;color:#A0A8B8;font-size:14px;">${reason}</div>` : ''}
      ${p('If you believe this is a mistake, please contact your administrator directly.')}
    `),
  });
}

// 5. To user — account created by Fleet Manager with temp password
export async function sendTempPassword(to: string, name: string, tempPassword: string) {
  await transporter.sendMail({
    from: FROM, to,
    subject: 'TransitOps — Your Account Has Been Created',
    html: base('Welcome to TransitOps', `
      ${p(`Hi <strong style="color:#F0F0F0;">${name}</strong>,`)}
      ${p('A TransitOps account has been created for you. Use the credentials below to log in.')}
      <table style="margin:0 0 20px;border:1px solid #353840;border-radius:8px;overflow:hidden;width:100%;">
        <tr style="border-bottom:1px solid #353840;">
          <td style="padding:10px 16px;color:#A0A8B8;font-size:13px;width:120px;">Email</td>
          <td style="padding:10px 16px;color:#F0F0F0;font-size:13px;font-weight:600;">${to}</td>
        </tr>
        <tr>
          <td style="padding:10px 16px;color:#A0A8B8;font-size:13px;">Temp Password</td>
          <td style="padding:10px 16px;color:#D68910;font-size:13px;font-weight:700;letter-spacing:1px;">${tempPassword}</td>
        </tr>
      </table>
      ${p('You will be asked to set a new password on your first login.')}
      ${btn('Log In Now', `${APP_URL}/login`)}
    `),
  });
}
