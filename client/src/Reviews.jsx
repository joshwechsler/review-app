import { useEffect, useState } from 'react'
import { supabase } from './supabase'

function Reviews() {
  const [reviews, setReviews] = useState([])
  const [replies, setReplies] = useState({})
  const [showNotifications, setShowNotifications] = useState(false)
  const [prevLowCount, setPrevLowCount] = useState(0)
  const [socialPosts, setSocialPosts] = useState({})
  const [tones, setTones] = useState({})

  const lowReviewCount = reviews.filter((item) => item.rating <= 3).length

  useEffect(() => {
    fetchReviews()
  }, [])

  useEffect(() => {
    if (lowReviewCount > prevLowCount) {
      const audio = new Audio('/notification.mp3')
      audio.play().catch(() => {})
    }

    setPrevLowCount(lowReviewCount)
  }, [lowReviewCount])

  const fetchReviews = async () => {
  try {
    const response = await fetch('/api/google/reviews')
    const data = await response.json()

    if (!response.ok) {
      console.error(data)
      return
    }

    const formattedReviews = data.reviews.map((review) => ({
      id: review.reviewId,
      reviewer_name: review.reviewer?.displayName || 'Anonymous',
      rating:
        review.starRating === 'FIVE' ? 5 :
        review.starRating === 'FOUR' ? 4 :
        review.starRating === 'THREE' ? 3 :
        review.starRating === 'TWO' ? 2 :
        review.starRating === 'ONE' ? 1 : 0,
      review_text: review.comment || '',
      reviewed_at: review.createTime,
      platform: 'Google',
      reply: review.reviewReply?.comment || ''
    }))

    setReviews(formattedReviews)
  } catch (error) {
    console.error('Error loading Google reviews:', error)
  }
}

  const generateReply = async (item) => {
    setReplies((prev) => ({
      ...prev,
      [item.id]: 'Generating reply...'
    }))

    const response = await fetch('api/generate-reply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rating: item.rating,
        comment: item.review_text,
        email: item.reviewer_name
      })
    })

    const data = await response.json()

    setReplies((prev) => ({
      ...prev,
      [item.id]: data.reply
    }))
  }

  const generateSocialPost = async (item) => {
    setSocialPosts((prev) => ({
      ...prev,
      [item.id]: 'Generating social post...'
    }))

    const response = await fetch('/api/generate-social-post', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reviewerName: item.reviewer_name,
        rating: item.rating,
        reviewText: item.review_text,
        tone: tones[item.id] || 'Friendly'
      })
    })

    const data = await response.json()

    setSocialPosts((prev) => ({
      ...prev,
      [item.id]: data.post
    }))
  }

  return (
    <div style={styles.container}>
      <div
        style={styles.notificationBell}
        onClick={() => setShowNotifications(!showNotifications)}
      >
        🔔
        {lowReviewCount > 0 && (
          <span style={styles.notificationBadge}>{lowReviewCount}</span>
        )}

        {showNotifications && (
          <div style={styles.notificationPanel}>
            <strong>Notifications</strong>
            {lowReviewCount > 0 ? (
              <p>{lowReviewCount} low-rated Google review needs attention.</p>
            ) : (
              <p>No new notifications.</p>
            )}
          </div>
        )}
      </div>

      <h1 style={styles.title}>Google Reviews</h1>

      {reviews.length === 0 ? (
        <p>No reviews yet.</p>
      ) : (
        reviews.map((item) => (
          <div key={item.id} style={styles.card}>
            <h2>
              {item.rating} ★ {item.rating <= 3 && <span style={styles.badge}>⚠️</span>}
            </h2>

            <p><strong>Name:</strong> {item.reviewer_name}</p>
            <p><strong>Review:</strong> {item.review_text}</p>
            <p><strong>Date:</strong> {new Date(item.reviewed_at).toLocaleString()}</p>

            <button onClick={() => generateReply(item)} style={styles.aiButton}>
              Generate Reply
            </button>

            {item.rating >= 4 && (
              <>
                <select
                  value={tones[item.id] || 'Friendly'}
                  onChange={(e) =>
                    setTones((prev) => ({
                      ...prev,
                      [item.id]: e.target.value
                    }))
                  }
                  style={styles.toneSelect}
                >
                  <option value="Professional">Professional</option>
                  <option value="Friendly">Friendly</option>
                  <option value="Casual">Casual</option>
                </select>

                <button
                  onClick={() => generateSocialPost(item)}
                  style={styles.socialButton}
                >
                  Generate Social Post
                </button>
              </>
            )}

            {replies[item.id] && (
              <div style={styles.replyBox}>
                <strong>AI Reply:</strong>
                <p>{replies[item.id]}</p>

                {replies[item.id] !== 'Generating reply...' && (
                  <button
                    onClick={() => navigator.clipboard.writeText(replies[item.id])}
                    style={styles.copyButton}
                  >
                    Copy Reply
                  </button>
                )}
              </div>
            )}

            {socialPosts[item.id] && (
              <div style={styles.replyBox}>
                <strong>Social Post:</strong>

                <textarea
                  value={socialPosts[item.id]}
                  onChange={(e) =>
                    setSocialPosts((prev) => ({
                      ...prev,
                      [item.id]: e.target.value
                    }))
                  }
                  style={styles.textarea}
                />

                {socialPosts[item.id] !== 'Generating social post...' && (
                  <button
                    onClick={() => navigator.clipboard.writeText(socialPosts[item.id])}
                    style={styles.copyButton}
                  >
                    Copy Post
                  </button>
                )}
              </div>
            )}

            <p style={styles.platform}>Google</p>
          </div>
        ))
      )}
    </div>
  )
}

const styles = {
  title: {
  color: 'white',
  textAlign: 'center',
  fontSize: 'clamp(40px, 6vw, 72px)',
  marginBottom: '24px'
},
  container: {
    minHeight: '100vh',
    backgroundColor: '#111827',
    color: 'white',
    padding: '16px',
    position: 'relative'
  },
  card: {
  backgroundColor: '#1f2937',
  padding: '24px',
  borderRadius: '18px',
  marginBottom: '24px',
  textAlign: 'center',
  width: '100%',
  maxWidth: '1100px',
  margin: '0 auto 24px auto',
  boxSizing: 'border-box'
},
  notificationBell: {
    position: 'absolute',
    top: '24px',
    right: '40px',
    fontSize: '32px',
    cursor: 'pointer'
  },
  notificationBadge: {
    marginLeft: '6px',
    backgroundColor: '#ef4444',
    color: 'white',
    borderRadius: '999px',
    padding: '4px 10px',
    fontSize: '16px'
  },
  notificationPanel: {
    position: 'absolute',
    top: '44px',
    right: '0',
    width: '280px',
    backgroundColor: '#1f2937',
    color: 'white',
    padding: '16px',
    borderRadius: '12px',
    fontSize: '14px',
    boxShadow: '0 10px 25px rgba(0,0,0,0.35)',
    zIndex: 10
  },
  badge: {
    color: 'red',
    marginLeft: '8px'
  },
  platform: {
    marginTop: '10px',
    fontSize: '12px',
    color: '#9ca3af'
  },
  aiButton: {
    marginTop: '10px',
    padding: '8px 12px',
    backgroundColor: '#6366f1',
    border: 'none',
    borderRadius: '6px',
    color: 'white',
    cursor: 'pointer'
  },
  socialButton: {
    marginLeft: '10px',
    marginTop: '10px',
    padding: '8px 12px',
    backgroundColor: '#f59e0b',
    border: 'none',
    borderRadius: '6px',
    color: 'white',
    cursor: 'pointer'
  },
  toneSelect: {
    marginTop: '10px',
    marginRight: '10px',
    padding: '8px 10px',
    borderRadius: '6px',
    border: 'none'
  },
  replyBox: {
    marginTop: '16px',
    backgroundColor: '#111827',
    padding: '16px',
    borderRadius: '8px'
  },
  textarea: {
  width: '100%',
  marginTop: '16px',
  padding: '18px',
  borderRadius: '14px',
  border: 'none',
  backgroundColor: '#3a3a3a',
  color: 'white',
  fontSize: '16px',
  lineHeight: 1.6,
  boxSizing: 'border-box',
  overflowWrap: 'break-word',
  whiteSpace: 'pre-wrap',
  resize: 'vertical',
  minHeight: '180px'
},
  copyButton: {
    marginTop: '8px',
    padding: '6px 10px',
    backgroundColor: '#374151',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer'
  }
}

export default Reviews