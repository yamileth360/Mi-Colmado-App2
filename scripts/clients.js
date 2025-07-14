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

    const nombre = nombreClienteInput.value;
    const telefono = telefonoClienteInput.value;
    const direccion = direccionClienteInput.value;
    const notas = notasClienteInput.value;

    if (!nombre) {
        alert("Por favor, ingresa el nombre del cliente.");
        return;
    }

    try {
        await db.collection('clientes').add({
            nombre,
            telefono,
            direccion,
            notas,
            fechaCreacion: firebase.firestore.FieldValue.serverTimestamp()
        });

        alert('Cliente agregado con éxito!');
        formAgregarCliente.reset(); // Limpiar el formulario
    } catch (error) {
        console.error("Error al agregar el cliente: ", error);
        alert("Hubo un error al agregar el cliente. Consulta la consola.");
    }
});

// ** Función para mostrar los clientes en la tabla **
const mostrarClientes = (clientes) => {
    tablaClientesBody.innerHTML = ''; // Limpiar la tabla
    if (clientes.length === 0) {
        tablaClientesBody.innerHTML = '<tr><td colspan="5">No hay clientes registrados.</td></tr>';
        return;
    }

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
        btnEditar.classList.add('btn-editar-cliente');
        btnEditar.addEventListener('click', () => {
            abrirModalEditarCliente(cliente.id, cliente); // Pasa el ID y los datos del cliente
        });
        celdaAcciones.appendChild(btnEditar);

        // Botón de eliminar cliente
        const btnEliminar = document.createElement('button');
        btnEliminar.textContent = 'Eliminar';
        btnEliminar.classList.add('btn-eliminar-cliente');
        btnEliminar.addEventListener('click', async () => {
            if (confirm(`¿Estás seguro de que quieres eliminar a ${cliente.nombre}?`)) {
                try {
                    await db.collection('clientes').doc(cliente.id).delete();
                    alert('Cliente eliminado.');
                } catch (error) {
                    console.error("Error al eliminar el cliente: ", error);
                    alert("Hubo un error al eliminar el cliente.");
                }
            }
        });
        celdaAcciones.appendChild(btnEliminar);
    });
};

// ** Escuchar cambios en la colección 'clientes' de Firestore **
db.collection('clientes').orderBy('nombre').onSnapshot((snapshot) => {
    const clientes = [];
    snapshot.forEach(doc => {
        clientes.push({ id: doc.id, ...doc.data() });
    });
    mostrarClientes(clientes);
}, (error) => {
    console.error("Error al obtener los clientes: ", error);
    alert("Error al cargar los clientes. Consulta la consola.");
});


// --- Lógica para Edición de Clientes (Funciones del Modal) ---

// ** Abrir modal de edición de cliente **
const abrirModalEditarCliente = (clienteId, clienteData) => {
    editClienteIdInput.value = clienteId;
    editNombreClienteInput.value = clienteData.nombre;
    editTelefonoClienteInput.value = clienteData.telefono || '';
    editDireccionClienteInput.value = clienteData.direccion || '';
    editNotasClienteInput.value = clienteData.notas || '';

    modalEditarCliente.style.display = 'block'; // Mostrar el modal
};

// ** Cerrar modal de edición de cliente **
closeModalClienteBtn.addEventListener('click', () => {
    modalEditarCliente.style.display = 'none';
});

// ** Guardar cambios del cliente en Firestore **
formEditarCliente.addEventListener('submit', async (e) => {
    e.preventDefault();

    const clienteId = editClienteIdInput.value;
    const nombre = editNombreClienteInput.value;
    const telefono = editTelefonoClienteInput.value;
    const direccion = editDireccionClienteInput.value;
    const notas = editNotasClienteInput.value;

    if (!nombre) {
        alert("Por favor, ingresa el nombre del cliente.");
        return;
    }

    try {
        await db.collection('clientes').doc(clienteId).update({
            nombre,
            telefono,
            direccion,
            notas
        });

        alert('Cliente actualizado con éxito!');
        modalEditarCliente.style.display = 'none'; // Ocultar el modal
    } catch (error) {
        console.error("Error al actualizar el cliente: ", error);
        alert("Hubo un error al actualizar el cliente. Consulta la consola.");
    }
});