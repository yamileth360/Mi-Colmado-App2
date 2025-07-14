// scripts/pos.js

// ** Elementos del DOM del POS **
const buscarProductoPosInput = document.getElementById('buscar-producto-pos');
const sugerenciasPosUl = document.getElementById('sugerencias-pos');
const tablaCarritoBody = document.querySelector('#tabla-carrito tbody');
const totalVentaSpan = document.getElementById('total-venta');
const btnRegistrarVenta = document.getElementById('btn-registrar-venta');

let carrito = []; // Array para almacenar los productos en el carrito

// ** Lógica de Búsqueda y Sugerencias de Productos (para POS) **
buscarProductoPosInput.addEventListener('input', async () => {
    const textoBusqueda = buscarProductoPosInput.value.toLowerCase();
    sugerenciasPosUl.innerHTML = ''; // Limpiar sugerencias anteriores

    if (textoBusqueda.length > 0) {
        try {
            // Obtenemos una vez todos los productos para buscar en ellos
            const snapshot = await db.collection('productos').orderBy('nombre').get();
            const todosLosProductos = [];
            snapshot.forEach(doc => {
                todosLosProductos.push({ id: doc.id, ...doc.data() });
            });

            const productosFiltrados = todosLosProductos.filter(prod => 
                prod.nombre.toLowerCase().includes(textoBusqueda)
            );

            productosFiltrados.forEach(producto => {
                const li = document.createElement('li');
                li.textContent = `${producto.nombre} (RD$ ${producto.precioVenta.toFixed(2)}) - Stock: ${producto.cantidad}`;
                li.addEventListener('click', () => {
                    agregarProductoAlCarrito(producto);
                    buscarProductoPosInput.value = ''; // Limpiar input
                    sugerenciasPosUl.innerHTML = ''; // Limpiar sugerencias
                });
                sugerenciasPosUl.appendChild(li);
            });
        } catch (error) {
            console.error("Error buscando productos para POS:", error);
        }
    }
});

// ** Función para agregar producto al carrito **
const agregarProductoAlCarrito = (productoSeleccionado) => {
    // Verificar si el producto ya está en el carrito
    const productoExistente = carrito.find(item => item.id === productoSeleccionado.id);

    if (productoExistente) {
        // Si existe, solo incrementamos la cantidad, siempre que haya stock
        if (productoExistente.cantidadEnCarrito < productoSeleccionado.cantidad) {
            productoExistente.cantidadEnCarrito++;
        } else {
            alert(`No hay suficiente stock de ${productoSeleccionado.nombre}.`);
            return;
        }
    } else {
        // Si no existe, lo añadimos al carrito con cantidad 1
        if (productoSeleccionado.cantidad > 0) { // Asegurarse de que haya stock
            carrito.push({ ...productoSeleccionado, cantidadEnCarrito: 1 });
        } else {
            alert(`El producto ${productoSeleccionado.nombre} está agotado.`);
            return;
        }
    }
    actualizarCarritoUI();
};

// ** Función para actualizar la tabla del carrito y el total **
const actualizarCarritoUI = () => {
    tablaCarritoBody.innerHTML = ''; // Limpiar la tabla

    if (carrito.length === 0) {
        tablaCarritoBody.innerHTML = '<tr><td colspan="5">No hay productos en el carrito.</td></tr>';
        totalVentaSpan.textContent = 'RD$ 0.00';
        return;
    }

    let totalGeneral = 0;

    carrito.forEach(item => {
        const fila = tablaCarritoBody.insertRow();
        const subtotalItem = item.cantidadEnCarrito * item.precioVenta;
        totalGeneral += subtotalItem;

        fila.insertCell(0).textContent = item.nombre;
        fila.insertCell(1).textContent = item.cantidadEnCarrito;
        fila.insertCell(2).textContent = `RD$ ${item.precioVenta.toFixed(2)}`;
        fila.insertCell(3).textContent = `RD$ ${subtotalItem.toFixed(2)}`;

        const celdaAcciones = fila.insertCell(4);
        const btnQuitar = document.createElement('button');
        btnQuitar.textContent = 'Quitar';
        btnQuitar.classList.add('btn-quitar-carrito');
        btnQuitar.addEventListener('click', () => {
            quitarProductoDelCarrito(item.id);
        });
        celdaAcciones.appendChild(btnQuitar);
    });

    totalVentaSpan.textContent = `RD$ ${totalGeneral.toFixed(2)}`;
};

// ** Función para quitar producto del carrito **
const quitarProductoDelCarrito = (productoId) => {
    carrito = carrito.filter(item => item.id !== productoId);
    actualizarCarritoUI();
};

// ** Función para registrar la venta en Firestore y actualizar inventario **
btnRegistrarVenta.addEventListener('click', async () => {
    if (carrito.length === 0) {
        alert('El carrito está vacío. Agrega productos para registrar una venta.');
        return;
    }

    if (confirm('¿Confirmar venta y actualizar inventario?')) {
        try {
            const batch = db.batch(); // Usamos un batch para operaciones atómicas

            // 1. Actualizar el stock de cada producto en Firebase
            for (const item of carrito) {
                const productoRef = db.collection('productos').doc(item.id);
                // Aseguramos que la cantidad en stock sea suficiente antes de restar
                batch.update(productoRef, { cantidad: firebase.firestore.FieldValue.increment(-item.cantidadEnCarrito) });
            }

            // 2. Registrar la venta en una nueva colección 'ventas'
            const nuevaVentaRef = db.collection('ventas').doc(); // Firestore genera un ID automático
            batch.set(nuevaVentaRef, {
                fecha: firebase.firestore.FieldValue.serverTimestamp(),
                productosVendidos: carrito.map(item => ({
                    id: item.id,
                    nombre: item.nombre,
                    cantidad: item.cantidadEnCarrito,
                    precioUnitario: item.precioVenta,
                    subtotal: item.cantidadEnCarrito * item.precioVenta
                })),
                totalVenta: parseFloat(totalVentaSpan.textContent.replace('RD$ ', '')),
                // Puedes añadir más campos aquí: cliente, método de pago, etc.
            });

            await batch.commit(); // Ejecutar todas las operaciones

            alert('Venta registrada con éxito y inventario actualizado!');
            carrito = []; // Limpiar el carrito
            actualizarCarritoUI(); // Actualizar la UI del carrito

            // Opcional: Mostrar un ticket de venta simple
            // alert("Simulando impresión de ticket...");

        } catch (error) {
            console.error("Error al registrar la venta:", error);
            alert("Hubo un error al registrar la venta. Por favor, revisa la consola.");
        }
    }
});

// Asegurarse de que el carrito se inicialice al cargar la página
// Nota: Esta llamada se manejará mejor desde main.js al mostrar la sección de POS
// pero la mantenemos aquí para que la función exista si se llama directamente.
// actualizarCarritoUI();