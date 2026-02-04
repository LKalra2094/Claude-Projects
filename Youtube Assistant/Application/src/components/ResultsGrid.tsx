'use client';

import { RankedVideo } from '@/types';
import VideoCard from './VideoCard';

interface ResultsGridProps {
  videos: RankedVideo[];
  queryId: string;
  feedbackMap: { [videoId: string]: 'thumbs_up' | 'thumbs_down' | 'none' };
  onFeedback: (videoId: string, feedback: 'thumbs_up' | 'thumbs_down' | 'none') => void;
  onClick: (videoId: string, rank: number) => void;
}

export default function ResultsGrid({
  videos,
  queryId,
  feedbackMap,
  onFeedback,
  onClick,
}: ResultsGridProps) {
  return (
    <div style={styles.grid}>
      {videos.map((video, index) => (
        <VideoCard
          key={video.videoId}
          video={video}
          rank={index + 1}
          queryId={queryId}
          currentFeedback={feedbackMap[video.videoId]}
          onFeedback={onFeedback}
          onClick={onClick}
        />
      ))}
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '20px',
    width: '100%',
    maxWidth: '900px',
    margin: '0 auto',
  },
};
