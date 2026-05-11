import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/src/lib/firebase';
import { ShopInfo, MenuItem, CustomerOrder } from '@/src/types';
import DigitalMenu from '@/src/components/DigitalMenu';
import { Coffee, Moon, Sun } from 'lucide-react';
import { cn } from '@/src/lib/utils';

const MOCK_SHOP_ID = "main_shop_01";

const DUMMY_MENU: MenuItem[] = [
  { id: 'dummy-1', name: 'Es Kopi Susu Aren', price: 22000, category: 'Coffee', available: true, imageUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&q=80', description: 'Kopi dengan susu dan gula aren.' },
  { id: 'dummy-2', name: 'Iced Matcha Latte', price: 25000, category: 'Non Coffee', available: true, imageUrl: 'https://images.unsplash.com/photo-1622543328514-6178de3d0d84?w=400&q=80', description: 'Matcha dengan susu segar.' },
  { id: 'dummy-3', name: 'Americano Hot/Ice', price: 18000, category: 'Coffee', available: true, imageUrl: 'https://images.unsplash.com/photo-1551030173-122aef44855d?w=400&q=80', description: 'Kopi espresso dengan air panas/es.' },
  { id: 'dummy-4', name: 'Croissant Butter', price: 15000, category: 'Snack', available: true, imageUrl: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400&q=80', description: 'Croissant dengan butter gurih.' },
  { id: 'dummy-5', name: 'Kentang Goreng', price: 10000, category: 'Snack', available: true, imageUrl: 'https://images.unsplash.com/photo-1630384060421-cb20d0e065d6?w=400&q=80', description: 'Kentang goreng renyah.' },
];

export default function CustomerApp() {
  const [shop, setShop] = useState<ShopInfo | null>(null);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [customerOrders, setCustomerOrders] = useState<CustomerOrder[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoadingShop, setIsLoadingShop] = useState(true);
  const [isLoadingMenu, setIsLoadingMenu] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCustomerOrderId, setActiveCustomerOrderId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('activeOrderId');
    return null;
  });

  // Automatically add/remove dark class from HTML document to support Tailwind typography if any
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    setIsLoadingShop(true);
    setError(null);
    const unsubShop = onSnapshot(doc(db, "shops", MOCK_SHOP_ID), (snapshot) => {
      if (snapshot.exists()) {
        setShop(snapshot.data() as ShopInfo);
      } else {
        setShop({ name: "WARUNG+" } as ShopInfo);
      }
      setIsLoadingShop(false);
    }, (err) => {
      console.error("Shop fetch error:", err);
      setError("Gagal memuat data toko.");
      setIsLoadingShop(false);
      if (err.code !== 'permission-denied') {
        try { handleFirestoreError(err, OperationType.GET, `shops/${MOCK_SHOP_ID}`); } catch (e) {}
      }
    });

    setIsLoadingMenu(true);
    const unsubMenu = onSnapshot(collection(db, "shops", MOCK_SHOP_ID, "menu"), (snapshot) => {
      const items: MenuItem[] = [];
      snapshot.forEach(doc => items.push({ id: doc.id, ...doc.data() } as MenuItem));
      setMenu(items.length > 0 ? items : DUMMY_MENU);
      setIsLoadingMenu(false);
    }, (err) => {
      console.error("Menu fetch error:", err);
      setError("Gagal memuat menu.");
      setIsLoadingMenu(false);
      if (err.code !== 'permission-denied') {
        try { handleFirestoreError(err, OperationType.GET, "menu"); } catch (e) {}
      }
    });

    return () => {
      unsubShop();
      unsubMenu();
    };
  }, []);

  useEffect(() => {
    if (!activeCustomerOrderId) return;

    const unsub = onSnapshot(doc(db, "shops", MOCK_SHOP_ID, "customer_orders", activeCustomerOrderId), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        const order = { 
          id: snapshot.id, 
          ...data, 
          createdAt: data.createdAt ? data.createdAt.toDate() : new Date(),
          updatedAt: data.updatedAt ? data.updatedAt.toDate() : new Date()
        } as any;
        setCustomerOrders(prev => {
          const exists = prev.find(o => o.id === order.id);
          if (exists) return prev.map(o => o.id === order.id ? order : o);
          return [order];
        });
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, `customer_orders/${activeCustomerOrderId}`));

    return () => unsub();
  }, [activeCustomerOrderId]);

  const handlePlaceOrder = async (orderData: any) => {
    try {
      const queueNumber = `A${Math.floor(10 + Math.random() * 90)}`;
      const docRef = await addDoc(collection(db, "shops", MOCK_SHOP_ID, "customer_orders"), {
        ...orderData,
        queueNumber,
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

  const handleCallWaiter = async (tableNumber: string) => {
    try {
      await addDoc(collection(db, "shops", MOCK_SHOP_ID, "waiter_calls"), {
        tableNumber,
        status: 'pending',
        createdAt: serverTimestamp()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, "waiter_calls");
    }
  };

  if (error && !shop && menu.length === 0) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center font-sans gap-4 text-zinc-500 bg-[#FFFDFB] px-6 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-2">
          <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-xl font-black text-zinc-900">Oops!</h2>
        <p className="text-sm">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 px-6 py-3 bg-zinc-900 text-white rounded-xl font-bold uppercase tracking-widest text-[10px] hover:scale-105 transition-all"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  if (isLoadingShop || isLoadingMenu) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center font-mono gap-4 uppercase tracking-widest text-zinc-500 bg-[#FFFDFB]">
        <Coffee className="w-12 h-12 stroke-zinc-900 animate-bounce" />
        <p className="text-xs">Menyiapkan Menu...</p>
      </div>
    );
  }

  const activeOrder = customerOrders.find(o => o.id === activeCustomerOrderId) || null;

  return (
    <div className={cn("relative min-h-screen", isDarkMode ? "bg-zinc-950" : "bg-[#FFFDFB]")}>
      <DigitalMenu
        menu={menu}
        shopName={shop?.name || "WARUNG+"}
        onCallWaiter={handleCallWaiter}
        onPlaceOrder={handlePlaceOrder}
        activeOrder={activeOrder}
        isDarkMode={isDarkMode}
      />
      <button 
        onClick={() => setIsDarkMode(!isDarkMode)}
        className="fixed top-6 right-6 z-50 p-3 rounded-full shadow-xl transition-all hover:scale-110 active:scale-95 border-2 border-transparent bg-white/20 backdrop-blur-md"
        style={{ borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}
      >
        {isDarkMode ? <Sun className="w-5 h-5 text-orange-400" /> : <Moon className="w-5 h-5 text-zinc-600" />}
      </button>
    </div>
  );
}
