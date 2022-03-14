export function sleepAsync(milliseconds) {
  return new Promise(resolve => setTimeout(() => resolve, milliseconds))
}

export function timeoutPromise<T>(promise: Promise<T>, ms: number) {
  return new Promise<T>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject('Operation timed out after ' + ms + ' ms')
    }, ms)

    promise.then((res) => {
      clearTimeout(timeout)
      resolve(res)
    })

  })
}

export function getRandomInt(min: number, max: number) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min; //不含最大值，含最小值
}