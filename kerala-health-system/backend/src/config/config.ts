import dotenv from 'dotenv';

dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '4000', 10),
  
  // Database
  database: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgres123@localhost:5432/kerala_health',
  },
  
  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshSecret: process.env.REFRESH_TOKEN_SECRET || 'your-refresh-token-secret',
  },
  
  // MinIO Configuration
  minio: {
    endpoint: process.env.MINIO_ENDPOINT || 'localhost',
    port: parseInt(process.env.MINIO_PORT || '9000', 10),
    accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
    secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
    bucket: process.env.MINIO_BUCKET || 'kerala-health-attachments',
    useSSL: process.env.MINIO_USE_SSL === 'true',
  },
  
  // Redis Configuration
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  
  // Encryption
  encryption: {
    key: process.env.ENCRYPTION_KEY || 'your-32-character-encryption-key',
  },
  
  // ABHA Integration
  abha: {
    baseUrl: process.env.ABHA_BASE_URL || 'https://dev.abdm.gov.in',
    clientId: process.env.ABHA_CLIENT_ID || 'mock-client-id',
    clientSecret: process.env.ABHA_CLIENT_SECRET || 'mock-client-secret',
  },
  
  // Government APIs
  government: {
    keralaApiKey: process.env.KERALA_GOVT_API_KEY || 'placeholder-kerala-api',
    idspEndpoint: process.env.IDSP_API_ENDPOINT || 'https://idsp.mohfw.gov.in/api',
    idspApiKey: process.env.IDSP_API_KEY || 'placeholder-idsp-api',
  },
  
  // Email Configuration
  email: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
  
  // Analytics & ML
  analytics: {
    enabled: process.env.ENABLE_ANALYTICS === 'true',
    modelPath: process.env.ML_MODEL_PATH || './models/',
    alertThreshold: parseInt(process.env.ALERT_THRESHOLD || '10', 10),
  },
  
  // Audit & Blockchain
  audit: {
    enabled: process.env.AUDIT_ENABLED === 'true',
    blockchainEnabled: process.env.BLOCKCHAIN_ENABLED === 'true',
    blockchainNetwork: process.env.BLOCKCHAIN_NETWORK || 'ethereum-testnet',
  },
  
  // Frontend URLs
  frontend: {
    url: process.env.FRONTEND_URL || 'http://localhost:3000',
    adminUrl: process.env.ADMIN_FRONTEND_URL || 'http://localhost:3000/admin',
  },
  
  // File Upload
  upload: {
    maxFileSize: process.env.MAX_FILE_SIZE || '10MB',
    allowedTypes: (process.env.ALLOWED_FILE_TYPES || 'pdf,jpg,jpeg,png,doc,docx').split(','),
  },
  
  // CORS
  cors: {
    origins: [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://kerala-health.gov.in',
    ],
  },
  
  // Rate Limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
  },
  
  // QR Code Configuration
  qr: {
    baseUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
    expiryDays: 365 * 2, // 2 years
  },
  
  // Supported Languages
  languages: {
    supported: ['en', 'hi', 'ml'],
    default: 'ml',
  },
  
  // Kerala Districts for validation
  kerala: {
    districts: [
      'Thiruvananthapuram', 'Kollam', 'Pathanamthitta', 'Alappuzha', 'Kottayam',
      'Idukki', 'Ernakulam', 'Thrissur', 'Palakkad', 'Malappuram',
      'Kozhikode', 'Wayanad', 'Kannur', 'Kasaragod'
    ],
  },
};