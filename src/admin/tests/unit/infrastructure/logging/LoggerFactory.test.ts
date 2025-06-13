import { LoggerFactory } from '../../../../infrastructure/logging/LoggerFactory';

describe('LoggerFactory', () => {
  let originalConsole: any;
  let mockConsole: any;
  let originalEnv: any;
  
  beforeEach(() => {
    // Guardar las funciones originales de console
    originalConsole = {
      debug: console.debug,
      info: console.info,
      warn: console.warn,
      error: console.error
    };
    
    // Crear mocks para las funciones de console
    mockConsole = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    };
    
    // Reemplazar las funciones de console con los mocks
    console.debug = mockConsole.debug;
    console.info = mockConsole.info;
    console.warn = mockConsole.warn;
    console.error = mockConsole.error;
    
    // Guardar el valor original de process.env
    originalEnv = process.env.LOG_LEVEL;
  });
  
  afterEach(() => {
    // Restaurar las funciones originales de console
    console.debug = originalConsole.debug;
    console.info = originalConsole.info;
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;
    
    // Restaurar el valor original de process.env
    process.env.LOG_LEVEL = originalEnv;
  });
  
  it('debería crear un logger con el contexto especificado', () => {
    // Arrange & Act
    const logger = LoggerFactory.getLogger('testContext');
    
    // Assert
    expect(logger).toBeDefined();
    expect(typeof logger.debug).toBe('function');
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.error).toBe('function');
  });
  
  describe('niveles de log', () => {
    it('debería respetar el nivel de log debug', () => {
      // Arrange
      process.env.LOG_LEVEL = 'debug';
      const logger = LoggerFactory.getLogger('testContext');
      
      // Act
      logger.debug('mensaje debug');
      logger.info('mensaje info');
      logger.warn('mensaje warn');
      logger.error('mensaje error');
      
      // Assert
      expect(mockConsole.debug).toHaveBeenCalledWith(expect.stringContaining('[DEBUG] [testContext] mensaje debug'));
      expect(mockConsole.info).toHaveBeenCalledWith(expect.stringContaining('[INFO] [testContext] mensaje info'));
      expect(mockConsole.warn).toHaveBeenCalledWith(expect.stringContaining('[WARN] [testContext] mensaje warn'));
      expect(mockConsole.error).toHaveBeenCalledWith(expect.stringContaining('[ERROR] [testContext] mensaje error'));
    });
    
    it('debería respetar el nivel de log info', () => {
      // Arrange
      process.env.LOG_LEVEL = 'info';
      const logger = LoggerFactory.getLogger('testContext');
      
      // Act
      logger.debug('mensaje debug');
      logger.info('mensaje info');
      logger.warn('mensaje warn');
      logger.error('mensaje error');
      
      // Assert
      expect(mockConsole.debug).not.toHaveBeenCalled();
      expect(mockConsole.info).toHaveBeenCalledWith(expect.stringContaining('[INFO] [testContext] mensaje info'));
      expect(mockConsole.warn).toHaveBeenCalledWith(expect.stringContaining('[WARN] [testContext] mensaje warn'));
      expect(mockConsole.error).toHaveBeenCalledWith(expect.stringContaining('[ERROR] [testContext] mensaje error'));
    });
    
    it('debería respetar el nivel de log warn', () => {
      // Arrange
      process.env.LOG_LEVEL = 'warn';
      const logger = LoggerFactory.getLogger('testContext');
      
      // Act
      logger.debug('mensaje debug');
      logger.info('mensaje info');
      logger.warn('mensaje warn');
      logger.error('mensaje error');
      
      // Assert
      expect(mockConsole.debug).not.toHaveBeenCalled();
      expect(mockConsole.info).not.toHaveBeenCalled();
      expect(mockConsole.warn).toHaveBeenCalledWith(expect.stringContaining('[WARN] [testContext] mensaje warn'));
      expect(mockConsole.error).toHaveBeenCalledWith(expect.stringContaining('[ERROR] [testContext] mensaje error'));
    });
    
    it('debería respetar el nivel de log error', () => {
      // Arrange
      process.env.LOG_LEVEL = 'error';
      const logger = LoggerFactory.getLogger('testContext');
      
      // Act
      logger.debug('mensaje debug');
      logger.info('mensaje info');
      logger.warn('mensaje warn');
      logger.error('mensaje error');
      
      // Assert
      expect(mockConsole.debug).not.toHaveBeenCalled();
      expect(mockConsole.info).not.toHaveBeenCalled();
      expect(mockConsole.warn).not.toHaveBeenCalled();
      expect(mockConsole.error).toHaveBeenCalledWith(expect.stringContaining('[ERROR] [testContext] mensaje error'));
    });
  });
});