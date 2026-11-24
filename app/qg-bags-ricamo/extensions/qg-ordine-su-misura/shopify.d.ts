import '@shopify/ui-extensions';

//@ts-ignore
declare module './src/ActionExtension.jsx' {
  const shopify: import('@shopify/ui-extensions/admin.order-index.action.render').Api;
  const globalThis: { shopify: typeof shopify };
}

//@ts-ignore
declare module './src/ordine.mjs' {
  const shopify: import('@shopify/ui-extensions/admin.order-index.action.render').Api;
  const globalThis: { shopify: typeof shopify };
}
