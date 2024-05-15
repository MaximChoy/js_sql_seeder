const { Client } = require('pg');
const dotenv = require('dotenv');
const fs = require('fs');
dotenv.config();
const yargs = require('yargs');
const { hideBin } = require('yargs/helpers');

const argv = yargs(hideBin(process.argv)).argv;

let dbClient;
let connectionConfig;

if (argv.db === 'mysql') {
  const mysql = require('mysql2/promise');
  dbClient = mysql;
  connectionConfig = {
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    database: process.env.MYSQL_DATABASE,
    password: process.env.MYSQL_PASSWORD,
    port: process.env.MYSQL_PORT,
  };
} else if (argv.db === 'postgres') {
  const { Client } = require('pg');
  dbClient = Client;
  connectionConfig = {
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    password: process.env.PG_PASSWORD,
    port: process.env.PG_PORT,
  };
} else {
  console.error('Please specify a valid database using --db=mysql or --db=postgres');
  process.exit(1);
}

const seedDatabase = async () => {
    let connection;
    try {
      if (argv.db === 'mysql') {
        connection = await dbClient.createConnection(connectionConfig);
      } else {
        connection = new dbClient(connectionConfig);
        await connection.connect();
      }
      console.log('Connected to the database.');
  
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
          if (argv.db === 'mysql') {
            await connection.execute(query);
          } else {
            await connection.query(query);
          }
        }
      }
  
      console.log('Data has been seeded successfully.');
  
    } catch (err) {
      console.error('Error seeding data:', err);
    } finally {
      if (connection) {
        if (argv.db === 'mysql') {
          await connection.end();
        } else {
          await connection.end();
        }
        console.log('Disconnected from the database.');
      }
    }
  };
  
  seedDatabase();