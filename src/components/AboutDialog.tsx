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
        <Button variant="ghost" size="icon">
          <Info size={20} />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>About Athenaeum</DialogTitle>
          <DialogDescription>
            A knowledge management system for organizing and exploring your documents
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-6">
            <section>
              <h3 className="font-semibold mb-2">Features</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Import documents with metadata extraction</li>
                <li>Smart document organization</li>
                <li>Full-text search across all documents</li>
                <li>Related document discovery</li>
              </ul>
            </section>
            
            <section>
              <h3 className="font-semibold mb-2">Version</h3>
              <p className="text-sm text-muted-foreground">1.0.0</p>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
