const KoaRouter = require('koa-router');

const index = require('./routes/index');
const locals = require('./routes/locals');
const users = require('./routes/users');
const test = require('./routes/test');
const requests = require('./routes/requests');
const activities = require('./routes/activities')

const router = new KoaRouter();

router.use('/', index.routes());
router.use('/locals', locals.routes());
router.use('/users', users.routes());
router.use('/requests', requests.routes());
router.use('/testing', test.routes());
router.use('/activities', activities.routes());

module.exports = router;