import { useEffect, useId, useState } from 'react'
import { Send } from 'lucide-react'
import { api, type PartnerShare, type PartnerShareContent, type PartnerShareSection, type RelationshipReport } from '../../lib/api'
import { Button } from '../ui/Button'
import { PartnerSharePreview } from './PartnerSharePreview'
import { partnerShareSections } from '../../lib/partnerShare'

export function PartnerShareButton({ token, report }: { token: string; report: RelationshipReport }) {
  const [open, setOpen] = useState(false)
  const id = useId()
  return <section className="no-print my-8">
    <Button className="h-auto min-h-11 w-full py-3 sm:w-auto" onClick={() => setOpen(!open)} aria-expanded={open} aria-controls={id}>
      <Send className="size-4 shrink-0" aria-hidden />Хос руугаа хариугаа илгээх
    </Button>
    {open && <div id={id}><ShareOptions token={token} report={report} /></div>}
  </section>
}

function ShareOptions({ token, report }: { token: string; report: RelationshipReport }) {
  const [share, setShare] = useState<PartnerShare | null>(null)
  const [editing, setEditing] = useState(true)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [retry, setRetry] = useState(0)
  const [selected, setSelected] = useState<PartnerShareSection[]>([])
  useEffect(() => {
    let active = true
    api.getPartnerShare(token).then((value) => {
      if (!active) return
      setLoaded(true)
      setShare(value)
      setEditing(!value)
      setSelected(value ? partnerShareSections.filter(({ key }) => value.content[key]?.length).map(({ key }) => key) : [])
      setLoading(false)
    }).catch(() => { if (active) { setError('Холбоосын мэдээллийг ачаалж чадсангүй. Дахин оролдоорой.'); setLoading(false) } })
    return () => { active = false }
  }, [token, retry])

  const content: PartnerShareContent = {}
  if (selected.includes('strengths')) content.strengths = report.strengths
  if (selected.includes('areas_to_explore')) content.areas_to_explore = report.areas_to_explore
  if (selected.includes('conversation_starters')) content.conversation_starters = report.conversation_starters
  const url = share ? `${window.location.origin}/shared/${share.token}` : ''

  async function create() {
    setBusy(true); setError(''); setNotice('')
    try {
      const value = await api.createPartnerShare(token, selected)
      setShare(value); setEditing(false)
      setNotice('Холбоос бэлэн боллоо. Одоо илгээх эсвэл хуулж авах боломжтой.')
    } catch { setError('Холбоос үүсгэж чадсангүй. Дахин оролдоорой.') }
    finally { setBusy(false) }
  }
  async function revoke() {
    setBusy(true); setError(''); setNotice('')
    try {
      await api.revokePartnerShare(token)
      setShare(null); setEditing(true)
      setNotice('Холбоосыг идэвхгүй болголоо.')
    } catch { setError('Холбоосыг идэвхгүй болгож чадсангүй. Дахин оролдоорой.') }
    finally { setBusy(false) }
  }
  async function send(copy = false) {
    setError(''); setNotice('')
    try {
      if (!copy && navigator.share) {
        await navigator.share({ title: 'Чамтай ярилцмаар байна', text: 'Тайлангаасаа хэдэн хэсгийг чамтай хуваалцмаар байна.', url })
      } else {
        await navigator.clipboard.writeText(url)
        setNotice('Холбоосыг хууллаа. Хосынхоо чатад оруулаарай.')
      }
    } catch (e) {
      if (!(e instanceof Error && e.name === 'AbortError')) setError('Илгээж чадсангүй. Доорх холбоосыг сонгоод хуулж аваарай.')
    }
  }

  return <div className="mt-4 space-y-5 rounded-3xl border border-line p-5 sm:p-6">
    <p className="text-sm text-ink-soft">Хуваалцах хэсгээ сонгоод шалгаарай. Асуултын хариулт, хувийн тэмдэглэл илгээгдэхгүй. Холбоостой хүн бүр сонгосон хэсгийг унших боломжтой.</p>
    {loading ? <p role="status">Ачаалж байна…</p> : <>
      {!loaded && <Button variant="secondary" onClick={() => { setLoading(true); setError(''); setRetry(retry + 1) }}>Дахин ачаалах</Button>}
      {loaded && (editing ? <>
        <fieldset disabled={busy} className="space-y-3">
          <legend className="mb-3 font-semibold">Юуг хуваалцах вэ?</legend>
          {partnerShareSections.filter(({ key }) => report[key]?.length).map(({ key, label }) => <label key={key} className="flex cursor-pointer items-center gap-3 text-sm">
            <input type="checkbox" className="size-5 accent-fuchsia-600" checked={selected.includes(key)} onChange={(e) => { setSelected(e.target.checked ? [...selected, key] : selected.filter((s) => s !== key)); setNotice('') }} />{label}
          </label>)}
        </fieldset>
        {selected.length > 0 && <><p className="text-sm font-semibold">Хосод тань ингэж харагдана</p><PartnerSharePreview content={content} /></>}
        <Button disabled={!selected.length} loading={busy} onClick={create}>{share ? 'Шинэ холбоос үүсгэх' : 'Хуваалцах холбоос үүсгэх'}</Button>
        {share && <p className="text-xs text-ink-muted">Шинэ холбоос үүсгэвэл өмнөх холбоос хүчингүй болно.</p>}
      </> : share && <>
        <PartnerSharePreview content={share.content} />
        <Button variant="secondary" onClick={() => { setEditing(true); setNotice('') }}>Хуваалцах хэсгээ өөрчлөх</Button>
      </>)}
      {share && <div className="space-y-3 border-t border-line pt-4">
        <label className="block text-sm">{editing ? 'Одоо идэвхтэй байгаа холбоос' : 'Хуваалцах холбоос'}
          <input aria-label="Хуваалцах холбоос" readOnly value={url} onFocus={(e) => e.target.select()} className="mt-2 w-full min-w-0 rounded-xl border border-line bg-paper p-3 text-sm" />
        </label>
        <div className="flex flex-wrap gap-3">
          <Button disabled={busy || editing} onClick={() => send()}>Илгээх</Button>
          <Button disabled={busy || editing} variant="secondary" onClick={() => send(true)}>Холбоос хуулах</Button>
          <Button loading={busy} variant="quiet" onClick={revoke}>Холбоосыг идэвхгүй болгох</Button>
        </div>
        <p className="text-xs text-ink-muted">Холбоосыг идэвхгүй болгосны дараа дахин нээх боломжгүй. Өмнө нь хуулж эсвэл зураг авч хадгалсан агуулга устахгүй.</p>
      </div>}
    </>}
    {error && <p role="alert" className="text-sm text-rose-300">{error}</p>}
    {notice && <p role="status" className="text-sm text-ink-soft">{notice}</p>}
  </div>
}
