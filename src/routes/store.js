const KoaRouter = require('koa-router');
const { Op } = require('sequelize');
const AWS = require('aws-sdk');
const fs = require('fs');
const { sendOwnerEmail, sendGetFitEmail, sendBuyerEmail } = require('../mailers/storeMailer');

const router = new KoaRouter();

const BUCKET_NAME = process.env.BUCKET_NAME_AWS;
const IAM_USER_KEY = process.env.ACCESS_KEY_ID_AWS_STORAGE;
const IAM_USER_SSKEY = process.env.SECRET_ACCESS_KEY_AWS_STORAGE;

async function products(ctx, next) {
  ctx.state.allProduct = await ctx.orm.products.findAll();
  return next();
}

async function loadProduct(ctx, next) {
  try {
    ctx.state.product = await ctx.orm.products.findByPk(ctx.params.id);
  } catch (e) {
    ctx.state.product = { name: 'Inexistente', id: -1 };
  }
  return next();
}

async function loadUser(ctx, next) {
  ctx.state.userInfo = await ctx.orm.users.findByPk(ctx.state.product.userId);
  return next();
}

async function checkProduct(ctx, next) {
  if (ctx.session.currentUser) {
    const productIds = [];
    ctx.state.currentUser.cart.forEach((id) => {
      productIds.push(id);
    });
    if (productIds.length > 0) {
      ctx.state.availableProducts = await ctx.orm.products.findAll({
        where: {
          id: {
            [Op.or]: productIds,
          },
        },
      });
    } else {
      ctx.state.availableProducts = null;
    }
    if (ctx.state.availableProducts) {
      ctx.state.currentUser.cart = [];
      ctx.state.availableProducts.forEach((product) => {
        ctx.state.currentUser.cart.push(Number(product.id));
      });
    }
    ctx.session.currentUser.cart = ctx.state.currentUser.cart;
  }
  return next();
}

async function discardProduct(ctx, next) {
  const productIds = [];
  ctx.state.currentUser.cart.forEach((id) => {
    if (!(id === Number(ctx.params.id))) {
      productIds.push(id);
    }
  });
  ctx.state.currentUser.cart = productIds;
  return next();
}

async function calculateCart(ctx, next) {
  if (ctx.session.currentUser) {
    ctx.state.priceCart = 0;
    ctx.state.availableProducts.forEach((product) => {
      ctx.state.priceCart += Number(product.precio);
    });
  }
  return next();
}

async function loadSaleData(ctx, next) {
  const productsOwners = await ctx.orm.products.findAll({
    where: {
      id: {
        [Op.or]: ctx.session.currentUser.cart,
      },
    },
    include: {
      association: ctx.orm.products.users,
      as: 'owners',
    },
  });
  if (productsOwners) {
    if (productsOwners.length > 0) {
      ctx.state.saleData = productsOwners;
    }
  }
  return next();
}

async function sendEmailSoldOwners(ctx, next) {
  if (ctx.state.saleData) {
    try {
      ctx.state.saleData.forEach((product) => {
        sendOwnerEmail(ctx, {
          product,
          user: product.user,
        });
      });
    } catch (e) {
      console.log(e);
    }
  }
  return next();
}

async function sendEmailBuyer(ctx, next) {
  if (ctx.state.saleData) {
    try {
      const user = await ctx.orm.users.findByPk(ctx.session.currentUser.id);
      await sendBuyerEmail(ctx, {
        products: ctx.state.saleData,
        priceCart: ctx.state.priceCart,
        user,
      });
    } catch (e) {
      console.log(e);
    }
  }
  return next();
}

async function sendEmailGetFit(ctx, next) {
  if (ctx.state.saleData) {
    try {
      await sendGetFitEmail(ctx, {
        products: ctx.state.saleData,
      });
    } catch (e) {
      console.log(e);
    }
  }
  return next();
}

async function deleteProducts(ctx, next) {
  ctx.session.currentUser.cart = [];
  for (let index = 0; index < ctx.state.saleData.length; index++) {
    // eslint-disable-next-line no-await-in-loop
    await ctx.state.saleData[index].destroy();
  }
  return next();
}

async function uploadFileStore(ctx, next) {
  const files = ctx.request.files.foto;
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
          Bucket: 'getfit-storage/store',
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
      ctx.request.body.foto = results[0].Location;
    } catch (error) {
      console.error(error);
      ctx.state.error = error;
    }
  }
  return next();
}

router.get('store', '/', products, async (ctx) => {
  if (ctx.session.currentUser) {
    await ctx.render('store/index', {
      allProducts: ctx.state.allProduct,
      productPath: (id) => ctx.router.url('product', id),
      createProductPath: ctx.router.url('createProduct'),
      shoppingCartPath: ctx.router.url('shoppingCart'),
    });
  } else {
    ctx.redirect(ctx.router.url('index'));
  }
});

router.get('product', '/:id/info', loadProduct, loadUser, async (ctx) => {
  if (ctx.session.currentUser) {
    const { product, userInfo } = ctx.state;
    await ctx.render('store/product', {
      product,
      userInfo,
      addCartPath: ctx.router.url('addCart', product.id),
      storePath: ctx.router.url('store'),
    });
  } else {
    ctx.redirect(ctx.router.url('index'));
  }
});

router.get('shoppingCart', '/cart', checkProduct, async (ctx) => {
  if (ctx.session.currentUser) {
    const { availableProducts } = ctx.state;
    await ctx.render('store/shoppingCart', {
      availableProducts,
      storePath: ctx.router.url('store'),
      discardProductCartPath: (id) => ctx.router.url('discardProductCart', id),
      endShopping: ctx.router.url('payProducts'),
    });
  } else {
    ctx.redirect(ctx.router.url('index'));
  }
});

router.get('payProducts', '/pay', checkProduct, calculateCart, async (ctx) => {
  if (ctx.session.currentUser) {
    const { priceCart, availableProducts } = ctx.state;
    await ctx.render('store/submitShop', {
      priceCart,
      availableProducts,
      shoppingCartPath: ctx.router.url('shoppingCart'),
      endShopping: ctx.router.url('payingProducts'),
    });
  } else {
    ctx.redirect(ctx.router.url('index'));
  }
});

router.post('payingProducts', '/paying', checkProduct, calculateCart, loadSaleData, sendEmailSoldOwners, sendEmailBuyer, sendEmailGetFit, deleteProducts, async (ctx) => {
  ctx.redirect(ctx.router.url('shoppingCart'));
});

router.get('createProduct', '/create', async (ctx) => {
  if (ctx.session.currentUser) {
    const newProduct = await ctx.orm.products.build();
    await ctx.render('store/new', {
      newProduct,
      storePath: ctx.router.url('store'),
      createRequestPath: ctx.router.url('creatingProduct'),
    });
  } else {
    ctx.redirect(ctx.router.url('index'));
  }
});

router.post('creatingProduct', '/creating', uploadFileStore, async (ctx) => {
  if (!(ctx.state.error)) {
    const newProduct = await ctx.orm.products.build({
      userId: ctx.session.currentUser.id,
      name: ctx.request.body.name,
      precio: ctx.request.body.precio,
      tipo: ctx.request.body.tipo,
      estado: ctx.request.body.estado,
      foto: ctx.request.body.foto,
      descripcion: ctx.request.body.descripcion,
    });
    console.log('Body:', ctx.request.body);
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
  } else {
    const newProduct = await ctx.orm.products.build({
      userId: ctx.session.currentUser.id,
      name: ctx.request.body.name,
      precio: ctx.request.body.precio,
      tipo: ctx.request.body.tipo,
      estado: ctx.request.body.estado,
      foto: null,
      descripcion: ctx.request.body.descripcion,
    });
    await ctx.render('store/new', {
      errors: ctx.state.error,
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

router.post('addCart', '/:id/add/product/cart', async (ctx) => {
  ctx.session.currentUser.cart.push(Number(ctx.params.id));
  ctx.redirect(ctx.router.url('store'));
});

router.post('discardProductCart', '/:id/discard/producto', discardProduct, async (ctx) => {
  ctx.redirect(ctx.router.url('shoppingCart'));
});

module.exports = router;
