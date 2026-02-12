"use client"

import React, { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { AppShell } from "@/components/layout/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Filter } from "lucide-react"
import { formatDate } from "@/lib/utils"

export default function AuditLogsPage() {
  const { data: session } = useSession()
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [limit] = useState(50)
  const [offset, setOffset] = useState(0)
  const [filters, setFilters] = useState({
    action: "__ALL__",
    entityType: "__ALL__",
    actorId: "__ALL__",
    dateFrom: "",
    dateTo: "",
  })

  useEffect(() => {
    fetchLogs()
  }, [filters, offset])

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.action !== "__ALL__") params.set("action", filters.action)
      if (filters.entityType !== "__ALL__") params.set("entityType", filters.entityType)
      if (filters.actorId !== "__ALL__") params.set("actorId", filters.actorId)
      params.set("limit", limit.toString())
      params.set("offset", offset.toString())

      const res = await fetch(`/api/audit-logs?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setLogs(data.auditLogs)
        setTotal(data.total)
      }
    } catch (err) {
      console.error("Failed to fetch audit logs:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters({ ...filters, [key]: value })
    setOffset(0) // Reset pagination
  }

  const getActionColor = (action: string) => {
    if (action.includes("CREATED")) return "bg-green-100 text-green-800"
    if (action.includes("UPDATED") || action.includes("CHANGED")) return "bg-blue-100 text-blue-800"
    if (action.includes("DELETED")) return "bg-red-100 text-red-800"
    return "bg-gray-100 text-gray-800"
  }

  const getEntityTypeColor = (entityType: string) => {
    switch (entityType) {
      case "user": return "bg-purple-100 text-purple-800"
      case "rca_code": return "bg-orange-100 text-orange-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const uniqueActions = [...new Set(logs.map(log => log.action))]
  const uniqueEntityTypes = [...new Set(logs.map(log => log.entityType))]
  const uniqueActors = [...new Set(logs.map(log => log.actor?.fullName).filter(Boolean))]

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Audit Logs</h1>
          <p className="text-muted-foreground">
            View system activity and changes
          </p>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="text-sm font-medium">Action</label>
                <Select value={filters.action} onValueChange={(value) => handleFilterChange("action", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All actions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__ALL__">All actions</SelectItem>
                    {uniqueActions.map((action) => (
                      <SelectItem key={action} value={action}>
                        {action}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Entity Type</label>
                <Select value={filters.entityType} onValueChange={(value) => handleFilterChange("entityType", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__ALL__">All types</SelectItem>
                    {uniqueEntityTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Actor</label>
                <Select value={filters.actorId} onValueChange={(value) => handleFilterChange("actorId", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All actors" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__ALL__">All actors</SelectItem>
                    {logs
                      .filter(log => log.actor)
                      .map(log => ({ id: log.actorId, name: log.actor.fullName }))
                      .filter((actor, index, self) => self.findIndex(a => a.id === actor.id) === index)
                      .map((actor) => (
                        <SelectItem key={actor.id} value={actor.id}>
                          {actor.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Date From</label>
                <Input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="text-sm text-muted-foreground">
          {loading ? "Loading..." : `Showing ${logs.length} of ${total} logs`}
        </div>

        {/* Logs Table */}
        <Card>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      Loading logs...
                    </TableCell>
                  </TableRow>
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      No logs found
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log: any) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm">
                        {formatDate(log.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{log.actor?.fullName}</div>
                          <div className="text-xs text-muted-foreground">
                            {log.actor?.role?.replace("_", " ").toLowerCase()}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getActionColor(log.action)}>
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <Badge className={getEntityTypeColor(log.entityType)} variant="outline">
                            {log.entityType}
                          </Badge>
                          <div className="text-xs text-muted-foreground mt-1">
                            ID: {log.entityId}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        {log.before && log.after && (
                          <div className="text-xs">
                            <div className="text-red-600">Before: {JSON.stringify(log.before)}</div>
                            <div className="text-green-600">After: {JSON.stringify(log.after)}</div>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Pagination */}
        {total > limit && (
          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              Page {Math.floor(offset / limit) + 1} of {Math.ceil(total / limit)}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setOffset(Math.max(0, offset - limit))}
                disabled={offset === 0}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                onClick={() => setOffset(offset + limit)}
                disabled={offset + limit >= total}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
