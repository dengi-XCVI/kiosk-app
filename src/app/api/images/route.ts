import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { UTApi } from "uploadthing/server";

/** UploadThing API instance for server-side file operations */
const utapi = new UTApi();

/**
 * POST /api/images
 * 
 * Saves an image record to the database after it has been uploaded to UploadThing.
 * The image is initially saved as an "orphan" (articleId = null) until the user
 * publishes an article containing this image. Orphan images older than 24 hours
 * are cleaned up by a daily cron job.
 * 
 * @requires Authentication - User must be logged in
 * 
 * Request body:
 * - url: string - The UploadThing URL of the uploaded image
 * - key: string - The UploadThing file key (used for deletion)
 * 
 * @returns The created image record
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { url, key } = await req.json();

    if (!url || !key) {
      return NextResponse.json(
        { error: "Missing url or key" },
        { status: 400 }
      );
    }

    const image = await prisma.image.create({
      data: {
        url,
        key,
        userId: session.user.id,
        articleId: null, // Orphan until article is published
      },
    });

    return NextResponse.json({ image });
  } catch (error) {
    console.error("Error saving image:", error);
    return NextResponse.json(
      { error: "Failed to save image" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/images
 * 
 * Removes an image from both UploadThing storage and the database.
 * Verifies that the requesting user owns the image before deletion.
 * 
 * @requires Authentication - User must be logged in and own the image
 * 
 * Request body:
 * - key: string - The UploadThing file key of the image to delete
 * 
 * @returns Success confirmation
 */
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { key } = await req.json();

    if (!key) {
      return NextResponse.json({ error: "Missing key" }, { status: 400 });
    }

    // Find the image and verify ownership
    const image = await prisma.image.findUnique({
      where: { key },
    });

    if (!image) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    if (image.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete from UploadThing
    await utapi.deleteFiles(key);

    // Delete from database
    await prisma.image.delete({
      where: { key },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting image:", error);
    return NextResponse.json(
      { error: "Failed to delete image" },
      { status: 500 }
    );
  }
}
