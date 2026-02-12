import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as any;

  try {
    // Build scope filter
    const scopeFilter =
      user.role === "MANAGER" || user.role === "ADMIN"
        ? {}
        : {
            OR: [
              { scope: "GLOBAL" as const },
              { scope: "SITE" as const, site: user.site },
            ],
          };

    const [totalApproved, totalPending, totalRejected, totalCodes] =
      await Promise.all([
        prisma.rcaCode.count({
          where: { status: "APPROVED", ...scopeFilter },
        }),
        prisma.rcaCode.count({
          where: { status: "PENDING", ...scopeFilter },
        }),
        prisma.rcaCode.count({
          where: { status: "REJECTED", ...scopeFilter },
        }),
        prisma.rcaCode.count({
          where: scopeFilter,
        }),
      ]);

    const recentApproved = await prisma.rcaCode.findMany({
      where: { status: "APPROVED", ...scopeFilter },
      orderBy: { updatedAt: "desc" },
      take: 5,
      include: {
        createdBy: {
          select: { id: true, fullName: true, email: true, site: true },
        },
      },
    });

    const pendingProposals = await prisma.rcaCode.findMany({
      where: { status: "PENDING", ...scopeFilter },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        createdBy: {
          select: { id: true, fullName: true, email: true, site: true },
        },
      },
    });

    return NextResponse.json({
      stats: {
        totalApproved,
        totalPending,
        totalRejected,
        totalCodes,
      },
      recentApproved,
      pendingProposals,
    });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
