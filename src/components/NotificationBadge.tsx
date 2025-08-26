interface NotificationBadgeProps {
  count: number;
}

export default function NotificationBadge({ count }: NotificationBadgeProps) {
  if (count <= 0) {
    return null;
  }

  return (
    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-medium rounded-full min-w-[20px] h-[20px] flex items-center justify-center px-1 z-10 shadow-sm">
      {count > 99 ? '99+' : count}
    </span>
  );
}
