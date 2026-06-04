import React, { useState } from 'react';
import { Sun, Moon, Smartphone, Trash2, Info, ChevronRight, Tag, Plus, X, Check } from 'lucide-react';

// ── Theme definitions ─────────────────────────────────────────────────────────
const THEMES = [
  {
    id: 'default',
    label: 'Padrão',
    sub: 'Violeta',
    preview: 'linear-gradient(135deg, #120A33 0%, #7356E0 55%, #9C85FF 100%)',
  },
  {
    id: 'mono',
    label: 'Mono',
    sub: 'Preto & Branco',
    preview: 'linear-gradient(135deg, #050505 0%, #404040 35%, #A0A0A0 65%, #F5F5F5 100%)',
  },
];

// ── Sub-components ────────────────────────────────────────────────────────────
function SectionTitle({ children }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-widest
                  text-gray-400 dark:text-gray-600 px-4 mb-2">
      {children}
    </p>
  );
}

function SettingRow({ icon: Icon, label, description, children, onClick, danger }) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3.5 bg-white dark:bg-gray-800
                  border-b border-gray-100 dark:border-gray-700/50
                  ${onClick ? 'cursor-pointer active:bg-gray-50 dark:active:bg-gray-700' : ''}
                  ${danger ? 'text-red-500' : ''}`}
    >
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center
                       ${danger ? 'bg-red-50 dark:bg-red-900/20' : 'bg-gray-100 dark:bg-gray-700'}`}>
        <Icon size={18} className={danger ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'} />
      </div>
      <div className="flex-1">
        <p className={`text-sm font-medium ${danger ? 'text-red-500' : 'text-gray-900 dark:text-gray-100'}`}>
          {label}
        </p>
        {description && (
          <p className="text-xs text-gray-400 dark:text-gray-500">{description}</p>
        )}
      </div>
      {children && <div>{children}</div>}
      {onClick && !children && (
        <ChevronRight size={16} className="text-gray-300 dark:text-gray-600" />
      )}
    </div>
  );
}

// ── Theme card ────────────────────────────────────────────────────────────────
function ThemeCard({ theme: t, active, onSelect }) {
  return (
    <button
      onClick={() => onSelect(t.id)}
      className={`relative rounded-2xl overflow-hidden h-[88px]
                  transition-all duration-200 active:scale-95
                  ${active
                    ? 'ring-[3px] ring-primary-500 shadow-lg'
                    : 'opacity-80 active:opacity-100'
                  }`}
    >
      {/* Gradient swatch */}
      <div
        className="absolute inset-0"
        style={{ background: t.preview }}
      />

      {/* Bottom overlay + label */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 px-3 py-2
                      flex items-end justify-between gap-1">
        <div className="text-left">
          <p className="text-[11px] font-black text-white leading-none">{t.label}</p>
          <p className="text-[9px] text-white/70 mt-0.5 leading-none">{t.sub}</p>
        </div>
        {active && (
          <div className="flex-shrink-0 w-5 h-5 rounded-full bg-white
                          flex items-center justify-center shadow-md">
            <Check size={11} className="text-gray-900 stroke-[3]" />
          </div>
        )}
      </div>
    </button>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────
export default function SettingsScreen({
  darkMode,
  onToggleDarkMode,
  theme = 'default',
  onThemeChange,
  songs,
  setlists,
  onClearAll,
  tags = [],
  onUpdateTags,
}) {
  const [newTag, setNewTag] = useState('');

  const handleAddTag = () => {
    const trimmed = newTag.trim();
    if (!trimmed || tags.includes(trimmed)) return;
    onUpdateTags([...tags, trimmed]);
    setNewTag('');
  };

  const handleRemoveTag = (tag) => {
    onUpdateTags(tags.filter(t => t !== tag));
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-950">

      {/* ── Header ── */}
      <div className="px-4 py-4 bg-white dark:bg-gray-900
                      border-b border-gray-200 dark:border-gray-800">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          Configurações
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto">

        {/* ── Aparência ── */}
        <div className="mt-4">
          <SectionTitle>Aparência</SectionTitle>

          {/* Theme grid */}
          <div className="mx-4 mb-3 grid grid-cols-2 gap-2.5">
            {THEMES.map(t => (
              <ThemeCard
                key={t.id}
                theme={t}
                active={theme === t.id}
                onSelect={onThemeChange}
              />
            ))}
          </div>

          {/* Dark mode toggle */}
          <SettingRow
            icon={darkMode ? Moon : Sun}
            label="Modo escuro"
            description={darkMode ? 'Ativado' : 'Desativado'}
          >
            <button
              onClick={onToggleDarkMode}
              className={`relative inline-flex h-7 w-12 items-center rounded-full
                          transition-colors
                          ${darkMode ? 'bg-primary-500' : 'bg-gray-300'}`}
            >
              <span
                className={`inline-block h-5 w-5 rounded-full bg-white shadow
                            transform transition-transform
                            ${darkMode ? 'translate-x-6' : 'translate-x-1'}`}
              />
            </button>
          </SettingRow>
        </div>

        {/* ── Estatísticas ── */}
        <div className="mt-4">
          <SectionTitle>Estatísticas</SectionTitle>
          <div className="grid grid-cols-2 gap-3 px-4 pb-2">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 text-center">
              <p className="text-3xl font-bold text-primary-500">{songs.length}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {songs.length === 1 ? 'Música' : 'Músicas'}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 text-center">
              <p className="text-3xl font-bold text-primary-500">{setlists.length}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Setlists</p>
            </div>
          </div>
        </div>

        {/* ── Sobre ── */}
        <div className="mt-4">
          <SectionTitle>Sobre</SectionTitle>
          <SettingRow
            icon={Smartphone}
            label="App Cifra"
            description="Versão 1.0.0 · Mobile First"
          />
          <SettingRow
            icon={Info}
            label="Formato das cifras"
            description="Use [Acorde] antes da sílaba correspondente"
          />
        </div>

        {/* ── Categorias ── */}
        <div className="mt-4">
          <SectionTitle>Categorias</SectionTitle>
          <div className="mx-4 bg-white dark:bg-gray-800 rounded-2xl overflow-hidden">
            {tags.length === 0 && (
              <p className="text-sm text-gray-400 dark:text-gray-500 px-4 py-3">
                Nenhuma categoria criada.
              </p>
            )}
            {tags.map(tag => (
              <div
                key={tag}
                className="flex items-center gap-3 px-4 py-3
                           border-b border-gray-100 dark:border-gray-700/50"
              >
                <div className="w-7 h-7 rounded-lg bg-primary-50 dark:bg-primary-900/30
                                flex items-center justify-center flex-shrink-0">
                  <Tag size={13} className="text-primary-500 dark:text-primary-400" />
                </div>
                <span className="flex-1 text-sm text-gray-800 dark:text-gray-200">{tag}</span>
                <button
                  onClick={() => handleRemoveTag(tag)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg
                             text-gray-300 dark:text-gray-600
                             active:bg-red-50 dark:active:bg-red-900/20
                             active:text-red-500 transition-colors"
                >
                  <X size={15} />
                </button>
              </div>
            ))}

            {/* Add new tag */}
            <div className="flex items-center gap-2 px-4 py-2.5">
              <input
                type="text"
                value={newTag}
                onChange={e => setNewTag(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddTag()}
                placeholder="Nova categoria..."
                className="flex-1 text-sm bg-transparent
                           text-gray-900 dark:text-gray-100
                           placeholder:text-gray-400
                           focus:outline-none py-1"
              />
              <button
                onClick={handleAddTag}
                disabled={!newTag.trim() || tags.includes(newTag.trim())}
                className={`w-7 h-7 flex items-center justify-center rounded-lg
                            transition-colors flex-shrink-0
                            ${newTag.trim() && !tags.includes(newTag.trim())
                              ? 'bg-primary-500 text-white active:bg-primary-600'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-300 dark:text-gray-600'
                            }`}
              >
                <Plus size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* ── Dados ── */}
        <div className="mt-4">
          <SectionTitle>Dados</SectionTitle>
          <SettingRow
            icon={Trash2}
            label="Limpar todos os dados"
            description="Remove todas as músicas e setlists"
            danger
            onClick={() => {
              if (confirm('Tem certeza? Esta ação não pode ser desfeita.')) {
                onClearAll();
              }
            }}
          />
        </div>

        <div className="h-8" />
      </div>
    </div>
  );
}
