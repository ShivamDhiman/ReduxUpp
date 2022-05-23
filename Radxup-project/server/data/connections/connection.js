const { Sequelize } = require('sequelize');
const sequelize = new Sequelize(process.env.DB_NAME, process.env.LOGIN_ID, process.env.DB_PASSWORD, {
  logging: false,
  host: process.env.DB_HOST,
  dialect: 'postgres',
  ssl: true,
  port: process.env.DB_PORT,
  dialectOptions: {
    ssl: {
      require: true
    },
    requestTimeout: (300000 * 5), // timeout = 60 second / 1 min
    options: {
      encrypt: true,
      enableArithAbort: true,
      pool: {
        max: 10,
        min: 0,
        acquire: 20000,
        idle: 20000,
        evict: 20000
      }
    }
  },
  define: {
    freezeTableName: true
  }
});

sequelize.sync()
.then(()=>{
  console.log("Database Successfully Connected...");
  require('../../controllers/appInfo').startMigration(sequelize);
})
.catch((err)=>{
  console.log(err);
});

module.exports.sequelize = sequelize;
