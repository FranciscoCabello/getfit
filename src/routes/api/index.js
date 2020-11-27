const KoaRouter = require('koa-router');

const usersApi = require('./usersApi');
const localsApi = require('./localsApi');
const activitiesApi = require('./activitiesApi');

const router = new KoaRouter({ prefix: '/api' });

router.use('/users', usersApi.routes());
router.use('/activities', activitiesApi.routes());
router.use('/locals', localsApi.routes());

module.exports = router;
