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
                    equipmentItems: (contract.equipmentItems ?? []).map((item: any) => ({
                        ...item,
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
}
