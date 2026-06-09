import { Home, Users, Plus, Trophy, User } from 'lucide-react';
import { NavLink } from 'react-router-dom';

export default function BottomNav() {
  const navItems = [
    { icon: <Home className="h-6 w-6" />, label: 'Home', path: '/' },
    { icon: <Users className="h-6 w-6" />, label: 'Players', path: '/players' },
    { 
      icon: <Plus className="h-8 w-8 text-black" />, 
      label: 'Battle', 
      path: '/battle/new',
      isCenter: true 
    },
    { icon: <Trophy className="h-6 w-6" />, label: 'Top', path: '/top' },
    { icon: <User className="h-6 w-6" />, label: 'Me', path: '/me' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[40] bg-[#0F131C] border-t border-gray-800/80 px-6 py-2 pb-4 backdrop-blur-md">
      <div className="flex justify-between items-center relative">
        {navItems.map((item, index) => {
          if (item.isCenter) {
            return (
              <NavLink 
                key={index}
                to={item.path}
                className="flex flex-col items-center justify-center gap-1 -mt-8"
              >
                <div className="bg-[#10B981] h-14 w-14 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/20 active:scale-95 transition-transform">
                   {item.icon}
                </div>
                <span className="text-xs font-medium text-gray-400">{item.label}</span>
              </NavLink>
            );
          }

          return (
            <NavLink 
              key={index}
              to={item.path}
              className={({ isActive }) => 
                `flex flex-col items-center gap-1 transition-colors ${
                  isActive ? 'text-[#10B981]' : 'text-gray-400 hover:text-gray-300'
                }`
              }
            >
              {item.icon}
              <span className="text-[10px] font-medium">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
