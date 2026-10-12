import express from 'express';
import http from 'http';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);

  // Support base64 image uploads up to 20MB
  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ extended: true, limit: '20mb' }));

  // Initialize Gemini Client
  const apiKey = process.env.GEMINI_API_KEY;
  const ai = new GoogleGenAI({
    apiKey: apiKey || '',
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', hasApiKey: !!apiKey });
  });

  // Digital Asset Links endpoint for Android App Links / Trusted Web Activity (TWA)
  app.get('/.well-known/assetlinks.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.sendFile(path.resolve(__dirname, 'public/.well-known/assetlinks.json'));
  });

  // POST /api/ai/scan-bill - Multimodal AI OCR & Bill Parser
  app.post('/api/ai/scan-bill', async (req, res) => {
    try {
      const { imageBase64, mimeType = 'image/jpeg' } = req.body;

      if (!imageBase64) {
        return res.status(400).json({ error: 'Bill image base64 data is required' });
      }

      if (!apiKey) {
        return res.status(503).json({
          error: 'GEMINI_API_KEY is not configured on the server. Please attach your API key in Settings > Secrets.',
        });
      }

      const prompt = `You are an expert utility bill auditor and invoice extractor for utility and household bills in India and global utilities.
Carefully examine this bill document/photo/screenshot. Extract the bill parameters into a JSON object matching this exact structure:

{
  "provider": string (e.g. "BESCOM", "Tata Power", "IGL", "Airtel", "Jio", "BWSSB", "Mahanagar Gas", "Adani Electricity", "Torrent Power", etc.),
  "category": string (must be strictly one of: "electricity", "water", "gas", "broadband", "mobile", "dth", "credit_card", "insurance", "rent", "other"),
  "consumerNumber": string (Consumer ID, CA Number, Account Number, Connection ID, or RR Number. Do not include spaces),
  "amount": number (Total net payable amount in INR or local currency, as a positive number e.g. 1420.50),
  "dueDate": string (Due date in YYYY-MM-DD format. If only day/month given, use year 2026),
  "billingFrequency": string (one of: "monthly", "bi-monthly", "quarterly", "annual", "one-time"),
  "billerVpa": string (Official UPI VPA for paying this bill if found or standard VPA e.g. "bescom@sbi", "tatapower@icici", "airtel@upi", etc. Must be in valid username@bank format),
  "payeeName": string (Official recipient biller name),
  "title": string (Concise title, e.g. "BESCOM Electricity Bill" or "Airtel Fiber Broadband"),
  "lateFeeAmount": number (Estimated late fee penalty amount if overdue, typically 50 to 150),
  "lateFeeType": string ("fixed" or "percentage_monthly"),
  "notes": string (Summary of billing period, units/consumption, and meter details, e.g. "Billing period: Sep-Oct 2026. Units consumed: 184 kWh.")
}

Important Instructions:
1. Return ONLY the raw JSON string. Do not wrap in markdown quotes if possible.
2. If certain fields like UPI VPA are not explicitly written, infer the standard official Indian UPI VPA for that provider (e.g., BESCOM -> bescom.billdesk@icici, Tata Power -> tatapower@icici, Airtel -> airtel@upi, IGL -> igl@hdfcbank, Jio -> jiofiber@axisbank).
3. If the image is unclear or not a bill, still attempt to extract any numbers, dates, or vendor names you can find.`;

      // Clean base64 string if it contains data URI prefix
      const cleanBase64 = imageBase64.replace(/^data:[^;]+;base64,/, '');

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType,
                data: cleanBase64,
              },
            },
            {
              text: prompt,
            },
          ],
        },
        config: {
          responseMimeType: 'application/json',
        },
      });

      const rawText = response.text || '';
      const cleanedJson = rawText
        .replace(/```json\n?/gi, '')
        .replace(/```\n?/gi, '')
        .trim();

      let parsedData;
      try {
        parsedData = JSON.parse(cleanedJson);
      } catch (parseError) {
        // Fallback regex search for JSON block
        const match = cleanedJson.match(/\{[\s\S]*\}/);
        if (match) {
          parsedData = JSON.parse(match[0]);
        } else {
          throw new Error('AI returned non-JSON response: ' + rawText.slice(0, 100));
        }
      }

      return res.json({
        success: true,
        data: parsedData,
      });
    } catch (err: any) {
      console.error('Gemini Bill Scan Error:', err);
      return res.status(500).json({
        error: err?.message || 'Failed to analyze bill document with AI',
      });
    }
  });

  const httpServer = http.createServer(app);

  // Serve Vite app in dev or built assets in prod
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    // HMR is disabled in AI Studio container environment to prevent WebSocket closed without opened errors
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`PayGrid full-stack server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
