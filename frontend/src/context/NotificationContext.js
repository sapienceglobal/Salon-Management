'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { toast } from 'react-hot-toast';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user || !user.business_id) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    // Connect to the backend
    const socketInstance = io(process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:5000', {
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });

    setSocket(socketInstance);

    socketInstance.on('connect', () => {
      console.log('Socket connected:', socketInstance.id);
      socketInstance.emit('join_business_room', user.business_id);
    });

    socketInstance.on('new_lead', (leadData) => {
      console.log('New lead received via socket:', leadData);
      
      const newNotification = {
        id: `lead_${leadData.id || Date.now()}`,
        title: 'New Lead Arrived!',
        message: `${leadData.name} has submitted a new enquiry from ${leadData.source || 'Website'}.`,
        type: 'new_lead',
        data: leadData,
        isRead: false,
        timestamp: new Date(),
      };

      setNotifications((prev) => [newNotification, ...prev]);
      setUnreadCount((prev) => prev + 1);

      toast.success(
        <div>
          <b>{newNotification.title}</b>
          <p className="text-sm">{newNotification.message}</p>
        </div>,
        {
          duration: 5000,
          position: 'top-right',
        }
      );
    });

    socketInstance.on('lead_assigned', (data) => {
      const isAssignedToMe = user?.id && Number(user.id) === Number(data.staff_id);
      const newNotification = {
        id: `assign_${data.lead_id}_${Date.now()}`,
        title: isAssignedToMe ? 'Lead Assigned to You!' : 'Lead Assigned to Staff',
        message: `${data.lead_name} has been assigned ${isAssignedToMe ? 'to you' : 'to staff'} for follow-up.${data.notes ? ` Note: "${data.notes}"` : ''}`,
        type: 'lead_assigned',
        data,
        isRead: false,
        timestamp: new Date(),
      };

      setNotifications((prev) => [newNotification, ...prev]);
      setUnreadCount((prev) => prev + 1);

      toast(
        (t) => (
          <div>
            <b className="text-slate-900 font-bold">{newNotification.title}</b>
            <p className="text-xs text-slate-600 mt-0.5">{newNotification.message}</p>
          </div>
        ),
        { icon: '📋', duration: 5000, position: 'top-right' }
      );
    });

    socketInstance.on('lead_updated', (updatedLead) => {
      if (updatedLead?.next_follow_up || updatedLead?.follow_up_date) {
        const notif = {
          id: `followup_${updatedLead.id}_${Date.now()}`,
          title: 'Follow-Up Scheduled',
          message: `Follow-up for ${updatedLead.name} scheduled for ${updatedLead.next_follow_up || updatedLead.follow_up_date}.`,
          type: 'follow_up_scheduled',
          data: updatedLead,
          isRead: false,
          timestamp: new Date(),
        };
        setNotifications((prev) => [notif, ...prev]);
        setUnreadCount((prev) => prev + 1);
      }
    });

    return () => {
      socketInstance.disconnect();
    };
  }, [user]);

  const markAsRead = useCallback((id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  }, []);

  const value = {
    socket,
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotification = () => useContext(NotificationContext);
