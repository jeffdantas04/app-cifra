import React from 'react';

const TAG_COLORS = {
  Gospel: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  Adoração: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  MPB: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  Rock: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  Sertanejo: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  Pagode: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  Pop: 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300',
  Forró: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
};

const DEFAULT_COLOR = 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300';

export default function TagBadge({ tag, onClick, selected }) {
  const color = TAG_COLORS[tag] || DEFAULT_COLOR;
  return (
    <span
      onClick={onClick}
      className={`
        inline-block px-2.5 py-0.5 rounded-full text-xs font-medium
        ${color}
        ${onClick ? 'cursor-pointer' : ''}
        ${selected ? 'ring-2 ring-primary-500' : ''}
        transition-all
      `}
    >
      {tag}
    </span>
  );
}
