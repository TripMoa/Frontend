interface Story {
  id: number;
  title: string;
  description: string;
  image: string;
  author: string;
  authorAvatar: string;
  destination: string;
  duration: string;
  budget: string;
  date: string;
  likes: number;
  comments: number;
  follows: number;
  views: string;
  tags: string[];
}

interface StoryCardProps {
  story: Story;
  onCardClick: (story: Story) => void;
}

function StoryCard({ story, onCardClick }: StoryCardProps) {
  return (
    <div className="story-card" onClick={() => onCardClick(story)}>
      <img className="story-image" src={story.image} alt={story.title} />
      <div className="story-stats-badge">
        <span>{story.views}</span>
      </div>
      
      <div className="story-content">
        <div className="story-header">
          <div className="author-avatar">{story.authorAvatar}</div>
          <div className="author-info">
            <div className="author-name">{story.author}</div>
          </div>
        </div>
        
        <div className="story-title">{story.title}</div>
        <div className="story-description">{story.description}</div>
        
        <div className="story-tags">
          {story.tags.map((tag, index) => (
            <span key={index} className="story-tag">{tag}</span>
          ))}
        </div>

        <div className="story-stats-simple">
          <div className="stat-simple-item">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
            <span>LIKES</span>
          </div>
          <div className="stat-simple-item">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
            </svg>
            <span>FOLLOW THIS</span>
          </div>
          <div className="stat-simple-item">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12c0 1.54.36 3 .97 4.29L2 22l5.71-.97C9 21.64 10.46 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18c-1.38 0-2.68-.3-3.86-.83l-.28-.15-2.86.49.49-2.86-.15-.28C4.3 14.68 4 13.38 4 12c0-4.41 3.59-8 8-8s8 3.59 8 8-3.59 8-8 8z"/>
            </svg>
            <span>{story.comments}</span>
          </div>
        </div>

        <div className="story-meta">
          <span>{story.date}</span>
        </div>
      </div>
    </div>
  );
}

export default StoryCard;