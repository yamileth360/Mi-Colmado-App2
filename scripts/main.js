// scripts/main.js

// *** Elementos del DOM ***
const sidebar = document.getElementById('sidebar');
const navMenuLinks = document.querySelectorAll('.sidebar-nav .nav-link');
const toggleSidebarBtn = document.getElementById('toggle-sidebar-btn');
const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
const appWrapper = document.querySelector('.app-wrapper');

// Función para mostrar una sección y ocultar las demás
const showSection = (sectionId) => {
    console.group(`DEBUG: Navegando a la sección: ${sectionId}`);

    // Oculta todas las secciones activas
    const sections = document.querySelectorAll('.app-section');
    sections.forEach(section => {
        section.classList.remove('active');
    });

    // Activa la sección deseada
    const activeSection = document.getElementById(sectionId);
    if (activeSection) {
        activeSection.classList.add('active');
        console.log(`DEBUG: Sección ${sectionId} activada.`);
    }

    // Actualiza los enlaces de navegación
    navMenuLinks.forEach(link => {
        link.classList.toggle('active', link.dataset.section === sectionId);
    });

    // Cierra el sidebar móvil si está abierto
    if (window.innerWidth <= 768 && sidebar.classList.contains('active-mobile')) {
        sidebar.classList.remove('active-mobile');
    }

    // Carga datos específicos por sección
    switch (sectionId) {
        case 'venta-seccion':
            if (typeof window.actualizarCarritoUI === 'function') {
                window.actualizarCarritoUI();
            }
            break;
        case 'recepcion-mercancia-seccion':
            if (typeof window.cargarHistorialRecepciones === 'function') {
                window.cargarHistorialRecepciones();
            }
            break;
        case 'home':
            if (typeof window.loadDashboardData === 'function') {
                window.loadDashboardData(); // Filtro por defecto: hoy
            }
            break;
    }

    console.groupEnd();
};

// Sidebar toggle (escritorio y móvil)
if (toggleSidebarBtn) {
    toggleSidebarBtn.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
            sidebar.classList.toggle('active-mobile');
        } else {
            sidebar.classList.toggle('collapsed');
            appWrapper.classList.toggle('sidebar-collapsed');
        }
    });
}

if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('active-mobile');
    });
}

// Navegación entre secciones
navMenuLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const sectionId = link.dataset.section;
        showSection(sectionId);
    });
});

// Cierre de modales y sidebar al hacer clic fuera
window.addEventListener('click', (event) => {
    const modales = [
        window.modalEditarProducto,
        window.modalEditarCliente,
        window.modalFactura
    ];
    modales.forEach(modal => {
        if (modal && event.target === modal) {
            modal.style.display = 'none';
        }
    });

    if (
        window.innerWidth <= 768 &&
        sidebar.classList.contains('active-mobile') &&
        !sidebar.contains(event.target) &&
        event.target !== toggleSidebarBtn &&
        event.target !== mobileMenuToggle
    ) {
        sidebar.classList.remove('active-mobile');
    }
});

// Mostrar formulario "Añadir Producto"
const btnShowAddProductForm = document.getElementById('btn-show-add-product-form');
const addProductFormContainer = document.getElementById('add-product-form-container');
const btnCancelAddProduct = document.getElementById('btn-cancel-add-product');

if (btnShowAddProductForm && addProductFormContainer && btnCancelAddProduct) {
    btnShowAddProductForm.addEventListener('click', () => {
        addProductFormContainer.classList.add('active');
        btnShowAddProductForm.style.display = 'none';
    });

    btnCancelAddProduct.addEventListener('click', () => {
        addProductFormContainer.classList.remove('active');
        btnShowAddProductForm.style.display = 'block';
        const form = document.getElementById('form-agregar-producto');
        if (form) form.reset();
    });
}

// Mostrar formulario "Añadir Cliente"
const btnShowAddClientForm = document.getElementById('btn-show-add-client-form');
const addClientFormContainer = document.getElementById('add-client-form-container');
const btnCancelAddClient = document.getElementById('btn-cancel-add-client');

if (btnShowAddClientForm && addClientFormContainer && btnCancelAddClient) {
    btnShowAddClientForm.addEventListener('click', () => {
        addClientFormContainer.classList.add('active');
        btnShowAddClientForm.style.display = 'none';
    });

    btnCancelAddClient.addEventListener('click', () => {
        addClientFormContainer.classList.remove('active');
        btnShowAddClientForm.style.display = 'block';
        const form = document.getElementById('form-agregar-cliente');
        if (form) form.reset();
    });
}

// Mostrar formulario "Recepción de Productos"
const btnShowAddReceptionForm = document.getElementById('btn-show-add-reception-form');
const addReceptionFormContainer = document.getElementById('add-reception-form-container');
const btnCancelAddReception = document.getElementById('btn-cancel-add-reception');

if (btnShowAddReceptionForm && addReceptionFormContainer && btnCancelAddReception) {
    btnShowAddReceptionForm.addEventListener('click', () => {
        addReceptionFormContainer.classList.add('active');
        btnShowAddReceptionForm.style.display = 'none';
    });

    btnCancelAddReception.addEventListener('click', () => {
        addReceptionFormContainer.classList.remove('active');
        btnShowAddReceptionForm.style.display = 'block';
        const form = document.getElementById('form-registrar-recepcion');
        if (form) form.reset();
    });
}

// Inicializar: cargar sección home al iniciar la app
document.addEventListener('DOMContentLoaded', () => {
    showSection('home');
});
