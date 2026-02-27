import { Customer, ICustomer } from '../models/customer.model'
import '../models/maintenance-contract.model'
import '../models/elevator.model'
import '../models/warranty-history.model'

export interface CreateCustomerData {
    customerName: string
    companyName: string
    address: string
    contractSigningDate?: Date | null
    acceptanceSigningDate?: Date | null
    warrantyExpirationDate?: Date | null
    notes?: string
}

export interface UpdateCustomerData {
    customerName?: string
    companyName?: string
    address?: string
    contractSigningDate?: Date | null
    acceptanceSigningDate?: Date | null
    warrantyExpirationDate?: Date | null
    notes?: string[]
}

export class CustomerService {
    static async getAllCustomers(): Promise<ICustomer[]> {
        try {
            const customers = await Customer.find({ isDeleted: false })
                .populate('maintenanceContracts')
                .lean()
            return customers.map((c) => ({ ...c, _id: c._id.toString() })) as any
        } catch (error) {
            console.error('', error)
            throw error
        }
    }

    static async getCustomerById(id: string) {
        try {
            const customer = await Customer.findOne({ _id: id, isDeleted: false })
                .populate({ path: 'maintenanceContracts', populate: { path: 'equipmentItems' } })
                .populate('warrantyHistory')
                .lean()

            if (!customer) {
                throw new Error('Not found customer with id: ' + id)
            }

            const result: any = { ...customer, _id: customer._id.toString() }
            // Convert Decimal128 weight to plain number in nested elevator items
            if (Array.isArray(result.maintenanceContracts)) {
                result.maintenanceContracts = result.maintenanceContracts.map((contract: any) => ({
                    ...contract,
                    _id: contract._id.toString(),
                    equipmentItems: (contract.equipmentItems ?? []).map((item: any) => ({
                        ...item,
                        _id: item._id?.toString(),
                        weight: parseFloat(item.weight?.toString() ?? '0')
                    }))
                }))
            }
            return result
        } catch (error) {
            console.error('Lỗi khi lấy thông tin chi tiết khách hàng:', error)
            throw error
        }
    }

    static async createCustomer(data: CreateCustomerData) {
        const newCustomer = new Customer({
            customerName: data.customerName,
            companyName: data.companyName,
            address: data.address,
            contractSigningDate: data.contractSigningDate || null,
            acceptanceSigningDate: data.acceptanceSigningDate || null,
            warrantyExpirationDate: data.warrantyExpirationDate || null,
            notes: data.notes ? [data.notes] : [],
            maintenanceContracts: [],
            warrantyHistory: []
        })

        return (await newCustomer.save()).toObject()
    }

    static async updateCustomer(id: string, data: UpdateCustomerData) {
        try {
            const updated = await Customer.findOneAndUpdate(
                { _id: id, isDeleted: false },
                {
                    ...(data.customerName !== undefined && { customerName: data.customerName }),
                    ...(data.companyName !== undefined && { companyName: data.companyName }),
                    ...(data.address !== undefined && { address: data.address }),
                    ...(data.contractSigningDate !== undefined && {
                        contractSigningDate: data.contractSigningDate
                    }),
                    ...(data.acceptanceSigningDate !== undefined && {
                        acceptanceSigningDate: data.acceptanceSigningDate
                    }),
                    ...(data.warrantyExpirationDate !== undefined && {
                        warrantyExpirationDate: data.warrantyExpirationDate
                    }),
                    ...(data.notes !== undefined && { notes: data.notes })
                },
                { returnDocument: 'after' }
            ).lean()

            if (!updated) {
                throw new Error('Customer not found: ' + id)
            }

            return { ...updated, _id: updated._id.toString() }
        } catch (error) {
            console.error('Lỗi khi cập nhật khách hàng:', error)
            throw error
        }
    }

    static async deleteCustomer(id: string) {
        try {
            const deleted = await Customer.findOneAndUpdate(
                { _id: id, isDeleted: false },
                { isDeleted: true },
                { returnDocument: 'after' }
            ).lean()

            if (!deleted) {
                throw new Error('Customer not found: ' + id)
            }

            return { ...deleted, _id: deleted._id.toString() }
        } catch (error) {
            console.error('Lỗi khi xóa khách hàng:', error)
            throw error
        }
    }
}
