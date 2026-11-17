import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client.js';

const MEDICAL_WARNING =
  'Veterinary Disclaimer: This question appears to involve medical concerns. Please consult a qualified veterinarian.';

function formatTimestamp(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Time unavailable';
  return date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

function authorLabel(userId) {
  return `Community member #${userId}`;
}

export default function CommunityPage() {
  const [posts, setPosts] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [expandedPostId, setExpandedPostId] = useState(null);
  const [postDetail, setPostDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [answer, setAnswer] = useState('');
  const [answerSubmitting, setAnswerSubmitting] = useState(false);
  const [votedPostIds, setVotedPostIds] = useState(() => new Set());
  const [votingPostIds, setVotingPostIds] = useState(() => new Set());
  const [showAskModal, setShowAskModal] = useState(false);
  const [title, setTitle] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [content, setContent] = useState('');
  const [submittingQuestion, setSubmittingQuestion] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const timeout = window.setTimeout(async () => {
      setLoading(true);
      setError('');

      const params = new URLSearchParams();
      if (category) params.set('category', category);
      if (search.trim()) params.set('search', search.trim());
      const query = params.toString();

      try {
        const result = await api(`/api/community/posts${query ? `?${query}` : ''}`);
        if (active) setPosts(result);
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
  }, [category, search, refreshKey]);

  useEffect(() => {
    if (expandedPostId === null) {
      setPostDetail(null);
      setDetailError('');
      return undefined;
    }

    let active = true;
    setDetailLoading(true);
    setDetailError('');
    api(`/api/community/posts/${expandedPostId}`)
      .then((result) => {
        if (active) setPostDetail(result);
      })
      .catch((err) => {
        if (active) setDetailError(err.message);
      })
      .finally(() => {
        if (active) setDetailLoading(false);
      });

    return () => {
      active = false;
    };
  }, [expandedPostId]);

  useEffect(() => {
    if (!showAskModal) return undefined;

    function handleKeyDown(event) {
      if (event.key === 'Escape') setShowAskModal(false);
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showAskModal]);

  const categories = useMemo(
    () => [...new Set(posts.map((post) => post.category).filter(Boolean))].sort(),
    [posts],
  );

  async function submitQuestion(event) {
    event.preventDefault();
    const questionTitle = title.trim();
    const questionCategory = newCategory.trim();
    const questionContent = content.trim();
    if (!questionTitle || !questionCategory || !questionContent) return;

    setSubmittingQuestion(true);
    setError('');
    try {
      await api('/api/community/posts', {
        method: 'POST',
        body: {
          title: questionTitle,
          category: questionCategory,
          content: questionContent,
        },
      });
      setShowAskModal(false);
      setTitle('');
      setNewCategory('');
      setContent('');
      setCategory('');
      setSearch('');
      setRefreshKey((current) => current + 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmittingQuestion(false);
    }
  }

  async function toggleUpvote(post) {
    setVotingPostIds((current) => new Set(current).add(post.id));
    setError('');
    try {
      const result = await api(`/api/community/posts/${post.id}/vote`, {
        method: 'POST',
        body: { voteType: 1 },
      });
      setPosts((current) =>
        current.map((item) =>
          item.id === post.id ? { ...item, upvotesCount: result.upvotesCount } : item,
        ),
      );
      setVotedPostIds((current) => {
        const updated = new Set(current);
        if (result.voteType === 1) updated.add(post.id);
        else updated.delete(post.id);
        return updated;
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setVotingPostIds((current) => {
        const updated = new Set(current);
        updated.delete(post.id);
        return updated;
      });
    }
  }

  async function submitAnswer(event) {
    event.preventDefault();
    const answerContent = answer.trim();
    if (!answerContent || !expandedPostId) return;

    setAnswerSubmitting(true);
    setDetailError('');
    try {
      const created = await api(`/api/community/posts/${expandedPostId}/answers`, {
        method: 'POST',
        body: { content: answerContent },
      });
      setPostDetail((current) =>
        current ? { ...current, answers: [...current.answers, created] } : current,
      );
      setAnswer('');
    } catch (err) {
      setDetailError(err.message);
    } finally {
      setAnswerSubmitting(false);
    }
  }

  return (
    <section className="community-page">
      <header className="community-header">
        <div>
          <p className="video-eyebrow">ASK · SHARE · SUPPORT</p>
          <h1>Community Q&amp;A</h1>
          <p className="muted">Questions and helpful answers from fellow pet owners.</p>
        </div>
        <button className="btn community-ask-button" onClick={() => setShowAskModal(true)}>
          Ask Question
        </button>
      </header>

      <div className="community-controls">
        <label className="community-search">
          <span aria-hidden="true">⌕</span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search questions"
            aria-label="Search questions"
          />
        </label>
        <label className="community-category-filter">
          <span>Category</span>
          <select value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value="">All categories</option>
            {categories.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
      </div>

      {error && <p className="error" role="alert">{error}</p>}

      {loading ? (
        <p className="muted" role="status">Loading questions…</p>
      ) : posts.length === 0 ? (
        <div className="card community-empty">
          <h2>No questions found</h2>
          <p className="muted">Be the first to ask the community a question.</p>
          <button className="btn" onClick={() => setShowAskModal(true)}>Ask Question</button>
        </div>
      ) : (
        <div className="community-feed">
          {posts.map((post) => {
            const isExpanded = expandedPostId === post.id;
            const isVoted = votedPostIds.has(post.id);
            return (
              <article className="community-post card" key={post.id}>
                {post.hasMedicalWarning && (
                  <div className="medical-warning" role="alert">
                    <span className="medical-warning-icon" aria-hidden="true">!</span>
                    <span>{MEDICAL_WARNING}</span>
                  </div>
                )}

                <div className="community-post-heading">
                  <span className="community-category-badge">{post.category}</span>
                  <span className="community-post-time">{formatTimestamp(post.createdAt)}</span>
                </div>
                <h2>{post.title}</h2>
                <p className="community-post-snippet">{post.content}</p>
                <div className="community-post-footer">
                  <span className="community-author">{authorLabel(post.userId)}</span>
                  <div className="community-post-actions">
                    <button
                      type="button"
                      className={`community-upvote${isVoted ? ' active' : ''}`}
                      aria-label={`${isVoted ? 'Remove upvote from' : 'Upvote'} ${post.title}`}
                      aria-pressed={isVoted}
                      disabled={votingPostIds.has(post.id)}
                      onClick={() => toggleUpvote(post)}
                    >
                      <span aria-hidden="true">▲</span>
                      <span>{post.upvotesCount}</span>
                    </button>
                    <button
                      type="button"
                      className="community-expand-button"
                      aria-expanded={isExpanded}
                      onClick={() => setExpandedPostId(isExpanded ? null : post.id)}
                    >
                      {isExpanded ? 'Hide answers' : 'View answers'}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="community-detail">
                    {detailLoading && <p className="muted" role="status">Loading answers…</p>}
                    {detailError && <p className="error" role="alert">{detailError}</p>}
                    {postDetail?.post.id === post.id && (
                      <>
                        <div className="community-full-question">
                          <h3>Question details</h3>
                          <p>{postDetail.post.content}</p>
                        </div>
                        <div className="community-answers">
                          <h3>Answers <span>({postDetail.answers.length})</span></h3>
                          {postDetail.answers.length === 0 ? (
                            <p className="muted">No answers yet. Share a helpful response.</p>
                          ) : (
                            postDetail.answers.map((item) => (
                              <div className="community-answer" key={item.id}>
                                <p>{item.content}</p>
                                <div className="community-answer-meta">
                                  <span>{authorLabel(item.userId)}</span>
                                  <time dateTime={item.createdAt}>{formatTimestamp(item.createdAt)}</time>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                        <form className="community-answer-form" onSubmit={submitAnswer}>
                          <label htmlFor={`answer-${post.id}`}>Your answer</label>
                          <textarea
                            id={`answer-${post.id}`}
                            rows={3}
                            value={answer}
                            onChange={(event) => setAnswer(event.target.value)}
                            placeholder="Share what you know…"
                            required
                          />
                          <button
                            className="btn"
                            type="submit"
                            disabled={answerSubmitting || !answer.trim()}
                          >
                            {answerSubmitting ? 'Posting…' : 'Post Answer'}
                          </button>
                        </form>
                      </>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      {showAskModal && (
        <div
          className="community-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowAskModal(false);
          }}
        >
          <section
            className="community-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ask-question-title"
          >
            <div className="community-modal-header">
              <div>
                <p className="video-eyebrow">COMMUNITY Q&amp;A</p>
                <h2 id="ask-question-title">Ask a question</h2>
              </div>
              <button
                type="button"
                className="video-modal-close"
                aria-label="Close question form"
                onClick={() => setShowAskModal(false)}
              >
                ×
              </button>
            </div>
            <form className="community-question-form" onSubmit={submitQuestion}>
              <label>
                Title
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  maxLength={255}
                  required
                />
              </label>
              <label>
                Category
                <input
                  value={newCategory}
                  onChange={(event) => setNewCategory(event.target.value)}
                  maxLength={100}
                  placeholder="For example: Training or Health"
                  required
                />
              </label>
              <label>
                Question
                <textarea
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  rows={6}
                  required
                />
              </label>
              <p className="community-form-note">
                Medical concerns will be marked with a veterinary disclaimer.
              </p>
              {error && <p className="error" role="alert">{error}</p>}
              <div className="community-form-actions">
                <button
                  className="btn btn-ghost"
                  type="button"
                  onClick={() => setShowAskModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="btn"
                  type="submit"
                  disabled={submittingQuestion || !title.trim() || !newCategory.trim() || !content.trim()}
                >
                  {submittingQuestion ? 'Posting…' : 'Post Question'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </section>
  );
}
