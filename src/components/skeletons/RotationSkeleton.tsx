export function RotationSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 animate-pulse">
      <header className="relative overflow-hidden bg-white/90 dark:bg-gray-900/90 backdrop-blur shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800" />
        <div className="held-container held-container-wide py-10 relative z-10">
          <div className="max-w-5xl mx-auto flex flex-col gap-8">
            <div className="flex flex-col gap-4 text-center md:text-left">
              <div className="h-10 w-48 md:w-72 mx-auto md:mx-0 rounded-lg bg-gray-200 dark:bg-gray-700" />
              <div className="h-4 w-56 md:w-2/3 mx-auto md:mx-0 rounded bg-gray-200 dark:bg-gray-700" />
              <div className="h-4 w-40 md:w-1/2 mx-auto md:mx-0 rounded bg-gray-200 dark:bg-gray-700" />
            </div>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex flex-wrap justify-center md:justify-start gap-3">
                <div className="h-8 w-28 rounded-full bg-gray-200 dark:bg-gray-700" />
                <div className="h-8 w-28 rounded-full bg-gray-200 dark:bg-gray-700" />
                <div className="h-8 w-28 rounded-full bg-gray-200 dark:bg-gray-700" />
              </div>
              <div className="flex flex-wrap justify-center md:justify-end gap-3">
                <div className="h-10 w-32 rounded-lg bg-gray-200 dark:bg-gray-700" />
                <div className="h-10 w-32 rounded-lg bg-gray-200 dark:bg-gray-700" />
              </div>
            </div>
          </div>
        </div>
      </header>

      <nav className="sticky top-20 z-20 bg-white/95 dark:bg-gray-900/95 backdrop-blur border-b border-gray-100 dark:border-gray-800 py-4">
        <div className="held-container held-container-wide">
          <div className="flex justify-center gap-3">
            {[...Array(6)].map((_, idx) => (
              <div
                key={idx}
                className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full bg-gray-200 dark:bg-gray-700 border-2 border-white dark:border-gray-800 shadow"
                style={{ marginLeft: idx === 0 ? 0 : -12 }}
              />
            ))}
          </div>
        </div>
      </nav>

      <main className="held-container held-container-wide py-12">
        <div className="max-w-5xl mx-auto space-y-16">
          {[...Array(2)].map((_, sectionIdx) => (
            <section
              key={sectionIdx}
              className="flex flex-col lg:flex-row gap-10 lg:items-center border-b border-gray-200 dark:border-gray-700 pb-12"
            >
              <div className="w-full lg:w-1/2">
                <div className="aspect-[4/3] rounded-2xl bg-gray-200 dark:bg-gray-700" />
              </div>
              <div className="flex-1 w-full space-y-4">
                <div className="h-8 w-48 rounded bg-gray-200 dark:bg-gray-700" />
                <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-700" />
                <div className="h-4 w-64 rounded bg-gray-200 dark:bg-gray-700" />
                <div className="h-4 w-56 rounded bg-gray-200 dark:bg-gray-700" />
                <div className="flex flex-wrap gap-2 pt-2">
                  {[...Array(4)].map((__, tagIdx) => (
                    <span
                      key={tagIdx}
                      className="h-6 w-20 rounded-full bg-gray-200 dark:bg-gray-700"
                    />
                  ))}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
                  {[...Array(4)].map((__, statIdx) => (
                    <div key={statIdx} className="h-16 rounded-xl bg-gray-200 dark:bg-gray-800" />
                  ))}
                </div>
              </div>
            </section>
          ))}

          <div className="grid gap-6">
            {[...Array(3)].map((_, cardIdx) => (
              <div key={cardIdx} className="rounded-2xl bg-white/60 dark:bg-gray-800/70 border border-gray-100 dark:border-gray-800 p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="h-6 w-40 rounded bg-gray-200 dark:bg-gray-700" />
                  <div className="h-10 w-full md:w-48 rounded-lg bg-gray-200 dark:bg-gray-700" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
