// scripts/main.js

// ** Variables para el menú lateral (sidebar) y sus botones de toggle **
const sidebar = document.getElementById('sidebar');
const navMenuLinks = document.querySelectorAll('.sidebar-nav .nav-link'); // Enlaces del menú lateral
const toggleSidebarBtn = document.getElementById('toggle-sidebar-btn'); // Botón de toggle DENTRO del sidebar-header (para escritorio)
const mobileMenuToggle = document.getElementById('mobile-menu-toggle'); // Botón de toggle en el MAIN HEADER (para móviles)

const appWrapper = document.querySelector('.app-wrapper'); // Contenedor principal de la aplicación


// ** Función para mostrar una sección y ocultar las demás **
const showSection = (sectionId) => {
    console.group(`DEBUG: Navegando a la sección: ${sectionId}`);
    
    // Desactiva todas las secciones
    const sections = document.querySelectorAll('.app-section');
    sections.forEach(section => {
        if (section.classList.contains('active')) {
            section.classList.remove('active');
            console.debug(`DEBUG: Sección ${section.id} desactivada.`);
        }
    });

    // Activa la sección deseada
    const activeSection = document.getElementById(sectionId);
    if (activeSection) {
        activeSection.classList.add('active');
        console.log(`DEBUG: Sección ${sectionId} activada.`);
    } else {
        console.warn(`DEBUG: Advertencia: La sección con ID '${sectionId}' no se encontró.`);
    }

    // Actualiza la clase 'active' en los enlaces de navegación lateral
    navMenuLinks.forEach(link => {
        if (link.dataset.section === sectionId) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });

    // Cierra el sidebar en dispositivos móviles después de seleccionar una opción
    if (window.innerWidth <= 768 && sidebar && sidebar.classList.contains('active-mobile')) {
        sidebar.classList.remove('active-mobile');
        // Opcional: Si usas un overlay de fondo oscuro para el sidebar móvil:
        // document.body.classList.remove('overlay-active'); 
        console.debug("DEBUG: Sidebar móvil cerrado automáticamente al seleccionar sección.");
    }
    
    // ** Lógica para cargar/actualizar datos específicos de cada sección al mostrarla **
    // Hacemos un chequeo con 'typeof window.functionName' para asegurarnos de que la función exista antes de llamarla
    
    if (sectionId === 'venta-seccion') {
        if (typeof window.actualizarCarritoUI !== 'undefined') {
            console.info("DEBUG: Actualizando UI del carrito para la sección de POS.");
            window.actualizarCarritoUI();
        } else {
            console.error("DEBUG: Error: Función 'actualizarCarritoUI' no definida en pos.js.");
        }
    }
    
    if (sectionId === 'recepcion-mercancia-seccion') {
        if (typeof window.cargarHistorialRecepciones !== 'undefined') {
            console.info("DEBUG: Cargando historial de recepciones.");
            window.cargarHistorialRecepciones();
        } else {
            console.error("DEBUG: Error: Función 'cargarHistorialRecepciones' no definida en reception.js.");
        }
    }
    
    if (sectionId === 'home') {
        if (typeof window.loadDashboardData !== 'undefined') {
            console.info("DEBUG: Cargando datos del dashboard.");
            window.loadDashboardData(); // Llamada a la función del dashboard
        } else {
            console.error("DEBUG: Error: Función 'loadDashboardData' no definida en dashboard.js.");
        }
    }

    console.groupEnd();
};

// ** Event listener para el botón de ocultar/mostrar sidebar (dentro del sidebar) **
if (toggleSidebarBtn && sidebar && appWrapper) {
    toggleSidebarBtn.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
            sidebar.classList.toggle('active-mobile');
            console.log("DEBUG: Toggle de sidebar móvil clicado (desde el sidebar).");
        } else {
            sidebar.classList.toggle('collapsed');
            appWrapper.classList.toggle('sidebar-collapsed');
            console.log("DEBUG: Toggle de sidebar de escritorio clicado. Sidebar colapsado:", sidebar.classList.contains('collapsed'));
        }
    });
} else {
    console.warn("DEBUG: Botón de toggle de sidebar (dentro del sidebar) o elementos relacionados no encontrados.");
}

// ** Event listener para el botón de menú móvil (en el main-header) **
if (mobileMenuToggle && sidebar) {
    mobileMenuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('active-mobile');
        console.log("DEBUG: Toggle de menú móvil clicado (desde el header).");
    });
} else {
    console.warn("DEBUG: Botón de menú móvil (en el header) o sidebar no encontrados. Verifica los IDs en index.html.");
}


// ** Event listeners para los enlaces del menú lateral **
navMenuLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault(); // Evita que el enlace recargue la página
        const sectionId = link.dataset.section; // Obtiene el ID de la sección del atributo data-section
        showSection(sectionId);
    });
});


// ** Lógica para cerrar modales y sidebar móvil al hacer clic fuera de ellos **
window.addEventListener('click', (event) => {
    if (typeof modalEditarProducto !== 'undefined' && event.target === modalEditarProducto) {
        modalEditarProducto.style.display = 'none';
        console.debug("DEBUG: Modal de edición de producto cerrado (clic fuera).");
    }
    if (typeof modalEditarCliente !== 'undefined' && event.target === modalEditarCliente) {
        modalEditarCliente.style.display = 'none';
        console.debug("DEBUG: Modal de edición de cliente cerrado (clic fuera).");
    }
    if (typeof modalFactura !== 'undefined' && event.target === modalFactura) {
        modalFactura.style.display = 'none';
        console.debug("DEBUG: Modal de factura cerrado (clic fuera).");
    }
    
    if (window.innerWidth <= 768 && sidebar && sidebar.classList.contains('active-mobile') &&
        !sidebar.contains(event.target) && event.target !== toggleSidebarBtn && event.target !== mobileMenuToggle) { 
        
        sidebar.classList.remove('active-mobile');
        console.debug("DEBUG: Sidebar móvil cerrado (clic fuera o fuera de los botones de toggle).");
    }
});


// ** Lógica para manejar el botón "Añadir Nuevo Producto" en la sección de Inventario **
const btnShowAddProductForm = document.getElementById('btn-show-add-product-form');
const addProductFormContainer = document.getElementById('add-product-form-container');
const btnCancelAddProduct = document.getElementById('btn-cancel-add-product');

if (btnShowAddProductForm && addProductFormContainer && btnCancelAddProduct) {
    btnShowAddProductForm.addEventListener('click', () => {
        addProductFormContainer.classList.add('active'); // Muestra el formulario
        btnShowAddProductForm.style.display = 'none'; // Oculta el botón
        console.log("DEBUG: Formulario 'Añadir Nuevo Producto' mostrado.");
    });

    btnCancelAddProduct.addEventListener('click', () => {
        addProductFormContainer.classList.remove('active'); // Oculta el formulario
        btnShowAddProductForm.style.display = 'block'; // Muestra el botón
        const formAgregarProducto = document.getElementById('form-agregar-producto');
        if (formAgregarProducto && typeof formAgregarProducto.reset === 'function') {
            formAgregarProducto.reset();
        }
        console.log("DEBUG: Formulario 'Añadir Nuevo Producto' ocultado.");
    });
} else {
    console.warn("DEBUG: Elementos del formulario de añadir producto no encontrados. Verifica los IDs en index.html.");
}


// ** Lógica para manejar el botón "Añadir Nuevo Cliente" en la sección de Clientes **
const btnShowAddClientForm = document.getElementById('btn-show-add-client-form');
const addClientFormContainer = document.getElementById('add-client-form-container');
const btnCancelAddClient = document.getElementById('btn-cancel-add-client');

if (btnShowAddClientForm && addClientFormContainer && btnCancelAddClient) {
    btnShowAddClientForm.addEventListener('click', () => {
        addClientFormContainer.classList.add('active'); // Muestra el formulario
        btnShowAddClientForm.style.display = 'none'; // Oculta el botón
        console.log("DEBUG: Formulario 'Añadir Nuevo Cliente' mostrado.");
    });

    btnCancelAddClient.addEventListener('click', () => {
        addClientFormContainer.classList.remove('active'); // Oculta el formulario
        btnShowAddClientForm.style.display = 'block'; // Muestra el botón
        const formAgregarCliente = document.getElementById('form-agregar-cliente');
        if (formAgregarCliente && typeof formAgregarCliente.reset === 'function') {
            formAgregarCliente.reset();
        }
        console.log("DEBUG: Formulario 'Añadir Nuevo Cliente' ocultado.");
    });
} else {
    console.warn("DEBUG: Elementos del formulario de añadir cliente no encontrados. Verifica los IDs en index.html.");
}

// ** Lógica para manejar el botón "Registrar Entrada de Productos" en Recepción **
const btnShowAddReceptionForm = document.getElementById('btn-show-add-reception-form');
const addReceptionFormContainer = document.getElementById('add-reception-form-container');
const btnCancelAddReception = document.getElementById('btn-cancel-add-reception');

if (btnShowAddReceptionForm && addReceptionFormContainer && btnCancelAddReception) {
    btnShowAddReceptionForm.addEventListener('click', () => {
        addReceptionFormContainer.classList.add('active'); // Muestra el formulario
        btnShowAddReceptionForm.style.display = 'none'; // Oculta el botón
        console.log("DEBUG: Formulario de recepción mostrado.");
    });

    btnCancelAddReception.addEventListener('click', () => {
        addReceptionFormContainer.classList.remove('active'); // Oculta el formulario
        btnShowAddReceptionForm.style.display = 'block'; // Muestra el botón
        const formRegistrarRecepcion = document.getElementById('form-registrar-recepcion');
        if (formRegistrarRecepcion && typeof formRegistrarRecepcion.reset === 'function') {
            formRegistrarRecepcion.reset();
        }
        console.log("DEBUG: Formulario de recepción ocultado.");
    });
} else {
    console.warn("DEBUG: Elementos del formulario de recepción no encontrados. Verifica los IDs en index.html.");
}


// ** Mostrar la sección de "Inicio" por defecto al cargar completamente la página **
document.addEventListener('DOMContentLoaded', () => {
    console.log("DEBUG: DOM completamente cargado. Inicializando aplicación.");
    showSection('home');
});