import React, { useState } from 'react';
import { Table, Download, Calendar, Search, FileText, ArrowRight } from 'lucide-react';
import { Order } from '@/src/types';
import { cn, formatCurrency } from '@/src/lib/utils';

interface ReportsProps {
  orders: Order[];
}

export default function Reports({ orders }: ReportsProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('id-ID', { 
      day: '2-digit', 
      month: 'short', 
      hour: '2-digit', 
      minute: '2-digit' 
    }).format(date);
  };

  const filteredOrders = orders.filter(order => 
    order.items.some(item => item.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    order.id.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const exportToCSV = () => {
    const headers = ['id', 'nama', 'harga', 'jumlah', 'pembayaran'];
    const rows = filteredOrders.flatMap(order => 
      order.items.map(item => [
        order.id.slice(-6).toUpperCase(),
        item.name,
        item.price,
        item.quantity,
        order.paymentMethod.toUpperCase()
      ])
    );

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `rekap_penjualan_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-coffee-dark uppercase tracking-[0.2em]">Rekap Penjualan</h2>
          <p className="text-xs text-coffee-muted font-serif italic mt-1">Data transaksi lengkap dalam format spreadsheet</p>
        </div>
        <div className="flex flex-col xs:flex-row gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-coffee-muted" />
            <input 
              type="text" 
              placeholder="Cari item atau ID..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white border border-coffee-border rounded-xl text-xs focus:ring-2 focus:ring-coffee-dark outline-none w-full sm:w-64"
            />
          </div>
          <button 
            onClick={exportToCSV}
            className="flex items-center justify-center gap-2 bg-coffee-dark text-white px-5 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-coffee-medium transition-all shadow-sm shrink-0"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Stats Summary Area */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-coffee-border p-5 rounded-2xl flex items-center gap-4">
          <div className="w-10 h-10 bg-coffee-sub rounded-xl flex items-center justify-center text-coffee-dark">
            <Table className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-coffee-muted uppercase tracking-widest leading-none">Total Transaksi</p>
            <p className="text-xl font-bold text-coffee-dark mt-1">{filteredOrders.length}</p>
          </div>
        </div>
        <div className="bg-white border border-coffee-border p-5 rounded-2xl flex items-center gap-4">
          <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-green-600">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-coffee-muted uppercase tracking-widest leading-none">Total Omzet Recap</p>
            <p className="text-xl font-bold text-coffee-dark mt-1">
              {formatCurrency(filteredOrders.reduce((acc, curr) => acc + curr.total, 0))}
            </p>
          </div>
        </div>
      </div>

      {/* Spreadsheet View */}
      <div className="bg-white border border-coffee-border rounded-2xl shadow-sm overflow-hidden flex-1 flex flex-col">
        <div className="overflow-auto flex-1 smooth-scroll">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="sticky top-0 z-10 bg-coffee-neutral border-b border-coffee-border">
              <tr>
                <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest text-coffee-muted">ID Order</th>
                <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest text-coffee-muted">Waktu</th>
                <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest text-coffee-muted">Item Terjual</th>
                <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest text-coffee-muted">Payment</th>
                <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest text-coffee-muted text-right">Total Akhir</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-coffee-neutral">
              {filteredOrders.map(order => (
                <tr key={order.id} className="hover:bg-coffee-sub/30 transition-colors">
                  <td className="px-6 py-4 font-mono text-[10px] text-coffee-medium">#{order.id.slice(-6).toUpperCase()}</td>
                  <td className="px-6 py-4 text-xs font-medium text-coffee-dark">{formatDate(order.createdAt)}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between gap-4">
                          <span className="text-xs text-coffee-dark">{item.name} <span className="text-coffee-muted font-bold">x{item.quantity}</span></span>
                          <span className="text-[10px] text-coffee-muted">{formatCurrency(item.price * item.quantity)}</span>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[9px] font-bold uppercase",
                      order.paymentMethod === 'qris' ? "bg-blue-50 text-blue-600" : "bg-green-50 text-green-600"
                    )}>
                      {order.paymentMethod}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-sm font-bold text-coffee-dark">{formatCurrency(order.total)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredOrders.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-4 opacity-40">
            <Calendar className="w-12 h-12" />
            <p className="text-xs font-serif italic">Data tidak ditemukan</p>
          </div>
        )}
      </div>
    </div>
  );
}
