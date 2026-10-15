import {sqliteTable,text,integer,index} from 'drizzle-orm/sqlite-core';
export const projects=sqliteTable('projects',{
 id:text('id').primaryKey(),ownerId:text('owner_id').notNull(),name:text('name').notNull(),data:text('data').notNull(),revision:integer('revision').notNull().default(1),createdAt:integer('created_at').notNull(),updatedAt:integer('updated_at').notNull(),
},table=>[index('projects_owner_updated_idx').on(table.ownerId,table.updatedAt)]);
