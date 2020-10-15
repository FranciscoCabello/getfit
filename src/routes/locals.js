const KoaRouter = require('koa-router');
const { Op } = require('sequelize');

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

async function locals(ctx, next) {
  ctx.state.localsApp = await ctx.orm.locals.findAll();
  return next();
}

async function loadLocal(ctx, next) {
  ctx.state.local = await ctx.orm.locals.findByPk(ctx.params.id); // parametros de la ruta?
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

async function subscriptions(ctx, next) {
  const openLocalId = [];
  const relation = await ctx.orm.userlocal.findAll();
  relation.forEach((rel) => {
    if (rel.userid === ctx.session.currentUser.id) {
      openLocalId.push(rel);
    }
  });
  ctx.state.subscription = [];
  for (let index = 0; index < openLocalId.length; index++) {
    // eslint-disable-next-line no-await-in-loop
    let addSuscript = await ctx.orm.locals.findByPk(openLocalId[index].localid);
    ctx.state.subscription.push(addSuscript);
  }
  return next();
}

async function activities(ctx, next) {
  ctx.state.activitiesList = await ctx.orm.activities.findAll({ where: { localId: ctx.params.id } });
  return next();
}

async function deleteActivities(ctx, next) {
  const activitiesId = [];
  ctx.state.activitiesList.forEach((activity) => {
    activitiesId.push(activity.id);
  });
  console.log(activitiesId);
  await ctx.orm.userAct.destroy({
    where: {
      actid: {
        [Op.or]: activitiesId,
      },
      userid: ctx.session.currentUser.id,
    },
  });
  return next();
}

async function deleteSubscriptionLocal(ctx, next) {
  await ctx.orm.userlocal.destroy({
    where: {
      userid: ctx.session.currentUser.id,
      localid: ctx.params.id,
    },
  });
  return next();
}

async function deleteActUser(ctx, next) {
  const activitiesIds = [];
  const activitiesLocal = await ctx.orm.activities.findAll({
    where: { localId: ctx.params.id },
  });
  activitiesLocal.forEach((activity) => {
    activitiesIds.push(activity.id);
  });
  await ctx.orm.userAct.destroy({
    where: {
      actid: {
        [Op.or]: activitiesIds,
      },
    },
  });
  await ctx.orm.activities.destroy({
    where: {
      localId: ctx.params.id,
    },
  });
  return next();
}

async function deletelocalRequest(ctx, next) {
  await ctx.orm.requests.destroy({ where: { localId: ctx.params.id } });
  return next();
}

async function deleteLocalUser(ctx, next) {
  await ctx.orm.userlocal.destroy({ where: { localid: ctx.params.id } });
  await ctx.orm.ownerlocal.destroy({ where: { localid: ctx.params.id } });
  return next();
}

async function subscribeActs(ctx, next) {
  ctx.state.hashSubscription = {};
  const relationAct = await ctx.orm.userAct.findAll();
  relationAct.forEach((relation) => {
    if (ctx.state.hashSubscription[relation.actid]) {
      ctx.state.hashSubscription[relation.actid] += 1;
    } else {
      ctx.state.hashSubscription[relation.actid] = 1;
    }
  });
  return next();
}

async function checkSubscriptionLocal(ctx, next) {
  ctx.state.checkSubscription = null;
  const relationUserLocal = await ctx.orm.userlocal.findAll({ where: { userid: ctx.session.currentUser.id, localid: ctx.params.id } });
  console.log(relationUserLocal.length);
  console.log('-------------');
  if (relationUserLocal.length === 0) {
    ctx.state.checkSubscription = 1;
  }
  return next();
}

router.get('locals', '/', locals, async (ctx) => {
  const { localsApp } = ctx.state;
  await ctx.render('locals/index', {
    localsApp,
    localPath: (id) => ctx.router.url('viewLocalPublic', id),
    viewLocals: ctx.router.url('subscriptionLocals'),
    newLocalPath: ctx.router.url('createLocalSelector'),
    index: ctx.router.url('index'),
  });
});

router.get('createLocalSelector', '/selector', async (ctx) => {
  console.log(ctx.session.currentUser);
  await ctx.render('locals/createLocalSelector', {
    createOwnerLocal: ctx.router.url('createPrivateLocal'),
    createPublicLocal: ctx.router.url('createPublicLocal'),
  });
});

router.get('createPublicLocal', '/create/pub', async (ctx) => {
  const local = ctx.orm.locals.build();
  return ctx.render('locals/newPublic', {
    local,
    createLocalPath: ctx.router.url('creatingPublicLocal'),
    localsPath: ctx.router.url('locals'),
  });
});

router.post('creatingPublicLocal', '/creating/pub', async (ctx) => {
  const local = await ctx.orm.locals.build(ctx.request.body);
  try {
    await local.save({ fields: PERMITTED_FIELDS });
    ctx.redirect(ctx.router.url('locals'));
  } catch (error) {
    await ctx.render('locals/newPublic', {
      local,
      errors: error.errors,
      createLocalPath: ctx.router.url('createPublicLocal'),
      localsPath: ctx.router.url('locals'),
    });
  }
});

router.get('createPrivateLocal', '/create/priv', async (ctx) => {
  const local = await ctx.orm.locals.build();
  return ctx.render('locals/newOwner', {
    local,
    createLocalPath: ctx.router.url('creatingPrivateLocal'),
    localsPath: ctx.router.url('locals'),
  });
});

router.post('creatingPrivateLocal', '/creating/priv', async (ctx) => {
  const local = await ctx.orm.locals.build(ctx.request.body);
  try {
    await local.save({ fields: PERMITTED_FIELDS });
    const ownerLocal = await ctx.orm.ownerlocal.build({
      ownerid: ctx.session.currentUser.id,
      localid: local.id,
    });
    await ownerLocal.save({ fields: ['ownerid', 'localid'] });
    ctx.redirect(ctx.router.url('locals'));
  } catch (error) {
    await ctx.render('locals/newOwner', {
      local,
      errors: error.errors,
      createLocalPath: ctx.router.url('creatingPrivateLocal'),
      localsPath: ctx.router.url('locals'),
    });
  }
});

router.get('viewLocalPublic', '/:id/pub', loadLocal, comments, activities, subscribeActs, async (ctx) => {
  const { local } = ctx.state;
  const { activitiesList } = ctx.state;
  return ctx.render('locals/showPublic', {
    local,
    comms: ctx.state.comments,
    createRequestPath: ctx.router.url('requests-new', local.id),
    activitiesList,
    subscribedAmount: (id) => ctx.state.hashSubscription[id],
    localsPath: ctx.router.url('locals'),
    subcribeLocal: ctx.router.url('subscribeLocal', local.id),
  });
});

router.get('viewLocalOwner', '/:id/priv', loadLocal, comments, activities, async (ctx) => {
  const { local } = ctx.state;
  const { activitiesList } = ctx.state;
  if (ctx.session.currentUser) {
    await ctx.render('locals/showPrivate', {
      local,
      comms: ctx.state.comments,
      deleteCommentPath: (idComment) => ctx.router.url('requests-destroy', local.id, idComment),
      activitiesList,
      editActivityPath: (idLocal, idAct) => ctx.router.url('editActivity', idLocal, idAct),
      deleteActivityPath: (idLocal, idAct) => ctx.router.url('deleteActivity', idLocal, idAct),
      createActivitiesPath: ctx.router.url('createActivity', local.id),
      deleteLocalPath: ctx.router.url('localDestroy', local.id),
      editLocalPath: ctx.router.url('localEdit', local.id),
      userProfilePath: ctx.router.url('userProfile'),
    });
  } else {
    ctx.redirect(ctx.router.url('index'));
  }
});

router.get('localEdit', '/:id/edit', loadLocal, async (ctx) => {
  const { local } = ctx.state;
  await ctx.render('locals/edit', {
    local,
    updateLocalPath: ctx.router.url('localUpdate', local.id),
    localOwnerPath: ctx.router.url('viewLocalOwner', local.id),
  });
});

router.patch('localUpdate', '/:id/update', loadLocal, async (ctx) => {
  const { local } = ctx.state;
  const fields = ctx.request.body;
  await local.update(fields);
  ctx.redirect(ctx.router.url('locals'));
});

router.post('localDestroy', '/:id/destroy', deleteActUser, deletelocalRequest, deleteLocalUser, async (ctx) => {
  await ctx.orm.locals.destroy({ where: { id: ctx.params.id } });
  ctx.redirect(ctx.router.url('userProfile'));
});

router.post('subscribeLocal', '/:id/subscribe', checkSubscriptionLocal, async (ctx) => {
  if (ctx.state.checkSubscription === 1) {
    const buildFields = {
      localid: ctx.params.id,
      userid: ctx.session.currentUser.id,
    };
    try {
      const userLocal = await ctx.orm.userlocal.build(buildFields);
      await userLocal.save();
      ctx.redirect(ctx.router.url('subscriptionLocals'));
      // redirect inscripciones
    } catch (error) {
      ctx.redirect(ctx.router.url('viewLocalPublic', ctx.params.id));
    }
  } else {
    ctx.redirect(ctx.router.url('subscriptionLocals'));
  }
});

router.get('subscriptionLocals', '/subscription', subscriptions, async (ctx) => {
  await ctx.render('locals/subscription', {
    listLocals: ctx.state.subscription,
    deleteSubscriptionPath: (id) => ctx.router.url('deleteSubscription', id),
    showLocalPath: (id) => ctx.router.url('viewLocalPublic', id),
    showActivitiesPath: (id) => ctx.router.url('activitiesLocal', id),
  });
});

router.post('deleteSubscription', '/:id/delete/subscription', activities, deleteActivities, deleteSubscriptionLocal, async (ctx) => {
  ctx.redirect(ctx.router.url('subscriptionLocals'));
});

module.exports = router;
