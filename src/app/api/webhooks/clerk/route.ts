import { prisma } from "@/lib/prisma";
import type { UserJSON, WebhookEvent } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { Webhook } from "svix";

// Prisma and Svix require the Node.js runtime. Declaring it explicitly prevents
// this route from accidentally being deployed to an Edge runtime.
export const runtime = "nodejs";

function getPrimaryEmail(data: UserJSON) {
  const email =
    data.email_addresses.find(
      (address) => address.id === data.primary_email_address_id,
    )?.email_address ?? data.email_addresses[0]?.email_address;

  if (!email) {
    throw new Error("Clerk user event does not contain an email address");
  }

  return email;
}

export async function POST(request: Request) {
  const signingSecret = process.env.CLERK_WEBHOOK_SECRET;

  if (!signingSecret) {
    console.error("CLERK_WEBHOOK_SECRET is not configured");
    return NextResponse.json(
      { error: "Webhook signing secret is not configured" },
      { status: 500 },
    );
  }

  const svixId = request.headers.get("svix-id");
  const svixTimestamp = request.headers.get("svix-timestamp");
  const svixSignature = request.headers.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: "Missing Svix headers" }, { status: 400 });
  }

  // Svix signs the exact request bytes. Do not use request.json() followed by
  // JSON.stringify(), because whitespace or key ordering can change and make a
  // valid Clerk webhook fail signature verification.
  const payload = await request.text();
  let event: WebhookEvent;

  try {
    event = new Webhook(signingSecret).verify(payload, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as unknown as WebhookEvent;
  } catch (error) {
    console.error("Could not verify Clerk webhook", error);
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

  try {
    const clerkUserId = event.data.id;

    if (!clerkUserId) {
      return NextResponse.json({ error: "No Clerk user ID provided" }, { status: 400 });
    }

    switch (event.type) {
      case "user.created": {
        const data = event.data as UserJSON;
        const email = getPrimaryEmail(data);
        const user = await prisma.user.upsert({
          where: { clerkUserId },
          update: {
            email,
            firstName: data.first_name ?? email.split("@")[0],
            lastName: data.last_name,
            imageUrl: data.image_url,
          },
          create: {
            clerkUserId,
            email,
            firstName: data.first_name ?? email.split("@")[0],
            lastName: data.last_name,
            imageUrl: data.image_url,
          },
        });

        return NextResponse.json({ user });
      }

      case "user.updated": {
        const data = event.data as UserJSON;
        const email = getPrimaryEmail(data);
        const user = await prisma.user.update({
          where: { clerkUserId },
          data: {
            email,
            firstName: data.first_name ?? email.split("@")[0],
            lastName: data.last_name,
            imageUrl: data.image_url,
          },
        });

        return NextResponse.json({ user });
      }

      case "user.deleted": {
        // deleteMany is idempotent: retries from Clerk succeed even if a prior
        // delivery has already removed the database record.
        await prisma.user.deleteMany({ where: { clerkUserId } });
        return NextResponse.json({ deleted: true });
      }

      default:
        // Acknowledge event types this application does not synchronize so
        // Clerk does not keep retrying them.
        return NextResponse.json({ received: true });
    }
  } catch (error) {
    console.error("Failed to synchronize Clerk user with Prisma", error);
    return NextResponse.json(
      { error: "Failed to synchronize Clerk user" },
      { status: 500 },
    );
  }
}
