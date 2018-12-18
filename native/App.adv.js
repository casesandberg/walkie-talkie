import React from 'react';
import { WebView } from 'react-native';

const toJson = (data) => {
    try {
        return JSON.parse(data)
    } catch (err) {
        return data
    }
}

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

class NativeWalkieTalkie {
    nodeRef = null

    inflightCalls = {}
    ready = false

    ref = (node) => this.nodeRef = node

    handleMessage = (event) => {
        const message = toJson(event.nativeEvent.data)

        if (message.log) {
            console.log('Web Message: ' + message.message, message.data)
        } else {
            console.log('Native Message: recieved', message)
        }

        if (this.ready === false && message.type === INIT) {
            this.ready = true
            this.send(message)
            return
        }

        if (message.log) {
            return
        }


        // // coming from us
        // if (message.channel === CHANNEL) {
        //
        //
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
    }

    send = (data) => {
        if (this.ready === false) {
            return console.log('Native: Not Ready')
        }

        const message = JSON.stringify(data)

        console.log('Native Message: sending', message)

        this.nodeRef.postMessage(message, '*')


        // // coming from web
        // if (data.id) {
        //     message = JSON.stringify(data)
        //     this.nodeRef.postMessage(message, '*')
        //     return
        // // we are sending
        // } else {
        //     const id = '456'
        //     const deferredPromise = new DeferredPromise()
        //
        //     message = JSON.stringify({
        //         ...data,
        //         id,
        //         channel: CHANNEL,
        //     })
        //
        //     this.inflightCalls[id] = {
        //         deferredPromise,
        //         timeout: setTimeout(() => {
        //             deferredPromise.reject('timeout')
        //         }, 10000)
        //     }
        //
        //     this.nodeRef.postMessage(message, '*')
        //
        //     return deferredPromise.promise
        // }
    }
}






const walkieTalkie = new NativeWalkieTalkie()

setTimeout(
    () => walkieTalkie.send({ type: 'NOTIFICATION', payload: 'Hello' })
        // .then(() => console.log('yep'))
        // .catch(() => console.error('error')),
    , 6000
)

export default class App extends React.Component {
    componentDidMount() {
        console.log('native mount')
    }

  render() {
    return (
      <WebView
          ref={walkieTalkie.ref}
          source={{uri: 'http://localhost:3000'}}
          onMessage={walkieTalkie.handleMessage}
          useWebKit={true}
      />
    );
  }
}
