/* ==========================================================================
   SaveWave - Portal Administrativo - Lógica e Interactividad (Vanilla JS)
   ========================================================================== */

// Objeto de aplicación global para evitar polución y encapsular estado
const app = {
    // Estado de la aplicación
    state: {
        user: null,
        currentView: 'dashboard',
        kpis: {
            todayRequests: 28,
            approvedAmount: 245800.00,
            activeMembers: 3124
        }
    },

    // Inicialización del Portal
    init() {
        this.cacheDOM();
        this.bindEvents();
        this.updateDateTime();
        this.renderKPIs();
        
        // Enfocar el campo de usuario al iniciar
        if (this.dom.usernameInput) {
            this.dom.usernameInput.focus();
        }
    },

    // Cachear elementos del DOM frecuentemente utilizados
    cacheDOM() {
        this.dom = {
            loginContainer: document.getElementById('login-container'),
            appLayout: document.getElementById('app-layout'),
            loginForm: document.getElementById('login-form'),
            usernameInput: document.getElementById('username'),
            passwordInput: document.getElementById('password'),
            loginError: document.getElementById('login-error'),
            
            // Navegación
            menuButtons: document.querySelectorAll('.sidebar-menu .menu-item'),
            logoutButton: document.getElementById('menu-btn-logout'),
            pageTitle: document.getElementById('page-title'),
            topbarDate: document.getElementById('topbar-date'),
            views: document.querySelectorAll('.app-view'),
            
            // KPIs en Dashboard
            kpiRequests: document.querySelector('.kpi-card:nth-child(1) .kpi-value'),
            kpiApproved: document.querySelector('.kpi-card:nth-child(2) .kpi-value'),
            kpiMembers: document.querySelector('.kpi-card:nth-child(3) .kpi-value'),
            
            // Préstamos
            loansTableBody: document.querySelector('#loans-table tbody'),
            btnSimulateAddLoan: document.getElementById('btn-simulate-add-loan'),
            btnQuickNewLoan: document.getElementById('btn-quick-new-loan'),
            
            // Directorio
            directorySearch: document.getElementById('directory-search'),
            clearSearchBtn: document.getElementById('clear-search-btn'),
            partnersGrid: document.getElementById('partners-grid'),
            partnersCount: document.getElementById('partners-count'),
            partnerCards: document.querySelectorAll('.partner-card')
        };
    },

    // Vincular Eventos de Escucha (Listeners)
    bindEvents() {
        // Flujo de Login
        if (this.dom.loginForm) {
            this.dom.loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Navegación SPA
        this.dom.menuButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetView = button.getAttribute('data-view');
                if (targetView) {
                    this.navigateTo(targetView);
                }
            });
        });

        // Logout
        if (this.dom.logoutButton) {
            this.dom.logoutButton.addEventListener('click', () => this.handleLogout());
        }

        // Buscador de Socios
        if (this.dom.directorySearch) {
            this.dom.directorySearch.addEventListener('input', (e) => this.handleSearch(e));
        }

        if (this.dom.clearSearchBtn) {
            this.dom.clearSearchBtn.addEventListener('click', () => this.clearSearch());
        }

        // Acciones en la tabla de préstamos (Event Delegation)
        if (this.dom.loansTableBody) {
            this.dom.loansTableBody.addEventListener('click', (e) => this.handleTableActions(e));
        }

        // Simulación de nueva solicitud de préstamo
        if (this.dom.btnSimulateAddLoan) {
            this.dom.btnSimulateAddLoan.addEventListener('click', () => this.simulateNewLoanRequest());
        }
        if (this.dom.btnQuickNewLoan) {
            this.dom.btnQuickNewLoan.addEventListener('click', () => {
                this.navigateTo('loans');
                this.simulateNewLoanRequest();
            });
        }
    },

    // Actualizar fecha del sistema en tiempo real
    updateDateTime() {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const today = new Date();
        // Formatear fecha en Español
        let dateString = today.toLocaleDateString('es-ES', options);
        // Capitalizar primera letra de la fecha
        dateString = dateString.charAt(0).toUpperCase() + dateString.slice(1);
        
        if (this.dom.topbarDate) {
            this.dom.topbarDate.textContent = dateString;
        }
    },

    // Actualizar valores numéricos en las tarjetas de KPIs
    renderKPIs() {
        if (this.dom.kpiRequests) {
            this.dom.kpiRequests.textContent = this.state.kpis.todayRequests;
        }
        if (this.dom.kpiApproved) {
            this.dom.kpiApproved.textContent = new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD'
            }).format(this.state.kpis.approvedAmount);
        }
        if (this.dom.kpiMembers) {
            this.dom.kpiMembers.textContent = new Intl.NumberFormat('en-US').format(this.state.kpis.activeMembers);
        }
    },

    // Controlador del formulario de inicio de sesión
    handleLogin(event) {
        event.preventDefault();
        
        const username = this.dom.usernameInput.value.trim();
        const password = this.dom.passwordInput.value.trim();
        
        // Simulación de credenciales: Acepta "admin" con "admin" o "savewave123"
        if (username === 'admin' && (password === 'admin' || password === 'savewave123')) {
            this.state.user = {
                name: 'Admin SaveWave',
                role: 'Super Administrador'
            };
            
            // Transición Visual
            this.dom.loginError.classList.add('hidden');
            this.dom.loginContainer.classList.add('hidden');
            this.dom.appLayout.classList.remove('hidden');
            
            // Resetear inputs de contraseña por seguridad
            this.dom.passwordInput.value = '';
            
            // Navegar al Dashboard por defecto
            this.navigateTo('dashboard');
        } else {
            // Mostrar error con animación sutil
            this.dom.loginError.classList.remove('hidden');
            this.dom.loginError.style.animation = 'none';
            // Reflow para reiniciar animación
            void this.dom.loginError.offsetWidth;
            this.dom.loginError.style.animation = 'fadeIn 0.3s ease-in-out';
            
            this.dom.passwordInput.value = '';
            this.dom.passwordInput.focus();
        }
    },

    // Cerrar sesión
    handleLogout() {
        this.state.user = null;
        this.dom.appLayout.classList.add('hidden');
        this.dom.loginContainer.classList.remove('hidden');
        this.dom.usernameInput.value = '';
        this.dom.usernameInput.focus();
    },

    // Enrutamiento / Navegación SPA
    navigateTo(viewId) {
        this.state.currentView = viewId;
        
        // 1. Ocultar todas las secciones
        this.dom.views.forEach(view => {
            view.classList.add('hidden');
        });
        
        // 2. Mostrar la sección activa
        const activeView = document.getElementById(`view-${viewId}`);
        if (activeView) {
            activeView.classList.remove('hidden');
        }
        
        // 3. Actualizar menú lateral
        this.dom.menuButtons.forEach(btn => {
            if (btn.getAttribute('data-view') === viewId) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        // 4. Cambiar el título superior
        const titles = {
            dashboard: 'Dashboard',
            loans: 'Gestión de Préstamos',
            directory: 'Directorio de Socios'
        };
        if (this.dom.pageTitle) {
            this.dom.pageTitle.textContent = titles[viewId] || 'Panel SaveWave';
        }
    },

    // Filtrar socios en tiempo real en la vista de directorio
    handleSearch(event) {
        const query = event.target.value.toLowerCase().trim();
        let visibleCount = 0;

        // Mostrar / Ocultar botón de limpiar búsqueda
        if (query.length > 0) {
            this.dom.clearSearchBtn.classList.remove('hidden');
        } else {
            this.dom.clearSearchBtn.classList.add('hidden');
        }

        // Filtrar tarjetas
        this.dom.partnerCards.forEach(card => {
            const searchTerm = card.getAttribute('data-search-term') || '';
            if (searchTerm.includes(query)) {
                card.classList.remove('hidden');
                visibleCount++;
            } else {
                card.classList.add('hidden');
            }
        });

        // Actualizar contador
        if (this.dom.partnersCount) {
            this.dom.partnersCount.textContent = `Mostrando ${visibleCount} ${visibleCount === 1 ? 'socio' : 'socios'}`;
        }
    },

    // Limpiar el buscador del directorio
    clearSearch() {
        if (this.dom.directorySearch) {
            this.dom.directorySearch.value = '';
            this.dom.clearSearchBtn.classList.add('hidden');
            
            // Volver a mostrar todos los socios
            this.dom.partnerCards.forEach(card => {
                card.classList.remove('hidden');
            });
            
            if (this.dom.partnersCount) {
                this.dom.partnersCount.textContent = `Mostrando ${this.dom.partnerCards.length} socios`;
            }
            this.dom.directorySearch.focus();
        }
    },

    // Aprobar / Rechazar Préstamos
    handleTableActions(event) {
        const target = event.target;
        
        // Verificar si es un botón de aprobar
        if (target.classList.contains('btn-approve')) {
            const tr = target.closest('tr');
            this.updateLoanStatus(tr, 'approved');
        }
        
        // Verificar si es un botón de rechazar
        if (target.classList.contains('btn-reject')) {
            const tr = target.closest('tr');
            this.updateLoanStatus(tr, 'rejected');
        }
    },

    // Actualizar estado de una fila de préstamo y ajustar KPIs en tiempo real
    updateLoanStatus(rowElement, status) {
        const statusCell = rowElement.querySelector('td:nth-child(4)');
        const actionsCell = rowElement.querySelector('.actions-cell');
        const amountText = rowElement.querySelector('td:nth-child(2)').textContent;
        const amountVal = parseFloat(amountText.replace(/[$,]/g, ''));
        
        if (status === 'approved') {
            statusCell.innerHTML = '<span class="status-badge status-approved">Aprobado</span>';
            actionsCell.innerHTML = '<span class="action-done text-muted">Aprobada</span>';
            
            // Incrementar métricas en Dashboard
            this.state.kpis.approvedAmount += amountVal;
            this.state.kpis.activeMembers += 1; // Ficticiamente se convierte en socio activo pleno
            if (this.state.kpis.todayRequests > 0) this.state.kpis.todayRequests -= 1;
            
        } else if (status === 'rejected') {
            statusCell.innerHTML = '<span class="status-badge status-rejected">Rechazado</span>';
            actionsCell.innerHTML = '<span class="action-done text-muted">Rechazada</span>';
            
            // Ajustar métricas
            if (this.state.kpis.todayRequests > 0) this.state.kpis.todayRequests -= 1;
        }
        
        // Renderizar nuevamente los contadores
        this.renderKPIs();
        this.addNotification(`Solicitud de préstamo por ${amountText} ha sido ${status === 'approved' ? 'aprobada' : 'rechazada'}.`);
    },

    // Simular el registro de un nuevo préstamo (Ficticio para pruebas)
    simulateNewLoanRequest() {
        const randomNames = [
            'Laura Bermúdez', 'Julián Castro', 'Mariana Esparza', 
            'Esteban Villalobos', 'Gabriela Solano', 'Daniel Duarte'
        ];
        const initials = {
            'Laura Bermúdez': 'LB', 'Julián Castro': 'JC', 'Mariana Esparza': 'ME',
            'Esteban Villalobos': 'EV', 'Gabriela Solano': 'GS', 'Daniel Duarte': 'DD'
        };
        const randomAmounts = [5000, 12000, 30000, 65000, 9500, 40000];
        
        const name = randomNames[Math.floor(Math.random() * randomNames.length)];
        const amount = randomAmounts[Math.floor(Math.random() * randomAmounts.length)];
        
        const today = new Date();
        const dateString = today.toISOString().split('T')[0];
        
        const avatarInitials = initials[name] || 'S';
        const amountFormatted = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);

        // Crear fila HTML
        const newRow = document.createElement('tr');
        newRow.style.animation = 'fadeIn 0.5s ease-out forwards';
        newRow.innerHTML = `
            <td>
                <div class="table-member">
                    <div class="avatar-small" style="background-color: var(--accent-secondary); color: #000;">${avatarInitials}</div>
                    <span>${name}</span>
                </div>
            </td>
            <td class="font-semibold">${amountFormatted}</td>
            <td>${dateString}</td>
            <td><span class="status-badge status-pending">Pendiente</span></td>
            <td class="text-right actions-cell">
                <button class="btn btn-icon-only btn-approve" title="Aprobar">✓</button>
                <button class="btn btn-icon-only btn-reject" title="Rechazar">✗</button>
            </td>
        `;

        // Insertar al inicio de la tabla
        if (this.dom.loansTableBody) {
            this.dom.loansTableBody.insertBefore(newRow, this.dom.loansTableBody.firstChild);
        }

        // Actualizar KPIs de Solicitudes Hoy
        this.state.kpis.todayRequests += 1;
        this.renderKPIs();

        // Notificación en panel lateral
        this.addNotification(`Nueva solicitud registrada: <strong>${name}</strong> por ${amountFormatted}`);
        
        // Feedback visual
        const header = document.querySelector('.view-header-action h3');
        if (header) {
            header.style.color = 'var(--accent-primary)';
            setTimeout(() => {
                header.style.color = 'var(--text-main)';
            }, 1000);
        }
    },

    // Agregar logs de notificaciones ficticias en el Dashboard
    addNotification(text) {
        const feed = document.querySelector('.notification-feed');
        if (feed) {
            const item = document.createElement('div');
            item.className = 'feed-item';
            item.style.animation = 'fadeIn 0.3s ease-out forwards';
            item.innerHTML = `
                <span class="feed-dot active"></span>
                <span class="feed-text">${text}</span>
            `;
            
            // Insertar después del título (h4)
            const h4 = feed.querySelector('h4');
            if (h4 && h4.nextSibling) {
                feed.insertBefore(item, h4.nextSibling);
            } else {
                feed.appendChild(item);
            }

            // Mantener solo los últimos 4 logs
            const items = feed.querySelectorAll('.feed-item');
            if (items.length > 4) {
                items[items.length - 1].remove();
            }
        }
    }
};

// Arrancar la aplicación al cargar el DOM
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
