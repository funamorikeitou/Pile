import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from 'react';
import { usePilesContext } from './PilesContext';

const GitContext = createContext();

export const GitContextProvider = ({ children }) => {
  const { currentPile, updateCurrentPile } = usePilesContext();
  const [syncStatus, setSyncStatus] = useState('idle'); // 'idle' | 'syncing' | 'success' | 'error'
  const [lastSynced, setLastSynced] = useState(null);
  const [syncError, setSyncError] = useState(null);
  const debounceTimer = useRef(null);
  const syncNowRef = useRef(null);

  // Always keep ref pointing to the latest syncNow
  useEffect(() => {
    syncNowRef.current = syncNow;
  });

  // On pile load/switch, do an initial sync if enabled
  useEffect(() => {
    if (!currentPile?.githubSyncEnabled) return;
    syncNowRef.current?.();
  }, [currentPile?.path]);

  const getPAT = useCallback(async () => {
    if (!currentPile) return null;
    return window.electron.gitGetPAT(currentPile.name);
  }, [currentPile]);

  const setupSync = useCallback(
    async (repoUrl, pat) => {
      if (!currentPile) return { success: false, error: 'No pile selected' };
      setSyncStatus('syncing');
      setSyncError(null);

      // Store PAT
      await window.electron.gitSetPAT({ pileName: currentPile.name, pat });

      // Save repo to pile config
      const updatedPile = {
        ...currentPile,
        githubRepo: repoUrl,
        githubSyncEnabled: true,
      };
      updateCurrentPile(updatedPile);

      const result = await window.electron.gitSetup({
        pilePath: currentPile.path,
        repoUrl,
        pat,
      });

      if (result.success) {
        setSyncStatus('success');
        setLastSynced(new Date());
      } else {
        setSyncStatus('error');
        setSyncError(result.error);
      }

      return result;
    },
    [currentPile, updateCurrentPile]
  );

  const syncNow = useCallback(async () => {
    if (!currentPile?.githubSyncEnabled) return;
    const pat = await getPAT(); // may be null if using system git credentials — that's fine

    setSyncStatus('syncing');
    setSyncError(null);

    const result = await window.electron.gitSync({
      pilePath: currentPile.path,
      pat,
      repoUrl: currentPile.githubRepo ?? null, // optional — falls back to .git/config remote
    });

    if (result.success) {
      setSyncStatus('success');
      setLastSynced(new Date(result.timestamp));
    } else {
      setSyncStatus('error');
      setSyncError(result.error);
    }
  }, [currentPile, getPAT]);

  const scheduleSyncAfterSave = useCallback(() => {
    if (!currentPile?.githubSyncEnabled) return;
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      syncNowRef.current?.(); // always use the latest syncNow, not the closure
    }, 5000);
  }, [currentPile]);

  const value = {
    syncStatus,
    lastSynced,
    syncError,
    setupSync,
    syncNow,
    scheduleSyncAfterSave,
    getPAT,
  };

  return <GitContext.Provider value={value}>{children}</GitContext.Provider>;
};

export const useGitContext = () => useContext(GitContext);
