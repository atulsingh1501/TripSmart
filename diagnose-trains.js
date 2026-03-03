/**
 * Diagnostic script to check train database and search logic
 */

const mongoose = require('mongoose');
const Train = require('./backend/src/models/Train');
require('dotenv').config({ path: './backend/.env' });

const CITY_NAME_MAPPINGS = {
    'BLR': ['BANGALORE', 'BENGALURU', 'SBC', 'YPR', 'YESVANTPUR'],
    'VNS': ['VARANASI', 'BANARAS', 'BSB']
};

async function diagnoseTrainSearch() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Check total trains
        const totalCount = await Train.countDocuments();
        console.log(`\n📊 Total trains in database: ${totalCount}`);

        // Check trains stopping at Bangalore
        const fromKeywords = CITY_NAME_MAPPINGS['BLR'];
        const toKeywords = CITY_NAME_MAPPINGS['VNS'];

        const fromRegex = fromKeywords.join('|');
        const toRegex = toKeywords.join('|');

        const blrCount = await Train.countDocuments({
            'trainRoute.stationName': { $regex: fromRegex, $options: 'i' }
        });
        console.log(`🚂 Trains stopping at Bangalore: ${blrCount}`);

        const vnsCount = await Train.countDocuments({
            'trainRoute.stationName': { $regex: toRegex, $options: 'i' }
        });
        console.log(`🚂 Trains stopping at Varanasi: ${vnsCount}`);

        // Find trains that stop at both
        const bothTrains = await Train.find({
            $and: [
                { 'trainRoute.stationName': { $regex: fromRegex, $options: 'i' } },
                { 'trainRoute.stationName': { $regex: toRegex, $options: 'i' } }
            ]
        }).limit(5).lean();

        console.log(`\n🔍 Trains stopping at BOTH Bangalore and Varanasi: ${bothTrains.length}`);

        if (bothTrains.length > 0) {
            console.log('\n📋 Sample trains:');
            for (const train of bothTrains) {
                console.log(`   ${train.trainNumber} - ${train.trainName}`);

                // Check route order
                let fromIdx = -1;
                let toIdx = -1;

                for (let i = 0; i < train.trainRoute.length; i++) {
                    const stationName = (train.trainRoute[i].stationName || '').toUpperCase();

                    if (fromIdx === -1) {
                        for (const keyword of fromKeywords) {
                            if (stationName.includes(keyword)) {
                                fromIdx = i;
                                console.log(`      BLR at index ${i}: ${train.trainRoute[i].stationName}`);
                                break;
                            }
                        }
                    }

                    if (toIdx === -1) {
                        for (const keyword of toKeywords) {
                            if (stationName.includes(keyword)) {
                                toIdx = i;
                                console.log(`      VNS at index ${i}: ${train.trainRoute[i].stationName}`);
                                break;
                            }
                        }
                    }
                }

                if (fromIdx !== -1 && toIdx !== -1) {
                    console.log(`      ✅ Valid route: BLR(${fromIdx}) → VNS(${toIdx})`);
                } else {
                    console.log(`      ❌ Invalid: fromIdx=${fromIdx}, toIdx=${toIdx}`);
                }
            }
        } else {
            console.log('\n❌ No trains found connecting Bangalore and Varanasi');
            console.log('   This could mean:');
            console.log('   1. No direct trains on this route');
            console.log('   2. Station names don\'t match our keywords');
            console.log('   3. Database doesn\'t have this route data');

            // Sample a BLR train to see station names
            const sampleBLR = await Train.findOne({
                'trainRoute.stationName': { $regex: fromRegex, $options: 'i' }
            }).lean();

            if (sampleBLR) {
                console.log(`\n   Sample BLR train: ${sampleBLR.trainNumber} - ${sampleBLR.trainName}`);
                console.log('   All stations:');
                sampleBLR.trainRoute.forEach((station, idx) => {
                    console.log(`      ${idx}: ${station.stationName}`);
                });
            }
        }

        await mongoose.disconnect();
        console.log('\n✅ Disconnected from MongoDB');
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

diagnoseTrainSearch();
