"use client";

import { useState } from 'react';
import { SimpleEditor } from '@/components/editor/tiptap-templates/simple/simple-editor';

export default function Editor() {
  const [title, setTitle] = useState('');
  const [editorInstance, setEditorInstance] = useState<any>(null);
  const [isPublishing, setIsPublishing] = useState(false);

  const handlePublish = async () => {
    if (!title.trim()) {
      alert('Please add a title');
      return;
    }

    const json = editorInstance?.getJSON();
    if (!json) {
      alert('Editor content is empty');
      return;
    }

    setIsPublishing(true);

    try {
      const response = await fetch('/api/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content: json }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to publish');
      }

      const { article } = await response.json();
      console.log('Published article:', article);
      
      // Get word count
      const wordCount = getWordCount(json);
      console.log('Word count:', wordCount);

      alert('Article published successfully!');
      // Optionally redirect: router.push(`/articles/${article.id}`);
    } catch (error) {
      console.error('Publish error:', error);
      alert(error instanceof Error ? error.message : 'Failed to publish');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={handlePublish}
        disabled={isPublishing}
        className="fixed top-1/2 -translate-y-1/2 -translate-x-1/2 bg-white text-black border border-black px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ left: 'calc((50vw - 324px) / 2)' }}
      >
        {isPublishing ? 'Publishing...' : 'Publish'}
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