import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const uploadedFile = sqliteTable('uploaded_file', {
	id: text('id').primaryKey(), // UUID or unique identifier
	originalName: text('original_name').notNull(), // Original filename
	s3Key: text('s3_key').notNull().unique(), // S3 object key
	s3Bucket: text('s3_bucket').notNull(), // S3 bucket name
	fileSize: integer('file_size').notNull(), // File size in bytes
	mimeType: text('mime_type').notNull(), // MIME type
	uploader: text('uploader').notNull(), // Simple uploader field (username or user ID)
	uploadedAt: integer('uploaded_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date())
});

export type UploadedFile = typeof uploadedFile.$inferSelect;
export type NewUploadedFile = typeof uploadedFile.$inferInsert;
