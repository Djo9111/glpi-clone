import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "secret123";

function getUserFromRequest(request: Request) {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return null;
  try { return jwt.verify(token, JWT_SECRET) as { id: number; role: string }; }
  catch { return null; }
}

// GET /api/notifications?limit=20
export async function GET(request: Request) {
  const payload = getUserFromRequest(request);
  if (!payload) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const limit = Number(searchParams.get("limit") || 20);

  const [unreadCount, items] = await Promise.all([
    prisma.notification.count({ where: { userId: payload.id, isRead: false } }),
    prisma.notification.findMany({
      where: { userId: payload.id },
      orderBy: { dateEnvoi: "desc" },
      take: Math.min(limit, 50),
      include: { ticket: true },
    }),
  ]);

  return NextResponse.json({ unreadCount, items });
}

// PATCH /api/notifications  body: { ids?: number[], all?: boolean }
export async function PATCH(request: Request) {
  const payload = getUserFromRequest(request);
  if (!payload) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { ids, all } = await request.json();

  if (all) {
    await prisma.notification.updateMany({
      where: { userId: payload.id, isRead: false },
      data: { isRead: true },
    });
    return NextResponse.json({ ok: true });
  }

  if (Array.isArray(ids) && ids.length > 0) {
    await prisma.notification.updateMany({
      where: { userId: payload.id, id: { in: ids } },
      data: { isRead: true },
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
}
