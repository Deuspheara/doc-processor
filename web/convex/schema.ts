import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    userId: v.optional(v.string()),
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    createdAt: v.string(),
    updatedAt: v.string(),
  }).index("by_user_id", ["userId"]),

  documents: defineTable({
    filename: v.string(),
    status: v.union(v.literal("processing"), v.literal("processed"), v.literal("failed")),
    timestamp: v.string(),
    file_size_mb: v.number(),
    content_type: v.string(),
    userId: v.optional(v.string()),
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
    error_message: v.optional(v.string()),
  }).index("by_user_id", ["userId"]),
  
  workflows: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    definition: v.any(), // Stores nodes and edges
    is_active: v.boolean(),
    created_at: v.string(),
    updated_at: v.string(),
    userId: v.optional(v.string()),
  }).index("by_user_id", ["userId"]),
  
  workflow_executions: defineTable({
    workflow_id: v.id("workflows"),
    status: v.union(v.literal("pending"), v.literal("running"), v.literal("completed"), v.literal("failed")),
    input_data: v.optional(v.any()),
    output_data: v.optional(v.any()),
    error_message: v.optional(v.string()),
    started_at: v.string(),
    completed_at: v.optional(v.string()),
    userId: v.optional(v.string()),
  }).index("by_user_id", ["userId"]).index("by_workflow_id", ["workflow_id"]),
});