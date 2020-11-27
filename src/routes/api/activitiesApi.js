const KoaRouter = require('koa-router');
const jwt = require('koa-jwt');

const router = new KoaRouter();

const checkPermission = (listUsers, userid) => {
  let permission = false;
  listUsers.forEach((user) => {
    if (user.id === userid) { permission = true; }
  });
  return permission;
};

async function loadLocal(ctx, next) {
  ctx.state.local = await ctx.orm.locals.findByPk(Number(ctx.params.localId));
  return next();
}

async function checkAdmin(ctx, next) {
  const { local } = ctx.state;
  const { user: { sub } } = ctx.state;
  if (local) {
    const ownerLocal = await ctx.orm.ownerlocal.findOne({ where: { localid: local.id } });
    if (!ownerLocal || !(ownerLocal.ownerid === sub)) {
      ctx.body = { error: 'Insufficient permissions' };
    } else {
      ctx.state.permission = true;
    }
  } else {
    ctx.body = { error: 'Unexistant local' };
  }
  return next();
}

async function createAct(ctx, next) {
  const { local, permission } = ctx.state;
  if (permission) {
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
      ctx.body = { activitie: 'succes' };
    } catch (error) {
      ctx.body = { error };
    }
  }
  return next();
}

async function allActivities(ctx, next) {
  ctx.state.activities = await ctx.orm.activities.findAll();
  return next();
}

async function loadAct(ctx, next) {
  const { user: { sub } } = ctx.state;
  console.log('userId', sub);
  const activity = await ctx.orm.activities.findByPk(ctx.params.actId);
  if (activity) {
    const local = await ctx.orm.locals.findByPk(activity.localId, {
      include: {
        association: ctx.orm.locals.ownerLocals,
        as: 'owner',
      },
    });
    if (local) {
      if (checkPermission(local.users, sub)) {
        ctx.state.activity = activity;
      } else {
        ctx.body = { error: 'Insufficient permissions' };
      }
    } else {
      ctx.body = { error: 'Unexistant local' };
    }
  } else {
    ctx.body = { error: 'Unexistant activity' };
  }
  return next();
}

async function loadActivityRelationUsers(ctx, next) {
  const { activity } = ctx.state;
  if (activity) {
    ctx.state.userActRelation = await ctx.orm.userAct.findAll({
      where: {
        actid: activity.id,
      },
    });
  }
  return next();
}

async function destroyRealtionsActivity(ctx, next) {
  const { activity } = ctx.state;
  if (activity) {
    for (let index = 0; index < ctx.state.userActRelation.length; index++) {
      await ctx.state.userActRelation[index].destroy();
    }
    ctx.body = { destroyed: activity };
    await activity.destroy();
  }
  return next();
}

async function userActAssociation(ctx, next) {
  const { user: { sub } } = ctx.state;
  const relationUserAct = await ctx.orm.userAct.findAll({
    where: {
      actid: ctx.params.actId,
      userid: sub,
    },
  });
  console.log(relationUserAct);
  if (relationUserAct.length > 0) {
    for (let index = 0; index < relationUserAct.length; index++) {
      await relationUserAct[index].destroy();
    }
    ctx.body = { destroyed: `Activity id ${ctx.params.actId}` };
  } else { ctx.body = { error: 'Unexistant relation or permission' }; }
  return next();
}

async function checkSubcriptionAct(ctx, next) {
  const { user: { sub } } = ctx.state;
  ctx.state.check = false;
  const subscriptions = await ctx.orm.userAct.findAll({ where: { actid: ctx.params.actId, userid: sub } });
  console.log('Suscriptions', subscriptions);
  if (subscriptions.length === 0) {
    ctx.state.check = true;
  } else {
    console.log('Already subscribed');
    ctx.body = { error: 'Already subscribed' };
  }
  return next();
}

async function checkSubscriptionLocal(ctx, next) {
  const { user: { sub } } = ctx.state;
  const activitie = await ctx.orm.activities.findByPk(ctx.params.actId);
  if (ctx.state.check) {
    if (activitie) {
      const local = await ctx.orm.locals.findByPk(activitie.localId);
      if (local) {
        const userlocal = await ctx.orm.userlocal.findOne({ where: { userid: sub, localid: local.id } });
        if (userlocal) {
          ctx.state.check = true;
          console.log('Already subscribed local');
        } else {
          const buildFields = {
            localid: local.id,
            userid: sub,
          };
          try {
            const userLocal = await ctx.orm.userlocal.build(buildFields);
            await userLocal.save();
            console.log('Creating subs gym');
            ctx.state.check = true;
          } catch (error) {
            ctx.body = { error };
            ctx.state.check = false;
          }
        }
      } else {
        ctx.body = { error: 'Unexistant local' };
        ctx.state.check = false;
      }
    } else {
      ctx.body = { error: 'Unexistant activity' };
      ctx.state.check = false;
    }
  }
  return next();
}

async function subscribeAct(ctx, next) {
  if (ctx.state.check) {
    const { user: { sub } } = ctx.state;
    try {
      const relation = await ctx.orm.userAct.build({
        actid: ctx.params.actId,
        userid: sub,
      });
      console.log('Creating subs activity');
      await relation.save();
      ctx.body = { activitie: 'succes' };
    } catch (error) {
      ctx.body = { error };
    }
  }
  return next();
}

async function userActs(ctx, next) {
  const { user: { sub } } = ctx.state;
  if (sub) {
    ctx.state.userActivities = await ctx.orm.users.findByPk(sub, {
      include: {
        association: ctx.orm.users.activities,
        as: 'activities',
      },
    });
    const { activities } = ctx.state.userActivities;
    ctx.body = { activities };
  }
  return next();
}

router.get('activities', '/all', allActivities, async (ctx) => {
  const { activities } = ctx.state;
  ctx.body = { activities };
  ctx.status = 200;
});

router.use(jwt({ secret: process.env.JWT_SECRET, key: 'user' }));

router.post('createActivity', '/create/:localId', loadLocal, checkAdmin, createAct, async (ctx) => {
  const { error } = ctx.body;
  if (error) {
    ctx.status = 400;
  } else {
    ctx.body = { accepted: 'ok' };
    ctx.status = 200;
  }
});

router.post('subscribeActivity', '/subscribe/:actId', checkSubcriptionAct, checkSubscriptionLocal, subscribeAct, async (ctx) => {
  const { error } = ctx.body;
  if (error) {
    ctx.status = 400;
  } else {
    ctx.status = 200;
  }
});

router.del('deleteActivity', '/delete/:actId', loadAct, loadActivityRelationUsers, destroyRealtionsActivity, async (ctx) => {
  const { error } = ctx.body;
  if (error) {
    ctx.status = 400;
  } else {
    ctx.status = 200;
  }
});

router.get('susAct', '/suscriptions', userActs, async (ctx) => {
  const { error } = ctx.body;
  if (error) {
    ctx.status = 400;
  } else {
    ctx.status = 200;
  }
});

router.del('delSusAct', '/delete/suscription/:actId', userActAssociation, async (ctx) => {
  const { error } = ctx.body;
  if (error) {
    ctx.status = 400;
  } else {
    ctx.status = 200;
  }
});

module.exports = router;
