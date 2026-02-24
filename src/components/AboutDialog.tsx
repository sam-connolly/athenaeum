import { Info } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
  DialogHeader,
  DialogDescription
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'

export function AboutDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Info size={24} />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>About Athenaeum</DialogTitle>
          <DialogDescription>
            Your personal knowledge repository
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-4">
            <section>
              <p className="text-sm text-muted-foreground">
                Athenaeum is a knowledge management system designed to help you organize, store, and retrieve information efficiently.
              </p>
            </section>
            <section>
              <h3 className="font-semibold mb-2">Features</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex gap-2">
                  <span className="text-accent font-semibold">•</span>
                  <span>Import documents from various sources</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-accent font-semibold">•</span>
                  <span>Smart content extraction and organization</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-accent font-semibold">•</span>
                  <span>Search and browse your knowledge base</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-accent font-semibold">•</span>
                  <span>Markdown rendering with rich formatting</span>
                </li>
              </ul>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
