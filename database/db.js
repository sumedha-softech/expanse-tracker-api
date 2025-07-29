const mongoose = require('mongoose');

const ConnectToDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI)
        console.log(`Database Connected: ${conn.connection.host} (${conn.connection.name})`);
    }
    catch (error) {
        console.error('Failed To Connect Database...', error);
        process.exit(1);
    }
}

module.exports = ConnectToDB;