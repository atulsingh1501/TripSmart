/**
 * Train Data Migration Script
 * 
 * Imports train data from EXP-TRAINS.json into MongoDB
 * Run with: node scripts/migrate-trains.js
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Import the Train model
const Train = require('../src/models/Train');

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/tripsmart';

// Determine train type from name
function getTrainType(trainName) {
    const name = (trainName || '').toUpperCase();
    if (name.includes('RAJDHANI') || name.includes('RAJ')) return 'RAJ';
    if (name.includes('SHATABDI') || name.includes('SHA')) return 'SHA';
    if (name.includes('VANDE') || name.includes('VAN')) return 'VAN';
    if (name.includes('DURONTO') || name.includes('DUR')) return 'DUR';
    if (name.includes('GARIB')) return 'GAR';
    if (name.includes('SUPERFAST') || name.includes('SF')) return 'SF';
    if (name.includes('SPL') || name.includes('SPECIAL')) return 'SPL';
    if (name.includes('PASS') || name.includes('PASSENGER')) return 'PASS';
    return 'EXP';
}

// Extract station code from station name like "MUMBAI CENTRAL - BCT"
function extractStationCode(stationName) {
    if (!stationName) return '';
    const parts = stationName.split(' - ');
    return parts.length > 1 ? parts[1].trim() : '';
}

async function migrateTrains() {
    console.log('🚂 Starting Train Data Migration...\n');

    try {
        // Connect to MongoDB
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        // Load JSON data
        const jsonPath = path.join(__dirname, '../EXP-TRAINS.json');
        console.log(`Loading trains from: ${jsonPath}`);

        if (!fs.existsSync(jsonPath)) {
            throw new Error(`JSON file not found: ${jsonPath}`);
        }

        const jsonData = fs.readFileSync(jsonPath, 'utf8');
        const trains = JSON.parse(jsonData);
        console.log(`✅ Loaded ${trains.length} trains from JSON\n`);

        // Check existing count
        const existingCount = await Train.countDocuments();
        console.log(`Existing trains in MongoDB: ${existingCount}`);

        if (existingCount > 0) {
            console.log('\n⚠️  Database already has trains. Options:');
            console.log('   1. Drop existing and re-import: Add --force flag');
            console.log('   2. Skip duplicates: Default behavior');

            if (process.argv.includes('--force')) {
                console.log('\n🗑️  Dropping existing trains...');
                await Train.deleteMany({});
                console.log('✅ Cleared existing data\n');
            }
        }

        // Prepare batch for insertion
        const BATCH_SIZE = 500;
        let inserted = 0;
        let skipped = 0;
        let errors = 0;

        console.log(`\nInserting trains in batches of ${BATCH_SIZE}...\n`);

        for (let i = 0; i < trains.length; i += BATCH_SIZE) {
            const batch = trains.slice(i, i + BATCH_SIZE);

            const trainDocs = batch.map(train => {
                // Process train route to add station codes
                const processedRoute = (train.trainRoute || []).map(stop => ({
                    sno: stop.sno,
                    stationName: stop.stationName,
                    stationCode: extractStationCode(stop.stationName),
                    arrives: stop.arrives,
                    departs: stop.departs,
                    distance: stop.distance,
                    day: stop.day
                }));

                return {
                    trainNumber: train.trainNumber,
                    trainName: train.trainName,
                    route: train.route,
                    trainType: getTrainType(train.trainName),
                    runningDays: train.runningDays || {},
                    trainRoute: processedRoute
                };
            });

            try {
                // Use insertMany with ordered: false to continue on duplicates
                const result = await Train.insertMany(trainDocs, {
                    ordered: false,
                    rawResult: true
                });
                inserted += result.insertedCount || trainDocs.length;
            } catch (err) {
                if (err.code === 11000) {
                    // Duplicate key error - some were inserted, some skipped
                    inserted += err.insertedDocs?.length || 0;
                    skipped += trainDocs.length - (err.insertedDocs?.length || 0);
                } else {
                    console.error(`Error in batch ${Math.floor(i / BATCH_SIZE) + 1}:`, err.message);
                    errors += trainDocs.length;
                }
            }

            // Progress update
            const progress = Math.round(((i + BATCH_SIZE) / trains.length) * 100);
            process.stdout.write(`\rProgress: ${Math.min(progress, 100)}% (${inserted} inserted, ${skipped} skipped)`);
        }

        console.log('\n\n✅ Migration Complete!');
        console.log(`   Inserted: ${inserted}`);
        console.log(`   Skipped (duplicates): ${skipped}`);
        console.log(`   Errors: ${errors}`);

        // Create indexes
        console.log('\n📇 Creating indexes...');
        await Train.createIndexes();
        console.log('✅ Indexes created\n');

        // Verify
        const finalCount = await Train.countDocuments();
        console.log(`📊 Total trains in database: ${finalCount}`);

        // Sample query test
        console.log('\n🧪 Testing search...');
        const testResults = await Train.find({
            stationNames: { $regex: 'MUMBAI', $options: 'i' }
        }).limit(3);
        console.log(`   Found ${testResults.length} trains with MUMBAI in route`);

    } catch (error) {
        console.error('\n❌ Migration failed:', error.message);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('\n👋 Disconnected from MongoDB');
    }
}

// Run migration
migrateTrains();
