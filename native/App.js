import React from 'react';
import { WebView, Alert } from 'react-native';

import { NativeWalkieTalkie } from '@agent/walkie-talkie'

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
