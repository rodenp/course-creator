export { default as CoursePlugin } from './CoursePlugin';
// Define and export prop types from here or from a dedicated types file within the plugin src
export type { StorageConfig } from './types'; // Assuming StorageConfig is already in types/index.ts

// Re-exporting types used in CoursePluginProps for consumer convenience
// These should ideally be defined in a shared types file or within the plugin's types.
interface UserInfoType {
  id: string;
  email?: string;
  name?: string;
  planId?: string;
  planStatus?: string;
}

interface StripePluginConfigType {
  publishableKey: string;
}
export type { UserInfoType as PluginUserInfo, StripePluginConfigType as PluginStripeConfig };
