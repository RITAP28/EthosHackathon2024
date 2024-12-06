import winston from 'winston';
import { loggerConfig } from './winston.config';
import { Logger, LogMetadata } from './types';

class AppLogger implements Logger {
  private logger: winston.Logger;
  private service: string;

  constructor(service: string) {
    this.service = service;
    this.logger = winston.createLogger(loggerConfig);
  }

  private formatMetadata(metadata?: LogMetadata) {
    return {
      ...metadata,
      service: this.service,
    };
  }

  error(message: string, metadata?: LogMetadata) {
    this.logger.error(message, this.formatMetadata(metadata));
  }

  warn(message: string, metadata?: LogMetadata) {
    this.logger.warn(message, this.formatMetadata(metadata));
  }

  info(message: string, metadata?: LogMetadata) {
    this.logger.info(message, this.formatMetadata(metadata));
  }

  http(message: string, metadata?: LogMetadata) {
    this.logger.http(message, this.formatMetadata(metadata));
  }

  debug(message: string, metadata?: LogMetadata) {
    this.logger.debug(message, this.formatMetadata(metadata));
  }
}

export const createLogger = (service: string): Logger => {
  return new AppLogger(service);
};