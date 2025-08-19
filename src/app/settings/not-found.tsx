import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <h1 className="text-2xl font-bold text-gray-700 mb-4">Settings Not Found</h1>
      <p className="text-gray-600 mb-2">The settings page could not be found.</p>
      <Link href="/" className="mt-4 px-4 py-2 bg-gray-900 text-white rounded">Go Home</Link>
    </div>
  );
}
