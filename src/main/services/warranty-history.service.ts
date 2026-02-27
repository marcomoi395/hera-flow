import { WarrantyHistory } from '../models/warranty-history.model'
import { Customer } from '../models/customer.model'

export type WarrantyTaskType =
    | 'maintenance'
    | 'warranty'
    | 'customer requested repair'
    | 'company requested repair'
    | 'other'

export interface CreateWarrantyHistoryData {
    customerId: string
    sequenceNumber: number
    contractNumber?: string
    date: Date
    taskType: WarrantyTaskType
    maintenanceContents?: string[]
}

export interface UpdateWarrantyHistoryData {
    sequenceNumber?: number
    date?: Date
    taskType?: WarrantyTaskType
    maintenanceContents?: string[]
}

export class WarrantyHistoryService {
    static async getAllByCustomer(customerId: string) {
        try {
            const customer = await Customer.findOne({ _id: customerId, isDeleted: false })
                .populate('warrantyHistory')
                .lean()
            if (!customer) {
                throw new Error('Customer not found: ' + customerId)
            }
            return customer.warrantyHistory
        } catch (error) {
            console.error('Error fetching warranty history:', error)
            throw error
        }
    }

    static async getById(id: string) {
        try {
            const entry = await WarrantyHistory.findById(id).lean()

            if (!entry) {
                throw new Error('Warranty history entry not found: ' + id)
            }
            return entry
        } catch (error) {
            console.error('Error fetching warranty history entry:', error)
            throw error
        }
    }

    static async create(data: CreateWarrantyHistoryData) {
        try {
            const entry = new WarrantyHistory({
                sequenceNumber: data.sequenceNumber,
                contractNumber: data.contractNumber ?? null,
                date: data.date,
                taskType: data.taskType,
                maintenanceContents: data.maintenanceContents ?? []
            })
            const saved = await entry.save()

            await Customer.findByIdAndUpdate(data.customerId, {
                $push: { warrantyHistory: saved._id }
            })

            return saved.toObject()
        } catch (error) {
            console.error('Error creating warranty history entry:', error)
            throw error
        }
    }

    static async update(id: string, data: UpdateWarrantyHistoryData) {
        try {
            const updated = await WarrantyHistory.findByIdAndUpdate(id, data, {
                returnDocument: 'after'
            }).lean()

            if (!updated) {
                throw new Error('Warranty history entry not found: ' + id)
            }

            return updated
        } catch (error) {
            console.error('Error updating warranty history entry:', error)
            throw error
        }
    }

    static async delete(id: string) {
        try {
            const deleted = await WarrantyHistory.findByIdAndUpdate(
                id,
                { isDeleted: true },
                { returnDocument: 'after' }
            ).lean()

            if (!deleted) {
                throw new Error('Warranty history entry not found: ' + id)
            }

            await Customer.updateMany({ warrantyHistory: id }, { $pull: { warrantyHistory: id } })

            return deleted
        } catch (error) {
            console.error('Error deleting warranty history entry:', error)
            throw error
        }
    }
}
