function init(): void {
    window.addEventListener('DOMContentLoaded', () => {
        renderListPage()
    })
}

// ─── LIST PAGE ────────────────────────────────────────────────────────────────

function renderListPage(): void {
    const app = document.getElementById('app')!
    app.innerHTML = `
        <header class="app-header">
            <div class="header-brand">
                <div class="header-logo">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/>
                    </svg>
                </div>
                <div>
                    <h1>Hera Flow</h1>
                    <p>Quản lý hợp đồng bảo trì &amp; bảo hành thang máy</p>
                </div>
            </div>
            <div class="header-actions">
                <button class="btn btn-primary" id="openAddCustomerModalBtn">
                    <span>+</span> Thêm Khách Hàng
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
                <button class="btn-detail" data-customer-id="${customer._id}">
                    Chi tiết
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </button>
            </td>
        </tr>
    `
}

// ─── DETAIL PAGE ──────────────────────────────────────────────────────────────

function renderDetailPage(customerId: string): void {
    const app = document.getElementById('app')!
    app.innerHTML = `
        <header class="app-header">
            <div class="header-content">
                <button class="btn btn-secondary" id="backBtn">← Quay lại</button>
            </div>
            <div class="header-actions">
                <button class="btn btn-primary" id="openAddContractModalBtn">+ Hợp Đồng Mới</button>
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
                            </tr>
                        </thead>
                        <tbody>
                            ${contracts.map(renderContractRow).join('')}
                        </tbody>
                    </table>`
                }
            </div>
        `
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
    return `
        <tr>
            <td>${contract.contractNumber || '—'}</td>
            <td>${fmt(contract.startDate)}</td>
            <td>${fmt(contract.endDate)}</td>
            <td class="elevator-items-cell">${itemsHtml}</td>
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

init()
