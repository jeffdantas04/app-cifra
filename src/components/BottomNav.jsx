import React from 'react';
import { Home, Music2, ListMusic, Guitar, Settings } from 'lucide-react';

const tabs = [
  { id: 'home',     label: 'Início',    icon: Home      },
  { id: 'library',  label: 'Biblioteca', icon: Music2    },
  { id: 'setlists', label: 'Setlists',  icon: ListMusic },
  { id: 'chords',   label: 'Acordes',   icon: Guitar    },
  { id: 'settings', label: 'Config',    icon: Settings  },
];

export default function BottomNav({ current, onChange }) {
  return (
    <nav className="flex items-stretch bg-white dark:bg-gray-900
                    border-t border-gray-100 dark:border-gray-700
                    safe-bottom">
      {tabs.map(({ id, label, icon: Icon }) => {
        const active = current === id;
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 min-h-[56px]
                        transition-colors
                        ${active
                          ? 'text-primary-500'
                          : 'text-gray-500 dark:text-gray-500 active:text-gray-700 dark:active:text-gray-400'
                        }`}
          >
            <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
            <span className={`text-[9px] font-medium ${active ? 'text-primary-500' : ''}`}>
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
