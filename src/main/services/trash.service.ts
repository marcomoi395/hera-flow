import { Customer } from '../models/customer.model'
import { MaintenanceContract } from '../models/maintenance-contract.model'
import { Elevator } from '../models/elevator.model'
import '../models/warranty-history.model'

export class TrashService {
    static async getDeletedCustomers() {
        try {
            const customers = await Customer.find({ isDeleted: true })
                .populate({ path: 'maintenanceContracts', match: { isDeleted: false } })
                .lean()
            return customers.map((c) => ({ ...c, _id: c._id.toString() }))
        } catch (error) {
            console.error('Error fetching deleted customers:', error)
            throw error
        }
    }

    static async getDeletedContracts() {
        try {
            const contracts = await MaintenanceContract.find({
                isDeleted: true,
                deletedByParent: null
            }).lean()
            return contracts.map((c) => ({ ...c, _id: c._id.toString() }))
        } catch (error) {
            console.error('Error fetching deleted contracts:', error)
            throw error
        }
    }

    static async restoreCustomer(id: string) {
        try {
            const restored = await Customer.findOneAndUpdate(
                { _id: id, isDeleted: true },
                { isDeleted: false },
                { returnDocument: 'after' }
            ).lean()

            if (!restored) {
                throw new Error('Deleted customer not found: ' + id)
            }

            // Restore only contracts that were deleted as a result of this customer being deleted
            await MaintenanceContract.updateMany(
                { deletedByParent: restored._id, isDeleted: true },
                { isDeleted: false, deletedByParent: null }
            )

            return { ...restored, _id: restored._id.toString() }
        } catch (error) {
            console.error('Error restoring customer:', error)
            throw error
        }
    }

    static async restoreContract(id: string) {
        try {
            const restored = await MaintenanceContract.findOneAndUpdate(
                { _id: id, isDeleted: true, deletedByParent: null },
                { isDeleted: false },
                { returnDocument: 'after' }
            ).lean()

            if (!restored) {
                throw new Error('Deleted contract not found: ' + id)
            }

            return { ...restored, _id: restored._id.toString() }
        } catch (error) {
            console.error('Error restoring contract:', error)
            throw error
        }
    }

    static async permanentDeleteCustomer(id: string) {
        try {
            const customer = await Customer.findOneAndDelete({ _id: id, isDeleted: true }).lean()

            if (!customer) {
                throw new Error('Deleted customer not found: ' + id)
            }

            // Permanently delete contracts that were cascade-deleted with this customer
            const contracts = await MaintenanceContract.find({
                deletedByParent: customer._id
            }).lean()
            const elevatorIds = contracts.flatMap((c) => c.equipmentItems ?? [])
            if (elevatorIds.length > 0) {
                await Elevator.deleteMany({ _id: { $in: elevatorIds } })
            }
            await MaintenanceContract.deleteMany({ deletedByParent: customer._id })

            return { _id: id }
        } catch (error) {
            console.error('Error permanently deleting customer:', error)
            throw error
        }
    }

    static async permanentDeleteContract(id: string) {
        try {
            const contract = await MaintenanceContract.findOneAndDelete({
                _id: id,
                isDeleted: true,
                deletedByParent: null
            }).lean()

            if (!contract) {
                throw new Error('Deleted contract not found: ' + id)
            }

            if (contract.equipmentItems?.length) {
                await Elevator.deleteMany({ _id: { $in: contract.equipmentItems } })
            }

            return { _id: id }
        } catch (error) {
            console.error('Error permanently deleting contract:', error)
            throw error
        }
    }

    static async emptyTrash() {
        try {
            // Delete elevators belonging to all soft-deleted contracts
            const contracts = await MaintenanceContract.find({ isDeleted: true }).lean()
            const elevatorIds = contracts.flatMap((c) => c.equipmentItems ?? [])
            if (elevatorIds.length > 0) {
                await Elevator.deleteMany({ _id: { $in: elevatorIds } })
            }
            // Delete all individually-deleted contracts (no parent)
            await MaintenanceContract.deleteMany({ isDeleted: true, deletedByParent: null })
            // Delete all cascade-deleted contracts along with their customers
            await MaintenanceContract.deleteMany({ isDeleted: true })
            // Delete all soft-deleted customers
            await Customer.deleteMany({ isDeleted: true })
            return { success: true }
        } catch (error) {
            console.error('Error emptying trash:', error)
            throw error
        }
    }
}
