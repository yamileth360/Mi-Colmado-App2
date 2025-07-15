// scripts/reception.js

// ** Elementos del DOM de Recepción de Mercancía **
const buscarProductoRecepcionInput = document.getElementById('buscar-producto-recepcion');
const sugerenciasRecepcionUl = document.getElementById('sugerencias-recepcion');
const cantidadRecibidaInput = document.getElementById('cantidad-recibida');
const productoIdRecepcionInput = document.getElementById('producto-id-recepcion'); // Hidden input para el ID del producto
const productoSeleccionadoRecepcionSpan = document.getElementById('producto-seleccionado-recepcion');
const nuevoPrecioCompraInput = document.getElementById('nuevo-precio-compra'); // Nuevo input para precio compra
const nuevoPrecioVentaInput = document.getElementById('nuevo-precio-venta'); // Nuevo input para precio venta
const btnRegistrarRecepcion = document.getElementById('btn-registrar-recepcion');
const tablaRecepcionesBody = document.querySelector('#tabla-recepciones tbody');

let productoSeleccionadoParaRecepcion = null; // Para almacenar el objeto completo del producto seleccionado

// ** Lógica de Búsqueda y Sugerencias de Productos (para Recepción) **
buscarProductoRecepcionInput.addEventListener('input', async () => {
    const textoBusqueda = buscarProductoRecepcionInput.value.toLowerCase();
    console.debug(`Buscando productos para recepción: '${textoBusqueda}'`);
    sugerenciasRecepcionUl.innerHTML = ''; // Limpiar sugerencias anteriores
    productoSeleccionadoParaRecepcion = null; // Resetear selección
    productoIdRecepcionInput.value = '';
    productoSeleccionadoRecepcionSpan.textContent = '';
    nuevoPrecioCompraInput.value = ''; // Limpiar precios al cambiar búsqueda
    nuevoPrecioVentaInput.value = ''; // Limpiar precios al cambiar búsqueda

    if (textoBusqueda.length > 0) {
        try {
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
                li.textContent = `${producto.nombre} (Stock actual: ${producto.cantidad})`;
                li.addEventListener('click', () => {
                    productoSeleccionadoParaRecepcion = producto;
                    productoIdRecepcionInput.value = producto.id;
                    productoSeleccionadoRecepcionSpan.textContent = `Producto seleccionado: ${producto.nombre}`;
                    buscarProductoRecepcionInput.value = producto.nombre; // Llenar el input con el nombre
                    sugerenciasRecepcionUl.innerHTML = ''; // Limpiar sugerencias

                    // Rellenar los campos de precio con los valores actuales del producto
                    nuevoPrecioCompraInput.value = producto.precioCompra.toFixed(2);
                    nuevoPrecioVentaInput.value = producto.precioVenta.toFixed(2);
                });
                sugerenciasRecepcionUl.appendChild(li);
            });
        } catch (error) {
            console.error("Error buscando productos para recepción:", error);
        }
    }
});

// ** Lógica para registrar la recepción de mercancía **
btnRegistrarRecepcion.addEventListener('click', async () => {
    console.group("Intentando registrar recepción de mercancía...");
    if (!productoSeleccionadoParaRecepcion) {
        console.warn("No se seleccionó ningún producto para la recepción.");
        alert('Por favor, selecciona un producto para registrar la recepción.');
        console.groupEnd();
        return;
    }

    const cantidadRecibida = parseInt(cantidadRecibidaInput.value);
    // Obtener los nuevos precios (si están llenos, de lo contrario serán null)
    const nuevoPrecioCompra = nuevoPrecioCompraInput.value !== '' ? parseFloat(nuevoPrecioCompraInput.value) : null;
    const nuevoPrecioVenta = nuevoPrecioVentaInput.value !== '' ? parseFloat(nuevoPrecioVentaInput.value) : null;

    if (isNaN(cantidadRecibida) || cantidadRecibida <= 0) {
        console.error("Cantidad recibida inválida.");
        alert('Por favor, ingresa una cantidad válida y mayor a cero.');
        console.groupEnd();
        return;
    }
    // Validar si se ingresaron precios y son válidos
    if (nuevoPrecioCompra !== null && (isNaN(nuevoPrecioCompra) || nuevoPrecioCompra < 0)) {
        console.error("Precio de compra inválido.");
        alert('Por favor, ingresa un precio de compra válido.');
        console.groupEnd();
        return;
    }
    if (nuevoPrecioVenta !== null && (isNaN(nuevoPrecioVenta) || nuevoPrecioVenta < 0)) {
        console.error("Precio de venta inválido.");
        alert('Por favor, ingresa un precio de venta válido.');
        console.groupEnd();
        return;
    }

    // Construir el mensaje de confirmación
    let confirmMessage = `¿Confirmar recepción de ${cantidadRecibida} unidades de ${productoSeleccionadoParaRecepcion.nombre}?`;
    if (nuevoPrecioCompra !== null) {
        confirmMessage += `\nNuevo Precio Compra: RD$ ${nuevoPrecioCompra.toFixed(2)}`;
    }
    if (nuevoPrecioVenta !== null) {
        confirmMessage += `\nNuevo Precio Venta: RD$ ${nuevoPrecioVenta.toFixed(2)}`;
    }


    if (confirm(confirmMessage)) {
        try {
            const productoRef = db.collection('productos').doc(productoSeleccionadoParaRecepcion.id);
            
            // Objeto para las actualizaciones del documento del producto
            const actualizaciones = {
                cantidad: firebase.firestore.FieldValue.increment(cantidadRecibida)
            };

            // Añadir los precios al objeto de actualizaciones si fueron ingresados
            if (nuevoPrecioCompra !== null) {
                actualizaciones.precioCompra = nuevoPrecioCompra;
            }
            if (nuevoPrecioVenta !== null) {
                actualizaciones.precioVenta = nuevoPrecioVenta;
            }
            console.log("Actualizaciones para el producto:", actualizaciones);
            await productoRef.update(actualizaciones);

            await db.collection('recepciones').add({
                fecha: firebase.firestore.FieldValue.serverTimestamp(),
                productoId: productoSeleccionadoParaRecepcion.id,
                nombreProducto: productoSeleccionadoParaRecepcion.nombre,
                cantidadRecibida: cantidadRecibida,
                precioCompraRegistrado: nuevoPrecioCompra !== null ? nuevoPrecioCompra : productoSeleccionadoParaRecepcion.precioCompra,
                precioVentaRegistrado: nuevoPrecioVenta !== null ? nuevoPrecioVenta : productoSeleccionadoParaRecepcion.precioVenta
            });

            console.log('Recepción registrada y stock/precios actualizados con éxito!');
            alert('Recepción registrada y stock/precios actualizados con éxito!');
            
            // Limpiar formulario y resetear selección
            buscarProductoRecepcionInput.value = '';
            sugerenciasRecepcionUl.innerHTML = '';
            cantidadRecibidaInput.value = '1';
            productoIdRecepcionInput.value = '';
            productoSeleccionadoRecepcionSpan.textContent = '';
            nuevoPrecioCompraInput.value = ''; // Limpiar campos de precio
            nuevoPrecioVentaInput.value = ''; // Limpiar campos de precio
            productoSeleccionadoParaRecepcion = null;

            cargarHistorialRecepciones(); // Recargar el historial de recepciones
            console.log("Formulario de recepción reseteado.");

        } catch (error) {
            console.error("Error crítico al registrar la recepción:", error);
            alert("Hubo un error al registrar la recepción. Consulta la consola.");
        }
    } else {
        console.log("Recepción cancelada por el usuario.");
    }
    console.groupEnd();
});

// ** Función para cargar y mostrar el historial de recepciones **
const cargarHistorialRecepciones = async () => {
    console.group("Cargando historial de recepciones...");
    tablaRecepcionesBody.innerHTML = '';
    try {
        const snapshot = await db.collection('recepciones')
            .orderBy('fecha', 'desc') // Las más recientes primero
            .limit(5) // Mostrar solo las últimas 5 recepciones en el historial
            .get();

        if (snapshot.empty) {
            console.info("No hay recepciones registradas en el historial.");
            tablaRecepcionesBody.innerHTML = '<tr><td colspan="3">No hay recepciones registradas.</td></tr>';
            console.groupEnd();
            return;
        }

        console.table(snapshot.docs.map(doc => doc.data()));

        snapshot.forEach(doc => {
            const recepcion = doc.data();
            const fila = tablaRecepcionesBody.insertRow();
            
            const fechaRecepcion = recepcion.fecha.toDate();
            const fechaHoraTexto = fechaRecepcion.toLocaleDateString('es-DO', { 
                year: 'numeric', 
                month: '2-digit', 
                day: '2-digit', 
                hour: '2-digit', 
                minute: '2-digit', 
                second: '2-digit' 
            });

            fila.insertCell(0).textContent = fechaHoraTexto;
            fila.insertCell(1).textContent = recepcion.nombreProducto;
            fila.insertCell(2).textContent = recepcion.cantidadRecibida;
        });
        console.log("Historial de recepciones cargado.");
    } catch (error) {
        console.error("Error al cargar historial de recepciones:", error);
        tablaRecepcionesBody.innerHTML = '<tr><td colspan="3">Error al cargar el historial.</td></tr>';
    }
    console.groupEnd();
};