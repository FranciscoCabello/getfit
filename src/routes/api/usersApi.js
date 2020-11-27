const KoaRouter = require('koa-router');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const router = new KoaRouter();

async function checkLogin(ctx, next) {
  const { email, password } = ctx.request.body;
  const user = await ctx.orm.users.findOne({ where: { email } });
  if (user) {
    const authenticated = await bcrypt.compare(password, user.password);
    if (!authenticated) {
      ctx.state.user = null;
    } else {
      ctx.state.user = user;
    }
  } else {
    ctx.state.user = null;
  }
  return next();
}

router.post('login', '/login', checkLogin, async (ctx) => {
  const { user } = ctx.state;
  if (user) {
    const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET);
    ctx.status = 201;
    ctx.body = { token };
  } else {
    ctx.throw(401, 'Correo o contrasena invalida');
  }
});

module.exports = router;
