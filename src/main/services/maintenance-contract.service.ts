import { MaintenanceContract } from '../models/maintenance-contract.model'
import { Customer } from '../models/customer.model'

export interface CreateMaintenanceContractData {
    customerId: string
    contractNumber: string
    startDate: Date
    endDate: Date
    equipmentItems?: string[]
}

export interface UpdateMaintenanceContractData {
    contractNumber?: string
    startDate?: Date
    endDate?: Date
    equipmentItems?: string[]
}

export class MaintenanceContractService {
    static async getAllByCustomer(customerId: string) {
        try {
            const customer = await Customer.findOne({ _id: customerId, isDeleted: false })
                .populate('maintenanceContracts')
                .lean()

            if (!customer) {
                throw new Error('Customer not found: ' + customerId)
            }

            return customer.maintenanceContracts
        } catch (error) {
            console.error('Error fetching maintenance contracts:', error)
            throw error
        }
    }

    static async getById(id: string) {
        try {
            const contract = await MaintenanceContract.findById(id).lean()

            if (!contract) {
                throw new Error('Maintenance contract not found: ' + id)
            }

            return contract
        } catch (error) {
            console.error('Error fetching maintenance contract:', error)
            throw error
        }
    }

    static async create(data: CreateMaintenanceContractData) {
        try {
            const contract = new MaintenanceContract({
                contractNumber: data.contractNumber,
                startDate: data.startDate,
                endDate: data.endDate,
                equipmentItems: data.equipmentItems ?? []
            })
            const saved = await contract.save()

            await Customer.findByIdAndUpdate(data.customerId, {
                $push: { maintenanceContracts: saved._id }
            })

            return saved.toObject()
        } catch (error) {
            console.error('Error creating maintenance contract:', error)
            throw error
        }
    }

    static async update(id: string, data: UpdateMaintenanceContractData) {
        try {
            const updated = await MaintenanceContract.findByIdAndUpdate(id, data, {
                new: true
            }).lean()

            if (!updated) {
                throw new Error('Maintenance contract not found: ' + id)
            }

            return updated
        } catch (error) {
            console.error('Error updating maintenance contract:', error)
            throw error
        }
    }

    static async delete(id: string) {
        try {
            const deleted = await MaintenanceContract.findByIdAndUpdate(
                id,
                { isDeleted: true },
                { new: true }
            ).lean()

            if (!deleted) {
                throw new Error('Maintenance contract not found: ' + id)
            }

            await Customer.updateMany(
                { maintenanceContracts: id },
                { $pull: { maintenanceContracts: id } }
            )

            return deleted
        } catch (error) {
            console.error('Error deleting maintenance contract:', error)
            throw error
        }
    }
}
