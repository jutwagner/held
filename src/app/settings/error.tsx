"use client";

export default function Error({ error }: { error: Error }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <h1 className="text-2xl font-bold text-red-700 mb-4">Something went wrong</h1>
      <p className="text-gray-700 mb-2">{error.message}</p>
      <button
        className="mt-4 px-4 py-2 bg-gray-900 text-white rounded"
        onClick={() => window.location.reload()}
      >
        Refresh
      </button>
    </div>
  );
}
