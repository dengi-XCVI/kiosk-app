import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { UTApi } from "uploadthing/server";

const utapi = new UTApi();

// POST: Save image record to DB after upload
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

// DELETE: Remove image from UploadThing and DB
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
