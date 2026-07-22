import { useEffect, useState } from 'react'
import { supabase } from './supabase'

function Settings() {
  const [settings, setSettings] = useState(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    supabase.from('settings').select('*').limit(1).single().then(({ data }) => {
      if (data) setSettings(data)
    })
  }, [])

  const handleChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }))
  }

  const saveSettings = async () => {
    setSaving(true)
    setMessage('')
    const { error } = await supabase.from('settings').update({
      business_name: settings.business_name,
      google_review_link: settings.google_review_link,
      facebook_review_link: settings.facebook_review_link,
      reply_tone: settings.reply_tone,
      feedback_headline: settings.feedback_headline,
      low_score_message: settings.low_score_message,
      request_template: settings.request_template,
      updated_at: new Date().toISOString()
    }).eq('id', settings.id)

    setSaving(false)
    setMessage(error ? 'Failed to save settings.' : 'success')
  }

  if (!settings) {
    return <div style={styles.page}><p style={{ color: '#64748b' }}>Loading settings…</p></div>
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Settings</h1>
          <p style={styles.subtitle}>Configure your reputation management preferences</p>
        </div>
      </div>

      <div style={styles.sections}>
        {/* Business */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Business Info</h2>
          <p style={styles.sectionDesc}>Basic information about your business</p>
          <div style={styles.fields}>
            <Field label="Business Name" value={settings.business_name || ''} onChange={v => handleChange('business_name', v)} placeholder="e.g. Honeyplate" />
            <Field label="Google Review Link" value={settings.google_review_link || ''} onChange={v => handleChange('google_review_link', v)} placeholder="https://search.google.com/local/writereview?placeid=..." />
            <Field label="Facebook Review Link" value={settings.facebook_review_link || ''} onChange={v => handleChange('facebook_review_link', v)} placeholder="https://www.facebook.com/yourpage/reviews" />
          </div>
        </div>

        {/* Feedback page */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Feedback Page</h2>
          <p style={styles.sectionDesc}>Customize what customers see when they rate you</p>
          <div style={styles.fields}>
            <Field label="Headline" value={settings.feedback_headline || ''} onChange={v => handleChange('feedback_headline', v)} placeholder="How was your experience?" />
            <Field label="Low-Score Thank-You Message" value={settings.low_score_message || ''} onChange={v => handleChange('low_score_message', v)} multiline placeholder="Thank you for your feedback. We'll be in touch shortly." />
          </div>
        </div>

        {/* AI & Tone */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>AI & Brand Voice</h2>
          <p style={styles.sectionDesc}>Control how AI generates replies on your behalf</p>
          <div style={styles.fields}>
            <div style={styles.field}>
              <label style={styles.label}>Reply Tone</label>
              <select
                value={settings.reply_tone || 'Friendly'}
                onChange={e => handleChange('reply_tone', e.target.value)}
                style={styles.select}
              >
                <option value="Friendly">Friendly</option>
                <option value="Professional">Professional</option>
                <option value="Casual">Casual</option>
              </select>
            </div>
            <Field label="Review Request Message Template" value={settings.request_template || ''} onChange={v => handleChange('request_template', v)} multiline placeholder="Hi {name}, we'd love to hear about your experience…" />
          </div>
        </div>

        {/* Save */}
        <div style={styles.saveRow}>
          {message === 'success' && (
            <span style={styles.successMsg}>✓ Settings saved</span>
          )}
          {message && message !== 'success' && (
            <span style={styles.errorMsg}>✕ {message}</span>
          )}
          <button onClick={saveSettings} disabled={saving} style={styles.saveBtn}>
            {saving ? 'Saving…' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, value, onChange, placeholder, multiline }) {
  const inputStyle = {
    width: '100%',
    padding: '11px 14px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    fontSize: '14px',
    color: '#0f172a',
    outline: 'none',
    backgroundColor: 'white',
    resize: multiline ? 'vertical' : undefined,
    minHeight: multiline ? '90px' : undefined,
    fontFamily: 'inherit'
  }

  return (
    <div style={fieldStyles.field}>
      <label style={fieldStyles.label}>{label}</label>
      {multiline ? (
        <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={inputStyle} />
      ) : (
        <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={inputStyle} />
      )}
    </div>
  )
}

const fieldStyles = {
  field: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '14px', fontWeight: '500', color: '#374151' }
}

const styles = {
  page: { padding: '32px', maxWidth: '720px' },
  header: { marginBottom: '28px' },
  title: { fontSize: '24px', fontWeight: '700', color: '#0f172a', marginBottom: '4px' },
  subtitle: { color: '#64748b', fontSize: '14px' },
  sections: { display: 'flex', flexDirection: 'column', gap: '16px' },
  section: { backgroundColor: 'white', borderRadius: '12px', padding: '28px', border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' },
  sectionTitle: { fontSize: '16px', fontWeight: '600', color: '#0f172a', marginBottom: '4px' },
  sectionDesc: { fontSize: '13px', color: '#64748b', marginBottom: '20px' },
  fields: { display: 'flex', flexDirection: 'column', gap: '16px' },
  field: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '14px', fontWeight: '500', color: '#374151' },
  select: { padding: '11px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', color: '#0f172a', backgroundColor: 'white', width: '100%' },
  saveRow: { display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '16px', paddingTop: '4px' },
  saveBtn: { padding: '11px 28px', borderRadius: '8px', border: 'none', backgroundColor: '#7c3aed', color: 'white', fontWeight: '600', fontSize: '14px', cursor: 'pointer' },
  successMsg: { fontSize: '14px', color: '#10b981', fontWeight: '500' },
  errorMsg: { fontSize: '14px', color: '#ef4444', fontWeight: '500' }
}

export default Settings
