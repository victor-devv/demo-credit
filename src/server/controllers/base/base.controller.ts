import { injectable } from 'inversify';
import { Response, Request } from 'express';
import HttpStatus from 'http-status-codes';
import _ from 'lodash';
import {
  Query,
  DuplicateModelError,
  ModelNotFoundError,
  RepositoryError
} from '@app/data/base';
import { ControllerError } from '.';
import logger from '@app/common/services/logger/logger';
import { MetricsService } from '@app/server/services';

type PaginationOptions = Pick<
  Query,
  Exclude<keyof Query, 'conditions' | 'archived'>
>;

@injectable()
export class BaseController {
  /*
   * Determines the HTTP status code of an error
   * @param err Error object
   */
  getHTTPErrorCode(err) {
    // check if error code exists and is a valid HTTP code.
    if (err.code >= 100 && err.code < 600) return err.code;

    if (err instanceof ModelNotFoundError) return HttpStatus.NOT_FOUND;
    if (err instanceof DuplicateModelError) return HttpStatus.BAD_REQUEST;
    return HttpStatus.BAD_REQUEST;
  }

  /**
   * Handles operation success and sends a HTTP response
   * @param req Express request
   * @param res Express response
   * @param data Success data
   */
  handleSuccess(req: Request, res: Response, data: any) {
    res.jSend.success(data);
    logger.logAPIResponse(req, res);
    MetricsService.record(req, res);
  }

  /**
   * Handles operation error, sends a HTTP response and logs the error.
   * @param req Express request
   * @param res Express response
   * @param error Error object
   * @param message Optional error message. Useful for hiding internal errors from clients.
   */
  handleError(req: Request, res: Response, err: Error, message?: string) {
    /**
     * Useful when we call an asynchrous function that might throw
     * after we've sent a response to client
     */
    if (res.headersSent) return logger.error(err);

    /**
     * Custom class error message supercedes generic error message
     */
    if (
      message &&
      (err instanceof ControllerError || err instanceof RepositoryError)
    )
      message = null;

    let error_code;
    const controller_err = <ControllerError>err;
    error_code = controller_err.error_code;

    //@ts-ignore
    if (err.data?.error_code) {
      //@ts-ignore
      error_code = err.data?.error_code;
    }

    const errorMessage = message || err.message;

    res.jSend.error(null, errorMessage, this.getHTTPErrorCode(err), error_code);
    logger.logAPIError(req, res, err);
    MetricsService.record(req, res);
  }

  getPaginationOptions(query: any): PaginationOptions {
    return _.pick(query, ['page', 'per_page', 'projections', 'sort']);
  }
}
