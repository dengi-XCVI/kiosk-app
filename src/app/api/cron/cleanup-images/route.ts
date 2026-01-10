import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { UTApi } from "uploadthing/server";

const utapi = new UTApi();

// Verify cron secret to prevent unauthorized access
function verifyCronSecret(req: NextRequest): boolean {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  
  // If no secret is configured, allow in development
  if (!cronSecret && process.env.NODE_ENV === "development") {
    return true;
  }
  
  return authHeader === `Bearer ${cronSecret}`;
}

// GET: Clean up orphan images older than 24 hours
export async function GET(req: NextRequest) {
  // Verify authorization
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Find orphan images older than 24 hours
    const orphanImages = await prisma.image.findMany({
      where: {
        articleId: null,
        createdAt: {
          lt: twentyFourHoursAgo,
        },
      },
      select: {
        id: true,
        key: true,
      },
    });

    if (orphanImages.length === 0) {
      return NextResponse.json({
        message: "No orphan images to clean up",
        deleted: 0,
      });
    }

    // Extract keys for UploadThing deletion
    const keys = orphanImages.map((img) => img.key);

    // Delete from UploadThing first - only delete from DB if successful
    const deleteResult = await utapi.deleteFiles(keys);
    
    // Check which files were successfully deleted
    const successfullyDeletedKeys: string[] = [];
    
    if (deleteResult.success) {
      // All files deleted successfully
      successfullyDeletedKeys.push(...keys);
    } else if (deleteResult.deletedCount > 0) {
      // Partial success - we need to check which ones succeeded
      // Since UTApi doesn't return which specific keys failed,
      // we'll only proceed if all succeeded
      console.warn("Partial deletion from UploadThing, some files may remain");
      // Don't delete from DB to avoid losing references to undeleted files
      return NextResponse.json({
        message: "Partial cleanup - some UploadThing deletions failed",
        deleted: 0,
        attempted: keys.length,
      });
    } else {
      // Complete failure
      console.error("Failed to delete any files from UploadThing");
      return NextResponse.json({
        message: "Cleanup failed - could not delete from UploadThing",
        deleted: 0,
        attempted: keys.length,
      });
    }

    // Only delete from database the images we successfully deleted from UploadThing
    const idsToDelete = orphanImages
      .filter((img) => successfullyDeletedKeys.includes(img.key))
      .map((img) => img.id);

    const dbDeleteResult = await prisma.image.deleteMany({
      where: {
        id: { in: idsToDelete },
      },
    });

    console.log(`Cleaned up ${dbDeleteResult.count} orphan images`);

    return NextResponse.json({
      message: "Cleanup complete",
      deleted: dbDeleteResult.count,
      keys: successfullyDeletedKeys,
    });
  } catch (error) {
    console.error("Error during cleanup:", error);
    return NextResponse.json(
      { error: "Failed to clean up orphan images" },
      { status: 500 }
    );
  }
}
