import {
  Anchor,
  Compass,
  Flame,
  HandHeart,
  Handshake,
  Leaf,
  MessageCircle,
  MessagesSquare,
  Repeat,
  ShieldCheck,
  Sparkles,
  Sprout,
  Sun,
  Waypoints,
} from 'lucide-react'
import type { RelationshipReport } from '../../lib/api'
import { AreaCards, CategoryCard, ReportBlock, SectionHeading, TitledCards } from './ReportSections'

const CATEGORY_SECTIONS = [
  { key: 'communication', title: 'Харилцан яриа', icon: MessageCircle },
  { key: 'affection', title: 'Энхрийлэл ба холбоо', icon: Flame },
  { key: 'effort', title: 'Хүчин чармайлтын тэнцвэр', icon: Handshake },
  { key: 'trust', title: 'Итгэлцэл', icon: ShieldCheck },
  { key: 'conflict', title: 'Маргаан ба эвлэрэл', icon: Repeat },
  { key: 'independence', title: 'Бие даасан байдал', icon: Anchor },
  { key: 'future', title: 'Ирээдүйн нийцэл', icon: Compass },
] as const

export function ReportView({ report, createdAt }: { report: RelationshipReport; createdAt: string }) {
  const topics = [...report.areas_to_explore.map((a) => a.title), ...report.patterns.map((p) => p.title)]
  const date = new Intl.DateTimeFormat('mn-MN', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(createdAt))

  return (
    <div className="space-y-16">
      {/* Snapshot */}
      <ReportBlock id="snapshot">
        <div className="relative overflow-hidden rounded-4xl surface-hero p-7 shadow-lift sm:p-12">
          
          <div className="relative">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-clay-dark">Харилцааны ерөнхий зураглал</p>
            <p className="mt-4 font-display text-3xl leading-tight font-semibold text-balance sm:text-4xl">{report.headline}</p>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-soft">{report.summary}</p>
            <p className="mt-8 text-xs text-ink-muted">{date}</p>
          </div>
        </div>
      </ReportBlock>

      <ReportBlock id="strengths">
        <SectionHeading icon={Leaf} title="Давуу талууд" />
        <TitledCards items={report.strengths} tone="sage" />
      </ReportBlock>

      <ReportBlock id="explore">
        <SectionHeading icon={Sprout} title="Анхаарал хандуулах нь зүйтэй талууд" />
        <AreaCards items={report.areas_to_explore} />
      </ReportBlock>

      <ReportBlock id="categories" className="space-y-4">
        <SectionHeading icon={Waypoints} eyebrow="Чиглэл бүрээр" title="Нарийвчилсан дүн шинжилгээ" />
        {CATEGORY_SECTIONS.map(({ key, title, icon }) => (
          <CategoryCard key={key} icon={icon} title={title} section={report[key]} />
        ))}
      </ReportBlock>

      {report.patterns.length > 0 && (
        <ReportBlock id="patterns">
          <SectionHeading icon={Sparkles} title="Бидний анзаарсан хэв маяг" />
          <TitledCards items={report.patterns} tone="dusk" />
        </ReportBlock>
      )}

      {topics.length > 0 && (
        <ReportBlock id="topics">
          <SectionHeading icon={MessagesSquare} title="Ярилцах нь зүйтэй сэдвүүд" />
          <ul className="flex flex-wrap gap-2">
            {topics.map((topic) => (
              <li key={topic} className="rounded-full border border-line bg-paper px-4 py-2 text-[15px] shadow-soft">
                {topic}
              </li>
            ))}
          </ul>
        </ReportBlock>
      )}

      <ReportBlock id="starters">
        <SectionHeading icon={HandHeart} title="Яриа эхлүүлэх санаанууд" />
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
        <div className="rounded-4xl border border-line bg-paper p-7 text-center shadow-soft sm:p-12">
          <Sun className="mx-auto size-7 text-clay" aria-hidden />
          <h2 className="mt-4 font-display text-2xl font-semibold">Эцсийн бодрол</h2>
          <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-ink-soft">{report.closing}</p>
        </div>
      </ReportBlock>
    </div>
  )
}
