import { useEffect, useState } from 'react'

function Stars({ rating }) {
  return (
    <span>
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ color: i <= rating ? '#f59e0b' : '#e2e8f0', fontSize: '16px' }}>★</span>
      ))}
    </span>
  )
}

function Reviews() {
  const [reviews, setReviews] = useState([])
  const [replies, setReplies] = useState({})
  const [socialPosts, setSocialPosts] = useState({})
  const [tones, setTones] = useState({})
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')

  useEffect(() => {
    fetchReviews()
  }, [])

  const fetchReviews = async () => {
    try {
      const response = await fetch('/api/google/reviews')
      const data = await response.json()
      if (!response.ok) { setLoading(false); return }

      const formatted = data.reviews.map((review) => ({
        id: review.reviewId,
        reviewer_name: review.reviewer?.displayName || 'Anonymous',
        rating: { FIVE:5, FOUR:4, THREE:3, TWO:2, ONE:1 }[review.starRating] || 0,
        review_text: review.comment || '',
        reviewed_at: review.createTime,
        reply: review.reviewReply?.comment || ''
      }))
      setReviews(formatted)
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  const generateReply = async (item) => {
    setReplies(prev => ({ ...prev, [item.id]: 'generating' }))
    const res = await fetch('/api/generate-reply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating: item.rating, comment: item.review_text, email: item.reviewer_name })
    })
    const data = await res.json()
    setReplies(prev => ({ ...prev, [item.id]: data.reply }))
  }

  const generateSocialPost = async (item) => {
    setSocialPosts(prev => ({ ...prev, [item.id]: 'generating' }))
    const res = await fetch('/api/generate-social-post', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reviewerName: item.reviewer_name, rating: item.rating, reviewText: item.review_text, tone: tones[item.id] || 'Friendly' })
    })
    const data = await res.json()
    setSocialPosts(prev => ({ ...prev, [item.id]: data.post }))
  }

  const filtered = activeTab === 'all' ? reviews
    : activeTab === 'low' ? reviews.filter(r => r.rating <= 3)
    : reviews.filter(r => r.rating >= 4)

  const lowCount = reviews.filter(r => r.rating <= 3).length

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Google Reviews</h1>
          <p style={styles.subtitle}>{reviews.length} reviews synced from Google Business</p>
        </div>
        <button onClick={fetchReviews} style={styles.syncBtn}>↻ Sync Reviews</button>
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        {[
          { key: 'all', label: `All (${reviews.length})` },
          { key: 'low', label: `Needs Attention (${lowCount})` },
          { key: 'high', label: `Positive (${reviews.length - lowCount})` }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{ ...styles.tab, ...(activeTab === tab.key ? styles.tabActive : {}) }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={styles.empty}>Loading reviews…</div>
      ) : filtered.length === 0 ? (
        <div style={styles.empty}>No reviews in this category.</div>
      ) : (
        <div style={styles.list}>
          {filtered.map((item) => (
            <div key={item.id} style={styles.card}>
              <div style={styles.cardTop}>
                <div style={styles.reviewerRow}>
                  <div style={styles.avatar}>{(item.reviewer_name || 'A')[0].toUpperCase()}</div>
                  <div>
                    <p style={styles.reviewerName}>{item.reviewer_name}</p>
                    <p style={styles.reviewDate}>{new Date(item.reviewed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                  </div>
                </div>

                <div style={styles.rightMeta}>
                  <Stars rating={item.rating} />
                  {item.rating <= 3 && <span style={styles.alertBadge}>Needs Attention</span>}
                  {item.reply && <span style={styles.repliedBadge}>Replied</span>}
                </div>
              </div>

              {item.review_text && (
                <p style={styles.reviewText}>"{item.review_text}"</p>
              )}

              <div style={styles.actions}>
                <button onClick={() => generateReply(item)} style={styles.btnSecondary}>
                  {replies[item.id] === 'generating' ? 'Generating…' : '✦ Generate Reply'}
                </button>

                {item.rating >= 4 && (
                  <>
                    <select
                      value={tones[item.id] || 'Friendly'}
                      onChange={(e) => setTones(prev => ({ ...prev, [item.id]: e.target.value }))}
                      style={styles.select}
                    >
                      <option>Friendly</option>
                      <option>Professional</option>
                      <option>Casual</option>
                    </select>
                    <button onClick={() => generateSocialPost(item)} style={styles.btnAccent}>
                      {socialPosts[item.id] === 'generating' ? 'Generating…' : '↗ Social Post'}
                    </button>
                  </>
                )}
              </div>

              {replies[item.id] && replies[item.id] !== 'generating' && (
                <div style={styles.outputBox}>
                  <div style={styles.outputHeader}>
                    <span style={styles.outputLabel}>AI Reply</span>
                    <button onClick={() => navigator.clipboard.writeText(replies[item.id])} style={styles.copyBtn}>Copy</button>
                  </div>
                  <p style={styles.outputText}>{replies[item.id]}</p>
                </div>
              )}

              {socialPosts[item.id] && socialPosts[item.id] !== 'generating' && (
                <div style={{ ...styles.outputBox, borderColor: '#a78bfa' }}>
                  <div style={styles.outputHeader}>
                    <span style={styles.outputLabel}>Social Post</span>
                    <button onClick={() => navigator.clipboard.writeText(socialPosts[item.id])} style={styles.copyBtn}>Copy</button>
                  </div>
                  <textarea
                    value={socialPosts[item.id]}
                    onChange={(e) => setSocialPosts(prev => ({ ...prev, [item.id]: e.target.value }))}
                    style={styles.editableTextarea}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const styles = {
  page: { padding: '32px', maxWidth: '900px' },
  header: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' },
  title: { fontSize: '24px', fontWeight: '700', color: '#0f172a', marginBottom: '4px' },
  subtitle: { color: '#64748b', fontSize: '14px' },
  syncBtn: { padding: '9px 18px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: 'white', fontSize: '14px', fontWeight: '500', cursor: 'pointer', color: '#374151' },
  tabs: { display: 'flex', gap: '4px', marginBottom: '20px', backgroundColor: 'white', padding: '4px', borderRadius: '10px', border: '1px solid #e2e8f0', width: 'fit-content' },
  tab: { padding: '7px 16px', borderRadius: '7px', border: 'none', backgroundColor: 'transparent', fontSize: '13px', fontWeight: '500', cursor: 'pointer', color: '#64748b' },
  tabActive: { backgroundColor: '#0f172a', color: 'white' },
  list: { display: 'flex', flexDirection: 'column', gap: '12px' },
  empty: { padding: '60px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' },
  card: { backgroundColor: 'white', borderRadius: '12px', padding: '24px', border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' },
  reviewerRow: { display: 'flex', alignItems: 'center', gap: '12px' },
  avatar: { width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#ede9fe', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600', fontSize: '15px', flexShrink: 0 },
  reviewerName: { fontSize: '15px', fontWeight: '600', color: '#0f172a' },
  reviewDate: { fontSize: '12px', color: '#94a3b8', marginTop: '2px' },
  rightMeta: { display: 'flex', alignItems: 'center', gap: '8px' },
  alertBadge: { padding: '3px 10px', borderRadius: '20px', backgroundColor: '#fee2e2', color: '#ef4444', fontSize: '12px', fontWeight: '600' },
  repliedBadge: { padding: '3px 10px', borderRadius: '20px', backgroundColor: '#d1fae5', color: '#10b981', fontSize: '12px', fontWeight: '600' },
  reviewText: { fontSize: '14px', color: '#475569', lineHeight: 1.6, marginBottom: '16px', fontStyle: 'italic' },
  actions: { display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' },
  btnSecondary: { padding: '8px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: 'white', fontSize: '13px', fontWeight: '500', cursor: 'pointer', color: '#374151' },
  btnAccent: { padding: '8px 16px', borderRadius: '8px', border: 'none', backgroundColor: '#7c3aed', fontSize: '13px', fontWeight: '500', cursor: 'pointer', color: 'white' },
  select: { padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px', color: '#374151', backgroundColor: 'white' },
  outputBox: { marginTop: '16px', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', backgroundColor: '#fafafa' },
  outputHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' },
  outputLabel: { fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' },
  copyBtn: { padding: '4px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', backgroundColor: 'white', fontSize: '12px', cursor: 'pointer', color: '#374151' },
  outputText: { fontSize: '14px', color: '#374151', lineHeight: 1.6 },
  editableTextarea: { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', color: '#374151', lineHeight: 1.6, resize: 'vertical', minHeight: '80px', backgroundColor: 'white', marginTop: '4px' }
}

export default Reviews
