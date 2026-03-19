'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import TextStyle from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Bold, Italic, List, ListOrdered, Heading1, Heading2, Link2, Image as ImageIcon, Undo, Redo, Video, Music } from 'lucide-react';
import { useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useStorage } from '@/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';

const Tiptap = ({ value, onChange }: { value: string; onChange: (value: string) => void }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaTypeRef = useRef<'image' | 'video' | 'audio'>('image');
  
  const storage = useStorage();
  const { toast } = useToast();

  const editor = useEditor({
    immediatelyRender: false, // Fixes SSR hydration mismatch
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        bulletList: { HTMLAttributes: { class: 'list-disc pl-5' } },
        orderedList: { HTMLAttributes: { class: 'list-decimal pl-5' } }
      }),
      Image.configure({
        allowBase64: true,
        HTMLAttributes: {
          class: 'w-full h-auto object-contain rounded-xl shadow-lg my-4 border-2 border-primary/10',
        },
      }),
      Link.configure({ 
        openOnClick: false,
        HTMLAttributes: {
          target: '_blank',
          rel: 'noopener noreferrer nofollow',
          class: 'text-primary font-bold underline'
        },
      }),
      TextStyle,
      Color,
    ],
    content: value,
    editorProps: {
      attributes: {
        class: 'prose dark:prose-invert max-w-none focus:outline-none min-h-[350px] border-2 border-input rounded-xl p-6 bg-white shadow-inner transition-all focus:border-primary/50',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value, false);
    }
  }, [value, editor]);

  const triggerUpload = (type: 'image' | 'video' | 'audio') => {
    mediaTypeRef.current = type;
    if (fileInputRef.current) {
      if (type === 'image') fileInputRef.current.accept = 'image/*';
      else if (type === 'video') fileInputRef.current.accept = 'video/*';
      else fileInputRef.current.accept = 'audio/*';
      fileInputRef.current.click();
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !editor || !storage) return;

    const tempUrl = URL.createObjectURL(file);
    const type = mediaTypeRef.current;

    // Instant local preview injection
    if (type === 'image') {
      editor.chain().focus().insertContent(`<img src="${tempUrl}" class="w-full h-auto rounded-xl opacity-50" />`).run();
    } else if (type === 'video') {
       editor.chain().focus().insertContent(`<video controls src="${tempUrl}" class="w-full rounded-xl opacity-50"></video>`).run();
    } else if (type === 'audio') {
      editor.chain().focus().insertContent(`<audio controls src="${tempUrl}" class="w-full opacity-50"></audio>`).run();
    }

    try {
        const storageRef = ref(storage, `editor-media/${Date.now()}_${file.name}`);
        // Atomic uploadBytes (single pass, no retry)
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        
        if (downloadURL) {
            const currentContent = editor.getHTML();
            const updatedContent = currentContent.split(tempUrl).join(downloadURL);
            editor.commands.setContent(updatedContent, false);
            URL.revokeObjectURL(tempUrl);
        }
    } catch (error: any) {
        console.error("Editor Upload Failed:", error.code);
        toast({ variant: 'destructive', title: 'Upload Failed', description: 'Network issue during media sync.' });
        // Clean up preview on failure
        const content = editor.getHTML();
        editor.commands.setContent(content.split(tempUrl).join(''), false);
    } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };
  
  const setLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  if (!editor) return null;

  return (
    <div className="space-y-3">
      <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
      
      <div className="flex flex-col border-2 border-input rounded-xl bg-muted/30 backdrop-blur-sm sticky top-0 z-10 overflow-hidden">
        <div className="flex flex-wrap items-center gap-1.5 p-2">
            <div className="flex items-center gap-1">
                <Button variant={editor.isActive('bold') ? 'secondary' : 'ghost'} size="sm" type="button" onClick={() => editor.chain().focus().toggleBold().run()}><Bold className="h-4 w-4" /></Button>
                <Button variant={editor.isActive('italic') ? 'secondary' : 'ghost'} size="sm" type="button" onClick={() => editor.chain().focus().toggleItalic().run()}><Italic className="h-4 w-4" /></Button>
            </div>
            <Separator orientation="vertical" className="mx-1 h-6" />
            <div className="flex items-center gap-1">
                <Button variant={editor.isActive('heading', { level: 1 }) ? 'secondary' : 'ghost'} size="sm" type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}><Heading1 className="h-4 w-4" /></Button>
                <Button variant={editor.isActive('heading', { level: 2 }) ? 'secondary' : 'ghost'} size="sm" type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 className="h-4 w-4" /></Button>
            </div>
            <Separator orientation="vertical" className="mx-1 h-6" />
            <div className="flex items-center gap-1">
                <Button variant={editor.isActive('bulletList') ? 'secondary' : 'ghost'} size="sm" type="button" onClick={() => editor.chain().focus().toggleBulletList().run()}><List className="h-4 w-4" /></Button>
                <Button variant={editor.isActive('orderedList') ? 'secondary' : 'ghost'} size="sm" type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered className="h-4 w-4" /></Button>
            </div>
            <Separator orientation="vertical" className="mx-1 h-6" />
            <div className="flex items-center gap-2">
                <Button variant='ghost' size="sm" type="button" onClick={() => triggerUpload('image')} title="Insert Image"><ImageIcon className="h-4 w-4" /></Button>
                <Button variant='ghost' size="sm" type="button" onClick={() => triggerUpload('video')} title="Insert Video"><Video className="h-4 w-4" /></Button>
                <Button variant='ghost' size="sm" type="button" onClick={() => triggerUpload('audio')} title="Insert Audio"><Music className="h-4 w-4" /></Button>
                <Button variant={editor.isActive('link') ? 'secondary' : 'ghost'} size="sm" type="button" onClick={setLink}><Link2 className="h-4 w-4" /></Button>
            </div>
            <div className="ml-auto flex items-center gap-1">
                <Button variant='ghost' size="sm" type="button" onClick={() => editor.chain().focus().undo().run()}><Undo className="h-4 w-4" /></Button>
                <Button variant='ghost' size="sm" type="button" onClick={() => editor.chain().focus().redo().run()}><Redo className="h-4 w-4" /></Button>
            </div>
        </div>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
};

export function RichTextEditor({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return <Tiptap value={value} onChange={onChange} />;
}
