/**
 * PublishModal Component
 * 
 * A modal dialog that appears when the user clicks "Publish" on the write page.
 * Allows the user to:
 * - Preview the article title
 * - Upload an optional thumbnail image (drag & drop or click)
 * - Set a price ($1-$5 or free)
 * - Select a journal to publish under (if the user belongs to any)
 * - Confirm or cancel the publication
 * 
 * The thumbnail is uploaded to UploadThing and saved as an orphan image.
 * If the user cancels, the orphan will be cleaned up by the daily cron job.
 * If the user confirms, the thumbnail URL is passed to the parent for article creation.
 */

"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { X, Upload, ImageIcon, Loader2, DollarSign, BookOpen, ChevronDown } from "lucide-react";
import { uploadFiles } from "@/lib/uploadthing";
import type { JournalMembership } from "@/types/types";

/** Valid article prices: null (free) or 1-5 dollars */
export type ArticlePrice = 1 | 2 | 3 | 4 | 5 | null;

interface PublishModalProps {
  /** Whether the modal is currently visible */
  isOpen: boolean;
  /** Callback when user closes/cancels the modal */
  onClose: () => void;
  /** Callback when user confirms publish, receives thumbnail URL, price, and optional journal ID */
  onConfirm: (thumbnailUrl: string | null, price: ArticlePrice, journalId: string | null) => void;
  /** Whether the article is currently being published */
  isPublishing: boolean;
  /** The article title to display in the modal */
  title: string;
}

export default function PublishModal({
  isOpen,
  onClose,
  onConfirm,
  isPublishing,
  title,
}: PublishModalProps) {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [thumbnailKey, setThumbnailKey] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [price, setPrice] = useState<ArticlePrice>(null);
  const [selectedJournalId, setSelectedJournalId] = useState<string | null>(null);
  const [journals, setJournals] = useState<JournalMembership[]>([]);
  const [journalsLoading, setJournalsLoading] = useState(false);
  const [showJournalDropdown, setShowJournalDropdown] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Fetch the user's journal memberships when the modal opens.
   * This populates the journal selector dropdown.
   */
  useEffect(() => {
    if (isOpen) {
      setJournalsLoading(true);
      fetch("/api/journals")
        .then((res) => res.json())
        .then((data) => {
          setJournals(data.memberships || []);
        })
        .catch((err) => {
          console.error("Failed to fetch journals:", err);
          setJournals([]);
        })
        .finally(() => setJournalsLoading(false));
    }
  }, [isOpen]);

  const handleFileSelect = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      alert("Image must be less than 4MB");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const response = await uploadFiles("imageUploader", {
        files: [file],
        onUploadProgress: ({ progress }) => {
          setUploadProgress(progress);
        },
      });

      if (!response || response.length === 0) {
        throw new Error("Upload failed");
      }

      const uploadedFile = response[0];
      const url = uploadedFile.serverData?.url || uploadedFile.ufsUrl || uploadedFile.url;
      const key = uploadedFile.serverData?.key || uploadedFile.key;

      if (!url) {
        throw new Error("No URL returned");
      }

      // Save to database as orphan image (same as content images)
      const saveResponse = await fetch("/api/images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, key }),
      });

      if (!saveResponse.ok) {
        console.error("Failed to save thumbnail to database");
      }

      setThumbnailUrl(url);
      setThumbnailKey(key);
    } catch (error) {
      console.error("Thumbnail upload error:", error);
      alert("Failed to upload thumbnail");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  const handleRemoveThumbnail = useCallback(async () => {
    if (thumbnailKey) {
      // Delete from UploadThing and DB
      try {
        await fetch("/api/images", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: thumbnailKey }),
        });
      } catch (error) {
        console.error("Failed to delete thumbnail:", error);
      }
    }
    setThumbnailUrl(null);
    setThumbnailKey(null);
  }, [thumbnailKey]);

  const handleConfirm = useCallback(() => {
    onConfirm(thumbnailUrl, price, selectedJournalId);
  }, [onConfirm, thumbnailUrl, price, selectedJournalId]);

  const handleClose = useCallback(() => {
    // If there's a thumbnail that wasn't published, it will be cleaned up by cron
    setThumbnailUrl(null);
    setThumbnailKey(null);
    setPrice(null);
    setSelectedJournalId(null);
    setShowJournalDropdown(false);
    onClose();
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Publish Article</h2>
          <button
            onClick={handleClose}
            disabled={isPublishing}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5">
          {/* Article Title Preview */}
          <div className="mb-5">
            <p className="text-sm text-gray-500 mb-1">Article Title</p>
            <p className="font-medium text-gray-900 truncate">{title || "Untitled"}</p>
          </div>

          {/* Thumbnail Upload */}
          <div className="mb-5">
            <p className="text-sm text-gray-500 mb-2">Thumbnail Image (optional)</p>
            
            {thumbnailUrl ? (
              <div className="relative rounded-lg overflow-hidden border border-gray-200">
                <img
                  src={thumbnailUrl}
                  alt="Thumbnail preview"
                  className="w-full h-48 object-cover"
                />
                <button
                  onClick={handleRemoveThumbnail}
                  disabled={isPublishing}
                  className="absolute top-2 right-2 p-1.5 bg-white/90 hover:bg-white rounded-full shadow-md transition-colors disabled:opacity-50"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`
                  border-2 border-dashed rounded-lg h-48 flex flex-col items-center justify-center cursor-pointer transition-colors
                  ${dragOver ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"}
                  ${isUploading ? "pointer-events-none" : ""}
                `}
              >
                {isUploading ? (
                  <>
                    <Loader2 size={32} className="text-gray-400 animate-spin mb-2" />
                    <p className="text-sm text-gray-500">Uploading... {uploadProgress}%</p>
                  </>
                ) : (
                  <>
                    <ImageIcon size={32} className="text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600 font-medium">
                      Drop an image here or click to upload
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      PNG, JPG up to 4MB
                    </p>
                  </>
                )}
              </div>
            )}
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileInputChange}
              className="hidden"
            />
          </div>

          {/* Price Selector */}
          <div className="mb-5">
            <p className="text-sm text-gray-500 mb-2">Article Price</p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPrice(null)}
                disabled={isPublishing}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors disabled:opacity-50 ${
                  price === null
                    ? "bg-black text-white border-black"
                    : "bg-white text-gray-700 border-gray-300 hover:border-gray-400"
                }`}
              >
                Free
              </button>
              {([1, 2, 3, 4, 5] as const).map((amount) => (
                <button
                  key={amount}
                  onClick={() => setPrice(amount)}
                  disabled={isPublishing}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors disabled:opacity-50 flex items-center gap-0.5 ${
                    price === amount
                      ? "bg-black text-white border-black"
                      : "bg-white text-gray-700 border-gray-300 hover:border-gray-400"
                  }`}
                >
                  <DollarSign size={14} />
                  {amount}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-1.5">
              {price
                ? `Readers will pay $${price} to access this article via x402`
                : "Anyone can read this article for free"}
            </p>
          </div>

          {/* Journal Selector */}
          {journals.length > 0 && (
            <div className="mb-5">
              <p className="text-sm text-gray-500 mb-2">Publish under a Journal (optional)</p>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowJournalDropdown(!showJournalDropdown)}
                  disabled={isPublishing || journalsLoading}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm border border-gray-300 rounded-lg hover:border-gray-400 transition-colors disabled:opacity-50 bg-white"
                >
                  <span className="flex items-center gap-2 truncate">
                    <BookOpen size={16} className="text-gray-400 shrink-0" />
                    {journalsLoading ? (
                      <span className="text-gray-400">Loading journals...</span>
                    ) : selectedJournalId ? (
                      <span className="text-gray-900">
                        {journals.find((m) => m.journal.id === selectedJournalId)?.journal.name}
                      </span>
                    ) : (
                      <span className="text-gray-400">No journal (personal article)</span>
                    )}
                  </span>
                  <ChevronDown size={16} className="text-gray-400 shrink-0" />
                </button>

                {/* Dropdown list */}
                {showJournalDropdown && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {/* "None" option */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedJournalId(null);
                        setShowJournalDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${
                        selectedJournalId === null ? "bg-gray-100 font-medium" : ""
                      }`}
                    >
                      No journal (personal article)
                    </button>

                    {/* Journal options */}
                    {journals.map((membership) => (
                      <button
                        key={membership.journal.id}
                        type="button"
                        onClick={() => {
                          setSelectedJournalId(membership.journal.id);
                          setShowJournalDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors flex items-center justify-between ${
                          selectedJournalId === membership.journal.id
                            ? "bg-gray-100 font-medium"
                            : ""
                        }`}
                      >
                        <span className="truncate">{membership.journal.name}</span>
                        <span className="text-xs text-gray-400 shrink-0 ml-2">
                          {membership.role}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-gray-50">
          <button
            onClick={handleClose}
            disabled={isPublishing}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isPublishing || isUploading}
            className="px-4 py-2 text-sm font-medium text-white bg-black hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isPublishing ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Publishing...
              </>
            ) : (
              <>
                <Upload size={16} />
                Publish
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
