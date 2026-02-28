function fmtDate(d?: string | Date | null): string {
    if (!d) {
        return '—'
    }
    const date = new Date(d)
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`
}

function init(): void {
    window.addEventListener('DOMContentLoaded', async () => {
        const savedUrl = await window.api.getDbUrl()
        if (savedUrl) {
            renderSetupPage(savedUrl, true)
            const result = await window.api.connectDb(savedUrl)
            if (result.success) {
                launchApp()
            } else {
                renderSetupPage('', false, result.error)
            }
        } else {
            renderSetupPage()
        }
    })
}

function launchApp(): void {
    document.getElementById('setupOverlay')?.remove()
    document.getElementById('sidebar')!.style.display = ''
    setupSidebar()
    currentPage = 'list'
    pageHistory.length = 0
    renderListPage()

    document.addEventListener('mousedown', (e) => {
        if (e.button === 3) {
            e.preventDefault()
            navigateBack()
        }
    })
}

function renderSetupPage(
    prefillUrl = '',
    connecting = false,
    errorMsg?: string,
    canCancel = false
): void {
    document.getElementById('sidebar')!.style.display = 'none'
    document.getElementById('app')!.innerHTML = ''

    let overlay = document.getElementById('setupOverlay')
    if (!overlay) {
        overlay = document.createElement('div')
        overlay.id = 'setupOverlay'
        document.body.appendChild(overlay)
    }

    overlay.innerHTML = `
        <div class="setup-card">
            <div class="setup-logo">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <path d="M9 3v18M15 3v18M3 9h18M3 15h18"/>
                </svg>
            </div>
            <h1 class="setup-title">Hera Flow</h1>
            <p class="setup-subtitle">Nhập địa chỉ MongoDB để bắt đầu</p>
            <form id="setupForm" class="setup-form">
                <div class="form-group">
                    <label for="setupUrl">MongoDB URL</label>
                    <input
                        type="password"
                        id="setupUrl"
                        placeholder="mongodb://localhost:27017/hera"
                        value="${prefillUrl}"
                        autocomplete="off"
                        spellcheck="false"
                        required
                    />
                </div>
                ${errorMsg ? `<div class="setup-error">${errorMsg}</div>` : ''}
                <button type="submit" class="btn btn-primary setup-btn" id="setupConnectBtn" ${connecting ? 'disabled' : ''}>
                    ${connecting ? 'Đang kết nối...' : 'Kết nối'}
                </button>
                ${canCancel ? `<button type="button" class="btn setup-btn" id="setupCancelBtn" style="margin-top:8px;background:none;border:1px solid var(--border,#e5e7eb);color:var(--text-secondary,#6b7280)">Huỷ</button>` : ''}
            </form>
        </div>
    `

    const form = document.getElementById('setupForm') as HTMLFormElement
    const btn = document.getElementById('setupConnectBtn') as HTMLButtonElement

    form.onsubmit = async (e) => {
        e.preventDefault()
        const url = (document.getElementById('setupUrl') as HTMLInputElement).value.trim()
        if (!url) {
            return
        }

        btn.disabled = true
        btn.textContent = 'Đang kết nối...'

        const result = await window.api.connectDb(url)
        if (result.success) {
            launchApp()
        } else {
            renderSetupPage(url, false, result.error, canCancel)
        }
    }

    if (canCancel) {
        document.getElementById('setupCancelBtn')?.addEventListener('click', () => launchApp())
    }
}

// ─── NAVIGATION HISTORY ──────────────────────────────────────────────────────

type Page = 'list' | 'trash' | 'detail'
let currentPage: Page = 'list'
const pageHistory: Page[] = []

function navigateTo(page: Page): void {
    if (currentPage !== page) {
        pageHistory.push(currentPage)
    }
    currentPage = page
    if (page === 'list') {
        setActiveNav('navCustomers')
        renderListPage()
    } else {
        setActiveNav('navTrash')
        renderTrashPage()
    }
}

function navigateBack(): void {
    const prev = pageHistory.pop()
    if (prev === undefined) {
        return
    }
    currentPage = prev
    if (prev === 'list') {
        setActiveNav('navCustomers')
        renderListPage()
    } else if (prev === 'trash') {
        setActiveNav('navTrash')
        renderTrashPage()
    }
}

function setupSidebar(): void {
    const sidebar = document.getElementById('sidebar')!
    const toggleBtn = document.getElementById('sidebarToggleBtn')!
    const navCustomers = document.getElementById('navCustomers')!
    const navTrash = document.getElementById('navTrash')!
    const navChangeDb = document.getElementById('navChangeDb')!

    const collapsed = localStorage.getItem('sidebarCollapsed') === 'true'
    if (collapsed) {
        sidebar.classList.add('collapsed')
    }

    sidebar.addEventListener('click', () => {
        if (sidebar.classList.contains('collapsed')) {
            sidebar.classList.remove('collapsed')
            localStorage.setItem('sidebarCollapsed', 'false')
        }
    })

    toggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed')
        localStorage.setItem('sidebarCollapsed', String(sidebar.classList.contains('collapsed')))
    })

    document.addEventListener('click', (e) => {
        if (!sidebar.classList.contains('collapsed') && !sidebar.contains(e.target as Node)) {
            sidebar.classList.add('collapsed')
            localStorage.setItem('sidebarCollapsed', 'true')
        }
    })

    navCustomers.addEventListener('click', () => {
        navigateTo('list')
    })

    navTrash.addEventListener('click', () => {
        navigateTo('trash')
    })

    navChangeDb.addEventListener('click', async () => {
        renderSetupPage('', false, undefined, true)
    })
}

function setActiveNav(activeId: string): void {
    document.querySelectorAll('.sidebar-nav-item').forEach((el) => el.classList.remove('active'))
    document.getElementById(activeId)?.classList.add('active')
}

// ─── DATE VALIDATION ─────────────────────────────────────────────────────────

function validateCustomerDates(
    signingDate: string | null,
    acceptanceDate: string | null,
    warrantyDate: string | null
): string | null {
    const d1 = signingDate ? new Date(signingDate) : null
    const d2 = acceptanceDate ? new Date(acceptanceDate) : null
    const d3 = warrantyDate ? new Date(warrantyDate) : null

    if (d1 && d2 && d2 < d1) {
        return 'Ngày nghiệm thu phải sau hoặc bằng ngày ký hợp đồng.'
    }
    if (d2 && d3 && d3 < d2) {
        return 'Ngày hết hạn bảo hành phải sau hoặc bằng ngày nghiệm thu.'
    }
    if (d1 && !d2 && d3 && d3 < d1) {
        return 'Ngày hết hạn bảo hành phải sau hoặc bằng ngày ký hợp đồng.'
    }
    return null
}

function validateContractDates(startDate: string, endDate: string): string | null {
    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
        return 'Ngày kết thúc phải sau hoặc bằng ngày bắt đầu.'
    }
    return null
}

// ─── LIST PAGE ────────────────────────────────────────────────────────────────

// Filter state for the customer list
let allCustomers: any[] = []
let activeFilter: 'all' | 'active' | 'expiring' | 'expired' = 'all'
let searchQuery = ''

function renderListPage(): void {
    setActiveNav('navCustomers')
    activeFilter = 'all'
    searchQuery = ''
    const app = document.getElementById('app')!
    app.innerHTML = `
        <header class="app-header">
            <div class="header-brand">
                <div class="header-logo">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/>
                    </svg>
                </div>
                <div class="header-text">
                    <h1>Hera Flow</h1>
                    <p class="header-subtitle">Quản lý bảo trì &amp; bảo hành thang máy</p>
                </div>
            </div>
            <div class="header-actions">
                <button class="btn-header-action btn-header-action--secondary" id="openMaintenanceReportModalBtn">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                    Tạo File Bảo Trì
                </button>
                <button class="btn-header-action" id="openAddCustomerModalBtn">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    Thêm Khách Hàng
                </button>
            </div>
        </header>
        <main class="app-main">
            <div class="filter-bar">
                <div class="filter-buttons">
                    <button class="filter-btn active" data-filter="all">Tất cả</button>
                    <button class="filter-btn" data-filter="active">Còn hạn</button>
                    <button class="filter-btn filter-btn--warning" data-filter="expiring">Sắp hết hạn</button>
                    <button class="filter-btn filter-btn--danger" data-filter="expired">Hết hạn</button>
                </div>
                <div class="filter-search">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    <input type="text" id="customerSearch" class="filter-search-input" placeholder="Tìm theo tên, công ty, địa chỉ...">
                </div>
                <button id="reloadCustomersBtn" class="reload-btn" title="Tải lại dữ liệu">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
                </button>
            </div>
            <div id="loading" class="loading-spinner">Đang tải dữ liệu...</div>
            <div id="customersContainer"></div>
        </main>
    `
    loadCustomers()
    setupAddCustomerForm()
    setupEditCustomerForm()
    setupFilterBar()
    setupMaintenanceReportModal()
}

function setupFilterBar(): void {
    document.querySelectorAll('.filter-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
            activeFilter = (btn as HTMLElement).dataset.filter as typeof activeFilter
            document.querySelectorAll('.filter-btn').forEach((b) => b.classList.remove('active'))
            btn.classList.add('active')
            renderFilteredTable()
        })
    })
    const searchInput = document.getElementById('customerSearch') as HTMLInputElement
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            searchQuery = searchInput.value.trim().toLowerCase()
            renderFilteredTable()
        })
    }
    const reloadBtn = document.getElementById('reloadCustomersBtn')
    if (reloadBtn) {
        reloadBtn.addEventListener('click', () => loadCustomers())
    }
}

// ─── MAINTENANCE REPORT MODAL ─────────────────────────────────────────────────

const CONG_TAC_OPTIONS = [
    { value: 'baotri', label: 'Bảo trì' },
    { value: 'baohanh', label: 'Bảo hành' },
    { value: 'khac', label: 'Khác' },
    { value: 'kh_yc', label: 'Khách hàng y/c sửa chữa' },
    { value: 'cty_yc', label: 'Cty y/c sửa chữa' }
]

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

function setupMaintenanceReportModal(): void {
    const modal = document.getElementById('maintenanceReportModal')!
    const openBtn = document.getElementById('openMaintenanceReportModalBtn')

    const openModal = async () => {
        modal.classList.add('show')
        // Default visit date to today
        const dateInput = document.getElementById('reportVisitDate') as HTMLInputElement
        if (dateInput && !dateInput.value) {
            dateInput.value = new Date().toISOString().split('T')[0]
        }
        const loadingEl = document.getElementById('maintenanceReportLoading')!
        const contentEl = document.getElementById('maintenanceReportContent')!
        const emptyEl = document.getElementById('maintenanceReportEmpty')!
        loadingEl.style.display = ''
        contentEl.style.display = 'none'
        emptyEl.style.display = 'none'

        try {
            const candidates = await window.api.getMaintenanceReportCandidates()
            loadingEl.style.display = 'none'

            if (candidates.length === 0) {
                emptyEl.style.display = ''
                return
            }

            const fmt = fmtDate

            const contentsSubRow = (i: number, lastContents: string[] | null) => `
                <tr class="candidate-contents-row" id="candidate-contents-${i}" style="display:none">
                    <td colspan="7" style="padding:0 8px 8px 36px; background:var(--bg-secondary,#f9fafb)">
                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:2px 16px; padding:6px 0">
                            ${DEFAULT_MAINTENANCE_CONTENTS.map(
                                (item, j) => `
                            <label style="display:flex; align-items:center; gap:6px; font-size:0.8rem; cursor:pointer">
                                <input type="checkbox" class="maintenance-content-check" data-candidate-idx="${i}" data-content-idx="${j}" ${lastContents === null || lastContents.includes(item) ? 'checked' : ''} />
                                ${item}
                            </label>`
                            ).join('')}
                        </div>
                    </td>
                </tr>`

            const listEl = document.getElementById('maintenanceReportList')!
            listEl.innerHTML = `
                <table class="customers-table">
                    <thead>
                        <tr>
                            <th class="col-no" style="width:36px">
                                <input type="checkbox" id="selectAllCandidates" title="Chọn tất cả" />
                            </th>
                            <th>Khách hàng</th>
                            <th>Công ty</th>
                            <th class="col-center">Số HĐ</th>
                            <th class="col-center">Hiệu lực đến</th>
                            <th>Công tác</th>
                            <th style="width:36px"></th>
                        </tr>
                    </thead>
                    <tbody>
                        ${candidates
                            .map(
                                (c: any, i: number) => `
                        <tr data-candidate-idx="${i}">
                            <td><input type="checkbox" class="candidate-check" data-idx="${i}" /></td>
                            <td>${c.customerName}</td>
                            <td>${c.companyName || '—'}</td>
                            <td class="col-center">${c.contractNumber || (c.isWarrantyOnly ? '<span title="Bảo hành" style="color:var(--text-secondary,#6b7280);font-size:0.75rem">Bảo hành</span>' : '—')}</td>
                            <td class="col-center">${fmt(c.endDate)}</td>
                            <td>
                                <select class="candidate-congtac" data-idx="${i}">
                                    ${CONG_TAC_OPTIONS.map(
                                        (opt) =>
                                            `<option value="${opt.value}"${opt.value === 'baotri' ? ' selected' : ''}>${opt.label}</option>`
                                    ).join('')}
                                </select>
                            </td>
                            <td>
                                <button type="button" class="btn-toggle-contents" data-idx="${i}" title="Nội dung bảo trì" style="background:none; border:none; cursor:pointer; padding:2px 4px; font-size:1rem; color:var(--text-secondary,#6b7280)">▾</button>
                            </td>
                        </tr>
                        ${contentsSubRow(i, c.lastMaintenanceContents ?? null)}
                        `
                            )
                            .join('')}
                    </tbody>
                </table>
            `

            // Store candidates data on the element for use in generate
            listEl.dataset.candidates = JSON.stringify(candidates)

            // Select all checkbox
            document.getElementById('selectAllCandidates')?.addEventListener('change', (e) => {
                const checked = (e.target as HTMLInputElement).checked
                document.querySelectorAll('.candidate-check').forEach((cb) => {
                    ;(cb as HTMLInputElement).checked = checked
                })
            })

            // Click anywhere on a candidate row to toggle its checkbox
            document
                .querySelectorAll<HTMLTableRowElement>('tr[data-candidate-idx]')
                .forEach((row) => {
                    row.style.cursor = 'pointer'
                    row.addEventListener('click', (e) => {
                        const target = e.target as HTMLElement
                        if (
                            target.tagName === 'INPUT' ||
                            target.tagName === 'SELECT' ||
                            target.tagName === 'BUTTON'
                        ) {
                            return
                        }
                        const idx = row.dataset.candidateIdx
                        const cb = row.querySelector<HTMLInputElement>(
                            `.candidate-check[data-idx="${idx}"]`
                        )
                        if (cb) {
                            cb.checked = !cb.checked
                        }
                    })
                })

            // Toggle per-candidate contents sub-row
            document.querySelectorAll('.btn-toggle-contents').forEach((btn) => {
                btn.addEventListener('click', () => {
                    const idx = (btn as HTMLElement).dataset.idx
                    const subRow = document.getElementById(`candidate-contents-${idx}`)
                    if (!subRow) {
                        return
                    }
                    const isHidden = subRow.style.display === 'none'
                    subRow.style.display = isHidden ? '' : 'none'
                    ;(btn as HTMLElement).textContent = isHidden ? '▴' : '▾'
                })
            })

            contentEl.style.display = ''
        } catch (err) {
            console.error('Error loading candidates:', err)
            loadingEl.textContent = 'Lỗi tải dữ liệu.'
        }
    }

    // openBtn lives inside the re-rendered page, so re-attach its listener every time.
    // Only register the modal's own persistent listeners (close, generate) once.
    openBtn?.addEventListener('click', openModal)

    if (modal.dataset.initialized) {
        return
    }
    modal.dataset.initialized = 'true'

    const closeBtn = document.getElementById('closeMaintenanceReportModalBtn')!
    const cancelBtn = document.getElementById('cancelMaintenanceReportBtn')!
    const generateBtn = document.getElementById('generateReportBtn')!

    const closeModal = () => modal.classList.remove('show')

    closeBtn.addEventListener('click', closeModal)
    cancelBtn.addEventListener('click', closeModal)
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal()
        }
    })

    generateBtn.addEventListener('click', async () => {
        const listEl = document.getElementById('maintenanceReportList')!
        const candidatesRaw = listEl.dataset.candidates
        if (!candidatesRaw) {
            return
        }

        const candidates = JSON.parse(candidatesRaw)
        const checked = document.querySelectorAll('.candidate-check:checked')
        if (checked.length === 0) {
            alert('Vui lòng chọn ít nhất một khách hàng.')
            return
        }

        const visitDate = (document.getElementById('reportVisitDate') as HTMLInputElement)?.value
        if (!visitDate) {
            alert('Vui lòng chọn ngày công tác.')
            return
        }

        const requests: any[] = []
        checked.forEach((cb) => {
            const idx = parseInt((cb as HTMLElement).dataset.idx ?? '0')
            const candidate = candidates[idx]
            const congTacEl = document.querySelector(
                `.candidate-congtac[data-idx="${idx}"]`
            ) as HTMLSelectElement | null
            const maintenanceContents = DEFAULT_MAINTENANCE_CONTENTS.filter((_, j) => {
                const contentCb = document.querySelector(
                    `.maintenance-content-check[data-candidate-idx="${idx}"][data-content-idx="${j}"]`
                ) as HTMLInputElement | null
                return contentCb?.checked ?? true
            })
            requests.push({
                customerId: candidate.customerId,
                contractId: candidate.contractId,
                congTac: congTacEl?.value ?? 'baotri',
                visitDate,
                maintenanceContents
            })
        })

        generateBtn.setAttribute('disabled', 'true')
        generateBtn.textContent = 'Đang tạo...'

        try {
            const result = await window.api.generateMaintenanceReports(requests)
            if (result.canceled) {
                generateBtn.removeAttribute('disabled')
                generateBtn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Tạo File`
                return
            }
            alert(`Đã tạo ${result.files.length} file thành công!`)
            closeModal()
            loadCustomers()
        } catch (err) {
            console.error('Error generating reports:', err)
            alert('Lỗi khi tạo file. Vui lòng thử lại.')
        } finally {
            generateBtn.removeAttribute('disabled')
            generateBtn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Tạo File`
        }
    })
}

function getDateStatus(
    date: string | null | undefined
): 'active' | 'expiring' | 'expired' | 'none' {
    if (!date) {
        return 'none'
    }
    const now = new Date()
    const daysLeft = (new Date(date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    if (daysLeft <= 0) {
        return 'expired'
    }
    if (daysLeft <= 30) {
        return 'expiring'
    }
    return 'active'
}

function getWarrantyStatus(customer: any): 'active' | 'expiring' | 'expired' | 'none' {
    return getDateStatus(customer.warrantyExpirationDate)
}

function getLatestContractEndDate(customer: any): string | null {
    const contracts = (customer.maintenanceContracts as any[]) || []
    return contracts.reduce(
        (max: string | null, c: any) =>
            c.endDate && (!max || new Date(c.endDate) > new Date(max)) ? c.endDate : max,
        null
    )
}

function applyFilter(customers: any[]): any[] {
    return customers.filter((c) => {
        if (activeFilter !== 'all') {
            const contractStatus = getDateStatus(getLatestContractEndDate(c))
            if (activeFilter === 'active' && contractStatus !== 'active') {
                return false
            }
            if (activeFilter === 'expiring' && contractStatus !== 'expiring') {
                return false
            }
            if (activeFilter === 'expired' && contractStatus !== 'expired') {
                return false
            }
        }
        if (searchQuery) {
            const haystack = [c.customerName, c.companyName, c.address].join(' ').toLowerCase()
            if (!haystack.includes(searchQuery)) {
                return false
            }
        }
        return true
    })
}

function renderFilteredTable(): void {
    const containerEl = document.getElementById('customersContainer')
    if (!containerEl) {
        return
    }

    const filtered = applyFilter(allCustomers)

    if (filtered.length === 0) {
        containerEl.innerHTML = '<div class="empty-state">Không tìm thấy khách hàng phù hợp.</div>'
        return
    }

    containerEl.innerHTML = `
        <table class="customers-table">
            <thead>
                <tr>
                    <th class="col-no">#</th>
                    <th>Tên khách hàng</th>
                    <th>Công ty</th>
                    <th>Địa chỉ</th>
                    <th class="col-center">Ngày ký HĐ</th>
                    <th class="col-center">Ngày kiểm định</th>
                    <th class="col-center">Ngày nghiệm thu</th>
                    <th class="col-center">Hết hạn BH</th>
                    <th class="col-center">HĐ bảo trì đến</th>
                    <th class="col-center">Ghi chú</th>
                    <th class="col-action"></th>
                </tr>
            </thead>
            <tbody>
                ${filtered.map((c, i) => renderCustomerRow(c, i)).join('')}
            </tbody>
        </table>
    `
    containerEl.querySelectorAll('[data-customer-id]').forEach((btn) => {
        btn.addEventListener('click', () => {
            renderDetailPage((btn as HTMLElement).dataset.customerId!)
        })
    })
    containerEl.querySelectorAll('[data-edit-customer-id]').forEach((btn) => {
        btn.addEventListener('click', () => {
            const id = (btn as HTMLElement).dataset.editCustomerId!
            const customer = allCustomers.find((c: any) => c._id === id)
            if (customer) {
                openEditCustomerModal(customer)
            }
        })
    })
    containerEl.querySelectorAll('[data-delete-customer-id]').forEach((btn) => {
        btn.addEventListener('click', async () => {
            const id = (btn as HTMLElement).dataset.deleteCustomerId!
            const customer = allCustomers.find((c: any) => c._id === id)
            const name = customer?.customerName ?? 'khách hàng này'
            if (!confirm(`Bạn có chắc muốn xóa "${name}"?\nHành động này không thể hoàn tác.`)) {
                return
            }
            try {
                await window.api.deleteCustomer(id)
                loadCustomers()
            } catch (error) {
                console.error('Lỗi khi xóa khách hàng:', error)
                alert('Có lỗi xảy ra khi xóa khách hàng!')
            }
        })
    })
}

function setupAddCustomerForm(): void {
    const modal = document.getElementById('addCustomerModal')
    const openBtn = document.getElementById('openAddCustomerModalBtn')
    const closeBtn = document.getElementById('closeAddCustomerModalBtn')
    const cancelBtn = document.getElementById('cancelAddCustomerBtn')
    const form = document.getElementById('addCustomerForm') as HTMLFormElement
    const saveBtn = document.getElementById('saveCustomerBtn') as HTMLButtonElement

    const openModal = () => modal?.classList.add('show')
    const closeModal = () => {
        modal?.classList.remove('show')
        form?.reset()
    }

    if (openBtn) {
        openBtn.onclick = openModal
    }
    if (closeBtn) {
        closeBtn.onclick = closeModal
    }
    if (cancelBtn) {
        cancelBtn.onclick = closeModal
    }
    if (modal) {
        modal.onclick = (e) => {
            if (e.target === modal) {
                closeModal()
            }
        }
    }

    form.onsubmit = async (e) => {
        e.preventDefault()
        const formData = new FormData(form)
        const data: any = Object.fromEntries(formData.entries())
        ;[
            'contractSigningDate',
            'acceptanceSigningDate',
            'warrantyExpirationDate',
            'inspectionDate'
        ].forEach((f) => {
            if (!data[f]) {
                data[f] = null
            }
        })

        const dateError = validateCustomerDates(
            data.contractSigningDate,
            data.acceptanceSigningDate,
            data.warrantyExpirationDate
        )
        if (dateError) {
            alert(dateError)
            return
        }

        try {
            if (saveBtn) {
                saveBtn.disabled = true
                saveBtn.innerText = 'Đang lưu...'
            }
            await window.api.createCustomer(data)
            closeModal()
            loadCustomers()
        } catch (error) {
            console.error('Lỗi khi thêm mới khách hàng:', error)
            alert('Có lỗi xảy ra khi tạo khách hàng!')
        } finally {
            if (saveBtn) {
                saveBtn.disabled = false
                saveBtn.innerText = 'Lưu Lại'
            }
        }
    }
}

function setupEditCustomerForm(): void {
    const modal = document.getElementById('editCustomerModal')
    const closeBtn = document.getElementById('closeEditCustomerModalBtn')
    const cancelBtn = document.getElementById('cancelEditCustomerBtn')
    const form = document.getElementById('editCustomerForm') as HTMLFormElement
    const saveBtn = document.getElementById('saveEditCustomerBtn') as HTMLButtonElement

    const closeModal = () => {
        modal?.classList.remove('show')
        form?.reset()
    }

    if (closeBtn) {
        closeBtn.onclick = closeModal
    }
    if (cancelBtn) {
        cancelBtn.onclick = closeModal
    }
    if (modal) {
        modal.onclick = (e) => {
            if (e.target === modal) {
                closeModal()
            }
        }
    }

    form.onsubmit = async (e) => {
        e.preventDefault()
        const id = (document.getElementById('editCustomerId') as HTMLInputElement).value
        const formData = new FormData(form)
        const raw: any = Object.fromEntries(formData.entries())
        const data: any = {
            customerName: raw.customerName,
            companyName: raw.companyName,
            address: raw.address,
            contractSigningDate: raw.contractSigningDate || null,
            acceptanceSigningDate: raw.acceptanceSigningDate || null,
            warrantyExpirationDate: raw.warrantyExpirationDate || null,
            inspectionDate: raw.inspectionDate || null,
            notes: raw.notes ? [raw.notes] : []
        }

        const dateError = validateCustomerDates(
            data.contractSigningDate,
            data.acceptanceSigningDate,
            data.warrantyExpirationDate
        )
        if (dateError) {
            alert(dateError)
            return
        }

        try {
            if (saveBtn) {
                saveBtn.disabled = true
                saveBtn.innerText = 'Đang lưu...'
            }
            await window.api.updateCustomer(id, data)
            closeModal()
            loadCustomers()
        } catch (error) {
            console.error('Lỗi khi cập nhật khách hàng:', error)
            alert('Có lỗi xảy ra khi cập nhật khách hàng!')
        } finally {
            if (saveBtn) {
                saveBtn.disabled = false
                saveBtn.innerText = 'Lưu Lại'
            }
        }
    }
}

function openEditCustomerModal(customer: any): void {
    const modal = document.getElementById('editCustomerModal')
    const toDateInput = (d?: string | null) => (d ? new Date(d).toISOString().split('T')[0] : '')
    ;(document.getElementById('editCustomerId') as HTMLInputElement).value = customer._id
    ;(document.getElementById('editCustomerName') as HTMLInputElement).value =
        customer.customerName || ''
    ;(document.getElementById('editCompanyName') as HTMLInputElement).value =
        customer.companyName || ''
    ;(document.getElementById('editAddress') as HTMLInputElement).value = customer.address || ''
    ;(document.getElementById('editContractSigningDate') as HTMLInputElement).value = toDateInput(
        customer.contractSigningDate
    )
    ;(document.getElementById('editAcceptanceSigningDate') as HTMLInputElement).value = toDateInput(
        customer.acceptanceSigningDate
    )
    ;(document.getElementById('editWarrantyExpirationDate') as HTMLInputElement).value =
        toDateInput(customer.warrantyExpirationDate)
    ;(document.getElementById('editInspectionDate') as HTMLInputElement).value = toDateInput(
        customer.inspectionDate
    )
    ;(document.getElementById('editNotes') as HTMLTextAreaElement).value =
        (customer.notes as string[])?.join(', ') || ''
    modal?.classList.add('show')
}

async function loadCustomers(): Promise<void> {
    const loadingEl = document.getElementById('loading')
    const containerEl = document.getElementById('customersContainer')

    try {
        const customers = await window.api.getAllCustomers()
        allCustomers = customers ?? []

        if (loadingEl) {
            loadingEl.style.display = 'none'
        }

        if (!customers || customers.length === 0) {
            if (containerEl) {
                containerEl.innerHTML =
                    '<div class="empty-state">Không có dữ liệu khách hàng.</div>'
            }
            return
        }

        renderFilteredTable()
    } catch (error) {
        console.error('Lỗi khi tải dữ liệu khách hàng:', error)
        if (loadingEl) {
            loadingEl.style.color = '#ef4444'
            loadingEl.innerText = 'Lỗi tải dữ liệu. Hãy kiểm tra lại kết nối cơ sở dữ liệu.'
        }
    }
}

function renderWarrantyCell(customer: any): string {
    if (!customer.warrantyExpirationDate) {
        return '<td class="col-center">—</td>'
    }
    const status = getWarrantyStatus(customer)
    const dateStr = fmtDate(customer.warrantyExpirationDate)
    const badgeClass =
        status === 'expired'
            ? 'warranty-badge warranty-badge--expired'
            : status === 'expiring'
              ? 'warranty-badge warranty-badge--expiring'
              : 'warranty-badge warranty-badge--active'
    return `<td class="col-center"><span class="${badgeClass}">${dateStr}</span></td>`
}

function renderContractCell(customer: any): string {
    const latestEndDate = getLatestContractEndDate(customer)
    if (!latestEndDate) {
        return '<td class="col-center">—</td>'
    }
    const status = getDateStatus(latestEndDate)
    const dateStr = fmtDate(latestEndDate)
    const badgeClass =
        status === 'expired'
            ? 'warranty-badge warranty-badge--expired'
            : status === 'expiring'
              ? 'warranty-badge warranty-badge--expiring'
              : 'warranty-badge warranty-badge--active'
    return `<td class="col-center"><span class="${badgeClass}">${dateStr}</span></td>`
}

function renderCustomerRow(customer: any, index: number): string {
    const fmt = fmtDate
    const notes = (customer.notes as string[])?.join(', ') || '—'
    return `
        <tr>
            <td class="col-no">${index + 1}</td>
            <td class="col-name">${customer.customerName}</td>
            <td>${customer.companyName || '—'}</td>
            <td>${customer.address}</td>
            <td class="col-center">${fmt(customer.contractSigningDate)}</td>
            <td class="col-center">${fmt(customer.inspectionDate)}</td>
            <td class="col-center">${fmt(customer.acceptanceSigningDate)}</td>
            ${renderWarrantyCell(customer)}
            ${renderContractCell(customer)}
            <td class="col-center">${notes}</td>
            <td class="col-action">
                <div class="row-actions">
                    <button class="btn-edit" data-edit-customer-id="${customer._id}" title="Chỉnh sửa">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button class="btn-delete" data-delete-customer-id="${customer._id}" title="Xóa">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                    </button>
                    <button class="btn-detail" data-customer-id="${customer._id}">
                        Chi tiết
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                    </button>
                </div>
            </td>
        </tr>
    `
}

// ─── DETAIL PAGE ──────────────────────────────────────────────────────────────

function renderDetailPage(customerId: string): void {
    pageHistory.push(currentPage)
    currentPage = 'detail'
    const app = document.getElementById('app')!
    app.innerHTML = `
        <header class="app-header">
            <div class="header-brand">
                <div class="header-logo">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/>
                    </svg>
                </div>
                <div class="header-text">
                    <h1>Hera Flow</h1>
                </div>
                <span class="header-sep">|</span>
                <button class="btn-back" id="backBtn">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
                    Quay lại
                </button>
            </div>
            <div class="header-actions">
                <button class="btn-header-action" id="openAddWarrantyHistoryModalBtn">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    Lịch Sử Mới
                </button>
                <button class="btn-header-action" id="openAddContractModalBtn">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    Hợp Đồng Mới
                </button>
            </div>
        </header>
        <main class="app-main">
            <div id="loading" class="loading-spinner">Đang tải dữ liệu...</div>
            <div id="detailContainer"></div>
        </main>
    `
    document.getElementById('backBtn')!.addEventListener('click', navigateBack)
    loadCustomerDetail(customerId)
    setupAddContractForm(customerId)
    setupEditContractForm(customerId)
    setupAddWarrantyHistoryForm(customerId)
    setupEditWarrantyHistoryForm(customerId)
}

async function loadCustomerDetail(customerId: string): Promise<void> {
    const loadingEl = document.getElementById('loading')
    const container = document.getElementById('detailContainer')

    try {
        const customer = await window.api.getCustomerById(customerId)

        if (loadingEl) {
            loadingEl.style.display = 'none'
        }
        if (!customer || !container) {
            return
        }

        const fmt = fmtDate
        const contracts = (customer.maintenanceContracts as any[]) || []
        const warrantyHistory = (customer.warrantyHistory as any[]) || []

        const taskTypeLabel: Record<string, string> = {
            maintenance: 'Bảo trì',
            warranty: 'Bảo hành',
            other: 'Khác',
            'customer requested repair': 'Khách hàng y/c sửa chữa',
            'company requested repair': 'Cty y/c sửa chữa'
        }

        container.innerHTML = `
            <div class="detail-card">
                <h2 class="detail-name">${customer.customerName}</h2>
                <div class="detail-grid">
                    <div class="detail-field">
                        <span class="detail-label">Công ty</span>
                        <span class="detail-value">${customer.companyName || '—'}</span>
                    </div>
                    <div class="detail-field">
                        <span class="detail-label">Địa chỉ</span>
                        <span class="detail-value">${customer.address}</span>
                    </div>
                    <div class="detail-field">
                        <span class="detail-label">Ngày ký hợp đồng</span>
                        <span class="detail-value">${fmt(customer.contractSigningDate)}</span>
                    </div>
                    <div class="detail-field">
                        <span class="detail-label">Ngày kiểm định</span>
                        <span class="detail-value">${fmt(customer.inspectionDate)}</span>
                    </div>
                    <div class="detail-field">
                        <span class="detail-label">Ngày nghiệm thu</span>
                        <span class="detail-value">${fmt(customer.acceptanceSigningDate)}</span>
                    </div>
                    <div class="detail-field">
                        <span class="detail-label">Hết hạn bảo hành</span>
                        <span class="detail-value">${fmt(customer.warrantyExpirationDate)}</span>
                    </div>
                    <div class="detail-field">
                        <span class="detail-label">Ghi chú</span>
                        <span class="detail-value">${(customer.notes as string[])?.join(', ') || '—'}</span>
                    </div>
                </div>
            </div>

            <div class="detail-section">
                <h3 class="section-title">Hợp Đồng Bảo Trì</h3>
                ${
                    contracts.length === 0
                        ? '<div class="empty-state">Chưa có hợp đồng bảo trì nào.</div>'
                        : `<table class="customers-table">
                        <thead>
                            <tr>
                                <th>Số hợp đồng</th>
                                <th>Ngày bắt đầu</th>
                                <th>Ngày kết thúc</th>
                                <th>Nội dung</th>
                                <th class="col-action"></th>
                            </tr>
                        </thead>
                        <tbody>
                            ${contracts.map(renderContractRow).join('')}
                        </tbody>
                    </table>`
                }
            </div>

            <div class="detail-section">
                <h3 class="section-title">Lịch Sử Bảo Hành / Bảo Trì</h3>
                ${
                    warrantyHistory.length === 0
                        ? '<div class="empty-state">Chưa có lịch sử bảo hành / bảo trì nào.</div>'
                        : `<table class="customers-table">
                        <thead>
                            <tr>
                                <th class="col-no">STT</th>
                                <th class="col-center">Ngày</th>
                                <th>Loại công tác</th>
                                <th>Ghi chú</th>
                                <th class="col-action"></th>
                            </tr>
                        </thead>
                        <tbody>
                            ${[...warrantyHistory]
                                .sort(
                                    (a, b) =>
                                        new Date(b.date).getTime() - new Date(a.date).getTime()
                                )
                                .map(
                                    (h: any) => `
                            <tr>
                                <td class="col-no">${h.sequenceNumber}</td>
                                <td class="col-center">${fmt(h.date)}</td>
                                <td>${taskTypeLabel[h.taskType] ?? h.taskType}</td>
                                <td>${h.notes || '—'}</td>
                                <td class="col-action">
                                    <button class="btn-edit" data-edit-warranty="${h._id}"
                                        data-seq="${h.sequenceNumber}"
                                        data-date="${h.date}"
                                        data-task-type="${h.taskType}"
                                        data-contents="${encodeURIComponent(JSON.stringify(h.maintenanceContents || []))}"
                                        data-notes="${encodeURIComponent(h.notes || '')}"
                                        title="Sửa">
                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                    </button>
                                    <button class="btn-delete" data-delete-warranty="${h._id}" title="Xóa">
                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                                    </button>
                                </td>
                            </tr>`
                                )
                                .join('')}
                        </tbody>
                    </table>`
                }
            </div>
        `

        container.querySelectorAll('[data-edit-contract]').forEach((btn) => {
            btn.addEventListener('click', () => {
                const el = btn as HTMLElement
                openEditContractModal({
                    _id: el.dataset.editContract!,
                    contractNumber: el.dataset.contractNumber!,
                    startDate: el.dataset.startDate!,
                    endDate: el.dataset.endDate!,
                    equipmentItems: JSON.parse(el.dataset.equipmentItems || '[]')
                })
            })
        })

        container.querySelectorAll('[data-delete-contract]').forEach((btn) => {
            btn.addEventListener('click', async () => {
                const id = (btn as HTMLElement).dataset.deleteContract!
                if (!confirm('Bạn có chắc muốn xóa hợp đồng này?')) {
                    return
                }
                try {
                    await window.api.deleteMaintenanceContract(id)
                    loadCustomerDetail(customerId)
                } catch (error) {
                    console.error('Lỗi khi xóa hợp đồng:', error)
                    alert('Có lỗi xảy ra khi xóa hợp đồng!')
                }
            })
        })

        container.querySelectorAll('[data-delete-warranty]').forEach((btn) => {
            btn.addEventListener('click', async () => {
                const id = (btn as HTMLElement).dataset.deleteWarranty!
                if (!confirm('Bạn có chắc muốn xóa mục lịch sử này?')) {
                    return
                }
                try {
                    await window.api.deleteWarrantyHistory(id)
                    loadCustomerDetail(customerId)
                } catch (error) {
                    console.error('Lỗi khi xóa lịch sử:', error)
                    alert('Có lỗi xảy ra khi xóa!')
                }
            })
        })

        container.querySelectorAll('[data-edit-warranty]').forEach((btn) => {
            btn.addEventListener('click', () => {
                const el = btn as HTMLElement
                openEditWarrantyHistoryModal({
                    _id: el.dataset.editWarranty!,
                    sequenceNumber: el.dataset.seq!,
                    date: el.dataset.date!,
                    taskType: el.dataset.taskType!,
                    maintenanceContents: JSON.parse(
                        decodeURIComponent(el.dataset.contents || '[]')
                    ),
                    notes: decodeURIComponent(el.dataset.notes || '')
                })
            })
        })
    } catch (error) {
        console.error('Lỗi khi tải thông tin khách hàng:', error)
        if (loadingEl) {
            loadingEl.style.color = '#ef4444'
            loadingEl.innerText = 'Lỗi tải dữ liệu.'
        }
    }
}

function renderContractRow(contract: any): string {
    const fmt = fmtDate
    const items = (contract.equipmentItems as any[]) || []
    const itemsHtml = items.length
        ? items
              .map(
                  (e) =>
                      `<span class="elevator-item">${e.quantity} thang &bull; ${e.weight} kg &bull; ${e.numberOfStops} tầng</span>`
              )
              .join('')
        : '<span>—</span>'
    const itemsJson = JSON.stringify(
        items.map((e) => ({
            weight: e.weight,
            numberOfStops: e.numberOfStops,
            quantity: e.quantity
        }))
    ).replace(/"/g, '&quot;')
    return `
        <tr>
            <td>${contract.contractNumber || '—'}</td>
            <td>${fmt(contract.startDate)}</td>
            <td>${fmt(contract.endDate)}</td>
            <td class="elevator-items-cell">${itemsHtml}</td>
            <td class="col-action">
                <div class="row-actions">
                    <button class="btn-edit"
                        data-edit-contract="${contract._id}"
                        data-contract-number="${contract.contractNumber || ''}"
                        data-start-date="${contract.startDate || ''}"
                        data-end-date="${contract.endDate || ''}"
                        data-equipment-items="${itemsJson}"
                        title="Chỉnh sửa">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button class="btn-delete" data-delete-contract="${contract._id}" title="Xóa">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                    </button>
                </div>
            </td>
        </tr>
    `
}

function setupAddContractForm(customerId: string): void {
    const modal = document.getElementById('addContractModal')
    const openBtn = document.getElementById('openAddContractModalBtn')
    const closeBtn = document.getElementById('closeAddContractModalBtn')
    const cancelBtn = document.getElementById('cancelAddContractBtn')
    const form = document.getElementById('addContractForm') as HTMLFormElement
    const saveBtn = document.getElementById('saveContractBtn') as HTMLButtonElement
    const addItemBtn = document.getElementById('addEquipmentItemBtn')
    const itemsList = document.getElementById('equipmentItemsList')

    function addEquipmentRow(): void {
        const row = document.createElement('div')
        row.className = 'equipment-item-row'
        row.style.cssText = 'display:flex;gap:8px;align-items:center;margin-bottom:8px'
        row.innerHTML = `
            <input type="number" placeholder="Tải trọng (kg)" class="eq-weight" step="0.01" min="0" required style="flex:2" />
            <input type="number" placeholder="Số tầng dừng" class="eq-stops" min="1" required style="flex:2" />
            <input type="number" placeholder="Số lượng" class="eq-qty" min="1" value="1" required style="flex:1" />
            <button type="button" class="btn btn-secondary" style="padding:4px 8px">×</button>
        `
        row.querySelector('button')!.addEventListener('click', () => row.remove())
        itemsList?.appendChild(row)
    }

    if (addItemBtn) {
        addItemBtn.onclick = addEquipmentRow
    }

    const openModal = () => {
        itemsList!.innerHTML = ''
        modal?.classList.add('show')
    }
    const closeModal = () => {
        modal?.classList.remove('show')
        form?.reset()
        itemsList!.innerHTML = ''
    }

    if (openBtn) {
        openBtn.onclick = openModal
    }
    if (closeBtn) {
        closeBtn.onclick = closeModal
    }
    if (cancelBtn) {
        cancelBtn.onclick = closeModal
    }
    if (modal) {
        modal.onclick = (e) => {
            if (e.target === modal) {
                closeModal()
            }
        }
    }

    form.onsubmit = async (e) => {
        e.preventDefault()
        const formData = new FormData(form)
        const data: any = Object.fromEntries(formData.entries())
        data.customerId = customerId

        const dateError = validateContractDates(data.startDate, data.endDate)
        if (dateError) {
            alert(dateError)
            return
        }

        data.equipmentItems = Array.from(
            itemsList?.querySelectorAll('.equipment-item-row') ?? []
        ).map((row) => ({
            weight: parseFloat((row.querySelector('.eq-weight') as HTMLInputElement).value),
            numberOfStops: parseInt((row.querySelector('.eq-stops') as HTMLInputElement).value),
            quantity: parseInt((row.querySelector('.eq-qty') as HTMLInputElement).value)
        }))

        try {
            if (saveBtn) {
                saveBtn.disabled = true
                saveBtn.innerText = 'Đang lưu...'
            }
            await window.api.createMaintenanceContract(data)
            closeModal()
            loadCustomerDetail(customerId)
        } catch (error: any) {
            console.error('Lỗi khi tạo hợp đồng bảo trì:', error)
            alert(error?.message || 'Có lỗi xảy ra khi tạo hợp đồng!')
        } finally {
            if (saveBtn) {
                saveBtn.disabled = false
                saveBtn.innerText = 'Lưu Lại'
            }
        }
    }
}

function setupEditContractForm(customerId: string): void {
    const modal = document.getElementById('editContractModal')
    const closeBtn = document.getElementById('closeEditContractModalBtn')
    const cancelBtn = document.getElementById('cancelEditContractBtn')
    const form = document.getElementById('editContractForm') as HTMLFormElement
    const saveBtn = document.getElementById('saveEditContractBtn') as HTMLButtonElement
    const addItemBtn = document.getElementById('editAddEquipmentItemBtn')
    const itemsList = document.getElementById('editEquipmentItemsList')

    function addEquipmentRow(weight = '', stops = '', qty = '1'): void {
        const row = document.createElement('div')
        row.className = 'equipment-item-row'
        row.style.cssText = 'display:flex;gap:8px;align-items:center;margin-bottom:8px'
        row.innerHTML = `
            <input type="number" placeholder="Tải trọng (kg)" class="eq-weight" step="0.01" min="0" value="${weight}" required style="flex:2" />
            <input type="number" placeholder="Số tầng dừng" class="eq-stops" min="1" value="${stops}" required style="flex:2" />
            <input type="number" placeholder="Số lượng" class="eq-qty" min="1" value="${qty}" required style="flex:1" />
            <button type="button" class="btn btn-secondary" style="padding:4px 8px">×</button>
        `
        row.querySelector('button')!.addEventListener('click', () => row.remove())
        itemsList?.appendChild(row)
    }

    if (addItemBtn) {
        addItemBtn.onclick = () => addEquipmentRow()
    }

    const closeModal = () => {
        modal?.classList.remove('show')
        form?.reset()
        if (itemsList) {
            itemsList.innerHTML = ''
        }
    }

    if (closeBtn) {
        closeBtn.onclick = closeModal
    }
    if (cancelBtn) {
        cancelBtn.onclick = closeModal
    }
    if (modal) {
        modal.onclick = (e) => {
            if (e.target === modal) {
                closeModal()
            }
        }
    }

    form.onsubmit = async (e) => {
        e.preventDefault()
        const id = (document.getElementById('editContractId') as HTMLInputElement).value
        const formData = new FormData(form)
        const raw: any = Object.fromEntries(formData.entries())
        const equipmentItems = Array.from(
            itemsList?.querySelectorAll('.equipment-item-row') ?? []
        ).map((row) => ({
            weight: parseFloat((row.querySelector('.eq-weight') as HTMLInputElement).value),
            numberOfStops: parseInt((row.querySelector('.eq-stops') as HTMLInputElement).value),
            quantity: parseInt((row.querySelector('.eq-qty') as HTMLInputElement).value)
        }))

        const dateError = validateContractDates(raw.startDate, raw.endDate)
        if (dateError) {
            alert(dateError)
            return
        }

        try {
            if (saveBtn) {
                saveBtn.disabled = true
                saveBtn.innerText = 'Đang lưu...'
            }
            await window.api.updateMaintenanceContract(id, {
                contractNumber: raw.contractNumber,
                startDate: raw.startDate,
                endDate: raw.endDate,
                equipmentItems
            })
            closeModal()
            loadCustomerDetail(customerId)
        } catch (error: any) {
            console.error('Lỗi khi cập nhật hợp đồng:', error)
            alert(error?.message || 'Có lỗi xảy ra khi cập nhật hợp đồng!')
        } finally {
            if (saveBtn) {
                saveBtn.disabled = false
                saveBtn.innerText = 'Lưu Lại'
            }
        }
    }
}

function openEditContractModal(contract: any): void {
    const modal = document.getElementById('editContractModal')
    const itemsList = document.getElementById('editEquipmentItemsList')
    if (itemsList) {
        itemsList.innerHTML = ''
    }

    const toDateInput = (d?: string) => (d ? new Date(d).toISOString().split('T')[0] : '')
    ;(document.getElementById('editContractId') as HTMLInputElement).value = contract._id
    ;(document.getElementById('editContractNumber') as HTMLInputElement).value =
        contract.contractNumber || ''
    ;(document.getElementById('editStartDate') as HTMLInputElement).value = toDateInput(
        contract.startDate
    )
    ;(document.getElementById('editEndDate') as HTMLInputElement).value = toDateInput(
        contract.endDate
    )

    for (const item of contract.equipmentItems || []) {
        const row = document.createElement('div')
        row.className = 'equipment-item-row'
        row.style.cssText = 'display:flex;gap:8px;align-items:center;margin-bottom:8px'
        row.innerHTML = `
            <input type="number" placeholder="Tải trọng (kg)" class="eq-weight" step="0.01" min="0" value="${item.weight}" required style="flex:2" />
            <input type="number" placeholder="Số tầng dừng" class="eq-stops" min="1" value="${item.numberOfStops}" required style="flex:2" />
            <input type="number" placeholder="Số lượng" class="eq-qty" min="1" value="${item.quantity}" required style="flex:1" />
            <button type="button" class="btn btn-secondary" style="padding:4px 8px">×</button>
        `
        row.querySelector('button')!.addEventListener('click', () => row.remove())
        itemsList?.appendChild(row)
    }

    modal?.classList.add('show')
}

// ─── WARRANTY HISTORY FORMS ───────────────────────────────────────────────────

function setupAddWarrantyHistoryForm(customerId: string): void {
    const modal = document.getElementById('addWarrantyHistoryModal')
    const openBtn = document.getElementById('openAddWarrantyHistoryModalBtn')
    const closeBtn = document.getElementById('closeAddWarrantyHistoryModalBtn')
    const cancelBtn = document.getElementById('cancelAddWarrantyHistoryBtn')
    const form = document.getElementById('addWarrantyHistoryForm') as HTMLFormElement
    const saveBtn = document.getElementById('saveWarrantyHistoryBtn') as HTMLButtonElement
    const addContentBtn = document.getElementById('addWhContentBtn')
    const contentsList = document.getElementById('whContentsList')

    function addContentRow(value = ''): void {
        const row = document.createElement('div')
        row.style.cssText = 'display:flex;gap:8px;align-items:center;margin-bottom:8px'
        row.innerHTML = `
            <input type="text" placeholder="Nội dung..." class="wh-content-input" value="${value}" style="flex:1" />
            <button type="button" class="btn btn-secondary" style="padding:4px 8px">×</button>
        `
        row.querySelector('button')!.addEventListener('click', () => row.remove())
        contentsList?.appendChild(row)
    }

    if (addContentBtn) {
        addContentBtn.onclick = () => addContentRow()
    }

    const openModal = () => {
        if (contentsList) {
            contentsList.innerHTML = ''
        }
        modal?.classList.add('show')
    }
    const closeModal = () => {
        modal?.classList.remove('show')
        form?.reset()
        if (contentsList) {
            contentsList.innerHTML = ''
        }
    }

    if (openBtn) {
        openBtn.onclick = openModal
    }
    if (closeBtn) {
        closeBtn.onclick = closeModal
    }
    if (cancelBtn) {
        cancelBtn.onclick = closeModal
    }
    if (modal) {
        modal.onclick = (e) => {
            if (e.target === modal) {
                closeModal()
            }
        }
    }

    form.onsubmit = async (e) => {
        e.preventDefault()
        const formData = new FormData(form)
        const raw: any = Object.fromEntries(formData.entries())
        const maintenanceContents = Array.from(
            contentsList?.querySelectorAll('.wh-content-input') ?? []
        )
            .map((el) => (el as HTMLInputElement).value.trim())
            .filter(Boolean)

        try {
            if (saveBtn) {
                saveBtn.disabled = true
                saveBtn.innerText = 'Đang lưu...'
            }
            await window.api.createWarrantyHistory({
                customerId,
                sequenceNumber: parseInt(raw.sequenceNumber),
                date: raw.date,
                taskType: raw.taskType,
                maintenanceContents,
                notes: raw.notes || ''
            })
            closeModal()
            loadCustomerDetail(customerId)
        } catch (error: any) {
            console.error('Lỗi khi tạo lịch sử:', error)
            alert(error?.message || 'Có lỗi xảy ra khi tạo lịch sử!')
        } finally {
            if (saveBtn) {
                saveBtn.disabled = false
                saveBtn.innerText = 'Lưu Lại'
            }
        }
    }
}

function setupEditWarrantyHistoryForm(customerId: string): void {
    const modal = document.getElementById('editWarrantyHistoryModal')
    const closeBtn = document.getElementById('closeEditWarrantyHistoryModalBtn')
    const cancelBtn = document.getElementById('cancelEditWarrantyHistoryBtn')
    const form = document.getElementById('editWarrantyHistoryForm') as HTMLFormElement
    const saveBtn = document.getElementById('saveEditWarrantyHistoryBtn') as HTMLButtonElement
    const addContentBtn = document.getElementById('editAddWhContentBtn')
    const contentsList = document.getElementById('editWhContentsList')

    function addContentRow(value = ''): void {
        const row = document.createElement('div')
        row.style.cssText = 'display:flex;gap:8px;align-items:center;margin-bottom:8px'
        row.innerHTML = `
            <input type="text" placeholder="Nội dung..." class="wh-content-input" value="${value}" style="flex:1" />
            <button type="button" class="btn btn-secondary" style="padding:4px 8px">×</button>
        `
        row.querySelector('button')!.addEventListener('click', () => row.remove())
        contentsList?.appendChild(row)
    }

    if (addContentBtn) {
        addContentBtn.onclick = () => addContentRow()
    }

    const closeModal = () => {
        modal?.classList.remove('show')
        form?.reset()
        if (contentsList) {
            contentsList.innerHTML = ''
        }
    }

    if (closeBtn) {
        closeBtn.onclick = closeModal
    }
    if (cancelBtn) {
        cancelBtn.onclick = closeModal
    }
    if (modal) {
        modal.onclick = (e) => {
            if (e.target === modal) {
                closeModal()
            }
        }
    }

    form.onsubmit = async (e) => {
        e.preventDefault()
        const id = (document.getElementById('editWarrantyHistoryId') as HTMLInputElement).value
        const formData = new FormData(form)
        const raw: any = Object.fromEntries(formData.entries())
        const maintenanceContents = Array.from(
            contentsList?.querySelectorAll('.wh-content-input') ?? []
        )
            .map((el) => (el as HTMLInputElement).value.trim())
            .filter(Boolean)

        try {
            if (saveBtn) {
                saveBtn.disabled = true
                saveBtn.innerText = 'Đang lưu...'
            }
            await window.api.updateWarrantyHistory(id, {
                sequenceNumber: parseInt(raw.sequenceNumber),
                date: raw.date,
                taskType: raw.taskType,
                maintenanceContents,
                notes: raw.notes || ''
            })
            closeModal()
            loadCustomerDetail(customerId)
        } catch (error: any) {
            console.error('Lỗi khi cập nhật lịch sử:', error)
            alert(error?.message || 'Có lỗi xảy ra khi cập nhật lịch sử!')
        } finally {
            if (saveBtn) {
                saveBtn.disabled = false
                saveBtn.innerText = 'Lưu Lại'
            }
        }
    }
}

function openEditWarrantyHistoryModal(entry: any): void {
    const modal = document.getElementById('editWarrantyHistoryModal')
    const contentsList = document.getElementById('editWhContentsList')
    if (contentsList) {
        contentsList.innerHTML = ''
    }

    const toDateInput = (d?: string) => (d ? new Date(d).toISOString().split('T')[0] : '')
    ;(document.getElementById('editWarrantyHistoryId') as HTMLInputElement).value = entry._id
    ;(document.getElementById('editWhSequenceNumber') as HTMLInputElement).value =
        entry.sequenceNumber
    ;(document.getElementById('editWhDate') as HTMLInputElement).value = toDateInput(entry.date)
    ;(document.getElementById('editWhTaskType') as HTMLSelectElement).value = entry.taskType
    ;(document.getElementById('editWhNotes') as HTMLTextAreaElement).value = entry.notes || ''

    for (const content of entry.maintenanceContents || []) {
        const row = document.createElement('div')
        row.style.cssText = 'display:flex;gap:8px;align-items:center;margin-bottom:8px'
        row.innerHTML = `
            <input type="text" placeholder="Nội dung..." class="wh-content-input" value="${content}" style="flex:1" />
            <button type="button" class="btn btn-secondary" style="padding:4px 8px">×</button>
        `
        row.querySelector('button')!.addEventListener('click', () => row.remove())
        contentsList?.appendChild(row)
    }

    modal?.classList.add('show')
}

// ─── TRASH PAGE ───────────────────────────────────────────────────────────────

async function renderTrashPage(): Promise<void> {
    setActiveNav('navTrash')
    const app = document.getElementById('app')!
    app.innerHTML = `
        <header class="app-header">
            <div class="header-brand">
                <div class="header-logo">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                    </svg>
                </div>
                <div class="header-text">
                    <h1>Thùng Rác</h1>
                    <p class="header-subtitle">Khôi phục hoặc xóa vĩnh viễn các mục đã xóa</p>
                </div>
            </div>
            <div class="header-actions">
                <button class="btn-empty-trash" id="emptyTrashBtn">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                    </svg>
                    Xóa tất cả
                </button>
            </div>
        </header>
        <main class="app-main">
            <div id="trashLoading" class="loading-spinner">Đang tải dữ liệu...</div>
            <div id="trashContainer"></div>
        </main>
    `
    document.getElementById('emptyTrashBtn')!.addEventListener('click', async () => {
        if (
            !confirm(
                'Xóa vĩnh viễn tất cả các mục trong thùng rác? Hành động này không thể hoàn tác.'
            )
        ) {
            return
        }
        try {
            await window.api.trashEmpty()
            loadTrashData()
        } catch {
            alert('Lỗi khi dọn thùng rác!')
        }
    })
    loadTrashData()
}

async function loadTrashData(): Promise<void> {
    const loadingEl = document.getElementById('trashLoading')
    const container = document.getElementById('trashContainer')
    if (!container) {
        return
    }

    try {
        const [customers, contracts] = await Promise.all([
            window.api.trashGetDeletedCustomers(),
            window.api.trashGetDeletedContracts()
        ])

        if (loadingEl) {
            loadingEl.style.display = 'none'
        }

        const emptyTrashBtn = document.getElementById('emptyTrashBtn') as HTMLButtonElement | null
        if (emptyTrashBtn) {
            emptyTrashBtn.style.display =
                customers.length === 0 && contracts.length === 0 ? 'none' : ''
        }

        if (customers.length === 0 && contracts.length === 0) {
            container.innerHTML = `
                <div class="trash-empty">
                    <div class="trash-empty-icon">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                        </svg>
                    </div>
                    <p class="trash-empty-title">Thùng rác trống</p>
                    <p class="trash-empty-sub">Các mục bị xóa sẽ xuất hiện ở đây</p>
                </div>
            `
            return
        }

        const fmt = fmtDate

        const iconPerson = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`
        const iconContract = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`
        const iconRestore = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>`
        const iconDelete = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>`

        container.innerHTML = `
            ${
                customers.length > 0
                    ? `
            <div class="trash-section">
                <div class="trash-section-header">
                    <span class="trash-section-title">Khách hàng</span>
                    <span class="trash-count">${customers.length}</span>
                </div>
                <div class="trash-grid">
                    ${customers
                        .map(
                            (c: any) => `
                    <div class="trash-card trash-card--customer">
                        <div class="trash-card-header">
                            <div class="trash-card-icon trash-card-icon--person">${iconPerson}</div>
                            <div class="trash-card-meta">
                                <span class="trash-card-name">${c.customerName}</span>
                                ${c.companyName ? `<span class="trash-card-sub">${c.companyName}</span>` : ''}
                            </div>
                        </div>
                        <div class="trash-card-body">
                            <div class="trash-card-row">
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                                <span>${c.address}</span>
                            </div>
                        </div>
                        <div class="trash-card-actions">
                            <button class="trash-btn-restore" data-restore-customer="${c._id}">
                                ${iconRestore} Khôi phục
                            </button>
                            <button class="trash-btn-delete" data-perm-delete-customer="${c._id}" title="Xóa vĩnh viễn">
                                ${iconDelete}
                            </button>
                        </div>
                    </div>
                    `
                        )
                        .join('')}
                </div>
            </div>`
                    : ''
            }

            ${
                contracts.length > 0
                    ? `
            <div class="trash-section">
                <div class="trash-section-header">
                    <span class="trash-section-title">Hợp đồng bảo trì</span>
                    <span class="trash-count">${contracts.length}</span>
                </div>
                <div class="trash-grid">
                    ${contracts
                        .map(
                            (c: any) => `
                    <div class="trash-card trash-card--contract">
                        <div class="trash-card-header">
                            <div class="trash-card-icon trash-card-icon--contract">${iconContract}</div>
                            <div class="trash-card-meta">
                                <span class="trash-card-name">${c.contractNumber || '—'}</span>
                                <span class="trash-card-sub">Hợp đồng bảo trì</span>
                            </div>
                        </div>
                        <div class="trash-card-body">
                            <div class="trash-card-row">
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                                <span>${fmt(c.startDate)} → ${fmt(c.endDate)}</span>
                            </div>
                        </div>
                        <div class="trash-card-actions">
                            <button class="trash-btn-restore" data-restore-contract="${c._id}">
                                ${iconRestore} Khôi phục
                            </button>
                            <button class="trash-btn-delete" data-perm-delete-contract="${c._id}" title="Xóa vĩnh viễn">
                                ${iconDelete}
                            </button>
                        </div>
                    </div>
                    `
                        )
                        .join('')}
                </div>
            </div>`
                    : ''
            }
        `

        container.querySelectorAll('[data-restore-customer]').forEach((btn) => {
            btn.addEventListener('click', async () => {
                const id = (btn as HTMLElement).dataset.restoreCustomer!
                if (!confirm('Khôi phục khách hàng này và các hợp đồng liên quan?')) {
                    return
                }
                try {
                    await window.api.trashRestoreCustomer(id)
                    loadTrashData()
                } catch {
                    alert('Lỗi khi khôi phục khách hàng!')
                }
            })
        })

        container.querySelectorAll('[data-perm-delete-customer]').forEach((btn) => {
            btn.addEventListener('click', async () => {
                const id = (btn as HTMLElement).dataset.permDeleteCustomer!
                if (!confirm('Xóa vĩnh viễn khách hàng này? Hành động không thể hoàn tác.')) {
                    return
                }
                try {
                    await window.api.trashPermanentDeleteCustomer(id)
                    loadTrashData()
                } catch {
                    alert('Lỗi khi xóa vĩnh viễn!')
                }
            })
        })

        container.querySelectorAll('[data-restore-contract]').forEach((btn) => {
            btn.addEventListener('click', async () => {
                const id = (btn as HTMLElement).dataset.restoreContract!
                if (!confirm('Khôi phục hợp đồng bảo trì này?')) {
                    return
                }
                try {
                    await window.api.trashRestoreContract(id)
                    loadTrashData()
                } catch {
                    alert('Lỗi khi khôi phục hợp đồng!')
                }
            })
        })

        container.querySelectorAll('[data-perm-delete-contract]').forEach((btn) => {
            btn.addEventListener('click', async () => {
                const id = (btn as HTMLElement).dataset.permDeleteContract!
                if (!confirm('Xóa vĩnh viễn hợp đồng này? Hành động không thể hoàn tác.')) {
                    return
                }
                try {
                    await window.api.trashPermanentDeleteContract(id)
                    loadTrashData()
                } catch {
                    alert('Lỗi khi xóa vĩnh viễn!')
                }
            })
        })
    } catch (error) {
        console.error('Lỗi khi tải thùng rác:', error)
        if (loadingEl) {
            loadingEl.style.color = '#ef4444'
            loadingEl.innerText = 'Lỗi tải dữ liệu.'
        }
    }
}

init()
