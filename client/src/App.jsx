import { supabase } from './supabase'
import { useEffect, useState } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import SendRequest from './SendRequest'
import PrivateFeedback from './PrivateFeedback'
import Reviews from './Reviews'
import Analytics from './Analytics'
import Settings from './Settings'
import Overview from './Overview'
import Nav from './Nav'

function App() {
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [settings, setSettings] = useState(null)

  const isFeedbackPage = location.pathname === '/feedback'

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const emailFromUrl = params.get('email')
    if (emailFromUrl) {
      setEmail(emailFromUrl)
      supabase.from('feedback_responses').insert([{ email: emailFromUrl, status: 'clicked' }])
    }
  }, [])

  useEffect(() => {
    supabase.from('settings').select('*').limit(1).single().then(({ data }) => {
      if (data) setSettings(data)
    })
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!rating) return alert('Please select a rating')
    if (!email) return alert('Please enter your email')

    if (rating >= 4) {
      const link = settings?.google_review_link || 'https://search.google.com/local/writereview'
      window.location.href = link
      return
    }

    const { error } = await supabase.from('feedback_responses').insert([
      { email, rating, comment, status: 'reviewed' }
    ])

    if (error) return alert('There was a problem saving your feedback.')

    await fetch('/api/update-klaviyo-score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, rating })
    })

    setSubmitted(true)
  }

  const feedbackPage = submitted ? (
    <div style={fb.container}>
      <div style={fb.card}>
        <div style={fb.checkmark}>✓</div>
        <h1 style={fb.heading}>Thank You</h1>
        <p style={fb.sub}>We appreciate your feedback and will use it to improve.</p>
      </div>
    </div>
  ) : (
    <div style={fb.container}>
      <div style={fb.card}>
        <h1 style={fb.heading}>
          {settings?.feedback_headline || 'How was your experience?'}
        </h1>
        <p style={fb.sub}>Your feedback helps us improve.</p>

        <div style={fb.stars}>
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              style={{
                ...fb.starBtn,
                backgroundColor: rating >= star ? '#7c3aed' : 'transparent',
                color: rating >= star ? 'white' : '#d1d5db',
                borderColor: rating >= star ? '#7c3aed' : '#374151'
              }}
            >
              ★
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={fb.form}>
          <input
            type="email"
            placeholder="Your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={fb.input}
          />
          <textarea
            placeholder="Leave an optional comment…"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            style={fb.textarea}
          />
          <button type="submit" style={fb.submit}>
            Submit Feedback
          </button>
        </form>
      </div>
    </div>
  )

  return (
    <>
      {isFeedbackPage ? (
        feedbackPage
      ) : (
        <div style={styles.layout}>
          <Nav />
          <main style={styles.main}>
            <Routes>
              <Route path="/" element={<Navigate to="/overview" replace />} />
              <Route path="/overview" element={<Overview />} />
              <Route path="/reviews" element={<Reviews />} />
              <Route path="/private-feedback" element={<PrivateFeedback />} />
              <Route path="/send-request" element={<SendRequest />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </main>
        </div>
      )}
      {/* feedback route outside layout */}
      {isFeedbackPage && null}
    </>
  )
}

const styles = {
  layout: {
    display: 'flex',
    minHeight: '100vh',
    width: '100%'
  },
  main: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    overflowY: 'auto',
    minHeight: '100vh'
  }
}

const fb = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    padding: '20px'
  },
  card: {
    backgroundColor: '#1e293b',
    padding: '48px 40px',
    borderRadius: '20px',
    width: '100%',
    maxWidth: '480px',
    textAlign: 'center'
  },
  checkmark: {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    backgroundColor: '#10b981',
    color: 'white',
    fontSize: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 20px'
  },
  heading: {
    color: 'white',
    fontSize: '28px',
    fontWeight: '700',
    marginBottom: '8px'
  },
  sub: {
    color: '#94a3b8',
    fontSize: '15px',
    marginBottom: '32px'
  },
  stars: {
    display: 'flex',
    justifyContent: 'center',
    gap: '8px',
    marginBottom: '28px'
  },
  starBtn: {
    width: '52px',
    height: '52px',
    borderRadius: '12px',
    border: '2px solid',
    fontSize: '24px',
    cursor: 'pointer',
    transition: 'all 0.15s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  input: {
    width: '100%',
    padding: '14px 16px',
    borderRadius: '10px',
    border: '1px solid #334155',
    backgroundColor: '#0f172a',
    color: 'white',
    fontSize: '15px',
    outline: 'none'
  },
  textarea: {
    width: '100%',
    padding: '14px 16px',
    borderRadius: '10px',
    border: '1px solid #334155',
    backgroundColor: '#0f172a',
    color: 'white',
    fontSize: '15px',
    minHeight: '120px',
    resize: 'vertical',
    outline: 'none'
  },
  submit: {
    width: '100%',
    padding: '14px',
    borderRadius: '10px',
    border: 'none',
    backgroundColor: '#7c3aed',
    color: 'white',
    fontWeight: '600',
    fontSize: '15px',
    cursor: 'pointer',
    marginTop: '4px'
  }
}

export default App
