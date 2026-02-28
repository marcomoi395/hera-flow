import mongoose from 'mongoose'

class Database {
    private static instance: Database

    private constructor() {}

    public async connect(url: string): Promise<void> {
        if (process.env.NODE_ENV === 'dev') {
            mongoose.set('debug', true)
            mongoose.set('debug', { color: true })
        }

        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect()
        }

        await mongoose.connect(url, {
            maxPoolSize: 50,
            serverSelectionTimeoutMS: 5000
        })
        console.log('Connected to MongoDB successfully')
    }

    public static getInstance(): Database {
        if (!Database.instance) {
            Database.instance = new Database()
        }
        return Database.instance
    }
}

export default Database
