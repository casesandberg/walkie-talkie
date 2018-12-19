import React from 'react';
import { WebView, Alert } from 'react-native';

export const randomId = () => Math.random().toString(36).slice(-8);

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

class NativeWalkieTalkie {
    nodeRef = null
    inflightCalls = {}
    ready = false
    handleEvents = (e) => e
    handleReady = () => {}

    ref = (node) => this.nodeRef = node

    handleMessage = async (event) => {
        const message = toJson(event.nativeEvent.data)

        if (message.log) {
            console.log('Web: ' + message.message, message.data)
        } else {
            console.log('Native: recieved', message)
        }

        if (message.type === 'INIT') {
            this.send(message, true)
            this.ready = true
            this.handleReady()

            // this.send({ type: 'NOTIFICATION', payload: 'Hello' })
            //     .then((data) => console.log('yep', data.testing))
            //     .catch(() => console.log('nope'))
            return
        }

        if (message.log) {
            return
        }

        const solicitedCall = this.inflightCalls[message.id]
        // solicited
        if (solicitedCall) {
            clearTimeout(solicitedCall.timeout)
            solicitedCall.deferredPromise.resolve(message)
            delete this.inflightCalls[message.id]
            return
        } else {
            try {
                const newMessage = await this.handleEvents(message)
                this.send(newMessage, true)
            } catch {
                this.send({
                    ...message,
                    failed: true,
                }, true)
            }
        }


    }

    onMessages = (cb) => this.handleEvents = cb
    onReady = (cb) => this.handleReady = cb

    send = (data, reply) => {
        if (reply) {
            const message = data
            console.log('Native: sending', message)
            this.nodeRef.postMessage(JSON.stringify(message))
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

            console.log('Native: sending', message)
            this.nodeRef.postMessage(JSON.stringify(message))

            return deferredPromise.promise
        }
    }
}








const walkieTalkie = new NativeWalkieTalkie({ logs: true })

walkieTalkie.onReady(() => {
    // walkieTalkie.send({ type: 'NOTIFICATION', payload: 'Hello' })
    //     .then((data) => console.log('yep', data.testing))
    //     .catch(() => console.log('nope'))
})

walkieTalkie.onMessages(async (message) => {
    switch (message.type) {
        case 'NATIVE/ALERT': {
            return await new Promise((resolve, reject) => {
                Alert.alert(
                    message.message,
                    '',
                    [
                        {text: 'Yes', onPress: () => resolve(message)},
                        {text: 'No', onPress: reject},
                    ]
                )
            })
        }
        default:
            return message
    }

})

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
