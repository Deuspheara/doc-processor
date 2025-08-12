import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Query to get all documents with pagination and optional status filter
export const list = query({
  args: {
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
    status_filter: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    const offset = args.offset ?? 0;
    
    let query = ctx.db.query("documents").order("desc");
    
    // Apply status filter if provided
    if (args.status_filter) {
      query = query.filter((q) => q.eq(q.field("status"), args.status_filter));
    }
    
    const documents = await query
      .paginate({
        numItems: limit,
        cursor: null, // Convex handles pagination differently
      });
    
    return {
      documents: documents.page,
      total_count: documents.page.length, // This is simplified - in production you'd want to count separately
      has_more: documents.isDone ? false : true,
    };
  },
});

// Query to get a single document by ID
export const get = query({
  args: { id: v.id("documents") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
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
  },
  handler: async (ctx, args) => {
    const timestamp = new Date().toISOString();
    
    return await ctx.db.insert("documents", {
      filename: args.filename,
      status: args.status,
      timestamp,
      file_size_mb: args.file_size_mb,
      content_type: args.content_type,
      error_message: args.error_message,
    });
  },
});

// Mutation to update a document record
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
  },
  handler: async (ctx, args) => {
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

// Mutation to delete a document record
export const remove = mutation({
  args: { id: v.id("documents") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return { success: true };
  },
});

