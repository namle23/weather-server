const express = require('express')
const http = require('http')
const path = require('path')
const axios = require('axios')
const cors = require('cors')
const { pool } = require('./config')

const app = express()
const port = process.env.PORT || 5000
const server = http.createServer(app)
const publicPath = path.join(__dirname, '../build')

let apiKey = '088dec20a78c3def05a47bdab72ca399' //TODO hide API key
let city = 'Vaasa'
let url = `http://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`

app.use(express.static(publicPath))
app.use(cors())

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
    pool.query(
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
  })
}, 3600000)

pool.query('SELECT * FROM weather ORDER BY id DESC LIMIT 10', (error, rows) => {
  if (error) console.error('Fail fetching data ' + error.message)

  app.get('/history', (req, res) => {
    res.send(rows.rows)
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
      pool.query(
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

      pool.query(
        'SELECT * FROM weather ORDER BY id DESC LIMIT 10',
        (error, rows) => {
          if (error) console.error('Fail fetching data ' + error.message)

          app.get('/history', (req, res) => {
            res.send(rows.rows)
          })
        }
      )
    } catch (error) {
      console.error('Catched ' + error.message)
    }
  })
}, 3600000)

app.get('/', (req, res) => {
  res.send('Hallå')
})

server.listen(port, () => console.log('Listening on ' + port))
