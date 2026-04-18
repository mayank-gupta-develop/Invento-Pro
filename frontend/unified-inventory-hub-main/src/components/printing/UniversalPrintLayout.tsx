import React from 'react';

interface Column {
  header: string;
  key: string;
  align?: 'left' | 'right' | 'center';
  render?: (val: any, row: any, idx: number) => React.ReactNode;
}

interface UniversalPrintLayoutProps {
  id: string;
  title: string;
  subtitle?: string;
  columns: Column[];
  data: any[];
  summaryRow?: React.ReactNode;
}

export default function UniversalPrintLayout({ id, title, subtitle, columns, data, summaryRow }: UniversalPrintLayoutProps) {
  return (
    <div id={id} className="hidden print:block bg-white text-black p-10 font-sans w-[210mm] mx-auto">
      {/* Container is managed by global index.css for print centering */}

      {/* Header */}
      <div className="border-b-4 border-black pb-6 mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter">{title}</h1>
          {subtitle && <p className="text-sm font-bold text-gray-500 mt-2">{subtitle}</p>}
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Invento Pro — Business Intelligence</p>
          <p className="text-[10px] font-bold text-gray-400">Run at: {new Date().toLocaleString()}</p>
        </div>
      </div>

      {/* Table */}
      <table className="w-full border-collapse border-2 border-black">
        <thead>
          <tr className="bg-black text-white">
            {columns.map((col, idx) => (
              <th 
                key={idx} 
                className={`border border-black px-4 py-3 text-[10px] font-black uppercase tracking-widest ${
                  col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                }`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIdx) => (
            <tr key={rowIdx} className="border-b border-gray-100">
              {columns.map((col, colIdx) => (
                <td 
                  key={colIdx} 
                  className={`border border-black px-4 py-3 text-sm ${
                    col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                  }`}
                >
                  {col.render ? col.render(row[col.key], row, rowIdx) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
          {summaryRow && (
            <tr className="bg-gray-100 font-black">
              {summaryRow}
            </tr>
          )}
        </tbody>
      </table>

      {/* Footer */}
      <div className="mt-10 pt-4 border-t-2 border-gray-100 text-center">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest italic">
          * This report is a true reflection of the database records at the time of generation.
        </p>
      </div>
    </div>
  );
}
