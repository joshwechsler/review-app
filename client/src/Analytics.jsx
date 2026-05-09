import { useEffect, useMemo, useState } from 'react'
import { supabase } from './supabase'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts'

function Analytics() {
  const [feedback, setFeedback] = useState([])
  const [reviews, setReviews] = useState([])
  const [requests, setRequests] = useState([])
  const [range, setRange] = useState('30')
  const [groupBy, setGroupBy] = useState('weekly')
  useEffect(() => {
    fetchAnalytics()
  }, [])

  const getStartDate = () => {
    if (range === 'all') return null

    const date = new Date()
    date.setDate(date.getDate() - Number(range))
    return date
  }

  const filterByDate = (items, dateField) => {
    const startDate = getStartDate()
    if (!startDate) return items

    return items.filter((item) => new Date(item[dateField]) >= startDate)
  }

  const fetchAnalytics = async () => {
    const { data: feedbackData } = await supabase
      .from('feedback_responses')
      .select('*')

    const { data: reviewData } = await supabase
      .from('reviews')
      .select('*')

    const { data: requestData } = await supabase
      .from('review_requests')
      .select('*')

    setFeedback(feedbackData || [])
    setReviews(reviewData || [])
    setRequests(requestData || [])
  }

  const filteredFeedback = useMemo(
    () => filterByDate(feedback, 'created_at'),
    [feedback, range]
  )

  const filteredReviews = useMemo(
    () => filterByDate(reviews, 'reviewed_at'),
    [reviews, range]
  )

  const filteredRequests = useMemo(
    () => filterByDate(requests, 'sent_at'),
    [requests, range]
  )

  const totalRequests = filteredRequests.length
  const responsesReceived = filteredFeedback.length
  const wentToGoogle = filteredFeedback.filter((item) => item.rating >= 4).length
  const privateCaptures = filteredFeedback.filter((item) => item.rating <= 3).length
  const responseRate =
    totalRequests > 0 ? Math.round((responsesReceived / totalRequests) * 100) : 0

  const repliedReviews = filteredReviews.filter((item) => item.replied).length
  const notRepliedReviews = filteredReviews.length - repliedReviews
  const replyRate =
    filteredReviews.length > 0
      ? Math.round((repliedReviews / filteredReviews.length) * 100)
      : 0

  const reviewChartData = Object.values(
    filteredReviews.reduce((acc, review) => {
      const date = new Date(review.reviewed_at)
      const key =
  groupBy === 'monthly'
    ? `${date.getFullYear()}-${date.getMonth() + 1}`
    : `${date.getFullYear()}-W${Math.ceil(date.getDate() / 7)}`

      if (!acc[key]) {
        acc[key] = {
          date: key,
          totalRating: 0,
          count: 0
        }
      }

      acc[key].totalRating += review.rating
      acc[key].count += 1

      return acc
    }, {})
  ).map((item) => ({
    date: item.date,
    avgRating: Number((item.totalRating / item.count).toFixed(1)),
    volume: item.count
  }))

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Analytics Dashboard</h1>

      <select
        value={range}
        onChange={(e) => setRange(e.target.value)}
        style={styles.select}
      >
        <option value="7">Last 7 days</option>
        <option value="30">Last 30 days</option>
        <option value="90">Last 90 days</option>
        <option value="all">All time</option>
      </select>
<select
  value={groupBy}
  onChange={(e) => setGroupBy(e.target.value)}
  style={styles.select}
>
  <option value="weekly">Weekly</option>
  <option value="monthly">Monthly</option>
</select>
      <div style={styles.grid}>
        <div style={styles.card}>
          <h3>Total Requests Sent</h3>
          <p>{totalRequests}</p>
        </div>

        <div style={styles.card}>
          <h3>Responses Received</h3>
          <p>{responsesReceived}</p>
        </div>

        <div style={styles.card}>
          <h3>Went to Google</h3>
          <p>{wentToGoogle}</p>
        </div>

        <div style={styles.card}>
          <h3>Private Captures</h3>
          <p>{privateCaptures}</p>
        </div>

        <div style={styles.card}>
          <h3>Response Rate</h3>
          <p>{responseRate}%</p>
        </div>

        <div style={styles.card}>
          <h3>Google Reply Rate</h3>
          <p>{replyRate}%</p>
          <small>{repliedReviews} replied / {notRepliedReviews} not replied</small>
        </div>
      </div>

      <div style={styles.chartCard}>
        <h2>Average Google Rating Over Time</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={reviewChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis domain={[0, 5]} />
            <Tooltip />
            <Line
  type="monotone"
  dataKey="avgRating"
  stroke="#10b981"
  strokeWidth={3}
/>
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div style={styles.chartCard}>
        <h2>Review Volume Over Time</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={reviewChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="volume" fill="#6366f1" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#111827',
    color: 'white',
    padding: '40px'
  },
  select: {
    padding: '10px',
    borderRadius: '8px',
    marginBottom: '24px'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '16px',
    marginBottom: '24px'
  },
  card: {
    backgroundColor: '#1f2937',
    padding: '20px',
    borderRadius: '12px'
  },
  chartCard: {
    backgroundColor: '#1f2937',
    padding: '20px',
    borderRadius: '12px',
    marginBottom: '24px'
  }
}

export default Analytics