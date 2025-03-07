import React from 'react';
import { X } from 'lucide-react';

interface AnalyticsProps {
  data: {
    totalTasks: number;
    completedTasks: number;
    aiGeneratedTasks: number;
    averageCompletionTime: number | null;
    userActivity: {
      date: string;
      count: number;
    }[];
  };
  onClose: () => void;
}

const Analytics: React.FC<AnalyticsProps> = ({ data, onClose }) => {
  const completionRate = data.totalTasks > 0 
    ? Math.round((data.completedTasks / data.totalTasks) * 100) 
    : 0;
  
  const aiUsageRate = data.totalTasks > 0
    ? Math.round((data.aiGeneratedTasks / data.totalTasks) * 100)
    : 0;
  
  // Find the max count for scaling the chart
  const maxCount = Math.max(...data.userActivity.map(day => day.count), 1);
  
  return (
    <div className="bg-white rounded-lg p-4 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">Analytics Dashboard</h2>
        <button 
          onClick={onClose}
          className="p-1 rounded-full hover:bg-gray-100"
        >
          <X size={20} className="text-gray-500" />
        </button>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-purple-50 rounded-lg p-4">
          <p className="text-sm text-purple-700 mb-1">Total Tasks</p>
          <p className="text-2xl font-bold text-purple-900">{data.totalTasks}</p>
        </div>
        
        <div className="bg-green-50 rounded-lg p-4">
          <p className="text-sm text-green-700 mb-1">Completion Rate</p>
          <p className="text-2xl font-bold text-green-900">{completionRate}%</p>
        </div>
        
        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-sm text-blue-700 mb-1">AI Generated</p>
          <p className="text-2xl font-bold text-blue-900">{data.aiGeneratedTasks}</p>
        </div>
        
        <div className="bg-amber-50 rounded-lg p-4">
          <p className="text-sm text-amber-700 mb-1">AI Usage Rate</p>
          <p className="text-2xl font-bold text-amber-900">{aiUsageRate}%</p>
        </div>
      </div>
      
      {data.averageCompletionTime !== null && (
        <div className="mb-6">
          <h3 className="text-md font-semibold text-gray-700 mb-2">Average Completion Time</h3>
          <div className="bg-gray-100 rounded-lg p-3">
            <p className="text-xl font-bold text-gray-800">
              {data.averageCompletionTime.toFixed(1)} minutes
            </p>
          </div>
        </div>
      )}
      
      <div>
        <h3 className="text-md font-semibold text-gray-700 mb-2">Activity Over Time</h3>
        <div className="h-40 flex items-end space-x-2">
          {data.userActivity.length === 0 ? (
            <p className="text-gray-500 text-sm">No activity data available yet</p>
          ) : (
            data.userActivity.map((day, index) => (
              <div key={index} className="flex flex-col items-center">
                <div 
                  className="w-8 bg-purple-500 rounded-t-sm" 
                  style={{ 
                    height: `${(day.count / maxCount) * 100}%`,
                    minHeight: '10%'
                  }}
                ></div>
                <p className="text-xs text-gray-600 mt-1 transform -rotate-45 origin-top-left">
                  {day.date}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
      
      <div className="mt-6 text-sm text-gray-500">
        <p>This analytics dashboard tracks usage patterns and task management efficiency.</p>
        <p className="mt-1">In a production app, this data would be sent to a backend for comprehensive analytics.</p>
      </div>
    </div>
  );
};

export default Analytics;