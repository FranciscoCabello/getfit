const bcrypt = require('bcrypt');

const PASSWORD_SALT = 10;

async function buildPasswordHash(instance) {
  if (instance.changed('password')) {
    const hash = await bcrypt.hash(instance.password, PASSWORD_SALT);
    instance.set('password', hash);
  }
}

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
      unique: true,
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
    admin: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  }, {});

  users.beforeCreate(buildPasswordHash);
  users.beforeUpdate(buildPasswordHash);

  users.associate = (models) => {
    // associations can be defined here. This method receives a models parameter.
    users.userLocals = users.belongsToMany(models.locals, { through: 'userlocals', foreignKey: 'userid', onDelete: 'CASCADE' });
    users.ownerLocals = users.belongsToMany(models.locals, { through: 'ownerlocals', foreignKey: 'ownerid', onDelete: 'CASCADE' });
    users.activities = users.belongsToMany(models.activities, { through: 'userAct', foreignKey: 'userid', onDelete: 'CASCADE' });
    users.products = users.hasMany(models.products, { onDelete: 'CASCADE' });
    users.bank = users.hasOne(models.bank, { onDelete: 'CASCADE' });
  };

  return users;
};
