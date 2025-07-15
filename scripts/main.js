// scripts/main.js

// ** Variables para el menú lateral (sidebar) y su botón de toggle **
const sidebar = document.getElementById('sidebar');
const navMenuLinks = document.querySelectorAll('.sidebar-nav .nav-link'); // Enlaces del menú lateral
const toggleSidebarBtn = document.getElementById('toggle-sidebar-btn'); // Botón de toggle en el header principal

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
        // Si usas un overlay de fondo, aquí lo quitarías:
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

// ** Event listener para mostrar/ocultar el sidebar **
if (toggleSidebarBtn && sidebar) {
    toggleSidebarBtn.addEventListener('click', () => {
        if (window.innerWidth <= 768) { // Lógica para móviles
            sidebar.classList.toggle('active-mobile');
            // Si quieres un overlay oscuro detrás del sidebar en móvil, añade una clase al body:
            // document.body.classList.toggle('overlay-active');
            console.log("Toggle de sidebar móvil clicado.");
        } else { // Lógica para escritorio (colapsar/expandir)
            sidebar.classList.toggle('collapsed');
            // Asegúrate de que el app-wrapper también tenga la clase para ajustar el contenido
            document.querySelector('.app-wrapper').classList.toggle('sidebar-collapsed');
            console.log("Toggle de sidebar de escritorio clicado. Sidebar colapsado:", sidebar.classList.contains('collapsed'));
        }
    });
} else {
    console.warn("Botón de toggle de sidebar o elementos relacionados no encontrados. Verifica los IDs en index.html.");
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
    
    // Cierra el sidebar móvil si está abierto y se hace clic fuera de él o de su botón de toggle
    if (window.innerWidth <= 768 && sidebar.classList.contains('active-mobile') &&
        !sidebar.contains(event.target) && event.target !== toggleSidebarBtn) {
        
        sidebar.classList.remove('active-mobile');
        // Si usas un overlay de fondo, aquí lo quitarías:
        // document.body.classList.remove('overlay-active');
        console.debug("Sidebar móvil cerrado (clic fuera o fuera del botón de toggle).");
    }
});


// ** Lógica para manejar el botón "Añadir Nuevo Producto" en la sección de Inventario **
// Estos elementos DOM son específicos de la sección de inventario,
// pero su lógica de mostrar/ocultar el formulario puede estar aquí
// si se considera parte del control de la UI general.
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
        if (typeof document.getElementById('form-agregar-producto').reset === 'function') {
            document.getElementById('form-agregar-producto').reset();
        }
        console.log("Formulario 'Añadir Nuevo Producto' ocultado.");
    });
} else {
    console.warn("Elementos del formulario de añadir producto no encontrados. Verifica los IDs en index.html.");
}


// ** Mostrar la sección de "Inicio" por defecto al cargar completamente la página **
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM completamente cargado. Inicializando aplicación.");
    showSection('home');
});