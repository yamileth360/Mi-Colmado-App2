// scripts/dashboard.js

// Obtener referencias a los elementos del DOM del dashboard
const dashboardTotalVentasSpan = document.getElementById('dashboard-total-ventas');
const dashboardGananciasSpan = document.getElementById('dashboard-ganancias');
const dashboardTotalClientesSpan = document.getElementById('dashboard-total-clientes');
const dashboardVencidosSpan = document.getElementById('dashboard-vencidos');
const dashboardTotalAcumuladoSpan = document.getElementById('dashboard-total-acumulado');
const lowStockListUl = document.getElementById('low-stock-list');
const expiringSoonListUl = document.getElementById('expiring-soon-list');

// Elementos de filtro de fecha
const filtroFechaSelect = document.getElementById('filtro-fecha');
const fechaInicioInput = document.getElementById('fecha-inicio');
const fechaFinInput = document.getElementById('fecha-fin');
const btnAplicarFiltro = document.getElementById('btn-aplicar-filtro');

// Escuchar cambios en el filtro de fecha
if (filtroFechaSelect) {
    filtroFechaSelect.addEventListener('change', () => {
        const valor = filtroFechaSelect.value;

        if (valor === 'personalizado') {
            // Mostrar inputs de rango personalizado
            fechaInicioInput.style.display = 'inline';
            fechaFinInput.style.display = 'inline';
            btnAplicarFiltro.style.display = 'inline';
        } else {
            // Ocultar inputs y cargar con el filtro seleccionado
            fechaInicioInput.style.display = 'none';
            fechaFinInput.style.display = 'none';
            btnAplicarFiltro.style.display = 'none';
            loadDashboardData(valor); // cargar datos con el nuevo filtro
        }
    });
}

if (btnAplicarFiltro) {
    btnAplicarFiltro.addEventListener('click', () => {
        const inicio = new Date(fechaInicioInput.value);
        const fin = new Date(fechaFinInput.value);
        if (isNaN(inicio.getTime()) || isNaN(fin.getTime())) {
            alert("Por favor selecciona un rango válido.");
            return;
        }
        loadDashboardData('personalizado', inicio, fin);
    });
}

// Función principal para cargar los datos del dashboard
window.loadDashboardData = async (filtro = 'hoy', inicioPersonalizado = null, finPersonalizado = null) => {
    console.group("DEBUG: Cargando datos del Dashboard...");

    let totalVentas = 0;
    let totalAcumulado = 0;
    let gananciasTotales = 0;
    let productosVencidos = 0;
    const lowStockProducts = [];
    const expiringProducts = [];

    // Calcular el rango de fechas según el filtro seleccionado
    const hoy = new Date();
    let inicioFiltro = new Date();
    let finFiltro = new Date();

    switch (filtro) {
        case 'hoy':
            inicioFiltro.setHours(0, 0, 0, 0);
            finFiltro = new Date(inicioFiltro);
            finFiltro.setHours(23, 59, 59, 999);
            break;

        case 'semana':
            const diaSemana = hoy.getDay(); // 0 = domingo
            const diferencia = diaSemana === 0 ? 6 : diaSemana - 1;
            inicioFiltro.setDate(hoy.getDate() - diferencia);
            inicioFiltro.setHours(0, 0, 0, 0);
            finFiltro = new Date();
            finFiltro.setHours(23, 59, 59, 999);
            break;

        case 'mes':
            inicioFiltro = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
            finFiltro = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
            finFiltro.setHours(23, 59, 59, 999);
            break;

        case 'personalizado':
            inicioFiltro = new Date(inicioPersonalizado);
            inicioFiltro.setHours(0, 0, 0, 0);
            finFiltro = new Date(finPersonalizado);
            finFiltro.setHours(23, 59, 59, 999);
            break;

        case 'acumulado':
        default:
            // Si es acumulado, no se aplican filtros de fecha
            inicioFiltro = null;
            finFiltro = null;
            break;
    }

    try {
        const ventasSnapshot = await db.collection('ventas').get();
        const clientesSnapshot = await db.collection('clientes').get();
        const productosSnapshot = await db.collection('productos').get();

        // Procesar las ventas
        if (!ventasSnapshot.empty) {
            ventasSnapshot.forEach(doc => {
                const venta = doc.data();
                let fechaVenta = venta.fecha;

                // Convertir el timestamp a objeto Date si es necesario
                if (fechaVenta && typeof fechaVenta.toDate === 'function') {
                    fechaVenta = fechaVenta.toDate();
                }

                if (!fechaVenta) return;

                // Aplicar filtro si corresponde
                if (inicioFiltro && finFiltro) {
                    if (fechaVenta < inicioFiltro || fechaVenta > finFiltro) {
                        return; // ignorar fuera de rango
                    }
                }

                // Total acumulado siempre suma
                if (typeof venta.totalVenta === 'number') {
                    totalAcumulado += venta.totalVenta;
                    totalVentas += venta.totalVenta;

                    // Calcular ganancia si hay productos vendidos
                    if (Array.isArray(venta.productosVendidos)) {
                        venta.productosVendidos.forEach(producto => {
                            const ganancia = (producto.precioUnitario - (producto.precioCompraUnitario || 0)) * producto.cantidad;
                            gananciasTotales += ganancia;
                        });
                    }
                }
            });
        }

        // Mostrar métricas en el dashboard
        if (dashboardTotalVentasSpan) {
            dashboardTotalVentasSpan.textContent = totalVentas.toFixed(2);
        }
        if (dashboardGananciasSpan) {
            dashboardGananciasSpan.textContent = gananciasTotales.toFixed(2);
        }
        if (dashboardTotalAcumuladoSpan) {
            dashboardTotalAcumuladoSpan.textContent = totalAcumulado.toFixed(2);
        }

        // Total de clientes
        if (dashboardTotalClientesSpan) {
            dashboardTotalClientesSpan.textContent = clientesSnapshot.size || 0;
        }

        // Procesar productos: vencimientos y bajo stock
        if (!productosSnapshot.empty) {
            productosSnapshot.forEach(doc => {
                const producto = doc.data();

                // Bajo stock
                if (producto.cantidad <= producto.stockMinimo) {
                    lowStockProducts.push(producto);
                }

                // Vencimientos próximos
                if (producto.requiereFechaVencimiento && producto.fechaVencimiento) {
                    const fechaVenc = new Date(producto.fechaVencimiento);
                    const diasParaVencer = Math.ceil((fechaVenc - hoy) / (1000 * 60 * 60 * 24));
                    if (diasParaVencer <= 30) {
                        productosVencidos++;
                        expiringProducts.push(producto);
                    }
                }
            });
        }

        if (dashboardVencidosSpan) {
            dashboardVencidosSpan.textContent = productosVencidos;
        }

        // Mostrar productos con bajo stock
        if (lowStockListUl) {
            lowStockListUl.innerHTML = '';
            if (lowStockProducts.length > 0) {
                lowStockProducts.forEach(prod => {
                    const li = document.createElement('li');
                    li.classList.add('low-stock-item');
                    li.textContent = `${prod.nombre} (Stock: ${prod.cantidad})`;
                    lowStockListUl.appendChild(li);
                });
            } else {
                lowStockListUl.innerHTML = '<li class="low-stock-item">No hay productos con bajo stock.</li>';
            }
        }

        // Mostrar productos próximos a vencer
        if (expiringSoonListUl) {
            expiringSoonListUl.innerHTML = '';
            if (expiringProducts.length > 0) {
                expiringProducts.forEach(prod => {
                    const li = document.createElement('li');
                    li.classList.add('low-stock-item');
                    const fechaFormateada = new Date(prod.fechaVencimiento).toLocaleDateString('es-DO');
                    li.textContent = `${prod.nombre} (Vence: ${fechaFormateada})`;
                    expiringSoonListUl.appendChild(li);
                });
            } else {
                expiringSoonListUl.innerHTML = '<li class="low-stock-item">No hay productos próximos a vencer.</li>';
            }
        }

    } catch (error) {
        console.error("❌ Error al cargar datos del dashboard:", error);
    }

    console.groupEnd();
};
