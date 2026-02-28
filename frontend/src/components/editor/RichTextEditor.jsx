import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import { useEffect, useCallback } from 'react';

const MenuBar = ({ editor }) => {
  if (!editor) return null;

  const btnClass = (active) =>
    `px-2 py-1.5 rounded text-sm font-mono transition-all ${
      active
        ? 'bg-amber-500 text-slate-900'
        : 'text-slate-400 hover:text-white hover:bg-slate-700'
    }`;

  const addLink = useCallback(() => {
    const url = window.prompt('URL');
    if (url) editor.chain().focus().setLink({ href: url }).run();
  }, [editor]);

  const addImage = useCallback(() => {
    const url = window.prompt('Image URL');
    if (url) editor.chain().focus().setImage({ src: url }).run();
  }, [editor]);

  return (
    <div className="flex flex-wrap gap-1 p-2 border-b border-slate-700 bg-slate-800/50">
      {/* Text style */}
      <div className="flex gap-1 pr-2 border-r border-slate-700">
        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={btnClass(editor.isActive('bold'))} title="Bold">B</button>
        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={btnClass(editor.isActive('italic'))} title="Italic"><em>I</em></button>
        <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} className={btnClass(editor.isActive('underline'))} title="Underline"><u>U</u></button>
        <button type="button" onClick={() => editor.chain().focus().toggleStrike().run()} className={btnClass(editor.isActive('strike'))} title="Strikethrough"><s>S</s></button>
        <button type="button" onClick={() => editor.chain().focus().toggleCode().run()} className={btnClass(editor.isActive('code'))} title="Inline Code">{'<>'}</button>
      </div>

      {/* Headings */}
      <div className="flex gap-1 pr-2 border-r border-slate-700">
        {[1, 2, 3].map((level) => (
          <button
            key={level}
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level }).run()}
            className={btnClass(editor.isActive('heading', { level }))}
            title={`Heading ${level}`}
          >
            H{level}
          </button>
        ))}
      </div>

      {/* Lists */}
      <div className="flex gap-1 pr-2 border-r border-slate-700">
        <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={btnClass(editor.isActive('bulletList'))} title="Bullet List">• List</button>
        <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={btnClass(editor.isActive('orderedList'))} title="Ordered List">1. List</button>
        <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()} className={btnClass(editor.isActive('blockquote'))} title="Blockquote">" "</button>
        <button type="button" onClick={() => editor.chain().focus().toggleCodeBlock().run()} className={btnClass(editor.isActive('codeBlock'))} title="Code Block">{'{ }'}</button>
      </div>

      {/* Alignment */}
      <div className="flex gap-1 pr-2 border-r border-slate-700">
        <button type="button" onClick={() => editor.chain().focus().setTextAlign('left').run()} className={btnClass(editor.isActive({ textAlign: 'left' }))} title="Align Left">⬅</button>
        <button type="button" onClick={() => editor.chain().focus().setTextAlign('center').run()} className={btnClass(editor.isActive({ textAlign: 'center' }))} title="Center">↔</button>
        <button type="button" onClick={() => editor.chain().focus().setTextAlign('right').run()} className={btnClass(editor.isActive({ textAlign: 'right' }))} title="Align Right">➡</button>
      </div>

      {/* Link & Image */}
      <div className="flex gap-1 pr-2 border-r border-slate-700">
        <button type="button" onClick={addLink} className={btnClass(editor.isActive('link'))} title="Add Link">🔗</button>
        <button type="button" onClick={() => editor.chain().focus().unsetLink().run()} className={btnClass(false)} title="Remove Link">✂️</button>
        <button type="button" onClick={addImage} className={btnClass(false)} title="Add Image">🖼</button>
      </div>

      {/* History */}
      <div className="flex gap-1">
        <button type="button" onClick={() => editor.chain().focus().undo().run()} className={btnClass(false)} title="Undo">↩</button>
        <button type="button" onClick={() => editor.chain().focus().redo().run()} className={btnClass(false)} title="Redo">↪</button>
        <button type="button" onClick={() => editor.chain().focus().setHorizontalRule().run()} className={btnClass(false)} title="Horizontal Rule">—</button>
      </div>
    </div>
  );
};

const RichTextEditor = ({ value, onChange, placeholder = 'Write your blog content here...' }) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false }),
      Image,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder }),
    ],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  // Sync external value changes (e.g., when editing existing blog)
  useEffect(() => {
    if (editor && value && editor.getHTML() !== value) {
      editor.commands.setContent(value, false);
    }
  }, [editor, value]);

  return (
    <div className="border border-slate-700 rounded-lg overflow-hidden bg-slate-900 focus-within:border-amber-500 transition-colors">
      <MenuBar editor={editor} />
      <EditorContent
        editor={editor}
        className="prose prose-invert prose-sm max-w-none p-4 min-h-[320px] focus:outline-none text-slate-200 
          [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[300px]
          [&_.ProseMirror_h1]:text-2xl [&_.ProseMirror_h1]:font-bold [&_.ProseMirror_h1]:mb-3
          [&_.ProseMirror_h2]:text-xl [&_.ProseMirror_h2]:font-bold [&_.ProseMirror_h2]:mb-2
          [&_.ProseMirror_h3]:text-lg [&_.ProseMirror_h3]:font-bold [&_.ProseMirror_h3]:mb-2
          [&_.ProseMirror_p]:mb-3 [&_.ProseMirror_p]:leading-relaxed
          [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-5 [&_.ProseMirror_ul]:mb-3
          [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-5 [&_.ProseMirror_ol]:mb-3
          [&_.ProseMirror_blockquote]:border-l-4 [&_.ProseMirror_blockquote]:border-amber-500 [&_.ProseMirror_blockquote]:pl-4 [&_.ProseMirror_blockquote]:italic [&_.ProseMirror_blockquote]:text-slate-400
          [&_.ProseMirror_code]:bg-slate-800 [&_.ProseMirror_code]:px-1.5 [&_.ProseMirror_code]:py-0.5 [&_.ProseMirror_code]:rounded [&_.ProseMirror_code]:font-mono [&_.ProseMirror_code]:text-amber-400
          [&_.ProseMirror_pre]:bg-slate-800 [&_.ProseMirror_pre]:p-4 [&_.ProseMirror_pre]:rounded-lg [&_.ProseMirror_pre]:mb-3
          [&_.ProseMirror_a]:text-amber-400 [&_.ProseMirror_a]:underline
          [&_.ProseMirror_img]:max-w-full [&_.ProseMirror_img]:rounded-lg [&_.ProseMirror_img]:my-3
          [&_.ProseMirror_hr]:border-slate-700 [&_.ProseMirror_hr]:my-4
          [&_.ProseMirror_.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.ProseMirror_.is-editor-empty:first-child::before]:text-slate-600 [&_.ProseMirror_.is-editor-empty:first-child::before]:pointer-events-none [&_.ProseMirror_.is-editor-empty:first-child::before]:float-left [&_.ProseMirror_.is-editor-empty:first-child::before]:h-0"
      />
      <div className="px-4 py-1.5 border-t border-slate-800 bg-slate-900/50 flex justify-end">
        <span className="text-xs text-slate-600 font-mono">
          {editor?.storage.characterCount?.characters?.() ?? 0} chars
        </span>
      </div>
    </div>
  );
};

export default RichTextEditor;
