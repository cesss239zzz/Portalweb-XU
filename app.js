/* ==========================================================================
   SaveWave - Portal Administrativo - app.js (Cascarón Estructural Vacío)
   ========================================================================== */

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
