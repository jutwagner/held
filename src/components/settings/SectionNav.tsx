import React from 'react';
// SVG icon components for each section
const icons = {
  profile: (
    <svg width="20" height="20" fill="none" viewBox="0 0 20 20"><circle cx="10" cy="7" r="4" stroke="currentColor" strokeWidth="1.5"/><path d="M4 16c0-2.21 2.686-4 6-4s6 1.79 6 4" stroke="currentColor" strokeWidth="1.5"/></svg>
  ),
  appearance: (
    <svg width="20" height="20" fill="none" viewBox="0 0 20 20"><rect x="3" y="3" width="14" height="14" rx="3" stroke="currentColor" strokeWidth="1.5"/><circle cx="10" cy="10" r="3" stroke="currentColor" strokeWidth="1.5"/></svg>
  ),
  account: (
    <svg width="20" height="20" fill="none" viewBox="0 0 20 20"><rect x="4" y="4" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M10 8v4" stroke="currentColor" strokeWidth="1.5"/><circle cx="10" cy="13" r="1" fill="currentColor"/></svg>
  ),
  data: (
    <svg width="20" height="20" fill="none" viewBox="0 0 20 20"><rect x="3" y="6" width="14" height="8" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M7 6V4a3 3 0 016 0v2" stroke="currentColor" strokeWidth="1.5"/></svg>
  ),
  notifications: (
    <svg width="20" height="20" fill="none" viewBox="0 0 20 20"><path d="M10 17a2 2 0 002-2H8a2 2 0 002 2z" stroke="currentColor" strokeWidth="1.5"/><path d="M14 13V9a4 4 0 10-8 0v4l-1 1v1h10v-1l-1-1z" stroke="currentColor" strokeWidth="1.5"/></svg>
  ),
  premium: (
    <svg width="20" height="20" fill="none" viewBox="0 0 20 20"><path d="M10 2l2.39 6.94H19l-5.195 3.77L15.195 19 10 15.23 4.805 19l1.39-6.29L1 8.94h6.61z" stroke="currentColor" strokeWidth="1.5"/></svg>
  ),
  danger: (
    <svg width="20" height="20" fill="none" viewBox="0 0 20 20"><circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5"/><path d="M10 6v5" stroke="currentColor" strokeWidth="1.5"/><circle cx="10" cy="14" r="1" fill="currentColor"/></svg>
  ),
};

const sections = [
  { key: 'profile', label: 'Profile' },
  { key: 'data', label: 'Data' },
  { key: 'premium', label: 'Held+' },
];

export type SectionKey = keyof typeof icons;
export default function SectionNav({ section, mobile = false }: { section: SectionKey; mobile?: boolean }) {
  return (
    <nav
      className={
        mobile
          ? 'flex justify-between px-2 py-2 bg-white border-t border-gray-200 fixed bottom-0 left-0 right-0 z-10'
          : 'flex flex-col gap-2 p-4 bg-white rounded shadow'
      }
      aria-label="Settings Sections"
    >
      {sections.map(s => (
        <a
          key={s.key}
          href={`/settings/${s.key === 'profile' ? '' : s.key}`}
          className={
            mobile
              ? `flex flex-col items-center justify-center flex-1 px-1 py-1 text-xs font-medium rounded transition-colors ${section === s.key ? 'text-blue-600' : 'text-gray-500 hover:text-blue-500'}`
              : `flex items-center gap-2 px-3 py-2 rounded font-medium transition-colors text-left ${section === s.key ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:bg-gray-50'}`
          }
          aria-current={section === s.key ? 'page' : undefined}
        >
          <span className="mb-0.5">{icons[s.key as SectionKey]}</span>
          <span className={mobile ? 'text-[10px] mt-0.5' : ''}>{s.label}</span>
        </a>
      ))}
    </nav>
  );
}
