import React from 'react';

interface InvoicePrintoutProps {
  bill: {
    invoice_no?: string;
    created_at?: string;
    customer_name: string;
    customer_phone?: string;
    customer_email?: string;
    customer_gst?: string;
    customer_address?: string;
    customer_state?: string;
    subtotal: number;
    total: number;
    username?: string;
    total_discount?: number;
  };
  items: Array<{
    name: string;
    sku?: string;
    qty: number;
    price: number;
    mrp?: number;
    gst: number;
    discount?: number;
  }>;
}

const numberToWords = (num: number): string => {
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const inWords = (n: number): string => {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
    if (n < 1000) return a[Math.floor(n / 100)] + 'Hundred ' + (n % 100 !== 0 ? 'and ' + inWords(n % 100) : '');
    if (n < 100000) return inWords(Math.floor(n / 1000)) + 'Thousand ' + (n % 1000 !== 0 ? inWords(n % 1000) : '');
    if (n < 10000000) return inWords(Math.floor(n / 100000)) + 'Lakh ' + (n % 100000 !== 0 ? inWords(n % 100000) : '');
    return inWords(Math.floor(n / 10000000)) + 'Crore ' + (n % 10000000 !== 0 ? inWords(n % 10000000) : '');
  };

  const whole = Math.floor(num);
  const fraction = Math.round((num - whole) * 100);
  
  let res = inWords(whole) + 'Rupees ';
  if (fraction > 0) {
    res += 'and ' + inWords(fraction) + 'Paise ';
  }
  return res + 'Only';
};

export default function InvoicePrintout({ bill, items }: InvoicePrintoutProps) {
  const cgst = (bill.total - bill.subtotal) / 2;
  const sgst = (bill.total - bill.subtotal) / 2;

  const totalQuantity = items.reduce((sum, item) => sum + Number(item.qty || 0), 0);
  const totalUniqueItems = items.length;
  const grandTotalInWords = numberToWords(bill.total);

  return (
    <div id="invoice-print" className="hidden print:block bg-white text-black p-10 font-sans w-[210mm] mx-auto">
      {/* Container is managed by global index.css for print centering */}

      {/* Header */}
      <div className="flex justify-between items-start mb-10 border-b-4 border-black pb-8">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter mb-2">Invento Pro</h1>
        </div>
        <div className="text-right">
          <h2 className="text-4xl font-black text-black">TAX INVOICE</h2>
          <p className="text-sm font-bold uppercase tracking-widest mt-2">Invoice No: {bill.invoice_no}</p>
          <p className="text-sm font-bold uppercase tracking-widest">Date: {new Date(bill.created_at || new Date()).toLocaleDateString('en-GB')}</p>
        </div>
      </div>

      {/* Bill Info */}
      <div className="grid grid-cols-2 gap-12 mb-10">
        <div>
          <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">To,</h3>
          <p className="text-xl font-black uppercase">{bill.customer_name}</p>
          <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{bill.customer_address || 'Walk-in Customer'}</p>
          <p className="text-sm font-bold mt-2">GSTIN: {bill.customer_gst || 'Not Provided'}</p>
          <p className="text-sm mt-1">State: {bill.customer_state || 'Local'}</p>
        </div>
      </div>

      {/* Table */}
      <table className="w-full border-collapse mb-10 border-2 border-black">
        <thead>
          <tr className="bg-black text-white">
            <th className="border border-black px-4 py-3 text-left text-[10px] font-black uppercase w-8">S.No.</th>
            <th className="border border-black px-4 py-3 text-left text-[10px] font-black uppercase">Description</th>
            <th className="border border-black px-4 py-3 text-center text-[10px] font-black uppercase">SKU-Code</th>
            <th className="border border-black px-4 py-3 text-center text-[10px] font-black uppercase">Qty</th>
            <th className="border border-black px-4 py-3 text-right text-[10px] font-black uppercase">Rate</th>
            <th className="border border-black px-4 py-3 text-right text-[10px] font-black uppercase">Disc%</th>
            <th className="border border-black px-4 py-3 text-right text-[10px] font-black uppercase">Amount</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => {
            const itemGross = Number(item.qty || 0) * (item.mrp || item.price || 0);
            const discountAmount = (itemGross * Number(item.discount || 0)) / 100;
            const netAmount = itemGross - discountAmount;
            
            return (
              <tr key={idx} className="border-b border-gray-100 min-h-[40px]">
                <td className="border border-black px-4 py-2 text-sm text-center font-bold">{idx + 1}</td>
                <td className="border border-black px-4 py-2 text-sm font-black uppercase">{item.name}</td>
                <td className="border border-black px-4 py-2 text-center text-sm font-mono">{item.sku || '—'}</td>
                <td className="border border-black px-4 py-2 text-center text-sm font-bold">{item.qty}</td>
                <td className="border border-black px-4 py-2 text-right text-sm">₹{(item.mrp || item.price || 0).toFixed(2)}</td>
                <td className="border border-black px-4 py-2 text-right text-sm">{item.discount || 0}%</td>
                <td className="border border-black px-4 py-2 text-right text-sm font-bold">₹{netAmount.toFixed(2)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Bottom Layout */}
      <div className="flex justify-between items-start">
        <div className="w-1/2 space-y-4">
          <div className="bg-gray-50 p-4 border-2 border-dashed border-gray-200 rounded-lg">
            <div className="grid grid-cols-2 gap-4">
               <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total Products</p>
                  <p className="text-xl font-black">{totalUniqueItems}</p>
               </div>
               <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total Quantity</p>
                  <p className="text-xl font-black">{totalQuantity} Units</p>
               </div>
            </div>
          </div>
          
          {bill.username && (
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">
              Billed By: <span className="text-black font-black">{bill.username}</span>
            </p>
          )}
          <p className="text-[10px] font-bold text-black uppercase tracking-tighter mt-4">Rupees: <span className="font-black italic">{grandTotalInWords}</span></p>
          <div className="mt-8 pt-10 border-t border-gray-100">
            <p className="text-[10px] font-bold uppercase italic tracking-tighter">Authorized Signatory</p>
          </div>
        </div>
        <div className="w-1/3 space-y-2 border-t-2 border-black pt-4">
          <div className="flex justify-between text-sm font-black">
            <span className="uppercase tracking-tight">Total (Taxable)</span>
            <span>₹{bill.subtotal.toFixed(2)}</span>
          </div>
          {bill.total_discount && bill.total_discount > 0 ? (
            <div className="flex justify-between text-xs font-bold text-destructive italic">
              <span className="uppercase tracking-tight">Total Discount</span>
              <span>-₹{bill.total_discount.toFixed(2)}</span>
            </div>
          ) : null}
          <div className="flex justify-between text-xs font-bold text-gray-600">
            <span>Add: CGST @ {(items[0]?.gst || 18) / 2}%</span>
            <span>₹{cgst.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xs font-bold text-gray-600">
            <span>Add: SGST @ {(items[0]?.gst || 18) / 2}%</span>
            <span>₹{sgst.toFixed(2)}</span>
          </div>
          <div className="border-t-4 border-black pt-2 flex justify-between items-end">
            <span className="text-lg font-black uppercase">Grand Total</span>
            <span className="text-2xl font-black">₹{bill.total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="mt-20 border-t border-gray-100 pt-8 text-center">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Thank you for your business</p>
      </div>
    </div>
  );
}
