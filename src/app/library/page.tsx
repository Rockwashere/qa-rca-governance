"use client"

import React, { useEffect, useState, useCallback } from "react"
import { useSession } from "next-auth/react"
import { AppShell } from "@/components/layout/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, Download, Filter, ChevronRight, Globe, MapPin } from "lucide-react"
import Link from "next/link"
import { buildCodePath, asStringArray } from "@/lib/utils"
import { MAIN_RCA_OPTIONS, SITE_OPTIONS } from "@/types"

export default function LibraryPage() {
  const { data: session } = useSession()
  const [codes, setCodes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filterMainRca, setFilterMainRca] = useState("")
  const [filterSite, setFilterSite] = useState("")
  const [filterStatus, setFilterStatus] = useState("APPROVED")
  const [showDeprecated, setShowDeprecated] = useState(false)

  const fetchCodes = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set("search", search)
      if (filterMainRca) params.set("mainRca", filterMainRca)
      if (filterSite) params.set("site", filterSite)
      if (filterStatus) params.set("status", filterStatus)
      if (showDeprecated) params.set("showDeprecated", "true")

      const res = await fetch(`/api/codes?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setCodes(data)
      }
    } catch (err) {
      console.error("Failed to fetch codes:", err)
    } finally {
      setLoading(false)
    }
  }, [search, filterMainRca, filterSite, filterStatus, showDeprecated])

  useEffect(() => {
    const debounce = setTimeout(fetchCodes, 300)
    return () => clearTimeout(debounce)
  }, [fetchCodes])

  const handleExport = async () => {
    try {
      const res = await fetch("/api/codes/export")
      if (res.ok) {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `rca-codes-export-${new Date().toISOString().split("T")[0]}.csv`
        document.body.appendChild(a)
        a.click()
        a.remove()
        window.URL.revokeObjectURL(url)
      }
    } catch (err) {
      console.error("Export failed:", err)
    }
  }

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

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">RCA Library</h1>
            <p className="text-muted-foreground">
              Browse and search the approved RCA taxonomy
            </p>
          </div>
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
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
                  placeholder="Search codes by name, definition, or tags..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Filter chips */}
              <div className="flex flex-wrap gap-2">
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Filter className="h-3 w-3" />
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
                  <option value="APPROVED">Approved</option>
                  <option value="ALL">All Statuses</option>
                  <option value="PENDING">Pending</option>
                  <option value="REJECTED">Rejected</option>
                  <option value="DEPRECATED">Deprecated</option>
                </select>

                {/* Show deprecated toggle */}
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={showDeprecated}
                    onChange={(e) => setShowDeprecated(e.target.checked)}
                    className="rounded"
                  />
                  Show deprecated
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results count */}
        <div className="text-sm text-muted-foreground">
          {loading ? "Loading..." : `${codes.length} code(s) found`}
        </div>

        {/* Codes List */}
        <div className="space-y-2">
          {loading ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Loading codes...
              </CardContent>
            </Card>
          ) : codes.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No codes found matching your criteria
              </CardContent>
            </Card>
          ) : (
            codes.map((code: any) => (
              <Link key={code.id} href={`/library/${code.id}`}>
                <Card className="cursor-pointer transition-colors hover:bg-accent/50">
                  <CardContent className="flex items-center justify-between py-4">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge className={getMainRcaColor(code.mainRca)}>
                          {code.mainRca}
                        </Badge>
                        <span className="text-sm font-medium">
                          {buildCodePath(code.mainRca, code.rca1, code.rca2, code.rca3, code.rca4, code.rca5)}
                        </span>
                        <Badge className={getStatusColor(code.status)}>
                          {code.status}
                        </Badge>
                        {code.scope === "GLOBAL" ? (
                          <Globe className="h-3 w-3 text-muted-foreground" />
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {code.site}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {code.definition}
                      </p>
                      {code.tags && (code.tags as string[]).length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {asStringArray(code.tags).slice(0, 5).map((tag: string) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </div>
      </div>
    </AppShell>
  )
}
