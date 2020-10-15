const KoaRouter = require('koa-router');

const router = new KoaRouter();

async function products(ctx, next) {
  ctx.state.allProduct = await ctx.orm.products.findAll();
  return next();
}

async function loadProduct(ctx, next) {
  ctx.state.product = await ctx.orm.products.findByPk(ctx.params.id);
  return next();
}

async function loadUser(ctx, next) {
  ctx.state.userInfo = await ctx.orm.users.findByPk(ctx.state.product.userId);
  return next();
}

router.get('store', '/', products, async (ctx) => {
  await ctx.render('store/index', {
    allProducts: ctx.state.allProduct,
    productPath: (id) => ctx.router.url('product', id),
    createProductPath: ctx.router.url('createProduct'),
  });
});

router.get('product', '/:id/info', loadProduct, loadUser, async (ctx) => {
  const { product, userInfo } = ctx.state;
  await ctx.render('store/product', {
    product,
    userInfo,
    storePath: ctx.router.url('store'),
  });
});

router.get('createProduct', '/create', async (ctx) => {
  const newProduct = await ctx.orm.products.build();
  await ctx.render('store/new', {
    newProduct,
    storePath: ctx.router.url('store'),
    createRequestPath: ctx.router.url('creatingProduct'),
  });
});

router.post('creatingProduct', '/creating', async (ctx) => {
  const newProduct = await ctx.orm.products.build({
    userId: ctx.session.currentUser.id,
    name: ctx.request.body.name,
    precio: ctx.request.body.precio,
    tipo: ctx.request.body.tipo,
    estado: ctx.request.body.estado,
    foto: ctx.request.body.foto,
    descripcion: ctx.request.body.descripcion,
  });
  try {
    await newProduct.save();
    ctx.redirect(ctx.router.url('store'));
  } catch (e) {
    await ctx.render('store/new', {
      errors: e.errors,
      newProduct,
      storePath: ctx.router.url('store'),
      createRequestPath: ctx.router.url('creatingProduct'),
    });
  }
});

router.post('deleteProduct', '/:id/delete', loadProduct, async (ctx) => {
  const { product } = ctx.state;
  await product.destroy();
  ctx.redirect(ctx.router.url('userProfile'));
});

module.exports = router;
