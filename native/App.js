import React from 'react';
import { WebView } from 'react-native';

const toJson = (data) => {
    try {
        return JSON.parse(data)
    } catch (err) {
        return data
    }
}

class NativeWalkieTalkie {
    nodeRef = null

    ref = (node) => this.nodeRef = node

    handleMessage = (event) => {
        const message = toJson(event.nativeEvent.data)

        if (message.log) {
            console.log('Web: ' + message.message, message.data)
        } else {
            console.log('Native: recieved', message)
        }

        if (message === 'INIT') {
            this.send('Hello from Native')
            return
        }

        if (message.log) {
            return
        }
    }

    send = (message) => {
        console.log('Native: sending', message)
        this.nodeRef.postMessage(message)
    }
}

const walkieTalkie = new NativeWalkieTalkie()

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
