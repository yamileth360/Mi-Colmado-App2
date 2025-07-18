// scripts/main.js

// ** Variables para el menú lateral (sidebar) y sus botones de toggle **
const sidebar = document.getElementById('sidebar');
const navMenuLinks = document.querySelectorAll('.sidebar-nav .nav-link'); // Enlaces del menú lateral
const toggleSidebarBtn = document.getElementById('toggle-sidebar-btn'); // Botón de toggle DENTRO del sidebar-header (para escritorio)
const mobileMenuToggle = document.getElementById('mobile-menu-toggle'); // Botón de toggle en el MAIN HEADER (para móviles)

const appWrapper = document.querySelector('.app-wrapper'); // Contenedor principal de la aplicación


// ** Función para mostrar una sección y ocultar las demás **
const showSection = (sectionId) => {
    console.group(`Navegando a la sección: ${sectionId}`);
    
    // Desactiva todas las secciones
    const sections = document.querySelectorAll('.app-section');
    sections.forEach(section => {
        if (section.classList.contains('active')) {
            section.classList.remove('active');
            console.debug(`Sección ${section.id} desactivada.`);
        }
    });

    // Activa la sección deseada
    const activeSection = document.getElementById(sectionId);
    if (activeSection) {
        activeSection.classList.add('active');
        console.log(`Sección ${sectionId} activada.`);
    } else {
        console.warn(`Advertencia: La sección con ID '${sectionId}' no se encontró.`);
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
    if (window.innerWidth <= 768 && sidebar.classList.contains('active-mobile')) {
        sidebar.classList.remove('active-mobile');
        // Opcional: Si usas un overlay de fondo oscuro para el sidebar móvil:
        // document.body.classList.remove('overlay-active'); 
        console.debug("Sidebar móvil cerrado automáticamente al seleccionar sección.");
    }
    
    // ** Lógica para cargar/actualizar datos específicos de cada sección al mostrarla **
    // Es crucial que estas funciones existan en sus respectivos scripts y que esos scripts
    // se carguen ANTES de main.js en index.html.
    
    if (sectionId === 'venta-seccion') {
        if (typeof actualizarCarritoUI !== 'undefined') {
            console.info("Actualizando UI del carrito para la sección de POS.");
            actualizarCarritoUI(); // Asegura que el carrito se reinicie o muestre su estado actual
        } else {
            console.error("Error: Función 'actualizarCarritoUI' no definida en pos.js.");
        }
    }
    
    if (sectionId === 'recepcion-mercancia-seccion') {
        if (typeof cargarHistorialRecepciones !== 'undefined') {
            console.info("Cargando historial de recepciones.");
            cargarHistorialRecepciones(); // Carga las últimas recepciones
        } else {
            console.error("Error: Función 'cargarHistorialRecepciones' no definida en reception.js.");
        }
    }
    // Para Inventario, Clientes, Reportes: sus listeners de onSnapshot ya
    // se encargan de la actualización en tiempo real automáticamente,
    // así que no necesitan una llamada explícita aquí.

    console.groupEnd();
};

// ** Event listener para el botón de ocultar/mostrar sidebar (dentro del sidebar) **
if (toggleSidebarBtn && sidebar && appWrapper) {
    toggleSidebarBtn.addEventListener('click', () => {
        if (window.innerWidth <= 768) { // Si es móvil, este botón no debería verse (CSS lo oculta)
            sidebar.classList.toggle('active-mobile'); // Pero si por alguna razón se viera y se clicara
            console.log("Toggle de sidebar móvil clicado (desde el sidebar).");
        } else { // Lógica para escritorio (colapsar/expandir a iconos)
            sidebar.classList.toggle('collapsed');
            appWrapper.classList.toggle('sidebar-collapsed'); // Toggle la clase en el contenedor principal
            console.log("Toggle de sidebar de escritorio clicado. Sidebar colapsado:", sidebar.classList.contains('collapsed'));
        }
    });
} else {
    console.warn("Botón de toggle de sidebar (dentro del sidebar) o elementos relacionados no encontrados.");
}

// ** Event listener para el botón de menú móvil (en el main-header) **
if (mobileMenuToggle && sidebar) {
    mobileMenuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('active-mobile');
        // Opcional: document.body.classList.toggle('overlay-active'); // Si usas overlay
        console.log("Toggle de menú móvil clicado (desde el header).");
    });
} else {
    console.warn("Botón de menú móvil (en el header) o sidebar no encontrados. Verifica los IDs en index.html.");
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
// Nota: 'modalEditarProducto', 'modalEditarCliente', 'modalFactura' son variables globales
// definidas en otros scripts. Es crucial que esos scripts se carguen ANTES que main.js.
window.addEventListener('click', (event) => {
    // Cierra el modal de edición de producto si se hace clic fuera
    if (typeof modalEditarProducto !== 'undefined' && event.target === modalEditarProducto) {
        modalEditarProducto.style.display = 'none';
        console.debug("Modal de edición de producto cerrado (clic fuera).");
    }
    // Cierra el modal de edición de cliente si se hace clic fuera
    if (typeof modalEditarCliente !== 'undefined' && event.target === modalEditarCliente) {
        modalEditarCliente.style.display = 'none';
        console.debug("Modal de edición de cliente cerrado (clic fuera).");
    }
    // Cierra el modal de factura si se hace clic fuera
    if (typeof modalFactura !== 'undefined' && event.target === modalFactura) {
        modalFactura.style.display = 'none';
        console.debug("Modal de factura cerrado (clic fuera).");
    }
    
    // Cierra el sidebar móvil si está abierto y se hace clic fuera de él o de sus botones de toggle
    // Aseguramos que 'sidebar' y 'toggleSidebarBtn' existan antes de usarlos
    if (window.innerWidth <= 768 && sidebar && sidebar.classList.contains('active-mobile') &&
        !sidebar.contains(event.target) && event.target !== toggleSidebarBtn && event.target !== mobileMenuToggle) { 
        
        sidebar.classList.remove('active-mobile');
        // Opcional: document.body.classList.remove('overlay-active');
        console.debug("Sidebar móvil cerrado (clic fuera o fuera de los botones de toggle).");
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
        console.log("Formulario 'Añadir Nuevo Producto' mostrado.");
    });

    btnCancelAddProduct.addEventListener('click', () => {
        addProductFormContainer.classList.remove('active'); // Oculta el formulario
        btnShowAddProductForm.style.display = 'block'; // Muestra el botón
        // Opcional: Llamar a la función de reset del formulario si existe en inventory.js
        const formAgregarProducto = document.getElementById('form-agregar-producto');
        if (formAgregarProducto && typeof formAgregarProducto.reset === 'function') {
            formAgregarProducto.reset();
        }
        console.log("Formulario 'Añadir Nuevo Producto' ocultado.");
    });
} else {
    console.warn("Elementos del formulario de añadir producto no encontrados. Verifica los IDs en index.html.");
}


// ** Lógica para manejar el botón "Añadir Nuevo Cliente" en la sección de Clientes **
const btnShowAddClientForm = document.getElementById('btn-show-add-client-form');
const addClientFormContainer = document.getElementById('add-client-form-container');
const btnCancelAddClient = document.getElementById('btn-cancel-add-client');

if (btnShowAddClientForm && addClientFormContainer && btnCancelAddClient) {
    btnShowAddClientForm.addEventListener('click', () => {
        addClientFormContainer.classList.add('active'); // Muestra el formulario
        btnShowAddClientForm.style.display = 'none'; // Oculta el botón
        console.log("Formulario 'Añadir Nuevo Cliente' mostrado.");
    });

    btnCancelAddClient.addEventListener('click', () => {
        addClientFormContainer.classList.remove('active'); // Oculta el formulario
        btnShowAddClientForm.style.display = 'block'; // Muestra el botón
        // Opcional: Llamar a la función de reset del formulario si existe
        const formAgregarCliente = document.getElementById('form-agregar-cliente');
        if (formAgregarCliente && typeof formAgregarCliente.reset === 'function') {
            formAgregarCliente.reset();
        }
        console.log("Formulario 'Añadir Nuevo Cliente' ocultado.");
    });
} else {
    console.warn("Elementos del formulario de añadir cliente no encontrados. Verifica los IDs en index.html.");
}


// ** Mostrar la sección de "Inicio" por defecto al cargar completamente la página **
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM completamente cargado. Inicializando aplicación.");
    showSection('home');
});