"use client";

import { useState } from 'react';
import { SimpleEditor } from '@/components/tiptap-templates/simple/simple-editor';

export default function Editor() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const handlePublish = () => {
    const json = 
  };

  return (
    <div className="relative">
      <button 
        onClick={handlePublish}
        className="fixed top-1/2 -translate-y-1/2 -translate-x-1/2 bg-white text-black border border-black px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors cursor-pointer"
        style={{ left: 'calc((50vw - 324px) / 2)' }}
      >
        Publish
      </button>
      <SimpleEditor title={title} onTitleChange={setTitle} onContentChange/>
    </div>
  );
}