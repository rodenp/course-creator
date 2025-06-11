import type { Course, Module, Lesson, ContentBlock, SubscriptionPlan, StripeSettings } from '@/types';

// Sample content blocks
const sampleTextContent: ContentBlock = {
  id: 'text-1',
  type: 'text',
  content: {
    type: 'text',
    content: '<h2>Welcome to React</h2><p>React is a powerful JavaScript library for building user interfaces. In this lesson, you\'ll learn the fundamentals of React components and how to create dynamic, interactive web applications.</p>',
  },
  order: 1,
};

const sampleImageContent: ContentBlock = {
  id: 'image-1',
  type: 'image',
  content: {
    type: 'image',
    url: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&h=400&fit=crop',
    title: 'React Components',
    caption: 'React components are the building blocks of any React application',
  },
  order: 2,
};

// Sample lessons
const lesson1: Lesson = {
  id: 'lesson-1',
  title: 'Introduction to React',
  description: 'Learn the basics of React and how to get started',
  content: [sampleTextContent, sampleImageContent],
  duration: 30,
  order: 1,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

const lesson2: Lesson = {
  id: 'lesson-2',
  title: 'Components and Props',
  description: 'Understanding React components and how to pass data with props',
  content: [
    {
      id: 'text-2',
      type: 'text',
      content: {
        type: 'text',
        content: '<h2>React Components</h2><p>Components are independent and reusable bits of code. They serve the same purpose as JavaScript functions, but work in isolation and return HTML.</p>',
      },
      order: 1,
    },
  ],
  duration: 45,
  order: 2,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

const lesson3: Lesson = {
  id: 'lesson-3',
  title: 'State Management',
  description: 'Learn how to manage component state with useState hook',
  content: [
    {
      id: 'text-3',
      type: 'text',
      content: {
        type: 'text',
        content: '<h2>useState Hook</h2><p>The useState Hook allows you to have state variables in functional components. You pass the initial state to this function and it returns a variable with the current state value and another function to update this value.</p>',
      },
      order: 1,
    },
  ],
  duration: 60,
  order: 3,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

// Sample modules
const module1: Module = {
  id: 'module-1',
  title: 'React Fundamentals',
  description: 'Learn the core concepts of React development',
  lessons: [lesson1, lesson2, lesson3],
  order: 1,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

const module2: Module = {
  id: 'module-2',
  title: 'Advanced React',
  description: 'Dive deeper into React with advanced patterns and hooks',
  lessons: [
    {
      id: 'lesson-4',
      title: 'useEffect Hook',
      description: 'Managing side effects in React components',
      content: [
        {
          id: 'text-4',
          type: 'text',
          content: {
            type: 'text',
            content: '<h2>useEffect Hook</h2><p>The useEffect Hook lets you perform side effects in functional components. It serves the same purpose as componentDidMount, componentDidUpdate, and componentWillUnmount combined in React Class components.</p>',
          },
          order: 1,
        },
      ],
      duration: 50,
      order: 1,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
  ],
  order: 2,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

// Global Stripe settings
export const globalStripeSettings: StripeSettings = {
  enabled: true,
  publishableKey: 'pk_test_demo_course_builder',
  secretKey: 'sk_test_demo_course_builder',
  webhookSecret: 'whsec_demo_course_builder',
  testMode: true,
  plans: subscriptionPlans,
  allowFreeTrial: true,
  freeTrialDays: 14,
  collectBillingAddress: true,
  allowPromotionCodes: true,
  brandingColor: '#3b82f6',
  supportEmail: 'support@coursebuilder.com',
  successUrl: 'https://coursebuilder.com/success',
  cancelUrl: 'https://coursebuilder.com/cancel',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-15'),
};

// Sample courses
export const sampleCourses: Course[] = [
  {
    id: 'course-1',
    title: 'Complete React Developer Course',
    description: 'Master React from beginner to advanced with hands-on projects and real-world examples. Build modern web applications with confidence.',
    coverImage: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=300&fit=crop',
    modules: [module1, module2],
    progress: 65,
    tags: ['React', 'JavaScript', 'Frontend', 'Web Development'],
    // This is a paid course requiring Pro plan
    isPaid: true,
    accessLevel: 'paid',
    requiredPlan: 'pro',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: 'course-2',
    title: 'TypeScript Fundamentals',
    description: 'Learn TypeScript from scratch and improve your JavaScript development with static typing.',
    coverImage: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=400&h=300&fit=crop',
    modules: [
      {
        id: 'module-ts-1',
        title: 'TypeScript Basics',
        description: 'Introduction to TypeScript syntax and features',
        lessons: [
          {
            id: 'lesson-ts-1',
            title: 'Getting Started with TypeScript',
            description: 'Setting up TypeScript and understanding basic types',
            content: [
              {
                id: 'text-ts-1',
                type: 'text',
                content: {
                  type: 'text',
                  content: '<h2>What is TypeScript?</h2><p>TypeScript is a typed superset of JavaScript that compiles to plain JavaScript. It adds optional static type definitions to JavaScript.</p>',
                },
                order: 1,
              },
            ],
            duration: 40,
            order: 1,
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01'),
          },
        ],
        order: 1,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
    ],
    progress: 30,
    tags: ['TypeScript', 'JavaScript', 'Programming'],
    // This is a premium course requiring Enterprise plan
    isPaid: true,
    accessLevel: 'premium',
    requiredPlan: 'enterprise',
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-10'),
  },
  {
    id: 'course-3',
    title: 'Modern CSS & Tailwind',
    description: 'Master modern CSS techniques and learn Tailwind CSS for rapid UI development.',
    coverImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop',
    modules: [],
    progress: 0,
    tags: ['CSS', 'Tailwind', 'Design', 'Frontend'],
    // This is a free course
    isPaid: false,
    accessLevel: 'free',
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-10'),
  },
  {
    id: 'template-1',
    title: 'Programming Course Template',
    description: 'A template for creating programming courses with standard structure and content blocks.',
    modules: [
      {
        id: 'template-module-1',
        title: 'Getting Started',
        description: 'Introduction and setup',
        lessons: [
          {
            id: 'template-lesson-1',
            title: 'Course Introduction',
            description: 'Welcome to the course',
            content: [
              {
                id: 'template-text-1',
                type: 'text',
                content: {
                  type: 'text',
                  content: '<h2>Welcome to the Course</h2><p>This is a template lesson. Replace this content with your own.</p>',
                },
                order: 1,
              },
            ],
            duration: 15,
            order: 1,
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01'),
          },
        ],
        order: 1,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
    ],
    isTemplate: true,
    tags: ['Template', 'Programming'],
    // Templates are free by default
    isPaid: false,
    accessLevel: 'free',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
];

// Sample lesson library items
export const sampleLessonLibrary = [
  {
    id: 'lib-1',
    title: 'Introduction Template',
    description: 'A reusable template for course introductions',
    content: [
      {
        id: 'lib-text-1',
        type: 'text' as const,
        content: {
          type: 'text' as const,
          content: '<h2>Welcome to the Course</h2><p>This lesson will introduce you to the main concepts and what you can expect to learn.</p><ul><li>Course overview</li><li>Learning objectives</li><li>Prerequisites</li></ul>',
        },
        order: 1,
      },
    ],
    duration: 15,
    tags: ['Introduction', 'Template', 'Welcome'],
    createdAt: new Date('2024-01-01'),
  },
  {
    id: 'lib-2',
    title: 'Code Example: Variables',
    description: 'Basic variable declaration and usage examples',
    content: [
      {
        id: 'lib-text-2',
        type: 'text' as const,
        content: {
          type: 'text' as const,
          content: '<h2>Working with Variables</h2><p>Variables are containers for storing data values. Here are some examples:</p><pre><code>// JavaScript examples\nlet name = "John";\nconst age = 30;\nvar isStudent = true;</code></pre>',
        },
        order: 1,
      },
    ],
    duration: 20,
    tags: ['Programming', 'JavaScript', 'Variables'],
    createdAt: new Date('2024-01-01'),
  },
  {
    id: 'lib-3',
    title: 'Exercise Template',
    description: 'A template for creating hands-on exercises',
    content: [
      {
        id: 'lib-text-3',
        type: 'text' as const,
        content: {
          type: 'text' as const,
          content: '<h2>Practice Exercise</h2><p><strong>Objective:</strong> Apply what you\'ve learned in this practical exercise.</p><h3>Instructions:</h3><ol><li>Review the concepts from previous lessons</li><li>Complete the coding challenge below</li><li>Test your solution</li><li>Submit for review</li></ol><p><strong>Challenge:</strong> [Replace with specific exercise instructions]</p>',
        },
        order: 1,
      },
    ],
    duration: 45,
    tags: ['Exercise', 'Practice', 'Template'],
    createdAt: new Date('2024-01-01'),
  },
];

// Function to initialize sample data
export const initializeSampleData = async () => {
  try {
    const existingCourses = localStorage.getItem('courses');
    const existingStripeSettings = localStorage.getItem('stripeSettings');
    const existingLibrary = localStorage.getItem('lessonLibrary');

    // Initialize courses with corrected billing architecture
    if (!existingCourses) {
      localStorage.setItem('courses', JSON.stringify(sampleCourses));
      console.log('✅ Sample courses initialized with corrected billing architecture');
    } else {
      try {
        const parsed = JSON.parse(existingCourses);
        if (!Array.isArray(parsed) || parsed.length === 0) {
          localStorage.setItem('courses', JSON.stringify(sampleCourses));
          console.log('✅ Sample courses restored (was empty)');
        }
      } catch (e) {
        localStorage.setItem('courses', JSON.stringify(sampleCourses));
        console.log('✅ Sample courses restored (was corrupted)');
      }
    }

    // Initialize global Stripe settings
    if (!existingStripeSettings) {
      localStorage.setItem('stripeSettings', JSON.stringify(globalStripeSettings));
      console.log('✅ Global Stripe settings initialized');
    }

    // Initialize lesson library if none exists
    if (!existingLibrary) {
      localStorage.setItem('lessonLibrary', JSON.stringify(sampleLessonLibrary));
      console.log('✅ Sample lesson library initialized');
    } else {
      try {
        const parsed = JSON.parse(existingLibrary);
        if (!Array.isArray(parsed) || parsed.length === 0) {
          localStorage.setItem('lessonLibrary', JSON.stringify(sampleLessonLibrary));
          console.log('✅ Sample lesson library restored');
        }
      } catch (e) {
        localStorage.setItem('lessonLibrary', JSON.stringify(sampleLessonLibrary));
        console.log('✅ Sample lesson library restored (was corrupted)');
      }
    }

    // Set data version to track architecture version
    localStorage.setItem('courseDataVersion', '3.0.0');

  } catch (error) {
    console.error('Error initializing sample data:', error);
    // Fallback: force initialize sample data
    localStorage.setItem('courses', JSON.stringify(sampleCourses));
    localStorage.setItem('stripeSettings', JSON.stringify(globalStripeSettings));
    localStorage.setItem('lessonLibrary', JSON.stringify(sampleLessonLibrary));
    localStorage.setItem('courseDataVersion', '3.0.0');
    console.log('Sample data force initialized due to error');
  }
};
