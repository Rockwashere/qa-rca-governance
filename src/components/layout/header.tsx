"use client"

import React from "react"
import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LogOut, User, ChevronDown } from "lucide-react"
import { getInitials } from "@/lib/utils"

export function Header() {
  const { data: session } = useSession()
  const user = session?.user as any

  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">
          QA RCA Coding Governance
        </h2>
        <p className="text-xs text-muted-foreground">
          Single source of truth for RCA taxonomy
        </p>
      </div>

      <div className="flex items-center gap-4">
        {user && (
          <>
            <Badge variant="outline" className="text-xs">
              {user.site}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    {getInitials(user.fullName || user.name || "U")}
                  </div>
                  <div className="hidden text-left md:block">
                    <p className="text-sm font-medium">{user.fullName || user.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {user.role?.replace("_", " ")}
                    </p>
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div>
                    <p className="text-sm font-medium">{user.fullName || user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-muted-foreground">
                  <User className="mr-2 h-4 w-4" />
                  Role: {user.role?.replace("_", " ")}
                </DropdownMenuItem>
                <DropdownMenuItem className="text-muted-foreground">
                  Site: {user.site}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => signOut({ callbackUrl: "/login" })}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
      </div>
    </header>
  )
}
