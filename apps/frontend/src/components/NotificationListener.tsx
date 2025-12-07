import { useEffect, useRef } from 'react';
import { useAuthStore } from '../stores/authStore';
import { showToastNotification } from './ToastNotification';
import api from '../lib/api';

// Track which notifications we've already shown
const shownNotificationIds = new Set<string>();

export function NotificationListener() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const lastCheckRef = useRef<string | null>(null);
  
  useEffect(() => {
    if (!isAuthenticated) return;
    
    // Initial check
    checkForNewNotifications();
    
    // Poll every 5 seconds for new notifications
    const interval = setInterval(checkForNewNotifications, 5000);
    
    return () => clearInterval(interval);
  }, [isAuthenticated]);
  
  const checkForNewNotifications = async () => {
    try {
      const response = await api.get('/api/notifications?limit=10&unread=true');
      const data = response.data || response;
      const notifications = data.notifications || [];
      
      // Show toast for each new notification
      for (const notification of notifications) {
        if (!shownNotificationIds.has(notification.id)) {
          shownNotificationIds.add(notification.id);
          
          // Only show if created in the last 30 seconds (recent)
          const createdAt = new Date(notification.createdAt);
          const now = new Date();
          const diffSeconds = (now.getTime() - createdAt.getTime()) / 1000;
          
          if (diffSeconds < 30) {
            showToastNotification({
              type: notification.type,
              title: notification.title,
              body: notification.body,
              avatar: notification.fromUser?.profile?.avatar,
              fromUserId: notification.fromUser?.id,
              data: notification.data ? JSON.parse(notification.data) : undefined,
            });
          }
        }
      }
      
      // Clean up old IDs from memory (keep last 100)
      if (shownNotificationIds.size > 100) {
        const idsArray = Array.from(shownNotificationIds);
        const toRemove = idsArray.slice(0, idsArray.length - 100);
        toRemove.forEach(id => shownNotificationIds.delete(id));
      }
    } catch (error) {
      // Silently fail - don't spam console
    }
  };
  
  return null; // This component doesn't render anything
}

export default NotificationListener;
