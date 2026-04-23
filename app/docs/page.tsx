export const metadata = {
  title: 'How WhatsApp Notifications Work — Build AI Tracker',
  description: 'A deep dive into how whatsapp-web.js powers real-time SD card tracking notifications.',
}

export default function DocsPage() {
  return (
    <main className="min-h-screen bg-white text-gray-900 font-sans">

      {/* Top bar */}
      <div className="border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="text-sm font-semibold tracking-tight text-gray-900">Build AI Tracker</span>
          <span className="text-xs text-gray-400">Internal Docs</span>
        </div>
      </div>

      <article className="max-w-2xl mx-auto px-6 py-16">

        {/* Blog header */}
        <header className="mb-12">
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-4 uppercase tracking-widest font-medium">
            <span>Engineering</span>
            <span>·</span>
            <span>Apr 2026</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-950 leading-tight mb-4">
            How WhatsApp Notifications Work in Build AI Tracker
          </h1>
          <p className="text-lg text-gray-500 leading-relaxed">
            Every time an SD card packet moves through logistics and ingestion, a WhatsApp message fires automatically.
            Here's exactly how that works under the hood.
          </p>
          <div className="flex items-center gap-3 mt-6 pt-6 border-t border-gray-100">
            <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center text-sm font-bold">K</div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Kiran</p>
              <p className="text-xs text-gray-400">Build AI · SD Card Tracker</p>
            </div>
          </div>
        </header>

        {/* Body */}
        <div className="prose-style space-y-10">

          <Section title="The Short Version">
            <P>
              The backend runs a hidden Chrome browser (via <Code>whatsapp-web.js</Code> + Puppeteer) that
              stays permanently logged into WhatsApp Web. When a packet event happens — received,
              acknowledged, or ingested — the server calls <Code>client.sendMessage()</Code> and the
              message lands on the recipient's WhatsApp instantly. No third-party API, no subscription fee.
            </P>
          </Section>

          <Divider />

          <Section title="How whatsapp-web.js Actually Works">
            <P>
              WhatsApp does not have a public API for sending messages. <Code>whatsapp-web.js</Code> works
              around this by automating a real WhatsApp Web session — the same thing you'd open at{' '}
              <Code>web.whatsapp.com</Code>. The library uses <strong>Puppeteer</strong> to launch a headless
              (invisible) Chromium browser, navigate to WhatsApp Web, and interact with it programmatically.
            </P>
            <P>
              The first time it starts, WhatsApp Web shows a QR code. The library captures that QR and
              emits it as an event. In our case, we expose it at <Code>/qr</Code> as a scannable image so
              you can link a phone number without needing physical access to the server.
            </P>
            <P>
              Once scanned, the session is saved to disk using <Code>LocalAuth</Code>. On Railway, this
              folder lives on a persistent Volume at <Code>/app/.wwebjs_auth</Code> so the session survives
              restarts and redeploys — you only scan once.
            </P>
          </Section>

          <Divider />

          <Section title="Lifecycle: From Boot to First Message">
            <ol className="space-y-5 mt-4">
              {[
                { n: '01', title: 'Server starts', body: 'Express boots on Railway. initWhatsApp() is called, which runs client.initialize().' },
                { n: '02', title: 'Chromium launches', body: 'Puppeteer spawns a headless Chromium process (installed via apt in the Dockerfile). It loads web.whatsapp.com.' },
                { n: '03', title: 'QR or session restore', body: 'If a saved session exists in /app/.wwebjs_auth, WhatsApp Web restores it silently. If not, a QR code is generated and stored — open /qr in your browser to scan it.' },
                { n: '04', title: 'ready event fires', body: 'Once authenticated, the "ready" event fires. isReady is set to true. The bot can now send messages.' },
                { n: '05', title: 'Message sent', body: 'When a packet event triggers, sendWhatsAppMessage("+91XXXXXXXXXX", text) formats the number as 91XXXXXXXXXX@c.us and calls client.sendMessage().' },
              ].map(s => (
                <li key={s.n} className="flex gap-4">
                  <span className="text-2xl font-black text-gray-100 select-none w-10 shrink-0 leading-none mt-1">{s.n}</span>
                  <div>
                    <p className="font-semibold text-gray-900 mb-1">{s.title}</p>
                    <p className="text-gray-500 text-sm leading-relaxed">{s.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Section>

          <Divider />

          <Section title="The 3 Notification Stages">
            <P>Every packet moves through three states. Each state fires a WhatsApp broadcast to all
            phone numbers stored on that packet's <Code>poc_phones</Code> field.</P>

            <div className="space-y-6 mt-6">
              <NotificationBlock
                badge="Stage 1"
                trigger="Logistics logs a new packet"
                fn="waSendPacketReceived()"
                preview={`📦 *SD Cards Received*\n\n*Team:* Factory A\n*Factory:* Chennai Plant\n*Date Received:* 23 Apr 2026\n*Card Count:* 15\n*Logged By:* Kiran\n\n_Status: Received — awaiting ingestion team._`}
              />
              <NotificationBlock
                badge="Stage 2"
                trigger="Ingestion team acknowledges the packet"
                fn="waSendPacketAcknowledged()"
                preview={`⏳ *SD Cards In Ingestion Queue*\n\n*Team:* Factory A\n*Card Count:* 15\n\nYour packet has been acknowledged and is now being processed.\n\n_Status: Processing_`}
              />
              <NotificationBlock
                badge="Stage 3"
                trigger="Ingestion team marks ingestion complete"
                fn="waSendIngestionComplete()"
                preview={`✅ *Ingestion Complete*\n\n*Team:* Factory A\n\n• Actual Count: 14\n• Missing: 1 ⚠️\n• Extra: 0\n• Red Cards: 0\n• Ingested By: Rahul\n• Deployment: 25 Apr 2026\n\n_Status: Completed ✓_`}
              />
            </div>
          </Section>

          <Divider />

          <Section title="Phone Number Format">
            <P>
              Numbers are stored in the <Code>poc_phones</Code> column on both the{' '}
              <Code>teams</Code> and <Code>sd_packets</Code> tables. Multiple recipients are
              comma-separated. Format must include country code with <Code>+</Code> prefix.
            </P>
            <CodeBlock>{`+919876543210
+919876543210,+918765432109`}</CodeBlock>
            <P>
              When you select a team in the packet form, phone numbers auto-fill from the team record.
              You can always override them per-packet.
            </P>
          </Section>

          <Divider />

          <Section title="Chromium on Railway">
            <P>
              Running headless Chrome on a cloud container is the trickiest part. We use a custom{' '}
              <Code>Dockerfile</Code> that installs Chromium via <Code>apt-get</Code> directly into
              the container image. This avoids Puppeteer's 170MB bundled Chromium download during{' '}
              <Code>npm ci</Code>, which was killing Railway builds with an OOM error (exit code 240).
            </P>
            <CodeBlock>{`FROM node:20-slim

RUN apt-get install -y chromium

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium`}</CodeBlock>
            <P>
              Puppeteer then picks up the system Chromium via <Code>PUPPETEER_EXECUTABLE_PATH</Code>
              instead of trying to download its own.
            </P>
          </Section>

          <Divider />

          <Section title="Useful Backend Endpoints">
            <div className="mt-4 rounded-xl border border-gray-200 overflow-hidden text-sm">
              {[
                { path: '/qr',        method: 'GET', desc: 'Renders the WhatsApp QR as a browser-scannable image. Auto-refreshes every 20s.' },
                { path: '/wa-status', method: 'GET', desc: 'Returns JSON — ready: true/false, qr_pending: true/false.' },
                { path: '/test-wa',   method: 'GET', desc: 'Sends a test WhatsApp message to confirm the bot is working.' },
                { path: '/health',    method: 'GET', desc: 'Health check. Also used by the 14-min self-ping to keep Railway awake.' },
              ].map((r, i, arr) => (
                <div key={r.path} className={`flex items-start gap-4 px-5 py-3.5 ${i < arr.length - 1 ? 'border-b border-gray-100' : ''}`}>
                  <code className="text-gray-950 font-mono font-semibold w-28 shrink-0 mt-0.5">{r.path}</code>
                  <span className="text-[11px] font-semibold bg-gray-100 text-gray-500 px-2 py-0.5 rounded mt-0.5 shrink-0">{r.method}</span>
                  <span className="text-gray-500">{r.desc}</span>
                </div>
              ))}
            </div>
          </Section>

        </div>

        {/* Footer */}
        <footer className="mt-20 pt-8 border-t border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center text-sm font-bold">K</div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Kiran</p>
              <p className="text-xs text-gray-400">Build AI · {new Date().getFullYear()}</p>
            </div>
          </div>
          <p className="text-xs text-gray-300">Build AI Tracker · Internal</p>
        </footer>

      </article>
    </main>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-xl font-bold text-gray-950 mb-4">{title}</h2>
      {children}
    </section>
  )
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-gray-600 leading-relaxed mb-4 last:mb-0">{children}</p>
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="bg-gray-100 text-gray-800 text-[13px] px-1.5 py-0.5 rounded font-mono">
      {children}
    </code>
  )
}

function CodeBlock({ children }: { children: React.ReactNode }) {
  return (
    <pre className="bg-gray-950 text-gray-100 text-sm font-mono rounded-xl px-5 py-4 overflow-x-auto leading-relaxed my-4">
      {children}
    </pre>
  )
}

function Divider() {
  return <hr className="border-gray-100" />
}

function NotificationBlock({ badge, trigger, fn, preview }: {
  badge: string; trigger: string; fn: string; preview: string
}) {
  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-gray-50">
        <span className="text-xs font-bold bg-gray-900 text-white px-2 py-0.5 rounded">{badge}</span>
        <span className="text-sm text-gray-600">{trigger}</span>
        <code className="ml-auto text-[11px] text-gray-400 font-mono hidden sm:block">{fn}</code>
      </div>
      <pre className="px-4 py-3 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed font-sans">
        {preview}
      </pre>
    </div>
  )
}
