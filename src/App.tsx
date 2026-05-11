/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  BarChart3, 
  MessageSquare, 
  Box, 
  Settings, 
  Coffee, 
  LogOut,
  Bell,
  QrCode,
  Menu as MenuIcon,
  X,
  LogIn,
  ShoppingCart,
  UtensilsCrossed,
  Table,
  User as UserIcon,
  Accessibility,
  Sparkles,
  Sun,
  Moon,
  Zap,
  Volume2,
  Search,
  Command,
  LayoutDashboard,
  Users,
  Plus,
  Minus,
  Trash2,
  ChevronRight,
  CreditCard,
  Mic,
  Monitor,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  MousePointer2,
  DollarSign,
  ShoppingBag,
  CheckCircle2,
  Bot,
  Smartphone,
  MapPin,
  Store,
  Utensils
} from 'lucide-react';
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  query,
  orderBy,
  limit,
  addDoc,
  deleteDoc,
  updateDoc,
  Timestamp,
  serverTimestamp,
  increment
} from 'firebase/firestore';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  User 
} from 'firebase/auth';
import { db, auth, handleFirestoreError, OperationType } from '@/src/lib/firebase';
import { cn } from '@/src/lib/utils';
import { ShopInfo, SalesData, InventoryItem, Message, MenuItem, OrderItem, Order, CustomerChat as CustomerChatType, CustomerMessage, QueueItem, WaiterCall, CustomerOrder } from '@/src/types';
import { generateAIResponse, getAIInsight, getDashboardBriefing } from '@/src/services/geminiService';
import { VoiceAssistant } from '@/src/components/VoiceAssistant';

const Dashboard = React.lazy(() => import('@/src/components/Dashboard'));
const Chat = React.lazy(() => import('@/src/components/Chat'));
const POS = React.lazy(() => import('@/src/components/POS'));
const MenuManager = React.lazy(() => import('@/src/components/MenuManager'));
const Inventory = React.lazy(() => import('@/src/components/Inventory'));
const Reports = React.lazy(() => import('@/src/components/Reports'));
const CustomerChat = React.lazy(() => import('@/src/components/CustomerChat'));
const QueueManager = React.lazy(() => import('@/src/components/QueueManager'));
const DigitalMenu = React.lazy(() => import('@/src/components/DigitalMenu'));
const IncomingOrdersManager = React.lazy(() => import('@/src/components/IncomingOrdersManager'));

import AccessibilityWidget from '@/src/components/AccessibilityWidget';
import CommunicationAssistPanel from '@/src/components/CommunicationAssistPanel';

const MOCK_SHOP_ID = "main_shop_01";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'chat' | 'inventory' | 'pos' | 'menu' | 'reports' | 'customers' | 'settings' | 'queue' | 'incoming-orders'>('dashboard');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [showAIWelcome, setShowAIWelcome] = useState(true);
  const [aiWelcomeMessage, setAiWelcomeMessage] = useState("Menyiapkan analisa bisnismu...");
  const [customerLocation, setCustomerLocation] = useState<{lat: number, lon: number} | null>(null);
  const [weather, setWeather] = useState({
    condition: "Cerah",
    temp: 30,
    feelsLike: 32,
    humidity: 60
  });

  const [isHighContrast, setIsHighContrast] = useState(false);
  const [isLargeText, setIsLargeText] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [isHapticEnabled, setIsHapticEnabled] = useState(false);
  const [isTabletMode, setIsTabletMode] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  const speak = React.useCallback((text: string) => {
    if (!isVoiceEnabled) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'id-ID';
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }, [isVoiceEnabled]);

  const playVibrate = React.useCallback(() => {
    if (!isHapticEnabled) return;
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  }, [isHapticEnabled]);

  const [shop, setShop] = useState<ShopInfo | null>(null);
  const [sales, setSales] = useState<SalesData | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  
  // AI Welcome message and Insight logic
  useEffect(() => {
    if (user && sales && weather) {
      const fetchAIInsight = async () => {
        try {
          const insight = await getAIInsight({
            shop,
            sales,
            weather,
            inventory: inventory.filter(i => (i.stock || 0) < 5)
          });
          setAiWelcomeMessage(insight || "Ayo buat hari ini lebih produktif!");
        } catch (err) {
          setAiWelcomeMessage("Halo! Mari tingkatkan penjualan hari ini.");
        }
      };
      fetchAIInsight();
    }
  }, [user, sales, weather]);

  // Location and Weather logic
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        setCustomerLocation({ lat: latitude, lon: longitude });
        
        // Mock weather fetching based on time/random for now, or use a real API if needed.
        // For this applet, let's diversify the weather display.
        const hour = new Date().getHours();
        if (hour > 18 || hour < 5) {
          setWeather({ condition: "Malam Cerah", temp: 26, feelsLike: 27, humidity: 80 });
        } else if (Math.random() > 0.5) {
          setWeather({ condition: "Hujan Ringan", temp: 25, feelsLike: 26, humidity: 90 });
        }
      });
    }
  }, []);

  const [customerChats, setCustomerChats] = useState<CustomerChatType[]>([]);
  const [customerMessages, setCustomerMessages] = useState<CustomerMessage[]>([]);
  const [activeCustomerChatId, setActiveCustomerChatId] = useState<string | null>(null);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [waiterCalls, setWaiterCalls] = useState<WaiterCall[]>([]);
  const [customerOrders, setCustomerOrders] = useState<CustomerOrder[]>([]);
  const [activeCustomerOrderId, setActiveCustomerOrderId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('activeOrderId');
    return null;
  });
  const [aiEnabledChats, setAiEnabledChats] = useState<Record<string, boolean>>({});
  const [briefingScript, setBriefingScript] = useState<string | null>(null);
  const [hasBriefed, setHasBriefed] = useState(false);

  // 1. Auth Listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return unsub;
  }, []);

  // 2. Data Listeners (Only when authenticated)
  useEffect(() => {
    if (!user) {
      setShop(null);
      setSales(null);
      setInventory([]);
      setMessages([]);
      return;
    }

    const unsubShop = onSnapshot(doc(db, "shops", MOCK_SHOP_ID), (snapshot) => {
      if (snapshot.exists()) {
        setShop(snapshot.data() as ShopInfo);
      } else {
        initMockData();
      }
    }, (err) => {
      // Gracefully handle permission denied if shop doesn't exist yet and we're trying to read it
      if (err.code !== 'permission-denied') {
        setInitError(err.message);
        handleFirestoreError(err, OperationType.GET, `shops/${MOCK_SHOP_ID}`);
      }
    });

    const todayStr = new Date().toISOString().split('T')[0];
    const unsubSales = onSnapshot(doc(db, "shops", MOCK_SHOP_ID, "sales", todayStr), (snapshot) => {
      if (snapshot.exists()) {
        setSales(snapshot.data() as SalesData);
      } else {
        // If shop exists but sales for today doesn't, initialize it
        initTodaySales();
      }
    }, (err) => {
      setInitError(err.message);
      handleFirestoreError(err, OperationType.GET, `sales/${todayStr}`);
    });

    const unsubInv = onSnapshot(collection(db, "shops", MOCK_SHOP_ID, "inventory"), (snapshot) => {
      const items: InventoryItem[] = [];
      snapshot.forEach(doc => items.push({ id: doc.id, ...doc.data() } as InventoryItem));
      setInventory(items);
    }, (err) => {
      setInitError(err.message);
      handleFirestoreError(err, OperationType.GET, "inventory");
    });

    const unsubMenu = onSnapshot(collection(db, "shops", MOCK_SHOP_ID, "menu"), (snapshot) => {
      const items: MenuItem[] = [];
      snapshot.forEach(doc => items.push({ id: doc.id, ...doc.data() } as MenuItem));
      setMenu(items);
    }, (err) => {
      setInitError(err.message);
      handleFirestoreError(err, OperationType.GET, "menu");
    });

    const qMessages = query(collection(db, "users", user.uid, "messages"), orderBy("createdAt", "asc"));
    const unsubMessages = onSnapshot(qMessages, (snapshot) => {
      const msgs: Message[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        msgs.push({ 
          id: doc.id, 
          ...data, 
          timestamp: data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date() 
        } as any);
      });
      setMessages(msgs);
    }, (err) => handleFirestoreError(err, OperationType.GET, `users/${user.uid}/messages`));

    const qOrders = query(collection(db, "shops", MOCK_SHOP_ID, "orders"), orderBy("createdAt", "desc"));
    const unsubOrders = onSnapshot(qOrders, (snapshot) => {
      const ords: Order[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        ords.push({ 
          id: doc.id, 
          ...data, 
          createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date() 
        } as any);
      });
      setOrders(ords);
    }, (err) => handleFirestoreError(err, OperationType.GET, "orders"));

    const unsubCustChats = onSnapshot(collection(db, "shops", MOCK_SHOP_ID, "customer_chats"), (snapshot) => {
      const chats: CustomerChatType[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        chats.push({ 
          id: doc.id, 
          ...data, 
          lastTimestamp: data.lastTimestamp ? (data.lastTimestamp as Timestamp).toDate() : new Date() 
        } as any);
      });
      setCustomerChats(chats);
    }, (err) => handleFirestoreError(err, OperationType.GET, `shops/${MOCK_SHOP_ID}/customer_chats`));

    const unsubQueue = onSnapshot(query(collection(db, "shops", MOCK_SHOP_ID, "queue"), orderBy("createdAt", "asc")), (snapshot) => {
      const items: QueueItem[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        items.push({ 
          id: doc.id, 
          ...data, 
          createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date(),
          readyAt: data.readyAt ? (data.readyAt as Timestamp).toDate() : undefined
        } as any);
      });
      setQueue(items);
    }, (err) => handleFirestoreError(err, OperationType.GET, `shops/${MOCK_SHOP_ID}/queue`));

    const unsubWaiter = onSnapshot(query(collection(db, "shops", MOCK_SHOP_ID, "waiter_calls"), orderBy("createdAt", "desc")), (snapshot) => {
      let hasNewCall = false;
      snapshot.docChanges().forEach(change => {
        if (change.type === 'added') {
          const data = change.doc.data();
          if (data.status === 'pending' && user) hasNewCall = true;
        }
      });
      
      if (hasNewCall && user) {
        speak("Panggilan pelayan dari meja " + snapshot.docs[0].data().tableNumber);
      }

      const calls: WaiterCall[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        calls.push({ 
          id: doc.id, 
          ...data, 
          createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date() 
        } as any);
      });
      setWaiterCalls(calls);
    }, (err) => handleFirestoreError(err, OperationType.GET, `shops/${MOCK_SHOP_ID}/waiter_calls`));

    // 5. Customer Orders Subscription
    const unsubCustOrders = onSnapshot(query(collection(db, "shops", MOCK_SHOP_ID, "customer_orders"), orderBy("createdAt", "desc")), (snapshot) => {
      let hasNewOrder = false;
      snapshot.docChanges().forEach(change => {
        if (change.type === 'added') {
          const data = change.doc.data();
          // Only notify if it's a new pending order and we are the owner (user is logged in)
          if (data.status === 'pending') {
            hasNewOrder = true;
          }
        }
      });

      if (hasNewOrder && user) {
        speak("Ada pesanan baru masuk dari meja " + snapshot.docs[0].data().tableNumber);
      }

      const ords: CustomerOrder[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        ords.push({ 
          id: doc.id, 
          ...data, 
          createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date(),
          updatedAt: data.updatedAt ? (data.updatedAt as Timestamp).toDate() : new Date()
        } as any);
      });
      setCustomerOrders(ords);
    }, (err) => {
      // For guest users, this might throw permission denied for 'list' but specific doc read is allowed if we implement it.
      // However, we want the cashier to see ALL, and the guest to see THEIR own via activeCustomerOrderId filter in UI.
      if (err.code !== 'permission-denied') {
        handleFirestoreError(err, OperationType.GET, `shops/${MOCK_SHOP_ID}/customer_orders`);
      }
    });

    return () => {
      unsubShop();
      unsubSales();
      unsubInv();
      unsubMenu();
      unsubMessages();
      unsubOrders();
      unsubCustChats();
      unsubQueue();
      unsubWaiter();
      unsubCustOrders();
    };
  }, [user]);

  // Track specific order for guest users who don't have list permissions
  useEffect(() => {
    if (!activeCustomerOrderId || user) return;

    const unsub = onSnapshot(doc(db, "shops", MOCK_SHOP_ID, "customer_orders", activeCustomerOrderId), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        const order = { 
          id: snapshot.id, 
          ...data, 
          createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date(),
          updatedAt: data.updatedAt ? (data.updatedAt as Timestamp).toDate() : new Date()
        } as any;
        setCustomerOrders(prev => {
          const exists = prev.find(o => o.id === order.id);
          if (exists) return prev.map(o => o.id === order.id ? order : o);
          return [order];
        });
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, `customer_orders/${activeCustomerOrderId}`));

    return () => unsub();
  }, [activeCustomerOrderId, user]);

  useEffect(() => {
    if (!user || !activeCustomerChatId) {
      setCustomerMessages([]);
      return;
    }

    const qCustMsgs = query(
      collection(db, "shops", MOCK_SHOP_ID, "customer_chats", activeCustomerChatId, "messages"),
      orderBy("timestamp", "asc")
    );
    const unsubCustMsgs = onSnapshot(qCustMsgs, (snapshot) => {
      const msgs: CustomerMessage[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        msgs.push({ 
          id: doc.id, 
          ...data, 
          timestamp: data.timestamp ? (data.timestamp as Timestamp).toDate() : new Date() 
        } as any);
      });
      setCustomerMessages(msgs);
    }, (err) => handleFirestoreError(err, OperationType.GET, `shops/${MOCK_SHOP_ID}/customer_chats/${activeCustomerChatId}/messages`));

    return () => unsubCustMsgs();
  }, [user, activeCustomerChatId]);

  // 5. Generate Dashboard Briefing
  useEffect(() => {
    if (activeTab === 'dashboard' && user && shop && sales && inventory.length > 0 && !hasBriefed) {
      const generateBriefing = async () => {
        try {
          const lowStock = inventory.filter(i => i.stock <= i.threshold).map(i => i.name);
          const topProduct = sales.topSellingToday || "Kopi Susu Aren";
          const trend = (sales.revenue > 2000000) ? 'up' : 'stable';
          
          const script = await getDashboardBriefing({
            userName: user.displayName || user.email?.split('@')[0] || "Owner",
            totalRevenue: sales.revenue,
            totalProfit: sales.profit,
            topProduct: topProduct,
            transactionCount: sales.transactions,
            weather: weather.condition,
            lowStockItems: lowStock,
            salesTrend: trend as 'up' | 'stable'
          });
          
          setBriefingScript(script);
          setHasBriefed(true);
        } catch (err) {
          console.error("Failed to generate briefing:", err);
        }
      };
      
      generateBriefing();
    }
  }, [activeTab, user, shop, sales, inventory, weather, hasBriefed]);

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        console.warn("Login popup was closed by user");
        return;
      }
      console.error("Login failed:", err);
    }
  };

  const handleLogout = () => signOut(auth);

  const initTodaySales = async () => {
    const todayStr = new Date().toISOString().split('T')[0];
    try {
      await setDoc(doc(db, "shops", MOCK_SHOP_ID, "sales", todayStr), {
        revenue: 0,
        profit: 0,
        transactions: 0,
        itemsSold: 0,
        topSellingToday: "-",
        slowestMenuToday: "-",
        avgOrderValue: 0,
        yesterdayRevenue: 0,
        revenueChange: 0,
        profitChange: 0,
        bestDayThisWeek: "-",
        cashRevenue: 0,
        qrisRevenue: 0,
        transferRevenue: 0,
        date: todayStr,
        weeklySales: []
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `sales/${todayStr}/init`);
    }
  };

  const initMockData = async () => {
    const todayStr = new Date().toISOString().split('T')[0];
    try {
      await setDoc(doc(db, "shops", MOCK_SHOP_ID), {
        name: "Kopi Sini",
        ownerName: "Budi",
        activeCashier: "Sarah",
        branchName: "Menteng",
        healthScore: 82,
        scoreTrend: "UP"
      });

      await initTodaySales();
      
      // Update with some mock data for today if we want it to look populated on first run
      await updateDoc(doc(db, "shops", MOCK_SHOP_ID, "sales", todayStr), {
        revenue: 1450500,
        profit: 520000,
        transactions: 52,
        itemsSold: 86,
        topSellingToday: "Kopi Susu Aren",
        slowestMenuToday: "Earl Grey Tea",
        avgOrderValue: 27890,
        yesterdayRevenue: 1290000,
        revenueChange: 12.4,
        profitChange: 5.2,
        bestDayThisWeek: "Sabtu",
        cashRevenue: 650000,
        qrisRevenue: 800500,
        date: todayStr,
        weeklySales: [
          { day: "Sen", revenue: 900000 },
          { day: "Sel", revenue: 950000 },
          { day: "Rab", revenue: 1100000 },
          { day: "Kam", revenue: 1450500 },
          { day: "Jum", revenue: 1300000 },
          { day: "Sab", revenue: 1500000 },
          { day: "Min", revenue: 1250000 },
        ]
      });

      const invRef = collection(db, "shops", MOCK_SHOP_ID, "inventory");
      await addDoc(invRef, { name: "Biji Kopi Houseblend", stock: 1.2, unit: "kg", threshold: 2, status: "low" });
      await addDoc(invRef, { name: "Susu UHT Full Cream", stock: 1, unit: "liter", threshold: 10, status: "out_of_stock" });
      await addDoc(invRef, { name: "Gula Aren Liquid", stock: 5, unit: "liter", threshold: 2, status: "in_stock" });

      const menuRef = collection(db, "shops", MOCK_SHOP_ID, "menu");
      await addDoc(menuRef, { name: "Es Kopi Susu Aren", price: 22000, category: "Coffee", available: true });
      await addDoc(menuRef, { name: "Americano Hot/Ice", price: 18000, category: "Coffee", available: true });
      await addDoc(menuRef, { name: "Iced Matcha Latte", price: 25000, category: "Non-Coffee", available: true });
      await addDoc(menuRef, { name: "Croissant Butter", price: 15000, category: "Snack", available: true });

      const chatRef = collection(db, "shops", MOCK_SHOP_ID, "customer_chats");
      const chatDoc = await addDoc(chatRef, {
        customerName: "Siti Aminah",
        lastMessage: "Halo, saya mau tanya apakah ada promo untuk hari ini?",
        lastTimestamp: serverTimestamp(),
        unreadCount: 1
      });

      await addDoc(collection(db, "shops", MOCK_SHOP_ID, "customer_chats", chatDoc.id, "messages"), {
        senderId: "customer_01",
        senderName: "Siti Aminah",
        content: "Halo, saya mau tanya apakah ada promo untuk hari ini?",
        timestamp: serverTimestamp(),
        role: 'customer'
      });

    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, "init_mock");
    }
  };

  const handlePlaceOrder = async (items: OrderItem[], total: number, paymentMethod: 'cash' | 'qris') => {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const itemsSold = items.reduce((sum, item) => sum + item.quantity, 0);

      // 1. Create Order
      await addDoc(collection(db, "shops", MOCK_SHOP_ID, "orders"), {
        items,
        total,
        paymentMethod,
        status: 'completed',
        createdAt: serverTimestamp()
      });

      // 2. Update Sales
      const salesRef = doc(db, "shops", MOCK_SHOP_ID, "sales", todayStr);
      await updateDoc(salesRef, {
        revenue: increment(total),
        transactions: increment(1),
        itemsSold: increment(itemsSold),
        [paymentMethod === 'cash' ? 'cashRevenue' : 'qrisRevenue']: increment(total)
      });

      // 3. Optional: Deduct inventory... (Skipping for now for simplicity)
      setActiveTab('dashboard');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, "order");
    }
  };

  const handleCustomerOrder = async (orderData: any) => {
    try {
      const docRef = await addDoc(collection(db, "shops", MOCK_SHOP_ID, "customer_orders"), {
        ...orderData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setActiveCustomerOrderId(docRef.id);
      localStorage.setItem('activeOrderId', docRef.id);
      return docRef.id;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, "customer_orders/create");
      throw err;
    }
  };

  const handleUpdateCustomerOrderStatus = async (orderId: string, status: CustomerOrder['status'], queueNumber?: string) => {
    try {
      const updates: any = { 
        status, 
        updatedAt: serverTimestamp() 
      };
      if (queueNumber) updates.queueNumber = queueNumber;
      
      // If confirmed, auto-assign a queue number
      if (status === 'confirmed') {
        const qCount = customerOrders.filter(o => o.status !== 'pending' && o.status !== 'rejected').length + 1;
        updates.queueNumber = `A${qCount}`;
      }

      if (status === 'ready') {
        const order = customerOrders.find(o => o.id === orderId);
        if (order) {
           speak(`Pesanan atas nama ${order.customerName} sudah siap. Silakan ambil di kasir.`);
        }
      }

      await updateDoc(doc(db, "shops", MOCK_SHOP_ID, "customer_orders", orderId), updates);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `customer_orders/${orderId}`);
    }
  };

  const handleAddMenuItem = (item: Partial<MenuItem>) => {
    addDoc(collection(db, "shops", MOCK_SHOP_ID, "menu"), item)
      .catch(err => handleFirestoreError(err, OperationType.WRITE, "menu/add"));
  };

  const handleUpdateMenuItem = (id: string, updates: Partial<MenuItem>) => {
    updateDoc(doc(db, "shops", MOCK_SHOP_ID, "menu", id), updates)
      .catch(err => handleFirestoreError(err, OperationType.UPDATE, `menu/${id}`));
  };

  const handleDeleteMenuItem = (id: string) => {
    deleteDoc(doc(db, "shops", MOCK_SHOP_ID, "menu", id))
      .catch(err => handleFirestoreError(err, OperationType.DELETE, `menu/${id}`));
  };

  const handleAddInventoryItem = (item: Partial<InventoryItem>) => {
    addDoc(collection(db, "shops", MOCK_SHOP_ID, "inventory"), {
      ...item,
      status: (item.stock || 0) <= 0 ? 'out_of_stock' : (item.stock || 0) <= (item.threshold || 0) ? 'low' : 'in_stock'
    }).catch(err => handleFirestoreError(err, OperationType.WRITE, "inventory/add"));
  };

  const handleUpdateInventoryItem = (id: string, updates: Partial<InventoryItem>) => {
    const item = inventory.find(i => i.id === id);
    if (!item) return;
    
    const finalStock = updates.stock !== undefined ? updates.stock : item.stock;
    const finalThreshold = updates.threshold !== undefined ? updates.threshold : item.threshold;
    
    let status: 'in_stock' | 'low' | 'out_of_stock' = 'in_stock';
    if (finalStock <= 0) status = 'out_of_stock';
    else if (finalStock <= finalThreshold) status = 'low';

    updateDoc(doc(db, "shops", MOCK_SHOP_ID, "inventory", id), { 
      ...updates,
      status 
    }).catch(err => handleFirestoreError(err, OperationType.UPDATE, `inventory/${id}`));
  };

  const handleDeleteInventoryItem = (id: string) => {
    deleteDoc(doc(db, "shops", MOCK_SHOP_ID, "inventory", id))
      .catch(err => handleFirestoreError(err, OperationType.DELETE, `inventory/${id}`));
  };

  const handleUpdateStock = (id: string, newStock: number) => {
    handleUpdateInventoryItem(id, { stock: newStock });
  };

  const handleSendMessage = async (content: string) => {
    if (!user) return;

    const msgData = {
      role: 'user',
      content,
      userId: user.uid, 
      createdAt: serverTimestamp()
    };

    try {
      await addDoc(collection(db, "users", user.uid, "messages"), msgData);
      setIsTyping(true);

      const aiResponse = await generateAIResponse(content, {
        shop,
        sales,
        weather,
        inventory: inventory.filter(i => (i.stock || 0) < 10)
      });

      await addDoc(collection(db, "users", user.uid, "messages"), {
        role: 'assistant',
        content: aiResponse,
        userId: user.uid,
        createdAt: serverTimestamp()
      });

    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, "messages");
    } finally {
      setIsTyping(false);
    }
  };

  const handleSendCustomerMessage = async (chatId: string, content: string) => {
    if (!user) return;
    try {
      await addDoc(collection(db, "shops", MOCK_SHOP_ID, "customer_chats", chatId, "messages"), {
        senderId: user.uid,
        senderName: shop?.ownerName || "Shop Owner",
        content,
        timestamp: serverTimestamp(),
        role: 'shop'
      });
      await updateDoc(doc(db, "shops", MOCK_SHOP_ID, "customer_chats", chatId), {
        lastMessage: content,
        lastTimestamp: serverTimestamp(),
        unreadCount: 0
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `customer_chats/${chatId}/send`);
    }
  };

  const handleToggleAIChat = (chatId: string) => {
    setAiEnabledChats(prev => ({
      ...prev,
      [chatId]: !prev[chatId]
    }));
  };

  // AI Auto-reply Trigger
  useEffect(() => {
    if (!user || customerChats.length === 0) return;

    // Listen for the most recent message in each chat to see if it needs an AI reply
    const unsubs = customerChats.map(chat => {
      if (!aiEnabledChats[chat.id]) return () => {};

      const q = query(
        collection(db, "shops", MOCK_SHOP_ID, "customer_chats", chat.id, "messages"),
        orderBy("timestamp", "desc"),
        limit(1)
      );

      return onSnapshot(q, async (snapshot) => {
        if (snapshot.empty) return;
        const msg = snapshot.docs[0].data() as CustomerMessage;
        
        // If the last message was from a customer, and we haven't replied yet
        if (msg.role === 'customer') {
          // Add a small delay to simulate thinking and avoid instant robotic replies
          setTimeout(async () => {
            const aiResponse = await generateAIResponse(msg.content, { 
              context: "WhatsApp Customer Service",
              shop,
              menu
            });
            handleSendCustomerMessage(chat.id, aiResponse);
          }, 2000);
        }
      });
    });

    return () => unsubs.forEach(unsub => unsub());
  }, [user, aiEnabledChats, customerChats.length]);

  const handleUpdateQueueStatus = async (queueId: string, status: QueueItem['status']) => {
    try {
      const updates: any = { status };
      if (status === 'ready') {
        updates.readyAt = serverTimestamp();
        // Trigger Voice Announcement
        const qItem = queue.find(q => q.id === queueId);
        if (qItem) {
          speak(`Nomor antrian ${qItem.queueNumber}, pesanan Anda sudah siap.`);
        }
      }
      await updateDoc(doc(db, "shops", MOCK_SHOP_ID, "queue", queueId), updates);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `queue/${queueId}`);
    }
  };

  const handleCreateWaiterCall = async (tableNumber: string) => {
    try {
      await addDoc(collection(db, "shops", MOCK_SHOP_ID, "waiter_calls"), {
        tableNumber,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      speak(`Panggilan pelayan dari meja ${tableNumber}`);
      playVibrate();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, "waiter_calls");
    }
  };

  const handleResolveWaiterCall = async (callId: string) => {
    try {
      await updateDoc(doc(db, "shops", MOCK_SHOP_ID, "waiter_calls", callId), {
        status: 'resolved'
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `waiter_calls/${callId}`);
    }
  };

  const handleReadScreen = () => {
    let text = "";
    if (activeTab === 'dashboard') {
      text = `Halaman Dashboard. Omzet hari ini ${sales?.revenue} rupiah dari ${sales?.transactions} transaksi. Produk terlaris adalah ${sales?.topSellingToday}.`;
    } else if (activeTab === 'customers') {
      text = `Halaman Chat Pelanggan. Terdapat ${customerChats.length} percakapan aktif.`;
    } else if (activeTab === 'inventory') {
      const lowStock = inventory.filter(i => i.status === 'low').length;
      text = `Halaman Inventori. Terdapat ${inventory.length} item. ${lowStock} item sedang menipis.`;
    } else if (activeTab === 'pos') {
      text = `Halaman Kasir. Silakan pilih menu untuk memulai pesanan. Tersedia ${menu.length} menu aktif.`;
    } else if (activeTab === 'reports') {
      text = `Halaman Rekap Laporan. Menampilkan ${orders.length} transaksi terakhir.`;
    } else if (activeTab === 'chat') {
      text = `Halaman Chat Kopix. Silakan tanyakan apa saja tentang operasional toko Anda.`;
    }

    if (typeof window !== 'undefined') {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'id-ID';
      window.speechSynthesis.speak(utterance);
    }
  };

  if (authLoading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-coffee-bg font-mono gap-4 uppercase tracking-widest text-coffee-muted">
        <Coffee className="w-12 h-12 animate-bounce stroke-coffee-dark" />
        <p className="text-xs">Initialising KOPIX...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={cn(
        "min-h-screen flex flex-col transition-colors duration-500 overflow-x-hidden",
        isDarkMode ? "bg-zinc-950 text-white" : "bg-[#FFFDFB] text-coffee-dark",
        isHighContrast && "contrast-125 saturate-150"
      )}>
        {/* Navigation */}
        <nav className="fixed top-0 left-0 right-0 z-[100] bg-inherit/80 backdrop-blur-md border-b border-orange-500/10" role="navigation" aria-label="Main Navigation">
          <div className="max-w-7xl mx-auto px-4 md:px-8 h-20 flex justify-between items-center w-full">
            <div className="flex items-center gap-3 group cursor-pointer" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})} role="link" aria-label="Home">
              <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20 group-hover:scale-110 transition-transform">
                <Coffee className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-black tracking-tighter">
                <span className="text-orange-500">WARUNG</span>
                <span className={isDarkMode ? "text-white" : "text-zinc-900"}>+</span>
                <span className="ml-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[7px] font-black tracking-widest uppercase">POS</span>
              </h1>
            </div>
            
            <div className="flex items-center gap-2 md:gap-4">
              <button 
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-2.5 rounded-xl hover:bg-orange-500/10 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500"
                aria-label={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                title="Toggle Dark Mode"
              >
                {isDarkMode ? <Sun className="w-5 h-5 text-orange-400" /> : <Moon className="w-5 h-5 text-zinc-500" />}
              </button>
              <button 
                onClick={handleLogin}
                className="flex items-center gap-2 px-5 md:px-8 py-3 bg-orange-500 text-white rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest shadow-xl shadow-orange-500/25 hover:scale-105 active:scale-95 transition-all"
                aria-label="Masuk ke Dashboard"
              >
                Masuk <ArrowRight className="w-4 h-4 hidden sm:block" />
              </button>
            </div>
          </div>
        </nav>

        <main className="flex-1 pt-24 md:pt-32" id="main-content">
          {/* Hero Section */}
          <section className="max-w-7xl mx-auto px-6 md:px-8 pb-20 overflow-hidden" aria-labelledby="hero-title">
            <div className="flex flex-col lg:flex-row items-center gap-12 md:gap-20">
              <div className="flex-1 text-center lg:text-left space-y-8">
                <motion.div
                  initial={{ opacity: 0, x: -50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                >
                  <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-orange-500/10 text-orange-500 font-black text-[10px] uppercase tracking-[0.25em] mb-8 border border-orange-500/10">
                    <Sparkles className="w-4 h-4" /> Smart Inclusive POS v4.0
                  </div>
                  <h2 id="hero-title" className="text-6xl md:text-8xl lg:text-[10rem] font-black leading-[0.85] tracking-tighter mb-8 italic">
                    WARUNG <span className="text-transparent bg-clip-text bg-gradient-to-br from-orange-500 via-amber-500 to-pink-500">PLUS.</span>
                  </h2>
                  <p className="text-xl md:text-3xl font-bold tracking-tight mb-8 max-w-2xl mx-auto lg:mx-0 leading-tight">
                    Solusi Kasir Pintar yang <span className="text-orange-500">Inklusif</span>, <br className="hidden md:block" /> Cepat, dan Ramah Disabilitas.
                  </p>
                  <p className="text-base md:text-lg text-coffee-muted font-medium max-w-xl mx-auto lg:mx-0 leading-relaxed mb-12 opacity-80">
                    Satu platform terintegrasi untuk mengelola stok, penjualan, dan pelanggan dengan antarmuka modern yang dioptimalkan untuk kenyamanan operasional UMKM Indonesia.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                    <button 
                      onClick={() => window.location.href = '/order'}
                      className="px-12 py-6 bg-orange-500 text-white rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-orange-500/40 hover:scale-105 active:scale-95 transition-all w-full sm:w-auto flex items-center justify-center gap-3"
                      aria-label="Pesan Menu Sekarang"
                    >
                      <ShoppingBag className="w-5 h-5" />
                      Pesan Menu Sekarang
                    </button>
                    <button 
                      onClick={handleLogin}
                      className={cn(
                        "px-12 py-6 border-[3px] rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] transition-all w-full sm:w-auto backdrop-blur-md",
                        isDarkMode ? "border-white/10 text-white hover:bg-white/5" : "border-zinc-900/10 text-zinc-900 hover:bg-orange-500/5"
                      )}
                    >
                      Buka Dashboard
                    </button>
                  </div>
                </motion.div>
              </div>

              <motion.div 
                initial={{ opacity: 0, scale: 0.8, rotate: 5 }}
                whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 1, type: "spring" }}
                className="flex-1 relative w-full lg:w-auto"
              >
                <div className={cn(
                  "relative z-10 grid grid-cols-2 gap-4 p-6 md:p-8 rounded-[4rem] border-8",
                  isDarkMode ? "bg-zinc-900 border-zinc-800 shadow-[0_0_80px_rgba(242,125,38,0.1)]" : "bg-white border-zinc-100 shadow-2xl"
                )}>
                  <LandingFeatureCard icon={<Zap className="w-7 h-7" />} label="Super Fast" sub="Performance" />
                  <LandingFeatureCard icon={<Monitor className="w-7 h-7" />} label="Pro UI/UX" sub="Interface" />
                  <LandingFeatureCard icon={<Accessibility className="w-7 h-7" />} label="Inclusive" sub="Accessibility" />
                  <LandingFeatureCard icon={<Smartphone className="w-7 h-7" />} label="Mobile Ready" sub="Responsive" />
                </div>
                {/* Visual accents */}
                <div className="absolute -top-16 -right-16 w-80 h-80 bg-orange-500/30 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute -bottom-16 -left-16 w-80 h-80 bg-pink-500/30 blur-[120px] rounded-full animate-pulse" />
              </motion.div>
            </div>
          </section>

          {/* Accessibility Highlight Section */}
          <section className={cn("py-24", isDarkMode ? "bg-zinc-900/30" : "bg-orange-50/50")}>
            <div className="max-w-7xl mx-auto px-8">
              <div className="text-center mb-20">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/10 text-orange-500 font-black text-[10px] uppercase tracking-[0.2em] mb-4">
                  Inklusivitas Adalah Kunci
                </div>
                <h3 className="text-4xl md:text-5xl font-black tracking-tighter">Dirancang untuk Semua Pengguna</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <HighlightCard 
                  icon={<Mic />}
                  title="Voice Navigation"
                  desc="Sistem akan membacakan menu dan pembayaran otomatis. Contoh: 'Kopi Susu satu', 'Pembayaran berhasil'."
                />
                <HighlightCard 
                  icon={<MousePointer2 />}
                  title="Big Touch Tablet Mode"
                  desc="Tombol besar, jelas, dan mudah disentuh agar nyaman digunakan semua pengguna, termasuk lansia."
                />
                <HighlightCard 
                  icon={<Accessibility />}
                  title="Accessibility Friendly"
                  desc="Mode khusus dengan font lebih besar, kontras tinggi, tampilan lebih fokus, dan navigasi sederhana."
                />
                <HighlightCard 
                  icon={<Volume2 />}
                  title="Smart Audio Feedback"
                  desc="Setiap transaksi memiliki suara interaktif untuk membantu navigasi dan konfirmasi aksi pengguna."
                />
              </div>

              {/* Interactive Demo Preview */}
              <div className="mt-20">
                <motion.div 
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className={cn(
                    "w-full max-w-4xl mx-auto p-8 md:p-12 rounded-[3.5rem] border shadow-xl relative overflow-hidden",
                    isDarkMode ? "bg-zinc-900 border-zinc-800" : "bg-white border-coffee-border"
                  )}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                    <div>
                      <h4 className="text-2xl font-black tracking-tight mb-4">Coba Fitur Aksesibilitas</h4>
                      <p className="text-sm text-coffee-muted font-bold uppercase tracking-widest mb-8">Konfigurasi cepat untuk simulasi:</p>
                      
                      <div className="space-y-4">
                        <AccessibilityToggle 
                          label="Voice Assistant" 
                          description="Panduan suara saat klik" 
                          active={isVoiceEnabled} 
                          onToggle={() => {
                            const next = !isVoiceEnabled;
                            setIsVoiceEnabled(next);
                            if (next) speak("Asisten Suara KOPIX Aktif. Saya akan membantu navigasi Anda.");
                          }}
                          isDarkMode={isDarkMode}
                        />
                        <AccessibilityToggle 
                          label="Tablet Mode" 
                          description="Tombol besar & spacing luas" 
                          active={isTabletMode} 
                          onToggle={() => setIsTabletMode(!isTabletMode)}
                          isDarkMode={isDarkMode}
                        />
                        <AccessibilityToggle 
                          label="Kontras Tinggi" 
                          description="Visual lebih tajam" 
                          active={isHighContrast} 
                          onToggle={() => setIsHighContrast(!isHighContrast)}
                          isDarkMode={isDarkMode}
                        />
                      </div>
                    </div>
                    <div className="bg-orange-500/5 border border-orange-500/10 rounded-3xl p-8 flex flex-col items-center justify-center text-center">
                      <div className="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-orange-500/20">
                        <Accessibility className="w-10 h-10" />
                      </div>
                      <p className="text-sm font-bold leading-relaxed">
                        "Membangun UMKM Indonesia yang lebih modern, inklusif, dan tanpa batas."
                      </p>
                      <div className="mt-8 flex gap-1">
                        {[1, 2, 3, 4, 5].map(i => (
                          <div key={i} className="w-2 h-2 rounded-full bg-orange-500" />
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </section>

          {/* New Digital Ordering Section */}
          <section className={cn("py-24 border-t border-orange-500/10 overflow-hidden", isDarkMode ? "bg-zinc-900/50" : "bg-white")}>
            <div className="max-w-7xl mx-auto px-6 md:px-8">
              <div className="flex flex-col lg:flex-row gap-20 items-center">
                <motion.div 
                  initial={{ opacity: 0, x: -50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className="flex-1 space-y-8"
                >
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-500/10 text-green-500 font-black text-[10px] uppercase tracking-[0.2em]">
                    Fitur Baru: Digital Ordering
                  </div>
                  <h3 className="text-5xl md:text-7xl font-black tracking-tighter leading-none italic uppercase">
                    Pesan Langsung <br /> Dari Website
                  </h3>
                  <p className="text-xl font-bold opacity-70 leading-relaxed max-w-xl">
                    Sekarang pelanggan Anda bisa memesan menu langsung dari Landing Page tanpa perlu mengunduh aplikasi. Cukup scan QR atau buka website, pilih menu, dan bayar. Rasakan pengalaman digital ordering yang modern, realtime, dan aman.
                  </p>
                  
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center text-white shrink-0">
                        <QrCode className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-bold">Menu Digital Real-time & Interaktif</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center text-white shrink-0">
                        <Bell className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-bold">Notifikasi Antrian & Status Pesanan</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center text-white shrink-0">
                        <CreditCard className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-bold">Berbagai Metode Pembayaran Terintegrasi</p>
                    </div>
                  </div>

                  <button 
                    onClick={() => window.location.href = '/order'}
                    className="px-10 py-5 bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
                  >
                    Coba Demo Menu <ArrowRight className="w-5 h-5" />
                  </button>
                </motion.div>

                <div className="flex-1 relative">
                   <div className="relative w-[300px] md:w-[350px] aspect-[9/19] bg-zinc-900 rounded-[3rem] border-[8px] border-zinc-800 shadow-[0_0_80px_rgba(0,0,0,0.4)] overflow-hidden mx-auto">
                      <div className="absolute top-0 inset-x-0 h-6 bg-zinc-800 rounded-b-xl flex items-center justify-center">
                         <div className="w-12 h-1 bg-zinc-700 rounded-full" />
                      </div>
                      <div className="h-full pt-8 p-4 overflow-y-auto custom-scrollbar">
                         <div className="mb-6">
                            <p className="text-[10px] font-black uppercase text-orange-500">WARUNG+</p>
                            <h4 className="text-lg font-black text-white">Digital Menu</h4>
                         </div>
                         <div className="space-y-4 opacity-50">
                           {[1, 2, 3].map(i => (
                             <div key={i} className="bg-zinc-800 rounded-2xl p-3 flex gap-3">
                               <div className="w-16 h-16 rounded-xl bg-zinc-700" />
                               <div className="flex-1 space-y-2 py-1">
                                 <div className="h-2 w-2/3 bg-zinc-700 rounded" />
                                 <div className="h-1 w-1/2 bg-zinc-700/50 rounded" />
                                 <div className="h-2 w-1/3 bg-orange-500/20 rounded" />
                               </div>
                             </div>
                           ))}
                         </div>
                         <div className="mt-8 p-6 bg-orange-500 rounded-[2rem] text-center shadow-lg shadow-orange-500/20">
                            <p className="text-[8px] font-black uppercase text-white/60 mb-1">Queue Number</p>
                            <p className="text-4xl font-black text-white">A12</p>
                            <p className="text-[10px] font-bold text-white mt-1 italic">DIPROSES</p>
                         </div>
                      </div>
                   </div>
                   {/* Floating bubbles */}
                   <div className="absolute -top-10 -right-4 w-24 h-24 bg-orange-500 rounded-full flex items-center justify-center text-white font-black text-xs rotate-12 shadow-xl animate-bounce text-center p-4">
                      FREE QR MENU
                   </div>
                </div>
              </div>
            </div>
          </section>

          {/* Business Section */}
          <section className="py-24 max-w-7xl mx-auto px-6 md:px-8">
            <div className="flex flex-col lg:flex-row gap-16 items-center">
              <div className="flex-1 space-y-10">
                <h3 className="text-5xl md:text-7xl font-black tracking-tighter leading-none italic uppercase">
                  ⚙️ Bukan Sekadar <br className="hidden md:block" /> Kasir Saja
                </h3>
                <p className="text-xl md:text-2xl font-bold opacity-80">WARUNG+ membantu bisnis Anda naik level dengan manajemen cerdas & inklusif.</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <BusinessBenefit item="Manajemen Stok Otomatis" />
                  <BusinessBenefit item="Pembayaran QRIS Tanpa Ribet" />
                  <BusinessBenefit item="Laporan Laba Rugi Real-time" />
                  <BusinessBenefit item="Antarmuka Khusus Tablet & HP" />
                  <BusinessBenefit item="Dukungan Aksesibilitas Penuh" />
                  <BusinessBenefit item="Sistem POS Termodern 2024" />
                </div>

                <div className="pt-6">
                  <button 
                    onClick={handleLogin}
                    className="inline-flex items-center gap-4 text-orange-500 font-black text-sm uppercase tracking-[0.2em] group border-b-4 border-orange-500/20 pb-2 hover:border-orange-500 transition-all"
                  >
                    Mulai Sekarang Gratis <ArrowRight className="w-6 h-6 group-hover:translate-x-3 transition-transform" />
                  </button>
                </div>
              </div>
              
              <div className="flex-1 grid grid-cols-2 gap-4 w-full">
                <motion.div 
                  whileHover={{ y: -10 }}
                  className={cn("aspect-square rounded-[3rem] p-10 flex flex-col justify-between border-4", isDarkMode ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-100 shadow-xl")}
                >
                   <div className="w-16 h-16 bg-orange-500/10 rounded-2xl flex items-center justify-center text-orange-500">
                     <DollarSign className="w-8 h-8" />
                   </div>
                   <div>
                     <p className="text-[10px] font-black uppercase tracking-widest text-coffee-muted mb-1">Total Transaksi</p>
                     <p className="text-4xl font-black tracking-tighter">12.5K+</p>
                   </div>
                </motion.div>
                <motion.div 
                  whileHover={{ y: -10 }}
                  className={cn("aspect-square rounded-[3rem] p-10 flex flex-col justify-between border-4 mt-12", isDarkMode ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-100 shadow-xl")}
                >
                   <div className="w-16 h-16 bg-pink-500/10 rounded-2xl flex items-center justify-center text-pink-500">
                     <ShoppingBag className="w-8 h-8" />
                   </div>
                   <div>
                     <p className="text-[10px] font-black uppercase tracking-widest text-coffee-muted mb-1">Menu Terjual</p>
                     <p className="text-4xl font-black tracking-tighter">450K+</p>
                   </div>
                </motion.div>
              </div>
            </div>
          </section>

          {/* Location Section */}
          <section className={cn("py-24 border-t border-orange-500/10", isDarkMode ? "bg-zinc-950" : "bg-white")}>
            <div className="max-w-7xl mx-auto px-6 md:px-8">
              <div className="flex flex-col lg:flex-row gap-16 items-center">
                <div className="flex-1 space-y-8 text-center lg:text-left">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 text-blue-500 font-black text-[10px] uppercase tracking-[0.2em] mb-4">
                    Kunjungi Workshop Kami
                  </div>
                  <h3 className="text-5xl md:text-6xl font-black tracking-tighter leading-tight italic uppercase">Lokasi Toko <br /> & Kantor Kami</h3>
                  <p className="text-lg opacity-60 font-bold max-w-xl mx-auto lg:mx-0">Temui tim kami untuk konsultasi langsung mengenai implementasi WARUNG+ di bisnis kuliner Anda.</p>
                  
                  <div className="space-y-6 pt-4">
                    <div className="flex items-start gap-4 justify-center lg:justify-start">
                      <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500 shrink-0">
                        <MapPin className="w-6 h-6" />
                      </div>
                      <div className="text-left">
                        <p className="font-black uppercase tracking-widest text-xs mb-1">Alamat Utama</p>
                        <p className="text-sm font-bold opacity-80">Kawasan SCBD, Jl. Jend. Sudirman Kav 52-53, <br />Jakarta Selatan, DKI Jakarta 12190</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4 justify-center lg:justify-start">
                      <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-500 shrink-0">
                        <Smartphone className="w-6 h-6" />
                      </div>
                      <div className="text-left">
                        <p className="font-black uppercase tracking-widest text-xs mb-1">Hubungi Kami</p>
                        <p className="text-sm font-bold opacity-80">+62 812-3456-7890 (CS WhatsApp)</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex-1 w-full relative">
                  <div className={cn(
                    "rounded-[4rem] overflow-hidden border-8 relative group",
                    isDarkMode ? "border-zinc-900 shadow-2xl" : "border-zinc-100 shadow-2xl"
                  )}>
                    {/* Placeholder for Map with an Iframe */}
                    <iframe 
                      src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3966.273062335193!2d106.811867!3d-6.2273!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e69f150493867b3%3A0x6735e2365bb53fbc!2sSCBD!5e0!3m2!1sen!2sid!4v1715424700000!5m2!1sen!2sid" 
                      width="100%" 
                      height="450" 
                      style={{ border: 0 }} 
                      allowFullScreen 
                      loading="lazy" 
                      referrerPolicy="no-referrer-when-downgrade"
                      className="grayscale-[0.5] contrast-125 brightness-90 group-hover:grayscale-0 transition-all duration-700"
                    />
                    <div className="absolute inset-0 pointer-events-none border-[12px] border-zinc-950/10 rounded-[3.2rem]" />
                  </div>
                  {/* Floating ID Tag */}
                  <div className="absolute -bottom-6 -right-6 bg-orange-500 text-white px-8 py-4 rounded-3xl font-black text-[10px] uppercase tracking-widest shadow-2xl animate-bounce">
                    Klik untuk Navigasi 📍
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>

        <footer className="py-24 border-t border-orange-500/10" role="contentinfo">
          <div className="max-w-7xl mx-auto px-6 md:px-8 flex flex-col items-center text-center gap-12">
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white shadow-lg">
                  <Coffee className="w-6 h-6" />
                </div>
                <h4 className="text-2xl font-black tracking-tighter">WARUNG<span className="text-orange-500">+</span></h4>
              </div>
              <p className="text-sm font-bold opacity-40 uppercase tracking-[0.3em]">Inclusive POS Indonesia</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-12 md:gap-24 w-full pt-12 border-t border-zinc-500/5">
              <div className="text-left space-y-4">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-30">Produk</p>
                <div className="flex flex-col gap-2">
                  <a href="#" className="text-sm font-bold hover:text-orange-500 transition-colors">Features</a>
                  <a href="#" className="text-sm font-bold hover:text-orange-500 transition-colors">Enterprise</a>
                  <a href="#" className="text-sm font-bold hover:text-orange-500 transition-colors">Security</a>
                </div>
              </div>
              <div className="text-left space-y-4">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-30">Dukungan</p>
                <div className="flex flex-col gap-2">
                  <a href="#" className="text-sm font-bold hover:text-orange-500 transition-colors">Dokumentasi</a>
                  <a href="#" className="text-sm font-bold hover:text-orange-500 transition-colors">Bantuan</a>
                  <a href="#" className="text-sm font-bold hover:text-orange-500 transition-colors">Status</a>
                </div>
              </div>
              <div className="text-right md:text-left col-span-2 space-y-6">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-30">Newsletter</p>
                <div className="flex max-w-sm ml-auto md:ml-0 bg-zinc-500/5 rounded-2xl p-1 border border-zinc-500/10">
                  <input type="email" placeholder="Email Anda" className="bg-transparent flex-1 px-4 py-2 text-xs font-bold focus:outline-none" />
                  <button className="bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 px-6 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest">Join</button>
                </div>
              </div>
            </div>

            <div className="pt-20 flex flex-col md:flex-row justify-between items-center w-full gap-8 border-t border-zinc-500/5 mt-12">
              <p className="text-[10px] font-black opacity-30 uppercase tracking-widest">© 2024 WARUNG+ POS. ALL RIGHTS RESERVED.</p>
              <div className="flex gap-6">
                <div className="w-10 h-10 rounded-full bg-zinc-500/5 flex items-center justify-center hover:bg-orange-500/10 transition-colors cursor-pointer"><Smartphone className="w-4 h-4 opacity-50" /></div>
                <div className="w-10 h-10 rounded-full bg-zinc-500/5 flex items-center justify-center hover:bg-orange-500/10 transition-colors cursor-pointer"><Monitor className="w-4 h-4 opacity-50" /></div>
                <div className="w-10 h-10 rounded-full bg-zinc-500/5 flex items-center justify-center hover:bg-orange-500/10 transition-colors cursor-pointer"><Zap className="w-4 h-4 opacity-50" /></div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  if (!shop || !sales) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-coffee-bg font-mono gap-4 uppercase tracking-widest text-coffee-muted">
        <Coffee className={cn("w-12 h-12 stroke-coffee-dark", !initError && "animate-bounce")} />
        <p className="text-xs">{initError ? "Error loading data" : "Brewing your shop data..."}</p>
        {initError && (
          <div className="max-w-md p-4 bg-red-50 border border-red-100 rounded-xl text-[10px] text-red-600 font-bold lowercase">
            {initError}
          </div>
        )}
        {initError && (
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-coffee-medium text-white rounded-full text-[10px] font-black uppercase tracking-widest"
          >
            Bersihkan Gelas & Coba Lagi
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={cn(
      "h-screen w-full transition-all duration-300",
      isDarkMode ? "bg-zinc-950 text-zinc-100 dark" : "bg-coffee-bg text-coffee-text",
      isHighContrast && "filter contrast-150 saturate-200",
      isLargeText && "text-lg"
    )}>
      <div className="h-full w-full overflow-hidden flex flex-col">
        {/* Top Header */}
        <header className={cn(
          "h-16 border-b px-8 flex items-center justify-between shrink-0 transition-colors",
          isDarkMode ? "bg-zinc-900 border-zinc-800" : "bg-white border-coffee-border"
        )}>
        <div className="flex items-center gap-2 sm:gap-3">
          <div 
            className="w-10 h-10 bg-coffee-medium rounded-lg flex items-center justify-center cursor-pointer hover:bg-coffee-dark transition-colors shrink-0"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            {isSidebarOpen ? <X className="w-6 h-6 text-white" /> : <MenuIcon className="w-6 h-6 text-white" />}
          </div>
          <div className="overflow-hidden">
            <h1 className="text-sm sm:text-lg font-black tracking-tighter flex items-center gap-1">
              <span className="text-orange-500">WARUNG</span>
              <span className={isDarkMode ? "text-white" : "text-coffee-dark"}>+</span>
              <span className="text-[8px] sm:text-[10px] font-black bg-gradient-to-r from-orange-500 to-pink-500 text-white px-2 py-0.5 rounded-full ml-1 uppercase tracking-wider shadow-sm shrink-0">SMART OS</span>
            </h1>
            <p className="text-[8px] sm:text-[10px] text-coffee-muted font-bold uppercase tracking-widest mt-0.5 truncate">
              {shop.name} • {shop.activeCashier}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 sm:gap-8">
          <div className="text-right hidden sm:block">
            <p className="text-[10px] font-bold text-coffee-muted uppercase tracking-wider">Kondisi Cuaca</p>
            <p className="text-sm font-bold flex items-center gap-1.5 justify-end">
              <span className="text-coffee-accent">🌧️ {weather.condition}</span> • {weather.temp}°C
            </p>
          </div>
          <div className="h-8 w-px bg-coffee-border hidden sm:block" />
          <div className="text-right">
            <p className="hidden sm:block text-[10px] font-bold text-coffee-muted uppercase tracking-wider">
              {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
            <p className="text-xs sm:text-sm font-black text-coffee-dark dark:text-white">
              {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden" 
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Navigation Sidebar */}
        <aside 
          className={cn(
            "fixed inset-y-0 left-0 z-50 lg:relative lg:z-0 transition-all duration-300 flex flex-col pt-16 lg:pt-0 shrink-0",
            isSidebarOpen ? "translate-x-0 w-64" : "-translate-x-full lg:translate-x-0 lg:w-20",
            isDarkMode ? "bg-zinc-900 border-zinc-800" : "bg-white border-coffee-border lg:border-r"
          )}
        >
          <nav className="flex-1 py-8 px-3 space-y-2">
            <NavItem 
              isDarkMode={isDarkMode}
              icon={<BarChart3 className="w-5 h-5" aria-hidden="true" />} 
              label="Dashboard" 
              active={activeTab === 'dashboard'} 
              expanded={isSidebarOpen}
              onClick={() => {
                setActiveTab('dashboard');
                if (window.innerWidth < 1024) setIsSidebarOpen(false);
              }}
            />
            <NavItem 
              isDarkMode={isDarkMode}
              icon={<MessageSquare className="w-5 h-5" aria-hidden="true" />} 
              label="Asisten Pintar" 
              active={activeTab === 'chat'} 
              expanded={isSidebarOpen}
              onClick={() => {
                setActiveTab('chat');
                if (window.innerWidth < 1024) setIsSidebarOpen(false);
              }}
            />
            <NavItem 
              isDarkMode={isDarkMode}
              icon={<UserIcon className="w-5 h-5" aria-hidden="true" />} 
              label="Chat Pelanggan" 
              active={activeTab === 'customers'} 
              expanded={isSidebarOpen}
              onClick={() => {
                setActiveTab('customers');
                if (window.innerWidth < 1024) setIsSidebarOpen(false);
              }}
            />
            <NavItem 
              isDarkMode={isDarkMode}
              icon={<Users className="w-5 h-5" aria-hidden="true" />} 
              label="Antrian" 
              active={activeTab === 'queue'} 
              expanded={isSidebarOpen}
              onClick={() => {
                setActiveTab('queue');
                if (window.innerWidth < 1024) setIsSidebarOpen(false);
              }}
            />
            <NavItem 
              isDarkMode={isDarkMode}
              icon={<ShoppingBag className="w-5 h-5" />} 
              label="Pesanan Masuk" 
              active={activeTab === 'incoming-orders'} 
              expanded={isSidebarOpen}
              onClick={() => {
                setActiveTab('incoming-orders');
                if (window.innerWidth < 1024) setIsSidebarOpen(false);
              }}
            />
            <NavItem 
              isDarkMode={isDarkMode}
              icon={<Box className="w-5 h-5" aria-hidden="true" />} 
              label="Inventory" 
              active={activeTab === 'inventory'} 
              expanded={isSidebarOpen}
              onClick={() => {
                setActiveTab('inventory');
                if (window.innerWidth < 1024) setIsSidebarOpen(false);
              }}
            />
            <NavItem 
              isDarkMode={isDarkMode}
              icon={<ShoppingCart className="w-5 h-5" aria-hidden="true" />} 
              label="Point of Sale" 
              active={activeTab === 'pos'} 
              expanded={isSidebarOpen}
              onClick={() => {
                setActiveTab('pos');
                if (window.innerWidth < 1024) setIsSidebarOpen(false);
              }}
            />
            <NavItem 
              isDarkMode={isDarkMode}
              icon={<ShoppingBag className="w-5 h-5" />} 
              label="Incoming Orders" 
              active={activeTab === 'incoming-orders'} 
              badge={customerOrders.filter(o => o.status === 'pending').length}
              expanded={isSidebarOpen}
              onClick={() => {
                setActiveTab('incoming-orders');
                if (window.innerWidth < 1024) setIsSidebarOpen(false);
              }}
            />
            <NavItem 
              isDarkMode={isDarkMode}
              icon={<UtensilsCrossed className="w-5 h-5" aria-hidden="true" />} 
              label="Menu Setup" 
              active={activeTab === 'menu'} 
              expanded={isSidebarOpen}
              onClick={() => {
                setActiveTab('menu');
                if (window.innerWidth < 1024) setIsSidebarOpen(false);
              }}
            />
            <NavItem 
              isDarkMode={isDarkMode}
              icon={<Settings className="w-5 h-5" aria-hidden="true" />} 
              label="Settings" 
              active={activeTab === 'settings'} 
              expanded={isSidebarOpen}
              onClick={() => {
                setActiveTab('settings');
                if (window.innerWidth < 1024) setIsSidebarOpen(false);
              }}
            />
            <NavItem 
              isDarkMode={isDarkMode}
              icon={<Table className="w-5 h-5" />} 
              label="Recap" 
              active={activeTab === 'reports'} 
              expanded={isSidebarOpen}
              onClick={() => {
                setActiveTab('reports');
                if (window.innerWidth < 1024) setIsSidebarOpen(false);
              }}
            />
            <button 
              onClick={handleLogout}
              className={cn(
                "flex items-center gap-3 transition-all relative px-4 py-3 rounded-xl w-full group",
                isDarkMode ? "text-red-400 hover:bg-red-500/10" : "text-red-600 hover:bg-red-50"
              )}
            >
              <LogOut className="w-5 h-5 shrink-0 group-hover:scale-110 transition-transform" />
              {isSidebarOpen && <span className="text-[11px] font-bold uppercase tracking-widest">Keluar</span>}
            </button>
          </nav>
        </aside>

        <main className={cn(
          "flex-1 p-8 overflow-y-auto transition-colors smooth-scroll relative overscroll-none",
          isDarkMode ? "bg-zinc-950/50" : "bg-transparent"
        )}>
          <div className="max-w-7xl mx-auto h-full">
            {activeTab === 'dashboard' && (
              <Dashboard 
                sales={sales} 
                shop={shop} 
                weather={weather} 
                isDarkMode={isDarkMode} 
                inventory={inventory}
                onNavigate={(tab: any) => setActiveTab(tab)}
                isTabletMode={isTabletMode}
                speak={speak}
                playVibrate={playVibrate}
                aiMessage={aiWelcomeMessage}
                menu={menu}
              />
            )}
            
            {activeTab === 'chat' && (
              <div className="h-full">
                <Chat 
                  messages={messages} 
                  onSendMessage={handleSendMessage} 
                  isTyping={isTyping} 
                  shopName={shop.name} 
                  isDarkMode={isDarkMode}
                />
              </div>
            )}

            {activeTab === 'customers' && (
              <div className="h-full">
                <CustomerChat 
                  chats={customerChats}
                  messages={customerMessages}
                  activeChatId={activeCustomerChatId}
                  onSelectChat={setActiveCustomerChatId}
                  onSendMessage={handleSendCustomerMessage}
                  onToggleAIChat={handleToggleAIChat}
                  isAIEnabled={activeCustomerChatId ? !!aiEnabledChats[activeCustomerChatId] : false}
                  isDarkMode={isDarkMode}
                />
              </div>
            )}

            {activeTab === 'queue' && (
              <div className="h-full">
                <QueueManager 
                   queue={queue}
                   waiterCalls={waiterCalls}
                   onUpdateQueueStatus={handleUpdateQueueStatus}
                   onResolveWaiterCall={handleResolveWaiterCall}
                   isDarkMode={isDarkMode}
                />
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">
                <div className="flex gap-4">
                   <button 
                     onClick={() => window.location.href = '/order'}
                     className="flex-1 p-6 bg-orange-500/10 text-orange-500 rounded-3xl border-4 border-orange-500/20 flex flex-col items-center gap-2 hover:scale-105 transition-all"
                   >
                      <Smartphone className="w-8 h-8" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Buka Website Ordering</span>
                   </button>
                </div>
                <div>
                  <h2 className={cn("text-2xl font-black uppercase tracking-tight", isDarkMode ? "text-white" : "text-coffee-dark")}>Pengaturan Aplikasi</h2>
                  <p className="text-xs text-coffee-muted font-bold mt-1 uppercase tracking-widest">Kustomisasi pengalaman KopiX Anda</p>
                </div>

                <div className={cn("rounded-3xl border p-8 space-y-8", isDarkMode ? "bg-zinc-900 border-zinc-800" : "bg-white border-coffee-border")}>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className={cn("text-sm font-black uppercase tracking-widest", isDarkMode ? "text-zinc-200" : "text-coffee-dark")}>Mode Tampilan</p>
                      <p className="text-[10px] text-coffee-muted font-bold uppercase tracking-tighter">Pilih antara tema cerah atau gelap</p>
                    </div>
                    <div className="flex bg-coffee-neutral p-1 rounded-2xl">
                      <button 
                        onClick={() => setIsDarkMode(false)}
                        className={cn(
                          "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                          !isDarkMode ? "bg-white text-coffee-dark shadow-sm" : "text-coffee-muted hover:text-white"
                        )}
                      >
                        Terang
                      </button>
                      <button 
                        onClick={() => setIsDarkMode(true)}
                        className={cn(
                          "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                          isDarkMode ? "bg-zinc-800 text-white shadow-sm" : "text-coffee-muted hover:text-coffee-dark"
                        )}
                      >
                        Gelap
                      </button>
                    </div>
                  </div>

                  <div className="pt-8 border-t border-coffee-neutral/10 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <AccessibilityToggle 
                      label="Voice Assistant" 
                      description="Ucapkan nama menu & aksi" 
                      active={isVoiceEnabled} 
                      onToggle={() => {
                        const next = !isVoiceEnabled;
                        setIsVoiceEnabled(next);
                        if (next) speak("Voice Assistant Aktif");
                      }}
                      isDarkMode={isDarkMode}
                    />
                    <AccessibilityToggle 
                      label="Haptic Feedback" 
                      description="Getaran pada setiap aksi" 
                      active={isHapticEnabled} 
                      onToggle={() => {
                        const next = !isHapticEnabled;
                        setIsHapticEnabled(next);
                        if (next) {
                          playVibrate();
                          if (isVoiceEnabled) speak("Haptic Aktif");
                        }
                      }}
                      isDarkMode={isDarkMode}
                    />
                    <AccessibilityToggle 
                      label="Tablet Mode" 
                      description="Tombol besar & spacing luas" 
                      active={isTabletMode} 
                      onToggle={() => {
                        const next = !isTabletMode;
                        setIsTabletMode(next);
                        if (isVoiceEnabled) speak(next ? "Mode Tablet Aktif" : "Mode Tablet Nonaktif");
                        playVibrate();
                      }}
                      isDarkMode={isDarkMode}
                    />
                    <AccessibilityToggle 
                      label="Kontras Tinggi" 
                      description="Warna lebih tajam" 
                      active={isHighContrast} 
                      onToggle={() => {
                        const next = !isHighContrast;
                        setIsHighContrast(next);
                        if (isVoiceEnabled) speak(next ? "Kontras Tinggi Aktif" : "Kontras Tinggi Nonaktif");
                        playVibrate();
                      }}
                      isDarkMode={isDarkMode}
                    />
                  </div>

                  <div className="pt-8 border-t border-coffee-neutral/10 flex items-center justify-between">
                    <div className="space-y-1">
                      <p className={cn("text-sm font-black uppercase tracking-widest", isDarkMode ? "text-zinc-200" : "text-coffee-dark")}>Informasi Toko</p>
                      <p className="text-[10px] text-coffee-muted font-bold uppercase tracking-tighter">Nama Toko: {shop?.name}</p>
                    </div>
                    <button className={cn(
                      "px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all",
                      isDarkMode ? "bg-zinc-800 text-zinc-400" : "bg-coffee-neutral text-coffee-muted opacity-50 cursor-not-allowed"
                    )}>
                      Ubah Data
                    </button>
                  </div>
                </div>

                <div className={cn("rounded-3xl border p-8 bg-orange-50 border-orange-100", isDarkMode && "bg-zinc-900 border-orange-900/50")}>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600 shadow-inner">
                      <Accessibility className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-orange-900 uppercase tracking-widest">Bantuan Aksesibilitas</p>
                      <p className="text-[10px] text-orange-800 font-bold uppercase mt-1">Anda juga dapat mengatur font dan kontras melalui widget di pojok kanan bawah.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'inventory' && (
              <Inventory 
                items={menu} 
                onUpdateMenuItem={handleUpdateMenuItem}
                isTabletMode={isTabletMode}
                isDarkMode={isDarkMode}
              />
            )}

            {activeTab === 'pos' && (
              <POS 
                menu={menu} 
                onPlaceOrder={handlePlaceOrder} 
                shopName={shop.name} 
                speak={speak}
                playVibrate={playVibrate}
                isTabletMode={isTabletMode}
                isDarkMode={isDarkMode}
              />
            )}

            {activeTab === 'menu' && (
              <MenuManager 
                menu={menu} 
                onAddMenuItem={handleAddMenuItem} 
                onUpdateMenuItem={handleUpdateMenuItem} 
                onDeleteMenuItem={handleDeleteMenuItem} 
                speak={speak}
                playVibrate={playVibrate}
                isTabletMode={isTabletMode}
              />
            )}

            {activeTab === 'reports' && (
              <Reports orders={orders} />
            )}
            {activeTab === 'incoming-orders' && (
              <div className="h-full">
                <IncomingOrdersManager 
                   orders={customerOrders}
                   onUpdateStatus={handleUpdateCustomerOrderStatus}
                   isDarkMode={isDarkMode}
                />
              </div>
            )}


          </div>
        </main>
      </div>

      {showAIWelcome && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in transition-all">
          <div className={cn("rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95 relative", isDarkMode ? "bg-zinc-900 border border-zinc-800" : "bg-white")}>
            <button 
              onClick={() => setShowAIWelcome(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-500 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="p-8 pb-6 flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white shadow-xl shadow-indigo-500/30 mb-6 animate-[pulse_2s_ease-in-out_infinite] relative">
                <div className="absolute inset-0 bg-indigo-500 rounded-full blur-xl opacity-50 animate-[ping_3s_ease-in-out_infinite]" />
                <Bot className="w-10 h-10 relative z-10" />
              </div>
              <h3 className={cn("text-xl font-black uppercase tracking-widest", isDarkMode ? "text-white" : "text-gray-900")}>Halo Kopiers!</h3>
              <p className={cn("text-sm font-medium mt-4 leading-relaxed", isDarkMode ? "text-zinc-400" : "text-gray-600")}>
                {aiWelcomeMessage}
              </p>
            </div>
            <div className="px-8 pb-8">
              <button 
                onClick={() => setShowAIWelcome(false)}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-2xl font-black shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
              >
                Mulai Hari Ini
              </button>
            </div>
          </div>
        </div>
      )}

      <VoiceAssistant 
        script={briefingScript || ""} 
        isDarkMode={isDarkMode} 
        onComplete={() => setBriefingScript(null)}
      />

      <AccessibilityWidget 
        onNavigate={(tab) => setActiveTab(tab)} 
        onReadScreen={handleReadScreen} 
        isHighContrast={isHighContrast}
        onToggleHighContrast={() => setIsHighContrast(!isHighContrast)}
        isLargeText={isLargeText}
        onToggleLargeText={() => setIsLargeText(!isLargeText)}
        isVoiceEnabled={isVoiceEnabled}
        onToggleVoice={() => setIsVoiceEnabled(!isVoiceEnabled)}
        isHapticEnabled={isHapticEnabled}
        onToggleHaptic={() => setIsHapticEnabled(!isHapticEnabled)}
        isTabletMode={isTabletMode}
        onToggleTabletMode={() => setIsTabletMode(!isTabletMode)}
      />
      <CommunicationAssistPanel />
      </div>
    </div>
  );
}

function NavItem({ icon, label, active, expanded, onClick, isDarkMode, badge }: { icon: React.ReactNode, label: string, active: boolean, expanded: boolean, onClick: () => void, isDarkMode?: boolean, badge?: number }) {
  return (
    <button 
      onClick={onClick}
      aria-label={label}
      aria-current={active ? 'page' : undefined}
      className={cn(
        "flex items-center gap-3 w-full transition-all relative px-4 py-3 rounded-xl group",
        active 
          ? (isDarkMode ? "bg-zinc-100 text-zinc-900 shadow-md" : "bg-coffee-dark text-white shadow-md") 
          : (isDarkMode ? "text-zinc-500 hover:bg-zinc-800 hover:text-zinc-100" : "text-coffee-muted hover:bg-coffee-sub hover:text-coffee-dark")
      )}
    >
      <div className={cn("transition-transform group-hover:scale-110", active && "scale-105 relative")}>
        {icon}
        {badge ? (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full border-2 border-white dark:border-zinc-950" />
        ) : null}
      </div>
      {expanded && (
        <div className="flex-1 flex justify-between items-center">
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] whitespace-nowrap">{label}</span>
          {badge ? (
            <span className="bg-orange-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
              {badge}
            </span>
          ) : null}
        </div>
      )}
    </button>
  );
}

function AccessibilityToggle({ label, description, active, onToggle, isDarkMode }: { label: string, description: string, active: boolean, onToggle: () => void, isDarkMode: boolean }) {
  return (
    <div className="flex items-center justify-between p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 transition-all hover:border-orange-200">
      <div className="space-y-0.5">
        <p className={cn("text-xs font-black uppercase tracking-widest", isDarkMode ? "text-white" : "text-coffee-dark")}>{label}</p>
        <p className="text-[9px] text-coffee-muted font-bold uppercase tracking-tighter">{description}</p>
      </div>
      <button 
        onClick={onToggle}
        className={cn(
          "w-12 h-6 rounded-full p-1 transition-all relative overflow-hidden",
          active ? "bg-orange-500" : "bg-zinc-200 dark:bg-zinc-700"
        )}
      >
        <div className={cn(
          "w-4 h-4 rounded-full bg-white transition-all",
          active ? "translate-x-6" : "translate-x-0"
        )} />
      </button>
    </div>
  );
}

function SmallSidebarItem({ id, icon, active, onClick, isDarkMode, label }: any) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "p-4 rounded-2xl transition-all relative group",
        active 
          ? (isDarkMode ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20" : "bg-orange-500 text-white shadow-lg shadow-orange-500/20") 
          : (isDarkMode ? "text-zinc-500 hover:bg-zinc-800" : "text-coffee-muted hover:bg-coffee-sub")
      )}
    >
      {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: "w-6 h-6" })}
      <div className="absolute left-full ml-4 px-3 py-2 bg-zinc-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-[100] whitespace-nowrap">
        {label}
      </div>
    </button>
  );
}

function LandingFeatureCard({ icon, label, sub }: { icon: React.ReactNode, label: string, sub: string }) {
  return (
    <div className="bg-orange-500/5 p-6 rounded-[2rem] flex flex-col items-center text-center">
      <div className="text-orange-500 mb-4">{icon}</div>
      <p className="text-[10px] font-black uppercase tracking-widest leading-tight">{label}</p>
      <p className="text-[10px] font-bold text-coffee-muted uppercase tracking-widest mt-1 opacity-60">{sub}</p>
    </div>
  );
}

function HighlightCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="space-y-4">
      <div className="w-12 h-12 bg-orange-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20">
        {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: "w-6 h-6" })}
      </div>
      <h4 className="text-lg font-black tracking-tight">{title}</h4>
      <p className="text-sm font-medium text-coffee-muted leading-relaxed">{desc}</p>
    </div>
  );
}

function BusinessBenefit({ item }: { item: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-5 h-5 bg-orange-500/10 text-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
        <CheckCircle2 className="w-3 h-3" />
      </div>
      <p className="text-sm font-bold text-coffee-muted">{item}</p>
    </div>
  );
}
