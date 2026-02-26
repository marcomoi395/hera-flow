import { Schema, model } from 'mongoose'

interface IWarrantyHistory extends Document {
    sequenceNumber: number
    contractNumber: Types.ObjectId
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
        contractNumber: {
            type: Schema.Types.ObjectId,
            ref: MaintenanceContract
        },
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

export const WarrantyHistory = model<IWarrantyHistory>(
    'WarrantyHistory',
    WarrantyHistorySchema,
    'warranty_history'
)
