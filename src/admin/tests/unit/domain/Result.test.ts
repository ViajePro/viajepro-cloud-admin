import { Result } from '../../../domain/Result';

describe('Result', () => {
  describe('ok', () => {
    it('debería crear un resultado exitoso', () => {
      // Arrange & Act
      const result = Result.ok<number>(42);
      
      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.isFailure).toBe(false);
      expect(result.getValue()).toBe(42);
    });
    
    it('debería crear un resultado exitoso sin valor', () => {
      // Arrange & Act
      const result = Result.ok();
      
      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.isFailure).toBe(false);
      expect(result.getValue()).toBeUndefined();
    });
    
    it('debería lanzar error al intentar obtener el error de un resultado exitoso', () => {
      // Arrange
      const result = Result.ok<number>(42);
      
      // Act & Assert
      expect(() => result.getError()).toThrow('No se puede obtener el error de un resultado exitoso');
    });
  });
  
  describe('fail', () => {
    it('debería crear un resultado fallido', () => {
      // Arrange & Act
      const errorMessage = 'Error de prueba';
      const result = Result.fail<number>(errorMessage);
      
      // Assert
      expect(result.isSuccess).toBe(false);
      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBe(errorMessage);
    });
    
    it('debería lanzar error al intentar obtener el valor de un resultado fallido', () => {
      // Arrange
      const result = Result.fail<number>('Error de prueba');
      
      // Act & Assert
      expect(() => result.getValue()).toThrow('No se puede obtener el valor de un resultado fallido');
    });
  });
  
  describe('combine', () => {
    it('debería devolver un resultado exitoso si todos los resultados son exitosos', () => {
      // Arrange
      const results = [
        Result.ok<number>(1),
        Result.ok<string>('test'),
        Result.ok<boolean>(true)
      ];
      
      // Act
      const combinedResult = Result.combine(results);
      
      // Assert
      expect(combinedResult.isSuccess).toBe(true);
      expect(combinedResult.isFailure).toBe(false);
    });
    
    it('debería devolver el primer resultado fallido si alguno falla', () => {
      // Arrange
      const errorMessage = 'Error de prueba';
      const results = [
        Result.ok<number>(1),
        Result.fail<string>(errorMessage),
        Result.ok<boolean>(true)
      ];
      
      // Act
      const combinedResult = Result.combine(results);
      
      // Assert
      expect(combinedResult.isSuccess).toBe(false);
      expect(combinedResult.isFailure).toBe(true);
      expect(combinedResult.getError()).toBe(errorMessage);
    });
  });
  
  describe('constructor', () => {
    it('debería lanzar error si se intenta crear un resultado exitoso con error', () => {
      // Act & Assert
      expect(() => {
        // @ts-ignore - Accediendo al constructor privado para probar
        new Result<number>(true, 'Error no debería estar aquí');
      }).toThrow('InvalidOperation: Un resultado exitoso no puede contener un error');
    });
    
    it('debería lanzar error si se intenta crear un resultado fallido sin error', () => {
      // Act & Assert
      expect(() => {
        // @ts-ignore - Accediendo al constructor privado para probar
        new Result<number>(false);
      }).toThrow('InvalidOperation: Un resultado fallido debe contener un error');
    });
  });
});