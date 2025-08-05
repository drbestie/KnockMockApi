require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();

// Configuration
const PORT = process.env.PORT || 3000;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN; // Optional for private repos
const REPO_CONFIG = {
  owner: 'drbestie',
  repo: 'KnockMock',
  branch: 'master'
};

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.get('/api/topics', async (req, res) => {
  try {
    const url = `https://api.github.com/repos/${REPO_CONFIG.owner}/${REPO_CONFIG.repo}/git/trees/${REPO_CONFIG.branch}?recursive=1`;
    const headers = GITHUB_TOKEN ? { Authorization: `token ${GITHUB_TOKEN}` } : {};
    
    const response = await axios.get(url, { headers });
    const topics = processTree(response.data.tree);
    res.json({ success: true, data: topics });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch topics' });
  }
});

app.get('/api/test/:path(*)', async (req, res) => {
  try {
    const path = req.params.path;
    const url = `https://raw.githubusercontent.com/${REPO_CONFIG.owner}/${REPO_CONFIG.repo}/${REPO_CONFIG.branch}/${path}`;
    const headers = GITHUB_TOKEN ? { Authorization: `token ${GITHUB_TOKEN}` } : {};
    
    const response = await axios.get(url, { headers });
    res.send(response.data);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).send('Failed to fetch test content');
  }
});

// Helper function
function processTree(tree) {
  const topics = {};
  
  tree.forEach(item => {
    if (item.type === 'blob' && item.path.endsWith('.html')) {
      const parts = item.path.split('/');
      if (parts.length >= 2) {
        const topic = parts[0];
        const testName = parts[1].replace('.html', '');
        
        if (!topics[topic]) {
          topics[topic] = {
            name: formatName(topic),
            tests: []
          };
        }
        
        topics[topic].tests.push({
          name: formatName(testName),
          path: item.path
        });
      }
    }
  });
  
  return topics;
}

function formatName(str) {
  return str
    .replace(/_/g, ' ')
    .replace(/(^|\s)\S/g, l => l.toUpperCase());
}

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
