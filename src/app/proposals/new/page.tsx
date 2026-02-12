"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { AppShell } from "@/components/layout/app-shell"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, AlertTriangle, Plus, X } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { MAIN_RCA_OPTIONS, SITE_OPTIONS } from "@/types"
import { buildCodePath } from "@/lib/utils"

interface SimilarCode {
  id: string;
  rca1: string;
  rca2: string;
  rca3: string;
  mainRca: string;
  status: string;
  definition: string;
}

export default function NewProposalPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const { toast } = useToast()
  const user = session?.user as any

  const [formData, setFormData] = useState({
    mainRca: "",
    rca1: "",
    rca2: "",
    rca3: "",
    rca4: "",
    rca5: "",
    definition: "",
    useWhen: "",
    dontUseWhen: "",
    examples: [] as string[],
    tags: [] as string[],
    scope: "GLOBAL" as "GLOBAL" | "SITE",
    site: user?.site || "",
  })

  const [newExample, setNewExample] = useState("")
  const [newTag, setNewTag] = useState("")
  const [similarCodes, setSimilarCodes] = useState<SimilarCode[]>([])
  const [loading, setLoading] = useState(false)
  const [checkingSimilar, setCheckingSimilar] = useState(false)

  // Check for similar codes when form changes
  useEffect(() => {
    const checkSimilar = async () => {
      if (!formData.mainRca || !formData.rca1) {
        setSimilarCodes([])
        return
      }

      setCheckingSimilar(true)
      try {
        const params = new URLSearchParams({
          mainRca: formData.mainRca,
          rca1: formData.rca1,
          rca2: formData.rca2,
          rca3: formData.rca3,
          tags: formData.tags.join(","),
        })

        const res = await fetch(`/api/codes/similar?${params.toString()}`)
        if (res.ok) {
          const data = await res.json()
          setSimilarCodes(data)
        }
      } catch (err) {
        console.error("Failed to check similar codes:", err)
      } finally {
        setCheckingSimilar(false)
      }
    }

    const debounce = setTimeout(checkSimilar, 500)
    return () => clearTimeout(debounce)
  }, [formData.mainRca, formData.rca1, formData.rca2, formData.rca3, formData.tags])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch("/api/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        toast({
          title: "Success!",
          description: "Proposal submitted successfully",
        })
        router.push("/proposals")
      } else {
        const error = await res.json()
        toast({
          title: "Error",
          description: error.error || "Failed to submit proposal",
          variant: "destructive",
        })
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to submit proposal",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const addExample = () => {
    if (newExample.trim()) {
      setFormData(prev => ({
        ...prev,
        examples: [...prev.examples, newExample.trim()]
      }))
      setNewExample("")
    }
  }

  const removeExample = (index: number) => {
    setFormData(prev => ({
      ...prev,
      examples: prev.examples.filter((_, i) => i !== index)
    }))
  }

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }))
      setNewTag("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const codePath = buildCodePath(
    formData.mainRca,
    formData.rca1,
    formData.rca2,
    formData.rca3,
    formData.rca4,
    formData.rca5
  )

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">New RCA Proposal</h1>
            <p className="text-muted-foreground">
              Submit a new RCA code for approval
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Code Hierarchy */}
              <Card>
                <CardHeader>
                  <CardTitle>Code Hierarchy</CardTitle>
                  <CardDescription>
                    Define the hierarchical structure of your RCA code
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="mainRca">Main RCA *</Label>
                      <Select
                        value={formData.mainRca}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, mainRca: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select main category" />
                        </SelectTrigger>
                        <SelectContent>
                          {MAIN_RCA_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="scope">Scope</Label>
                      <Select
                        value={formData.scope}
                        onValueChange={(value: "GLOBAL" | "SITE") => setFormData(prev => ({
                          ...prev,
                          scope: value,
                          site: value === "GLOBAL" ? "" : (user?.site || "")
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="GLOBAL">Global (All Sites)</SelectItem>
                          <SelectItem value="SITE">Site Specific</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {formData.scope === "SITE" && (
                    <div className="space-y-2">
                      <Label htmlFor="site">Site *</Label>
                      <Select
                        value={formData.site}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, site: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select site" />
                        </SelectTrigger>
                        <SelectContent>
                          {SITE_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="rca1">RCA Level 1 *</Label>
                      <Input
                        id="rca1"
                        placeholder="e.g., Policies, Knowledge, Payment Gateway"
                        value={formData.rca1}
                        onChange={(e) => setFormData(prev => ({ ...prev, rca1: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rca2">RCA Level 2</Label>
                      <Input
                        id="rca2"
                        placeholder="Optional second level"
                        value={formData.rca2}
                        onChange={(e) => setFormData(prev => ({ ...prev, rca2: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rca3">RCA Level 3</Label>
                      <Input
                        id="rca3"
                        placeholder="Optional third level"
                        value={formData.rca3}
                        onChange={(e) => setFormData(prev => ({ ...prev, rca3: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rca4">RCA Level 4</Label>
                      <Input
                        id="rca4"
                        placeholder="Optional fourth level"
                        value={formData.rca4}
                        onChange={(e) => setFormData(prev => ({ ...prev, rca4: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="rca5">RCA Level 5</Label>
                    <Input
                      id="rca5"
                      placeholder="Optional fifth level"
                      value={formData.rca5}
                      onChange={(e) => setFormData(prev => ({ ...prev, rca5: e.target.value }))}
                    />
                  </div>

                  {codePath && (
                    <div className="rounded-md bg-muted p-3">
                      <p className="text-sm font-medium">Code Path Preview:</p>
                      <p className="text-sm text-muted-foreground font-mono">{codePath}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Definition & Guidance */}
              <Card>
                <CardHeader>
                  <CardTitle>Definition & Guidance</CardTitle>
                  <CardDescription>
                    Provide clear definition and usage guidance
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="definition">Definition *</Label>
                    <Textarea
                      id="definition"
                      placeholder="What does this RCA code mean?"
                      value={formData.definition}
                      onChange={(e) => setFormData(prev => ({ ...prev, definition: e.target.value }))}
                      required
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="useWhen">When to Use</Label>
                    <Textarea
                      id="useWhen"
                      placeholder="When should this RCA code be applied?"
                      value={formData.useWhen}
                      onChange={(e) => setFormData(prev => ({ ...prev, useWhen: e.target.value }))}
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dontUseWhen">When NOT to Use</Label>
                    <Textarea
                      id="dontUseWhen"
                      placeholder="Common mistakes or when this should NOT be used"
                      value={formData.dontUseWhen}
                      onChange={(e) => setFormData(prev => ({ ...prev, dontUseWhen: e.target.value }))}
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Examples & Tags */}
              <Card>
                <CardHeader>
                  <CardTitle>Examples & Tags</CardTitle>
                  <CardDescription>
                    Add examples and relevant tags for better categorization
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Examples */}
                  <div className="space-y-2">
                    <Label>Examples</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add an example..."
                        value={newExample}
                        onChange={(e) => setNewExample(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addExample())}
                      />
                      <Button type="button" onClick={addExample} size="sm">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    {formData.examples.length > 0 && (
                      <div className="space-y-2">
                        {formData.examples.map((example, index) => (
                          <div key={index} className="flex items-center gap-2 rounded-md border p-2">
                            <span className="flex-1 text-sm">{example}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeExample(index)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Tags */}
                  <div className="space-y-2">
                    <Label>Tags</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add a tag..."
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                      />
                      <Button type="button" onClick={addTag} size="sm">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    {formData.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {formData.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                            {tag} <X className="ml-1 h-3 w-3" />
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Submitting..." : "Submit Proposal"}
              </Button>
            </form>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Similar Codes Warning */}
            {similarCodes.length > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Similar codes found!</strong> Please review these existing codes before submitting your proposal.
                </AlertDescription>
              </Alert>
            )}

            {/* Similar Codes */}
            {similarCodes.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Similar Existing Codes</CardTitle>
                  <CardDescription>
                    These codes might be similar to your proposal
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {similarCodes.slice(0, 5).map((code) => (
                      <div key={code.id} className="rounded-md border p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            {code.mainRca}
                          </Badge>
                          <Badge
                            variant={code.status === "APPROVED" ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {code.status}
                          </Badge>
                        </div>
                        <p className="text-sm font-medium">
                          {buildCodePath(code.mainRca, code.rca1, code.rca2, code.rca3)}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {code.definition}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Code Path</p>
                    <p className="text-sm font-mono">
                      {codePath || "Complete the form to see preview"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Definition</p>
                    <p className="text-sm">
                      {formData.definition || "No definition provided"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Tags</p>
                    <div className="flex flex-wrap gap-1">
                      {formData.tags.length > 0 ? (
                        formData.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground">No tags</span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
