const express = require('express')
const http = require('http')
const path = require('path')
const axios = require('axios')
const sqlite3 = require('sqlite3').verbose()
const cors = require('cors')
const socketIo = require('socket.io')

const app = express()
const port = process.env.PORT || 8080
const server = http.createServer(app)
const publicPath = path.join(__dirname, '../build')
const io = socketIo(server)

let apiKey = '088dec20a78c3def05a47bdab72ca399' //TODO hide API key
let city = 'Vaasa'
let url = `http://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`

app.use(cors())
app.use(express.static(publicPath))

let db = new sqlite3.Database('./db/data.db', error => {
  if (error) return console.error('Connect error ' + error.message)
  console.log('Connected to database!')
})

db.run(
  'CREATE TABLE IF NOT EXISTS weather (id INTEGER PRIMARY KEY AUTOINCREMENT, location, timestamp, temp, feels_like, wind_speed, humidity, conditions)'
)

io.on('connection', socket => {
  console.log('New client connected')
  setInterval(() => getApiAndEmit(socket), 10000)
  setInterval(() => getHistory(socket), 10000)
  socket.on('disconnect', () => console.log('Client disconnected'))
})

const getApiAndEmit = async socket => {
  try {
    const res = await axios.get(url)
    socket.emit('FromAPI', res.data)
  } catch (error) {
    console.error(`Error: ${error.code}`)
  }
}

const getHistory = async socket => {
  try {
    db.all('SELECT * FROM weather ORDER BY id DESC LIMIT 10', (error, rows) => {
      if (error) console.error('Fail fetching data ' + error.message)
      socket.emit('FromHistoryAPI', rows)
    })

    const res = await axios.get(url)

    try {
      db.exec(
        "INSERT INTO weather (location, timestamp, temp, feels_like, wind_speed, humidity, conditions) VALUES ('" +
          res.data.name +
          "','" +
          res.data.dt +
          "','" +
          res.data.main.temp +
          "','" +
          res.data.main.feels_like +
          "','" +
          res.data.wind.speed +
          "','" +
          res.data.main.humidity +
          "','" +
          res.data.weather[0].main +
          "')",
        error => {
          if (error) return console.error('Insert error ' + error.message)
          console.log('Inserted successfully!')
        }
      )
    } catch (error) {
      console.error('Catched ' + error.message)
    }
  } catch (error) {
    console.error(`Error: ${error.code}`)
  }
}

app.get('/', (req, res) => {
  res.send('Hallo')
})

server.listen(port, () => console.log('Listening on ' + port))
