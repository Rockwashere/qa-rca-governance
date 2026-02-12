import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { canEditApprovedCode, canDeprecateCode } from "@/lib/permissions";
import { createAuditLog, sanitizeForAudit } from "@/lib/audit";

function normalizeArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === 'string') return value.split(',').map(s => s.trim());
  return [];
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const code = await prisma.rcaCode.findUnique({
      where: { id: params.id },
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
        mergedInto: {
          select: { id: true, mainRca: true, rca1: true, rca2: true },
        },
        deprecatedReplacedBy: {
          select: { id: true, mainRca: true, rca1: true, rca2: true },
        },
        decisions: {
          include: {
            decidedBy: {
              select: { id: true, fullName: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        comments: {
          include: {
            user: {
              select: { id: true, fullName: true, site: true, role: true },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!code) {
      return NextResponse.json({ error: "Code not found" }, { status: 404 });
    }

    return NextResponse.json(code);
  } catch (error) {
    console.error("Code detail API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!canEditApprovedCode(session.user.role as any)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const code = await prisma.rcaCode.findUnique({
      where: { id: params.id },
    });

    if (!code) {
      return NextResponse.json({ error: "Code not found" }, { status: 404 });
    }

    if (code.status !== 'APPROVED') {
      return NextResponse.json({ error: "Only approved codes can be edited" }, { status: 400 });
    }

    const before = sanitizeForAudit(code);

    const updateData: any = {};
    if (body.definition !== undefined) updateData.definition = body.definition;
    if (body.mainRca !== undefined) updateData.mainRca = body.mainRca;
    if (body.rca1 !== undefined) updateData.rca1 = body.rca1;
    if (body.rca2 !== undefined) updateData.rca2 = body.rca2;
    if (body.rca3 !== undefined) updateData.rca3 = body.rca3;
    if (body.rca4 !== undefined) updateData.rca4 = body.rca4;
    if (body.rca5 !== undefined) updateData.rca5 = body.rca5;
    if (body.useWhen !== undefined) updateData.useWhen = body.useWhen;
    if (body.dontUseWhen !== undefined) updateData.dontUseWhen = body.dontUseWhen;
    if (body.tags !== undefined) updateData.tags = normalizeArray(body.tags);
    if (body.examples !== undefined) updateData.examples = normalizeArray(body.examples);

    const updatedCode = await prisma.rcaCode.update({
      where: { id: params.id },
      data: updateData,
    });

    const after = sanitizeForAudit(updatedCode);

    await createAuditLog({
      action: 'CODE_EDITED',
      entityType: 'code',
      entityId: params.id,
      actorId: session.user.id,
      before,
      after,
    });

    return NextResponse.json(updatedCode);
  } catch (error) {
    console.error("Code update API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!canDeprecateCode(session.user.role as any)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const code = await prisma.rcaCode.findUnique({
      where: { id: params.id },
    });

    if (!code) {
      return NextResponse.json({ error: "Code not found" }, { status: 404 });
    }

    if (code.status !== 'APPROVED') {
      return NextResponse.json({ error: "Only approved codes can be deprecated" }, { status: 400 });
    }

    const before = sanitizeForAudit(code);

    const updatedCode = await prisma.rcaCode.update({
      where: { id: params.id },
      data: { status: 'DEPRECATED' },
    });

    const after = sanitizeForAudit(updatedCode);

    await createAuditLog({
      action: 'CODE_DEPRECATED',
      entityType: 'code',
      entityId: params.id,
      actorId: session.user.id,
      before,
      after,
    });

    return NextResponse.json(updatedCode);
  } catch (error) {
    console.error("Code deprecate API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
