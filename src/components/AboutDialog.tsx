import { Info } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'

export function AboutDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title="About Athenaeum">
          <Info size={20} />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl">About Athenaeum</DialogTitle>
          <DialogDescription>
            Your personal knowledge repository
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(85vh-8rem)]">
          <div className="space-y-6 pr-4">
            <section>
              <h3 className="text-lg font-semibold mb-2 text-foreground">What is Athenaeum?</h3>
              <p className="text-muted-foreground leading-relaxed">
                Athenaeum is a wiki-style documentation platform designed to help you build and maintain your personal knowledge base. Import documents from Google Drive, organize them effortlessly, and navigate your collected wisdom with elegant simplicity.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2 text-foreground">The Name</h3>
              <p className="text-muted-foreground leading-relaxed mb-3">
                The word <em>Athenaeum</em> comes from ancient Greece, originally referring to a temple dedicated to Athena, the goddess of wisdom and knowledge. In Roman times, an Athenaeum was a place where scholars gathered to teach, learn, and exchange ideas.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Over the centuries, the term evolved to describe libraries, literary institutions, and reading rooms where knowledge was preserved and shared. We've chosen this name to honor that rich tradition—your Athenaeum is a digital sanctuary for your most valuable information.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2 text-foreground">Purpose & Vision</h3>
              <p className="text-muted-foreground leading-relaxed mb-3">
                In an age of information overload, Athenaeum provides a calm, focused space to curate what matters. Whether you're documenting a fictional universe, organizing research notes, or building a personal wiki, Athenaeum adapts to your needs.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Our philosophy is simple: beautiful typography, intuitive navigation, and powerful features that stay out of your way until you need them. Your knowledge deserves a home that's as thoughtful as the content itself.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2 text-foreground">Key Features</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-accent font-semibold mt-0.5">•</span>
                  <span><strong className="text-foreground">Smart Import:</strong> Bring in documents from Google Drive with AI-powered character extraction</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent font-semibold mt-0.5">•</span>
                  <span><strong className="text-foreground">Structured Database:</strong> Organize entities like characters, factions, and battles with rich metadata</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent font-semibold mt-0.5">•</span>
                  <span><strong className="text-foreground">Intuitive Search:</strong> Find anything instantly across all your documents</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent font-semibold mt-0.5">•</span>
                  <span><strong className="text-foreground">Cross-References:</strong> Link related documents for easy navigation through connected ideas</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent font-semibold mt-0.5">•</span>
                  <span><strong className="text-foreground">Persistent Storage:</strong> Your knowledge stays with you, automatically saved and always accessible</span>
                </li>
              </ul>
            </section>

            <section className="pt-2">
              <p className="text-sm text-muted-foreground italic">
                "The only true wisdom is in knowing you know nothing." — Socrates
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                But with Athenaeum, at least you can organize what you're learning along the way.
              </p>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
