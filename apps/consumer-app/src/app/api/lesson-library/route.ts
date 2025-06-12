import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import type { LessonLibraryItem } from '@prisma/client'; // Assuming Prisma client is generated
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route"; // Adjusted path

export async function GET(request: Request) {
  // Lesson library items are generally considered public or widely available once created.
  // No specific user authentication for GET might be intended.
  // If access needs to be restricted, uncomment and adapt the session check.
  // const session = await getServerSession(authOptions);
  // if (!session || !session.user) {
  //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // }

  try {
    const libraryItems = await prisma.lessonLibraryItem.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(libraryItems);
  } catch (error) {
    console.error('Failed to fetch lesson library items:', error);
    return NextResponse.json({ error: 'Failed to fetch lesson library items', details: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  // Saving to lesson library might be restricted (e.g., to admins or specific roles/users)
  // For now, checking for any authenticated user.
  if (!session || !session.user || !(session.user as any).id) {
    return NextResponse.json({ error: 'Unauthorized to save to lesson library' }, { status: 401 });
  }
  // const userId = (session.user as any).id as string; // Use userId if you want to associate items with a user

  try {
    const itemData: any = await request.json();

    if (!itemData.title || !itemData.content) {
      return NextResponse.json({ error: 'Title and content are required for library items' }, { status: 400 });
    }

    let savedItem;
    if (itemData.id) {
       const { id, ...updateData } = itemData;
       if (updateData.content && typeof updateData.content !== 'object') {
           try { updateData.content = JSON.parse(updateData.content); } catch (e) { /* keep as is or handle error */ }
       }
       // Potentially add an ownership check here if non-admins can update their own items
       // const existingItem = await prisma.lessonLibraryItem.findFirst({ where: { id: id as string, authorId: userId }});
       // if (!existingItem) return NextResponse.json({ error: 'Not found or no permission' }, { status: 404 });
       savedItem = await prisma.lessonLibraryItem.update({
           where: { id: id as string},
           data: updateData,
       });
    } else {
       if (itemData.content && typeof itemData.content !== 'object') {
           try { itemData.content = JSON.parse(itemData.content); } catch (e) { /* keep as is or handle error */ }
       }
       const { id, ...createData } = itemData;
       // If associating with a user: { ...createData, authorId: userId }
       savedItem = await prisma.lessonLibraryItem.create({
         data: createData,
       });
    }

    return NextResponse.json(savedItem, { status: itemData.id ? 200 : 201 });
  } catch (error) {
    console.error('Failed to save lesson library item:', error);
    return NextResponse.json({ error: 'Failed to save lesson library item', details: (error as Error).message }, { status: 500 });
  }
}
