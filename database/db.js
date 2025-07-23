const mongoose = require('mongoose');


const  ConnectToDB = async () => {
   
     mongoose.connect(process.env.MONGO_URI)
    try {
    
        console.log('MongoDb Connected Successful....')
    }
    catch (error) {
        console.error('Failed To Connect Datebase...',error)
    }
}

module.exports = ConnectToDB;