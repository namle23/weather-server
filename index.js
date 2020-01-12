const express = require('express')
const http = require('http')
const path = require('path')
const axios = require('axios')
const sqlite3 = require('sqlite3').verbose()

const app = express()
const port = process.env.PORT || 5000
const server = http.createServer(app)
const publicPath = path.join(__dirname, '../build')

let apiKey = '088dec20a78c3def05a47bdab72ca399' //TODO hide API key
let city = 'Vaasa'
let url = `http://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`

app.use(express.static(publicPath))
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept'
  )
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE')
  next()
})

let db = new sqlite3.Database('./db/data.db', error => {
  if (error) return console.error('Connect error ' + error.message)
  console.log('Connected to database!')
})

db.run(
  'CREATE TABLE IF NOT EXISTS weather (id INTEGER PRIMARY KEY AUTOINCREMENT, location, timestamp, temp, feels_like, wind_speed, humidity, conditions)'
)

let getWeather = async () => {
  try {
    return await axios.get(url)
  } catch (error) {
    console.error(error)
  }
}

getWeather().then(weather => {
  app.get('/current', (req, res) => {
    res.send(weather.data)
  })
})

setInterval(() => {
  let getWeather = async () => {
    try {
      return await axios.get(url)
    } catch (error) {
      console.error(error)
    }
  }

  getWeather().then(weather => {
    app.get('/current', (req, res) => {
      res.send(weather.data)
    })

    try {
      db.exec(
        "INSERT INTO weather (location, timestamp, temp, feels_like, wind_speed, humidity, conditions) VALUES ('" +
          weather.data.name +
          "','" +
          weather.data.dt +
          "','" +
          weather.data.main.temp +
          "','" +
          weather.data.main.feels_like +
          "','" +
          weather.data.wind.speed +
          "','" +
          weather.data.main.humidity +
          "','" +
          weather.data.weather[0].main +
          "')",
        error => {
          if (error) return console.error('Insert error ' + error.message)
          console.log('Inserted successfully!')
        }
      )
    } catch (error) {
      console.error('Catched ' + error.message)
    }
  })
}, 3600000)

db.all('SELECT * FROM weather ORDER BY id DESC LIMIT 10', (error, rows) => {
  if (error) console.error('Fail fetching data ' + error.message)

  app.get('/history', (req, res) => {
    res.send(rows)
  })
})

setInterval(() => {
  let getWeatherRepeat = async () => {
    try {
      return await axios.get(url)
    } catch (error) {
      console.error(error)
    }
  }

  getWeatherRepeat().then(weather => {
    app.get('/current', (req, res) => {
      res.send(weather.data)
    })

    try {
      db.exec(
        "INSERT INTO weather (location, timestamp, temp, feels_like, wind_speed, humidity, conditions) VALUES ('" +
          weather.data.name +
          "','" +
          weather.data.dt +
          "','" +
          weather.data.main.temp +
          "','" +
          weather.data.main.feels_like +
          "','" +
          weather.data.wind.speed +
          "','" +
          weather.data.main.humidity +
          "','" +
          weather.data.weather[0].main +
          "')",
        error => {
          if (error) return console.error('Insert error ' + error.message)
          console.log('Inserted successfully!')
        }
      )

      db.all(
        'SELECT * FROM weather ORDER BY id DESC LIMIT 10',
        (error, rows) => {
          if (error) console.error('Fail fetching data ' + error.message)

          app.get('/history', (req, res) => {
            res.send(rows)
          })
        }
      )
    } catch (error) {
      console.error('Catched ' + error.message)
    }
  })
}, 3600000)

server.listen(port, () => console.log('Listening on ' + port))
