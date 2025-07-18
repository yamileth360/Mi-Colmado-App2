// scripts/reception.js

// ** Variables DOM **
const buscarProductoRecepcionInput = document.getElementById('buscar-producto-recepcion');
const sugerenciasRecepcionUl = document.getElementById('sugerencias-recepcion');
const productoIdRecepcionInput = document.getElementById('producto-id-recepcion'); // Hidden input para el ID del producto
const productoSeleccionadoRecepcionSpan = document.getElementById('producto-seleccionado-recepcion-display'); // Etiqueta para mostrar el nombre del producto seleccionado
const cantidadRecibidaInput = document.getElementById('cantidad-recibida');
const nuevoPrecioCompraInput = document.getElementById('nuevo-precio-compra'); // Input para nuevo precio de compra
const nuevoPrecioVentaInput = document.getElementById('nuevo-precio-venta'); // Nuevo input para precio venta
const btnRegistrarRecepcion = document.getElementById('btn-registrar-recepcion'); // Botón de registrar

let productoSeleccionadoParaRecepcion = null; // Para almacenar el objeto completo del producto seleccionado

// ** Lógica para la búsqueda de productos en Recepción (usando Firestore) **
buscarProductoRecepcionInput.addEventListener('input', async (e) => {
    const searchTerm = e.target.value.toLowerCase();
    console.debug(`DEBUG: Buscando productos en Recepción: '${searchTerm}'`);
    sugerenciasRecepcionUl.innerHTML = ''; // Limpiar sugerencias anteriores

    // Limpiar selección previa si el usuario empieza a escribir de nuevo
    productoSeleccionadoParaRecepcion = null;
    productoIdRecepcionInput.value = '';
    if (productoSeleccionadoRecepcionSpan) {
      productoSeleccionadoRecepcionSpan.textContent = '';
    }
    nuevoPrecioCompraInput.value = '';
    nuevoPrecioVentaInput.value = '';

    if (searchTerm.length < 2) { // Puedes ajustar este valor: ej., buscar con al menos 2 caracteres
        console.log("DEBUG: Término de búsqueda demasiado corto. No se realiza la búsqueda.");
        return; // No buscar si el término es muy corto
    }

    try {
        const snapshot = await db.collection('productos')
                                 .orderBy('nombreLower') // Usar el campo en minúsculas para búsqueda
                                 .startAt(searchTerm)
                                 .endAt(searchTerm + '\uf8ff') // '\uf8ff' es un carácter Unicode que permite "termina con" en una consulta 'startAt/endAt'
                                 .get();
        
        const productosEncontrados = [];
        snapshot.forEach(doc => {
            productosEncontrados.push({ id: doc.id, ...doc.data() });
        });

        console.log("DEBUG: Productos encontrados por Firestore para Recepción:", productosEncontrados);

        if (productosEncontrados.length > 0) {
            productosEncontrados.forEach(producto => {
                const li = document.createElement('li');
                li.textContent = `${producto.nombre} (Stock: ${producto.cantidad} | P.Venta: RD$ ${producto.precioVenta.toFixed(2)})`;
                li.addEventListener('click', () => {
                    productoSeleccionadoParaRecepcion = producto; // Guarda el objeto completo del producto
                    productoIdRecepcionInput.value = producto.id;
                    if (productoSeleccionadoRecepcionSpan) {
                      productoSeleccionadoRecepcionSpan.textContent = `Producto seleccionado: ${producto.nombre}`;
                    }
                    buscarProductoRecepcionInput.value = producto.nombre; // Pone el nombre en el campo de búsqueda
                    nuevoPrecioCompraInput.value = producto.precioCompra.toFixed(2); // Rellena con el precio actual de compra
                    nuevoPrecioVentaInput.value = producto.precioVenta.toFixed(2); // Rellena con el precio actual de venta
                    sugerenciasRecepcionUl.innerHTML = ''; // Oculta las sugerencias
                });
                sugerenciasRecepcionUl.appendChild(li);
            });
        } else {
            console.log("DEBUG: Firestore no encontró productos para el término en Recepción:", searchTerm);
            const li = document.createElement('li');
            li.textContent = 'No se encontraron productos.';
            sugerenciasRecepcionUl.appendChild(li);
        }

    } catch (error) {
        console.error("DEBUG: Error buscando productos en Firestore para recepción:", error);
        const li = document.createElement('li');
        li.textContent = 'Error al cargar productos para la búsqueda.';
        sugerenciasRecepcionUl.appendChild(li);
    }
});

// Ocultar sugerencias al hacer clic fuera del input de búsqueda
document.addEventListener('click', (e) => {
    if (!buscarProductoRecepcionInput.contains(e.target) && !sugerenciasRecepcionUl.contains(e.target)) {
        sugerenciasRecepcionUl.innerHTML = '';
    }
});


// ** Lógica para registrar la recepción de mercancía (usando Firestore) **
// Seleccionamos el formulario por su ID y le adjuntamos el evento submit
document.getElementById('form-registrar-recepcion').addEventListener('submit', async (e) => { 
    e.preventDefault(); // Prevenir el envío del formulario por defecto
    console.group("DEBUG: Intentando registrar recepción de mercancía...");

    if (!productoSeleccionadoParaRecepcion || !productoIdRecepcionInput.value) {
        alert("Por favor, selecciona un producto de la lista de sugerencias.");
        console.warn("DEBUG: No se seleccionó ningún producto para la recepción.");
        console.groupEnd();
        return;
    }

    const cantidadRecibida = parseInt(cantidadRecibidaInput.value);
    const nuevoPrecioCompra = nuevoPrecioCompraInput.value !== '' ? parseFloat(nuevoPrecioCompraInput.value) : null;
    const nuevoPrecioVenta = nuevoPrecioVentaInput.value !== '' ? parseFloat(nuevoPrecioVentaInput.value) : null;

    if (isNaN(cantidadRecibida) || cantidadRecibida <= 0) {
        alert("Por favor, ingresa una cantidad recibida válida y mayor a cero.");
        console.error("DEBUG: Cantidad recibida inválida.");
        console.groupEnd();
        return;
    }

    if (nuevoPrecioCompra !== null && (isNaN(nuevoPrecioCompra) || nuevoPrecioCompra < 0)) {
        alert('Por favor, ingresa un precio de compra válido (número positivo).');
        console.error("DEBUG: Precio de compra inválido.");
        console.groupEnd();
        return;
    }
    if (nuevoPrecioVenta !== null && (isNaN(nuevoPrecioVenta) || nuevoPrecioVenta < 0)) {
        alert('Por favor, ingresa un precio de venta válido (número positivo).');
        console.error("DEBUG: Precio de venta inválido.");
        console.groupEnd();
        return;
    }

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
            
            const actualizacionesProducto = {
                cantidad: firebase.firestore.FieldValue.increment(cantidadRecibida)
            };

            if (nuevoPrecioCompra !== null) {
                actualizacionesProducto.precioCompra = nuevoPrecioCompra;
            }
            if (nuevoPrecioVenta !== null) {
                actualizacionesProducto.precioVenta = nuevoPrecioVenta;
            }
            console.log("DEBUG: Actualizaciones para el producto en Firestore:", actualizacionesProducto);
            await productoRef.update(actualizacionesProducto);

            const recepcionData = {
                fecha: firebase.firestore.FieldValue.serverTimestamp(),
                productoId: productoSeleccionadoParaRecepcion.id,
                nombreProducto: productoSeleccionadoParaRecepcion.nombre,
                cantidadRecibida: cantidadRecibida,
                precioCompraRegistrado: nuevoPrecioCompra !== null ? nuevoPrecioCompra : productoSeleccionadoParaRecepcion.precioCompra,
                precioVentaRegistrado: nuevoPrecioVenta !== null ? nuevoPrecioVenta : productoSeleccionadoParaRecepcion.precioVenta
            };
            await db.collection('recepciones').add(recepcionData);

            alert('Recepción registrada y stock/precios actualizados con éxito!');
            console.log('DEBUG: Recepción registrada y stock/precios actualizados con éxito!');
            
            const formRegistrarRecepcion = document.getElementById('form-registrar-recepcion');
            if (formRegistrarRecepcion && typeof formRegistrarRecepcion.reset === 'function') {
                formRegistrarRecepcion.reset();
            }
            buscarProductoRecepcionInput.value = '';
            sugerenciasRecepcionUl.innerHTML = '';
            cantidadRecibidaInput.value = '1';
            productoIdRecepcionInput.value = '';
            if (productoSeleccionadoRecepcionSpan) {
                productoSeleccionadoRecepcionSpan.textContent = '';
            }
            nuevoPrecioCompraInput.value = '';
            nuevoPrecioVentaInput.value = '';
            productoSeleccionadoParaRecepcion = null;

            window.cargarHistorialRecepciones();
            console.log("DEBUG: Formulario de recepción reseteado.");

        } catch (error) {
            console.error("DEBUG: Error crítico al registrar la recepción:", error);
            alert("Hubo un error al registrar la recepción. Consulta la consola para más detalles.");
        }
    } else {
        console.log("DEBUG: Recepción cancelada por el usuario.");
    }
    console.groupEnd();
});

// ** Función para cargar y mostrar el historial de recepciones (GLOBAL) **
window.cargarHistorialRecepciones = async () => { 
    console.group("DEBUG: Cargando historial de recepciones...");
    tablaRecepcionesBody.innerHTML = '';

    try {
        const snapshot = await db.collection('recepciones')
            .orderBy('fecha', 'desc')
            .limit(5)
            .get();

        if (snapshot.empty) {
            console.info("DEBUG: No hay recepciones registradas en el historial.");
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
        console.log("DEBUG: Historial de recepciones cargado.");
    } catch (error) {
        console.error("DEBUG: Error al cargar historial de recepciones desde Firestore:", error);
        tablaRecepcionesBody.innerHTML = '<tr><td colspan="3">Error al cargar el historial. Consulta la consola.</td></tr>';
    }
    console.groupEnd();
};