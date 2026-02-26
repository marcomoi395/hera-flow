import { Types, Schema, model } from 'mongoose'
import { Elevator } from './elevator.model'

interface IMaintenanceContract extends Document {
    contractNumber: string
    startDate: Date
    endDate: Date
    equipmentItems: Types.ObjectId[]
    isDeleted: boolean
}

const MaintenanceContractSchema = new Schema<IMaintenanceContract>(
    {
        contractNumber: { type: String, unique: true },
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true },
        equipmentItems: [
            {
                type: Schema.Types.ObjectId,
                ref: Elevator
            }
        ],
        isDeleted: { type: Boolean, default: false }
    },
    { timestamps: true }
)

export const MaintenanceContract = model<IMaintenanceContract>(
    'MaintenanceContract',
    MaintenanceContractSchema,
    'maintenance_contract'
)
