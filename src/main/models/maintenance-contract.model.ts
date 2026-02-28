import { Types, Schema, model } from 'mongoose'
import { Elevator } from './elevator.model'

interface IMaintenanceContract extends Document {
    contractNumber: string
    startDate: Date
    endDate: Date
    equipmentItems: Types.ObjectId[]
    isWarrantyOnly: boolean
    isDeleted: boolean
    deletedByParent: Types.ObjectId | null
}

const MaintenanceContractSchema = new Schema<IMaintenanceContract>(
    {
        contractNumber: { type: String, sparse: true },
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true },
        equipmentItems: [
            {
                type: Schema.Types.ObjectId,
                ref: Elevator
            }
        ],
        isWarrantyOnly: { type: Boolean, default: false },
        isDeleted: { type: Boolean, default: false },
        deletedByParent: { type: Schema.Types.ObjectId, default: null }
    },
    { timestamps: true }
)

export const MaintenanceContract = model<IMaintenanceContract>(
    'MaintenanceContract',
    MaintenanceContractSchema,
    'maintenance_contract'
)
