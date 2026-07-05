import { Studio } from "@/components/Studio";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b border-white/10 bg-canvas/90 px-4 py-4 backdrop-blur sm:px-6">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <span className="text-lg font-semibold tracking-tight">AIMediaOS</span>
          <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/60">
            MVP scaffold
          </span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <section className="mb-8">
          <h1 className="text-2xl font-bold leading-tight sm:text-3xl">
            Upload an image, pick a safe effect, generate.
          </h1>
          <p className="mt-2 text-sm text-white/60 sm:text-base">
            This is AIMediaOS&apos;s first MVP flow: upload &rarr; select effect &rarr; generate
            &rarr; track job &rarr; store result. Wired to the shared, workflows, and providers
            packages in this monorepo.
          </p>
        </section>

        <Studio />
      </main>

      <footer className="border-t border-white/10 px-4 py-6 text-center text-xs text-white/40 sm:px-6">
        User / App &rarr; Web Dashboard &rarr; API Gateway &rarr; Job Queue &rarr; AI Router &rarr;
        Storage + CDN
      </footer>
    </div>
  );
}
