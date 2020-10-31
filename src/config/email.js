module.exports = {
  provider: {
    // your provider name directly or from ENV var
    service: 'SendGrid',
    // auth data always from ENV vars
    auth: {
      user: 'apikey',
      pass: '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',
    },
  },
  // defaults to be passed to nodemailer's emails
  defaults: {
    from: 'Getfit <fcabello@uc.cl>',
  },
};
