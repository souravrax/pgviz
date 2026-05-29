/** A mock PostgreSQL schema for browser-based webview development.
 *  Used when the webview runs outside VS Code (e.g. `pnpm dev` in a browser). */
import type { Schema } from './types.js'

export function getMockSchema(): Schema {
  return {
    name: 'public',
    tables: [
      {
        name: 'users',
        columns: [
          { name: 'id', type: 'uuid', nullable: false, defaultValue: 'gen_random_uuid()' },
          { name: 'email', type: 'varchar(255)', nullable: false, defaultValue: null },
          { name: 'username', type: 'varchar(50)', nullable: false, defaultValue: null },
          { name: 'created_at', type: 'timestamptz', nullable: false, defaultValue: 'now()' },
        ],
        primaryKeys: ['id'],
        indexes: [
          { name: 'users_email_key', columns: ['email'], unique: true },
          { name: 'users_username_key', columns: ['username'], unique: true },
          { name: 'users_pkey', columns: ['id'], unique: true },
        ],
      },
      {
        name: 'posts',
        columns: [
          { name: 'id', type: 'uuid', nullable: false, defaultValue: 'gen_random_uuid()' },
          { name: 'user_id', type: 'uuid', nullable: false, defaultValue: null },
          { name: 'title', type: 'varchar(255)', nullable: false, defaultValue: null },
          { name: 'body', type: 'text', nullable: true, defaultValue: null },
          { name: 'published', type: 'boolean', nullable: false, defaultValue: 'false' },
          { name: 'created_at', type: 'timestamptz', nullable: false, defaultValue: 'now()' },
        ],
        primaryKeys: ['id'],
        indexes: [
          { name: 'posts_pkey', columns: ['id'], unique: true },
          { name: 'posts_user_id_idx', columns: ['user_id'], unique: false },
          { name: 'posts_published_created_at_idx', columns: ['published', 'created_at'], unique: false },
        ],
      },
      {
        name: 'comments',
        columns: [
          { name: 'id', type: 'uuid', nullable: false, defaultValue: 'gen_random_uuid()' },
          { name: 'post_id', type: 'uuid', nullable: false, defaultValue: null },
          { name: 'user_id', type: 'uuid', nullable: false, defaultValue: null },
          { name: 'body', type: 'text', nullable: false, defaultValue: null },
          { name: 'created_at', type: 'timestamptz', nullable: false, defaultValue: 'now()' },
        ],
        primaryKeys: ['id'],
        indexes: [
          { name: 'comments_pkey', columns: ['id'], unique: true },
          { name: 'comments_post_id_idx', columns: ['post_id'], unique: false },
          { name: 'comments_user_id_idx', columns: ['user_id'], unique: false },
        ],
      },
      {
        name: 'categories',
        columns: [
          { name: 'id', type: 'uuid', nullable: false, defaultValue: 'gen_random_uuid()' },
          { name: 'name', type: 'varchar(100)', nullable: false, defaultValue: null },
          { name: 'slug', type: 'varchar(100)', nullable: false, defaultValue: null },
        ],
        primaryKeys: ['id'],
        indexes: [
          { name: 'categories_pkey', columns: ['id'], unique: true },
          { name: 'categories_slug_key', columns: ['slug'], unique: true },
        ],
      },
      {
        name: 'post_categories',
        columns: [
          { name: 'post_id', type: 'uuid', nullable: false, defaultValue: null },
          { name: 'category_id', type: 'uuid', nullable: false, defaultValue: null },
        ],
        primaryKeys: ['post_id', 'category_id'],
        indexes: [
          { name: 'post_categories_pkey', columns: ['post_id', 'category_id'], unique: true },
          { name: 'post_categories_category_id_idx', columns: ['category_id'], unique: false },
        ],
      },
    ],
    relations: [
      { fromTable: 'posts', fromColumn: 'user_id', toTable: 'users', toColumn: 'id', constraintName: 'posts_user_id_fkey' },
      { fromTable: 'comments', fromColumn: 'post_id', toTable: 'posts', toColumn: 'id', constraintName: 'comments_post_id_fkey' },
      { fromTable: 'comments', fromColumn: 'user_id', toTable: 'users', toColumn: 'id', constraintName: 'comments_user_id_fkey' },
      { fromTable: 'post_categories', fromColumn: 'post_id', toTable: 'posts', toColumn: 'id', constraintName: 'post_categories_post_id_fkey' },
      { fromTable: 'post_categories', fromColumn: 'category_id', toTable: 'categories', toColumn: 'id', constraintName: 'post_categories_category_id_fkey' },
    ],
  }
}
