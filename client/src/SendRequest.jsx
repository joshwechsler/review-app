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
      <h1>Send Review Request</h1>

      <form onSubmit={handleSend}>
        <input
          type="text"
          placeholder="Customer Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ display: 'block', marginBottom: '16px', padding: '10px', width: '300px' }}
        />

        <input
          type="email"
          placeholder="Customer Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ display: 'block', marginBottom: '16px', padding: '10px', width: '300px' }}
        />

        <button type="submit" style={{ padding: '10px 16px' }}>
          Send Request
        </button>
      </form>
    </div>
  )
}

export default SendRequest