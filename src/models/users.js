module.exports = (sequelize, DataTypes) => {
  const users = sequelize.define('users', {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: true,
        notEmpty: true,
      },
    },
    lastname: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: true,
        notEmpty: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: true,
        notEmpty: true,
      },
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isEmail: true,
        notNull: true,
        notEmpty: true,
      },
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: true,
        notEmpty: true,
        len: [12, 13],
      },
    },
    photo: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: true,
        notEmpty: true,
      },
    },
  }, {});

  users.associate = (models) => {
    // associations can be defined here. This method receives a models parameter.
    users.userLocals = users.belongsToMany(models.locals, { through: 'userlocals', foreignKey: 'userid', onDelete: 'CASCADE' });
    users.ownerLocals = users.belongsToMany(models.locals, { through: 'ownerlocals', foreignKey: 'ownerid', onDelete: 'CASCADE' });
    users.activities = users.belongsToMany(models.activities, { through: 'userAct', foreignKey: 'userid', onDelete: 'CASCADE' });
  };

  return users;
};
