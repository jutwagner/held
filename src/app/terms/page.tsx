'use client';

import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <div className="held-container py-10 md:py-16 max-w-3xl">
        <h1 className="text-3xl md:text-4xl font-serif font-medium mb-4">Terms of Service</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: 2025-09-06</p>

        <div className="held-card p-6 md:p-8 space-y-6 text-gray-800 leading-relaxed">
          <p>
            By using Held, you agree to these terms. We aim to provide a stable
            service for privately managing your collection with optional sharing.
          </p>

          <h2 className="text-xl font-semibold">Use of the Service</h2>
          <ul className="list-disc pl-5 space-y-2 text-gray-700">
            <li>You are responsible for the content you upload.</li>
            <li>Do not upload unlawful or infringing material.</li>
            <li>We may update features and these terms from time to time.</li>
          </ul>

          <h2 className="text-xl font-semibold">Accounts</h2>
          <p>
            Keep your account secure. You can delete your account and data by
            contacting support or using in‑app tools if available.
          </p>

          <h2 className="text-xl font-semibold">Liability</h2>
          <p>
            Held is provided “as is” without warranties. To the maximum extent
            permitted by law, our liability is limited to amounts you’ve paid for
            the service, if any.
          </p>
        </div>

        <div className="mt-8 text-sm text-gray-600">
          <Link href="/" className="hover:underline">Back to Home</Link>
        </div>
      </div>
    </div>
  );
}

