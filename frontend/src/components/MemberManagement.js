import React from 'react';
import Navigation from './Navigation';
import { Users, Plus, Search, UserPlus } from 'lucide-react';

const MemberManagement = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Users className="h-8 w-8 mr-3 text-rwanda-blue" />
              Member Management
            </h1>
            <p className="text-gray-600 mt-2">
              Manage cooperative members and their profiles
            </p>
          </div>
          
          <button className="btn-primary">
            <UserPlus className="h-5 w-5 mr-2" />
            Add Member
          </button>
        </div>

        <div className="bg-white p-8 rounded-lg card-shadow text-center">
          <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Member Management Coming Soon
          </h3>
          <p className="text-gray-600">
            This feature will allow you to add, remove, and manage cooperative members.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MemberManagement;