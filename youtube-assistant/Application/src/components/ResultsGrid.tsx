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
    <>
      <style>{`
        .results-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 20px;
          width: 100%;
          max-width: 1400px;
          margin: 0 auto;
        }
        @media (max-width: 1200px) {
          .results-grid { grid-template-columns: repeat(3, 1fr); }
        }
        @media (max-width: 768px) {
          .results-grid { grid-template-columns: 1fr; }
        }
      `}</style>
      <div className="results-grid">
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
    </>
  );
}

