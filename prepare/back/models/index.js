const Sequelize = require('sequelize');
const env = process.env.NODE_ENV || 'development';
const config = require('../config/config')[env];
const db = {};

// node와 mydsql 연결
const sequelize = new Sequelize(config.database, config.username, config.password, config);

// 함수를 실행해줌
db.Comment = require('./comment')(sequelize, Sequelize);
db.Hashtag = require('./hastag')(sequelize, Sequelize);
db.Image = require('./image')(sequelize, Sequelize);
db.Post = require('./post')(sequelize, Sequelize);
db.User = require('./user')(sequelize, Sequelize);

Object.keys(db).forEach((modelName) => {
  // 반복문으로 각 associate함수 실행하면서 연결
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
