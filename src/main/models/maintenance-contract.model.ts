import { Schema, model } from 'mongoose'

interface IMaintenanceContract extends Document {
    contractNumber: string
    startDate: Date
    endDate: Date
    specifications: string[]
}

const MaintenanceContractSchema = new Schema<IMaintenanceContract>(
    {
        contractNumber: { type: String, unique: true },
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true }, // Sửa từ string sang Date cho chuẩn ní nhé
        specifications: [{ type: String }]
    },
    { timestamps: true }
)

export const MaintenanceContract = model<IMaintenanceContract>('MaintenanceContract', MaintenanceContractSchema, 'maintenance_contract')
