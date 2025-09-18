import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { offlineService } from '@/services/offline.service';

// Types
export interface OfflineData {
  patients: any[];
  encounters: any[];
  observations: any[];
  pendingSync: any[];
  lastSyncTime: string | null;
}

export interface OfflineState {
  isOnline: boolean;
  isOfflineCapable: boolean;
  isSyncing: boolean;
  syncProgress: number;
  pendingSyncCount: number;
  lastSyncTime: string | null;
  syncError: string | null;
  offlineData: OfflineData;
}

type OfflineAction =
  | { type: 'SET_ONLINE_STATUS'; payload: boolean }
  | { type: 'SET_OFFLINE_CAPABLE'; payload: boolean }
  | { type: 'SYNC_START' }
  | { type: 'SYNC_PROGRESS'; payload: number }
  | { type: 'SYNC_SUCCESS'; payload: { lastSyncTime: string; syncedCount: number } }
  | { type: 'SYNC_ERROR'; payload: string }
  | { type: 'ADD_PENDING_SYNC'; payload: any }
  | { type: 'REMOVE_PENDING_SYNC'; payload: string }
  | { type: 'UPDATE_OFFLINE_DATA'; payload: Partial<OfflineData> }
  | { type: 'CLEAR_SYNC_ERROR' };

// Initial state
const initialState: OfflineState = {
  isOnline: navigator.onLine,
  isOfflineCapable: false,
  isSyncing: false,
  syncProgress: 0,
  pendingSyncCount: 0,
  lastSyncTime: null,
  syncError: null,
  offlineData: {
    patients: [],
    encounters: [],
    observations: [],
    pendingSync: [],
    lastSyncTime: null,
  },
};

// Offline reducer
const offlineReducer = (state: OfflineState, action: OfflineAction): OfflineState => {
  switch (action.type) {
    case 'SET_ONLINE_STATUS':
      return {
        ...state,
        isOnline: action.payload,
      };

    case 'SET_OFFLINE_CAPABLE':
      return {
        ...state,
        isOfflineCapable: action.payload,
      };

    case 'SYNC_START':
      return {
        ...state,
        isSyncing: true,
        syncProgress: 0,
        syncError: null,
      };

    case 'SYNC_PROGRESS':
      return {
        ...state,
        syncProgress: action.payload,
      };

    case 'SYNC_SUCCESS':
      return {
        ...state,
        isSyncing: false,
        syncProgress: 100,
        lastSyncTime: action.payload.lastSyncTime,
        pendingSyncCount: Math.max(0, state.pendingSyncCount - action.payload.syncedCount),
        syncError: null,
      };

    case 'SYNC_ERROR':
      return {
        ...state,
        isSyncing: false,
        syncProgress: 0,
        syncError: action.payload,
      };

    case 'ADD_PENDING_SYNC':
      return {
        ...state,
        pendingSyncCount: state.pendingSyncCount + 1,
        offlineData: {
          ...state.offlineData,
          pendingSync: [...state.offlineData.pendingSync, action.payload],
        },
      };

    case 'REMOVE_PENDING_SYNC':
      return {
        ...state,
        pendingSyncCount: Math.max(0, state.pendingSyncCount - 1),
        offlineData: {
          ...state.offlineData,
          pendingSync: state.offlineData.pendingSync.filter(item => item.id !== action.payload),
        },
      };

    case 'UPDATE_OFFLINE_DATA':
      return {
        ...state,
        offlineData: {
          ...state.offlineData,
          ...action.payload,
        },
      };

    case 'CLEAR_SYNC_ERROR':
      return {
        ...state,
        syncError: null,
      };

    default:
      return state;
  }
};

// Context
interface OfflineContextType {
  state: OfflineState;
  syncData: () => Promise<void>;
  addPendingSync: (data: any) => void;
  removePendingSync: (id: string) => void;
  clearSyncError: () => void;
  getOfflineData: (type: keyof OfflineData) => any[];
  saveOfflineData: (type: keyof OfflineData, data: any[]) => Promise<void>;
  isDataAvailable: (type: keyof OfflineData) => boolean;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

// Hook to use offline context
export const useOffline = (): OfflineContextType => {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return context;
};

// Offline provider component
export const OfflineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(offlineReducer, initialState);

  // Initialize offline capabilities
  useEffect(() => {
    const initializeOffline = async () => {
      try {
        // Check if service worker and IndexedDB are supported
        const isOfflineCapable = 'serviceWorker' in navigator && 'indexedDB' in window;
        dispatch({ type: 'SET_OFFLINE_CAPABLE', payload: isOfflineCapable });

        if (isOfflineCapable) {
          // Initialize offline service
          await offlineService.initialize();
          
          // Load offline data
          const offlineData = await offlineService.getAllOfflineData();
          dispatch({ type: 'UPDATE_OFFLINE_DATA', payload: offlineData });
          
          // Get pending sync count
          const pendingCount = await offlineService.getPendingSyncCount();
          dispatch({ type: 'UPDATE_OFFLINE_DATA', payload: { pendingSync: [] } });
          
          // Update state with actual pending count
          for (let i = 0; i < pendingCount; i++) {
            dispatch({ type: 'ADD_PENDING_SYNC', payload: { id: `pending-${i}` } });
          }
        }
      } catch (error) {
        console.error('Failed to initialize offline capabilities:', error);
      }
    };

    initializeOffline();
  }, []);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      dispatch({ type: 'SET_ONLINE_STATUS', payload: true });
      
      // Auto-sync when coming back online
      if (state.pendingSyncCount > 0) {
        syncData();
      }
    };

    const handleOffline = () => {
      dispatch({ type: 'SET_ONLINE_STATUS', payload: false });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [state.pendingSyncCount]);

  // Sync data function
  const syncData = async (): Promise<void> => {
    if (!state.isOnline || state.isSyncing) {
      return;
    }

    try {
      dispatch({ type: 'SYNC_START' });

      // Get pending sync items
      const pendingItems = await offlineService.getPendingSyncItems();
      const totalItems = pendingItems.length;

      if (totalItems === 0) {
        dispatch({ 
          type: 'SYNC_SUCCESS', 
          payload: { 
            lastSyncTime: new Date().toISOString(), 
            syncedCount: 0 
          } 
        });
        return;
      }

      let syncedCount = 0;

      // Sync each pending item
      for (const item of pendingItems) {
        try {
          await offlineService.syncItem(item);
          await offlineService.removePendingSyncItem(item.id);
          syncedCount++;
          
          // Update progress
          const progress = Math.round((syncedCount / totalItems) * 100);
          dispatch({ type: 'SYNC_PROGRESS', payload: progress });
          
        } catch (itemError) {
          console.error(`Failed to sync item ${item.id}:`, itemError);
          // Continue with other items
        }
      }

      // Sync completed
      dispatch({ 
        type: 'SYNC_SUCCESS', 
        payload: { 
          lastSyncTime: new Date().toISOString(), 
          syncedCount 
        } 
      });

      // Update offline data cache
      const updatedOfflineData = await offlineService.getAllOfflineData();
      dispatch({ type: 'UPDATE_OFFLINE_DATA', payload: updatedOfflineData });

    } catch (error: any) {
      const errorMessage = error.message || 'Sync failed';
      dispatch({ type: 'SYNC_ERROR', payload: errorMessage });
      console.error('Sync error:', error);
    }
  };

  // Add pending sync item
  const addPendingSync = async (data: any): Promise<void> => {
    try {
      const syncItem = {
        id: `sync-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: data.type || 'unknown',
        data,
        timestamp: new Date().toISOString(),
        attempts: 0,
      };

      await offlineService.addPendingSyncItem(syncItem);
      dispatch({ type: 'ADD_PENDING_SYNC', payload: syncItem });
    } catch (error) {
      console.error('Failed to add pending sync item:', error);
    }
  };

  // Remove pending sync item
  const removePendingSync = async (id: string): Promise<void> => {
    try {
      await offlineService.removePendingSyncItem(id);
      dispatch({ type: 'REMOVE_PENDING_SYNC', payload: id });
    } catch (error) {
      console.error('Failed to remove pending sync item:', error);
    }
  };

  // Clear sync error
  const clearSyncError = (): void => {
    dispatch({ type: 'CLEAR_SYNC_ERROR' });
  };

  // Get offline data
  const getOfflineData = (type: keyof OfflineData): any[] => {
    return state.offlineData[type] || [];
  };

  // Save offline data
  const saveOfflineData = async (type: keyof OfflineData, data: any[]): Promise<void> => {
    try {
      await offlineService.saveOfflineData(type, data);
      dispatch({ 
        type: 'UPDATE_OFFLINE_DATA', 
        payload: { [type]: data } 
      });
    } catch (error) {
      console.error(`Failed to save offline data for ${type}:`, error);
    }
  };

  // Check if data is available offline
  const isDataAvailable = (type: keyof OfflineData): boolean => {
    return state.offlineData[type] && state.offlineData[type].length > 0;
  };

  // Auto-sync periodically when online
  useEffect(() => {
    if (!state.isOnline || !state.isOfflineCapable) return;

    const interval = setInterval(() => {
      if (state.pendingSyncCount > 0 && !state.isSyncing) {
        syncData();
      }
    }, 5 * 60 * 1000); // Every 5 minutes

    return () => clearInterval(interval);
  }, [state.isOnline, state.isOfflineCapable, state.pendingSyncCount, state.isSyncing]);

  const contextValue: OfflineContextType = {
    state,
    syncData,
    addPendingSync,
    removePendingSync,
    clearSyncError,
    getOfflineData,
    saveOfflineData,
    isDataAvailable,
  };

  return (
    <OfflineContext.Provider value={contextValue}>
      {children}
    </OfflineContext.Provider>
  );
};