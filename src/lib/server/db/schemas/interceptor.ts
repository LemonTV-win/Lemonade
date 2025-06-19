import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';
import { uploadedFile } from './upload';

export const interceptor = sqliteTable('interceptor', {
	id: text('id').primaryKey(), // e.g., 'WT_MID_CT_DEFAULT'
	map: text('map').notNull(), // GameMap type
	name: text('name').notNull(),
	side: text('side', { enum: ['attacker', 'defender'] }).notNull(),
	roundStart: integer('round_start', { mode: 'boolean' }).notNull(),
	video: text('video'), // optional
	jump: text('jump', { enum: ['none', 'once', 'twice'] }).notNull(),
	createdAt: integer('created_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date()),
	updatedAt: integer('updated_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date())
});

export const interceptorPosition = sqliteTable('interceptor_position', {
	id: text('id').primaryKey(),
	interceptorId: text('interceptor_id')
		.notNull()
		.references(() => interceptor.id, { onDelete: 'cascade' }),
	type: text('type', { enum: ['position', 'deploy_position'] }).notNull(), // to distinguish between position and deploy_position
	x: real('x').notNull(),
	y: real('y').notNull()
});

export const interceptorImage = sqliteTable('interceptor_image', {
	id: text('id').primaryKey(),
	interceptorId: text('interceptor_id')
		.notNull()
		.references(() => interceptor.id, { onDelete: 'cascade' }),
	fileId: text('file_id')
		.notNull()
		.references(() => uploadedFile.id, { onDelete: 'cascade' }),
	type: text('type', { enum: ['deploy', 'overview', 'end'] }).notNull()
});

// Relations
export const interceptorRelations = relations(interceptor, ({ many }) => ({
	positions: many(interceptorPosition),
	images: many(interceptorImage)
}));

export const interceptorPositionRelations = relations(interceptorPosition, ({ one }) => ({
	interceptor: one(interceptor, {
		fields: [interceptorPosition.interceptorId],
		references: [interceptor.id]
	})
}));

export const interceptorImageRelations = relations(interceptorImage, ({ one }) => ({
	interceptor: one(interceptor, {
		fields: [interceptorImage.interceptorId],
		references: [interceptor.id]
	}),
	file: one(uploadedFile, {
		fields: [interceptorImage.fileId],
		references: [uploadedFile.id]
	})
}));

// Type exports
export type Interceptor = typeof interceptor.$inferSelect;
export type NewInterceptor = typeof interceptor.$inferInsert;
export type InterceptorPosition = typeof interceptorPosition.$inferSelect;
export type NewInterceptorPosition = typeof interceptorPosition.$inferInsert;
export type InterceptorImage = typeof interceptorImage.$inferSelect;
export type NewInterceptorImage = typeof interceptorImage.$inferInsert;
