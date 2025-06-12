import { PrismaClient } from '@prisma/client';
// Adjust the import path for sampleData according to your monorepo structure and tsconfig paths
// This might require baseUrl and paths in apps/consumer-app/tsconfig.json to resolve @course-app/plugin
// For now, using a relative path as a placeholder, assuming 'packages' is sibling to 'apps'
// Assuming the plugin is built and types are accessible, or direct source access is configured via tsconfig paths.
// For a direct source access setup that might work if tsconfig paths are correctly set up for monorepo:
// import { sampleCourses, sampleLessonLibrary } from '@course-app/plugin/src/utils/sampleData';
// For now, using a relative path that assumes a certain build structure or linked packages.
// This path will likely fail if the plugin is not built or linked in a way that this relative path resolves.
// A more robust solution for monorepos involves using TypeScript path aliases in tsconfig.json
// or importing from the built output of the package.
// Given the current context, this relative path is a placeholder.
import { sampleCourses, sampleLessonLibrary } from '../../packages/course-plugin/src/utils/sampleData';

const prisma = new PrismaClient();

async function main() {
  console.log(`Start seeding ...`);

  // 1. Create a default user
  const defaultUser = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      email: 'user@example.com',
      name: 'Default User',
      // In a real scenario with Credentials provider, ensure a hashed password or use OAuth
    },
  });
  console.log(`Created default user with id: ${defaultUser.id}`);

  // 2. Migrate Courses and Templates from sampleCourses
  for (const courseData of sampleCourses) {
    const {
      id: sampleCourseId, // ignored, Prisma generates new ID
      modules,
      progress, // This field is not in our Prisma Course model, so omit
      createdAt,
      updatedAt,
      // Ensure all other fields from sampleData match Prisma schema or are transformed
      ...restOfCourseData
    } = courseData;

    const createCoursePayload = {
      ...restOfCourseData,
      authorId: defaultUser.id,
      tags: courseData.tags || [],
      createdAt: createdAt ? new Date(createdAt) : new Date(),
      updatedAt: updatedAt ? new Date(updatedAt) : new Date(),
      modules: {
        create: modules.map(moduleData => {
          const {
            id: sampleModuleId, // ignored
            lessons,
            createdAt: moduleCreatedAt,
            updatedAt: moduleUpdatedAt,
            ...restOfModuleData
          } = moduleData;
          return {
            ...restOfModuleData,
            createdAt: moduleCreatedAt ? new Date(moduleCreatedAt) : new Date(),
            updatedAt: moduleUpdatedAt ? new Date(moduleUpdatedAt) : new Date(),
            lessons: {
              create: lessons.map(lessonData => {
                const {
                  id: sampleLessonId, // ignored
                  content: contentBlocks,
                  createdAt: lessonCreatedAt,
                  updatedAt: lessonUpdatedAt,
                  ...restOfLessonData
                } = lessonData;
                return {
                  ...restOfLessonData,
                  createdAt: lessonCreatedAt ? new Date(lessonCreatedAt) : new Date(),
                  updatedAt: lessonUpdatedAt ? new Date(lessonUpdatedAt) : new Date(),
                  contentBlocks: {
                    create: contentBlocks.map(cbData => {
                      const {
                        id: sampleCbId, // ignored
                        // Ensure type and content structure match Prisma schema for Json
                        ...restOfCbData
                      } = cbData;
                      // Prisma expects the 'content' field for a Json type to be
                      // the actual JSON structure, not a stringified version.
                      // The sampleData should have 'content' as an object.
                      return {
                        ...restOfCbData,
                        content: cbData.content as any, // Cast to any if structure is complex and known to be valid JSON
                      };
                    }),
                  },
                };
              }),
            },
          };
        }),
      },
    };

    // Type assertion needed if sample data has fields not in Prisma create input type
    await prisma.course.create({ data: createCoursePayload as any });
    console.log(`Created course: ${courseData.title} (Template: ${!!courseData.isTemplate})`);
  }

  // 3. Migrate Lesson Library Items
  for (const libraryItemData of sampleLessonLibrary) {
    const {
      id: sampleId, // ignored
      createdAt: itemCreatedAt,
      // updatedDate is not in sample for library items, Prisma will handle updatedAt
      ...restOfItemData
    } = libraryItemData;

    const createLibraryItemPayload = {
        ...restOfItemData,
        content: libraryItemData.content as any, // Prisma expects Json for content
        tags: libraryItemData.tags || [],
        createdAt: itemCreatedAt ? new Date(itemCreatedAt) : new Date(),
    };
    await prisma.lessonLibraryItem.create({ data: createLibraryItemPayload as any });
    console.log(`Created lesson library item: ${libraryItemData.title}`);
  }

  console.log(`Seeding finished.`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
