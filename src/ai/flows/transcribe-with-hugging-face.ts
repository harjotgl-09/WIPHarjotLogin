'use server';
import { z } from 'zod';

const TranscribeInputSchema = z.object({
  audioDataUri: z
    .string()
    .describe(
      "A recording, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});

export async function transcribeWithHuggingFace(
  input: z.infer<typeof TranscribeInputSchema>
): Promise<string> {
  const { audioDataUri } = TranscribeInputSchema.parse(input);
  
  // Extract mime type and base64 data from data URI
  const mimeTypeMatch = audioDataUri.match(/data:(.*?);base64,/);
  if (!mimeTypeMatch) {
    throw new Error("Invalid audio data URI format.");
  }
  const mimeType = mimeTypeMatch[1];
  const base64Data = audioDataUri.split(',')[1];
  const audioBlob = Buffer.from(base64Data, 'base64');

  const hfToken = process.env.HF_TOKEN;
  if (!hfToken) {
    throw new Error("Hugging Face API token is not configured.");
  }
  
  const response = await fetch(
    "https://api-inference.huggingface.co/models/openai/whisper-large-v3",
    {
      headers: { 
        Authorization: `Bearer ${hfToken}`,
        "Content-Type": mimeType,
      },
      method: "POST",
      body: audioBlob,
    }
  );

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("Hugging Face API Error:", errorBody);
    // Check for the specific 410 Gone error and provide a more helpful message
    if (response.status === 410) {
       throw new Error(`API call failed with status 410 (Gone): The Hugging Face endpoint has been deprecated. Please check for an updated URL.`);
    }
    throw new Error(`API call failed with status ${response.status}: ${errorBody}`);
  }

  const result = await response.json();
  if (result.error) {
    throw new Error(`Hugging Face API returned an error: ${result.error}`);
  }
  return result.text;
}
