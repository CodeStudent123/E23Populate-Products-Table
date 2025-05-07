import sql from 'mssql'; 

const dbConfig = {
    user: 'tze1@proton.me@webdevelopment',
    password: 'Waggle7-Obligate-Rudder',
    server: 'webdevelopment.database.windows.net', 
    database: 'WebDevelopment',
    options: {
        encrypt: true, 
        trustServerCertificate: false 
    }
};

const productsApiUrl = 'https://mdn.github.io/learning-area/javascript/apis/fetching-data/can-store/products.json';

async function connectToDb() {
    try {
        await sql.connect(dbConfig);
        console.log('✅ Connected to Azure SQL Database');
    } catch (err) {
        console.error('❌ Database connection failed:', err);
        throw err; 
    }
}

async function populateProductsTable() {
    let products; 
    try {
        console.log('⏳ Fetching products from API...');
        const response = await fetch(productsApiUrl); 
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        products = await response.json(); 
        console.log(`✅ Fetched ${products.length} products from API.`);

        const checkRequest = new sql.Request();

        const checkQuery = 'SELECT COUNT(*) as productCount FROM Products;';
        const result = await checkRequest.query(checkQuery);

        if (result.recordset[0].productCount === 0) {
            console.log('ℹ️ Products table is empty. Populating now...');
            for (const product of products) {
                const insertRequest = new sql.Request(); 
                const insertQuery = `
                    INSERT INTO Products (name, price, image, type)
                    VALUES (@name, @price, @image, @type)
                `;

                insertRequest.input('name', sql.NVarChar, product.name || 'N/A');
                insertRequest.input('price', sql.Decimal(10, 2), product.price || 0.00);
                insertRequest.input('image', sql.NVarChar, product.image || 'no-image.jpg');
                insertRequest.input('type', sql.NVarChar, product.type || 'unknown');

                await insertRequest.query(insertQuery);
            }
            console.log('✅ Products table populated with', products.length, 'products');
        } else {
            console.log('ℹ️ Products table already contains', result.recordset[0].productCount, 'products. No action taken.');
        }

    } catch (err) {
        console.error('❌ Error populating Products table:', err);
    } finally {
        if (sql.connected) { 
             await sql.close();
             console.log('ℹ️ Database connection closed.');
        }
    }
}

async function main() {
    try {
        await connectToDb();
        await populateProductsTable();
    } catch (error) {
        console.error('❌ An error occurred in the main process execution:', error.message);
    }
}

main();