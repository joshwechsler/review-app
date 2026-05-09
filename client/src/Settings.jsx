import { useEffect, useState } from 'react'
import { supabase } from './supabase'

function Settings() {
  const [settings, setSettings] = useState(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchSettings()
  }, [])

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

  const handleChange = (field, value) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value
    }))
  }

  const saveSettings = async () => {
    setSaving(true)
    setMessage('')

    const { error } = await supabase
      .from('settings')
      .update({
        business_name: settings.business_name,
        google_review_link: settings.google_review_link,
        reply_tone: settings.reply_tone,
        feedback_headline: settings.feedback_headline,
        low_score_message: settings.low_score_message,
        request_template: settings.request_template,
        updated_at: new Date().toISOString()
      })
      .eq('id', settings.id)

    setSaving(false)

    if (error) {
      console.error(error)
      setMessage('Failed to save settings.')
      return
    }

    setMessage('Settings saved successfully.')
  }

  if (!settings) {
    return <div style={styles.container}>Loading settings...</div>
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Settings</h1>

      <div style={styles.card}>
        <label>Business Name</label>
        <input
          value={settings.business_name || ''}
          onChange={(e) => handleChange('business_name', e.target.value)}
          style={styles.input}
        />

        <label>Google Review Link</label>
        <input
          value={settings.google_review_link || ''}
          onChange={(e) => handleChange('google_review_link', e.target.value)}
          style={styles.input}
        />

        <label>Reply Tone / Brand Voice</label>
        <select
          value={settings.reply_tone || 'Friendly'}
          onChange={(e) => handleChange('reply_tone', e.target.value)}
          style={styles.input}
        >
          <option value="Professional">Professional</option>
          <option value="Friendly">Friendly</option>
          <option value="Casual">Casual</option>
        </select>

        <label>Feedback Page Headline</label>
        <input
          value={settings.feedback_headline || ''}
          onChange={(e) => handleChange('feedback_headline', e.target.value)}
          style={styles.input}
        />

        <label>Low-score Thank-you Message</label>
        <textarea
          value={settings.low_score_message || ''}
          onChange={(e) => handleChange('low_score_message', e.target.value)}
          style={styles.textarea}
        />

        <label>Feedback Request Message Template</label>
        <textarea
          value={settings.request_template || ''}
          onChange={(e) => handleChange('request_template', e.target.value)}
          style={styles.textarea}
        />

        <button
          onClick={saveSettings}
          disabled={saving}
          style={styles.button}
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>

        {message && <p>{message}</p>}
      </div>
    </div>
  )
}

const styles = {
  title: {
  color: 'white',
  textAlign: 'center',
  fontSize: 'clamp(36px, 6vw, 72px)',
  lineHeight: 1.1,
  marginBottom: '24px'
},
  container: {
    minHeight: '100vh',
    backgroundColor: '#111827',
    color: 'white',
    padding: '40px'
  },
  card: {
    backgroundColor: '#1f2937',
    padding: '24px',
    borderRadius: '12px',
    maxWidth: '700px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  input: {
    padding: '10px',
    borderRadius: '8px',
    border: 'none'
  },
  textarea: {
    padding: '10px',
    borderRadius: '8px',
    border: 'none',
    minHeight: '90px'
  },
  button: {
    marginTop: '12px',
    padding: '10px 14px',
    backgroundColor: '#10b981',
    border: 'none',
    borderRadius: '8px',
    color: 'white',
    cursor: 'pointer'
  }
}

export default Settings