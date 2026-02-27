function init(): void {
    window.addEventListener('DOMContentLoaded', () => {
        setupSidebar()
        renderListPage()
    })
}

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────

function setupSidebar(): void {
    const sidebar = document.getElementById('sidebar')!
    const toggleBtn = document.getElementById('sidebarToggleBtn')!
    const navCustomers = document.getElementById('navCustomers')!
    const navTrash = document.getElementById('navTrash')!

    const collapsed = localStorage.getItem('sidebarCollapsed') === 'true'
    if (collapsed) sidebar.classList.add('collapsed')

    toggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed')
        localStorage.setItem('sidebarCollapsed', String(sidebar.classList.contains('collapsed')))
    })

    navCustomers.addEventListener('click', () => {
        setActiveNav('navCustomers')
        renderListPage()
    })

    navTrash.addEventListener('click', () => {
        setActiveNav('navTrash')
        renderTrashPage()
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

function renderListPage(): void {
    setActiveNav('navCustomers')
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
                <button class="btn-header-action" id="openAddCustomerModalBtn">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    Thêm Khách Hàng
                </button>
            </div>
        </header>
        <main class="app-main">
            <div id="loading" class="loading-spinner">Đang tải dữ liệu...</div>
            <div id="customersContainer"></div>
        </main>
    `
    loadCustomers()
    setupAddCustomerForm()
    setupEditCustomerForm()
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
        ;['contractSigningDate', 'acceptanceSigningDate', 'warrantyExpirationDate'].forEach((f) => {
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

    if (closeBtn) closeBtn.onclick = closeModal
    if (cancelBtn) cancelBtn.onclick = closeModal
    if (modal) {
        modal.onclick = (e) => {
            if (e.target === modal) closeModal()
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
    const toDateInput = (d?: string | null) =>
        d ? new Date(d).toISOString().split('T')[0] : ''
    ;(document.getElementById('editCustomerId') as HTMLInputElement).value = customer._id
    ;(document.getElementById('editCustomerName') as HTMLInputElement).value =
        customer.customerName || ''
    ;(document.getElementById('editCompanyName') as HTMLInputElement).value =
        customer.companyName || ''
    ;(document.getElementById('editAddress') as HTMLInputElement).value = customer.address || ''
    ;(document.getElementById('editContractSigningDate') as HTMLInputElement).value =
        toDateInput(customer.contractSigningDate)
    ;(document.getElementById('editAcceptanceSigningDate') as HTMLInputElement).value =
        toDateInput(customer.acceptanceSigningDate)
    ;(document.getElementById('editWarrantyExpirationDate') as HTMLInputElement).value =
        toDateInput(customer.warrantyExpirationDate)
    ;(document.getElementById('editNotes') as HTMLTextAreaElement).value =
        (customer.notes as string[])?.join(', ') || ''
    modal?.classList.add('show')
}

async function loadCustomers(): Promise<void> {
    const loadingEl = document.getElementById('loading')
    const containerEl = document.getElementById('customersContainer')

    try {
        const customers = await window.api.getAllCustomers()

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

        if (containerEl) {
            containerEl.innerHTML = `
                <table class="customers-table">
                    <thead>
                        <tr>
                            <th class="col-no">#</th>
                            <th>Tên khách hàng</th>
                            <th>Công ty</th>
                            <th>Địa chỉ</th>
                            <th class="col-center">Ngày ký HĐ</th>
                            <th class="col-center">Ngày nghiệm thu</th>
                            <th class="col-center">Hết hạn BH</th>
                            <th class="col-center">Ghi chú</th>
                            <th class="col-action"></th>
                        </tr>
                    </thead>
                    <tbody>
                        ${customers.map((c, i) => renderCustomerRow(c, i)).join('')}
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
                    const customer = customers.find((c: any) => c._id === id)
                    if (customer) openEditCustomerModal(customer)
                })
            })
            containerEl.querySelectorAll('[data-delete-customer-id]').forEach((btn) => {
                btn.addEventListener('click', async () => {
                    const id = (btn as HTMLElement).dataset.deleteCustomerId!
                    const customer = customers.find((c: any) => c._id === id)
                    const name = customer?.customerName ?? 'khách hàng này'
                    if (!confirm(`Bạn có chắc muốn xóa "${name}"?\nHành động này không thể hoàn tác.`))
                        return
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
    } catch (error) {
        console.error('Lỗi khi tải dữ liệu khách hàng:', error)
        if (loadingEl) {
            loadingEl.style.color = '#ef4444'
            loadingEl.innerText = 'Lỗi tải dữ liệu. Hãy kiểm tra lại kết nối cơ sở dữ liệu.'
        }
    }
}

function renderCustomerRow(customer: any, index: number): string {
    const fmt = (d?: string | null) => (d ? new Date(d).toLocaleDateString('vi-VN') : '—')
    const notes = (customer.notes as string[])?.join(', ') || '—'
    return `
        <tr>
            <td class="col-no">${index + 1}</td>
            <td class="col-name">${customer.customerName}</td>
            <td>${customer.companyName || '—'}</td>
            <td>${customer.address}</td>
            <td class="col-center">${fmt(customer.contractSigningDate)}</td>
            <td class="col-center">${fmt(customer.acceptanceSigningDate)}</td>
            <td class="col-center">${fmt(customer.warrantyExpirationDate)}</td>
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
    document.getElementById('backBtn')!.addEventListener('click', renderListPage)
    loadCustomerDetail(customerId)
    setupAddContractForm(customerId)
    setupEditContractForm(customerId)
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

        const fmt = (d?: string | null) => (d ? new Date(d).toLocaleDateString('vi-VN') : '—')
        const contracts = (customer.maintenanceContracts as any[]) || []

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
                if (!confirm('Bạn có chắc muốn xóa hợp đồng này?')) return
                try {
                    await window.api.deleteMaintenanceContract(id)
                    loadCustomerDetail(customerId)
                } catch (error) {
                    console.error('Lỗi khi xóa hợp đồng:', error)
                    alert('Có lỗi xảy ra khi xóa hợp đồng!')
                }
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
    const fmt = (d?: string) => (d ? new Date(d).toLocaleDateString('vi-VN') : '—')
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
        items.map((e) => ({ weight: e.weight, numberOfStops: e.numberOfStops, quantity: e.quantity }))
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

    if (addItemBtn) addItemBtn.onclick = () => addEquipmentRow()

    const closeModal = () => {
        modal?.classList.remove('show')
        form?.reset()
        if (itemsList) itemsList.innerHTML = ''
    }

    if (closeBtn) closeBtn.onclick = closeModal
    if (cancelBtn) cancelBtn.onclick = closeModal
    if (modal) {
        modal.onclick = (e) => {
            if (e.target === modal) closeModal()
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
    if (itemsList) itemsList.innerHTML = ''

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
        if (!confirm('Xóa vĩnh viễn tất cả các mục trong thùng rác? Hành động này không thể hoàn tác.'))
            return
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
    if (!container) return

    try {
        const [customers, contracts] = await Promise.all([
            window.api.trashGetDeletedCustomers(),
            window.api.trashGetDeletedContracts()
        ])

        if (loadingEl) loadingEl.style.display = 'none'

        const emptyTrashBtn = document.getElementById('emptyTrashBtn') as HTMLButtonElement | null
        if (emptyTrashBtn) emptyTrashBtn.style.display =
            customers.length === 0 && contracts.length === 0 ? 'none' : ''

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

        const fmt = (d?: string | null) => (d ? new Date(d).toLocaleDateString('vi-VN') : '—')

        const iconPerson = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`
        const iconContract = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`
        const iconRestore = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>`
        const iconDelete = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>`

        container.innerHTML = `
            ${customers.length > 0 ? `
            <div class="trash-section">
                <div class="trash-section-header">
                    <span class="trash-section-title">Khách hàng</span>
                    <span class="trash-count">${customers.length}</span>
                </div>
                <div class="trash-grid">
                    ${customers.map((c: any) => `
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
                    `).join('')}
                </div>
            </div>` : ''}

            ${contracts.length > 0 ? `
            <div class="trash-section">
                <div class="trash-section-header">
                    <span class="trash-section-title">Hợp đồng bảo trì</span>
                    <span class="trash-count">${contracts.length}</span>
                </div>
                <div class="trash-grid">
                    ${contracts.map((c: any) => `
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
                    `).join('')}
                </div>
            </div>` : ''}
        `

        container.querySelectorAll('[data-restore-customer]').forEach((btn) => {
            btn.addEventListener('click', async () => {
                const id = (btn as HTMLElement).dataset.restoreCustomer!
                if (!confirm('Khôi phục khách hàng này và các hợp đồng liên quan?')) return
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
                if (!confirm('Xóa vĩnh viễn khách hàng này? Hành động không thể hoàn tác.')) return
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
                if (!confirm('Khôi phục hợp đồng bảo trì này?')) return
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
                if (!confirm('Xóa vĩnh viễn hợp đồng này? Hành động không thể hoàn tác.')) return
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
