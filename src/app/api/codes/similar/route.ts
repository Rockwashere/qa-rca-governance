import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { findSimilarCodes } from "@/lib/similarity";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const mainRca = searchParams.get("mainRca") || "";
  const rca1 = searchParams.get("rca1") || "";
  const rca2 = searchParams.get("rca2") || "";
  const rca3 = searchParams.get("rca3") || "";
  const tags = searchParams.get("tags") || "";

  if (!mainRca) {
    return NextResponse.json([]);
  }

  try {
    const existingCodes = await prisma.rcaCode.findMany({
      where: {
        mainRca: mainRca as any,
        status: { in: ["APPROVED", "PENDING"] },
      },
      select: {
        id: true,
        mainRca: true,
        rca1: true,
        rca2: true,
        rca3: true,
        rca4: true,
        rca5: true,
        definition: true,
        tags: true,
        status: true,
        scope: true,
        site: true,
      },
    });

    const tagList = tags ? tags.split(",").map((t) => t.trim()) : [];

    const similar = findSimilarCodes(
      { mainRca, rca1, rca2, rca3, tags: tagList },
      existingCodes.map((code) => ({
        id: code.id,
        rca1: code.rca1 || "",
        rca2: code.rca2 || "",
        rca3: code.rca3 || "",
        rca4: (code as any).rca4 || "",
        rca5: (code as any).rca5 || "",
        tags: (code.tags as string[]) || [],
        mainRca: code.mainRca,
        status: code.status,
        definition: code.definition,
      })),
      0.3
    );

    return NextResponse.json(similar);
  } catch (error) {
    console.error("Similar codes API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
