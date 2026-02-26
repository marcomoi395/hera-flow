import { contextBridge } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { ICreateCustomerData } from '../main/services/customer.service'

// Custom APIs for renderer
const api = {
    getAllCustomers: () => electronAPI.ipcRenderer.invoke('get-all-customers'),
    getCustomerById: (id: string) => electronAPI.ipcRenderer.invoke('get-customer-by-id', id),
    createCustomer: (data: ICreateCustomerData) =>
        electronAPI.ipcRenderer.invoke('create-customer', data)
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
