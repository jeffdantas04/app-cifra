import React, { useState, useEffect } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { INITIAL_SONGS, INITIAL_SETLISTS, INITIAL_TAGS } from './data/songs';

import BottomNav from './components/BottomNav';
import HomeScreen from './screens/HomeScreen';
import LibraryScreen from './screens/LibraryScreen';
import SongViewScreen from './screens/SongViewScreen';
import AddEditSongScreen from './screens/AddEditSongScreen';
import SetlistsScreen from './screens/SetlistsScreen';
import ChordDictionaryScreen from './screens/ChordDictionaryScreen';
import SettingsScreen from './screens/SettingsScreen';

export default function App() {
  const [darkMode, setDarkMode] = useLocalStorage('darkMode', true);
  const [theme,    setTheme]    = useLocalStorage('theme', 'default');
  const [songs, setSongs] = useLocalStorage('songs', INITIAL_SONGS);
  const [setlists, setSetlists] = useLocalStorage('setlists', INITIAL_SETLISTS);
  const [customTags, setCustomTags] = useLocalStorage('tags', INITIAL_TAGS);
  const [activeTab, setActiveTab] = useState('home');
  const [openSetlistId, setOpenSetlistId] = useState(null);

  // Navigation stack: { screen, props }
  const [navStack, setNavStack] = useState([]);

  // Apply dark-mode class
  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) root.classList.add('dark');
    else root.classList.remove('dark');
  }, [darkMode]);

  // Apply theme data-attribute (drives CSS custom properties in index.css)
  const VALID_THEMES = ['default', 'mono'];
  useEffect(() => {
    const root = document.documentElement;
    const resolved = VALID_THEMES.includes(theme) ? theme : 'default';
    if (resolved !== 'default') {
      root.dataset.theme = resolved;
    } else {
      delete root.dataset.theme;
    }
  }, [theme]);

  // Navigation helpers
  const push = (screen, props = {}) => {
    setNavStack(prev => [...prev, { screen, props }]);
  };

  const pop = () => {
    setNavStack(prev => prev.slice(0, -1));
  };

  // Song actions
  const handleSelectSong = (song) => push('songView', { song });

  const handleAddSong = () => push('addSong', {});

  const handleEditSong = (song) => {
    pop();
    push('editSong', { song });
  };

  const handleSaveSong = (song) => {
    setSongs(prev => {
      const exists = prev.find(s => s.id === song.id);
      if (exists) return prev.map(s => s.id === song.id ? song : s);
      return [...prev, song];
    });
    pop();
  };

  const handleDeleteSong = (songId) => {
    if (!confirm('Excluir esta música?')) return;
    setSongs(prev => prev.filter(s => s.id !== songId));
    pop();
  };

  const handleDeleteSongs = (ids) => {
    const idSet = new Set(ids);
    setSongs(prev => prev.filter(s => !idSet.has(s.id)));
  };

  // Setlist actions
  const handleCreateSetlist = (name) => {
    const newSetlist = {
      id: Date.now().toString(),
      name,
      songIds: [],
      createdAt: new Date().toISOString(),
    };
    setSetlists(prev => [...prev, newSetlist]);
  };

  const handleUpdateSetlist = (updated) => {
    setSetlists(prev => prev.map(sl => sl.id === updated.id ? updated : sl));
  };

  const handleDeleteSetlist = (id) => {
    if (!confirm('Excluir este setlist?')) return;
    setSetlists(prev => prev.filter(sl => sl.id !== id));
  };

  const handleAddToSetlist = (song, setlistId) => {
    setSetlists(prev => prev.map(sl => {
      if (sl.id !== setlistId) return sl;
      const alreadyIn = sl.songIds.includes(song.id);
      return {
        ...sl,
        songIds: alreadyIn
          ? sl.songIds.filter(id => id !== song.id)
          : [...sl.songIds, song.id],
      };
    }));
  };

  const handleCreateAndAddToSetlist = (name, song) => {
    const newSetlist = {
      id: Date.now().toString(),
      name: name.trim(),
      songIds: song ? [song.id] : [],
      createdAt: new Date().toISOString(),
    };
    setSetlists(prev => [...prev, newSetlist]);
  };

  const handleClearAll = () => {
    setSongs([]);
    setSetlists([]);
  };

  // Tag actions
  const handleUpdateTags = (newTags) => setCustomTags(newTags);

  // Determine what to render
  const currentNav = navStack[navStack.length - 1];

  if (currentNav) {
    const { screen, props } = currentNav;

    if (screen === 'songView') {
      const song = songs.find(s => s.id === props.song.id) || props.song;
      return (
        <div className="h-full">
          <SongViewScreen
            song={song}
            setlists={setlists}
            onBack={pop}
            onEdit={handleEditSong}
            onDelete={handleDeleteSong}
            onAddToSetlist={handleAddToSetlist}
            onCreateAndAddToSetlist={handleCreateAndAddToSetlist}
          />
        </div>
      );
    }

    if (screen === 'addSong') {
      return (
        <div className="h-full">
          <AddEditSongScreen
            onSave={handleSaveSong}
            onBack={pop}
            allTags={customTags}
          />
        </div>
      );
    }

    if (screen === 'editSong') {
      return (
        <div className="h-full">
          <AddEditSongScreen
            song={props.song}
            onSave={handleSaveSong}
            onBack={pop}
            allTags={customTags}
          />
        </div>
      );
    }
  }

  // Main tab screens
  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-950">
      <div className="flex-1 overflow-hidden">
        {activeTab === 'home' && (
          <HomeScreen
            songs={songs}
            setlists={setlists}
            onSelectSong={handleSelectSong}
            onAddSong={handleAddSong}
            onGoToLibrary={() => setActiveTab('library')}
            onGoToSetlists={() => { setOpenSetlistId(null); setActiveTab('setlists'); }}
            onSelectSetlist={(id) => { setOpenSetlistId(id); setActiveTab('setlists'); }}
            onCreateSetlist={handleCreateSetlist}
            darkMode={darkMode}
            onToggleDarkMode={() => setDarkMode(d => !d)}
          />
        )}
        {activeTab === 'library' && (
          <LibraryScreen
            songs={songs}
            setlists={setlists}
            onSelectSong={handleSelectSong}
            onAddSong={handleAddSong}
            onDeleteSongs={handleDeleteSongs}
          />
        )}
        {activeTab === 'setlists' && (
          <SetlistsScreen
            setlists={setlists}
            songs={songs}
            onCreateSetlist={handleCreateSetlist}
            onUpdateSetlist={handleUpdateSetlist}
            onDeleteSetlist={handleDeleteSetlist}
            initialSelectedId={openSetlistId}
            onSelectSong={handleSelectSong}
          />
        )}
        {activeTab === 'chords' && (
          <ChordDictionaryScreen />
        )}
        {activeTab === 'settings' && (
          <SettingsScreen
            darkMode={darkMode}
            onToggleDarkMode={() => setDarkMode(d => !d)}
            theme={theme}
            onThemeChange={setTheme}
            songs={songs}
            setlists={setlists}
            onClearAll={handleClearAll}
            tags={customTags}
            onUpdateTags={handleUpdateTags}
          />
        )}
      </div>
      <BottomNav
        current={activeTab}
        onChange={(tab) => {
          if (tab === 'setlists') setOpenSetlistId(null);
          setActiveTab(tab);
        }}
      />
    </div>
  );
}
