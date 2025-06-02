const express = require('express');
const cors = require('cors');
const sql = require('mssql');
const app = express();
app.use(cors({ origin: 'http://localhost:64374' }));

const { DefaultAzureCredential } = require('@azure/identity');

const credential = new DefaultAzureCredential();

async function getToken() {
  const tokenResponse = await credential.getToken('https://database.windows.net/');
  console.log('Token Response:', tokenResponse);
  return tokenResponse.token;
}

async function getSqlConnection() {
  const accessToken = await getToken();
  console.log('Access Token (before connect):', accessToken, typeof accessToken, accessToken instanceof String);
  
  if (!accessToken || typeof accessToken !== 'string') {
    throw new Error('Access token is missing or not a string');
  }
  
  const config = {
    server: 'vzn-eastus2-zelos-test-sql-01.database.windows.net',
    database: 'sql-server-db',
    authentication: {
      type: 'azure-active-directory-access-token'
    },
    options: {
      encrypt: true,
      token: accessToken // this must be a string
    }
  };
  try {
    const pool = await sql.connect(config);
    return pool;
  } catch (err) {
    console.error("Error connecting to SQL:", err);
    throw err; // Re-throw the error to be caught by the route handler
  }
}

// Endpoint
app.get('/api/PairingScorecard', async (req, res) => {
  try {
    const pool = await getSqlConnection();
    const result = await pool.request().query('EXECUTE [dashboard].[GET_PAIRING_SCORES] @scorecard_name = "Pairing V1"');
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/PairingScorecard/FinalScores', async (req, res) => {
  try {
    const pool = await getSqlConnection();
    const result = await pool.request().query('SELECT * FROM dashboard.pairing_baseline_data');
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/PairingScorecard/TeamScores', async (req, res) => {
  try {
    const pool = await getSqlConnection();
    const result = await pool.request().query('SELECT * FROM dashboard.pairing_baseline_data');
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/PairingScorecard/BaselineScores', async (req, res) => {
  try {
    const pool = await getSqlConnection();
    const result = await pool.request().query(`
      SELECT
        MAX([VizTech_Score_Baseline_Pairing_Efficiency%]) AS efficiency,
        MAX([VizTech_Score_Baseline_Pairing_Rotation%]) AS rotation,
        MAX([VizTech_Score_Baseline_Pairing_Assignment%]) AS assignment,
        MAX([VizTech_Score_Baseline_Pairing_Frequency%]) AS frequency
      FROM [dashboard].[pairing_baseline_data]`
    );
    res.json(result.recordset[0]);
  } catch (err) {
    console.error("Error in /api/PairingScorecard/BaselineScores:", err);
    res.status(500).json({ error: err.message });
  }
});

const port = process.env.PORT || 3002;
app.listen(port, () => console.log(`Pairing Scorecard API running on port ${port}`));