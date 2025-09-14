import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY!);
const SUPPORT_INBOX = process.env.SUPPORT_INBOX || "support@hotelfoundry.app";
const SUPPORT_INBOX_PREVIEW = process.env.SUPPORT_INBOX_PREVIEW || SUPPORT_INBOX;
const FROM_EMAIL = process.env.FROM_EMAIL || "Hotel Foundry <support@hotelfoundry.app>";
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || "";
const isProd = process.env.VERCEL_ENV === "production";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || "";
  const headerSecret = (req.headers["x-webhook-secret"] as string) || "";
  if (!WEBHOOK_SECRET || headerSecret !== WEBHOOK_SECRET) {
    console.error("[consulting-notify] invalid secret");
    return res.status(401).json({ ok: false, error: "invalid_secret" });
  }

  const RESEND_API_KEY_PRESENT = !!process.env.RESEND_API_KEY;
  const FROM_EMAIL = process.env.FROM_EMAIL || "";
  const SUPPORT_INBOX = process.env.SUPPORT_INBOX || "";
  const SUPPORT_INBOX_PREVIEW = process.env.SUPPORT_INBOX_PREVIEW || SUPPORT_INBOX;
  const isProd = process.env.VERCEL_ENV === "production";
  const to = isProd ? SUPPORT_INBOX : SUPPORT_INBOX_PREVIEW;

  if (!RESEND_API_KEY_PRESENT) {
    console.error("[consulting-notify] missing RESEND_API_KEY");
    return res.status(500).json({ ok: false, error: "missing_RESEND_API_KEY" });
  }
  if (!FROM_EMAIL) {
    console.error("[consulting-notify] missing FROM_EMAIL");
    return res.status(500).json({ ok: false, error: "missing_FROM_EMAIL" });
  }
  if (!to) {
    console.error("[consulting-notify] missing recipient (SUPPORT_INBOX/preview)");
    return res.status(500).json({ ok: false, error: "missing_recipient" });
  }

  let payload: any = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  const row = payload?.record ?? payload?.new ?? payload ?? {};
  const { id, created_at, name, email, expertise, seniority, estimated_hours, message } = row;

  const subject = `New consulting request${expertise ? ` (${expertise})` : ""} — ${name ?? "Unknown"}`;
  const text = `
New consulting request

ID: ${id}
When: ${created_at}

Name: ${name ?? "—"}
Email: ${email ?? "—"}
Expertise: ${expertise ?? "—"}
Seniority: ${seniority ?? "—"}
Estimated hours: ${estimated_hours ?? "—"}

Message:
${message ?? "—"}
  `.trim();

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY!);

    const result: any = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject,
      text,
    });

    console.log("[consulting-notify] send result", {
      env: process.env.VERCEL_ENV,
      to,
      from: FROM_EMAIL,
      id: result?.id ?? null,
      error: result?.error ?? null,
    });

    if (result?.error) {
      return res
        .status(500)
        .json({ ok: false, error: result.error?.message || String(result.error), to, from: FROM_EMAIL });
    }

    return res.status(200).json({ ok: true, id: result?.id ?? null, to, from: FROM_EMAIL });
  } catch (e: any) {
    console.error("[consulting-notify] send threw", e);
    return res.status(500).json({ ok: false, error: e?.message ?? "send_failed", to, from: FROM_EMAIL });
  }
}

// Allow JSON body parsing (no raw body needed since we use header secret)
export const config = {
  api: {
    bodyParser: {
      sizeLimit: "1mb",
    },
  },
};