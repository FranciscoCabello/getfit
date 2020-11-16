module.exports = {
  provider: {
    // your provider name directly or from ENV var
    service: process.env.SERVICE,
    // auth data always from ENV vars
    auth: {
      user: process.env.APIKEY,
      pass: process.env.SENDRIDAPIKEY,
    },
  },
  // defaults to be passed to nodemailer's emails
  defaults: {
    from: 'Getfit <fcabello@uc.cl>',
  },
};
