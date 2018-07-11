'use strict';

const electron = require('electron')
const { remote, ipcRenderer } = electron
const app = remote.app
const session = remote.session
const Notification = remote.Notification

var extend = require('util')._extend;
const http = require('http')
const querystring = require('querystring')

var auth_token = null
var user_hash = null

const headerOptions = {
  hostname: 'localhost',
  port: 5555,
  headers: {

  }
}

$(document).ready(() => {

  $('#minimize-button').click(minimizeWindow)
  $('#exit-button').click(exitWindow)

  function minimizeWindow() {
    remote.getCurrentWindow().minimize();
  }

  function exitWindow() {
    app.quit();
  }

})

//Save a cookie via electron's session object
//Name: Name of cookie
//Value: Value of cookie
//URL='http://localhost': Assigning url of cookie automatically
function saveCookie(name, value) {
  var date = new Date()
  date.setHours(date.getHours() + 24)
  session.defaultSession.cookies.set({
    url: 'http://localhost',
    name: name,
    value: value,
    session: true,
    expirationDate: date.getTime()
  }, (error) => {
    if(error) {
      console.log('Error saving cookie data!')
      console.log(error)
    }
  })
}

//Request from Cryogen API
//Options: path, method, headers
//path=/endpoint...
//method=GET/POST
//headers: Headers used for authentication via token
//Data: Query parameters to send to endpoint
//Callback: Function gets called when request finished with either data or error
function request(options, data, callback) {
  options.path = options.path+'?'+querystring.stringify(data)
  var extended = extend(headerOptions, options)
  var req = http.request(extended, (res) => {
    res.setEncoding('utf8')
    let dataChunk = ''
    res.on('data', (chunk) => {
      dataChunk += chunk
    })
    res.on('end', () => {
      var data = JSON.parse(dataChunk)
      callback(data)
    })
  })
  req.on('error', (e) => {
    console.log(`Error requesting: ${e.message}`)
  })
  req.write(querystring.stringify(data))
  req.end()
}

//Request new auth token from Cryogen API
//Does not use expiry parameter. Defaults to 3 hour duration
//Revoke=true. Revokes any other tokens assigned to our account
function requestAuthToken(username, password, callback) {
  request({
    path: '/login',
    method: 'POST'
  }, {
    username: username,
    password: password,
    revoke: true
  }, (response) => {
    callback(response.error, response.token)
  })
}
