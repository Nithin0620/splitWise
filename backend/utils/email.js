const { Resend } = require('resend');

// ─── HTML Template ───────────────────────────────────────────────────────────

/**
 * Generates the full HTML email for a trip invitation.
 *
 * @param {object} params
 * @param {string} params.inviterName   - Name of the person sending the invite
 * @param {string} params.inviterAvatar - Avatar URL of the inviter (optional)
 * @param {string} params.tripName      - Name of the trip
 * @param {string} params.currency      - Trip currency (e.g. "INR")
 * @param {string} params.memberCount   - Number of existing trip members
 * @param {string} params.inviteUrl     - Full URL the recipient should visit to accept
 * @param {string} params.expiresIn     - Human-readable expiry string (e.g. "48 hours")
 */
const buildInviteHtml = ({
  inviterName,
  inviterAvatar,
  tripName,
  currency,
  memberCount,
  inviteUrl,
  expiresIn = '48 hours',
}) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>You're invited to ${tripName}</title>
  <!--[if mso]>
  <noscript>
    <xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml>
  </noscript>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#f0f4f8;font-family:'Segoe UI',Arial,sans-serif;">

  <!-- Outer wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" border="0"
         style="background-color:#f0f4f8;padding:40px 16px;">
    <tr>
      <td align="center">

        <!-- Card -->
        <table width="600" cellpadding="0" cellspacing="0" border="0"
               style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;
                      overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- ── Hero Banner ── -->
          <tr>
            <td style="background:linear-gradient(135deg,#6366f1 0%,#8b5cf6 50%,#a78bfa 100%);
                        padding:48px 40px 40px;text-align:center;">

              <!-- App logo / wordmark -->
              <div style="display:inline-flex;align-items:center;gap:10px;margin-bottom:28px;">
                <span style="background:rgba(255,255,255,0.2);border-radius:12px;
                             padding:8px 12px;display:inline-block;">
                  <span style="font-size:22px;">✈️</span>
                </span>
                <span style="color:#ffffff;font-size:22px;font-weight:700;
                             letter-spacing:-0.5px;">SplitWise</span>
              </div>

              <!-- Inviter avatar -->
              ${inviterAvatar
    ? `<img src="${inviterAvatar}" alt="${inviterName}"
             width="72" height="72"
             style="border-radius:50%;border:3px solid rgba(255,255,255,0.6);
                    display:block;margin:0 auto 16px;" />`
    : `<div style="width:72px;height:72px;border-radius:50%;
                   background:rgba(255,255,255,0.25);border:3px solid rgba(255,255,255,0.6);
                   margin:0 auto 16px;display:flex;align-items:center;justify-content:center;
                   font-size:28px;color:#fff;font-weight:700;">
         ${inviterName.charAt(0).toUpperCase()}
       </div>`}

              <h1 style="margin:0 0 8px;color:#ffffff;font-size:26px;font-weight:700;
                          line-height:1.3;">
                You're invited! 🎉
              </h1>
              <p style="margin:0;color:rgba(255,255,255,0.85);font-size:16px;line-height:1.5;">
                <strong>${inviterName}</strong> wants you to join their trip on SplitWise
              </p>
            </td>
          </tr>

          <!-- ── Trip Card ── -->
          <tr>
            <td style="padding:32px 40px 0;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0"
                     style="background:linear-gradient(135deg,#f8f7ff 0%,#ede9fe 100%);
                            border-radius:12px;border:1px solid #e0d9ff;overflow:hidden;">
                <tr>
                  <td style="padding:24px 28px;">
                    <p style="margin:0 0 6px;font-size:12px;font-weight:600;color:#8b5cf6;
                               text-transform:uppercase;letter-spacing:1px;">Trip Invitation</p>
                    <h2 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#1e1b4b;
                                line-height:1.2;">
                      ${tripName}
                    </h2>
                    <!-- Meta chips -->
                    <table cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="padding-right:12px;">
                          <span style="display:inline-block;background:#ede9fe;color:#6d28d9;
                                       border-radius:20px;padding:5px 14px;font-size:13px;
                                       font-weight:600;">
                            💰 ${currency}
                          </span>
                        </td>
                        <td>
                          <span style="display:inline-block;background:#e0f2fe;color:#0369a1;
                                       border-radius:20px;padding:5px 14px;font-size:13px;
                                       font-weight:600;">
                            👥 ${memberCount} member${memberCount !== 1 ? 's' : ''}
                          </span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ── Body Copy ── -->
          <tr>
            <td style="padding:28px 40px 0;">
              <p style="margin:0 0 12px;font-size:15px;color:#374151;line-height:1.7;">
                Hi there! 👋
              </p>
              <p style="margin:0;font-size:15px;color:#374151;line-height:1.7;">
                <strong>${inviterName}</strong> has invited you to join
                <strong>"${tripName}"</strong> on SplitWise — the easiest way to track
                shared expenses and settle up with friends.
              </p>
            </td>
          </tr>

          <!-- ── How it works ── -->
          <tr>
            <td style="padding:24px 40px 0;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0"
                     style="background:#f9fafb;border-radius:10px;border:1px solid #e5e7eb;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 14px;font-size:13px;font-weight:700;color:#6b7280;
                               text-transform:uppercase;letter-spacing:0.8px;">How it works</p>
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td width="32" valign="top" style="padding-right:12px;padding-bottom:12px;">
                          <span style="display:inline-block;width:28px;height:28px;
                                       border-radius:50%;background:#6366f1;color:#fff;
                                       text-align:center;line-height:28px;font-size:13px;
                                       font-weight:700;">1</span>
                        </td>
                        <td valign="top" style="padding-bottom:12px;">
                          <p style="margin:0;font-size:14px;color:#374151;line-height:1.5;">
                            <strong>Click the button below</strong> to accept the invite and sign in with Google
                          </p>
                        </td>
                      </tr>
                      <tr>
                        <td width="32" valign="top" style="padding-right:12px;padding-bottom:12px;">
                          <span style="display:inline-block;width:28px;height:28px;
                                       border-radius:50%;background:#6366f1;color:#fff;
                                       text-align:center;line-height:28px;font-size:13px;
                                       font-weight:700;">2</span>
                        </td>
                        <td valign="top" style="padding-bottom:12px;">
                          <p style="margin:0;font-size:14px;color:#374151;line-height:1.5;">
                            <strong>Join the trip</strong> and start adding expenses
                          </p>
                        </td>
                      </tr>
                      <tr>
                        <td width="32" valign="top" style="padding-right:12px;">
                          <span style="display:inline-block;width:28px;height:28px;
                                       border-radius:50%;background:#6366f1;color:#fff;
                                       text-align:center;line-height:28px;font-size:13px;
                                       font-weight:700;">3</span>
                        </td>
                        <td valign="top">
                          <p style="margin:0;font-size:14px;color:#374151;line-height:1.5;">
                            <strong>SplitWise calculates</strong> exactly who owes what — settle up in seconds
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ── CTA Button ── -->
          <tr>
            <td style="padding:32px 40px 28px;text-align:center;">
              <a href="${inviteUrl}"
                 style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);
                        color:#ffffff;text-decoration:none;font-size:16px;font-weight:700;
                        padding:16px 48px;border-radius:50px;
                        box-shadow:0 4px 15px rgba(99,102,241,0.4);
                        letter-spacing:0.3px;">
                Accept Invitation →
              </a>
              <p style="margin:16px 0 0;font-size:13px;color:#9ca3af;">
                This invite link expires in <strong>${expiresIn}</strong>
              </p>
            </td>
          </tr>

          <!-- ── Divider ── -->
          <tr>
            <td style="padding:0 40px;">
              <hr style="border:none;border-top:1px solid #f3f4f6;margin:0;" />
            </td>
          </tr>

          <!-- ── Raw link fallback ── -->
          <tr>
            <td style="padding:20px 40px 0;">
              <p style="margin:0 0 6px;font-size:13px;color:#6b7280;line-height:1.5;">
                Button not working? Copy and paste this link into your browser:
              </p>
              <p style="margin:0;font-size:12px;color:#6366f1;word-break:break-all;
                         line-height:1.5;">
                ${inviteUrl}
              </p>
            </td>
          </tr>

          <!-- ── Footer ── -->
          <tr>
            <td style="padding:24px 40px 40px;">
              <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6;text-align:center;">
                You received this email because <strong>${inviterName}</strong> used your email address to invite you.<br />
                If this wasn't expected, you can safely ignore this email — no account will be created.
              </p>
            </td>
          </tr>

          <!-- ── Bottom accent bar ── -->
          <tr>
            <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);height:4px;"></td>
          </tr>

        </table>
        <!-- /Card -->

      </td>
    </tr>
  </table>

</body>
</html>`;

// ─── Send Functions ───────────────────────────────────────────────────────────

/**
 * Send a trip invitation email via Resend.
 *
 * @param {object} params
 * @param {string} params.to            - Recipient email
 * @param {string} params.inviterName   - Sender's display name
 * @param {string} params.inviterAvatar - Sender's avatar URL
 * @param {string} params.tripName      - Trip name
 * @param {string} params.currency      - Trip currency
 * @param {number} params.memberCount   - Current member count
 * @param {string} params.inviteUrl     - Full invite acceptance URL
 */
const sendInviteEmail = async ({
  to,
  inviterName,
  inviterAvatar,
  tripName,
  currency,
  memberCount,
  inviteUrl,
}) => {
  const resend = new Resend(process.env.RESEND_API_KEY);

  const html = buildInviteHtml({
    inviterName,
    inviterAvatar,
    tripName,
    currency,
    memberCount,
    inviteUrl,
    expiresIn: '48 hours',
  });

  const { data, error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || 'SplitWise <onboarding@resend.dev>',
    to: [to],
    subject: `${inviterName} invited you to "${tripName}" on SplitWise`,
    html,
  });

  if (error) {
    const err = new Error(`Failed to send invite email: ${error.message}`);
    err.statusCode = 502;
    throw err;
  }

  return data;
};

module.exports = { sendInviteEmail };
