const express = require('express');
const app = express();
const port = 4000; // Changed port from 3000 to 4000

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});