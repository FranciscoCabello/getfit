const KoaRouter = require('koa-router');

const router = new KoaRouter();

async function loadLocal(ctx, next) {
  ctx.state.local = await ctx.orm.locals.findByPk(Number(ctx.params.id)); // parametros de la ruta?
  return next();
}

async function localsNames(ctx, next) {
  const locals = await ctx.orm.locals.findAll();
  locals.forEach((local) => {
    ctx.state[local.id] = local.name;
  });
  return next();
}

router.get('activities', '/', localsNames, async (ctx) => {
  const activities = await ctx.orm.activities.findAll();
  await ctx.render('activities/index', {
    activities,
    localsNames: ctx.state,
    newActivityPath: ctx.router.url('select-local-activities'),
    index: ctx.router.url('index'),
  });
});

router.get('select-local-activities', '/activities/local', async (ctx) => {
  const locals = await ctx.orm.locals.findAll();
  await ctx.render('activities/local', {
    locals,
    localsPath: (local) => ctx.router.url('activities-new', local),
  });
});

router.get('activities-new', '/:id/new', loadLocal, async (ctx) => {
  const { local } = ctx.state;
  await ctx.render('activities/new', {
    createActivitiesPath: ctx.router.url('activities-new-create', local.id),
    activities: ctx.router.url('activities'),
  });
});

router.post('activities-new-create', '/:id/create', loadLocal, localsNames, async (ctx) => {
  const { local } = ctx.state;
  try {
    const activitie = await ctx.orm.activities.build({
      name: ctx.request.body.name,
      dificulty: ctx.request.body.dificulty,
      localId: local.id,
    });
    await activitie.save();
    ctx.redirect(ctx.router.url('activities'));
  } catch (error) {
    await ctx.render('activities/new', {
      errors: error.errors,
      createActivitiesPath: ctx.router.url('activities-new', local.id),
      activities: ctx.router.url('activities'),
    });
  }
});

module.exports = router;
