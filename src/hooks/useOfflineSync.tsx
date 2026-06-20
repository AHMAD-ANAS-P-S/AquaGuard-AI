import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface QueuedItem {
  id: string;
  type: 'health_report' | 'water_report';
  data: any;
  timestamp: number;
}

const DB_NAME = 'AquaGuardOffline';
const STORE_NAME = 'syncQueue';

export const useOfflineSync = () => {
  const { user } = useAuth();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queuedItems, setQueuedItems] = useState<QueuedItem[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  // Initialize IndexedDB
  const openDB = useCallback((): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
    });
  }, []);

  // Load queued items from IndexedDB
  const loadQueue = useCallback(async () => {
    try {
      const db = await openDB();
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();
      
      return new Promise<QueuedItem[]>((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Error loading queue:', error);
      return [];
    }
  }, [openDB]);

  // Add item to queue
  const addToQueue = useCallback(async (type: QueuedItem['type'], data: any) => {
    const item: QueuedItem = {
      id: crypto.randomUUID(),
      type,
      data,
      timestamp: Date.now(),
    };

    try {
      const db = await openDB();
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      store.add(item);
      
      setQueuedItems(prev => [...prev, item]);
      
      toast.info('Report saved offline', {
        description: 'Will sync when connection is restored',
      });
      
      return true;
    } catch (error) {
      console.error('Error adding to queue:', error);
      return false;
    }
  }, [openDB]);

  // Remove item from queue
  const removeFromQueue = useCallback(async (id: string) => {
    try {
      const db = await openDB();
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      store.delete(id);
      
      setQueuedItems(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      console.error('Error removing from queue:', error);
    }
  }, [openDB]);

  // Sync queued items
  const syncQueue = useCallback(async () => {
    if (!isOnline || !user || isSyncing) return;
    
    setIsSyncing(true);
    const items = await loadQueue();
    
    let syncedCount = 0;
    
    for (const item of items) {
      try {
        if (item.type === 'health_report') {
          const { error } = await supabase
            .from('health_reports')
            .insert({
              ...item.data,
              reporter_id: user.id,
            });
          
          if (!error) {
            await removeFromQueue(item.id);
            syncedCount++;
          }
        }
      } catch (error) {
        console.error('Error syncing item:', error);
      }
    }
    
    if (syncedCount > 0) {
      toast.success(`Synced ${syncedCount} offline reports`);
    }
    
    setIsSyncing(false);
  }, [isOnline, user, isSyncing, loadQueue, removeFromQueue]);

  // Submit report (online or offline)
  const submitReport = useCallback(async (type: QueuedItem['type'], data: any) => {
    if (!isOnline) {
      return await addToQueue(type, data);
    }
    
    // Online submission
    try {
      if (type === 'health_report') {
        const { error } = await supabase
          .from('health_reports')
          .insert({
            ...data,
            reporter_id: user?.id,
          });
        
        if (error) throw error;
        return true;
      }
      return true;
    } catch (error) {
      console.error('Online submission failed, queuing:', error);
      return await addToQueue(type, data);
    }
  }, [isOnline, user, addToQueue]);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Connection restored');
      syncQueue();
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      toast.warning('You are offline', {
        description: 'Reports will be saved locally',
      });
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Initial load
    loadQueue().then(setQueuedItems);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncQueue, loadQueue]);

  // Sync on mount if online
  useEffect(() => {
    if (isOnline && user) {
      syncQueue();
    }
  }, [isOnline, user, syncQueue]);

  return {
    isOnline,
    queuedItems,
    isSyncing,
    submitReport,
    syncQueue,
    pendingCount: queuedItems.length,
  };
};
