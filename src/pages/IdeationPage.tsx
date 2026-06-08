import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Lightbulb, Loader2, Plus, Sparkles, UsersRound } from "lucide-react"
import { toast } from "sonner"
import { ideationApi } from "@/lib/api"
import { firstValidationError, validateRequiredText } from "@/lib/validation"
import type { CreateIdeaRequest, IdeaItem, RecommendationItem } from "@/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const DEFAULT_PAGE_SIZE = 20
const MAX_TAGS = 20
const MAX_TAG_LENGTH = 100

function parseTags(raw: string): string[] {
  const unique = new Set<string>()
  for (const item of raw.split(",")) {
    const trimmed = item.trim()
    if (!trimmed || trimmed.length > MAX_TAG_LENGTH) continue
    unique.add(trimmed)
    if (unique.size >= MAX_TAGS) break
  }
  return [...unique]
}

function initials(name: string): string {
  const chunks = name.trim().split(/\s+/).filter(Boolean)
  if (chunks.length === 0) return "?"
  if (chunks.length === 1) return chunks[0].slice(0, 2).toUpperCase()
  return `${chunks[0][0]}${chunks[chunks.length - 1][0]}`.toUpperCase()
}

export default function IdeationPage() {
  const queryClient = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [tagsText, setTagsText] = useState("")

  const ideasQuery = useQuery({
    queryKey: ["ideation", "ideas", DEFAULT_PAGE_SIZE],
    queryFn: () => ideationApi.listMyIdeas({ take: DEFAULT_PAGE_SIZE, skip: 0 }),
  })

  const recommendationsQuery = useQuery({
    queryKey: ["ideation", "recommendations", DEFAULT_PAGE_SIZE],
    queryFn: () => ideationApi.listMyRecommendations({ take: DEFAULT_PAGE_SIZE, skip: 0 }),
  })

  const parsedTags = useMemo(() => parseTags(tagsText), [tagsText])

  const createIdeaMutation = useMutation({
    mutationFn: (payload: CreateIdeaRequest) => ideationApi.createIdea(payload),
    onSuccess: (createdIdea) => {
      toast.success("Idea saved")
      setTitle("")
      setDescription("")
      setTagsText("")
      setCreateOpen(false)
      queryClient.setQueryData<IdeaItem[]>(
        ["ideation", "ideas", DEFAULT_PAGE_SIZE],
        (existing) => [createdIdea, ...(existing ?? [])]
      )
      queryClient.invalidateQueries({ queryKey: ["ideation", "recommendations"] })
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to create idea")
    },
  })

  const handleCreateIdea = () => {
    const validationError = firstValidationError(
      validateRequiredText(title, "Title"),
      validateRequiredText(description, "Description")
    )
    if (validationError) {
      toast.error(validationError)
      return
    }

    createIdeaMutation.mutate({
      title: title.trim(),
      description: description.trim(),
      tags: parsedTags.length > 0 ? parsedTags : undefined,
    })
  }

  const ideas = ideasQuery.data ?? []
  const matches = recommendationsQuery.data ?? []
  const highMatches = matches.filter((item) => item.score >= 0.7).length

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <section className="overflow-hidden rounded-2xl border border-border/70 bg-card/80 shadow-sm">
        <div className="relative p-6 sm:p-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_10%,rgba(200,168,107,0.18),transparent_30%),radial-gradient(circle_at_90%_0%,rgba(139,90,43,0.12),transparent_24%)]" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/45 px-3 py-1 text-xs text-muted-foreground">
                <Lightbulb className="h-3.5 w-3.5 text-accent" />
                Idea workspace
              </div>
              <div>
                <h1 className="font-brand text-3xl tracking-wide text-foreground sm:text-4xl">
                  Ideation
                </h1>
                <p className="mt-2 text-sm leading-6 text-muted-foreground sm:text-base">
                  Capture raw thoughts, keep them organized, and find teammates working on similar directions.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <MetricCard label="Ideas" value={ideas.length} />
              <MetricCard label="Matches" value={matches.length} />
              <MetricCard label="Strong" value={highMatches} />
              <Button className="gap-2 shadow-sm" onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4" />
                Add idea
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(340px,0.75fr)]">
        <section className="rounded-2xl border border-border/70 bg-card/75 shadow-sm">
          <SectionHeader
            icon={<Lightbulb className="h-4 w-4" />}
            title="My Ideas"
            subtitle="Newest concepts are shown first."
            count={ideas.length}
          />
          <div className="space-y-3 p-4 pt-0">
            {ideasQuery.isLoading ? (
              <LoadingList />
            ) : ideasQuery.isError ? (
              <ErrorState message={(ideasQuery.error as Error)?.message ?? "Failed to load ideas"} />
            ) : ideas.length === 0 ? (
              <EmptyState
                title="No ideas yet"
                body="Start with a rough thought. You can refine the idea later."
              />
            ) : (
              ideas.map((idea) => <IdeaCard key={idea.id} idea={idea} />)
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-border/70 bg-card/75 shadow-sm">
          <SectionHeader
            icon={<UsersRound className="h-4 w-4" />}
            title="Matches"
            subtitle="People working in nearby territory."
            count={matches.length}
          />
          <div className="space-y-3 p-4 pt-0">
            {recommendationsQuery.isLoading ? (
              <LoadingList />
            ) : recommendationsQuery.isError ? (
              <ErrorState message={(recommendationsQuery.error as Error)?.message ?? "Failed to load matches"} />
            ) : matches.length === 0 ? (
              <EmptyState
                title="No matches yet"
                body="Add more ideas to give matching enough context."
              />
            ) : (
              matches.map((item) => <MatchCard key={item.id} item={item} />)
            )}
          </div>
        </section>
      </div>

      <div className="rounded-2xl border border-dashed border-border/70 bg-background/30 p-4 text-sm text-muted-foreground">
        <div className="flex items-start gap-3">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
          <p>
            Matching improves as ideas get more specific. Write enough context for another teammate to understand what you are trying to make.
          </p>
        </div>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>New idea</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="idea-title">Title</Label>
              <Input
                id="idea-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={500}
                placeholder="Short title"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="idea-description">Description</Label>
              <Textarea
                id="idea-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={8000}
                rows={6}
                placeholder="What are you thinking about?"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="idea-tags">Tags (optional)</Label>
              <Input
                id="idea-tags"
                value={tagsText}
                onChange={(e) => setTagsText(e.target.value)}
                placeholder="ai, newsletter"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={createIdeaMutation.isPending}>
              Cancel
            </Button>
            <Button onClick={handleCreateIdea} disabled={createIdeaMutation.isPending} className="gap-2">
              {createIdeaMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-[86px] rounded-xl border border-border/70 bg-background/45 px-3 py-2">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-lg font-semibold leading-none text-foreground">{value}</p>
    </div>
  )
}

function SectionHeader({
  icon,
  title,
  subtitle,
  count,
}: {
  icon: React.ReactNode
  title: string
  subtitle: string
  count: number
}) {
  return (
    <div className="flex items-start justify-between gap-3 p-4">
      <div className="flex gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full border border-border/70 bg-background/50 text-accent">
          {icon}
        </div>
        <div>
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <span className="rounded-full border border-border/70 bg-background/50 px-2.5 py-1 text-xs text-muted-foreground">
        {count}
      </span>
    </div>
  )
}

function LoadingList() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-28 w-full rounded-xl" />
      <Skeleton className="h-28 w-full rounded-xl" />
    </div>
  )
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
      {message}
    </div>
  )
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-border/70 bg-background/35 p-8 text-center">
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">{body}</p>
    </div>
  )
}

function IdeaCard({ idea }: { idea: IdeaItem }) {
  return (
    <article className="rounded-xl border border-border/70 bg-background/40 p-4 transition-colors hover:border-primary/70 hover:bg-background/55">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold leading-5 text-foreground">{idea.title}</h3>
          <time className="mt-1 block text-xs text-muted-foreground">
            {new Date(idea.createdAt).toLocaleDateString()}
          </time>
        </div>
      </div>
      <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">
        {idea.description}
      </p>
      {idea.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {idea.tags.map((tag) => (
            <Badge
              key={`${idea.id}-${tag}`}
              variant="outline"
              className="border-border/70 bg-card/60 text-[10px] font-normal text-muted-foreground"
            >
              {tag}
            </Badge>
          ))}
        </div>
      )}
    </article>
  )
}

function MatchCard({ item }: { item: RecommendationItem }) {
  const pct = (item.score * 100).toFixed(0)

  return (
    <article className="rounded-xl border border-border/70 bg-background/40 p-4 transition-colors hover:border-primary/70 hover:bg-background/55">
      <div className="flex gap-3">
        <Avatar className="h-10 w-10 shrink-0 border border-border/60">
          {item.matchedUser.avatarUrl && (
            <AvatarImage src={item.matchedUser.avatarUrl} alt={item.matchedUser.name} />
          )}
          <AvatarFallback className="text-xs">{initials(item.matchedUser.name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">{item.matchedUser.name}</p>
              <p className="truncate text-xs text-muted-foreground">{item.matchedUser.email}</p>
            </div>
            <span className="shrink-0 rounded-full bg-primary/15 px-2.5 py-1 text-xs font-medium text-accent">
              {pct}%
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <div className="rounded-lg border border-border/50 bg-card/35 p-3">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Matched idea</p>
          <p className="mt-1 line-clamp-2 text-sm font-medium text-foreground">{item.matchedIdea.title}</p>
        </div>
        <p className="line-clamp-2 text-xs leading-5 text-muted-foreground">
          From your idea: {item.sourceIdea.title}
        </p>
      </div>
    </article>
  )
}
