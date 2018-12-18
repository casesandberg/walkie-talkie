import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';

// Using onMessage on a RN webview overrides the original postMessage.
// We check for that to change to know that the bridge is ready.
// https://github.com/facebook/react-native/blob/master/React/Views/RCTWebView.m#L324
const bridgeReady = () => new Promise((resolve, reject) => {
    let tries = 0
    const interval = setInterval(
        () => {
            tries += 1
            if (window.postMessage.length === 1) {
                resolve()
                clearInterval(interval)
            } else if (tries > 10) {
                reject()
                clearInterval(interval)
            }
        }
    , 10)
})

class WebWalkieTalkie {
    constructor() {
        bridgeReady()
            .then(() => window.postMessage('INIT', '*'))

        // Using document instead of window to get this to work without any hickups.
        // https://stackoverflow.com/a/41727309/989006
        document.addEventListener('message', (message) => {
            console.log(message.data)

            if (message.data === 'Hello from Native') {
                window.postMessage('Right back at-cha from Web', '*')
            }
        })
    }
}



new WebWalkieTalkie()






class App extends Component {
    componentDidMount = async () => {
        console.log('web mount')


    }

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
