const config = {
  default: {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    dialect: process.env.DB_DIALECT || 'postgres',
    database: process.env.DB_NAME,
    host: process.env.DB_HOST || '127.0.0.1',
  },
  development: {
    extend: 'default',
    database: process.env.DB_NAME || 'getfit',
    username: process.env.DB_USERNAME || 'getfit',
    password: process.env.DB_PASSWORD || 'getfit',
    dialect: process.env.DB_DIALECT || 'postgres',
  },
  test: {
    extend: 'default',
    database: 'getfit',
  },
  production: {
    extend: 'default',
    use_env_variable: 'DATABASE_URL',
    username: process.env.DB_USERNAME_SERVER,
    password: process.env.DB_PASSWORD_SERVER,
    dialect: 'postgres',
    database: process.env.DB_DATABASE_SERVER,
    host: process.env.DB_HOST_SERVER,
  },
};

Object.keys(config).forEach((configKey) => {
  const configValue = config[configKey];
  if (configValue.extend) {
    config[configKey] = { ...config[configValue.extend], ...configValue };
  }
});

module.exports = config;
