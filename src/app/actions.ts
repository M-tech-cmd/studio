'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { generateProfilePhoto, GenerateProfilePhotoInput } from '@/ai/flows/generate-profile-photo-flow';

const ReadingsSchema = z.object({
  firstReading: z.string().min(1, { message: 'First Reading is required.' }),
  psalm: z.string().min(1, { message: 'Psalm is required.' }),
  secondReading: z.string().optional(),
  gospel: z.string().min(1, { message: 'Gospel is required.' }),
});

type Readings = z.infer<typeof ReadingsSchema>;

const reflectionPrompt = ai.definePrompt({
    name: 'reflectionPrompt',
    input: { schema: ReadingsSchema },
    prompt: `You are a Catholic priest preparing homily notes. Based on the following scripture readings, write a brief, insightful reflection (around 200-300 words). The reflection should connect the themes of the readings and offer practical spiritual guidance for the congregation.

    First Reading:
    {{{firstReading}}}

    Responsorial Psalm:
    {{{psalm}}}

    {{#if secondReading}}
    Second Reading:
    {{{secondReading}}}
    {{/if}}

    Gospel:
    {{{gospel}}}

    Reflection Notes:`,
});

export async function handleGenerateReflectionNotes(readings: Readings) {
    const validatedReadings = ReadingsSchema.safeParse(readings);

    if (!validatedReadings.success) {
        return { success: false, error: 'Invalid readings provided. Please ensure all required fields are filled.' };
    }

    try {
        const result = await reflectionPrompt(validatedReadings.data);
        const reflectionNotes = result.text;
        
        if (!reflectionNotes) {
            return { success: false, error: 'The AI model failed to generate reflection notes. Please try again.' };
        }

        return { success: true, data: { reflectionNotes } };
    } catch (error) {
        console.error('Error generating reflection notes:', error);
        return { success: false, error: 'An unexpected error occurred while generating notes.' };
    }
}

export async function handleGenerateProfilePhoto(input: GenerateProfilePhotoInput) {
    if (!input.name || !input.title) {
        return { success: false, error: 'Name and title are required to generate a photo.' };
    }

    try {
        const result = await generateProfilePhoto(input);
        return { success: true, data: { photoDataUri: result.photoDataUri } };
    } catch (error: any) {
        console.error('Error generating profile photo:', error);
        return { success: false, error: error.message || 'An unexpected error occurred while generating the photo.' };
    }
}
