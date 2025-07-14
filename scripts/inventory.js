// scripts/inventory.js

// ** Elementos del DOM (Interfaz) para Inventario **
const formAgregarProducto = document.getElementById('form-agregar-producto');
const nombreProductoInput = document.getElementById('nombre-producto');
const precioCompraInput = document.getElementById('precio-compra');
const precioVentaInput = document.getElementById('precio-venta');
const cantidadInput = document.getElementById('cantidad');
const stockMinimoInput = document.getElementById('stock-minimo');
const fechaVencimientoCheck = document.getElementById('fecha-vencimiento-check');
const fechaVencimientoDiv = document.getElementById('fecha-vencimiento-div');
const fechaVencimientoInput = document.getElementById('fecha-vencimiento');
const tablaProductosBody = document.querySelector('#tabla-productos tbody');

// ** Elementos del DOM del Modal de Edición de Producto **
const modalEditarProducto = document.getElementById('modal-editar-producto');
const closeModalProductoBtn = document.getElementById('close-modal-producto');
const formEditarProducto = document.getElementById('form-editar-producto');
const editProductoIdInput = document.getElementById('edit-producto-id');
const editNombreProductoInput = document.getElementById('edit-nombre-producto');
const editPrecioCompraInput = document.getElementById('edit-precio-compra');
const editPrecioVentaInput = document.getElementById('edit-precio-venta');
const editCantidadInput = document.getElementById('edit-cantidad');
const editStockMinimoInput = document.getElementById('edit-stock-minimo');
const editFechaVencimientoCheck = document.getElementById('edit-fecha-vencimiento-check');
const editFechaVencimientoDiv = document.getElementById('edit-fecha-vencimiento-div');
const editFechaVencimientoInput = document.getElementById('edit-fecha-vencimiento');


// ** Lógica para mostrar/ocultar el campo de fecha de vencimiento al agregar producto **
fechaVencimientoCheck.addEventListener('change', () => {
    if (fechaVencimientoCheck.checked) {
        fechaVencimientoDiv.style.display = 'block';
        fechaVencimientoInput.setAttribute('required', 'true');
    } else {
        fechaVencimientoDiv.style.display = 'none';
        fechaVencimientoInput.removeAttribute('required');
        fechaVencimientoInput.value = ''; // Limpiar el valor si se desactiva
    }
});

// ** Función para agregar un producto a Firestore **
formAgregarProducto.addEventListener('submit', async (e) => {
    e.preventDefault(); // Evita que la página se recargue

    const nombre = nombreProductoInput.value;
    const precioCompra = parseFloat(precioCompraInput.value);
    const precioVenta = parseFloat(precioVentaInput.value);
    const cantidad = parseInt(cantidadInput.value);
    const stockMinimo = parseInt(stockMinimoInput.value);
    const requiereFechaVencimiento = fechaVencimientoCheck.checked;
    const fechaVencimiento = requiereFechaVencimiento ? fechaVencimientoInput.value : null;

    if (!nombre || isNaN(precioCompra) || isNaN(precioVenta) || isNaN(cantidad) || isNaN(stockMinimo)) {
        alert("Por favor, rellena todos los campos numéricos y de texto correctamente.");
        return;
    }
    if (requiereFechaVencimiento && !fechaVencimiento) {
         alert("Por favor, ingresa la fecha de vencimiento.");
         return;
    }

    try {
        await db.collection('productos').add({
            nombre,
            precioCompra,
            precioVenta,
            cantidad,
            stockMinimo,
            requiereFechaVencimiento,
            fechaVencimiento, // Será null si no aplica
            fechaCreacion: firebase.firestore.FieldValue.serverTimestamp() // Para saber cuándo se añadió
        });

        alert('Producto agregado con éxito!');
        formAgregarProducto.reset(); // Limpiar el formulario
        fechaVencimientoDiv.style.display = 'none'; // Ocultar de nuevo
        fechaVencimientoInput.removeAttribute('required'); // Quitar required
    } catch (error) {
        console.error("Error al agregar el producto: ", error);
        alert("Hubo un error al agregar el producto. Consulta la consola para más detalles.");
    }
});

// ** Función para mostrar los productos en la tabla **
const mostrarProductos = (productos) => {
    tablaProductosBody.innerHTML = ''; // Limpiar la tabla antes de añadir nuevos datos
    if (productos.length === 0) {
        tablaProductosBody.innerHTML = '<tr><td colspan="5">No hay productos en inventario.</td></tr>';
        return;
    }

    productos.forEach(producto => {
        const fila = tablaProductosBody.insertRow();

        fila.insertCell(0).textContent = producto.nombre;
        fila.insertCell(1).textContent = producto.cantidad;
        fila.insertCell(2).textContent = `RD$ ${producto.precioVenta.toFixed(2)}`;
        
        // Formatear la fecha de vencimiento
        const fechaVencimientoTexto = producto.requiereFechaVencimiento && producto.fechaVencimiento
            ? new Date(producto.fechaVencimiento).toLocaleDateString('es-DO') // Formato local
            : 'N/A';
        fila.insertCell(3).textContent = fechaVencimientoTexto;

        const celdaAcciones = fila.insertCell(4);
        
        // Botón de Editar Producto
        const btnEditar = document.createElement('button');
        btnEditar.textContent = 'Editar';
        btnEditar.classList.add('btn-editar-producto');
        btnEditar.addEventListener('click', () => {
            abrirModalEditarProducto(producto.id, producto); // Pasa el ID y los datos del producto
        });
        celdaAcciones.appendChild(btnEditar);

        // Botón de eliminar existente
        const btnEliminar = document.createElement('button');
        btnEliminar.textContent = 'Eliminar';
        btnEliminar.classList.add('btn-eliminar');
        btnEliminar.addEventListener('click', async () => {
            if (confirm(`¿Estás seguro de que quieres eliminar ${producto.nombre}?`)) {
                try {
                    await db.collection('productos').doc(producto.id).delete();
                    alert('Producto eliminado.');
                } catch (error) {
                    console.error("Error al eliminar el producto: ", error);
                    alert("Hubo un error al eliminar el producto.");
                }
            }
        });
        celdaAcciones.appendChild(btnEliminar);

        // Resaltar productos con bajo stock
        if (producto.cantidad <= producto.stockMinimo) {
            fila.style.backgroundColor = '#ffe0b2'; // Naranja claro
        }
        // Resaltar productos próximos a vencer (ej: en los próximos 30 días)
        if (producto.requiereFechaVencimiento && producto.fechaVencimiento) {
            const hoy = new Date();
            const fechaVenc = new Date(producto.fechaVencimiento);
            const diasParaVencer = Math.ceil((fechaVenc - hoy) / (1000 * 60 * 60 * 24));
            if (diasParaVencer <= 30 && diasParaVencer > 0) {
                fila.style.backgroundColor = '#ffcdd2'; // Rojo claro
            } else if (diasParaVencer <= 0) {
                fila.style.backgroundColor = '#ef9a9a'; // Rojo más fuerte (vencido)
            }
        }
    });
};

// ** Escuchar cambios en la colección 'productos' de Firestore **
// Esto asegura que la tabla se actualice en tiempo real cada vez que un producto se agrega, edita o elimina
db.collection('productos').orderBy('nombre').onSnapshot((snapshot) => {
    const productos = [];
    snapshot.forEach(doc => {
        productos.push({ id: doc.id, ...doc.data() });
    });
    mostrarProductos(productos);
}, (error) => {
    console.error("Error al obtener los productos: ", error);
    alert("Error al cargar los productos. Consulta la consola.");
});


// --- Lógica para Edición de Productos (Funciones del Modal) ---

// ** Abrir modal de edición de producto **
const abrirModalEditarProducto = (productoId, productoData) => {
    editProductoIdInput.value = productoId;
    editNombreProductoInput.value = productoData.nombre;
    editPrecioCompraInput.value = productoData.precioCompra;
    editPrecioVentaInput.value = productoData.precioVenta;
    editCantidadInput.value = productoData.cantidad;
    editStockMinimoInput.value = productoData.stockMinimo;

    editFechaVencimientoCheck.checked = productoData.requiereFechaVencimiento;
    if (productoData.requiereFechaVencimiento && productoData.fechaVencimiento) {
        editFechaVencimientoDiv.style.display = 'block';
        editFechaVencimientoInput.setAttribute('required', 'true');
        editFechaVencimientoInput.value = productoData.fechaVencimiento;
    } else {
        editFechaVencimientoDiv.style.display = 'none';
        editFechaVencimientoInput.removeAttribute('required');
        editFechaVencimientoInput.value = '';
    }

    modalEditarProducto.style.display = 'block'; // Mostrar el modal
};

// ** Cerrar modal de edición de producto **
closeModalProductoBtn.addEventListener('click', () => {
    modalEditarProducto.style.display = 'none';
});

// Lógica para mostrar/ocultar el campo de fecha de vencimiento en el modal de edición
editFechaVencimientoCheck.addEventListener('change', () => {
    if (editFechaVencimientoCheck.checked) {
        editFechaVencimientoDiv.style.display = 'block';
        editFechaVencimientoInput.setAttribute('required', 'true');
    } else {
        editFechaVencimientoDiv.style.display = 'none';
        editFechaVencimientoInput.removeAttribute('required');
        editFechaVencimientoInput.value = '';
    }
});

// ** Guardar cambios del producto en Firestore **
formEditarProducto.addEventListener('submit', async (e) => {
    e.preventDefault();

    const productoId = editProductoIdInput.value;
    const nombre = editNombreProductoInput.value;
    const precioCompra = parseFloat(editPrecioCompraInput.value);
    const precioVenta = parseFloat(editPrecioVentaInput.value);
    const cantidad = parseInt(editCantidadInput.value);
    const stockMinimo = parseInt(editStockMinimoInput.value);
    const requiereFechaVencimiento = editFechaVencimientoCheck.checked;
    const fechaVencimiento = requiereFechaVencimiento ? editFechaVencimientoInput.value : null;

    if (!nombre || isNaN(precioCompra) || isNaN(precioVenta) || isNaN(cantidad) || isNaN(stockMinimo)) {
        alert("Por favor, rellena todos los campos numéricos y de texto correctamente.");
        return;
    }
    if (requiereFechaVencimiento && !fechaVencimiento) {
        alert("Por favor, ingresa la fecha de vencimiento.");
        return;
    }

    try {
        await db.collection('productos').doc(productoId).update({
            nombre,
            precioCompra,
            precioVenta,
            cantidad,
            stockMinimo,
            requiereFechaVencimiento,
            fechaVencimiento // Será null si no aplica
        });

        alert('Producto actualizado con éxito!');
        modalEditarProducto.style.display = 'none'; // Ocultar el modal
    } catch (error) {
        console.error("Error al actualizar el producto: ", error);
        alert("Hubo un error al actualizar el producto. Consulta la consola.");
    }
});