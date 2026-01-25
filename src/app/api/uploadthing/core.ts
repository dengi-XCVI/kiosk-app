/**
 * UploadThing File Router Configuration
 * 
 * This file defines the file upload routes for UploadThing.
 * Each route specifies:
 * - Allowed file types and size limits
 * - Authentication middleware
 * - Post-upload processing
 * 
 * @see https://docs.uploadthing.com for documentation
 */

import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const f = createUploadthing();

/**
 * The file router containing all upload endpoints.
 * Add new routes here for different file types (e.g., videoUploader, documentUploader).
 */
export const ourFileRouter = {
  /**
   * Image Uploader Route
   * 
   * Handles image uploads for article content and thumbnails.
   * - Max file size: 4MB
   * - Max files per request: 1
   * - Requires authenticated user
   * 
   * After upload, returns the file URL and key for database storage.
   */
  imageUploader: f({
    image: {
      /**
       * For full list of options and defaults, see the File Route API reference
       * @see https://docs.uploadthing.com/file-routes#route-config
       */
      maxFileSize: "4MB",
      maxFileCount: 1,
    },
  })
    // Middleware: Runs before upload to verify authentication
    .middleware(async ({ req }) => {
      // Get session from better-auth
      const session = await auth.api.getSession({
        headers: await headers(),
      });

      // If you throw, the user will not be able to upload
      if (!session?.user) throw new UploadThingError("Unauthorized");

      // Whatever is returned here is accessible in onUploadComplete as `metadata`
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // This code RUNS ON YOUR SERVER after upload
      console.log("Upload complete for userId:", metadata.userId);
      console.log("file url", file.ufsUrl);
      console.log("file key", file.key);

      // Return url and key for client to save to DB
      return { 
        uploadedBy: metadata.userId,
        url: file.ufsUrl,
        key: file.key,
      };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
