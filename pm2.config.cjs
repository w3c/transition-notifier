module.exports = {
  /**
   * Application configuration section
   * http://pm2.keymetrics.io/docs/usage/application-declaration/
   */
  apps : [
    {
      name      : 'transition-notifier',
      script    : 'index.js',
      env: {
        NODE_ENV: 'production',
        PORT:     '8070'
      },
      error_file : "/var/log/nodejs/transition-notifier.err",
      out_file : "/var/log/nodejs/transition-notifier.log",
      "node_args": "--max_old_space_size=400"
    }
  ]
};
