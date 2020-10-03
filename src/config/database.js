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
    username: 'lulqplcthrvklm',
    password: '22ac1defe97bf6dd45a339ce2c221d6f4419ab9181cf11a9ae7c5078eb84d274',
    dialect: 'postgres',
    database: 'd3c99hn2ajcml3',
    host: 'ec2-34-231-56-78.compute-1.amazonaws.com',
  },
};

Object.keys(config).forEach((configKey) => {
  const configValue = config[configKey];
  if (configValue.extend) {
    config[configKey] = { ...config[configValue.extend], ...configValue };
  }
});

module.exports = config;
