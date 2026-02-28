import { Customer } from '../models/customer.model'
import { WarrantyHistory } from '../models/warranty-history.model'
import '../models/maintenance-contract.model'
import '../models/elevator.model'
import Docxtemplater from 'docxtemplater'
import PizZip from 'pizzip'
import * as fs from 'fs'
import * as path from 'path'
import { app } from 'electron'
import { WarrantyTaskType } from './warranty-history.service'

export type CongTacOption = 'baotri' | 'baohanh' | 'khac' | 'kh_yc' | 'cty_yc'

export interface MaintenanceReportRequest {
    customerId: string
    contractId?: string
    congTac: CongTacOption
    visitDate: string // ISO date string (YYYY-MM-DD)
    maintenanceContents?: string[]
}

const CONG_TAC_TO_TASK_TYPE: Record<CongTacOption, WarrantyTaskType> = {
    baotri: 'maintenance',
    baohanh: 'warranty',
    khac: 'other',
    kh_yc: 'customer requested repair',
    cty_yc: 'company requested repair'
}

const DEFAULT_MAINTENANCE_CONTENTS = [
    'Kiểm tra máy kéo',
    'Vệ sinh nóc car',
    'Kiểm tra tủ điện',
    'Kiểm tra đầu cửa car',
    'Vệ sinh phòng máy',
    'Kiểm tra hệ thống thông gió',
    'Kiểm tra cáp',
    'Kiểm tra hệ thống chiếu sáng',
    'Kiểm tra nhớt bôi trơn rail dẫn hướng',
    'Vệ sinh trần car',
    'Kiểm tra hệ thống điều khiển bên ngoài',
    'Vệ sinh sill và Cabin thang máy',
    'Vệ sinh sill cửa tầng và cửa tầng',
    'Kiểm tra và vệ sinh pít hố thang'
]

function formatEquipmentItems(equipmentItems: any[]): string {
    if (!equipmentItems?.length) {
        return ''
    }

    const indent = ' '.repeat(17)

    return equipmentItems
        .map((item, index) => {
            const quantityStr = item.quantity && item.quantity > 1 ? `${item.quantity} x ` : ''
            const weight = parseFloat(item.weight?.toString() ?? '0')

            const lineContent = `${quantityStr}Thang máy tải trọng ${weight}kg, ${item.numberOfStops} điểm dừng`

            // Nếu index > 0 (từ thằng thứ 2 trở đi) thì thêm indent vào trước
            return index === 0 ? lineContent : `${indent}${lineContent}`
        })
        .join('\n')
}

function formatDate(date: string | Date | null | undefined): string {
    if (!date) {
        return ''
    }
    const d = new Date(date)
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`
}

export class ReportService {
    static getTemplatePath(): string {
        if (app.isPackaged) {
            return path.join(process.resourcesPath, 'data', 'maintenance-report-template.docx')
        }
        return path.join(app.getAppPath(), 'resources', 'data', 'maintenance-report-template.docx')
    }

    static async getMaintenanceReportCandidates() {
        const now = new Date()
        const customers = await Customer.find({ isDeleted: false })
            .populate({
                path: 'maintenanceContracts',
                match: { isDeleted: false },
                populate: { path: 'equipmentItems' }
            })
            .lean()

        // Batch-fetch all warranty histories in a single query to avoid N+1
        const allHistoryIds = customers.flatMap((c) => (c.warrantyHistory as any[]) ?? [])
        const allHistories =
            allHistoryIds.length > 0
                ? await WarrantyHistory.find({
                      _id: { $in: allHistoryIds },
                      isDeleted: false
                  })
                      .lean()
                : []

        // Build a map from customer _id → most recent history
        const lastHistoryMap = new Map<string, any>()
        for (const customer of customers) {
            const ids = new Set(
                ((customer.warrantyHistory as any[]) ?? []).map((id: any) => id.toString())
            )
            const customerHistories = allHistories
                .filter((h) => ids.has(h._id.toString()))
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            if (customerHistories.length > 0) {
                lastHistoryMap.set(customer._id.toString(), customerHistories[0])
            }
        }

        const result: any[] = []
        for (const customer of customers) {
            const contracts = (customer.maintenanceContracts as any[]) ?? []

            const lastHistory = lastHistoryMap.get(customer._id.toString()) ?? null
            const lastMaintenanceContents: string[] | null =
                lastHistory?.maintenanceContents ?? null

            for (const contract of contracts) {
                const start = new Date(contract.startDate)
                const end = new Date(contract.endDate)
                const equipmentItems = (contract.equipmentItems ?? []).map((item: any) => ({
                    _id: item._id?.toString(),
                    weight: parseFloat(item.weight?.toString() ?? '0'),
                    numberOfStops: item.numberOfStops,
                    quantity: item.quantity
                }))
                if (start <= now && end >= now && equipmentItems.length > 0) {
                    result.push({
                        customerId: customer._id.toString(),
                        customerName: customer.customerName,
                        companyName: customer.companyName ?? '',
                        address: customer.address,
                        contractId: contract._id.toString(),
                        contractNumber: contract.contractNumber ?? '',
                        startDate: contract.startDate,
                        endDate: contract.endDate,
                        equipmentItems,
                        lastMaintenanceContents,
                        isWarrantyOnly: false
                    })
                }
            }
        }
        return result
    }

    static async generateMaintenanceReports(
        requests: MaintenanceReportRequest[],
        outputFolder: string
    ): Promise<string[]> {
        const templatePath = ReportService.getTemplatePath()
        const templateContent = fs.readFileSync(templatePath, 'binary')

        // Pre-fetch customer data for all requests
        const customerIds = [...new Set(requests.map((r) => r.customerId))]
        const customers = await Customer.find({ _id: { $in: customerIds }, isDeleted: false })
            .populate({
                path: 'maintenanceContracts',
                match: { isDeleted: false },
                populate: { path: 'equipmentItems' }
            })
            .lean()

        const customerMap = new Map(customers.map((c) => [c._id.toString(), c]))

        // Pre-compute per-customer sequence numbers (count of non-deleted history + 1)
        const seqMap = new Map<string, number>()
        for (const customer of customers) {
            const ids = (customer.warrantyHistory as any[]) ?? []
            const count = await WarrantyHistory.countDocuments({
                _id: { $in: ids },
                isDeleted: false
            })
            seqMap.set(customer._id.toString(), count + 1)
        }

        const renderedBuffers: Buffer[] = []

        for (const req of requests) {
            const customer = customerMap.get(req.customerId)
            if (!customer) {
                continue
            }

            const contracts = (customer.maintenanceContracts as any[]) ?? []
            const contract = req.contractId
                ? (contracts.find((c) => c._id.toString() === req.contractId) ?? null)
                : null
            if (req.contractId && !contract) {
                continue
            }

            // Per-customer sequence number
            const sequenceNumber = seqMap.get(req.customerId) ?? 1

            const equipmentItems = (contract?.equipmentItems ?? []).map((item: any) => ({
                weight: parseFloat(item.weight?.toString() ?? '0'),
                numberOfStops: item.numberOfStops,
                quantity: item.quantity
            }))

            const zip = new PizZip(templateContent)
            const doc = new Docxtemplater(zip, {
                paragraphLoop: true,
                linebreaks: true,
                delimiters: { start: '{{', end: '}}' }
            })

            const visitDate = new Date(req.visitDate)

            const selectedContents = new Set(
                req.maintenanceContents ?? DEFAULT_MAINTENANCE_CONTENTS
            )
            const ck = (label: string) => (selectedContents.has(label) ? '☑' : '☐')

            doc.render({
                no: sequenceNumber.toString(),
                customerName: customer.customerName,
                companyName: customer.companyName ?? '',
                address: customer.address,
                isBT: req.congTac === 'baotri' ? '☑' : '☐',
                isBH: req.congTac === 'baohanh' ? '☑' : '☐',
                isKhac: req.congTac === 'khac' ? '☑' : '☐',
                isKH_YC: req.congTac === 'kh_yc' ? '☑' : '☐',
                isCty_YC: req.congTac === 'cty_yc' ? '☑' : '☐',
                contractNumber: contract?.contractNumber ?? '',
                startDate: contract
                    ? formatDate(contract.startDate)
                    : formatDate((customer as any).acceptanceSigningDate),
                equipmentItems: formatEquipmentItems(equipmentItems),
                numberOfElevators: equipmentItems
                    .reduce((sum: number, item: any) => sum + (item.quantity ?? 1), 0)
                    .toString(),
                month: (visitDate.getMonth() + 1).toString(),
                year: visitDate.getFullYear().toString(),
                ck1: ck(DEFAULT_MAINTENANCE_CONTENTS[0]),
                ck2: ck(DEFAULT_MAINTENANCE_CONTENTS[2]),
                ck3: ck(DEFAULT_MAINTENANCE_CONTENTS[4]),
                ck4: ck(DEFAULT_MAINTENANCE_CONTENTS[6]),
                ck5: ck(DEFAULT_MAINTENANCE_CONTENTS[8]),
                ck6: ck(DEFAULT_MAINTENANCE_CONTENTS[10]),
                ck7: ck(DEFAULT_MAINTENANCE_CONTENTS[12]),
                ck8: ck(DEFAULT_MAINTENANCE_CONTENTS[1]),
                ck9: ck(DEFAULT_MAINTENANCE_CONTENTS[3]),
                ck10: ck(DEFAULT_MAINTENANCE_CONTENTS[5]),
                ck11: ck(DEFAULT_MAINTENANCE_CONTENTS[7]),
                ck12: ck(DEFAULT_MAINTENANCE_CONTENTS[9]),
                ck13: ck(DEFAULT_MAINTENANCE_CONTENTS[11]),
                ck14: ck(DEFAULT_MAINTENANCE_CONTENTS[13])
            })

            renderedBuffers.push(doc.getZip().generate({ type: 'nodebuffer' }))

            // Save warranty history record
            const entry = new WarrantyHistory({
                sequenceNumber,
                contractNumber: contract?._id ?? null,
                date: new Date(req.visitDate),
                taskType: CONG_TAC_TO_TASK_TYPE[req.congTac],
                maintenanceContents: req.maintenanceContents ?? DEFAULT_MAINTENANCE_CONTENTS
            })
            const saved = await entry.save()
            await Customer.findByIdAndUpdate(req.customerId, {
                $push: { warrantyHistory: saved._id }
            })
            // Increment so if same customer appears twice in one batch they get consecutive numbers
            seqMap.set(req.customerId, sequenceNumber + 1)
        }

        if (renderedBuffers.length === 0) {
            return []
        }

        // Merge all rendered documents into one file by combining their body XML content
        const PAGE_BREAK = '<w:p><w:r><w:br w:type="page"/></w:r></w:p>'
        const bodyContents: string[] = renderedBuffers.map((buf) => {
            const z = new PizZip(buf)
            const xml = z.files['word/document.xml'].asText()
            // Extract content inside <w:body>…</w:body>, stripping the trailing <w:sectPr>
            const match = xml.match(/<w:body>([\s\S]*?)<\/w:body>/)
            if (!match) {
                return ''
            }
            // Remove the last <w:sectPr>…</w:sectPr> (document-level section properties)
            return match[1].replace(/<w:sectPr[\s\S]*?<\/w:sectPr>\s*$/, '').trimEnd()
        })

        // Use the first document as the base and replace its body with the merged content
        const baseZip = new PizZip(renderedBuffers[0])
        const baseXml = baseZip.files['word/document.xml'].asText()
        const mergedBody = bodyContents.join(PAGE_BREAK)
        // Re-insert sectPr from the first document so page layout is preserved
        const sectPrMatch = baseXml.match(/<w:sectPr[\s\S]*?<\/w:sectPr>/)
        const sectPr = sectPrMatch ? sectPrMatch[0] : ''
        const mergedXml = baseXml.replace(
            /<w:body>[\s\S]*?<\/w:body>/,
            `<w:body>${mergedBody}${sectPr}</w:body>`
        )
        baseZip.file('word/document.xml', mergedXml)

        const visitDate = new Date(requests[0].visitDate)
        const outName = `phieu_bao_hanh_bao_tri_thang_${visitDate.getMonth() + 1}_${visitDate.getFullYear()}.docx`
        const outPath = path.join(outputFolder, outName)
        fs.writeFileSync(outPath, baseZip.generate({ type: 'nodebuffer' }))
        const generatedFiles = [outPath]

        return generatedFiles
    }
}
