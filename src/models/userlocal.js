module.exports = (sequelize, DataTypes) => {
  const userlocal = sequelize.define('userlocal', {
    userid: DataTypes.INTEGER,
    localid: DataTypes.INTEGER,
  }, {});

  userlocal.associate = function associate() {
    // associations can be defined here. This method receives a models parameter.
  };

  return userlocal;
};
