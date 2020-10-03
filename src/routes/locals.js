const KoaRouter = require('koa-router');

const router = new KoaRouter();

const PERMITTED_FIELDS = [
  'name',
  'photo',
  'ubicacion',
  'horarioA',
  'horarioC',
  'precio',
  'capacidad',
];

async function loadLocal(ctx, next) {
  ctx.state.local = await ctx.orm.locals.findByPk(ctx.params.id); // parametros de la ruta?
  return next();
}

async function loadUser(ctx, next) {
  ctx.state.user = await ctx.orm.users.findByPk(ctx.params.id);
  return next();
}

async function comments(ctx, next) {
  ctx.state.comments = [];
  const com = await ctx.orm.requests.findAll();
  com.forEach((c) => {
    if (c.localId === ctx.state.local.id) { ctx.state.comments.push(c); }
  });
  return next();
}

async function destroyRequest(ctx, next) {
  const destroy = [];
  const com = await ctx.orm.requests.findAll();
  const userLocal = await ctx.orm.userlocal.findAll();
  const ownerLocal = await ctx.orm.ownerlocal.findAll();
  com.forEach((c) => {
    if (c.localId === ctx.state.local.id) { destroy.push(c); }
  });
  for (let index = 0; index < destroy.length; index++) {
    await destroy[index].destroy();
  }
  for (let index = 0; index < userLocal.length; index++) {
    if (userLocal[index].localid === ctx.state.local.id) {
      await userLocal[index].destroy();
    }
  }
  for (let index = 0; index < ownerLocal.length; index++) {
    if (ownerLocal[index].localid === ctx.state.local.id) {
      await ownerLocal[index].destroy();
    }
  }
  return next();
}

router.get('locals', '/', async (ctx) => {
  const locals = await ctx.orm.locals.findAll();
  const quantity = locals.length;
  await ctx.render('locals/index', {
    locals,
    localPath: (id) => ctx.router.url('local', id),
    newLocalPath: ctx.router.url('locals-type'),
    quantity,
    index: ctx.router.url('index'),
  });
});

router.get('locals-type', '/type', async (ctx) => {
  await ctx.render('locals/type', {
    ownerLocal: ctx.router.url('locals-new-select-owner'),
    publicLocal: ctx.router.url('locals-new-public'),
  });
});

router.get('locals-new-select-owner', '/owner', async (ctx) => {
  const users = await ctx.orm.users.findAll();
  await ctx.render('locals/selectOwner', {
    users,
    localNewPath: (userId) => ctx.router.url('locals-new-owner', userId),
  });
});

router.get('locals-new-public', '/newPublic', async (ctx) => {
  const local = ctx.orm.locals.build();
  return ctx.render('locals/newPublic', {
    local,
    createLocalPath: ctx.router.url('locals-create-public'),
    localsPath: ctx.router.url('locals'),
  });
});

router.post('locals-create-public', '/', async (ctx) => {
  const local = await ctx.orm.locals.build(ctx.request.body);
  try {
    await local.save({ fields: PERMITTED_FIELDS });
    ctx.redirect(ctx.router.url('locals'));
  } catch (error) {
    await ctx.render('locals/newPublic', {
      local,
      errors: error.errors,
      createLocalPath: ctx.router.url('locals-create-public'),
      localsPath: ctx.router.url('locals'),
    });
  }
});

router.get('locals-new-owner', '/:id/newPrivate', loadUser, async (ctx) => {
  const { user } = ctx.state;
  const local = ctx.orm.locals.build();
  return ctx.render('locals/newOwner', {
    local,
    createLocalPath: ctx.router.url('locals-create-owner', user.id),
    localsPath: ctx.router.url('locals'),
  });
});

router.post('locals-create-owner', '/:id', loadUser, async (ctx) => {
  const { user } = ctx.state;
  const local = await ctx.orm.locals.build(ctx.request.body);
  try {
    await local.save({ fields: PERMITTED_FIELDS });
    const ownerLocal = await ctx.orm.ownerlocal.build({
      ownerid: user.id,
      localid: local.id,
    });
    await ownerLocal.save({ fields: ['ownerid', 'localid'] });
    ctx.redirect(ctx.router.url('locals'));
  } catch (error) {
    await ctx.render('locals/newOwner', {
      local,
      errors: error.errors,
      createLocalPath: ctx.router.url('locals-create-owner', user.id),
      localsPath: ctx.router.url('locals'),
    });
  }
});

router.get('local', '/:id', loadLocal, comments, async (ctx) => {
  const { local } = ctx.state;
  return ctx.render('locals/show', {
    local,
    comms: ctx.state.comments,
    localsPath: ctx.router.url('locals'),
    deleteLocalPath: (local) => ctx.router.url('locals-destroy', { id: local.id }),
    editLocalPath: (local) => ctx.router.url('locals-edit', { id: local.id }),
  });
});

router.get('locals-edit', '/:id/edit', loadLocal, async (ctx) => {
  const { local } = ctx.state;
  await ctx.render('locals/edit', {
    local,
    updateLocalPath: (local) => ctx.router.url('locals-update', { id: local.id }),
    localsPath: ctx.router.url('locals'),
  });
});

router.patch('locals-update', '/:id', loadLocal, async (ctx) => {
  const { local } = ctx.state;
  const fields = ctx.request.body;
  await local.update(fields);
  ctx.redirect(ctx.router.url('locals'));
});

router.del('locals-destroy', '/:id', loadLocal, destroyRequest, async (ctx) => {
  const { local } = ctx.state;
  await local.destroy();
  ctx.redirect(ctx.router.url('locals'));
});

module.exports = router;
