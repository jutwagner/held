"use client";
"use client";
import React from "react";

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-center p-8">
      <h1 className="text-2xl font-bold text-red-600 mb-4">Oh, No!</h1>
      <p className="mb-6 text-gray-700">{error?.message || "An unexpected error occurred. Please try again."}</p>
      <button
        className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition"
        onClick={() => reset()}
      >
        Try Again
      </button>
    </div>
  );
}
