export const metadata = {
  title: 'WhatsApp Bot Docs — Build AI Tracker',
  description: 'How the WhatsApp notification bot works in Build AI Tracker',
}

export default function DocsPage() {
  return (
    <main className="min-h-screen bg-gray-950 text-gray-100 font-sans">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900">
        <div className="max-w-4xl mx-auto px-6 py-5 flex items-center gap-3">
          <span className="text-2xl">📱</span>
          <div>
            <h1 className="text-xl font-bold text-white">WhatsApp Bot — How It Works</h1>
            <p className="text-sm text-gray-400">Build AI Tracker · Internal Docs</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10 space-y-12">

        {/* Overview */}
        <section>
          <SectionTitle emoji="🧠" title="Overview" />
          <Card>
            <p className="text-gray-300 leading-relaxed">
              Build AI Tracker uses <strong className="text-white">whatsapp-web.js</strong> — an unofficial
              WhatsApp Web API library — to automate WhatsApp messages at every stage of the SD card packet
              lifecycle. Instead of someone manually messaging team POCs, the bot sends an automatic
              WhatsApp notification the moment a packet is received, acknowledged, or fully ingested.
            </p>
          </Card>
        </section>

        {/* How whatsapp-web.js works */}
        <section>
          <SectionTitle emoji="⚙️" title="How whatsapp-web.js Works" />
          <Card>
            <p className="text-gray-300 leading-relaxed mb-4">
              <strong className="text-white">whatsapp-web.js</strong> works by automating a real WhatsApp Web
              browser session using <strong className="text-white">Puppeteer</strong> (a headless Chromium browser).
              It is NOT an official WhatsApp API — it mimics what you do manually at{' '}
              <code className="bg-gray-800 px-1 rounded text-green-400">web.whatsapp.com</code>.
            </p>
            <Steps items={[
              { label: 'Chromium starts', desc: 'The backend launches a hidden (headless) Chromium browser instance via Puppeteer on server startup.' },
              { label: 'WhatsApp Web loads', desc: 'The library navigates to web.whatsapp.com inside that hidden browser — exactly as if you opened it in Chrome.' },
              { label: 'QR Code appears', desc: 'WhatsApp Web generates a QR code. The library captures it and emits a "qr" event. We store this QR and serve it at /qr so you can scan it from your phone.' },
              { label: 'You scan the QR', desc: 'On your phone: WhatsApp → Linked Devices → Link a Device → scan the QR at /qr. Your number is now linked to the bot.' },
              { label: 'Session is saved', desc: 'The library saves the authenticated session to disk (/app/.wwebjs_auth on Railway). On restart, it reuses this session — no need to scan again as long as the volume is mounted.' },
              { label: 'Client is ready', desc: 'The "ready" event fires. The bot can now send messages programmatically using client.sendMessage().' },
            ]} />
          </Card>
        </section>

        {/* Architecture diagram */}
        <section>
          <SectionTitle emoji="🏗️" title="Architecture" />
          <Card>
            <pre className="text-sm text-green-400 bg-gray-900 rounded-lg p-4 overflow-x-auto leading-relaxed">{`
  Express Backend (Railway)
  │
  ├── src/whatsapp.ts
  │     ├── new Client({ LocalAuth, puppeteer })
  │     │         │
  │     │         └── Headless Chromium  ──►  web.whatsapp.com
  │     │                                          │
  │     │                      QR scan (one-time) ─┘
  │     │
  │     ├── client.on('qr')      → stores QR → served at GET /qr
  │     ├── client.on('ready')   → isReady = true
  │     ├── client.on('disconnected') → auto-reconnect
  │     │
  │     └── sendWhatsAppMessage(phone, text)
  │               └── client.sendMessage('91XXXXXXXXXX@c.us', text)
  │
  ├── src/routes/packets.ts
  │     ├── POST /api/packets       → waSendPacketReceived()
  │     ├── PATCH /api/packets/:id  → waSendPacketAcknowledged()
  │     └── POST /api/ingestion     → waSendIngestionComplete()
  │
  └── Session stored at /app/.wwebjs_auth  (Railway Volume)
`}</pre>
          </Card>
        </section>

        {/* 3 notification stages */}
        <section>
          <SectionTitle emoji="📨" title="The 3 Notification Stages" />
          <div className="space-y-4">
            <StageCard
              stage="Stage 1"
              color="blue"
              emoji="📦"
              trigger="Logistics logs a new packet"
              fn="waSendPacketReceived()"
              message={`📦 *SD Cards Received*\n\n*Team:* Factory A\n*Factory:* Chennai Plant\n*Date Received:* 23 Apr 2026\n*Card Count:* 15\n*Logged By:* Kiran\n\n_Status: Received — awaiting ingestion team._`}
            />
            <StageCard
              stage="Stage 2"
              color="yellow"
              emoji="⏳"
              trigger="Ingestion team acknowledges the packet"
              fn="waSendPacketAcknowledged()"
              message={`⏳ *SD Cards In Ingestion Queue*\n\n*Team:* Factory A\n*Factory:* Chennai Plant\n*Card Count:* 15\n\nYour packet has been acknowledged by the ingestion team and is now being processed.\n\n_Status: Processing — you'll be notified when ingestion is complete._`}
            />
            <StageCard
              stage="Stage 3"
              color="green"
              emoji="✅"
              trigger="Ingestion team marks ingestion as complete"
              fn="waSendIngestionComplete()"
              message={`✅ *Ingestion Complete*\n\n*Team:* Factory A\n*Factory:* Chennai Plant\n\n*Ingestion Summary*\n• Actual Count: 14\n• Missing Cards: 1 ⚠️\n• Extra Cards: 0\n• Red Cards: 0\n• Industry: Retail\n• Ingested By: Rahul\n• Deployment Date: 25 Apr 2026\n\n_Status: Completed ✓_`}
            />
          </div>
        </section>

        {/* Phone number format */}
        <section>
          <SectionTitle emoji="📞" title="Phone Number Format" />
          <Card>
            <p className="text-gray-300 mb-3">
              Numbers must be in <strong className="text-white">international format</strong> with the <code className="bg-gray-800 px-1 rounded text-green-400">+</code> prefix.
              Multiple numbers are comma-separated.
            </p>
            <CodeBlock>{`+919876543210                        ← single number
+919876543210,+918765432109          ← multiple numbers`}</CodeBlock>
            <p className="text-gray-400 text-sm mt-3">
              These are stored in the <code className="bg-gray-800 px-1 rounded text-green-400">poc_phones</code> column
              on both the <code className="bg-gray-800 px-1 rounded text-green-400">teams</code> and{' '}
              <code className="bg-gray-800 px-1 rounded text-green-400">sd_packets</code> tables.
              When you select a team in the packet form, the numbers auto-fill from the team record.
            </p>
          </Card>
        </section>

        {/* Session & Volume */}
        <section>
          <SectionTitle emoji="💾" title="Session Persistence (Railway Volume)" />
          <Card>
            <p className="text-gray-300 leading-relaxed mb-4">
              After you scan the QR once, the library saves the WhatsApp session to disk using{' '}
              <strong className="text-white">LocalAuth</strong>. On Railway, this folder is stored in a
              persistent Volume so the session survives restarts and redeploys.
            </p>
            <table className="w-full text-sm">
              <tbody className="divide-y divide-gray-800">
                <TableRow label="Session path" value="/app/.wwebjs_auth" />
                <TableRow label="Railway Volume mount" value="/app/.wwebjs_auth" />
                <TableRow label="Strategy used" value="LocalAuth (whatsapp-web.js built-in)" />
                <TableRow label="Re-scan required?" value="Only if volume is deleted or session expires" />
              </tbody>
            </table>
            <div className="mt-4 bg-yellow-900/30 border border-yellow-700/50 rounded-lg p-3 text-sm text-yellow-300">
              ⚠️ If the Railway Volume is not mounted, every redeploy wipes the session and you must scan the QR again.
            </div>
          </Card>
        </section>

        {/* Backend endpoints */}
        <section>
          <SectionTitle emoji="🔗" title="Backend Endpoints" />
          <Card>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400 border-b border-gray-800">
                  <th className="pb-2 pr-4">Endpoint</th>
                  <th className="pb-2 pr-4">Method</th>
                  <th className="pb-2">Purpose</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                <EndpointRow path="/qr" method="GET" desc="Renders WhatsApp QR code as a scannable image. Auto-refreshes every 20s." />
                <EndpointRow path="/wa-status" method="GET" desc="Returns JSON with ready state and QR pending flag." />
                <EndpointRow path="/test-wa" method="GET" desc="Sends a test WhatsApp message to +919677514444." />
                <EndpointRow path="/health" method="GET" desc="Health check — also used by the keep-alive self-ping." />
              </tbody>
            </table>
          </Card>
        </section>

        {/* Chromium on Railway */}
        <section>
          <SectionTitle emoji="🐳" title="Chromium on Railway (Dockerfile)" />
          <Card>
            <p className="text-gray-300 leading-relaxed mb-4">
              <strong className="text-white">whatsapp-web.js</strong> needs a real Chromium browser to run.
              On Railway, we use a <strong className="text-white">Dockerfile</strong> to install Chromium via{' '}
              <code className="bg-gray-800 px-1 rounded text-green-400">apt-get</code> into the container,
              then point Puppeteer to it via environment variable.
            </p>
            <CodeBlock>{`FROM node:20-slim

RUN apt-get install -y chromium  # ← installs system Chromium

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true   # ← skip puppeteer's own download
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium  # ← use the apt one`}</CodeBlock>
            <p className="text-gray-400 text-sm mt-3">
              This avoids the ~170MB Puppeteer bundled Chromium download during <code className="bg-gray-800 px-1 rounded text-green-400">npm ci</code>, which was causing Railway builds to fail with exit code 240 (OOM kill).
            </p>
          </Card>
        </section>

        {/* Footer */}
        <div className="border-t border-gray-800 pt-6 text-sm text-gray-500 text-center">
          Build AI Tracker · Internal Documentation · {new Date().getFullYear()}
        </div>

      </div>
    </main>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function SectionTitle({ emoji, title }: { emoji: string; title: string }) {
  return (
    <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
      <span>{emoji}</span> {title}
    </h2>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      {children}
    </div>
  )
}

function CodeBlock({ children }: { children: React.ReactNode }) {
  return (
    <pre className="text-sm text-green-400 bg-gray-950 border border-gray-800 rounded-lg p-4 overflow-x-auto leading-relaxed">
      {children}
    </pre>
  )
}

function Steps({ items }: { items: { label: string; desc: string }[] }) {
  return (
    <ol className="space-y-3">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3">
          <span className="shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold mt-0.5">
            {i + 1}
          </span>
          <div>
            <span className="text-white font-medium">{item.label}</span>
            <span className="text-gray-400"> — {item.desc}</span>
          </div>
        </li>
      ))}
    </ol>
  )
}

function StageCard({
  stage, color, emoji, trigger, fn, message,
}: {
  stage: string; color: 'blue' | 'yellow' | 'green'; emoji: string
  trigger: string; fn: string; message: string
}) {
  const colors = {
    blue:   'border-blue-700/50 bg-blue-950/20',
    yellow: 'border-yellow-700/50 bg-yellow-950/20',
    green:  'border-green-700/50 bg-green-950/20',
  }
  const badges = {
    blue:   'bg-blue-800 text-blue-200',
    yellow: 'bg-yellow-800 text-yellow-200',
    green:  'bg-green-800 text-green-200',
  }
  return (
    <div className={`border rounded-xl p-5 ${colors[color]}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className={`text-xs font-bold px-2 py-0.5 rounded ${badges[color]}`}>{stage}</span>
        <span className="text-white font-semibold">{emoji} Triggered when: <span className="font-normal text-gray-300">{trigger}</span></span>
      </div>
      <p className="text-sm text-gray-400 mb-3">
        Function: <code className="bg-gray-800 px-1.5 py-0.5 rounded text-green-400">{fn}</code>
      </p>
      <pre className="text-xs text-gray-300 bg-gray-950 border border-gray-800 rounded-lg p-3 whitespace-pre-wrap leading-relaxed">
        {message}
      </pre>
    </div>
  )
}

function TableRow({ label, value }: { label: string; value: string }) {
  return (
    <tr>
      <td className="py-2 pr-4 text-gray-400">{label}</td>
      <td className="py-2 font-mono text-green-400 text-sm">{value}</td>
    </tr>
  )
}

function EndpointRow({ path, method, desc }: { path: string; method: string; desc: string }) {
  return (
    <tr>
      <td className="py-2 pr-4 font-mono text-green-400">{path}</td>
      <td className="py-2 pr-4">
        <span className="bg-gray-800 text-gray-300 text-xs px-2 py-0.5 rounded">{method}</span>
      </td>
      <td className="py-2 text-gray-300">{desc}</td>
    </tr>
  )
}
