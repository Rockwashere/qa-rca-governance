import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { canComment } from "@/lib/permissions";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const comments = await prisma.comment.findMany({
      where: { entityId: params.id },
      include: {
        user: {
          select: { id: true, fullName: true, site: true, role: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(comments);
  } catch (error) {
    console.error("Comments API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

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
    const { content, reaction } = body;

    if (!content && !reaction) {
      return NextResponse.json(
        { error: "Content or reaction is required" },
        { status: 400 }
      );
    }

    // Check if user can comment
    if (!canComment(user.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    // Verify the proposal exists
    const proposal = await prisma.rcaCode.findUnique({
      where: { id: params.id },
    });

    if (!proposal) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

    const comment = await prisma.comment.create({
      data: {
        entityType: "proposal",
        entityId: params.id,
        content: content || null,
        reaction: reaction ? (reaction as any) : null,
        userId: user.id,
        rcaCodeId: params.id,
      },
      include: {
        user: {
          select: { id: true, fullName: true, site: true, role: true },
        },
      },
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error("Create comment error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
