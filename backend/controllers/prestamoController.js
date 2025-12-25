const db = require('../config/db');

exports.crearPrestamo = async (req, res) => {
    const { cliente_id, monto_prestado, cuotas_totales, frecuencia_dias, fecha_inicio } = req.body;
    try {
        const interes = monto_prestado * 0.20;
        const monto_total_pagar = parseFloat(monto_prestado) + interes;
        const valor_cuota = monto_total_pagar / cuotas_totales;

        const [result] = await db.query(
            'INSERT INTO prestamos (cliente_id, monto_prestado, monto_total_pagar, cuotas_totales, saldo_pendiente, frecuencia_dias, fecha_inicio) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [cliente_id, monto_prestado, monto_total_pagar, cuotas_totales, monto_total_pagar, frecuencia_dias, fecha_inicio]
        );

        const prestamoId = result.insertId;

        for (let i = 1; i <= cuotas_totales; i++) {
            let fechaVencimiento = new Date(fecha_inicio);
            fechaVencimiento.setDate(fechaVencimiento.getDate() + (i * frecuencia_dias));
            await db.query(
                'INSERT INTO cuotas (prestamo_id, numero_cuota, monto_cuota, fecha_vencimiento) VALUES (?, ?, ?, ?)',
                [prestamoId, i, valor_cuota, fechaVencimiento]
            );
        }
        res.status(201).json({ mensaje: "Préstamo generado con éxito" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.obtenerCobrosHoy = async (req, res) => {
    try {
        const [cobros] = await db.query(
            `SELECT cu.id, c.nombre, c.telefono, cu.monto_cuota, cu.numero_cuota 
             FROM cuotas cu 
             JOIN prestamos p ON cu.prestamo_id = p.id 
             JOIN clientes c ON p.cliente_id = c.id 
             WHERE cu.fecha_vencimiento = CURDATE() AND cu.estado_pago = 0`
        );
        res.json(cobros);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};