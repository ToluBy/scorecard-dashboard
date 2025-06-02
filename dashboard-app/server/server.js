const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Allow CORS from your Angular app
app.use(cors({
  origin: 'http://localhost:64374', // Change if your Angular app runs on a different port
}));

app.use(express.json());

// Databricks config (use environment variables for security)
const DATABRICKS_URL = process.env.DATABRICKS_URL;
const DATABRICKS_TOKEN = process.env.DATABRICKS_TOKEN;
const WAREHOUSE_ID = process.env.DATABRICKS_WAREHOUSE_ID;

// Proxy endpoint for SQL queries
app.post('/api/databricks/query', async (req, res) => {
  try {
    const { statement } = req.body;
    const response = await axios.post(
      `${DATABRICKS_URL}/api/2.0/sql/statements`,
      {
        statement,
        warehouse_id: WAREHOUSE_ID
      },
      {
        headers: {
          'Authorization': `Bearer ${DATABRICKS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    res.json(response.data);
  } catch (error) {
    console.error('Databricks proxy error:', error.response?.data || error.message);
    res.status(500).json({ error: error.response?.data || error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`);
});