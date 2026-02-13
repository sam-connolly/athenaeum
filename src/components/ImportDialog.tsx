import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Upload } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface ImportDialogProps {
  onImport: (title: string, content: string, sourceUrl?: string) => void
}

export function ImportDialog({ onImport }: ImportDialogProps) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [googleDriveUrl, setGoogleDriveUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleImportFromUrl = async () => {
    if (!googleDriveUrl.trim()) {
      toast.error('Please enter a Google Drive URL')
      return
    }

    setIsLoading(true)
    
    try {
      let fileId = ''
      
      if (googleDriveUrl.includes('/file/d/')) {
        const match = googleDriveUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)
        if (match) fileId = match[1]
      } else if (googleDriveUrl.includes('id=')) {
        const match = googleDriveUrl.match(/id=([a-zA-Z0-9_-]+)/)
        if (match) fileId = match[1]
      }

      if (!fileId) {
        toast.error('Invalid Google Drive URL format')
        setIsLoading(false)
        return
      }

      const exportUrl = `https://docs.google.com/document/d/${fileId}/export?format=txt`
      
      const response = await fetch(exportUrl)
      
      if (!response.ok) {
        throw new Error('Failed to fetch document. Make sure the document is publicly accessible.')
      }

      const text = await response.text()
      
      const docTitle = text.split('\n')[0] || 'Imported Document'
      
      onImport(docTitle.trim(), text, googleDriveUrl)
      
      toast.success('Document imported successfully!')
      setOpen(false)
      setGoogleDriveUrl('')
      setTitle('')
      setContent('')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to import document')
    } finally {
      setIsLoading(false)
    }
  }

  const handleManualImport = () => {
    if (!title.trim() || !content.trim()) {
      toast.error('Please provide both title and content')
      return
    }

    onImport(title.trim(), content.trim())
    toast.success('Document created successfully!')
    setOpen(false)
    setTitle('')
    setContent('')
    setGoogleDriveUrl('')
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      setTitle('')
      setContent('')
      setGoogleDriveUrl('')
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Upload size={18} />
          Import Document
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import Document</DialogTitle>
          <DialogDescription>
            Import a document from Google Drive or create a new one manually.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="google-drive-url">Google Drive URL</Label>
            <Input
              id="google-drive-url"
              placeholder="https://docs.google.com/document/d/..."
              value={googleDriveUrl}
              onChange={(e) => setGoogleDriveUrl(e.target.value)}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              Paste a link to a publicly accessible Google Doc
            </p>
            <Button
              onClick={handleImportFromUrl}
              disabled={!googleDriveUrl.trim() || isLoading}
              className="w-full"
            >
              {isLoading ? 'Importing...' : 'Import from Google Drive'}
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or create manually</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Document title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                placeholder="Document content... (Supports markdown: # Heading, ## Subheading)"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={8}
                className="resize-none"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleManualImport} disabled={!title.trim() || !content.trim()}>
            Create Document
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
