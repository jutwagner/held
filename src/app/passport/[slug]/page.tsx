import PassportClient from './PassportClient';

export async function generateStaticParams() {
  // Return empty array since passport pages are dynamic
  return [];
}

export default function PassportPage() {
  return <PassportClient />;
}