import { type RequestHandler, Router } from 'express'
import { z } from 'zod'
import { AppError } from '../errors'
import { type createStatsService, isValidTimeZone } from '../services/statsService'

interface StatsRouterDeps {
  statsService: ReturnType<typeof createStatsService>
  requireAuth: RequestHandler
}

// GET /api/stats?tz=Asia/Seoul (날짜를 나눌 시간대. 없으면 UTC)
const statsQuerySchema = z.object({
  tz: z
    .string()
    .max(64)
    .refine(isValidTimeZone, '시간대(tz)가 올바르지 않아요. 예: Asia/Seoul')
    .default('UTC'),
})

export function createStatsRouter({ statsService, requireAuth }: StatsRouterDeps) {
  const router = Router()

  router.get('/', requireAuth, async (req, res) => {
    const query = statsQuerySchema.safeParse(req.query)
    if (!query.success) {
      throw new AppError(400, 'VALIDATION_ERROR', query.error.issues[0]!.message)
    }
    res.json(await statsService.get(req.userId!, query.data.tz))
  })

  return router
}
