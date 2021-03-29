module.exports = (sequelize, DataTypes) => {
  // Mysql에는 users 테이블 생성
  const User = sequelize.define(
    'User',
    {
      // id가 기본적으로 들어있다.
      email: {
        type: DataTypes.STRING(30), // STRING, TEXT, BOOLEAN, INTEGER, FLOAT, DATETIME
        allowNull: false, // 필수
        unique: true
      },
      nickname: {
        type: DataTypes.STRING(30),
        allowNull: false // 필수
      },
      password: {
        type: DataTypes.STRING(100),
        allowNull: false // 필수
      }
    },
    {
      charset: 'utf8',
      collate: 'utf8_general_ci' // 한글저장
    }
  );
  User.associate = (db) => {
    db.User.hasMany(db.Post);
    db.User.hasMany(db.Comment);
    db.User.belongsToMany(db.Post, { through: 'Like', as: 'Liked' }); // through: 중간 테이블이름 설정, as: 위에 Post와 구별 (대문자로 시작)
    db.User.belongsToMany(db.User, { through: 'Follow', as: 'Follwers', foreignKey: 'FollwingId' }); // foreignKey : Key 컬럼명 설정
    db.User.belongsToMany(db.User, { through: 'Follow', as: 'Follwings', foreignKey: 'FollowerId' });
  };
  return User;
};
