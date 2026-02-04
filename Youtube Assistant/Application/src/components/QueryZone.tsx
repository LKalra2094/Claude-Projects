'use client';

import { useState } from 'react';

interface QueryZoneProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
}

export default function QueryZone({ onSearch, isLoading }: QueryZoneProps) {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !isLoading) {
      onSearch(query.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="What do you want to learn? e.g., 'how transformers work in machine learning'"
        style={styles.input}
        disabled={isLoading}
      />
      <button
        type="submit"
        disabled={!query.trim() || isLoading}
        style={{
          ...styles.button,
          opacity: !query.trim() || isLoading ? 0.5 : 1,
          cursor: !query.trim() || isLoading ? 'not-allowed' : 'pointer',
        }}
      >
        {isLoading ? 'Searching...' : 'Find Videos'}
      </button>
    </form>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  form: {
    display: 'flex',
    gap: '12px',
    width: '100%',
    maxWidth: '800px',
    margin: '0 auto',
  },
  input: {
    flex: 1,
    padding: '16px 20px',
    fontSize: '16px',
    border: '2px solid var(--card-border)',
    borderRadius: '12px',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  button: {
    padding: '16px 32px',
    fontSize: '16px',
    fontWeight: 600,
    color: 'white',
    backgroundColor: 'var(--primary)',
    border: 'none',
    borderRadius: '12px',
    transition: 'background-color 0.2s',
    whiteSpace: 'nowrap',
  },
};
