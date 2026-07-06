import { useEffect, useState } from 'react'
import { supabase } from './supabase'

function StatCard({ label, value, color, sub }) {
  return (
    <div style={styles.statCard}>
      <p style={styles.statLabel}>{label}</p>
      <p style={{ ...styles.statValue, color: color || '#0f172a' }}>{value}</p>
      {sub && <p style={styles.statSub}>{sub}</p>}
    </div>
  )
}

function Stars({ rating }) {
  return (
    <span style={{ color: '#f59e0b', fontSize: '18px', letterSpacing: '2px' }}>
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ opacity: i <= Math.round(rating) ? 1 : 0.25 }}>★</span>
      ))}
    </span>
  )
}

function Overview() {
  const [reviews, setReviews] = useState([])
  const [feedback, setFeedback] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const [reviewRes, feedbackRes] = await Promise.all([
      supabase.from('reviews').select('*').order('reviewed_at', { ascending: false }),
      supabase.from('feedback_responses').select('*')
    ])
    setReviews(reviewRes.data || [])
    setFeedback(feedbackRes.data || [])
    setLoading(false)
  }

  const avgRating = reviews.length
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '—'

  const lowCount = reviews.filter(r => r.rating <= 3).length
  const notReplied = reviews.filter(r => !r.replied).length
  const privateFeedback = feedback.filter(f => f.rating <= 3 && f.status === 'reviewed').length

  const recent = reviews.slice(0, 5)

  if (loading) {
    return <div style={styles.loading}>Loading…</div>
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Overview</h1>
          <p style={styles.subtitle}>Your reputation at a glance</p>
        </div>
      </div>

      {/* Rating hero */}
      <div style={styles.heroCard}>
        <div style={styles.heroLeft}>
          <p style={styles.heroLabel}>Overall Google Rating</p>
          <p style={styles.heroRating}>{avgRating}</p>
          <Stars rating={parseFloat(avgRating)} />
          <p style={styles.heroSub}>{reviews.length} reviews synced</p>
        </div>
        <div style={styles.heroRight}>
          <div style={styles.heroStat}>
            <span style={styles.heroStatValue}>{reviews.length}</span>
            <span style={styles.heroStatLabel}>Total Reviews</span>
          </div>
          <div style={styles.heroStatDivider} />
          <div style={styles.heroStat}>
            <span style={{ ...styles.heroStatValue, color: '#ef4444' }}>{lowCount}</span>
            <span style={styles.heroStatLabel}>3★ or Less</span>
          </div>
          <div style={styles.heroStatDivider} />
          <div style={styles.heroStat}>
            <span style={{ ...styles.heroStatValue, color: '#f59e0b' }}>{notReplied}</span>
            <span style={styles.heroStatLabel}>Haven't Replied</span>
          </div>
        </div>
      </div>

      {/* Stat row */}
      <div style={styles.statsGrid}>
        <StatCard label="Private Feedback" value={privateFeedback} color={privateFeedback > 0 ? '#ef4444' : '#0f172a'} sub="Unresolved" />
        <StatCard label="5-Star Reviews" value={reviews.filter(r => r.rating === 5).length} color="#10b981" />
        <StatCard label="4-Star Reviews" value={reviews.filter(r => r.rating === 4).length} />
        <StatCard label="Reply Rate" value={reviews.length ? `${Math.round(((reviews.length - notReplied) / reviews.length) * 100)}%` : '—'} />
      </div>

      {/* Recent reviews */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Recent Reviews</h2>
        {recent.length === 0 ? (
          <div style={styles.empty}>No reviews yet — sync Google reviews to get started.</div>
        ) : (
          <div style={styles.reviewList}>
            {recent.map((r, i) => (
              <div key={i} style={styles.reviewRow}>
                <div style={styles.reviewLeft}>
                  <div style={styles.avatar}>{(r.reviewer_name || 'A')[0].toUpperCase()}</div>
                  <div>
                    <p style={styles.reviewName}>{r.reviewer_name || 'Anonymous'}</p>
                    <p style={styles.reviewDate}>{new Date(r.reviewed_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div style={styles.reviewMid}>
                  <Stars rating={r.rating} />
                  {r.review_text && <p style={styles.reviewText}>{r.review_text.slice(0, 120)}{r.review_text.length > 120 ? '…' : ''}</p>}
                </div>
                <div>
                  {r.rating <= 3
                    ? <span style={{ ...styles.badge, backgroundColor: '#fee2e2', color: '#ef4444' }}>Needs Attention</span>
                    : <span style={{ ...styles.badge, backgroundColor: '#d1fae5', color: '#10b981' }}>Positive</span>
                  }
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const styles = {
  page: {
    padding: '32px',
    maxWidth: '1100px'
  },
  loading: {
    padding: '60px',
    color: '#64748b',
    fontSize: '15px'
  },
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: '28px'
  },
  title: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: '4px'
  },
  subtitle: {
    color: '#64748b',
    fontSize: '14px'
  },
  heroCard: {
    backgroundColor: '#0f172a',
    borderRadius: '16px',
    padding: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '24px',
    gap: '32px'
  },
  heroLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  heroLabel: {
    color: '#94a3b8',
    fontSize: '13px',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  heroRating: {
    color: 'white',
    fontSize: '64px',
    fontWeight: '700',
    lineHeight: 1,
    letterSpacing: '-2px'
  },
  heroSub: {
    color: '#64748b',
    fontSize: '13px',
    marginTop: '4px'
  },
  heroRight: {
    display: 'flex',
    gap: '0',
    alignItems: 'center'
  },
  heroStat: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '0 32px'
  },
  heroStatValue: {
    color: 'white',
    fontSize: '36px',
    fontWeight: '700',
    lineHeight: 1
  },
  heroStatLabel: {
    color: '#64748b',
    fontSize: '12px',
    marginTop: '6px',
    whiteSpace: 'nowrap'
  },
  heroStatDivider: {
    width: '1px',
    height: '48px',
    backgroundColor: '#1e293b'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '16px',
    marginBottom: '28px'
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '20px 24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    border: '1px solid #f1f5f9'
  },
  statLabel: {
    color: '#64748b',
    fontSize: '13px',
    fontWeight: '500',
    marginBottom: '8px'
  },
  statValue: {
    fontSize: '32px',
    fontWeight: '700',
    lineHeight: 1,
    color: '#0f172a'
  },
  statSub: {
    color: '#94a3b8',
    fontSize: '12px',
    marginTop: '4px'
  },
  section: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    border: '1px solid #f1f5f9'
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: '600',
    marginBottom: '20px',
    color: '#0f172a'
  },
  empty: {
    color: '#94a3b8',
    fontSize: '14px',
    padding: '24px 0',
    textAlign: 'center'
  },
  reviewList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0'
  },
  reviewRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '16px 0',
    borderBottom: '1px solid #f1f5f9'
  },
  reviewLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    minWidth: '180px'
  },
  avatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    backgroundColor: '#ede9fe',
    color: '#7c3aed',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '600',
    fontSize: '14px',
    flexShrink: 0
  },
  reviewName: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#0f172a'
  },
  reviewDate: {
    fontSize: '12px',
    color: '#94a3b8',
    marginTop: '2px'
  },
  reviewMid: {
    flex: 1
  },
  reviewText: {
    fontSize: '13px',
    color: '#64748b',
    marginTop: '4px',
    lineHeight: 1.5
  },
  badge: {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
    whiteSpace: 'nowrap'
  }
}

export default Overview
