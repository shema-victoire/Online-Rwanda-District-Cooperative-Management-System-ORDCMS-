import React from 'react';
import Navigation from './Navigation';
import { DollarSign, TrendingUp, PieChart } from 'lucide-react';

const FinancialReporting = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <DollarSign className="h-8 w-8 mr-3 text-rwanda-blue" />
              Financial Reporting
            </h1>
            <p className="text-gray-600 mt-2">
              Track savings, transactions, and generate financial reports
            </p>
          </div>
        </div>

        <div className="bg-white p-8 rounded-lg card-shadow text-center">
          <TrendingUp className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Financial Reporting Coming Soon
          </h3>
          <p className="text-gray-600">
            This feature will provide comprehensive financial tracking and reporting tools.
          </p>
        </div>
      </div>
    </div>
  );
};

export default FinancialReporting;