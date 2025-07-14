// scripts/reports.js

// ** Elementos del DOM de Reportes **
const fechaInicioReporteInput = document.getElementById('fecha-inicio-reporte');
const fechaFinReporteInput = document.getElementById('fecha-fin-reporte');
const btnGenerarReporte = document.getElementById('btn-generar-reporte');
const totalVentasReporteSpan = document.getElementById('total-ventas-reporte');
const tablaVentasReporteBody = document.querySelector('#tabla-ventas-reporte tbody');
const tablaProductosMasVendidosBody = document.querySelector('#tabla-productos-mas-vendidos tbody');

// ** Lógica para generar el reporte de ventas **
btnGenerarReporte.addEventListener('click', async () => {
    const fechaInicio = fechaInicioReporteInput.value;
    const fechaFin = fechaFinReporteInput.value;

    if (!fechaInicio || !fechaFin) {
        alert('Por favor, selecciona una fecha de inicio y una fecha de fin para el reporte.');
        return;
    }

    // Convertir las fechas a objetos Date y establecer horas para el rango
    // Para Santo Domingo Este, la zona horaria es AST (Atlantic Standard Time), que es UTC-4.
    // Al usar T00:00:00 y T23:59:59, nos aseguramos de cubrir el día completo en la hora local.
    const inicioTimestamp = firebase.firestore.Timestamp.fromDate(new Date(`${fechaInicio}T00:00:00`));
    const finTimestamp = firebase.firestore.Timestamp.fromDate(new Date(`${fechaFin}T23:59:59`));

    try {
        const snapshot = await db.collection('ventas')
            .where('fecha', '>=', inicioTimestamp)
            .where('fecha', '<=', finTimestamp)
            .orderBy('fecha', 'asc') // Ordenar por fecha ascendente
            .get();

        let totalGeneralPeriodo = 0;
        const productosVendidosConteo = {}; // Para el reporte de productos más vendidos

        tablaVentasReporteBody.innerHTML = ''; // Limpiar tabla de detalle de ventas
        tablaProductosMasVendidosBody.innerHTML = '<tr><td colspan="2">Genera un reporte de ventas para ver los productos más vendidos.</td></tr>'; // Limpiar la tabla de productos más vendidos inicialmente

        if (snapshot.empty) {
            tablaVentasReporteBody.innerHTML = '<tr><td colspan="3">No se encontraron ventas en el periodo seleccionado.</td></tr>';
        } else {
            snapshot.forEach(doc => {
                const venta = doc.data();
                totalGeneralPeriodo += venta.totalVenta;

                const fila = tablaVentasReporteBody.insertRow();
                
                // Formatear la fecha y hora para República Dominicana (es-DO)
                const fechaVenta = venta.fecha.toDate(); // Convierte el Timestamp de Firebase a un objeto Date
                const fechaHoraTexto = fechaVenta.toLocaleDateString('es-DO', { 
                    year: 'numeric', 
                    month: '2-digit', 
                    day: '2-digit', 
                    hour: '2-digit', 
                    minute: '2-digit', 
                    second: '2-digit' 
                });
                fila.insertCell(0).textContent = fechaHoraTexto;

                // Lista de productos vendidos en esta transacción
                const productosDetalle = venta.productosVendidos.map(item => 
                    `${item.nombre} (x${item.cantidad})`
                ).join(', ');
                fila.insertCell(1).textContent = productosDetalle;
                fila.insertCell(2).textContent = `RD$ ${venta.totalVenta.toFixed(2)}`;

                // Contar productos para el reporte de más vendidos
                venta.productosVendidos.forEach(item => {
                    productosVendidosConteo[item.nombre] = (productosVendidosConteo[item.nombre] || 0) + item.cantidad;
                });
            });
        }

        totalVentasReporteSpan.textContent = `RD$ ${totalGeneralPeriodo.toFixed(2)}`;
        
        // Mostrar productos más vendidos
        mostrarProductosMasVendidos(productosVendidosConteo);

    } catch (error) {
        console.error("Error al generar el reporte de ventas:", error);
        alert("Hubo un error al generar el reporte. Consulta la consola para más detalles.");
    }
});

// ** Función para mostrar los productos más vendidos **
const mostrarProductosMasVendidos = (conteo) => {
    tablaProductosMasVendidosBody.innerHTML = ''; // Limpiar la tabla
    const productosOrdenados = Object.entries(conteo).sort(([,cantidadA], [,cantidadB]) => cantidadB - cantidadA);

    if (productosOrdenados.length === 0) {
        tablaProductosMasVendidosBody.innerHTML = '<tr><td colspan="2">No hay datos de productos vendidos para este periodo.</td></tr>';
        return;
    }

    productosOrdenados.forEach(([nombreProducto, cantidadTotal]) => {
        const fila = tablaProductosMasVendidosBody.insertRow();
        fila.insertCell(0).textContent = nombreProducto;
        fila.insertCell(1).textContent = cantidadTotal;
    });
};