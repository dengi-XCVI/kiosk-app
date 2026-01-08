"use client";

import { useState } from 'react';
import { SimpleEditor } from '@/components/tiptap-templates/simple/simple-editor';

export default function Editor() {
  const [title, setTitle] = useState('');
  const [editorInstance, setEditorInstance] = useState<any>(null);;

  const handlePublish = () => {
    const json = editorInstance?.getJSON();
    console.log('Publishing article:', { title, content: json });
    // Add your publish logic here
    // Get word count
    const wordCount = getWordCount(json);
    console.log('Word count:', wordCount);
    // Look for images
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
      <SimpleEditor title={title} onTitleChange={setTitle} onReady={setEditorInstance} />
    </div>
  );
}

function getWordCount(json: any): number {
  let text = '';

  function extractText(node: any) {
    if (node.type === 'text' && node.text) {
      text += node.text + ' ';
    }
    if (node.content) {
      node.content.forEach(extractText);
    }
  }

  extractText(json);
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}