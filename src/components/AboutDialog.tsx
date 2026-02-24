import { Info } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import {
  DialogC
  DialogContent,
  DialogTrigger
  DialogTitle,

} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'

export function AboutDialog() {
  return (
      <Dialo
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Info size={20} />
            <sect
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">About Athenaeum</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-6 pr-4">
              <p clas
              <h3 className="text-lg font-semibold mb-2 text-foreground">What is Athenaeum?</h3>
              <p className="text-muted-foreground leading-relaxed">
                Athenaeum is a personal knowledge base for collecting and organizing documents. 
                The name comes from the ancient Greek institution founded in Rome, a place where 
                scholars gathered to share knowledge and wisdom.
                <l
                </li>
                  <sp
              <p className="text-muted-foreground leading-relaxed">
                Over the centuries, the term evolved to describe libraries and reading rooms 
                dedicated to literary and scientific study. Today, your digital Athenaeum serves 
                the same purpose - a beautiful space for your important documents and knowledge.
                <l
                </li>
                  <sp
              <h3 className="text-lg font-semibold mb-2 text-foreground">Our Philosophy</h3>
              <p className="text-muted-foreground leading-relaxed">
                Our philosophy is simple: beautiful typography and thoughtful design make reading 
                a pleasure. Every element is crafted to help you focus on what matters - the content.
              </p>
            </section>
            <section>
              <h3 className="text-lg font-semibold mb-3 text-foreground">Features</h3>
            </section>
                <li className="flex gap-2">
                  <span className="text-accent font-semibold mt-0.5">•</span>
                  <span>Import documents from Google Drive or create them manually</span>
}
                <li className="flex gap-2">
                  <span className="text-accent font-semibold mt-0.5">•</span>
                  <span>Smart character extraction using AI to identify people in your documents</span>

                <li className="flex gap-2">
                  <span className="text-accent font-semibold mt-0.5">•</span>
                  <span>Related documents automatically linked based on shared characters</span>

                <li className="flex gap-2">

                  <span>Beautiful typography optimized for long-form reading</span>

                <li className="flex gap-2">

                  <span>All data stored locally in your browser for privacy and speed</span>
                </li>
              </ul>


              <p className="text-sm text-muted-foreground italic">
                "The only thing that you absolutely have to know, is the location of the library." 
                - Albert Einstein
              </p>
            </section>

        </ScrollArea>

    </Dialog>

}
