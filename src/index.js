import express from 'express';
import sqlite3 from 'sqlite3';

const app = express();
const port = process.env.PORT || 3000;
const db = new sqlite3.Database(':memory:');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

db.serialize(() => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY,
      title TEXT,
      description TEXT,
      done BOOLEAN,
      createdAt DATETIME
    )
  `, (err) => {
    if (err) {
      console.error('Error creating table:', err.message);
    } else {
      console.log('Table "tasks" created successfully.');
    }
  });
});

app.post('/tasks', (req, res) => {
  const { title, description } = req.body;

  if (!title) {
    res.status(400).json({ error: 'Title is required' });
    return;
  }

  db.run('INSERT INTO tasks (title, description, done, createdAt) VALUES (?, ?, ?, ?)',
    [title, description, false, new Date().toISOString()],
    (err) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ message: 'Task created successfully' });
    }
  );
});

app.get('/tasks', (req, res) => {
  db.all('SELECT * FROM tasks', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ tasks: rows });
  });
});

app.get('/tasks/:id', (req, res) => {
  const taskId = req.params.id;

  db.get('SELECT * FROM tasks WHERE id = ?', [taskId], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }
    res.json({ task: row });
  });
});

app.put('/tasks/:id', (req, res) => {
  const taskId = req.params.id;
  const { title, description, done } = req.body;

  db.run('UPDATE tasks SET title = ?, description = ?, done = ? WHERE id = ?',
    [title, description, done, taskId],
    (err) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ message: 'Task updated successfully' });
    }
  );
});

app.delete('/tasks/:id', (req, res) => {
  const taskId = req.params.id;

  db.run('DELETE FROM tasks WHERE id = ?', [taskId], (err) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Task deleted successfully' });
  });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
