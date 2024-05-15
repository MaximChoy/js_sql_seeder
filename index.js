const dotenv = require('dotenv');
dotenv.config();
const fs = require('fs');
const yargs = require('yargs');
const { hideBin } = require('yargs/helpers');
const argv = yargs(hideBin(process.argv)).argv;

let dbClient;

const dbConfigs = {
  mysql: {
    module: 'mysql2/promise',
    config: {
      host: process.env.MYSQL_HOST,
      user: process.env.MYSQL_USER,
      database: process.env.MYSQL_DATABASE,
      password: process.env.MYSQL_PASSWORD,
      port: process.env.MYSQL_PORT,
    },
  },
  postgres: {
    module: 'pg',
    config: {
      user: process.env.PG_USER,
      host: process.env.PG_HOST,
      database: process.env.PG_DATABASE,
      password: process.env.PG_PASSWORD,
      port: process.env.PG_PORT,
    },
  },
};

async function initializeDB() {
  const dbType = argv.db;
  const dbConfig = dbConfigs[dbType];

  if (!dbConfig) {
    console.error('Please specify a valid database using --db=mysql or --db=postgres');
    process.exit(1);
  }

  const dbModule = require(dbConfig.module);
  dbClient = new dbModule.Client(dbConfig.config);

  try {
    await dbClient.connect();
    console.log(`Connected to the ${dbType} database`);
  } catch (error) {
    console.error('Failed to connect to the database', error);
    process.exit(1);
  }
}

async function seedDatabase() {
  let connection;
  try {
    connection = dbClient;
    const data = JSON.parse(fs.readFileSync('./db/seedData.json', 'utf8'));

    const tableInsertions = {
      Categories: data.categories,
      Products: data.products,
      ProductLists: data.productLists,
      Clients: data.clients,
      Orders: data.orders,
      Transport: data.transport,
      OrderDetails: data.orderDetails,
      Warehouses: data.warehouses,
    };

    for (const [tableName, rows] of Object.entries(tableInsertions)) {
      if (rows.length > 0) {
        const keys = Object.keys(rows[0]);
        const values = rows.map(row => `(${Object.values(row).map(value => (argv.db === 'mysql' ? dbClient.escape(value) : `'${value}'`)).join(', ')})`).join(', ');
        const query = `INSERT INTO ${tableName} (${keys.join(', ')}) VALUES ${values};`;
        await connection.query(query);
      }
    }

    console.log('Data has been seeded successfully.');
  } catch (err) {
    console.error('Error seeding data:', err);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Disconnected from the database.');
    }
  }
}

async function main() {
  await initializeDB();
  await seedDatabase();
}

main();
