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

const toJson = (data) => {
    try {
        return JSON.parse(data)
    } catch (err) {
        return data
    }
}

class WebWalkieTalkie {
    constructor() {
        bridgeReady()
            .then(() => this.send('INIT'))

        // Using document instead of window to get this to work without any hickups.
        // https://stackoverflow.com/a/41727309/989006
        document.addEventListener('message', (event) => {
            const message = toJson(event.data)

            this.sendLog('recieved', message)

            if (message === 'Hello from Native') {
                this.send('Right back at-cha from Web')
            }
        })
    }

    sendLog = ( message, data) => {
        window.postMessage(JSON.stringify({
            log: true,
            message,
            data,
        }), '*')
    }

    send = (message) => {
        this.sendLog('sending', message)
        window.postMessage(message, '*')
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
