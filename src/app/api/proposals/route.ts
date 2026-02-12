import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as any;
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || "";

  try {
    // Build scope filter based on user role
    const scopeFilter =
      user.role === "MANAGER" || user.role === "ADMIN"
        ? {}
        : {
            OR: [
              { scope: "GLOBAL" as const },
              { scope: "SITE" as const, site: user.site },
            ],
          };

    const statusFilter = status ? { status: status as any } : {};

    const proposals = await prisma.rcaCode.findMany({
      where: {
        ...scopeFilter,
        ...statusFilter,
      },
      orderBy: { createdAt: "desc" },
      include: {
        createdBy: {
          select: { id: true, fullName: true, email: true, site: true },
        },
        approvedBy: {
          select: { id: true, fullName: true },
        },
        rejectedBy: {
          select: { id: true, fullName: true },
        },
        _count: {
          select: { comments: true },
        },
      },
    });

    return NextResponse.json(proposals);
  } catch (error) {
    console.error("Proposals API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as any;

  try {
    const body = await request.json();
    const {
      mainRca,
      rca1,
      rca2,
      rca3,
      rca4,
      rca5,
      definition,
      useWhen,
      dontUseWhen,
      examples,
      tags,
      scope,
      site,
    } = body;

    // Validation
    if (!mainRca || !definition) {
      return NextResponse.json(
        { error: "Main RCA and definition are required" },
        { status: 400 }
      );
    }

    // Create proposal
    const proposal = await prisma.rcaCode.create({
      data: {
        mainRca,
        rca1: rca1 || null,
        rca2: rca2 || null,
        rca3: rca3 || null,
        rca4: rca4 || null,
        rca5: rca5 || null,
        definition,
        useWhen: useWhen || null,
        dontUseWhen: dontUseWhen || null,
        examples: examples || [],
        tags: tags || [],
        scope: scope || "GLOBAL",
        site: scope === "SITE" ? site : null,
        status: "PENDING",
        createdById: user.id,
      },
      include: {
        createdBy: {
          select: { id: true, fullName: true, email: true, site: true },
        },
      },
    });

    // Create audit log
    await createAuditLog({
      action: "PROPOSAL_CREATED",
      entityType: "rca_code",
      entityId: proposal.id,
      actorId: user.id,
      after: proposal,
    });

    return NextResponse.json(proposal, { status: 201 });
  } catch (error) {
    console.error("Create proposal error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
