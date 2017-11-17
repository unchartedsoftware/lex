export default (config, env, helpers) => {
  const { rule } = helpers.getLoadersByName(config, 'babel-loader')[0];
  const babelConfig = rule.options;
  babelConfig.plugins.push(
    ['babel-plugin-transform-builtin-extend', { globals: ['Error', 'Array'] }]
  );
};
