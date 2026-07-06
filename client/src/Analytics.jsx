import { useEffect, useMemo, useState } from 'react'
import { supabase } from './supabase'
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'

function StatCard({ label, value, color, sub }) {
  return (
    <div style={styles.statCard}>
      <p style={styles.statLabel}>{label}</p>
      <p style={{ ...styles.statValue, color: color || '#0f172a' }}>{value}</p>
      {sub && <p style={styles.statSub}>{sub}</p>}
    </div>
  )
}

function Analytics() {
  const [feedback, setFeedback] = useState([])
  const [reviews, setReviews] = useState([])
  const [range, setRange] = useState('30')
  const [groupBy, setGroupBy] = useState('weekly')

  useEffect(() => { fetchAnalytics() }, [])

  const fetchAnalytics = async () => {
    const [feedbackRes, reviewRes] = await Promise.all([
      supabase.from('feedback_responses').select('*'),
      supabase.from('reviews').select('*')
    ])
    setFeedback(feedbackRes.data || [])
    setReviews(reviewRes.data || [])
  }

  const getStartDate = () => {
    if (range === 'all') return null
    const d = new Date()
    d.setDate(d.getDate() - Number(range))
    return d
  }

  const filterByDate = (items, field) => {
    const start = getStartDate()
    return start ? items.filter(i => new Date(i[field]) >= start) : items
  }

  const filteredFeedback = useMemo(() => filterByDate(feedback, 'created_at'), [feedback, range])
  const filteredReviews = useMemo(() => filterByDate(reviews, 'reviewed_at'), [reviews, range])

  const requestsSent = filteredFeedback.filter(f => f.status === 'sent').length
  const responsesReceived = filteredFeedback.filter(f => f.status === 'reviewed' || f.rating).length
  const wentToGoogle = filteredFeedback.filter(f => f.rating >= 4).length
  const privateCaptures = filteredFeedback.filter(f => f.rating <= 3 && f.status === 'reviewed').length
  const responseRate = requestsSent > 0 ? Math.round((responsesReceived / requestsSent) * 100) : 0
  const repliedReviews = filteredReviews.filter(r => r.replied).length
  const replyRate = filteredReviews.length > 0 ? Math.round((repliedReviews / filteredReviews.length) * 100) : 0
  const avgRating = filteredReviews.length ? (filteredReviews.reduce((s, r) => s + r.rating, 0) / filteredReviews.length).toFixed(1) : '—'

  const chartData = Object.values(
    filteredReviews.reduce((acc, review) => {
      const d = new Date(review.reviewed_at)
      const key = groupBy === 'monthly'
        ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,'0')}`
        : `${d.getFullYear()}-W${Math.ceil(d.getDate() / 7)}`
      if (!acc[key]) acc[key] = { date: key, totalRating: 0, count: 0 }
      acc[key].totalRating += review.rating
      acc[key].count += 1
      return acc
    }, {})
  ).map(i => ({ date: i.date, avgRating: Number((i.totalRating / i.count).toFixed(1)), volume: i.count }))
   .sort((a, b) => a.date.localeCompare(b.date))

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Analytics</h1>
          <p style={styles.subtitle}>Track your reputation performance over time</p>
        </div>
        <div style={styles.filters}>
          <select value={range} onChange={e => setRange(e.target.value)} style={styles.select}>
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="all">All time</option>
          </select>
          <select value={groupBy} onChange={e => setGroupBy(e.target.value)} style={styles.select}>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
      </div>

      <div style={styles.statsGrid}>
        <StatCard label="Avg Google Rating" value={avgRating} color="#f59e0b" />
        <StatCard label="Google Reviews" value={filteredReviews.length} />
        <StatCard label="Went to Google" value={wentToGoogle} color="#10b981" />
        <StatCard label="Private Captures" value={privateCaptures} color={privateCaptures > 0 ? '#ef4444' : '#0f172a'} />
        <StatCard label="Response Rate" value={`${responseRate}%`} />
        <StatCard label="Reply Rate" value={`${replyRate}%`} sub={`${repliedReviews} replied`} />
      </div>

      <div style={styles.chartCard}>
        <h3 style={styles.chartTitle}>Average Rating Over Time</h3>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#94a3b8' }} />
            <YAxis domain={[0, 5]} tick={{ fontSize: 12, fill: '#94a3b8' }} />
            <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px' }} />
            <Line type="monotone" dataKey="avgRating" stroke="#7c3aed" strokeWidth={2.5} dot={{ r: 4, fill: '#7c3aed' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div style={styles.chartCard}>
        <h3 style={styles.chartTitle}>Review Volume Over Time</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#94a3b8' }} />
            <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} />
            <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px' }} />
            <Bar dataKey="volume" fill="#7c3aed" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

const styles = {
  page: { padding: '32px', maxWidth: '1000px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' },
  title: { fontSize: '24px', fontWeight: '700', color: '#0f172a', marginBottom: '4px' },
  subtitle: { color: '#64748b', fontSize: '14px' },
  filters: { display: 'flex', gap: '8px' },
  select: { padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px', color: '#374151', backgroundColor: 'white', cursor: 'pointer' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '24px' },
  statCard: { backgroundColor: 'white', borderRadius: '12px', padding: '20px', border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' },
  statLabel: { fontSize: '13px', color: '#64748b', fontWeight: '500', marginBottom: '8px' },
  statValue: { fontSize: '28px', fontWeight: '700', lineHeight: 1 },
  statSub: { fontSize: '12px', color: '#94a3b8', marginTop: '4px' },
  chartCard: { backgroundColor: 'white', borderRadius: '12px', padding: '24px', border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', marginBottom: '16px' },
  chartTitle: { fontSize: '15px', fontWeight: '600', color: '#0f172a', marginBottom: '20px' }
}

export default Analytics
