import { useState, useEffect } from 'react';
import { useGitContext } from 'renderer/context/GitContext';
import { usePilesContext } from 'renderer/context/PilesContext';
import styles from './SyncIndicator.module.scss';

function timeAgo(date) {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  return `${Math.floor(minutes / 60)}h ago`;
}

export default function SyncIndicator() {
  const { syncStatus, lastSynced, syncError } = useGitContext();
  const { currentPile } = usePilesContext();
  const [, setTick] = useState(0);

  // Re-render every 15s to keep "X ago" fresh
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 15000);
    return () => clearInterval(id);
  }, []);

  if (!currentPile?.githubSyncEnabled) return null;

  if (syncStatus === 'syncing') {
    return (
      <div className={styles.indicator}>
        <span className={`${styles.dot} ${styles.syncing}`} />
        <span className={styles.label}>syncing</span>
      </div>
    );
  }

  if (syncStatus === 'error') {
    return (
      <div className={styles.indicator} title={syncError}>
        <span className={`${styles.dot} ${styles.error}`} />
        <span className={styles.label}>sync failed</span>
      </div>
    );
  }

  if (syncStatus === 'success' && lastSynced) {
    return (
      <div className={styles.indicator}>
        <span className={`${styles.dot} ${styles.success}`} />
        <span className={styles.label}>synced {timeAgo(lastSynced)}</span>
      </div>
    );
  }

  // idle but enabled — show a neutral dot so user knows it's set up
  return (
    <div className={styles.indicator}>
      <span className={`${styles.dot} ${styles.idle}`} />
    </div>
  );
}
