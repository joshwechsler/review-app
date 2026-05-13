import { useEffect, useState } from 'react'
import { supabase } from './supabase'

function SendRequest() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')

  const handleSend = async (e) => {
    e.preventDefault()

    if (!email) {
      alert('Please enter customer email')
      return
    }

    const { error } = await supabase.from('feedback_responses').insert([
      {
        email,
        status: 'sent'
      }
    ])

    if (error) {
      console.error(error)
      alert('Could not log request')
      return
    }

    const feedbackLink = `${window.location.origin}/feedback?email=${encodeURIComponent(email)}`

alert(`Request logged as sent. Feedback link: ${feedbackLink}`)
  }

  return (
    <div style={{ padding: '40px', color: 'white', backgroundColor: '#111827', minHeight: '100vh' }}>
      <h1 style={styles.title}>Send Review Request</h1>

      <form onSubmit={handleSubmit} style={styles.card}>
  <input
    type="text"
    placeholder="Customer Name"
    value={name}
    onChange={(e) => setName(e.target.value)}
    style={styles.input}
  />

  <input
    type="email"
    placeholder="Customer Email"
    value={email}
    onChange={(e) => setEmail(e.target.value)}
    style={styles.input}
  />

  <button type="submit" style={styles.button}>
    Send Request
  </button>
</form>
    </div>
  )
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#111827',
    color: 'white',
    padding: '40px 16px',
    textAlign: 'center'
  },
  title: {
    color: '#ffffff',
    textAlign: 'center',
    fontSize: 'clamp(36px, 6vw, 72px)',
    lineHeight: 1.1,
    marginBottom: '32px'
  },
  card: {
    width: '100%',
    maxWidth: '520px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  input: {
    width: '100%',
    padding: '14px',
    borderRadius: '8px',
    border: '1px solid #6b7280',
    backgroundColor: '#3a3a3a',
    color: 'white',
    fontSize: '16px',
    boxSizing: 'border-box'
  },
  button: {
    width: '100%',
    padding: '14px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#6366f1',
    color: 'white',
    fontWeight: 'bold',
    fontSize: '16px',
    cursor: 'pointer'
  }
}

export default SendRequest