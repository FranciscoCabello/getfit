const KoaRouter = require('koa-router');

const router = new KoaRouter();

// TIPO 0 CORRESPONDE A CREAR Y TIPO 1 CORRESPONDE A ACTUALIZAR

const PERMITTED_FIELDS = [
  'tipo',
  'comentario',
  'localId',
];

async function localsNames(ctx, next) {
  const locals = await ctx.orm.locals.findAll();
  locals.forEach((local) => {
    ctx.state[local.id] = local.name;
  });
  return next();
}
async function loadRequest(ctx, next) {
  ctx.state.request = await ctx.orm.requests.findByPk(ctx.params.id);
  return next();
}

router.get('requests', '/', localsNames, async (ctx) => {
  const requests = await ctx.orm.requests.findAll();
  await ctx.render('requests/index', {
    requests,
    localsNames: ctx.state,
    newRequestPath: ctx.router.url('requests-new'),
    requestPath: (id) => ctx.router.url('request', id),
    index: ctx.router.url('index'),
  });
});

router.get('requests-new', '/new', async (ctx) => {
  const locals = await ctx.orm.locals.findAll();
  const request = ctx.orm.requests.build();
  return ctx.render('requests/new', {
    request,
    locals,
    createRequestPath: ctx.router.url('requests-create'),
    requestsPath: ctx.router.url('requests'),
  });
});

router.post('requests-create', '/', async (ctx) => {
  console.log(ctx.request.body);
  const request = ctx.orm.requests.build(ctx.request.body);

  try {
    await request.save({ fields: PERMITTED_FIELDS });
    ctx.redirect(ctx.router.url('requests'));
  } catch (error) {
    const locals = await ctx.orm.locals.findAll();
    await ctx.render('requests/new', {
      request,
      locals,
      errors: error.errors,
      index: ctx.router.url('index'),
      createRequestPath: ctx.router.url('requests-create'),
    });
  }
});

router.get('request', '/:id', loadRequest, (ctx) => {
  const { request } = ctx.state;
  return ctx.render('requests/show', {
    request,
    requestsPath: ctx.router.url('requests'),
    editRequestPath: (request) => ctx.router.url('requests-edit', { id: request.id }),
    deleteRequestPath: (request) => ctx.router.url('requests-destroy', { id: request.id }),
  });
});

router.get('requests-edit', '/:id/edit', loadRequest, async (ctx) => {
  const { request } = ctx.state;
  await ctx.render('requests/edit', {
    request,
    updateRequestPath: (request) => ctx.router.url('requests-update', { id: request.id }),
    requestsPath: ctx.router.url('requests'),
  });
});

router.patch('requests-update', '/:id', loadRequest, async (ctx) => {
  const { request } = ctx.state;
  const fields = ctx.request.body;
  await request.update(fields);
  ctx.redirect(ctx.router.url('requests'));
});

router.del('requests-destroy', '/:id', loadRequest, async (ctx) => {
  const { request } = ctx.state;
  await request.destroy();
  ctx.redirect(ctx.router.url('requests'));
});

module.exports = router;
