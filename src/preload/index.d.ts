import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
    interface Window {
        electron: ElectronAPI
        api: {
            getAllCustomers: () => Promise<any[]>
            getCustomerById: (id: string) => Promise<any>
            createCustomer: (data: any) => Promise<any>
            updateCustomer: (id: string, data: any) => Promise<any>
            deleteCustomer: (id: string) => Promise<any>

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

            trashGetDeletedCustomers: () => Promise<any[]>
            trashGetDeletedContracts: () => Promise<any[]>
            trashRestoreCustomer: (id: string) => Promise<any>
            trashRestoreContract: (id: string) => Promise<any>
            trashPermanentDeleteCustomer: (id: string) => Promise<any>
            trashPermanentDeleteContract: (id: string) => Promise<any>
            trashEmpty: () => Promise<any>

            getMaintenanceReportCandidates: () => Promise<any[]>
            generateMaintenanceReports: (requests: any[]) => Promise<{ canceled: boolean; files: string[] }>
        }
    }
}
