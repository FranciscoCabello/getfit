module.exports = (sequelize, DataTypes) => {
  const activities = sequelize.define('activities', {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    dificulty: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    capacity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    horarioI: {
      type: DataTypes.TIME,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    horarioT: {
      type: DataTypes.TIME,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
  }, {});

  activities.associate = (models) => {
    // associations can be defined here. This method receives a models parameter.
    activities.locals = activities.belongsTo(models.locals, { foreignKey: { allowNull: false } });
    activities.users = activities.belongsToMany(models.users, { through: 'userAct', foreignKey: 'actid', onDelete: 'CASCADE' });
  };

  return activities;
};
