
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { RegistrationRecord } from '../types';

interface AdminDashboardProps {
  records: RegistrationRecord[];
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ records }) => {
  const stats = {
    total: records.length,
    eligible: records.filter(r => r.eligibility.isEligible && !r.eligibility.needsHumanReview).length,
    review: records.filter(r => r.eligibility.needsHumanReview).length,
    rejected: records.filter(r => !r.eligibility.isEligible).length,
  };

  const chartData = [
    { name: 'Eligible', count: stats.eligible },
    { name: 'Review Required', count: stats.review },
    { name: 'Rejected', count: stats.rejected },
  ];

  const COLORS = ['#10b981', '#f59e0b', '#ef4444'];

  const nationalityData = records.reduce((acc: any[], r) => {
    const existing = acc.find(item => item.name === r.basic.nationality);
    if (existing) existing.value++;
    else acc.push({ name: r.basic.nationality, value: 1 });
    return acc;
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Total Applicants</p>
          <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Eligible (Auto)</p>
          <p className="text-3xl font-bold text-emerald-600">{stats.eligible}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Flagged for Review</p>
          <p className="text-3xl font-bold text-amber-500">{stats.review}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Rejected</p>
          <p className="text-3xl font-bold text-rose-500">{stats.rejected}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4">Application Status</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4">Nationality Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={nationalityData}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {nationalityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={['#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4'][index % 4]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-lg font-semibold">Trainee Database</h3>
          <button 
            className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded transition-colors"
            onClick={() => alert("Simulating CSV export...")}
          >
            Export to Excel
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-500 text-sm uppercase">
              <tr>
                <th className="px-6 py-3 font-medium">Name</th>
                <th className="px-6 py-3 font-medium">ID Type</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Review Flags</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {records.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{record.basic.fullName}</div>
                    <div className="text-xs text-gray-400">{record.id}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{record.basic.idType}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      record.eligibility.isEligible 
                        ? (record.eligibility.needsHumanReview ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700')
                        : 'bg-rose-100 text-rose-700'
                    }`}>
                      {record.eligibility.isEligible ? (record.eligibility.needsHumanReview ? 'Flagged' : 'Eligible') : 'Rejected'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-500">
                    {record.eligibility.reason.length > 0 ? record.eligibility.reason.join(', ') : 'None'}
                  </td>
                </tr>
              ))}
              {records.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-gray-400 italic">No records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
