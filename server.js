const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config({ path: './conf.env' });
//we put it here to handle all code , before the app code
process.on('uncaughtException', (err) => {
  console.log(err.name, err.message);
  process.exit(1);
});

const app = require('./app');

const db = process.env.DATABASE_LOCAL;
mongoose.set('strictQuery', true);
mongoose
  .connect(db, {
    //useCreateIndex: true,
    //useFindAndModify: false,
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('connection is done to db');
  })
  .catch((err) => {
    console.log(err);
  });

const port = process.env.PORT || 5000;
const server = app.listen(port, () => {
  console.log(`hi from the server at port${port}`);
});

process.on('unhandledRejection', (err) => {
  console.log(err.name, err.message);
  server.close(() => {
    console.log('exception error ....****** shutting down');
    process.exit(1);
  });
});
