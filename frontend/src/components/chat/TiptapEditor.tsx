import React, { useCallback, useRef, useEffect } from 'react';
import { useEditor, EditorContent, Extension } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Bold, Italic, Strikethrough, Code, List, SendHorizontal } from 'lucide-react';
import clsx from 'clsx';

interface TiptapEditorProps {
  onSubmit: (content: string) => void;
  placeholder?: string;
  isSending?: boolean;
}

export const TiptapEditor = ({ onSubmit, placeholder = 'Type a message...', isSending = false }: TiptapEditorProps) => {
  const submitRef = useRef(onSubmit);
  const isSendingRef = useRef(isSending);

  useEffect(() => {
    submitRef.current = onSubmit;
    isSendingRef.current = isSending;
  }, [onSubmit, isSending]);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Extension.create({
        name: 'enterSubmit',
        priority: 1000, // Important: ensure this runs before StarterKit
        addKeyboardShortcuts() {
          return {
            'Enter': () => {
              if (isSendingRef.current) return true;
              const text = this.editor.getText().trim();
              if (text !== '') {
                const html = this.editor.getHTML();
                submitRef.current(html);
                this.editor.commands.clearContent();
              }
              return true; // Prevent default new line
            },
          };
        },
      }),
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none focus:outline-none min-h-[60px] max-h-[400px] overflow-y-auto px-4 py-3 text-sm text-gray-200',
      },
    },
  });

  const handleSubmit = useCallback(() => {
    if (!editor || isSending) return;
    const html = editor.getHTML();
    if (editor.getText().trim() !== '') {
      onSubmit(html);
      editor.commands.clearContent();
    }
  }, [editor, onSubmit, isSending]);

  if (!editor) return null;

  return (
    <div className="bg-gray-900 border border-gray-700/60 rounded-xl overflow-hidden shadow-lg focus-within:ring-1 focus-within:ring-white/50 focus-within:border-white/50 transition-all">
      {/* Editor Input Area */}
      <div 
        className="cursor-text" 
        onClick={() => editor.chain().focus().run()}
      >
        {editor.getText().trim() === '' && !editor.isFocused && (
          <div className="absolute px-4 py-3 text-sm text-gray-500 pointer-events-none">
            {placeholder}
          </div>
        )}
        <EditorContent editor={editor} />
      </div>

      {/* Toolbar Area */}
      <div className="flex items-center justify-between px-2 py-2 bg-gray-950 border-t border-gray-800/60">
        <div className="flex items-center space-x-1">
          <ToolbarBtn 
            icon={<Bold className="w-4 h-4" />} 
            isActive={editor.isActive('bold')} 
            onClick={() => editor.chain().focus().toggleBold().run()} 
          />
          <ToolbarBtn 
            icon={<Italic className="w-4 h-4" />} 
            isActive={editor.isActive('italic')} 
            onClick={() => editor.chain().focus().toggleItalic().run()} 
          />
          <ToolbarBtn 
            icon={<Strikethrough className="w-4 h-4" />} 
            isActive={editor.isActive('strike')} 
            onClick={() => editor.chain().focus().toggleStrike().run()} 
          />
          <div className="w-px h-4 bg-gray-800 mx-1"></div>
          <ToolbarBtn 
            icon={<Code className="w-4 h-4" />} 
            isActive={editor.isActive('codeBlock')} 
            onClick={() => editor.chain().focus().toggleCodeBlock().run()} 
          />
          <ToolbarBtn 
            icon={<List className="w-4 h-4" />} 
            isActive={editor.isActive('bulletList')} 
            onClick={() => editor.chain().focus().toggleBulletList().run()} 
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={isSending || editor.getText().trim() === ''}
          className="flex items-center justify-center p-2 rounded-lg bg-white hover:bg-gray-300 text-gray-950 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <SendHorizontal className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

const ToolbarBtn = ({ icon, isActive, onClick }: { icon: React.ReactNode, isActive: boolean, onClick: () => void }) => (
  <button
    onClick={(e) => { e.preventDefault(); onClick(); }}
    className={clsx(
      "p-1.5 rounded transition-colors",
      isActive ? "bg-gray-800 text-gray-300" : "text-gray-400 hover:text-gray-200 hover:bg-gray-800"
    )}
  >
    {icon}
  </button>
);
