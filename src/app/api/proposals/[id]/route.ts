import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { canEditProposal, canDeleteProposal } from "@/lib/permissions";
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
    const proposal = await prisma.rcaCode.findUnique({
      where: { id: params.id },
      include: {
        createdBy: {
          select: { id: true, fullName: true, email: true, site: true, role: true },
        },
        approvedBy: {
          select: { id: true, fullName: true },
        },
        rejectedBy: {
          select: { id: true, fullName: true },
        },
        mergedInto: {
          select: { id: true, mainRca: true, rca1: true, rca2: true, rca3: true },
        },
        decisions: {
          include: {
            decidedBy: {
              select: { id: true, fullName: true, role: true },
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

    if (!proposal) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

    return NextResponse.json(proposal);
  } catch (error) {
    console.error("Proposal detail API error:", error);
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

  try {
    const body = await request.json();
    const proposal = await prisma.rcaCode.findUnique({
      where: { id: params.id },
      include: { createdBy: true },
    });

    if (!proposal) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

    const isCreator = proposal.createdById === session.user.id;
    if (!canEditProposal(session.user.role as any, isCreator, proposal.status)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const before = sanitizeForAudit(proposal);

    const updateData: any = {};
    if (body.title !== undefined) updateData.definition = body.title;
    if (body.mainRca !== undefined) updateData.mainRca = body.mainRca;
    if (body.rca1 !== undefined) updateData.rca1 = body.rca1;
    if (body.rca2 !== undefined) updateData.rca2 = body.rca2;
    if (body.rca3 !== undefined) updateData.rca3 = body.rca3;
    if (body.rca4 !== undefined) updateData.rca4 = body.rca4;
    if (body.rca5 !== undefined) updateData.rca5 = body.rca5;
    if (body.tags !== undefined) updateData.tags = normalizeArray(body.tags);
    if (body.examples !== undefined) updateData.examples = normalizeArray(body.examples);
    if (body.site !== undefined) updateData.site = body.site;
    if (body.scope !== undefined) updateData.scope = body.scope;

    const updatedProposal = await prisma.rcaCode.update({
      where: { id: params.id },
      data: updateData,
    });

    const after = sanitizeForAudit(updatedProposal);

    await createAuditLog({
      action: 'PROPOSAL_EDITED',
      entityType: 'proposal',
      entityId: params.id,
      actorId: session.user.id,
      before,
      after,
    });

    return NextResponse.json(updatedProposal);
  } catch (error) {
    console.error("Proposal update API error:", error);
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

  try {
    const proposal = await prisma.rcaCode.findUnique({
      where: { id: params.id },
      include: { createdBy: true },
    });

    if (!proposal) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

    const isCreator = proposal.createdById === session.user.id;
    if (!canDeleteProposal(session.user.role as any, isCreator, proposal.status)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const before = sanitizeForAudit(proposal);

    // Delete related records first to avoid FK constraints
    await prisma.decision.deleteMany({
      where: { proposalId: params.id },
    });

    await prisma.comment.deleteMany({
      where: {
        entityType: 'proposal',
        entityId: params.id,
      },
    });

    await prisma.auditLog.deleteMany({
      where: {
        entityType: 'proposal',
        entityId: params.id,
      },
    });

    await prisma.rcaCode.delete({
      where: { id: params.id },
    });

    // Create audit log after deletion, wrapped in try/catch to ensure delete succeeds
    try {
      await createAuditLog({
        action: 'PROPOSAL_DELETED',
        entityType: 'proposal',
        entityId: params.id,
        actorId: session.user.id,
        before,
        after: null,
      });
    } catch (auditError) {
      console.error("Failed to create audit log for proposal deletion:", auditError);
      // Continue, as deletion was successful
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Proposal delete API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
