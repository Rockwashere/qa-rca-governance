import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { canApproveReject, canMergeCode, canDeprecateCode } from "@/lib/permissions";
import type { AuditAction } from "@/lib/audit"


export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as any;

  try {
    const body = await request.json();
    const { decisionType, reason, mergeTargetId, editedFields } = body;

    // Get the proposal
    const proposal = await prisma.rcaCode.findUnique({
      where: { id: params.id },
      include: {
        createdBy: true,
      },
    });

    if (!proposal) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

    if (proposal.status !== "PENDING") {
      return NextResponse.json(
        { error: "Proposal is not in pending status" },
        { status: 400 }
      );
    }

    // Check permissions
    if (!canApproveReject(user.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    // Validate decision type
    const validDecisions = ["APPROVED", "APPROVED_WITH_EDITS", "REJECTED", "MERGED", "DEPRECATED"];
    if (!validDecisions.includes(decisionType)) {
      return NextResponse.json({ error: "Invalid decision type" }, { status: 400 });
    }

    // Validate rejection reason
    if (decisionType === "REJECTED" && !reason) {
      return NextResponse.json(
        { error: "Rejection reason is required" },
        { status: 400 }
      );
    }

    // Validate merge target
    if (decisionType === "MERGED") {
      if (!mergeTargetId) {
        return NextResponse.json(
          { error: "Merge target is required" },
          { status: 400 }
        );
      }
      const mergeTarget = await prisma.rcaCode.findUnique({
        where: { id: mergeTargetId },
      });
      if (!mergeTarget || mergeTarget.status !== "APPROVED") {
        return NextResponse.json(
          { error: "Invalid merge target" },
          { status: 400 }
        );
      }
    }

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      const beforeState = { ...proposal };

      // Update proposal status
      let updateData: any = {
        status: decisionType === "APPROVED_WITH_EDITS" ? "APPROVED" : decisionType,
        updatedAt: new Date(),
      };

      if (decisionType === "APPROVED" || decisionType === "APPROVED_WITH_EDITS") {
        updateData.approvedById = user.id;
        updateData.version = { increment: 1 };
      } else if (decisionType === "REJECTED") {
        updateData.rejectedById = user.id;
        updateData.rejectReason = reason;
      } else if (decisionType === "MERGED") {
        updateData.mergedIntoId = mergeTargetId;
      }

      // Apply edits if APPROVED_WITH_EDITS
      if (decisionType === "APPROVED_WITH_EDITS" && editedFields) {
        updateData = { ...updateData, ...editedFields };
      }

      const updatedProposal = await tx.rcaCode.update({
        where: { id: params.id },
        data: updateData,
      });

      // Create decision record
      await tx.decision.create({
        data: {
          proposalId: params.id,
          decisionType: decisionType as any,
          decidedById: user.id,
          reason: reason || null,
          mergeTargetId: mergeTargetId || null,
          editedFields: editedFields || null,
        },
      });

      // Create audit log
      const action: AuditAction =
  decisionType === "APPROVED" ? "PROPOSAL_APPROVED" : "PROPOSAL_REJECTED";

await createAuditLog({
  action,
  entityType: "rca_code",
  entityId: params.id,
  actorId: user.id,
  // keep the rest the same
});

await createAuditLog({
  action,
  entityType: "rca_code",
  entityId: params.id,
  actorId: user.id,
  // ...
});        entityType: "rca_code",
        entityId: params.id,
        actorId: user.id,
        before: beforeState,
        after: updatedProposal,
      });

      return updatedProposal;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Decision API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
