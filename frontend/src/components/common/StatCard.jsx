import React from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';

const StatCard = ({ title, value, icon, color, trend }) => {
  const trendColor = trend && trend.startsWith('+') ? 'text-green-500' : 'text-red-500';
  const TrendIcon = trend && trend.startsWith('+') ? ArrowUp : ArrowDown;

  return (
    <div className="bg-white p-4 rounded-lg shadow-md flex items-center">
      <div className={`p-3 rounded-full mr-4 ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-bold">{value}</p>
        {trend && (
          <div className={`flex items-center text-sm ${trendColor}`}>
            <TrendIcon size={16} className="mr-1" />
            <span>{trend}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;