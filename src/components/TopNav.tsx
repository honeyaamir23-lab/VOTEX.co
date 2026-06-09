import { Bell, Zap, BellDot, CheckCircle2 } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { useEffect, useState, useRef } from 'react';
import { toast } from 'react-hot-toast';

export default function TopNav() {
  const { state, currentUser, userRequest } = useGame();
  const balance = currentUser?.balance || 0;
  
  const [isUpdating, setIsUpdating] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const prevBalanceRef = useRef(balance);
  const prevUnreadCountRef = useRef(0);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const unreadCount = state.notifications?.filter(n => !n.read).length || 0;

  useEffect(() => {
    if (unreadCount > prevUnreadCountRef.current) {
        // We have a new notification
        const latestNotif = state.notifications?.sort((a, b) => b.createdAt - a.createdAt)[0];
        if (latestNotif) {
             toast.success(latestNotif.message, { icon: '🔔' });
             if ('Notification' in window && Notification.permission === 'granted') {
                 new Notification('VOTEX Notification', { body: latestNotif.message });
             }
        }
    }
    prevUnreadCountRef.current = unreadCount;
  }, [unreadCount, state.notifications]);

  useEffect(() => {
    if (balance !== undefined && balance !== null) {
      if (balance > prevBalanceRef.current) {
        toast.success(`Account Credited: +${balance - prevBalanceRef.current} VTX`, {
          icon: '💰',
          duration: 4000,
        });
      }

      setIsUpdating(true);
      const timer = setTimeout(() => setIsUpdating(false), 800);
      prevBalanceRef.current = balance;
      return () => clearTimeout(timer);
    }
  }, [balance]);

  const toggleNotifications = () => {
    if (!showNotifications && unreadCount > 0) {
      userRequest('MARK_NOTIFICATIONS_READ', {});
    }
    setShowNotifications(!showNotifications);
  };

  return (
    <header className="flex items-center justify-between p-4 bg-[#0F131C] border-b border-gray-800 relative z-50">
      <div className="flex items-center gap-2">
        <Zap className="h-6 w-6 text-yellow-400 fill-yellow-400" />
        <h1 className="text-2xl font-black tracking-widest font-sans flex items-center">
          <span className="text-yellow-400">VO</span>
          <span className="text-[#10B981]">TEX</span>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 ml-2 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse -translate-y-[1px]"></span>
        </h1>
      </div>
      
      <div className="flex items-center gap-3 relative">
        <div className={`bg-[#1A1F2E] px-3 py-1.5 rounded-full border text-sm font-semibold transition-all duration-300 ${isUpdating ? 'border-emerald-500 text-emerald-400 scale-105 shadow-[0_0_12px_rgba(52,211,153,0.3)]' : 'border-gray-800 text-white'}`}>
          {balance.toLocaleString()} VTX
        </div>
        <button 
           onClick={toggleNotifications}
           className="flex items-center justify-center h-10 w-10 rounded-xl bg-[#1A1F2E] border border-gray-800 hover:bg-[#252B3B] hover:border-emerald-500/50 hover:shadow-[0_0_15px_rgba(52,211,153,0.2)] transition-all duration-300 relative group"
        >
          {unreadCount > 0 ? (
             <BellDot className="h-5 w-5 text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
          ) : (
             <Bell className="h-5 w-5 text-gray-400 group-hover:text-emerald-400 transition-colors" />
          )}
          {unreadCount > 0 && (
             <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-rose-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-black shadow-lg border border-red-400/50">
                {unreadCount}
             </span>
          )}
        </button>

        {showNotifications && (
           <div className="absolute top-12 right-0 w-80 max-h-96 overflow-y-auto bg-[#131823] border border-gray-800 shadow-2xl rounded-xl z-50 animate-in fade-in slide-in-from-top-2 p-2">
              <h3 className="px-3 py-2 text-xs font-bold uppercase tracking-widest text-gray-500 mb-1 border-b border-gray-800">Notifications</h3>
              {!state.notifications || state.notifications.length === 0 ? (
                 <p className="px-4 py-8 text-center text-sm text-gray-500">No notifications yet.</p>
              ) : (
                 <div className="space-y-1">
                    {state.notifications.sort((a, b) => b.createdAt - a.createdAt).map(notif => (
                       <div key={notif.id} className={`p-3 rounded-lg flex items-start gap-3 ${notif.read ? 'opacity-50 hover:opacity-100' : 'bg-[#1A1F2E]'} transition-colors`}>
                          <div className="mt-0.5">
                             <CheckCircle2 className={`w-4 h-4 ${notif.read ? 'text-gray-600' : 'text-emerald-400'}`} />
                          </div>
                          <div>
                             <p className="text-sm text-gray-200">{notif.message}</p>
                             <p className="text-xs text-gray-500 mt-1">{new Date(notif.createdAt).toLocaleString()}</p>
                          </div>
                       </div>
                    ))}
                 </div>
              )}
           </div>
        )}
      </div>
    </header>
  );
}
