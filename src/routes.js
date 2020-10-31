const KoaRouter = require('koa-router');

const index = require('./routes/index');
const locals = require('./routes/locals');
const users = require('./routes/users');
const requests = require('./routes/requests');
const activities = require('./routes/activities');
const store = require('./routes/store');

const router = new KoaRouter();

router.use(async (ctx, next) => {
  Object.assign(ctx.state, {
    index: ctx.router.url('index'),
    signIn: ctx.router.url('users-login'),
    logOut: ctx.router.url('users-logout'),
    signUp: ctx.router.url('users-signup'),
    allLocalsPath: ctx.router.url('locals'),
    profileUserPath: ctx.router.url('userProfile'),
    activitiesPath: ctx.router.url('activities'),
    storePath: ctx.router.url('store'),
  });
  return next();
});

router.use(async (ctx, next) => {
  if (ctx.session.currentUser) {
    ctx.state.currentUser = ctx.session.currentUser;
  }
  return next();
});

router.use('/', index.routes());
router.use('/locals', locals.routes());
router.use('/users', users.routes());
router.use('/requests', requests.routes());
router.use('/activities', activities.routes());
router.use('/store', store.routes());

module.exports = router;
