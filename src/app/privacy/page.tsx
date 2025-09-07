'use client';

import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <div className="held-container py-10 md:py-16 max-w-3xl">
        <h1 className="text-3xl md:text-4xl font-serif font-medium mb-4">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: 2025-09-06</p>

        <div className="held-card p-6 md:p-8 space-y-6 text-gray-800 leading-relaxed">
          <p>
            Your privacy matters. Held stores your collection data privately by default.
            We only process the information needed to operate the app and provide features
            you choose to use.
          </p>

          <h2 className="text-xl font-semibold">Information We Collect</h2>
          <ul className="list-disc pl-5 space-y-2 text-gray-700">
            <li>Account details you provide (email, display name).</li>
            <li>Collection data you add (objects, images, notes).</li>
            <li>Basic analytics to keep the service reliable.</li>
          </ul>

          <h2 className="text-xl font-semibold">How We Use Data</h2>
          <p>
            We use your data to run Held, improve performance, and enable features such as
            sharing a Passport or making items public. We do not sell your data.
          </p>

          <h2 className="text-xl font-semibold">Your Choices</h2>
          <ul className="list-disc pl-5 space-y-2 text-gray-700">
            <li>Keep items private by default, or choose to share.</li>
            <li>Request deletion of your account and data anytime.</li>
          </ul>

        </div>

        <div className="mt-8 text-sm text-gray-600">
          <Link href="/" className="hover:underline">Back to Home</Link>
        </div>
      </div>
    </div>
  );
}

