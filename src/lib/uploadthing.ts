/**
 * UploadThing Client Helpers
 * 
 * This file exports React hooks and utilities for uploading files
 * from the client side using UploadThing.
 * 
 * Usage:
 *   import { uploadFiles } from "@/lib/uploadthing";
 *   const result = await uploadFiles("imageUploader", { files: [file] });
 */

import { generateReactHelpers } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";

/**
 * useUploadThing - React hook for uploading files with progress tracking
 * uploadFiles - Function to programmatically upload files
 */
export const { useUploadThing, uploadFiles } = generateReactHelpers<OurFileRouter>();
