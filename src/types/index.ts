export interface ShopInfo {
  name: string;
  ownerName: string;
  activeCashier: string;
  branchName: string;
  healthScore: number;
}

export interface SalesData {
  revenue: number;
  profit: number;
  transactions: number;
  itemsSold: number;
  topSellingToday: string;
  slowestMenuToday: string;
  avgOrderValue: number;
  yesterdayRevenue: number;
  revenueChange: number;
  profitChange: number;
  weeklySales: { day: string; revenue: number }[];
  bestDayThisWeek: string;
  cashRevenue: number;
  qrisRevenue: number;
  transferRevenue: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  stock: number;
  unit: string;
  status: 'in_stock' | 'low' | 'out_of_stock';
  threshold: number;
}

export interface CustomerMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: Date;
  role: 'customer' | 'shop';
}

export interface CustomerChat {
  id: string;
  customerName: string;
  lastMessage: string;
  lastTimestamp: Date;
  unreadCount: number;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  costPrice?: number;
  category: string;
  imageUrl?: string;
  description?: string;
  available: boolean;
  stock?: number;
  stockStatus?: 'in_stock' | 'low' | 'out_of_stock';
  badge?: 'Best Seller' | 'Promo' | 'Baru' | 'none';
}

export interface OrderItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  items: OrderItem[];
  total: number;
  paymentMethod: 'cash' | 'qris';
  createdAt: Date;
  status: 'completed' | 'cancelled';
}

export interface QueueItem {
  id: string;
  queueNumber: string;
  customerName: string;
  status: 'waiting' | 'processing' | 'ready' | 'completed';
  orderId?: string;
  createdAt: Date;
  readyAt?: Date;
}

export interface WaiterCall {
  id: string;
  tableNumber: string;
  status: 'pending' | 'resolved';
  createdAt: Date;
}

export interface CustomerOrder {
  id: string;
  customerName: string;
  contactInfo: string;
  tableNumber: string;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'confirmed' | 'processing' | 'ready' | 'completed' | 'rejected';
  paymentMethod: 'cash' | 'qris' | 'e-wallet';
  paymentStatus: 'pending' | 'paid';
  createdAt: Date;
  updatedAt: Date;
  queueNumber?: string;
  note?: string;
}
