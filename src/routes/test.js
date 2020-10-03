const KoaRouter = require('koa-router');

const router = new KoaRouter();

router.get('testing', '/', async (ctx) => {
  const userSnap = await ctx.orm.users.findByPk(2);
  const createLocal = {
    name: 'name',
    photo: 'photo',
    ubicacion: 'ubicacion',
    horarioA: 'horarioA',
    horarioC: 'horarioC',
    precio: 10000,
    capacidad: 10000,
  };
  console.log(userSnap);
  await ctx.render('index', {
    users: ctx.router.url('users'),
    locals: ctx.router.url('locals'),
  });
});

module.exports = router;
