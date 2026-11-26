import { onBeforeUnmount } from 'vue'
import { cancelIdle, requestIdle } from '@formivue-design/shared'

export const useIdleAnimationFrame = (callback: () => void) => {
  let idleRequest: number | undefined
  let animationFrame: number | undefined

  const cancel = () => {
    if (idleRequest !== undefined) {
      cancelIdle(idleRequest)
      idleRequest = undefined
    }
    if (animationFrame !== undefined) {
      cancelAnimationFrame(animationFrame)
      animationFrame = undefined
    }
  }

  const schedule = () => {
    cancel()
    idleRequest = requestIdle(() => {
      idleRequest = undefined
      animationFrame = requestAnimationFrame(() => {
        animationFrame = undefined
        callback()
      })
    })
  }

  onBeforeUnmount(cancel)
  return { schedule, cancel }
}
