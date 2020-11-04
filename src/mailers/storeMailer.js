module.exports = {
  sendOwnerEmail: (ctx, data) => ctx.sendMail('sendEmailOwners', { to: data.user.email }, { data }),
  sendGetFitEmail: (ctx, data) => ctx.sendMail('sendEmailGetFit', { to: 'getfit123462717372@gmail.com' }, { data }),
  sendBuyerEmail: (ctx, data) => ctx.sendMail('sendEmailBuyer', { to: data.user.email }, { data }),
};
