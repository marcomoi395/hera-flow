import { MaintenanceContract } from '../models/maintenance-contract.model'
import { Customer } from '../models/customer.model'
import { Elevator } from '../models/elevator.model'

export interface ElevatorItemData {
    weight: number
    numberOfStops: number
    quantity: number
}

export interface CreateMaintenanceContractData {
    customerId: string
    contractNumber: string
    startDate: Date
    endDate: Date
    equipmentItems?: ElevatorItemData[]
}

export interface UpdateMaintenanceContractData {
    contractNumber?: string
    startDate?: Date
    endDate?: Date
    equipmentItems?: ElevatorItemData[]
}

export class MaintenanceContractService {
    static async getAllByCustomer(customerId: string) {
        try {
            const customer = await Customer.findOne({ _id: customerId, isDeleted: false })
                .populate({ path: 'maintenanceContracts', match: { isDeleted: false } })
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
            const contract = await MaintenanceContract.findOne({ _id: id, isDeleted: false }).lean()

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
        const elevatorIds: string[] = []
        try {
            for (const item of data.equipmentItems ?? []) {
                const elevator = await new Elevator({
                    weight: item.weight,
                    numberOfStops: item.numberOfStops,
                    quantity: item.quantity
                }).save()
                elevatorIds.push(elevator._id.toString())
            }

            const contract = new MaintenanceContract({
                contractNumber: data.contractNumber,
                startDate: data.startDate,
                endDate: data.endDate,
                equipmentItems: elevatorIds
            })
            const saved = await contract.save()

            await Customer.findByIdAndUpdate(data.customerId, {
                $push: { maintenanceContracts: saved._id }
            })

            return saved.toObject()
        } catch (error: any) {
            // Roll back any created Elevator documents
            if (elevatorIds.length > 0) {
                await Elevator.deleteMany({ _id: { $in: elevatorIds } })
            }
            if (error.code === 11000) {
                throw new Error(`Số hợp đồng "${data.contractNumber}" đã tồn tại`)
            }
            console.error('Error creating maintenance contract:', error)
            throw error
        }
    }

    static async update(id: string, data: UpdateMaintenanceContractData) {
        try {
            const contract = await MaintenanceContract.findById(id)
            if (!contract) {
                throw new Error('Maintenance contract not found: ' + id)
            }

            let newElevatorIds: string[] | undefined
            if (data.equipmentItems !== undefined) {
                // Remove old elevator documents and create new ones
                if (contract.equipmentItems?.length) {
                    await Elevator.deleteMany({ _id: { $in: contract.equipmentItems } })
                }
                newElevatorIds = []
                for (const item of data.equipmentItems) {
                    const elevator = await new Elevator({
                        weight: item.weight,
                        numberOfStops: item.numberOfStops,
                        quantity: item.quantity
                    }).save()
                    newElevatorIds.push(elevator._id.toString())
                }
            }

            const updatePayload: any = {
                ...(data.contractNumber !== undefined && { contractNumber: data.contractNumber }),
                ...(data.startDate !== undefined && { startDate: data.startDate }),
                ...(data.endDate !== undefined && { endDate: data.endDate }),
                ...(newElevatorIds !== undefined && { equipmentItems: newElevatorIds })
            }

            const updated = await MaintenanceContract.findByIdAndUpdate(id, updatePayload, {
                returnDocument: 'after'
            }).lean()

            return updated
        } catch (error: any) {
            if (error.code === 11000) {
                throw new Error(`Số hợp đồng "${data.contractNumber}" đã tồn tại`)
            }
            console.error('Error updating maintenance contract:', error)
            throw error
        }
    }

    static async delete(id: string) {
        try {
            const deleted = await MaintenanceContract.findByIdAndUpdate(
                id,
                { isDeleted: true },
                { returnDocument: 'after' }
            ).lean()

            if (!deleted) {
                throw new Error('Maintenance contract not found: ' + id)
            }

            return deleted
        } catch (error) {
            console.error('Error deleting maintenance contract:', error)
            throw error
        }
    }
}
