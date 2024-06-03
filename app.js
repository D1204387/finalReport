var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('db/sqlite.db', (err) => {
  if (err) {
    return console.error(err.message);
  }
  console.log('Connected to the SQlite database.');
});

// Get distinct stock names from the database
app.get('/api/stocknames', (req, res) => {
  const sql = 'SELECT DISTINCT stock_name FROM stock_prices';
  db.all(sql, [], (err, rows) => {
    if (err) {
      throw err;
    }
    const stockNames = rows.map(row => row.stock_name);
    res.json(stockNames);
  });
});

// Route to handle searching for stock prices
app.post('/api/search', (req, res) => {
  const { start_month, end_month, stock_names } = req.body;

  const sql = `SELECT strftime('%Y-%m', date) as date, stock_name, AVG(avg_close_price) as avg_close_price 
               FROM stock_prices 
               WHERE date >= ? AND date <= ? AND stock_name IN (${stock_names.map(() => '?').join(',')}) 
               GROUP BY strftime('%Y-%m', date), stock_name
               ORDER BY date, stock_name`;
  db.all(sql, [start_month, end_month, ...stock_names], (err, rows) => {
    if (err) {
      throw err;
    }
    res.json(rows);
  });
});

module.exports = app;

