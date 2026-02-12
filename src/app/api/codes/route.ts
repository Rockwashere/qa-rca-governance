import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as any;
  const { searchParams } = new URL(request.url);

  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "APPROVED";
  const mainRca = searchParams.get("mainRca") || "";
  const site = searchParams.get("site") || "";
  const tags = searchParams.get("tags") || "";
  const showDeprecated = searchParams.get("showDeprecated") === "true";

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

    // Build status filter
    const statusFilter: any = {};
    if (status && status !== "ALL") {
      statusFilter.status = status;
    }
    if (!showDeprecated && status !== "DEPRECATED") {
      statusFilter.status = { not: "DEPRECATED" };
      if (status && status !== "ALL") {
        statusFilter.status = status;
      }
    }

    // Build main RCA filter
    const mainRcaFilter = mainRca ? { mainRca: mainRca as any } : {};

    // Build site filter (for managers/admins filtering by specific site)
    const siteFilter = site ? { site: site as any } : {};

    // Build search filter
    const searchFilter = search
      ? {
          OR: [
            { rca1: { contains: search, mode: "insensitive" as const } },
            { rca2: { contains: search, mode: "insensitive" as const } },
            { rca3: { contains: search, mode: "insensitive" as const } },
            { rca4: { contains: search, mode: "insensitive" as const } },
            { rca5: { contains: search, mode: "insensitive" as const } },
            { definition: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    const codes = await prisma.rcaCode.findMany({
      where: {
        ...scopeFilter,
        ...statusFilter,
        ...mainRcaFilter,
        ...siteFilter,
        ...searchFilter,
      },
      orderBy: [{ mainRca: "asc" }, { rca1: "asc" }, { rca2: "asc" }],
      include: {
        createdBy: {
          select: { id: true, fullName: true, email: true, site: true },
        },
        approvedBy: {
          select: { id: true, fullName: true },
        },
      },
    });

    // Filter by tags if provided (JSON array stored in DB)
    let filteredCodes = codes;
    if (tags) {
      const tagList = tags.split(",").map((t) => t.trim().toLowerCase());
      filteredCodes = codes.filter((code) => {
        const codeTags = (code.tags as string[]) || [];
        return tagList.some((tag) =>
          codeTags.some((ct) => ct.toLowerCase().includes(tag))
        );
      });
    }

    return NextResponse.json(filteredCodes);
  } catch (error) {
    console.error("Codes API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
