// import metadata for es7 decorators support
import 'reflect-metadata';
// allow creation of aliases for directories
import 'module-alias/register';
import http from 'http';
import env from '../common/config/env';
import logger from '@app/common/services/logger/logger';
import { App } from './app';

const start = async () => {
    try {
      const app = new App();
      const appServer = app.getServer().build();
      const httpServer = http.createServer(appServer);
    
      httpServer.listen(env.port);
      httpServer.on('listening', () =>
        logger.message(
          `🚀  ${env.service_name} running in ${env.app_env}, listening on ` + env.port
        )
      );
    } catch (err) {
      logger.error(err, 'fatal server error');
    }
};

start();
  
process.once('SIGINT', () => {

});
  
