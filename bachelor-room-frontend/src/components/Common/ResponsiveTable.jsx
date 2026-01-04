import React from 'react';

const ResponsiveTable = ({ headers, data, renderRow, emptyMessage = "No data found" }) => {
  if (!data || data.length === 0) {
    return (
      <div className="card">
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-gray-600">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="table-responsive">
      <table className="table">
        <thead>
          <tr>
            {headers.map((header, index) => (
              <th key={index} className="whitespace-nowrap">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {data.map((item, index) => renderRow(item, index))}
        </tbody>
      </table>
    </div>
  );
};

// Mobile Card View for tables
export const MobileCardView = ({ data, renderCard, emptyMessage = "No data found" }) => {
  if (!data || data.length === 0) {
    return (
      <div className="card">
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-gray-600">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 lg:hidden">
      {data.map((item, index) => (
        <div key={index} className="card">
          {renderCard(item, index)}
        </div>
      ))}
    </div>
  );
};

export default ResponsiveTable;