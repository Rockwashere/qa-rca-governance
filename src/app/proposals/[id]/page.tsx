"use client"

import React, { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { AppShell } from "@/components/layout/app-shell"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Globe, MapPin, Clock, CheckCircle, XCircle, AlertTriangle, MessageSquare, Send, Edit, Trash2 } from "lucide-react"
import { buildCodePath, formatDate, asStringArray } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"
import { canEditProposal, canDeleteProposal } from "@/lib/permissions"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"

export default function ProposalDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const { toast } = useToast()
  const [proposal, setProposal] = useState<any>(null)
  const [comments, setComments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState("")
  const [submittingDecision, setSubmittingDecision] = useState(false)
  const [submittingComment, setSubmittingComment] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch proposal
        const res = await fetch(`/api/proposals/${params.id}`)
        if (res.ok) {
          const data = await res.json()
          setProposal(data)
        } else {
          router.push("/proposals")
        }

        // Fetch comments
        const commentsRes = await fetch(`/api/proposals/${params.id}/comments`)
        if (commentsRes.ok) {
          const commentsData = await commentsRes.json()
          setComments(commentsData)
        }
      } catch (err) {
        console.error("Failed to fetch data:", err)
      } finally {
        setLoading(false)
      }
    }
    if (params.id) {
      fetchData()
    }
  }, [params.id, router])

  const handleDecision = async (decisionType: string, reason?: string) => {
    setSubmittingDecision(true)
    try {
      const res = await fetch(`/api/proposals/${params.id}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decisionType, reason }),
      })

      if (res.ok) {
        const updatedProposal = await res.json()
        setProposal(updatedProposal)
        toast({
          title: "Decision submitted",
          description: `Proposal ${decisionType.toLowerCase()}`,
        })
      } else {
        const error = await res.json()
        toast({
          title: "Error",
          description: error.error,
          variant: "destructive",
        })
      }
    } catch (err) {
      console.error("Decision error:", err)
      toast({
        title: "Error",
        description: "Failed to submit decision",
        variant: "destructive",
      })
    } finally {
      setSubmittingDecision(false)
    }
  }

  const handleComment = async () => {
    if (!newComment.trim()) return

    setSubmittingComment(true)
    try {
      const res = await fetch(`/api/proposals/${params.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment }),
      })

      if (res.ok) {
        const comment = await res.json()
        setComments([...comments, comment])
        setNewComment("")
        toast({
          title: "Comment added",
        })
      } else {
        const error = await res.json()
        toast({
          title: "Error",
          description: error.error,
          variant: "destructive",
        })
      }
    } catch (err) {
      console.error("Comment error:", err)
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive",
      })
    } finally {
      setSubmittingComment(false)
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

  const user = session?.user as any
  const canDecide = user?.role === "MANAGER" || user?.role === "ADMIN"
  const canComment = user?.role !== undefined

  const deleteProposal = async () => {
    try {
      const res = await fetch(`/api/proposals/${params.id}`, { method: "DELETE" })
      if (res.ok) {
        toast({ title: "Success", description: "Proposal deleted" })
        router.push("/proposals")
      } else {
        const error = await res.json()
        toast({ title: "Error", description: error.error || "Failed to delete", variant: "destructive" })
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to delete", variant: "destructive" })
    } finally {
      setDeleteDialogOpen(false)
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

  if (!proposal) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Proposal not found</div>
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
              <Badge className={getMainRcaColor(proposal.mainRca)}>{proposal.mainRca}</Badge>
              <Badge className={getStatusColor(proposal.status)}>
                {getStatusIcon(proposal.status)}
                <span className="ml-1">{proposal.status}</span>
              </Badge>
              {proposal.scope === "GLOBAL" ? (
                <Badge variant="outline">
                  <Globe className="mr-1 h-3 w-3" />
                  Global
                </Badge>
              ) : (
                <Badge variant="outline">
                  <MapPin className="mr-1 h-3 w-3" />
                  {proposal.site}
                </Badge>
              )}
            </div>
            <h1 className="text-2xl font-bold">
              {buildCodePath(proposal.mainRca, proposal.rca1, proposal.rca2, proposal.rca3, proposal.rca4, proposal.rca5)}
            </h1>
          </div>

          {/* Decision Actions */}
          {canDecide && proposal.status === "PENDING" && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => handleDecision("APPROVED")}
                disabled={submittingDecision}
              >
                Approve
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  const reason = prompt("Rejection reason:")
                  if (reason) handleDecision("REJECTED", reason)
                }}
                disabled={submittingDecision}
              >
                Reject
              </Button>
            </div>
          )}

          {/* Edit/Delete Actions */}
          <div className="flex gap-2">
            {canEditProposal(user?.role, proposal.createdById === user?.id, proposal.status) && (
              <Button variant="outline" onClick={() => router.push(`/proposals/${params.id}/edit`)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            )}
            {canDeleteProposal(user?.role, proposal.createdById === user?.id, proposal.status) && (
              <Button variant="outline" onClick={() => setDeleteDialogOpen(true)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            )}
          </div>
        </div>

        {/* Code Hierarchy */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Code Hierarchy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={getMainRcaColor(proposal.mainRca)}>{proposal.mainRca}</Badge>
              {proposal.rca1 && (
                <>
                  <span className="text-muted-foreground">›</span>
                  <Badge variant="outline">{proposal.rca1}</Badge>
                </>
              )}
              {proposal.rca2 && (
                <>
                  <span className="text-muted-foreground">›</span>
                  <Badge variant="outline">{proposal.rca2}</Badge>
                </>
              )}
              {proposal.rca3 && (
                <>
                  <span className="text-muted-foreground">›</span>
                  <Badge variant="outline">{proposal.rca3}</Badge>
                </>
              )}
              {proposal.rca4 && (
                <>
                  <span className="text-muted-foreground">›</span>
                  <Badge variant="outline">{proposal.rca4}</Badge>
                </>
              )}
              {proposal.rca5 && (
                <>
                  <span className="text-muted-foreground">›</span>
                  <Badge variant="outline">{proposal.rca5}</Badge>
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
              <p className="text-muted-foreground">{proposal.definition}</p>
            </div>

            {proposal.useWhen && (
              <div>
                <h4 className="mb-2 font-medium text-green-700">✓ When to Use</h4>
                <p className="text-muted-foreground">{proposal.useWhen}</p>
              </div>
            )}

            {proposal.dontUseWhen && (
              <div>
                <h4 className="mb-2 font-medium text-red-700">✗ When NOT to Use</h4>
                <p className="text-muted-foreground">{proposal.dontUseWhen}</p>
              </div>
            )}

            {proposal.examples && asStringArray(proposal.examples).length > 0 && (
              <div>
                <h4 className="mb-2 font-medium text-foreground">Examples</h4>
                <ul className="list-inside list-disc space-y-1 text-muted-foreground">
                  {asStringArray(proposal.examples).map((example: string, idx: number) => (
                    <li key={idx}>{example}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tags */}
        {proposal.tags && asStringArray(proposal.tags).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tags</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {asStringArray(proposal.tags).map((tag: string) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Rejection Reason */}
        {proposal.status === "REJECTED" && proposal.rejectReason && (
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-lg text-red-800">Rejection Reason</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-700">{proposal.rejectReason}</p>
              {proposal.rejectedBy && (
                <p className="mt-2 text-sm text-red-600">
                  Rejected by: {proposal.rejectedBy.fullName}
                </p>
              )}
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
                <p className="font-medium">{proposal.createdBy?.fullName || "Unknown"}</p>
                <p className="text-xs text-muted-foreground">{proposal.createdBy?.site}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Created At</p>
                <p className="font-medium">{formatDate(proposal.createdAt)}</p>
              </div>
              {proposal.approvedBy && (
                <div>
                  <p className="text-sm text-muted-foreground">Approved By</p>
                  <p className="font-medium">{proposal.approvedBy.fullName}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Version</p>
                <p className="font-medium">v{proposal.version}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last Updated</p>
                <p className="font-medium">{formatDate(proposal.updatedAt)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Proposal ID</p>
                <p className="font-mono text-xs">{proposal.id}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Decision History */}
        {proposal.decisions && proposal.decisions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Decision History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {proposal.decisions.map((decision: any) => (
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

        {/* Comments */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Comments ({comments.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {comments.map((comment: any) => (
              <div key={comment.id} className="border-l-2 border-muted pl-4">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{comment.user?.fullName}</span>
                  <span className="text-xs text-muted-foreground">
                    {comment.user?.site} • {comment.user?.role.replace("_", " ").toLowerCase()}
                  </span>
                </div>
                <p className="mt-1 text-sm">{comment.content}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatDate(comment.createdAt)}
                </p>
              </div>
            ))}

            {canComment && (
              <>
                <Separator />
                <div className="space-y-2">
                  <Textarea
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                  />
                  <Button
                    onClick={handleComment}
                    disabled={!newComment.trim() || submittingComment}
                    className="w-full"
                  >
                    <Send className="mr-2 h-4 w-4" />
                    {submittingComment ? "Posting..." : "Post Comment"}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

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
              <Button onClick={deleteProposal} variant="destructive">
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  )
}
