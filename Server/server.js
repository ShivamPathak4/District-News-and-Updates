const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
// const cors = require("cors");
const app = express();
app.use(cors());

  const corsOptions = {
    origin: 'http://localhost:3000',
    credentials:true,            //access-control-allow-credentials:true
    optionSuccessStatus:200
  };
  
  app.use(cors(corsOptions));

// Connect to database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/news', require('./routes/news'));
app.use('/api/ads', require('./routes/ads'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));