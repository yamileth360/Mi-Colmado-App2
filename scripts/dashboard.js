// scripts/dashboard.js

// ** Elementos del DOM para el Dashboard **
const dashboardTotalVentasSpan = document.getElementById('dashboard-total-ventas');
const dashboardGananciasSpan = document.getElementById('dashboard-ganancias');
const dashboardTotalClientesSpan = document.getElementById('dashboard-total-clientes');
const dashboardVencidosSpan = document.getElementById('dashboard-vencidos');
const lowStockListUl = document.getElementById('low-stock-list');


// ** Función para cargar todos los datos del dashboard **
const loadDashboardData = async () => {
    console.group("DEBUG: Cargando datos para el Dashboard...");
    
    // 1. Cargar Total de Ventas
    try {
        const ventasSnapshot = await db.collection('ventas').get();
        let totalVentas = 0;
        ventasSnapshot.forEach(doc => {
            totalVentas += doc.data().totalVenta;
        });
        dashboardTotalVentasSpan.textContent = totalVentas.toFixed(2);
        console.log(`DEBUG: Total de ventas cargado: RD$ ${totalVentas.toFixed(2)}`);
    } catch (error) {
        console.error("DEBUG: Error al cargar el total de ventas:", error);
    }

    // 2. Cargar Ganancias Estimadas (asume que guardaste el precio de compra en las ventas)
    // Nota: Por ahora, usaremos una lógica simple. Si en pos.js guardaste la ganancia, puedes sumarla aquí.
    try {
        const ventasSnapshot = await db.collection('ventas').get();
        let gananciasTotales = 0;
        ventasSnapshot.forEach(ventaDoc => {
            const venta = ventaDoc.data();
            venta.productosVendidos.forEach(producto => {
                // Para calcular la ganancia, necesitarías el precio de compra.
                // Si no lo guardaste en el objeto de venta, el cálculo sería más complejo.
                // Como no lo tenemos en la venta, haremos una estimación simple.
                // Una futura mejora sería guardar la ganancia por cada venta.
                // console.log("DEBUG: Calculando ganancia...");
            });
        });
        // Por ahora, mostraremos un valor fijo o una estimación simple hasta que tengamos la lógica completa.
        dashboardGananciasSpan.textContent = (totalVentas * 0.20).toFixed(2); // Ganancia estimada del 20%
        console.log(`DEBUG: Ganancias estimadas cargadas: RD$ ${dashboardGananciasSpan.textContent}`);
    } catch (error) {
        console.error("DEBUG: Error al calcular ganancias:", error);
    }

    // 3. Cargar Total de Clientes
    try {
        const clientesSnapshot = await db.collection('clientes').get();
        dashboardTotalClientesSpan.textContent = clientesSnapshot.size;
        console.log(`DEBUG: Total de clientes cargado: ${clientesSnapshot.size}`);
    } catch (error) {
        console.error("DEBUG: Error al cargar el total de clientes:", error);
    }

    // 4. Cargar Productos Próximos a Vencer y con Bajo Stock
    try {
        const productosSnapshot = await db.collection('productos').get();
        let productosVencidos = 0;
        const lowStockProducts = [];

        productosSnapshot.forEach(doc => {
            const producto = doc.data();
            // Lógica para productos próximos a vencer
            if (producto.requiereFechaVencimiento && producto.fechaVencimiento) {
                const hoy = new Date();
                const fechaVenc = new Date(producto.fechaVencimiento);
                const diasParaVencer = Math.ceil((fechaVenc - hoy) / (1000 * 60 * 60 * 24));
                if (diasParaVencer <= 30 && diasParaVencer > 0) {
                    productosVencidos++;
                }
            }
            // Lógica para productos con bajo stock
            if (producto.cantidad <= producto.stockMinimo) {
                lowStockProducts.push(producto);
            }
        });

        dashboardVencidosSpan.textContent = productosVencidos;
        console.log(`DEBUG: Productos próximos a vencer cargados: ${productosVencidos}`);

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
        console.log(`DEBUG: Lista de productos con bajo stock actualizada.`);
    } catch (error) {
        console.error("DEBUG: Error al cargar los datos de inventario del dashboard:", error);
    }

    console.groupEnd();
};

// ** Llamar a la función al cargar la página o al ir a la sección "home" **
window.addEventListener('DOMContentLoaded', loadDashboardData);