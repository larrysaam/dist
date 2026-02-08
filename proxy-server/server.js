const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = 3001;

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Proxy endpoint
app.all('/api/proxy/*', async (req, res) => {
    try {
        // Extract the path after /api/proxy/
        const targetPath = req.params[0];
        const targetUrl = `https://s3pv2cm.smobilpay.com/v2/${targetPath}`;
        
        // Build query string if present
        const queryString = Object.keys(req.query).length > 0 
            ? '?' + new URLSearchParams(req.query).toString()
            : '';
        
        const fullUrl = targetUrl + queryString;
        
        console.log('Proxying request to:', fullUrl);
        console.log('Method:', req.method);
        console.log('Headers:', JSON.stringify(req.headers, null, 2));
        console.log('Body:', req.body ? JSON.stringify(req.body, null, 2) : 'No body');

        // Forward the request to the actual API
        const fetchOptions = {
            method: req.method,
            headers: {
                'Authorization': req.headers.authorization || '',
                'Content-Type': req.headers['content-type'] || 'application/json',
            },
        };

        // Add body for POST/PUT/PATCH requests
        if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
            fetchOptions.body = JSON.stringify(req.body);
        }

        const response = await fetch(fullUrl, fetchOptions);
        const responseText = await response.text();
        
        console.log('Response status:', response.status);
        console.log('Response body:', responseText);

        // Parse JSON if possible, otherwise send as text
        let responseData;
        try {
            responseData = JSON.parse(responseText);
        } catch (e) {
            responseData = responseText;
        }

        // Send the response back to the client
        res.status(response.status).json(responseData);
    } catch (error) {
        console.error('Proxy error:', error);
        res.status(500).json({ 
            error: 'Proxy server error', 
            details: error.message 
        });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Proxy server is running' });
});

app.listen(PORT, () => {
    console.log(`\n🚀 Proxy server running on http://localhost:${PORT}`);
    console.log(`📡 Forwarding requests to: https://s3pv2cm.smobilpay.com/v2`);
    console.log(`🔗 Health check: http://localhost:${PORT}/health\n`);
});
