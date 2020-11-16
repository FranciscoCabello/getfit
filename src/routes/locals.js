const KoaRouter = require('koa-router');
const { Op } = require('sequelize');
const AWS = require('aws-sdk');
const fs = require('fs');

const router = new KoaRouter();

const BUCKET_NAME = process.env.BUCKET_NAME_AWS;
const IAM_USER_KEY = process.env.ACCESS_KEY_ID_AWS_STORAGE;
const IAM_USER_SSKEY = process.env.SECRET_ACCESS_KEY_AWS_STORAGE;
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

async function loadActivitie(ctx, next) {
  ctx.state.activity = await ctx.orm.activities.findByPk(ctx.params.act);
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
  if (ctx.session.currentUser) {
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

async function searchBar(ctx, next) {
  const requestHeader = ctx.request.url.split('locals');
  if (requestHeader.length > 1) {
    let searchParam = requestHeader[1].slice(7, requestHeader[1].length + 1);
    if (searchParam.length > 0) {
      ctx.state.localsApp = [];
      searchParam = searchParam.split('+').join(' ').toLowerCase();
      const searchByName = await ctx.orm.locals.findAll();
      searchByName.forEach((local) => {
        if (local.name.toLowerCase().includes(searchParam)) {
          ctx.state.localsApp.push(local);
        } else if (local.ubicacion.toLowerCase().includes(searchParam)) {
          ctx.state.localsApp.push(local);
        }
      });
    }
  }
  return next();
}

async function uploadFileLocal(ctx, next) {
  const files = ctx.request.files.photo;
  const myFiles = Array.isArray(files) ? files : typeof files === "object" ? [files] : null;
  if (myFiles) {
    try {
      const filePromises = myFiles.map((file) => {
        const s3 = new AWS.S3({
          accessKeyId: IAM_USER_KEY,
          secretAccessKey: IAM_USER_SSKEY,
          Bucket: BUCKET_NAME,
        });
        const { path, name, type } = file;
        const body = fs.createReadStream(path);
        const params = {
          Bucket: 'getfit-storage/local',
          Key: name,
          Body: body,
          ContentType: type,
          ACL: 'public-read',
        };
        return new Promise((resolve, reject) => {
          s3.upload(params, (error, data) => {
            if (error) {
              reject(error);
              return next();
            }
            console.log(data);
            resolve(data);
          });
        });
      });
      const results = await Promise.all(filePromises);
      console.log('Results:', results);
      ctx.request.body.photo = results[0].Location;
    } catch (error) {
      console.error(error);
      ctx.state.error = error;
    }
  }
  return next();
}

async function verifyAdmin(ctx, next) {
  if (ctx.session.currentUser) {
    const user = await ctx.orm.users.findByPk(ctx.session.currentUser.id);
    if (user.admin === 0) {
      ctx.state.admin = false;
    } else {
      ctx.state.admin = true;
    }
  }
  return next();
}

async function isPublic(ctx, next) {
  const localUser = await ctx.orm.locals.findByPk(ctx.params.id, {
    include: {
      association: ctx.orm.locals.ownerLocals,
      as: 'users',
    },
  });
  const userOwner = localUser.users;
  if (userOwner.admin === 1) {
    ctx.state.admin = true;
  } else {
    ctx.state.admin = false;
  }
  return next();
}

router.get('locals', '/', locals, searchBar, async (ctx) => {
  const { localsApp } = ctx.state;
  await ctx.render('locals/index', {
    localsApp,
    searchPath: ctx.router.url('locals'),
    localPath: (id) => ctx.router.url('viewLocalPublic', id),
    viewLocals: ctx.router.url('subscriptionLocals'),
    newLocalPath: ctx.router.url('createLocalSelector'),
    index: ctx.router.url('index'),
  });
});

router.get('createLocalSelector', '/selector', verifyAdmin, async (ctx) => {
  if (ctx.session.currentUser) {
    if (ctx.state.admin) {
      await ctx.render('locals/createLocalSelector', {
        admin: ctx.state.admin,
        createOwnerLocal: ctx.router.url('createPrivateLocal'),
        createPublicLocal: ctx.router.url('createPublicLocal'),
      });
    } else {
      ctx.redirect(ctx.router.url('createPrivateLocal'));
    }
  } else {
    ctx.redirect(ctx.router.url('index'));
  }
});

router.get('createPublicLocal', '/create/pub', async (ctx) => {
  if (ctx.session.currentUser) {
    const local = ctx.orm.locals.build();
    await ctx.render('locals/newPublic', {
      local,
      createLocalPath: ctx.router.url('creatingPublicLocal'),
      localsPath: ctx.router.url('locals'),
    });
  } else {
    ctx.redirect(ctx.router.url('index'));
  }
});

router.post('creatingPublicLocal', '/creating/pub', uploadFileLocal, async (ctx) => {
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
    await ctx.render('locals/newPublic', {
      local,
      errors: error.errors,
      createLocalPath: ctx.router.url('createPublicLocal'),
      localsPath: ctx.router.url('locals'),
    });
  }
});

router.get('createPrivateLocal', '/create/priv', async (ctx) => {
  if (ctx.session.currentUser) {
    const local = await ctx.orm.locals.build();
    await ctx.render('locals/newOwner', {
      local,
      createLocalPath: ctx.router.url('creatingPrivateLocal'),
      localsPath: ctx.router.url('locals'),
    });
  } else {
    ctx.redirect(ctx.router.url('index'));
  }
});

router.post('creatingPrivateLocal', '/creating/priv', uploadFileLocal, async (ctx) => {
  if (ctx.state.error) {
    ctx.request.body.photo = null;
    const local = await ctx.orm.locals.build(ctx.request.body);
    await ctx.render('locals/newOwner', {
      local,
      errors: ctx.state.error,
      createLocalPath: ctx.router.url('creatingPrivateLocal'),
      localsPath: ctx.router.url('locals'),
    });
  } else {
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
  }
});

router.get('viewLocalPublic', '/:id/pub', loadLocal, comments, activities, subscribeActs, isPublic, async (ctx) => {
  const { local, activitiesList, admin } = ctx.state;
  return ctx.render('locals/showPublic', {
    admin,
    local,
    comms: ctx.state.comments,
    createRequestPath: ctx.router.url('requests-create', local.id),
    activitiesList,
    activitiePath: (actId) => ctx.router.url('viewActivityLocal', local.id, actId),
    subscribedAmount: (id) => ctx.state.hashSubscription[id],
    localsPath: ctx.router.url('locals'),
    subcribeLocal: ctx.router.url('subscribeLocal', local.id),
  });
});

router.get('viewActivityLocal', '/:id/pub/activite/:act', loadActivitie, subscribeActs, async (ctx) => {
  const { activity } = ctx.state;
  await ctx.render('activities/show', {
    activity,
    subscribedAmount: (id) => ctx.state.hashSubscription[id],
    localPath: ctx.router.url('viewLocalPublic', ctx.params.id),
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
  if (ctx.session.currentUser) {
    const { local } = ctx.state;
    await ctx.render('locals/edit', {
      local,
      updateLocalPath: ctx.router.url('localUpdate', local.id),
      localOwnerPath: ctx.router.url('viewLocalOwner', local.id),
    });
  } else {
    ctx.redirect(ctx.router.url('index'));
  }
});

router.patch('localUpdate', '/:id/update', loadLocal, uploadFileLocal, async (ctx) => {
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
  if (ctx.session.currentUser) {
    await ctx.render('locals/subscription', {
      listLocals: ctx.state.subscription,
      deleteSubscriptionPath: (id) => ctx.router.url('deleteSubscription', id),
      showLocalPath: (id) => ctx.router.url('viewLocalPublic', id),
      showActivitiesPath: (id) => ctx.router.url('activitiesLocal', id),
    });
  } else {
    ctx.redirect(ctx.router.url('index'));
  }
});

router.post('deleteSubscription', '/:id/delete/subscription', activities, deleteActivities, deleteSubscriptionLocal, async (ctx) => {
  ctx.redirect(ctx.router.url('subscriptionLocals'));
});

router.get('getCommentReact', '/:id/get/comments', loadLocal, comments, async (ctx) => {
  ctx.body = ctx.state.comments;
  ctx.set('Access-Control-Allow-Origin', '*');
  ctx.set('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  ctx.set('Access-Control-Allow-Methods', 'POST, GET, PUT, DELETE, OPTIONS');
});

router.get('getLocals', '/get/locals', locals, async (ctx) => {
  ctx.body = ctx.state.localsApp;
  ctx.set('Access-Control-Allow-Origin', '*');
  ctx.set('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  ctx.set('Access-Control-Allow-Methods', 'POST, GET, PUT, DELETE, OPTIONS');
});

module.exports = router;
