export interface LogMetadata {
    service?: string;
    userId?: string | number;
    action?: string;
    [key: string]: any;
  }
  
  export interface Logger {
    error(message: string, metadata?: LogMetadata): void;
    warn(message: string, metadata?: LogMetadata): void;
    info(message: string, metadata?: LogMetadata): void;
    http(message: string, metadata?: LogMetadata): void;
    debug(message: string, metadata?: LogMetadata): void;
  }