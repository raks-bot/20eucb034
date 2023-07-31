const express = require('express');
const axios = require('axios');

const app = express();
const PORT = 8008;
const TIMEOUT_MS = 500;

// Middleware to parse query parameters
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// GET /numbers
app.get('/numbers', async (req, res) => {
  const urls = req.query.url;
  if (!urls) {
    return res.status(400).json({ error: 'No URLs provided' });
  }

  try {
    const requests = urls.map(async (url) => {
      try {
        const response = await axios.get(url, { timeout: TIMEOUT_MS });
        return response.data.numbers;
      } catch (error) {
        // Ignore the error and return an empty array
        return [];
      }
    });

    // Wait for all requests to complete or time out
    const results = await Promise.allSettled(requests);

    // Extract and merge numbers from valid responses
    const mergedNumbers = results.reduce((acc, result) => {
      if (result.status === 'fulfilled' && Array.isArray(result.value)) {
        acc.push(...result.value);
      }
      return acc;
    }, []);

    // Remove duplicates and sort in ascending order
    const uniqueNumbers = [...new Set(mergedNumbers)].sort((a, b) => a - b);

    return res.json({ numbers: uniqueNumbers });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`number-management-service is running on port ${PORT}`);
});