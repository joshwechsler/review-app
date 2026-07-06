import { useState } from 'react'
import { supabase } from './supabase'

function SendRequest() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSend = async (e) => {
    e.preventDefault()
    if (!email) return alert('Please enter customer email')

    setLoading(true)

    const { error } = await supabase.from('feedback_responses').insert([
      { email, status: 'sent' }
    ])

    if (error) {
      console.error(error)
      alert('Could not log request')
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  const reset = () => {
    setName('')
    setEmail('')
    setSent(false)
  }

  const feedbackLink = `${window.location.origin}/feedback?email=${encodeURIComponent(email)}`

  if (sent) {
    return (
      <div style={styles.page}>
        <div style={styles.header}>
          <h1 style={styles.title}>Send Request</h1>
        </div>
        <div style={styles.successCard}>
          <div style={styles.successIcon}>✓</div>
          <h2 style={styles.successTitle}>Request Logged</h2>
          <p style={styles.successSub}>Send this link to your customer:</p>
          <div style={styles.linkBox}>
            <span style={styles.linkText}>{feedbackLink}</span>
            <button onClick={() => navigator.clipboard.writeText(feedbackLink)} style={styles.copyBtn}>
              Copy Link
            </button>
          </div>
          <p style={styles.note}>Note: Automatic email sending coming soon. For now, copy and share the link manually via email or text.</p>
          <button onClick={reset} style={styles.newBtn}>Send Another</button>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Send Review Request</h1>
          <p style={styles.subtitle}>Generate a feedback link to share with your customer</p>
        </div>
      </div>

      <div style={styles.card}>
        <form onSubmit={handleSend} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Customer Name</label>
            <input
              type="text"
              placeholder="e.g. Jane Smith"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Customer Email <span style={styles.required}>*</span></label>
            <input
              type="email"
              placeholder="e.g. jane@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              required
            />
          </div>

          <button type="submit" style={styles.submitBtn} disabled={loading}>
            {loading ? 'Logging…' : '↑ Generate Feedback Link'}
          </button>
        </form>

        <div style={styles.howItWorks}>
          <p style={styles.howTitle}>How it works</p>
          <div style={styles.steps}>
            <div style={styles.step}><span style={styles.stepNum}>1</span> Enter the customer's email and generate a link</div>
            <div style={styles.step}><span style={styles.stepNum}>2</span> Share the link via email or text</div>
            <div style={styles.step}><span style={styles.stepNum}>3</span> 4-5 star ratings → redirected to Google. 1-3 star → captured privately</div>
          </div>
        </div>
      </div>
    </div>
  )
}

const styles = {
  page: { padding: '32px', maxWidth: '640px' },
  header: { marginBottom: '24px' },
  title: { fontSize: '24px', fontWeight: '700', color: '#0f172a', marginBottom: '4px' },
  subtitle: { color: '#64748b', fontSize: '14px' },
  card: { backgroundColor: 'white', borderRadius: '12px', padding: '32px', border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' },
  form: { display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '32px' },
  field: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '14px', fontWeight: '500', color: '#374151' },
  required: { color: '#ef4444' },
  input: { padding: '11px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', color: '#0f172a', outline: 'none', width: '100%' },
  submitBtn: { padding: '12px', borderRadius: '8px', border: 'none', backgroundColor: '#7c3aed', color: 'white', fontWeight: '600', fontSize: '15px', cursor: 'pointer' },
  howItWorks: { borderTop: '1px solid #f1f5f9', paddingTop: '24px' },
  howTitle: { fontSize: '13px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '16px' },
  steps: { display: 'flex', flexDirection: 'column', gap: '12px' },
  step: { display: 'flex', alignItems: 'flex-start', gap: '12px', fontSize: '14px', color: '#475569', lineHeight: 1.5 },
  stepNum: { width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#ede9fe', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700', flexShrink: 0 },
  successCard: { backgroundColor: 'white', borderRadius: '12px', padding: '48px 32px', border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', textAlign: 'center' },
  successIcon: { width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#d1fae5', color: '#10b981', fontSize: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' },
  successTitle: { fontSize: '20px', fontWeight: '700', marginBottom: '8px', color: '#0f172a' },
  successSub: { color: '#64748b', fontSize: '14px', marginBottom: '16px' },
  linkBox: { display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#f8fafc', borderRadius: '8px', padding: '12px 16px', border: '1px solid #e2e8f0', marginBottom: '16px', textAlign: 'left' },
  linkText: { flex: 1, fontSize: '13px', color: '#475569', wordBreak: 'break-all' },
  copyBtn: { padding: '6px 14px', borderRadius: '6px', border: 'none', backgroundColor: '#7c3aed', color: 'white', fontSize: '13px', fontWeight: '500', cursor: 'pointer', flexShrink: 0 },
  note: { fontSize: '13px', color: '#94a3b8', marginBottom: '24px', lineHeight: 1.5 },
  newBtn: { padding: '10px 24px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: 'white', fontSize: '14px', fontWeight: '500', cursor: 'pointer', color: '#374151' }
}

export default SendRequest
