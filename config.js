require('dotenv').config()

const { Pool } = require('pg')
const isProduction = process.env.NODE_ENV === 'production'

const connectionString =
  'postgres://akqravji:nv8rW5fjzk_4LcvDL3QnXoqAsm75ZzO7@balarama.db.elephantsql.com:5432/akqravji'

const pool = new Pool({
  connectionString: isProduction ? process.env.DB_URL : connectionString,
  ssl: isProduction
})

module.exports = { pool }
