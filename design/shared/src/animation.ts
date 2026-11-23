export const createUniformSpeedAnimation = (
  speed = 10,
  callback: (delta: number) => void,
) => {
  let request = null
  let startTime = null
  const start = () => {
    if (request) return
    request = requestAnimationFrame((timestamp) => {
      if (startTime === null) {
        startTime = timestamp
      }
      const deltaTime = timestamp - startTime
      const delta = (deltaTime / 1000) * speed
      callback(delta)
      request = null
      start()
    })
  }

  start()

  return () => {
    if (request) {
      cancelAnimationFrame(request)
      request = null
    }
    startTime = null
  }
}

// The closer to the threshold, the slower; the farther from it, the faster
export const calcSpeedFactor = (delta = 0, threshold = Infinity) => {
  if (threshold >= delta) {
    return (threshold - delta) / threshold
  }
  return 0
}
