import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { newId } from "@/lib/id";
import { createSessionToken, setSessionCookie } from "@/lib/auth";

export const dynamic = "force-dynamic";

const AVATAR_COLORS = ["#22d3ee", "#a78bfa", "#34d399", "#f472b6", "#60a5fa"];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const preferredLanguage = String(body.preferredLanguage ?? "en");

    if (!name || name.length > 100 || !email || email.length > 254 || !password) {
      return NextResponse.json({ error: "Name, email, and password are required." }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }
    if (password.length < 8 || Buffer.byteLength(password, "utf8") > 72) {
      return NextResponse.json({ error: "Password must be at least 8 characters and no more than 72 UTF-8 bytes." }, { status: 400 });
    }
    if (!["en", "te", "hi"].includes(preferredLanguage)) {
      return NextResponse.json({ error: "Choose a supported language." }, { status: 400 });
    }

    const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existing.length > 0) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const id = newId("usr");
    const avatarColor = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];

    await db.insert(users).values({ id, name, email, passwordHash, preferredLanguage, avatarColor });

    const token = await createSessionToken({ userId: id, email, name });
    await setSessionCookie(token);

    return NextResponse.json({
      user: { id, name, email, preferredLanguage, avatarColor },
    });
  } catch (err) {
    console.error("signup error", err);
    if (typeof err === "object" && err !== null && "code" in err && err.code === "23505") {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }
    return NextResponse.json({ error: "Something went wrong creating your account." }, { status: 500 });
  }
}
