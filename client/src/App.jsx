import { supabase } from './supabase'
import { useEffect, useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import SendRequest from './SendRequest'
import PrivateFeedback from './PrivateFeedback'
import Reviews from './Reviews'
import Analytics from './Analytics'
import Settings from './Settings'

function App() {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [settings, setSettings] = useState(null)

useEffect(() => {
  const markClicked = async () => {
    const params = new URLSearchParams(window.location.search)
    const emailFromUrl = params.get('email')

    if (emailFromUrl) {
      setEmail(emailFromUrl)

      const { error } = await supabase.from('feedback_responses').insert([
        {
          email: emailFromUrl,
          status: 'clicked'
        }
      ])

      if (error) {
        console.error('Clicked tracking error:', error)
      } else {
        console.log('Clicked tracking saved')
      }
    }
  }

  markClicked()
}, [])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!rating) {
      alert('Please select a rating')
      return
    }

    if (!email) {
      alert('Please enter your email')
      return
    }

    if (rating >= 4) {
      window.location.href = import.meta.env.VITE_GOOGLE_REVIEW_LINK
      return
    }

    if (rating >= 4) {
  window.location.href = 'https://search.google.com/local/writereview?placeid=ChIJzexkcTx26IkRq7Ekxb8Et4g'
}

    const { error } = await supabase.from('feedback_responses').insert([
      {
        email,
        rating,
        comment,
        status: 'reviewed'
      }
    ])

    if (error) {
      alert('There was a problem saving your feedback.')
      console.error(error)
      return
    }

    await fetch('/api/update-klaviyo-score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, rating })
    })

    setSubmitted(true)
  }

const fetchSettings = async () => {
  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .limit(1)
    .single()

  if (error) {
    console.error(error)
    return
  }

  setSettings(data)
}
useEffect(() => {
  fetchSettings()
}, [])
  return (
    <Routes>
      <Route
        path="/feedback"
        element={
          submitted ? (
            <div style={styles.container}>
              <div style={styles.card}>
                <h1>Thank You</h1>
                <p>We appreciate your feedback and will use it to improve.</p>
              </div>
            </div>
          ) : (
            <div style={styles.container}>
              <div style={styles.card}>
                <h1>{settings?.feedback_headline || 'How was your experience?'}</h1>

                <div style={styles.stars}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      style={{
                        ...styles.starButton,
                        backgroundColor: rating === star ? '#a855f7' : '#222'
                      }}
                    >
                      {star} ★
                    </button>
                  ))}
                </div>

                <form onSubmit={handleSubmit}>
                  <input
                    type="email"
                    placeholder="Your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={styles.input}
                  />

                  <textarea
                    placeholder="Leave an optional comment"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    style={styles.textarea}
                  />

                  <button type="submit" style={styles.submitButton}>
                    Submit Feedback
                  </button>
                </form>
              </div>
            </div>
          )
        }
      />

      <Route path="/send" element={<SendRequest />} />
      <Route path="/private-feedback" element={<PrivateFeedback />} />
      <Route path="/reviews" element={<Reviews />} />
      <Route path="/analytics" element={<Analytics />} />
      <Route path="/settings" element={<Settings />} />
    </Routes>
  )
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111827',
    color: 'white',
    padding: '20px'
  },
  card: {
    backgroundColor: '#1f2937',
  padding: '40px',
  borderRadius: '16px',
  width: '100%',
  maxWidth: '640px',
  margin: '0 auto',
  textAlign: 'center'
},
  stars: {
    display: 'flex',
    justifyContent: 'center',
    gap: '10px',
    margin: '20px 0'
  },
  starButton: {
    border: 'none',
    color: 'white',
    padding: '12px 16px',
    borderRadius: '10px',
    cursor: 'pointer'
  },
  feedbackInput: {
  width: '100%',
  boxSizing: 'border-box',
  padding: '14px 16px',
  borderRadius: '10px',
  border: 'none',
  marginTop: '24px',
  fontSize: '16px'
},
  textarea: {
    width: '100%',
  boxSizing: 'border-box',
  padding: '14px 16px',
  borderRadius: '10px',
  border: 'none',
  marginTop: '24px',
  minHeight: '140px',
  fontSize: '16px'
},
  submitButton: {
  marginTop: '20px',
  width: '100%',
  padding: '14px',
  border: 'none',
  borderRadius: '10px',
  backgroundColor: '#a855f7',
  color: 'white',
  fontWeight: 'bold',
  cursor: 'pointer'
},

feedbackTitle: {
  color: 'white',
  fontSize: 'clamp(36px, 6vw, 64px)',
  lineHeight: 1.1,
  marginBottom: '24px'
},
}

export default App