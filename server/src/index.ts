import { createApp } from './app'

const port = Number(process.env.PORT ?? 3000)

createApp().listen(port, () => {
  console.log(`서버 실행 중: http://localhost:${port}`)
})
