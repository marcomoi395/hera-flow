import { Schema, model } from 'mongoose'

interface IWarrantyHistory extends Document {
    sequenceNumber: number
    date: Date
    taskType:
        | 'maintenance'
        | 'warranty'
        | 'customer requested repair'
        | 'company requested repair'
        | 'other'
    maintenanceContents: string[]
}

const WarrantyHistorySchema = new Schema<IWarrantyHistory>(
    {
        sequenceNumber: { type: Number, required: true },
        date: { type: Date, required: true },
        taskType: {
            type: String,
            enum: [
                'maintenance',
                'warranty',
                'customer requested repair',
                'company requested repair',
                'other'
            ],
            required: true
        },
        maintenanceContents: [{ type: String }]
    },
    { timestamps: true }
)

export const WarrantyHistory = model<IWarrantyHistory>('WarrantyHistory', WarrantyHistorySchema, 'warranty_history')
