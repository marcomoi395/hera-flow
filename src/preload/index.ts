import { contextBridge } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { CreateCustomerData, UpdateCustomerData } from '../main/services/customer.service'
import {
    CreateMaintenanceContractData,
    UpdateMaintenanceContractData
} from '../main/services/maintenance-contract.service'
import {
    CreateWarrantyHistoryData,
    UpdateWarrantyHistoryData
} from '../main/services/warranty-history.service'

// Custom APIs for renderer
const api = {
    getAllCustomers: () => electronAPI.ipcRenderer.invoke('get-all-customers'),
    getCustomerById: (id: string) => electronAPI.ipcRenderer.invoke('get-customer-by-id', id),
    createCustomer: (data: CreateCustomerData) =>
        electronAPI.ipcRenderer.invoke('create-customer', data),
    updateCustomer: (id: string, data: UpdateCustomerData) =>
        electronAPI.ipcRenderer.invoke('update-customer', id, data),
    deleteCustomer: (id: string) => electronAPI.ipcRenderer.invoke('delete-customer', id),

    getAllMaintenanceContracts: (customerId: string) =>
        electronAPI.ipcRenderer.invoke('get-all-maintenance-contracts', customerId),
    getMaintenanceContract: (id: string) =>
        electronAPI.ipcRenderer.invoke('get-maintenance-contract', id),
    createMaintenanceContract: (data: CreateMaintenanceContractData) =>
        electronAPI.ipcRenderer.invoke('create-maintenance-contract', data),
    updateMaintenanceContract: (id: string, data: UpdateMaintenanceContractData) =>
        electronAPI.ipcRenderer.invoke('update-maintenance-contract', id, data),
    deleteMaintenanceContract: (id: string) =>
        electronAPI.ipcRenderer.invoke('delete-maintenance-contract', id),

    getAllWarrantyHistory: (customerId: string) =>
        electronAPI.ipcRenderer.invoke('get-all-warranty-history', customerId),
    getWarrantyHistory: (id: string) =>
        electronAPI.ipcRenderer.invoke('get-warranty-history', id),
    createWarrantyHistory: (data: CreateWarrantyHistoryData) =>
        electronAPI.ipcRenderer.invoke('create-warranty-history', data),
    updateWarrantyHistory: (id: string, data: UpdateWarrantyHistoryData) =>
        electronAPI.ipcRenderer.invoke('update-warranty-history', id, data),
    deleteWarrantyHistory: (id: string) =>
        electronAPI.ipcRenderer.invoke('delete-warranty-history', id),

    trashGetDeletedCustomers: () =>
        electronAPI.ipcRenderer.invoke('trash-get-deleted-customers'),
    trashGetDeletedContracts: () =>
        electronAPI.ipcRenderer.invoke('trash-get-deleted-contracts'),
    trashRestoreCustomer: (id: string) =>
        electronAPI.ipcRenderer.invoke('trash-restore-customer', id),
    trashRestoreContract: (id: string) =>
        electronAPI.ipcRenderer.invoke('trash-restore-contract', id),
    trashPermanentDeleteCustomer: (id: string) =>
        electronAPI.ipcRenderer.invoke('trash-permanent-delete-customer', id),
    trashPermanentDeleteContract: (id: string) =>
        electronAPI.ipcRenderer.invoke('trash-permanent-delete-contract', id),
    trashEmpty: () => electronAPI.ipcRenderer.invoke('trash-empty'),

    getMaintenanceReportCandidates: () =>
        electronAPI.ipcRenderer.invoke('get-maintenance-report-candidates'),
    generateMaintenanceReports: (requests: any[]) =>
        electronAPI.ipcRenderer.invoke('generate-maintenance-reports', requests),
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
    try {
        contextBridge.exposeInMainWorld('electron', electronAPI)
        contextBridge.exposeInMainWorld('api', api)
    } catch (error) {
        console.error(error)
    }
} else {
    // @ts-ignore (define in dts)
    window.electron = electronAPI
    // @ts-ignore (define in dts)
    window.api = api
}
