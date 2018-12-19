import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';

import { WebWalkieTalkie } from '@agent/walkie-talkie'

const walkieTalkie = new WebWalkieTalkie({ logs: true })

// Do handshake to exchange version numbers
walkieTalkie.onReady(() => {
    walkieTalkie.send({ type: 'NATIVE/ALERT', message: 'Hello from Web' })
        .then(() => walkieTalkie.sendLog('accepted alert'))
        .catch(() => walkieTalkie.sendLog('rejected alert'))
})

// This will be inside a middleware so it can dispatch.
walkieTalkie.onMessages((message) => {
    switch (message.type) {
        case 'NOTIFICATION':

            // dispatch(actions.showNotification({ message }))

            return {
                ...message,
                testing: 123,
            }
        default:
            return message
    }

})









class App extends Component {
  render() {
    return (
      <div className="App">
        <header className="App-header" style={{ marginTop: 'env(safe-area-inset-top)', marginBottom: 'env(safe-area-inset-bottom)' }}>
          <img src={logo} className="App-logo" alt="logo" />
        </header>
      </div>
    );
  }
}

export default App;
