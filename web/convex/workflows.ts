import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Query to get all workflows
export const list = query({
  args: {
    is_active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("workflows").order("desc");
    
    // Filter by active status if provided
    if (args.is_active !== undefined) {
      query = query.filter((q) => q.eq(q.field("is_active"), args.is_active));
    }
    
    return await query.collect();
  },
});

// Query to get a single workflow by ID
export const get = query({
  args: { id: v.id("workflows") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Mutation to create a new workflow
export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    definition: v.any(),
    is_active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    
    return await ctx.db.insert("workflows", {
      name: args.name,
      description: args.description,
      definition: args.definition,
      is_active: args.is_active ?? true,
      created_at: now,
      updated_at: now,
    });
  },
});

// Mutation to update a workflow
export const update = mutation({
  args: {
    id: v.id("workflows"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    definition: v.optional(v.any()),
    is_active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    
    const updateData: any = {
      updated_at: now,
    };
    
    if (args.name !== undefined) updateData.name = args.name;
    if (args.description !== undefined) updateData.description = args.description;
    if (args.definition !== undefined) updateData.definition = args.definition;
    if (args.is_active !== undefined) updateData.is_active = args.is_active;
    
    await ctx.db.patch(args.id, updateData);
    return args.id;
  },
});

// Mutation to delete a workflow
export const remove = mutation({
  args: { id: v.id("workflows") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return { success: true };
  },
});

// Query to get workflow executions
export const listExecutions = query({
  args: {
    workflow_id: v.optional(v.id("workflows")),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("workflow_executions").order("desc");
    
    if (args.workflow_id) {
      query = query.filter((q) => q.eq(q.field("workflow_id"), args.workflow_id));
    }
    
    if (args.status) {
      query = query.filter((q) => q.eq(q.field("status"), args.status));
    }
    
    return await query.collect();
  },
});

// Query to get a single workflow execution
export const getExecution = query({
  args: { id: v.id("workflow_executions") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Mutation to create a new workflow execution
export const createExecution = mutation({
  args: {
    workflow_id: v.id("workflows"),
    input_data: v.optional(v.any()),
    status: v.optional(v.union(v.literal("pending"), v.literal("running"), v.literal("completed"), v.literal("failed"))),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    
    return await ctx.db.insert("workflow_executions", {
      workflow_id: args.workflow_id,
      status: args.status ?? "pending",
      input_data: args.input_data,
      started_at: now,
    });
  },
});

// Mutation to update a workflow execution
export const updateExecution = mutation({
  args: {
    id: v.id("workflow_executions"),
    status: v.optional(v.union(v.literal("pending"), v.literal("running"), v.literal("completed"), v.literal("failed"))),
    output_data: v.optional(v.any()),
    error_message: v.optional(v.string()),
    completed_at: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const updateData: any = {};
    
    if (args.status !== undefined) updateData.status = args.status;
    if (args.output_data !== undefined) updateData.output_data = args.output_data;
    if (args.error_message !== undefined) updateData.error_message = args.error_message;
    if (args.completed_at !== undefined) updateData.completed_at = args.completed_at;
    
    await ctx.db.patch(args.id, updateData);
    return args.id;
  },
});