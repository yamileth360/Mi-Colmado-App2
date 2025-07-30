// scripts/dashboard.js

// ** Elementos del DOM para el Dashboard **
const dashboardTotalVentasSpan = document.getElementById('dashboard-total-ventas');
const dashboardGananciasSpan = document.getElementById('dashboard-ganancias');
const dashboardTotalClientesSpan = document.getElementById('dashboard-total-clientes');
const dashboardVencidosSpan = document.getElementById('dashboard-vencidos');
const lowStockListUl = document.getElementById('low-stock-list');
const expiringSoonListUl = document.getElementById('expiring-soon-list');

// ** Función para cargar todos los datos del dashboard **
window.loadDashboardData = async () => {
    console.group("DEBUG: Cargando datos para el Dashboard...");

    let totalVentas = 0;
    let gananciasTotales = 0;
    let productosVencidos = 0;
    const lowStockProducts = [];
    const expiringProducts = [];

    try {
        const ventasSnapshot = await db.collection('ventas').get();
        const clientesSnapshot = await db.collection('clientes').get();
        const productosSnapshot = await db.collection('productos').get();

        // 1. Procesar Ventas
        if (!ventasSnapshot.empty) {
            ventasSnapshot.forEach(doc => {
                const venta = doc.data();
                if (!venta || typeof venta.totalVenta !== 'number') return;

                totalVentas += venta.totalVenta;

                if (Array.isArray(venta.productosVendidos)) {
                    venta.productosVendidos.forEach(producto => {
                        const ganancia = (producto.precioUnitario - (producto.precioCompraUnitario || 0)) * producto.cantidad;
                        gananciasTotales += ganancia;
                    });
                }
            });
        }

        if (dashboardTotalVentasSpan) {
            dashboardTotalVentasSpan.textContent = totalVentas.toFixed(2);
        }
        if (dashboardGananciasSpan) {
            dashboardGananciasSpan.textContent = gananciasTotales.toFixed(2);
        }

        // 2. Procesar Clientes
        if (dashboardTotalClientesSpan) {
            dashboardTotalClientesSpan.textContent = clientesSnapshot.size || 0;
        }

        // 3. Procesar Productos
        if (!productosSnapshot.empty) {
            productosSnapshot.forEach(doc => {
                const producto = doc.data();

                // Bajo stock
                if (producto.cantidad <= producto.stockMinimo) {
                    lowStockProducts.push(producto);
                }

                // Vencimiento
                if (producto.requiereFechaVencimiento && producto.fechaVencimiento) {
                    const hoy = new Date();
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
        console.error("DEBUG: Error al cargar los datos del dashboard:", error);
    }

    console.groupEnd();
};
