import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../App';
import { 
  Home, 
  Building, 
  Users, 
  DollarSign, 
  Calendar, 
  LogOut, 
  Menu, 
  X,
  User
} from 'lucide-react';

const Navigation = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigationItems = [
    { name: 'Dashboard', href: '/dashboard', icon: Home, roles: ['district_official', 'cooperative_leader', 'member'] },
    { name: 'Cooperatives', href: '/cooperatives', icon: Building, roles: ['district_official', 'cooperative_leader'] },
    { name: 'Members', href: '/members', icon: Users, roles: ['district_official', 'cooperative_leader'] },
    { name: 'Financial', href: '/financial', icon: DollarSign, roles: ['district_official', 'cooperative_leader', 'member'] },
    { name: 'Meetings', href: '/meetings', icon: Calendar, roles: ['district_official', 'cooperative_leader', 'member'] },
  ];

  const filteredNavItems = navigationItems.filter(item => 
    item.roles.includes(user.role)
  );

  const isActive = (href) => location.pathname === href;

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and brand */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <h1 className="text-xl font-bold text-rwanda-blue">
                Rwanda Cooperative System
              </h1>
            </div>
          </div>

          {/* Desktop navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? 'bg-rwanda-blue text-white'
                      : 'text-gray-600 hover:text-rwanda-blue hover:bg-blue-50'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {item.name}
                </Link>
              );
            })}
          </div>

          {/* User menu */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="flex items-center text-sm text-gray-600">
              <User className="h-4 w-4 mr-1" />
              <span>{user.full_name}</span>
              <span className="ml-2 px-2 py-1 bg-gray-100 rounded-full text-xs">
                {user.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </span>
            </div>
            <button
              onClick={logout}
              className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-red-600 hover:text-red-800 hover:bg-red-50 transition-colors"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-rwanda-blue hover:bg-gray-100"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-gray-50">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-3 py-2 rounded-md text-base font-medium ${
                    isActive(item.href)
                      ? 'bg-rwanda-blue text-white'
                      : 'text-gray-600 hover:text-rwanda-blue hover:bg-blue-50'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Icon className="h-5 w-5 mr-3" />
                  {item.name}
                </Link>
              );
            })}
            
            {/* Mobile user info and logout */}
            <div className="border-t border-gray-200 pt-4 mt-4">
              <div className="flex items-center px-3 py-2">
                <User className="h-5 w-5 mr-3 text-gray-600" />
                <div>
                  <div className="text-base font-medium text-gray-800">{user.full_name}</div>
                  <div className="text-sm text-gray-600">
                    {user.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  logout();
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center w-full px-3 py-2 rounded-md text-base font-medium text-red-600 hover:text-red-800 hover:bg-red-50"
              >
                <LogOut className="h-5 w-5 mr-3" />
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;