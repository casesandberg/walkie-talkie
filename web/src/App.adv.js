import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';

const toJson = (data) => {
    try {
        return JSON.parse(data)
    } catch (err) {
        return data
    }
}

// Typical tockie frequency, make customizable.
const CHANNEL = 467
const INIT = '#INIT'

class DeferredPromise {
  constructor() {
    this.promise = new Promise((resolve, reject) => {
      this.reject = reject
      this.resolve = resolve
    })
  }
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

class WebWalkieTalkie {
    inflightCalls = {}
    ready = false

    constructor() {
        bridgeReady()
            .then(() => {
                this.ready = true
                this.send({ type: INIT })
                    // .then(() => console.log('yep'))
                    // .catch(() => console.error('error'))
            })

        // Using document instead of window to get this to work without any hickups.
        // https://stackoverflow.com/a/41727309/989006
        document.addEventListener('message', (messageString) => {
            const message = toJson(messageString)
            this.sendLog('recieved', message)

            // // coming from us
            // if (message.channel === CHANNEL) {
            //     const solicitedCall = this.inflightCalls[message.id]
            //     // solicited
            //     if (solicitedCall) {
            //         clearTimeout(solicitedCall.timeout)
            //         solicitedCall.deferredPromise.resolve()
            //         delete this.inflightCalls[message.id]
            //         return
            //     } else {
            //         console.log('recieving', message)
            //         // this.send(message)
            //     }
            // }
            //
            //
            // if (message.data === 'Hello from Native') {
            //     window.postMessage('Right back at-cha from Web', '*')
            // }
        })
    }

    sendLog = ( message, data) => {
        window.postMessage(JSON.stringify({
            log: true,
            message,
            data,
        }), '*')
    }

    send = (data) => {
        if (this.ready === false) {
            return this.sendLog('Not Ready')
        }

        const message = JSON.stringify(data)
        this.sendLog('sending', message)
        window.postMessage(message, '*')

        // if (data.id) {
        //     const message = JSON.stringify(data)
        //     window.postMessage(message, '*')
        //     return
        // } else {
        //     const id = '123'
        //     const deferredPromise = new DeferredPromise()
        //
        //     const message = JSON.stringify({
        //         ...data,
        //         id,
        //         channel: CHANNEL,
        //     })
        //
        //     this.sendLog('sending', message)
        //
        //     this.inflightCalls[id] = {
        //         deferredPromise,
        //         timeout: setTimeout(() => {
        //             deferredPromise.reject('timeout')
        //         }, 10000)
        //     }
        //
        //     window.postMessage(message, '*')
        //
        //     return deferredPromise.promise
        // }
    }
}









new WebWalkieTalkie()

class App extends Component {
    componentDidMount = async () => {
        console.log('web mount')


    }

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
