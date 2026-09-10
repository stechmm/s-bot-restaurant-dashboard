import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const StoreContext = createContext();

export function StoreProvider({ children }) {
  const [stores, setStores] = useState([]);
  const [activeStoreId, setActiveStoreId] = useState(() => {
    const saved = localStorage.getItem('active_store_id');
    return saved ? parseInt(saved, 10) : null;
  });
  const [loading, setLoading] = useState(true);

  const fetchStores = async () => {
    try {
      const res = await api.get('/stores/');
      setStores(res.data);
      if (res.data.length > 0) {
        // If current activeStoreId is invalid or not set, default to first store
        const exists = res.data.find(s => s.id === activeStoreId);
        if (!exists) {
          const firstId = res.data[0].id;
          setActiveStoreId(firstId);
          localStorage.setItem('active_store_id', firstId.toString());
        }
      }
    } catch (err) {
      console.error('Failed to fetch stores:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStores();
    const interval = setInterval(fetchStores, 10000);
    return () => clearInterval(interval);
  }, [activeStoreId]);

  const switchStore = (storeId) => {
    const numId = parseInt(storeId, 10);
    setActiveStoreId(numId);
    localStorage.setItem('active_store_id', numId.toString());
  };

  const activeStore = stores.find(s => s.id === activeStoreId) || stores[0] || null;

  return (
    <StoreContext.Provider value={{
      stores,
      activeStore,
      activeStoreId,
      switchStore,
      refreshStores: fetchStores,
      loading
    }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  return useContext(StoreContext);
}
