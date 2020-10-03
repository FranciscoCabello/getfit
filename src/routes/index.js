const KoaRouter = require('koa-router');
const pkg = require('../../package.json');

const router = new KoaRouter();

router.get('index', '/', async (ctx) => {
  await ctx.render('index', {
    appVersion: pkg.version,
    users: ctx.router.url('users'),
    locals: ctx.router.url('locals'),
    requests: ctx.router.url('requests'),
    activities: ctx.router.url('activities'),
  });
});

module.exports = router;
