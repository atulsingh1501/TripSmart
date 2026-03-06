// Realistic Indian Railways Train Data
// Based on actual train types, routes, and approximate pricing

const fs = require('fs');
const path = require('path');

// Load the comprehensive train data from JSON
let realTrainData = [];
try {
  const jsonPath = path.join(__dirname, '../../EXP-TRAINS.json');
  const jsonData = fs.readFileSync(jsonPath, 'utf8');
  realTrainData = JSON.parse(jsonData);
  console.log(`Loaded ${realTrainData.length} trains from EXP-TRAINS.json`);
} catch (error) {
  console.warn('Could not load EXP-TRAINS.json:', error.message);
}

// Station code mappings for major cities
const cityStationCodes = {
  'DEL': ['NDLS', 'DLI', 'NZM', 'NDLY'],
  'BOM': ['CSTM', 'BCT', 'LTT', 'DR', 'BDTS'],
  'BLR': ['SBC', 'BNCE', 'BNC', 'YPR'],
  'MAA': ['MAS', 'MS', 'MSB'],
  'CCU': ['HWH', 'KOAA', 'SDAH'],
  'HYD': ['SC', 'HYB', 'NZB'],
  'JAI': ['JP', 'JAIPUR'],
  'AGR': ['AGC', 'AF'],
  'GOI': ['MAO', 'THVM', 'VSG'],
  'VNS': ['BSB', 'VNSD'],
  'COK': ['ERS', 'AWY'],
  'ATR': ['ASR', 'AMRITSAR'],
  'PNE': ['PUNE', 'PNE']
};

const trainTypes = [
  { code: 'RAJ', name: 'Rajdhani Express', type: 'premium', speed: 'fast', amenities: ['AC', 'Meals', 'Bedding'] },
  { code: 'SHA', name: 'Shatabdi Express', type: 'premium', speed: 'fast', amenities: ['AC', 'Meals', 'Reclining Seats'] },
  { code: 'DUR', name: 'Duronto Express', type: 'premium', speed: 'fast', amenities: ['AC', 'Meals', 'Non-stop'] },
  { code: 'VAN', name: 'Vande Bharat Express', type: 'premium', speed: 'fastest', amenities: ['AC', 'Meals', 'WiFi', 'Bio-toilets'] },
  { code: 'GAR', name: 'Garib Rath', type: 'budget-ac', speed: 'medium', amenities: ['AC', 'Budget Meals'] },
  { code: 'SF', name: 'Superfast Express', type: 'regular', speed: 'medium', amenities: ['AC/Non-AC Available'] },
  { code: 'EXP', name: 'Express/Mail', type: 'regular', speed: 'slow', amenities: ['AC/Non-AC Available'] },
  { code: 'SPL', name: 'Special Train', type: 'regular', speed: 'medium', amenities: ['AC/Non-AC Available'] },
  { code: 'PASS', name: 'Passenger', type: 'local', speed: 'slow', amenities: ['General'] }
];

const coachClasses = [
  { code: '1A', name: 'First Class AC', berths: 18, price_multiplier: 4.5, description: 'Private cabins with 2/4 berths' },
  { code: '2A', name: 'AC 2-Tier', berths: 46, price_multiplier: 2.8, description: 'Open bay with 2-tier berths' },
  { code: '3A', name: 'AC 3-Tier', berths: 64, price_multiplier: 1.8, description: 'Open bay with 3-tier berths' },
  { code: '3E', name: 'AC 3-Tier Economy', berths: 72, price_multiplier: 1.5, description: 'Budget 3-tier AC' },
  { code: 'CC', name: 'AC Chair Car', seats: 78, price_multiplier: 1.3, description: 'Reclining AC seats' },
  { code: 'EC', name: 'Executive Chair', seats: 56, price_multiplier: 2.2, description: 'Premium reclining AC seats' },
  { code: 'SL', name: 'Sleeper Class', berths: 72, price_multiplier: 0.5, description: 'Non-AC sleeping berths' },
  { code: '2S', name: 'Second Sitting', seats: 108, price_multiplier: 0.3, description: 'Non-AC seating' },
  { code: 'GN', name: 'General', seats: 90, price_multiplier: 0.2, description: 'Unreserved general' }
];

// Popular train routes with realistic data
const trainRoutes = [
  // Delhi - Mumbai
  {
    trainNumber: '12951',
    name: 'Mumbai Rajdhani',
    type: 'RAJ',
    from: { code: 'NDLS', name: 'New Delhi', city: 'DEL' },
    to: { code: 'BCT', name: 'Mumbai Central', city: 'BOM' },
    distance: 1384,
    duration: { hours: 15, minutes: 35 },
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    departure: '16:55',
    arrival: '08:35',
    classes: ['1A', '2A', '3A'],
    baseFare: 850
  },
  {
    trainNumber: '12952',
    name: 'Mumbai Rajdhani',
    type: 'RAJ',
    from: { code: 'BCT', name: 'Mumbai Central', city: 'BOM' },
    to: { code: 'NDLS', name: 'New Delhi', city: 'DEL' },
    distance: 1384,
    duration: { hours: 15, minutes: 50 },
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    departure: '17:00',
    arrival: '08:50',
    classes: ['1A', '2A', '3A'],
    baseFare: 850
  },

  // Delhi - Kolkata
  {
    trainNumber: '12301',
    name: 'Howrah Rajdhani',
    type: 'RAJ',
    from: { code: 'NDLS', name: 'New Delhi', city: 'DEL' },
    to: { code: 'HWH', name: 'Howrah Junction', city: 'CCU' },
    distance: 1451,
    duration: { hours: 17, minutes: 10 },
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    departure: '16:50',
    arrival: '10:00',
    classes: ['1A', '2A', '3A'],
    baseFare: 900
  },
  {
    trainNumber: '12302',
    name: 'Howrah Rajdhani',
    type: 'RAJ',
    from: { code: 'HWH', name: 'Howrah Junction', city: 'CCU' },
    to: { code: 'NDLS', name: 'New Delhi', city: 'DEL' },
    distance: 1451,
    duration: { hours: 17, minutes: 15 },
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    departure: '14:05',
    arrival: '07:20',
    classes: ['1A', '2A', '3A'],
    baseFare: 900
  },

  // Delhi - Chennai
  {
    trainNumber: '12621',
    name: 'Tamil Nadu Express',
    type: 'SF',
    from: { code: 'NDLS', name: 'New Delhi', city: 'DEL' },
    to: { code: 'MAS', name: 'Chennai Central', city: 'MAA' },
    distance: 2182,
    duration: { hours: 33, minutes: 15 },
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    departure: '22:30',
    arrival: '07:45',
    classes: ['1A', '2A', '3A', 'SL'],
    baseFare: 1150
  },
  {
    trainNumber: '12622',
    name: 'Tamil Nadu Express',
    type: 'SF',
    from: { code: 'MAS', name: 'Chennai Central', city: 'MAA' },
    to: { code: 'NDLS', name: 'New Delhi', city: 'DEL' },
    distance: 2182,
    duration: { hours: 33, minutes: 30 },
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    departure: '22:00',
    arrival: '07:30',
    classes: ['1A', '2A', '3A', 'SL'],
    baseFare: 1150
  },

  // Delhi - Bangalore
  {
    trainNumber: '12627',
    name: 'Karnataka Express',
    type: 'SF',
    from: { code: 'NDLS', name: 'New Delhi', city: 'DEL' },
    to: { code: 'SBC', name: 'Bangalore City', city: 'BLR' },
    distance: 2444,
    duration: { hours: 34, minutes: 0 },
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    departure: '21:20',
    arrival: '07:20',
    classes: ['1A', '2A', '3A', 'SL'],
    baseFare: 1250
  },
  {
    trainNumber: '22691',
    name: 'Rajdhani Express',
    type: 'RAJ',
    from: { code: 'SBC', name: 'Bangalore City', city: 'BLR' },
    to: { code: 'NZM', name: 'Hazrat Nizamuddin', city: 'DEL' },
    distance: 2367,
    duration: { hours: 33, minutes: 45 },
    days: ['Mon', 'Sat'],
    departure: '20:00',
    arrival: '05:45',
    classes: ['1A', '2A', '3A'],
    baseFare: 1400
  },

  // Delhi - Jaipur (Shatabdi)
  {
    trainNumber: '12015',
    name: 'Ajmer Shatabdi',
    type: 'SHA',
    from: { code: 'NDLS', name: 'New Delhi', city: 'DEL' },
    to: { code: 'JP', name: 'Jaipur Junction', city: 'JAI' },
    distance: 303,
    duration: { hours: 4, minutes: 30 },
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    departure: '06:05',
    arrival: '10:35',
    classes: ['EC', 'CC'],
    baseFare: 450
  },
  {
    trainNumber: '12016',
    name: 'Ajmer Shatabdi',
    type: 'SHA',
    from: { code: 'JP', name: 'Jaipur Junction', city: 'JAI' },
    to: { code: 'NDLS', name: 'New Delhi', city: 'DEL' },
    distance: 303,
    duration: { hours: 4, minutes: 45 },
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    departure: '17:50',
    arrival: '22:35',
    classes: ['EC', 'CC'],
    baseFare: 450
  },

  // Delhi - Varanasi (Vande Bharat)
  {
    trainNumber: '22436',
    name: 'Vande Bharat Express',
    type: 'VAN',
    from: { code: 'NDLS', name: 'New Delhi', city: 'DEL' },
    to: { code: 'BSB', name: 'Varanasi Junction', city: 'VNS' },
    distance: 759,
    duration: { hours: 8, minutes: 0 },
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    departure: '06:00',
    arrival: '14:00',
    classes: ['EC', 'CC'],
    baseFare: 750
  },
  {
    trainNumber: '22435',
    name: 'Vande Bharat Express',
    type: 'VAN',
    from: { code: 'BSB', name: 'Varanasi Junction', city: 'VNS' },
    to: { code: 'NDLS', name: 'New Delhi', city: 'DEL' },
    distance: 759,
    duration: { hours: 8, minutes: 0 },
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sun'],
    departure: '15:00',
    arrival: '23:00',
    classes: ['EC', 'CC'],
    baseFare: 750
  },

  // Mumbai - Goa
  {
    trainNumber: '10103',
    name: 'Mandovi Express',
    type: 'EXP',
    from: { code: 'CSTM', name: 'Chhatrapati Shivaji Terminus', city: 'BOM' },
    to: { code: 'MAO', name: 'Madgaon Junction', city: 'GOI' },
    distance: 581,
    duration: { hours: 11, minutes: 40 },
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    departure: '07:10',
    arrival: '18:50',
    classes: ['2A', '3A', 'SL', '2S'],
    baseFare: 400
  },
  {
    trainNumber: '12133',
    name: 'Mumbai CST Mangalore SF',
    type: 'SF',
    from: { code: 'CSTM', name: 'Chhatrapati Shivaji Terminus', city: 'BOM' },
    to: { code: 'MAO', name: 'Madgaon Junction', city: 'GOI' },
    distance: 581,
    duration: { hours: 10, minutes: 30 },
    days: ['Mon', 'Wed', 'Fri', 'Sun'],
    departure: '22:00',
    arrival: '08:30',
    classes: ['1A', '2A', '3A', 'SL'],
    baseFare: 420
  },

  // Mumbai - Bangalore
  {
    trainNumber: '12649',
    name: 'Karnataka Sampark Kranti',
    type: 'SF',
    from: { code: 'LTT', name: 'Lokmanya Tilak Terminus', city: 'BOM' },
    to: { code: 'SBC', name: 'Bangalore City', city: 'BLR' },
    distance: 1159,
    duration: { hours: 22, minutes: 30 },
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    departure: '07:40',
    arrival: '06:10',
    classes: ['1A', '2A', '3A', 'SL'],
    baseFare: 700
  },
  {
    trainNumber: '12650',
    name: 'Karnataka Sampark Kranti',
    type: 'SF',
    from: { code: 'SBC', name: 'Bangalore City', city: 'BLR' },
    to: { code: 'LTT', name: 'Lokmanya Tilak Terminus', city: 'BOM' },
    distance: 1159,
    duration: { hours: 22, minutes: 45 },
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    departure: '08:00',
    arrival: '06:45',
    classes: ['1A', '2A', '3A', 'SL'],
    baseFare: 700
  },
  {
    trainNumber: '16529',
    name: 'Udyan Express',
    type: 'EXP',
    from: { code: 'CSTM', name: 'Chhatrapati Shivaji Terminus', city: 'BOM' },
    to: { code: 'SBC', name: 'Bangalore City', city: 'BLR' },
    distance: 1160,
    duration: { hours: 24, minutes: 15 },
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    departure: '08:00',
    arrival: '08:15',
    classes: ['2A', '3A', 'SL', '2S'],
    baseFare: 600
  },
  {
    trainNumber: '16530',
    name: 'Udyan Express',
    type: 'EXP',
    from: { code: 'SBC', name: 'Bangalore City', city: 'BLR' },
    to: { code: 'CSTM', name: 'Chhatrapati Shivaji Terminus', city: 'BOM' },
    distance: 1160,
    duration: { hours: 24, minutes: 0 },
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    departure: '20:00',
    arrival: '20:00',
    classes: ['2A', '3A', 'SL', '2S'],
    baseFare: 600
  },

  // Bangalore - Chennai (Shatabdi)
  {
    trainNumber: '12007',
    name: 'Shatabdi Express',
    type: 'SHA',
    from: { code: 'SBC', name: 'Bangalore City', city: 'BLR' },
    to: { code: 'MAS', name: 'Chennai Central', city: 'MAA' },
    distance: 362,
    duration: { hours: 4, minutes: 50 },
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    departure: '06:00',
    arrival: '10:50',
    classes: ['EC', 'CC'],
    baseFare: 350
  },
  {
    trainNumber: '12028',
    name: 'Shatabdi Express',
    type: 'SHA',
    from: { code: 'MAS', name: 'Chennai Central', city: 'MAA' },
    to: { code: 'SBC', name: 'Bangalore City', city: 'BLR' },
    distance: 362,
    duration: { hours: 5, minutes: 0 },
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    departure: '16:00',
    arrival: '21:00',
    classes: ['EC', 'CC'],
    baseFare: 350
  },

  // Kolkata - Darjeeling (Toy Train heritage section)
  {
    trainNumber: '52541',
    name: 'Darjeeling Mail Toy Train',
    type: 'PASS',
    from: { code: 'NJP', name: 'New Jalpaiguri', city: 'IXB' },
    to: { code: 'DJ', name: 'Darjeeling', city: 'IXB' },
    distance: 88,
    duration: { hours: 7, minutes: 0 },
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    departure: '08:30',
    arrival: '15:30',
    classes: ['CC', '2S'],
    baseFare: 250,
    heritage: true
  },

  // Delhi - Amritsar (Shatabdi)
  {
    trainNumber: '12013',
    name: 'Amritsar Shatabdi',
    type: 'SHA',
    from: { code: 'NDLS', name: 'New Delhi', city: 'DEL' },
    to: { code: 'ASR', name: 'Amritsar Junction', city: 'ATR' },
    distance: 449,
    duration: { hours: 6, minutes: 10 },
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    departure: '07:20',
    arrival: '13:30',
    classes: ['EC', 'CC'],
    baseFare: 500
  },
  {
    trainNumber: '12014',
    name: 'Amritsar Shatabdi',
    type: 'SHA',
    from: { code: 'ASR', name: 'Amritsar Junction', city: 'ATR' },
    to: { code: 'NDLS', name: 'New Delhi', city: 'DEL' },
    distance: 449,
    duration: { hours: 6, minutes: 5 },
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    departure: '16:30',
    arrival: '22:35',
    classes: ['EC', 'CC'],
    baseFare: 500
  },

  // Delhi - Agra (Gatimaan)
  {
    trainNumber: '12049',
    name: 'Gatimaan Express',
    type: 'VAN',
    from: { code: 'NZM', name: 'Hazrat Nizamuddin', city: 'DEL' },
    to: { code: 'AGC', name: 'Agra Cantt', city: 'AGR' },
    distance: 188,
    duration: { hours: 1, minutes: 40 },
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    departure: '08:10',
    arrival: '09:50',
    classes: ['EC', 'CC'],
    baseFare: 350,
    fastest: true
  },
  {
    trainNumber: '12050',
    name: 'Gatimaan Express',
    type: 'VAN',
    from: { code: 'AGC', name: 'Agra Cantt', city: 'AGR' },
    to: { code: 'NZM', name: 'Hazrat Nizamuddin', city: 'DEL' },
    distance: 188,
    duration: { hours: 1, minutes: 40 },
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    departure: '17:50',
    arrival: '19:30',
    classes: ['EC', 'CC'],
    baseFare: 350,
    fastest: true
  },

  // Mumbai - Hyderabad
  {
    trainNumber: '12701',
    name: 'Hussainsagar Express',
    type: 'SF',
    from: { code: 'CSTM', name: 'Chhatrapati Shivaji Terminus', city: 'BOM' },
    to: { code: 'SC', name: 'Secunderabad Junction', city: 'HYD' },
    distance: 711,
    duration: { hours: 12, minutes: 30 },
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    departure: '21:00',
    arrival: '09:30',
    classes: ['2A', '3A', 'SL', '2S'],
    baseFare: 450
  },
  {
    trainNumber: '12702',
    name: 'Hussainsagar Express',
    type: 'SF',
    from: { code: 'SC', name: 'Secunderabad Junction', city: 'HYD' },
    to: { code: 'CSTM', name: 'Chhatrapati Shivaji Terminus', city: 'BOM' },
    distance: 711,
    duration: { hours: 12, minutes: 45 },
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    departure: '21:45',
    arrival: '10:30',
    classes: ['2A', '3A', 'SL', '2S'],
    baseFare: 450
  },
  {
    trainNumber: '17031',
    name: 'Mumbai Express',
    type: 'EXP',
    from: { code: 'LTT', name: 'Lokmanya Tilak Terminus', city: 'BOM' },
    to: { code: 'SC', name: 'Secunderabad Junction', city: 'HYD' },
    distance: 720,
    duration: { hours: 14, minutes: 0 },
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    departure: '18:15',
    arrival: '08:15',
    classes: ['2A', '3A', 'SL'],
    baseFare: 400
  },
  {
    trainNumber: '17032',
    name: 'Mumbai Express',
    type: 'EXP',
    from: { code: 'SC', name: 'Secunderabad Junction', city: 'HYD' },
    to: { code: 'LTT', name: 'Lokmanya Tilak Terminus', city: 'BOM' },
    distance: 720,
    duration: { hours: 14, minutes: 15 },
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    departure: '17:30',
    arrival: '07:45',
    classes: ['2A', '3A', 'SL'],
    baseFare: 400
  },

  // Mumbai - Ahmedabad
  {
    trainNumber: '12009',
    name: 'Shatabdi Express',
    type: 'SHA',
    from: { code: 'BCT', name: 'Mumbai Central', city: 'BOM' },
    to: { code: 'ADI', name: 'Ahmedabad Junction', city: 'AMD' },
    distance: 493,
    duration: { hours: 6, minutes: 30 },
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    departure: '06:25',
    arrival: '12:55',
    classes: ['EC', 'CC'],
    baseFare: 420
  },

  // Chennai - Hyderabad
  {
    trainNumber: '12603',
    name: 'Hyderabad Express',
    type: 'SF',
    from: { code: 'MAS', name: 'Chennai Central', city: 'MAA' },
    to: { code: 'SC', name: 'Secunderabad Junction', city: 'HYD' },
    distance: 698,
    duration: { hours: 12, minutes: 30 },
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    departure: '18:15',
    arrival: '06:45',
    classes: ['2A', '3A', 'SL', '2S'],
    baseFare: 450
  },

  // Kolkata - Puri
  {
    trainNumber: '12837',
    name: 'Puri Express',
    type: 'SF',
    from: { code: 'HWH', name: 'Howrah Junction', city: 'CCU' },
    to: { code: 'PURI', name: 'Puri', city: 'PURI' },
    distance: 499,
    duration: { hours: 8, minutes: 0 },
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    departure: '22:35',
    arrival: '06:35',
    classes: ['2A', '3A', 'SL'],
    baseFare: 350
  },

  // Bangalore - Kolkata (Howrah)
  {
    trainNumber: '12245',
    name: 'HWH YPR Duronto Express',
    type: 'DUR',
    from: { code: 'HWH', name: 'Howrah Junction', city: 'CCU' },
    to: { code: 'YPR', name: 'Yesvantpur Junction', city: 'BLR' },
    distance: 1897,
    duration: { hours: 28, minutes: 0 },
    days: ['Mon', 'Thu', 'Sat'],
    departure: '08:55',
    arrival: '12:55',
    classes: ['1A', '2A', '3A', 'SL'],
    baseFare: 1100
  },
  {
    trainNumber: '12246',
    name: 'YPR HWH Duronto Express',
    type: 'DUR',
    from: { code: 'YPR', name: 'Yesvantpur Junction', city: 'BLR' },
    to: { code: 'HWH', name: 'Howrah Junction', city: 'CCU' },
    distance: 1897,
    duration: { hours: 27, minutes: 30 },
    days: ['Tue', 'Fri', 'Sun'],
    departure: '10:10',
    arrival: '13:40',
    classes: ['1A', '2A', '3A', 'SL'],
    baseFare: 1100
  },
  {
    trainNumber: '22887',
    name: 'HWH YPR Superfast Express',
    type: 'SF',
    from: { code: 'HWH', name: 'Howrah Junction', city: 'CCU' },
    to: { code: 'YPR', name: 'Yesvantpur Junction', city: 'BLR' },
    distance: 1897,
    duration: { hours: 33, minutes: 0 },
    days: ['Wed', 'Sat'],
    departure: '23:55',
    arrival: '08:55',
    classes: ['2A', '3A', 'SL', '2S'],
    baseFare: 900
  },
  {
    trainNumber: '22888',
    name: 'YPR HWH Superfast Express',
    type: 'SF',
    from: { code: 'YPR', name: 'Yesvantpur Junction', city: 'BLR' },
    to: { code: 'HWH', name: 'Howrah Junction', city: 'CCU' },
    distance: 1897,
    duration: { hours: 33, minutes: 30 },
    days: ['Mon', 'Thu'],
    departure: '22:30',
    arrival: '08:00',
    classes: ['2A', '3A', 'SL', '2S'],
    baseFare: 900
  },
  {
    trainNumber: '12863',
    name: 'HWH YPR Express',
    type: 'EXP',
    from: { code: 'HWH', name: 'Howrah Junction', city: 'CCU' },
    to: { code: 'YPR', name: 'Yesvantpur Junction', city: 'BLR' },
    distance: 1897,
    duration: { hours: 36, minutes: 0 },
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    departure: '14:05',
    arrival: '02:05',
    classes: ['2A', '3A', 'SL', '2S'],
    baseFare: 750
  },
  {
    trainNumber: '12864',
    name: 'YPR HWH Express',
    type: 'EXP',
    from: { code: 'YPR', name: 'Yesvantpur Junction', city: 'BLR' },
    to: { code: 'HWH', name: 'Howrah Junction', city: 'CCU' },
    distance: 1897,
    duration: { hours: 36, minutes: 30 },
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    departure: '19:15',
    arrival: '07:45',
    classes: ['2A', '3A', 'SL', '2S'],
    baseFare: 750
  }
];

// Calculate fare based on class and distance
const calculateFare = (baseFare, classCode, isRajdhani = false, isTatkal = false) => {
  const classInfo = coachClasses.find(c => c.code === classCode);
  if (!classInfo) return null;

  let fare = baseFare * classInfo.price_multiplier;

  // Rajdhani/Shatabdi have all-inclusive fares
  if (isRajdhani) {
    fare *= 1.3; // Includes meals and bedding
  }

  // Tatkal surcharge
  if (isTatkal) {
    const tatkalCharges = {
      '1A': fare * 0.30,
      '2A': fare * 0.30,
      '3A': fare * 0.30,
      '3E': fare * 0.25,
      'EC': fare * 0.25,
      'CC': fare * 0.25,
      'SL': fare * 0.20
    };
    fare += tatkalCharges[classCode] || 0;
  }

  // GST (5% for AC classes, 0% for non-AC)
  const gstRate = ['1A', '2A', '3A', '3E', 'EC', 'CC'].includes(classCode) ? 0.05 : 0;

  return {
    baseFare: Math.round(fare),
    reservationCharge: classCode === '1A' ? 60 : classCode === '2A' ? 50 : classCode === '3A' ? 40 : classCode === 'SL' ? 20 : 15,
    superfastCharge: 45,
    gst: Math.round(fare * gstRate),
    total: Math.round(fare * (1 + gstRate)) + (classCode === '1A' ? 105 : classCode === '2A' ? 95 : classCode === '3A' ? 85 : classCode === 'SL' ? 65 : 60)
  };
};

// Generate train availability for a date
const generateTrainAvailability = (train, date, travelClass) => {
  const travelDate = new Date(date);
  const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][travelDate.getDay()];
  const dayNameUpper = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][travelDate.getDay()];

  // Check if train runs on this day
  // Handle both old format (days: ['Mon', 'Tue']) and new format (runningDays: { MON: true })
  let runsToday = true;
  if (train.runningDays && typeof train.runningDays === 'object') {
    runsToday = train.runningDays[dayNameUpper] === true;
  } else if (train.days && Array.isArray(train.days)) {
    runsToday = train.days.includes(dayName) || train.days.includes(dayNameUpper);
  }

  if (!runsToday) {
    return null;
  }

  const isPremium = ['RAJ', 'SHA', 'VAN', 'DUR'].includes(train.type);
  const fare = calculateFare(train.baseFare, travelClass, isPremium);

  // Simulate availability
  const randomAvailability = () => {
    const rand = Math.random();
    if (rand < 0.4) return { status: 'AVAILABLE', count: Math.floor(Math.random() * 50) + 1 };
    if (rand < 0.6) return { status: 'RAC', count: Math.floor(Math.random() * 20) + 1 };
    if (rand < 0.8) return { status: 'WL', count: Math.floor(Math.random() * 30) + 1 };
    return { status: 'GNWL', count: Math.floor(Math.random() * 50) + 1 };
  };

  return {
    trainNumber: train.trainNumber,
    trainName: train.trainName || train.name,  // Handle both field names
    trainType: train.type,
    from: train.from,
    to: train.to,
    departure: train.departure,
    arrival: train.arrival,
    duration: train.duration || { hours: 8, minutes: 0, totalMinutes: 480 },
    distance: train.distance,
    date: date,
    class: travelClass,
    availability: randomAvailability(),
    fare: fare,
    runningDays: train.runningDays,
    amenities: trainTypes.find(t => t.code === train.type)?.amenities || [],
    heritage: train.heritage || false,
    fastest: train.fastest || false
  };
};

// Search trains between cities using real JSON data
// NEW APPROACH:
// 1. Search trainRoute for stations containing the origin city name
// 2. Check if that train also has a station containing destination city name
// 3. Filter by runningDays matching the travel date
// 4. Calculate journey time from departure/arrival times
const searchTrains = (params) => {
  const { from, to, date, travelClass = '3A', returnDate } = params;

  console.log(`\n🚂 Searching trains: ${from} → ${to} on ${date}`);

  // City name mappings for search
  const cityNameMappings = {
    'DEL': ['DELHI', 'NEW DELHI', 'NDLS', 'HAZRAT', 'NIZAMUDDIN'],
    'BOM': ['MUMBAI', 'BOMBAY', 'CSTM', 'LTT', 'BCT', 'BANDRA', 'DADAR', 'LOKMANYA'],
    'BLR': ['BANGALORE', 'BENGALURU', 'SBC', 'YPR', 'YESVANTPUR'],
    'MAA': ['CHENNAI', 'MADRAS', 'MGR', 'CENTRAL'],
    'CCU': ['KOLKATA', 'CALCUTTA', 'HOWRAH', 'HWH', 'SDAH', 'SEALDAH'],
    'HYD': ['HYDERABAD', 'SECUNDERABAD', 'NAMPALLY'],
    'JAI': ['JAIPUR', 'JP'],
    'AGR': ['AGRA', 'CANTT'],
    'GOI': ['GOA', 'MADGAON', 'MARGAO', 'VASCO', 'THIVIM'],
    'VNS': ['VARANASI', 'BANARAS', 'BSB'],
    'COK': ['KOCHI', 'COCHIN', 'ERNAKULAM', 'ERS'],
    'ATR': ['AMRITSAR', 'ASR'],
    'PNE': ['PUNE', 'POONA'],
    'LKO': ['LUCKNOW', 'CHARBAGH'],
    'PAT': ['PATNA', 'PNBE'],
    'AHM': ['AHMEDABAD', 'ADI'],
    'NGP': ['NAGPUR', 'NGP'],
    'BPL': ['BHOPAL', 'BPL'],
    'IDR': ['INDORE', 'INDB'],
    'JPR': ['JODHPUR', 'JU'],
    'UDR': ['UDAIPUR', 'UDZ'],
    'JMU': ['JAMMU', 'JAT'],
    'SRI': ['SRINAGAR'],
    'SHL': ['SHILLONG'],
    'GUW': ['GUWAHATI', 'GHY'],
    'RNC': ['RANCHI', 'RNC'],
    'TVC': ['TRIVANDRUM', 'THIRUVANANTHAPURAM', 'TVC'],
    'MYS': ['MYSORE', 'MYSURU', 'MYS']
  };

  // Get search keywords for source and destination
  const fromKeywords = (cityNameMappings[from] || [from]).map(k => k.toUpperCase());
  const toKeywords = (cityNameMappings[to] || [to]).map(k => k.toUpperCase());

  console.log(`   From keywords: ${fromKeywords.join(', ')}`);
  console.log(`   To keywords: ${toKeywords.join(', ')}`);

  // Get day of week for the travel date
  const travelDate = new Date(date);
  const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const travelDayName = dayNames[travelDate.getDay()];
  console.log(`   Travel day: ${travelDayName}`);

  // Helper to check if station name contains any keyword
  const stationMatchesCity = (stationName, keywords) => {
    if (!stationName) return false;
    const upperStation = stationName.toUpperCase();
    return keywords.some(keyword => upperStation.includes(keyword));
  };

  // Helper to parse time string "HH:MM" to minutes from midnight
  const parseTimeToMinutes = (timeStr) => {
    if (!timeStr || timeStr === 'Source' || timeStr === 'Destination') return null;
    const parts = timeStr.split(':');
    if (parts.length !== 2) return null;
    return parseInt(parts[0]) * 60 + parseInt(parts[1]);
  };

  // Helper to calculate duration between two times (handling overnight travel)
  const calculateDuration = (departMinutes, arriveMinutes, departDay, arriveDay) => {
    if (departMinutes === null || arriveMinutes === null) return null;

    const dayDiff = (parseInt(arriveDay) || 1) - (parseInt(departDay) || 1);
    let totalMinutes = arriveMinutes - departMinutes + (dayDiff * 24 * 60);

    if (totalMinutes < 0) totalMinutes += 24 * 60; // Handle same day overnight

    return {
      hours: Math.floor(totalMinutes / 60),
      minutes: totalMinutes % 60,
      totalMinutes
    };
  };

  // Search through real train data
  const matchingTrains = [];

  for (const train of realTrainData) {
    if (!train.trainRoute || train.trainRoute.length < 2) continue;

    // Step 1: Find station containing origin city name
    let fromStation = null;
    let fromIdx = -1;

    for (let i = 0; i < train.trainRoute.length; i++) {
      if (stationMatchesCity(train.trainRoute[i].stationName, fromKeywords)) {
        fromStation = train.trainRoute[i];
        fromIdx = i;
        break;
      }
    }

    if (!fromStation) continue; // Origin not found

    // Step 2: Find station containing destination city name (AFTER origin)
    let toStation = null;
    let toIdx = -1;

    for (let i = fromIdx + 1; i < train.trainRoute.length; i++) {
      if (stationMatchesCity(train.trainRoute[i].stationName, toKeywords)) {
        toStation = train.trainRoute[i];
        toIdx = i;
        break;
      }
    }

    if (!toStation) continue; // Destination not found after origin

    // Step 3: Check if train runs on the travel day
    if (train.runningDays && !train.runningDays[travelDayName]) {
      continue; // Train doesn't run on this day
    }

    // Step 4: Calculate journey details
    const departTime = fromStation.departs === 'Source' ? '09:00' : fromStation.departs;
    const arriveTime = toStation.arrives === 'Destination' ? '18:00' : toStation.arrives;

    const departMinutes = parseTimeToMinutes(departTime);
    const arriveMinutes = parseTimeToMinutes(arriveTime);
    const duration = calculateDuration(departMinutes, arriveMinutes, fromStation.day, toStation.day);

    // Calculate distance
    const fromDist = parseInt(fromStation.distance) || 0;
    const toDist = parseInt(toStation.distance) || 0;
    const distance = Math.abs(toDist - fromDist);

    // Calculate base fare based on distance
    const baseFare = Math.round(distance * 0.5) + 100;

    // Determine train type from name
    const trainName = train.trainName || '';
    let trainType = 'EXP';
    if (trainName.toUpperCase().includes('RAJDHANI') || trainName.includes('RAJ')) trainType = 'RAJ';
    else if (trainName.toUpperCase().includes('SHATABDI') || trainName.includes('SHA')) trainType = 'SHA';
    else if (trainName.toUpperCase().includes('VANDE') || trainName.includes('VAN')) trainType = 'VAN';
    else if (trainName.toUpperCase().includes('DURONTO') || trainName.includes('DUR')) trainType = 'DUR';
    else if (trainName.toUpperCase().includes('GARIB')) trainType = 'GAR';
    else if (trainName.toUpperCase().includes('SUPERFAST') || trainName.includes('SF')) trainType = 'SF';
    else if (trainName.toUpperCase().includes('SPL')) trainType = 'SPL';

    // Determine available classes based on train type
    let availableClasses = ['3A', 'SL', '2S'];
    if (['RAJ', 'SHA', 'VAN', 'DUR'].includes(trainType)) {
      availableClasses = ['1A', '2A', '3A', 'CC'];
    }

    matchingTrains.push({
      trainNumber: train.trainNumber,
      trainName: train.trainName,
      type: trainType,
      from: {
        code: fromStation.stationName.split(' - ')[1] || fromStation.stationName,
        name: fromStation.stationName.split(' - ')[0],
        city: from
      },
      to: {
        code: toStation.stationName.split(' - ')[1] || toStation.stationName,
        name: toStation.stationName.split(' - ')[0],
        city: to
      },
      departure: departTime,
      arrival: arriveTime,
      duration: duration || { hours: 8, minutes: 0, totalMinutes: 480 },
      distance: distance,
      runningDays: train.runningDays,
      baseFare: baseFare,
      classes: availableClasses,
      route: train.route,
      days: Object.keys(train.runningDays || {}).filter(d => train.runningDays[d])
    });
  }

  console.log(`   Found ${matchingTrains.length} trains from JSON`);

  // Also include fallback routes from hardcoded trainRoutes
  const fallbackTrains = trainRoutes.filter(train => {
    const fromMatch = train.from.city === from || train.from.code === from;
    const toMatch = train.to.city === to || train.to.code === to;

    // Check if train runs on travel day
    const runDay = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][travelDate.getDay()];
    const runsOnDay = !train.days || train.days.includes(runDay);

    return fromMatch && toMatch && runsOnDay;
  });

  console.log(`   Found ${fallbackTrains.length} trains from fallback routes`);

  // Combine and remove duplicates by train number
  const allTrains = [...matchingTrains, ...fallbackTrains];
  const uniqueTrains = Array.from(new Map(allTrains.map(t => [t.trainNumber, t])).values());

  // Generate availability for each matching train
  const results = uniqueTrains
    .slice(0, 20) // Limit to 20 results
    .map(train => generateTrainAvailability(train, date, travelClass))
    .filter(result => result !== null);

  console.log(`   Returning ${results.length} trains with availability\n`);

  return {
    trains: results,
    totalFound: results.length,
    searchParams: { from, to, date, class: travelClass },
    // NEW: Include journey duration for stay time calculation
    averageJourneyTime: results.length > 0
      ? Math.round(results.reduce((sum, t) => sum + (t.duration?.totalMinutes || 480), 0) / results.length)
      : 480 // Default 8 hours
  };
};

// Get train by number
const getTrainByNumber = (trainNumber) => {
  return trainRoutes.find(t => t.trainNumber === trainNumber);
};

// Get train schedule (all stops)
const getTrainSchedule = (trainNumber) => {
  const train = getTrainByNumber(trainNumber);
  if (!train) return null;

  // Simulate intermediate stops
  const stops = [
    { station: train.from, arrival: null, departure: train.departure, day: 1, halt: null },
    // Add intermediate stops based on train type
    { station: train.to, arrival: train.arrival, departure: null, day: train.duration.hours > 20 ? 2 : 1, halt: null }
  ];

  return {
    trainNumber: train.trainNumber,
    trainName: train.name,
    type: train.type,
    runsDays: train.days,
    totalDistance: train.distance,
    totalDuration: train.duration,
    stops
  };
};

/**
 * Calculate stay time for a round trip
 * @param {Object} params
 * @param {number} params.totalDays - Total trip days (from start to end date)
 * @param {number} params.journeyTimeMinutes - One-way journey time in minutes
 * @param {boolean} params.isRoundTrip - Whether this is a round trip
 * @returns {Object} - { stayDays, stayNights, journeyTimeHours }
 */
const calculateStayTime = (params) => {
  const { totalDays, journeyTimeMinutes, isRoundTrip = true } = params;

  // Convert journey time to hours
  const journeyTimeHours = journeyTimeMinutes / 60;

  // For round trip: subtract both outbound and return journey
  // For one-way: subtract only outbound journey
  const totalJourneyHours = isRoundTrip ? journeyTimeHours * 2 : journeyTimeHours;
  const totalJourneyDays = totalJourneyHours / 24;

  // Stay time = Total days - Journey days
  const stayDays = Math.max(0, totalDays - Math.ceil(totalJourneyDays));
  const stayNights = Math.max(0, stayDays - 1);

  return {
    stayDays,
    stayNights,
    journeyTimeHours: Math.round(journeyTimeHours * 10) / 10,
    totalJourneyHours: Math.round(totalJourneyHours * 10) / 10,
    message: `Journey: ${Math.round(totalJourneyHours)}h | Stay: ${stayDays} days, ${stayNights} nights`
  };
};

module.exports = {
  trainTypes,
  coachClasses,
  trainRoutes,
  calculateFare,
  generateTrainAvailability,
  searchTrains,
  getTrainByNumber,
  getTrainSchedule,
  calculateStayTime  // NEW: For stay time calculation
};
