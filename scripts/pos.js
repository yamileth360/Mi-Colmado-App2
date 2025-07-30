// scripts/pos.js

// ** Elementos del DOM del POS (Interfaz) **
const buscarProductoPosInput = document.getElementById('buscar-producto-pos');
const sugerenciasPosUl = document.getElementById('sugerencias-pos');
const tablaCarritoBody = document.querySelector('#tabla-carrito tbody');
const totalVentaSpan = document.getElementById('total-venta');
const btnRegistrarVenta = document.getElementById('btn-registrar-venta');

// ** Elementos del DOM para Cliente y Pago **
const buscarClientePosInput = document.getElementById('buscar-cliente-pos');
const sugerenciasClientesPosUl = document.getElementById('sugerencias-clientes-pos');
const clienteSeleccionadoPosSpan = document.getElementById('cliente-seleccionado-pos');
const btnQuitarCliente = document.getElementById('btn-quitar-cliente');
const clienteIdSeleccionadoInput = document.getElementById('cliente-id-seleccionado');

const formaPagoSelect = document.getElementById('forma-pago');
const divEfectivoCambio = document.getElementById('div-efectivo-cambio');
const montoRecibidoInput = document.getElementById('monto-recibido');
const montoCambioSpan = document.getElementById('monto-cambio');

// ** Elementos del DOM del Modal de Factura **
const modalFactura = document.getElementById('modal-factura');
const closeModalFacturaBtn = document.getElementById('close-modal-factura');
const facturaFechaSpan = document.getElementById('factura-fecha');
const facturaNumeroSpan = document.getElementById('factura-numero');
const facturaClienteSpan = document.getElementById('factura-cliente');
const facturaItemsBody = document.getElementById('factura-items-body');
const facturaSubtotalSpan = document.getElementById('factura-subtotal');
const facturaTotalSpan = document.getElementById('factura-total');
const facturaFormaPagoSpan = document.getElementById('factura-forma-pago');
const facturaMontoRecibidoLine = document.getElementById('factura-monto-recibido-line');
const facturaMontoRecibidoSpan = document.getElementById('factura-monto-recibido');
const facturaCambioLine = document.getElementById('factura-cambio-line');
const facturaCambioSpan = document.getElementById('factura-cambio');
const btnImprimirFactura = document.getElementById('btn-imprimir-factura');

// ** Botón: Limpiar Carrito **
const btnLimpiarCarrito = document.getElementById('btn-limpiar-carrito');


// ** Variables de estado **
let carrito = []; // Array para almacenar los productos en el carrito
let clienteSeleccionado = null; // Para almacenar el objeto del cliente


// ** Lógica de Búsqueda y Sugerencias de Productos (para POS, usando Firestore) **
buscarProductoPosInput.addEventListener('input', async () => {
    const textoBusqueda = buscarProductoPosInput.value.toLowerCase();
    console.debug(`DEBUG: Buscando productos en POS: '${textoBusqueda}'`);
    sugerenciasPosUl.innerHTML = ''; // Limpiar sugerencias anteriores

    if (textoBusqueda.length > 0) {
        try {
            // *** VERSIÓN ACTUAL: Descarga todos los productos y filtra localmente (menos eficiente, pero funciona sin índice especial) ***
            const snapshot = await db.collection('productos').orderBy('nombre').get(); // Obtiene TODOS, ordenados por nombre
            const todosLosProductos = [];
            snapshot.forEach(doc => {
                todosLosProductos.push({ id: doc.id, ...doc.data() });
            });

            // Filtra localmente por nombre (insensible a mayúsculas/minúsculas)
            const productosFiltrados = todosLosProductos.filter(prod => 
                prod.nombre.toLowerCase().includes(textoBusqueda)
            );

            console.log("DEBUG: Productos encontrados por Firestore para POS:", productosFiltrados);

            if (productosFiltrados.length > 0) {
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
            } else {
                console.log("DEBUG: Firestore no encontró productos para el término en POS:", textoBusqueda);
                const li = document.createElement('li');
                li.textContent = 'No se encontraron productos.';
                sugerenciasPosUl.appendChild(li);
            }

        } catch (error) {
            console.error("DEBUG: Error buscando productos para POS:", error);
        }
    }
});

// ** Función para agregar producto al carrito **
const agregarProductoAlCarrito = (productoSeleccionado) => {
    console.log(`DEBUG: Agregando producto al carrito: ${productoSeleccionado.nombre}`);
    const productoExistente = carrito.find(item => item.id === productoSeleccionado.id);

    if (productoExistente) {
        if (productoExistente.cantidadEnCarrito < productoSeleccionado.cantidad) {
            productoExistente.cantidadEnCarrito++;
            console.log(`DEBUG: Cantidad de '${productoSeleccionado.nombre}' en carrito incrementada a ${productoExistente.cantidadEnCarrito}.`);
        } else {
            console.warn(`Stock insuficiente para agregar más de '${productoSeleccionado.nombre}' (Cantidad disponible: ${productoSeleccionado.cantidad}).`);
            alert(`No hay suficiente stock de ${productoSeleccionado.nombre} (Cantidad disponible: ${productoSeleccionado.cantidad}).`);
            return;
        }
    } else {
        if (productoSeleccionado.cantidad > 0) {
            carrito.push({ ...productoSeleccionado, cantidadEnCarrito: 1 });
            console.log(`DEBUG: Producto '${productoSeleccionado.nombre}' añadido al carrito por primera vez.`);
        } else {
            console.warn(`Producto '${productoSeleccionado.nombre}' agotado, no se puede añadir al carrito.`);
            alert(`El producto ${productoSeleccionado.nombre} está agotado.`);
            return;
        }
    }
    actualizarCarritoUI();
};

// ** Función para modificar la cantidad de un producto en el carrito (usado por +/- botones) **
const modificarCantidadCarrito = (productoId, cambio) => {
    console.log(`DEBUG: Modificando cantidad para producto ID: ${productoId}, cambio: ${cambio}`);
    const itemIndex = carrito.findIndex(item => item.id === productoId);

    if (itemIndex > -1) {
        const item = carrito[itemIndex];
        const nuevaCantidad = item.cantidadEnCarrito + cambio;

        if (nuevaCantidad > 0) {
            if (nuevaCantidad <= item.cantidad) { // item.cantidad es el stock disponible del producto
                item.cantidadEnCarrito = nuevaCantidad;
                console.log(`DEBUG: Cantidad de '${item.nombre}' actualizada a ${item.cantidadEnCarrito}.`);
            } else {
                console.warn(`Intento de exceder el stock disponible para '${item.nombre}'.`);
                alert(`No puedes agregar más de ${item.cantidad} unidades de ${item.nombre} (Stock disponible).`);
            }
        } else {
            console.log(`DEBUG: Removiendo '${item.nombre}' del carrito (cantidad llegó a 0).`);
            quitarProductoDelCarrito(item.id);
            return; // Salir para no actualizar UI dos veces
        }
    }
    actualizarCarritoUI();
};


// ** Función para actualizar la tabla del carrito y el total (GLOBAL) **
// Hacemos esta función global para que main.js pueda llamarla
window.actualizarCarritoUI = () => { 
    console.group("DEBUG: Entrando a actualizarCarritoUI.");
    tablaCarritoBody.innerHTML = ''; // Limpiar la tabla

    if (carrito.length === 0) {
        console.info("DEBUG: Carrito vacío.");
        tablaCarritoBody.innerHTML = '<tr><td colspan="5">No hay productos en el carrito.</td></tr>';
        totalVentaSpan.textContent = 'RD$ 0.00';
        // También resetear cambio y monto recibido si el carrito se vacía
        if (formaPagoSelect.value === 'efectivo') {
            montoRecibidoInput.value = '';
            montoCambioSpan.textContent = 'RD$ 0.00';
            montoCambioSpan.style.color = '#dc3545';
        }
        console.groupEnd();
        return;
    }

    console.table(carrito.map(item => ({ Nombre: item.nombre, Cantidad: item.cantidadEnCarrito, Precio: item.precioVenta, Subtotal: item.cantidadEnCarrito * item.precioVenta })));

    let totalGeneral = 0;

    carrito.forEach(item => {
        const fila = tablaCarritoBody.insertRow();
        const subtotalItem = item.cantidadEnCarrito * item.precioVenta;
        totalGeneral += subtotalItem;

        fila.insertCell(0).textContent = item.nombre; // Nombre del producto
        
        // Columna de Cantidad con botones +/-
        const celdaCantidad = fila.insertCell(1);
        const divCantidadControl = document.createElement('div');
        divCantidadControl.classList.add('cantidad-control');

        const btnMenos = document.createElement('button');
        btnMenos.textContent = '-';
        btnMenos.addEventListener('click', () => {
            modificarCantidadCarrito(item.id, -1); // Disminuir cantidad
        });

        const spanCantidad = document.createElement('span');
        spanCantidad.classList.add('cantidad-display');
        spanCantidad.textContent = item.cantidadEnCarrito;

        const btnMas = document.createElement('button');
        btnMas.textContent = '+';
        btnMas.addEventListener('click', () => {
            modificarCantidadCarrito(item.id, 1); // Aumentar cantidad
        });

        divCantidadControl.appendChild(btnMenos);
        divCantidadControl.appendChild(spanCantidad);
        divCantidadControl.appendChild(btnMas);
        celdaCantidad.appendChild(divCantidadControl);
        
        fila.insertCell(2).textContent = `RD$ ${item.precioVenta.toFixed(2)}`; // Precio Unitario
        fila.insertCell(3).textContent = `RD$ ${subtotalItem.toFixed(2)}`; // Subtotal

        const celdaAcciones = fila.insertCell(4);
        const divAccionButtons = document.createElement('div');
        divAccionButtons.classList.add('pos-accion-buttons'); // Para apilar los botones

        const btnQuitar = document.createElement('button');
        btnQuitar.textContent = 'Quitar';
        btnQuitar.classList.add('btn-quitar-carrito');
        btnQuitar.addEventListener('click', () => {
            quitarProductoDelCarrito(item.id);
        });
        divAccionButtons.appendChild(btnQuitar);
        celdaAcciones.appendChild(divAccionButtons);
    });

    totalVentaSpan.textContent = `RD$ ${totalGeneral.toFixed(2)}`;
    
    // Recalcular cambio si la forma de pago es efectivo y el monto ya ha sido introducido
    if (formaPagoSelect.value === 'efectivo' && montoRecibidoInput.value !== '') {
        montoRecibidoInput.dispatchEvent(new Event('input')); // Simula un evento input para recalcular
    }
    console.groupEnd();
};

// ** Función para quitar producto del carrito **
const quitarProductoDelCarrito = (productoId) => {
    const itemNombre = carrito.find(item => item.id === productoId)?.nombre || 'producto desconocido';
    console.log(`DEBUG: Quitanto '${itemNombre}' (ID: ${productoId}) del carrito.`);
    carrito = carrito.filter(item => item.id !== productoId);
    actualizarCarritoUI();
};

// ** Lógica para el botón 'Limpiar Carrito' **
btnLimpiarCarrito.addEventListener('click', () => {
    console.log("DEBUG: Botón 'Limpiar Carrito' clicado.");
    if (carrito.length === 0) {
        alert('El carrito ya está vacío.');
        console.warn("DEBUG: Intento de limpiar un carrito que ya está vacío.");
        return;
    }
    if (confirm('¿Estás seguro de que quieres limpiar todo el carrito? Esta acción no se puede deshacer.')) {
        carrito = []; // Vacía el array del carrito
        actualizarCarritoUI(); // Actualiza la interfaz
        console.log("DEBUG: Carrito de compras limpiado por el usuario.");
        alert('El carrito ha sido limpiado.');
    } else {
        console.log("DEBUG: Operación de limpiar carrito cancelada.");
    }
});


// ** Lógica de Búsqueda y Sugerencias de Clientes (para POS) **
buscarClientePosInput.addEventListener('input', async () => {
    const textoBusqueda = buscarClientePosInput.value.toLowerCase();
    console.debug(`DEBUG: Buscando clientes en POS: '${textoBusqueda}'`);
    sugerenciasClientesPosUl.innerHTML = ''; // Limpiar sugerencias

    if (textoBusqueda.length > 0) {
        try {
            // *** VERSIÓN ACTUAL: Descarga todos los clientes y filtra localmente (menos eficiente) ***
            const snapshot = await db.collection('clientes').orderBy('nombre').get(); // Obtiene TODOS los clientes
            const todosLosClientes = [];
            snapshot.forEach(doc => {
                todosLosClientes.push({ id: doc.id, ...doc.data() });
            });

            // Filtra localmente por nombre o teléfono (insensible a mayúsculas/minúsculas)
            const clientesFiltrados = todosLosClientes.filter(cl => 
                cl.nombre.toLowerCase().includes(textoBusqueda) || 
                (cl.telefono && cl.telefono.toLowerCase().includes(textoBusqueda))
            );

            console.log("DEBUG: Clientes encontrados por Firestore para POS:", clientesFiltrados);

            if (clientesFiltrados.length > 0) {
                clientesFiltrados.forEach(cliente => {
                    const li = document.createElement('li');
                    li.textContent = `${cliente.nombre} ${cliente.telefono ? `(${cliente.telefono})` : ''}`;
                    li.addEventListener('click', () => {
                        clienteSeleccionado = cliente;
                        clienteIdSeleccionadoInput.value = cliente.id;
                        clienteSeleccionadoPosSpan.textContent = `Cliente: ${cliente.nombre}`;
                        btnQuitarCliente.style.display = 'inline-block'; // Mostrar botón "Quitar Cliente"
                        buscarClientePosInput.value = ''; // Limpiar input de búsqueda
                        sugerenciasClientesPosUl.innerHTML = ''; // Limpiar sugerencias
                    });
                    sugerenciasClientesPosUl.appendChild(li);
                });
            } else {
                console.log("DEBUG: Firestore no encontró clientes para el término en POS:", textoBusqueda);
                const li = document.createElement('li');
                li.textContent = 'No se encontraron clientes.';
                sugerenciasClientesPosUl.appendChild(li);
            }

        } catch (error) {
            console.error("DEBUG: Error buscando clientes para POS:", error);
        }
    }
});

// ** Lógica para quitar el cliente seleccionado **
btnQuitarCliente.addEventListener('click', () => {
    console.log(`DEBUG: Cliente '${clienteSeleccionado ? clienteSeleccionado.nombre : "ninguno"}' deseleccionado.`);
    clienteSeleccionado = null;
    clienteIdSeleccionadoInput.value = '';
    clienteSeleccionadoPosSpan.textContent = '';
    buscarClientePosInput.value = ''; // Vaciar el campo de búsqueda de cliente
    btnQuitarCliente.style.display = 'none'; // Ocultar el botón "Quitar Cliente"
});


// ** Lógica para Forma de Pago y Monto Recibido/Cambio **
formaPagoSelect.addEventListener('change', () => {
    console.log(`DEBUG: Forma de pago seleccionada: ${formaPagoSelect.value}`);
    if (formaPagoSelect.value === 'efectivo') {
        divEfectivoCambio.style.display = 'block';
        montoRecibidoInput.setAttribute('required', 'true');
        montoRecibidoInput.value = ''; // Limpiar al cambiar a efectivo
        montoCambioSpan.textContent = 'RD$ 0.00';
    } else {
        divEfectivoCambio.style.display = 'none';
        montoRecibidoInput.removeAttribute('required');
        montoRecibidoInput.value = '';
        montoCambioSpan.textContent = 'RD$ 0.00';
    }
});

montoRecibidoInput.addEventListener('input', () => {
    const totalVenta = parseFloat(totalVentaSpan.textContent.replace('RD$ ', '')) || 0;
    const montoRecibido = parseFloat(montoRecibidoInput.value) || 0;
    const cambio = montoRecibido - totalVenta;
    montoCambioSpan.textContent = `RD$ ${cambio.toFixed(2)}`;
    montoCambioSpan.style.color = cambio >= 0 ? '#28a745' : '#dc3545'; // Verde si hay cambio positivo, rojo si falta
    console.debug(`DEBUG: Monto recibido: ${montoRecibidoInput.value}, Cambio: ${montoCambioSpan.textContent}`);
});


// ** Función para registrar la venta en Firestore y actualizar inventario **
btnRegistrarVenta.addEventListener('click', async () => {
    console.group("DEBUG: Intentando registrar venta...");
    if (carrito.length === 0) {
        console.warn("DEBUG: Intento de registrar venta con carrito vacío.");
        alert('El carrito está vacío. Agrega productos para registrar una venta.');
        console.groupEnd();
        return;
    }

    const totalVenta = parseFloat(totalVentaSpan.textContent.replace('RD$ ', '')) || 0;
    const formaPago = formaPagoSelect.value;
    let montoRecibido = null;
    let cambio = null;

    if (formaPago === 'efectivo') {
        montoRecibido = parseFloat(montoRecibidoInput.value);
        if (isNaN(montoRecibido) || montoRecibido < totalVenta) {
            console.error("DEBUG: Monto recibido insuficiente para pago en efectivo.");
            alert('El monto recibido es insuficiente para el pago en efectivo.');
            console.groupEnd();
            return;
        }
        cambio = montoRecibido - totalVenta;
    }

    if (confirm('¿Confirmar venta y actualizar inventario?')) {
        try {
            const batch = db.batch(); // Usamos un batch para operaciones atómicas

            // 1. Actualizar el stock de cada producto en Firebase
            for (const item of carrito) {
                const productoRef = db.collection('productos').doc(item.id);
                batch.update(productoRef, { cantidad: firebase.firestore.FieldValue.increment(-item.cantidadEnCarrito) });
                console.debug(`Actualizando stock de ${item.nombre} por -${item.cantidadEnCarrito}.`);
            }

            // 2. Registrar la venta en una nueva colección 'ventas'
            const nuevaVentaRef = db.collection('ventas').doc(); // Firestore genera un ID automático
            const ventaId = nuevaVentaRef.id; // Obtenemos el ID generado por Firestore
            const ventaData = {
                fecha: firebase.firestore.FieldValue.serverTimestamp(), // Usa el timestamp del servidor de Firebase (UTC)
                productosVendidos: carrito.map(item => ({
                    id: item.id,
                    nombre: item.nombre,
                    cantidad: item.cantidadEnCarrito,
                    precioUnitario: item.precioVenta,
                    precioCompraUnitario: item.precioCompra, // Guardar el precio de compra
                    subtotal: item.cantidadEnCarrito * item.precioVenta
                })),
                totalVenta: totalVenta,
                formaPago: formaPago,
                montoRecibido: montoRecibido, // Será null si no es efectivo
                cambio: cambio, // Será null si no es efectivo
                clienteId: clienteSeleccionado ? clienteSeleccionado.id : null, // ID del cliente (opcional)
                clienteNombre: clienteSeleccionado ? clienteSeleccionado.nombre : 'Cliente Genérico' // Nombre del cliente (opcional)
            };
            batch.set(nuevaVentaRef, ventaData); // Guarda la venta con los datos
            console.log(`Registrando nueva venta con ID: ${ventaId}.`);
            console.log("Datos de la venta a registrar:", ventaData);

            await batch.commit(); // Ejecutar todas las operaciones del batch

            alert('Venta registrada con éxito y inventario actualizado!');
            console.log('Venta registrada y inventario actualizado con éxito!');
            
            // *** Mostrar la factura después de registrar la venta ***
            // Recuperamos el documento recién creado para obtener el timestamp real del servidor
            const ventaRegistradaDoc = await db.collection('ventas').doc(ventaId).get();
            if(ventaRegistradaDoc.exists) {
                console.info("Generando factura para la venta...");
                mostrarFactura(ventaRegistradaDoc.data(), ventaId);
            } else {
                console.warn(`No se pudo recuperar la venta para generar la factura. ID: ${ventaId}`);
                alert('Venta registrada, pero no se pudo generar la factura. Recarga la página y revisa en reportes.');
            }
            
            // Limpiar todo el estado del POS después de una venta exitosa
            carrito = [];
            actualizarCarritoUI(); // Esto reinicia el carrito y el total

            // Resetear campos de pago y cliente
            formaPagoSelect.value = 'efectivo'; // Vuelve a efectivo por defecto
            divEfectivoCambio.style.display = 'block'; // Asegura que el campo de efectivo esté visible
            montoRecibidoInput.value = '';
            montoCambioSpan.textContent = 'RD$ 0.00';
            montoCambioSpan.style.color = '#dc3545'; // Restablecer color de cambio (rojo por defecto)
            
            clienteSeleccionado = null;
            clienteIdSeleccionadoInput.value = '';
            clienteSeleccionadoPosSpan.textContent = '';
            buscarClientePosInput.value = '';
            btnQuitarCliente.style.display = 'none';
            console.log("POS reseteado después de la venta.");

        } catch (error) {
            console.error("Error crítico al registrar la venta:", error);
            alert("Hubo un error al registrar la venta. Por favor, revisa la consola para más detalles.");
        }
    } else {
        console.log("Venta cancelada por el usuario.");
    }
    console.groupEnd();
});


// ** Función para mostrar el modal de factura **
const mostrarFactura = (venta, ventaId) => {
    console.group(`Mostrando factura para Venta ID: ${ventaId}`);
    
    facturaNumeroSpan.textContent = ventaId.substring(0, 8).toUpperCase(); // Usamos parte del ID de Firestore

    // Formatear la fecha para la factura
    const fechaVenta = venta.fecha.toDate(); // Convierte el Timestamp de Firebase a un objeto Date
    facturaFechaSpan.textContent = fechaVenta.toLocaleDateString('es-DO', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });

    // Información del cliente
    facturaClienteSpan.textContent = venta.clienteNombre || 'Cliente Genérico';

    // Rellenar los ítems de la factura
    facturaItemsBody.innerHTML = '';
    let subtotalCalculado = 0; // Calculamos el subtotal de los ítems en la factura
    venta.productosVendidos.forEach(item => {
        const fila = facturaItemsBody.insertRow();
        fila.insertCell(0).textContent = item.cantidad;
        fila.insertCell(1).textContent = item.nombre;
        fila.insertCell(2).textContent = item.precioUnitario.toFixed(2);
        fila.insertCell(3).textContent = item.subtotal.toFixed(2);
        subtotalCalculado += item.subtotal;
    });

    // Totales y forma de pago
    facturaSubtotalSpan.textContent = `RD$ ${subtotalCalculado.toFixed(2)}`;
    facturaTotalSpan.textContent = `RD$ ${venta.totalVenta.toFixed(2)}`;
    facturaFormaPagoSpan.textContent = venta.formaPago.charAt(0).toUpperCase() + venta.formaPago.slice(1); // Capitalizar primera letra

    if (venta.formaPago === 'efectivo') {
        facturaMontoRecibidoLine.style.display = 'block';
        facturaMontoRecibidoSpan.textContent = `RD$ ${venta.montoRecibido.toFixed(2)}`;
        facturaCambioLine.style.display = 'block';
        facturaCambioSpan.textContent = `RD$ ${venta.cambio.toFixed(2)}`;
    } else {
        // MUY IMPORTANTE: Asegurarse de ocultarlas si NO es efectivo
        facturaMontoRecibidoLine.style.display = 'none';
        facturaCambioLine.style.display = 'none';
    }

    modalFactura.style.display = 'block'; // Mostrar el modal
    console.log("Modal de factura mostrado.");
    console.groupEnd();
};

// ** Cerrar modal de factura **
closeModalFacturaBtn.addEventListener('click', () => {
    console.log("Cerrando modal de factura.");
    modalFactura.style.display = 'none';
});

// ** Lógica para imprimir la factura **
btnImprimirFactura.addEventListener('click', () => {
    console.log("Botón 'Imprimir Factura' clicado. Abriendo diálogo de impresión...");
    window.print();
});