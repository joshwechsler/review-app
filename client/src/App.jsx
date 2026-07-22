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
  const [consent, setConsent] = useState(true)
  const [step, setStep] = useState(1) // 1 = survey, 2 = thank you / review prompt
  const [settings, setSettings] = useState(null)

  const isFeedbackPage = location.pathname === '/feedback'

  useEffect(() => {
    supabase.from('settings').select('*').limit(1).single().then(({ data }) => {
      if (data) setSettings(data)
    })
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const emailFromUrl = params.get('email')
    const ratingFromUrl = parseInt(params.get('rating'))

    if (emailFromUrl) setEmail(emailFromUrl)
    if (ratingFromUrl) setRating(ratingFromUrl)

    if (emailFromUrl) {
      supabase.from('feedback_responses').insert([{ email: emailFromUrl, status: 'clicked' }])
    }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!rating) return alert('Please select a rating')
    if (!email) return alert('Please enter your email')

    const { error } = await supabase.from('feedback_responses').insert([
      { email, rating, comment, status: 'reviewed' }
    ])

    if (error) return alert('There was a problem saving your feedback.')

    await fetch('/api/update-klaviyo-score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, rating })
    }).catch(() => {})

    setStep(2)
  }

  const isHighRating = rating >= 4
  const googleLink = settings?.google_review_link || 'https://search.google.com/local/writereview'
  const facebookLink = settings?.facebook_review_link || ''

  const step1 = (
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
                color: rating >= star ? '#f59e0b' : '#334155',
                transform: rating >= star ? 'scale(1.15)' : 'scale(1)'
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
            placeholder="Tell us about your visit…"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            style={fb.textarea}
          />
          <label style={fb.checkboxRow}>
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              style={fb.checkbox}
            />
            <span style={fb.checkboxLabel}>I would like to use my response to create an online review</span>
          </label>
          <button type="submit" style={fb.submit}>
            Submit Feedback
          </button>
        </form>
      </div>
    </div>
  )

  const step2 = (
    <div style={fb.container}>
      <div style={fb.card}>
        {isHighRating && consent ? (
          <>
            <div style={fb.bigStars}>★★★★★</div>
            <h1 style={fb.heading}>Thank you for your feedback!</h1>
            <p style={fb.sub}>Please take a moment to share your experience online.</p>
            {comment && (
              <div style={fb.commentBox}>
                <p style={fb.commentText}>{comment}</p>
                <button
                  onClick={() => navigator.clipboard.writeText(comment)}
                  style={fb.copyBtn}
                >Copy</button>
              </div>
            )}
            <div style={fb.reviewBtns}>
              <a href={googleLink} target="_blank" rel="noreferrer" style={fb.reviewBtn}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{flexShrink:0}}>
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Review on Google
              </a>
              {facebookLink && (
                <a href={facebookLink} target="_blank" rel="noreferrer" style={{...fb.reviewBtn, ...fb.reviewBtnFb}}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2" style={{flexShrink:0}}>
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  Review on Facebook
                </a>
              )}
            </div>
          </>
        ) : (
          <>
            <div style={fb.checkmark}>✓</div>
            <h1 style={fb.heading}>Thank You</h1>
            <p style={fb.sub}>{settings?.low_score_message || 'We appreciate your feedback and will use it to improve.'}</p>
          </>
        )}
      </div>
    </div>
  )

  const feedbackPage = step === 1 ? step1 : step2

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
  bigStars: {
    fontSize: '36px',
    color: '#f59e0b',
    marginBottom: '16px',
    letterSpacing: '4px'
  },
  heading: {
    color: 'white',
    fontSize: '26px',
    fontWeight: '700',
    marginBottom: '8px'
  },
  sub: {
    color: '#94a3b8',
    fontSize: '15px',
    marginBottom: '28px'
  },
  stars: {
    display: 'flex',
    justifyContent: 'center',
    gap: '6px',
    marginBottom: '28px'
  },
  starBtn: {
    background: 'none',
    border: 'none',
    fontSize: '44px',
    cursor: 'pointer',
    transition: 'all 0.15s',
    lineHeight: 1,
    padding: '0 4px'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    textAlign: 'left'
  },
  input: {
    width: '100%',
    padding: '14px 16px',
    borderRadius: '10px',
    border: '1px solid #334155',
    backgroundColor: '#0f172a',
    color: 'white',
    fontSize: '15px',
    outline: 'none',
    boxSizing: 'border-box'
  },
  textarea: {
    width: '100%',
    padding: '14px 16px',
    borderRadius: '10px',
    border: '1px solid #334155',
    backgroundColor: '#0f172a',
    color: 'white',
    fontSize: '15px',
    minHeight: '100px',
    resize: 'vertical',
    outline: 'none',
    fontFamily: 'inherit',
    boxSizing: 'border-box'
  },
  checkboxRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    cursor: 'pointer'
  },
  checkbox: {
    marginTop: '2px',
    accentColor: '#7c3aed',
    width: '16px',
    height: '16px',
    flexShrink: 0
  },
  checkboxLabel: {
    fontSize: '13px',
    color: '#94a3b8',
    lineHeight: 1.5
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
  },
  commentBox: {
    backgroundColor: '#0f172a',
    borderRadius: '10px',
    padding: '16px',
    marginBottom: '24px',
    textAlign: 'left',
    position: 'relative'
  },
  commentText: {
    color: '#cbd5e1',
    fontSize: '14px',
    lineHeight: 1.6,
    marginBottom: '10px'
  },
  copyBtn: {
    padding: '4px 12px',
    borderRadius: '6px',
    border: '1px solid #334155',
    backgroundColor: 'transparent',
    color: '#94a3b8',
    fontSize: '12px',
    cursor: 'pointer'
  },
  reviewBtns: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  reviewBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    padding: '14px 20px',
    borderRadius: '10px',
    border: '1px solid #334155',
    backgroundColor: '#0f172a',
    color: 'white',
    fontSize: '15px',
    fontWeight: '500',
    textDecoration: 'none',
    cursor: 'pointer'
  },
  reviewBtnFb: {
    borderColor: '#1877F2'
  }
}

export default App
