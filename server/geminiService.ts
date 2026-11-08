import { GoogleGenAI, ThinkingLevel } from '@google/genai';

// Initialize Gemini client using server-side environment key
const apiKey = process.env.GEMINI_API_KEY;

const ai = new GoogleGenAI({
  apiKey: apiKey || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

export interface DraftMessageRequest {
  customerName: string;
  lawnSizeSqFt: number;
  serviceType: string;
  totalAmount: number;
  lineItems: Array<{ name: string; amount: number; description?: string }>;
  clientNotes?: string;
  ownerName?: string;
  businessName?: string;
}

export interface DraftMessageResponse {
  success: boolean;
  message?: string;
  modelUsed?: string;
  attemptsCount?: number;
  error?: string;
}

// Check if an error represents 503 (Service Unavailable) or 429 (Resource Exhausted / Rate Limit)
function isRetryableError(error: any): boolean {
  if (!error) return false;
  const status = error.status || error.statusCode || error.code;
  if (status === 503 || status === 429) return true;

  const msg = String(error.message || error).toLowerCase();
  return (
    msg.includes('503') ||
    msg.includes('429') ||
    msg.includes('resource_exhausted') ||
    msg.includes('unavailable') ||
    msg.includes('overloaded') ||
    msg.includes('rate limit')
  );
}

// Sleep helper
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Execute a single Gemini attempt with a strict 12-second timeout
 */
async function generateWith12sTimeout(
  model: string,
  prompt: string,
  systemInstruction: string,
  timeoutMs = 12000
): Promise<string> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    const id = setTimeout(() => {
      clearTimeout(id);
      reject(new Error('TIMEOUT_12S: Request exceeded 12 second limit.'));
    }, timeoutMs);
  });

  const apiCallPromise = (async () => {
    const isThinkingSupported = model === 'gemini-3.8-flash';
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction,
        thinkingConfig: isThinkingSupported ? { thinkingLevel: ThinkingLevel.LOW } : undefined,
      },
    });

    const text = response.text?.trim();
    if (!text) {
      throw new Error('Received empty response from Gemini model.');
    }
    return text;
  })();

  return await Promise.race([apiCallPromise, timeoutPromise]);
}

/**
 * Drafts a short, friendly quote message to a customer with retry logic:
 * - 12 second limit per attempt
 * - Up to 3 retries on 503 or 429 with short waits
 * - Automatic fallback to another available Flash-class model ('gemini-3.1-flash-lite')
 * - Strictly enforces made-up customer names
 */
export async function draftQuoteMessage(
  req: DraftMessageRequest
): Promise<DraftMessageResponse> {
  if (!apiKey) {
    return {
      success: false,
      error: 'Gemini API key is not configured. Please ensure GEMINI_API_KEY is available.',
    };
  }

  const primaryModel = 'gemini-3.8-flash';
  const fallbackModel = 'gemini-3.1-flash-lite';

  const systemInstruction = `You are a friendly, reliable lawn care business owner sending a quote message to a residential customer.
Draft a brief, courteous, professional message (about 50 to 110 words) that can be sent via text (SMS) or email.
RULES:
1. Use ONLY the made-up customer name provided. Never substitute real names.
2. Clearly state the exact total quote amount ($${req.totalAmount.toFixed(2)}).
3. Mention the specific service package (${req.serviceType}) and property size (${req.lawnSizeSqFt.toLocaleString()} sq ft).
4. List or briefly mention any included add-ons if applicable.
5. Keep the tone warm, clear, and reassuring (mentioning crisp edging, lawn health, or a clean property).
6. End with an easy, low-pressure question asking if they would like to be put on this week's schedule or if they have any questions.
7. Do not include markdown headers, subject lines, or bolding asterisks so it pastes cleanly as an SMS.`;

  const itemsBreakdown = req.lineItems
    .map((item) => `- ${item.name}: $${item.amount.toFixed(2)}`)
    .join('\n');

  const userPrompt = `Please draft a quote message with the following details:
- Customer Name (made-up): ${req.customerName || 'Jordan'}
- Lawn Size: ${req.lawnSizeSqFt.toLocaleString()} sq ft
- Package: ${req.serviceType}
- Line Items:
${itemsBreakdown}
- Total Price: $${req.totalAmount.toFixed(2)}
${req.clientNotes ? `- Special Customer Note: ${req.clientNotes}` : ''}
${req.businessName ? `- Business Name: ${req.businessName}` : ''}`;

  let totalAttempts = 0;
  const retryDelays = [800, 1500, 2200]; // Short waits between retries

  // --- Phase 1: Try Primary Model (gemini-3.8-flash) with up to 3 retries on 503/429 ---
  for (let retry = 0; retry < 3; retry++) {
    totalAttempts++;
    try {
      const text = await generateWith12sTimeout(
        primaryModel,
        userPrompt,
        systemInstruction,
        12000
      );
      return {
        success: true,
        message: text,
        modelUsed: primaryModel,
        attemptsCount: totalAttempts,
      };
    } catch (err: any) {
      console.warn(`[Gemini Attempt ${totalAttempts} (${primaryModel})] failed:`, err.message || err);
      
      const retryable = isRetryableError(err);
      if (retryable && retry < 2) {
        // Wait and retry primary model
        await sleep(retryDelays[retry]);
        continue;
      }

      // If not retryable or retries on primary are exhausted, break to try fallback model
      break;
    }
  }

  // --- Phase 2: Fallback to another Flash-class model (gemini-3.1-flash-lite) ---
  console.log(`[Gemini Fallback] Switching to ${fallbackModel} after primary attempts.`);
  for (let fallbackRetry = 0; fallbackRetry < 2; fallbackRetry++) {
    totalAttempts++;
    try {
      const text = await generateWith12sTimeout(
        fallbackModel,
        userPrompt,
        systemInstruction,
        12000
      );
      return {
        success: true,
        message: text,
        modelUsed: fallbackModel,
        attemptsCount: totalAttempts,
      };
    } catch (err: any) {
      console.warn(`[Gemini Fallback Attempt ${totalAttempts} (${fallbackModel})] failed:`, err.message || err);
      if (isRetryableError(err) && fallbackRetry < 1) {
        await sleep(1000);
        continue;
      }
      break;
    }
  }

  // If all attempts failed
  return {
    success: false,
    error: 'Gemini is currently busy or experiencing high traffic. Please tap "Try Again" to regenerate the message.',
    attemptsCount: totalAttempts,
  };
}
