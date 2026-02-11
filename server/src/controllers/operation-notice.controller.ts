import { Request, Response } from 'express'
import { db } from '../db/drizzle.js'
import { operationNotices } from '../db/schema/index.js'
import { eq, and, isNotNull, ne } from 'drizzle-orm'

export const getOperationNotices = async (req: Request, res: Response) => {
  try {
    if (!db) {
      return res.status(500).json({ error: 'Database connection not available' })
    }

    const { routeCode, noticeNumber } = req.query

    if (!routeCode || typeof routeCode !== 'string') {
      return res.status(400).json({ error: 'routeCode is required' })
    }

    const conditions = [
      eq(operationNotices.routeCode, routeCode),
      isNotNull(operationNotices.fileUrl),
      ne(operationNotices.fileUrl, ''),
    ]

    if (noticeNumber && typeof noticeNumber === 'string') {
      conditions.push(eq(operationNotices.noticeNumber, noticeNumber))
    }

    const data = await db
      .select()
      .from(operationNotices)
      .where(and(...conditions))
      .orderBy(operationNotices.issueDate)

    return res.json(data)
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch operation notices' })
  }
}
