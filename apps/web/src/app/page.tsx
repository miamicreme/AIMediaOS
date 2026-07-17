import { Studio } from "@/components/Studio";

export default function Home() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(124,58,237,0.35),transparent_34%),radial-gradient(circle_at_top_right,rgba(6,182,212,0.24),transparent_32%),linear-gradient(180deg,#070810_0%,#0b0c10_52%,#030712_100%)]" />
      <header className="sticky top-0 z-10 border-b border-white/10 bg-black/35 px-4 py-4 backdrop-blur-xl sm:px-6">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-300 via-violet-500 to-fuchsia-500 text-sm font-black text-white shadow-lg shadow-violet-900/30">
              AI
            </div>
            <div>
              <div className="text-lg font-black tracking-tight text-white">AIMediaOS</div>
              <div className="text-[11px] uppercase tracking-[0.28em] text-cyan-200/70">Media Engine</div>
            </div>
          </div>
          <span className="rounded-full border border-emerald-300/25 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-100">
            Test-ready local build
          </span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <section className="mb-8 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.06] p-5 shadow-2xl shadow-black/30 backdrop-blur sm:p-8">
          <div className="mb-4 inline-flex rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-semibold text-cyan-100">
            Choose a workflow → Generate → Preview → Download
          </div>
          <h1 className="max-w-3xl text-3xl font-black leading-tight tracking-tight text-white sm:text-5xl">
            Text-to-image runs for real. Image workflows preview locally.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-white/64 sm:text-base">
            No billing or login required. Text to Image calls a real Seedream job when
            SEEDREAM_API_KEY is set (and shows the exact API error when it isn&apos;t). The
            image-upload workflows always run as a local, in-browser preview — real generation
            for those needs hosted image storage this local build doesn&apos;t have yet.
          </p>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ["Local", "Runs in browser"],
              ["Live", "Real Seedream jobs"],
              ["History", "Recent jobs saved"],
              ["Honest", "No fake success states"]
            ].map(([title, body]) => (
              <div key={title} className="rounded-2xl border border-white/10 bg-black/20 p-3">
                <div className="text-sm font-bold text-white">{title}</div>
                <div className="mt-1 text-xs text-white/50">{body}</div>
              </div>
            ))}
          </div>
        </section>

        <Studio />
      </main>

      <footer className="border-t border-white/10 px-4 py-6 text-center text-xs text-white/40 sm:px-6">
        AIMediaOS local readiness build • Real test output today • Provider adapters next
      </footer>
    </div>
  );
}
