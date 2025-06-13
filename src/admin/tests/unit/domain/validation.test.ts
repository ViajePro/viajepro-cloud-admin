import { validate, ValidationError } from '../../../domain/validation';
import { z } from 'zod';
import { Result } from '../../../domain/Result';

describe('Validation', () => {
  describe('validate', () => {
    it('debería validar datos correctos y devolver un Result.ok', () => {
      // Arrange
      const schema = z.object({
        name: z.string(),
        age: z.number().positive()
      });
      
      const validData = {
        name: 'Juan',
        age: 30
      };
      
      // Act
      const result = validate(schema, validData);
      
      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.getValue()).toEqual(validData);
    });
    
    it('debería rechazar datos inválidos y devolver un Result.fail', () => {
      // Arrange
      const schema = z.object({
        name: z.string().min(3),
        age: z.number().positive()
      });
      
      const invalidData = {
        name: 'J', // Muy corto
        age: -5    // Negativo
      };
      
      // Act
      const result = validate(schema, invalidData);
      
      // Assert
      expect(result.isSuccess).toBe(false);
      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBe('Error de validación');
    });
    
    it('debería manejar errores inesperados', () => {
      // Arrange
      const schema = z.object({
        name: z.string()
      });
      
      // Simulamos un error que no es de Zod
      jest.spyOn(schema, 'parse').mockImplementation(() => {
        throw new Error('Error inesperado de prueba');
      });
      
      // Act
      const result = validate(schema, { name: 'test' });
      
      // Assert
      expect(result.isSuccess).toBe(false);
      expect(result.isFailure).toBe(true);
      expect(result.getError()).toContain('Error inesperado');
      expect(result.getError()).toContain('Error inesperado de prueba');
    });
    
    it('debería manejar errores desconocidos que no son instancias de Error', () => {
      // Arrange
      const schema = z.object({
        name: z.string()
      });
      
      // Simulamos un error que no es una instancia de Error
      jest.spyOn(schema, 'parse').mockImplementation(() => {
        throw 'No soy una instancia de Error';
      });
      
      // Act
      const result = validate(schema, { name: 'test' });
      
      // Assert
      expect(result.isSuccess).toBe(false);
      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBe('Error inesperado: Error desconocido');
    });
  });
  
  describe('ValidationError', () => {
    it('debería crear una instancia de ValidationError con mensaje', () => {
      // Arrange & Act
      const error = new ValidationError('Error de validación');
      
      // Assert
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('ValidationError');
      expect(error.message).toBe('Error de validación');
      expect(error.details).toBeUndefined();
    });
    
    it('debería crear una instancia de ValidationError con mensaje y detalles', () => {
      // Arrange
      const details = [
        { path: 'name', message: 'Requerido' },
        { path: 'age', message: 'Debe ser positivo' }
      ];
      
      // Act
      const error = new ValidationError('Error de validación', details);
      
      // Assert
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('ValidationError');
      expect(error.message).toBe('Error de validación');
      expect(error.details).toEqual(details);
    });
  });
});