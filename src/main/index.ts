import { electronApp, is, optimizer } from '@electron-toolkit/utils'
import * as dotenv from 'dotenv'
import { app, BrowserWindow, ipcMain, shell } from 'electron'
import { join } from 'path'
import icon from '../../resources/icon.png?asset'
dotenv.config()

// Connect to database
import Database from './configs/database'
Database.getInstance()

import { CustomerService } from './services/customer.service'
import { MaintenanceContractService } from './services/maintenance-contract.service'
import { WarrantyHistoryService } from './services/warranty-history.service'

function createWindow(): void {
    // Create the browser window.
    const mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        minWidth: 1024, // Giới hạn không cho thu nhỏ quá mức
        minHeight: 700,
        show: false,
        autoHideMenuBar: false,
        ...(process.platform === 'linux' ? { icon } : {}),
        webPreferences: {
            preload: join(__dirname, '../preload/index.js'),
            sandbox: false
        }
    })

    mainWindow.on('ready-to-show', () => {
        mainWindow.show()
    })

    mainWindow.webContents.setWindowOpenHandler((details) => {
        shell.openExternal(details.url)
        return { action: 'deny' }
    })

    // HMR for renderer base on electron-vite cli.
    // Load the remote URL for development or the local html file for production.
    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
        mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
    } else {
        mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
    }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
    // Set app user model id for windows
    electronApp.setAppUserModelId('com.electron')

    // Default open or close DevTools by F12 in development
    // and ignore CommandOrControl + R in production.
    // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
    app.on('browser-window-created', (_, window) => {
        optimizer.watchWindowShortcuts(window)
    })

    // IPC test
    ipcMain.on('ping', () => console.log('pong'))

    // Customer Service IPC Handlers
    ipcMain.handle('get-all-customers', async () => {
        return await CustomerService.getAllCustomers()
    })

    ipcMain.handle('get-customer-by-id', async (_, id: string) => {
        return await CustomerService.getCustomerById(id)
    })

    ipcMain.handle('create-customer', async (_, data: any) => {
        return await CustomerService.createCustomer(data)
    })

    ipcMain.handle('update-customer', async (_, id: string, data: any) => {
        return await CustomerService.updateCustomer(id, data)
    })

    ipcMain.handle('delete-customer', async (_, id: string) => {
        return await CustomerService.deleteCustomer(id)
    })

    ipcMain.handle('get-all-maintenance-contracts', async (_, customerId: string) => {
        return await MaintenanceContractService.getAllByCustomer(customerId)
    })

    ipcMain.handle('get-maintenance-contract', async (_, id: string) => {
        return await MaintenanceContractService.getById(id)
    })

    ipcMain.handle('create-maintenance-contract', async (_, data: any) => {
        return await MaintenanceContractService.create(data)
    })

    ipcMain.handle('update-maintenance-contract', async (_, id: string, data: any) => {
        return await MaintenanceContractService.update(id, data)
    })

    ipcMain.handle('delete-maintenance-contract', async (_, id: string) => {
        return await MaintenanceContractService.delete(id)
    })

    ipcMain.handle('get-all-warranty-history', async (_, customerId: string) => {
        return await WarrantyHistoryService.getAllByCustomer(customerId)
    })

    ipcMain.handle('get-warranty-history', async (_, id: string) => {
        return await WarrantyHistoryService.getById(id)
    })

    ipcMain.handle('create-warranty-history', async (_, data: any) => {
        return await WarrantyHistoryService.create(data)
    })

    ipcMain.handle('update-warranty-history', async (_, id: string, data: any) => {
        return await WarrantyHistoryService.update(id, data)
    })

    ipcMain.handle('delete-warranty-history', async (_, id: string) => {
        return await WarrantyHistoryService.delete(id)
    })

    createWindow()

    app.on('activate', function () {
        // On macOS it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow()
        }
    })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
