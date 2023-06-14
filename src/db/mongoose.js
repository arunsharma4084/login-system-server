const mongoose = require('mongoose')

async function main() {
    await mongoose.connect(process.env.MONGODB_URL, {
        serverSelectionTimeoutMS: 25000
    })
    console.log("Connected to database server")

    return 'Done!'
}

main()
    .then(console.log)
    .catch(console.error)
    // .finally(() => mongoose.connection.close())