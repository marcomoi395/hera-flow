import mongoose from 'mongoose'

class Database {
    private static instance: Database

    private constructor() {
        this.connect()
    }

    private connect(type: string = 'mongodb'): void {
        if (process.env.NODE_ENV === 'dev') {
            mongoose.set('debug', true)
            mongoose.set('debug', { color: true })
        }

        console.log(process.env.MONGO_URL)

        if (process.env.MONGO_URL === undefined) {
            console.error('MONGO_URL is not defined in environment variables')
            return
        }

        mongoose
            .connect(process.env.MONGO_URL, {
                maxPoolSize: 50
            })
            .then(() => {
                console.log(`Connected to ${type} successfully`)
            })
            .catch((err: Error) => {
                console.error(`Error Connect to ${type}:`, err.message)
            })
    }

    public static getInstance(): Database {
        if (!Database.instance) {
            Database.instance = new Database()
        }
        return Database.instance
    }
}

export default Database
