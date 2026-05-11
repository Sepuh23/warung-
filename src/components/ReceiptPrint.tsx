import React from 'react';
import QRCode from 'react-qr-code';
import Barcode from 'react-barcode';
import { formatCurrency } from '@/src/lib/utils';
import { OrderItem } from '@/src/types';

interface ReceiptPrintProps {
  order: {
    id: string;
    items: OrderItem[];
    subTotal: number;
    taxAmount: number;
    discountAmount: number;
    total: number;
    cashReceived?: number;
    change?: number;
    paymentMethod: string;
    date: Date;
  };
  shopName: string;
  address?: string;
  phone?: string;
  cashierName?: string;
}

export const ReceiptPrint = React.forwardRef<HTMLDivElement, ReceiptPrintProps>(({
  order,
  shopName,
  address = "Jl. Sudirman No 123, Jakarta",
  phone = "+62 812 3456 7890",
  cashierName = "Kasir Utama"
}, ref) => {
  return (
    <div ref={ref} className="receipt-print px-4 py-6 bg-white shrink-0" style={{ width: '58mm', fontFamily: 'monospace', color: '#000', fontSize: '11px', lineHeight: '1.2' }}>
      <div className="text-center mb-4">
        <h2 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0' }}>{shopName.toUpperCase()}</h2>
        <p style={{ margin: '4px 0' }}>{address}</p>
        <p style={{ margin: '4px 0' }}>WA: {phone}</p>
      </div>

      <div style={{ borderTop: '1px dashed #000', margin: '8px 0' }} />
      
      <div style={{ marginBottom: '8px' }}>
        <p style={{ margin: '2px 0' }}>No: {order.id}</p>
        <p style={{ margin: '2px 0' }}>Tgl: {order.date.toLocaleString('id-ID')}</p>
        <p style={{ margin: '2px 0' }}>Ksr: {cashierName}</p>
        <p style={{ margin: '2px 0' }}>Metode: {order.paymentMethod.toUpperCase()}</p>
      </div>

      <div style={{ borderTop: '1px dashed #000', margin: '8px 0' }} />

      <div style={{ marginBottom: '8px' }}>
        {order.items.map((item, idx) => (
          <div key={idx} style={{ marginBottom: '4px' }}>
            <div style={{ fontWeight: 'bold' }}>{item.name}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>{item.quantity} x {formatCurrency(item.price).replace('Rp', '').trim()}</span>
              <span>{formatCurrency(item.price * item.quantity).replace('Rp', '').trim()}</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ borderTop: '1px dashed #000', margin: '8px 0' }} />

      <div style={{ marginBottom: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 0' }}>
          <span>Subtotal</span>
          <span>{formatCurrency(order.subTotal).replace('Rp', '').trim()}</span>
        </div>
        {order.taxAmount > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 0' }}>
            <span>Pajak</span>
            <span>+{formatCurrency(order.taxAmount).replace('Rp', '').trim()}</span>
          </div>
        )}
        {order.discountAmount > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 0' }}>
            <span>Diskon</span>
            <span>-{formatCurrency(order.discountAmount).replace('Rp', '').trim()}</span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 0', fontSize: '14px', fontWeight: 'bold' }}>
          <span>TOTAL</span>
          <span>{formatCurrency(order.total).replace('Rp', '').trim()}</span>
        </div>
        
        {order.paymentMethod === 'cash' && order.cashReceived !== undefined && (
          <>
            <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 0' }}>
              <span>Tunai</span>
              <span>{formatCurrency(order.cashReceived).replace('Rp', '').trim()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 0', fontWeight: 'bold' }}>
              <span>Kembalian</span>
              <span>{formatCurrency(order.change || 0).replace('Rp', '').trim()}</span>
            </div>
          </>
        )}
      </div>

      <div style={{ borderTop: '1px dashed #000', margin: '8px 0' }} />

      {/* Barcode & QR Code */}
      <div className="flex flex-col items-center justify-center my-6 gap-4">
        <Barcode value={order.id} width={1.2} height={40} fontSize={10} displayValue={true} background="transparent" />
        <div className="p-2 bg-white rounded-lg">
          <QRCode value={`https://warungplus.com/receipt/${order.id}`} size={80} level="L" />
        </div>
      </div>

      <div className="text-center" style={{ marginTop: '16px' }}>
        <p style={{ margin: '2px 0', fontWeight: 'bold' }}>Terima kasih telah berbelanja ❤️</p>
        <p style={{ margin: '2px 0', fontSize: '9px', opacity: 0.8 }}>Simpan struk sebagai alat bukti</p>
        <p style={{ margin: '6px 0 0 0', fontSize: '8px' }}>POWERED BY WARUNG+</p>
      </div>
    </div>
  );
});

ReceiptPrint.displayName = 'ReceiptPrint';
