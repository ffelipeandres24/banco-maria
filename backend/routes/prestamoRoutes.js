const express = require('express');
const router = express.Router();
const prestamoController = require('../controllers/prestamoController');

router.post('/prestamos', prestamoController.crearPrestamo);
router.get('/cobros-hoy', prestamoController.obtenerCobrosHoy);
// Obtener todos los clientes para el selector

// backend/routes/prestamoRoutes.js
router.get('/clientes', async (req, res) => {
    try {
        const db = require('../config/db');
        const [rows] = await db.query('SELECT * FROM clientes ORDER BY nombre ASC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Ruta para registrar el pago de una cuota
router.put('/pagar-cuota/:id', async (req, res) => {
    const cuotaId = req.params.id;
    const db = require('../config/db');

    try {
        // 1. Marcar la cuota como pagada
        await db.query(
            'UPDATE cuotas SET estado_pago = 1, fecha_pago_real = CURRENT_TIMESTAMP WHERE id = ?',
            [cuotaId]
        );

        // 2. Opcional: Podrías restar el monto del saldo_pendiente en la tabla prestamos aquí
        // Pero con marcar la cuota ya el sistema sabrá que no debe mostrarla en "cobros-hoy"
        
        res.json({ mensaje: "Pago registrado exitosamente" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// Registrar un cliente nuevo
router.post('/clientes', async (req, res) => {
    const { nombre, cedula, telefono } = req.body;
    const db = require('../config/db');

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




// EDITAR CLIENTE
router.put('/clientes/:id', async (req, res) => {
    const { nombre, cedula, telefono } = req.body;
    try {
        const db = require('../config/db');
        await db.query('UPDATE clientes SET nombre=?, cedula=?, telefono=? WHERE id=?', [nombre, cedula, telefono, req.params.id]);
        res.json({ mensaje: "Cliente actualizado" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ELIMINAR CLIENTE
router.delete('/clientes/:id', async (req, res) => {
    try {
        const db = require('../config/db');
        await db.query('DELETE FROM clientes WHERE id = ?', [req.params.id]);
        res.json({ mensaje: "Cliente eliminado" });
    } catch (err) { res.status(500).json({ error: "No se puede eliminar un cliente con préstamos activos" }); }
});

// 1. CARTERA COMPLETA CON FECHA DE PRESTAMO
// backend/routes/prestamoRoutes.js

router.get('/cartera', async (req, res) => {
    try {
        const db = require('../config/db');
        const [rows] = await db.query(`
            SELECT 
                c.id, 
                c.nombre, 
                c.cedula, 
                c.telefono, 
                MAX(p.fecha_inicio) as fecha_prestamo, -- Usamos MAX para traer la fecha del último préstamo
                (SELECT SUM(saldo_pendiente) FROM prestamos WHERE cliente_id = c.id AND estado = 'activo') as total_prestado,
                (SELECT COUNT(*) FROM cuotas cu JOIN prestamos p2 ON cu.prestamo_id = p2.id 
                 WHERE p2.cliente_id = c.id AND cu.estado_pago = 0 AND p2.estado = 'activo') as cuotas_faltantes
            FROM clientes c
            LEFT JOIN prestamos p ON p.cliente_id = c.id AND p.estado = 'activo'
            GROUP BY c.id, c.nombre, c.cedula, c.telefono -- Agregamos todas las columnas al GROUP BY
        `);
        res.json(rows);
    } catch (err) { 
        res.status(500).json({ error: err.message }); 
    }
});

// 2. HISTORIAL DE PAGOS DE UN CLIENTE
router.get('/historial/:cliente_id', async (req, res) => {
    try {
        const db = require('../config/db');
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