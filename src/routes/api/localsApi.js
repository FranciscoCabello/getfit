const KoaRouter = require('koa-router');
const jwt = require('koa-jwt');
const { Op } = require('sequelize');

const router = new KoaRouter();

const PERMITTED_FIELDS = [
  'name',
  'ubicacion',
  'horarioA',
  'horarioC',
  'precio',
  'capacidad',
];

async function allLocals(ctx, next) {
  ctx.state.localsApp = await ctx.orm.locals.findAll();
  return next();
}

async function loadLocal(ctx, next) {
  console.log('here');
  ctx.state.local = await ctx.orm.locals.findByPk(ctx.params.localId, {
    include: {
      association: ctx.orm.locals.ownerLocals,
      as: 'owners',
    },
  });
  console.log('local', ctx.state.local);
  return next();
}

async function checkOwnerUpdate(ctx, next) {
  const { local } = ctx.state;
  const { user: { sub } } = ctx.state;
  if (local) {
    let isAdmin = false;
    local.users.forEach((user) => {
      if (user.id === sub) { isAdmin = true; }
    });
    if (isAdmin) {
      const fields = ctx.request.body;
      console.log('Fields', fields);
      try {
        await local.update(fields);
        ctx.body = { local };
      } catch (error) {
        ctx.body = { error };
      }
    } else { ctx.body = { error: 'Insufficient permission' }; }
  } else {
    ctx.body = { error: 'Unexistant local' };
  }
  return next();
}

async function loadOwnedLocals(ctx, next) {
  const { user: { sub } } = ctx.state;
  ctx.state.user = await ctx.orm.users.findByPk(sub, {
    include: {
      association: ctx.orm.users.ownerLocals,
      as: 'locals',
    },
  });
  return next();
}

async function checkData(ctx, next) {
  PERMITTED_FIELDS.forEach((field) => {
    if (!(field in ctx.request.body)) {
      ctx.body = null;
      ctx.state.message = `${field} faltante`;
    }
  });
  return next();
}

async function createLocal(ctx, next) {
  try {
    const { user: { sub } } = ctx.state;
    const local = await ctx.orm.locals.build(ctx.request.body);
    await local.save({ fields: PERMITTED_FIELDS });
    const ownerLocal = await ctx.orm.ownerlocal.build({
      ownerid: sub,
      localid: local.id,
    });
    await ownerLocal.save({ fields: ['ownerid', 'localid'] });
    ctx.body = { local };
  } catch (error) {
    ctx.body = null;
    ctx.state.message = error;
  }
  return next();
}

async function checkLocalDeleteId(ctx, next) {
  const { localId } = ctx.params;
  const { user: { sub } } = ctx.state;
  ctx.state.statusRequest = true;
  if (!localId) {
    ctx.state.statusRequest = false;
    ctx.body = 'No localId';
  } else {
    try {
      ctx.state.local = await ctx.orm.locals.findOne({ where: { id: localId } });
      ctx.state.ownerLocal = await ctx.orm.ownerlocal.findOne({
        where: {
          localid: localId,
        },
      });
      if (ctx.state.local && ctx.state.ownerLocal && (ctx.state.ownerLocal.ownerid === sub)) {
        ctx.state.localId = localId;
      } else {
        ctx.state.statusRequest = false;
        ctx.body = 'Unexistant local or insufficient permissions';
      }
    } catch (error) {
      ctx.state.statusRequest = false;
      ctx.body = 'Unexistant localId';
    }
  }
  return next();
}

async function deleteActUser(ctx, next) {
  if (ctx.state.statusRequest) {
    const activitiesIds = [];
    const activitiesLocal = await ctx.orm.activities.findAll({
      where: { localId: ctx.state.localId },
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
        localId: ctx.state.localId,
      },
    });
  }
  return next();
}

async function deletelocalRequest(ctx, next) {
  if (ctx.state.statusRequest) {
    await ctx.orm.requests.destroy({ where: { localId: ctx.state.localId } });
  }
  return next();
}

async function deleteLocalUser(ctx, next) {
  if (ctx.state.statusRequest) {
    await ctx.orm.userlocal.destroy({ where: { localid: ctx.state.localId } });
    await ctx.state.ownerLocal.destroy();
    await ctx.state.local.destroy();
  }
  return next();
}

async function activities(ctx, next) {
  ctx.state.activitiesList = await ctx.orm.activities.findAll({ where: { localId: ctx.params.localId } });
  return next();
}

router.get('locals', '/all', allLocals, async (ctx) => {
  const { localsApp } = ctx.state;
  ctx.body = { localsApp };
  ctx.status = 200;
});

router.use(jwt({ secret: process.env.JWT_SECRET, key: 'user' }));

router.get('getOwnedLocal', '/owner', loadOwnedLocals, async (ctx) => {
  const { user: { locals } } = ctx.state;
  ctx.body = { locals };
  ctx.status = 200;
});

router.get('getLocalActivities', '/:localId/activities', activities, async (ctx) => {
  const { activitiesList } = ctx.state;
  if (activitiesList) {
    ctx.body = { activitiesList };
    ctx.status = 200;
  } else {
    ctx.body = { activitiesList: [] };
    ctx.status = 200;
  }
});

router.post('createLocal', '/create', checkData, createLocal, async (ctx) => {
  if (ctx.body) {
    ctx.status = 200;
  } else {
    ctx.status = 400;
    ctx.body = ctx.state.message;
  }
});

router.del('deleteLocal', '/delete/:localId', checkLocalDeleteId, deleteActUser, deletelocalRequest, deleteLocalUser, async (ctx) => {
  if (!ctx.state.statusRequest) {
    ctx.status = 400;
  } else {
    ctx.status = 200;
    ctx.body = `Local id: ${ctx.state.localId} succesfully deleted`;
  }
});

router.patch('editLocal', '/edit/:localId', loadLocal, checkOwnerUpdate, async (ctx) => {
  const { error } = ctx.body;
  if (error) {
    ctx.status = 400;
  } else {
    ctx.status = 200;
  }
});

module.exports = router;
