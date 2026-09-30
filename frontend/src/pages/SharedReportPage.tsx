import { useEffect, useState } from 'react'
import { useParams } from 'react-router'
import { api, ApiError, type PartnerShareContent } from '../lib/api'
import { PartnerSharePreview } from '../components/share/PartnerSharePreview'
import { Button } from '../components/ui/Button'
import { ErrorView, LoadingView } from '../components/ui/StateView'

export function SharedReportPage() {
  const { shareToken = '' } = useParams()
  const [content, setContent] = useState<PartnerShareContent | null>(null)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)
  useEffect(() => {
    const robots = document.createElement('meta')
    robots.name = 'robots'; robots.content = 'noindex, nofollow, noarchive'
    document.head.append(robots)
    return () => robots.remove()
  }, [])
  useEffect(() => {
    let active = true
    if (!/^[a-f0-9]{64}$/.test(shareToken)) return
    api.getSharedReport(shareToken).then((value) => { if (active) setContent(value) }).catch((e) => {
      if (active) setError(e instanceof ApiError && e.status === 404 ? 'Энэ холбоос хүчингүй болсон эсвэл устгагдсан байна.' : 'Ачаалж чадсангүй. Дахин оролдоорой.')
    })
    return () => { active = false }
  }, [shareToken, retry])
  if (!/^[a-f0-9]{64}$/.test(shareToken)) return <ErrorView title="Холбоос буруу байна" message="Хуваалцсан холбоосоо шалгаарай." />
  if (error) return <ErrorView title="Тайланг нээж чадсангүй" message={error} action={<Button onClick={() => { setError(''); setContent(null); setRetry(retry + 1) }}>Дахин оролдох</Button>} />
  if (!content) return <LoadingView title="Хуваалцсан хэсгийг ачаалж байна…" />
  return <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
    <h1 className="mb-6 text-center text-2xl font-semibold">Чамтай хуваалцсан тайлан</h1>
    <PartnerSharePreview content={content} />
  </div>
}
