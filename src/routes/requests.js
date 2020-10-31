const KoaRouter = require('koa-router');

const router = new KoaRouter();

// TIPO 0 CORRESPONDE A CREAR Y TIPO 1 CORRESPONDE A ACTUALIZAR

const PERMITTED_FIELDS = [
  'tipo',
  'comentario',
  'localId',
];

router.post('requests-create', '/:id/creating', async (ctx) => {
  const request = await ctx.orm.requests.build({
    tipo: ctx.request.body.tipo,
    comentario: ctx.request.body.comentario,
    localId: ctx.params.id,
  });
  try {
    await request.save({ fields: PERMITTED_FIELDS });
    ctx.redirect(ctx.router.url('viewLocalPublic', ctx.params.id));
  } catch (error) {
    await ctx.render('requests/new', {
      errors: error.errors,
      request,
      createRequestPath: ctx.router.url('requests-create', ctx.params.id),
      localPath: ctx.router.url('viewLocalPublic', ctx.params.id),
    });
  }
});

router.post('requests-destroy', '/:idLocal/:idComment/delete', async (ctx) => {
  await ctx.orm.requests.destroy({ where: { id: ctx.params.idComment } });
  ctx.redirect(ctx.router.url('viewLocalOwner', ctx.params.idLocal));
});

module.exports = router;
