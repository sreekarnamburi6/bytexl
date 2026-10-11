import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ user: null }, { status: 401 });
  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      preferredLanguage: user.preferredLanguage,
      avatarColor: user.avatarColor,
      bloodGroup: user.bloodGroup,
      dateOfBirth: user.dateOfBirth,
      phone: user.phone,
      createdAt: user.createdAt,
    },
  });
}

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const body = await req.json();
  const updates: Partial<typeof users.$inferInsert> = {};

  if (typeof body.name === "string" && body.name.trim()) updates.name = body.name.trim();
  if (typeof body.phone === "string") updates.phone = body.phone.trim();
  if (typeof body.dateOfBirth === "string") updates.dateOfBirth = body.dateOfBirth;
  if (typeof body.bloodGroup === "string" && ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"].includes(body.bloodGroup)) {
    updates.bloodGroup = body.bloodGroup;
  }
  if (typeof body.preferredLanguage === "string" && ["en", "te", "hi"].includes(body.preferredLanguage)) {
    updates.preferredLanguage = body.preferredLanguage;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update." }, { status: 400 });
  }

  await db.update(users).set(updates).where(eq(users.id, user.id));
  return NextResponse.json({ ok: true });
}
