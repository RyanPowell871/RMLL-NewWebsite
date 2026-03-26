import { Hono } from "npm:hono";
import { createClient } from "npm:@supabase/supabase-js@2";
import * as db from "./db.tsx";

const app = new Hono();

// Helper: get Resend API key
function getResendKey() {
  return Deno.env.get("RESEND_API_KEY") || "";
}

// Helper: get supabase client for auth verification
function getSupabase() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

// Helper: verify admin user from Authorization header
async function verifyAdmin(authHeader: string | undefined): Promise<string | null> {
  if (!authHeader) return null;
  const token = authHeader.split(" ")[1];
  if (!token) return null;

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user?.id) return null;

    // Verify admin role
    const userProfile = await db.getUserById(data.user.id);
    if (!userProfile || userProfile.role !== 'admin') return null;

    return data.user.id;
  } catch {
    return null;
  }
}

// ============================================
// PUBLIC ROUTES
// ============================================

// POST /contact - Submit a contact form
app.post("/contact", async (c) => {
  try {
    const body = await c.req.json();
    const { name, email, subject, message, phone } = body;

    if (!name || !email || !subject || !message) {
      return c.json({ success: false, error: "Name, email, subject, and message are required." }, 400);
    }

    // Store submission in database
    const submission = await db.createContactSubmission({
      name,
      email,
      phone: phone || null,
      subject,
      message,
      email_id: null,
      status: 'new',
    });

    // Determine forwarding recipients from league contacts config
    let recipientEmails: string[] = [];
    try {
      const leagueContacts = await db.getLeagueContacts();
      if (leagueContacts?.contact_form_recipients?.length) {
        recipientEmails = leagueContacts.contact_form_recipients.filter((e: string) => e && e.includes("@"));
      }
    } catch (lookupErr) {
      console.log("[Contact] Error reading league contacts for recipients:", lookupErr);
    }

    // If no CMS-configured recipients, skip email sending
    if (recipientEmails.length === 0) {
      console.log("[Contact] No contact_form_recipients configured in CMS, skipping email forwarding");
      return c.json({ success: true, message: "Your message has been sent successfully." });
    }

    // Try sending notification email via Resend
    const resendKey = getResendKey();
    if (resendKey) {
      try {
        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${resendKey}`,
          },
          body: JSON.stringify({
            from: "RMLL Contact Form <onboarding@resend.dev>",
            to: recipientEmails,
            reply_to: email,
            subject: `[RMLL Contact] ${subject}`,
            html: `
              <h2>New Contact Form Submission</h2>
              <p><strong>Name:</strong> ${name}</p>
              <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
              ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ""}
              <p><strong>Subject:</strong> ${subject}</p>
              <hr />
              <p>${message.replace(/\n/g, "<br />")}</p>
              <hr />
              <p style="color:#666;font-size:12px;">This message was submitted via the RMLL website contact form. You can reply directly to the sender by responding to this email.</p>
            `,
          }),
        });

        if (emailResponse.ok) {
          const emailResult = await emailResponse.json();
          // Update with email_id
          await db.updateContactSubmission(submission.id, { email_id: emailResult.id || null });
          console.log(`[Contact] Email forwarded to ${recipientEmails.join(", ")}`);
        } else {
          const errText = await emailResponse.text();
          console.log("[Contact] Resend email failed:", errText);
        }
      } catch (emailErr) {
        console.log("[Contact] Error sending notification email:", emailErr);
      }
    } else {
      console.log("[Contact] No RESEND_API_KEY configured, skipping email notification");
    }

    return c.json({ success: true, message: "Your message has been sent successfully." });
  } catch (error) {
    console.log("[Contact] Error processing contact form:", error);
    return c.json({ success: false, error: `Error processing contact form: ${error.message}` }, 500);
  }
});

// POST /newsletter/subscribe
app.post("/newsletter/subscribe", async (c) => {
  try {
    const body = await c.req.json();
    const { email, name } = body;

    if (!email) {
      return c.json({ success: false, error: "Email is required." }, 400);
    }

    const emailLower = email.toLowerCase();

    // Check if already subscribed and active
    const existing = await db.getSubscriberByEmail(emailLower);
    if (existing && existing.is_active) {
      return c.json({ success: true, message: "You are already subscribed." });
    }

    // If exists but inactive, reactivate
    if (existing) {
      await db.updateSubscriber(existing.id, {
        name: name || existing.name,
        is_active: true,
        subscribed_at: new Date().toISOString(),
        unsubscribed_at: null,
      });
    } else {
      // Create new subscriber
      await db.createSubscriber({
        email: emailLower,
        name: name || null,
        is_active: true,
      });
    }

    return c.json({ success: true, message: "Successfully subscribed to the newsletter." });
  } catch (error) {
    console.log("[Newsletter] Error subscribing:", error);
    return c.json({ success: false, error: `Error subscribing: ${error.message}` }, 500);
  }
});

// POST /newsletter/unsubscribe
app.post("/newsletter/unsubscribe", async (c) => {
  try {
    const body = await c.req.json();
    const { email } = body;

    if (!email) {
      return c.json({ success: false, error: "Email is required." }, 400);
    }

    const emailLower = email.toLowerCase();
    const existing = await db.getSubscriberByEmail(emailLower);

    if (existing) {
      await db.updateSubscriber(existing.id, {
        is_active: false,
        unsubscribed_at: new Date().toISOString(),
      });
    }

    return c.json({ success: true, message: "Successfully unsubscribed from the newsletter." });
  } catch (error) {
    console.log("[Newsletter] Error unsubscribing:", error);
    return c.json({ success: false, error: `Error unsubscribing: ${error.message}` }, 500);
  }
});

// ============================================
// ADMIN ROUTES
// ============================================

// GET /admin/contact/submissions
app.get("/admin/contact/submissions", async (c) => {
  try {
    const userId = await verifyAdmin(c.req.header("Authorization"));
    if (!userId) {
      return c.json({ success: false, error: "Unauthorized" }, 401);
    }

    const submissions = await db.getContactSubmissions();
    return c.json({ success: true, submissions });
  } catch (error) {
    console.log("[Admin] Error fetching contact submissions:", error);
    return c.json({ success: false, error: `Error fetching submissions: ${error.message}` }, 500);
  }
});

// GET /admin/newsletter/subscribers
app.get("/admin/newsletter/subscribers", async (c) => {
  try {
    const userId = await verifyAdmin(c.req.header("Authorization"));
    if (!userId) {
      return c.json({ success: false, error: "Unauthorized" }, 401);
    }

    const subscribers = await db.getNewsletterSubscribers();

    return c.json({
      success: true,
      subscribers,
      total: subscribers.length,
    });
  } catch (error) {
    console.log("[Admin] Error fetching newsletter subscribers:", error);
    return c.json({ success: false, error: `Error fetching subscribers: ${error.message}` }, 500);
  }
});

// POST /admin/email/campaign
app.post("/admin/email/campaign", async (c) => {
  try {
    const userId = await verifyAdmin(c.req.header("Authorization"));
    if (!userId) {
      return c.json({ success: false, error: "Unauthorized" }, 401);
    }

    const body = await c.req.json();
    const { subject, htmlContent, textContent, recipients, sendToNewsletter } = body;

    if (!subject || !htmlContent) {
      return c.json({ success: false, error: "Subject and HTML content are required." }, 400);
    }

    const resendKey = getResendKey();
    if (!resendKey) {
      return c.json({ success: false, error: "Email service not configured (RESEND_API_KEY missing)." }, 500);
    }

    // Build recipient list
    let toAddresses: string[] = recipients || [];

    if (sendToNewsletter) {
      const subscribers = await db.getNewsletterSubscribers();
      const activeEmails = subscribers.map(s => s.email);
      toAddresses = [...new Set([...toAddresses, ...activeEmails])];
    }

    if (toAddresses.length === 0) {
      return c.json({ success: false, error: "No recipients specified." }, 400);
    }

    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    // Send to each recipient individually (Resend free tier limitation)
    for (const to of toAddresses) {
      try {
        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${resendKey}`,
          },
          body: JSON.stringify({
            from: "RMLL <onboarding@resend.dev>",
            to: [to],
            subject,
            html: htmlContent,
            text: textContent || undefined,
          }),
        });

        if (emailResponse.ok) {
          sent++;
        } else {
          failed++;
          const errText = await emailResponse.text();
          errors.push(`Failed to send to ${to}: ${errText}`);
          console.log(`[Campaign] Failed to send to ${to}:`, errText);
        }
      } catch (err: any) {
        failed++;
        errors.push(`Error sending to ${to}: ${err.message}`);
      }
    }

    return c.json({
      success: true,
      message: `Campaign sent: ${sent} delivered, ${failed} failed.`,
      results: { sent, failed, errors },
    });
  } catch (error) {
    console.log("[Admin] Error sending email campaign:", error);
    return c.json({ success: false, error: `Error sending campaign: ${error.message}` }, 500);
  }
});

export default app;