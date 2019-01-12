import { randomId, bridgeReady, toJson, DeferredPromise } from './utils'

export class WalkieTalkie {
    ready = false
    inflightCalls = {}
    handleEvents = () => {}
    handleReady = () => {}

    onMessages = (cb) => this.handleEvents = cb
    onReady = (cb) => this.handleReady = cb

    handleReceived = async (message) => {
        const solicitedCall = this.inflightCalls[message.id]
        if (solicitedCall) {
            clearTimeout(solicitedCall.timeout)
            if (message.failed) {
                solicitedCall.deferredPromise.reject(message)
            } else {
                solicitedCall.deferredPromise.resolve(message)
            }
            delete this.inflightCalls[message.id]
            return
        } else {
            const partialMessage = {
                id: message.id,
                type: message.type,
                recieved: true,
            }
            try {
                const payload = await this.handleEvents(message)
                this.send({
                    ...partialMessage,
                    payload,
                }, true)
            } catch (error) {
                this.send({
                    ...partialMessage,
                    error,
                    failed: true,
                }, true)
            }
        }
    }

    handleSendFormat = (data, reply) => {
        const deferredPromise = new DeferredPromise()
        let message

        if (reply) {
            message = data
        } else {
            const id = randomId()
            message = {
                ...data,
                id,
            }

            this.inflightCalls[id] = {
                deferredPromise,
                timeout: setTimeout(() => {
                    deferredPromise.reject('timeout')
                }, 100000)
            }
        }

        return {
            message,
            promise: deferredPromise.promise,
        }
    }
}

export class WebWalkieTalkie extends WalkieTalkie {
    constructor() {
        super()
        bridgeReady()
            .then(() => this.send({ type: 'INIT' }))

        // Using document instead of window to get this to work without any hickups.
        // https://stackoverflow.com/a/41727309/989006
        document.addEventListener('message', this.handleMessage)
    }

    handleMessage = async (event) => {
        const message = toJson(event.data)

        this.sendLog('recieved', message)

        if (message.type === 'INIT') {
            this.ready = true
            this.handleReady()
            return
        }

        await this.handleReceived(message)
    }

    sendLog = ( message, data = {}) => {
        window.postMessage(JSON.stringify({
            log: true,
            message,
            data,
        }), '*')
    }

    send = (data, reply) => {
        const { message, promise } = this.handleSendFormat(data, reply)

        this.sendLog('sending', message)
        window.postMessage(JSON.stringify(message), '*')

        return promise
    }
}

export class NativeWalkieTalkie extends WalkieTalkie {
    nodeRef = null

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
            return
        }

        if (message.log) {
            return
        }

        await this.handleReceived(message)
    }

    send = (data, reply) => {
        const { message, promise } = this.handleSendFormat(data, reply)

        console.log('Native: sending', message)
        this.nodeRef.postMessage(JSON.stringify(message))

        return promise
    }
}
