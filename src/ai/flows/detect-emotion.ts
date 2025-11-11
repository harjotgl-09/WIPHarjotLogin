'use server';
/**
 * @fileOverview A flow that detects the emotion from a piece of text using the Gemini 1.5 Flash model.
 */
import {ai} from '@/ai/genkit';
import {z} from 'zod';

const DetectEmotionInputSchema = z.object({
  text: z.string().describe('The transcribed text to be analyzed for emotion.'),
});
export type DetectEmotionInput = z.infer<typeof DetectEmotionInputSchema>;

const EmotionEnum = z.enum(['joy', 'anger', 'sadness', 'surprise', 'neutral']);
export type Emotion = z.infer<typeof EmotionEnum>;

const DetectEmotionOutputSchema = z.object({
  emotion: EmotionEnum.describe(
    'The detected emotion. Must be one of: joy, anger, sadness, surprise, neutral.'
  ),
  confidence: z
    .number()
    .min(0)
    .max(1)
    .describe('The confidence score of the emotion detection, from 0 to 1.'),
});
export type DetectEmotionOutput = z.infer<typeof DetectEmotionOutputSchema>;

// This is the prompt that instructs the model.
const emotionPrompt = ai.definePrompt({
  name: 'emotionPrompt',
  input: {schema: DetectEmotionInputSchema},
  output: {schema: DetectEmotionOutputSchema},
  prompt: `Analyze the emotion of the following text.
  
  Classify the emotion into exactly one of the following categories: joy, anger, sadness, surprise, or neutral.
  
  Provide a confidence score between 0 and 1.
  
  Text: {{{text}}}
  `,
  model: 'googleai/gemini-1.5-flash-preview-0514',
});

// This is the flow that orchestrates the AI call.
const detectEmotionFlow = ai.defineFlow(
  {
    name: 'detectEmotionFlow',
    inputSchema: DetectEmotionInputSchema,
    outputSchema: DetectEmotionOutputSchema,
  },
  async input => {
    console.log('[detectEmotionFlow] Input:', input);
    const {output} = await emotionPrompt(input);
    console.log('[detectEmotionFlow] Output:', output);
    if (!output) {
      throw new Error('The AI model did not return a valid output.');
    }
    return output;
  }
);

// This is the exported function that the UI will call.
export async function detectEmotion(
  input: DetectEmotionInput
): Promise<DetectEmotionOutput> {
  return await detectEmotionFlow(input);
}
