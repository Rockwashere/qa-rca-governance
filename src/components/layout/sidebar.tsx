"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Library,
  FilePlus,
  FileText,
  Users,
  ScrollText,
  Shield,
} from "lucide-react"

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["QA_MEMBER", "QA_LEAD", "MANAGER", "ADMIN"],
  },
  {
    name: "RCA Library",
    href: "/library",
    icon: Library,
    roles: ["QA_MEMBER", "QA_LEAD", "MANAGER", "ADMIN"],
  },
  {
    name: "New Proposal",
    href: "/proposals/new",
    icon: FilePlus,
    roles: ["QA_MEMBER", "QA_LEAD", "MANAGER", "ADMIN"],
  },
  {
    name: "Proposals",
    href: "/proposals",
    icon: FileText,
    roles: ["QA_MEMBER", "QA_LEAD", "MANAGER", "ADMIN"],
  },
]

const adminNavigation = [
  {
    name: "Manage Users",
    href: "/admin/users",
    icon: Users,
    roles: ["ADMIN"],
  },
  {
    name: "Audit Logs",
    href: "/admin/audit-logs",
    icon: ScrollText,
    roles: ["MANAGER", "ADMIN"],
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const userRole = (session?.user as any)?.role || "QA_MEMBER"

  const filteredNav = navigation.filter((item) =>
    item.roles.includes(userRole)
  )
  const filteredAdminNav = adminNavigation.filter((item) =>
    item.roles.includes(userRole)
  )

  return (
    <div className="flex h-full w-64 flex-col border-r bg-card">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <Shield className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-sm font-bold text-foreground">QA RCA</h1>
          <p className="text-xs text-muted-foreground">Governance</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        <div className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Main
        </div>
        {filteredNav.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + "/")
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          )
        })}

        {filteredAdminNav.length > 0 && (
          <>
            <div className="mb-2 mt-6 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Administration
            </div>
            {filteredAdminNav.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(item.href + "/")
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Link>
              )
            })}
          </>
        )}
      </nav>

      {/* Site indicator */}
      <div className="border-t p-4">
        <div className="rounded-md bg-muted p-3">
          <p className="text-xs font-medium text-muted-foreground">Your Site</p>
          <p className="text-sm font-bold text-foreground">
            {(session?.user as any)?.site || "—"}
          </p>
          <p className="text-xs text-muted-foreground capitalize">
            {userRole.replace("_", " ").toLowerCase()}
          </p>
        </div>
      </div>
    </div>
  )
}
