import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { newId } from "@/lib/id";
import { createSessionToken, setSessionCookie } from "@/lib/auth";
import { seedDemoDataForUser } from "@/lib/seed";

export const dynamic = "force-dynamic";

const DEMO_EMAIL = "judge@mediscope.ai";
const DEMO_PASSWORD = "mediscope2026";

export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Demo login is available only in development." }, { status: 404 });
  }

  try {
    let rows = await db.select().from(users).where(eq(users.email, DEMO_EMAIL)).limit(1);
    let user = rows[0];

    if (!user) {
      const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
      const id = newId("usr");
      await db.insert(users).values({
        id,
        name: "Hackathon Judge",
        email: DEMO_EMAIL,
        passwordHash,
        preferredLanguage: "en",
        avatarColor: "#22d3ee",
      });
      await seedDemoDataForUser(id);
      rows = await db.select().from(users).where(eq(users.email, DEMO_EMAIL)).limit(1);
      user = rows[0];
    }

    const token = await createSessionToken({ userId: user.id, email: user.email, name: user.name });
    await setSessionCookie(token);

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        preferredLanguage: user.preferredLanguage,
        avatarColor: user.avatarColor,
      },
    });
  } catch (err) {
    console.error("demo login error", err);
    return NextResponse.json({ error: "Could not start demo session." }, { status: 500 });
  }
}
