import { Router, Request, Response } from 'express';
import { draftQuoteMessage, DraftMessageRequest } from './geminiService';

export const apiRouter = Router();

apiRouter.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'QuoteDesk API' });
});

apiRouter.post('/gemini/quote-message', async (req: Request, res: Response) => {
  try {
    const {
      customerName,
      lawnSizeSqFt,
      serviceType,
      totalAmount,
      lineItems,
      clientNotes,
      ownerName,
      businessName,
    } = req.body as DraftMessageRequest;

    if (!customerName || typeof customerName !== 'string') {
      res.status(400).json({ success: false, error: 'Customer name is required.' });
      return;
    }

    if (!lawnSizeSqFt || typeof lawnSizeSqFt !== 'number' || lawnSizeSqFt <= 0) {
      res.status(400).json({ success: false, error: 'Lawn size must be a positive number.' });
      return;
    }

    if (!serviceType || typeof serviceType !== 'string') {
      res.status(400).json({ success: false, error: 'Service type is required.' });
      return;
    }

    if (typeof totalAmount !== 'number' || totalAmount < 0) {
      res.status(400).json({ success: false, error: 'Total amount must be a non-negative number.' });
      return;
    }

    const result = await draftQuoteMessage({
      customerName,
      lawnSizeSqFt,
      serviceType,
      totalAmount,
      lineItems: Array.isArray(lineItems) ? lineItems : [],
      clientNotes,
      ownerName,
      businessName,
    });

    if (result.success) {
      res.json(result);
    } else {
      res.status(503).json(result);
    }
  } catch (err: any) {
    console.error('API Error in /gemini/quote-message:', err);
    res.status(500).json({
      success: false,
      error: 'An unexpected error occurred while drafting your message. Please try again.',
    });
  }
});
