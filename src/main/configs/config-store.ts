import { app } from 'electron'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

interface Config {
    mongoUrl?: string
}

function getConfigPath(): string {
    return join(app.getPath('userData'), 'hera-config.json')
}

export function readConfig(): Config {
    const path = getConfigPath()
    if (!existsSync(path)) return {}
    try {
        return JSON.parse(readFileSync(path, 'utf-8'))
    } catch {
        return {}
    }
}

export function writeConfig(data: Partial<Config>): void {
    const path = getConfigPath()
    const existing = readConfig()
    writeFileSync(path, JSON.stringify({ ...existing, ...data }, null, 2))
}

export function clearConfig(): void {
    const path = getConfigPath()
    if (existsSync(path)) {
        writeFileSync(path, JSON.stringify({}))
    }
}
