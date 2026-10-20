import React from 'react';
import { LayoutDashboard, Calendar, Briefcase, Wallet } from 'lucide-react';

export type NavTab = 'dashboard' | 'appointments' | 'agencies' | 'finance';

interface BottomNavProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  unpaidCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  unpaidCount = 0
}) => {
  const tabs = [
    { id: 'dashboard' as NavTab, label: 'Oggi', icon: LayoutDashboard },
    { id: 'appointments' as NavTab, label: 'Turni', icon: Calendar },
    { id: 'finance' as NavTab, label: 'Guadagni', icon: Wallet, badge: unpaidCount > 0 ? unpaidCount : null },
    { id: 'agencies' as NavTab, label: 'Agenzie', icon: Briefcase },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 pb-safe shadow-lg">
      <div className="max-w-md mx-auto grid grid-cols-4 items-center h-16 px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`min-h-[44px] min-w-[44px] flex flex-col items-center justify-center relative py-1 transition-colors ${
                isActive ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110 stroke-[2.2]' : 'stroke-[1.8]'}`} />
                {tab.badge && (
                  <span className="absolute -top-1 -right-2 bg-amber-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full leading-tight">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-medium tracking-tight mt-1 truncate ${isActive ? 'font-semibold' : ''}`}>
                {tab.label}
              </span>
              {isActive && (
                <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
