import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
    interface Window {
        electron: ElectronAPI
        api: {
            getAllCustomers: () => Promise<any[]>
            getCustomerById: (id: string) => Promise<any>
            createCustomer: (data: any) => Promise<any>
        }
    }
}
