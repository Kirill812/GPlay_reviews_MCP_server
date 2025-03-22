// Review Object
export interface Review {
  id: string;               // Unique review identifier
  appPackage: string;       // Application package name
  userName: string;         // Name of reviewer
  userImage?: string;       // URL to reviewer's profile image
  rating: number;           // 1-5 star rating
  title?: string;           // Review title (if available)
  text: string;             // Review content
  date: string;             // ISO 8601 date when review was posted
  lastUpdateDate: string;   // ISO 8601 date when review was last updated
  
  // Device metadata
  language: string;         // ISO 639-1 language code (e.g., "en")
  country: string;          // ISO 3166-1 alpha-2 country code (e.g., "US")
  appVersion: string;       // App version reviewed
  deviceMetadata: {
    device: string;         // Device model
    os: string;             // OS type (Android/iOS)
    osVersion: string;      // OS version
  };
  
  // Reply data
  replyData?: {
    replyId: string;        // Unique reply identifier
    replyText: string;      // Reply content
    replyDate: string;      // ISO 8601 date when reply was posted
    lastEditDate?: string;  // ISO 8601 date when reply was last edited
  };
  
  // Internal metadata
  internalMetadata?: {
    status: 'new' | 'flagged' | 'responded' | 'resolved';
    tags: string[];         // Custom tags for organization
    assignedTo?: string;    // Person assigned to handle this review
    notes?: string;         // Internal notes
  };
}

// Review Filter Object
export interface ReviewFilter {
  // App filter
  appPackage?: string;      // Application package name to filter by
  
  // Rating filters
  minRating?: number;       // Minimum star rating (1-5)
  maxRating?: number;       // Maximum star rating (1-5)
  
  // Date filters
  startDate?: string;       // ISO 8601 date
  endDate?: string;         // ISO 8601 date
  
  // Device and locale filters
  languages?: string[];     // Array of ISO 639-1 language codes
  countries?: string[];     // Array of ISO 3166-1 alpha-2 country codes
  appVersions?: string[];   // Array of app versions
  minAppVersion?: string;   // Minimum app version (semver)
  deviceTypes?: string[];   // Array of device types
  osVersions?: string[];    // Array of OS versions
  minOsVersion?: string;    // Minimum OS version
  
  // Reply filters
  hasReply?: boolean;       // Whether review has been replied to
  hasFreshReply?: boolean;  // Whether review has a reply newer than the review update
  
  // Internal filters
  status?: ('new' | 'flagged' | 'responded' | 'resolved')[];
  tags?: string[];          // Array of tags to match
  assignedTo?: string[];    // Array of assignee identifiers
  
  // Pagination
  limit?: number;           // Maximum number of results
  offset?: number;          // Starting position
}

// App Metadata
export interface AppMetadata {
  packageName: string;      // Unique package identifier (e.g., "com.example.app")
  title: string;            // App display name
  icon?: string;            // URL to app icon image
  latestVersion?: string;   // Latest app version
  description?: string;     // App description
  category?: string;        // App category
  developer?: {
    name: string;           // Developer name
    website?: string;       // Developer website
    email?: string;         // Developer contact email
  };
  updatedAt?: string;       // Last update timestamp
}

// MCP Server Related Types
export interface ServerInfo {
  name: string;
  version: string;
  description?: string;
}

// This interface maps to the structure returned by Google Play API
export interface GooglePlayReview {
  reviewId: string;
  authorName: string;
  authorImage?: {
    url: string;
  };
  comments: Array<{
    userComment: {
      text: string;
      lastModified: {
        seconds: string;
        nanos: string;
      };
      starRating: number;
      reviewerLanguage: string;
      device: string;
      androidOsVersion: string;
      appVersionCode: string;
      appVersionName: string;
    };
    developerComment?: {
      text: string;
      lastModified: {
        seconds: string;
        nanos: string;
      };
    };
  }>;
}

// This interface represents the pagination and metadata for collections
export interface PaginatedResult<T> {
  items: T[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

// API Response Types
export interface ReviewsResponse {
  reviews: Review[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export interface ReplyResponse {
  success: boolean;
  replyId: string;
  timestamp: string;
}

// Error Handling Types
export enum ErrorCode {
  InvalidRequest = 'INVALID_REQUEST',
  MethodNotFound = 'METHOD_NOT_FOUND',
  AuthenticationError = 'AUTHENTICATION_ERROR',
  ApiError = 'API_ERROR',
  DatabaseError = 'DATABASE_ERROR',
  InternalError = 'INTERNAL_ERROR'
}

export interface ErrorResponse {
  error: {
    code: ErrorCode;
    message: string;
  };
}