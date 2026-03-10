import { AppDataSource } from './data-source';
import { Region } from '../core/entities/region.entity';
import { Area } from '../core/entities/area.entity';
import { Territory } from '../core/entities/territory.entity';
import { Distributor } from '../core/entities/distributor.entity';
import { User } from '../core/entities/user.entity';
import { Retailer } from '../core/entities/retailer.entity';
import { SalesRepRetailer } from '../core/entities/sales-rep-retailer.entity';
import { UserRole } from '../common/enums/user-role.enum';
import * as bcrypt from 'bcryptjs';

// ─── HELPERS ────────────────────────────────────────────────────────────────

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generatePhone(): string {
  const prefixes = ['017', '018', '019', '016', '015', '013'];
  return `${randomPick(prefixes)}${Math.floor(10000000 + Math.random() * 90000000)}`;
}

function generateUid(index: number): string {
  return `RET-${String(index).padStart(7, '0')}`;
}

// ─── SEED DATA ──────────────────────────────────────────────────────────────

const REGION_DATA = [
  'Dhaka',
  'Chattogram',
  'Rajshahi',
  'Khulna',
  'Sylhet',
  'Rangpur',
  'Barishal',
  'Mymensingh',
];

const AREAS_BY_REGION: Record<string, string[]> = {
  Dhaka: [
    'Dhanmondi',
    'Gulshan',
    'Mirpur',
    'Uttara',
    'Mohammadpur',
    'Tejgaon',
    'Motijheel',
    'Banani',
    'Bashundhara',
    'Savar',
  ],
  Chattogram: [
    'Agrabad',
    'Nasirabad',
    'Pahartali',
    'Halishahar',
    'Panchlaish',
    'Kotwali',
    'Double Mooring',
    'Chandgaon',
  ],
  Rajshahi: [
    'Boalia',
    'Motihar',
    'Rajpara',
    'Shah Makhdum',
    'Katakhali',
    'Paba',
  ],
  Khulna: [
    'Sonadanga',
    'Khalishpur',
    'Daulatpur',
    'Khan Jahan Ali',
    'Boyra',
    'Batiaghata',
  ],
  Sylhet: [
    'Zindabazar',
    'Ambarkhana',
    'Subid Bazar',
    'Tilagarh',
    'Kumarpara',
    'South Surma',
  ],
  Rangpur: [
    'Rangpur Sadar',
    'Gangachara',
    'Kaunia',
    'Pirganj',
    'Mithapukur',
    'Badarganj',
  ],
  Barishal: [
    'Barishal Sadar',
    'Kotwali',
    'Airport',
    'Banaripara',
    'Babuganj',
    'Gournadi',
  ],
  Mymensingh: [
    'Mymensingh Sadar',
    'Trishal',
    'Bhaluka',
    'Muktagachha',
    'Fulbaria',
    'Gafargaon',
  ],
};

const DISTRIBUTOR_NAMES = [
  'AB Trading',
  'Rahman Enterprises',
  'Khan Brothers',
  'City Distributors',
  'Delta Suppliers',
  'Star Distribution Co.',
  'Mega Trade BD',
  'Prime Wholesale',
  'Global Supply Chain',
  'United Distributors',
  'Bangla Trade House',
  'Pacific Distributors',
  'Eastern Commerce',
  'Royal Traders',
  'Sunrise Wholesale',
  'Nation Suppliers',
  'Evergreen Trading',
  'Crystal Distributors',
  'Diamond Wholesale',
  'Elite Commerce',
];

const SHOP_FIRST = [
  'Rahman',
  'Hossain',
  'Ahmed',
  'Khan',
  'Begum',
  'Akter',
  'Islam',
  'Uddin',
  'Mia',
  'Chowdhury',
  'Siddique',
  'Haque',
  'Khatun',
  'Alam',
  'Ali',
  'Sultana',
  'Bhuiyan',
  'Sarkar',
  'Das',
  'Mondal',
  'Kabir',
  'Reza',
  'Noor',
  'Jahan',
  'Kamal',
  'Sharif',
  'Akbar',
  'Iqbal',
  'Taher',
  'Malek',
];

const SHOP_TYPES = [
  'Store',
  'Shop',
  'Mart',
  'Trading',
  'Enterprise',
  'Varieties',
  'General Store',
  'Grocery',
  'Point',
  'Corner',
  'Bhandar',
  'Dokan',
  'Paiker',
  'Super Shop',
  'Mini Mart',
  'Wholesale',
  'Retail Hub',
];

const SALES_REPS = [
  { first_name: 'Rahim', last_name: 'Uddin', email: 'rahim@salesrep.com' },
  { first_name: 'Karim', last_name: 'Ahmed', email: 'karim@salesrep.com' },
  { first_name: 'Fatima', last_name: 'Akter', email: 'fatima@salesrep.com' },
  { first_name: 'Hasan', last_name: 'Mahmud', email: 'hasan@salesrep.com' },
  { first_name: 'Nusrat', last_name: 'Jahan', email: 'nusrat@salesrep.com' },
  { first_name: 'Tanvir', last_name: 'Hossain', email: 'tanvir@salesrep.com' },
  { first_name: 'Anika', last_name: 'Rahman', email: 'anika@salesrep.com' },
  { first_name: 'Imran', last_name: 'Khan', email: 'imran@salesrep.com' },
  { first_name: 'Saima', last_name: 'Sultana', email: 'saima@salesrep.com' },
  { first_name: 'Arif', last_name: 'Chowdhury', email: 'arif@salesrep.com' },
];

// ─── MAIN SEED ──────────────────────────────────────────────────────────────

async function seed() {
  await AppDataSource.initialize();
  console.log('📦 Database connected\n');

  // Repositories
  const regionRepo = AppDataSource.getRepository(Region);
  const areaRepo = AppDataSource.getRepository(Area);
  const territoryRepo = AppDataSource.getRepository(Territory);
  const distributorRepo = AppDataSource.getRepository(Distributor);
  const userRepo = AppDataSource.getRepository(User);
  const retailerRepo = AppDataSource.getRepository(Retailer);
  const salesRepRetailerRepo = AppDataSource.getRepository(SalesRepRetailer);

  // ─── CLEAR OLD DATA ────────────────────────────────────────────────────
  console.log('🗑️  Clearing old data...');
  await salesRepRetailerRepo.createQueryBuilder().delete().execute();
  await retailerRepo.createQueryBuilder().delete().execute();
  await userRepo.createQueryBuilder().delete().execute();
  await territoryRepo.createQueryBuilder().delete().execute();
  await areaRepo.createQueryBuilder().delete().execute();
  await regionRepo.createQueryBuilder().delete().execute();
  await distributorRepo.createQueryBuilder().delete().execute();
  console.log('   Done.\n');

  // ─── REGIONS ────────────────────────────────────────────────────────────
  console.log('🌍 Creating regions...');
  const regions = regionRepo.create(REGION_DATA.map((name) => ({ name })));
  await regionRepo.save(regions);
  console.log(`   ✅ ${regions.length} regions created`);

  // ─── AREAS ──────────────────────────────────────────────────────────────
  console.log('📍 Creating areas...');
  const regionMap = new Map(regions.map((r) => [r.name, r.id]));
  const areaData: Partial<Area>[] = [];

  for (const [regionName, areaNames] of Object.entries(AREAS_BY_REGION)) {
    const regionId = regionMap.get(regionName);
    if (!regionId) continue;
    for (const name of areaNames) {
      areaData.push({ name, region_id: regionId });
    }
  }

  const areas = areaRepo.create(areaData);
  await areaRepo.save(areas);
  console.log(`   ✅ ${areas.length} areas created`);

  // ─── TERRITORIES ────────────────────────────────────────────────────────
  console.log('🗺️  Creating territories...');
  const territoryData: Partial<Territory>[] = [];

  for (const area of areas) {
    const zoneCount = 3 + Math.floor(Math.random() * 4); // 3-6 zones per area
    for (let i = 1; i <= zoneCount; i++) {
      territoryData.push({
        name: `${area.name} - Zone ${i}`,
        area_id: area.id,
      });
    }
  }

  const territories = territoryRepo.create(territoryData);
  await territoryRepo.save(territories);
  console.log(`   ✅ ${territories.length} territories created`);

  // ─── DISTRIBUTORS ───────────────────────────────────────────────────────
  console.log('🏢 Creating distributors...');
  const distributors = distributorRepo.create(
    DISTRIBUTOR_NAMES.map((name) => ({ name })),
  );
  await distributorRepo.save(distributors);
  console.log(`   ✅ ${distributors.length} distributors created`);

  // ─── USERS ──────────────────────────────────────────────────────────────
  console.log('👤 Creating users...');
  const passwordHash = await bcrypt.hash('Password@123', 10);

  const usersData = [
    // Admin
    {
      first_name: 'Super',
      last_name: 'Admin',
      email: 'admin@salesrep.com',
      password_hash: passwordHash,
      role: UserRole.ADMIN,
      is_active: true,
    },
    // Sales reps
    ...SALES_REPS.map((rep) => ({
      ...rep,
      password_hash: passwordHash,
      role: UserRole.SALES_REP,
      is_active: true,
    })),
  ];

  const users = userRepo.create(usersData);
  await userRepo.save(users);
  console.log(
    `   ✅ ${users.length} users created (1 admin, ${SALES_REPS.length} sales reps)`,
  );

  // ─── RETAILERS (10,000) ─────────────────────────────────────────────────
  console.log('🏪 Creating 10,000 retailers...');
  const TOTAL_RETAILERS = 10000;
  const CHUNK_SIZE = 1000;
  const allRetailers: Retailer[] = [];

  // Pre-build area → territories map for fast lookup
  const areaTerritoryMap = new Map<string, Territory[]>();
  for (const territory of territories) {
    const list = areaTerritoryMap.get(territory.area_id) || [];
    list.push(territory);
    areaTerritoryMap.set(territory.area_id, list);
  }

  // Pre-build region → areas map for fast lookup
  const regionAreaMap = new Map<string, Area[]>();
  for (const area of areas) {
    const list = regionAreaMap.get(area.region_id) || [];
    list.push(area);
    regionAreaMap.set(area.region_id, list);
  }

  for (let chunk = 0; chunk < TOTAL_RETAILERS; chunk += CHUNK_SIZE) {
    const retailerBatch: Partial<Retailer>[] = [];

    for (
      let i = chunk;
      i < Math.min(chunk + CHUNK_SIZE, TOTAL_RETAILERS);
      i++
    ) {
      const region = randomPick(regions);
      const regionAreas = regionAreaMap.get(region.id) || [randomPick(areas)];
      const area = randomPick(regionAreas);
      const areaTerritories = areaTerritoryMap.get(area.id) || [
        randomPick(territories),
      ];
      const territory = randomPick(areaTerritories);
      const distributor = randomPick(distributors);

      retailerBatch.push({
        uid: generateUid(i + 1),
        name: `${randomPick(SHOP_FIRST)} ${randomPick(SHOP_TYPES)}`,
        phone: generatePhone(),
        points: Math.floor(Math.random() * 1000),
        routes: `Route-${Math.floor(Math.random() * 100) + 1}`,
        notes: Math.random() > 0.7 ? `Note for retailer ${i + 1}` : undefined,
        region_id: region.id,
        area_id: area.id,
        territory_id: territory.id,
        distributor_id: distributor.id,
      });
    }

    const created = retailerRepo.create(retailerBatch);
    const saved = await retailerRepo.save(created, { chunk: 500 });
    allRetailers.push(...saved);

    const chunkNum = Math.floor(chunk / CHUNK_SIZE) + 1;
    const totalChunks = Math.ceil(TOTAL_RETAILERS / CHUNK_SIZE);
    console.log(
      `   📦 Chunk ${chunkNum}/${totalChunks}: ${saved.length} retailers inserted`,
    );
  }

  console.log(`   ✅ ${allRetailers.length} retailers created\n`);

  // ─── ASSIGNMENTS ────────────────────────────────────────────────────────
  console.log('🔗 Assigning retailers to sales reps...');
  const salesReps = users.filter((u) => u.role === UserRole.SALES_REP);
  const retailersPerRep = Math.floor(allRetailers.length / salesReps.length);

  const assignmentData: Partial<SalesRepRetailer>[] = [];

  for (let i = 0; i < salesReps.length; i++) {
    const rep = salesReps[i];
    const start = i * retailersPerRep;
    const end =
      i === salesReps.length - 1
        ? allRetailers.length
        : start + retailersPerRep;

    for (let j = start; j < end; j++) {
      assignmentData.push({
        sales_rep_id: rep.id,
        retailer_id: allRetailers[j].id,
      });
    }

    console.log(
      `   👤 ${rep.first_name} ${rep.last_name}: ${end - start} retailers`,
    );
  }

  // Bulk insert assignments in chunks
  let totalAssigned = 0;
  for (let i = 0; i < assignmentData.length; i += CHUNK_SIZE) {
    const chunk = assignmentData.slice(i, i + CHUNK_SIZE);
    const created = salesRepRetailerRepo.create(chunk);
    await salesRepRetailerRepo.save(created, { chunk: 500 });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    totalAssigned += chunk.length;
  }

  await AppDataSource.destroy();
}

seed().catch((error) => {
  console.error('❌ Error during seeding:', error);
  process.exit(1);
});
