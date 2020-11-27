const KoaRouter = require('koa-router');

const router = new KoaRouter();

async function loadLocal(ctx, next) {
  ctx.state.local = await ctx.orm.locals.findByPk(Number(ctx.params.id)); // parametros de la ruta?
  return next();
}

async function localsNames(ctx, next) {
  if (ctx.session.currentUser) {
    const locals = await ctx.orm.locals.findAll();
    locals.forEach((local) => {
      ctx.state[local.id] = local.name;
    });
  }
  return next();
}

async function loadActivity(ctx, next) {
  ctx.state.activity = await ctx.orm.activities.findByPk(ctx.params.idAct);
  return next();
}

async function loadActivityRelationUsers(ctx, next) {
  ctx.state.userActRelation = await ctx.orm.userAct.findAll({
    where: {
      actid: ctx.state.activity.id,
    },
  });
  return next();
}

async function destroyRealtionsActivity(ctx, next) {
  for (let index = 0; index < ctx.state.userActRelation.length; index++) {
    await ctx.state.userActRelation[index].destroy();
  }
  return next();
}

async function activities(ctx, next) {
  const searchId = ctx.params.idLocal;
  if (searchId) {
    ctx.state.activitiesList = await ctx.orm.activities.findAll({ where: { localId: searchId } });
  }
  return next();
}

async function userActs(ctx, next) {
  if (ctx.session.currentUser) {
    ctx.state.userActivities = await ctx.orm.users.findByPk(ctx.session.currentUser.id, {
      include: {
        association: ctx.orm.users.activities,
        as: 'activities',
      },
    });
  }
  return next();
}

async function userActAssociation(ctx, next) {
  ctx.state.relationUserAct = await ctx.orm.userAct.findAll({ where: { actid: ctx.params.idAct, userid: ctx.session.currentUser.id } });
  for (let index = 0; index < ctx.state.relationUserAct.length; index++) {
    await ctx.state.relationUserAct[index].destroy();
  }
  return next();
}

async function subscribeActs(ctx, next) {
  if (ctx.session.currentUser) {
    ctx.state.hashSubscription = {};
    const relationAct = await ctx.orm.userAct.findAll();
    relationAct.forEach((relation) => {
      if (ctx.state.hashSubscription[relation.actid]) {
        ctx.state.hashSubscription[relation.actid] += 1;
      } else {
        ctx.state.hashSubscription[relation.actid] = 1;
      }
    });
  }
  return next();
}

async function checkSubcription(ctx, next) {
  ctx.state.check = null;
  const subscriptions = await ctx.orm.userAct.findAll({ where: { actid: ctx.params.idAct, userid: ctx.session.currentUser.id } });
  if (subscriptions.length === 0) {
    ctx.state.check = 1;
  }
  return next();
}

router.get('activities', '/', localsNames, subscribeActs, async (ctx) => {
  if (ctx.session.currentUser) {
    const activities = await ctx.orm.activities.findAll();
    await ctx.render('activities/index', {
      activities,
      localsNames: ctx.state,
      subscribedAmount: (id) => ctx.state.hashSubscription[id],
      newActivityPath: ctx.router.url('select-local-activities'),
      localPath: (id) => ctx.router.url('viewLocalPublic', id),
      index: ctx.router.url('index'),
    });
  } else {
    ctx.redirect(ctx.router.url('index'));
  }
});

router.get('createActivity', '/:id/create', loadLocal, async (ctx) => {
  if (ctx.session.currentUser) {
    const { local } = ctx.state;
    await ctx.render('activities/new', {
      createActivitiesPath: ctx.router.url('creatingActivity', local.id),
      viewLocalOwner: ctx.router.url('viewLocalOwner', local.id),
    });
  } else {
    ctx.redirect(ctx.router.url('index'));
  }
});

router.post('creatingActivity', '/:id/creating', loadLocal, async (ctx) => {
  const { local } = ctx.state;
  console.log(ctx.request.body);
  try {
    const activitie = await ctx.orm.activities.build({
      name: ctx.request.body.name,
      dificulty: ctx.request.body.dificulty,
      capacity: ctx.request.body.capacity,
      horarioI: ctx.request.body.horarioI,
      horarioT: ctx.request.body.horarioT,
      localId: local.id,
    });
    await activitie.save();
    ctx.redirect(ctx.router.url('viewLocalOwner', local.id));
  } catch (error) {
    await ctx.render('activities/new', {
      errors: error.errors,
      createActivitiesPath: ctx.router.url('creatingActivity', local.id),
      viewLocalOwner: ctx.router.url('viewLocalOwner', local.id),
    });
  }
});

router.get('editActivity', '/:idLocal/:idAct/update', loadActivity, async (ctx) => {
  if (ctx.session.currentUser) {
    const { activity } = ctx.state;
    await ctx.render('activities/edit', {
      activity,
      editActivityPath: ctx.router.url('editingActivity', ctx.params.idLocal, ctx.params.idAct),
      viewLocalOwner: ctx.router.url('viewLocalOwner', ctx.params.idLocal),
    });
  } else {
    ctx.redirect(ctx.router.url('index'));
  }
});

router.post('editingActivity', '/:idLocal/:idAct/updating', loadActivity, async (ctx) => {
  const { activity } = ctx.state;
  try {
    await activity.update(ctx.request.body);
    ctx.redirect(ctx.router.url('viewLocalOwner', ctx.params.idLocal));
  } catch (e) {
    await ctx.render('activities/edit', {
      errors: e.errors,
      activity,
      editActivityPath: ctx.router.url('editingActivity', ctx.params.idLocal, ctx.params.idAct),
      viewLocalOwner: ctx.router.url('viewLocalOwner', ctx.params.idLocal),
    });
  }
});

router.post('deleteActivity', '/:idLocal/:idAct/delete', loadActivity, loadActivityRelationUsers, destroyRealtionsActivity, async (ctx) => {
  const { activity } = ctx.state;
  await activity.destroy();
  ctx.redirect(ctx.router.url('viewLocalOwner', ctx.params.idLocal));
});

router.post('subscribeActivity', '/:idAct/subscribe', checkSubcription, async (ctx) => {
  if (ctx.state.check) {
    try {
      const relation = await ctx.orm.userAct.build({
        actid: ctx.params.idAct,
        userid: ctx.session.currentUser.id,
      });
      await relation.save();
      ctx.redirect(ctx.router.url('subscribedActivities'));
    } catch (e) {
      ctx.redirect(ctx.router.url('subscriptionLocals'));
    }
  } else {
    ctx.redirect(ctx.router.url('subscribedActivities'));
  }
});

router.get('subscribedActivities', '/subscribed', userActs, async (ctx) => {
  if (ctx.session.currentUser) {
    const { userActivities } = ctx.state;
    await ctx.render('activities/subscribedActs', {
      userActivities,
      deleteSubsActPath: (id) => ctx.router.url('deleteSubscriptionAct', id),
      profileUserPath: ctx.router.url('userProfile'),
      subscriptionLocalsPath: ctx.router.url('subscriptionLocals'),
    });
  } else {
    ctx.redirect(ctx.router.url('index'));
  }
});

router.post('deleteSubscriptionAct', '/:idAct/delete/subs', userActAssociation, async (ctx) => {
  ctx.redirect(ctx.router.url('subscribedActivities'));
});

router.get('activitiesLocal', '/:idLocal/activities/local', activities, async (ctx) => {
  if (ctx.session.currentUser) {
    const { activitiesList } = ctx.state;
    await ctx.render('activities/local', {
      activitiesList,
      subscribeActivitiePath: (id) => ctx.router.url('subscribeActivity', id),
      subscriptionLocalsPath: ctx.router.url('subscriptionLocals'),
    });
  } else {
    ctx.redirect(ctx.router.url('index'));
  }
});

module.exports = router;
