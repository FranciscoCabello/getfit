const KoaRouter = require('koa-router');
const bcrypt = require('bcrypt');

const router = new KoaRouter();

const USER_FIELDS = [
  'name',
  'lastname',
  'password',
  'email',
  'phone',
  'photo',
];

async function getUser(ctx, next) {
  ctx.state.user = await ctx.orm.users.findByPk(ctx.session.currentUser.id);
  return next();
}

async function getUsers(ctx, next) {
  ctx.state.users = await ctx.orm.users.findAll();
  return next();
}

async function localsNames(ctx, next) {
  ctx.state.activities = await ctx.orm.activities.findAll();
  const locals = await ctx.orm.locals.findAll();
  locals.forEach((local) => {
    ctx.state[local.id] = local.name;
  });
  return next();
}

async function actsUser(ctx, next) {
  ctx.state.actUser = await ctx.orm.users.findByPk(ctx.session.currentUser.id, {
    include: {
      association: ctx.orm.users.activities,
      as: 'activities',
    },
  });
  return next();
}

async function subscription(ctx, next) {
  const openLocalId = [];
  ctx.state.subscription = [];
  const relation = await ctx.orm.userlocal.findAll();
  relation.forEach((rel) => {
    if (rel.userid === ctx.session.currentUser.id) { openLocalId.push(rel); }
  });
  for (let index = 0; index < openLocalId.length; index++) {
    // eslint-disable-next-line no-await-in-loop
    let addSuscript = await ctx.orm.locals.findByPk(openLocalId[index].localid);
    ctx.state.subscription.push(addSuscript);
  }
  return next();
}

async function owner(ctx, next) {
  ctx.state.user = await ctx.orm.users.findByPk(ctx.session.currentUser.id, {
    include: {
      association: ctx.orm.users.ownerLocals,
      as: 'locals',
    },
  });
  return next();
}

async function getActData(ctx, next) {
  const userAct = await ctx.orm.userAct.findAll();
  userAct.forEach((data) => {
    // eslint-disable-next-line max-len
    if ((Number(data.actid) === Number(ctx.request.body.actid)) && (Number(ctx.params.id) === Number(data.userid))) {
      ctx.state.destroyAct = data;
    }
  });
  return next();
}

async function destroyRelations(ctx, next) {
  const openLocalId = [];
  const destroyActs = [];
  const destroyOwnerLocal = [];
  const { user } = ctx.state;
  const actsUser = await ctx.orm.userAct.findAll();
  const ownLocs = await ctx.orm.ownerlocal.findAll();
  const relation = await ctx.orm.userlocal.findAll();
  relation.forEach((rel) => {
    if (rel.userid === ctx.state.user.id) { openLocalId.push(rel); }
  });
  for (let index=0; index<openLocalId.length; index++) {
    // eslint-disable-next-line no-await-in-loop
    await openLocalId[index].destroy();
  }
  actsUser.forEach((dataAct) => {
    if (dataAct.userid === user.id) { destroyActs.push(dataAct); }
  });
  for (let index=0; index < destroyActs.length; index++) {
    // eslint-disable-next-line no-await-in-loop
    await destroyActs[index].destroy();
  }
  ownLocs.forEach((ownloc) => {
    user.locals.forEach((dataLocal) => {
      // eslint-disable-next-line max-len
      if (dataLocal.id === ownloc.localid) { destroyOwnerLocal.push({ relation: ownloc, local: dataLocal }); }
    });
  });
  for (let pos=0; pos<destroyOwnerLocal.length; pos++) {
    // eslint-disable-next-line no-await-in-loop
    await destroyOwnerLocal[pos].relation.destroy();
    // eslint-disable-next-line no-await-in-loop
    const destroyAct = await ctx.orm.activities.findOne({ where: { localId: destroyOwnerLocal[pos].local.id } });
    // eslint-disable-next-line no-await-in-loop
    await destroyAct.destroy();
    // eslint-disable-next-line no-await-in-loop
    await destroyOwnerLocal[pos].local.destroy();
  }

  return next();
}

async function loadProduct(ctx, next) {
  ctx.state.products = await ctx.orm.products.findAll({ where: { userId: ctx.session.currentUser.id } });
  return next();
}

router.get('users', '/', async (ctx) => {
  console.log(ctx.session.currentUser);
  await ctx.render('users/index', {
    logIn: ctx.router.url('users-login'),
    signUp: ctx.router.url('users-signup'),
    activities: ctx.router.url('select-activities'),
    subscribe: ctx.router.url('select-local'),
    unsubscribeAct: ctx.router.url('unsubscribe-activities'),
    index: ctx.router.url('index'),
  });
});

router.get('select-activities', '/activities', localsNames, getUsers, async (ctx) => {
  await ctx.render('users/selectActivities', {
    users: ctx.state.users,
    activities: ctx.state.activities,
    localid: ctx.state,
    relationPath: ctx.router.url('subscribe-activities-post'),
  });
});

router.post('subscribe-activities-post', '/subscribeActivities', async (ctx) => {
  const user = await ctx.orm.users.findByPk(Number(ctx.request.body.userid));
  const activity = await ctx.orm.activities.findByPk(Number(ctx.request.body.activityid));
  try {
    const activitySub = await ctx.orm.userAct.build({
      actid: activity.id,
      userid: user.id,
    });
    await activitySub.save();
    await ctx.render('users/index', {
      logIn: ctx.router.url('users-login'),
      signUp: ctx.router.url('users-signup'),
      activities: ctx.router.url('select-activities'),
      subscribe: ctx.router.url('select-local'),
      unsubscribeAct: ctx.router.url('unsubscribe-activities'),
      index: ctx.router.url('index'),
    });
  } catch (error) {
    ctx.redirect(ctx.router.url('select-activities'));
  }
});

router.get('unsubscribe-activities', '/unsubscribe_activities', async (ctx) => {
  const users = await ctx.orm.users.findAll();
  await ctx.render('users/selectUser', {
    users,
    unsubscribePath: (id) => ctx.router.url('unsubscribe-activites-id', id),
  });
});

router.get('unsubscribe-activites-id', '/:id/unsubscribe', getUser, async (ctx) => {
  await ctx.render('users/unsubscribeActivity', {
    activities: ctx.state.actUser.activities,
    unsubscribePath: ctx.router.url('unsubsribe-activities-id-bd', ctx.state.actUser.id),
  });
});

router.post('unsubsribe-activities-id-bd', '/:id/unsubscribePost', getActData, async (ctx) => {
  const { destroyAct } = ctx.state;
  await destroyAct.destroy();
  await ctx.render('users/index', {
    logIn: ctx.router.url('users-login'),
    signUp: ctx.router.url('users-signup'),
    activities: ctx.router.url('select-activities'),
    subscribe: ctx.router.url('select-local'),
    unsubscribeAct: ctx.router.url('unsubscribe-activities'),
    index: ctx.router.url('index'),
  });
});

router.get('users-signup', '/signup', async (ctx) => {
  const user = await ctx.orm.users.build();
  await ctx.render('users/signup', {
    user,
    pathForm: ctx.router.url('users-signup-post'),
  });
});

router.post('users-signup-post', '/createUser', async (ctx) => {
  try {
    const createUser = await ctx.orm.users.build(ctx.request.body);
    await createUser.save({ fields: USER_FIELDS });
    ctx.redirect(ctx.router.url('users-login'));
  } catch (error) {
    ctx.redirect(ctx.router.url('users-signup'));
  }
});

router.get('users-login', '/login', async (ctx) => {
  await ctx.render('users/login', {
    error: null,
    loginPath: ctx.router.url('user-login-post'),
  });
});

router.post('user-login-post', '/loginPost', async (ctx) => {
  const { email, password } = ctx.request.body;
  const user = await ctx.orm.users.findOne({ where: { email } });
  if (user) {
    const authenticated = await bcrypt.compare(password, user.password);
    if (!authenticated) {
      await ctx.render('users/login', {
        error: 'Usuario o contrasena incorrecta',
        loginPath: ctx.router.url('user-login-post'),
      });
    } else {
      ctx.session.currentUser = {
        id: user.id,
        name: user.name,
      };
      ctx.redirect(ctx.router.url('index'));
    }
  } else {
    await ctx.render('users/login', {
      error: 'Usuario o contrasena incorrecta',
      loginPath: ctx.router.url('user-login-post'),
    });
  }
});

router.get('users-logout', 'logOut', async (ctx) => {
  ctx.session.currentUser = null;
  ctx.redirect(ctx.router.url('index'));
});

router.get('userProfile', '/profile', owner, loadProduct, async (ctx) => {
  const { user, products } = ctx.state;
  const ownedLocals = user.locals;
  await ctx.render('users/profile', {
    user,
    pathForm: ctx.router.url('user-update', ctx.session.currentUser.id),
    del: ctx.router.url('user-delete', ctx.session.currentUser.id),
    index: ctx.router.url('index'),
    ownedLocals,
    viewLocalOwnerPath: (id) => ctx.router.url('viewLocalOwner', id),
    subscriptionLocalPath: ctx.router.url('subscriptionLocals', ctx.session.currentUser.id),
    subscriptionActivitiesPath: ctx.router.url('subscribedActivities', ctx.session.currentUser.id),
    products,
    destroyProductPath: (id) => ctx.router.url('deleteProduct', id),
  });
});

router.get('user-update', '/:id/update', getUser, async (ctx) => {
  const { user } = ctx.state;
  console.log(user);
  await ctx.render('users/signup', {
    user,
    pathForm: ctx.router.url('user-update-post', user.id),
  });
});

router.post('user-update-post', '/:id/update/post', getUser, async (ctx) => {
  const { user } = ctx.state;
  await user.update(ctx.request.body);
  ctx.redirect(ctx.router.url('user-profile', user.id));
});

router.post('user-delete', '/:id/deleteUser', destroyRelations, async (ctx) => {
  const { user } = ctx.state;
  await user.destroy();
  ctx.redirect(ctx.router.url('users'));
});

module.exports = router;
