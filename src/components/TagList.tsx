import Link from 'next/link';

interface TagListProps {
  tags?: string[];
  limit?: number;
  size?: 'sm' | 'xs';
}

export default function TagList({ tags, limit, size = 'sm' }: TagListProps) {
  if (!tags || tags.length === 0) return null;
  const display = typeof limit === 'number' ? tags.slice(0, limit) : tags;
  const remainder = typeof limit === 'number' && tags.length > limit ? tags.length - limit : 0;
  const baseClasses =
    size === 'xs'
      ? 'px-2 py-0.5 text-xs'
      : 'px-2.5 py-0.5 text-sm md:text-xs';

  return (
    <div className="flex flex-wrap gap-2">
      {display.map((tag) => (
        <Link
          key={tag}
          href={`/tags/${encodeURIComponent(tag)}`}
          className={`${baseClasses} rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-400`}
        >
          {tag}
        </Link>
      ))}
      {remainder > 0 && (
        <span className={`${baseClasses} rounded-full bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-dashed border-gray-300 dark:border-gray-600`}>+{remainder}</span>
      )}
    </div>
  );
}
