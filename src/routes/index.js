const KoaRouter = require('koa-router');

const router = new KoaRouter();

router.get('index', '/', async (ctx) => {
  await ctx.render('index/index');
});

module.exports = router;
