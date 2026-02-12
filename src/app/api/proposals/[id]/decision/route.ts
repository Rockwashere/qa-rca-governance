import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { canApproveReject, canMergeCode, canDeprecateCode } from "@/lib/permissions";

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
    const { decisionType, reason, mergeTargetId, editedFields } = body ?? {};

    // Validate decision type
    const validDecisions = [
      "APPROVED",
      "APPROVED_WITH_EDITS",
      "REJECTED",
      "MERGED",
      "DEPRECATED",
    ] as const;

    if (!validDecisions.includes(decisionType)) {
      return NextResponse.json({ error: "Invalid decision type" }, { status: 400 });
    }

    // Fetch proposal (your app stores proposals in rcaCode with status=PENDING)
    const proposal = await prisma.rcaCode.findUnique({
      where: { id: params.id },
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

    // Permissions
    if (!canApproveReject(user.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    if (decisionType === "MERGED" && !canMergeCode(user.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    if (decisionType === "DEPRECATED" && !canDeprecateCode(user.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    // Validation rules
    if (decisionType === "REJECTED" && !reason) {
      return NextResponse.json({ error: "Rejection reason is required" }, { status: 400 });
    }

    if (decisionType === "MERGED") {
      if (!mergeTargetId) {
        return NextResponse.json({ error: "Merge target is required" }, { status: 400 });
      }

      const mergeTarget = await prisma.rcaCode.findUnique({
        where: { id: mergeTargetId },
      });

      if (!mergeTarget || mergeTarget.status !== "APPROVED") {
        return NextResponse.json({ error: "Invalid merge target" }, { status: 400 });
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      // Make JSON-safe snapshots for audit log
      const beforeState = JSON.parse(JSON.stringify(proposal));

      // Build proposal update
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

      // Apply edits if approved with edits
      if (decisionType === "APPROVED_WITH_EDITS" && editedFields && typeof editedFields === "object") {
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
          decisionType: decisionType,
          decidedById: user.id,
          reason: decisionType === "REJECTED" ? (reason || null) : null,
          mergeTargetId: decisionType === "MERGED" ? (mergeTargetId || null) : null,
          editedFields: decisionType === "APPROVED_WITH_EDITS" ? (editedFields || null) : null,
        },
      });

      // Audit action (avoid template strings; keep it explicit)
      let action = "PROPOSAL_DECISION" as any;
      if (decisionType === "APPROVED") action = "PROPOSAL_APPROVED";
      if (decisionType === "APPROVED_WITH_EDITS") action = "PROPOSAL_APPROVED_WITH_EDITS";
      if (decisionType === "REJECTED") action = "PROPOSAL_REJECTED";
      if (decisionType === "MERGED") action = "PROPOSAL_MERGED";
      if (decisionType === "DEPRECATED") action = "PROPOSAL_DEPRECATED";

      await createAuditLog({
        action,
        entityType: "proposal",
        entityId: params.id,
        actorId: user.id,
        before: beforeState as any,
        after: JSON.parse(JSON.stringify(updatedProposal)) as any,
      });

      return updatedProposal;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Decision API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
