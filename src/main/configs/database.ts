import mongoose from 'mongoose'

class Database {
    private static instance: Database
    private currentUrl: string | null = null

    private constructor() {}

    public async connect(url: string): Promise<void> {
        if (process.env.NODE_ENV === 'dev') {
            mongoose.set('debug', true)
            mongoose.set('debug', { color: true })
        }

        const readyState = mongoose.connection.readyState
        if (readyState === 1 && this.currentUrl === url) {
            return
        }
        if (readyState === 2 && this.currentUrl === url) {
            await new Promise<void>((resolve) => mongoose.connection.once('connected', resolve))
            return
        }

        if (readyState !== 0) {
            await mongoose.disconnect()
        }

        this.currentUrl = url
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
