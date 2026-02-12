"use client"

import React, { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { AppShell } from "@/components/layout/app-shell"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileText, CheckCircle, Clock, XCircle, Library, Plus, ArrowRight } from "lucide-react"
import Link from "next/link"
import { buildCodePath, formatDateShort } from "@/lib/utils"

interface DashboardData {
  stats: {
    totalApproved: number
    totalPending: number
    totalRejected: number
    totalCodes: number
  }
  recentApproved: any[]
  pendingProposals: any[]
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch("/api/dashboard")
        if (res.ok) {
          const json = await res.json()
          setData(json)
        }
      } catch (err) {
        console.error("Failed to fetch dashboard:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchDashboard()
  }, [])

  const user = session?.user as any

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Welcome */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Welcome back, {user?.fullName || user?.name || "User"}
          </h1>
          <p className="text-muted-foreground">
            Here&apos;s an overview of the RCA governance status
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.stats.totalApproved ?? "—"}</div>
              <p className="text-xs text-muted-foreground">Active RCA codes</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Proposals</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.stats.totalPending ?? "—"}</div>
              <p className="text-xs text-muted-foreground">Awaiting review</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejected</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.stats.totalRejected ?? "—"}</div>
              <p className="text-xs text-muted-foreground">Rejected proposals</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Codes</CardTitle>
              <Library className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.stats.totalCodes ?? "—"}</div>
              <p className="text-xs text-muted-foreground">All statuses</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Pending Proposals */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Pending Proposals</CardTitle>
                  <CardDescription>Proposals awaiting manager review</CardDescription>
                </div>
                <Link href="/proposals">
                  <Button variant="outline" size="sm">
                    View All <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : data?.pendingProposals && data.pendingProposals.length > 0 ? (
                <div className="space-y-3">
                  {data.pendingProposals.map((proposal: any) => (
                    <Link
                      key={proposal.id}
                      href={`/proposals/${proposal.id}`}
                      className="flex items-center justify-between rounded-md border p-3 transition-colors hover:bg-accent"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {buildCodePath(proposal.mainRca, proposal.rca1, proposal.rca2)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          by {proposal.createdBy?.fullName} • {formatDateShort(proposal.createdAt)}
                        </p>
                      </div>
                      <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No pending proposals</p>
              )}
            </CardContent>
          </Card>

          {/* Recently Approved */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Recently Approved</CardTitle>
                  <CardDescription>Latest approved RCA codes</CardDescription>
                </div>
                <Link href="/library">
                  <Button variant="outline" size="sm">
                    Library <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : data?.recentApproved && data.recentApproved.length > 0 ? (
                <div className="space-y-3">
                  {data.recentApproved.map((code: any) => (
                    <Link
                      key={code.id}
                      href={`/library/${code.id}`}
                      className="flex items-center justify-between rounded-md border p-3 transition-colors hover:bg-accent"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {buildCodePath(code.mainRca, code.rca1, code.rca2)}
                        </p>
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-muted-foreground">
                            {formatDateShort(code.updatedAt)}
                          </p>
                          {code.scope === "SITE" && (
                            <Badge variant="outline" className="text-xs">
                              {code.site}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Badge className="bg-green-100 text-green-800">Approved</Badge>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No approved codes yet</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Link href="/proposals/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  New Proposal
                </Button>
              </Link>
              <Link href="/library">
                <Button variant="outline">
                  <Library className="mr-2 h-4 w-4" />
                  Browse Library
                </Button>
              </Link>
              <Link href="/proposals">
                <Button variant="outline">
                  <FileText className="mr-2 h-4 w-4" />
                  View Proposals
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
