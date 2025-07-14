// scripts/main.js

// ** Variables para el menú desplegable **
const menuToggle = document.getElementById('menu-toggle');
const navMenu = document.getElementById('nav-menu');

// ** Función para mostrar una sección y ocultar las demás **
const showSection = (sectionId) => {
    // Oculta todas las secciones primero
    const sections = document.querySelectorAll('.app-section');
    sections.forEach(section => {
        section.classList.remove('active');
    });

    // Muestra la sección deseada
    const activeSection = document.getElementById(sectionId);
    if (activeSection) {
        activeSection.classList.add('active');
    }

    // Oculta el menú después de seleccionar una opción (en móviles o tablets)
    navMenu.classList.remove('active');

    // ** Lógica para cargar/actualizar datos específicos de cada sección al mostrarla **
    // Es importante llamar a estas funciones SOLO SI existen, ya que los scripts se cargan en orden.
    // Usamos 'typeof functionName !== 'undefined'' para verificar si la función está definida.

    if (sectionId === 'venta-seccion' && typeof actualizarCarritoUI !== 'undefined') {
        actualizarCarritoUI(); // Asegura que el carrito se reinicie o muestre su estado actual
    }
    if (sectionId === 'recepcion-mercancia-seccion' && typeof cargarHistorialRecepciones !== 'undefined') {
        cargarHistorialRecepciones(); // Carga las últimas recepciones
    }
    // Para las otras secciones (Inventario, Clientes, Reportes), sus listeners de onSnapshot
    // ya se encargan de la actualización en tiempo real automáticamente.
};

// ** Event listener para mostrar/ocultar el menú desplegable **
menuToggle.addEventListener('click', () => {
    navMenu.classList.toggle('active');
});

// ** Event listeners para los enlaces del menú (delegación de eventos) **
document.querySelectorAll('.nav-menu a').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault(); // Evita que el enlace recargue la página
        const sectionId = link.dataset.section; // Obtiene el ID de la sección del atributo data-section
        showSection(sectionId);
    });
});

// ** Lógica para cerrar modales y menú al hacer clic fuera de ellos **
// Nota: 'modalEditarProducto' y 'modalEditarCliente' son variables globales definidas en otros scripts.
// Es crucial que estos scripts se carguen ANTES que main.js para que estas variables existan.
window.addEventListener('click', (event) => {
    // Cierra el modal de edición de producto si se hace clic fuera
    if (typeof modalEditarProducto !== 'undefined' && event.target === modalEditarProducto) {
        modalEditarProducto.style.display = 'none';
    }
    // Cierra el modal de edición de cliente si se hace clic fuera
    if (typeof modalEditarCliente !== 'undefined' && event.target === modalEditarCliente) {
        modalEditarCliente.style.display = 'none';
    }
    
    // Cierra el menú desplegable si se hace clic fuera del menú y no en el botón de toggle
    if (navMenu.classList.contains('active') && !navMenu.contains(event.target) && event.target !== menuToggle) {
        navMenu.classList.remove('active');
    }
});

// ** Mostrar la sección de "Inicio" por defecto al cargar completamente la página **
document.addEventListener('DOMContentLoaded', () => {
    showSection('home');
});