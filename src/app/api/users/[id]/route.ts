import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { canManageUsers } from "@/lib/permissions";
import { createAuditLog } from "@/lib/audit";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as any;

  if (!canManageUsers(user.role)) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  try {
    const targetUser = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        fullName: true,
        email: true,
        site: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(targetUser);
  } catch (error) {
    console.error("User detail API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as any;

  if (!canManageUsers(user.role)) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { fullName, email, site, role, isActive, password } = body;

    // Get current user state for audit log
    const currentUser = await prisma.user.findUnique({
      where: { id: params.id },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const beforeState = {
      id: currentUser.id,
      fullName: currentUser.fullName,
      email: currentUser.email,
      site: currentUser.site,
      role: currentUser.role,
      isActive: currentUser.isActive,
    };

    // Prepare update data
    const updateData: any = {
      fullName: fullName || currentUser.fullName,
      email: email || currentUser.email,
      site: site || currentUser.site,
      role: role || currentUser.role,
      isActive: isActive !== undefined ? isActive : currentUser.isActive,
      updatedAt: new Date(),
    };

    // Hash new password if provided
    if (password) {
      updateData.password = await bcrypt.hash(password, 12);
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
      select: {
        id: true,
        fullName: true,
        email: true,
        site: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    });

    // Create audit log for role changes
    if (beforeState.role !== updatedUser.role) {
      await createAuditLog({
        action: "USER_ROLE_CHANGED",
        entityType: "user",
        entityId: params.id,
        actorId: user.id,
        before: beforeState,
        after: updatedUser,
      });
    }

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Update user error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
