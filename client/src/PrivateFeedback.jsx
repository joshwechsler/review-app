import { useEffect, useState } from 'react'
import { supabase } from './supabase'

function PrivateFeedback() {
  const [feedback, setFeedback] = useState([])
  const [replies, setReplies] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchFeedback() }, [])

  const fetchFeedback = async () => {
    const { data } = await supabase
      .from('feedback_responses')
      .select('*')
      .lte('rating', 3)
      .eq('status', 'reviewed')
      .order('created_at', { ascending: false })
    setFeedback(data || [])
    setLoading(false)
  }

  const markResolved = async (id) => {
    await supabase.from('feedback_responses').update({ status: 'resolved' }).eq('id', id)
    fetchFeedback()
  }

  const generateReply = async (item) => {
    setReplies(prev => ({ ...prev, [item.id]: 'generating' }))
    try {
      const res = await fetch('/api/generate-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: item.rating, comment: item.comment, email: item.email })
      })
      const data = await res.json()
      setReplies(prev => ({ ...prev, [item.id]: data.reply }))
    } catch {
      setReplies(prev => ({ ...prev, [item.id]: 'Failed to generate reply.' }))
    }
  }

  const starsDisplay = (rating) => '★'.repeat(rating) + '☆'.repeat(5 - rating)

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>
            Private Feedback Inbox
            {feedback.length > 0 && <span style={styles.badge}>{feedback.length}</span>}
          </h1>
          <p style={styles.subtitle}>Low-rating feedback captured privately before reaching Google</p>
        </div>
      </div>

      {loading ? (
        <div style={styles.empty}>Loading…</div>
      ) : feedback.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>✓</div>
          <p style={styles.emptyTitle}>All clear</p>
          <p style={styles.emptySub}>No unresolved private feedback right now.</p>
        </div>
      ) : (
        <div style={styles.list}>
          {feedback.map((item) => (
            <div key={item.id} style={styles.card}>
              <div style={styles.cardTop}>
                <div style={styles.leftMeta}>
                  <div style={styles.avatar}>{(item.email || 'A')[0].toUpperCase()}</div>
                  <div>
                    <p style={styles.email}>{item.email || 'No email'}</p>
                    <p style={styles.date}>{new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                  </div>
                </div>
                <div style={styles.ratingBadge}>
                  <span style={{ color: '#f59e0b', fontSize: '16px' }}>{starsDisplay(item.rating)}</span>
                  <span style={styles.ratingNum}>{item.rating}/5</span>
                </div>
              </div>

              {item.comment && (
                <div style={styles.commentBox}>
                  <p style={styles.commentText}>"{item.comment}"</p>
                </div>
              )}

              <div style={styles.actions}>
                <button onClick={() => markResolved(item.id)} style={styles.resolveBtn}>
                  ✓ Mark Resolved
                </button>
                <button onClick={() => generateReply(item)} style={styles.replyBtn}>
                  {replies[item.id] === 'generating' ? 'Generating…' : '✦ Generate Email Reply'}
                </button>
              </div>

              {replies[item.id] && replies[item.id] !== 'generating' && (
                <div style={styles.replyBox}>
                  <div style={styles.replyHeader}>
                    <span style={styles.replyLabel}>AI Draft Reply</span>
                    <button onClick={() => navigator.clipboard.writeText(replies[item.id])} style={styles.copyBtn}>Copy</button>
                  </div>
                  <p style={styles.replyText}>{replies[item.id]}</p>
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
  page: { padding: '32px', maxWidth: '800px' },
  header: { marginBottom: '24px' },
  title: { fontSize: '24px', fontWeight: '700', color: '#0f172a', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '10px' },
  subtitle: { color: '#64748b', fontSize: '14px' },
  badge: { backgroundColor: '#fee2e2', color: '#ef4444', borderRadius: '20px', padding: '2px 10px', fontSize: '13px', fontWeight: '600' },
  list: { display: 'flex', flexDirection: 'column', gap: '12px' },
  empty: { padding: '60px', textAlign: 'center', color: '#94a3b8' },
  emptyState: { backgroundColor: 'white', borderRadius: '12px', padding: '60px 24px', textAlign: 'center', border: '1px solid #f1f5f9' },
  emptyIcon: { width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#d1fae5', color: '#10b981', fontSize: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' },
  emptyTitle: { fontSize: '16px', fontWeight: '600', color: '#0f172a', marginBottom: '6px' },
  emptySub: { color: '#64748b', fontSize: '14px' },
  card: { backgroundColor: 'white', borderRadius: '12px', padding: '24px', border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' },
  leftMeta: { display: 'flex', alignItems: 'center', gap: '12px' },
  avatar: { width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#fee2e2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600', fontSize: '15px', flexShrink: 0 },
  email: { fontSize: '14px', fontWeight: '600', color: '#0f172a' },
  date: { fontSize: '12px', color: '#94a3b8', marginTop: '2px' },
  ratingBadge: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' },
  ratingNum: { fontSize: '12px', color: '#94a3b8' },
  commentBox: { backgroundColor: '#fafafa', borderRadius: '8px', padding: '14px 16px', marginBottom: '16px', border: '1px solid #f1f5f9' },
  commentText: { fontSize: '14px', color: '#475569', lineHeight: 1.6, fontStyle: 'italic' },
  actions: { display: 'flex', gap: '8px' },
  resolveBtn: { padding: '8px 16px', borderRadius: '8px', border: '1px solid #d1fae5', backgroundColor: '#f0fdf4', fontSize: '13px', fontWeight: '500', cursor: 'pointer', color: '#10b981' },
  replyBtn: { padding: '8px 16px', borderRadius: '8px', border: 'none', backgroundColor: '#7c3aed', fontSize: '13px', fontWeight: '500', cursor: 'pointer', color: 'white' },
  replyBox: { marginTop: '16px', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', backgroundColor: '#fafafa' },
  replyHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' },
  replyLabel: { fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' },
  copyBtn: { padding: '4px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', backgroundColor: 'white', fontSize: '12px', cursor: 'pointer', color: '#374151' },
  replyText: { fontSize: '14px', color: '#374151', lineHeight: 1.6 }
}

export default PrivateFeedback
