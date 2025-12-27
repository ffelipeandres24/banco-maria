const express = require('express');
const router = express.Router();
const prestamoController = require('../controllers/prestamoController');
const db = require('../config/db'); // Importamos la DB una sola vez arriba

// --- RUTAS DE PRÉSTAMOS ---

// Mantiene la lógica de tu controlador para crear el préstamo inicial
router.post('/prestamos', prestamoController.crearPrestamo);

// AJUSTE: Muestra cobros de hoy Y cobros atrasados que no se han pagado
router.get('/cobros-hoy', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT 
                cu.id, 
                cu.numero_cuota, 
                cu.monto_cuota, 
                cu.fecha_vencimiento,
                cli.nombre, 
                cli.telefono 
            FROM cuotas cu
            JOIN prestamos p ON cu.prestamo_id = p.id
            JOIN clientes cli ON p.cliente_id = cli.id
            WHERE cu.estado_pago = 0 
            AND cu.fecha_vencimiento <= CURDATE() 
            AND p.estado = 'activo'
            ORDER BY cu.fecha_vencimiento ASC
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- RUTAS DE CLIENTES ---

// Obtener todos los clientes para el selector
router.get('/clientes', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM clientes ORDER BY nombre ASC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Registrar un cliente nuevo
router.post('/clientes', async (req, res) => {
    const { nombre, cedula, telefono } = req.body;
    try {
        const [result] = await db.query(
            'INSERT INTO clientes (nombre, cedula, telefono) VALUES (?, ?, ?)',
            [nombre, cedula, telefono]
        );
        res.status(201).json({ mensaje: "Cliente registrado", id: result.insertId });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            res.status(400).json({ error: "La cédula ya existe" });
        } else {
            res.status(500).json({ error: err.message });
        }
    }
});

// Editar cliente
router.put('/clientes/:id', async (req, res) => {
    const { nombre, cedula, telefono } = req.body;
    try {
        await db.query('UPDATE clientes SET nombre=?, cedula=?, telefono=? WHERE id=?', 
        [nombre, cedula, telefono, req.params.id]);
        res.json({ mensaje: "Cliente actualizado" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Eliminar cliente
router.delete('/clientes/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM clientes WHERE id = ?', [req.params.id]);
        res.json({ mensaje: "Cliente eliminado" });
    } catch (err) { 
        res.status(500).json({ error: "No se puede eliminar un cliente con préstamos activos" }); 
    }
});

// --- GESTIÓN DE PAGOS Y CARTERA ---

// Registrar el pago de una cuota
router.put('/pagar-cuota/:id', async (req, res) => {
    const cuotaId = req.params.id;
    try {
        // 1. Marcar la cuota como pagada
        await db.query(
            'UPDATE cuotas SET estado_pago = 1, fecha_pago_real = CURRENT_TIMESTAMP WHERE id = ?',
            [cuotaId]
        );

        // 2. Actualizar el saldo pendiente del préstamo automáticamente
        await db.query(`
            UPDATE prestamos p
            SET p.saldo_pendiente = p.saldo_pendiente - (
                SELECT monto_cuota FROM cuotas WHERE id = ?
            )
            WHERE p.id = (SELECT prestamo_id FROM cuotas WHERE id = ?)
        `, [cuotaId, cuotaId]);
        
        res.json({ mensaje: "Pago registrado exitosamente" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Cartera completa (Vista de deudores)
router.get('/cartera', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT 
                c.id, 
                c.nombre, 
                c.cedula, 
                c.telefono, 
                MAX(p.fecha_inicio) as fecha_prestamo,
                IFNULL(SUM(p.saldo_pendiente), 0) as total_prestado,
                COUNT(CASE WHEN cu.estado_pago = 0 THEN 1 END) as cuotas_faltantes
            FROM clientes c
            LEFT JOIN prestamos p ON p.cliente_id = c.id AND p.estado = 'activo'
            LEFT JOIN cuotas cu ON cu.prestamo_id = p.id
            GROUP BY c.id, c.nombre, c.cedula, c.telefono
            ORDER BY c.nombre ASC
        `);
        res.json(rows);
    } catch (err) { 
        res.status(500).json({ error: err.message }); 
    }
});

// Historial de pagos realizados por un cliente
router.get('/historial/:cliente_id', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT cu.numero_cuota, cu.monto_cuota, cu.fecha_pago_real 
            FROM cuotas cu 
            JOIN prestamos p ON cu.prestamo_id = p.id 
            WHERE p.cliente_id = ? AND cu.estado_pago = 1
            ORDER BY cu.fecha_pago_real DESC
        `, [req.params.cliente_id]);
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;