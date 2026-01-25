import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";

// Helper to extract image URLs from TipTap JSON
function extractImageUrls(node: any): string[] {
  const urls: string[] = [];

  function traverse(n: any) {
    if (n.type === "image" && n.attrs?.src) {
      urls.push(n.attrs.src);
    }
    if (n.content) {
      n.content.forEach(traverse);
    }
  }

  traverse(node);
  return urls;
}

// POST: Create a new article
export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, content, thumbnailUrl } = await req.json();

    if (!title || !content) {
      return NextResponse.json(
        { error: "Missing title or content" },
        { status: 400 }
      );
    }

    // Create the article
    const article = await prisma.article.create({
      data: {
        title,
        content,
        thumbnailUrl: thumbnailUrl || null,
        userId: session.user.id,
      },
    });

    // Extract image URLs from content and link them to this article
    const imageUrls = extractImageUrls(content);
    
    // Also include thumbnail URL if provided
    if (thumbnailUrl) {
      imageUrls.push(thumbnailUrl);
    }
    
    if (imageUrls.length > 0) {
      await prisma.image.updateMany({
        where: {
          url: { in: imageUrls },
          userId: session.user.id,
          articleId: null, // Only update orphan images
        },
        data: {
          articleId: article.id,
        },
      });
    }

    return NextResponse.json({ article });
  } catch (error) {
    console.error("Error creating article:", error);
    return NextResponse.json(
      { error: "Failed to create article" },
      { status: 500 }
    );
  }
}

// GET: Get articles for current user
export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const articles = await prisma.article.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        images: true,
      },
    });

    return NextResponse.json({ articles });
  } catch (error) {
    console.error("Error fetching articles:", error);
    return NextResponse.json(
      { error: "Failed to fetch articles" },
      { status: 500 }
    );
  }
}
