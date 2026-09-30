import {
  BarChart3,
  Filter,
  ImagePlus,
  KeyRound,
  Link2,
  LogOut,
  Megaphone,
  MessageSquareHeart,
  RefreshCw,
  Share2,
  Smartphone,
  TrendingUp,
  TriangleAlert,
  Users,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { CreativeStudio } from '../components/admin/CreativeStudio'
import { DailyColumns, DataTable, Funnel, Panel, ShareBar, StatTile, UtmBuilder, type Column } from '../components/admin/DashboardParts'
import { questions } from '../data/questions'
import { SHOW_FOR } from '../data/track'
import type { Question } from '../data/types'
import {
  channelKey,
  DashboardError,
  fetchDashboard,
  money,
  num,
  pct,
  ratio,
  type AudienceRow, type ChannelRow, type Dashboard, type RangeDays } from '../lib/adminApi'
import { cn } from '../lib/format'

const KEY_STORAGE = 'lemony.admin.key'
const SPEND_STORAGE = 'lemony.admin.spend.v1'
const RANGES: RangeDays[] = [7, 30, 90, 365]

// Per-viewer conveniences only: the key lives for this tab, ad spend on this device.
function load(storage: 'session' | 'local', key: string): string | null {
  try {
    return (storage === 'session' ? window.sessionStorage : window.localStorage).getItem(key)
  } catch {
    return null
  }
}
function save(storage: 'session' | 'local', key: string, value: string | null) {
  try {
    const s = storage === 'session' ? window.sessionStorage : window.localStorage
    if (value === null) s.removeItem(key)
    else s.setItem(key, value)
  } catch {
    // Storage unavailable — works for this page view.
  }
}

/** Option labels of a basics question, so audience rows read "Болзож байгаа" instead of "dating". */
function optionLabels(questionId: string): Record<string, string> {
  const q = questions.find((x) => x.id === questionId)
  return Object.fromEntries((q?.options ?? []).map((o) => [o.value, o.label]))
}
const AUDIENCE_LABELS = {
  stage: optionLabels('basics_type'),
  gender: optionLabels('basics_gender'),
  age: optionLabels('basics_age'),
  track: { early: 'Танилцаж буй үе (чатлах / болзох)', couple: 'Хосууд (тогтвортой харилцаа)' } as Record<string, string>,
}
const IN_APP_LABELS: Record<string, string> = {
  facebook: 'Facebook апп',
  messenger: 'Messenger',
  instagram: 'Instagram апп',
  tiktok: 'TikTok апп',
  line: 'LINE',
}

export function AdminPage() {
  const [key, setKey] = useState(() => load('session', KEY_STORAGE))
  const [days, setDays] = useState<RangeDays>(30)
  const [data, setData] = useState<Dashboard | null>(null)
  const [error, setError] = useState<DashboardError['kind'] | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadedAt, setLoadedAt] = useState<Date | null>(null)
  const [reload, setReload] = useState(0)

  useEffect(() => {
    document.title = 'Аналитик · Lemony'
    const meta = document.createElement('meta')
    meta.name = 'robots'
    meta.content = 'noindex, nofollow'
    document.head.appendChild(meta)
    return () => meta.remove()
  }, [])

  useEffect(() => {
    if (!key) return
    let active = true
    fetchDashboard(key, days)
      .then((next) => {
        if (!active) return
        setData(next)
        setError(null)
        setLoadedAt(new Date())
      })
      .catch((e: unknown) => {
        if (!active) return
        const kind = e instanceof DashboardError ? e.kind : 'failed'
        setError(kind)
        if (kind === 'unauthorized') {
          save('session', KEY_STORAGE, null)
          setKey(null)
        }
      })
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [key, days, reload])

  const refresh = useCallback(() => {
    setLoading(true)
    setReload((n) => n + 1)
  }, [])

  if (!key) {
    return (
      <KeyGate
        error={error}
        onSubmit={(k) => {
          save('session', KEY_STORAGE, k)
          setError(null)
          setLoading(true)
          setKey(k)
        }}
      />
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pt-[max(1.5rem,env(safe-area-inset-top))] pb-16 sm:px-6">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Маркетингийн самбар</h1>
          <p className="mt-1 text-sm text-ink-muted">
            {data ? `${data.range.from} – ${data.range.to} · ${data.range.timezone}` : 'Ачаалж байна…'}
            {loadedAt && ` · ${loadedAt.toLocaleTimeString('mn-MN', { hour: '2-digit', minute: '2-digit', hour12: false })}-д шинэчилсэн`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div role="radiogroup" aria-label="Хугацаа" className="flex rounded-xl border border-line p-0.5">
            {RANGES.map((r) => (
              <button
                key={r}
                type="button"
                role="radio"
                aria-checked={days === r}
                onClick={() => {
                  setLoading(true)
                  setDays(r)
                }}
                className={cn('rounded-lg px-3 py-1.5 text-sm', days === r ? 'bg-clay-soft font-semibold text-clay-dark' : 'text-ink-soft hover:text-ink')}
              >
                {r === 365 ? '1 жил' : `${r} хоног`}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={refresh}
            aria-label="Шинэчлэх"
            className="grid size-9 place-items-center rounded-xl border border-line text-ink-soft hover:text-ink"
          >
            <RefreshCw className={cn('size-4', loading && 'animate-spin')} aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => {
              save('session', KEY_STORAGE, null)
              setKey(null)
              setData(null)
            }}
            aria-label="Самбарыг түгжих"
            className="grid size-9 place-items-center rounded-xl border border-line text-ink-soft hover:text-ink"
          >
            <LogOut className="size-4" aria-hidden />
          </button>
        </div>
      </header>

      {error === 'failed' && (
        <p role="alert" className="mb-6 rounded-2xl bg-dusk-soft px-4 py-3 text-sm">
          Тоо мэдээллийг ачаалж чадсангүй. Серверээ шалгаад дахин шинэчилнэ үү.
        </p>
      )}

      {data && <DashboardBody data={data} />}
    </div>
  )
}

function KeyGate({ error, onSubmit }: { error: DashboardError['kind'] | null; onSubmit: (key: string) => void }) {
  const [value, setValue] = useState('')
  function submit(e: FormEvent) {
    e.preventDefault()
    if (value.trim()) onSubmit(value.trim())
  }
  return (
    <div className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-4">
      <form onSubmit={submit} className="rounded-3xl border border-line bg-paper p-6">
        <h1 className="flex items-center gap-2 text-lg font-semibold">
          <KeyRound className="size-5 text-clay" aria-hidden /> Аналитик
        </h1>
        <p className="mt-2 text-sm text-ink-muted">Самбарын түлхүүрээ оруулна уу (backend/.env доторх ANALYTICS_DASHBOARD_KEY).</p>
        <input
          type="password"
          autoComplete="current-password"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          aria-label="Самбарын түлхүүр"
          className="mt-4 h-11 w-full rounded-xl border border-line bg-white/[0.04] px-3 outline-none focus:border-clay"
        />
        {error === 'unauthorized' && <p className="mt-2 text-sm text-dusk">Түлхүүр буруу байна.</p>}
        {error === 'disabled' && (
          <p className="mt-2 text-sm text-dusk">Самбар идэвхгүй байна. Эхлээд backend/.env дотор ANALYTICS_DASHBOARD_KEY-г тохируулна уу.</p>
        )}
        <button type="submit" className="mt-4 h-11 w-full rounded-xl bg-accent font-semibold text-white">
          Самбарыг нээх
        </button>
      </form>
    </div>
  )
}

function DashboardBody({ data }: { data: Dashboard }) {
  const { kpis, previous, range } = data

  return (
    <div className="space-y-6">
      {kpis.test_unlocks > 0 && (
        <p role="status" className="flex items-start gap-2 rounded-2xl border border-lemon/30 bg-lemon-soft px-4 py-3 text-sm">
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-lemon" aria-hidden />
          <span>
            Энэ хугацаанд <strong>{num(kpis.test_unlocks)}</strong> тайланг “QPay-г алгасах” туршилтын товчоор нээсэн байна. Эдгээрийг орлогод
            тооцоогүй. Зар сурталчилгаанд мөнгө зарцуулахаас өмнө <code>payment_bypass_forced</code>-г унтраагаарай.
          </span>
        </p>
      )}

      {/* The headline numbers */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile hero label="Орлого" value={money(kpis.revenue)} current={kpis.revenue} previous={previous.revenue} days={range.days} />
        <StatTile label="Төлбөр төлсөн хэрэглэгч" value={num(kpis.paid)} current={kpis.paid} previous={previous.paid} days={range.days} />
        <StatTile label="Зочин" value={num(kpis.visitors)} current={kpis.visitors} previous={previous.visitors} days={range.days} />
        <StatTile
          label="Зочин → төлбөр"
          value={pct(kpis.visitors > 0 ? kpis.conversion : null, 2)}
          current={kpis.conversion}
          previous={previous.conversion}
          days={range.days}
        />
        <StatTile
          label="Нэг зочноос олох орлого (нэг кликэд төлж болох дээд дүн)"
          value={money(kpis.revenue_per_visitor)}
          current={kpis.revenue_per_visitor}
          previous={previous.revenue_per_visitor}
          days={range.days}
        />
        <StatTile
          label="Нээх → төлбөр"
          value={pct(ratio(kpis.paid, kpis.checkouts), 0)}
          current={ratio(kpis.paid, kpis.checkouts) ?? 0}
          previous={ratio(previous.paid, previous.checkouts) ?? 0}
          days={range.days}
        />
        <StatTile
          label="Дуусгалт (эхэлсэн → дуусгасан)"
          value={pct(ratio(kpis.completed, kpis.started), 0)}
          current={ratio(kpis.completed, kpis.started) ?? 0}
          previous={ratio(previous.completed, previous.started) ?? 0}
          days={range.days}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Panel
          icon={Filter}
          title="Борлуулалтын юүлүүр"
          hint="Илүү олон зочин татахаас өмнө хамгийн их хүн алдаж буй алхмаа засаарай. Эвдэрхий алхамд олон зочин тус болохгүй."
          className="lg:col-span-3"
        >
          <Funnel
            steps={[
              { label: 'Сайтад орсон', value: kpis.visitors },
              { label: 'Шалгалт эхэлсэн', value: kpis.started },
              { label: 'Шалгалт дуусгасан', value: kpis.completed },
              { label: '“Тайлан нээх” товч дарсан', value: kpis.checkouts },
              { label: 'Төлбөр төлсөн', value: kpis.paid },
              { label: 'Тайлангаа нээсэн', value: kpis.report_viewers },
            ]}
          />
        </Panel>

        <Panel icon={TrendingUp} title="Өдөр бүр" hint="Өсөлтийг пост, зар гарсан өдрүүдтэй тулгаж хараарай." className="lg:col-span-2">
          <div className="space-y-6">
            <DailyColumns title="Зочин" rows={data.daily} value={(r) => r.visitors} />
            <DailyColumns title="Дуусгасан шалгалт" rows={data.daily} value={(r) => r.completed} />
            <DailyColumns title="Төлбөр төлсөн хэрэглэгч" rows={data.daily} value={(r) => r.paid} detail={(r) => `${money(r.revenue)} орлого`} />
          </div>
        </Panel>
      </div>

      {/* Remounts per range, so each range shows the spend typed for it. */}
      <ChannelsPanel key={data.range.days} data={data} />

      <div className="grid gap-6 lg:grid-cols-2">
        <AudiencePanel data={data} />
        <DevicesPanel data={data} />
      </div>

      <SharingPanel data={data} />

      <Panel
        icon={ImagePlus}
        title="Зар, пост, story-ийн зураг"
        hint="Загвар сонгоод текстээ засаад татаарай. Зар бүрт доорх шошготой холбоосыг ашиглавал аль зураг илүү ажилласныг “Сувгууд” хэсгээс харна."
      >
        <CreativeStudio />
      </Panel>

      <QuestionsPanel data={data} />

      <div className="grid gap-6 lg:grid-cols-2">
        <QualityPanel data={data} />
        <Panel icon={Link2} title="Кампанит ажлын холбоос үүсгэгч" hint="Зар, пост, сторис, био бүрт шошготой холбоос тавиарай. Эс бөгөөс “direct” (шууд) гэж харагдана.">
          <UtmBuilder />
        </Panel>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Channels — the table the marketing budget is decided on.
// ---------------------------------------------------------------------------

function ChannelsPanel({ data }: { data: Dashboard }) {
  const storageKey = `${SPEND_STORAGE}.${data.range.days}`
  const [spend, setSpend] = useState<Record<string, number>>(() => {
    try {
      return JSON.parse(load('local', storageKey) ?? '{}') as Record<string, number>
    } catch {
      return {}
    }
  })
  function updateSpend(k: string, value: string) {
    const amount = Math.max(0, Number(value.replace(/[^\d.]/g, '')) || 0)
    const next = { ...spend, [k]: amount }
    if (!amount) delete next[k]
    setSpend(next)
    save('local', storageKey, JSON.stringify(next))
  }

  const columns: Column<ChannelRow>[] = [
    {
      label: 'Суваг',
      cell: (r) => (
        <div className="max-w-56">
          <p className="truncate font-medium">{r.source}</p>
          <p className="truncate text-xs text-ink-muted">{[r.medium, r.campaign].filter(Boolean).join(' · ') || '—'}</p>
        </div>
      ),
    },
    { label: 'Зочин', align: 'right', cell: (r) => num(r.visitors) },
    { label: 'Дуусгалт', align: 'right', help: 'Шалгалт дуусгасан ÷ эхэлсэн', cell: (r) => pct(ratio(r.completed, r.started), 0) },
    { label: 'Төлсөн', align: 'right', cell: (r) => num(r.paid) },
    { label: 'Хөрвөлт', align: 'right', help: 'Төлбөр төлсөн ÷ зочин', cell: (r) => pct(ratio(r.paid, r.visitors), 1) },
    { label: 'Орлого', align: 'right', cell: (r) => money(r.revenue) },
    {
      label: 'Орлого / зочин',
      align: 'right',
      help: 'Алдагдалгүй байхын тулд нэг кликэд төлж болох дээд дүн',
      cell: (r) => (r.visitors ? money(r.revenue / r.visitors) : '—'),
    },
    {
      label: 'Зарсан мөнгө',
      align: 'right',
      help: 'Энэ хугацаанд энэ сувагт зарцуулсан дүнгээ бичнэ үү (зөвхөн энэ төхөөрөмжид хадгалагдана)',
      cell: (r) => (
        <input
          inputMode="numeric"
          aria-label={`Зарсан мөнгө: ${r.source}`}
          defaultValue={spend[channelKey(r)] ? String(spend[channelKey(r)]) : ''}
          key={`${storageKey}.${channelKey(r)}`}
          onBlur={(e) => updateSpend(channelKey(r), e.target.value)}
          placeholder="₮"
          className="h-8 w-24 rounded-lg border border-line bg-white/[0.04] px-2 text-right tabular-nums outline-none focus:border-clay"
        />
      ),
    },
    {
      label: 'Нэг хэрэглэгчийн өртөг',
      align: 'right',
      help: 'Зарсан мөнгө ÷ төлбөр төлсөн хэрэглэгч (CAC). Ашигтай ажиллахын тулд үнээсээ бага байх хэрэгтэй.',
      cell: (r) => {
        const s = spend[channelKey(r)]
        return s ? (r.paid ? money(s / r.paid) : 'борлуулалтгүй') : '—'
      },
    },
    {
      label: 'ROAS',
      align: 'right',
      help: 'Орлого ÷ зарсан мөнгө. 1.0×-ээс дээш бол суваг зардлаа нөхөж байна.',
      cell: (r) => {
        const s = spend[channelKey(r)]
        if (!s) return '—'
        const roas = r.revenue / s
        return <span className={cn('font-semibold', roas >= 1 ? 'text-sage' : 'text-dusk')}>{roas.toFixed(2)}×</span>
      },
    },
  ]

  return (
    <Panel
      icon={Megaphone}
      title="Сувгууд (анх хаанаас орж ирсэн)"
      hint="Төлбөр төлсөн хэрэглэгчид анх хаанаас ирсэн бэ. ROAS нь 1×-ээс дээш сувагт мөнгөө төвлөрүүлж, бусдыг нь зогсоогоорой."
    >
      <DataTable
        columns={columns}
        rows={data.channels}
        rowKey={channelKey}
        empty="Энэ хугацаанд зочин алга. Доорх үүсгэгчээр шошготой холбоос хийж хуваалцаарай."
      />
    </Panel>
  )
}

// ---------------------------------------------------------------------------
// Audience — who to target.
// ---------------------------------------------------------------------------

function AudiencePanel({ data }: { data: Dashboard }) {
  const [dimension, setDimension] = useState<keyof Dashboard['audience']>('stage')
  const labels = AUDIENCE_LABELS[dimension]
  const columns: Column<AudienceRow>[] = [
    { label: 'Бүлэг', cell: (r) => labels[r.value] ?? (r.value === 'unknown' ? 'Хариулаагүй' : r.value) },
    { label: '“Нээх” дарсан', align: 'right', cell: (r) => num(r.checkouts) },
    { label: 'Төлсөн', align: 'right', cell: (r) => num(r.paid) },
    { label: 'Нээх → төлбөр', align: 'right', cell: (r) => pct(ratio(r.paid, r.checkouts), 0) },
    { label: 'Орлого', align: 'right', cell: (r) => money(r.revenue) },
  ]
  const tabs: [keyof Dashboard['audience'], string][] = [
    ['stage', 'Шат'],
    ['track', 'Урсгал'],
    ['gender', 'Хүйс'],
    ['age', 'Нас'],
  ]
  return (
    <Panel
      icon={Users}
      title="Хэн худалдаж авдаг вэ"
      hint="Хамгийн их нээж, төлдөг бүлгүүдэд зараа чиглүүлж, тэдэнд зориулж текстээ бичээрэй."
      action={
        <div role="tablist" aria-label="Ангилал" className="flex rounded-xl border border-line p-0.5">
          {tabs.map(([id, label]) => (
            <button
              key={id}
              role="tab"
              type="button"
              aria-selected={dimension === id}
              onClick={() => setDimension(id)}
              className={cn('rounded-lg px-2.5 py-1 text-xs', dimension === id ? 'bg-clay-soft font-semibold text-clay-dark' : 'text-ink-soft')}
            >
              {label}
            </button>
          ))}
        </div>
      }
    >
      <DataTable columns={columns} rows={data.audience[dimension]} rowKey={(r) => r.value} empty="Энэ хугацаанд хэн ч “Тайлан нээх” товч дараагүй байна." />
    </Panel>
  )
}

function DevicesPanel({ data }: { data: Dashboard }) {
  type Row = Dashboard['devices'][number]
  const columns: Column<Row>[] = [
    {
      label: 'Төхөөрөмж · хөтөч',
      cell: (r) => (
        <span>
          {r.device === 'mobile' ? 'Утас' : r.device === 'tablet' ? 'Таблет' : r.device === 'desktop' ? 'Компьютер' : 'Тодорхойгүй'}
          <span className="text-ink-muted"> · {r.in_app ? IN_APP_LABELS[r.in_app] ?? r.in_app : 'энгийн хөтөч'}</span>
        </span>
      ),
    },
    { label: 'Зочин', align: 'right', cell: (r) => num(r.visitors) },
    { label: 'Төлсөн', align: 'right', cell: (r) => num(r.paid) },
    { label: 'Хөрвөлт', align: 'right', cell: (r) => pct(ratio(r.paid, r.visitors), 1) },
  ]
  return (
    <Panel
      icon={Smartphone}
      title="Төхөөрөмж ба апп доторх хөтөч"
      hint="Facebook/Instagram апп дотроос орсон зочид хамаагүй муу хөрвөж байвал тэр апп доторх төлбөр танд борлуулалт алдагдуулж байна."
    >
      <DataTable columns={columns} rows={data.devices} rowKey={(r) => `${r.device}|${r.in_app ?? ''}`} empty="Энэ хугацаанд зочин алга." />
    </Panel>
  )
}

// ---------------------------------------------------------------------------
// Sharing — the word-of-mouth loop.
// ---------------------------------------------------------------------------

const SHARE_METHOD_LABELS: Record<string, string> = {
  native_image: 'Утасны “Хуваалцах” (зураг)',
  native_link: 'Утасны “Хуваалцах” (холбоос)',
  instagram_story: 'Instagram / Facebook Story',
  messenger: 'Messenger',
  download: 'Зураг татсан',
  copy_link: 'Холбоос хуулсан',
}

function SharingPanel({ data }: { data: Dashboard }) {
  const s = data.sharing
  type Row = Dashboard['sharing']['by_method'][number]
  const columns: Column<Row>[] = [
    { label: 'Арга', cell: (r) => SHARE_METHOD_LABELS[r.method] ?? r.method },
    { label: 'Хуваалцсан', align: 'right', cell: (r) => num(r.shares) },
    { label: 'Ирсэн зочин', align: 'right', cell: (r) => num(r.visitors) },
    {
      label: 'Зочин / хуваалцалт',
      align: 'right',
      help: 'Нэг хуваалцалт дунджаар хэдэн шинэ зочин авчирсан бэ',
      cell: (r) => (r.shares ? (r.visitors / r.shares).toFixed(1) : '—'),
    },
  ]
  const perSharer = ratio(s.visitors, s.sharers)
  const tiles: [string, string, string?][] = [
    ['Хуваалцсан хүн', num(s.sharers), `${num(s.opened)} хүн хуваалцах цонх нээсэн`],
    ['Хуваалцалтаар ирсэн зочин', num(s.visitors)],
    ['Тэдгээрээс төлсөн', num(s.paid), money(s.revenue)],
    ['Нэг хуваалцагч авчирсан зочин', perSharer === null ? '—' : perSharer.toFixed(1), '1-ээс дээш бол өөрөө тархдаг'],
  ]
  return (
    <Panel
      icon={Share2}
      title="Хуваалцалт (амнаас аманд)"
      hint="Хэн хуваалцаж, ямар аргаар, тэр нь хэдэн шинэ хүн, орлого авчирсан бэ. Хамгийн их зочин авчирдаг аргыг хэрэглэгчдэд илүү тод санал болгоорой."
    >
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map(([label, value, sub]) => (
          <div key={label} className="rounded-2xl bg-white/[0.03] p-4">
            <p className="text-xs text-ink-muted">{label}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
            {sub && <p className="mt-1 text-xs text-ink-muted">{sub}</p>}
          </div>
        ))}
      </div>
      <DataTable columns={columns} rows={s.by_method} rowKey={(r) => r.method} empty="Энэ хугацаанд хэн ч хуваалцаагүй байна." />
    </Panel>
  )
}

// ---------------------------------------------------------------------------
// Question drop-off — where people quit.
// ---------------------------------------------------------------------------

function QuestionsPanel({ data }: { data: Dashboard }) {
  const [flow, setFlow] = useState<'early' | 'couple'>('early')

  const rows = useMemo(() => {
    const reach = new Map<string, number>()
    for (const q of data.questions) {
      // The first questions (before the stage is known) are shared by both flows.
      if (q.track === flow || q.track === null) reach.set(q.question, (reach.get(q.question) ?? 0) + q.visitors)
    }
    const ordered = questions.filter((q) => reach.has(q.id))
    // Baseline for each question: the last question everyone in this flow sees (conditional ones are skipped).
    const baselines = ordered.reduce<number[]>((acc, q, i) => {
      const prev = i === 0 ? data.kpis.started : acc[i - 1]
      return [...acc, isConditional(q, flow) ? prev : (reach.get(q.id) ?? 0)]
    }, [])
    return ordered.map((q, i) => {
      const count = reach.get(q.id) ?? 0
      const conditional = isConditional(q, flow)
      const before = i === 0 ? data.kpis.started : baselines[i - 1]
      const lost = conditional ? 0 : Math.max(0, before - count)
      return { id: q.id, n: i + 1, text: q.text, count, lost, drop: before > 0 ? lost / before : null, optional: q.optional ?? false, conditional }
    })
  }, [data, flow])

  const worst = new Set(
    [...rows]
      .filter((r) => !r.optional)
      .sort((a, b) => b.lost - a.lost)
      .slice(0, 3)
      .filter((r) => r.lost > 0)
      .map((r) => r.id),
  )
  const top = Math.max(1, data.kpis.started, ...rows.map((r) => r.count))

  return (
    <Panel
      icon={BarChart3}
      title="Хүмүүс аль асуулт дээр зогсдог вэ"
      hint="Тодруулсан асуултууд хамгийн олон хүн алддаг. Тэдгээрийг дахин найруулах, байрыг нь солих эсвэл хасаарай."
      action={
        <div role="tablist" aria-label="Асуултын урсгал" className="flex rounded-xl border border-line p-0.5">
          {(['early', 'couple'] as const).map((f) => (
            <button
              key={f}
              role="tab"
              type="button"
              aria-selected={flow === f}
              onClick={() => setFlow(f)}
              className={cn('rounded-lg px-2.5 py-1 text-xs', flow === f ? 'bg-clay-soft font-semibold text-clay-dark' : 'text-ink-soft')}
            >
              {f === 'early' ? 'Чатлах / болзох' : 'Хосууд'}
            </button>
          ))}
        </div>
      }
    >
      {rows.length === 0 ? (
        <p className="rounded-2xl bg-white/[0.03] px-4 py-6 text-center text-sm text-ink-muted">Энэ хугацаанд хариулт алга.</p>
      ) : (
        <ol className="max-h-[32rem] space-y-1.5 overflow-y-auto pr-1">
          {rows.map((r) => (
            <li key={r.id} className={cn('rounded-xl px-3 py-2', worst.has(r.id) && 'bg-dusk-soft')}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="min-w-0 truncate" title={r.text}>
                  <span className="mr-2 text-xs text-ink-muted tabular-nums">{r.n}</span>
                  {r.text}
                </span>
                <span className="shrink-0 tabular-nums text-ink-soft">
                  {r.conditional && <span className="mr-2 text-xs text-ink-muted">зарим хүнд харагддаг</span>}
                  {num(r.count)}
                  {r.lost > 0 && <span className={cn('ml-2 text-xs', worst.has(r.id) ? 'font-semibold text-dusk' : 'text-ink-muted')}>−{pct(r.drop, 0)}</span>}
                </span>
              </div>
              <div className="mt-1 h-1.5 rounded-r bg-white/[0.04]">
                <div className="h-1.5 rounded-r bg-clay" style={{ width: `${(r.count / top) * 100}%` }} />
              </div>
            </li>
          ))}
        </ol>
      )}
    </Panel>
  )
}

/**
 * Asked only after a particular answer (e.g. a follow-up), so fewer people see it by design —
 * not a drop-off. Questions gated only by the flow itself are not conditional.
 */
function isConditional(q: Question, flow: 'early' | 'couple'): boolean {
  if (q.optional || (q.visibleWhen?.length ?? 0) > 0) return true
  if (!q.showIf) return false
  const rule = SHOW_FOR[flow]
  const sameAsFlow =
    q.showIf.question === rule.question &&
    JSON.stringify(q.showIf.in ?? null) === JSON.stringify(rule.in ?? null) &&
    JSON.stringify(q.showIf.notIn ?? null) === JSON.stringify(rule.notIn ?? null)
  return !sameAsFlow
}

// ---------------------------------------------------------------------------
// Report quality — does the product deliver? (Drives word of mouth.)
// ---------------------------------------------------------------------------

const FEEDBACK_LABELS: Record<string, string> = { yes: 'Тийм', partly: 'Хэсэгчлэн', no: 'Үгүй' }
const CONCERN_LABELS: Record<string, string> = {
  repetitive: 'Давтагдсан',
  not_my_situation: 'Миний нөхцөлд тохироогүй',
  too_certain: 'Хэт итгэлтэй дүгнэсэн',
  unsafe: 'Аюулгүй бус санагдсан',
  none: 'Санаа зовох зүйлгүй',
}

function QualityPanel({ data }: { data: Dashboard }) {
  const { feedback, reports_completed, reports_failed, repeat_checkins } = data.quality
  const block = (title: string, counts: Record<string, number>, labels: Record<string, string>) => {
    const total = Object.values(counts).reduce((a, b) => a + b, 0)
    return (
      <div className="space-y-2">
        <p className="text-xs font-medium text-ink-muted">{title}</p>
        {Object.keys(labels)
          .filter((k) => counts[k])
          .map((k) => (
            <ShareBar key={k} label={labels[k]} value={counts[k]} total={total} />
          ))}
      </div>
    )
  }
  return (
    <Panel icon={MessageSquareHeart} title="Тайлангийн чанар" hint="Сэтгэл хангалуун уншигч бусдад хуваалцдаг. “Ойлгосон” гэсэн үнэлгээ бага бол зараа өсгөхөөс өмнө тайлангаа сайжруулаарай.">
      <dl className="mb-5 grid grid-cols-3 gap-3 text-center">
        {(
          [
            ['Хүргэсэн тайлан', reports_completed, false],
            ['Амжилтгүй', reports_failed, true],
            ['Давтан шалгалт', repeat_checkins, false],
          ] as const
        ).map(([label, value, isProblem]) => (
          <div key={label} className="rounded-2xl bg-white/[0.03] p-3">
            <dt className="text-xs text-ink-muted">{label}</dt>
            <dd className={cn('mt-1 text-xl font-semibold tabular-nums', isProblem && value > 0 && 'text-dusk')}>{num(value)}</dd>
          </div>
        ))}
      </dl>
      {feedback.responses === 0 ? (
        <p className="rounded-2xl bg-white/[0.03] px-4 py-6 text-center text-sm text-ink-muted">Энэ хугацаанд уншигчийн санал алга.</p>
      ) : (
        <div className="space-y-5">
          <p className="text-sm text-ink-soft">
            {num(feedback.responses)} хариулт (хүргэсэн тайлангийн {pct(ratio(feedback.responses, reports_completed), 0)})
          </p>
          {block('Өөрийгөө ойлгогдсон гэж мэдэрсэн', feedback.understood, FEEDBACK_LABELS)}
          {block('Дараа нь юу хийхээ мэдсэн', feedback.actionable, FEEDBACK_LABELS)}
          {block('Санаа зовсон зүйл', feedback.concern, CONCERN_LABELS)}
        </div>
      )}
    </Panel>
  )
}
