import 'dotenv/config';

import express from 'express';
import cors from 'cors';
import morgan from 'morgan';

import apiRouter from './routes/api.js';
import { ensureInitialSetup } from './database/db.js';


// ==================================================
// EXPRESS APP
// ==================================================

const app = express();

const PORT = process.env.PORT || 5000;


// ==================================================
// CORS CONFIGURATION
// ==================================================

// Local development frontend URLs
const defaultOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://hanuman-talim-mandal.onrender.com'
];


// Production frontend URLs can be added using:
//
//CLIENT_URL='https://hanuman-talim-mandal.vercel.app'
//
// Multiple URLs:
//
// CLIENT_URL=https://app1.vercel.app,https://app2.vercel.app
//
const envOrigins = (process.env.CLIENT_URL || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);


// Combine local + production origins
const allowedOrigins = [
  ...new Set([
    ...defaultOrigins,
    ...envOrigins
  ])
];


console.log(
  'Allowed CORS origins:',
  allowedOrigins
);


// ==================================================
// CORS OPTIONS
// ==================================================

const corsOptions = {

  origin(origin, callback) {

    // ----------------------------------------------
    // Allow requests without Origin header
    //
    // Examples:
    // Postman
    // curl
    // server-to-server requests
    // ----------------------------------------------

    if (!origin) {

      return callback(
        null,
        true
      );

    }


    // ----------------------------------------------
    // Allow configured frontend
    // ----------------------------------------------

    if (
      allowedOrigins.includes(origin)
    ) {

      return callback(
        null,
        true
      );

    }


    // ----------------------------------------------
    // Block unknown origins
    // ----------------------------------------------

    console.error(
      `CORS blocked origin: ${origin}`
    );


    return callback(

      new Error(
        `CORS blocked origin: ${origin}`
      )

    );

  },


  methods: [
    'GET',
    'POST',
    'PUT',
    'PATCH',
    'DELETE',
    'OPTIONS'
  ],


  allowedHeaders: [
    'Content-Type',
    'Authorization'
  ],


  credentials: true,


  optionsSuccessStatus: 204

};


// Apply CORS middleware
app.use(
  cors(corsOptions)
);


// ==================================================
// REQUEST LOGGER
// ==================================================

app.use(
  morgan('dev')
);


// ==================================================
// BODY PARSERS
// ==================================================

app.use(
  express.json({
    limit: '2mb'
  })
);


app.use(
  express.urlencoded({
    extended: true,
    limit: '2mb'
  })
);


// ==================================================
// ROOT ROUTE
// ==================================================
//
// Useful when opening the Render backend URL directly:
//
// https://your-api.onrender.com/
//

app.get(
  '/',
  (req, res) => {

    res.status(200).json({

      success: true,

      message:
        'Shri Hanuman Talim Mandal Shirol API is running',

      api:
        '/api',

      health:
        '/api/health',

      environment:
        process.env.NODE_ENV ||
        'development',

      timestamp:
        new Date().toISOString()

    });

  }
);


// ==================================================
// HEALTH CHECK
// ==================================================

app.get(
  '/api/health',
  (req, res) => {

    res.status(200).json({

      success: true,

      status:
        'OK',

      name:
        'Ganpati Mandal API Server',

      name_mr:
        'गणपती मंडळ व्यवस्थापन API',

      database:
        'Supabase PostgreSQL',

      time:
        new Date().toISOString()

    });

  }
);


// ==================================================
// API ROUTES
// ==================================================
//
// Existing routes become:
//
// /api/auth/...
// /api/income/...
// /api/expenses/...
// /api/donors/...
// etc.
//

app.use(
  '/api',
  apiRouter
);


// ==================================================
// 404 HANDLER
// ==================================================
//
// IMPORTANT:
// Keep this AFTER all valid routes.
//

app.use(
  (req, res) => {

    res
      .status(404)
      .json({

        success: false,

        message:
          `Route not found: ${req.method} ${req.originalUrl}`

      });

  }
);


// ==================================================
// GLOBAL ERROR HANDLER
// ==================================================
//
// IMPORTANT:
// Express error middleware must contain
// all four parameters:
//
// err, req, res, next
//

app.use(
  (err, req, res, next) => {

    console.error(
      'Unhandled Error:',
      err
    );


    // ----------------------------------------------
    // CORS errors
    // ----------------------------------------------

    if (
      err.message &&
      err.message.startsWith(
        'CORS blocked origin'
      )
    ) {

      return res
        .status(403)
        .json({

          success: false,

          message:
            err.message

        });

    }


    // ----------------------------------------------
    // Multer upload errors
    // ----------------------------------------------

    if (
      err.name === 'MulterError'
    ) {

      return res
        .status(400)
        .json({

          success: false,

          message:
            err.message

        });

    }


    // ----------------------------------------------
    // Other errors
    // ----------------------------------------------

    return res
      .status(
        err.status || 500
      )
      .json({

        success: false,

        message:
          err.message ||
          'अंतर्गत सर्व्हर त्रुटी निर्माण झाली. (Internal Server Error)'

      });

  }
);


// ==================================================
// START SERVER
// ==================================================

async function startServer() {

  try {

    console.log(
      '=========================================='
    );

    console.log(
      'Initializing Shri Hanuman Talim Mandal Shirol Backend...'
    );

    console.log(
      '=========================================='
    );


    // ----------------------------------------------
    // Initialize Supabase
    //
    // This performs:
    //
    // 1. Supabase connection test
    // 2. Storage bucket initialization
    // 3. Mandal settings initialization
    // 4. Initial administrator creation
    // ----------------------------------------------

    await ensureInitialSetup();


    // ----------------------------------------------
    // Start Express
    // ----------------------------------------------

    app.listen(
      PORT,
      '0.0.0.0',
      () => {

        console.log(
          '=========================================='
        );

        console.log(
          'Shri Hanuman Talim Mandal Shirol Backend Started Successfully'
        );

        console.log(
          '=========================================='
        );

        console.log(
          `Port: ${PORT}`
        );


        // Local URLs are useful during development
        if (
          process.env.NODE_ENV !==
          'production'
        ) {

          console.log(
            `Server: http://localhost:${PORT}`
          );

          console.log(
            `Health: http://localhost:${PORT}/api/health`
          );

        }


        console.log(
          `Environment: ${
            process.env.NODE_ENV ||
            'development'
          }`
        );

        console.log(
          '=========================================='
        );

      }
    );

  } catch (error) {

    console.error(
      '=========================================='
    );

    console.error(
      'Failed to start Shri Hanuman Talim Mandal Shirol Backend'
    );

    console.error(
      '=========================================='
    );

    console.error(
      error
    );

    process.exit(1);

  }

}


// ==================================================
// UNHANDLED PROMISE REJECTION
// ==================================================

process.on(
  'unhandledRejection',
  (reason) => {

    console.error(
      'Unhandled Promise Rejection:',
      reason
    );

  }
);


// ==================================================
// UNCAUGHT EXCEPTION
// ==================================================

process.on(
  'uncaughtException',
  (error) => {

    console.error(
      'Uncaught Exception:',
      error
    );

  }
);


// ==================================================
// START APPLICATION
// ==================================================

startServer();