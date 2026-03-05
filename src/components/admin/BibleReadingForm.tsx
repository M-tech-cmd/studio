
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Wand2, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { useState } from 'react';
import { Timestamp } from 'firebase/firestore';

import type { BibleReading } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { ScrollArea } from '@/components/ui/scroll-area';
import { handleGenerateReflectionNotes } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { RichTextEditor } from '@/components/ui/rich-text-editor';

const isContentEmpty = (content: string | undefined | null) => {
    if (!content) return true;
    return content.replace(/<[^>]*>/g, '').trim().length === 0;
};

const readingSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters.'),
  date: z.string({ required_error: 'Date is required.' }).min(1, 'Date is required.'),
  firstReading: z.string().refine(value => !isContentEmpty(value), { message: 'First Reading text is required.' }),
  psalm: z.string().refine(value => !isContentEmpty(value), { message: 'Psalm text is required.' }),
  secondReading: z.string().optional(),
  gospel: z.string().refine(value => !isContentEmpty(value), { message: 'Gospel text is required.' }),
  reflection: z.string().optional(),
  published: z.boolean().default(true),
});

type BibleReadingFormProps = {
  reading: BibleReading | null;
  onSave: (data: Omit<BibleReading, 'id'> & { id?: string }) => void;
  onClose: () => void;
};

const formatDateForInput = (date: any) => {
    if (!date) return '';
    const d = date instanceof Timestamp ? date.toDate() : new Date(date);
    return format(d, 'yyyy-MM-dd');
};

export function BibleReadingForm({ reading, onSave, onClose }: BibleReadingFormProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof readingSchema>>({
    resolver: zodResolver(readingSchema),
    defaultValues: {
      title: reading?.title || '',
      date: reading ? formatDateForInput(reading.date) : format(new Date(), 'yyyy-MM-dd'),
      firstReading: reading?.firstReading || '',
      psalm: reading?.psalm || '',
      secondReading: reading?.secondReading || '',
      gospel: reading?.gospel || '',
      reflection: reading?.reflection || '',
      published: reading ? reading.published : true,
    },
  });

  const onSubmit = (values: z.infer<typeof readingSchema>) => {
    const dataToSave = {
      ...values,
      id: reading?.id,
      date: new Date(`${values.date}T00:00:00`),
      reflection: values.reflection || '',
      secondReading: values.secondReading || '',
    };
    onSave(dataToSave);
  };
  
  const handleGenerateNotes = async () => {
    const values = form.getValues();
    const { firstReading, psalm, secondReading, gospel } = values;

    if (isContentEmpty(firstReading) || isContentEmpty(psalm) || isContentEmpty(gospel)) {
      toast({
        variant: 'destructive',
        title: 'Missing Readings',
        description: 'First Reading, Psalm, and Gospel are required to generate notes.',
      });
      return;
    }

    setIsGenerating(true);
    const result = await handleGenerateReflectionNotes({
        firstReading,
        psalm,
        secondReading: secondReading || "",
        gospel
    });

    if (result.success && result.data) {
      form.setValue('reflection', result.data.reflectionNotes);
      toast({ title: 'Success', description: 'Reflection notes generated and added to the form.' });
    } else {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result.error || 'An unknown error occurred.',
      });
    }
    setIsGenerating(false);
  };


  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{reading ? 'Edit Bible Reading' : 'Add Bible Reading'}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[75vh] pr-6">
          <div className="py-4">
            <Form {...form}>
              <form id="reading-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reading Title *</FormLabel>
                        <FormControl><Input placeholder="E.g., 21st Sunday in Ordinary Time" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date *</FormLabel>
                        <FormControl>
                            <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                  <FormField control={form.control} name="firstReading" render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Reading *</FormLabel>
                      <FormControl><RichTextEditor value={field.value} onChange={field.onChange} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField control={form.control} name="psalm" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Responsorial Psalm *</FormLabel>
                      <FormControl><RichTextEditor value={field.value} onChange={field.onChange} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField control={form.control} name="secondReading" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Second Reading</FormLabel>
                      <FormControl><RichTextEditor value={field.value || ''} onChange={field.onChange} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField control={form.control} name="gospel" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gospel *</FormLabel>
                      <FormControl><RichTextEditor value={field.value} onChange={field.onChange} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField control={form.control} name="reflection" render={({ field }) => (
                    <FormItem>
                      <div className="flex justify-between items-center">
                          <FormLabel>Reflection/Homily Notes</FormLabel>
                          <Button type="button" variant="outline" size="sm" onClick={handleGenerateNotes} disabled={isGenerating}>
                              {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                              AI Assistant
                          </Button>
                      </div>
                      <FormControl>
                        <RichTextEditor value={field.value || ''} onChange={field.onChange} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="published"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Publish reading (visible to parishioners)
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          </div>
        </ScrollArea>
        <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" form="reading-form">{reading ? 'Update Reading' : 'Create Reading'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
