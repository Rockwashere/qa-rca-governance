import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { buildCodePath } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as any;

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

    const codes = await prisma.rcaCode.findMany({
      where: {
        status: "APPROVED",
        ...scopeFilter,
      },
      orderBy: [{ mainRca: "asc" }, { rca1: "asc" }, { rca2: "asc" }],
      include: {
        createdBy: {
          select: { fullName: true },
        },
        approvedBy: {
          select: { fullName: true },
        },
      },
    });

    // Build CSV
    const headers = [
      "ID",
      "Code Path",
      "Main RCA",
      "RCA1",
      "RCA2",
      "RCA3",
      "RCA4",
      "RCA5",
      "Definition",
      "Use When",
      "Don't Use When",
      "Examples",
      "Tags",
      "Scope",
      "Site",
      "Created By",
      "Approved By",
      "Version",
    ];

    const rows = codes.map((code) => [
      code.id,
      buildCodePath(code.mainRca, code.rca1, code.rca2, code.rca3, code.rca4, code.rca5),
      code.mainRca,
      code.rca1 || "",
      code.rca2 || "",
      code.rca3 || "",
      code.rca4 || "",
      code.rca5 || "",
      `"${(code.definition || "").replace(/"/g, '""')}"`,
      `"${(code.useWhen || "").replace(/"/g, '""')}"`,
      `"${(code.dontUseWhen || "").replace(/"/g, '""')}"`,
      `"${JSON.stringify(code.examples || []).replace(/"/g, '""')}"`,
      `"${((code.tags as string[]) || []).join(", ")}"`,
      code.scope,
      code.site || "ALL",
      code.createdBy?.fullName || "",
      code.approvedBy?.fullName || "",
      code.version,
    ]);

    const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="rca-codes-export-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error("Export API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
