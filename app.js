


const express = require('express');
const axios = require('axios');
const nodemailer = require('nodemailer');
const mongoose = require('mongoose');
const SearchResult = require('./SearchResult'); // Import the model
require('dotenv').config();

const app = express();
const port = 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

// Connect to MongoDB locally
const uri = `mongodb://localhost:27018/${process.env.DB_NAME}`; 

mongoose.connect(uri)
  .then(() => console.log('MongoDB connected successfully'))
  .catch((error) => console.error('MongoDB connection error:', error));


const fetchStackOverflow = async (query, sort) => {
  const validSortOptions = {
    relevance: 'relevance',
    date: 'creation',
    upvotes: 'votes'
  };
  const sortParam = validSortOptions[sort] || 'relevance';
  const encodedQuery = encodeURIComponent(query);
  const url = `https://api.stackexchange.com/2.3/search?order=desc&sort=${sortParam}&intitle=${encodedQuery}&site=stackoverflow&filter=withbody`;

  try {
    const response = await axios.get(url);
    const items = response.data.items || [];

    const detailedResults = await Promise.all(items.map(async (item) => {
      const answersUrl = `https://api.stackexchange.com/2.3/questions/${item.question_id}/answers?order=desc&sort=votes&site=stackoverflow&filter=withbody`;
      const answersResponse = await axios.get(answersUrl);
      const topAnswer = answersResponse.data.items.length > 0 ? answersResponse.data.items[0] : null;

      return {
        title: item.title,
        link: item.link,
        summary: item.body.substring(0, 200),
        topAnswer: topAnswer ? topAnswer.body.substring(0, 200) : 'No top answer found',
      };
    }));

    return detailedResults;
  } catch (error) {
    console.error('Error fetching Stack Overflow data:', error.message);
    throw new Error('Unable to fetch data from Stack Overflow');
  }
};

// Fetch data from Reddit API
const fetchReddit = async (query, sort) => {
  const validSortOptions = {
    relevance: 'relevance',
    top: 'top',
    date: 'new',
    comments: 'comments'
  };
  const sortParam = validSortOptions[sort] || 'relevance';
  const encodedQuery = encodeURIComponent(query);
  const url = `https://www.reddit.com/search.json?q=${encodedQuery}&sort=${sortParam}`;

  try {
    const response = await axios.get(url);
    const items = response.data.data.children || [];

    const detailedResults = items.map((item) => {
      return {
        title: item.data.title,
        link: item.data.url,
        summary: item.data.selftext ? item.data.selftext.substring(0, 200) : 'No summary available',
      };
    });

    return detailedResults;
  } catch (error) {
    console.error('Error fetching Reddit data:', error.message);
    throw new Error('Unable to fetch data from Reddit');
  }
};

// Endpoint to handle search queries
app.get('/search', async (req, res) => {
  const { q, sort, source } = req.query;

  try {
    let stackOverflowResults = [];
    let redditResults = [];

    if (source === 'all' || source === 'StackOverflow') {
      stackOverflowResults = await fetchStackOverflow(q, sort);
    }

    if (source === 'all' || source === 'Reddit') {
      redditResults = await fetchReddit(q, sort);
    }

    // Save search results to database
    const searchResult = new SearchResult({
      query: q,
      results: {
        stackOverflow: stackOverflowResults,
        reddit: redditResults,
      },
    });

    await searchResult.save(); // Save to database

    res.json({
      stackOverflow: stackOverflowResults,
      reddit: redditResults,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching search results' });
  }
});

// Endpoint to send email with search results
app.post('/send-email', async (req, res) => {
  const { email, query, selectedResults } = req.body;

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const message = `
    <h3>Results for your query: ${query}</h3>
    ${selectedResults.map((result) => `<p><strong>${result.source}:</strong> <a href="${result.link}">${result.link}</a></p>`).join('')}
  `;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: `Search Results for ${query}`,
      html: message,
    });

    res.json({ message: 'Email sent successfully' });
  } catch (error) {
    console.error('Error sending email:', error.message);
    res.status(500).json({ message: 'Error sending email' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
