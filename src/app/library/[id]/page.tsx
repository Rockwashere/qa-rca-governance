"use client"

import React, { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { AppShell } from "@/components/layout/app-shell"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Copy, Globe, MapPin, Clock, CheckCircle, XCircle, AlertTriangle } from "lucide-react"
import { buildCodePath, formatDate, asStringArray } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"

export default function CodeDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const { toast } = useToast()
  const [code, setCode] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchCode() {
      try {
        const res = await fetch(`/api/codes/${params.id}`)
        if (res.ok) {
          const data = await res.json()
          setCode(data)
        } else {
          router.push("/library")
        }
      } catch (err) {
        console.error("Failed to fetch code:", err)
      } finally {
        setLoading(false)
      }
    }
    if (params.id) {
      fetchCode()
    }
  }, [params.id, router])

  const copyCodePath = () => {
    if (code) {
      const path = buildCodePath(code.mainRca, code.rca1, code.rca2, code.rca3, code.rca4, code.rca5)
      navigator.clipboard.writeText(path)
      toast({
        title: "Copied!",
        description: "Code path copied to clipboard",
      })
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "APPROVED": return <CheckCircle className="h-4 w-4 text-green-600" />
      case "PENDING": return <Clock className="h-4 w-4 text-yellow-600" />
      case "REJECTED": return <XCircle className="h-4 w-4 text-red-600" />
      case "DEPRECATED": return <AlertTriangle className="h-4 w-4 text-gray-600" />
      default: return null
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

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </AppShell>
    )
  }

  if (!code) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Code not found</div>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Back button */}
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge className={getMainRcaColor(code.mainRca)}>{code.mainRca}</Badge>
              <Badge className={getStatusColor(code.status)}>
                {getStatusIcon(code.status)}
                <span className="ml-1">{code.status}</span>
              </Badge>
              {code.scope === "GLOBAL" ? (
                <Badge variant="outline">
                  <Globe className="mr-1 h-3 w-3" />
                  Global
                </Badge>
              ) : (
                <Badge variant="outline">
                  <MapPin className="mr-1 h-3 w-3" />
                  {code.site}
                </Badge>
              )}
            </div>
            <h1 className="text-2xl font-bold">
              {buildCodePath(code.mainRca, code.rca1, code.rca2, code.rca3, code.rca4, code.rca5)}
            </h1>
          </div>
          <Button variant="outline" onClick={copyCodePath}>
            <Copy className="mr-2 h-4 w-4" />
            Copy Path
          </Button>
        </div>

        {/* Code Hierarchy */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Code Hierarchy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={getMainRcaColor(code.mainRca)}>{code.mainRca}</Badge>
              {code.rca1 && (
                <>
                  <span className="text-muted-foreground">›</span>
                  <Badge variant="outline">{code.rca1}</Badge>
                </>
              )}
              {code.rca2 && (
                <>
                  <span className="text-muted-foreground">›</span>
                  <Badge variant="outline">{code.rca2}</Badge>
                </>
              )}
              {code.rca3 && (
                <>
                  <span className="text-muted-foreground">›</span>
                  <Badge variant="outline">{code.rca3}</Badge>
                </>
              )}
              {code.rca4 && (
                <>
                  <span className="text-muted-foreground">›</span>
                  <Badge variant="outline">{code.rca4}</Badge>
                </>
              )}
              {code.rca5 && (
                <>
                  <span className="text-muted-foreground">›</span>
                  <Badge variant="outline">{code.rca5}</Badge>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Definition & Guidance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Definition & Guidance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="mb-2 font-medium text-foreground">Definition</h4>
              <p className="text-muted-foreground">{code.definition}</p>
            </div>

            {code.useWhen && (
              <div>
                <h4 className="mb-2 font-medium text-green-700">✓ When to Use</h4>
                <p className="text-muted-foreground">{code.useWhen}</p>
              </div>
            )}

            {code.dontUseWhen && (
              <div>
                <h4 className="mb-2 font-medium text-red-700">✗ When NOT to Use</h4>
                <p className="text-muted-foreground">{code.dontUseWhen}</p>
              </div>
            )}

            {code.examples && (code.examples as string[]).length > 0 && (
              <div>
                <h4 className="mb-2 font-medium text-foreground">Examples</h4>
                <ul className="list-inside list-disc space-y-1 text-muted-foreground">
                  {asStringArray(code.examples).map((example: string, idx: number) => (
                    <li key={idx}>{example}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tags */}
        {code.tags && (code.tags as string[]).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tags</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {asStringArray(code.tags).map((tag: string) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Rejection Reason */}
        {code.status === "REJECTED" && code.rejectReason && (
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-lg text-red-800">Rejection Reason</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-700">{code.rejectReason}</p>
              {code.rejectedBy && (
                <p className="mt-2 text-sm text-red-600">
                  Rejected by: {code.rejectedBy.fullName}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Merged Into */}
        {code.status === "MERGED" && code.mergedInto && (
          <Card className="border-purple-200 bg-purple-50">
            <CardHeader>
              <CardTitle className="text-lg text-purple-800">Merged Into</CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                variant="link"
                className="p-0 text-purple-700"
                onClick={() => router.push(`/library/${code.mergedInto.id}`)}
              >
                {buildCodePath(code.mergedInto.mainRca, code.mergedInto.rca1, code.mergedInto.rca2)}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Metadata */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Metadata</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Created By</p>
                <p className="font-medium">{code.createdBy?.fullName || "Unknown"}</p>
                <p className="text-xs text-muted-foreground">{code.createdBy?.site}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Created At</p>
                <p className="font-medium">{formatDate(code.createdAt)}</p>
              </div>
              {code.approvedBy && (
                <div>
                  <p className="text-sm text-muted-foreground">Approved By</p>
                  <p className="font-medium">{code.approvedBy.fullName}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Version</p>
                <p className="font-medium">v{code.version}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last Updated</p>
                <p className="font-medium">{formatDate(code.updatedAt)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Code ID</p>
                <p className="font-mono text-xs">{code.id}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Decision History */}
        {code.decisions && code.decisions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Decision History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {code.decisions.map((decision: any) => (
                  <div key={decision.id} className="border-l-2 border-muted pl-4">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{decision.decisionType}</Badge>
                      <span className="text-sm text-muted-foreground">
                        by {decision.decidedBy?.fullName}
                      </span>
                    </div>
                    {decision.reason && (
                      <p className="mt-1 text-sm text-muted-foreground">{decision.reason}</p>
                    )}
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDate(decision.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  )
}
