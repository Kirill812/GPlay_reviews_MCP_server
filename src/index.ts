#!/usr/bin/env node
import { config } from 'dotenv';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

// Load environment variables from .env file
config();
import {
  CallToolRequestSchema,
  ErrorCode,
  ListResourcesRequestSchema,
  ListResourceTemplatesRequestSchema,
  ListToolsRequestSchema,
  McpError,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { Review, ReviewFilter, ReviewsResponse, ReplyResponse } from './types.js';
import ReviewsRepository from './repositories/reviews-repository.js';
import AppsRepository from './repositories/apps-repository.js';

// Define extended globalThis interface to handle console and process
interface ExtendedGlobalThis {
  console: {
    log(...args: any[]): void;
    error(...args: any[]): void;
    warn(...args: any[]): void;
    info(...args: any[]): void;
  };
  process: {
    exit(code?: number): never;
    on(event: string, listener: (...args: any[]) => void): void;
    env: { [key: string]: string | undefined };
  };
}

// Cast globalThis to our extended interface
const global = globalThis as unknown as ExtendedGlobalThis;

/**
 * Google Play Reviews MCP Server
 * Provides access to Google Play Store reviews through MCP protocol
 */
class GooglePlayReviewsMCPServer {
  private server: Server;
  private reviewsRepository: ReviewsRepository;
  private appsRepository: AppsRepository;

  constructor() {
    // Initialize the server
    this.server = new Server(
      {
        name: 'GPlay Reviews',
        version: '1.0.0',
        description: '⭐️ MCP Server for Google Play Reviews',
      },
      {
        capabilities: {
          resources: {},
          tools: {},
        },
      }
    );

    // Initialize repositories
    this.reviewsRepository = ReviewsRepository.getInstance();
    this.appsRepository = AppsRepository.getInstance();

    // Set up handlers
    this.setupResourceHandlers();
    this.setupToolHandlers();
    
    // Error handling
    this.server.onerror = (error: any) => global.console.error('[MCP Error]', error);
    global.process.on('SIGINT', async () => {
      await this.server.close();
      global.process.exit(0);
    });
  }

  /**
   * Initialize the server and repositories
   */
  private async initialize(): Promise<void> {
    try {
      // Initialize repositories
      await this.reviewsRepository.init();
      await this.appsRepository.init();
      
      global.console.log('Google Play Reviews MCP Server initialized');
    } catch (error) {
      global.console.error('Failed to initialize server:', error);
      throw error;
    }
  }

  /**
   * Set up resource handlers
   */
  private setupResourceHandlers(): void {
    // List available resources
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => ({
      resources: [
        {
          uri: 'googleplay://apps',
          name: 'Google Play Apps',
          description: 'List of apps accessible to the authenticated user',
        },
        {
          uri: 'googleplay://stats',
          name: 'Google Play Review Statistics',
          description: 'Aggregate statistics for app reviews',
        },
      ],
    }));

    // List resource templates
    this.server.setRequestHandler(ListResourceTemplatesRequestSchema, async () => ({
      resourceTemplates: [
        {
          uriTemplate: 'googleplay://reviews/{appPackage}',
          name: 'App Reviews',
          description: 'Reviews for a specific app',
        },
        {
          uriTemplate: 'googleplay://reviews/{appPackage}/{reviewId}',
          name: 'Specific Review',
          description: 'Details of a specific review',
        },
        {
          uriTemplate: 'googleplay://stats/{appPackage}',
          name: 'App Statistics',
          description: 'Review statistics for an app',
        },
      ],
    }));

    // Handle resource reads
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request: any) => {
      const { uri } = request.params;

      // Match and handle different resource patterns
      const appsMatch = uri.match(/^googleplay:\/\/apps$/);
      if (appsMatch) {
        return this.handleAppsResource();
      }

      const statsMatch = uri.match(/^googleplay:\/\/stats$/);
      if (statsMatch) {
        return this.handleStatsResource();
      }

      const appReviewsMatch = uri.match(/^googleplay:\/\/reviews\/([^/]+)$/);
      if (appReviewsMatch) {
        const appPackage = decodeURIComponent(appReviewsMatch[1]);
        return this.handleAppReviewsResource(appPackage);
      }

      const specificReviewMatch = uri.match(/^googleplay:\/\/reviews\/([^/]+)\/([^/]+)$/);
      if (specificReviewMatch) {
        const appPackage = decodeURIComponent(specificReviewMatch[1]);
        const reviewId = decodeURIComponent(specificReviewMatch[2]);
        return this.handleSpecificReviewResource(appPackage, reviewId);
      }

      const appStatsMatch = uri.match(/^googleplay:\/\/stats\/([^/]+)$/);
      if (appStatsMatch) {
        const appPackage = decodeURIComponent(appStatsMatch[1]);
        return this.handleAppStatsResource(appPackage);
      }

      throw new McpError(ErrorCode.InvalidRequest, `Invalid URI format: ${uri}`);
    });
  }

  /**
   * Set up tool handlers
   */
  private setupToolHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'get_reviews',
          description: 'Retrieves reviews for a specific app with optional filtering',
          inputSchema: {
            type: 'object',
            properties: {
              appPackage: {
                type: 'string',
                description: 'Package name of the app',
              },
              filter: {
                type: 'object',
                properties: {
                  minRating: { type: 'number', minimum: 1, maximum: 5 },
                  maxRating: { type: 'number', minimum: 1, maximum: 5 },
                  startDate: { type: 'string', format: 'date-time' },
                  endDate: { type: 'string', format: 'date-time' },
                  languages: { type: 'array', items: { type: 'string' } },
                  countries: { type: 'array', items: { type: 'string' } },
                  appVersions: { type: 'array', items: { type: 'string' } },
                  minAppVersion: { type: 'string' },
                  deviceTypes: { type: 'array', items: { type: 'string' } },
                  osVersions: { type: 'array', items: { type: 'string' } },
                  minOsVersion: { type: 'string' },
                  hasReply: { type: 'boolean' },
                  hasFreshReply: { type: 'boolean' },
                  limit: { type: 'number', minimum: 1, maximum: 100, default: 20 },
                  offset: { type: 'number', minimum: 0, default: 0 },
                },
              },
            },
            required: ['appPackage'],
          },
        },
        {
          name: 'post_reply',
          description: 'Posts a reply to a specific review',
          inputSchema: {
            type: 'object',
            properties: {
              reviewId: { type: 'string' },
              replyText: { type: 'string', maxLength: 350 },
            },
            required: ['reviewId', 'replyText'],
          },
        },
        {
          name: 'search_reviews',
          description: 'Searches reviews across all apps using text search capabilities',
          inputSchema: {
            type: 'object',
            properties: {
              query: { type: 'string' },
              appPackage: { type: 'string' },
              filter: { type: 'object' },
              limit: { type: 'number', minimum: 1, maximum: 100, default: 20 },
              offset: { type: 'number', minimum: 0, default: 0 },
            },
            required: ['query'],
          },
        },
      ],
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request: any) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'get_reviews':
            return this.handleGetReviews(args);
          case 'post_reply':
            return this.handlePostReply(args);
          case 'search_reviews':
            return this.handleSearchReviews(args);
          default:
            throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
        }
      } catch (error) {
        if (error instanceof McpError) {
          throw error;
        }
        throw new McpError(ErrorCode.InternalError, `Error in tool ${name}: ${error}`);
      }
    });
  }

  /**
   * Handle the apps resource
   */
  private async handleAppsResource(): Promise<any> {
    const apps = await this.appsRepository.findAll();
    return {
      contents: [
        {
          uri: 'googleplay://apps',
          mimeType: 'application/json',
          text: JSON.stringify(apps, null, 2),
        },
      ],
    };
  }

  /**
   * Handle general stats resource
   */
  private async handleStatsResource(): Promise<any> {
    // In a real implementation, this would gather general stats
    // For now, return a placeholder
    const generalStats = {
      totalApps: 3,
      totalReviews: 8,
      averageRating: 3.4,
    };
    
    return {
      contents: [
        {
          uri: 'googleplay://stats',
          mimeType: 'application/json',
          text: JSON.stringify(generalStats, null, 2),
        },
      ],
    };
  }

  /**
   * Handle app reviews resource
   */
  private async handleAppReviewsResource(appPackage: string): Promise<any> {
    const reviews = await this.reviewsRepository.find({
      limit: 10,
      offset: 0,
    });
    
    return {
      contents: [
        {
          uri: `googleplay://reviews/${appPackage}`,
          mimeType: 'application/json',
          text: JSON.stringify(reviews, null, 2),
        },
      ],
    };
  }

  /**
   * Handle specific review resource
   */
  private async handleSpecificReviewResource(appPackage: string, reviewId: string): Promise<any> {
    const review = await this.reviewsRepository.findById(reviewId);
    
    if (!review) {
      throw new McpError(ErrorCode.InvalidRequest, `Review not found: ${reviewId}`);
    }
    
    return {
      contents: [
        {
          uri: `googleplay://reviews/${appPackage}/${reviewId}`,
          mimeType: 'application/json',
          text: JSON.stringify(review, null, 2),
        },
      ],
    };
  }

  /**
   * Handle app stats resource
   */
  private async handleAppStatsResource(appPackage: string): Promise<any> {
    const stats = await this.appsRepository.getAppStats(appPackage);
    
    if (!stats) {
      throw new McpError(ErrorCode.InvalidRequest, `App not found: ${appPackage}`);
    }
    
    return {
      contents: [
        {
          uri: `googleplay://stats/${appPackage}`,
          mimeType: 'application/json',
          text: JSON.stringify(stats, null, 2),
        },
      ],
    };
  }

  /**
   * Handle get_reviews tool
   */
  private async handleGetReviews(args: any): Promise<any> {
    if (typeof args.appPackage !== 'string') {
      throw new McpError(ErrorCode.InvalidParams, 'appPackage must be a string');
    }

    const filter: ReviewFilter = {
      appPackage: args.appPackage, // Add the appPackage to the filter
      ...args.filter,
      limit: args.filter?.limit || 20,
      offset: args.filter?.offset || 0,
    };

    global.console.log(`Getting reviews for ${args.appPackage} with filter:`, filter);

    const reviews = await this.reviewsRepository.find(filter);
    const total = await this.reviewsRepository.countReviews(args.appPackage);
    
    const response: ReviewsResponse = {
      reviews,
      pagination: {
        total,
        limit: filter.limit || 20,
        offset: filter.offset || 0,
        hasMore: (filter.offset || 0) + (filter.limit || 20) < total,
      },
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response, null, 2),
        },
      ],
    };
  }

  /**
   * Handle post_reply tool
   */
  private async handlePostReply(args: any): Promise<any> {
    if (typeof args.reviewId !== 'string') {
      throw new McpError(ErrorCode.InvalidParams, 'reviewId must be a string');
    }

    if (typeof args.replyText !== 'string') {
      throw new McpError(ErrorCode.InvalidParams, 'replyText must be a string');
    }

    if (args.replyText.length > 350) {
      throw new McpError(
        ErrorCode.InvalidParams,
        `replyText exceeds maximum length (${args.replyText.length}/350)`
      );
    }

    const success = await this.reviewsRepository.addReply(args.reviewId, args.replyText);
    
    if (!success) {
      throw new McpError(ErrorCode.InvalidRequest, `Review not found: ${args.reviewId}`);
    }

    const review = await this.reviewsRepository.findById(args.reviewId);
    
    if (!review || !review.replyData) {
      throw new McpError(ErrorCode.InternalError, 'Failed to retrieve reply data');
    }

    const response: ReplyResponse = {
      success: true,
      replyId: review.replyData.replyId,
      timestamp: review.replyData.replyDate,
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response, null, 2),
        },
      ],
    };
  }

  /**
   * Handle search_reviews tool
   */
  private async handleSearchReviews(args: any): Promise<any> {
    if (typeof args.query !== 'string') {
      throw new McpError(ErrorCode.InvalidParams, 'query must be a string');
    }

    // In a real implementation, this would use a text search index
    // For now, we'll do a simple text search across all reviews
    const filter: ReviewFilter = {
      ...(args.filter || {}),
      limit: args.limit || 20,
      offset: args.offset || 0,
    };

    // Get all reviews matching the app package (if provided)
    const appPackageFilter = args.appPackage ? 
      (review: Review) => review.appPackage === args.appPackage : 
      () => true;
    
    // Simple text search (case-insensitive)
    const query = args.query.toLowerCase();
    const queryFilter = (review: Review) => 
      review.text.toLowerCase().includes(query) || 
      (review.title && review.title.toLowerCase().includes(query));
    
    // Combine filters
    const combinedFilter = (review: Review) => 
      appPackageFilter(review) && queryFilter(review);
    
    // Get matching reviews with pagination
    const reviews = await this.reviewsRepository.find({
      ...filter,
      limit: 1000, // Get a large batch for filtering
      offset: 0,
    });
    
    const matchingReviews = reviews.filter(combinedFilter);
    const totalMatches = matchingReviews.length;
    
    // Apply pagination
    const paginatedReviews = matchingReviews.slice(
      args.offset || 0,
      (args.offset || 0) + (args.limit || 20)
    );

    const response: ReviewsResponse = {
      reviews: paginatedReviews,
      pagination: {
        total: totalMatches,
        limit: args.limit || 20,
        offset: args.offset || 0,
        hasMore: (args.offset || 0) + (args.limit || 20) < totalMatches,
      },
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response, null, 2),
        },
      ],
    };
  }

  /**
   * Run the server
   */
  public async run(): Promise<void> {
    try {
      // Initialize repositories
      await this.initialize();
      
      // Connect to transport
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      
      global.console.log('Google Play Reviews MCP server running on stdio');
    } catch (error) {
      global.console.error('Failed to start server:', error);
      global.process.exit(1);
    }
  }
}

// Create and run the server
const server = new GooglePlayReviewsMCPServer();
server.run().catch((err) => global.console.error(err));