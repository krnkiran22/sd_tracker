'use client'

const doImages = [
  {
    src: 'https://prod-files-secure.s3.us-west-2.amazonaws.com/7b3f2e4a-8c1d-4f6e-9b2a-1e5d7c9f0a3b/good1.jpg',
    notion: true,
    label: 'Every detail filled in correctly',
    tag: 'Good',
  },
  {
    src: 'https://prod-files-secure.s3.us-west-2.amazonaws.com/7b3f2e4a-8c1d-4f6e-9b2a-1e5d7c9f0a3b/good2.jpg',
    notion: true,
    label: 'Paper label inside the pouch',
    tag: 'Good',
  },
  {
    src: 'https://prod-files-secure.s3.us-west-2.amazonaws.com/7b3f2e4a-8c1d-4f6e-9b2a-1e5d7c9f0a3b/good3.jpg',
    notion: true,
    label: 'Sealing the package correctly',
    tag: 'Good',
  },
]

const dontImages = [
  { label: 'Missing team name', tag: 'Bad' },
  { label: 'Bad packing — no details', tag: 'Bad' },
  { label: 'Almost no information written', tag: 'Bad' },
  { label: 'Date, team, and factory missing', tag: 'Bad' },
  { label: 'Team and factory missing', tag: 'Bad' },
]

export default function PackingGuidePage() {
  return (
    <main className="min-h-screen bg-white text-gray-900 font-sans">

      {/* Top bar */}
      <div className="border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="text-sm font-semibold tracking-tight">Build AI Tracker</span>
          <span className="text-xs text-gray-400">Field Guide</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-14">

        {/* Header */}
        <header className="mb-10">
          <div className="text-xs text-gray-400 uppercase tracking-widest font-medium mb-3">Packing Guide</div>
          <h1 className="text-4xl font-black tracking-tight text-gray-950 mb-4">
            📦 SD Card Pouch
          </h1>
          <p className="text-lg text-gray-500 leading-relaxed">
            What to write, how to seal, and what to avoid.
          </p>
        </header>

        {/* Warning banner */}
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-5 py-4 mb-12">
          <span className="text-lg mt-0.5">⚠️</span>
          <p className="text-sm font-semibold text-red-700 leading-relaxed">
            If the label is missing or unclear — date, factory name, team name, or SD card count —
            the package cannot be linked to the right person.{' '}
            <span className="underline">The company will not pay for that package.</span>
          </p>
        </div>

        {/* What to write */}
        <section className="mb-14">
          <SectionLabel>What to write</SectionLabel>
          <h2 className="text-2xl font-bold text-gray-950 mb-2">Paper label — inside the pouch</h2>
          <p className="text-gray-500 text-sm mb-6">Write on white paper. Place it <strong className="text-gray-700">inside</strong> the pouch, not outside.</p>

          <div className="rounded-xl border border-gray-200 overflow-hidden">
            {[
              { n: '1', field: 'DATE', format: 'DD/MM/YYYY', note: 'e.g. 23/04/2026' },
              { n: '2', field: 'FACTORY NAME', format: 'Full name, ALL CAPS', note: 'No abbreviations' },
              { n: '3', field: 'TEAM NAME', format: 'Full name, ALL CAPS', note: 'No abbreviations' },
              { n: '4', field: 'SD CARD COUNT', format: 'Exact number', note: 'e.g. 90 per pack' },
              { n: '5', field: 'MOBILE NUMBER', format: 'Recommended', note: 'Add if any doubt' },
            ].map((row, i, arr) => (
              <div key={row.n} className={`flex items-center gap-4 px-5 py-4 ${i < arr.length - 1 ? 'border-b border-gray-100' : ''}`}>
                <span className="w-7 h-7 rounded-full bg-gray-950 text-white text-xs font-bold flex items-center justify-center shrink-0">{row.n}</span>
                <div className="flex-1">
                  <span className="font-bold text-gray-950 tracking-wide">{row.field}</span>
                  <span className="text-gray-400 mx-2">—</span>
                  <span className="text-gray-600 text-sm">{row.format}</span>
                </div>
                <span className="text-xs text-gray-400 hidden sm:block">{row.note}</span>
              </div>
            ))}
          </div>
        </section>

        {/* DO */}
        <section className="mb-14">
          <SectionLabel>Rules</SectionLabel>
          <h2 className="text-2xl font-bold text-gray-950 mb-6">✅ DO</h2>

          <ul className="space-y-3 mb-8">
            {[
              'Write on white paper using blue/black pen',
              'ALL CAPS — no abbreviations',
              'Put the paper label INSIDE the pouch',
              'Count cards first, then seal',
              'Press ziplock shut end-to-end',
            ].map(item => (
              <li key={item} className="flex items-start gap-3">
                <span className="mt-1 w-5 h-5 rounded-full bg-green-100 text-green-700 text-xs font-bold flex items-center justify-center shrink-0">✓</span>
                <span className="text-gray-700">{item}</span>
              </li>
            ))}
          </ul>

          {/* Do image grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <ImageCard
              src="https://sugared-sodalite-16b.notion.site/image/https%3A%2F%2Fprod-files-secure.s3.us-west-2.amazonaws.com%2F0b8f10c0-1d7a-4e2d-bb44-1c3a2b9e5f6d%2Fgood-example-1.jpg?table=block"
              label="Don't miss any details"
              tag="good"
            />
            <ImageCard
              src="https://sugared-sodalite-16b.notion.site/image/https%3A%2F%2Fprod-files-secure.s3.us-west-2.amazonaws.com%2F0b8f10c0-1d7a-4e2d-bb44-1c3a2b9e5f6d%2Fgood-example-2.jpg?table=block"
              label="Seal it properly"
              tag="good"
            />
            <ImageCard
              src="https://sugared-sodalite-16b.notion.site/image/https%3A%2F%2Fprod-files-secure.s3.us-west-2.amazonaws.com%2F0b8f10c0-1d7a-4e2d-bb44-1c3a2b9e5f6d%2Fgood-example-3.jpg?table=block"
              label="Fill all the fields"
              tag="good"
            />
          </div>
        </section>

        {/* DON'T */}
        <section className="mb-14">
          <h2 className="text-2xl font-bold text-gray-950 mb-6">❌ DON'T</h2>

          <ul className="space-y-3 mb-8">
            {[
              "Don't write on the plastic outside — marker can smudge",
              "Don't leave any field blank",
              "Don't use abbreviations only",
              "Don't seal before counting cards",
            ].map(item => (
              <li key={item} className="flex items-start gap-3">
                <span className="mt-1 w-5 h-5 rounded-full bg-red-100 text-red-600 text-xs font-bold flex items-center justify-center shrink-0">✗</span>
                <span className="text-gray-700">{item}</span>
              </li>
            ))}
          </ul>

          {/* Dont image grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              'Pack/seal it properly',
              'No details written',
              'No team name',
              'No details — cards loose',
              'Date, team and factory missing',
            ].map((label) => (
              <ImageCard key={label} label={label} tag="bad" />
            ))}
          </div>
        </section>

        {/* Quick summary */}
        <section className="rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-bold text-gray-950 mb-4">Quick checklist before sealing</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              'Date written in DD/MM/YYYY',
              'Factory name in full, ALL CAPS',
              'Team name in full, ALL CAPS',
              'SD card count (exact number)',
              'Mobile number added',
              'Paper label inside the pouch',
              'Cards counted before sealing',
              'Ziplock pressed shut end-to-end',
            ].map(item => (
              <div key={item} className="flex items-center gap-2 text-sm text-gray-600">
                <span className="w-4 h-4 rounded border border-gray-300 shrink-0 inline-block" />
                {item}
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-16 pt-6 border-t border-gray-100 text-xs text-gray-400 flex justify-between">
          <span>Build AI Tracker · Packing Guide</span>
          <span>{new Date().getFullYear()}</span>
        </footer>

      </div>
    </main>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-xs text-gray-400 uppercase tracking-widest font-medium mb-2">{children}</div>
  )
}

function ImageCard({ src, label, tag }: { src?: string; label: string; tag: 'good' | 'bad' }) {
  const isGood = tag === 'good'
  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={label}
          className="w-full h-44 object-cover bg-gray-100"
          onError={(e) => {
            const target = e.currentTarget
            target.style.display = 'none'
            const sibling = target.nextElementSibling as HTMLElement | null
            if (sibling) sibling.style.display = 'flex'
          }}
        />
      ) : null}
      <div
        className="w-full h-44 bg-gray-50 items-center justify-center text-gray-300 text-xs"
        style={{ display: src ? 'none' : 'flex' }}
      >
        Photo
      </div>
      <div className="px-3 py-2 flex items-center gap-2 border-t border-gray-100">
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isGood ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
          {isGood ? '✓' : '✗'}
        </span>
        <span className="text-xs text-gray-600">{label}</span>
      </div>
    </div>
  )
}
