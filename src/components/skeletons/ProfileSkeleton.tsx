export function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="held-container py-6 held-container-wide align-center">
          <div className="flex items-center justify-between animate-pulse">
            <div className="h-6 w-20 rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-8 w-24 rounded-lg bg-gray-200 dark:bg-gray-700" />
          </div>
        </div>
      </div>

      <div className="held-container-wide pt-8 align-center mobile-no-top-padding animate-pulse">
        <div className="flex justify-center mb-8">
          <div className="w-full max-w-5xl mx-auto">
            <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
              <div className="h-48 bg-gray-200 dark:bg-gray-700" />
              <div className="absolute -bottom-12 left-8 h-24 w-24 rounded-full border-4 border-white dark:border-gray-900 bg-gray-300 dark:bg-gray-600" />
            </div>
          </div>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-[1fr_320px] max-w-5xl mx-auto">
          <div className="space-y-4">
            <div className="h-8 w-48 rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-4 w-32 rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-20 rounded-xl bg-gray-200 dark:bg-gray-800" />
            <div className="h-52 rounded-2xl bg-gray-200 dark:bg-gray-800" />
          </div>

          <div className="space-y-4">
            <div className="h-10 w-full rounded-lg bg-gray-200 dark:bg-gray-700" />
            <div className="h-40 rounded-2xl bg-gray-200 dark:bg-gray-800" />
          </div>
        </div>
      </div>
    </div>
  );
}
