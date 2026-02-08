/**
 * Write/Editor Page
 * 
 * The main article creation page featuring:
 * - TipTap rich text editor for content
 * - Title input
 * - Publish button that opens PublishModal
 * - Thumbnail upload via modal
 * 
 * Flow:
 * 1. User writes article content and title
 * 2. User clicks "Publish" button
 * 3. PublishModal opens for thumbnail selection
 * 4. On confirm, article is sent to /api/articles
 */

"use client";

import { useState } from 'react';
import { SimpleEditor } from '@/components/editor/tiptap-templates/simple/simple-editor';
import PublishModal from '@/components/ui/PublishModal';

export default function Editor() {
  /** Article title (controlled input) */
  const [title, setTitle] = useState('');
  /** Reference to TipTap editor instance for getting content */
  const [editorInstance, setEditorInstance] = useState<any>(null);
  /** Loading state during article submission */
  const [isPublishing, setIsPublishing] = useState(false);
  /** Controls PublishModal visibility */
  const [showPublishModal, setShowPublishModal] = useState(false);

  /**
   * Validates article and opens the publish modal.
   * Called when user clicks the "Publish" button.
   */
  const handlePublishClick = () => {
    if (!title.trim()) {
      alert('Please add a title');
      return;
    }

    const json = editorInstance?.getJSON();
    if (!json) {
      alert('Editor content is empty');
      return;
    }

    setShowPublishModal(true);
  };

  /**
   * Handles the actual article publication after user confirms in modal.
   * Sends article data to the API and handles success/error states.
   * 
   * @param thumbnailUrl - URL of uploaded thumbnail, or null if none
   * @param price - Price in USD (1-5) or null for free articles
   * @param journalId - Journal to publish under, or null for personal article
   */
  const handlePublishConfirm = async (thumbnailUrl: string | null, price: number | null, journalId: string | null) => {
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
        body: JSON.stringify({ title, content: json, thumbnailUrl, price, journalId }),
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

      setShowPublishModal(false);
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
        onClick={handlePublishClick}
        disabled={isPublishing}
        className="fixed top-1/2 -translate-y-1/2 -translate-x-1/2 bg-white text-black border border-black px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ left: 'calc((50vw - 324px) / 2)' }}
      >
        Publish
      </button>
      <SimpleEditor title={title} onTitleChange={setTitle} onReady={setEditorInstance} />
      
      <PublishModal
        isOpen={showPublishModal}
        onClose={() => setShowPublishModal(false)}
        onConfirm={handlePublishConfirm}
        isPublishing={isPublishing}
        title={title}
      />
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