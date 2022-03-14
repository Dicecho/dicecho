export function sleepAsync(milliseconds) {
  return new Promise(resolve => setTimeout(() => resolve, milliseconds))
}

export function timeoutPromise<T>(promise: Promise<T>, ms: number) {
  return new Promise<T>((resolve, reject) => {
    let timeout = setTimeout(() => {
      reject('Operation timed out after ' + ms + ' ms')
    }, ms)

    promise.then((res) => {
      clearTimeout(timeout)
      resolve(res)
    })

  })
}

interface OrderedPromiseAllConfig {
  asyncCount: number;
  sleepDuration: number;
}

export async function orderedPromiseAll<T, R>(
  data: Array<T>,
  fn: (data: T) => R,
  config: Partial<OrderedPromiseAllConfig> = {},
) {
  let currentIndex = 0;
  const asyncCount = config.asyncCount || 10;
  const sleepDuration = config.sleepDuration || 0;
  let result: Array<R> = []

  while (currentIndex < data.length) {
    const r = await Promise.all(
      data.slice(currentIndex, currentIndex + asyncCount).map(fn)
    )
    result = result.concat(r);
    currentIndex += asyncCount;
    // await sleepAsync(sleepDuration);
  }

  return result;
}