export function SettingsSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 animate-pulse">
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="py-4">
          <div className="relative flex items-center justify-center max-w-5xl mx-auto px-16">
            <div className="absolute left-4 flex items-center gap-2">
              <span className="h-4 w-4 rounded-full bg-gray-200 dark:bg-gray-700" />
              <span className="h-4 w-16 rounded bg-gray-200 dark:bg-gray-700" />
            </div>
            <div className="absolute right-4 flex items-center gap-2">
              <span className="h-4 w-4 rounded-full bg-gray-200 dark:bg-gray-700" />
              <span className="h-4 w-16 rounded bg-gray-200 dark:bg-gray-700" />
            </div>
            <div className="flex gap-2">
              {[...Array(4)].map((_, idx) => (
                <span
                  key={idx}
                  className="h-9 w-24 rounded-lg bg-gray-200 dark:bg-gray-700"
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <main className="w-full flex-1 p-4 md:p-8 max-w-none md:max-w-2xl md:mx-auto pb-16 md:pb-8">
        <div className="space-y-6">
          <div className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gray-200 dark:bg-gray-700" />
                <div className="flex-1 space-y-3">
                  <div className="h-5 w-40 rounded bg-gray-200 dark:bg-gray-700" />
                  <div className="h-4 w-32 rounded bg-gray-200 dark:bg-gray-700" />
                </div>
              </div>
              <div className="space-y-3">
                <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-700" />
                <div className="h-12 rounded-xl bg-gray-200 dark:bg-gray-700" />
              </div>
              <div className="space-y-3">
                <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-700" />
                <div className="h-20 rounded-xl bg-gray-200 dark:bg-gray-700" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
            <div className="space-y-4">
              <div className="h-4 w-32 rounded bg-gray-200 dark:bg-gray-700" />
              <div className="grid gap-4 md:grid-cols-2">
                {[...Array(4)].map((_, idx) => (
                  <div key={idx} className="h-12 rounded-xl bg-gray-200 dark:bg-gray-700" />
                ))}
              </div>
              <div className="flex items-center justify-between pt-2">
                <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-700" />
                <div className="h-6 w-12 rounded-full bg-gray-200 dark:bg-gray-700" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
            <div className="space-y-4">
              <div className="h-4 w-28 rounded bg-gray-200 dark:bg-gray-700" />
              <div className="space-y-3">
                {[...Array(3)].map((_, idx) => (
                  <div key={idx} className="h-12 rounded-xl bg-gray-200 dark:bg-gray-700" />
                ))}
              </div>
              <div className="h-10 w-full rounded-xl bg-gray-200 dark:bg-gray-700" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
