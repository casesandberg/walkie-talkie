import { WalkieTalkie, WebWalkieTalkie, NativeWalkieTalkie } from '../'
import {randomId, bridgeReady, toJson, DeferredPromise} from '../utils'
jest.mock('../utils')

bridgeReady.mockImplementation(() => Promise.resolve());
toJson.mockImplementation((data) => {
    try {
        return JSON.parse(data)
    } catch (err) {
        return data
    }
})
DeferredPromise.mockImplementation(() => ({ promise: Promise.resolve() }))
const ID = '2c24ga'
randomId.mockImplementation(() => ID);

jest.useFakeTimers();

describe('base', () => {
    let walkieTalkie

    beforeEach(() => {
        walkieTalkie = new WalkieTalkie()
    })

    test('isnt ready on start', () => {
        expect(walkieTalkie.ready).toBe(false)
    })

    test('handles inflight calls', () => {
        const id = '123'
        const resolve = jest.fn()
        walkieTalkie.inflightCalls = {
            [id]: {
                deferredPromise: {
                    resolve,
                },
                timeout: jest.fn(),
            }
        }
        walkieTalkie.handleReceived({
            id,
            type: 'NOTIFICATION',
        })
        expect(clearTimeout).toHaveBeenCalled()
        expect(resolve).toHaveBeenCalled()
        expect(walkieTalkie.inflightCalls[id]).toBe(undefined)
    })

    test('handles failed inflight calls', () => {
        const id = '123'
        const reject = jest.fn()
        walkieTalkie.inflightCalls = {
            [id]: {
                deferredPromise: {
                    reject,
                },
                timeout: jest.fn(),
            }
        }
        walkieTalkie.handleReceived({
            id,
            type: 'NOTIFICATION',
            failed: true,
        })
        expect(reject).toHaveBeenCalled()
        expect(walkieTalkie.inflightCalls[id]).toBe(undefined)
    })

    test('handles sending calls back', async () => {
        walkieTalkie.send = jest.fn()
        const id = '123'
        await walkieTalkie.handleReceived({
            id,
            type: 'NOTIFICATION',
        })
        expect(walkieTalkie.send).toHaveBeenCalledWith({
            id,
            type: 'NOTIFICATION',
            recieved: true,
        }, true)
    })

    test('handles transforming calls before sending back', async () => {
        walkieTalkie.send = jest.fn()
        const id = '123'

        walkieTalkie.onMessages((message) => {
            if (message.type === 'NOTIFICATION') {
                return {
                    ...message,
                    newValue: true,
                }
            }
        })

        await walkieTalkie.handleReceived({
            id,
            type: 'NOTIFICATION',
        })

        expect(walkieTalkie.send).toHaveBeenCalledWith({
            id,
            type: 'NOTIFICATION',
            newValue: true,
            recieved: true,
        }, true)
    })

    test('handles transforming calls that return promises before sending back', async () => {
        walkieTalkie.send = jest.fn()
        const id = '123'

        walkieTalkie.onMessages((message) => {
            if (message.type === 'NOTIFICATION') {
                return Promise.resolve(message)
            }
        })

        await walkieTalkie.handleReceived({
            id,
            type: 'NOTIFICATION',
        })

        expect(walkieTalkie.send).toHaveBeenCalledWith({
            id,
            type: 'NOTIFICATION',
            recieved: true,
        }, true)
    })

    test('handles transforming calls that return rejected promises before sending back', async () => {
        walkieTalkie.send = jest.fn()
        const id = '123'

        walkieTalkie.onMessages((message) => {
            if (message.type === 'NOTIFICATION') {
                return Promise.reject({
                    error: 'Too many'
                })
            }
        })

        await walkieTalkie.handleReceived({
            id,
            type: 'NOTIFICATION',
        })

        expect(walkieTalkie.send).toHaveBeenCalledWith({
            id,
            type: 'NOTIFICATION',
            failed: true,
            recieved: true,
            error: 'Too many',
        }, true)
    })

    test('Adds an id to messages', async () => {
        const { message } = walkieTalkie.handleSendFormat({
            type: 'NOTIFICATION',
        })

        expect(message).toEqual({
            type: 'NOTIFICATION',
            id: ID,
        })
    })

    test('crates an inflight call when sending a post', async () => {
        walkieTalkie.handleSendFormat({
            type: 'NOTIFICATION',
        })

        expect(walkieTalkie.inflightCalls).toEqual({
            [ID]: expect.any(Object)
        })
    })

    test('returns a promise when formatting', async () => {
        const { promise } = walkieTalkie.handleSendFormat({
            type: 'NOTIFICATION',
        })

        expect(promise).toEqual(expect.any(Promise))
    })
})

describe('web', () => {
    let walkieTalkie

    beforeEach(() => {
        walkieTalkie = new WebWalkieTalkie()
    })

    test('is ready when recieving INIT', () => {
        walkieTalkie.handleReady = jest.fn()
        walkieTalkie.handleMessage({
            data: {
                type: 'INIT',
            }
        })
        expect(walkieTalkie.ready).toBe(true)
        expect(walkieTalkie.handleReady).toHaveBeenCalled()
    })

    test('returns a promise when sending call', () => {
        const promise = walkieTalkie.send({
            type: 'NOTIFICATION',
        })

        expect(promise).toEqual(expect.any(Promise))
    })

    test('sends stringified data', () => {
        global.postMessage = jest.fn()

        walkieTalkie.send({
            type: 'NOTIFICATION',
        })

        const stringified = JSON.stringify({
            type: 'NOTIFICATION',
            id: ID,
        })

        expect(window.postMessage).toHaveBeenCalledWith(stringified, '*')
    })
})

describe('native', () => {
    let walkieTalkie

    beforeEach(() => {
        walkieTalkie = new NativeWalkieTalkie()
    })

    test('is ready when recieving INIT', async () => {
        walkieTalkie.send = jest.fn()
        walkieTalkie.handleReady = jest.fn()
        await walkieTalkie.handleMessage({
            nativeEvent: {
                data: {
                    type: 'INIT',
                }
            }
        })
        expect(walkieTalkie.ready).toBe(true)
        expect(walkieTalkie.handleReady).toHaveBeenCalled()
    })

    test('sends back event when recieving INIT', async () => {
        walkieTalkie.send = jest.fn()
        await walkieTalkie.handleMessage({
            nativeEvent: {
                data: {
                    type: 'INIT',
                }
            }
        })
        expect(walkieTalkie.send).toHaveBeenCalledWith({
            type: 'INIT'
        }, true)
    })

    test('returns a promise when sending call', () => {
        const postMessage = jest.fn()
        walkieTalkie.nodeRef = {
            postMessage,
        }
        const promise = walkieTalkie.send({
            type: 'NOTIFICATION',
        })

        expect(promise).toEqual(expect.any(Promise))
    })

    test('sends stringified data', () => {
        const postMessage = jest.fn()
        walkieTalkie.nodeRef = {
            postMessage,
        }

        walkieTalkie.send({
            type: 'NOTIFICATION',
        })

        const stringified = JSON.stringify({
            type: 'NOTIFICATION',
            id: ID,
        })

        expect(postMessage).toHaveBeenCalledWith(stringified)
    })
})
