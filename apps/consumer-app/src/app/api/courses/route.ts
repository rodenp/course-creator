import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma'; // Assuming @ refers to apps/consumer-app/src
import type { Course } from '@prisma/client'; // Assuming Prisma client is generated
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route"; // Adjusted path

export async function GET(request: Request) {
  // Public GET for now, remove/comment out session check if courses should be publicly listable
  // const session = await getServerSession(authOptions);
  // if (!session || !session.user || !(session.user as any).id) {
  //   return NextResponse.json({ error: 'Unauthorized to view courses' }, { status: 401 });
  // }
  // const userId = (session.user as any).id as string;

  try {
    const courses = await prisma.course.findMany({
      // If you want to filter by user after re-enabling auth:
      // where: { authorId: userId },
      include: {
        modules: {
          orderBy: { order: 'asc' },
          include: {
            lessons: {
              orderBy: { order: 'asc' },
              include: { contentBlocks: { orderBy: { order: 'asc' } } }
            }
          }
        },
        author: { select: { id: true, name: true, email: true }}
      },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(courses);
  } catch (error) {
    console.error('Failed to fetch courses:', error);
    return NextResponse.json({ error: 'Failed to fetch courses', details: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !(session.user as any).id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = (session.user as any).id as string;

  try {
    const courseData: any = await request.json();

    if (!courseData.title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    let resultCourse;

    if (courseData.id) { // UPDATE existing course
      const courseIdToUpdate = courseData.id;

      const existingCourse = await prisma.course.findFirst({
        where: { id: courseIdToUpdate, authorId: userId } // Verify ownership
      });

      if (!existingCourse) {
        return NextResponse.json({ error: 'Course not found or access denied for update' }, { status: 404 });
      }

      const { id, authorId, modules, lessons, ...updateData } = courseData;

      resultCourse = await prisma.course.update({
        where: { id: courseIdToUpdate },
        data: {
          ...updateData,
          // authorId: userId, // authorId should not change on update unless explicitly transferring ownership
        },
        include: {
          modules: { orderBy: { order: 'asc' }, include: { lessons: { orderBy: { order: 'asc' }, include: { contentBlocks: { orderBy: { order: 'asc' } } } } } },
          author: { select: { id: true, name: true, email: true }}
        }
      });
    } else { // CREATE new course
      const { id, ...createData } = courseData;

      resultCourse = await prisma.course.create({
        data: {
          ...createData,
          authorId: userId,
        },
        include: {
          modules: { orderBy: { order: 'asc' }, include: { lessons: { orderBy: { order: 'asc' }, include: { contentBlocks: { orderBy: { order: 'asc' } } } } } },
          author: { select: { id: true, name: true, email: true }}
        }
      });
    }
    return NextResponse.json(resultCourse, { status: courseData.id ? 200 : 201 });
  } catch (error) {
    console.error('Failed to save course:', error);
    return NextResponse.json({ error: 'Failed to save course', details: (error as Error).message }, { status: 500 });
  }
}
