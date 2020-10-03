module.exports = (sequelize, DataTypes) => {
  const locals = sequelize.define('locals', {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    photo: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    ubicacion: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    horarioA: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    horarioC: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    precio: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notEmpty: true,
        isInt: true,
      },
    },
    capacidad: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notEmpty: true,
        isInt: true,
      },
    },
  }, {});

  locals.associate = (models) => {
    // associations can be defined here. This method receives a models parameter.
    locals.userLocals = locals.belongsToMany(models.users, { through: 'userlocals', foreignKey: 'localid', onDelete: 'CASCADE' });
    locals.ownerLocals = locals.belongsToMany(models.users, { through: 'ownerlocals', foreignKey: 'localid', onDelete: 'CASCADE' });
    locals.activities = locals.hasMany(models.activities, { onDelete: 'CASCADE' });
    locals.requests = locals.hasMany(models.requests, { onDelete: 'CASCADE' });
  };

  return locals;
};
