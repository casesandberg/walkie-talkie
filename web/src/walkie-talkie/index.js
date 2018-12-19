import { randomId, bridgeReady, toJson, DeferredPromise } from './utils'

export class WebWalkieTalkie {
    ready = false
    inflightCalls = {}
    handleEvents = (e) => e
    handleReady = () => {}

    constructor() {
        bridgeReady()
            .then(() => this.send({ type: 'INIT' }))

        // Using document instead of window to get this to work without any hickups.
        // https://stackoverflow.com/a/41727309/989006
        document.addEventListener('message', this.recieve)
    }

    recieve = async (event) => {
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
        } else {
            try {
                const newMessage = await this.handleEvents(message)
                this.send({
                    ...newMessage,
                    recieved: true,
                }, true)
            } catch (error) {
                this.send({
                    ...message,
                    ...error,
                    failed: true,
                    recieved: true,
                }, true)
            }
        }

        // if (message === 'Hello from Native') {
        //     this.send('Right back at-cha from Web')
        // }
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
