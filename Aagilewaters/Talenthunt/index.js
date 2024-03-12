const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const mysql = require('mysql2');
const ejs = require('ejs'); // Correct
const path = require('path');
const { use } = require('passport');

const app = express();

app.set('view engine', 'ejs'); // Set EJS as the default template engine
app.set('views', __dirname + '/views'); // Specify the directory for views
// Static Middleware
app.use(express.static(path.join(__dirname, 'public')))
app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({
  secret: 'secret',
  resave: true,
  saveUninitialized: true
}));

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'MyDBRoot@24$',
  database: 'user_authentication',
  insecureAuth : true
});

db.connect((err) => {
  if (err) {
    throw err;
  }
  console.log('MySQL Connected');
});

app.get('/', (req, res) => {
  res.render('index', { email: req.session.email });
});

app.get('/signup', (req, res) => {
  console.log('Get-Signup');
  res.render('signup');
});

app.get('/login', (req, res) => {
  res.render('login');
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

app.get('/admin', (req, res) => {
  // Query the database to select all users
  db.query('SELECT * FROM users', (err, rows) => {
    if (err) throw err;
    res.render('admin', { users: rows });
});
});

app.post('/signup', async (req, res) => {
  const { email, password} = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const usertype = await req.body.userType;
  let anum = 1;
  console.log(usertype);
  switch(usertype){
    case "jobSeeker":
      anum = 2;
    break;
    case "jobPoster":
    default: 
      anum = 1;
    break;
  }
  db.query('INSERT INTO users (email, password, usertype) VALUES (?, ?, ?)', [email, hashedPassword, anum], (err, result) => {
    if (err) {
      console.log(err);
      return res.redirect('/signup');
    }
    res.redirect('/');
  });
});

app.post('/login', (req, res) => {
  const { email, password } = req.body;

  db.query('SELECT * FROM users WHERE email = ?', [email], async (err, result) => {
    if (err) {
      console.log(err);
      return res.redirect('/login');
    }
    if (result.length === 0 || !(await bcrypt.compare(password, result[0].password))) {
      return res.redirect('/login');
    }

    req.session.loggedin = true;
    req.session.email = email;
    res.redirect('/');
  });
});

app.listen(3000, () => {
  console.log('Server started on http://localhost:3000');
});
