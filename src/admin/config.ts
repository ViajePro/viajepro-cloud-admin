export const config = {
  tableName: process.env.TABLE_NAME || 'RemisData-dev',
  stage: process.env.STAGE || 'dev',
  isLocal: process.env.STAGE === 'local' || process.env.AWS_SAM_LOCAL === 'true',
  logLevel: process.env.LOG_LEVEL || 'info',
  region: process.env.AWS_REGION || 'us-east-1'
};