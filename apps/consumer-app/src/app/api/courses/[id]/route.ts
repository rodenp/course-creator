import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../auth/[...nextauth]/route"; // Adjusted path

interface Params {
  id: string;
}

export async function GET(request: Request, context: { params: Params }) {
  const courseId = context.params.id;
  // Public GET for single course for now
  // const session = await getServerSession(authOptions);
  // if (!session || !session.user) { // In a real app, you might allow viewing if public, or check ownership if private
  //   return NextResponse.json({ error: 'Unauthorized to view this course' }, { status: 401 });
  // }

  try {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        modules: { orderBy: { order: 'asc' }, include: { lessons: { orderBy: { order: 'asc' }, include: { contentBlocks: { orderBy: { order: 'asc' } } } } } },
        author: { select: { id: true, name: true, email: true }}
      }
    });
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }
    // Add additional authorization here if the course is not public, e.g., check if session.user.id owns the course or has a subscription that grants access.
    return NextResponse.json(course);
  } catch (error) {
    console.error(`Failed to fetch course ${courseId}:`, error);
    return NextResponse.json({ error: 'Failed to fetch course', details: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: Params }) {
  const courseId = context.params.id;
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !(session.user as any).id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = (session.user as any).id as string;

  try {
    const course = await prisma.course.findFirst({
      where: { id: courseId, authorId: userId } // Verify ownership
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found or access denied' }, { status: 404 });
    }

    await prisma.course.delete({ where: { id: courseId } });
    return NextResponse.json({ message: 'Course deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error(`Failed to delete course ${courseId}:`, error);
    return NextResponse.json({ error: 'Failed to delete course', details: (error as Error).message }, { status: 500 });
  }
}

export async function PUT(request: Request, context: { params: Params }) {
  const courseId = context.params.id;
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !(session.user as any).id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = (session.user as any).id as string;

  try {
    const courseData: any = await request.json();

    const existingCourse = await prisma.course.findFirst({
      where: { id: courseId, authorId: userId } // Verify ownership
    });

    if (!existingCourse) {
      return NextResponse.json({ error: 'Course not found or access denied for update' }, { status: 404 });
    }

    const { id, authorId, ...updateData } = courseData;

    const updatedCourse = await prisma.course.update({
      where: { id: courseId },
      data: {
        ...updateData,
        // authorId: userId, // সাধারণত authorId আপডেটের সময় পরিবর্তন করা উচিত না, যদি না মালিকানা হস্তান্তরের বিশেষ লজিক থাকে।
      },
      include: {
        modules: { orderBy: { order: 'asc' }, include: { lessons: { orderBy: { order: 'asc' }, include: { contentBlocks: { orderBy: { order: 'asc' } } } } } },
        author: { select: { id: true, name: true, email: true }}
      }
    });
    return NextResponse.json(updatedCourse, { status: 200 });
  } catch (error) {
    console.error(`Failed to update course ${courseId}:`, error);
    return NextResponse.json({ error: 'Failed to update course', details: (error as Error).message }, { status: 500 });
  }
}
