import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
    interface Window {
        electron: ElectronAPI
        api: {
            getAllCustomers: () => Promise<any[]>
            getCustomerById: (id: string) => Promise<any>
            createCustomer: (data: any) => Promise<any>

            getAllMaintenanceContracts: (customerId: string) => Promise<any[]>
            getMaintenanceContract: (id: string) => Promise<any>
            createMaintenanceContract: (data: any) => Promise<any>
            updateMaintenanceContract: (id: string, data: any) => Promise<any>
            deleteMaintenanceContract: (id: string) => Promise<any>

            getAllWarrantyHistory: (customerId: string) => Promise<any[]>
            getWarrantyHistory: (id: string) => Promise<any>
            createWarrantyHistory: (data: any) => Promise<any>
            updateWarrantyHistory: (id: string, data: any) => Promise<any>
            deleteWarrantyHistory: (id: string) => Promise<any>
        }
    }
}
