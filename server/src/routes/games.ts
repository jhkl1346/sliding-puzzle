import type { Size } from '@sliding-puzzle/shared'
import { type RequestHandler, Router } from 'express'
import { AppError } from '../errors'
import { validateBody } from '../middleware/validate'
import { finishGameSchema, listGamesQuerySchema, startGameSchema } from '../schemas/games'
import type { createGameService } from '../services/gameService'

interface GamesRouterDeps {
  gameService: ReturnType<typeof createGameService>
  requireAuth: RequestHandler
}

export function createGamesRouter({ gameService, requireAuth }: GamesRouterDeps) {
  const router = Router()

  // 게임 API는 모두 로그인이 필요하다.
  router.use(requireAuth)

  router.post('/', validateBody(startGameSchema), async (req, res) => {
    const game = await gameService.start(req.userId!, req.body.size)
    res.status(201).json(game)
  })

  router.post<{ id: string }>('/:id/finish', validateBody(finishGameSchema), async (req, res) => {
    const result = await gameService.finish(req.userId!, req.params.id, req.body)
    res.json(result)
  })

  router.post('/:id/abandon', async (req, res) => {
    await gameService.abandon(req.userId!, req.params.id)
    res.status(204).end()
  })

  router.get('/', async (req, res) => {
    const query = listGamesQuerySchema.safeParse(req.query)
    if (!query.success) {
      throw new AppError(400, 'VALIDATION_ERROR', query.error.issues[0]!.message)
    }
    const { size, page } = query.data
    res.json(await gameService.list(req.userId!, { size: size as Size | undefined, page }))
  })

  router.delete('/:id', async (req, res) => {
    await gameService.remove(req.userId!, req.params.id)
    res.status(204).end()
  })

  return router
}
