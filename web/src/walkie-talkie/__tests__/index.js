import {WebWalkieTalkie} from '../'
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

describe('web', () => {
    let walkieTalkie

    beforeEach(() => {
        walkieTalkie = new WebWalkieTalkie({ logs: true })
    })

    test('isnt ready on start', () => {
        expect(walkieTalkie.ready).toBe(false)
    })

    test('is ready when recieving INIT', () => {
        walkieTalkie.handleReady = jest.fn()
        walkieTalkie.recieve({
            data: {
                type: 'INIT',
            }
        })
        expect(walkieTalkie.ready).toBe(true)
        expect(walkieTalkie.handleReady).toHaveBeenCalled()
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
        walkieTalkie.recieve({
            data: {
                id,
                type: 'NOTIFICATION',
            }
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
        walkieTalkie.recieve({
            data: {
                id,
                type: 'NOTIFICATION',
                failed: true,
            }
        })
        expect(reject).toHaveBeenCalled()
        expect(walkieTalkie.inflightCalls[id]).toBe(undefined)
    })

    test('handles sending calls back', async () => {
        walkieTalkie.send = jest.fn()
        const id = '123'
        await walkieTalkie.recieve({
            data: {
                id,
                type: 'NOTIFICATION',
            }
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

        await walkieTalkie.recieve({
            data: {
                id,
                type: 'NOTIFICATION',
            }
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

        await walkieTalkie.recieve({
            data: {
                id,
                type: 'NOTIFICATION',
            }
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

        await walkieTalkie.recieve({
            data: {
                id,
                type: 'NOTIFICATION',
            }
        })

        expect(walkieTalkie.send).toHaveBeenCalledWith({
            id,
            type: 'NOTIFICATION',
            failed: true,
            recieved: true,
            error: 'Too many',
        }, true)
    })

    test('sends a reply back as stringified json', async () => {
        const id = '123'
        global.postMessage = jest.fn()

        walkieTalkie.send({
            id,
            type: 'NOTIFICATION',
            recieved: true,
        }, true)

        expect(window.postMessage).toHaveBeenCalledWith(JSON.stringify({
            id,
            type: 'NOTIFICATION',
            recieved: true,
        }), '*')
    })

    test('Adds an id to messages', async () => {
        global.postMessage = jest.fn()

        walkieTalkie.send({
            type: 'NOTIFICATION',
        })

        expect(global.postMessage).toHaveBeenCalledWith(JSON.stringify({
            type: 'NOTIFICATION',
            id: ID,
        }), '*')
    })

    test('crates an inflight call when sending a post', async () => {

        walkieTalkie.send({
            type: 'NOTIFICATION',
        })

        expect(walkieTalkie.inflightCalls).toEqual({
            [ID]: expect.any(Object)
        })
    })

    test('returns a promise when sending a post', async () => {
        const call = walkieTalkie.send({
            type: 'NOTIFICATION',
        })

        expect(call).toEqual(expect.any(Promise))
    })
})
