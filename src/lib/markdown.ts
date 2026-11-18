import { Marked, type Tokens } from 'marked'

export interface Heading {
  depth: number
  text: string
  id: string
}

const SAFE_HREF = /^(https?:|mailto:|#)/i

function escapeAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
}

function decodeEntities(text: string): string {
  return text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
}

function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .replace(/<[^>]*>/g, '')
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/[\s_]+/g, '-') || 'section'
  )
}

/**
 * Renders page markdown to HTML and collects headings for the contents list.
 * Imported documents are untrusted text, so raw HTML and images are dropped
 * and only http(s), mailto and in-page links are kept.
 */
export function renderMarkdown(source: string): { html: string; headings: Heading[] } {
  const headings: Heading[] = []
  const usedIds = new Map<string, number>()

  const marked = new Marked({ gfm: true, breaks: true })
  marked.use({
    renderer: {
      heading({ tokens, depth }: Tokens.Heading) {
        const inner = this.parser.parseInline(tokens)
        const plain = decodeEntities(inner.replace(/<[^>]*>/g, '')).trim()
        if (!plain) return ''
        const base = slugify(plain)
        const seen = usedIds.get(base) ?? 0
        usedIds.set(base, seen + 1)
        const id = seen ? `${base}-${seen + 1}` : base
        headings.push({ depth, text: plain, id })
        return `<h${depth} id="${id}">${inner}</h${depth}>\n`
      },
      html() {
        return ''
      },
      image() {
        return ''
      },
      link({ href, title, tokens }: Tokens.Link) {
        const inner = this.parser.parseInline(tokens)
        if (!SAFE_HREF.test(href)) return inner
        const external = !href.startsWith('#')
        return `<a href="${escapeAttr(href)}"${title ? ` title="${escapeAttr(title)}"` : ''}${
          external ? ' target="_blank" rel="noreferrer"' : ''
        }>${inner}</a>`
      },
    },
  })

  const html = marked.parse(source, { async: false }) as string
  return { html, headings }
}
