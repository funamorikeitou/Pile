import { useState, useRef, useEffect } from 'react';
import {
  SettingsIcon,
  CrossIcon,
  ReflectIcon,
  RefreshIcon,
  DiscIcon,
  DownloadIcon,
  FlameIcon,
  InfoIcon,
  SearchIcon,
  PaperclipIcon,
  HighlightIcon,
  RelevantIcon,
  ChevronRightIcon,
} from 'renderer/icons';
import styles from './OptionsBar.module.scss';
import * as Switch from '@radix-ui/react-switch';

export default function OptionsBar({ options, setOptions, onSubmit, highlights }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const highlightEntries = highlights ? Array.from(highlights.entries()) : [];
  const flipValue = (e) => {
    const key = e.target.name;
    setOptions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleRecent = (e) => {
    setOptions((prev) => ({ ...prev, sortOrder: e.target.name }));
  };

  const toggleSearchMode = () => {
    setOptions((prev) => ({ ...prev, semanticSearch: !prev.semanticSearch }));
  };

  const selectHighlightType = (type) => {
    setOptions((prev) => ({ ...prev, highlightType: type }));
    setDropdownOpen(false);
  };

  const getHighlightButtonLabel = () => {
    if (!options.highlightType) return 'All Types';
    if (options.highlightType === 'any') return 'Any Highlight';
    return options.highlightType;
  };

  const getHighlightColor = () => {
    if (!options.highlightType || options.highlightType === 'any') return null;
    const highlight = highlights?.get(options.highlightType);
    return highlight?.color;
  };

  return (
    <div className={styles.container}>
      <div className={styles.left}>
        <button
          className={`${styles.button} ${
            options.sortOrder === 'relevance' && styles.active
          }`}
          name={'relevance'}
          onClick={toggleRecent}
        >
          <RelevantIcon className={styles.icon} /> Relevance
        </button>
        <button
          className={`${styles.button} ${
            options.sortOrder === 'mostRecent' && styles.active
          }`}
          name={'mostRecent'}
          onClick={toggleRecent}
        >
          ↑ Recent
        </button>
        <button
          className={`${styles.button} ${
            options.sortOrder === 'oldest' && styles.active
          }`}
          name={'oldest'}
          onClick={toggleRecent}
        >
          ↓ Oldest
        </button>
        <div className={styles.sep}>•</div>
        <div className={styles.dropdown} ref={dropdownRef}>
          <button
            className={`${styles.button} ${
              options.highlightType && styles.active
            }`}
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            {getHighlightColor() && (
              <span
                className={styles.highlightDot}
                style={{ backgroundColor: getHighlightColor() }}
              />
            )}
            {!getHighlightColor() && <HighlightIcon className={styles.icon} />}
            {getHighlightButtonLabel()}
            <ChevronRightIcon className={`${styles.chevron} ${dropdownOpen ? styles.open : ''}`} />
          </button>
          {dropdownOpen && (
            <div className={styles.dropdownMenu}>
              <button
                className={`${styles.dropdownItem} ${!options.highlightType ? styles.selected : ''}`}
                onClick={() => selectHighlightType(null)}
              >
                All Types
              </button>
              <button
                className={`${styles.dropdownItem} ${options.highlightType === 'any' ? styles.selected : ''}`}
                onClick={() => selectHighlightType('any')}
              >
                <HighlightIcon className={styles.icon} />
                Any Highlight
              </button>
              <div className={styles.dropdownSep} />
              {highlightEntries.map(([name, data]) => (
                <button
                  key={name}
                  className={`${styles.dropdownItem} ${options.highlightType === name ? styles.selected : ''}`}
                  onClick={() => selectHighlightType(name)}
                >
                  <span
                    className={styles.highlightDot}
                    style={{ backgroundColor: data.color }}
                  />
                  {name}
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          className={`${styles.button} ${
            options.hasAttachments && styles.active
          }`}
          name={'hasAttachments'}
          onClick={flipValue}
        >
          <PaperclipIcon className={styles.icon} /> Attachments
        </button>
      </div>
      <div className={styles.right}>
        <div className={styles.switch}>
          <label className={styles.Label} htmlFor="semantic-search">
            Semantic
          </label>
          <Switch.Root
            id={'semantic-search'}
            className={styles.SwitchRoot}
            checked={options.semanticSearch}
            onCheckedChange={toggleSearchMode}
          >
            <Switch.Thumb className={styles.SwitchThumb} />
          </Switch.Root>
        </div>
      </div>
    </div>
  );
}
