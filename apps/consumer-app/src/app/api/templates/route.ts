import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import type { Course } from '@prisma/client'; // Assuming Prisma client is generated
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route"; // Adjusted path

export async function GET(request: Request) {
  // Templates are generally public or viewable by many.
  // No specific user authentication for GET might be intended.
  // If access needs to be restricted, uncomment and adapt the session check.
  // const session = await getServerSession(authOptions);
  // if (!session || !session.user) {
  //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // }
  try {
    const templates = await prisma.course.findMany({
      where: { isTemplate: true },
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
        // author: { select: { id: true, name: true, email: true }} // Author might be less relevant for generic templates
      },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(templates);
  } catch (error) {
    console.error('Failed to fetch course templates:', error);
    return NextResponse.json({ error: 'Failed to fetch course templates', details: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  // Creating templates might be restricted (e.g., to admins or specific roles/users)
  if (!session || !session.user || !(session.user as any).id) {
    return NextResponse.json({ error: 'Unauthorized to create templates' }, { status: 401 });
  }
  const userId = (session.user as any).id as string;

  try {
    const templateData: any = await request.json();

    if (!templateData.title) {
      return NextResponse.json({ error: 'Title is required for a template' }, { status: 400 });
    }

    if (templateData.id) {
        return NextResponse.json({ error: 'Updating templates via POST /api/templates is not supported. Use PUT /api/templates/[id] or ensure no ID is sent for creation.' }, { status: 400 });
    }

    const { id, authorId, progress, ...creatableTemplateData } = templateData;

    const newTemplate = await prisma.course.create({
      data: {
        ...creatableTemplateData,
        isTemplate: true,
        authorId: userId,
      },
      include: {
        modules: { orderBy: { order: 'asc' }, include: { lessons: { orderBy: { order: 'asc' }, include: { contentBlocks: { orderBy: { order: 'asc' } } } } } },
        author: { select: { id: true, name: true, email: true }}
      }
    });
    return NextResponse.json(newTemplate, { status: 201 });
  } catch (error) {
    console.error('Failed to create course template:', error);
    return NextResponse.json({ error: 'Failed to create course template', details: (error as Error).message }, { status: 500 });
  }
}
