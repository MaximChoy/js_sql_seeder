const { Client } = require('pg');
const dotenv = require('dotenv');
const fs = require('fs');
dotenv.config();

const client = new Client({
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    password: process.env.PG_PASSWORD,
    port: process.env.PG_PORT,
  });


  const seedDatabase = async () => {
    try {
      await client.connect();
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
          const values = rows.map(row => `(${Object.values(row).map(value => `'${value}'`).join(', ')})`).join(', ');
          const query = `INSERT INTO ${tableName} (${keys.join(', ')}) VALUES ${values};`;
          await client.query(query);
        }
      }
  
      console.log('Data has been seeded successfully.');
  
    } catch (err) {
      console.error('Error seeding data:', err.stack);
    } finally {
      await client.end();
      console.log('Disconnected from the database.');
    }
  };
  
  seedDatabase();