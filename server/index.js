require('dotenv').config()
const express = require('express')
const cors = require('cors')
const axios = require('axios')
const { google } = require('googleapis')
const Anthropic = require('@anthropic-ai/sdk')

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
})

const app = express()
const PORT = 3001
let googleTokens = null

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
  res.send('Backend is running')
})

app.post('/api/update-klaviyo-score', async (req, res) => {
  console.log('Klaviyo route hit:', req.body)

  const { email, rating } = req.body

  if (!email || !rating) {
    return res.status(400).json({ error: 'Email and rating are required' })
  }

  try {
    await axios.post(
      'https://a.klaviyo.com/api/profile-import',
      {
        data: {
          type: 'profile',
          attributes: {
            email: email,
            properties: {
              review_score: rating
            }
          }
        }
      },
      {
        headers: {
          Authorization: `Klaviyo-API-Key ${process.env.KLAVIYO_PRIVATE_KEY}`,
          accept: 'application/json',
          'content-type': 'application/json',
          revision: '2024-10-15'
        }
      }
    )

    res.json({ success: true })
  } catch (error) {
    console.error('Klaviyo error:', error.response?.data || error.message)

    res.status(500).json({
      error: 'Failed to update Klaviyo score',
      details: error.response?.data || error.message
    })
  }
})
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
)

// Step 1: Redirect to Google login
app.get('/auth/google', (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/business.manage']
  })

  res.redirect(url)
})

// Step 2: Handle Google callback
app.get('/auth/google/callback', async (req, res) => {
  const code = req.query.code

  try {
    const { tokens } = await oauth2Client.getToken(code)

    googleTokens = tokens
    oauth2Client.setCredentials(tokens)

    console.log('Google connected successfully')
    console.log('Google tokens saved temporarily')

    res.send('Google account connected! You can close this tab.')
  } catch (error) {
    console.error('Google auth error:', error)
    res.send('Error connecting Google')
  }
})
// 👇 ADD EVERYTHING BELOW THIS LINE

app.get('/api/google/reviews', async (req, res) => {
  if (!googleTokens) {
    return res.status(401).json({
      error: 'Google account not connected yet'
    })
  }

  try {
    oauth2Client.setCredentials(googleTokens)

    const mybusinessaccountmanagement = google.mybusinessaccountmanagement({
      version: 'v1',
      auth: oauth2Client
    })

    const accountsResponse = await mybusinessaccountmanagement.accounts.list()
    const accounts = accountsResponse.data.accounts || []

    res.json({
      success: true,
      accounts
    })
   } catch (error) {
    console.error('AI reply error FULL:', error)

    res.status(500).json({
      error: 'Failed to generate reply',
      details: error.message
    })
  }
})
app.post('/api/generate-reply', async (req, res) => {
  console.log('Generate reply route hit:', req.body)

  const { rating, comment, email } = req.body

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 300,
      messages: [
        {
          role: 'user',
          content: `Write a short, warm customer service reply to this private feedback.

Rules:
- Do not include a subject line
- Do not include placeholders like [Your Name]
- Do not mention Google reviews
- Keep it under 80 words
- Sound human, calm, and professional
- Acknowledge the issue and say we will follow up

Rating: ${rating} stars
Customer email: ${email || 'Unknown'}
Comment: ${comment || 'No comment provided'}`
        }
      ]
    })

    res.json({ reply: message.content[0].text })
  } catch (error) {
    console.error('AI reply error:', error)
    res.status(500).json({ error: 'Failed to generate reply' })
  }
})
app.post('/api/generate-social-post', async (req, res) => {
  console.log('Generate social post route hit:', req.body)

  const { reviewerName, rating, reviewText, tone } = req.body

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 300,
      messages: [
        {
          role: 'user',
          content: `Turn this customer review into a social media post for a food business.

Tone: ${tone || 'Friendly'}

Rules:
- Keep it under 200 characters
- Include 2–4 relevant hashtags
- Make it engaging and social-media ready

Reviewer: ${reviewerName || 'Customer'}
Rating: ${rating} stars
Review: ${reviewText || 'No review text'}`
        }
      ]
    })

    res.json({ post: message.content[0].text })
  } catch (error) {
    console.error('Social post error:', error)
    res.status(500).json({
      error: 'Failed to generate social post',
      details: error.message
    })
  }
})
app.listen(PORT, () => {
  console.log('Server running on port 3001')
})