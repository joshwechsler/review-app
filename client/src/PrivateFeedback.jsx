import { useEffect, useState } from 'react'
import { supabase } from './supabase'

function PrivateFeedback() {
  const [feedback, setFeedback] = useState([])
  const [replies, setReplies] = useState({})

  useEffect(() => {
    fetchFeedback()
  }, [])

  const fetchFeedback = async () => {
    const { data, error } = await supabase
      .from('feedback_responses')
      .select('*')
      .lte('rating', 3)
      .eq('status', 'reviewed')
      .order('created_at', { ascending: false })

    if (error) {
      console.error(error)
      return
    }

    setFeedback(data)
  }

  const markResolved = async (id) => {
    const { error } = await supabase
      .from('feedback_responses')
      .update({ status: 'resolved' })
      .eq('id', id)

    if (error) {
      console.error(error)
      return
    }

    fetchFeedback()
  }

  const generateReply = async (item) => {
  console.log('Button clicked', item)

  try {
    const response = await fetch('http://localhost:3001/api/generate-reply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rating: item.rating,
        comment: item.comment,
        email: item.email
      })
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('AI error:', data)
      alert(data.details || data.error || 'AI failed')
      return
    }

    setReplies((prev) => ({
      ...prev,
      [item.id]: data.reply
    }))
  } catch (error) {
    console.error('Fetch error:', error)
    alert('Could not connect to AI backend')
  }
}

  return (
    <div style={styles.container}>
      <h1>
        Private Feedback Inbox
        {feedback.length > 0 && (
          <span style={styles.badge}>{feedback.length}</span>
        )}
      </h1>

      {feedback.length === 0 ? (
        <p>No private feedback yet.</p>
      ) : (
        feedback.map((item) => (
          <div key={item.id} style={styles.card}>
            <h2>{item.rating} ★</h2>
            <p><strong>Email:</strong> {item.email || 'No email'}</p>
            <p><strong>Comment:</strong> {item.comment || 'No comment'}</p>
            <p><strong>Date:</strong> {new Date(item.created_at).toLocaleString()}</p>

            <button onClick={() => markResolved(item.id)} style={styles.resolveButton}>
              Mark as Resolved
            </button>

            <button onClick={() => generateReply(item)} style={styles.aiButton}>
              Generate Reply
            </button>

            {replies[item.id] && (
              <div style={styles.replyBox}>
                <strong>AI Reply:</strong>
                <p>{replies[item.id]}</p>
              </div>
            )}
          </div>
        ))
      )}
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
  card: {
    backgroundColor: '#1f2937',
    padding: '20px',
    borderRadius: '12px',
    marginBottom: '16px'
  },
  badge: {
    marginLeft: '12px',
    backgroundColor: '#ef4444',
    color: 'white',
    borderRadius: '999px',
    padding: '6px 12px',
    fontSize: '24px'
  },
  resolveButton: {
    marginTop: '10px',
    padding: '8px 12px',
    backgroundColor: '#10b981',
    border: 'none',
    borderRadius: '6px',
    color: 'white',
    cursor: 'pointer'
  },
  aiButton: {
    marginLeft: '10px',
    marginTop: '10px',
    padding: '8px 12px',
    backgroundColor: '#6366f1',
    border: 'none',
    borderRadius: '6px',
    color: 'white',
    cursor: 'pointer'
  },
  replyBox: {
    marginTop: '16px',
    backgroundColor: '#111827',
    padding: '16px',
    borderRadius: '8px',
    textAlign: 'left'
  }
}

export default PrivateFeedback