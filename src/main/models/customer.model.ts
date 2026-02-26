import { Types, Schema, model } from 'mongoose'

export interface ICustomer extends Document {
    customerName: string
    companyName?: string
    address: string
    contractSigningDate?: Date
    acceptanceSigningDate?: Date
    warrantyExpirationDate?: Date
    maintenanceContracts: Types.ObjectId[]
    warrantyHistory: Types.ObjectId[]
    notes: string[]
    isDeleted: boolean
}

const CustomerSchema = new Schema<ICustomer>(
    {
        customerName: { type: String, required: true },
        companyName: { type: String },
        address: { type: String, required: true },
        contractSigningDate: { type: Date },
        acceptanceSigningDate: { type: Date },
        warrantyExpirationDate: { type: Date },

        maintenanceContracts: [
            {
                type: Schema.Types.ObjectId,
                ref: 'MaintenanceContract'
            }
        ],

        warrantyHistory: [
            {
                type: Schema.Types.ObjectId,
                ref: 'WarrantyHistory'
            }
        ],

        notes: [{ type: String }],
        isDeleted: { type: Boolean, default: false }
    },
    { timestamps: true }
)

export const Customer = model<ICustomer>('Customer', CustomerSchema, 'customer')
