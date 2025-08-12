import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

async function getCurrentUser(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Not authenticated");
  }
  return identity.subject;
}

async function getCurrentUserOptional(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();
  return identity?.subject;
}

// Query to get all documents for current user with pagination and optional status filter
export const list = query({
  args: {
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
    status_filter: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getCurrentUserOptional(ctx);
    const limit = args.limit ?? 50;
    
    let query = ctx.db.query("documents").order("desc");
    
    // If user is authenticated, filter by user ID
    if (userId) {
      query = query.filter((q) => q.eq(q.field("userId"), userId));
    }
    
    // Apply status filter if provided
    if (args.status_filter) {
      query = query.filter((q) => q.eq(q.field("status"), args.status_filter));
    }
    
    const documents = await query
      .paginate({
        numItems: limit,
        cursor: null,
      });
    
    return {
      documents: documents.page,
      total_count: documents.page.length,
      has_more: documents.isDone ? false : true,
    };
  },
});

// Query to get a single document by ID (only if owned by current user)
export const get = query({
  args: { id: v.id("documents") },
  handler: async (ctx, args) => {
    const userId = await getCurrentUserOptional(ctx);
    const document = await ctx.db.get(args.id);
    
    if (!document) {
      throw new Error("Document not found");
    }
    
    // If user is authenticated and document has userId, check ownership
    if (userId && document.userId && document.userId !== userId) {
      throw new Error("Access denied");
    }
    
    return document;
  },
});

// Mutation to create a new document record
export const create = mutation({
  args: {
    filename: v.string(),
    file_size_mb: v.number(),
    content_type: v.string(),
    status: v.union(v.literal("processing"), v.literal("processed"), v.literal("failed")),
    error_message: v.optional(v.string()),
    userId: v.optional(v.string()), // Allow backend to specify userId
  },
  handler: async (ctx, args) => {
    const currentUserId = await getCurrentUserOptional(ctx);
    const timestamp = new Date().toISOString();
    
    // Use provided userId or fall back to authenticated user
    const userId = args.userId || currentUserId;
    
    return await ctx.db.insert("documents", {
      filename: args.filename,
      status: args.status,
      timestamp,
      file_size_mb: args.file_size_mb,
      content_type: args.content_type,
      error_message: args.error_message,
      userId,
    });
  },
});

// Mutation to update a document record (only if owned by current user or from backend)
export const update = mutation({
  args: {
    id: v.id("documents"),
    processing_result: v.optional(v.object({
      ocr_text: v.string(),
      extracted_entities: v.array(v.object({
        extraction_class: v.string(),
        extraction_text: v.string(),
        attributes: v.any(),
        start_char: v.optional(v.number()),
        end_char: v.optional(v.number()),
      })),
      extraction_metadata: v.any(),
      processing_stats: v.any(),
    })),
    status: v.optional(v.union(v.literal("processing"), v.literal("processed"), v.literal("failed"))),
    error_message: v.optional(v.string()),
    bypass_auth: v.optional(v.boolean()), // Allow backend to bypass auth
  },
  handler: async (ctx, args) => {
    const userId = await getCurrentUserOptional(ctx);
    const document = await ctx.db.get(args.id);
    
    if (!document) {
      throw new Error("Document not found");
    }
    
    // Check permissions unless bypassing auth (for backend)
    if (!args.bypass_auth && userId && document.userId && document.userId !== userId) {
      throw new Error("Access denied");
    }
    
    const timestamp = new Date().toISOString();
    
    const updateData: any = {
      timestamp,
    };
    
    if (args.processing_result !== undefined) {
      updateData.processing_result = args.processing_result;
    }
    if (args.status !== undefined) {
      updateData.status = args.status;
    }
    if (args.error_message !== undefined) {
      updateData.error_message = args.error_message;
    }
    
    await ctx.db.patch(args.id, updateData);
    return args.id;
  },
});

// Mutation to delete a document record (only if owned by current user)
export const remove = mutation({
  args: { id: v.id("documents") },
  handler: async (ctx, args) => {
    const userId = await getCurrentUser(ctx);
    const document = await ctx.db.get(args.id);
    
    if (!document) {
      throw new Error("Document not found");
    }
    
    if (document.userId && document.userId !== userId) {
      throw new Error("Access denied");
    }
    
    await ctx.db.delete(args.id);
    return { success: true };
  },
});

