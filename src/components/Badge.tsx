import React from 'react';

type BadgeProps = {
  label: string;
  description: string;
};

const Badge: React.FC<BadgeProps> = ({ label, description }) => {
  return (
    <div className="flex items-center space-x-2 p-2 border rounded-md bg-gray-100">
      <span className="font-bold text-blue-500">{label}</span>
      <span className="text-sm text-gray-600">{description}</span>
    </div>
  );
};

export default Badge;
