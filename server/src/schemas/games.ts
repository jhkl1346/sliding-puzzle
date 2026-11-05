import { isSize, MAX_MOVE_LOG_LENGTH, MAX_TIME_MS, SIZES } from '@sliding-puzzle/shared'
import { z } from 'zod'

const sizeSchema = z
  .number({ error: '판 크기를 숫자로 보내 주세요.' })
  .refine(isSize, `판 크기는 ${SIZES.join(', ')} 중 하나여야 해요.`)

export const startGameSchema = z.object({ size: sizeSchema })

// 클라이언트가 이동 횟수(moves)를 보내도 받지 않는다. 이동 횟수는 서버가 moveLog를 재생해서 센다.
export const finishGameSchema = z.object({
  moveLog: z
    .array(z.number().int().positive(), { error: '이동 기록(moveLog)을 배열로 보내 주세요.' })
    .max(MAX_MOVE_LOG_LENGTH, '이동 기록이 너무 길어요.'),
  timeMs: z
    .number({ error: '걸린 시간(timeMs)을 숫자로 보내 주세요.' })
    .int()
    .min(0)
    .max(MAX_TIME_MS, '걸린 시간이 너무 길어요.'),
})

export type FinishGameInput = z.infer<typeof finishGameSchema>

// GET /api/games?size=4&page=1 (쿼리 문자열은 모두 문자열로 오므로 숫자로 바꾼다)
export const listGamesQuerySchema = z.object({
  size: z.coerce.number().pipe(sizeSchema).optional(),
  page: z.coerce.number().int().min(1, '페이지는 1 이상이어야 해요.').default(1),
})
