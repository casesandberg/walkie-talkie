# Walkie Talkie

> Communicate Between React Native Web Views and Mobile Web Apps

```
npm i @agent/walkie-talkie
```

### Usage in Native
```js
import { NativeWalkieTalkie } from '@agent/walkie-talkie'

const walkieTalkie = new NativeWalkieTalkie({ logs: true })

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
```

### Usage in Web
```js
import { WebWalkieTalkie } from '@agent/walkie-talkie'

const walkieTalkie = new WebWalkieTalkie({ logs: true })

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
```

### Methods

* `onReady(cb)` callback fires when each bridge is ready
* `onMessages(cb)` callback fires whenever there is a message from the other bridge
* `send(action)` send an action to the other bridge
