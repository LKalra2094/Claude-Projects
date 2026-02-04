'use client';

import { useState } from 'react';
import { RankedVideo } from '@/types';
import ScoreBreakdown from './ScoreBreakdown';

interface VideoCardProps {
  video: RankedVideo;
  rank: number;
  queryId: string;
  onFeedback: (videoId: string, feedback: 'thumbs_up' | 'thumbs_down' | 'none') => void;
  onClick: (videoId: string, rank: number) => void;
  currentFeedback?: 'thumbs_up' | 'thumbs_down' | 'none';
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

function formatNumber(num: number): string {
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1) + 'M';
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(1) + 'K';
  }
  return num.toString();
}

function getScoreColor(score: number): string {
  if (score >= 0.6) return 'var(--score-high)';
  if (score >= 0.4) return 'var(--score-medium)';
  return 'var(--score-low)';
}

export default function VideoCard({
  video,
  rank,
  queryId,
  onFeedback,
  onClick,
  currentFeedback,
}: VideoCardProps) {
  const [showBreakdown, setShowBreakdown] = useState(false);

  const handleThumbnailClick = () => {
    onClick(video.videoId, rank);
    window.open(`https://www.youtube.com/watch?v=${video.videoId}`, '_blank');
  };

  const handleFeedbackClick = (type: 'thumbs_up' | 'thumbs_down') => {
    if (currentFeedback === type) {
      onFeedback(video.videoId, 'none');
    } else {
      onFeedback(video.videoId, type);
    }
  };

  return (
    <div style={styles.card}>
      <div style={styles.thumbnailContainer} onClick={handleThumbnailClick}>
        <img
          src={video.thumbnailUrl}
          alt={video.title}
          style={styles.thumbnail}
        />
        <span style={styles.duration}>{formatDuration(video.durationSeconds)}</span>
        <span style={styles.rank}>#{rank}</span>
      </div>

      <div style={styles.content}>
        <h3 style={styles.title} title={video.title}>
          {video.title}
        </h3>

        <p style={styles.channel}>{video.channelTitle}</p>

        <div style={styles.stats}>
          <span>{formatNumber(video.viewCount)} views</span>
          <span>{formatNumber(video.commentCount)} comments</span>
          <span>{formatNumber(video.subscriberCount)} subs</span>
        </div>

        <div style={styles.footer}>
          <div
            style={styles.scoreContainer}
            onMouseEnter={() => setShowBreakdown(true)}
            onMouseLeave={() => setShowBreakdown(false)}
          >
            <span style={styles.scoreLabel}>Score:</span>
            <span style={{ ...styles.score, color: getScoreColor(video.compositeScore) }}>
              {(video.compositeScore * 100).toFixed(0)}
            </span>
            {showBreakdown && (
              <ScoreBreakdown
                normalizedSignals={video.normalizedSignals}
                compositeScore={video.compositeScore}
              />
            )}
          </div>

          <div style={styles.feedback}>
            <button
              onClick={() => handleFeedbackClick('thumbs_up')}
              style={{
                ...styles.feedbackButton,
                backgroundColor: currentFeedback === 'thumbs_up' ? '#dcfce7' : 'transparent',
              }}
              title="Good result"
            >
              👍
            </button>
            <button
              onClick={() => handleFeedbackClick('thumbs_down')}
              style={{
                ...styles.feedbackButton,
                backgroundColor: currentFeedback === 'thumbs_down' ? '#fee2e2' : 'transparent',
              }}
              title="Bad result"
            >
              👎
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  card: {
    backgroundColor: 'var(--card-background)',
    borderRadius: '12px',
    border: '1px solid var(--card-border)',
    overflow: 'hidden',
    transition: 'box-shadow 0.2s',
  },
  thumbnailContainer: {
    position: 'relative',
    cursor: 'pointer',
    aspectRatio: '16/9',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },
  duration: {
    position: 'absolute',
    bottom: '8px',
    right: '8px',
    backgroundColor: 'rgba(0,0,0,0.8)',
    color: 'white',
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 500,
  },
  rank: {
    position: 'absolute',
    top: '8px',
    left: '8px',
    backgroundColor: 'var(--primary)',
    color: 'white',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 600,
  },
  content: {
    padding: '12px',
  },
  title: {
    fontSize: '14px',
    fontWeight: 600,
    lineHeight: 1.3,
    marginBottom: '6px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
  },
  channel: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
    marginBottom: '8px',
  },
  stats: {
    display: 'flex',
    gap: '12px',
    fontSize: '12px',
    color: 'var(--text-muted)',
    marginBottom: '10px',
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scoreContainer: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    cursor: 'help',
  },
  scoreLabel: {
    fontSize: '12px',
    color: 'var(--text-muted)',
  },
  score: {
    fontSize: '16px',
    fontWeight: 700,
  },
  feedback: {
    display: 'flex',
    gap: '4px',
  },
  feedbackButton: {
    background: 'none',
    border: 'none',
    fontSize: '18px',
    padding: '4px 8px',
    borderRadius: '4px',
    transition: 'background-color 0.2s',
  },
};
