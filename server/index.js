require('dotenv').config()
const express = require('express')
const cors = require('cors')
const axios = require('axios')
const { google } = require('googleapis')
const { createClient } = require('@supabase/supabase-js')
const Anthropic = require('@anthropic-ai/sdk')




const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
})

const app = express()
const PORT = 3001
let googleTokens = null


const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

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
async function getFreshTokens() {
  const { data, error } = await supabase
    .from('google_tokens')
    .select('tokens')
    .eq('id', 'default')
    .single()

  if (error || !data?.tokens) {
    throw new Error('Google tokens not found')
  }

  const tokens = data.tokens
  oauth2Client.setCredentials(tokens)

  if (tokens.expiry_date && tokens.expiry_date < Date.now()) {
    const { credentials } = await oauth2Client.refreshAccessToken()

    const updatedTokens = {
      ...tokens,
      ...credentials
    }

    await supabase
      .from('google_tokens')
      .upsert({
        id: 'default',
        tokens: updatedTokens
      })

    oauth2Client.setCredentials(updatedTokens)
  }

  return oauth2Client
}
// Step 1: Redirect to Google login
app.get('/auth/google', (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
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

const { error } = await supabase
  .from('google_tokens')
  .upsert({
    id: 'default',
    tokens
  })

if (error) {
  console.error('Supabase token save error:', error)
  return res.send('Google connected, but token save failed.')
}

console.log('Google connected successfully')
console.log('Google tokens saved to Supabase')

res.send('Google account connected! You can close this tab.')
  } catch (error) {
    console.error('Google auth error:', error)
    res.send('Error connecting Google')
  }
})
// 👇 ADD EVERYTHING BELOW THIS LINE

app.get('/api/google/reviews', async (req, res) => {
  try {
    const auth = await getFreshTokens()
    googleTokens = auth.credentials

    // Step 1: Get business accounts
    const accountApi = google.mybusinessaccountmanagement({
      version: 'v1',
      auth
    })

    const accountsResponse = await accountApi.accounts.list()
    const accounts = accountsResponse.data.accounts || []

    if (accounts.length === 0) {
      return res.json({
        success: false,
        error: 'No Google Business accounts found'
      })
    }

    const accountName = accounts[0].name

    // Step 2: Get locations
    const businessInfo = google.mybusinessbusinessinformation({
      version: 'v1',
      auth
    })

    const locationsResponse = await businessInfo.accounts.locations.list({
      parent: accountName,
      readMask: 'name,title'
    })

    const locations = locationsResponse.data.locations || []

    if (locations.length === 0) {
      return res.json({
        success: false,
        error: 'No business locations found'
      })
    }

    const locationName = locations[0].name
    const reviewParent = `${accountName}/${locationName}`

    // Step 3: Get all reviews via pagination
    const allReviews = []
    let pageToken = null

    do {
      const params = { pageSize: 50 }
      if (pageToken) params.pageToken = pageToken

      const reviewsResponse = await axios.get(
        `https://mybusiness.googleapis.com/v4/${reviewParent}/reviews`,
        {
          headers: { Authorization: `Bearer ${auth.credentials.access_token}` },
          params
        }
      )

      const batch = reviewsResponse.data.reviews || []
      allReviews.push(...batch)
      pageToken = reviewsResponse.data.nextPageToken || null
    } while (pageToken)

    // Step 4: Save all reviews into Supabase
    for (const review of allReviews) {
      await supabase.from('reviews').upsert({
        review_id: review.reviewId,
        reviewer_name: review.reviewer?.displayName || 'Anonymous',
        rating:
          review.starRating === 'FIVE' ? 5 :
          review.starRating === 'FOUR' ? 4 :
          review.starRating === 'THREE' ? 3 :
          review.starRating === 'TWO' ? 2 :
          review.starRating === 'ONE' ? 1 : 0,
        review_text: review.comment || '',
        platform: 'Google',
        reviewed_at: review.createTime
      }, { onConflict: 'review_id' })
    }

    res.json({
      success: true,
      synced: allReviews.length,
      reviews: allReviews
    })
  } catch (error) {
    console.error('Google review sync error:', error.response?.data || error.message)

    res.status(500).json({
      error: 'Failed to sync Google reviews',
      details: error.response?.data || error.message
    })
  }
})
app.post('/api/google/reply', async (req, res) => {
  const { reviewName, replyText } = req.body

  if (!reviewName || !replyText) {
    return res.status(400).json({
      error: 'Missing reviewName or replyText'
    })
  }

  try {
    const auth = await getFreshTokens()

    await axios.put(
      `https://mybusiness.googleapis.com/v4/${reviewName}/reply`,
      { comment: replyText },
      {
        headers: {
          Authorization: `Bearer ${auth.credentials.access_token}`
        }
      }
    )

    res.json({ success: true })
  } catch (error) {
    console.error('Google reply post error:', error.response?.data || error.message)

    res.status(500).json({
      error: 'Failed to post reply to Google',
      details: error.response?.data || error.message
    })
  }
})  
app.get('/api/facebook/reviews', async (req, res) => {
  const pageId = process.env.FACEBOOK_PAGE_ID
  const token = process.env.FACEBOOK_PAGE_TOKEN

  try {
    const response = await axios.get(
      `https://graph.facebook.com/v25.0/${pageId}/ratings`,
      {
        params: {
          fields: 'reviewer,rating,review_text,created_time',
          access_token: token
        }
      }
    )

    res.json({
      success: true,
      reviews: response.data.data
    })
  } catch (error) {
  console.error(
    'Facebook reviews error:',
    error.response?.data || error.message
  )

  res.status(error.response?.status || 500).json({
    error: 'Failed to fetch Facebook reviews',
    details: error.response?.data || error.message
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