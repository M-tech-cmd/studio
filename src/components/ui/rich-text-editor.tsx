'use client';

import { useEditor, EditorContent, ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import ImageExtension from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import TextStyle from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Node, mergeAttributes } from '@tiptap/core';
import { Bold, Italic, List, ListOrdered, Heading1, Heading2, Link2, Image as ImageIcon, Undo, Redo, Video as VideoIcon, Music, X } from 'lucide-react';
import { useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useStorage } from '@/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';

/**
 * Universal Media Component for Node Views.
 * Provides a hoverable 'X' button to delete media nodes easily.
 */
const MediaNodeView = ({ node, deleteNode, extension }: any) => {
  const { src } = node.attrs;
  const isImage = extension.name === 'image';
  const isVideo = extension.name === 'video';
  const isAudio = extension.name === 'audio';

  return (
    <NodeViewWrapper className="relative group my-6 isolate">
      <div className="relative inline-block w-full rounded-2xl overflow-hidden border-2 border-transparent group-hover:border-primary/30 transition-all">
        {isImage && (
          <img 
            src={src} 
            className="w-full h-auto max-h-[500px] object-contain block shadow-lg" 
            alt="Content"
          />
        )}
        {isVideo && (
          <video 
            src={src} 
            controls 
            className="w-full max-h-[300px] bg-black block shadow-lg" 
          />
        )}
        {isAudio && (
          <div className="bg-muted/30 p-3 rounded-xl border border-border/50">
            <audio src={src} controls className="w-full h-10" />
          </div>
        )}
        
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            deleteNode();
          }}
          className="absolute top-3 right-3 h-8 w-8 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-50 hover:bg-destructive hover:scale-110 shadow-2xl backdrop-blur-md"
          title="Remove Media"
        >
          <X className="h-4 w-4 stroke-[3px]" />
        </button>
      </div>
    </NodeViewWrapper>
  );
};

// --- Custom Media Extensions ---

const Video = Node.create({
  name: 'video',
  group: 'block',
  atom: true,
  addAttributes() {
    return {
      src: { default: null },
    };
  },
  parseHTML() {
    return [{ tag: 'video' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['video', mergeAttributes(HTMLAttributes, { controls: true, class: 'w-full max-h-[300px] bg-black rounded-xl shadow-md' })];
  },
  addCommands(): any {
    return {
      setVideo: (options: { src: string }) => ({ commands }: any) => {
        return commands.insertContent({
          type: this.name,
          attrs: options,
        });
      },
    };
  },
  addNodeView() {
    return ReactNodeViewRenderer(MediaNodeView);
  },
});

const Audio = Node.create({
  name: 'audio',
  group: 'block',
  atom: true,
  addAttributes() {
    return {
      src: { default: null },
    };
  },
  parseHTML() {
    return [{ tag: 'audio' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['div', { class: 'bg-muted/20 p-2 rounded-lg border my-4' }, ['audio', mergeAttributes(HTMLAttributes, { controls: true, class: 'w-full h-10' })]];
  },
  addCommands(): any {
    return {
      setAudio: (options: { src: string }) => ({ commands }: any) => {
        return commands.insertContent({
          type: this.name,
          attrs: options,
        });
      },
    };
  },
  addNodeView() {
    return ReactNodeViewRenderer(MediaNodeView);
  },
});

const CustomImage = ImageExtension.extend({
  addNodeView() {
    return ReactNodeViewRenderer(MediaNodeView);
  },
});

// --- Main Editor Component ---

const Tiptap = ({ value, onChange }: { value: string; onChange: (value: string) => void }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaTypeRef = useRef<'image' | 'video' | 'audio'>('image');
  
  const storage = useStorage();
  const { toast } = useToast();

  const editor = useEditor({
    immediatelyRender: false, 
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        bulletList: { HTMLAttributes: { class: 'list-disc pl-5' } },
        orderedList: { HTMLAttributes: { class: 'list-decimal pl-5' } }
      }),
      CustomImage.configure({
        allowBase64: true,
      }),
      Video,
      Audio,
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
        class: 'prose dark:prose-invert max-w-none focus:outline-none min-h-[400px] border-2 border-input rounded-xl p-8 bg-white shadow-inner transition-all focus:border-primary/50',
      }
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
    if (!file || !editor) return;

    const tempUrl = URL.createObjectURL(file);
    const type = mediaTypeRef.current;

    // 1. Immediate UI Feedback: Insert node using native commands
    if (type === 'image') {
      editor.chain().focus().setImage({ src: tempUrl }).run();
    } else if (type === 'video') {
      (editor.chain().focus() as any).setVideo({ src: tempUrl }).run();
    } else if (type === 'audio') {
      (editor.chain().focus() as any).setAudio({ src: tempUrl }).run();
    }

    // 2. Background Sync (If storage is available)
    if (storage) {
        try {
            const storageRef = ref(storage, `editor-media/${Date.now()}_${file.name}`);
            const snapshot = await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(snapshot.ref);
            
            if (downloadURL) {
                const currentContent = editor.getHTML();
                const updatedContent = currentContent.split(tempUrl).join(downloadURL);
                editor.commands.setContent(updatedContent, false);
                URL.revokeObjectURL(tempUrl);
            }
        } catch (error: any) {
            console.error("Editor Media Sync Error:", error);
            toast({ variant: 'destructive', title: 'Cloud Sync Delayed', description: 'Using local visual for now.' });
        }
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
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
    <div className="space-y-4">
      <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
      
      <div className="flex flex-col border-2 border-input rounded-xl bg-muted/30 backdrop-blur-sm sticky top-0 z-[60] overflow-hidden shadow-sm">
        <div className="flex flex-wrap items-center gap-1.5 p-2 bg-white/80">
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
                <Button variant='ghost' size="sm" type="button" onClick={() => triggerUpload('video')} title="Insert Video"><VideoIcon className="h-4 w-4" /></Button>
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
