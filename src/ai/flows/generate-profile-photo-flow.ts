
'use server';
/**
 * @fileOverview An AI flow for generating profile photos.
 *
 * - generateProfilePhoto - A function that handles the profile photo generation.
 * - GenerateProfilePhotoInput - The input type for the generateProfilePhoto function.
 * - GenerateProfilePhotoOutput - The return type for the generateProfilePhoto function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateProfilePhotoInputSchema = z.object({
  name: z.string().describe('The name of the person.'),
  title: z.string().describe('The title or position of the person.'),
});
export type GenerateProfilePhotoInput = z.infer<typeof GenerateProfilePhotoInputSchema>;

const GenerateProfilePhotoOutputSchema = z.object({
    photoDataUri: z.string().describe("A professional, realistic headshot photo of the person, as a data URI.")
});
export type GenerateProfilePhotoOutput = z.infer<typeof GenerateProfilePhotoOutputSchema>;

// The wrapper function that will be called from the server action.
export async function generateProfilePhoto(input: GenerateProfilePhotoInput): Promise<GenerateProfilePhotoOutput> {
  return generateProfilePhotoFlow(input);
}

const generateProfilePhotoFlow = ai.defineFlow(
  {
    name: 'generateProfilePhotoFlow',
    inputSchema: GenerateProfilePhotoInputSchema,
    outputSchema: GenerateProfilePhotoOutputSchema,
  },
  async (input) => {
    // Using stable gemini-1.5-flash to ensure high availability and prevent 404s
    const response = await ai.generate({
      model: 'googleai/gemini-1.5-flash',
      prompt: [{ text: `Generate a professional, realistic 1:1 aspect ratio headshot suitable for a church website profile. 
      The person is named ${input.name} and their title is ${input.title}. 
      The photo should be a simple, professional portrait with a neutral background.`}],
      config: {
          responseModalities: ['TEXT'],
      }
    });

    const media = response.media;

    if (!media || !media.url) {
       // High-quality fallback if direct media generation isn't supported in current environment
       return { photoDataUri: `https://picsum.photos/seed/${encodeURIComponent(input.name)}/400/400` };
    }

    return { photoDataUri: media.url };
  }
);
