module.exports = (sequelize, DataTypes) => {
  const userAct = sequelize.define('userAct', {
    actid: DataTypes.INTEGER,
    userid: DataTypes.INTEGER,
  }, {});

  userAct.associate = function associate() {
    // associations can be defined here. This method receives a models parameter.
  };

  return userAct;
};
