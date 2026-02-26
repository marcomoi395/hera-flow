import { Schema, model, Document, Types } from 'mongoose'

export interface IElevator extends Document {
    weight: Types.Decimal128
    numberOfStops: number
    quantity: number
}

const ElevatorSchema = new Schema<IElevator>(
    {
        weight: { type: Schema.Types.Decimal128, required: true },
        numberOfStops: { type: Number, required: true },
        quantity: { type: Number, required: true }
    },
    { timestamps: true }
)

export const Elevator = model<IElevator>('Elevator', ElevatorSchema)
