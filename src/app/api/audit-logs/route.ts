import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { canViewAuditLogs } from "@/lib/permissions";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as any;

  if (!canViewAuditLogs(user.role)) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action") || "";
  const entityType = searchParams.get("entityType") || "";
  const actorId = searchParams.get("actorId") || "";
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = parseInt(searchParams.get("offset") || "0");

  try {
    const where: any = {};

    if (action) where.action = action;
    if (entityType) where.entityType = entityType;
    if (actorId) where.actorId = actorId;

    const [auditLogs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          actor: {
            select: { id: true, fullName: true, email: true, role: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: Math.min(limit, 100), // Max 100 per request
        skip: offset,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return NextResponse.json({
      auditLogs,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Audit logs API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
