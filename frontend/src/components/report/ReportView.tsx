import {
  Anchor,
  CalendarCheck,
  Compass,
  Eye,
  Flame,
  HandHeart,
  Handshake,
  Heart,
  Leaf,
  MessageCircle,
  Repeat,
  Scale,
  ShieldCheck,
  Sparkles,
  Sprout,
  Sun,
  Target,
  Waypoints,
  type LucideIcon,
} from 'lucide-react'
import { CheckInProgress } from './CheckInProgress'
import { EvidenceDetails } from './EvidenceDetails'
import type { Track } from '../../data/types'
import type { CheckInComparison, RelationshipReport } from '../../lib/api'
import {
  AreaCards,
  CategoryCard,
  CategoryOverview,
  FlagLists,
  PotentialCard,
  ReportBlock,
  SectionHeading,
  TitledCards,
  type CategoryItem,
} from './ReportSections'

type TopicKey = Exclude<
  keyof RelationshipReport,
  | 'evidence'
  | 'uncertainty'
  | 'track'
  | 'headline'
  | 'summary'
  | 'strengths'
  | 'areas_to_explore'
  | 'potential'
  | 'green_flags'
  | 'red_flags'
  | 'patterns'
  | 'conversation_starters'
  | 'closing'
  | 'note_to_you'
  | 'action_plan'
  | 'self_care'
>

const CATEGORY_SECTIONS: Record<Track, { key: TopicKey; title: string; icon: LucideIcon }[]> = {
  couple: [
    { key: 'communication', title: 'Харилцан яриа', icon: MessageCircle },
    { key: 'affection', title: 'Энхрийлэл ба холбоо', icon: Flame },
    { key: 'effort', title: 'Хүчин чармайлтын тэнцвэр', icon: Handshake },
    { key: 'trust', title: 'Итгэлцэл', icon: ShieldCheck },
    { key: 'conflict', title: 'Маргаан ба эвлэрэл', icon: Repeat },
    { key: 'independence', title: 'Бие даасан байдал', icon: Anchor },
    { key: 'future', title: 'Ирээдүйн нийцэл', icon: Compass },
  ],
  early: [
    { key: 'interest', title: 'Харилцан сонирхол', icon: Heart },
    { key: 'consistency', title: 'Тогтвортой байдал', icon: Repeat },
    { key: 'connection', title: 'Холбоо', icon: Flame },
    { key: 'intentions', title: 'Зорилго', icon: Target },
    { key: 'respect', title: 'Хүндэтгэл', icon: ShieldCheck },
    { key: 'values', title: 'Нийцэл', icon: Scale },
    { key: 'feelings', title: 'Таны мэдрэмж', icon: Eye },
  ],
}

/** Wording that differs between people getting to know someone and couples. */
const COPY: Record<Track, { snapshot: string; strengths: string; patterns: string; starters: string }> = {
  couple: {
    snapshot: 'Харилцааны ерөнхий зураглал',
    strengths: 'Та хоёрын давуу талууд',
    patterns: 'Та хоёрын харилцааны гол хэв маяг',
    starters: 'Хамтрагчтайгаа ярилцах асуултууд',
  },
  early: {
    snapshot: 'Танилцах үеийн зураглал',
    strengths: 'Сайн эхлэлүүд',
    patterns: 'Та хоёрын хооронд юу болж байна вэ',
    starters: 'Түүнээс асууж болох асуултууд',
  },
}

/**
 * Report order follows what the reader needs: feel understood → understand
 * the dynamic → see what healthy looks like per topic → know what to do next.
 */
export function ReportView({ report, createdAt, comparison }: { report: RelationshipReport; createdAt: string; comparison?: CheckInComparison }) {
  const track: Track = report.track ?? 'couple'
  const copy = COPY[track]
  const topicItems: CategoryItem[] = CATEGORY_SECTIONS[track].flatMap(({ key, title, icon }) => {
    const section = report[key]
    return section ? [{ key, title, icon, section }] : []
  })
  const date = new Intl.DateTimeFormat('mn-MN', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(createdAt))

  return (
    <div className="space-y-16">
      {/* Snapshot */}
      <ReportBlock id="snapshot">
        <div className="relative overflow-hidden rounded-4xl surface-hero p-7 shadow-lift sm:p-12">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-clay-dark">{copy.snapshot}</p>
          <p className="mt-4 font-display text-3xl leading-tight font-semibold text-balance sm:text-4xl">{report.headline}</p>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-soft">{report.summary}</p>
          <EvidenceDetails evidence={report.evidence} uncertainty={report.uncertainty} />
          <p className="mt-8 text-xs text-ink-muted">{date}</p>
        </div>
      </ReportBlock>

      {comparison && <CheckInProgress comparison={comparison} />}

      {/* Early stage: the answer they came for — is this going to work? */}
      {report.potential && (
        <ReportBlock id="potential" className="space-y-4">
          <PotentialCard potential={report.potential} />
          <FlagLists green={report.green_flags ?? []} red={report.red_flags ?? []} />
        </ReportBlock>
      )}

      {/* A personal note — comfort before analysis */}
      {report.note_to_you && (
        <ReportBlock id="note">
          <div className="rounded-4xl border border-pink-300/20 bg-gradient-to-br from-pink-500/12 via-fuchsia-500/8 to-violet-500/10 p-7 sm:p-10">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-dusk">
              <Heart className="size-4" aria-hidden /> Танд хэлэх үг
            </p>
            <p className="mt-4 text-lg leading-relaxed text-ink sm:text-xl">{report.note_to_you}</p>
          </div>
        </ReportBlock>
      )}

      <ReportBlock id="strengths">
        <SectionHeading icon={Leaf} title={copy.strengths} />
        <TitledCards items={report.strengths} tone="sage" />
      </ReportBlock>

      {report.patterns.length > 0 && (
        <ReportBlock id="patterns">
          <SectionHeading icon={Sparkles} eyebrow="Гол ойлголт" title={copy.patterns} />
          <TitledCards items={report.patterns} tone="dusk" />
        </ReportBlock>
      )}

      <ReportBlock id="explore">
        <SectionHeading icon={Sprout} title="Өсөж хөгжих боломжтой талууд" />
        <AreaCards items={report.areas_to_explore} />
      </ReportBlock>

      <ReportBlock id="categories" className="space-y-4">
        <SectionHeading icon={Waypoints} eyebrow={`${topicItems.length} чиглэл`} title="Харилцаа тань чиглэл бүрээр" />
        <CategoryOverview items={topicItems} />
        <div className="space-y-4 pt-4">
          {topicItems.map((item) => (
            <CategoryCard key={item.key} item={item} />
          ))}
        </div>
      </ReportBlock>

      {report.action_plan && report.action_plan.length > 0 && (
        <ReportBlock id="plan">
          <SectionHeading icon={CalendarCheck} eyebrow="Дараагийн алхам" title="Ирэх 7 хоногт" />
          <ol className="relative space-y-4 border-l border-line pl-8">
            {report.action_plan.map((step, i) => (
              <li key={step.title} className="relative">
                <span className="absolute top-0 -left-[2.85rem] grid size-8 place-items-center rounded-full bg-accent text-sm font-bold text-white shadow-glow">
                  {i + 1}
                </span>
                <h3 className="font-semibold">{step.title}</h3>
                <p className="mt-1 text-[15px] leading-relaxed text-ink-soft">{step.description}</p>
              </li>
            ))}
          </ol>
        </ReportBlock>
      )}

      {report.self_care && report.self_care.length > 0 && (
        <ReportBlock id="self-care">
          <SectionHeading icon={Sun} title="Өөртөө анхаарал тавих нь" />
          <ul className="grid gap-3 sm:grid-cols-2">
            {report.self_care.map((item) => (
              <li key={item} className="flex gap-3 rounded-3xl border border-line bg-paper p-5 text-[15px] leading-relaxed backdrop-blur">
                <Heart className="mt-0.5 size-4 shrink-0 text-dusk" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
        </ReportBlock>
      )}

      <ReportBlock id="starters">
        <SectionHeading icon={HandHeart} title={copy.starters} />
        <div className="grid gap-3">
          {report.conversation_starters.map((starter) => (
            <blockquote
              key={starter}
              className="rounded-3xl border border-line bg-gradient-to-br from-violet-500/15 to-pink-500/10 p-5 text-lg font-medium leading-relaxed sm:p-6"
            >
              “{starter}”
            </blockquote>
          ))}
        </div>
      </ReportBlock>

      <ReportBlock id="closing">
        <div className="rounded-4xl surface-hero p-7 text-center shadow-lift sm:p-12">
          <Heart className="mx-auto size-7 text-dusk" aria-hidden />
          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-ink sm:text-xl">{report.closing}</p>
        </div>
      </ReportBlock>
    </div>
  )
}
