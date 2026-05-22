import React, { createContext, useContext, ReactNode } from 'react';
import { Platform } from 'react-native';

interface NotificationContextType {
  scheduleNotification: (title: string, body: string, seconds: number) => Promise<void>;
  cancelAllNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const scheduleNotification = async (title: string, body: string, seconds: number) => {
    // Simple implementation - just log for now
    console.log(`[Notification] ${title}: ${body} in ${seconds}s`);
  };

  const cancelAllNotifications = async () => {
    console.log('[Notification] All notifications cancelled');
  };

  return (
    <NotificationContext.Provider value={{ scheduleNotification, cancelAllNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}