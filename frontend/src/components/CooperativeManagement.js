import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import Navigation from './Navigation';
import { 
  Building, 
  Plus, 
  Search, 
  Filter, 
  Check, 
  X, 
  Eye,
  MapPin,
  Users,
  Calendar
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const CooperativeManagement = () => {
  const { user } = useAuth();
  const [cooperatives, setCooperatives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCooperative, setSelectedCooperative] = useState(null);
  
  const [newCooperative, setNewCooperative] = useState({
    name: '',
    description: '',
    district: user.district || '',
    sector: '',
    cell: '',
    village: '',
    leader_id: user.id
  });

  useEffect(() => {
    fetchCooperatives();
  }, []);

  const fetchCooperatives = async () => {
    try {
      const response = await axios.get('/api/cooperatives');
      setCooperatives(response.data);
    } catch (error) {
      toast.error('Failed to fetch cooperatives');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCooperative = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/api/cooperatives', newCooperative);
      setCooperatives([...cooperatives, response.data]);
      setShowCreateForm(false);
      setNewCooperative({
        name: '',
        description: '',
        district: user.district || '',
        sector: '',
        cell: '',
        village: '',
        leader_id: user.id
      });
      toast.success('Cooperative created successfully!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create cooperative');
    }
  };

  const handleApproveCooperative = async (cooperativeId) => {
    try {
      const response = await axios.put(`/api/cooperatives/${cooperativeId}/approve`);
      setCooperatives(cooperatives.map(coop => 
        coop.id === cooperativeId 
          ? { ...coop, status: 'approved', registration_number: response.data.registration_number }
          : coop
      ));
      toast.success('Cooperative approved successfully!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to approve cooperative');
    }
  };

  const filteredCooperatives = cooperatives.filter(coop => {
    const matchesSearch = coop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         coop.district.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === '' || coop.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    const badges = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'approved': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const CooperativeCard = ({ cooperative }) => (
    <div className="bg-white p-6 rounded-lg card-shadow hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{cooperative.name}</h3>
          {cooperative.registration_number && (
            <p className="text-sm text-gray-600">Reg: {cooperative.registration_number}</p>
          )}
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(cooperative.status)}`}>
          {cooperative.status.toUpperCase()}
        </span>
      </div>
      
      <p className="text-gray-600 mb-4 line-clamp-2">{cooperative.description}</p>
      
      <div className="space-y-2 mb-4">
        <div className="flex items-center text-sm text-gray-600">
          <MapPin className="h-4 w-4 mr-2" />
          {cooperative.district}, {cooperative.sector}
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <Users className="h-4 w-4 mr-2" />
          {cooperative.members_count} members
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <Calendar className="h-4 w-4 mr-2" />
          Created: {new Date(cooperative.created_at).toLocaleDateString()}
        </div>
      </div>
      
      <div className="flex gap-2">
        <button
          onClick={() => setSelectedCooperative(cooperative)}
          className="flex items-center px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
        >
          <Eye className="h-4 w-4 mr-1" />
          View
        </button>
        
        {user.role === 'district_official' && cooperative.status === 'pending' && (
          <button
            onClick={() => handleApproveCooperative(cooperative.id)}
            className="flex items-center px-3 py-2 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200"
          >
            <Check className="h-4 w-4 mr-1" />
            Approve
          </button>
        )}
      </div>
    </div>
  );

  const CreateCooperativeForm = () => (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Create New Cooperative</h3>
          <button
            onClick={() => setShowCreateForm(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <form onSubmit={handleCreateCooperative} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cooperative Name
            </label>
            <input
              type="text"
              required
              className="input-field"
              value={newCooperative.name}
              onChange={(e) => setNewCooperative({...newCooperative, name: e.target.value})}
              placeholder="Enter cooperative name"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              required
              rows={3}
              className="input-field"
              value={newCooperative.description}
              onChange={(e) => setNewCooperative({...newCooperative, description: e.target.value})}
              placeholder="Describe the cooperative's purpose"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                District
              </label>
              <input
                type="text"
                required
                className="input-field"
                value={newCooperative.district}
                onChange={(e) => setNewCooperative({...newCooperative, district: e.target.value})}
                placeholder="District"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sector
              </label>
              <input
                type="text"
                required
                className="input-field"
                value={newCooperative.sector}
                onChange={(e) => setNewCooperative({...newCooperative, sector: e.target.value})}
                placeholder="Sector"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cell
              </label>
              <input
                type="text"
                required
                className="input-field"
                value={newCooperative.cell}
                onChange={(e) => setNewCooperative({...newCooperative, cell: e.target.value})}
                placeholder="Cell"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Village
              </label>
              <input
                type="text"
                required
                className="input-field"
                value={newCooperative.village}
                onChange={(e) => setNewCooperative({...newCooperative, village: e.target.value})}
                placeholder="Village"
              />
            </div>
          </div>
          
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="flex-1 px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 btn-primary"
            >
              Create Cooperative
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rwanda-blue"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Building className="h-8 w-8 mr-3 text-rwanda-blue" />
              Cooperative Management
            </h1>
            <p className="text-gray-600 mt-2">
              {user.role === 'district_official' ? 'Manage and approve cooperatives in your district' : 'Manage your cooperative'}
            </p>
          </div>
          
          {(user.role === 'cooperative_leader' || user.role === 'district_official') && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="btn-primary"
            >
              <Plus className="h-5 w-5 mr-2" />
              Create Cooperative
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg card-shadow mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search cooperatives..."
                  className="pl-10 input-field"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="sm:w-48">
              <select
                className="input-field"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>

        {/* Cooperatives Grid */}
        {filteredCooperatives.length === 0 ? (
          <div className="text-center py-12">
            <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No cooperatives found</h3>
            <p className="text-gray-600">
              {cooperatives.length === 0 ? 'Start by creating your first cooperative' : 'Try adjusting your search filters'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCooperatives.map((cooperative) => (
              <CooperativeCard key={cooperative.id} cooperative={cooperative} />
            ))}
          </div>
        )}

        {/* Create Form Modal */}
        {showCreateForm && <CreateCooperativeForm />}

        {/* Cooperative Details Modal */}
        {selectedCooperative && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Cooperative Details</h3>
                <button
                  onClick={() => setSelectedCooperative(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-xl font-semibold">{selectedCooperative.name}</h4>
                  {selectedCooperative.registration_number && (
                    <p className="text-sm text-gray-600">Registration: {selectedCooperative.registration_number}</p>
                  )}
                </div>
                
                <div>
                  <h5 className="font-medium text-gray-900">Description</h5>
                  <p className="text-gray-600">{selectedCooperative.description}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h5 className="font-medium text-gray-900">Location</h5>
                    <p className="text-gray-600">
                      {selectedCooperative.district}, {selectedCooperative.sector}<br />
                      {selectedCooperative.cell}, {selectedCooperative.village}
                    </p>
                  </div>
                  <div>
                    <h5 className="font-medium text-gray-900">Status</h5>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(selectedCooperative.status)}`}>
                      {selectedCooperative.status.toUpperCase()}
                    </span>
                  </div>
                </div>
                
                <div>
                  <h5 className="font-medium text-gray-900">Statistics</h5>
                  <p className="text-gray-600">Members: {selectedCooperative.members_count}</p>
                  <p className="text-gray-600">Created: {new Date(selectedCooperative.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CooperativeManagement;