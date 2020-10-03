module.exports = (sequelize, DataTypes) => {
  const ownerlocal = sequelize.define('ownerlocal', {
    ownerid: DataTypes.INTEGER,
    localid: DataTypes.INTEGER,
  }, {});

  ownerlocal.associate = function associate() {
    // associations can be defined here. This method receives a models parameter.
  };

  return ownerlocal;
};
