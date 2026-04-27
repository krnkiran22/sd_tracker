export const metadata = {
  title: 'Documentation — Build AI SD Tracker',
  description: 'How to use the Build AI SD Card Tracker — web dashboard and Discord bot guide.',
}

const VIDEO_URL = '' // paste YouTube/Loom link here when ready

export default function DocumentationPage() {
  return (
    <main className="min-h-screen bg-white text-gray-900 font-sans">

      {/* Top bar */}
      <div className="border-b border-gray-100 sticky top-0 bg-white/95 backdrop-blur z-10">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="text-sm font-semibold tracking-tight text-gray-900">Build AI Tracker</span>
          <span className="text-xs text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">Documentation</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-14 space-y-16">

        {/* ── Hero ─────────────────────────────────────────────────── */}
        <header>
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full mb-4">
            SD Card Tracking System
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-950 leading-tight mb-4">
            Build AI SD Tracker
          </h1>
          <p className="text-lg text-gray-500 leading-relaxed max-w-2xl">
            End-to-end SD card logistics — from field arrival to data ingestion.
            Logistics teams log and count via Discord or web. Ingestion teams pick up from there.
            Leads get a full activity log of every step.
          </p>
        </header>

        {/* ── Video ────────────────────────────────────────────────── */}
        {VIDEO_URL ? (
          <section>
            <SectionTitle>Video Walkthrough</SectionTitle>
            <div className="rounded-2xl overflow-hidden border border-gray-200 aspect-video">
              <iframe
                src={VIDEO_URL}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </section>
        ) : (
          <div className="rounded-2xl border-2 border-dashed border-gray-200 aspect-video flex flex-col items-center justify-center gap-2 text-gray-400">
            <span className="text-3xl">🎬</span>
            <p className="text-sm font-medium">Video walkthrough coming soon</p>
          </div>
        )}

        <Divider />

        {/* ── Roles ────────────────────────────────────────────────── */}
        <section>
          <SectionTitle>Who Uses What</SectionTitle>
          <P>The system has role-based access — each person only sees what's relevant to them.</P>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {[
              { role: 'Admin', color: 'bg-purple-100 text-purple-700', access: 'Full access to all pages, users, and data.' },
              { role: 'Logistics Lead', color: 'bg-indigo-100 text-indigo-700', access: 'Log arrivals, count & repack, view ready to ingest, activity logs.' },
              { role: 'Logistics', color: 'bg-blue-100 text-blue-700', access: 'Log arrivals, count & repack, view ready to ingest.' },
              { role: 'Ingestion Lead', color: 'bg-teal-100 text-teal-700', access: 'Collect packets, processing queue, completed, activity logs.' },
              { role: 'Ingestion', color: 'bg-green-100 text-green-700', access: 'Processing queue and completed packets.' },
            ].map(r => (
              <div key={r.role} className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3.5">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${r.color}`}>{r.role}</span>
                <p className="text-sm text-gray-500 mt-2 leading-relaxed">{r.access}</p>
              </div>
            ))}
          </div>
        </section>

        <Divider />

        {/* ── Flow ─────────────────────────────────────────────────── */}
        <section>
          <SectionTitle>The Full Pipeline</SectionTitle>
          <P>Every SD card packet moves through these stages in order:</P>
          <ol className="mt-5 space-y-4">
            {[
              { n: '01', label: 'Log Arrival', who: 'Logistics', desc: 'A new packet of SD cards arrives from the field. Logistics logs the team name, received by, phone number, and date. Photos of the packet can be attached.' },
              { n: '02', label: 'Count & Repack', who: 'Logistics', desc: 'The packet is opened. Each factory inside is counted separately — factory name, deployment date, SD card count, missing count, and number of packages. Photos of the repacked items are attached.' },
              { n: '03', label: 'Ready to Ingest', who: 'Logistics (view)', desc: 'Once counted, the packet appears in "Ready to Ingest". Logistics can verify the details. Ingestion team picks up from here.' },
              { n: '04', label: 'Collect for Ingestion', who: 'Ingestion Lead', desc: 'Ingestion lead assigns the packet to an ingestion team member and marks it as collected.' },
              { n: '05', label: 'Processing Queue', who: 'Ingestion', desc: 'Ingestion team sees their assigned packets and works through them.' },
              { n: '06', label: 'Completed', who: 'Ingestion Lead', desc: 'Once data ingestion is done, the packet is marked as completed.' },
            ].map(s => (
              <li key={s.n} className="flex gap-4">
                <span className="text-2xl font-black text-gray-100 select-none w-10 shrink-0 leading-none mt-1">{s.n}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-gray-900">{s.label}</p>
                    <span className="text-[10px] font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{s.who}</span>
                  </div>
                  <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <Divider />

        {/* ── Website Guide ─────────────────────────────────────────── */}
        <section>
          <SectionTitle>Website Guide</SectionTitle>
          <P>Login at <a href="https://sd-tracker.vercel.app" className="text-indigo-600 underline underline-offset-2">sd-tracker.vercel.app</a> with your account. You will be redirected to your role's home page automatically.</P>

          <div className="mt-6 space-y-6">
            <PageGuide
              title="Log New Arrival"
              path="/logistics/log-arrival"
              role="Logistics / Logistics Lead"
              steps={[
                'Click "Log New Arrival" in the sidebar.',
                'Enter the Team Name (e.g. Dukaan).',
                'Enter who received it and their phone number.',
                'Set the date received (defaults to today).',
                'Take a photo with your camera OR upload from gallery.',
                'Click Submit — the packet is logged immediately.',
              ]}
            />
            <PageGuide
              title="Pending Count & Repack"
              path="/logistics/pending"
              role="Logistics / Logistics Lead"
              steps={[
                'All arrived packets waiting to be counted appear here.',
                'Click "Count & Repack" on any packet.',
                'Click "+ Add Factory" for each factory inside the packet.',
                'For each factory: enter name, deployment date, SD count, missing count, packages.',
                'The Total SD Cards auto-sums all factory counts.',
                'Take or upload photos of the repacked items.',
                'Click Submit — packet moves to Ready to Ingest.',
              ]}
            />
            <PageGuide
              title="Ready to Ingest"
              path="/logistics/ready-to-ingest"
              role="Logistics / Logistics Lead"
              steps={[
                'Shows all packets that have been counted and are waiting for ingestion.',
                'View per-factory breakdown and SD card counts.',
                'This is a read-only view for logistics — ingestion team handles the next step.',
              ]}
            />
            <PageGuide
              title="Collect SDC"
              path="/collect-sdc"
              role="Ingestion Lead"
              steps={[
                'Shows all Ready to Ingest packets.',
                'Click "Collect & Assign" on a packet.',
                'Select an ingestion team member to assign it to.',
                'Enter who is collecting it.',
                'Click Submit — packet moves to Processing Queue.',
              ]}
            />
            <PageGuide
              title="Processing Queue"
              path="/processing-queue"
              role="Ingestion / Ingestion Lead"
              steps={[
                'Shows all packets assigned to you or your team.',
                'View factory details and SD card counts.',
                'Once data ingestion is done, mark as completed.',
              ]}
            />
            <PageGuide
              title="Activity Logs"
              path="/logs"
              role="Logistics Lead / Ingestion Lead / Admin"
              steps={[
                'Shows a full timeline of every event — arrivals, counts, and collections.',
                'Filter by event type or search by team name.',
                'Use the refresh button to get the latest events.',
              ]}
            />
          </div>
        </section>

        <Divider />

        {/* ── Discord Bot ───────────────────────────────────────────── */}
        <section>
          <SectionTitle>Discord Bot Guide</SectionTitle>
          <P>
            The Discord bot lets logistics teams log arrivals and count packets directly from Discord —
            no need to open the website. Photos can be attached to the same message.
          </P>

          <div className="mt-6 space-y-8">

            {/* Channels */}
            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-3">Channel Setup</h3>
              <div className="rounded-xl border border-gray-200 overflow-hidden text-sm">
                {[
                  { ch: '#arrival', cmd: '/arrival', who: 'Logistics', desc: 'Log a new packet arrival' },
                  { ch: '#count_repack', cmd: '/count', who: 'Logistics', desc: 'Count & repack a packet' },
                  { ch: '#ready_to_ingest', cmd: '/ready', who: 'Logistics (read)', desc: 'See packets ready to ingest' },
                  { ch: 'Anywhere', cmd: '/list  /help', who: 'All', desc: 'View pending packets, get help' },
                ].map((r, i, arr) => (
                  <div key={r.ch} className={`flex flex-wrap items-start gap-3 px-4 py-3.5 ${i < arr.length - 1 ? 'border-b border-gray-100' : ''}`}>
                    <code className="font-mono font-semibold text-gray-900 w-36 shrink-0">{r.ch}</code>
                    <code className="font-mono text-indigo-600 text-xs bg-indigo-50 px-2 py-0.5 rounded">{r.cmd}</code>
                    <span className="text-gray-500 flex-1">{r.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* /arrival */}
            <BotCommand
              command="/arrival"
              channel="#arrival"
              description="Log a new SD card packet that has arrived from the field."
              template={`/arrival\nTeam: Dukaan\nReceived by: Naresh\nPhone: 9876543210\nDate: 2026-04-26`}
              fields={[
                { field: 'Team', required: true, note: 'Team or company name' },
                { field: 'Received by', required: true, note: 'Who physically received the packet' },
                { field: 'Phone', required: false, note: 'WhatsApp number (10 digits)' },
                { field: 'Date', required: false, note: 'Date received — defaults to today if left out' },
              ]}
              photoNote="Attach photos of the arrived packet directly to the same message."
            />

            {/* /count */}
            <BotCommand
              command="/count [packet ID]"
              channel="#count_repack"
              description="Count and repack a packet. Use /list first to get the packet ID. Add one line per factory — no limit on number of factories."
              template={`/count 42\nDyna Fashion,2026-04-25,192,3,2\nAttire,2026-04-25,37,0,1\nGreybeez,2026-04-20,85,0,1\nCounted by: Naresh\nNotes: Good condition`}
              fields={[
                { field: 'Factory lines', required: true, note: 'Format: Name, YYYY-MM-DD, SD Count, Missing, Packages' },
                { field: 'Counted by', required: true, note: 'Name of person doing the count' },
                { field: 'Notes', required: false, note: 'Any condition notes' },
              ]}
              photoNote="Attach photos of the repacked items to the same message."
              extra="Factory line format: Name, Date, SD Count, Missing, Packages — all comma-separated. Missing and Packages default to 0 and 1 if left out."
            />

            {/* /list */}
            <div className="rounded-xl border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex items-center gap-3">
                <code className="text-sm font-bold font-mono text-gray-900">/list</code>
                <span className="text-xs text-gray-500">Slash command · works anywhere</span>
              </div>
              <div className="px-4 py-3 text-sm text-gray-600">
                Shows all packets waiting for Count & Repack with their IDs. Use this to get the ID before running <code className="bg-gray-100 px-1 rounded font-mono text-xs">/count</code>.
              </div>
            </div>

            {/* /ready */}
            <div className="rounded-xl border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex items-center gap-3">
                <code className="text-sm font-bold font-mono text-gray-900">/ready</code>
                <span className="text-xs text-gray-500">Slash command · works anywhere</span>
              </div>
              <div className="px-4 py-3 text-sm text-gray-600">
                Shows all packets that have been counted and are ready for ingestion — with factory breakdown and SD card totals.
              </div>
            </div>

            {/* /help */}
            <div className="rounded-xl border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex items-center gap-3">
                <code className="text-sm font-bold font-mono text-gray-900">/help</code>
                <span className="text-xs text-gray-500">Slash command · channel-aware</span>
              </div>
              <div className="px-4 py-3 text-sm text-gray-600">
                Shows the message template for the current channel. Run this in <code className="bg-gray-100 px-1 rounded font-mono text-xs">#arrival</code>, <code className="bg-gray-100 px-1 rounded font-mono text-xs">#count_repack</code>, or <code className="bg-gray-100 px-1 rounded font-mono text-xs">#ready_to_ingest</code> to get the exact format.
              </div>
            </div>

            {/* Tips */}
            <div className="rounded-xl bg-amber-50 border border-amber-200 px-5 py-4 text-sm text-amber-800 space-y-2">
              <p className="font-semibold">💡 Tips</p>
              <ul className="space-y-1 text-amber-700">
                <li>• Field names are case-insensitive — <code className="bg-amber-100 px-1 rounded font-mono text-xs">TEAM:</code>, <code className="bg-amber-100 px-1 rounded font-mono text-xs">Team:</code>, <code className="bg-amber-100 px-1 rounded font-mono text-xs">team:</code> all work.</li>
                <li>• Spaces around commas and colons don't matter.</li>
                <li>• Attach photos to the <strong>same message</strong> — no need to send separately.</li>
                <li>• If you forgot to attach photos, reply to the bot's confirmation message with the photos.</li>
                <li>• The bot will tell you exactly what's wrong if your message has an error.</li>
              </ul>
            </div>

          </div>
        </section>

        <Divider />

        {/* ── Footer ───────────────────────────────────────────────── */}
        <footer className="flex items-center justify-between text-xs text-gray-400 pb-8">
          <span>Build AI SD Tracker · {new Date().getFullYear()}</span>
          <a href="https://sd-tracker.vercel.app/login" className="text-indigo-500 hover:underline">
            Go to App →
          </a>
        </footer>

      </div>
    </main>
  )
}

// ── Sub-components ──────────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-2xl font-bold text-gray-950 mb-3">{children}</h2>
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-gray-500 leading-relaxed">{children}</p>
}

function Divider() {
  return <hr className="border-gray-100" />
}

function PageGuide({ title, path, role, steps }: {
  title: string; path: string; role: string; steps: string[]
}) {
  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden">
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex flex-wrap items-center gap-3">
        <p className="font-semibold text-gray-900 text-sm">{title}</p>
        <code className="font-mono text-xs text-gray-400">{path}</code>
        <span className="ml-auto text-[11px] font-semibold text-gray-400 bg-white border border-gray-200 px-2 py-0.5 rounded-full">{role}</span>
      </div>
      <ol className="px-4 py-3 space-y-1.5">
        {steps.map((s, i) => (
          <li key={i} className="flex gap-2.5 text-sm text-gray-600">
            <span className="text-gray-300 font-mono shrink-0 w-4">{i + 1}.</span>
            <span>{s}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}

function BotCommand({ command, channel, description, template, fields, photoNote, extra }: {
  command: string; channel: string; description: string
  template: string; fields: { field: string; required: boolean; note: string }[]
  photoNote?: string; extra?: string
}) {
  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden">
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex flex-wrap items-center gap-3">
        <code className="text-sm font-bold font-mono text-gray-900">{command}</code>
        <span className="text-xs text-gray-400 bg-white border border-gray-200 px-2 py-0.5 rounded-full">{channel}</span>
      </div>
      <div className="px-4 py-4 space-y-4">
        <p className="text-sm text-gray-500 leading-relaxed">{description}</p>

        {/* Template */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Message Template</p>
          <pre className="bg-gray-950 text-green-400 text-sm font-mono rounded-xl px-4 py-3.5 overflow-x-auto leading-relaxed whitespace-pre-wrap">
            {template}
          </pre>
        </div>

        {/* Fields table */}
        <div className="rounded-lg border border-gray-100 overflow-hidden text-sm">
          <div className="grid grid-cols-3 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-widest border-b border-gray-100">
            <span>Field</span><span>Required</span><span>Notes</span>
          </div>
          {fields.map((f, i) => (
            <div key={f.field} className={`grid grid-cols-3 px-3 py-2.5 text-sm ${i < fields.length - 1 ? 'border-b border-gray-100' : ''}`}>
              <span className="font-medium text-gray-800">{f.field}</span>
              <span>{f.required ? <span className="text-red-500 font-semibold text-xs">Required</span> : <span className="text-gray-400 text-xs">Optional</span>}</span>
              <span className="text-gray-500">{f.note}</span>
            </div>
          ))}
        </div>

        {extra && (
          <p className="text-xs text-gray-400 leading-relaxed">{extra}</p>
        )}

        {photoNote && (
          <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2.5 text-xs text-blue-700">
            <span>📸</span>
            <span>{photoNote}</span>
          </div>
        )}
      </div>
    </div>
  )
}
