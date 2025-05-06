import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, updateDoc, doc, Timestamp, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { DEFAULT_PET_IMAGE } from '@/constants';

interface Notification {
  id: string;
  type: 'new_pet';
  petId: string;
  petName: string;
  ownerId: string;
  ownerName: string;
  createdAt: Timestamp;
  read: boolean;
  petPhoto?: string;
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Buscar notificações não lidas
    const q = query(
      collection(db, 'notifications'),
      where('read', '==', false)
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const notificationsPromises = snapshot.docs.map(async (snap) => {
        const notificationData = snap.data();
        // Buscar a foto do pet
        const petDoc = await getDoc(doc(db, 'pets', notificationData.petId));
        const petData = petDoc.data() as { photo?: string } | undefined;
        
        return {
          id: snap.id,
          ...notificationData,
          petPhoto: petData?.photo || DEFAULT_PET_IMAGE
        } as Notification;
      });

      const newNotifications = await Promise.all(notificationsPromises);
      setNotifications(newNotifications);
    });

    return () => unsubscribe();
  }, [user]);

  const markAsRead = async (notificationId: string) => {
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, {
        read: true
      });
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
    }
  };

  const unreadCount = notifications.length;

  return (
    <div className="relative">
      {/* Ícone de Notificação */}
      <button
        onClick={() => setShowNotifications(!showNotifications)}
        className="relative p-2 text-gray-600 hover:text-gray-800"
      >
        <span className="sr-only">Notificações</span>
        <svg
          className="h-6 w-6"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Painel de Notificações */}
      {showNotifications && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl z-50">
          <div className="p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Notificações</h3>
            {notifications.length === 0 ? (
              <p className="text-gray-500">Nenhuma notificação nova</p>
            ) : (
              <ul className="divide-y divide-gray-200">
                {notifications.map((notification) => (
                  <li
                    key={notification.id}
                    className="py-4 cursor-pointer hover:bg-gray-50"
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <img
                          src={notification.petPhoto || DEFAULT_PET_IMAGE}
                          alt={notification.petName}
                          className="h-12 w-12 rounded-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          Novo pet cadastrado!
                        </p>
                        <p className="text-sm text-gray-500">
                          {notification.petName} foi adicionado por {notification.ownerName}
                        </p>
                        <p className="text-xs text-gray-400">
                          {notification.createdAt.toDate().toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 