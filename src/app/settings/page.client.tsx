import dynamic from 'next/dynamic';
const SettingsClient = dynamic(() => import('@/components/settings/SettingsClient'), { ssr: false });

export default function Page() {
	return <SettingsClient />;
}