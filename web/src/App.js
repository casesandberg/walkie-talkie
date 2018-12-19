import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';

export const randomId = () => Math.random().toString(36).slice(-8);

const dispatch = () => {}
const actions = {
    showNotification: () => {}
}

// Using onMessage on a RN webview overrides the original postMessage.
// We check for that to change to know that the bridge is ready.
// https://github.com/facebook/react-native/blob/master/React/Views/RCTWebView.m#L324
const bridgeReady = () => new Promise((resolve, reject) => {
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

const toJson = (data) => {
    try {
        return JSON.parse(data)
    } catch (err) {
        return data
    }
}

class DeferredPromise {
  constructor() {
    this.promise = new Promise((resolve, reject) => {
      this.reject = reject
      this.resolve = resolve
    })
  }
}

class WebWalkieTalkie {
    ready = false
    inflightCalls = {}
    handleEvents = (e) => e
    handleReady = () => {}

    constructor() {
        bridgeReady()
            .then(() => this.send({ type: 'INIT' }))

        // Using document instead of window to get this to work without any hickups.
        // https://stackoverflow.com/a/41727309/989006
        document.addEventListener('message', (event) => {
            const message = toJson(event.data)

            this.sendLog('recieved', message)

            if (message.type === 'INIT') {
                this.ready = true
                this.handleReady()
                return
            }

            const solicitedCall = this.inflightCalls[message.id]
            if (solicitedCall) {
                clearTimeout(solicitedCall.timeout)
                if (message.failed) {
                    solicitedCall.deferredPromise.reject()
                } else {
                    solicitedCall.deferredPromise.resolve()
                }
                delete this.inflightCalls[message.id]
                return
            }

            if (message.id) {
                this.send(this.handleEvents(message), true)
            }

            // if (message === 'Hello from Native') {
            //     this.send('Right back at-cha from Web')
            // }
        })
    }

    onMessages = (cb) => this.handleEvents = cb
    onReady = (cb) => this.handleReady = cb

    sendLog = ( message, data = {}) => {
        window.postMessage(JSON.stringify({
            log: true,
            message,
            data,
        }), '*')
    }

    send = (data, reply) => {
        if (reply) {
            const message = data
            this.sendLog('sending', message)
            window.postMessage(JSON.stringify(message), '*')
        } else {
            const id = randomId()
            const deferredPromise = new DeferredPromise()

            const message = {
                ...data,
                id,
            }


            this.inflightCalls[id] = {
                deferredPromise,
                timeout: setTimeout(() => {
                    deferredPromise.reject('timeout')
                }, 100000)
            }

            this.sendLog('sending', message)
            window.postMessage(JSON.stringify(message), '*')

            return deferredPromise.promise
        }
    }
}












const walkieTalkie = new WebWalkieTalkie({ logs: true })

// Do handshake to exchange version numbers
walkieTalkie.onReady(() => {
    walkieTalkie.send({ type: 'NATIVE/ALERT', message: 'Hello from Web' })
        .then(() => walkieTalkie.sendLog('accepted alert'))
        .catch(() => walkieTalkie.sendLog('rejected alert'))
})

// This will be inside a middleware so it can dispatch.
walkieTalkie.onMessages((message) => {
    switch (message.type) {
        case 'NOTIFICATION':

            dispatch(actions.showNotification({ message }))

            return {
                ...message,
                testing: 123,
            }
        default:
            return message
    }

})









class App extends Component {
  render() {
    return (
      <div className="App">
        <header className="App-header" style={{ marginTop: 'env(safe-area-inset-top)', marginBottom: 'env(safe-area-inset-bottom)' }}>
          <img src={logo} className="App-logo" alt="logo" />
        </header>
      </div>
    );
  }
}

export default App;
