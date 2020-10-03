module.exports = (sequelize, DataTypes) => {
  const requests = sequelize.define('requests', {
    tipo: DataTypes.STRING,
    comentario: DataTypes.TEXT,
  }, {});

  requests.associate = (models) => {
    // associations can be defined here. This method receives a models parameter.
    requests.locals = requests.belongsTo(models.locals, { foreignKey: { allowNull: false } });
  };

  return requests;
};
