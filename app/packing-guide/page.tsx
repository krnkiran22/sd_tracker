export const metadata = {
  title: 'SD Card Pouch — Packing Guide',
  description: 'How to correctly label and pack SD card pouches for Build AI.',
}

export default function PackingGuidePage() {
  return (
    <main className="min-h-screen bg-white text-gray-900 font-sans">

      {/* Top bar */}
      <div className="border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="text-sm font-semibold tracking-tight">Build AI Tracker</span>
          <span className="text-xs text-gray-400">Field Guide</span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-14">

        {/* Header */}
        <header className="mb-10">
          <div className="text-xs text-gray-400 uppercase tracking-widest font-medium mb-3">Packing Guide</div>
          <h1 className="text-4xl font-black tracking-tight text-gray-950 mb-4">📦 SD Card Pouch</h1>
          <p className="text-lg text-gray-500 leading-relaxed">What to write, how to seal, and what to avoid.</p>
        </header>

        {/* Warning */}
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-5 py-4 mb-12">
          <span className="text-lg mt-0.5">⚠️</span>
          <p className="text-sm font-semibold text-red-700 leading-relaxed">
            Missing or unclear label = package will <span className="underline">NOT</span> be paid.
            Date, factory name, team name, and SD card count must all be present.
          </p>
        </div>

        {/* What to write */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-gray-950 mb-1">What to write on the paper label</h2>
          <p className="text-sm text-gray-500 mb-5">Write on white paper. Place it <strong className="text-gray-700">INSIDE</strong> the pouch, not outside. Blue/black pen only.</p>

          <div className="rounded-xl border border-gray-200 overflow-hidden">
            {[
              { n: '1', field: 'DATE',         format: 'DD/MM/YYYY',          note: 'e.g. 23/04/2026' },
              { n: '2', field: 'FACTORY NAME', format: 'Full name, ALL CAPS', note: 'No abbreviations' },
              { n: '3', field: 'TEAM NAME',    format: 'Full name, ALL CAPS', note: 'No abbreviations' },
              { n: '4', field: 'SD CARD COUNT',format: 'Exact number',        note: 'e.g. 90 per pack' },
              { n: '5', field: 'MOBILE NUMBER',format: 'Recommended',         note: 'Add if any doubt' },
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

        <hr className="border-gray-100 mb-12" />

        {/* DO */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-gray-950 mb-5">✅ DO</h2>
          <ul className="space-y-3">
            {[
              'Write on white paper using blue/black pen',
              'ALL CAPS — no abbreviations',
              'Put the paper label INSIDE the pouch',
              'Count cards first, then seal',
              'Press ziplock shut end-to-end',
            ].map(item => (
              <li key={item} className="flex items-start gap-3">
                <span className="mt-0.5 w-5 h-5 rounded-full bg-green-100 text-green-700 text-xs font-bold flex items-center justify-center shrink-0">✓</span>
                <span className="text-gray-700">{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <hr className="border-gray-100 mb-12" />

        {/* DON'T */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-gray-950 mb-5">❌ DON&apos;T</h2>
          <ul className="space-y-3">
            {[
              "Don't write on the plastic outside — marker can smudge",
              "Don't leave any field blank",
              "Don't use abbreviations",
              "Don't seal before counting cards",
            ].map(item => (
              <li key={item} className="flex items-start gap-3">
                <span className="mt-0.5 w-5 h-5 rounded-full bg-red-100 text-red-600 text-xs font-bold flex items-center justify-center shrink-0">✗</span>
                <span className="text-gray-700">{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <hr className="border-gray-100 mb-12" />

        {/* Checklist */}
        <section className="rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-bold text-gray-950 mb-4">Quick checklist before sealing</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
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
              <div key={item} className="flex items-center gap-2.5 text-sm text-gray-600">
                <span className="w-4 h-4 rounded border border-gray-300 shrink-0" />
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
