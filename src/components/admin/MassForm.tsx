
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useState } from 'react';
import { Expand } from 'lucide-react';

import type { Mass } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LargeTextEditModal } from './LargeTextEditModal';

const massSchema = z.object({
  day: z.enum(['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']),
  title: z.string().min(3, 'Title is required.'),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)"),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)"),
  description: z.string().optional(),
});

type MassFormProps = {
  mass?: Mass | null;
  onSave: (data: Omit<Mass, 'id'> & { id?: string }) => void;
  onClose: () => void;
};

export function MassForm({ mass, onSave, onClose }: MassFormProps) {
  const [isDescriptionModalOpen, setIsDescriptionModalOpen] = useState(false);

  const form = useForm<z.infer<typeof massSchema>>({
    resolver: zodResolver(massSchema),
    defaultValues: {
      day: mass?.day || 'Sunday',
      title: mass?.title || '',
      startTime: mass?.startTime || '',
      endTime: mass?.endTime || '',
      description: mass?.description || '',
    },
  });

  const selectedDay = form.watch('day');

  const onSubmit = (values: z.infer<typeof massSchema>) => {
    onSave({ ...values, id: mass?.id });
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{mass ? 'Edit Mass Schedule' : 'Add Mass Schedule'}</DialogTitle>
          <DialogDescription>
            {mass ? 'Modify the details of this scheduled mass.' : 'Add a new recurring mass time to the weekly schedule.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form id="mass-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="day"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Day of the Week</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select a day" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day) => (
                        <SelectItem key={day} value={day}>{day}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedDay === 'Sunday' ? (
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sunday Mass Title</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select Sunday Mass" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {['1st Mass', '2nd Mass', 'Other/Special Mass'].map((title) => (
                          <SelectItem key={title} value={title}>{title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : (
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl><Input placeholder="E.g., English Service" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            <div className="grid grid-cols-2 gap-4">
               <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Time</FormLabel>
                    <FormControl><Input type="time" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Time</FormLabel>
                    <FormControl><Input type="time" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <div className="flex justify-between items-center">
                    <FormLabel>Description (Optional)</FormLabel>
                    <Button type="button" variant="ghost" size="icon" onClick={() => setIsDescriptionModalOpen(true)}>
                        <Expand className="h-4 w-4" />
                    </Button>
                  </div>
                  <FormControl><Textarea className="resize-y" placeholder="E.g., Held in the main sanctuary" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
        {isDescriptionModalOpen && (
            <LargeTextEditModal
            isOpen={isDescriptionModalOpen}
            onClose={() => setIsDescriptionModalOpen(false)}
            initialValue={form.getValues('description') || ''}
            onSave={(newValue) => {
                form.setValue('description', newValue);
            }}
            title="Edit Description"
            />
        )}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="mass-form">{mass ? 'Update Mass' : 'Add Mass'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
