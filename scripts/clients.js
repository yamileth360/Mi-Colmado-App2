// scripts/clients.js

// ** Elementos del DOM (Interfaz) para Clientes **
const formAgregarCliente = document.getElementById('form-agregar-cliente');
const nombreClienteInput = document.getElementById('nombre-cliente');
const telefonoClienteInput = document.getElementById('telefono-cliente');
const direccionClienteInput = document.getElementById('direccion-cliente');
const notasClienteInput = document.getElementById('notas-cliente');
const tablaClientesBody = document.querySelector('#tabla-clientes tbody');

// ** Elementos del DOM del Modal de Edición de Cliente **
const modalEditarCliente = document.getElementById('modal-editar-cliente');
const closeModalClienteBtn = document.getElementById('close-modal-cliente');
const formEditarCliente = document.getElementById('form-editar-cliente');
const editClienteIdInput = document.getElementById('edit-cliente-id');
const editNombreClienteInput = document.getElementById('edit-nombre-cliente');
const editTelefonoClienteInput = document.getElementById('edit-telefono-cliente');
const editDireccionClienteInput = document.getElementById('edit-direccion-cliente');
const editNotasClienteInput = document.getElementById('edit-notas-cliente');


// ** Lógica para agregar un cliente a Firestore **
formAgregarCliente.addEventListener('submit', async (e) => {
    e.preventDefault();
    console.group("Intentando agregar nuevo cliente...");

    const nombre = nombreClienteInput.value;
    const telefono = telefonoClienteInput.value;
    const direccion = direccionClienteInput.value;
    const notas = notasClienteInput.value;

    if (!nombre) {
        alert("Por favor, ingresa el nombre del cliente.");
        console.warn("Validación de agregar cliente fallida: nombre no ingresado.");
        console.groupEnd();
        return;
    }

    try {
        const docRef = await db.collection('clientes').add({
            nombre,
            telefono,
            direccion,
            notas,
            fechaCreacion: firebase.firestore.FieldValue.serverTimestamp()
        });
        console.log(`Cliente '${nombre}' agregado con éxito. ID: ${docRef.id}`);
        alert('Cliente agregado con éxito!');
        formAgregarCliente.reset(); // Limpiar el formulario
    } catch (error) {
        console.error("Error crítico al agregar el cliente:", error);
        alert("Hubo un error al agregar el cliente. Consulta la consola.");
    }
    console.groupEnd();
});

// ** Función para mostrar los clientes en la tabla **
const mostrarClientes = (clientes) => {
    console.group("Actualizando tabla de clientes...");
    tablaClientesBody.innerHTML = ''; // Limpiar la tabla
    if (clientes.length === 0) {
        console.info("No hay clientes registrados para mostrar.");
        tablaClientesBody.innerHTML = '<tr><td colspan="5">No hay clientes registrados.</td></tr>';
        console.groupEnd();
        return;
    }

    console.table(clientes); // ¡Útil para ver los datos de los clientes!

    clientes.forEach(cliente => {
        const fila = tablaClientesBody.insertRow();

        fila.insertCell(0).textContent = cliente.nombre;
        fila.insertCell(1).textContent = cliente.telefono || 'N/A';
        fila.insertCell(2).textContent = cliente.direccion || 'N/A';
        fila.insertCell(3).textContent = cliente.notas || 'N/A';
        
        const celdaAcciones = fila.insertCell(4);
        
        // Botón de Editar Cliente
        const btnEditar = document.createElement('button');
        btnEditar.textContent = 'Editar';
        btnEditar.classList.add('btn-table-action', 'edit');
        btnEditar.addEventListener('click', () => {
            abrirModalEditarCliente(cliente.id, cliente); // Pasa el ID y los datos del cliente
        });
        celdaAcciones.appendChild(btnEditar);

        // Botón de eliminar cliente
        const btnEliminar = document.createElement('button');
        btnEliminar.textContent = 'Eliminar';
        btnEliminar.classList.add('btn-table-action', 'delete');
        btnEliminar.addEventListener('click', async () => {
            console.warn(`Confirmación de eliminación para cliente: ${cliente.nombre} (ID: ${cliente.id})`);
            if (confirm(`¿Estás seguro de que quieres eliminar a ${cliente.nombre}?`)) {
                try {
                    await db.collection('clientes').doc(cliente.id).delete();
                    console.log(`Cliente '${cliente.nombre}' eliminado con éxito.`);
                    alert('Cliente eliminado.');
                } catch (error) {
                    console.error(`Error al eliminar el cliente '${cliente.nombre}':`, error);
                    alert("Hubo un error al eliminar el cliente. Consulta la consola.");
                }
            }
        });
        celdaAcciones.appendChild(btnEliminar);
    });
    console.groupEnd();
};

// ** Escuchar cambios en la colección 'clientes' de Firestore **
db.collection('clientes').orderBy('nombre').onSnapshot((snapshot) => {
    console.info("Cambio detectado en la colección 'clientes'.");
    const clientes = [];
    snapshot.forEach(doc => {
        clientes.push({ id: doc.id, ...doc.data() });
    });
    mostrarClientes(clientes);
}, (error) => {
    console.error("Error al escuchar cambios en 'clientes':", error);
    alert("Error al cargar los clientes. Consulta la consola.");
});


// --- Lógica para Edición de Clientes (Funciones del Modal) ---

// ** Abrir modal de edición de cliente **
const abrirModalEditarCliente = (clienteId, clienteData) => {
    console.log(`Abriendo modal de edición para cliente ID: ${clienteId}`, clienteData);
    editClienteIdInput.value = clienteId;
    editNombreClienteInput.value = clienteData.nombre;
    editTelefonoClienteInput.value = clienteData.telefono || '';
    editDireccionClienteInput.value = clienteData.direccion || '';
    editNotasClienteInput.value = clienteData.notas || '';

    modalEditarCliente.style.display = 'block'; // Mostrar el modal
};

// ** Cerrar modal de edición de cliente **
closeModalClienteBtn.addEventListener('click', () => {
    console.log("Cerrando modal de edición de cliente.");
    modalEditarCliente.style.display = 'none';
});

// ** Guardar cambios del cliente en Firestore **
formEditarCliente.addEventListener('submit', async (e) => {
    e.preventDefault();
    const clienteId = editClienteIdInput.value;
    console.group(`Intentando actualizar cliente ID: ${clienteId}`);

    const nombre = editNombreClienteInput.value;
    const telefono = editTelefonoClienteInput.value;
    const direccion = editDireccionClienteInput.value;
    const notas = editNotasClienteInput.value;

    if (!nombre) {
        alert("Por favor, ingresa el nombre del cliente.");
        console.warn("Validación de edición de cliente fallida: nombre no ingresado.");
        console.groupEnd();
        return;
    }

    try {
        await db.collection('clientes').doc(clienteId).update({
            nombre,
            telefono,
            direccion,
            notas
        });

        console.log(`Cliente ID: ${clienteId} actualizado con éxito.`);
        alert('Cliente actualizado con éxito!');
        modalEditarCliente.style.display = 'none';
    } catch (error) {
        console.error(`Error al actualizar el cliente ID: ${clienteId}:`, error);
        alert("Hubo un error al actualizar el cliente. Consulta la consola.");
    }
    console.groupEnd();
});