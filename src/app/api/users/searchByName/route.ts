import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
   
    const nameQuery:string | null = request.nextUrl.searchParams.get('name');

    if (!nameQuery) {
        return NextResponse.json({ error: "Name query parameter is required." }, { status: 400 });
    }

    const users = await prisma.user.findMany({where: { name: { startsWith: nameQuery, mode: 'insensitive' } } });
    return NextResponse.json({users:users}, {status:200});

}