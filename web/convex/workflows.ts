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

// Query to get all workflows for current user
export const list = query({
  args: {
    is_active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getCurrentUserOptional(ctx);
    let query = ctx.db.query("workflows").order("desc");
    
    // If user is authenticated, filter by user ID
    if (userId) {
      query = query.filter((q) => q.eq(q.field("userId"), userId));
    }
    
    // Filter by active status if provided
    if (args.is_active !== undefined) {
      query = query.filter((q) => q.eq(q.field("is_active"), args.is_active));
    }
    
    return await query.collect();
  },
});

// Query to get a single workflow by ID (only if owned by current user)
export const get = query({
  args: { id: v.id("workflows") },
  handler: async (ctx, args) => {
    const userId = await getCurrentUser(ctx);
    const workflow = await ctx.db.get(args.id);
    
    if (!workflow) {
      throw new Error("Workflow not found");
    }
    
    if (workflow.userId && workflow.userId !== userId) {
      throw new Error("Access denied");
    }
    
    return workflow;
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
    const userId = await getCurrentUser(ctx);
    const now = new Date().toISOString();
    
    return await ctx.db.insert("workflows", {
      name: args.name,
      description: args.description,
      definition: args.definition,
      is_active: args.is_active ?? true,
      created_at: now,
      updated_at: now,
      userId,
    });
  },
});

// Mutation to update a workflow (only if owned by current user)
export const update = mutation({
  args: {
    id: v.id("workflows"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    definition: v.optional(v.any()),
    is_active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getCurrentUser(ctx);
    const workflow = await ctx.db.get(args.id);
    
    if (!workflow) {
      throw new Error("Workflow not found");
    }
    
    if (workflow.userId && workflow.userId !== userId) {
      throw new Error("Access denied");
    }
    
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

// Mutation to delete a workflow (only if owned by current user)
export const remove = mutation({
  args: { id: v.id("workflows") },
  handler: async (ctx, args) => {
    const userId = await getCurrentUser(ctx);
    const workflow = await ctx.db.get(args.id);
    
    if (!workflow) {
      throw new Error("Workflow not found");
    }
    
    if (workflow.userId && workflow.userId !== userId) {
      throw new Error("Access denied");
    }
    
    await ctx.db.delete(args.id);
    return { success: true };
  },
});

// Query to get workflow executions for current user
export const listExecutions = query({
  args: {
    workflow_id: v.optional(v.id("workflows")),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getCurrentUser(ctx);
    let query = ctx.db.query("workflow_executions")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .order("desc");
    
    if (args.workflow_id) {
      query = query.filter((q) => q.eq(q.field("workflow_id"), args.workflow_id));
    }
    
    if (args.status) {
      query = query.filter((q) => q.eq(q.field("status"), args.status));
    }
    
    return await query.collect();
  },
});

// Query to get a single workflow execution (only if owned by current user)
export const getExecution = query({
  args: { id: v.id("workflow_executions") },
  handler: async (ctx, args) => {
    const userId = await getCurrentUser(ctx);
    const execution = await ctx.db.get(args.id);
    
    if (!execution) {
      throw new Error("Workflow execution not found");
    }
    
    if (execution.userId && execution.userId !== userId) {
      throw new Error("Access denied");
    }
    
    return execution;
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
    const userId = await getCurrentUser(ctx);
    
    // Verify user owns the workflow
    const workflow = await ctx.db.get(args.workflow_id);
    if (!workflow) {
      throw new Error("Workflow not found");
    }
    
    if (workflow.userId && workflow.userId !== userId) {
      throw new Error("Access denied");
    }
    
    const now = new Date().toISOString();
    
    return await ctx.db.insert("workflow_executions", {
      workflow_id: args.workflow_id,
      status: args.status ?? "pending",
      input_data: args.input_data,
      started_at: now,
      userId,
    });
  },
});

// Mutation to update a workflow execution (only if owned by current user)
export const updateExecution = mutation({
  args: {
    id: v.id("workflow_executions"),
    status: v.optional(v.union(v.literal("pending"), v.literal("running"), v.literal("completed"), v.literal("failed"))),
    output_data: v.optional(v.any()),
    error_message: v.optional(v.string()),
    completed_at: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getCurrentUser(ctx);
    const execution = await ctx.db.get(args.id);
    
    if (!execution) {
      throw new Error("Workflow execution not found");
    }
    
    if (execution.userId && execution.userId !== userId) {
      throw new Error("Access denied");
    }
    
    const updateData: any = {};
    
    if (args.status !== undefined) updateData.status = args.status;
    if (args.output_data !== undefined) updateData.output_data = args.output_data;
    if (args.error_message !== undefined) updateData.error_message = args.error_message;
    if (args.completed_at !== undefined) updateData.completed_at = args.completed_at;
    
    await ctx.db.patch(args.id, updateData);
    return args.id;
  },
});