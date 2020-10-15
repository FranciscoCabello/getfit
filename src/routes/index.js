const KoaRouter = require('koa-router');

const router = new KoaRouter();

router.get('index', '/', async (ctx) => {
  await ctx.render('index/index', {
    users: ctx.router.url('users'),
  });
});

module.exports = router;
