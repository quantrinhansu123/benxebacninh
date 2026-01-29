/**
 * Drizzle Repository Base Class
 * Provides common CRUD operations for Supabase/PostgreSQL via Drizzle ORM
 *
 * Note: Using @ts-ignore for Drizzle ORM generic type complexity
 * This is a known issue with Drizzle when using abstract base classes
 */
import { db } from '../../db/drizzle'
import { eq, sql, and, or, gte, lte, like, desc, asc } from 'drizzle-orm'
import { PgTable, PgColumn } from 'drizzle-orm/pg-core'
import { DatabaseError, NotFoundError, ValidationError } from '../errors/app-error'

export interface DrizzleQueryOptions<T> {
  where?: Partial<T>
  orderBy?: { field: keyof T; direction: 'asc' | 'desc' }
  limit?: number
  offset?: number
}

/**
 * Pagination validation constants
 */
const MAX_LIMIT = 1000
const DEFAULT_LIMIT = 10
const DEFAULT_OFFSET = 0

/**
 * Validated pagination parameters
 */
interface ValidatedPagination {
  limit: number
  offset: number
}

export interface PaginatedResult<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

/**
 * Abstract base repository for Drizzle ORM
 * Extend this class to create entity-specific repositories
 */
export abstract class DrizzleRepository<
  TTable extends PgTable,
  TSelect,
  TInsert
> {
  protected abstract table: TTable
  protected abstract idColumn: PgColumn

  /**
   * Get database instance with null check
   */
  protected getDb() {
    if (!db) {
      throw new DatabaseError('Database not initialized. Check DATABASE_URL.')
    }
    return db
  }

  /**
   * Validate pagination parameters
   * Ensures limit and offset are non-negative and within allowed ranges
   */
  protected validatePagination(
    limit?: number,
    offset?: number
  ): ValidatedPagination {
    const validatedLimit = limit ?? DEFAULT_LIMIT
    const validatedOffset = offset ?? DEFAULT_OFFSET

    if (validatedLimit < 0) {
      throw new ValidationError('Limit must be non-negative', [
        { field: 'limit', value: limit, message: 'Limit cannot be negative' },
      ])
    }

    if (validatedOffset < 0) {
      throw new ValidationError('Offset must be non-negative', [
        {
          field: 'offset',
          value: offset,
          message: 'Offset cannot be negative',
        },
      ])
    }

    // Cap limit at MAX_LIMIT to prevent DoS
    const cappedLimit = validatedLimit > MAX_LIMIT ? MAX_LIMIT : validatedLimit

    return {
      limit: cappedLimit,
      offset: validatedOffset,
    }
  }

  /**
   * Find all records with optional filters
   */
  async findAll(options?: DrizzleQueryOptions<TSelect>): Promise<TSelect[]> {
    try {
      const database = this.getDb()
      let query = database.select().from(this.table as any)

      // Validate and apply pagination
      const { limit, offset } = this.validatePagination(
        options?.limit,
        options?.offset
      )

      query = query.limit(limit) as any

      if (offset > 0) {
        query = query.offset(offset) as any
      }

      return (await query) as unknown as TSelect[]
    } catch (error) {
      console.error(`[${this.constructor.name}] findAll error:`, error)
      // Re-throw ValidationError without wrapping
      if (error instanceof ValidationError) {
        throw error
      }
      throw new DatabaseError('Failed to fetch records')
    }
  }

  /**
   * Find single record by ID
   */
  async findById(id: string): Promise<TSelect | null> {
    try {
      const database = this.getDb()
      const results = await database
        .select()
        .from(this.table as any)
        .where(eq(this.idColumn, id))
        .limit(1)

      return (results[0] as TSelect) || null
    } catch (error) {
      console.error(`[${this.constructor.name}] findById error:`, error)
      throw new DatabaseError(`Failed to fetch record ${id}`)
    }
  }

  /**
   * Find single record by ID or throw NotFoundError
   */
  async findByIdOrFail(id: string): Promise<TSelect> {
    const result = await this.findById(id)
    if (!result) {
      throw new NotFoundError(this.constructor.name.replace('Repository', ''), id)
    }
    return result
  }

  /**
   * Create new record
   */
  async create(data: TInsert): Promise<TSelect> {
    try {
      const database = this.getDb()
      const results = await database
        .insert(this.table as any)
        .values(data as any)
        .returning()

      return results[0] as TSelect
    } catch (error) {
      console.error(`[${this.constructor.name}] create error:`, error)
      throw new DatabaseError('Failed to create record')
    }
  }

  /**
   * Update record by ID
   */
  async update(id: string, data: Partial<TInsert>): Promise<TSelect | null> {
    try {
      const database = this.getDb()
      const results = await database
        .update(this.table)
        .set({
          ...data,
          updatedAt: new Date(),
        } as Record<string, unknown>)
        .where(eq(this.idColumn, id))
        .returning()

      return (results[0] as TSelect) || null
    } catch (error) {
      console.error(`[${this.constructor.name}] update error:`, error)
      throw new DatabaseError(`Failed to update record ${id}`)
    }
  }

  /**
   * Delete record by ID
   */
  async delete(id: string): Promise<void> {
    try {
      const database = this.getDb()
      await database
        .delete(this.table)
        .where(eq(this.idColumn, id))
    } catch (error) {
      console.error(`[${this.constructor.name}] delete error:`, error)
      throw new DatabaseError(`Failed to delete record ${id}`)
    }
  }

  /**
   * Count all records
   */
  async count(): Promise<number> {
    try {
      const database = this.getDb()
      const results = await database
        .select({ count: sql<number>`count(*)` })
        .from(this.table as any)

      return Number(results[0]?.count || 0)
    } catch (error) {
      console.error(`[${this.constructor.name}] count error:`, error)
      throw new DatabaseError('Failed to count records')
    }
  }

  /**
   * Check if record exists by ID
   */
  async exists(id: string): Promise<boolean> {
    const record = await this.findById(id)
    return record !== null
  }
}

// Re-export drizzle operators for convenience
export { eq, and, or, gte, lte, like, desc, asc, sql }
