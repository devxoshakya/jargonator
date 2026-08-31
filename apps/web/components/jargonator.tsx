'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { Check, Clipboard, KeyRound, LoaderCircle, LockKeyhole, ArrowRight } from 'lucide-react'

const API_URL = 'https://jargonator.devxoshakya.workers.dev'
const tones = ['Diplomatic', 'Firm', 'Assertive', 'Executive'] as const
const relationships = ['peer', 'senior', 'client', 'junior'] as const

type Tone = (typeof tones)[number]
type Relationship = (typeof relationships)[number]

function Spinner() {
  return <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
}

function KeyGate({ initialMessage, onSuccess }: { initialMessage?: string; onSuccess: (key: string) => void }) {
  const [key, setKey] = useState('')
  const [error, setError] = useState(initialMessage ?? '')
  const [validating, setValidating] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!key.trim() || validating) return
    setValidating(true)
    setError('')
    try {
      const response = await fetch(`${API_URL}/`, { headers: { 'X-Jargonator-Key': key } })
      if (response.status === 200) {
        localStorage.setItem('jargonator_api_key', key)
        onSuccess(key)
      } else if (response.status === 401) {
        setError("That key doesn't work. Double-check and try again.")
      } else {
        setError("Couldn't reach Jargonator. Check your connection and try again.")
      }
    } catch {
      setError("Couldn't reach Jargonator. Check your connection and try again.")
    } finally {
      setValidating(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
      <section className="w-full max-w-[25rem] border border-border bg-card p-8 sm:p-10" aria-labelledby="gate-title">
        <div className="mb-8 flex items-center gap-3">
          <span className="flex size-9 items-center justify-center bg-primary text-primary-foreground"><LockKeyhole className="size-4" aria-hidden="true" /></span>
          <div>
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">Private utility</p>
            <h1 id="gate-title" className="text-xl font-semibold tracking-tight">Jargonator</h1>
          </div>
        </div>
        <p className="mb-7 text-sm leading-6 text-muted-foreground">Enter your access key to continue</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="access-key" className="sr-only">Access key</label>
            <input id="access-key" type="password" value={key} onChange={(event) => setKey(event.target.value)} placeholder="Access key" autoComplete="current-password" className="h-11 w-full border border-input bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring/20" />
          </div>
          <button type="submit" disabled={!key.trim() || validating} className="flex h-11 w-full items-center justify-center gap-2 bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-45">
            {validating ? <><Spinner /> Checking key…</> : <>Continue <ArrowRight className="size-4" aria-hidden="true" /></>}
          </button>
          <p role="alert" className={`min-h-5 text-sm leading-5 text-destructive ${error ? 'opacity-100' : 'opacity-0'}`}>{error || ' '}</p>
        </form>
      </section>
    </main>
  )
}

function Workspace({ apiKey, onChangeKey }: { apiKey: string; onChangeKey: () => void }) {
  const [raw, setRaw] = useState('')
  const [tone, setTone] = useState<Tone>('Firm')
  const [relationship, setRelationship] = useState<Relationship>('peer')
  const [context, setContext] = useState('')
  const [jargon, setJargon] = useState('')
  const [error, setError] = useState('')
  const [transforming, setTransforming] = useState(false)
  const [copied, setCopied] = useState(false)

  const nearLimit = raw.length > 1600
  const buttonLabel = useMemo(() => transforming ? 'Transforming…' : 'Transform', [transforming])

  async function transform(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!raw.trim() || transforming) return
    setTransforming(true)
    setError('')
    try {
      const response = await fetch(`${API_URL}/api/jargonate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Jargonator-Key': apiKey },
        body: JSON.stringify({ raw, tone: tone.toLowerCase(), relationship, context }),
      })
      if (response.status === 401) { localStorage.removeItem('jargonator_api_key'); onChangeKey(); return }
      if (response.status === 429) { setError('Rate limit hit — wait a minute and try again.'); return }
      if (response.status === 502) { setError("Couldn't generate that — try again."); return }
      if (!response.ok) { setError('Something went wrong. Try again.'); return }
      const data = await response.json() as { jargon?: string }
      setJargon(data.jargon ?? '')
    } catch { setError('Something went wrong. Try again.') } finally { setTransforming(false) }
  }

  async function copyOutput() {
    if (!jargon) return
    await navigator.clipboard.writeText(jargon)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  return (
    <main className="min-h-screen bg-background px-5 py-8 sm:px-8 lg:px-12 lg:py-12">
      <div className="mx-auto max-w-6xl">
        <header className="mb-10 flex items-start justify-between gap-6 border-b border-border pb-7">
          <div><p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-primary">Jargonator</p><h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Turn raw thoughts into strategic communication</h1></div>
          <button type="button" onClick={onChangeKey} className="shrink-0 text-xs font-medium text-muted-foreground underline decoration-border underline-offset-4 transition-colors hover:text-foreground">Change key</button>
        </header>

        <form onSubmit={transform}>
          <div className="grid gap-5 lg:grid-cols-2">
            <section className="border border-border bg-card" aria-labelledby="raw-label">
              <div className="border-b border-border px-5 py-4"><h2 id="raw-label" className="font-mono text-xs font-semibold uppercase tracking-[0.16em]">What I actually think</h2></div>
              <div className="p-5"><textarea value={raw} onChange={(event) => setRaw(event.target.value.slice(0, 2000))} placeholder="Write it like you mean it…" className="min-h-64 w-full resize-y bg-transparent text-[15px] leading-7 outline-none placeholder:text-muted-foreground" aria-label="Raw thoughts" />{nearLimit && <p className="text-right font-mono text-[11px] text-muted-foreground">{raw.length.toLocaleString()} / 2,000</p>}</div>
            </section>
            <section className="relative border border-border bg-card" aria-labelledby="output-label">
              <div className="flex items-center justify-between border-b border-border px-5 py-4"><h2 id="output-label" className="font-mono text-xs font-semibold uppercase tracking-[0.16em]">What I should send</h2>{jargon && <button type="button" onClick={copyOutput} aria-label="Copy rewritten message" className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground">{copied ? <Check className="size-4 text-primary" /> : <Clipboard className="size-4" />}{copied ? 'Copied' : 'Copy'}</button>}</div>
              <div className="flex min-h-64 items-start p-5">{jargon ? <p className="whitespace-pre-wrap text-[15px] leading-7">{jargon}</p> : <p className="text-sm leading-6 text-muted-foreground">Your rewritten message will appear here</p>}</div>
            </section>
          </div>
          <div className="mt-9 space-y-7">
            <fieldset><legend className="mb-3 text-sm font-medium">Tone</legend><div className="flex flex-wrap gap-2">{tones.map((option) => <label key={option} className={`cursor-pointer border px-3.5 py-2 text-sm transition-colors ${tone === option ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card hover:border-foreground/40'}`}><input type="radio" name="tone" value={option} checked={tone === option} onChange={() => setTone(option)} className="sr-only" />{option}</label>)}</div></fieldset>
            <div className="grid gap-5 sm:grid-cols-[minmax(0,0.75fr)_minmax(0,1.5fr)]"><div><label htmlFor="relationship" className="mb-3 block text-sm font-medium">Relationship</label><select id="relationship" value={relationship} onChange={(event) => setRelationship(event.target.value as Relationship)} className="h-11 w-full border border-input bg-card px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/20">{relationships.map((option) => <option key={option} value={option}>{option[0].toUpperCase() + option.slice(1)}</option>)}</select></div><div><label htmlFor="context" className="mb-3 block text-sm font-medium">Context <span className="font-normal text-muted-foreground">(optional)</span></label><input id="context" value={context} onChange={(event) => setContext(event.target.value)} placeholder="e.g. this is the 3rd time I’m following up" className="h-11 w-full border border-input bg-card px-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring/20" /></div></div>
            <div className="flex flex-col items-start justify-between gap-4 border-t border-border pt-6 sm:flex-row sm:items-center"><p role="status" className={`text-sm text-destructive ${error ? 'opacity-100' : 'opacity-0'}`}>{error || ' '}</p><button type="submit" disabled={!raw.trim() || transforming} className="flex h-11 items-center gap-2 bg-primary px-5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-45">{transforming && <Spinner />}{buttonLabel}<ArrowRight className="size-4" aria-hidden="true" /></button></div>
          </div>
        </form>
      </div>
    </main>
  )
}

export default function Jargonator() {
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [gateMessage, setGateMessage] = useState('')
  useEffect(() => { setApiKey(localStorage.getItem('jargonator_api_key')) }, [])
  function changeKey() { localStorage.removeItem('jargonator_api_key'); setApiKey(null); setGateMessage('') }
  if (!apiKey) return <KeyGate initialMessage={gateMessage} onSuccess={setApiKey} />
  return <Workspace apiKey={apiKey} onChangeKey={() => { localStorage.removeItem('jargonator_api_key'); setApiKey(null); setGateMessage('Your key stopped working — enter it again.') }} />
}
