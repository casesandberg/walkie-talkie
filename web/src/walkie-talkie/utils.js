export const randomId = () => Math.random().toString(36).slice(-8);

// Using onMessage on a RN webview overrides the original postMessage.
// We check for that to change to know that the bridge is ready.
// https://github.com/facebook/react-native/blob/master/React/Views/RCTWebView.m#L324
export const bridgeReady = () => new Promise((resolve, reject) => {
    let tries = 0
    const interval = setInterval(
        () => {
            tries += 1
            if (window.postMessage.length === 1) {
                resolve()
                clearInterval(interval)
            } else if (tries > 10) {
                reject()
                clearInterval(interval)
            }
        }
    , 10)
})

export const toJson = (data) => {
    try {
        return JSON.parse(data)
    } catch (err) {
        return data
    }
}

export class DeferredPromise {
  constructor() {
    this.promise = new Promise((resolve, reject) => {
      this.reject = reject
      this.resolve = resolve
    })
  }
}
