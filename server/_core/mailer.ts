function setting(name: string) {
  return process.env[name]?.trim() ?? "";
}

export function mailConfigured() {
  return Boolean(setting("RESEND_API_KEY") && setting("MAIL_FROM") && appBaseUrl());
}

export function appBaseUrl() {
  return (setting("APP_URL") || "https://rgnfix.com").replace(/\/$/, "");
}

export async function sendTransactionalEmail(options: {
  to: string;
  subject: string;
  html: string;
}) {
  if (!mailConfigured()) {
    console.warn("[Mail] RESEND_API_KEY or MAIL_FROM is not configured; email skipped.");
    return false;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${setting("RESEND_API_KEY")}`,
    },
    body: JSON.stringify({
      from: setting("MAIL_FROM"),
      to: [options.to],
      subject: options.subject,
      html: options.html,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Mail API error ${response.status}: ${body}`);
  }
  return true;
}

export function emailShell(title: string, body: string, buttonLabel: string, buttonUrl: string) {
  return `<!doctype html>
<html lang="tr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;background:#f3f6f7;font-family:Arial,Helvetica,sans-serif;color:#102b2b">
  <div style="max-width:560px;margin:0 auto;padding:28px 16px">
    <div style="background:#ffffff;border:1px solid #dce5e7;border-radius:20px;padding:30px">
      <div style="font-size:28px;font-weight:900;letter-spacing:-1px;margin-bottom:24px">RGN<span style="color:#21a5a5">FIX</span></div>
      <h1 style="font-size:23px;margin:0 0 14px">${title}</h1>
      <div style="font-size:15px;line-height:1.7;color:#52666b">${body}</div>
      <a href="${buttonUrl}" style="display:inline-block;margin-top:24px;background:#0f4f4f;color:#ffffff;text-decoration:none;padding:13px 20px;border-radius:10px;font-weight:700">${buttonLabel}</a>
      <p style="margin:24px 0 0;font-size:12px;line-height:1.6;color:#76888d">Bu bağlantıyı siz istemediyseniz bu e-postayı dikkate almayabilirsiniz. Bağlantıyı kimseyle paylaşmayın.</p>
    </div>
  </div>
</body>
</html>`;
}
