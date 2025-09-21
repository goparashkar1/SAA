declare module "*.png";

// Allow importing JSX modules (Dashboard and other React .jsx files)
declare module "*.jsx" {
  const component: any;
  export default component;
}

// Also allow plain JS React components if needed
declare module "*.js" {
  const component: any;
  export default component;
}
