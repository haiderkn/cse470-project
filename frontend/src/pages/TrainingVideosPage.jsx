import { useEffect, useState } from 'react';
import { api } from '../api/client.js';

const CATEGORIES = [
  'All',
  'Obedience',
  'Toilet Training',
  'Feeding',
  'Behavioral Care',
];

export default function TrainingVideosPage() {
  const [videos, setVideos] = useState([]);
  const [favoriteIds, setFavoriteIds] = useState(() => new Set());
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [updatingIds, setUpdatingIds] = useState(() => new Set());
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const timeout = window.setTimeout(async () => {
      setLoading(true);
      setError('');

      const params = new URLSearchParams();
      if (category !== 'All') params.set('category', category);
      if (search.trim()) params.set('search', search.trim());
      const query = params.toString();

      try {
        const [videoList, favoriteList] = await Promise.all([
          api(`/api/videos${query ? `?${query}` : ''}`),
          api('/api/videos/favorites'),
        ]);
        if (active) {
          setVideos(videoList);
          setFavoriteIds(new Set(favoriteList.map((video) => video.id)));
        }
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    }, search ? 250 : 0);

    return () => {
      active = false;
      window.clearTimeout(timeout);
    };
  }, [category, search]);

  useEffect(() => {
    if (!selectedVideo) return undefined;

    function handleKeyDown(event) {
      if (event.key === 'Escape') setSelectedVideo(null);
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedVideo]);

  async function toggleFavorite(video) {
    setUpdatingIds((current) => new Set(current).add(video.id));
    setError('');
    try {
      const result = await api(`/api/videos/${video.id}/favorite`, { method: 'POST' });
      setFavoriteIds((current) => {
        const updated = new Set(current);
        if (result.favorited) updated.add(video.id);
        else updated.delete(video.id);
        return updated;
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdatingIds((current) => {
        const updated = new Set(current);
        updated.delete(video.id);
        return updated;
      });
    }
  }

  const visibleVideos = favoritesOnly
    ? videos.filter((video) => favoriteIds.has(video.id))
    : videos;

  return (
    <section className="video-library">
      <header className="video-library-header">
        <div>
          <p className="video-eyebrow">LEARN TOGETHER</p>
          <h1>Training Video Library</h1>
          <p className="muted">Helpful videos for every step of your pet’s journey.</p>
        </div>
      </header>

      <div className="video-library-controls">
        <div className="video-category-tabs" role="group" aria-label="Filter by category">
          {CATEGORIES.map((item) => (
            <button
              key={item}
              type="button"
              className={`video-category-tab${category === item ? ' active' : ''}`}
              aria-pressed={category === item}
              onClick={() => setCategory(item)}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="video-search-row">
          <label className="video-search">
            <span aria-hidden="true">⌕</span>
            <input
              type="search"
              className="video-search-input"
              placeholder="Search videos by title or description"
              aria-label="Search videos by title or description"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <button
            type="button"
            className={`btn btn-ghost favorites-filter${favoritesOnly ? ' active' : ''}`}
            aria-pressed={favoritesOnly}
            onClick={() => setFavoritesOnly((current) => !current)}
          >
            <span aria-hidden="true">{favoritesOnly ? '♥' : '♡'}</span>
            My Favorites
          </button>
        </div>
      </div>

      {error && <p className="error" role="alert">{error}</p>}

      {loading ? (
        <p className="muted" role="status">Loading videos…</p>
      ) : visibleVideos.length === 0 ? (
        <div className="video-empty-state card">
          <span className="video-empty-icon" aria-hidden="true">▶</span>
          <h2>{favoritesOnly ? 'No favorite videos yet' : 'No videos found'}</h2>
          <p className="muted">
            {favoritesOnly
              ? 'Save a video with the heart button and it will appear here.'
              : 'Try another category or search term.'}
          </p>
        </div>
      ) : (
        <div className="video-grid">
          {visibleVideos.map((video) => {
            const isFavorite = favoriteIds.has(video.id);
            return (
              <article className="video-card card" key={video.id}>
                <button
                  type="button"
                  className="video-card-open"
                  onClick={() => setSelectedVideo(video)}
                  aria-label={`Play ${video.title}`}
                >
                  <span className="video-thumbnail">
                    <img
                      src={`https://img.youtube.com/vi/${encodeURIComponent(video.youtubeVideoId)}/hqdefault.jpg`}
                      alt=""
                      loading="lazy"
                    />
                    <span className="video-play-icon" aria-hidden="true">▶</span>
                  </span>
                  <span className="video-card-content">
                    <span className="video-card-title">{video.title}</span>
                    {video.description && (
                      <span className="video-card-description">{video.description}</span>
                    )}
                    <span className="video-card-meta">
                      <span className="video-category-badge">{video.category}</span>
                      <span>{video.durationMinutes} min</span>
                    </span>
                  </span>
                </button>
                <button
                  type="button"
                  className={`video-favorite-button${isFavorite ? ' favorited' : ''}`}
                  aria-label={isFavorite ? `Remove ${video.title} from favorites` : `Add ${video.title} to favorites`}
                  aria-pressed={isFavorite}
                  disabled={updatingIds.has(video.id)}
                  onClick={() => toggleFavorite(video)}
                >
                  <span aria-hidden="true">{isFavorite ? '♥' : '♡'}</span>
                </button>
              </article>
            );
          })}
        </div>
      )}

      {selectedVideo && (
        <div
          className="video-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedVideo(null);
          }}
        >
          <section
            className="video-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="video-modal-title"
          >
            <div className="video-modal-header">
              <h2 id="video-modal-title">{selectedVideo.title}</h2>
              <button
                type="button"
                className="video-modal-close"
                aria-label="Close video"
                onClick={() => setSelectedVideo(null)}
              >
                ×
              </button>
            </div>
            <div className="video-player">
              <iframe
                src={`https://www.youtube.com/embed/${encodeURIComponent(selectedVideo.youtubeVideoId)}`}
                title={selectedVideo.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
