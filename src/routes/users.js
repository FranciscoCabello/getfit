const KoaRouter = require('koa-router');
const bcrypt = require('bcrypt');
const AWS = require('aws-sdk');
const fs = require('fs');

const router = new KoaRouter();

const USER_FIELDS = [
  'name',
  'lastname',
  'password',
  'email',
  'phone',
  'photo',
  'admin',
];

const BANK_FIELDS = [
  'name',
  'account',
  'bank',
  'email',
  'rut',
  'type',
  'userId',
];

const BUCKET_NAME = process.env.BUCKET_NAME_AWS;
const IAM_USER_KEY = process.env.ACCESS_KEY_ID_AWS_STORAGE;
const IAM_USER_SSKEY = process.env.SECRET_ACCESS_KEY_AWS_STORAGE;

async function uploadFileUsers(ctx, next) {
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
          Bucket: 'getfit-storage/users',
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

async function getUser(ctx, next) {
  if (ctx.session.currentUser) {
    ctx.state.user = await ctx.orm.users.findByPk(ctx.session.currentUser.id);
  }
  return next();
}

async function owner(ctx, next) {
  if (ctx.session.currentUser) {
    ctx.state.user = await ctx.orm.users.findByPk(ctx.session.currentUser.id, {
      include: {
        association: ctx.orm.users.ownerLocals,
        as: 'locals',
      },
    });
  }
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
  if (ctx.session.currentUser) {
    ctx.state.products = await ctx.orm.products.findAll({ where: { userId: ctx.session.currentUser.id } });
  }
  return next();
}

async function loadBank(ctx, next) {
  if (ctx.session.currentUser) {
    ctx.state.bank = await ctx.orm.bank.findOne({ where: { userId: ctx.session.currentUser.id } });
  }
  return next();
}

async function verifyRut(ctx, next) {
  const { rut } = ctx.request.body;
  if (rut) {
    console.log(rut);
  } else {
    ctx.state.errorAccount = ['Rut invalido'];
  }
  return next();
}

router.get('users-signup', '/signup', async (ctx) => {
  const user = await ctx.orm.users.build();
  await ctx.render('users/signup', {
    user,
    pathForm: ctx.router.url('users-signup-post'),
  });
});

router.post('users-signup-post', '/createUser', uploadFileUsers, async (ctx) => {
  if (ctx.state.error) {
    ctx.redirect(ctx.router.url('users-signup'));
  } else {
    try {
      ctx.request.body.admin = 0;
      console.log(ctx.request.body.admin);
      const createUser = await ctx.orm.users.build(ctx.request.body);
      await createUser.save({ fields: USER_FIELDS });
      ctx.redirect(ctx.router.url('users-login'));
    } catch (error) {
      ctx.redirect(ctx.router.url('users-signup'));
    }
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
        cart: [],
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

router.get('users-logout', '/logOut', async (ctx) => {
  if (ctx.state.currentUser) {
    ctx.session.currentUser = null;
    ctx.redirect(ctx.router.url('index'));
  } else {
    ctx.redirect(ctx.router.url('index'));
  }
});

router.get('userProfile', '/profile', owner, loadProduct, loadBank, async (ctx) => {
  if (ctx.session.currentUser) {
    const { user, products, bank } = ctx.state;
    const ownedLocals = user.locals;
    await ctx.render('users/profile', {
      user,
      pathForm: ctx.router.url('user-update', ctx.session.currentUser.id),
      del: ctx.router.url('user-delete', ctx.session.currentUser.id),
      index: ctx.router.url('index'),
      ownedLocals,
      bankAccount: bank,
      createBankAccountPath: ctx.router.url('createBankAccount'),
      deleteBankAccountPath: ctx.router.url('deleteBankAccount'),
      viewLocalOwnerPath: (id) => ctx.router.url('viewLocalOwner', id),
      subscriptionLocalPath: ctx.router.url('subscriptionLocals', ctx.session.currentUser.id),
      subscriptionActivitiesPath: ctx.router.url('subscribedActivities', ctx.session.currentUser.id),
      products,
      destroyProductPath: (id) => ctx.router.url('deleteProduct', id),
    });
  } else {
    ctx.redirect(ctx.router.url('index'));
  }
});

router.get('createBankAccount', '/bankAccount', async (ctx) => {
  if (ctx.session.currentUser) {
    await ctx.render('bank/create', {
      userProfilePath: ctx.router.url('userProfile'),
      addBankAccount: ctx.router.url('creatingBankAccount'),
    });
  } else {
    ctx.redirect(ctx.router.url('index'));
  }
});

router.post('creatingBankAccount', '/creating/bankAccount', verifyRut, async (ctx) => {
  ctx.request.body.userId = ctx.session.currentUser.id;
  if (!(ctx.state.errorAccount)) {
    try {
      const createBankAccount = await ctx.orm.bank.build(ctx.request.body);
      await createBankAccount.save({ fields: BANK_FIELDS });
      ctx.redirect(ctx.router.url('userProfile'));
    } catch (error) {
      console.log(error);
      await ctx.render('bank/create', {
        errors: ctx.state.errorAccount,
        userProfilePath: ctx.router.url('userProfile'),
        addBankAccount: ctx.router.url('creatingBankAccount'),
      });
    }
  } else {
    await ctx.render('bank/create', {
      errors: ctx.state.errorAccount,
      userProfilePath: ctx.router.url('userProfile'),
      addBankAccount: ctx.router.url('creatingBankAccount'),
    });
  }
});

router.post('deleteBankAccount', '/delete/bankAccount', loadBank, async (ctx) => {
  await ctx.state.bank.destroy();
  ctx.redirect(ctx.router.url('userProfile'));
});

router.get('user-update', '/:id/update', getUser, async (ctx) => {
  if (ctx.session.currentUser) {
    const { user } = ctx.state;
    await ctx.render('users/signup', {
      user,
      pathForm: ctx.router.url('user-update-post', user.id),
    });
  }
});

router.post('user-update-post', '/:id/update/post', getUser, uploadFileUsers, async (ctx) => {
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
