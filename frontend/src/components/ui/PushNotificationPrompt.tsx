'use client';

import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';

const urlBase64ToUint8Array = (base64String: string) => {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

export default function PushNotificationPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      if (Notification.permission === 'default') {
        const timer = setTimeout(() => setShowPrompt(true), 5000);
        return () => clearTimeout(timer);
      } else if (Notification.permission === 'granted') {
        navigator.serviceWorker.register('/sw.js').then(async (registration) => {
          const subscription = await registration.pushManager.getSubscription();
          const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
          
          if (publicVapidKey) {
            const activeSub = subscription || await registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
            });
            
            await fetch('/api/push/subscribe', {
              method: 'POST',
              body: JSON.stringify({ subscription: activeSub }),
              headers: { 'Content-Type': 'application/json' }
            });
          }
        }).catch(console.error);
      }
    }
  }, []);

  const handleSubscribe = async () => {
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setShowPrompt(false);
        return;
      }

      const registration = await navigator.serviceWorker.register('/sw.js');
      
      const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!publicVapidKey) {
        console.error('VAPID public key not found');
        return;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
      });

      await fetch('/api/push/subscribe', {
        method: 'POST',
        body: JSON.stringify({ subscription }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      setShowPrompt(false);
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      setShowPrompt(false);
    }
  };

  if (!showPrompt) return null;

  return (
    <div
      className="fixed bottom-4 right-4 max-w-sm bg-[#161B22] border border-[#30363D] rounded p-4 z-50 flex items-start gap-4"
    >
      <div className="bg-[#1C2128] p-2 rounded text-[#8B949E] mt-1">
        <Bell className="w-5 h-5" />
      </div>
      <div className="flex-1">
        <h3 className="font-semibold text-[#E6EDF3] mb-1 tracking-tight">Never miss a contest</h3>
        <p className="text-sm text-[#8B949E] mb-3">
          Get notified 30 minutes before any upcoming contest starts.
        </p>
        <div className="flex gap-2">
          <button
            onClick={handleSubscribe}
            className="bg-[#E6EDF3] text-[#0D1117] text-sm font-medium py-1.5 px-3 rounded transition-colors duration-100 hover:bg-white"
          >
            Enable
          </button>
          <button
            onClick={() => setShowPrompt(false)}
            className="bg-[#161B22] border border-[#30363D] hover:bg-[#1C2128] text-[#8B949E] hover:text-[#E6EDF3] text-sm font-medium py-1.5 px-3 rounded transition-colors duration-100"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
