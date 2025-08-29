export async function generateStaticParams() {
  return [];
}

export default function theCollaborativePage() {
  return (
    <div className="held-container py-8">
      <h1 className="text-3xl font-serif mb-2 sm:mb-0" style={{ fontFamily: 'Libre Baskerville, serif' }}>theCollaborative</h1>
      <h2 className="text-lg font-serif font-normal text-gray-600" style={{ fontFamily: 'Libre Baskerville, serif' }}>Welcome to the collaborative page!</h2>
    </div>
  );
}