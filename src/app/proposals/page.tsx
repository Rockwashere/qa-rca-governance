"use client"

import React, { useEffect, useState, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { AppShell } from "@/components/layout/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, ChevronRight, Globe, MapPin, MessageSquare, MoreHorizontal, Edit, Trash2, Eye } from "lucide-react"
import Link from "next/link"
import { buildCodePath } from "@/lib/utils"
import { MAIN_RCA_OPTIONS, SITE_OPTIONS } from "@/types"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { canEditProposal, canDeleteProposal } from "@/lib/permissions"

export default function ProposalsPage() {
  const { data: session } = useSession()
  const [proposals, setProposals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filterMainRca, setFilterMainRca] = useState("")
  const [filterSite, setFilterSite] = useState("")
  const [filterStatus, setFilterStatus] = useState("")

  const fetchProposals = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set("search", search)
      if (filterMainRca) params.set("mainRca", filterMainRca)
      if (filterSite) params.set("site", filterSite)
      if (filterStatus) params.set("status", filterStatus)

      const res = await fetch(`/api/proposals?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setProposals(data)
      }
    } catch (err) {
      console.error("Failed to fetch proposals:", err)
    } finally {
      setLoading(false)
    }
  }, [search, filterMainRca, filterSite, filterStatus])

  useEffect(() => {
    const debounce = setTimeout(fetchProposals, 300)
    return () => clearTimeout(debounce)
  }, [fetchProposals])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED": return "bg-green-100 text-green-800"
      case "PENDING": return "bg-yellow-100 text-yellow-800"
      case "REJECTED": return "bg-red-100 text-red-800"
      case "DEPRECATED": return "bg-gray-100 text-gray-800"
      case "MERGED": return "bg-purple-100 text-purple-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getMainRcaColor = (mainRca: string) => {
    switch (mainRca) {
      case "AGENT": return "bg-blue-100 text-blue-800"
      case "PROCESS": return "bg-orange-100 text-orange-800"
      case "TECHNOLOGY": return "bg-purple-100 text-purple-800"
      case "CUSTOMER": return "bg-teal-100 text-teal-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const user = session?.user as any
  const router = useRouter()
  const { toast } = useToast()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const deleteProposal = async (id: string) => {
    try {
      const res = await fetch(`/api/proposals/${id}`, { method: "DELETE" })
      if (res.ok) {
        toast({ title: "Success", description: "Proposal deleted" })
        fetchProposals()
      } else {
        const error = await res.json()
        toast({ title: "Error", description: error.error || "Failed to delete", variant: "destructive" })
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to delete", variant: "destructive" })
    } finally {
      setDeleteDialogOpen(false)
      setDeletingId(null)
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Proposals</h1>
            <p className="text-muted-foreground">
              Review and manage RCA code proposals
            </p>
          </div>
          <Button asChild>
            <Link href="/proposals/new">
              <Plus className="mr-2 h-4 w-4" />
              New Proposal
            </Link>
          </Button>
        </div>

        {/* Search & Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search proposals by name, definition, or tags..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Filter chips */}
              <div className="flex flex-wrap gap-2">
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  Filters:
                </div>

                {/* Main RCA filter */}
                <select
                  value={filterMainRca}
                  onChange={(e) => setFilterMainRca(e.target.value)}
                  className="rounded-md border bg-background px-3 py-1 text-sm"
                >
                  <option value="">All Categories</option>
                  {MAIN_RCA_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>

                {/* Site filter (for managers/admins) */}
                {(user?.role === "MANAGER" || user?.role === "ADMIN") && (
                  <select
                    value={filterSite}
                    onChange={(e) => setFilterSite(e.target.value)}
                    className="rounded-md border bg-background px-3 py-1 text-sm"
                  >
                    <option value="">All Sites</option>
                    {SITE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                )}

                {/* Status filter */}
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="rounded-md border bg-background px-3 py-1 text-sm"
                >
                  <option value="">All Statuses</option>
                  <option value="PENDING">Pending</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                  <option value="DEPRECATED">Deprecated</option>
                  <option value="MERGED">Merged</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results count */}
        <div className="text-sm text-muted-foreground">
          {loading ? "Loading..." : `${proposals.length} proposal(s) found`}
        </div>

        {/* Proposals List */}
        <div className="space-y-2">
          {loading ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Loading proposals...
              </CardContent>
            </Card>
          ) : proposals.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No proposals found matching your criteria
              </CardContent>
            </Card>
          ) : (
            proposals.map((proposal: any) => (
              <Link key={proposal.id} href={`/proposals/${proposal.id}`}>
                <Card className="cursor-pointer transition-colors hover:bg-accent/50">
                  <CardContent className="flex items-center justify-between py-4">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge className={getMainRcaColor(proposal.mainRca)}>
                          {proposal.mainRca}
                        </Badge>
                        <span className="text-sm font-medium">
                          {buildCodePath(proposal.mainRca, proposal.rca1, proposal.rca2, proposal.rca3, proposal.rca4, proposal.rca5)}
                        </span>
                        <Badge className={getStatusColor(proposal.status)}>
                          {proposal.status}
                        </Badge>
                        {proposal.scope === "GLOBAL" ? (
                          <Globe className="h-3 w-3 text-muted-foreground" />
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {proposal.site}
                          </span>
                        )}
                        {proposal._count?.comments > 0 && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MessageSquare className="h-3 w-3" />
                            {proposal._count.comments}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {proposal.definition}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>By {proposal.createdBy?.fullName}</span>
                        {proposal.createdBy?.site && <span>• {proposal.createdBy.site}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </DropdownMenuItem>
                          {canEditProposal(user?.role, proposal.createdById === user?.id, proposal.status) && (
                            <DropdownMenuItem onClick={(e) => { e.preventDefault(); router.push(`/proposals/${proposal.id}/edit`) }}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                          )}
                          {canDeleteProposal(user?.role, proposal.createdById === user?.id, proposal.status) && (
                            <DropdownMenuItem onClick={(e) => { e.preventDefault(); setDeletingId(proposal.id); setDeleteDialogOpen(true); }}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </div>

        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Proposal</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this proposal? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button onClick={() => deletingId && deleteProposal(deletingId)} variant="destructive">
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  )
}
