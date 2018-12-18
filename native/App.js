import React from 'react';
import { WebView } from 'react-native';

class NativeWalkieTalkie {
    nodeRef = null

    ref = (node) => this.nodeRef = node

    handleMessage = (event) => {
        if (event.nativeEvent.data === 'INIT') {
            this.nodeRef.postMessage('Hello from Native')
        }
        console.log(event.nativeEvent.data)
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
