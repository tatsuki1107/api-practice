const express = require('express')
const app = express()
const sqlite3 = require('sqlite3')
const path = require('path');
const dbPath = "app/db/database.sqlite3"
const bodyParser = require('body-parser');

// リクエストのbodyをパースする設定
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

// publicディレクトリを静的ファイル群のルートディレクトリとして設定
app.use(express.static(path.join(__dirname, 'public')))

// Get all users
app.get('/api/v1/users', (req, res) => {
  // connect Database
  const db = new sqlite3.Database(dbPath)
  db.all('SELECT * FROM users', (err, rows) => {
    res.json(rows)
  })

  db.close();
})

// Get a user
app.get('/api/v1/users/:id', (req, res) => {
  // connect Database
  const db = new sqlite3.Database(dbPath)
  const id = req.params.id

  db.get(`SELECT * FROM users WHERE id = ${id}`, (err, row) => {
    if (!row) {
      res.status(404).send({ error: "Not Found!" })
    } else {
      res.status(200).json(row)
    }

  })

  db.close();
})

// Search users matching keyword
app.get('/api/v1/search', (req, res) => {
  // connect Database
  const db = new sqlite3.Database(dbPath)
  const keyword = req.query.q

  db.all(`SELECT * FROM users WHERE name LIKE "%${keyword}%"`, (err, row) => {
    res.json(row)
  })

  db.close();
})

const run = async (sql, db) => {
  return new Promise((resolve, reject) => {
    db.run(sql, (err) => {
      if (err) {
        return reject(err)
      } else {
        return resolve()
      }
    })
  })
}

// Create a new user
app.post('/api/v1/users', async (req, res) => {
  if (!req.body.name || req.body.name === "") {
    res.status(400).send({ error: "ユーザー名が指定されていません。" })
  } else {
    // Connect database
    const db = new sqlite3.Database(dbPath)

    const name = req.body.name
    const profile = req.body.profile ? req.body.profile : ""
    const dateOfBirth = req.body.date_of_birth ? req.body.date_of_birth : ""
    try {
      await run(`INSERT INTO users (name, profile, date_of_birth) VALUES ("${name}", "${profile}", "${dateOfBirth}")`,
        db
      )
      res.status(201).send({ message: "新規ユーザーを作成しました。" })
    } catch (e) {
      res.status(500).send({ error: e })
    }
    db.close()
  }
})

// Update user data
app.put('/api/v1/users/:id', async (req, res) => {
  if (!req.body.name || req.body.name === "") {
    res.status(400).send({ error: "ユーザー名が指定されていません。" })
  } else {
    // Connect database
    const db = new sqlite3.Database(dbPath)
    const id = req.params.id

    db.get(`SELECT * FROM users WHERE id = ${id}`, async (err, row) => {
      if (!row) {
        res.status(404).send({ error: "指定されたユーザーが見つかりません。" })
      } else {
        const name = req.body.name ? req.body.name : row.name
        const profile = req.body.profile ? req.body.profile : row.profile
        const dateOfBirth = req.body.date_of_birth ? req.body.date_of_birth : row.date_of_birth

        try {
          await run(
            `UPDATE users SET name="${name}", profile="${profile}", date_of_birth="${dateOfBirth}" WHERE id="${id}"`,
            db
          )
          res.status(200).send({ message: "ユーザー情報を更新しました。" })
        } catch (e) {
          res.status(500).send({ error: e })
        }
      }
    })


    db.close()
  }

})

// Delete user data
app.delete('/api/v1/users/:id', async (req, res) => {
  // Connect database
  const db = new sqlite3.Database(dbPath)
  const id = req.params.id

  db.all(`SELECT * FROM users WHERE id = ${id}`, async (err, row) => {
    if (!row) {
      res.status(404).send({ error: "指定されたユーザーが見つかりません。" })
    } else {
      try {
        await run(`DELETE FROM users WHERE id=${id}`, db)
        res.status(200).send({ message: "ユーザーを削除しました。" })
      } catch (e) {
        res.status(500).send({ error: e })
      }
    }
  })

  db.close()
})

// Get following users
app.get('/api/v1/users/:id/following', (req, res) => {
  // connect Database
  const db = new sqlite3.Database(dbPath)
  const id = req.params.id

  db.all(
    `SELECT * FROM following LEFT JOIN users
    ON following.followed_id = users.id WHERE following_id = ${id}`, (err, rows) => {
    res.json(rows)
  })

  db.close();
})

// Get following user
app.get('/api/v1/users/:id_1/following/:id_2', (req, res) => {
  // connect Database
  const db = new sqlite3.Database(dbPath)
  const id_1 = req.params.id_1
  const id_2 = req.params.id_2


  db.get(
    `SELECT * FROM following WHERE following_id = ${id_1} AND followed_id = ${id_2} `, (err, row) => {
      if (!row) {
        res.status(404).send({ error: "Not Found !" })
      } else {
        db.get(`SELECT * FROM users WHERE id = ${id_2}`, (err, row) => {
          res.status(200).json(row)
        })

      }

    })

  db.close();
})

// Following a user
app.post('/api/v1/users/:id_1/following/:id_2', async (req, res) => {
  const db = new sqlite3.Database(dbPath)
  const id_1 = req.params.id_1
  const id_2 = req.params.id_2

  try {
    await run(`INSERT INTO following (following_id, followed_id) VALUES ("${id_1}", "${id_2}")`, db)
    res.status(201).send({ message: 'ユーザーをフォローしました!' })
  } catch (e) {
    res.status(500).send({ error: e })
  }
  db.close()
})

// Delete following user
app.delete('/api/v1/users/:id_1/following/:id_2', async (req, res) => {
  const db = new sqlite3.Database(dbPath)
  const id_1 = req.params.id_1
  const id_2 = req.params.id_2

  try {
    await run(`DELETE FROM following WHERE following_id = ${id_1} AND followed_id = ${id_2}`, db)
    res.status(201).send({ message: 'フォローを外しました。' })
  } catch (e) {
    res.status(500).send({ error: e })
  }
  db.close()
})

// Get followes users
app.get('/api/v1/users/:id/followers', (req, res) => {
  // connect Database
  const db = new sqlite3.Database(dbPath)
  const id = req.params.id

  db.all(
    `SELECT * FROM following LEFT JOIN users
    ON following.following_id = users.id WHERE followed_id = ${id}`, (err, rows) => {
    res.json(rows)
  })

  db.close();
})

// Get follower user
app.get('/api/v1/users/:id_1/followers/:id_2', (req, res) => {
  // connect Database
  const db = new sqlite3.Database(dbPath)
  const id_1 = req.params.id_1
  const id_2 = req.params.id_2


  db.get(
    `SELECT * FROM following WHERE following_id = ${id_2} AND followed_id = ${id_1} `, (err, row) => {
      if (!row) {
        res.status(404).send({ error: "Not Found !" })
      } else {
        db.get(`SELECT * FROM users WHERE id = ${id_2}`, (err, row) => {
          res.status(200).json(row)
        })
      }
    })

  db.close();
})



const port = process.env.PORT || 3000;
app.listen(port);
console.log('Listen on port: ' + port);
