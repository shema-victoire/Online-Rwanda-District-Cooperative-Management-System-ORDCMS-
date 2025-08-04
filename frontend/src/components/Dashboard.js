import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import Navigation from './Navigation';
import { Users, Building, DollarSign, Calendar, CheckCircle, Clock, XCircle } from 'lucide-react';
import axios from 'axios';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    cooperatives: {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0
    },
    members: {
      total: 0,
      active: 0
    },
    meetings: {
      upcoming: 0,
      thisMonth: 0
    }
  });

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      // Fetch cooperatives data
      const cooperativesResponse = await axios.get('/api/cooperatives');
      const cooperatives = cooperativesResponse.data;
      
      setStats(prevStats => ({
        ...prevStats,
        cooperatives: {
          total: cooperatives.length,
          pending: cooperatives.filter(coop => coop.status === 'pending').length,
          approved: cooperatives.filter(coop => coop.status === 'approved').length,
          rejected: cooperatives.filter(coop => coop.status === 'rejected').length
        }
      }));
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  };

  const StatCard = ({ icon: Icon, title, value, subtitle, color = "blue" }) => {
    const colorClasses = {
      blue: "bg-blue-500",
      green: "bg-green-500",
      yellow: "bg-yellow-500",
      red: "bg-red-500"
    };

    return (
      <div className="bg-white p-6 rounded-lg card-shadow">
        <div className="flex items-center">
          <div className={`${colorClasses[color]} p-3 rounded-full`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <p className="text-3xl font-bold text-gray-900">{value}</p>
            {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
          </div>
        </div>
      </div>
    );
  };

  const WelcomeSection = () => (
    <div className="bg-gradient-to-r from-rwanda-blue to-rwanda-green p-6 rounded-lg text-white mb-8">
      <h1 className="text-3xl font-bold">
        Welcome, {user.full_name}!
      </h1>
      <p className="text-blue-100 mt-2">
        {user.role === 'district_official' && 'Manage cooperatives in your district'}
        {user.role === 'cooperative_leader' && 'Manage your cooperative members and activities'}
        {user.role === 'member' && 'Stay updated with your cooperative activities'}
      </p>
      {user.district && (
        <p className="text-blue-100 mt-1">
          District: {user.district}
        </p>
      )}
    </div>
  );

  const QuickActions = () => (
    <div className="bg-white p-6 rounded-lg card-shadow">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {user.role === 'district_official' && (
          <>
            <button className="btn-primary text-left p-4 rounded-lg">
              <Building className="h-5 w-5 inline mr-2" />
              Review Pending Cooperatives
            </button>
            <button className="btn-secondary text-left p-4 rounded-lg">
              <Users className="h-5 w-5 inline mr-2" />
              Generate Reports
            </button>
          </>
        )}
        {user.role === 'cooperative_leader' && (
          <>
            <button className="btn-primary text-left p-4 rounded-lg">
              <Users className="h-5 w-5 inline mr-2" />
              Manage Members
            </button>
            <button className="btn-secondary text-left p-4 rounded-lg">
              <Calendar className="h-5 w-5 inline mr-2" />
              Schedule Meeting
            </button>
          </>
        )}
        {user.role === 'member' && (
          <>
            <button className="btn-primary text-left p-4 rounded-lg">
              <DollarSign className="h-5 w-5 inline mr-2" />
              View Savings
            </button>
            <button className="btn-secondary text-left p-4 rounded-lg">
              <Calendar className="h-5 w-5 inline mr-2" />
              Upcoming Meetings
            </button>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <WelcomeSection />
        
        {/* Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={Building}
            title="Total Cooperatives"
            value={stats.cooperatives.total}
            subtitle={`${stats.cooperatives.approved} approved`}
            color="blue"
          />
          <StatCard
            icon={Clock}
            title="Pending Approval"
            value={stats.cooperatives.pending}
            subtitle="Awaiting review"
            color="yellow"
          />
          <StatCard
            icon={CheckCircle}
            title="Approved"
            value={stats.cooperatives.approved}
            subtitle="Active cooperatives"
            color="green"
          />
          <StatCard
            icon={Users}
            title="Total Members"
            value={stats.members.total}
            subtitle={`${stats.members.active} active`}
            color="blue"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <QuickActions />
          
          {/* Recent Activities */}
          <div className="bg-white p-6 rounded-lg card-shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activities</h3>
            <div className="space-y-4">
              <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                <div>
                  <p className="text-sm font-medium">New cooperative registered</p>
                  <p className="text-xs text-gray-600">2 hours ago</p>
                </div>
              </div>
              <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                <Calendar className="h-5 w-5 text-blue-500 mr-3" />
                <div>
                  <p className="text-sm font-medium">Meeting scheduled</p>
                  <p className="text-xs text-gray-600">1 day ago</p>
                </div>
              </div>
              <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                <Users className="h-5 w-5 text-green-500 mr-3" />
                <div>
                  <p className="text-sm font-medium">New member added</p>
                  <p className="text-xs text-gray-600">3 days ago</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;