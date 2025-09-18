#!/bin/bash

# Kerala Health System - Database Seeding Script
# This script generates sample data and seeds the database

set -e

echo "🏥 Kerala Health System - Database Seeding"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}Error: Please run this script from the project root directory${NC}"
    exit 1
fi

# Check if Node.js is available for data generation
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is required for data generation${NC}"
    exit 1
fi

# Function to check if service is ready
wait_for_service() {
    local service=$1
    local port=$2
    local max_attempts=30
    local attempt=1
    
    echo -e "${YELLOW}Waiting for $service to be ready...${NC}"
    
    while [ $attempt -le $max_attempts ]; do
        if nc -z localhost $port 2>/dev/null; then
            echo -e "${GREEN}✓ $service is ready${NC}"
            return 0
        fi
        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    echo -e "${RED}✗ $service failed to start within expected time${NC}"
    return 1
}

# Function to check database connection
check_database() {
    echo -e "${YELLOW}Checking database connection...${NC}"
    
    # Try to connect to PostgreSQL
    if docker-compose exec -T postgres psql -U postgres -d kerala_health -c "SELECT 1;" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Database connection successful${NC}"
        return 0
    else
        echo -e "${RED}✗ Cannot connect to database${NC}"
        return 1
    fi
}

# Start services if not running
echo -e "${BLUE}Step 1: Starting services...${NC}"
if ! docker-compose ps | grep -q "Up"; then
    echo "Starting Docker services..."
    docker-compose up -d postgres redis minio
else
    echo "Services are already running"
fi

# Wait for services to be ready
wait_for_service "PostgreSQL" 5432
wait_for_service "Redis" 6379
wait_for_service "MinIO" 9000

# Wait a bit more for services to fully initialize
sleep 5

# Check database connection
if ! check_database; then
    echo -e "${RED}Database is not ready. Please check the logs:${NC}"
    echo "docker-compose logs postgres"
    exit 1
fi

# Generate sample data
echo -e "${BLUE}Step 2: Generating sample data...${NC}"
cd seed
if [ ! -d "node_modules" ]; then
    echo "Installing Node.js dependencies..."
    npm init -y > /dev/null 2>&1
    npm install bcryptjs > /dev/null 2>&1
fi

node generate-data.js

if [ ! -d "generated" ] || [ ! -f "generated/patients.json" ]; then
    echo -e "${RED}Error: Data generation failed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Sample data generated successfully${NC}"
cd ..

# Run database migrations
echo -e "${BLUE}Step 3: Running database migrations...${NC}"
cd backend

# Install backend dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing backend dependencies..."
    npm install > /dev/null 2>&1
fi

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate > /dev/null 2>&1

# Run migrations
echo "Running database migrations..."
npx prisma db push --force-reset > /dev/null 2>&1

echo -e "${GREEN}✓ Database migrations completed${NC}"

# Seed the database
echo -e "${BLUE}Step 4: Seeding database with sample data...${NC}"

# Create seed script
cat > seed-db.js << 'EOF'
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function seedDatabase() {
    try {
        console.log('🌱 Seeding database...');
        
        // Read generated data
        const dataPath = path.join(__dirname, '../seed/generated');
        
        const users = JSON.parse(fs.readFileSync(path.join(dataPath, 'users.json'), 'utf8'));
        const patients = JSON.parse(fs.readFileSync(path.join(dataPath, 'patients.json'), 'utf8'));
        const encounters = JSON.parse(fs.readFileSync(path.join(dataPath, 'encounters.json'), 'utf8'));
        const observations = JSON.parse(fs.readFileSync(path.join(dataPath, 'observations.json'), 'utf8'));
        const immunizations = JSON.parse(fs.readFileSync(path.join(dataPath, 'immunizations.json'), 'utf8'));
        
        console.log(`📊 Data loaded:`);
        console.log(`   - Users: ${users.length}`);
        console.log(`   - Patients: ${patients.length}`);
        console.log(`   - Encounters: ${encounters.length}`);
        console.log(`   - Observations: ${observations.length}`);
        console.log(`   - Immunizations: ${immunizations.length}`);
        
        // Seed users first
        console.log('👥 Seeding users...');
        for (const user of users) {
            await prisma.user.create({
                data: {
                    ...user,
                    createdAt: new Date(user.createdAt),
                    updatedAt: new Date(user.updatedAt),
                    lastLogin: user.lastLogin ? new Date(user.lastLogin) : null,
                }
            });
        }
        console.log(`✓ ${users.length} users seeded`);
        
        // Seed patients
        console.log('🏥 Seeding patients...');
        let patientCount = 0;
        for (const patient of patients) {
            await prisma.patient.create({
                data: {
                    ...patient,
                    birthDate: new Date(patient.birthDate),
                    cardIssued: patient.cardIssued ? new Date(patient.cardIssued) : null,
                    cardExpiry: patient.cardExpiry ? new Date(patient.cardExpiry) : null,
                    createdAt: new Date(patient.createdAt),
                    updatedAt: new Date(patient.updatedAt),
                }
            });
            patientCount++;
            if (patientCount % 100 === 0) {
                console.log(`   Processed ${patientCount}/${patients.length} patients`);
            }
        }
        console.log(`✓ ${patients.length} patients seeded`);
        
        // Create default consents for all patients
        console.log('📋 Creating default consents...');
        const patientIds = patients.map(p => p.id);
        for (const patientId of patientIds) {
            await prisma.consent.create({
                data: {
                    patientId,
                    status: 'ACTIVE',
                    dataSharing: true,
                    analytics: true,
                    research: Math.random() > 0.7,
                    marketing: Math.random() > 0.8,
                    dateTime: new Date(),
                }
            });
        }
        console.log(`✓ ${patientIds.length} consents created`);
        
        // Get clinician IDs for encounters
        const clinicians = await prisma.user.findMany({
            where: { role: 'CLINICIAN' },
            select: { id: true, facility: true }
        });
        
        // Seed encounters
        console.log('🏥 Seeding encounters...');
        let encounterCount = 0;
        for (const encounter of encounters) {
            // Assign random clinician
            const clinician = clinicians[Math.floor(Math.random() * clinicians.length)];
            
            await prisma.encounter.create({
                data: {
                    ...encounter,
                    clinicianId: clinician.id,
                    startTime: new Date(encounter.startTime),
                    endTime: encounter.endTime ? new Date(encounter.endTime) : null,
                    createdAt: new Date(encounter.createdAt),
                    updatedAt: new Date(encounter.updatedAt),
                }
            });
            encounterCount++;
            if (encounterCount % 100 === 0) {
                console.log(`   Processed ${encounterCount}/${encounters.length} encounters`);
            }
        }
        console.log(`✓ ${encounters.length} encounters seeded`);
        
        // Seed observations
        console.log('📈 Seeding observations...');
        let obsCount = 0;
        for (const observation of observations) {
            await prisma.observation.create({
                data: {
                    ...observation,
                    effectiveDateTime: new Date(observation.effectiveDateTime),
                    createdAt: new Date(observation.createdAt),
                    updatedAt: new Date(observation.updatedAt),
                }
            });
            obsCount++;
            if (obsCount % 200 === 0) {
                console.log(`   Processed ${obsCount}/${observations.length} observations`);
            }
        }
        console.log(`✓ ${observations.length} observations seeded`);
        
        // Seed immunizations
        console.log('💉 Seeding immunizations...');
        for (const immunization of immunizations) {
            await prisma.immunization.create({
                data: {
                    ...immunization,
                    expirationDate: immunization.expirationDate ? new Date(immunization.expirationDate) : null,
                    occurrenceDateTime: new Date(immunization.occurrenceDateTime),
                    createdAt: new Date(immunization.createdAt),
                    updatedAt: new Date(immunization.updatedAt),
                }
            });
        }
        console.log(`✓ ${immunizations.length} immunizations seeded`);
        
        // Create some sample alerts
        console.log('🚨 Creating sample alerts...');
        const districts = ['Ernakulam', 'Thiruvananthapuram', 'Kozhikode', 'Thrissur'];
        for (let i = 0; i < 5; i++) {
            await prisma.alert.create({
                data: {
                    type: ['DISEASE_OUTBREAK', 'VACCINATION_DUE', 'FOLLOW_UP_REQUIRED'][Math.floor(Math.random() * 3)],
                    severity: ['LOW', 'MEDIUM', 'HIGH'][Math.floor(Math.random() * 3)],
                    status: 'ACTIVE',
                    title: `Sample Alert ${i + 1}`,
                    description: `This is a sample alert for demonstration purposes`,
                    district: districts[Math.floor(Math.random() * districts.length)],
                    affectedCount: Math.floor(Math.random() * 50) + 10,
                    threshold: 10,
                    actualValue: Math.floor(Math.random() * 50) + 15,
                    detectedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
                }
            });
        }
        console.log(`✓ 5 sample alerts created`);
        
        // Create patient access records
        console.log('🔐 Creating patient access records...');
        const samplePatients = patients.slice(0, 100); // First 100 patients
        for (const patient of samplePatients) {
            // Give access to random clinicians
            const randomClinicians = clinicians.sort(() => 0.5 - Math.random()).slice(0, 2);
            for (const clinician of randomClinicians) {
                await prisma.patientAccess.create({
                    data: {
                        patientId: patient.id,
                        userId: clinician.id,
                        accessType: 'FULL',
                        reason: 'Clinical care',
                        grantedAt: new Date(),
                    }
                });
            }
        }
        console.log(`✓ Patient access records created`);
        
        console.log('🎉 Database seeding completed successfully!');
        
        // Print summary
        const summary = await prisma.$transaction([
            prisma.user.count(),
            prisma.patient.count(),
            prisma.encounter.count(),
            prisma.observation.count(),
            prisma.immunization.count(),
            prisma.consent.count(),
            prisma.alert.count(),
            prisma.patientAccess.count(),
        ]);
        
        console.log('\n📊 Database Summary:');
        console.log(`   Users: ${summary[0]}`);
        console.log(`   Patients: ${summary[1]}`);
        console.log(`   Encounters: ${summary[2]}`);
        console.log(`   Observations: ${summary[3]}`);
        console.log(`   Immunizations: ${summary[4]}`);
        console.log(`   Consents: ${summary[5]}`);
        console.log(`   Alerts: ${summary[6]}`);
        console.log(`   Patient Access Records: ${summary[7]}`);
        
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

seedDatabase();
EOF

# Run the seeding
node seed-db.js

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Database seeded successfully${NC}"
    rm seed-db.js
else
    echo -e "${RED}✗ Database seeding failed${NC}"
    rm seed-db.js
    exit 1
fi

cd ..

# Create MinIO buckets and upload sample files
echo -e "${BLUE}Step 5: Setting up object storage...${NC}"

# Wait for MinIO to be fully ready
sleep 3

# Create MinIO client alias
docker-compose exec -T minio mc alias set local http://localhost:9000 minioadmin minioadmin > /dev/null 2>&1

# Create bucket
docker-compose exec -T minio mc mb local/kerala-health-attachments > /dev/null 2>&1 || true

echo -e "${GREEN}✓ Object storage configured${NC}"

# Display final information
echo
echo -e "${GREEN}🎉 Kerala Health System seeding completed successfully!${NC}"
echo
echo -e "${BLUE}📊 Summary:${NC}"
echo "   • Database seeded with sample data"
echo "   • Object storage configured"
echo "   • Services are running and ready"
echo
echo -e "${BLUE}🔗 Access URLs:${NC}"
echo "   • Frontend: http://localhost:3000"
echo "   • Backend API: http://localhost:4000"
echo "   • API Documentation: http://localhost:4000/docs"
echo "   • Database Admin: http://localhost:8080"
echo "   • MinIO Console: http://localhost:9001"
echo
echo -e "${BLUE}👥 Default Login Credentials:${NC}"
echo "   • Admin: admin@kerala.gov.in / Admin@123"
echo "   • Doctor: doctor.ernakulam@kerala.gov.in / Doctor@123"
echo "   • Public Health: publichealth@kerala.gov.in / Health@123"
echo "   • Kiosk: kiosk1@kerala.gov.in / Kiosk@123"
echo
echo -e "${YELLOW}📝 Next Steps:${NC}"
echo "   1. Start the backend: cd backend && npm run dev"
echo "   2. Start the frontend: cd frontend && npm start"
echo "   3. Run the demo: ./tests/run_e2e.sh"
echo
echo -e "${GREEN}Happy coding! 🚀${NC}"