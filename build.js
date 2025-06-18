const { build } = require('esbuild');
const config = require('./esbuild.config');
const fs = require('fs');
const path = require('path');

// Asegurarse de que el directorio dist existe
if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist', { recursive: true });
}

// Compilar con esbuild
build(config)
  .then(() => {
    console.log('✅ Build completado con éxito');
    
    // Copiar package.json a dist para las dependencias
    const packageJson = require('./package.json');
    
    // Solo incluir las dependencias de producción
    const distPackage = {
      name: packageJson.name,
      version: packageJson.version,
      dependencies: packageJson.dependencies
    };
    
    fs.writeFileSync(
      path.join('dist', 'package.json'),
      JSON.stringify(distPackage, null, 2)
    );
    
    console.log('📦 package.json copiado a dist');
  })
  .catch((error) => {
    console.error('❌ Error en el build:', error);
    process.exit(1);
  });