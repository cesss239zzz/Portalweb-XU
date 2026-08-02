/* ==========================================================================
   SaveWave - Portal Administrativo - app.js
   ========================================================================== */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import {
    getFirestore,
    collection,
    addDoc,
    onSnapshot,
    query,
    orderBy,
    serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

/* --- Conexión a Firebase / Firestore --- */
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);
const sociosCol = collection(db, "socios");
const solicitudesCol = collection(db, "solicitudes");

/* --- Datos de ejemplo (solo se usan si se pulsa "Cargar Datos de Ejemplo") --- */
function isoFecha(offsetDias = 0) {
    const d = new Date();
    d.setDate(d.getDate() + offsetDias);
    return d.toISOString().slice(0, 10);
}

const MOCK_LOANS = [
    { socio: 'María Fernanda López', monto: 45000, fecha: isoFecha(0), estado: 'Pendiente' },
    { socio: 'Carlos Alberto Mejía', monto: 120000, fecha: isoFecha(0), estado: 'Aprobado' },
    { socio: 'Ana Gabriela Rodríguez', monto: 30500, fecha: isoFecha(-1), estado: 'Aprobado' },
    { socio: 'José Manuel Cáceres', monto: 15000, fecha: isoFecha(-1), estado: 'Rechazado' },
    { socio: 'Rosa Elena Martínez', monto: 60000, fecha: isoFecha(0), estado: 'Pendiente' },
];

const MOCK_PARTNERS = [
    { nombre: 'María Fernanda López', cuenta: '0801-1990-01234', profesion: 'Docente', estado: 'Activo' },
    { nombre: 'Carlos Alberto Mejía', cuenta: '0801-1985-05678', profesion: 'Comerciante', estado: 'Activo' },
    { nombre: 'Ana Gabriela Rodríguez', cuenta: '0801-1992-09876', profesion: 'Enfermera', estado: 'Activo' },
    { nombre: 'José Manuel Cáceres', cuenta: '0801-1978-04321', profesion: 'Agricultor', estado: 'Inactivo' },
    { nombre: 'Rosa Elena Martínez', cuenta: '0801-1995-01122', profesion: 'Contadora', estado: 'Activo' },
    { nombre: 'Luis Fernando Zelaya', cuenta: '0801-1988-03344', profesion: 'Ingeniero Civil', estado: 'Activo' },
];

const NOMBRES_DEMO_NUEVA_SOLICITUD = [
    'Fernando Aguilar', 'Sofía Reyes', 'Gerardo Núñez', 'Patricia Villeda', 'Diego Ramírez'
];

// Estado en memoria: es solo una copia local de lo último recibido de Firestore
const state = {
    loans: [],
    partners: [],
};

/* --- Utilidades --- */
function formatearLempiras(monto) {
    const valor = Number(monto) || 0;
    return 'L. ' + valor.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatearFecha(fechaISO) {
    if (!fechaISO) return '—';
    const [y, m, d] = fechaISO.split('-');
    return `${d}/${m}/${y}`;
}

function claseBadge(estado) {
    switch (estado) {
        case 'Aprobado': return 'badge-approved';
        case 'Pendiente': return 'badge-pending';
        case 'Rechazado': return 'badge-rejected';
        default: return '';
    }
}

function generarReferencia() {
    const anio = new Date().getFullYear();
    const numero = Math.floor(1000 + Math.random() * 9000);
    return `SW-${anio}-${numero}`;
}

/* --- Toast de confirmación --- */
function mostrarToast(mensaje) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.setAttribute('role', 'status');
    toast.textContent = mensaje;
    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('toast-hide');
        setTimeout(() => toast.remove(), 300);
    }, 4500);
}

/* --- Indicadores de Carga --- */
function mostrarCargaKpis() {
    ['kpi-requests-val', 'kpi-approved-val', 'kpi-members-val'].forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = '<span class="loading-text"><span class="spinner" aria-hidden="true"></span>Cargando...</span>';
    });
}

function mostrarCargaTabla() {
    const tbody = document.querySelector('#loans-table tbody');
    if (tbody) {
        tbody.innerHTML = '<tr><td colspan="5" class="table-empty"><span class="loading-text"><span class="spinner" aria-hidden="true"></span>Cargando solicitudes...</span></td></tr>';
    }
}

function mostrarCargaDirectorio() {
    const grid = document.getElementById('partners-grid');
    if (grid) {
        grid.innerHTML = '<p class="empty-state"><span class="loading-text"><span class="spinner" aria-hidden="true"></span>Cargando socios...</span></p>';
    }
}

function mostrarErrorConexion() {
    const mensaje = 'No se pudo conectar con la base de datos. Revisa la configuración en firebase-config.js.';

    ['kpi-requests-val', 'kpi-approved-val', 'kpi-members-val'].forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.textContent = 'Error';
    });

    const tbody = document.querySelector('#loans-table tbody');
    if (tbody) tbody.innerHTML = `<tr><td colspan="5" class="table-empty">${mensaje}</td></tr>`;

    const grid = document.getElementById('partners-grid');
    if (grid) grid.innerHTML = `<p class="empty-state">${mensaje}</p>`;
}

/* --- Renderizado --- */
function renderKpis() {
    const hoy = isoFecha(0);
    const solicitudesHoy = state.loans.filter((l) => l.fecha === hoy).length;
    const montoAprobado = state.loans
        .filter((l) => l.estado === 'Aprobado')
        .reduce((suma, l) => suma + l.monto, 0);
    const sociosActivos = state.partners.filter((p) => p.estado === 'Activo').length;

    const elRequests = document.getElementById('kpi-requests-val');
    const elApproved = document.getElementById('kpi-approved-val');
    const elMembers = document.getElementById('kpi-members-val');

    if (elRequests) elRequests.textContent = state.loans.length ? String(solicitudesHoy) : 'Sin datos';
    if (elApproved) elApproved.textContent = state.loans.length ? formatearLempiras(montoAprobado) : 'Sin datos';
    if (elMembers) elMembers.textContent = state.partners.length ? String(sociosActivos) : 'Sin datos';
}

function renderTablaSolicitudes() {
    const tbody = document.querySelector('#loans-table tbody');
    if (!tbody) return;

    if (!state.loans.length) {
        tbody.innerHTML = '<tr><td colspan="5" class="table-empty">Aún no hay solicitudes registradas.</td></tr>';
        return;
    }

    tbody.innerHTML = state.loans.map((prestamo) => `
        <tr>
            <td>${prestamo.socio}</td>
            <td>${formatearLempiras(prestamo.monto)}</td>
            <td>${formatearFecha(prestamo.fecha)}</td>
            <td><span class="badge ${claseBadge(prestamo.estado)}">${prestamo.estado}</span></td>
            <td class="text-right">—</td>
        </tr>
    `).join('');
}

function listaSociosFiltrada() {
    const searchInput = document.getElementById('directory-search');
    const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
    if (!query) return state.partners;
    return state.partners.filter((p) =>
        (p.nombre || '').toLowerCase().includes(query) || (p.cuenta || '').toLowerCase().includes(query)
    );
}

function renderDirectorioSocios(listaSocios) {
    const grid = document.getElementById('partners-grid');
    const contador = document.getElementById('partners-count');
    if (!grid) return;

    if (!listaSocios.length) {
        grid.innerHTML = state.partners.length
            ? '<p class="empty-state">No se encontraron socios con ese criterio de búsqueda.</p>'
            : '<p class="empty-state">Aún no hay socios registrados. Usa "+ Crear Usuario" o "Cargar Datos de Ejemplo" en el Dashboard.</p>';
        if (contador) contador.textContent = 'Mostrando 0 socios';
        return;
    }

    grid.innerHTML = listaSocios.map((socio) => `
        <div class="card partner-card">
            <h4>${socio.nombre}</h4>
            <p class="text-muted">${socio.profesion}</p>
            <p class="text-muted">Cuenta: ${socio.cuenta}</p>
            <span class="badge ${socio.estado === 'Activo' ? 'badge-approved' : 'badge-rejected'}">${socio.estado}</span>
        </div>
    `).join('');

    if (contador) {
        contador.textContent = `Mostrando ${listaSocios.length} ${listaSocios.length === 1 ? 'socio' : 'socios'}`;
    }
}

/* --- Sincronización en tiempo real con Firestore --- */
let loansUnsubscribe = null;
let partnersUnsubscribe = null;

function iniciarSincronizacionDatos() {
    mostrarCargaKpis();
    mostrarCargaTabla();
    mostrarCargaDirectorio();

    const searchInput = document.getElementById('directory-search');
    if (searchInput) searchInput.disabled = true;

    if (loansUnsubscribe) loansUnsubscribe();
    if (partnersUnsubscribe) partnersUnsubscribe();

    const solicitudesQuery = query(solicitudesCol, orderBy('creadoEn', 'desc'));
    loansUnsubscribe = onSnapshot(solicitudesQuery, (snapshot) => {
        state.loans = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        renderKpis();
        renderTablaSolicitudes();
    }, (error) => {
        console.error('Error al sincronizar solicitudes:', error);
        mostrarErrorConexion();
    });

    const sociosQuery = query(sociosCol, orderBy('creadoEn', 'desc'));
    partnersUnsubscribe = onSnapshot(sociosQuery, (snapshot) => {
        state.partners = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        renderKpis();
        renderDirectorioSocios(listaSociosFiltrada());
        if (searchInput) searchInput.disabled = false;
    }, (error) => {
        console.error('Error al sincronizar socios:', error);
        mostrarErrorConexion();
    });
}

/* --- Buscador de Socios --- */
function filtrarSocios() {
    const clearBtn = document.getElementById('clear-search-btn');
    const searchInput = document.getElementById('directory-search');
    const query = searchInput ? searchInput.value.trim() : '';
    if (clearBtn) clearBtn.classList.toggle('hidden', query.length === 0);
    renderDirectorioSocios(listaSociosFiltrada());
}

function limpiarBusquedaSocios() {
    const searchInput = document.getElementById('directory-search');
    const clearBtn = document.getElementById('clear-search-btn');
    if (searchInput) {
        searchInput.value = '';
        searchInput.focus();
    }
    if (clearBtn) clearBtn.classList.add('hidden');
    renderDirectorioSocios(state.partners);
}

/* --- Registrar Nueva Solicitud --- */
async function registrarSolicitud() {
    const nombre = NOMBRES_DEMO_NUEVA_SOLICITUD[Math.floor(Math.random() * NOMBRES_DEMO_NUEVA_SOLICITUD.length)];
    const monto = Math.floor(Math.random() * 90000) + 10000;

    try {
        await addDoc(solicitudesCol, {
            socio: nombre,
            monto,
            fecha: isoFecha(0),
            estado: 'Pendiente',
            creadoEn: serverTimestamp(),
        });
        const referencia = generarReferencia();
        mostrarToast(`Solicitud registrada con éxito. N.º de referencia: ${referencia}`);
    } catch (err) {
        console.error('Error al registrar solicitud:', err);
        mostrarToast('No se pudo registrar la solicitud. Verifica tu configuración de Firebase.');
    }
}

/* --- Crear Usuario (Socio) --- */
async function crearSocio(datos) {
    await addDoc(sociosCol, {
        nombre: datos.nombre,
        cuenta: datos.cuenta,
        profesion: datos.profesion,
        usuario: datos.usuario,
        clave: datos.clave,
        estado: 'Activo',
        creadoEn: serverTimestamp(),
    });
}

/* --- Cargar Datos de Ejemplo (solo para pruebas/demo) --- */
async function cargarDatosEjemplo() {
    try {
        mostrarToast('Cargando datos de ejemplo...');
        const escrituras = [
            ...MOCK_LOANS.map((prestamo) => addDoc(solicitudesCol, { ...prestamo, creadoEn: serverTimestamp() })),
            ...MOCK_PARTNERS.map((socio) => addDoc(sociosCol, {
                ...socio,
                usuario: socio.nombre.split(' ')[0].toLowerCase(),
                clave: 'savewave123',
                creadoEn: serverTimestamp(),
            })),
        ];
        await Promise.all(escrituras);
        mostrarToast('Datos de ejemplo cargados con éxito.');
    } catch (err) {
        console.error('Error al cargar datos de ejemplo:', err);
        mostrarToast('No se pudieron cargar los datos de ejemplo. Verifica tu configuración de Firebase.');
    }
}

/* --- Inicialización --- */
document.addEventListener('DOMContentLoaded', () => {
    // Referencias a los elementos del DOM del Login y Layout Principal
    const loginForm = document.getElementById('login-form');
    const loginView = document.getElementById('login-view') || document.getElementById('login-container');
    const appLayout = document.getElementById('app-layout');

    // 1. LÓGICA DE INICIO DE SESIÓN (LOGIN)
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            // Prevenir el envío y recarga de página por defecto
            e.preventDefault();

            // Ocultar la sección del Login agregando la clase .hidden
            if (loginView) {
                loginView.classList.add('hidden');
            }

            // Mostrar el Layout principal de la SPA quitando la clase .hidden
            if (appLayout) {
                appLayout.classList.remove('hidden');
            }

            // Iniciar por defecto en la vista del Dashboard
            cambiarVista('dashboard');

            // Conectar con Firestore y sincronizar los datos en tiempo real
            iniciarSincronizacionDatos();
        });
    }

    // 2. CONFIGURACIÓN DE FECHA REAL EN EL TOPBAR
    const dateEl = document.getElementById('topbar-date');
    if (dateEl) {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        let dateStr = new Date().toLocaleDateString('es-ES', options);
        // Capitalizar la primera letra del día de la semana
        dateEl.textContent = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
    }

    // 3. NAVEGACIÓN DEL MENÚ LATERAL (SIDEBAR)
    document.querySelectorAll('.menu-item[data-view]').forEach((btn) => {
        btn.addEventListener('click', () => cambiarVista(btn.getAttribute('data-view')));
    });

    // 4. CERRAR SESIÓN
    const logoutBtn = document.getElementById('menu-btn-logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', cerrarSesion);
    }

    // 5. BUSCADOR DE SOCIOS (Directorio)
    const searchInput = document.getElementById('directory-search');
    const clearSearchBtn = document.getElementById('clear-search-btn');
    const searchIconBtn = document.getElementById('search-socios-btn');

    if (searchInput) {
        searchInput.addEventListener('input', filtrarSocios);
    }
    if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', limpiarBusquedaSocios);
    }
    if (searchIconBtn) {
        searchIconBtn.addEventListener('click', () => {
            filtrarSocios();
            if (searchInput) searchInput.focus();
        });
    }

    // 6. REGISTRAR NUEVA SOLICITUD DE PRÉSTAMO
    const btnAddLoan = document.getElementById('btn-simulate-add-loan');
    if (btnAddLoan) {
        btnAddLoan.addEventListener('click', registrarSolicitud);
    }

    // 7. CREAR USUARIO (SOCIO)
    const btnToggleCrearSocio = document.getElementById('btn-toggle-crear-socio');
    const panelCrearSocio = document.getElementById('crear-socio-panel');
    const formCrearSocio = document.getElementById('form-crear-socio');
    const btnCancelarCrearSocio = document.getElementById('btn-cancelar-crear-socio');
    const errorCrearSocio = document.getElementById('crear-socio-error');

    if (btnToggleCrearSocio && panelCrearSocio) {
        btnToggleCrearSocio.addEventListener('click', () => {
            panelCrearSocio.classList.toggle('hidden');
            if (!panelCrearSocio.classList.contains('hidden')) {
                document.getElementById('socio-nombre')?.focus();
            }
        });
    }

    if (btnCancelarCrearSocio && panelCrearSocio) {
        btnCancelarCrearSocio.addEventListener('click', () => {
            panelCrearSocio.classList.add('hidden');
            formCrearSocio?.reset();
            errorCrearSocio?.classList.add('hidden');
        });
    }

    if (formCrearSocio) {
        formCrearSocio.addEventListener('submit', async (e) => {
            e.preventDefault();

            const datos = {
                nombre: document.getElementById('socio-nombre').value.trim(),
                cuenta: document.getElementById('socio-cuenta').value.trim(),
                profesion: document.getElementById('socio-profesion').value.trim(),
                usuario: document.getElementById('socio-usuario').value.trim(),
                clave: document.getElementById('socio-clave').value.trim(),
            };

            if (!datos.nombre || !datos.cuenta || !datos.profesion || !datos.usuario || !datos.clave) {
                if (errorCrearSocio) {
                    errorCrearSocio.textContent = 'Completa todos los campos para crear el socio.';
                    errorCrearSocio.classList.remove('hidden');
                }
                return;
            }

            try {
                await crearSocio(datos);
                errorCrearSocio?.classList.add('hidden');
                formCrearSocio.reset();
                panelCrearSocio?.classList.add('hidden');
                mostrarToast(`Socio "${datos.nombre}" creado con éxito. Ya puede iniciar sesión en la app con el usuario "${datos.usuario}".`);
            } catch (err) {
                console.error('Error al crear socio:', err);
                if (errorCrearSocio) {
                    errorCrearSocio.textContent = 'No se pudo guardar el socio. Verifica tu configuración de Firebase (firebase-config.js).';
                    errorCrearSocio.classList.remove('hidden');
                }
            }
        });
    }

    // 8. CARGAR DATOS DE EJEMPLO (para pruebas/demo)
    const btnSeed = document.getElementById('btn-seed-data');
    if (btnSeed) {
        btnSeed.addEventListener('click', cargarDatosEjemplo);
    }
});

/**
 * Cambia la sección visible en el contenedor central de la SPA
 * @param {string} vistaId - El ID de la sección HTML correspondiente a la vista
 */
function cambiarVista(vistaId) {
    // 1. Ocultar todas las secciones que tengan la clase .vista (o .app-view)
    const vistas = document.querySelectorAll('.vista, .app-view');
    vistas.forEach(vista => {
        vista.classList.add('hidden');
    });

    // 2. Mostrar la vista seleccionada que coincida con el vistaId (o view-${vistaId})
    let vistaActiva = document.getElementById(vistaId);
    if (!vistaActiva) {
        vistaActiva = document.getElementById(`view-${vistaId}`);
    }

    if (vistaActiva) {
        vistaActiva.classList.remove('hidden');
    }

    // 3. Resaltar el botón activo en el menú de navegación lateral (Sidebar)
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
        const itemTarget = item.getAttribute('data-view');
        if (itemTarget === vistaId) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    // 4. Actualizar el título dinámico del Topbar en caso de existir
    const pageTitle = document.getElementById('page-title');
    if (pageTitle) {
        const titles = {
            'dashboard': 'Dashboard',
            'loans': 'Gestión de Préstamos',
            'directory': 'Directorio de Socios'
        };
        pageTitle.textContent = titles[vistaId] || vistaId.charAt(0).toUpperCase() + vistaId.slice(1);
    }
}

/**
 * Cierra la sesión activa regresando a la pantalla de login
 */
function cerrarSesion() {
    const loginView = document.getElementById('login-view') || document.getElementById('login-container');
    const appLayout = document.getElementById('app-layout');

    // Ocultar el panel del layout principal de la SPA
    if (appLayout) {
        appLayout.classList.add('hidden');
    }

    // Volver a mostrar el panel de inicio de sesión (Login)
    if (loginView) {
        loginView.classList.remove('hidden');
    }

    // Limpiar los inputs del formulario de login
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.reset();
    }
}

// Hacer las funciones accesibles globalmente para llamadas directas inline (ej: onclick o href)
window.cambiarVista = cambiarVista;
window.cerrarSesion = cerrarSesion;
