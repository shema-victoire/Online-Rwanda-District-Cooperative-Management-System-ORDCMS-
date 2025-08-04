import React from 'react';
import Navigation from './Navigation';
import { Calendar, Plus, Clock } from 'lucide-react';

const MeetingScheduler = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Calendar className="h-8 w-8 mr-3 text-rwanda-blue" />
              Meeting Scheduler
            </h1>
            <p className="text-gray-600 mt-2">
              Schedule and manage cooperative meetings
            </p>
          </div>
          
          <button className="btn-primary">
            <Plus className="h-5 w-5 mr-2" />
            Schedule Meeting
          </button>
        </div>

        <div className="bg-white p-8 rounded-lg card-shadow text-center">
          <Clock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Meeting Scheduler Coming Soon
          </h3>
          <p className="text-gray-600">
            This feature will allow you to schedule meetings and send notifications to members.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MeetingScheduler;