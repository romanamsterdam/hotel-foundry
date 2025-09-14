import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY!);
const SUPPORT_INBOX = process.env.SUPPORT_INBOX || "support@hotelfoundry.app";
const SUPPORT_INBOX_PREVIEW = process.env.SUPPORT_INBOX_PREVIEW || SUPPORT_INBOX;
const FROM_EMAIL = process.env.FROM_EMAIL || "Hotel Foundry <noreply@onresend.com>";
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || "";
const isProd = process.env.VERCEL_ENV === "production";

function ok(res: VercelResponse, body: any = { ok: true }) {
  return res.status(200).json(body);
}
function bad(res: VercelResponse, code: number, msg: string) {
  return res.status(code).json({ ok: false, error: msg });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return bad(res, 405, "Method Not Allowed");

  // Simple shared-secret check via header configured in Supabase webhook
  const headerSecret = (req.headers["x-webhook-secret"] as string) || "";
  if (!WEBHOOK_SECRET || headerSecret !== WEBHOOK_SECRET) {
    console.error("[consulting-notify] invalid or missing webhook secret");
    return bad(res, 401, "invalid signature");
  }

  // Supabase DB webhook body shape (row-level)
  const payload: any = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  const row = payload?.record ?? payload?.new ?? payload ?? {};

  const {
    id,
    created_at,
    name,
    email,
    expertise,
    seniority,
    estimated_hours,
    message,
  } = row;

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

  const to = isProd ? SUPPORT_INBOX : SUPPORT_INBOX_PREVIEW;

  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject,
      text,
    });
    if ((result as any)?.error) {
      console.error("[consulting-notify] Resend error:", (result as any).error);
      return bad(res, 500, "resend_failed");
    }
    return ok(res);
  } catch (e: any) {
    console.error("[consulting-notify] send threw:", e);
    return bad(res, 500, e?.message ?? "send_failed");
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