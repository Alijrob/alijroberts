import type { FastifyInstance } from 'fastify';
import { GoogleGenerativeAI } from '@google/generative-ai';

const MODEL_VISION = 'gemini-2.0-flash';
const MODEL_IMAGE_GEN = 'imagen-3.0-generate-002';

function getClient() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY not set');
  return new GoogleGenerativeAI(key);
}

async function urlToBase64(url: string): Promise<{ data: string; mimeType: string }> {
  const res = await fetch(url);
  const buf = await res.arrayBuffer();
  const mime = res.headers.get('content-type') || 'image/jpeg';
  return { data: Buffer.from(buf).toString('base64'), mimeType: mime };
}

export async function aiVisionRoutes(app: FastifyInstance) {
  // POST /api/ai/analyze
  // Body: multipart with optional `image` file, or JSON { imageUrl, prompt }
  app.post('/api/ai/analyze', async (req, reply) => {
    const genai = getClient();
    const model = genai.getGenerativeModel({ model: MODEL_VISION });

    let imagePart: { inlineData: { data: string; mimeType: string } } | null = null;
    let prompt = 'Describe this image in detail.';

    const contentType = req.headers['content-type'] || '';

    if (contentType.includes('multipart')) {
      const parts = req.parts();
      for await (const part of parts) {
        if (part.type === 'file' && part.fieldname === 'image') {
          const buf = await part.toBuffer();
          imagePart = { inlineData: { data: buf.toString('base64'), mimeType: part.mimetype } };
        } else if (part.type === 'field' && part.fieldname === 'prompt') {
          prompt = part.value as string;
        }
      }
    } else {
      const body = (req.body as Record<string, string>) || {};
      if (body.prompt) prompt = body.prompt;
      if (body.imageUrl) {
        const { data, mimeType } = await urlToBase64(body.imageUrl);
        imagePart = { inlineData: { data, mimeType } };
      }
    }

    if (!imagePart) return reply.code(400).send({ error: 'No image provided. Send image file or imageUrl.' });

    const result = await model.generateContent([prompt, imagePart]);
    const text = result.response.text();
    return { text };
  });

  // POST /api/ai/colors
  // Body: multipart with `image` file, or JSON { imageUrl }
  // Returns ranked hex palette
  app.post('/api/ai/colors', async (req, reply) => {
    const genai = getClient();
    const model = genai.getGenerativeModel({ model: MODEL_VISION });

    let imagePart: { inlineData: { data: string; mimeType: string } } | null = null;
    const contentType = req.headers['content-type'] || '';

    if (contentType.includes('multipart')) {
      const parts = req.parts();
      for await (const part of parts) {
        if (part.type === 'file' && part.fieldname === 'image') {
          const buf = await part.toBuffer();
          imagePart = { inlineData: { data: buf.toString('base64'), mimeType: part.mimetype } };
        }
      }
    } else {
      const body = (req.body as Record<string, string>) || {};
      if (body.imageUrl) {
        const { data, mimeType } = await urlToBase64(body.imageUrl);
        imagePart = { inlineData: { data, mimeType } };
      }
    }

    if (!imagePart) return reply.code(400).send({ error: 'No image provided.' });

    const prompt = `Analyze this image and extract the color palette. Return ONLY a JSON array of objects, no markdown, no explanation. Each object: { "hex": "#rrggbb", "name": "descriptive color name", "role": "dominant|accent|background|text", "prominence": 1-10 }. Sort by prominence descending. Return 5-8 colors.`;

    const result = await model.generateContent([prompt, imagePart]);
    let raw = result.response.text().trim();
    // Strip markdown code fences if present
    raw = raw.replace(/^```[a-z]*\n?/i, '').replace(/```$/, '').trim();

    try {
      const colors = JSON.parse(raw);
      return { colors };
    } catch {
      return { colors: [], raw };
    }
  });

  // POST /api/ai/generate
  // Body JSON: { prompt, negativePrompt?, aspectRatio? }
  // Returns base64 PNG
  app.post('/api/ai/generate', async (req, reply) => {
    const key = process.env.GEMINI_API_KEY;
    if (!key) return reply.code(500).send({ error: 'GEMINI_API_KEY not set' });

    const body = (req.body as { prompt: string; negativePrompt?: string; aspectRatio?: string }) || {} as { prompt: string; negativePrompt?: string; aspectRatio?: string };
    if (!body.prompt) return reply.code(400).send({ error: 'prompt required' });

    // Imagen 3 via REST — @google/generative-ai SDK doesn't expose Imagen yet
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_IMAGE_GEN}:predict?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instances: [{ prompt: body.prompt }],
          parameters: {
            sampleCount: 1,
            aspectRatio: body.aspectRatio || '1:1',
            ...(body.negativePrompt ? { negativePrompt: body.negativePrompt } : {}),
          },
        }),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      return reply.code(res.status).send({ error: err });
    }

    const json = await res.json() as { predictions?: { bytesBase64Encoded: string; mimeType: string }[] };
    const prediction = json.predictions?.[0];
    if (!prediction) return reply.code(500).send({ error: 'No image returned from Imagen' });

    return {
      imageBase64: prediction.bytesBase64Encoded,
      mimeType: prediction.mimeType || 'image/png',
    };
  });
}
