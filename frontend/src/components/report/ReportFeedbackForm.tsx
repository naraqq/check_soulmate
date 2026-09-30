import { useState, type FormEvent } from 'react'
import { api, type ReportFeedback } from '../../lib/api'
import { Button } from '../ui/Button'

const choices = [{ value: 'yes', label: 'Тийм' }, { value: 'partly', label: 'Зарим талаар' }, { value: 'no', label: 'Үгүй' }] as const

export function ReportFeedbackForm({ token, submitted }: { token: string; submitted: boolean }) {
  const [understood, setUnderstood] = useState<ReportFeedback['understood'] | ''>('')
  const [actionable, setActionable] = useState<ReportFeedback['actionable'] | ''>('')
  const [concern, setConcern] = useState<ReportFeedback['concern']>('none')
  const [saved, setSaved] = useState(submitted)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!understood || !actionable || saving) return
    setSaving(true)
    setError(false)
    try {
      await api.saveFeedback(token, { understood, actionable, concern })
      setSaved(true)
    } catch {
      setError(true)
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="no-print mt-12 rounded-3xl border border-line bg-paper p-6" aria-labelledby="feedback-title">
      <h2 id="feedback-title" className="font-display text-xl font-semibold">Та өөрийгөө ойлгуулж чадсан мэт санагдав уу?</h2>
      {saved ? <p role="status" className="mt-3">Санал хүсэлтээ хуваалцсанд баярлалаа.</p> : (
        <form onSubmit={submit} className="mt-4 space-y-5">
          <p className="text-sm text-ink-soft">Заавал биш. Тайлангаа сайжруулахад ашиглана. Энэ санал таны тайлангийн хамт хадгалагдах бөгөөд тайлангаа устгахад хамт устна.</p>
          {[
            { name: 'understood', title: 'Тайлан таны нөхцөл байдлыг ойлгосон мэт санагдсан уу?', value: understood, set: setUnderstood },
            { name: 'actionable', title: 'Танд тохирох дараагийн алхам тодорхой болсон уу?', value: actionable, set: setActionable },
          ].map((field) => (
            <fieldset key={field.name} disabled={saving}>
              <legend className="font-medium">{field.title}</legend>
              <div className="mt-2 flex flex-wrap gap-3">
                {choices.map((choice) => <label key={choice.value} className="flex cursor-pointer items-center gap-2 rounded-xl border border-line p-3 text-sm"><input type="radio" name={field.name} value={choice.value} checked={field.value === choice.value} onChange={() => field.set(choice.value)} required />{choice.label}</label>)}
              </div>
            </fieldset>
          ))}
          <label className="block text-sm font-medium">
            Юуг сайжруулбал танд илүү тустай вэ?
            <select value={concern} disabled={saving} onChange={(event) => setConcern(event.target.value as ReportFeedback['concern'])} className="mt-2 block w-full rounded-xl border border-line bg-paper p-3 text-ink">
              <option value="none">Онцлох зүйл алга / хэлэхгүй</option>
              <option value="repetitive">Асуулт эсвэл зөвлөгөө давтагдсан</option>
              <option value="not_my_situation">Миний нөхцөл байдалд тохироогүй</option>
              <option value="too_certain">Мэдэх боломжгүй зүйлийг хэт итгэлтэй хэлсэн</option>
              <option value="unsafe">Зөвлөгөөг дагах нь надад аюулгүй санагдаагүй</option>
            </select>
          </label>
          {error && <p role="alert" className="text-sm">Санал хүсэлтийг хадгалж чадсангүй. Дахин оролдоорой.</p>}
          <Button type="submit" loading={saving} disabled={!understood || !actionable}>Санал хүсэлт илгээх</Button>
        </form>
      )}
    </section>
  )
}
